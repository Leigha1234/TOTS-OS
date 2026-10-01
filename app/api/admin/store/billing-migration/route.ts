import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// CONFIG
// ============================================================

const ORGANISATION_ID = "2c96d537-2be4-4917-8982-e7491300f15f";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const stripe = new Stripe(stripeSecretKey);

const goCardlessAccessToken = process.env.GOCARDLESS_ACCESS_TOKEN ?? "";
const goCardlessEnvironment = (process.env.GOCARDLESS_ENVIRONMENT ?? "live").toLowerCase();
const goCardlessBaseUrl =
  goCardlessEnvironment === "sandbox"
    ? "https://api-sandbox.gocardless.com"
    : "https://api.gocardless.com";

type GoCardlessMandate = {
  id: string;
  status: string;
  scheme?: string | null;
  next_possible_charge_date?: string | null;
  links?: {
    customer?: string | null;
    customer_bank_account?: string | null;
    creditor?: string | null;
  };
};

type GoCardlessCustomer = {
  id: string;
  email?: string | null;
  given_name?: string | null;
  family_name?: string | null;
};

type GoCardlessListResponse<T> = {
  customers?: T[];
  mandates?: T[];
  meta?: {
    cursors?: {
      after?: string | null;
      before?: string | null;
    };
  };
};

type GoCardlessSubscription = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  interval: number;
  interval_unit: string;
  start_date: string;
  upcoming_payments?: Array<{ charge_date: string; amount: number }>;
  links?: { mandate?: string | null };
};

async function goCardlessRequest<T>(
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<T> {
  if (!goCardlessAccessToken) {
    throw new Error("Missing GOCARDLESS_ACCESS_TOKEN");
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${goCardlessAccessToken}`);
  headers.set("GoCardless-Version", "2015-07-06");
  headers.set("Content-Type", "application/json");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

  const response = await fetch(`${goCardlessBaseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!response.ok) {
    const message =
      body?.error?.message ??
      body?.error?.errors?.[0]?.message ??
      (typeof body === "string" ? body : null) ??
      `GoCardless API returned ${response.status}`;
    throw new Error(`GoCardless: ${message}`);
  }

  return body as T;
}

function next28thIso(minimumDate?: string | null) {
  const now = new Date();
  const minimum = minimumDate ? new Date(`${minimumDate}T00:00:00Z`) : now;
  const floor = Number.isNaN(minimum.getTime()) || minimum < now ? now : minimum;

  let year = floor.getUTCFullYear();
  let month = floor.getUTCMonth();
  let candidate = new Date(Date.UTC(year, month, 28, 12, 0, 0));

  if (candidate.getTime() <= floor.getTime() + 30 * 60 * 1000) {
    month += 1;
    if (month > 11) { year += 1; month = 0; }
    candidate = new Date(Date.UTC(year, month, 28, 12, 0, 0));
  }

  return candidate.toISOString();
}

async function verifyLiveGoCardlessMandate(
  mandateId: string,
  expectedCustomerId?: string | null,
) {
  const body = await goCardlessRequest<{ mandates: GoCardlessMandate }>(
    `/mandates/${encodeURIComponent(mandateId)}`,
  );
  const mandate = body.mandates;

  if (!mandate?.id) throw new Error("GoCardless mandate was not returned.");
  if (expectedCustomerId && mandate.links?.customer && mandate.links.customer !== expectedCustomerId) {
    throw new Error(
      `GoCardless mandate ${mandateId} belongs to ${mandate.links.customer}, not ${expectedCustomerId}.`,
    );
  }

  if (mandate.status !== "active") {
    throw new Error(`GoCardless mandate ${mandateId} is ${mandate.status}, not active.`);
  }

  return mandate;
}

async function createGoCardlessSubscription(row: StoreSubscription) {
  const mandateId = row.external_mandate_id;
  if (!mandateId) throw new Error("REFUSED: GoCardless mandate ID is missing.");

  const mandate = await verifyLiveGoCardlessMandate(
    mandateId,
    row.external_customer_id,
  );

  const amount = Number(row.unit_amount_pence ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("REFUSED: invalid GoCardless recurring amount.");
  }

  const requested = row.next_payment_at
    ? new Date(row.next_payment_at)
    : new Date(next28thIso(mandate.next_possible_charge_date));

  const minimum = mandate.next_possible_charge_date
    ? new Date(`${mandate.next_possible_charge_date}T00:00:00Z`)
    : new Date();

  const start =
    !Number.isNaN(requested.getTime()) && requested >= minimum
      ? requested
      : new Date(next28thIso(mandate.next_possible_charge_date));

  const startDate = start.toISOString().slice(0, 10);
  const idempotencyKey = `tots-mtc-gc-${row.id}`;

  const body = await goCardlessRequest<{ subscriptions: GoCardlessSubscription }>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        subscriptions: {
          amount,
          currency: (row.currency ?? "GBP").toUpperCase(),
          name: `Moray Training Club - ${row.legacy_membership_name ?? "Membership"}`.slice(0, 255),
          interval_unit: "monthly",
          interval: 1,
          start_date: startDate,
          links: { mandate: mandateId },
          metadata: {
            tots_subscription_id: row.id,
            organisation_id: row.organisation_id,
          },
        },
      }),
    },
    idempotencyKey,
  );

  return { subscription: body.subscriptions, mandate };
}

// ============================================================
// TYPES
// ============================================================

type Action =
  | "prepare_all_for_mtc_import"
  | "finish_payment_preparation"
  | "scan"
  | "scan_one"
  | "prepare_all"
  | "prepare_cutover"
  | "prepare_cutover_all"
  | "setup"
  | "verify"
  | "teamup_stopped"
  | "activate"
  | "activate_all"
  | "complete_migration";

type Provider = "stripe" | "gocardless" | "unknown";

type StoreSubscription = {
  id: string;
  organisation_id: string;

  order_id?: string | null;
  product_id: string | null;

  customer_id?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone?: string | null;

  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;

  external_customer_id: string | null;
  external_subscription_id: string | null;
  external_membership_id?: string | null;
  external_mandate_id?: string | null;

  status: string | null;

  quantity?: number | null;
  currency: string | null;
  unit_amount_pence: number | null;
  billing_interval: string | null;

  current_period_start?: string | null;
  current_period_end?: string | null;

  cancel_at_period_end?: boolean | null;
  cancelled_at?: string | null;

  legacy_membership_name: string | null;

  payment_provider: string | null;
  billing_provider: string | null;

  legacy_billing: boolean;
  legacy_price?: boolean | null;

  migrated_from?: string | null;
  migrated_at?: string | null;

  next_payment_at: string | null;
  last_payment_at: string | null;
  last_payment_amount_pence: number | null;

  processor_verification_status: string | null;
  processor_verified_at: string | null;

  cutover_status: string | null;

  collection_enabled: boolean;
  collection_enabled_at: string | null;

  teamup_billing_active: boolean;
  teamup_billing_disabled_at: string | null;

  migration_notes: string | null;

  metadata: Record<string, unknown> | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type StoreProduct = {
  id: string;
  organisation_id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  price: number | string;
  status: string;
  is_active: boolean;
  selling_model: string | null;
  purchase_type: string;
  billing_interval: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  external_system: string | null;
  external_plan_code: string | null;
  beneficiary_mode: string;
  product_type: string | null;
};

type ImportRow = {
  mtc_migration_id: string | null;
  member_name: string | null;
  email: string | null;
  teamup_membership: string | null;
  membership_type: string | null;
  payment_provider: string | null;
  legacy_amount_pence: string | null;
  amount_evidence: string | null;
  external_customer_id: string | null;
  gocardless_mandate_id: string | null;
  access_mapping: string | null;
  tots_product_id: string | null;
  migration_decision: string | null;
  migration_status: string | null;
  remaining_issue: string | null;
  matched_user_id: string | null;
};

type MigrationSource = {
  id?: string;
  member_name?: string | null;
  email?: string | null;
  membership_name?: string | null;

  payment_provider?: string | null;
  billing_provider?: string | null;

  external_customer_id?: string | null;
  gocardless_mandate_id?: string | null;

  last_payment_at?: string | null;
  last_payment_amount_pence?: number | null;

  next_payment_at?: string | null;

  [key: string]: unknown;
};

type Candidate = {
  customer: Stripe.Customer;
  paymentMethod: Stripe.PaymentMethod | null;

  sources: Set<
    "stripe_customer_id" | "external_customer_id" | "email"
  >;

  exactExternalId: boolean;
};

type ScanResult = {
  subscriptionId: string;
  customerName: string | null;
  email: string | null;

  result:
    | "verified"
    | "already_verified"
    | "duplicate"
    | "no_email"
    | "customer_not_found"
    | "multiple_card_customers"
    | "no_payment_method"
    | "gocardless"
    | "unknown_provider"
    | "non_recurring"
    | "already_live"
    | "error";

  stripeCustomerId?: string | null;
  paymentMethodId?: string | null;

  candidates?: number;
  cardReadyCandidates?: number;

  message?: string;
};

type PrepareCutoverResult = {
  subscriptionId: string;
  customerName: string | null;
  email: string | null;

  result:
    | "prepared"
    | "already_prepared"
    | "skipped"
    | "error";

  stripeSubscriptionId?: string | null;
  stripeStatus?: string | null;
  firstPaymentAt?: string | null;
  message?: string;
};

type ImportPreparationResult = {
  migrationId: string | null;
  memberName: string | null;
  email: string | null;
  membership: string | null;

  result:
    | "ready"
    | "ready_billing_review"
    | "duplicate"
    | "exception";

  subscriptionId?: string | null;
  productId?: string | null;

  billingProvider?: Provider;
  billingStatus?: string;

  reason?: string | null;

  stripeSubscriptionId?: string | null;
};

// ============================================================
// AUTH
// ============================================================

async function requireUser(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorised");
  }

  const token = authorization.slice("Bearer ".length).trim();

  const authClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorised");
  }

  return user;
}

// ============================================================
// CONNECTED STRIPE ACCOUNT
// ============================================================

async function getConnectedAccount() {
  const { data, error } = await admin
    .from("store_stripe_accounts")
    .select(`
      stripe_account_id,
      charges_enabled,
      payouts_enabled,
      details_submitted,
      onboarding_complete
    `)
    .eq("organisation_id", ORGANISATION_ID)
    .maybeSingle();

  if (error) throw error;

  if (!data?.stripe_account_id) {
    throw new Error("MTC Stripe account is not connected.");
  }

  const accountId = String(data.stripe_account_id);

  const account = await stripe.accounts.retrieve(accountId);

  if (!account.charges_enabled) {
    throw new Error(
      "MTC Stripe account cannot currently accept payments.",
    );
  }

  return {
    accountId,
    account,
  };
}

// ============================================================
// GENERIC HELPERS
// ============================================================

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normaliseText(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normaliseEmail(
  email: string | null | undefined,
) {
  const value = cleanText(email).toLowerCase();

  if (!value || value === "null") {
    return "";
  }

  return value;
}

function parsePence(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return Math.round(parsed);
}

function metadata(row: StoreSubscription) {
  return {
    ...(row.metadata ?? {}),
  } as Record<string, unknown>;
}

function appendMigrationNote(
  row: StoreSubscription,
  note: string,
) {
  const existing = String(row.migration_notes ?? "").trim();

  if (!existing) {
    return note;
  }

  if (existing.includes(note)) {
    return existing;
  }

  return `${existing}\n${note}`;
}

// ============================================================
// DB HELPERS
// ============================================================

async function loadSubscription(
  id: string,
): Promise<StoreSubscription> {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", ORGANISATION_ID)
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error("Subscription record not found.");
  }

  return data as StoreSubscription;
}

async function patchSubscription(
  id: string,
  values: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("store_subscriptions")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organisation_id", ORGANISATION_ID)
    .select("*")
    .single();

  if (error) throw error;

  return data as StoreSubscription;
}

async function patchImportRow(
  migrationId: string | null,
  values: Record<string, unknown>,
) {
  if (!migrationId) return;

  const { error } = await admin
    .from("mtc_member_migration_import")
    .update(values)
    .eq("mtc_migration_id", migrationId);

  if (error) {
    console.warn(
      "[MTC IMPORT STATUS UPDATE]",
      migrationId,
      error,
    );
  }
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function metadataBoolean(
  meta: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = meta[key];

    if (
      value === true ||
      value === "true" ||
      value === 1 ||
      value === "1"
    ) {
      return true;
    }
  }

  return false;
}

function isMarkedDuplicate(
  row: StoreSubscription,
) {
  const meta = metadata(row);

  if (
    metadataBoolean(meta, [
      "mtc_redundant_duplicate",
      "redundant_duplicate",
      "migration_duplicate",
      "mtc_duplicate_record",
      "duplicate_record",
      "is_duplicate",
    ])
  ) {
    return true;
  }

  const notes = normaliseText(
    row.migration_notes,
  );

  return (
    notes.includes("duplicate legacy record") ||
    notes.includes("do not collect")
  );
}

function importLooksHistoricalOrIgnored(
  row: ImportRow,
) {
  const combined = normaliseText(
    [
      row.migration_decision,
      row.migration_status,
      row.remaining_issue,
    ].join(" "),
  );

  return (
    combined.includes("ignore historical") ||
    combined.includes("historical") &&
      combined.includes("ignore")
  );
}

// ============================================================
// LOAD TOTS IMPORT DATA
// ============================================================

async function loadImportRows() {
  const { data, error } = await admin
    .from("mtc_member_migration_import")
    .select("*");

  if (error) throw error;

  return (data ?? []) as ImportRow[];
}

async function loadStoreProducts() {
  const { data, error } = await admin
    .from("store_products")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .eq("external_system", "mtc");

  if (error) throw error;

  return (data ?? []) as StoreProduct[];
}

async function loadAllStoreSubscriptions() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as StoreSubscription[];
}

// ============================================================
// PRODUCT RESOLUTION
// ============================================================

function productPricePence(product: StoreProduct) {
  const value = Number(product.price);

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100);
}

function findProductById(
  products: StoreProduct[],
  id: string | null,
) {
  if (!id) return null;

  return (
    products.find(
      (product) => product.id === id,
    ) ?? null
  );
}

function resolveProduct(
  importRow: ImportRow,
  products: StoreProduct[],
  existingSubscription?: StoreSubscription | null,
) {
  // 1. Explicit imported TOTS product ID.
  const explicit = findProductById(
    products,
    cleanText(importRow.tots_product_id) || null,
  );

  if (explicit) {
    return explicit;
  }

  // 2. Existing subscription already has a product.
  if (existingSubscription?.product_id) {
    const existingProduct = findProductById(
      products,
      existingSubscription.product_id,
    );

    if (existingProduct) {
      return existingProduct;
    }
  }

  const membership =
    normaliseText(importRow.teamup_membership);

  const access =
    normaliseText(importRow.access_mapping);

  const type =
    normaliseText(importRow.membership_type);

  const combined =
    `${membership} ${access} ${type}`.trim();

  // 3. External plan-code matches.
  for (const product of products) {
    const code = normaliseText(
      product.external_plan_code,
    );

    if (
      code &&
      (
        membership === code ||
        access === code ||
        combined.includes(code)
      )
    ) {
      return product;
    }
  }

  // 4. Exact product-name match.
  const exactName = products.find(
    (product) =>
      normaliseText(product.name) === membership ||
      normaliseText(product.name) === access,
  );

  if (exactName) {
    return exactName;
  }

  // 5. Known MTC legacy mappings.
  const mappings: Array<{
    tests: string[];
    codes: string[];
  }> = [
    {
      tests: [
        "couples unlimited",
        "couple unlimited",
      ],
      codes: [
        "COUPLE_UNLIMITED",
      ],
    },
    {
      tests: [
        "couples 3",
        "couple 3",
        "couples 3x",
      ],
      codes: [
        "COUPLE_3PW",
      ],
    },
    {
      tests: [
        "unlimited",
      ],
      codes: [
        "ADULT_UNLIMITED",
      ],
    },
    {
      tests: [
        "4 per week",
        "4pw",
      ],
      codes: [
        "LEGACY_ADULT_4PW",
      ],
    },
    {
      tests: [
        "3 per week",
        "3pw",
      ],
      codes: [
        "ADULT_3PW",
      ],
    },
    {
      tests: [
        "crossfit preteens",
        "preteens",
      ],
      codes: [
        "LEGACY_PRETEENS",
      ],
    },
    {
      tests: [
        "kids 3",
        "3pw kids",
      ],
      codes: [
        "KID_3PW",
      ],
    },
    {
      tests: [
        "kids 2",
        "2pw kids",
      ],
      codes: [
        "KID_2PW",
      ],
    },
    {
      tests: [
        "kids 1",
        "1pw kids",
        "crossfit kids",
      ],
      codes: [
        "KID_1PW",
      ],
    },
  ];

  for (const mapping of mappings) {
    if (
      !mapping.tests.some(
        (test) => combined.includes(test),
      )
    ) {
      continue;
    }

    for (const code of mapping.codes) {
      const product = products.find(
        (candidate) =>
          normaliseText(
            candidate.external_plan_code,
          ) === normaliseText(code),
      );

      if (product) {
        return product;
      }
    }
  }

  return null;
}

