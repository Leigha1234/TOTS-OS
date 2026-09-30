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
  | "scan"
  | "scan_one"
  | "prepare_all"
  | "setup"
  | "verify"
  | "teamup_stopped"
  | "activate";

type StoreSubscription = {
  id: string;
  organisation_id: string;

  product_id: string | null;

  customer_name: string | null;
  customer_email: string | null;

  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;

  external_customer_id: string | null;
  external_subscription_id: string | null;
  external_mandate_id?: string | null;

  status: string | null;

  currency: string | null;
  unit_amount_pence: number | null;
  billing_interval: string | null;

  legacy_membership_name: string | null;

  payment_provider: string | null;
  billing_provider: string | null;

  legacy_billing: boolean;

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

type Provider =
  | "stripe"
  | "gocardless"
  | "unknown";

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

type Candidate = {
  customer: Stripe.Customer;
  paymentMethod: Stripe.PaymentMethod | null;

  sources: Set<
    | "stripe_customer_id"
    | "external_customer_id"
    | "email"
  >;

  exactExternalId: boolean;
};

// ============================================================
// AUTH
// ============================================================

async function requireUser(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorised");
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

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
    .select(
      `
        stripe_account_id,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        onboarding_complete
      `,
    )
    .eq("organisation_id", ORGANISATION_ID)
    .maybeSingle();

  if (error) throw error;

  if (!data?.stripe_account_id) {
    throw new Error(
      "MTC Stripe account is not connected.",
    );
  }

  const accountId = String(
    data.stripe_account_id,
  );

  const account =
    await stripe.accounts.retrieve(accountId);

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
    throw new Error(
      "Subscription record not found.",
    );
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

function normaliseEmail(
  email: string | null | undefined,
) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function normaliseMembership(
  value: string | null | undefined,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function metadata(row: StoreSubscription) {
  return {
    ...(row.metadata ?? {}),
  } as Record<string, unknown>;
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

  return metadataBoolean(meta, [
    "mtc_redundant_duplicate",
    "redundant_duplicate",
    "migration_duplicate",
    "mtc_duplicate_record",
    "duplicate_record",
    "is_duplicate",
  ]);
}

// ============================================================
// MIGRATION SOURCE
// ============================================================

async function getMigrationSources(
  row: StoreSubscription,
): Promise<MigrationSource[]> {
  if (!row.customer_email) return [];

  let query = admin
    .from("mtc_billing_migration_source")
    .select("*")
    .ilike(
      "email",
      row.customer_email.trim(),
    );

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
    /^CU[A-Z0-9]+$/i.test(value)
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
  const text = String(value ?? "")
    .trim()
    .toLowerCase();

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
  /**
   * Strongest evidence: processor-shaped IDs.
   */

  if (
    looksLikeStripeCustomerId(
      row.external_customer_id,
    ) ||
    looksLikeStripeCustomerId(
      row.stripe_customer_id,
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

  /**
   * Explicit provider columns.
   */

  const explicit =
    providerFromText(row.payment_provider) ??
    providerFromText(row.billing_provider);

  if (explicit) {
    return explicit;
  }

  /**
   * Migration source fallback.
   */

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
      String(
        row.billing_interval ?? "",
      ).toLowerCase(),
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

    if ("deleted" in result && result.deleted) {
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

  if (!target) return [];

  /**
   * Stripe LIST first.
   *
   * This avoids depending on Search indexing
   * immediately after the 599-customer copy.
   */

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

  const exact = listed.data.filter(
    (customer) =>
      normaliseEmail(customer.email) ===
      target,
  );

  if (exact.length) {
    return exact;
  }

  /**
   * Search fallback.
   */

  try {
    const escaped =
      target.replace(/'/g, "\\'");

    const searched =
      await stripe.customers.search(
        {
          query: `email:'${escaped}'`,
          limit: 100,
        },
        {
          stripeAccount: accountId,
        },
      );

    return searched.data.filter(
      (customer) =>
        normaliseEmail(customer.email) ===
        target,
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
// PAYMENT METHOD HELPERS
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
    (exp_year === year &&
      exp_month < month)
  );
}

async function findReusablePaymentMethod(
  accountId: string,
  customer: Stripe.Customer,
) {
  /**
   * First try the default PM.
   */

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
        !cardIsExpired(paymentMethod)
      ) {
        return paymentMethod;
      }
    } catch {
      // Continue to attached cards.
    }
  }

  /**
   * Then list cards attached to this customer.
   */

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
        !cardIsExpired(paymentMethod),
    );

  if (!valid.length) {
    return null;
  }

  valid.sort(
    (a, b) => b.created - a.created,
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
      sources: new Set([source]),
      exactExternalId:
        source ===
        "external_customer_id",
    });
  }

  /**
   * Existing TOTS value.
   */

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

  /**
   * Legacy Stripe ID.
   *
   * If Stripe preserved the Customer ID
   * during the account copy, this is the
   * strongest possible match.
   */

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

  /**
   * Email fallback.
   */

  if (row.customer_email) {
    const customers =
      await listCustomersByEmail(
        accountId,
        row.customer_email,
      );

    for (const customer of customers) {
      await add(customer, "email");
    }
  }

  const candidates: Candidate[] = [];

  for (const entry of map.values()) {
    const paymentMethod =
      await findReusablePaymentMethod(
        accountId,
        entry.customer,
      );

    candidates.push({
      customer: entry.customer,
      paymentMethod,
      sources: entry.sources,
      exactExternalId:
        entry.exactExternalId,
    });
  }

  return candidates;
}

// ============================================================
// SAFE MATCHING
// ============================================================

async function selectSafeCustomer(
  row: StoreSubscription,
  accountId: string,
) {
  const candidates =
    await buildCandidates(
      row,
      accountId,
    );

  /**
   * Highest priority:
   *
   * exact legacy Stripe Customer ID that
   * exists in the destination AND has a card.
   */

  const exactExternal =
    candidates.filter(
      (candidate) =>
        candidate.exactExternalId &&
        candidate.paymentMethod,
    );

  if (exactExternal.length === 1) {
    return {
      status: "matched" as const,
      selected: exactExternal[0],
      candidates,
    };
  }

  if (exactExternal.length > 1) {
    return {
      status:
        "multiple_card_customers" as const,
      selected: null,
      candidates,
    };
  }

  /**
   * Otherwise exactly one card-ready candidate.
   */

  const cardReady =
    candidates.filter(
      (candidate) =>
        candidate.paymentMethod,
    );

  if (cardReady.length === 1) {
    return {
      status: "matched" as const,
      selected: cardReady[0],
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
  /**
   * Explicit source date wins.
   */

  const explicit =
    source?.next_payment_at;

  if (
    typeof explicit === "string"
  ) {
    const date = new Date(explicit);

    if (
      !Number.isNaN(date.getTime()) &&
      date.getTime() > Date.now()
    ) {
      return {
        date: date.toISOString(),
        confidence: "explicit" as const,
      };
    }
  }

  /**
   * Existing verified DB date.
   */

  if (row.next_payment_at) {
    const date =
      new Date(row.next_payment_at);

    if (
      !Number.isNaN(date.getTime()) &&
      date.getTime() > Date.now()
    ) {
      return {
        date: date.toISOString(),
        confidence: "existing" as const,
      };
    }
  }

  /**
   * Historical payment date can give us a
   * PROPOSED date, but we do NOT treat this
   * as sufficient to activate billing.
   */

  const last =
    source?.last_payment_at ??
    row.last_payment_at;

  if (
    typeof last !== "string" ||
    !row.billing_interval
  ) {
    return {
      date: null,
      confidence: "none" as const,
    };
  }

  let candidate =
    new Date(last);

  if (
    Number.isNaN(candidate.getTime())
  ) {
    return {
      date: null,
      confidence: "none" as const,
    };
  }

  let guard = 0;

  while (
    candidate.getTime() <= Date.now() &&
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
        confidence: "none" as const,
      };
    }

    candidate = next;
    guard += 1;
  }

  return {
    date: candidate.toISOString(),
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
        customerName: row.customer_name,
        email: row.customer_email,
        result: "duplicate",
        message:
          "Record is marked as a redundant migration duplicate and was ignored.",
      };
    }

    if (row.collection_enabled) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "already_live",
      };
    }

    if (!isRecurring(row)) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "non_recurring",
      };
    }

    const provider =
      await detectProvider(row);

    if (provider === "gocardless") {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "gocardless",
        message:
          "GoCardless membership left untouched for separate migration.",
      };
    }

    if (provider !== "stripe") {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "unknown_provider",
        message:
          "Could not safely determine billing provider.",
      };
    }

    if (!row.customer_email) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: null,
        result: "no_email",
      };
    }

    /**
     * Don't blindly trust old verification.
     * Recheck the actual Stripe customer/card.
     */

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
        customerName: row.customer_name,
        email: row.customer_email,
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
        customerName: row.customer_name,
        email: row.customer_email,
        result:
          "multiple_card_customers",
        candidates:
          selection.candidates.length,
        cardReadyCandidates:
          selection.candidates.filter(
            (x) => x.paymentMethod,
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
        customerName: row.customer_name,
        email: row.customer_email,
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
      await getMigrationSource(row);

    const proposedNext =
      inferNextPaymentAt(
        row,
        source,
      );

    const now =
      new Date().toISOString();

    const meta = metadata(row);

    /**
     * Set default PM so future Stripe invoices
     * can use the verified copied card.
     */

    await stripe.customers.update(
      selected.customer.id,
      {
        invoice_settings: {
          default_payment_method:
            selected.paymentMethod.id,
        },
      },
      {
        stripeAccount: accountId,
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
          "verified",

        /**
         * CRITICAL:
         *
         * Scanning NEVER starts collection.
         */
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

        /**
         * Only write next_payment_at automatically
         * when it came from an explicit/existing
         * date.
         *
         * Inferred dates stay metadata-only until
         * reviewed.
         */
        next_payment_at:
          proposedNext.confidence ===
            "explicit" ||
          proposedNext.confidence ===
            "existing"
            ? proposedNext.date
            : row.next_payment_at,

        metadata: {
          ...meta,

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
            selection.candidates.length,

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
            ? "Stripe customer/payment method verified. Proposed renewal date inferred from payment history and requires confirmation. TeamUp remains active; TOTS collection remains OFF."
            : "Stripe customer/payment method verified. TeamUp remains active; TOTS collection remains OFF.",
      },
    );

    return {
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,
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
      customerName: row.customer_name,
      email: row.customer_email,

      result: "error",

      message:
        error instanceof Error
          ? error.message
          : "Unknown migration error.",
    };
  }
}

