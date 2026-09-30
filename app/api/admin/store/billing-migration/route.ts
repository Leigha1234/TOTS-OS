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

  status: string;

  currency: string;
  unit_amount_pence: number | null;
  billing_interval: string | null;

  legacy_membership_name: string | null;

  payment_provider: string | null;
  billing_provider: string | null;

  legacy_billing: boolean;

  next_payment_at: string | null;
  last_payment_at: string | null;
  last_payment_amount_pence: number | null;

  processor_verification_status: string;
  processor_verified_at: string | null;

  cutover_status: string;

  collection_enabled: boolean;
  collection_enabled_at: string | null;

  teamup_billing_active: boolean;
  teamup_billing_disabled_at: string | null;

  migration_notes: string | null;

  metadata: Record<string, unknown> | null;
};

type MigrationSource = {
  id?: string;
  member_name?: string | null;
  email?: string | null;
  membership_name?: string | null;
  status?: string | null;

  last_payment_at?: string | null;
  last_payment_amount_pence?: number | null;

  [key: string]: unknown;
};

type CustomerCandidate = {
  customer: Stripe.Customer;
  paymentMethod: Stripe.PaymentMethod | null;

  source:
    | "email"
    | "existing_stripe_customer_id"
    | "external_customer_id";
};

type ScanResult = {
  subscriptionId: string;
  customerName: string | null;
  email: string | null;

  result:
    | "verified"
    | "already_verified"
    | "no_email"
    | "customer_not_found"
    | "multiple_card_customers"
    | "no_payment_method"
    | "not_stripe"
    | "non_recurring"
    | "error";

  stripeCustomerId?: string | null;
  paymentMethodId?: string | null;

  candidates?: number;
  cardReadyCandidates?: number;

  message?: string;
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

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },

    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

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
// DATABASE HELPERS
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

async function getMigrationSource(
  row: StoreSubscription,
): Promise<MigrationSource | null> {
  if (!row.customer_email) return null;

  let query = admin
    .from("mtc_billing_migration_source")
    .select("*")
    .ilike("email", row.customer_email.trim());

  if (row.legacy_membership_name) {
    query = query.ilike(
      "membership_name",
      row.legacy_membership_name.trim(),
    );
  }

  const { data, error } = await query.limit(5);

  if (error) {
    console.warn("[MTC MIGRATION SOURCE]", error);
    return null;
  }

  if (!data?.length) {
    return null;
  }

  return data[0] as MigrationSource;
}

function metadata(row: StoreSubscription) {
  return {
    ...(row.metadata ?? {}),
  } as Record<string, unknown>;
}

// ============================================================
// BILLING HELPERS
// ============================================================

function isRecurring(row: StoreSubscription) {
  return (
    typeof row.unit_amount_pence === "number" &&
    row.unit_amount_pence > 0 &&
    ["week", "month", "year"].includes(
      String(row.billing_interval ?? "").toLowerCase(),
    )
  );
}

function isStripeRecord(row: StoreSubscription) {
  const paymentProvider = String(
    row.payment_provider ?? "",
  ).toLowerCase();

  const billingProvider = String(
    row.billing_provider ?? "",
  ).toLowerCase();

  return (
    paymentProvider === "stripe" ||
    billingProvider === "stripe"
  );
}