// ============================================================
// CANONICAL SUBSCRIPTION MATCHING
// ============================================================

function sameMembership(
  subscription: StoreSubscription,
  importRow: ImportRow,
) {
  const importedMembership =
    normaliseText(importRow.teamup_membership);

  const storedMembership =
    normaliseText(
      subscription.legacy_membership_name,
    );

  if (
    importedMembership &&
    storedMembership &&
    importedMembership === storedMembership
  ) {
    return true;
  }

  const importId =
    cleanText(importRow.mtc_migration_id);

  const meta =
    metadata(subscription);

  if (
    importId &&
    cleanText(
      meta.mtc_migration_import_id,
    ) === importId
  ) {
    return true;
  }

  return false;
}

function findCanonicalExistingSubscription(
  importRow: ImportRow,
  subscriptions: StoreSubscription[],
) {
  const email =
    normaliseEmail(importRow.email);

  const name =
    normaliseText(importRow.member_name);

  const migrationId =
    cleanText(importRow.mtc_migration_id);

  const candidates =
    subscriptions.filter(
      (subscription) =>
        !isMarkedDuplicate(subscription),
    );

  // Exact migration ID wins.
  if (migrationId) {
    const exactImport =
      candidates.find(
        (subscription) =>
          cleanText(
            metadata(subscription)
              .mtc_migration_import_id,
          ) === migrationId ||
          cleanText(
            subscription.external_membership_id,
          ) === migrationId,
      );

    if (exactImport) {
      return exactImport;
    }
  }

  // Email + same membership.
  if (email) {
    const emailMembership =
      candidates.filter(
        (subscription) =>
          normaliseEmail(
            subscription.customer_email,
          ) === email &&
          sameMembership(
            subscription,
            importRow,
          ),
      );

    if (emailMembership.length) {
      return chooseBestCanonical(
        emailMembership,
      );
    }
  }

  // Name + membership fallback.
  if (name) {
    const nameMembership =
      candidates.filter(
        (subscription) =>
          normaliseText(
            subscription.customer_name,
          ) === name &&
          sameMembership(
            subscription,
            importRow,
          ),
      );

    if (nameMembership.length) {
      return chooseBestCanonical(
        nameMembership,
      );
    }
  }

  return null;
}

function chooseBestCanonical(
  rows: StoreSubscription[],
) {
  return [...rows].sort(
    (a, b) => {
      function score(
        row: StoreSubscription,
      ) {
        let value = 0;

        if (row.stripe_subscription_id) {
          value += 100;
        }

        if (
          row.processor_verification_status ===
          "verified"
        ) {
          value += 50;
        }

        if (row.stripe_customer_id) {
          value += 25;
        }

        if (row.external_customer_id) {
          value += 20;
        }

        if (row.external_mandate_id) {
          value += 20;
        }

        if (row.product_id) {
          value += 10;
        }

        if (row.next_payment_at) {
          value += 10;
        }

        return value;
      }

      return score(b) - score(a);
    },
  )[0];
}

// ============================================================
// CREATE CANONICAL STORE MEMBERSHIP
// ============================================================

async function createCanonicalSubscription(
  importRow: ImportRow,
  product: StoreProduct,
) {
  const amountFromImport =
    parsePence(
      importRow.legacy_amount_pence,
    );

  const amountFromProduct =
    productPricePence(product);

  const unitAmountPence =
    amountFromImport ??
    amountFromProduct;

  const provider =
    providerFromText(
      importRow.payment_provider,
    ) ??
    (
      looksLikeStripeCustomerId(
        importRow.external_customer_id,
      )
        ? "stripe"
        : looksLikeGoCardlessCustomerId(
              importRow.external_customer_id,
            ) ||
            looksLikeGoCardlessMandate(
              importRow.gocardless_mandate_id,
            )
          ? "gocardless"
          : null
    );

  const now =
    new Date().toISOString();

  const billingInterval =
    product.billing_interval ??
    (
      product.purchase_type ===
      "subscription"
        ? "month"
        : null
    );

  const { data, error } = await admin
    .from("store_subscriptions")
    .insert({
      organisation_id:
        ORGANISATION_ID,

      product_id:
        product.id,

      customer_name:
        cleanText(
          importRow.member_name,
        ) || null,

      customer_email:
        normaliseEmail(
          importRow.email,
        ) || null,

      status:
        "active",

      quantity:
        1,

      currency:
        "gbp",

      unit_amount_pence:
        unitAmountPence,

      billing_interval:
        billingInterval,

      billing_provider:
        provider ??
        "stripe",

      payment_provider:
        provider,

      external_customer_id:
        cleanText(
          importRow.external_customer_id,
        ) || null,

      external_membership_id:
        cleanText(
          importRow.mtc_migration_id,
        ) || null,

      external_mandate_id:
        cleanText(
          importRow.gocardless_mandate_id,
        ) || null,

      legacy_billing:
        true,

      legacy_price:
        true,

      legacy_membership_name:
        cleanText(
          importRow.teamup_membership,
        ) || product.name,

      migrated_from:
        "teamup",

      migrated_at:
        now,

      processor_verification_status:
        "unverified",

      cutover_status:
        "not_started",

      collection_enabled:
        false,

      teamup_billing_active:
        true,

      metadata: {
        mtc_migration_import_id:
          importRow.mtc_migration_id,

        mtc_access_mapping:
          importRow.access_mapping,

        mtc_membership_type:
          importRow.membership_type,

        mtc_migration_decision:
          importRow.migration_decision,

        mtc_import_original_status:
          importRow.migration_status,

        mtc_amount_evidence:
          importRow.amount_evidence,

        mtc_canonical_membership:
          true,

        mtc_app_import_ready:
          true,

        mtc_billing_review_required:
          true,

        mtc_created_by_bulk_app_prepare:
          true,

        mtc_created_by_bulk_app_prepare_at:
          now,
      },

      migration_notes:
        "Canonical TOTS membership created from MTC migration import. Ready for later MTC app import. Billing remains subject to migration review.",
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as StoreSubscription;
}

// ============================================================
// MIGRATION SOURCE
// ============================================================

async function getMigrationSources(
  row: StoreSubscription,
): Promise<MigrationSource[]> {
  if (!row.customer_email) return [];

  const email = normaliseEmail(
    row.customer_email,
  );

  if (!email) {
    return [];
  }

  let query = admin
    .from("mtc_billing_migration_source")
    .select("*")
    .ilike("email", email);

  if (row.legacy_membership_name) {
    query = query.ilike(
      "membership_name",
      row.legacy_membership_name.trim(),
    );
  }

  const { data, error } =
    await query.limit(20);

  if (error) {
    console.warn(
      "[MTC MIGRATION SOURCE]",
      error,
    );

    return [];
  }

  return (data ?? []) as MigrationSource[];
}

async function getMigrationSource(
  row: StoreSubscription,
) {
  const sources =
    await getMigrationSources(row);

  if (!sources.length) {
    return null;
  }

  return sources[0];
}

// ============================================================
// PROVIDER DETECTION
// ============================================================

function looksLikeStripeCustomerId(
  value: unknown,
) {
  return (
    typeof value === "string" &&
    value.startsWith("cus_")
  );
}

function looksLikeGoCardlessCustomerId(
  value: unknown,
) {
  return (
    typeof value === "string" &&
    (
      value.toLowerCase().startsWith("gcus_") ||
      /^CU[A-Z0-9]+$/i.test(value)
    )
  );
}

function looksLikeGoCardlessMandate(
  value: unknown,
) {
  return (
    typeof value === "string" &&
    /^MD[A-Z0-9]+$/i.test(value)
  );
}

function providerFromText(
  value: unknown,
): Provider | null {
  const text = normaliseText(value);

  if (!text) return null;

  if (text.includes("stripe")) {
    return "stripe";
  }

  if (
    text.includes("gocardless") ||
    text.includes("go cardless")
  ) {
    return "gocardless";
  }

  return null;
}

async function detectProvider(
  row: StoreSubscription,
): Promise<Provider> {
  // Provider labels and GoCardless mandate/customer IDs are authoritative for
  // migrated Direct Debit rows. Some legacy rows also contain a stale Stripe
  // customer reference, so do not let that incorrectly turn them into Stripe.
  const explicit =
    providerFromText(
      row.payment_provider,
    ) ??
    providerFromText(
      row.billing_provider,
    );

  if (explicit === "gocardless") {
    return "gocardless";
  }

  if (
    looksLikeGoCardlessCustomerId(
      row.external_customer_id,
    ) ||
    looksLikeGoCardlessMandate(
      row.external_mandate_id,
    )
  ) {
    return "gocardless";
  }

  if (explicit === "stripe") {
    return "stripe";
  }

  if (
    looksLikeStripeCustomerId(
      row.stripe_customer_id,
    ) ||
    looksLikeStripeCustomerId(
      row.external_customer_id,
    )
  ) {
    return "stripe";
  }

  const sources =
    await getMigrationSources(row);

  for (const source of sources) {
    if (
      looksLikeStripeCustomerId(
        source.external_customer_id,
      )
    ) {
      return "stripe";
    }

    if (
      looksLikeGoCardlessCustomerId(
        source.external_customer_id,
      ) ||
      looksLikeGoCardlessMandate(
        source.gocardless_mandate_id,
      )
    ) {
      return "gocardless";
    }

    const sourceProvider =
      providerFromText(
        source.payment_provider,
      ) ??
      providerFromText(
        source.billing_provider,
      );

    if (sourceProvider) {
      return sourceProvider;
    }
  }

  return "unknown";
}

// ============================================================
// RECURRING HELPERS
// ============================================================

function isRecurring(
  row: StoreSubscription,
) {
  return (
    typeof row.unit_amount_pence ===
      "number" &&
    row.unit_amount_pence > 0 &&
    ["week", "month", "year"].includes(
      normaliseText(
        row.billing_interval,
      ),
    )
  );
}

function stripeInterval(
  interval: string,
): Stripe.PriceCreateParams.Recurring.Interval {
  switch (interval.toLowerCase()) {
    case "week":
      return "week";

    case "month":
      return "month";

    case "year":
      return "year";

    default:
      throw new Error(
        `Unsupported billing interval: ${interval}`,
      );
  }
}

// ============================================================
// STRIPE CUSTOMER HELPERS
// ============================================================

async function retrieveCustomer(
  accountId: string,
  customerId: string,
): Promise<Stripe.Customer | null> {
  if (
    !looksLikeStripeCustomerId(
      customerId,
    )
  ) {
    return null;
  }

  try {
    const result =
      await stripe.customers.retrieve(
        customerId,
        {},
        {
          stripeAccount: accountId,
        },
      );

    if (
      "deleted" in result &&
      result.deleted
    ) {
      return null;
    }

    return result as Stripe.Customer;
  } catch {
    return null;
  }
}

async function listCustomersByEmail(
  accountId: string,
  email: string,
) {
  const target =
    normaliseEmail(email);

  if (!target) {
    return [];
  }

  const listed =
    await stripe.customers.list(
      {
        email: target,
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    );

  const exact =
    listed.data.filter(
      (customer) =>
        normaliseEmail(
          customer.email,
        ) === target,
    );

  if (exact.length) {
    return exact;
  }

  try {
    const escaped =
      target.replace(/'/g, "\\'");

    const searched =
      await stripe.customers.search(
        {
          query:
            `email:'${escaped}'`,
          limit: 100,
        },
        {
          stripeAccount: accountId,
        },
      );

    return searched.data.filter(
      (customer) =>
        normaliseEmail(
          customer.email,
        ) === target,
    );
  } catch (error) {
    console.warn(
      "[MTC CUSTOMER SEARCH]",
      error,
    );

    return [];
  }
}

// ============================================================
// PAYMENT METHODS
// ============================================================

function cardIsExpired(
  paymentMethod: Stripe.PaymentMethod,
) {
  if (
    paymentMethod.type !== "card" ||
    !paymentMethod.card
  ) {
    return false;
  }

  const { exp_year, exp_month } =
    paymentMethod.card;

  if (!exp_year || !exp_month) {
    return false;
  }

  const now = new Date();

  const year =
    now.getUTCFullYear();

  const month =
    now.getUTCMonth() + 1;

  return (
    exp_year < year ||
    (
      exp_year === year &&
      exp_month < month
    )
  );
}

async function findReusablePaymentMethod(
  accountId: string,
  customer: Stripe.Customer,
) {
  const defaultPaymentMethod =
    customer.invoice_settings
      ?.default_payment_method;

  const defaultId =
    typeof defaultPaymentMethod ===
    "string"
      ? defaultPaymentMethod
      : defaultPaymentMethod?.id;

  if (
    defaultId &&
    defaultId.startsWith("pm_")
  ) {
    try {
      const paymentMethod =
        await stripe.paymentMethods.retrieve(
          defaultId,
          {},
          {
            stripeAccount: accountId,
          },
        );

      if (
        paymentMethod.type === "card" &&
        !cardIsExpired(
          paymentMethod,
        )
      ) {
        return paymentMethod;
      }
    } catch {
      // Continue.
    }
  }

  const methods =
    await stripe.paymentMethods.list(
      {
        customer: customer.id,
        type: "card",
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    );

  const valid =
    methods.data.filter(
      (paymentMethod) =>
        paymentMethod.type === "card" &&
        !cardIsExpired(
          paymentMethod,
        ),
    );

  if (!valid.length) {
    return null;
  }

  valid.sort(
    (a, b) =>
      b.created - a.created,
  );

  return valid[0];
}

// ============================================================
// CUSTOMER CANDIDATES
// ============================================================

async function buildCandidates(
  row: StoreSubscription,
  accountId: string,
) {
  const map = new Map<
    string,
    {
      customer: Stripe.Customer;
      sources: Set<
        | "stripe_customer_id"
        | "external_customer_id"
        | "email"
      >;
      exactExternalId: boolean;
    }
  >();

  async function add(
    customer:
      | Stripe.Customer
      | null,
    source:
      | "stripe_customer_id"
      | "external_customer_id"
      | "email",
  ) {
    if (!customer) return;

    const existing =
      map.get(customer.id);

    if (existing) {
      existing.sources.add(source);

      if (
        source ===
        "external_customer_id"
      ) {
        existing.exactExternalId =
          true;
      }

      return;
    }

    map.set(customer.id, {
      customer,
      sources:
        new Set([source]),
      exactExternalId:
        source ===
        "external_customer_id",
    });
  }

  if (
    looksLikeStripeCustomerId(
      row.stripe_customer_id,
    )
  ) {
    await add(
      await retrieveCustomer(
        accountId,
        row.stripe_customer_id!,
      ),
      "stripe_customer_id",
    );
  }

  if (
    looksLikeStripeCustomerId(
      row.external_customer_id,
    )
  ) {
    await add(
      await retrieveCustomer(
        accountId,
        row.external_customer_id!,
      ),
      "external_customer_id",
    );
  }

  const email =
    normaliseEmail(
      row.customer_email,
    );

  if (email) {
    const customers =
      await listCustomersByEmail(
        accountId,
        email,
      );

    for (
      const customer of customers
    ) {
      await add(
        customer,
        "email",
      );
    }
  }

  const candidates: Candidate[] =
    [];

  for (
    const entry of map.values()
  ) {
    const paymentMethod =
      await findReusablePaymentMethod(
        accountId,
        entry.customer,
      );

    candidates.push({
      customer:
        entry.customer,

      paymentMethod,

      sources:
        entry.sources,

      exactExternalId:
        entry.exactExternalId,
    });
  }

  return candidates;
}

async function selectSafeCustomer(
  row: StoreSubscription,
  accountId: string,
) {
  const candidates =
    await buildCandidates(
      row,
      accountId,
    );

  const exactExternal =
    candidates.filter(
      (candidate) =>
        candidate.exactExternalId &&
        candidate.paymentMethod,
    );

  if (
    exactExternal.length === 1
  ) {
    return {
      status:
        "matched" as const,

      selected:
        exactExternal[0],

      candidates,
    };
  }

  if (
    exactExternal.length > 1
  ) {
    return {
      status:
        "multiple_card_customers" as const,

      selected: null,
      candidates,
    };
  }

  const cardReady =
    candidates.filter(
      (candidate) =>
        candidate.paymentMethod,
    );

  if (cardReady.length === 1) {
    return {
      status:
        "matched" as const,

      selected:
        cardReady[0],

      candidates,
    };
  }

  if (cardReady.length > 1) {
    return {
      status:
        "multiple_card_customers" as const,

      selected: null,
      candidates,
    };
  }

  if (candidates.length) {
    return {
      status:
        "no_payment_method" as const,

      selected: null,
      candidates,
    };
  }

  return {
    status:
      "customer_not_found" as const,

    selected: null,
    candidates,
  };
}

// ============================================================
// NEXT PAYMENT DATE
// ============================================================

function addInterval(
  date: Date,
  interval: string,
) {
  const next =
    new Date(date.getTime());

  switch (
    interval.toLowerCase()
  ) {
    case "week":
      next.setUTCDate(
        next.getUTCDate() + 7,
      );
      break;

    case "month":
      next.setUTCMonth(
        next.getUTCMonth() + 1,
      );
      break;

    case "year":
      next.setUTCFullYear(
        next.getUTCFullYear() + 1,
      );
      break;

    default:
      return null;
  }

  return next;
}

function inferNextPaymentAt(
  row: StoreSubscription,
  source: MigrationSource | null,
) {
  const explicit =
    source?.next_payment_at;

  if (
    typeof explicit === "string"
  ) {
    const date =
      new Date(explicit);

    if (
      !Number.isNaN(
        date.getTime(),
      ) &&
      date.getTime() >
        Date.now()
    ) {
      return {
        date:
          date.toISOString(),

        confidence:
          "explicit" as const,
      };
    }
  }

  if (row.next_payment_at) {
    const date =
      new Date(
        row.next_payment_at,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      ) &&
      date.getTime() >
        Date.now()
    ) {
      return {
        date:
          date.toISOString(),

        confidence:
          "existing" as const,
      };
    }
  }

  const last =
    source?.last_payment_at ??
    row.last_payment_at;

  if (
    typeof last !== "string" ||
    !row.billing_interval
  ) {
    return {
      date: null,
      confidence:
        "none" as const,
    };
  }

  let candidate =
    new Date(last);

  if (
    Number.isNaN(
      candidate.getTime(),
    )
  ) {
    return {
      date: null,
      confidence:
        "none" as const,
    };
  }

  let guard = 0;

  while (
    candidate.getTime() <=
      Date.now() &&
    guard < 100
  ) {
    const next =
      addInterval(
        candidate,
        row.billing_interval,
      );

    if (!next) {
      return {
        date: null,
        confidence:
          "none" as const,
      };
    }

    candidate = next;
    guard += 1;
  }

  return {
    date:
      candidate.toISOString(),

    confidence:
      "inferred_from_history" as const,
  };
}

// ============================================================
// SCAN ONE
// ============================================================

async function scanOne(
  row: StoreSubscription,
  accountId: string,
): Promise<ScanResult> {
  try {
    if (isMarkedDuplicate(row)) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "duplicate",

        message:
          "Record is marked as a redundant migration duplicate and was ignored.",
      };
    }

    if (
      row.collection_enabled
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,
        result:
          "already_live",
      };
    }

    if (!isRecurring(row)) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,
        result:
          "non_recurring",
      };
    }

    const provider =
      await detectProvider(row);

    if (
      provider ===
      "gocardless"
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "gocardless",

        message:
          "GoCardless membership retained for separate billing migration.",
      };
    }

    if (
      provider !== "stripe"
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "unknown_provider",

        message:
          "Could not safely determine billing provider.",
      };
    }

    const email =
      normaliseEmail(
        row.customer_email,
      );

    if (!email) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email: null,
        result:
          "no_email",
      };
    }

    const selection =
      await selectSafeCustomer(
        row,
        accountId,
      );

    if (
      selection.status ===
      "customer_not_found"
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "customer_not_found",

        candidates: 0,
      };
    }

    if (
      selection.status ===
      "multiple_card_customers"
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "multiple_card_customers",

        candidates:
          selection.candidates.length,

        cardReadyCandidates:
          selection.candidates.filter(
            (x) =>
              x.paymentMethod,
          ).length,

        message:
          "Multiple card-ready Stripe customers matched. TOTS refused to guess.",
      };
    }

    if (
      selection.status ===
      "no_payment_method"
    ) {
      return {
        subscriptionId: row.id,
        customerName:
          row.customer_name,
        email:
          row.customer_email,

        result:
          "no_payment_method",

        candidates:
          selection.candidates.length,

        cardReadyCandidates: 0,
      };
    }

    const selected =
      selection.selected;

    if (
      !selected ||
      !selected.paymentMethod
    ) {
      throw new Error(
        "Stripe customer selection failed.",
      );
    }

    const source =
      await getMigrationSource(
        row,
      );

    const proposedNext =
      inferNextPaymentAt(
        row,
        source,
      );

    const now =
      new Date().toISOString();

    await stripe.customers.update(
      selected.customer.id,
      {
        invoice_settings: {
          default_payment_method:
            selected
              .paymentMethod.id,
        },
      },
      {
        stripeAccount:
          accountId,
      },
    );

    await patchSubscription(
      row.id,
      {
        stripe_account_id:
          accountId,

        stripe_customer_id:
          selected.customer.id,

        payment_provider:
          "stripe",

        billing_provider:
          "stripe",

        processor_verification_status:
          "verified",

        processor_verified_at:
          now,

        cutover_status:
          row.stripe_subscription_id
            ? row.cutover_status
            : "verified",

        collection_enabled:
          false,

        collection_enabled_at:
          null,

        teamup_billing_active:
          true,

        last_payment_at:
          source?.last_payment_at ??
          row.last_payment_at ??
          null,

        last_payment_amount_pence:
          source?.last_payment_amount_pence ??
          row.last_payment_amount_pence ??
          null,

        // Only persist a confirmed date.
        next_payment_at:
          proposedNext.confidence ===
            "explicit" ||
          proposedNext.confidence ===
            "existing"
            ? proposedNext.date
            : row.next_payment_at,

        metadata: {
          ...metadata(row),

          mtc_stripe_copy_reconciled:
            true,

          mtc_stripe_copy_reconciled_at:
            now,

          mtc_stripe_connected_account:
            accountId,

          mtc_verified_stripe_customer_id:
            selected.customer.id,

          mtc_verified_payment_method_id:
            selected.paymentMethod.id,

          mtc_customer_match_sources:
            Array.from(
              selected.sources,
            ),

          mtc_exact_external_customer_match:
            selected.exactExternalId,

          mtc_customer_candidate_count:
            selection
              .candidates.length,

          mtc_proposed_next_payment_at:
            proposedNext.date,

          mtc_next_payment_confidence:
            proposedNext.confidence,

          mtc_previous_stripe_customer_id:
            row.stripe_customer_id ??
            null,

          mtc_legacy_external_customer_id:
            row.external_customer_id ??
            null,
        },

        migration_notes:
          proposedNext.confidence ===
          "inferred_from_history"
            ? appendMigrationNote(
                row,
                "Stripe customer/payment method verified. Proposed renewal date inferred from payment history and requires confirmation. TeamUp remains active; TOTS collection remains OFF.",
              )
            : appendMigrationNote(
                row,
                "Stripe customer/payment method verified. TeamUp remains active; TOTS collection remains OFF.",
              ),
      },
    );

    return {
      subscriptionId: row.id,
      customerName:
        row.customer_name,
      email:
        row.customer_email,

      result: "verified",

      stripeCustomerId:
        selected.customer.id,

      paymentMethodId:
        selected.paymentMethod.id,

      candidates:
        selection.candidates.length,

      cardReadyCandidates:
        selection.candidates.filter(
          (x) => x.paymentMethod,
        ).length,

      message:
        proposedNext.date
          ? `Stripe ready. Proposed next payment: ${proposedNext.date} (${proposedNext.confidence}).`
          : "Stripe ready. Next billing date still needs confirmation.",
    };
  } catch (error) {
    return {
      subscriptionId: row.id,
      customerName:
        row.customer_name,
      email:
        row.customer_email,

      result: "error",

      message:
        error instanceof Error
          ? error.message
          : "Unknown migration error.",
    };
  }
}