// ============================================================
// LOAD ALL MIGRATION RECORDS
// ============================================================

async function loadMigrationRows() {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq(
      "organisation_id",
      ORGANISATION_ID,
    )
    .eq("legacy_billing", true)
    .eq("collection_enabled", false)
    .order("customer_name", {
      ascending: true,
    });

  if (error) throw error;

  return (
    (data ?? []) as StoreSubscription[]
  );
}

// ============================================================
// BULK PREPARE
// ============================================================

async function prepareAll(
  accountId: string,
) {
  const rows =
    await loadMigrationRows();

  const results: ScanResult[] = [];

  /**
   * Sequential deliberately.
   *
   * 356 records × multiple Stripe calls is
   * safer sequentially than blasting Stripe.
   */

  for (const row of rows) {
    const result =
      await scanOne(
        row,
        accountId,
      );

    results.push(result);
  }

  const counts =
    results.reduce<
      Record<string, number>
    >((acc, item) => {
      acc[item.result] =
        (acc[item.result] ?? 0) + 1;

      return acc;
    }, {});

  return {
    scanned: results.length,

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

    /**
     * Only return review items in detail.
     * Keeps response manageable.
     */

    review: results.filter(
      (item) =>
        ![
          "verified",
          "already_verified",
          "duplicate",
          "non_recurring",
          "gocardless",
          "already_live",
        ].includes(item.result),
    ),

    safety: {
      stripeSubscriptionsCreated: 0,
      paymentsCollected: 0,
      teamupBillingDisabled: 0,
      totsCollectionEnabled: 0,
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

  if (row.collection_enabled) {
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
    selection.status === "matched"
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
      "Multiple Stripe customers with reusable cards match this member. Manual customer selection is required.",
    );
  }

  let customer: Stripe.Customer;

  if (
    selection.status ===
      "no_payment_method" &&
    selection.candidates.length === 1
  ) {
    customer =
      selection.candidates[0]
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
          stripeAccount: accountId,

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
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

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
        stripeAccount: accountId,

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
        "Fallback Stripe card setup requested. TeamUp remains active. TOTS collection remains OFF.",
    },
  );

  return {
    automatic: false,
    url: session.url,

    safety: {
      paymentCollected: false,
      subscriptionCreated: false,
      teamupBillingDisabled: false,
      collectionEnabled: false,
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

  const meta = metadata(row);

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
        stripeAccount: accountId,
      },
    );

  if (
    session.status !== "complete"
  ) {
    throw new Error(
      "The member has not completed payment setup.",
    );
  }

  const setupIntent =
    session.setup_intent;

  if (
    !setupIntent ||
    typeof setupIntent === "string"
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
    typeof setupIntent.payment_method ===
    "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

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
      stripeAccount: accountId,
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
        "Stripe payment method verified. TeamUp remains active. TOTS collection remains OFF.",
    },
  );
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

  /**
   * Existing Stripe price first.
   */

  if (row.stripe_price_id) {
    try {
      const price =
        await stripe.prices.retrieve(
          row.stripe_price_id,
          {},
          {
            stripeAccount: accountId,
          },
        );

      if (
        price.active &&
        price.unit_amount ===
          row.unit_amount_pence &&
        price.currency ===
          (row.currency ?? "gbp")
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
        stripeAccount: accountId,

        idempotencyKey:
          `mtc-product-${row.id}`,
      },
    );

  const price =
    await stripe.prices.create(
      {
        product: product.id,

        currency:
          row.currency ?? "gbp",

        unit_amount:
          row.unit_amount_pence,

        recurring: {
          interval:
            stripeInterval(
              row.billing_interval,
            ),
        },

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration:
            "true",
        },
      },
      {
        stripeAccount: accountId,

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
// TEAMUP STOP CONFIRMATION
// ============================================================

async function markTeamupStopped(
  row: StoreSubscription,
) {
  if (
    row.processor_verification_status !==
    "verified"
  ) {
    throw new Error(
      "Stripe payment method must be verified first.",
    );
  }

  if (
    row.cutover_status !==
      "verified" &&
    row.cutover_status !==
      "ready"
  ) {
    throw new Error(
      "Member is not ready for cutover.",
    );
  }

  if (row.collection_enabled) {
    throw new Error(
      "TOTS is already collecting.",
    );
  }

  if (!row.next_payment_at) {
    throw new Error(
      "Confirm next_payment_at before marking TeamUp stopped.",
    );
  }

  const date =
    new Date(row.next_payment_at);

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      "next_payment_at is invalid.",
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

        migration_notes:
          "TeamUp billing confirmed stopped externally. TOTS is ready to activate.",
      },
    );

  return {
    subscription: updated,

    warning:
      "This records the external TeamUp stop. It does NOT call TeamUp itself.",
  };
}

