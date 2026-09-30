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
  | "activate_all";

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

  const explicit =
    providerFromText(
      row.payment_provider,
    ) ??
    providerFromText(
      row.billing_provider,
    );

  if (explicit) {
    return explicit;
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
  if (
    !row.unit_amount_pence ||
    row.unit_amount_pence <= 0 ||
    !row.billing_interval
  ) {
    throw new Error(
      "Recurring billing details are incomplete.",
    );
  }

  const expectedCurrency =
    (
      row.currency ??
      "gbp"
    ).toLowerCase();

  const expectedInterval =
    stripeInterval(
      row.billing_interval,
    );

  if (
    row.stripe_price_id
  ) {
    try {
      const price =
        await stripe.prices.retrieve(
          row.stripe_price_id,
          {},
          {
            stripeAccount:
              accountId,
          },
        );

      if (
        price.active &&
        price.unit_amount ===
          row.unit_amount_pence &&
        price.currency ===
          expectedCurrency &&
        price.recurring?.interval ===
          expectedInterval
      ) {
        return price;
      }
    } catch {
      // Create below.
    }
  }

  const product =
    await stripe.products.create(
      {
        name:
          row.legacy_membership_name ??
          "Moray Training Club Membership",

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration:
            "true",
        },
      },
      {
        stripeAccount:
          accountId,

        idempotencyKey:
          `mtc-product-${row.id}`,
      },
    );

  const price =
    await stripe.prices.create(
      {
        product:
          product.id,

        currency:
          expectedCurrency,

        unit_amount:
          row.unit_amount_pence,

        recurring: {
          interval:
            expectedInterval,
        },

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration:
            "true",
        },
      },
      {
        stripeAccount:
          accountId,

        idempotencyKey:
          `mtc-price-${row.id}`,
      },
    );

  await patchSubscription(
    row.id,
    {
      stripe_price_id:
        price.id,

      metadata: {
        ...metadata(row),

        mtc_migration_product_id:
          product.id,

        mtc_migration_price_id:
          price.id,
      },
    },
  );

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

    if (
      row.collection_enabled
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
          "TOTS collection is already enabled.",
      };
    }

    const existing =
      await retrievePreparedStripeSubscription(
        row,
        accountId,
      );

    if (existing) {
      await patchSubscription(
        row.id,
        {
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
      !row.teamup_billing_active
    ) {
      throw new Error(
        "TeamUp is already marked stopped.",
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
          false,

        collection_enabled_at:
          null,

        teamup_billing_active:
          true,

        teamup_billing_disabled_at:
          null,

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
            true,
        },

        migration_notes:
          appendMigrationNote(
            row,
            `Replacement Stripe subscription ${verified.id} prepared with first intended billing date ${nextPayment.toISOString()}. TeamUp remains active. TOTS collection remains OFF until TeamUp is stopped.`,
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
        "Replacement Stripe subscription prepared. No immediate membership charge requested.",
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
    .eq(
      "legacy_billing",
      true,
    )
    .eq(
      "collection_enabled",
      false,
    )
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

async function loadPreparedCutoverRows() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq(
      "organisation_id",
      ORGANISATION_ID,
    )
    .eq(
      "processor_verification_status",
      "verified",
    )
    .eq(
      "collection_enabled",
      false,
    )
    .eq(
      "teamup_billing_active",
      true,
    )
    .not(
      "next_payment_at",
      "is",
      null,
    )
    .order(
      "customer_name",
      {
        ascending: true,
      },
    );

  if (error) throw error;

  return (
    (data ?? []) as StoreSubscription[]
  ).filter(
    (row) =>
      !isMarkedDuplicate(row),
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
// Purpose:
// - paid recurring memberships only
// - preserve every already-prepared Stripe subscription
// - retry Stripe customer/payment-method reconciliation
// - auto-confirm an inferred renewal date ONLY when recent payment
//   history matches the recurring amount exactly
// - prepare the Stripe replacement subscription where safe
// - classify GoCardless separately
// - never charge now, never disable TeamUp, never enable collection
// ============================================================

function maxHistoryAgeMs(interval: string | null) {
  switch (normaliseText(interval)) {
    case "week":
      return 21 * 24 * 60 * 60 * 1000;
    case "month":
      return 62 * 24 * 60 * 60 * 1000;
    case "year":
      return 400 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

async function confirmNextPaymentFromExactHistory(
  row: StoreSubscription,
) {
  if (row.next_payment_at) {
    return {
      confirmed: true,
      date: row.next_payment_at,
      reason: "existing_confirmed_date",
    };
  }

  const source = await getMigrationSource(row);
  const lastPaymentAt = source?.last_payment_at ?? row.last_payment_at;
  const lastAmount = source?.last_payment_amount_pence ?? row.last_payment_amount_pence;
  const recurringAmount = row.unit_amount_pence;

  if (
    !lastPaymentAt ||
    !recurringAmount ||
    recurringAmount <= 0 ||
    !lastAmount ||
    lastAmount !== recurringAmount ||
    !row.billing_interval
  ) {
    return {
      confirmed: false,
      date: null,
      reason: "insufficient_exact_history",
    };
  }

  const last = new Date(lastPaymentAt);
  if (Number.isNaN(last.getTime())) {
    return {
      confirmed: false,
      date: null,
      reason: "invalid_last_payment_date",
    };
  }

  const maxAge = maxHistoryAgeMs(row.billing_interval);
  if (!maxAge || Date.now() - last.getTime() > maxAge) {
    return {
      confirmed: false,
      date: null,
      reason: "payment_history_too_old",
    };
  }

  const inferred = inferNextPaymentAt(row, source);
  if (!inferred.date || inferred.confidence !== "inferred_from_history") {
    return {
      confirmed: false,
      date: null,
      reason: "could_not_infer_next_date",
    };
  }

  const next = new Date(inferred.date);
  if (
    Number.isNaN(next.getTime()) ||
    next.getTime() <= Date.now() + 30 * 60 * 1000
  ) {
    return {
      confirmed: false,
      date: null,
      reason: "inferred_date_not_safely_future",
    };
  }

  const now = new Date().toISOString();
  await patchSubscription(row.id, {
    next_payment_at: next.toISOString(),
    metadata: {
      ...metadata(row),
      mtc_next_payment_auto_confirmed: true,
      mtc_next_payment_auto_confirmed_at: now,
      mtc_next_payment_auto_confirmed_from: "exact_recent_payment_history",
      mtc_next_payment_history_amount_pence: lastAmount,
      mtc_next_payment_history_at: lastPaymentAt,
    },
    migration_notes: appendMigrationNote(
      row,
      `Next billing date ${next.toISOString()} auto-confirmed from recent exact-amount payment history (${lastAmount}p). TeamUp remains active; TOTS collection remains OFF.`,
    ),
  });

  return {
    confirmed: true,
    date: next.toISOString(),
    reason: "exact_recent_payment_history",
  };
}

async function finishPaymentPreparation(accountId: string) {
  const allRows = await loadMigrationRows();
  const rows = allRows.filter(
    (row) =>
      !isMarkedDuplicate(row) &&
      isRecurring(row) &&
      Number(row.unit_amount_pence ?? 0) > 0,
  );

  const results: Array<Record<string, unknown>> = [];

  for (const original of rows) {
    try {
      let row = await loadSubscription(original.id);
      const provider = await detectProvider(row);

      if (provider === "gocardless") {
        results.push({
          subscriptionId: row.id,
          customerName: row.customer_name,
          email: row.customer_email,
          membership: row.legacy_membership_name,
          amountPence: row.unit_amount_pence,
          provider,
          result: "gocardless_ready_for_separate_cutover",
          mandateId: row.external_mandate_id ?? null,
          externalCustomerId: row.external_customer_id ?? null,
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
        });
        continue;
      }

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
          provider,
          result: "stripe_already_prepared",
          stripeSubscriptionId: existingPrepared.id,
          firstPaymentAt: row.next_payment_at,
        });
        continue;
      }

      const scan = await scanOne(row, accountId);
      row = await loadSubscription(row.id);

      if (row.processor_verification_status === "verified" && !row.next_payment_at) {
        await confirmNextPaymentFromExactHistory(row);
        row = await loadSubscription(row.id);
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
      const proposed = await confirmNextPaymentFromExactHistory(fresh);

      let reason = scan.message ?? scan.result;
      if (
        fresh.processor_verification_status === "verified" &&
        !fresh.next_payment_at
      ) {
        reason = `Payment method verified but next billing date is not safely confirmable (${proposed.reason}).`;
      }

      results.push({
        subscriptionId: fresh.id,
        customerName: fresh.customer_name,
        email: fresh.customer_email,
        membership: fresh.legacy_membership_name,
        amountPence: fresh.unit_amount_pence,
        provider,
        result: scan.result,
        reason,
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

  const readyStripe = results.filter((item) =>
    ["stripe_prepared_now", "stripe_already_prepared"].includes(
      String(item.result),
    ),
  );

  const goCardless = results.filter(
    (item) => item.result === "gocardless_ready_for_separate_cutover",
  );

  const exceptions = results.filter(
    (item) =>
      ![
        "stripe_prepared_now",
        "stripe_already_prepared",
        "gocardless_ready_for_separate_cutover",
      ].includes(String(item.result)),
  );

  return {
    recurringPaidMemberships: rows.length,
    stripeReadyForTomorrow: readyStripe.length,
    stripeAlreadyPrepared: count("stripe_already_prepared"),
    stripePreparedNow: count("stripe_prepared_now"),
    goCardlessRecurring: goCardless.length,
    unresolved: exceptions.length,
    unresolvedBreakdown: {
      customerNotFound: count("customer_not_found"),
      noPaymentMethod: count("no_payment_method"),
      multipleCardCustomers: count("multiple_card_customers"),
      noEmail: count("no_email"),
      unknownProvider: count("provider_review"),
      errors: count("error"),
      verifiedButDateStillUnconfirmed: exceptions.filter(
        (item) =>
          String(item.reason ?? "").includes(
            "next billing date is not safely confirmable",
          ),
      ).length,
    },
    exceptions,
    goCardless,
    safety: {
      paymentsCollected: 0,
      teamupBillingDisabled: 0,
      totsCollectionEnabled: 0,
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
  if (
    isMarkedDuplicate(row)
  ) {
    throw new Error(
      "REFUSED: duplicate record.",
    );
  }

  if (
    row.processor_verification_status !==
    "verified"
  ) {
    throw new Error(
      "Stripe payment method must be verified first.",
    );
  }

  if (
    row.collection_enabled
  ) {
    throw new Error(
      "TOTS is already collecting.",
    );
  }

  if (
    !row.next_payment_at
  ) {
    throw new Error(
      "next_payment_at must be confirmed.",
    );
  }

  const prepared =
    await retrievePreparedStripeSubscription(
      row,
      accountId,
    );

  if (!prepared) {
    throw new Error(
      "REFUSED: replacement Stripe subscription has not been prepared/verified yet.",
    );
  }

  const now =
    new Date().toISOString();

  const updated =
    await patchSubscription(
      row.id,
      {
        teamup_billing_active:
          false,

        teamup_billing_disabled_at:
          now,

        cutover_status:
          "ready",

        collection_enabled:
          false,

        metadata: {
          ...metadata(row),

          mtc_teamup_stop_confirmed_at:
            now,

          mtc_teamup_stop_confirmed_manually:
            true,
        },

        migration_notes:
          appendMigrationNote(
            row,
            "TeamUp billing confirmed stopped externally. Replacement Stripe subscription already exists. TOTS is ready to go live.",
          ),
      },
    );

  return {
    subscription:
      updated,

    stripeSubscription: {
      id:
        prepared.id,

      status:
        prepared.status,
    },

    warning:
      "This records the external TeamUp stop. It does NOT contact TeamUp itself.",
  };
}

// ============================================================
// ACTIVATE
// ============================================================

async function activate(
  row: StoreSubscription,
  accountId: string,
) {
  if (
    row.collection_enabled
  ) {
    return {
      subscription: row,
      alreadyLive: true,
    };
  }

  if (
    row.teamup_billing_active
  ) {
    throw new Error(
      "REFUSED: TeamUp billing is still marked active.",
    );
  }

  if (
    row.cutover_status !==
    "ready"
  ) {
    throw new Error(
      `REFUSED: cutover_status is ${row.cutover_status}; expected ready.`,
    );
  }

  if (
    row.processor_verification_status !==
    "verified"
  ) {
    throw new Error(
      "REFUSED: Stripe payment method is not verified.",
    );
  }

  if (
    isMarkedDuplicate(row)
  ) {
    throw new Error(
      "REFUSED: duplicate migration record.",
    );
  }

  const subscription =
    await retrievePreparedStripeSubscription(
      row,
      accountId,
    );

  if (!subscription) {
    throw new Error(
      "REFUSED: prepared Stripe subscription is missing or unusable.",
    );
  }

  if (
    !row.next_payment_at
  ) {
    throw new Error(
      "REFUSED: next_payment_at is missing.",
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
      "REFUSED: next_payment_at is invalid.",
    );
  }

  const activatedAt =
    new Date().toISOString();

  const updated =
    await patchSubscription(
      row.id,
      {
        stripe_subscription_id:
          subscription.id,

        external_subscription_id:
          subscription.id,

        status:
          subscription.status,

        legacy_billing:
          false,

        collection_enabled:
          true,

        collection_enabled_at:
          activatedAt,

        teamup_billing_active:
          false,

        cutover_status:
          "live",

        processor_verification_status:
          "verified",

        metadata: {
          ...metadata(row),

          mtc_live_subscription_id:
            subscription.id,

          mtc_activation_at:
            activatedAt,

          mtc_first_tots_payment_at:
            nextPayment.toISOString(),

          mtc_cutover_complete:
            true,
        },

        migration_notes:
          appendMigrationNote(
            row,
            `TOTS Stripe billing is now live using prepared Stripe subscription ${subscription.id}. First intended billing date: ${nextPayment.toISOString()}.`,
          ),
      },
    );

  return {
    subscription:
      updated,

    stripe: {
      subscriptionId:
        subscription.id,

      status:
        subscription.status,

      customerId:
        typeof subscription.customer ===
        "string"
          ? subscription.customer
          : subscription.customer.id,

      firstPaymentAt:
        nextPayment.toISOString(),
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
      const result =
        await finishPaymentPreparation(
          accountId,
        );

      return NextResponse.json({
        ok: true,
        action:
          "finish_payment_preparation",
        stripeAccountId:
          accountId,
        ...result,
        performedBy:
          user.email ??
          user.id,
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
      const result =
        await prepareCutoverAll(
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action:
          "prepare_cutover_all",

        stripeAccountId:
          accountId,

        ...result,

        performedBy:
          user.email ??
          user.id,
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