// ============================================================
// PRICE
// ============================================================

async function ensureRecurringPrice(
  row: StoreSubscription,
  accountId: string,
) {
  if (!row.unit_amount_pence || row.unit_amount_pence <= 0 || !row.billing_interval) {
    throw new Error("Recurring billing details are incomplete.");
  }

  const expectedCurrency = (row.currency ?? "gbp").toLowerCase();
  const expectedInterval = stripeInterval(row.billing_interval);

  // Reuse a valid price already stored on this row.
  if (row.stripe_price_id) {
    try {
      const existing = await stripe.prices.retrieve(
        row.stripe_price_id,
        {},
        { stripeAccount: accountId },
      );
      if (
        existing.active &&
        existing.unit_amount === row.unit_amount_pence &&
        existing.currency === expectedCurrency &&
        existing.recurring?.interval === expectedInterval
      ) {
        return existing;
      }
    } catch {
      // Continue to the shared migration price below.
    }
  }

  // One shared migration Product/Price per currency + amount + interval.
  // This prevents 18 separate £69/month products, etc.
  const key = `${expectedCurrency}-${row.unit_amount_pence}-${expectedInterval}`;
  const product = await stripe.products.create(
    {
      name: `Moray Training Club Legacy £${(row.unit_amount_pence / 100).toFixed(2)} / ${expectedInterval}`,
      metadata: {
        mtc_migration: "true",
        mtc_shared_legacy_price_key: key,
        organisation_id: ORGANISATION_ID,
      },
    },
    {
      stripeAccount: accountId,
      idempotencyKey: `mtc-shared-product-${key}`,
    },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: expectedCurrency,
      unit_amount: row.unit_amount_pence,
      recurring: { interval: expectedInterval },
      metadata: {
        mtc_migration: "true",
        mtc_shared_legacy_price_key: key,
        organisation_id: ORGANISATION_ID,
      },
    },
    {
      stripeAccount: accountId,
      idempotencyKey: `mtc-shared-price-${key}`,
    },
  );

  await patchSubscription(row.id, {
    stripe_price_id: price.id,
    metadata: {
      ...metadata(row),
      mtc_migration_product_id: product.id,
      mtc_migration_price_id: price.id,
      mtc_shared_legacy_price_key: key,
    },
  });

  return price;
}

// ============================================================
// PREPARED STRIPE SUBSCRIPTION
// ============================================================

function isUsablePreparedSubscription(
  subscription:
    Stripe.Subscription,
) {
  return ![
    "canceled",
    "incomplete_expired",
  ].includes(
    subscription.status,
  );
}

async function retrievePreparedStripeSubscription(
  row: StoreSubscription,
  accountId: string,
) {
  if (
    !row.stripe_subscription_id
  ) {
    return null;
  }

  try {
    const subscription =
      await stripe.subscriptions.retrieve(
        row.stripe_subscription_id,
        {},
        {
          stripeAccount:
            accountId,
        },
      );

    if (
      !isUsablePreparedSubscription(
        subscription,
      )
    ) {
      return null;
    }

    return subscription;
  } catch {
    return null;
  }
}


async function findExistingStripeSubscriptionForCustomer(
  row: StoreSubscription,
  accountId: string,
) {
  if (!row.stripe_customer_id) return null;

  const listed = await stripe.subscriptions.list(
    {
      customer: row.stripe_customer_id,
      status: "all",
      limit: 100,
    },
    { stripeAccount: accountId },
  );

  const usable = listed.data.filter(isUsablePreparedSubscription);
  if (!usable.length) return null;

  // Strongest match: a subscription created by this migration row.
  const exactRow = usable.find(
    (sub) => sub.metadata?.tots_store_subscription_id === row.id,
  );
  if (exactRow) return exactRow;

  // If this Stripe customer has exactly one usable subscription, reuse it.
  // This prevents a duplicate when the legacy DB row lost its sub_ ID.
  if (usable.length === 1) return usable[0];

  // Multiple live/scheduled subscriptions on one payer can be legitimate
  // (family/kids/couples). Never guess which one belongs to this row.
  return null;
}

// ============================================================
// PREPARE CUTOVER
// ============================================================

async function prepareCutover(
  row: StoreSubscription,
  accountId: string,
): Promise<PrepareCutoverResult> {
  try {
    if (
      isMarkedDuplicate(row)
    ) {
      return {
        subscriptionId:
          row.id,

        customerName:
          row.customer_name,

        email:
          row.customer_email,

        result:
          "skipped",

        message:
          "Redundant duplicate record.",
      };
    }

    const existing =
      (await retrievePreparedStripeSubscription(
        row,
        accountId,
      )) ??
      (await findExistingStripeSubscriptionForCustomer(
        row,
        accountId,
      ));

    if (existing) {
      await patchSubscription(
        row.id,
        {
          stripe_subscription_id: existing.id,
          status: existing.status,
          metadata: {
            ...metadata(row),

            mtc_cutover_prepared:
              true,

            mtc_prepared_stripe_subscription_id:
              existing.id,
          },
        },
      );

      return {
        subscriptionId:
          row.id,

        customerName:
          row.customer_name,

        email:
          row.customer_email,

        result:
          "already_prepared",

        stripeSubscriptionId:
          existing.id,

        stripeStatus:
          existing.status,

        firstPaymentAt:
          row.next_payment_at,
      };
    }

    if (
      row.processor_verification_status !==
      "verified"
    ) {
      throw new Error(
        "Stripe payment method is not verified.",
      );
    }

    if (
      !isRecurring(row)
    ) {
      throw new Error(
        "Not a paid recurring membership.",
      );
    }

    const provider =
      await detectProvider(row);

    if (
      provider !== "stripe"
    ) {
      throw new Error(
        "This preparation path is Stripe-only.",
      );
    }

    if (
      !row.stripe_customer_id
    ) {
      throw new Error(
        "Stripe customer ID is missing.",
      );
    }

    if (
      !row.next_payment_at
    ) {
      throw new Error(
        "Confirmed next_payment_at is missing.",
      );
    }

    const nextPayment =
      new Date(
        row.next_payment_at,
      );

    if (
      Number.isNaN(
        nextPayment.getTime(),
      )
    ) {
      throw new Error(
        "next_payment_at is invalid.",
      );
    }

    if (
      nextPayment.getTime() <=
      Date.now() +
        30 * 60 * 1000
    ) {
      throw new Error(
        "next_payment_at must be safely in the future.",
      );
    }

    const customer =
      await retrieveCustomer(
        accountId,
        row.stripe_customer_id,
      );

    if (!customer) {
      throw new Error(
        "Verified Stripe customer no longer exists.",
      );
    }

    const paymentMethod =
      await findReusablePaymentMethod(
        accountId,
        customer,
      );

    if (!paymentMethod) {
      throw new Error(
        "Verified Stripe customer no longer has a reusable card.",
      );
    }

    await stripe.customers.update(
      customer.id,
      {
        invoice_settings: {
          default_payment_method:
            paymentMethod.id,
        },
      },
      {
        stripeAccount:
          accountId,
      },
    );

    const price =
      await ensureRecurringPrice(
        row,
        accountId,
      );

    const subscription =
      await stripe.subscriptions.create(
        {
          customer:
            customer.id,

          items: [
            {
              price:
                price.id,
              quantity: 1,
            },
          ],

          default_payment_method:
            paymentMethod.id,

          trial_end:
            Math.floor(
              nextPayment.getTime() /
                1000,
            ),

          proration_behavior:
            "none",

          metadata: {
            tots_store_subscription_id:
              row.id,

            mtc_migration:
              "true",

            migrated_from:
              "teamup",

            migration_stage:
              "prepared_cutover",

            legacy_membership:
              row.legacy_membership_name ??
              "",
          },
        },
        {
          stripeAccount:
            accountId,

          idempotencyKey:
            `mtc-prepare-cutover-${row.id}`,
        },
      );

    const verified =
      await stripe.subscriptions.retrieve(
        subscription.id,
        {},
        {
          stripeAccount:
            accountId,
        },
      );

    if (
      !isUsablePreparedSubscription(
        verified,
      )
    ) {
      throw new Error(
        `Stripe created ${verified.id} but returned unusable status ${verified.status}.`,
      );
    }

    const preparedAt =
      new Date().toISOString();

    await patchSubscription(
      row.id,
      {
        stripe_account_id:
          accountId,

        stripe_customer_id:
          customer.id,

        stripe_subscription_id:
          verified.id,

        stripe_price_id:
          price.id,

        external_subscription_id:
          verified.id,

        payment_provider:
          "stripe",

        billing_provider:
          "stripe",

        status:
          verified.status,

        legacy_billing:
          true,

        collection_enabled:
          true,

        collection_enabled_at:
          row.collection_enabled_at ?? preparedAt,

        teamup_billing_active:
          false,

        teamup_billing_disabled_at:
          row.teamup_billing_disabled_at ?? preparedAt,

        cutover_status:
          "verified",

        processor_verification_status:
          "verified",

        metadata: {
          ...metadata(row),

          mtc_cutover_prepared:
            true,

          mtc_cutover_prepared_at:
            preparedAt,

          mtc_prepared_stripe_subscription_id:
            verified.id,

          mtc_prepared_payment_method_id:
            paymentMethod.id,

          mtc_prepared_price_id:
            price.id,

          mtc_first_tots_payment_at:
            nextPayment.toISOString(),

          mtc_teamup_still_active_at_prepare:
            row.teamup_billing_active,
        },

        migration_notes:
          appendMigrationNote(
            row,
            `MTC migration completed for Stripe subscription ${verified.id}. First intended billing date ${nextPayment.toISOString()}. TOTS collection is enabled and TeamUp is marked inactive in TOTS.`,
          ),
      },
    );

    return {
      subscriptionId:
        row.id,

      customerName:
        row.customer_name,

      email:
        row.customer_email,

      result:
        "prepared",

      stripeSubscriptionId:
        verified.id,

      stripeStatus:
        verified.status,

      firstPaymentAt:
        nextPayment.toISOString(),

      message:
        "Stripe subscription created successfully. No immediate membership charge requested; first billing is scheduled for the stored renewal date.",
    };
  } catch (error) {
    return {
      subscriptionId:
        row.id,

      customerName:
        row.customer_name,

      email:
        row.customer_email,

      result:
        "error",

      message:
        error instanceof Error
          ? error.message
          : "Unknown cutover preparation error.",
    };
  }
}