// ============================================================
// ACTIVATE
// ============================================================

async function activate(
  row: StoreSubscription,
  accountId: string,
) {
  if (row.collection_enabled) {
    throw new Error(
      "TOTS collection is already enabled.",
    );
  }

  if (row.teamup_billing_active) {
    throw new Error(
      "REFUSED: TeamUp billing is still marked active.",
    );
  }

  if (
    row.cutover_status !== "ready"
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

  const provider =
    await detectProvider(row);

  if (provider !== "stripe") {
    throw new Error(
      "REFUSED: this activation path is Stripe-only.",
    );
  }

  if (!isRecurring(row)) {
    throw new Error(
      "REFUSED: not a paid recurring membership.",
    );
  }

  if (!row.stripe_customer_id) {
    throw new Error(
      "Stripe customer ID is missing.",
    );
  }

  /**
   * Idempotency / duplicate protection.
   */

  if (
    row.stripe_subscription_id
  ) {
    try {
      const existing =
        await stripe.subscriptions.retrieve(
          row.stripe_subscription_id,
          {},
          {
            stripeAccount: accountId,
          },
        );

      if (
        ![
          "canceled",
          "incomplete_expired",
        ].includes(existing.status)
      ) {
        throw new Error(
          `REFUSED: Stripe subscription ${existing.id} already exists with status ${existing.status}.`,
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith(
          "REFUSED:",
        )
      ) {
        throw error;
      }
    }
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

  if (!row.next_payment_at) {
    throw new Error(
      "REFUSED: next_payment_at must be confirmed before activation.",
    );
  }

  const nextPayment =
    new Date(row.next_payment_at);

  if (
    Number.isNaN(
      nextPayment.getTime(),
    )
  ) {
    throw new Error(
      "REFUSED: invalid next_payment_at.",
    );
  }

  if (
    nextPayment.getTime() <=
    Date.now() + 10 * 60 * 1000
  ) {
    throw new Error(
      "REFUSED: next_payment_at must be safely in the future.",
    );
  }

  const price =
    await ensureRecurringPrice(
      row,
      accountId,
    );

  /**
   * Create the Stripe subscription.
   *
   * trial_end means the migrated member is
   * not intended to be charged now; the first
   * invoice is scheduled for the confirmed
   * renewal date.
   */

  const subscription =
    await stripe.subscriptions.create(
      {
        customer:
          customer.id,

        items: [
          {
            price: price.id,
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

          legacy_membership:
            row.legacy_membership_name ??
            "",
        },
      },
      {
        stripeAccount: accountId,

        idempotencyKey:
          `mtc-cutover-${row.id}`,
      },
    );

  const activatedAt =
    new Date().toISOString();

  const updated =
    await patchSubscription(
      row.id,
      {
        stripe_account_id:
          accountId,

        stripe_customer_id:
          customer.id,

        stripe_subscription_id:
          subscription.id,

        stripe_price_id:
          price.id,

        external_subscription_id:
          subscription.id,

        payment_provider:
          "stripe",

        billing_provider:
          "stripe",

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

          mtc_live_price_id:
            price.id,

          mtc_activation_at:
            activatedAt,

          mtc_first_tots_payment_at:
            nextPayment.toISOString(),
        },

        migration_notes:
          `TOTS Stripe billing activated. First intended billing date: ${nextPayment.toISOString()}.`,
      },
    );

  return {
    subscription: updated,

    stripe: {
      subscriptionId:
        subscription.id,

      status:
        subscription.status,

      customerId:
        customer.id,

      paymentMethodId:
        paymentMethod.id,

      priceId:
        price.id,

      firstPaymentAt:
        nextPayment.toISOString(),
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
      typeof body?.subscriptionId ===
      "string"
        ? body.subscriptionId
        : null;

    if (!action) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing action.",
        },
        {
          status: 400,
        },
      );
    }

    const { accountId } =
      await getConnectedAccount();

    // ========================================================
    // BULK PREPARE
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
    // SINGLE RECORD REQUIRED
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

    // ========================================================
    // SCAN ONE
    // ========================================================

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
          paymentsCollected: 0,
          subscriptionsCreated: 0,
          teamupBillingDisabled: 0,
          totsCollectionEnabled: 0,
        },
      });
    }

    // ========================================================
    // SETUP
    // ========================================================

    if (action === "setup") {
      const result =
        await createFallbackSetup(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action: "setup",

        ...result,
      });
    }

    // ========================================================
    // VERIFY
    // ========================================================

    if (action === "verify") {
      const result =
        await verifyFallbackSetup(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action: "verify",

        result,
      });
    }

    // ========================================================
    // TEAMUP STOPPED
    // ========================================================

    if (
      action ===
      "teamup_stopped"
    ) {
      const result =
        await markTeamupStopped(
          row,
        );

      return NextResponse.json({
        ok: true,

        action:
          "teamup_stopped",

        ...result,
      });
    }

    // ========================================================
    // ACTIVATE
    // ========================================================

    if (
      action === "activate"
    ) {
      /**
       * Reload immediately before activation so
       * stale request state cannot bypass a lock.
       */

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