function isStripeRecurring(row: StoreSubscription) {
  return isStripeRecord(row) && isRecurring(row);
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
  if (!customerId.startsWith("cus_")) {
    return null;
  }

  try {
    const result = await stripe.customers.retrieve(
      customerId,
      {
        stripeAccount: accountId,
      },
    );

    if (result.deleted) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

async function listCustomersByEmail(
  accountId: string,
  email: string,
): Promise<Stripe.Customer[]> {
  const normalised = email.trim().toLowerCase();

  /**
   * IMPORTANT:
   *
   * LIST is deliberately used first.
   *
   * Stripe Search can have indexing delay after a large customer
   * migration. We therefore do not depend on Search for this migration.
   */

  const listed = await stripe.customers.list(
    {
      email: normalised,
      limit: 100,
    },
    {
      stripeAccount: accountId,
    },
  );

  const exact = listed.data.filter(
    (customer) =>
      customer.email?.trim().toLowerCase() === normalised,
  );

  if (exact.length > 0) {
    return exact;
  }

  /**
   * Search fallback.
   */

  try {
    const escaped = normalised.replace(/'/g, "\\'");

    const searched = await stripe.customers.search(
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
        customer.email?.trim().toLowerCase() === normalised,
    );
  } catch (error) {
    console.warn(
      "[MTC STRIPE CUSTOMER SEARCH FALLBACK]",
      error,
    );

    return [];
  }
}

// ============================================================
// PAYMENT METHOD DISCOVERY
// ============================================================

function cardIsExpired(
  paymentMethod: Stripe.PaymentMethod,
) {
  if (paymentMethod.type !== "card") {
    return false;
  }

  const card = paymentMethod.card;

  if (!card?.exp_year || !card.exp_month) {
    return false;
  }

  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  if (card.exp_year < year) {
    return true;
  }

  if (
    card.exp_year === year &&
    card.exp_month < month
  ) {
    return true;
  }

  return false;
}

async function findReusablePaymentMethod(
  accountId: string,
  customer: Stripe.Customer,
): Promise<Stripe.PaymentMethod | null> {
  /**
   * 1. Default payment method
   */

  const defaultPm =
    customer.invoice_settings?.default_payment_method;

  const defaultPmId =
    typeof defaultPm === "string"
      ? defaultPm
      : defaultPm?.id;

  if (defaultPmId?.startsWith("pm_")) {
    try {
      const paymentMethod =
        await stripe.paymentMethods.retrieve(
          defaultPmId,
          {
            stripeAccount: accountId,
          },
        );

      if (
        paymentMethod.customer === customer.id &&
        paymentMethod.type === "card" &&
        !cardIsExpired(paymentMethod)
      ) {
        return paymentMethod;
      }
    } catch {
      // Continue.
    }
  }

  /**
   * 2. Attached reusable cards
   */

  const methods = await stripe.paymentMethods.list(
    {
      customer: customer.id,
      type: "card",
      limit: 100,
    },
    {
      stripeAccount: accountId,
    },
  );

  const valid = methods.data.filter(
    (method) =>
      method.customer === customer.id &&
      method.type === "card" &&
      !cardIsExpired(method),
  );

  if (!valid.length) {
    return null;
  }

  /**
   * Prefer the newest attached valid payment method.
   */

  valid.sort((a, b) => b.created - a.created);

  return valid[0];
}

// ============================================================
// CANDIDATE COLLECTION
// ============================================================

async function buildCandidates(
  row: StoreSubscription,
  accountId: string,
): Promise<CustomerCandidate[]> {
  const customerMap = new Map<
    string,
    {
      customer: Stripe.Customer;
      sources: Set<CustomerCandidate["source"]>;
    }
  >();

  async function addCustomer(
    customer: Stripe.Customer | null,
    source: CustomerCandidate["source"],
  ) {
    if (!customer) return;

    const existing = customerMap.get(customer.id);

    if (existing) {
      existing.sources.add(source);
      return;
    }

    customerMap.set(customer.id, {
      customer,
      sources: new Set([source]),
    });
  }

  /**
   * Existing TOTS Stripe customer ID.
   *
   * This is only a candidate.
   * It is NOT automatically trusted.
   */

  if (row.stripe_customer_id?.startsWith("cus_")) {
    await addCustomer(
      await retrieveCustomer(
        accountId,
        row.stripe_customer_id,
      ),
      "existing_stripe_customer_id",
    );
  }

  /**
   * Imported TeamUp Stripe customer ID.
   *
   * If Stripe preserved it during copy, this will resolve.
   * If not, it simply won't resolve in the new account.
   */

  if (row.external_customer_id?.startsWith("cus_")) {
    await addCustomer(
      await retrieveCustomer(
        accountId,
        row.external_customer_id,
      ),
      "external_customer_id",
    );
  }

  /**
   * Email candidates from the NEW MTC connected account.
   */

  if (row.customer_email) {
    const emailCustomers = await listCustomersByEmail(
      accountId,
      row.customer_email,
    );

    for (const customer of emailCustomers) {
      await addCustomer(customer, "email");
    }
  }

  const candidates: CustomerCandidate[] = [];

  for (const entry of customerMap.values()) {
    const paymentMethod =
      await findReusablePaymentMethod(
        accountId,
        entry.customer,
      );

    /**
     * Source is informational only.
     *
     * Prefer external ID as the descriptive source if present,
     * then email, then existing TOTS ID.
     */

    let source: CustomerCandidate["source"] =
      "existing_stripe_customer_id";

    if (entry.sources.has("external_customer_id")) {
      source = "external_customer_id";
    } else if (entry.sources.has("email")) {
      source = "email";
    }

    candidates.push({
      customer: entry.customer,
      paymentMethod,
      source,
    });
  }

  return candidates;
}

// ============================================================
// SELECT SAFE COPIED CUSTOMER
// ============================================================

async function selectSafeCustomer(
  row: StoreSubscription,
  accountId: string,
) {
  const candidates = await buildCandidates(
    row,
    accountId,
  );

  const cardReady = candidates.filter(
    (candidate) => candidate.paymentMethod !== null,
  );

  /**
   * SAFE AUTO-MATCH:
   *
   * Exactly ONE customer candidate has a reusable payment method.
   */

  if (cardReady.length === 1) {
    return {
      status: "matched" as const,
      selected: cardReady[0],
      candidates,
      cardReady,
    };
  }

  /**
   * Multiple card-ready customers = NEVER GUESS.
   */

  if (cardReady.length > 1) {
    return {
      status: "multiple_card_customers" as const,
      selected: null,
      candidates,
      cardReady,
    };
  }

  /**
   * Customer(s) exist, but none has a reusable card.
   */

  if (candidates.length > 0) {
    return {
      status: "no_payment_method" as const,
      selected: null,
      candidates,
      cardReady,
    };
  }

  return {
    status: "customer_not_found" as const,
    selected: null,
    candidates,
    cardReady,
  };
}

// ============================================================
// SCAN ONE STRIPE RECURRING MEMBER
// ============================================================

async function scanOne(
  row: StoreSubscription,
  accountId: string,
): Promise<ScanResult> {
  try {
    if (!isStripeRecord(row)) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "not_stripe",
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

    if (!row.customer_email) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: null,
        result: "no_email",
        message:
          "Recurring Stripe member has no email address. Manual review required.",
      };
    }

    /**
     * Already verified records are not modified again.
     */

    if (
      row.processor_verification_status === "verified" &&
      row.cutover_status === "verified" &&
      row.stripe_customer_id
    ) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "already_verified",
        stripeCustomerId: row.stripe_customer_id,
      };
    }

    const selection = await selectSafeCustomer(
      row,
      accountId,
    );

    if (
      selection.status ===
      "multiple_card_customers"
    ) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,

        result: "multiple_card_customers",

        candidates: selection.candidates.length,
        cardReadyCandidates:
          selection.cardReady.length,

        message:
          `${selection.cardReady.length} Stripe customers with reusable cards match this member. TOTS refused to guess.`,
      };
    }

    if (
      selection.status ===
      "customer_not_found"
    ) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,

        result: "customer_not_found",

        candidates: 0,
        cardReadyCandidates: 0,

        message:
          "No matching customer was found in the new MTC Stripe account.",
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

        result: "no_payment_method",

        candidates: selection.candidates.length,
        cardReadyCandidates: 0,

        message:
          "Matching Stripe customer exists, but no reusable non-expired card was found.",
      };
    }

    const selected = selection.selected;

    if (
      !selected ||
      !selected.paymentMethod
    ) {
      throw new Error(
        "Safe Stripe customer selection unexpectedly failed.",
      );
    }

    const source = await getMigrationSource(row);

    const now = new Date().toISOString();

    const meta = metadata(row);

    const previousStripeCustomerId =
      row.stripe_customer_id;

    await patchSubscription(row.id, {
      stripe_account_id: accountId,

      /**
       * This becomes the authoritative Stripe customer
       * for the NEW MTC connected account.
       */
      stripe_customer_id:
        selected.customer.id,

      payment_provider: "stripe",
      billing_provider: "stripe",

      processor_verification_status:
        "verified",

      processor_verified_at: now,

      cutover_status: "verified",

      /**
       * ABSOLUTE SAFETY:
       */
      collection_enabled: false,
      collection_enabled_at: null,

      teamup_billing_active: true,

      last_payment_at:
        source?.last_payment_at ??
        row.last_payment_at ??
        null,

      last_payment_amount_pence:
        source?.last_payment_amount_pence ??
        row.last_payment_amount_pence ??
        null,

      metadata: {
        ...meta,

        mtc_stripe_copy_reconciled: true,

        mtc_stripe_copy_reconciled_at: now,

        mtc_stripe_connected_account:
          accountId,

        mtc_stripe_customer_match_source:
          selected.source,

        mtc_previous_stripe_customer_id:
          previousStripeCustomerId ?? null,

        mtc_verified_stripe_customer_id:
          selected.customer.id,

        mtc_verified_payment_method_id:
          selected.paymentMethod.id,

        mtc_payment_method_type:
          selected.paymentMethod.type,

        mtc_customer_candidate_count:
          selection.candidates.length,

        mtc_card_ready_candidate_count:
          selection.cardReady.length,

        mtc_source_last_payment_at:
          source?.last_payment_at ??
          row.last_payment_at ??
          null,

        mtc_source_last_payment_amount_pence:
          source?.last_payment_amount_pence ??
          row.last_payment_amount_pence ??
          null,
      },

      migration_notes:
        "Stripe customer copy reconciled successfully. Exactly one matching customer has a reusable payment method. TeamUp remains active. TOTS collection remains disabled.",
    });

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
        selection.cardReady.length,

      message:
        "Copied Stripe customer and reusable payment method verified. No payment collected.",
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
          : "Unknown Stripe reconciliation error.",
    };
  }
}