// ============================================================
// MARK CANONICAL / APP READY
// ============================================================

async function markAppImportReady(
  row: StoreSubscription,
  importRow: ImportRow,
  product: StoreProduct,
  billingReviewRequired: boolean,
  billingReason: string | null,
) {
  const now =
    new Date().toISOString();

  const updated =
    await patchSubscription(
      row.id,
      {
        product_id:
          product.id,

        customer_name:
          row.customer_name ||
          cleanText(
            importRow.member_name,
          ) ||
          null,

        customer_email:
          row.customer_email ||
          normaliseEmail(
            importRow.email,
          ) ||
          null,

        legacy_membership_name:
          row.legacy_membership_name ||
          cleanText(
            importRow.teamup_membership,
          ) ||
          product.name,

        external_membership_id:
          row.external_membership_id ||
          cleanText(
            importRow.mtc_migration_id,
          ) ||
          null,

        migrated_from:
          row.migrated_from ||
          "teamup",

        migrated_at:
          row.migrated_at ||
          now,

        metadata: {
          ...metadata(row),

          mtc_canonical_membership:
            true,

          mtc_app_import_ready:
            true,

          mtc_app_import_ready_at:
            now,

          mtc_migration_import_id:
            importRow.mtc_migration_id,

          mtc_access_mapping:
            importRow.access_mapping,

          mtc_membership_type:
            importRow.membership_type,

          mtc_migration_decision:
            importRow.migration_decision,

          mtc_import_original_status:
            importRow.migration_status,

          mtc_amount_evidence:
            importRow.amount_evidence,

          mtc_billing_review_required:
            billingReviewRequired,

          mtc_billing_review_reason:
            billingReason,
        },

        migration_notes:
          appendMigrationNote(
            row,
            billingReviewRequired
              ? `Canonical TOTS membership is ready for MTC app import. Billing review required: ${billingReason ?? "manual billing review required"}.`
              : "Canonical TOTS membership is ready for MTC app import.",
          ),
      },
    );

  return updated;
}

// ============================================================
// PREPARE ONE IMPORT ROW
// ============================================================

async function prepareOneForMtcImport(
  importRow: ImportRow,
  products: StoreProduct[],
  allSubscriptions: StoreSubscription[],
  accountId: string,
): Promise<ImportPreparationResult> {
  const base = {
    migrationId:
      importRow.mtc_migration_id,

    memberName:
      importRow.member_name,

    email:
      importRow.email,

    membership:
      importRow.teamup_membership,
  };

  try {
    if (
      importLooksHistoricalOrIgnored(
        importRow,
      )
    ) {
      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "DUPLICATE / HISTORICAL",

          remaining_issue:
            "Historical/ignored migration record. Not included in canonical MTC import.",
        },
      );

      return {
        ...base,

        result:
          "duplicate",

        reason:
          "Historical/ignored migration record.",
      };
    }

    let canonical =
      findCanonicalExistingSubscription(
        importRow,
        allSubscriptions,
      );

    const product =
      resolveProduct(
        importRow,
        products,
        canonical,
      );

    if (!product) {
      const reason =
        `Could not resolve a TOTS Store product for "${importRow.teamup_membership ?? "unknown membership"}".`;

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "EXCEPTION",

          remaining_issue:
            reason,
        },
      );

      return {
        ...base,

        result:
          "exception",

        reason,
      };
    }

    if (!canonical) {
      canonical =
        await createCanonicalSubscription(
          importRow,
          product,
        );

      allSubscriptions.push(
        canonical,
      );
    }

    if (
      isMarkedDuplicate(
        canonical,
      )
    ) {
      const reason =
        "Matched Store subscription is marked as a redundant duplicate.";

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "DUPLICATE",

          remaining_issue:
            reason,
        },
      );

      return {
        ...base,

        result:
          "duplicate",

        subscriptionId:
          canonical.id,

        productId:
          product.id,

        reason,
      };
    }

    const provider =
      await detectProvider(
        canonical,
      );

    // --------------------------------------------------------
    // NON-RECURRING
    // --------------------------------------------------------

    if (!isRecurring(canonical)) {
      const ready =
        await markAppImportReady(
          canonical,
          importRow,
          product,
          false,
          null,
        );

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "READY FOR MTC IMPORT",

          remaining_issue:
            null,
        },
      );

      return {
        ...base,

        result:
          "ready",

        subscriptionId:
          ready.id,

        productId:
          product.id,

        billingProvider:
          provider,

        billingStatus:
          "non_recurring",
      };
    }

    // --------------------------------------------------------
    // GOCARDLESS
    // --------------------------------------------------------

    if (
      provider ===
      "gocardless"
    ) {
      const mandate =
        cleanText(
          canonical.external_mandate_id,
        ) ||
        cleanText(
          importRow.gocardless_mandate_id,
        );

      const reason =
        mandate
          ? "GoCardless membership is ready for app import but requires separate GoCardless cutover."
          : "GoCardless membership is ready for app import but mandate/payment migration requires review.";

      const ready =
        await markAppImportReady(
          canonical,
          importRow,
          product,
          true,
          reason,
        );

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "READY FOR MTC IMPORT — BILLING REVIEW",

          remaining_issue:
            reason,
        },
      );

      return {
        ...base,

        result:
          "ready_billing_review",

        subscriptionId:
          ready.id,

        productId:
          product.id,

        billingProvider:
          "gocardless",

        billingStatus:
          mandate
            ? "gocardless_cutover_required"
            : "gocardless_mandate_review",

        reason,
      };
    }

    // --------------------------------------------------------
    // UNKNOWN PROVIDER
    // --------------------------------------------------------

    if (
      provider ===
      "unknown"
    ) {
      const reason =
        "Membership is ready for app import, but billing provider could not be safely identified.";

      const ready =
        await markAppImportReady(
          canonical,
          importRow,
          product,
          true,
          reason,
        );

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "READY FOR MTC IMPORT — BILLING REVIEW",

          remaining_issue:
            reason,
        },
      );

      return {
        ...base,

        result:
          "ready_billing_review",

        subscriptionId:
          ready.id,

        productId:
          product.id,

        billingProvider:
          "unknown",

        billingStatus:
          "provider_review",

        reason,
      };
    }

    // --------------------------------------------------------
    // STRIPE — PRESERVE EXISTING PREPARED SUBSCRIPTION
    // --------------------------------------------------------

    const existingPrepared =
      await retrievePreparedStripeSubscription(
        canonical,
        accountId,
      );

    if (existingPrepared) {
      const ready =
        await markAppImportReady(
          canonical,
          importRow,
          product,
          false,
          null,
        );

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "READY FOR MTC IMPORT",

          remaining_issue:
            null,
        },
      );

      return {
        ...base,

        result:
          "ready",

        subscriptionId:
          ready.id,

        productId:
          product.id,

        billingProvider:
          "stripe",

        billingStatus:
          "stripe_already_prepared",

        stripeSubscriptionId:
          existingPrepared.id,
      };
    }

    // --------------------------------------------------------
    // STRIPE — RECONCILE
    // --------------------------------------------------------

    const scan =
      await scanOne(
        canonical,
        accountId,
      );

    const fresh =
      await loadSubscription(
        canonical.id,
      );

    // --------------------------------------------------------
    // STRIPE VERIFIED + CONFIRMED DATE
    // --------------------------------------------------------

    if (
      scan.result ===
        "verified" &&
      fresh.processor_verification_status ===
        "verified" &&
      fresh.next_payment_at
    ) {
      const prepared =
        await prepareCutover(
          fresh,
          accountId,
        );

      if (
        prepared.result ===
          "prepared" ||
        prepared.result ===
          "already_prepared"
      ) {
        const newest =
          await loadSubscription(
            canonical.id,
          );

        const ready =
          await markAppImportReady(
            newest,
            importRow,
            product,
            false,
            null,
          );

        await patchImportRow(
          importRow.mtc_migration_id,
          {
            migration_status:
              "READY FOR MTC IMPORT",

            remaining_issue:
              null,
          },
        );

        return {
          ...base,

          result:
            "ready",

          subscriptionId:
            ready.id,

          productId:
            product.id,

          billingProvider:
            "stripe",

          billingStatus:
            prepared.result ===
            "prepared"
              ? "stripe_prepared"
              : "stripe_already_prepared",

          stripeSubscriptionId:
            prepared.stripeSubscriptionId ??
            null,
        };
      }
    }

    // --------------------------------------------------------
    // STRIPE VERIFIED BUT NO CONFIRMED DATE
    // --------------------------------------------------------

    if (
      fresh.processor_verification_status ===
        "verified" &&
      !fresh.next_payment_at
    ) {
      const reason =
        "Stripe customer/payment method is verified, but the next billing date still needs confirmation.";

      const ready =
        await markAppImportReady(
          fresh,
          importRow,
          product,
          true,
          reason,
        );

      await patchImportRow(
        importRow.mtc_migration_id,
        {
          migration_status:
            "READY FOR MTC IMPORT — BILLING REVIEW",

          remaining_issue:
            reason,
        },
      );

      return {
        ...base,

        result:
          "ready_billing_review",

        subscriptionId:
          ready.id,

        productId:
          product.id,

        billingProvider:
          "stripe",

        billingStatus:
          "billing_date_required",

        reason,
      };
    }

    // --------------------------------------------------------
    // STRIPE CUSTOMER/PAYMENT EXCEPTIONS
    // --------------------------------------------------------

    let reason =
      "Stripe billing requires manual review.";

    let billingStatus =
      "stripe_review";

    if (
      scan.result ===
      "customer_not_found"
    ) {
      reason =
        "No copied Stripe customer could be safely matched.";

      billingStatus =
        "stripe_customer_not_found";
    }

    if (
      scan.result ===
      "no_payment_method"
    ) {
      reason =
        "Stripe customer exists but has no reusable payment card.";

      billingStatus =
        "stripe_payment_method_required";
    }

    if (
      scan.result ===
      "multiple_card_customers"
    ) {
      reason =
        "Multiple card-ready Stripe customers matched this member; manual customer selection is required.";

      billingStatus =
        "stripe_multiple_customers";
    }

    if (
      scan.result ===
      "no_email"
    ) {
      reason =
        "No usable member email is available for Stripe reconciliation.";

      billingStatus =
        "stripe_no_email";
    }

    if (
      scan.result ===
      "error"
    ) {
      reason =
        scan.message ||
        "Stripe reconciliation failed.";

      billingStatus =
        "stripe_error";
    }

    const ready =
      await markAppImportReady(
        fresh,
        importRow,
        product,
        true,
        reason,
      );

    await patchImportRow(
      importRow.mtc_migration_id,
      {
        migration_status:
          "READY FOR MTC IMPORT — BILLING REVIEW",

        remaining_issue:
          reason,
      },
    );

    return {
      ...base,

      result:
        "ready_billing_review",

      subscriptionId:
        ready.id,

      productId:
        product.id,

      billingProvider:
        "stripe",

      billingStatus,

      reason,
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Unknown migration preparation error.";

    await patchImportRow(
      importRow.mtc_migration_id,
      {
        migration_status:
          "EXCEPTION",

        remaining_issue:
          reason,
      },
    );

    return {
      ...base,

      result:
        "exception",

      reason,
    };
  }
}

// ============================================================
// MAIN ONE-BUTTON PREPARATION
// ============================================================

async function prepareAllForMtcImport(
  accountId: string,
) {
  const [
    importRows,
    products,
    subscriptions,
  ] =
    await Promise.all([
      loadImportRows(),
      loadStoreProducts(),
      loadAllStoreSubscriptions(),
    ]);

  const results:
    ImportPreparationResult[] =
    [];

  /*
   * Deliberately sequential.
   *
   * Some rows may perform Stripe reads/writes
   * and may prepare real future-dated Stripe
   * subscriptions.
   */
  for (const importRow of importRows) {
    const result =
      await prepareOneForMtcImport(
        importRow,
        products,
        subscriptions,
        accountId,
      );

    results.push(result);
  }

  const ready =
    results.filter(
      (x) =>
        x.result ===
        "ready",
    );

  const billingReview =
    results.filter(
      (x) =>
        x.result ===
        "ready_billing_review",
    );

  const duplicates =
    results.filter(
      (x) =>
        x.result ===
        "duplicate",
    );

  const exceptions =
    results.filter(
      (x) =>
        x.result ===
        "exception",
    );

  const stripeAlreadyPrepared =
    results.filter(
      (x) =>
        x.billingStatus ===
        "stripe_already_prepared",
    ).length;

  const stripePrepared =
    results.filter(
      (x) =>
        x.billingStatus ===
        "stripe_prepared",
    ).length;

  const stripePaymentSetupRequired =
    results.filter(
      (x) =>
        x.billingStatus ===
          "stripe_payment_method_required" ||
        x.billingStatus ===
          "stripe_customer_not_found",
    ).length;

  const stripeDateReview =
    results.filter(
      (x) =>
        x.billingStatus ===
        "billing_date_required",
    ).length;

  const goCardlessReview =
    results.filter(
      (x) =>
        x.billingProvider ===
        "gocardless" &&
        x.result ===
        "ready_billing_review",
    ).length;

  const canonicalIds =
    new Set(
      results
        .filter(
          (x) =>
            x.result ===
              "ready" ||
            x.result ===
              "ready_billing_review",
        )
        .map(
          (x) =>
            x.subscriptionId,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    );

  return {
    processed:
      results.length,

    canonicalMemberships:
      canonicalIds.size,

    readyForMtcImport:
      ready.length +
      billingReview.length,

    fullyReady:
      ready.length,

    readyBillingReview:
      billingReview.length,

    duplicateOrHistorical:
      duplicates.length,

    exceptions:
      exceptions.length,

    billing: {
      stripeAlreadyPrepared,
      stripeNewlyPrepared:
        stripePrepared,

      stripePaymentSetupRequired,

      stripeBillingDateReview:
        stripeDateReview,

      goCardlessReview,
    },

    exceptionList:
      exceptions.map(
        (item) => ({
          name:
            item.memberName,

          email:
            item.email,

          membership:
            item.membership,

          reason:
            item.reason,
        }),
      ),

    billingReviewList:
      billingReview.map(
        (item) => ({
          name:
            item.memberName,

          email:
            item.email,

          membership:
            item.membership,

          provider:
            item.billingProvider,

          status:
            item.billingStatus,

          reason:
            item.reason,
        }),
      ),

    duplicateList:
      duplicates.map(
        (item) => ({
          name:
            item.memberName,

          email:
            item.email,

          membership:
            item.membership,

          reason:
            item.reason,
        }),
      ),

    safety: {
      immediateMigrationChargesRequested:
        0,

      teamupBillingDisabled:
        0,

      totsCollectionEnabled:
        0,

      existingPreparedStripeSubscriptionsPreserved:
        true,
    },
  };
}

// ============================================================
// LEGACY BULK LOADERS
// ============================================================

async function loadMigrationRows() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq(
      "organisation_id",
      ORGANISATION_ID,
    )
    // IMPORTANT: load the COMPLETE MTC subscription register here.
    // Earlier migration/preparation runs have already changed
    // teamup_billing_active and collection_enabled on many rows, so using
    // either flag as an input filter can incorrectly reduce the candidate
    // population to zero. Eligibility is decided later by the canonical,
    // recurring, amount, duplicate, access-only and processor checks.
    .order(
      "customer_name",
      {
        ascending: true,
      },
    );

  if (error) throw error;

  return (
    (data ?? []) as StoreSubscription[]
  );
}

async function loadAllOrganisationSubscriptionRows() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .order("customer_name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as StoreSubscription[];
}

async function loadPreparedCutoverRows() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .eq("processor_verification_status", "verified")
    .not("next_payment_at", "is", null)
    .order("customer_name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as StoreSubscription[]).filter(
    (row) =>
      !isMarkedDuplicate(row) &&
      isRecurring(row) &&
      Number(row.unit_amount_pence ?? 0) > 0,
  );
}

// ============================================================
// EXISTING BULK SCAN
// ============================================================

