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
  billing_provider: string;

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

type ScanResult = {
  subscriptionId: string;
  customerName: string | null;
  email: string | null;

  result:
    | "verified"
    | "waiting_for_stripe_copy"
    | "multiple_customers"
    | "no_payment_method"
    | "not_stripe"
    | "non_recurring"
    | "already_verified"
    | "error";

  stripeCustomerId?: string | null;
  paymentMethodId?: string | null;

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

  const account = await stripe.accounts.retrieve(data.stripe_account_id);

  if (!account.charges_enabled) {
    throw new Error("MTC Stripe account cannot currently accept payments.");
  }

  return {
    accountId: data.stripe_account_id as string,
    account,
  };
}

// ============================================================
// DATABASE HELPERS
// ============================================================

async function loadSubscription(id: string): Promise<StoreSubscription> {
  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", ORGANISATION_ID)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Subscription record not found.");

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

  if (!data?.length) return null;

  return data[0] as MigrationSource;
}

function metadata(row: StoreSubscription) {
  return {
    ...(row.metadata ?? {}),
  } as Record<string, unknown>;
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
  const provider = String(
    row.payment_provider ?? row.billing_provider ?? "",
  ).toLowerCase();

  return provider === "stripe";
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
      throw new Error(`Unsupported billing interval: ${interval}`);
  }
}

// ============================================================
// STRIPE CUSTOMER MATCHING
// ============================================================

async function retrieveCustomer(
  accountId: string,
  customerId: string,
): Promise<Stripe.Customer | null> {
  try {
    const result = await stripe.customers.retrieve(customerId, {
      stripeAccount: accountId,
    });

    if (result.deleted) return null;

    return result;
  } catch {
    return null;
  }
}

async function searchCustomersByEmail(
  accountId: string,
  email: string,
): Promise<Stripe.Customer[]> {
  const escaped = email.replace(/'/g, "\\'");

  try {
    const result = await stripe.customers.search(
      {
        query: `email:'${escaped}'`,
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    );

    return result.data;
  } catch (error) {
    console.warn("[STRIPE CUSTOMER SEARCH]", error);

    // Fallback for accounts where search indexing is delayed.
    const result = await stripe.customers.list(
      {
        email,
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    );

    return result.data;
  }
}

async function findCopiedCustomer(
  row: StoreSubscription,
  accountId: string,
) {
  /**
   * FIRST CHOICE:
   * The customer-copy operation is expected to preserve Stripe Customer IDs
   * where supported.
   *
   * Therefore external_customer_id is the strongest match.
   */

  const importedCustomerId =
    row.external_customer_id?.startsWith("cus_")
      ? row.external_customer_id
      : null;

  if (importedCustomerId) {
    const exact = await retrieveCustomer(accountId, importedCustomerId);

    if (exact) {
      return {
        customer: exact,
        match: "external_customer_id" as const,
        candidates: [exact],
      };
    }
  }

  /**
   * SECOND CHOICE:
   * Existing stripe_customer_id.
   *
   * Be careful: our earlier Sam Hill setup attempts created new empty
   * customers in this connected account. We therefore don't automatically
   * trust this more than the imported TeamUp customer ID.
   */

  if (row.stripe_customer_id?.startsWith("cus_")) {
    const existing = await retrieveCustomer(
      accountId,
      row.stripe_customer_id,
    );

    if (existing) {
      return {
        customer: existing,
        match: "existing_stripe_customer_id" as const,
        candidates: [existing],
      };
    }
  }

  /**
   * THIRD CHOICE:
   * Email.
   *
   * We only auto-select an email match when exactly one candidate exists.
   * Shared emails and duplicate Stripe customers must not be guessed.
   */

  if (!row.customer_email) {
    return {
      customer: null,
      match: "none" as const,
      candidates: [] as Stripe.Customer[],
    };
  }

  const candidates = await searchCustomersByEmail(
    accountId,
    row.customer_email.trim(),
  );

  if (candidates.length === 1) {
    return {
      customer: candidates[0],
      match: "email" as const,
      candidates,
    };
  }

  return {
    customer: null,
    match:
      candidates.length > 1
        ? ("multiple_email_matches" as const)
        : ("none" as const),
    candidates,
  };
}

// ============================================================
// PAYMENT METHOD DISCOVERY
// ============================================================

async function findReusablePaymentMethod(
  accountId: string,
  customer: Stripe.Customer,
) {
  /**
   * Check invoice_settings.default_payment_method first.
   */

  const defaultPm = customer.invoice_settings?.default_payment_method;

  if (typeof defaultPm === "string" && defaultPm.startsWith("pm_")) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        defaultPm,
        {
          stripeAccount: accountId,
        },
      );

      if (
        paymentMethod.customer === customer.id &&
        paymentMethod.type === "card"
      ) {
        return paymentMethod;
      }
    } catch {
      // Continue to list methods.
    }
  }

  /**
   * Then list reusable card payment methods attached to the customer.
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

  if (!methods.data.length) {
    return null;
  }

  /**
   * Prefer a non-expired card.
   */

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  const valid = methods.data.find((method) => {
    const card = method.card;

    if (!card?.exp_year || !card?.exp_month) return true;

    if (card.exp_year > currentYear) return true;

    return (
      card.exp_year === currentYear &&
      card.exp_month >= currentMonth
    );
  });

  return valid ?? methods.data[0];
}