// ============================================================
// BULK STRIPE RECONCILIATION
// ============================================================

async function bulkScan(accountId: string) {
  /**
   * IMPORTANT:
   *
   * Only fetch actual paid recurring Stripe records.
   *
   * This deliberately excludes:
   * - 139 non-recurring records
   * - 38 GoCardless recurring records
   * - Craig's blocked/manual-review record
   */

  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .eq("legacy_billing", true)
    .eq("collection_enabled", false)
    .eq("teamup_billing_active", true)
    .eq("payment_provider", "stripe")
    .gt("unit_amount_pence", 0)
    .in("billing_interval", [
      "week",
      "month",
      "year",
    ])
    .order("customer_name", {
      ascending: true,
    });

  if (error) throw error;

  const rows = (data ?? []).filter(
    isStripeRecurring,
  ) as StoreSubscription[];

  const results: ScanResult[] = [];

  /**
   * Sequential by design.
   *
   * This avoids hammering Stripe with hundreds of
   * customer/payment-method calls at once.
   */

  for (const row of rows) {
    const result = await scanOne(
      row,
      accountId,
    );

    results.push(result);
  }

  const counts = results.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.result] =
      (acc[item.result] ?? 0) + 1;

    return acc;
  }, {});

  const verifiedNow =
    counts.verified ?? 0;

  const alreadyVerified =
    counts.already_verified ?? 0;

  const ready =
    verifiedNow + alreadyVerified;

  const needsReview =
    (counts.no_email ?? 0) +
    (counts.customer_not_found ?? 0) +
    (counts.multiple_card_customers ?? 0) +
    (counts.no_payment_method ?? 0) +
    (counts.error ?? 0);

  return {
    scanned: results.length,

    summary: {
      stripeRecurringScanned:
        results.length,

      verifiedNow,

      alreadyVerified,

      totalVerified: ready,

      needsReview,

      noEmail:
        counts.no_email ?? 0,

      customerNotFound:
        counts.customer_not_found ?? 0,

      multipleCardCustomers:
        counts.multiple_card_customers ?? 0,

      noPaymentMethod:
        counts.no_payment_method ?? 0,

      errors:
        counts.error ?? 0,
    },

    counts,
    results,
  };
}