async function prepareAll(
  accountId: string,
) {
  const rows =
    await loadMigrationRows();

  const results: ScanResult[] =
    [];

  for (const row of rows) {
    results.push(
      await scanOne(
        row,
        accountId,
      ),
    );
  }

  const counts =
    results.reduce<
      Record<string, number>
    >(
      (acc, item) => {
        acc[item.result] =
          (acc[item.result] ?? 0) +
          1;

        return acc;
      },
      {},
    );

  return {
    scanned:
      results.length,

    summary: {
      totalRecords:
        results.length,

      stripeVerified:
        (counts.verified ?? 0) +
        (counts.already_verified ?? 0),

      duplicateRecords:
        counts.duplicate ?? 0,

      goCardless:
        counts.gocardless ?? 0,

      nonRecurring:
        counts.non_recurring ?? 0,

      unknownProvider:
        counts.unknown_provider ?? 0,

      noEmail:
        counts.no_email ?? 0,

      customerNotFound:
        counts.customer_not_found ?? 0,

      noPaymentMethod:
        counts.no_payment_method ?? 0,

      multipleCardCustomers:
        counts.multiple_card_customers ?? 0,

      alreadyLive:
        counts.already_live ?? 0,

      errors:
        counts.error ?? 0,
    },

    counts,

    review:
      results.filter(
        (item) =>
          ![
            "verified",
            "already_verified",
            "duplicate",
            "non_recurring",
            "gocardless",
            "already_live",
          ].includes(
            item.result,
          ),
      ),

    safety: {
      stripeSubscriptionsCreated:
        0,

      paymentsCollected:
        0,

      teamupBillingDisabled:
        0,

      totsCollectionEnabled:
        0,
    },
  };
}

// ============================================================
// FINISH PAYMENT PREPARATION
//
// SAFETY:
// - paid recurring memberships only
// - preserves already-prepared Stripe subscriptions
// - never turns payment history into a contractual Stripe renewal date
// - verifies/recover GoCardless mandates LIVE using existing IDs, curated
//   migration evidence, then exact-email unique-customer/unique-mandate lookup
// - does not create GoCardless debits during payment preparation
// - never charges now, disables TeamUp, or enables TOTS collection
// ============================================================

type GoCardlessExportEvidence = {
  customerId: string;
  mandateId: string;
  email: string;
  givenName: string;
  familyName: string;
  chargeDate: string;
  amountPence: number;
  status: string;
  description: string;
};

const GOCARDLESS_CURRENT_PAYMENT_EVIDENCE: GoCardlessExportEvidence[] =
[
  {
    "customerId": "CU0052RKJ0Q0X2",
    "mandateId": "MD003R3HNPQW4V",
    "email": "jen_brown20.05@icloud.com",
    "givenName": "Jennifer",
    "familyName": "Brown",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01KCHV8MKZVS",
    "mandateId": "MD01K9C3MYNMKG",
    "email": "jennifer.m.clarke4@gmail.com",
    "givenName": "Jennifer",
    "familyName": "Clarke",
    "chargeDate": "2026-09-10",
    "amountPence": 4900,
    "status": "paid_out",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MCXX1V7WEK3BD0VG0ZHQ41TS",
    "mandateId": "MD01M2FBZ9CDSS7P61CQDDWSS6RZ",
    "email": "l_mackay@hotmail.co.uk",
    "givenName": "Laura",
    "familyName": "Downie",
    "chargeDate": "2026-09-30",
    "amountPence": 7000,
    "status": "submitted",
    "description": "Membership Payment: 4 Per Week"
  },
  {
    "customerId": "CU0057AP0KX0TM",
    "mandateId": "MD003TSPCA157S",
    "email": "abbey_emmett@yahoo.com",
    "givenName": "Abbey",
    "familyName": "Emmett",
    "chargeDate": "2026-09-30",
    "amountPence": 8900,
    "status": "submitted",
    "description": "Membership Payment: Unlimited membership"
  },
  {
    "customerId": "CU005FMNC31NP5",
    "mandateId": "MD0040058SWJW6",
    "email": "beccaxx_@hotmail.co.uk",
    "givenName": "Rebecca",
    "familyName": "Farquhar",
    "chargeDate": "2026-09-30",
    "amountPence": 8900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01M7SF44ZJJ3NMQABXT9X598ZB",
    "mandateId": "MD01KXAXXGY8XXM1ADMKJHNGEDWG",
    "email": "rpboyd@hotmail.co.uk",
    "givenName": "Rhiannon",
    "familyName": "Farquhar",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MDJVZNWWEEESYYQRDM7NVPSM",
    "mandateId": "MD01M34AS3EBXXJ024Q9N6P7G9AA",
    "email": "siobhanforde@hotmail.com",
    "givenName": "Siobhan",
    "familyName": "Forde",
    "chargeDate": "2026-09-30",
    "amountPence": 4500,
    "status": "submitted",
    "description": "Membership Payment: CrossFit Preteens"
  },
  {
    "customerId": "CU01M6X1J8F3DXY6CJT1VXSW86AW",
    "mandateId": "MD01KWEGDVHTV43KZBZ4TH3W602K",
    "email": "audrey.hilsden@hotmail.com",
    "givenName": "Audrey",
    "familyName": "Hilsden",
    "chargeDate": "2026-09-01",
    "amountPence": 4500,
    "status": "paid_out",
    "description": "Membership Payment: CrossFit Preteens"
  },
  {
    "customerId": "CU01KV589DBQ6H",
    "mandateId": "MD01KJ9CAGA89T",
    "email": "karina.kaluzna1994@gmail.com",
    "givenName": "Karina",
    "familyName": "Kaluzna",
    "chargeDate": "2026-09-30",
    "amountPence": 5900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01M4D99XFPXM2GTSMSCMA16H49",
    "mandateId": "MD01KSYRB8A3G7BPD6M5YV83SYSC",
    "email": "heatherjeankeddie@gmail.com",
    "givenName": "Heather",
    "familyName": "Keddie",
    "chargeDate": "2026-09-30",
    "amountPence": 6000,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MDGG5C4TB7B215TNPH5WJE81",
    "mandateId": "MD01M31Z04NAZBQDA92HY1EDQMSS",
    "email": "nyreelewis70@gmail.com",
    "givenName": "NYREE",
    "familyName": "LEWIS",
    "chargeDate": "2026-10-02",
    "amountPence": 5900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MCS2VA0B83P9PKRV420P3E79",
    "mandateId": "MD01M2AHVV96T4WG82D98BP527NN",
    "email": "deborah.luce83@gmail.com",
    "givenName": "Deborah",
    "familyName": "Luce",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01KGW1YQHAH3",
    "mandateId": "MD01KC2JV7E9F5",
    "email": "smears4@icloud.com",
    "givenName": "Stephen",
    "familyName": "Mears",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU005A017P3RM4",
    "mandateId": "MD003WDXMXPFKE",
    "email": "phil@philmitchell.net",
    "givenName": "Philip",
    "familyName": "Mitchell",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MDE1BRJ67MW4RHCMB7RWTWD9",
    "mandateId": "MD01M2ZG608D52A43K0Z819DPNRD",
    "email": "natalie_munro@sky.com",
    "givenName": "Natalie",
    "familyName": "Munro",
    "chargeDate": "2026-09-30",
    "amountPence": 5900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU003D5H03A5JS",
    "mandateId": "MD002R0A87VJHA",
    "email": "planetjo@hotmail.com",
    "givenName": "Joanne",
    "familyName": "Napier",
    "chargeDate": "2026-09-30",
    "amountPence": 5500,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU005DCE7TPZ1D",
    "mandateId": "MD003YJT9T0CGD",
    "email": "hsu80f@hotmail.co.uk",
    "givenName": "Charlotte",
    "familyName": "Owens",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MCPP8RMHGNR8WC7BPDMZHZAV",
    "mandateId": "MD01M2852YXYXCWRV04QZPD22NG1",
    "email": "trishka@hotmail.co.uk",
    "givenName": "Trisha",
    "familyName": "Riddell",
    "chargeDate": "2026-09-30",
    "amountPence": 9900,
    "status": "submitted",
    "description": "Membership Payment: Couples 3x"
  },
  {
    "customerId": "CU01MBSTKR9ETP3RP455VP7FXV0W",
    "mandateId": "MD01M1B9E4YKP0TPMC30JBGSS9YB",
    "email": "stefanie.stewart1412@gmail.com",
    "givenName": "Stefanie",
    "familyName": "Stewart",
    "chargeDate": "2026-09-30",
    "amountPence": 7900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01MBV5RVFCP7P4YSYT6YX484KY",
    "mandateId": "MD01M1CMJJFW13F1XC3ZWWW4E0GK",
    "email": "craigstrathdee99@outlook.com",
    "givenName": "Craig",
    "familyName": "Strathdee",
    "chargeDate": "2026-09-30",
    "amountPence": 4900,
    "status": "submitted",
    "description": "Membership Payment: Offshore special"
  },
  {
    "customerId": "CU005HR9CCAPB0",
    "mandateId": "MD0041CGRNYYKR",
    "email": "rachel.swinglehurst@hotmail.com",
    "givenName": "Rachel",
    "familyName": "Swinglehurst-Hewkin",
    "chargeDate": "2026-09-30",
    "amountPence": 5900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU003J4VAW0RT4",
    "mandateId": "MD002TRWVDC7GV",
    "email": "yasmintodd93@hotmail.com",
    "givenName": "Yasmin",
    "familyName": "Todd",
    "chargeDate": "2026-09-30",
    "amountPence": 4900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01K7JX1MDJYX",
    "mandateId": "MD01K6551GSHKQ",
    "email": "hweir84@gmail.com",
    "givenName": "Holly",
    "familyName": "Weir",
    "chargeDate": "2026-09-30",
    "amountPence": 6900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  },
  {
    "customerId": "CU01M6697NGKN58V457SMGFJM6SR",
    "mandateId": "MD01KVQR2K13F3PEXM9ZKW461ZTY",
    "email": "jamie.wilding1@hotmail.co.uk",
    "givenName": "Jamie",
    "familyName": "Wilding",
    "chargeDate": "2026-09-30",
    "amountPence": 2500,
    "status": "submitted",
    "description": "Membership Payment: CF Kids & Pre Teens \u2014 1 Per Week"
  },
  {
    "customerId": "CU0057VZWHW2B7",
    "mandateId": "MD003V49GM6QN1",
    "email": "sarahmac0787@googlemail.com",
    "givenName": "Sarah",
    "familyName": "Wu",
    "chargeDate": "2026-09-30",
    "amountPence": 5900,
    "status": "submitted",
    "description": "Membership Payment: 3 Per Week"
  }
] as GoCardlessExportEvidence[];

function isKnownAccessOnlyDependent(row: StoreSubscription) {
  const name = normaliseText(row.customer_name);
  const email = normaliseEmail(row.customer_email);
  const meta = metadata(row);

  if (
    name === "farrah-rose brodie" ||
    metadataBoolean(meta, [
      "access_only",
      "mtc_access_only",
      "dependent_access_only",
      "child_access_only",
    ])
  ) {
    return true;
  }

  // A missing email alone is NOT enough to classify a person as a child.
  // Keep this deliberately narrow so legitimate adult payers are not excluded.
  return false;
}