// ============================================================
// VERIFY A SINGLE MIGRATED MEMBER
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

    if (
      row.processor_verification_status === "verified" &&
      row.cutover_status === "verified"
    ) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "already_verified",
        stripeCustomerId: row.stripe_customer_id,
      };
    }

    const match = await findCopiedCustomer(row, accountId);

    if (
      match.match === "multiple_email_matches" &&
      !match.customer
    ) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "multiple_customers",
        message: `${match.candidates.length} Stripe customers have this email. Manual match required.`,
      };
    }

    if (!match.customer) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "waiting_for_stripe_copy",
        message: "Copied Stripe customer not found yet.",
      };
    }

    const paymentMethod = await findReusablePaymentMethod(
      accountId,
      match.customer,
    );

    if (!paymentMethod) {
      return {
        subscriptionId: row.id,
        customerName: row.customer_name,
        email: row.customer_email,
        result: "no_payment_method",
        stripeCustomerId: match.customer.id,
        message:
          "Customer exists in the new MTC Stripe account but no reusable card payment method is available yet.",
      };
    }

    const source = await getMigrationSource(row);

    const meta = metadata(row);

    const now = new Date().toISOString();

    const newMetadata = {
      ...meta,

      mtc_auto_migration: true,
      mtc_auto_verified_at: now,

      mtc_stripe_customer_match: match.match,

      mtc_copied_customer_id: match.customer.id,
      mtc_copied_payment_method_id: paymentMethod.id,

      mtc_payment_method_type: paymentMethod.type,

      mtc_source_last_payment_at:
        source?.last_payment_at ??
        row.last_payment_at ??
        null,

      mtc_source_last_payment_amount_pence:
        source?.last_payment_amount_pence ??
        row.last_payment_amount_pence ??
        null,
    };

    await patchSubscription(row.id, {
      stripe_account_id: accountId,

      stripe_customer_id: match.customer.id,

      processor_verification_status: "verified",
      processor_verified_at: now,

      cutover_status: "verified",

      collection_enabled: false,

      // CRITICAL:
      // Stripe copy/verification must never disable TeamUp.
      teamup_billing_active: true,

      last_payment_at:
        source?.last_payment_at ??
        row.last_payment_at ??
        null,

      last_payment_amount_pence:
        source?.last_payment_amount_pence ??
        row.last_payment_amount_pence ??
        null,

      metadata: newMetadata,

      migration_notes:
        "Copied Stripe customer and reusable payment method verified automatically. TeamUp remains active. TOTS collection remains disabled.",
    });

    return {
      subscriptionId: row.id,
      customerName: row.customer_name,
      email: row.customer_email,

      result: "verified",

      stripeCustomerId: match.customer.id,
      paymentMethodId: paymentMethod.id,

      message:
        "Copied customer/payment method verified. No payment collected.",
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
// BULK SCAN
// ============================================================

async function bulkScan(accountId: string) {
  /**
   * Only inspect:
   *
   * - MTC organisation
   * - legacy TeamUp billing records
   * - collection currently OFF
   *
   * We deliberately DO NOT require cutover_status=awaiting_processor,
   * because the historical import may contain not_started or other valid
   * pre-cutover states.
   */

  const { data, error } = await admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID)
    .eq("legacy_billing", true)
    .eq("collection_enabled", false)
    .eq("teamup_billing_active", true)
    .order("customer_name", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as StoreSubscription[];

  const results: ScanResult[] = [];

  /**
   * Sequential intentionally.
   *
   * There are only a few hundred records and this avoids hammering Stripe
   * with hundreds of simultaneous API calls.
   */

  for (const row of rows) {
    const result = await scanOne(row, accountId);
    results.push(result);
  }

  const counts = results.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.result] = (acc[item.result] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    scanned: results.length,
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
    throw new Error("TOTS collection is already enabled.");
  }

  /**
   * First try to use the copied customer.
   */

  const match = await findCopiedCustomer(row, accountId);

  let customer = match.customer;

  /**
   * Only create a customer as a LAST RESORT fallback.
   */

  if (!customer) {
    customer = await stripe.customers.create(
      {
        email: row.customer_email ?? undefined,
        name: row.customer_name ?? undefined,

        metadata: {
          tots_store_subscription_id: row.id,
          mtc_payment_setup_fallback: "true",
        },
      },
      {
        stripeAccount: accountId,
        idempotencyKey: `mtc-fallback-customer-${row.id}`,
      },
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

  const session = await stripe.checkout.sessions.create(
    {
      mode: "setup",

      customer: customer.id,

      payment_method_types: ["card"],

      success_url: `${appUrl}/store?payment_setup=success`,
      cancel_url: `${appUrl}/store?payment_setup=cancelled`,

      metadata: {
        tots_store_subscription_id: row.id,
        mtc_migration: "true",
        mtc_payment_setup_fallback: "true",
      },

      setup_intent_data: {
        metadata: {
          tots_store_subscription_id: row.id,
          mtc_migration: "true",
        },
      },
    },
    {
      stripeAccount: accountId,

      /**
       * A timestamp bucket allows a genuinely new setup session later
       * instead of permanently returning an expired Checkout Session.
       */

      idempotencyKey:
        `mtc-fallback-setup-${row.id}-${Math.floor(
          Date.now() / (30 * 60 * 1000),
        )}`,
    },
  );

  const meta = metadata(row);

  await patchSubscription(row.id, {
    stripe_account_id: accountId,
    stripe_customer_id: customer.id,

    cutover_status: "awaiting_processor",

    collection_enabled: false,
    teamup_billing_active: true,

    metadata: {
      ...meta,

      mtc_migration_setup_session_id: session.id,
      mtc_migration_setup_created_at:
        new Date().toISOString(),

      mtc_payment_setup_fallback: true,
    },

    migration_notes:
      "Fallback payment setup requested because copied reusable payment method was unavailable. TeamUp remains active.",
  });

  return {
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
   * First attempt automatic copied-payment verification.
   */

  const automatic = await scanOne(row, accountId);

  if (
    automatic.result === "verified" ||
    automatic.result === "already_verified"
  ) {
    return automatic;
  }

  /**
   * Otherwise verify the Checkout setup fallback.
   */

  const meta = metadata(row);

  const sessionId =
    typeof meta.mtc_migration_setup_session_id === "string"
      ? meta.mtc_migration_setup_session_id
      : null;

  if (!sessionId) {
    throw new Error(
      "No Stripe payment setup session exists for this member.",
    );
  }

  const session = await stripe.checkout.sessions.retrieve(
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

  const setupIntent = session.setup_intent;

  if (
    !setupIntent ||
    typeof setupIntent === "string"
  ) {
    throw new Error(
      "Stripe setup intent could not be loaded.",
    );
  }

  if (setupIntent.status !== "succeeded") {
    throw new Error(
      `Stripe payment setup is ${setupIntent.status}.`,
    );
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
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
    throw new Error("Stripe customer is missing.");
  }

  await stripe.customers.update(
    customerId,
    {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    },
    {
      stripeAccount: accountId,
    },
  );

  const now = new Date().toISOString();

  await patchSubscription(row.id, {
    stripe_account_id: accountId,
    stripe_customer_id: customerId,

    processor_verification_status: "verified",
    processor_verified_at: now,

    cutover_status: "verified",

    collection_enabled: false,
    teamup_billing_active: true,

    metadata: {
      ...meta,

      mtc_migration_payment_method_id:
        paymentMethodId,

      mtc_payment_method_verified_at: now,
    },

    migration_notes:
      "Reusable Stripe payment method verified. TeamUp remains active and TOTS collection remains disabled.",
  });

  return {
    verified: true,

    stripeCustomerId: customerId,
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
  if (!row.unit_amount_pence || row.unit_amount_pence <= 0) {
    throw new Error("Membership has no recurring amount.");
  }

  if (!row.billing_interval) {
    throw new Error("Membership has no billing interval.");
  }

  const meta = metadata(row);

  const savedPriceId =
    typeof meta.mtc_migration_price_id === "string"
      ? meta.mtc_migration_price_id
      : null;

  if (savedPriceId) {
    try {
      const existing = await stripe.prices.retrieve(
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

  const product = await stripe.products.create(
    {
      name:
        row.legacy_membership_name ??
        "Moray Training Club Membership",

      metadata: {
        tots_store_subscription_id: row.id,
        mtc_legacy_membership: "true",
      },
    },
    {
      stripeAccount: accountId,
      idempotencyKey: `mtc-migration-product-${row.id}`,
    },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,

      currency: row.currency || "gbp",

      unit_amount: row.unit_amount_pence,

      recurring: {
        interval: stripeInterval(row.billing_interval),
      },

      metadata: {
        tots_store_subscription_id: row.id,
        mtc_legacy_membership: "true",
      },
    },
    {
      stripeAccount: accountId,
      idempotencyKey: `mtc-migration-price-${row.id}`,
    },
  );

  await patchSubscription(row.id, {
    stripe_price_id: price.id,

    metadata: {
      ...meta,

      mtc_migration_product_id: product.id,
      mtc_migration_price_id: price.id,
    },
  });

  return price;
}

// ============================================================
// TEAMUP STOP CONFIRMATION
// ============================================================

async function markTeamupStopped(row: StoreSubscription) {
  if (
    row.processor_verification_status !== "verified" ||
    !["verified", "ready"].includes(row.cutover_status)
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

  const updated = await patchSubscription(row.id, {
    teamup_billing_active: false,
    teamup_billing_disabled_at: now,

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
  /**
   * HARD SAFETY LOCKS
   */

  if (row.collection_enabled) {
    throw new Error("TOTS collection is already enabled.");
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

  if (row.processor_verification_status !== "verified") {
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
    throw new Error("Verified Stripe customer ID is missing.");
  }

  const customer = await retrieveCustomer(
    accountId,
    row.stripe_customer_id,
  );

  if (!customer) {
    throw new Error(
      "Verified Stripe customer no longer exists in the MTC account.",
    );
  }

  const paymentMethod = await findReusablePaymentMethod(
    accountId,
    customer,
  );

  if (!paymentMethod) {
    throw new Error(
      "Verified customer no longer has a reusable payment method.",
    );
  }

  /**
   * IMPORTANT BILLING-DATE SAFETY
   *
   * We do NOT guess a billing date.
   *
   * Activation requires next_payment_at to have been deliberately populated.
   */

  if (!row.next_payment_at) {
    throw new Error(
      "REFUSED: next_payment_at is missing. Set/verify the member's next TeamUp renewal date before activating TOTS.",
    );
  }

  const nextPayment = new Date(row.next_payment_at);

  if (Number.isNaN(nextPayment.getTime())) {
    throw new Error(
      "REFUSED: next_payment_at is not a valid date.",
    );
  }

  const now = new Date();

  /**
   * Require at least a small future buffer.
   */

  if (nextPayment.getTime() <= now.getTime() + 5 * 60 * 1000) {
    throw new Error(
      "REFUSED: next_payment_at must be in the future. Review this member before activation.",
    );
  }

  const price = await ensureRecurringPrice(
    row,
    accountId,
  );

  const meta = metadata(row);

  /**
   * Create the subscription with a trial ending at the member's
   * next intended collection date.
   *
   * This prevents an immediate charge today.
   *
   * At trial_end Stripe begins normal recurring billing using the
   * migrated membership price.
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

        default_payment_method: paymentMethod.id,

        trial_end: Math.floor(
          nextPayment.getTime() / 1000,
        ),

        proration_behavior: "none",

        metadata: {
          tots_store_subscription_id: row.id,
          mtc_migration: "true",
          migrated_from: "teamup",
          legacy_membership:
            row.legacy_membership_name ?? "",
        },
      },
      {
        stripeAccount: accountId,

        idempotencyKey: `mtc-cutover-${row.id}`,
      },
    );

  const activatedAt = new Date().toISOString();

  const updated = await patchSubscription(row.id, {
    stripe_account_id: accountId,
    stripe_customer_id: customer.id,

    stripe_subscription_id: subscription.id,
    stripe_price_id: price.id,

    external_subscription_id: subscription.id,

    billing_provider: "stripe",
    payment_provider: "stripe",

    status: subscription.status,

    legacy_billing: false,

    collection_enabled: true,
    collection_enabled_at: activatedAt,

    teamup_billing_active: false,

    cutover_status: "live",

    processor_verification_status: "verified",

    metadata: {
      ...meta,

      mtc_live_subscription_id:
        subscription.id,

      mtc_live_price_id: price.id,

      mtc_activation_at: activatedAt,

      mtc_first_tots_payment_at:
        nextPayment.toISOString(),
    },

    migration_notes:
      `TOTS Stripe subscription activated. First intended TOTS collection: ${nextPayment.toISOString()}. TeamUp billing previously confirmed stopped.`,
  });

  return {
    subscription: updated,

    stripe: {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: customer.id,
      priceId: price.id,

      firstTotsPaymentAt:
        nextPayment.toISOString(),
    },

    safety: {
      teamupBillingActive: false,
      totsCollectionEnabled: true,

      /**
       * Because we used trial_end, creation should not intentionally
       * collect the recurring membership fee immediately.
       */

      intendedImmediateMembershipCharge: false,
    },
  };
}

// ============================================================
// POST
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const body = await req.json();

    const action = body?.action as Action | undefined;
    const subscriptionId =
      typeof body?.subscriptionId === "string"
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

    // --------------------------------------------------------
    // BULK SCAN
    // --------------------------------------------------------

    if (action === "scan") {
      const result = await bulkScan(accountId);

      return NextResponse.json({
        ok: true,

        action: "scan",

        stripeAccountId: accountId,

        ...result,

        safety: {
          paymentsCollected: 0,
          subscriptionsCreated: 0,
          teamupBillingDisabled: 0,
          totsCollectionEnabled: 0,
        },

        performedBy: user.email ?? user.id,
      });
    }

    // Everything below requires a subscription.
    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: "Missing subscriptionId.",
        },
        {
          status: 400,
        },
      );
    }

    const row =
      await loadSubscription(subscriptionId);

    // --------------------------------------------------------
    // SINGLE AUTOMATIC SCAN
    // --------------------------------------------------------

    if (action === "scan_one") {
      const result = await scanOne(
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
          teamupBillingDisabled: 0,
          totsCollectionEnabled: 0,
        },
      });
    }

    // --------------------------------------------------------
    // FALLBACK PAYMENT SETUP
    // --------------------------------------------------------

    if (action === "setup") {
      /**
       * Before generating a link, always try the automatic copied
       * payment method first.
       */

      const automatic = await scanOne(
        row,
        accountId,
      );

      if (
        automatic.result === "verified" ||
        automatic.result === "already_verified"
      ) {
        return NextResponse.json({
          ok: true,

          action: "setup",

          automatic: true,

          message:
            "No payment setup link is required. Stripe's copied customer/payment method was found and verified automatically.",

          result: automatic,

          safety: {
            paymentsCollected: 0,
            subscriptionsCreated: 0,
            teamupBillingDisabled: 0,
            totsCollectionEnabled: 0,
          },
        });
      }

      const setup = await createFallbackSetup(
        row,
        accountId,
      );

      return NextResponse.json({
        ok: true,

        action: "setup",

        automatic: false,

        message:
          "Copied reusable payment method was unavailable. A fallback payment setup link was created.",

        ...setup,
      });
    }

    // --------------------------------------------------------
    // VERIFY
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // TEAMUP STOPPED
    // --------------------------------------------------------

    if (action === "teamup_stopped") {
      const result =
        await markTeamupStopped(row);

      return NextResponse.json({
        ok: true,
        action: "teamup_stopped",
        ...result,
      });
    }

    // --------------------------------------------------------
    // ACTIVATE
    // --------------------------------------------------------

    if (action === "activate") {
      const result = await activate(
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
        error: `Unknown action: ${action}`,
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