// ============================================================
// FALLBACK PAYMENT SETUP
// ============================================================

async function createFallbackSetup(
  row: StoreSubscription,
  accountId: string,
) {
  if (!isStripeRecord(row)) {
    throw new Error(
      "Payment setup links are only available for Stripe records.",
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

  /**
   * IMPORTANT:
   *
   * Reconcile the Stripe copy BEFORE creating anything.
   */

  const selection = await selectSafeCustomer(
    row,
    accountId,
  );

  if (
    selection.status === "matched" &&
    selection.selected?.paymentMethod
  ) {
    /**
     * There is already a safe copied payment method.
     * No setup session is necessary.
     */

    const automatic = await scanOne(
      row,
      accountId,
    );

    return {
      automatic: true,
      result: automatic,

      url: null,

      safety: {
        customerCreated: false,
        checkoutSessionCreated: false,
        subscriptionCreated: false,
        paymentCollected: false,
        collectionEnabled: false,
        teamupBillingActive: true,
      },
    };
  }

  /**
   * DO NOT silently create another Stripe customer when:
   * - multiple customers match
   * - customer exists but has no card
   *
   * The operator should know why a setup link is required.
   */

  if (
    selection.status ===
    "multiple_card_customers"
  ) {
    throw new Error(
      "Multiple Stripe customers with reusable cards match this member. Resolve the customer match before creating a payment setup link.",
    );
  }

  let customer: Stripe.Customer;

  if (
    selection.status === "no_payment_method" &&
    selection.candidates.length === 1
  ) {
    customer =
      selection.candidates[0].customer;
  } else if (
    selection.status === "customer_not_found"
  ) {
    /**
     * Only here may we create a new Stripe customer,
     * because no copied customer exists.
     */

    customer = await stripe.customers.create(
      {
        email:
          row.customer_email ?? undefined,

        name:
          row.customer_name ?? undefined,

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
      "This member requires manual review before a payment setup link can be created.",
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

        customer: customer.id,

        payment_method_types: ["card"],

        success_url:
          `${appUrl}/store?payment_setup=success`,

        cancel_url:
          `${appUrl}/store?payment_setup=cancelled`,

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration: "true",

          mtc_payment_setup_fallback:
            "true",
        },

        setup_intent_data: {
          metadata: {
            tots_store_subscription_id:
              row.id,

            mtc_migration: "true",
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

  const meta = metadata(row);

  await patchSubscription(row.id, {
    stripe_account_id: accountId,

    stripe_customer_id:
      customer.id,

    cutover_status:
      "awaiting_processor",

    collection_enabled: false,

    teamup_billing_active: true,

    metadata: {
      ...meta,

      mtc_migration_setup_session_id:
        session.id,

      mtc_migration_setup_created_at:
        new Date().toISOString(),

      mtc_payment_setup_fallback: true,
    },

    migration_notes:
      "Fallback payment setup requested. TeamUp remains active and TOTS collection remains disabled.",
  });

  return {
    automatic: false,

    url: session.url,

    safety: {
      subscriptionCreated: false,
      paymentCollected: false,
      collectionEnabled: false,
      teamupBillingActive: true,
    },
  };
}

// ============================================================
// VERIFY FALLBACK SETUP
// ============================================================

async function verifyFallbackSetup(
  row: StoreSubscription,
  accountId: string,
) {
  /**
   * Always try automatic reconciliation first.
   */

  const automatic = await scanOne(
    row,
    accountId,
  );

  if (
    automatic.result === "verified" ||
    automatic.result ===
      "already_verified"
  ) {
    return automatic;
  }

  const meta = metadata(row);

  const sessionId =
    typeof meta.mtc_migration_setup_session_id ===
    "string"
      ? meta.mtc_migration_setup_session_id
      : null;

  if (!sessionId) {
    throw new Error(
      "No Stripe payment setup session exists for this member.",
    );
  }

  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ["setup_intent"],
      },
      {
        stripeAccount: accountId,
      },
    );

  if (session.status !== "complete") {
    throw new Error(
      "The member has not completed payment setup yet.",
    );
  }

  const setupIntent =
    session.setup_intent;

  if (
    !setupIntent ||
    typeof setupIntent === "string"
  ) {
    throw new Error(
      "Stripe setup intent could not be loaded.",
    );
  }

  if (
    setupIntent.status !== "succeeded"
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

  if (!paymentMethodId) {
    throw new Error(
      "No reusable payment method was returned by Stripe.",
    );
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!customerId) {
    throw new Error(
      "Stripe customer is missing.",
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

  const now = new Date().toISOString();

  await patchSubscription(row.id, {
    stripe_account_id: accountId,

    stripe_customer_id:
      customerId,

    payment_provider: "stripe",
    billing_provider: "stripe",

    processor_verification_status:
      "verified",

    processor_verified_at: now,

    cutover_status: "verified",

    collection_enabled: false,

    teamup_billing_active: true,

    metadata: {
      ...meta,

      mtc_migration_payment_method_id:
        paymentMethodId,

      mtc_payment_method_verified_at:
        now,
    },

    migration_notes:
      "Reusable Stripe payment method verified. TeamUp remains active and TOTS collection remains disabled.",
  });

  return {
    verified: true,

    stripeCustomerId:
      customerId,

    paymentMethodId,

    safety: {
      paymentCollected: false,
      subscriptionCreated: false,
      collectionEnabled: false,
      teamupBillingActive: true,
    },
  };
}

// ============================================================
// CREATE / REUSE PRICE
// ============================================================

async function ensureRecurringPrice(
  row: StoreSubscription,
  accountId: string,
) {
  if (
    !row.unit_amount_pence ||
    row.unit_amount_pence <= 0
  ) {
    throw new Error(
      "Membership has no recurring amount.",
    );
  }

  if (!row.billing_interval) {
    throw new Error(
      "Membership has no billing interval.",
    );
  }

  const meta = metadata(row);

  const savedPriceId =
    typeof meta.mtc_migration_price_id ===
    "string"
      ? meta.mtc_migration_price_id
      : null;

  if (savedPriceId) {
    try {
      const existing =
        await stripe.prices.retrieve(
          savedPriceId,
          {
            stripeAccount: accountId,
          },
        );

      if (existing.active) {
        return existing;
      }
    } catch {
      // Recreate below.
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

          mtc_legacy_membership:
            "true",
        },
      },
      {
        stripeAccount: accountId,

        idempotencyKey:
          `mtc-migration-product-${row.id}`,
      },
    );

  const price =
    await stripe.prices.create(
      {
        product: product.id,

        currency:
          row.currency || "gbp",

        unit_amount:
          row.unit_amount_pence,

        recurring: {
          interval: stripeInterval(
            row.billing_interval,
          ),
        },

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_legacy_membership:
            "true",
        },
      },
      {
        stripeAccount: accountId,

        idempotencyKey:
          `mtc-migration-price-${row.id}`,
      },
    );

  await patchSubscription(row.id, {
    stripe_price_id: price.id,

    metadata: {
      ...meta,

      mtc_migration_product_id:
        product.id,

      mtc_migration_price_id:
        price.id,
    },
  });

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
      "verified" ||
    !["verified", "ready"].includes(
      row.cutover_status,
    )
  ) {
    throw new Error(
      "Payment method must be verified before TeamUp can be marked stopped.",
    );
  }

  if (row.collection_enabled) {
    throw new Error(
      "TOTS collection is already enabled. Refusing unsafe state change.",
    );
  }

  const now = new Date().toISOString();

  const updated =
    await patchSubscription(row.id, {
      teamup_billing_active: false,

      teamup_billing_disabled_at:
        now,

      cutover_status: "ready",

      collection_enabled: false,

      migration_notes:
        "TeamUp billing confirmed stopped externally. TOTS is ready for controlled activation but is not collecting yet.",
    });

  return {
    subscription: updated,

    warning:
      "This action only records that TeamUp was stopped. It does not contact TeamUp.",

    safety: {
      paymentCollected: false,
      subscriptionCreated: false,
      collectionEnabled: false,
      teamupBillingActive: false,
    },
  };
}

// ============================================================
// ACTIVATE TOTS BILLING
// ============================================================

async function activate(
  row: StoreSubscription,
  accountId: string,
) {
  // ----------------------------------------------------------
  // HARD SAFETY LOCKS
  // ----------------------------------------------------------

  if (row.collection_enabled) {
    throw new Error(
      "TOTS collection is already enabled.",
    );
  }

  if (row.teamup_billing_active) {
    throw new Error(
      "REFUSED: TeamUp billing is still active. Stop TeamUp billing before activating TOTS.",
    );
  }

  if (row.cutover_status !== "ready") {
    throw new Error(
      `REFUSED: cutover_status must be ready, currently ${row.cutover_status}.`,
    );
  }

  if (
    row.processor_verification_status !==
    "verified"
  ) {
    throw new Error(
      "REFUSED: Stripe payment method has not been verified.",
    );
  }

  if (!isStripeRecord(row)) {
    throw new Error(
      "This activation route currently supports Stripe recurring memberships only.",
    );
  }

  if (!isRecurring(row)) {
    throw new Error(
      "This record is not a recurring paid membership.",
    );
  }

  if (!row.stripe_customer_id) {
    throw new Error(
      "Verified Stripe customer ID is missing.",
    );
  }

  const customer =
    await retrieveCustomer(
      accountId,
      row.stripe_customer_id,
    );

  if (!customer) {
    throw new Error(
      "Verified Stripe customer no longer exists in the MTC account.",
    );
  }

  const paymentMethod =
    await findReusablePaymentMethod(
      accountId,
      customer,
    );

  if (!paymentMethod) {
    throw new Error(
      "Verified customer no longer has a reusable payment method.",
    );
  }

  /**
   * NEVER GUESS BILLING DATE.
   */

  if (!row.next_payment_at) {
    throw new Error(
      "REFUSED: next_payment_at is missing. Set/verify the member's next TeamUp renewal date before activating TOTS.",
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
      "REFUSED: next_payment_at is not a valid date.",
    );
  }

  const now = new Date();

  if (
    nextPayment.getTime() <=
    now.getTime() + 5 * 60 * 1000
  ) {
    throw new Error(
      "REFUSED: next_payment_at must be in the future. Review this member before activation.",
    );
  }

  const price =
    await ensureRecurringPrice(
      row,
      accountId,
    );

  const meta = metadata(row);

  /**
   * Subscription starts billing on the deliberately
   * verified next-payment date.
   *
   * It is NOT intended to charge immediately.
   */

  const subscription =
    await stripe.subscriptions.create(
      {
        customer: customer.id,

        items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],

        default_payment_method:
          paymentMethod.id,

        trial_end: Math.floor(
          nextPayment.getTime() / 1000,
        ),

        proration_behavior: "none",

        metadata: {
          tots_store_subscription_id:
            row.id,

          mtc_migration: "true",

          migrated_from: "teamup",

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
    await patchSubscription(row.id, {
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

      billing_provider:
        "stripe",

      payment_provider:
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
        ...meta,

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
        `TOTS Stripe subscription activated. First intended TOTS collection: ${nextPayment.toISOString()}. TeamUp billing previously confirmed stopped.`,
    });

  return {
    subscription: updated,

    stripe: {
      subscriptionId:
        subscription.id,

      status:
        subscription.status,

      customerId:
        customer.id,

      priceId:
        price.id,

      firstTotsPaymentAt:
        nextPayment.toISOString(),
    },

    safety: {
      teamupBillingActive: false,

      totsCollectionEnabled: true,

      intendedImmediateMembershipCharge:
        false,
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
      body?.action as Action | undefined;

    const subscriptionId =
      typeof body?.subscriptionId ===
      "string"
        ? body.subscriptionId
        : null;

    if (!action) {
      return NextResponse.json(
        {
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
    // BULK STRIPE RECONCILIATION
    // ========================================================

    if (action === "scan") {
      const result =
        await bulkScan(accountId);

      return NextResponse.json({
        ok: true,

        action: "scan",

        stripeAccountId:
          accountId,

        ...result,

        safety: {
          paymentsCollected: 0,
          subscriptionsCreated: 0,
          customersCreated: 0,
          checkoutSessionsCreated: 0,
          teamupBillingDisabled: 0,
          totsCollectionEnabled: 0,
        },

        performedBy:
          user.email ?? user.id,
      });
    }

    // ========================================================
    // EVERYTHING BELOW REQUIRES ONE RECORD
    // ========================================================

    if (!subscriptionId) {
      return NextResponse.json(
        {
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
    // SINGLE SAFE RECONCILIATION
    // ========================================================

    if (action === "scan_one") {
      const result =
        await scanOne(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action: "scan_one",

        result,

        safety: {
          paymentsCollected: 0,
          subscriptionsCreated: 0,
          customersCreated: 0,
          checkoutSessionsCreated: 0,
          teamupBillingDisabled: 0,
          totsCollectionEnabled: 0,
        },
      });
    }

    // ========================================================
    // FALLBACK PAYMENT SETUP
    // ========================================================

    if (action === "setup") {
      /**
       * Try Stripe copy reconciliation first.
       */

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
        return NextResponse.json({
          ok: true,

          action: "setup",

          automatic: true,

          message:
            "No payment setup link is required. The copied Stripe customer/payment method was verified automatically.",

          result: automatic,

          safety: {
            paymentsCollected: 0,
            subscriptionsCreated: 0,
            customersCreated: 0,
            checkoutSessionsCreated: 0,
            teamupBillingDisabled: 0,
            totsCollectionEnabled: 0,
          },
        });
      }

      const setup =
        await createFallbackSetup(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action: "setup",

        message:
          setup.automatic
            ? "Copied Stripe payment method was verified automatically."
            : "A fallback Stripe payment setup link was created.",

        ...setup,
      });
    }

    // ========================================================
    // VERIFY FALLBACK
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
    // RECORD TEAMUP STOP
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
    // ACTIVATE TOTS
    // ========================================================

    if (
      action === "activate"
    ) {
      const result =
        await activate(
          row,
          accountId,
        );

      return NextResponse.json({
        ok: true,

        action: "activate",

        ...result,
      });
    }

    return NextResponse.json(
      {
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

    const status =
      message === "Unauthorised"
        ? 401
        : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}