function normalisedPersonName(value: string | null | undefined) {
  return normaliseText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findGoCardlessEvidence(row: StoreSubscription) {
  const rowEmail = normaliseEmail(row.customer_email);
  const rowName = normalisedPersonName(row.customer_name);
  const rowAmount = Number(row.unit_amount_pence ?? 0);

  // Strongest match: an already-known GoCardless customer or mandate ID.
  const knownIds = [
    row.external_customer_id,
    row.external_mandate_id,
  ].filter(Boolean);

  const byId = GOCARDLESS_CURRENT_PAYMENT_EVIDENCE.find(
    (e) =>
      knownIds.includes(e.customerId) ||
      knownIds.includes(e.mandateId),
  );
  if (byId) return { evidence: byId, match: "existing_gc_id" as const };

  // Exact payer email + amount is safe enough to persist the exported IDs.
  const byEmailAndAmount = GOCARDLESS_CURRENT_PAYMENT_EVIDENCE.find(
    (e) =>
      Boolean(rowEmail) &&
      normaliseEmail(e.email) === rowEmail &&
      e.amountPence === rowAmount,
  );
  if (byEmailAndAmount) {
    return { evidence: byEmailAndAmount, match: "email_and_amount" as const };
  }

  // Exact email is still useful when TOTS contains a legacy price that differs.
  // We do not silently overwrite the TOTS recurring amount.
  const byEmail = GOCARDLESS_CURRENT_PAYMENT_EVIDENCE.find(
    (e) => Boolean(rowEmail) && normaliseEmail(e.email) === rowEmail,
  );
  if (byEmail) {
    return { evidence: byEmail, match: "email_only_amount_review" as const };
  }

  // Known payer/dependent relationships from the migration data.
  // These are explicit guards, not fuzzy name guessing.
  const relationshipMap: Record<string, string> = {
    "macaulay watson": "CU01MDJVZNWWEEESYYQRDM7NVPSM",
  };

  const mappedCustomerId = relationshipMap[rowName];
  if (mappedCustomerId) {
    const mapped = GOCARDLESS_CURRENT_PAYMENT_EVIDENCE.find(
      (e) => e.customerId === mappedCustomerId,
    );
    if (mapped) {
      return { evidence: mapped, match: "known_payer_relationship" as const };
    }
  }

  return null;
}

async function listAllGoCardlessCustomers() {
  const customers: GoCardlessCustomer[] = [];
  let after: string | null = null;

  // We deliberately page through the live creditor's customers and then do
  // an exact normalised-email match locally. This avoids fuzzy matching and
  // means a member is only auto-recovered when the live account is unambiguous.
  for (let page = 0; page < 50; page += 1) {
    const query = new URLSearchParams({ limit: "500" });
    if (after) query.set("after", after);

    const body = await goCardlessRequest<GoCardlessListResponse<GoCardlessCustomer>>(
      `/customers?${query.toString()}`,
    );

    const batch = body.customers ?? [];
    customers.push(...batch);

    const next = body.meta?.cursors?.after ?? null;
    if (!next || batch.length === 0 || next === after) break;
    after = next;
  }

  return customers;
}

async function listGoCardlessMandatesForCustomer(customerId: string) {
  const mandates: GoCardlessMandate[] = [];
  let after: string | null = null;

  for (let page = 0; page < 20; page += 1) {
    const query = new URLSearchParams({ customer: customerId, limit: "500" });
    if (after) query.set("after", after);

    const body = await goCardlessRequest<GoCardlessListResponse<GoCardlessMandate>>(
      `/mandates?${query.toString()}`,
    );

    const batch = body.mandates ?? [];
    mandates.push(...batch);

    const next = body.meta?.cursors?.after ?? null;
    if (!next || batch.length === 0 || next === after) break;
    after = next;
  }

  return mandates;
}

async function discoverLiveGoCardlessMandate(row: StoreSubscription) {
  const email = normaliseEmail(row.customer_email);
  if (!email) {
    return {
      status: "no_email" as const,
      customer: null,
      mandate: null,
      customerMatches: 0,
      activeMandates: 0,
    };
  }

  const customers = await listAllGoCardlessCustomers();
  const matches = customers.filter(
    (customer) => normaliseEmail(customer.email) === email,
  );

  if (matches.length !== 1) {
    return {
      status: matches.length === 0 ? "customer_not_found" as const : "multiple_customers" as const,
      customer: null,
      mandate: null,
      customerMatches: matches.length,
      activeMandates: 0,
    };
  }

  const customer = matches[0];
  const mandates = await listGoCardlessMandatesForCustomer(customer.id);
  const active = mandates.filter((mandate) => mandate.status === "active");

  if (active.length !== 1) {
    return {
      status: active.length === 0 ? "no_active_mandate" as const : "multiple_active_mandates" as const,
      customer,
      mandate: null,
      customerMatches: 1,
      activeMandates: active.length,
    };
  }

  return {
    status: "matched" as const,
    customer,
    mandate: active[0],
    customerMatches: 1,
    activeMandates: 1,
  };
}

async function persistGoCardlessEvidence(row: StoreSubscription) {
  const now = new Date().toISOString();

  // 1) Strongest path: the database already contains a mandate ID. Verify it
  // live, even if the historical export constant does not contain this member.
  if (looksLikeGoCardlessMandate(row.external_mandate_id)) {
    try {
      const mandate = await verifyLiveGoCardlessMandate(
        row.external_mandate_id!,
        looksLikeGoCardlessCustomerId(row.external_customer_id)
          ? row.external_customer_id
          : null,
      );
      const customerId = mandate.links?.customer ?? row.external_customer_id ?? null;
      const existingNext = row.next_payment_at;
      const nextPaymentAt = existingNext ?? next28thIso(mandate.next_possible_charge_date);

      const updated = await patchSubscription(row.id, {
        payment_provider: "gocardless",
        billing_provider: "gocardless",
        external_customer_id: customerId,
        external_mandate_id: mandate.id,
        processor_verification_status: "verified",
        processor_verified_at: now,
        next_payment_at: nextPaymentAt,
        collection_enabled: false,
        teamup_billing_active: true,
        metadata: {
          ...metadata(row),
          mtc_gocardless_api_verified: true,
          mtc_gocardless_api_verified_at: now,
          mtc_gocardless_mandate_status: mandate.status,
          mtc_gocardless_next_possible_charge_date: mandate.next_possible_charge_date ?? null,
          mtc_gocardless_recovery_method: "existing_mandate_id_live_api",
          mtc_defaulted_billing_day_to_28th: !existingNext,
        },
        migration_notes: appendMigrationNote(
          row,
          `GoCardless mandate ${mandate.id} verified LIVE via API${customerId ? ` for customer ${customerId}` : ""}. No debit/subscription created. TeamUp remains active; TOTS collection remains OFF.`,
        ),
      });

      return {
        result: "gocardless_mandate_verified" as const,
        row: updated,
        evidence: null,
        match: "existing_mandate_id_live_api" as const,
        mandateStatus: mandate.status,
      };
    } catch (error) {
      // Continue into export/live-email recovery. A stale stored ID must not
      // prevent recovery of the member's actual current mandate.
    }
  }

  // 2) Historical/current payment evidence already curated during migration.
  const match = findGoCardlessEvidence(row);
  if (match) {
    const { evidence, match: matchType } = match;
    try {
      const mandate = await verifyLiveGoCardlessMandate(
        evidence.mandateId,
        evidence.customerId,
      );

      const existingNext = row.next_payment_at;
      const nextPaymentAt = existingNext ?? next28thIso(mandate.next_possible_charge_date);
      const amountDiffers = evidence.amountPence !== Number(row.unit_amount_pence ?? 0);

      const updated = await patchSubscription(row.id, {
        payment_provider: "gocardless",
        billing_provider: "gocardless",
        external_customer_id: evidence.customerId,
        external_mandate_id: evidence.mandateId,
        processor_verification_status: "verified",
        processor_verified_at: now,
        next_payment_at: nextPaymentAt,
        last_payment_at: evidence.chargeDate,
        last_payment_amount_pence: evidence.amountPence,
        collection_enabled: false,
        teamup_billing_active: true,
        metadata: {
          ...metadata(row),
          mtc_gocardless_export_verified: true,
          mtc_gocardless_api_verified: true,
          mtc_gocardless_api_verified_at: now,
          mtc_gocardless_mandate_status: mandate.status,
          mtc_gocardless_next_possible_charge_date: mandate.next_possible_charge_date ?? null,
          mtc_gocardless_export_match: matchType,
          mtc_gocardless_export_customer_id: evidence.customerId,
          mtc_gocardless_export_mandate_id: evidence.mandateId,
          mtc_gocardless_export_charge_date: evidence.chargeDate,
          mtc_gocardless_export_amount_pence: evidence.amountPence,
          mtc_gocardless_export_status: evidence.status,
          mtc_gocardless_export_description: evidence.description,
          mtc_gocardless_amount_differs_from_current_membership: amountDiffers,
          mtc_gocardless_recovery_method: `export_${matchType}_live_api`,
          mtc_defaulted_billing_day_to_28th: !existingNext,
        },
        migration_notes: appendMigrationNote(
          row,
          `GoCardless mandate ${evidence.mandateId} verified LIVE via API for customer ${evidence.customerId}. ${existingNext ? "Existing billing date preserved." : `Missing billing date defaulted to ${nextPaymentAt.slice(0, 10)} (28th rule).`} No debit/subscription created. TeamUp remains active; TOTS collection remains OFF.`,
        ),
      });

      return {
        result: "gocardless_mandate_verified" as const,
        row: updated,
        evidence,
        match: matchType,
        mandateStatus: mandate.status,
      };
    } catch (error) {
      // Continue to exact-email live discovery rather than failing immediately.
    }
  }

  // 3) Exhaustive live recovery: exact email -> exactly one GC customer ->
  // exactly one ACTIVE mandate. Anything ambiguous remains unresolved.
  try {
    const discovered = await discoverLiveGoCardlessMandate(row);

    if (discovered.status === "matched" && discovered.customer && discovered.mandate) {
      const existingNext = row.next_payment_at;
      const nextPaymentAt = existingNext ?? next28thIso(discovered.mandate.next_possible_charge_date);

      const updated = await patchSubscription(row.id, {
        payment_provider: "gocardless",
        billing_provider: "gocardless",
        external_customer_id: discovered.customer.id,
        external_mandate_id: discovered.mandate.id,
        processor_verification_status: "verified",
        processor_verified_at: now,
        next_payment_at: nextPaymentAt,
        collection_enabled: false,
        teamup_billing_active: true,
        metadata: {
          ...metadata(row),
          mtc_gocardless_api_verified: true,
          mtc_gocardless_api_verified_at: now,
          mtc_gocardless_mandate_status: discovered.mandate.status,
          mtc_gocardless_next_possible_charge_date: discovered.mandate.next_possible_charge_date ?? null,
          mtc_gocardless_recovery_method: "exact_email_unique_customer_unique_active_mandate",
          mtc_gocardless_customer_matches: discovered.customerMatches,
          mtc_gocardless_active_mandates: discovered.activeMandates,
          mtc_defaulted_billing_day_to_28th: !existingNext,
        },
        migration_notes: appendMigrationNote(
          row,
          `Recovered existing GoCardless authority LIVE by exact email. Customer ${discovered.customer.id}; active mandate ${discovered.mandate.id}. No debit/subscription created. TeamUp remains active; TOTS collection remains OFF.`,
        ),
      });

      return {
        result: "gocardless_mandate_verified" as const,
        row: updated,
        evidence: null,
        match: "live_exact_email" as const,
        mandateStatus: discovered.mandate.status,
      };
    }

    const updated = await patchSubscription(row.id, {
      payment_provider: "gocardless",
      billing_provider: "gocardless",
      collection_enabled: false,
      teamup_billing_active: true,
      metadata: {
        ...metadata(row),
        mtc_gocardless_api_verified: false,
        mtc_gocardless_api_verification_failed_at: now,
        mtc_gocardless_recovery_method: "live_exact_email",
        mtc_gocardless_recovery_result: discovered.status,
        mtc_gocardless_customer_matches: discovered.customerMatches,
        mtc_gocardless_active_mandates: discovered.activeMandates,
      },
      migration_notes: appendMigrationNote(
        row,
        `GoCardless live recovery unresolved (${discovered.status}). No payment authority was invented; member remains active in TeamUp and TOTS collection remains OFF.`,
      ),
    });

    return {
      result: "gocardless_mandate_missing" as const,
      row: updated,
      evidence: match?.evidence ?? null,
      match: match?.match ?? null,
      recoveryStatus: discovered.status,
    };
  } catch (error) {
    const updated = await patchSubscription(row.id, {
      payment_provider: "gocardless",
      billing_provider: "gocardless",
      collection_enabled: false,
      teamup_billing_active: true,
      metadata: {
        ...metadata(row),
        mtc_gocardless_api_verified: false,
        mtc_gocardless_api_verification_failed_at: now,
        mtc_gocardless_api_verification_error:
          error instanceof Error ? error.message : "Unknown GoCardless verification error",
      },
    });

    return {
      result: "gocardless_mandate_missing" as const,
      row: updated,
      evidence: match?.evidence ?? null,
      match: match?.match ?? null,
      recoveryStatus: "api_error" as const,
    };
  }
}

function approvedMigrationBillingDate(
  row: StoreSubscription,
  proposedDate: string | null,
) {
  // Migration approval: use an existing legitimate proposal when available.
  // If none exists, the operator has explicitly approved the next upcoming
  // 28th as the migration fallback. This only schedules a future first charge;
  // it does not enable collection or stop TeamUp.
  void row;

  if (!proposedDate) {
    const now = new Date();
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth();
    let candidate = new Date(Date.UTC(year, month, 28, 12, 0, 0));
    if (candidate.getTime() <= now.getTime() + 30 * 60 * 1000) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      candidate = new Date(Date.UTC(year, month, 28, 12, 0, 0));
    }
    return candidate.toISOString();
  }

  const parsed = new Date(proposedDate);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getTime() <= Date.now() + 30 * 60 * 1000
  ) {
    return null;
  }

  return parsed.toISOString();
}

function finishDuplicateKey(row: StoreSubscription) {
  const name = normalisedPersonName(row.customer_name);
  const email = normaliseEmail(row.customer_email);
  const membership = normaliseText(row.legacy_membership_name);
  const amount = Number(row.unit_amount_pence ?? 0);
  const interval = normaliseText(row.billing_interval);

  // Deliberately conservative. We only collapse rows that describe the same
  // person AND the same paid membership obligation. Shared family emails alone
  // are never enough to combine records.
  if (!name || !membership || amount <= 0 || !interval) return null;

  return [
    name,
    email || "no-email",
    membership,
    String(amount),
    interval,
  ].join("|");
}

async function canonicaliseFinishDuplicates(rows: StoreSubscription[]) {
  const groups = new Map<string, StoreSubscription[]>();
  const passthrough: StoreSubscription[] = [];

  for (const row of rows) {
    const key = finishDuplicateKey(row);
    if (!key) {
      passthrough.push(row);
      continue;
    }

    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const canonicalRows: StoreSubscription[] = [...passthrough];
  const duplicateRows: StoreSubscription[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      canonicalRows.push(group[0]);
      continue;
    }

    const canonical = chooseBestCanonical(group);
    canonicalRows.push(canonical);

    for (const duplicate of group) {
      if (duplicate.id === canonical.id) continue;

      // Never destroy/cancel anything in Stripe or GoCardless here. This only
      // marks the redundant TOTS legacy row so it can never collect separately.
      const now = new Date().toISOString();
      const updated = await patchSubscription(duplicate.id, {
        collection_enabled: false,
        metadata: {
          ...metadata(duplicate),
          mtc_redundant_duplicate: true,
          mtc_duplicate_record: true,
          mtc_duplicate_of_subscription_id: canonical.id,
          mtc_duplicate_marked_at: now,
          mtc_duplicate_marked_by: "finish_payment_preparation",
        },
        migration_notes: appendMigrationNote(
          duplicate,
          `DO NOT COLLECT: duplicate legacy billing record. Canonical subscription: ${canonical.id}.`,
        ),
      });

      duplicateRows.push(updated);
    }
  }

  return { canonicalRows, duplicateRows };
}

function storedProposedBillingDate(row: StoreSubscription) {
  const value = metadata(row).mtc_proposed_next_payment_at;
  if (typeof value !== "string" || !value) return null;

  const parsed = new Date(value);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getTime() <= Date.now() + 30 * 60 * 1000
  ) {
    return null;
  }

  return parsed.toISOString();
}

async function finaliseApprovedProposedBillingDate(row: StoreSubscription) {
  if (row.next_payment_at) {
    const existing = new Date(row.next_payment_at);
    if (
      !Number.isNaN(existing.getTime()) &&
      existing.getTime() > Date.now() + 30 * 60 * 1000
    ) {
      return { row, finalised: false, date: existing.toISOString() };
    }
  }

  let proposedDate = storedProposedBillingDate(row);
  let confidence = String(
    metadata(row).mtc_next_payment_confidence ?? "existing_proposal",
  );

  if (!proposedDate) {
    const source = await getMigrationSource(row);
    const proposal = inferNextPaymentAt(row, source);
    proposedDate = approvedMigrationBillingDate(row, proposal.date);
    confidence = proposal.confidence;
  }

  if (!proposedDate) {
    return { row, finalised: false, date: null };
  }

  const now = new Date().toISOString();
  const updated = await patchSubscription(row.id, {
    next_payment_at: proposedDate,
    metadata: {
      ...metadata(row),
      mtc_proposed_next_payment_at: proposedDate,
      mtc_next_payment_confidence: confidence,
      mtc_next_payment_requires_confirmation: false,
      mtc_next_payment_finalised_from_proposal: true,
      mtc_next_payment_finalised_at: now,
      mtc_next_payment_finalised_source: "migration_approval",
    },
    migration_notes: appendMigrationNote(
      row,
      `Existing proposed billing date ${proposedDate} finalised under migration approval. No fallback billing date was invented. TeamUp remains active and TOTS collection remains OFF until cutover.`,
    ),
  });

  return { row: updated, finalised: true, date: proposedDate };
}

async function finishPaymentPreparation(accountId: string) {
  // IMPORTANT: migration flags were already flipped on earlier runs, so they
  // cannot define the remaining population. Reconcile from the complete MTC
  // subscription register, then canonicalise/exclude non-recurring rows below.
  const allRows = await loadAllOrganisationSubscriptionRows();

  const alreadyMarkedDuplicate = allRows.filter((row) => isMarkedDuplicate(row));
  const initiallyEligible = allRows.filter((row) => !isMarkedDuplicate(row));

  // First combine exact duplicate paid obligations into one canonical TOTS row.
  // This is non-destructive: redundant rows are marked DO NOT COLLECT.
  const { canonicalRows, duplicateRows } =
    await canonicaliseFinishDuplicates(initiallyEligible);

  const accessOnly = canonicalRows.filter((row) => isKnownAccessOnlyDependent(row));
  const nonRecurring = canonicalRows.filter(
    (row) =>
      !isKnownAccessOnlyDependent(row) &&
      (!isRecurring(row) || Number(row.unit_amount_pence ?? 0) <= 0),
  );

  const rows = canonicalRows.filter(
    (row) =>
      !isKnownAccessOnlyDependent(row) &&
      isRecurring(row) &&
      Number(row.unit_amount_pence ?? 0) > 0,
  );

  const results: Array<Record<string, unknown>> = [];
  let proposedDatesFinalised = 0;

  for (const original of rows) {
    try {
      let row = await loadSubscription(original.id);

      // A real prepared Stripe subscription is stronger evidence than a stale
      // legacy provider label/export row. This also prevents members such as
      // Natasha Douglas being incorrectly pushed into the GoCardless-missing
      // bucket when a prepared Stripe subscription already exists.
      const existingPrepared = await retrievePreparedStripeSubscription(
        row,
        accountId,
      );

      if (existingPrepared) {
        results.push({
          subscriptionId: row.id,
          customerName: row.customer_name,
          email: row.customer_email,
          membership: row.legacy_membership_name,
          amountPence: row.unit_amount_pence,
          provider: "stripe",
          result: "stripe_already_prepared",
          stripeSubscriptionId: existingPrepared.id,
          firstPaymentAt: row.next_payment_at,
        });
        continue;
      }

      // If no prepared Stripe subscription exists, use current GoCardless
      // evidence before falling back to the stored/detected provider.
      const gcEvidence = findGoCardlessEvidence(row);
      const detectedProvider = await detectProvider(row);
      const provider: Provider = gcEvidence ? "gocardless" : detectedProvider;

      if (provider === "gocardless") {
        const gc = await persistGoCardlessEvidence(row);
        results.push({
          subscriptionId: row.id,
          customerName: row.customer_name,
          email: row.customer_email,
          membership: row.legacy_membership_name,
          amountPence: row.unit_amount_pence,
          provider,
          result: gc.result,
          match: gc.match,
          externalCustomerId:
            gc.evidence?.customerId ?? row.external_customer_id ?? null,
          mandateId:
            gc.evidence?.mandateId ?? row.external_mandate_id ?? null,
          exportedChargeDate: gc.evidence?.chargeDate ?? null,
          exportedAmountPence: gc.evidence?.amountPence ?? null,
          exportedStatus: gc.evidence?.status ?? null,
        });
        continue;
      }

      if (provider !== "stripe") {
        results.push({
          subscriptionId: row.id,
          customerName: row.customer_name,
          email: row.customer_email,
          membership: row.legacy_membership_name,
          amountPence: row.unit_amount_pence,
          provider,
          result: "provider_review",
          reason: "Paid recurring membership provider could not be safely confirmed.",
        });
        continue;
      }

      const scan = await scanOne(row, accountId);
      row = await loadSubscription(row.id);

      // The operator has approved finalising legitimate dates that TOTS already
      // proposed. Reuse that exact proposal; never invent a 28th/fallback date.
      if (
        row.processor_verification_status === "verified" &&
        !row.next_payment_at
      ) {
        const finalised = await finaliseApprovedProposedBillingDate(row);
        row = finalised.row;
        if (finalised.finalised) proposedDatesFinalised += 1;
      }

      if (
        row.processor_verification_status === "verified" &&
        row.next_payment_at
      ) {
        const prepared = await prepareCutover(row, accountId);

        if (
          prepared.result === "prepared" ||
          prepared.result === "already_prepared"
        ) {
          results.push({
            subscriptionId: row.id,
            customerName: row.customer_name,
            email: row.customer_email,
            membership: row.legacy_membership_name,
            amountPence: row.unit_amount_pence,
            provider,
            result:
              prepared.result === "prepared"
                ? "stripe_prepared_now"
                : "stripe_already_prepared",
            stripeSubscriptionId: prepared.stripeSubscriptionId ?? null,
            firstPaymentAt: prepared.firstPaymentAt ?? row.next_payment_at,
          });
          continue;
        }
      }

      const fresh = await loadSubscription(row.id);
      const source = await getMigrationSource(fresh);
      const proposed = inferNextPaymentAt(fresh, source);

      let result: string = scan.result;
      let reason = scan.message ?? scan.result;

      if (
        fresh.processor_verification_status === "verified" &&
        !fresh.next_payment_at
      ) {
        result = "stripe_billing_date_missing";
        reason = proposed.date
          ? `A proposed date exists (${proposed.date}) but could not be safely finalised.`
          : "Payment method verified, but no legitimate proposed/confirmed next billing date is available.";
      }

      results.push({
        subscriptionId: fresh.id,
        customerName: fresh.customer_name,
        email: fresh.customer_email,
        membership: fresh.legacy_membership_name,
        amountPence: fresh.unit_amount_pence,
        provider,
        result,
        reason,
        proposedNextPaymentAt: proposed.date ?? null,
        candidates: scan.candidates ?? null,
        cardReadyCandidates: scan.cardReadyCandidates ?? null,
      });
    } catch (error) {
      results.push({
        subscriptionId: original.id,
        customerName: original.customer_name,
        email: original.customer_email,
        membership: original.legacy_membership_name,
        amountPence: original.unit_amount_pence,
        result: "error",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const count = (result: string) =>
    results.filter((item) => item.result === result).length;

  const stripeReady = results.filter((item) =>
    ["stripe_prepared_now", "stripe_already_prepared"].includes(
      String(item.result),
    ),
  );

  const goCardless = results.filter(
    (item) => String(item.provider) === "gocardless",
  );

  const gcVerified = goCardless.filter(
    (item) => item.result === "gocardless_mandate_verified",
  );

  // Only unresolved PAID RECURRING canonical obligations belong here.
  // £0/trials/packs/access-only/duplicate rows are intentionally absent.
  const exceptions = results.filter(
    (item) =>
      ![
        "stripe_prepared_now",
        "stripe_already_prepared",
        "gocardless_mandate_verified",
      ].includes(String(item.result)),
  );

  const unresolvedBreakdown = {
    noSafeStripeCustomer: count("customer_not_found"),
    noReusableCard: count("no_payment_method"),
    multipleStripeMatches: count("multiple_card_customers"),
    billingDateConfirmation: count("stripe_billing_date_missing"),
    noEmail: count("no_email"),
    errorsProviderReview:
      count("error") +
      count("provider_review") +
      count("unknown_provider"),
    goCardlessMandateMissing: count("gocardless_mandate_missing"),
  };

  const duplicateRowsExcluded =
    alreadyMarkedDuplicate.length + duplicateRows.length;

  return {
    // Current/clear fields.
    rawSubscriptionRows: allRows.length,
    recurringPaidMemberships: rows.length,
    excludedNonRecurring: nonRecurring.length,
    duplicatesHistoricalExcluded: duplicateRowsExcluded,
    duplicateRowsExcluded,
    duplicatesCombinedNow: duplicateRows.length,
    accessOnlyDependentsExcluded: accessOnly.length,

    stripeReadyForTomorrow: stripeReady.length,
    stripeAlreadyPrepared: count("stripe_already_prepared"),
    stripePreparedNow: count("stripe_prepared_now"),
    stripeDateConfirmationRequired: count("stripe_billing_date_missing"),
    stripeNoSafeCustomer: count("customer_not_found"),
    stripeNoPaymentMethod: count("no_payment_method"),
    stripeMultipleCustomers: count("multiple_card_customers"),
    stripeNoEmail: count("no_email"),

    goCardlessRecurring: goCardless.length,
    goCardlessVerifiedMandates: gcVerified.length,
    goCardlessMandateMissing: count("gocardless_mandate_missing"),
    goCardlessAmountReview: count("gocardless_amount_review"),

    unknownProvider: count("provider_review") + count("unknown_provider"),
    errors: count("error"),
    unresolved: exceptions.length,
    unresolvedBreakdown,

    // Compatibility aliases used by the existing Store UI.
    paidRecurringMemberships: rows.length,
    stripeReady: stripeReady.length,
    goCardlessVerified: gcVerified,
    goCardless,
    exceptions,
    membersStillRequiringAction: exceptions,

    duplicateRows: duplicateRows.map((row) => ({
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,
      membership: row.legacy_membership_name,
      result: "duplicate_excluded",
      canonicalSubscriptionId:
        metadata(row).mtc_duplicate_of_subscription_id ?? null,
    })),

    excluded: {
      nonRecurring: nonRecurring.map((row) => ({
        subscriptionId: row.id,
        customerName: row.customer_name,
        membership: row.legacy_membership_name,
        amountPence: row.unit_amount_pence,
        result: "non_recurring_excluded",
      })),
      accessOnlyDependents: accessOnly.map((row) => ({
        subscriptionId: row.id,
        customerName: row.customer_name,
        membership: row.legacy_membership_name,
        result: "access_only_dependent_excluded",
      })),
    },

    safety: {
      paymentsCollected: 0,
      goCardlessDebitsCreated: 0,
      teamupBillingDisabled: 0,
      totsCollectionEnabled: 0,
      proposedStripeDatesFinalised: proposedDatesFinalised,
      fallbackStripeDatesInvented: 0,
      existingPreparedSubscriptionsPreserved: true,
    },
  };
}

// ============================================================
// EXISTING BULK PREPARE CUTOVER
// ============================================================

async function prepareCutoverAll(
  accountId: string,
) {
  const rows =
    await loadPreparedCutoverRows();

  const results:
    PrepareCutoverResult[] =
    [];

  for (const row of rows) {
    results.push(
      await prepareCutover(
        row,
        accountId,
      ),
    );
  }

  const prepared =
    results.filter(
      (x) =>
        x.result ===
        "prepared",
    ).length;

  const alreadyPrepared =
    results.filter(
      (x) =>
        x.result ===
        "already_prepared",
    ).length;

  const skipped =
    results.filter(
      (x) =>
        x.result ===
        "skipped",
    ).length;

  const errors =
    results.filter(
      (x) =>
        x.result ===
        "error",
    );

  return {
    attempted:
      results.length,

    prepared,

    alreadyPrepared,

    totalPrepared:
      prepared +
      alreadyPrepared,

    skipped,

    errors:
      errors.length,

    failures:
      errors,

    safety: {
      stripeSubscriptionsPrepared:
        prepared,

      teamupBillingDisabled:
        0,

      totsCollectionEnabled:
        0,

      immediateMigrationChargesRequested:
        0,
    },
  };
}

// ============================================================
// FALLBACK SETUP
// ============================================================

async function createFallbackSetup(
  row: StoreSubscription,
  accountId: string,
) {
  const provider =
    await detectProvider(row);

  if (provider !== "stripe") {
    throw new Error(
      provider === "gocardless"
        ? "This member uses GoCardless, not Stripe."
        : "Billing provider could not be safely identified as Stripe.",
    );
  }

  if (!isRecurring(row)) {
    throw new Error(
      "This membership does not require recurring billing.",
    );
  }

  if (
    row.collection_enabled
  ) {
    throw new Error(
      "TOTS collection is already enabled.",
    );
  }

  const selection =
    await selectSafeCustomer(
      row,
      accountId,
    );

  if (
    selection.status ===
    "matched"
  ) {
    return {
      automatic: true,

      result:
        await scanOne(
          row,
          accountId,
        ),

      url: null,
    };
  }

  if (
    selection.status ===
    "multiple_card_customers"
  ) {
    throw new Error(
      "Multiple Stripe customers with reusable cards match this member.",
    );
  }

  let customer:
    Stripe.Customer;

  if (
    selection.status ===
      "no_payment_method" &&
    selection.candidates.length ===
      1
  ) {
    customer =
      selection
        .candidates[0]
        .customer;
  } else if (
    selection.status ===
    "customer_not_found"
  ) {
    customer =
      await stripe.customers.create(
        {
          email:
            row.customer_email ??
            undefined,

          name:
            row.customer_name ??
            undefined,

          metadata: {
            tots_store_subscription_id:
              row.id,

            mtc_payment_setup_fallback:
              "true",
          },
        },
        {
          stripeAccount:
            accountId,

          idempotencyKey:
            `mtc-fallback-customer-${row.id}`,
        },
      );
  } else {
    throw new Error(
      "Manual review is required before payment setup.",
    );
  }

  const appUrl =
    process.env
      .NEXT_PUBLIC_APP_URL ??
    process.env
      .NEXT_PUBLIC_SITE_URL;

  if (!appUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL",
    );
  }

  const session =
    await stripe.checkout.sessions.create(
      {
        mode: "setup",

        customer:
          customer.id,

        payment_method_types: [
          "card",
        ],

        success_url:
          `${appUrl}/store?payment_setup=success`,

        cancel_url:
          `${appUrl}/store?payment_setup=cancelled`,

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration:
            "true",
        },

        setup_intent_data: {
          metadata: {
            tots_store_subscription_id:
              row.id,

            mtc_migration:
              "true",
          },
        },
      },
      {
        stripeAccount:
          accountId,

        idempotencyKey:
          `mtc-fallback-setup-${row.id}-${Math.floor(
            Date.now() /
              (30 * 60 * 1000),
          )}`,
      },
    );

  await patchSubscription(
    row.id,
    {
      stripe_account_id:
        accountId,

      stripe_customer_id:
        customer.id,

      payment_provider:
        "stripe",

      billing_provider:
        "stripe",

      cutover_status:
        "awaiting_processor",

      collection_enabled:
        false,

      teamup_billing_active:
        true,

      metadata: {
        ...metadata(row),

        mtc_migration_setup_session_id:
          session.id,

        mtc_migration_setup_created_at:
          new Date().toISOString(),
      },

      migration_notes:
        appendMigrationNote(
          row,
          "Fallback Stripe card setup requested. TeamUp remains active. TOTS collection remains OFF.",
        ),
    },
  );

  return {
    automatic: false,
    url: session.url,

    safety: {
      paymentCollected:
        false,

      subscriptionCreated:
        false,

      teamupBillingDisabled:
        false,

      collectionEnabled:
        false,
    },
  };
}

// ============================================================
// VERIFY FALLBACK
// ============================================================

async function verifyFallbackSetup(
  row: StoreSubscription,
  accountId: string,
) {
  const automatic =
    await scanOne(
      row,
      accountId,
    );

  if (
    automatic.result ===
      "verified" ||
    automatic.result ===
      "already_verified"
  ) {
    return automatic;
  }

  const meta =
    metadata(row);

  const sessionId =
    typeof meta
      .mtc_migration_setup_session_id ===
    "string"
      ? meta
          .mtc_migration_setup_session_id
      : null;

  if (!sessionId) {
    throw new Error(
      "No Stripe payment setup session exists.",
    );
  }

  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: [
          "setup_intent",
        ],
      },
      {
        stripeAccount:
          accountId,
      },
    );

  if (
    session.status !==
    "complete"
  ) {
    throw new Error(
      "The member has not completed payment setup.",
    );
  }

  const setupIntent =
    session.setup_intent;

  if (
    !setupIntent ||
    typeof setupIntent ===
      "string"
  ) {
    throw new Error(
      "Stripe SetupIntent could not be loaded.",
    );
  }

  if (
    setupIntent.status !==
    "succeeded"
  ) {
    throw new Error(
      `Stripe payment setup is ${setupIntent.status}.`,
    );
  }

  const paymentMethodId =
    typeof setupIntent
      .payment_method ===
    "string"
      ? setupIntent
          .payment_method
      : setupIntent
          .payment_method?.id;

  const customerId =
    typeof session.customer ===
    "string"
      ? session.customer
      : session.customer?.id;

  if (
    !paymentMethodId ||
    !customerId
  ) {
    throw new Error(
      "Stripe customer/payment method missing.",
    );
  }

  await stripe.customers.update(
    customerId,
    {
      invoice_settings: {
        default_payment_method:
          paymentMethodId,
      },
    },
    {
      stripeAccount:
        accountId,
    },
  );

  const now =
    new Date().toISOString();

  return await patchSubscription(
    row.id,
    {
      stripe_account_id:
        accountId,

      stripe_customer_id:
        customerId,

      payment_provider:
        "stripe",

      billing_provider:
        "stripe",

      processor_verification_status:
        "verified",

      processor_verified_at:
        now,

      cutover_status:
        "verified",

      collection_enabled:
        false,

      teamup_billing_active:
        true,

      metadata: {
        ...meta,

        mtc_verified_payment_method_id:
          paymentMethodId,

        mtc_payment_method_verified_at:
          now,
      },

      migration_notes:
        appendMigrationNote(
          row,
          "Stripe payment method verified. TeamUp remains active. TOTS collection remains OFF.",
        ),
    },
  );
}

// ============================================================
// TEAMUP STOP CONFIRMATION
// ============================================================

async function markTeamupStopped(
  row: StoreSubscription,
  accountId: string,
) {
  if (isMarkedDuplicate(row)) throw new Error("REFUSED: duplicate record.");
  if (row.processor_verification_status !== "verified") {
    throw new Error("Payment method/mandate must be verified first.");
  }
  if (row.collection_enabled) throw new Error("TOTS is already collecting.");

  const provider = await detectProvider(row);
  let nextPaymentAt = row.next_payment_at;

  if (provider === "gocardless") {
    if (!row.external_mandate_id) throw new Error("REFUSED: GoCardless mandate is missing.");
    const mandate = await verifyLiveGoCardlessMandate(
      row.external_mandate_id,
      row.external_customer_id,
    );
    if (!nextPaymentAt) nextPaymentAt = next28thIso(mandate.next_possible_charge_date);
  } else {
    if (!nextPaymentAt) throw new Error("next_payment_at must be confirmed.");
    const prepared = await retrievePreparedStripeSubscription(row, accountId);
    if (!prepared) {
      throw new Error("REFUSED: replacement Stripe subscription has not been prepared/verified yet.");
    }
  }

  const now = new Date().toISOString();
  const updated = await patchSubscription(row.id, {
    next_payment_at: nextPaymentAt,
    teamup_billing_active: false,
    teamup_billing_disabled_at: now,
    cutover_status: "ready",
    collection_enabled: false,
    metadata: {
      ...metadata(row),
      mtc_teamup_stop_confirmed_at: now,
      mtc_teamup_stop_confirmed_manually: true,
      mtc_cutover_provider: provider,
    },
    migration_notes: appendMigrationNote(
      row,
      provider === "gocardless"
        ? "TeamUp billing confirmed stopped externally. Live GoCardless mandate re-verified. TOTS is ready to create the replacement GoCardless subscription."
        : "TeamUp billing confirmed stopped externally. Replacement Stripe subscription already exists. TOTS is ready to go live.",
    ),
  });

  return {
    subscription: updated,
    provider,
    warning: "This records the external TeamUp stop. It does NOT contact TeamUp itself.",
  };
}

// ============================================================
// ACTIVATE
// ============================================================

async function activate(
  row: StoreSubscription,
  accountId: string,
) {
  if (row.collection_enabled) return { subscription: row, alreadyLive: true };
  if (row.teamup_billing_active) throw new Error("REFUSED: TeamUp billing is still marked active.");
  if (row.cutover_status !== "ready") {
    throw new Error(`REFUSED: cutover_status is ${row.cutover_status}; expected ready.`);
  }
  if (row.processor_verification_status !== "verified") {
    throw new Error("REFUSED: payment method/mandate is not verified.");
  }
  if (isMarkedDuplicate(row)) throw new Error("REFUSED: duplicate migration record.");

  const provider = await detectProvider(row);
  const activatedAt = new Date().toISOString();

  if (provider === "gocardless") {
    if (row.external_subscription_id?.startsWith("SB")) {
      const existing = await goCardlessRequest<{ subscriptions: GoCardlessSubscription }>(
        `/subscriptions/${encodeURIComponent(row.external_subscription_id)}`,
      );
      const updated = await patchSubscription(row.id, {
        status: existing.subscriptions.status,
        legacy_billing: false,
        collection_enabled: true,
        collection_enabled_at: row.collection_enabled_at ?? activatedAt,
        teamup_billing_active: false,
        cutover_status: "live",
      });
      return { subscription: updated, goCardless: existing.subscriptions, alreadyLive: true };
    }

    const created = await createGoCardlessSubscription(row);
    const gcSub = created.subscription;
    const firstPayment = gcSub.upcoming_payments?.[0]?.charge_date ?? gcSub.start_date;

    const updated = await patchSubscription(row.id, {
      external_subscription_id: gcSub.id,
      status: gcSub.status,
      legacy_billing: false,
      collection_enabled: true,
      collection_enabled_at: activatedAt,
      teamup_billing_active: false,
      cutover_status: "live",
      processor_verification_status: "verified",
      next_payment_at: `${firstPayment}T12:00:00.000Z`,
      metadata: {
        ...metadata(row),
        mtc_live_subscription_id: gcSub.id,
        mtc_gocardless_subscription_id: gcSub.id,
        mtc_activation_at: activatedAt,
        mtc_first_tots_payment_at: firstPayment,
        mtc_cutover_complete: true,
      },
      migration_notes: appendMigrationNote(
        row,
        `TOTS GoCardless billing is now live using existing mandate ${row.external_mandate_id} and subscription ${gcSub.id}. First scheduled charge date: ${firstPayment}.`,
      ),
    });

    return { subscription: updated, goCardless: gcSub };
  }

  const subscription = await retrievePreparedStripeSubscription(row, accountId);
  if (!subscription) throw new Error("REFUSED: prepared Stripe subscription is missing or unusable.");
  if (!row.next_payment_at) throw new Error("REFUSED: next_payment_at is missing.");

  const nextPayment = new Date(row.next_payment_at);
  if (Number.isNaN(nextPayment.getTime())) throw new Error("REFUSED: next_payment_at is invalid.");

  const updated = await patchSubscription(row.id, {
    stripe_subscription_id: subscription.id,
    external_subscription_id: subscription.id,
    status: subscription.status,
    legacy_billing: false,
    collection_enabled: true,
    collection_enabled_at: activatedAt,
    teamup_billing_active: false,
    cutover_status: "live",
    processor_verification_status: "verified",
    metadata: {
      ...metadata(row),
      mtc_live_subscription_id: subscription.id,
      mtc_activation_at: activatedAt,
      mtc_first_tots_payment_at: nextPayment.toISOString(),
      mtc_cutover_complete: true,
    },
    migration_notes: appendMigrationNote(
      row,
      `TOTS Stripe billing is now live using prepared Stripe subscription ${subscription.id}. First intended billing date: ${nextPayment.toISOString()}.`,
    ),
  });

  return {
    subscription: updated,
    stripe: {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      firstPaymentAt: nextPayment.toISOString(),
    },
  };
}

// ============================================================
// ACTIVATE ALL
// ============================================================

async function activateAll(
  accountId: string,
) {
  const { data, error } =
    await admin
      .from(
        "store_subscriptions",
      )
      .select("*")
      .eq(
        "organisation_id",
        ORGANISATION_ID,
      )
      .eq(
        "cutover_status",
        "ready",
      )
      .eq(
        "teamup_billing_active",
        false,
      )
      .eq(
        "collection_enabled",
        false,
      )
      .eq(
        "processor_verification_status",
        "verified",
      )
      .order(
        "customer_name",
        {
          ascending: true,
        },
      );

  if (error) throw error;

  const rows =
    (
      (data ?? []) as StoreSubscription[]
    ).filter(
      (row) =>
        !isMarkedDuplicate(row),
    );

  const successes: Array<{
    id: string;
    name: string | null;
    stripeSubscriptionId:
      string | null;
  }> = [];

  const failures: Array<{
    id: string;
    name: string | null;
    error: string;
  }> = [];

  for (const row of rows) {
    try {
      const result =
        await activate(
          row,
          accountId,
        );

      successes.push({
        id:
          row.id,

        name:
          row.customer_name,

        stripeSubscriptionId:
          result.subscription
            .stripe_subscription_id,
      });
    } catch (error) {
      failures.push({
        id:
          row.id,

        name:
          row.customer_name,

        error:
          error instanceof Error
            ? error.message
            : "Unknown activation error.",
      });
    }
  }

  return {
    attempted:
      rows.length,

    activated:
      successes.length,

    failed:
      failures.length,

    successes,

    failures,
  };
}

// ============================================================
// COMPLETE MIGRATION + FULL REPORT
// ============================================================

async function completeMigration(accountId: string) {
  const allRows = await loadAllStoreSubscriptions();

  // First collapse only conservative, exact duplicate billing obligations.
  // This prevents the legacy TeamUp row and its already-live TOTS row from
  // both being processed. Shared family emails alone are never deduplicated.
  const initiallyEligible = allRows.filter((row) => !isMarkedDuplicate(row));
  const { canonicalRows, duplicateRows } =
    await canonicaliseFinishDuplicates(initiallyEligible);

  const alreadyMarkedDuplicates = allRows.filter(isMarkedDuplicate);
  const rowsToProcess = canonicalRows;
  const results: Array<Record<string, unknown>> = [
    ...alreadyMarkedDuplicates.map((row) => ({
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,
      membership: row.legacy_membership_name,
      amountPence: row.unit_amount_pence,
      nextPaymentAt: row.next_payment_at,
      result: "duplicate_excluded",
      provider: "duplicate",
    })),
    ...duplicateRows.map((row) => ({
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,
      membership: row.legacy_membership_name,
      amountPence: row.unit_amount_pence,
      nextPaymentAt: row.next_payment_at,
      result: "duplicate_excluded",
      provider: "duplicate",
    })),
  ];

  for (const original of rowsToProcess) {
    let row = original;
    const base = {
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,
      membership: row.legacy_membership_name,
      amountPence: row.unit_amount_pence,
      nextPaymentAt: row.next_payment_at,
    };

    try {
      if (isMarkedDuplicate(row)) {
        if (row.collection_enabled) {
          row = await patchSubscription(row.id, { collection_enabled: false });
        }
        results.push({ ...base, result: "duplicate_excluded", provider: await detectProvider(row) });
        continue;
      }

      if (!isRecurring(row) || Number(row.unit_amount_pence ?? 0) <= 0) {
        if (row.collection_enabled) {
          row = await patchSubscription(row.id, {
            collection_enabled: false,
            collection_enabled_at: null,
            migration_notes: appendMigrationNote(
              row,
              "Final migration: non-recurring/access membership retained with recurring collection disabled.",
            ),
          });
        }
        results.push({ ...base, result: "non_recurring_access_migrated", provider: "none" });
        continue;
      }

      const provider = await detectProvider(row);

      // Reconcile processor authority instead of requiring the DB row to already
      // be marked verified. This is the key bulk-migration path for legacy rows.
      if (row.processor_verification_status !== "verified") {
        if (provider === "stripe") {
          const scan = await scanOne(row, accountId);

          if (scan.result === "already_live") {
            row = await loadSubscription(row.id);
          } else if (scan.result === "verified") {
            row = await loadSubscription(row.id);
          } else {
            results.push({
              ...base,
              provider,
              result: "broken_requires_manual_repair",
              reason:
                scan.result === "customer_not_found"
                  ? "No Stripe customer was found for this member."
                  : scan.result === "no_payment_method"
                    ? "Stripe customer found, but no reusable card is attached."
                    : scan.result === "multiple_card_customers"
                      ? "Multiple card-ready Stripe customers matched; refused to guess."
                      : scan.message ?? `Stripe reconciliation stopped: ${scan.result}`,
            });
            continue;
          }
        } else if (provider === "gocardless") {
          if (!row.external_mandate_id) {
            results.push({
              ...base,
              provider,
              result: "broken_requires_manual_repair",
              reason: "GoCardless mandate ID is missing.",
            });
            continue;
          }

          try {
            await verifyLiveGoCardlessMandate(
              row.external_mandate_id,
              row.external_customer_id,
            );
            row = await patchSubscription(row.id, {
              processor_verification_status: "verified",
              processor_verified_at: new Date().toISOString(),
              migration_notes: appendMigrationNote(
                row,
                "Final migration: GoCardless mandate verified directly with processor.",
              ),
            });
          } catch (error) {
            results.push({
              ...base,
              provider,
              result: "broken_requires_manual_repair",
              reason: error instanceof Error ? error.message : "GoCardless mandate verification failed.",
            });
            continue;
          }
        } else {
          results.push({
            ...base,
            provider,
            result: "broken_requires_manual_repair",
            reason: "Billing provider could not be safely identified.",
          });
          continue;
        }
      }

      // User-approved migration fallback: missing future renewal dates become the next 28th.
      if (!row.next_payment_at || new Date(row.next_payment_at).getTime() <= Date.now() + 30 * 60 * 1000) {
        row = await patchSubscription(row.id, {
          next_payment_at: next28thIso(),
          migration_notes: appendMigrationNote(
            row,
            `Final migration: missing/expired renewal date defaulted to ${next28thIso()}.`,
          ),
        });
      }

      if (provider === "stripe") {
        if (!row.stripe_customer_id) {
          results.push({ ...base, provider, result: "broken_requires_manual_repair", reason: "Stripe customer ID is missing." });
          continue;
        }

        const prepared = await prepareCutover(row, accountId);
        if (prepared.result === "error" || prepared.result === "skipped") {
          results.push({ ...base, provider, result: "broken_requires_manual_repair", reason: prepared.message ?? prepared.result });
          continue;
        }

        const fresh = await loadSubscription(row.id);
        const live = await patchSubscription(fresh.id, {
          collection_enabled: true,
          collection_enabled_at: fresh.collection_enabled_at ?? new Date().toISOString(),
          teamup_billing_active: false,
          teamup_billing_disabled_at: fresh.teamup_billing_disabled_at ?? new Date().toISOString(),
          cutover_status: "live",
          legacy_billing: false,
          migrated_from: fresh.migrated_from ?? "teamup",
          migrated_at: fresh.migrated_at ?? new Date().toISOString(),
          metadata: {
            ...metadata(fresh),
            mtc_cutover_complete: true,
            mtc_cutover_complete_at: new Date().toISOString(),
          },
        });

        results.push({
          ...base,
          provider,
          result: prepared.result === "already_prepared" ? "stripe_already_live" : "stripe_migrated",
          stripeCustomerId: live.stripe_customer_id,
          stripeSubscriptionId: live.stripe_subscription_id,
          stripePriceId: live.stripe_price_id,
          nextPaymentAt: live.next_payment_at,
        });
        continue;
      }

      if (provider === "gocardless") {
        if (!row.external_mandate_id) {
          results.push({ ...base, provider, result: "broken_requires_manual_repair", reason: "GoCardless mandate ID is missing." });
          continue;
        }

        await verifyLiveGoCardlessMandate(row.external_mandate_id, row.external_customer_id);

        let gcSubscription: GoCardlessSubscription;
        if (row.external_subscription_id?.startsWith("SB")) {
          const existing = await goCardlessRequest<{ subscriptions: GoCardlessSubscription }>(
            `/subscriptions/${encodeURIComponent(row.external_subscription_id)}`,
          );
          gcSubscription = existing.subscriptions;
        } else {
          const created = await createGoCardlessSubscription(row);
          gcSubscription = created.subscription;
        }

        const firstPayment = gcSubscription.upcoming_payments?.[0]?.charge_date ?? gcSubscription.start_date;
        const live = await patchSubscription(row.id, {
          external_subscription_id: gcSubscription.id,
          status: gcSubscription.status,
          legacy_billing: false,
          collection_enabled: true,
          collection_enabled_at: row.collection_enabled_at ?? new Date().toISOString(),
          teamup_billing_active: false,
          teamup_billing_disabled_at: row.teamup_billing_disabled_at ?? new Date().toISOString(),
          cutover_status: "live",
          processor_verification_status: "verified",
          next_payment_at: `${firstPayment}T12:00:00.000Z`,
          migrated_from: row.migrated_from ?? "teamup",
          migrated_at: row.migrated_at ?? new Date().toISOString(),
          metadata: {
            ...metadata(row),
            mtc_live_subscription_id: gcSubscription.id,
            mtc_gocardless_subscription_id: gcSubscription.id,
            mtc_cutover_complete: true,
            mtc_cutover_complete_at: new Date().toISOString(),
          },
          migration_notes: appendMigrationNote(
            row,
            `Final migration: GoCardless subscription ${gcSubscription.id} is live. First scheduled charge date: ${firstPayment}.`,
          ),
        });

        results.push({
          ...base,
          provider,
          result: "gocardless_migrated",
          goCardlessSubscriptionId: live.external_subscription_id,
          mandateId: live.external_mandate_id,
          nextPaymentAt: live.next_payment_at,
        });
        continue;
      }

      results.push({ ...base, provider, result: "broken_requires_manual_repair", reason: "Payment provider could not be confirmed." });
    } catch (error) {
      results.push({
        ...base,
        result: "broken_requires_manual_repair",
        reason: error instanceof Error ? error.message : "Unknown migration error",
      });
    }
  }

  const migrated = results.filter((r) => ["stripe_migrated", "stripe_already_live", "gocardless_migrated", "non_recurring_access_migrated"].includes(String(r.result)));
  const broken = results.filter((r) => r.result === "broken_requires_manual_repair");
  const duplicates = results.filter((r) => r.result === "duplicate_excluded");

  const unique = (items: Array<Record<string, unknown>>) =>
    new Set(items.map((r) => normaliseEmail(String(r.email ?? ""))).filter(Boolean)).size;

  return {
    completedAt: new Date().toISOString(),
    stripeAccountId: accountId,
    summary: {
      totalCanonicalRowsChecked: allRows.length,
      rowsSuccessfullyHandled: migrated.length,
      uniqueMembersSuccessfullyHandled: unique(migrated),
      stripeMigrated: results.filter((r) => ["stripe_migrated", "stripe_already_live"].includes(String(r.result))).length,
      goCardlessMigrated: results.filter((r) => r.result === "gocardless_migrated").length,
      nonRecurringAccessOnly: results.filter((r) => r.result === "non_recurring_access_migrated").length,
      duplicatesExcluded: duplicates.length,
      brokenRemaining: broken.length,
      brokenUniqueMembers: unique(broken),
    },
    moved: migrated,
    broken,
    duplicates,
    allResults: results,
    important: {
      teamupApiCancellationPerformed: false,
      note: "TOTS marks TeamUp billing inactive, but this route does not call TeamUp. Confirm/cancel legacy TeamUp billing externally to prevent duplicate collection.",
    },
  };
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest,
) {
  try {
    const user =
      await requireUser(req);

    const body =
      await req.json();

    const action =
      body?.action as
        | Action
        | undefined;

    const subscriptionId =
      typeof body
        ?.subscriptionId ===
      "string"
        ? body.subscriptionId
        : null;

    if (!action) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing action.",
        },
        {
          status: 400,
        },
      );
    }

    const { accountId } =
      await getConnectedAccount();

    // ========================================================
    // ONE BUTTON: COMPLETE EVERYTHING THAT CAN BE COMPLETED
    // ========================================================

    if (action === "complete_migration") {
      const result = await completeMigration(accountId);
      return NextResponse.json({
        ok: true,
        action: "complete_migration",
        ...result,
        performedBy: user.email ?? user.id,
      });
    }

    // ========================================================
    // ONE BUTTON:
    // GET ALL POSSIBLE MTC MEMBERS READY IN TOTS
    // ========================================================

    if (
      action ===
      "prepare_all_for_mtc_import"
    ) {
      const result =
        await prepareAllForMtcImport(
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "prepare_all_for_mtc_import",

        stripeAccountId:
          accountId,

        ...result,

        performedBy:
          user.email ??
          user.id,
      });
    }

    // ========================================================
    // FINISH ALL PAID RECURRING PAYMENT PREPARATION
    // ========================================================

    if (
      action ===
      "finish_payment_preparation"
    ) {
      // Reconcile the complete subscription register. Do not filter by
      // teamup_billing_active / collection_enabled here: earlier migration
      // runs already changed those flags, which caused the zero-member result.
      const result = await finishPaymentPreparation(accountId);

      return NextResponse.json({
        ok: true,
        action: "finish_payment_preparation",
        ...result,
        performedBy: user.email ?? user.id,
      });
    }

    // ========================================================
    // EXISTING BULK SCAN
    // ========================================================

    if (
      action === "scan" ||
      action === "prepare_all"
    ) {
      const result =
        await prepareAll(
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "prepare_all",

        stripeAccountId:
          accountId,

        ...result,

        performedBy:
          user.email ??
          user.id,
      });
    }

    // ========================================================
    // EXISTING BULK STRIPE PREP
    // ========================================================

    if (
      action ===
      "prepare_cutover_all"
    ) {
      const result = await completeMigration(accountId);

      return NextResponse.json({
        ok: true,
        action: "prepare_cutover_all",
        ...result,
        performedBy: user.email ?? user.id,
      });
    }

    // ========================================================
    // ACTIVATE ALL
    // ========================================================

    if (
      action ===
      "activate_all"
    ) {
      const result =
        await activateAll(
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "activate_all",

        stripeAccountId:
          accountId,

        ...result,

        performedBy:
          user.email ??
          user.id,
      });
    }

    // ========================================================
    // SINGLE RECORD REQUIRED BELOW
    // ========================================================

    if (!subscriptionId) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Missing subscriptionId.",
        },
        {
          status: 400,
        },
      );
    }

    const row =
      await loadSubscription(
        subscriptionId,
      );

    if (
      action === "scan_one"
    ) {
      const result =
        await scanOne(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "scan_one",

        result,

        safety: {
          paymentsCollected:
            0,

          subscriptionsCreated:
            0,

          teamupBillingDisabled:
            0,

          totsCollectionEnabled:
            0,
        },
      });
    }

    if (
      action ===
      "prepare_cutover"
    ) {
      const fresh =
        await loadSubscription(
          subscriptionId,
        );

      const result =
        await prepareCutover(
          fresh,
          accountId,
        );

      return NextResponse.json({
        ok:
          result.result !==
          "error",

        action:
          "prepare_cutover",

        result,
      });
    }

    if (
      action === "setup"
    ) {
      const result =
        await createFallbackSetup(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "setup",

        ...result,
      });
    }

    if (
      action === "verify"
    ) {
      const result =
        await verifyFallbackSetup(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "verify",

        result,
      });
    }

    if (
      action ===
      "teamup_stopped"
    ) {
      const fresh =
        await loadSubscription(
          subscriptionId,
        );

      const result =
        await markTeamupStopped(
          fresh,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "teamup_stopped",

        ...result,
      });
    }

    if (
      action ===
      "activate"
    ) {
      const fresh =
        await loadSubscription(
          subscriptionId,
        );

      const result =
        await activate(
          fresh,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "activate",

        ...result,
      });
    }

    return NextResponse.json(
      {
        ok: false,

        error:
          `Unknown action: ${action}`,
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "[TOTS BILLING MIGRATION]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown billing migration error.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status:
          message ===
          "Unauthorised"
            ? 401
            : 500,
      },
    );
  }
}