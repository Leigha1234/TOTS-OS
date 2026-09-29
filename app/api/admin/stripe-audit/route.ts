import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  cookies,
} from "next/headers";

import {
  stripe,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// CONFIGURATION
// ============================================================

/*
 * Stripe account visible in the TeamUp Stripe dashboard URL:
 *
 * https://dashboard.stripe.com/acct_1MtG4wPm08azSDKq/...
 *
 * IMPORTANT:
 *
 * This does NOT mean the TOTS Stripe key automatically has
 * permission to access this account.
 *
 * The audit below will test that safely.
 */

const TEAMUP_STRIPE_ACCOUNT_ID =
  process.env.TEAMUP_STRIPE_ACCOUNT_ID ||
  "acct_1MtG4wPm08azSDKq";

// ============================================================
// TYPES
// ============================================================

type AuditMember = {
  name: string;
  email?: string | null;
  customerId?: string | null;
  expectedAmountPence?: number | null;
};

type AuditRequest = {
  members?: AuditMember[];
};

type RecentSuccessfulPayment = {
  paymentIntentId: string;
  amountPence: number;
  currency: string;
  createdAt: string;
  description: string | null;
};

type StripeContext =
  | "TOTS_DEFAULT"
  | "TEAMUP_ACCOUNT";

type StripeAccountInfo = {
  context: StripeContext;

  requestedAccountId:
    | string
    | null;

  accessible: boolean;

  accountId:
    | string
    | null;

  displayName:
    | string
    | null;

  country:
    | string
    | null;

  chargesEnabled:
    | boolean
    | null;

  payoutsEnabled:
    | boolean
    | null;

  error:
    | string
    | null;
};

type CustomerLookup = {
  customer:
    | Stripe.Customer
    | null;

  multipleEmailMatches:
    boolean;

  invalidCustomerId:
    boolean;
};

type ContextAudit = {
  context: StripeContext;

  stripeAccountId:
    | string
    | null;

  accountAccessible:
    boolean;

  found: boolean;

  stripeCustomerId:
    | string
    | null;

  stripeEmail:
    | string
    | null;

  stripeName:
    | string
    | null;

  defaultPaymentMethodId:
    | string
    | null;

  paymentMethodType:
    | string
    | null;

  cardBrand:
    | string
    | null;

  cardLast4:
    | string
    | null;

  cardExpiry:
    | string
    | null;

  hasReusablePaymentMethod:
    boolean;

  activeStripeSubscriptions:
    number;

  stripeSubscriptionIds:
    string[];

  recentSuccessfulPayments:
    RecentSuccessfulPayment[];

  matchingRecentPayment:
    boolean;

  multipleEmailMatches:
    boolean;

  invalidCustomerId:
    boolean;

  error:
    | string
    | null;
};

type StripeAuditResult = {
  name: string;

  email:
    | string
    | null;

  suppliedCustomerId:
    | string
    | null;

  expectedAmountPence:
    | number
    | null;

  found: boolean;

  foundInContext:
    | StripeContext
    | null;

  foundInStripeAccountId:
    | string
    | null;

  stripeCustomerId:
    | string
    | null;

  stripeEmail:
    | string
    | null;

  stripeName:
    | string
    | null;

  defaultPaymentMethodId:
    | string
    | null;

  paymentMethodType:
    | string
    | null;

  cardBrand:
    | string
    | null;

  cardLast4:
    | string
    | null;

  cardExpiry:
    | string
    | null;

  hasReusablePaymentMethod:
    boolean;

  activeStripeSubscriptions:
    number;

  stripeSubscriptionIds:
    string[];

  recentSuccessfulPayments:
    RecentSuccessfulPayment[];

  matchingRecentPayment:
    boolean;

  totsContext:
    ContextAudit;

  teamupContext:
    ContextAudit;

  auditStatus:
    | "VERIFIED_IN_TOTS_ACCOUNT"
    | "VERIFIED_IN_TEAMUP_ACCOUNT"
    | "CUSTOMER_FOUND_NO_PAYMENT_METHOD"
    | "CUSTOMER_NOT_FOUND"
    | "TEAMUP_ACCOUNT_NOT_ACCESSIBLE"
    | "MULTIPLE_EMAIL_MATCHES"
    | "INVALID_CUSTOMER_ID"
    | "ERROR";

  message: string;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableString(
  value: unknown
): string | null {
  const cleaned =
    cleanString(value);

  return cleaned || null;
}

function normaliseEmail(
  value: unknown
): string {
  return cleanString(value)
    .toLowerCase();
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  return "Unknown error.";
}

function unixToIso(
  value: number
): string {
  return new Date(
    value * 1000
  ).toISOString();
}

function getAccountDisplayName(
  account: Stripe.Account
): string | null {
  return (
    account.settings
      ?.dashboard
      ?.display_name ??
    account.business_profile
      ?.name ??
    null
  );
}

// ============================================================
// STRIPE REQUEST OPTIONS
// ============================================================

function stripeOptions(
  stripeAccountId?: string | null
): Stripe.RequestOptions | undefined {
  if (!stripeAccountId) {
    return undefined;
  }

  return {
    stripeAccount:
      stripeAccountId,
  };
}

// ============================================================
// AUTHENTICATION
// ============================================================

async function authenticateUser() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase is not configured."
    );
  }

  const cookieStore =
    await cookies();

  const supabase =
    createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Parameters<
                typeof cookieStore.set
              >[2];
            }[]
          ) {
            try {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options,
                }) => {
                  cookieStore.set(
                    name,
                    value,
                    options
                  );
                }
              );
            } catch {
              /*
               * This route only needs
               * to read the current
               * authentication session.
               */
            }
          },
        },
      }
    );

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser();

  return {
    user,
    error,
  };
}

// ============================================================
// STRIPE ACCOUNT AUDIT
// ============================================================

async function auditDefaultStripeAccount():
  Promise<StripeAccountInfo> {
  try {
    /*
     * With no stripeAccount option,
     * this asks Stripe which account
     * owns the configured secret key.
     */

    const account =
      await stripe.accounts.retrieve();

    return {
      context:
        "TOTS_DEFAULT",

      requestedAccountId:
        null,

      accessible:
        true,

      accountId:
        account.id,

      displayName:
        getAccountDisplayName(
          account
        ),

      country:
        account.country ??
        null,

      chargesEnabled:
        account.charges_enabled,

      payoutsEnabled:
        account.payouts_enabled,

      error:
        null,
    };
  } catch (error) {
    return {
      context:
        "TOTS_DEFAULT",

      requestedAccountId:
        null,

      accessible:
        false,

      accountId:
        null,

      displayName:
        null,

      country:
        null,

      chargesEnabled:
        null,

      payoutsEnabled:
        null,

      error:
        getErrorMessage(
          error
        ),
    };
  }
}

async function auditTeamUpStripeAccount():
  Promise<StripeAccountInfo> {
  try {
    /*
     * This is a READ-ONLY Connect request.
     *
     * It tests whether the TOTS Stripe key
     * has permission to act on behalf of
     * the Stripe account visible in the
     * TeamUp dashboard URL.
     */

    const account =
      await stripe.accounts.retrieve(
        TEAMUP_STRIPE_ACCOUNT_ID
      );

    return {
      context:
        "TEAMUP_ACCOUNT",

      requestedAccountId:
        TEAMUP_STRIPE_ACCOUNT_ID,

      accessible:
        true,

      accountId:
        account.id,

      displayName:
        getAccountDisplayName(
          account
        ),

      country:
        account.country ??
        null,

      chargesEnabled:
        account.charges_enabled,

      payoutsEnabled:
        account.payouts_enabled,

      error:
        null,
    };
  } catch (error) {
    return {
      context:
        "TEAMUP_ACCOUNT",

      requestedAccountId:
        TEAMUP_STRIPE_ACCOUNT_ID,

      accessible:
        false,

      accountId:
        null,

      displayName:
        null,

      country:
        null,

      chargesEnabled:
        null,

      payoutsEnabled:
        null,

      error:
        getErrorMessage(
          error
        ),
    };
  }
}

// ============================================================
// FIND CUSTOMER
// ============================================================

async function findCustomer(
  member: AuditMember,
  stripeAccountId?: string | null
): Promise<CustomerLookup> {
  const customerId =
    nullableString(
      member.customerId
    );

  const options =
    stripeOptions(
      stripeAccountId
    );

  // ----------------------------------------------------------
  // 1. EXACT CUSTOMER ID
  // ----------------------------------------------------------

  if (customerId) {
    if (
      !customerId.startsWith(
        "cus_"
      )
    ) {
      return {
        customer:
          null,

        multipleEmailMatches:
          false,

        invalidCustomerId:
          true,
      };
    }

    try {
      const customer =
        await stripe
          .customers
          .retrieve(
            customerId,
            options
          );

      if (customer.deleted) {
        return {
          customer:
            null,

          multipleEmailMatches:
            false,

          invalidCustomerId:
            false,
        };
      }

      return {
        customer,

        multipleEmailMatches:
          false,

        invalidCustomerId:
          false,
      };
    } catch (error) {
      if (
        error instanceof
        Stripe.errors
          .StripeInvalidRequestError
      ) {
        return {
          customer:
            null,

          multipleEmailMatches:
            false,

          invalidCustomerId:
            false,
        };
      }

      throw error;
    }
  }

  // ----------------------------------------------------------
  // 2. EMAIL LOOKUP
  // ----------------------------------------------------------

  const email =
    normaliseEmail(
      member.email
    );

  if (!email) {
    return {
      customer:
        null,

      multipleEmailMatches:
        false,

      invalidCustomerId:
        false,
    };
  }

  const customers =
    await stripe
      .customers
      .list(
        {
          email,
          limit: 10,
        },
        options
      );

  if (
    customers.data.length ===
    0
  ) {
    return {
      customer:
        null,

      multipleEmailMatches:
        false,

      invalidCustomerId:
        false,
    };
  }

  if (
    customers.data.length >
    1
  ) {
    return {
      customer:
        null,

      multipleEmailMatches:
        true,

      invalidCustomerId:
        false,
    };
  }

  return {
    customer:
      customers.data[0],

    multipleEmailMatches:
      false,

    invalidCustomerId:
      false,
  };
}

// ============================================================
// PAYMENT METHOD
// ============================================================

async function getPaymentMethod(
  customer: Stripe.Customer,
  stripeAccountId?: string | null
): Promise<
  Stripe.PaymentMethod | null
> {
  const options =
    stripeOptions(
      stripeAccountId
    );

  let paymentMethod:
    | Stripe.PaymentMethod
    | null = null;

  // ----------------------------------------------------------
  // CUSTOMER DEFAULT
  // ----------------------------------------------------------

  const invoiceDefault =
    customer
      .invoice_settings
      ?.default_payment_method;

  if (
    typeof invoiceDefault ===
    "string"
  ) {
    try {
      paymentMethod =
        await stripe
          .paymentMethods
          .retrieve(
            invoiceDefault,
            options
          );
    } catch {
      paymentMethod =
        null;
    }
  } else if (
    invoiceDefault &&
    typeof invoiceDefault ===
      "object"
  ) {
    paymentMethod =
      invoiceDefault;
  }

  // ----------------------------------------------------------
  // ATTACHED CARD FALLBACK
  // ----------------------------------------------------------

  if (!paymentMethod) {
    const methods =
      await stripe
        .paymentMethods
        .list(
          {
            customer:
              customer.id,

            type:
              "card",

            limit:
              10,
          },
          options
        );

    if (
      methods.data.length >
      0
    ) {
      paymentMethod =
        methods.data[0];
    }
  }

  return paymentMethod;
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

async function getSubscriptions(
  customerId: string,
  stripeAccountId?: string | null
): Promise<
  Stripe.Subscription[]
> {
  const subscriptions =
    await stripe
      .subscriptions
      .list(
        {
          customer:
            customerId,

          status:
            "all",

          limit:
            100,
        },
        stripeOptions(
          stripeAccountId
        )
      );

  return subscriptions.data.filter(
    subscription =>
      subscription.status ===
        "active" ||
      subscription.status ===
        "trialing" ||
      subscription.status ===
        "past_due"
  );
}

// ============================================================
// RECENT PAYMENTS
// ============================================================

async function getRecentPayments(
  customerId: string,
  stripeAccountId?: string | null
): Promise<
  RecentSuccessfulPayment[]
> {
  const intents =
    await stripe
      .paymentIntents
      .list(
        {
          customer:
            customerId,

          limit:
            20,
        },
        stripeOptions(
          stripeAccountId
        )
      );

  return intents.data
    .filter(
      intent =>
        intent.status ===
        "succeeded"
    )
    .map(
      intent => ({
        paymentIntentId:
          intent.id,

        amountPence:
          intent.amount_received,

        currency:
          intent.currency,

        createdAt:
          unixToIso(
            intent.created
          ),

        description:
          intent.description ??
          null,
      })
    );
}

// ============================================================
// EMPTY CONTEXT RESULT
// ============================================================

function emptyContextAudit(
  context: StripeContext,
  stripeAccountId:
    | string
    | null,
  accountAccessible: boolean,
  error:
    | string
    | null = null
): ContextAudit {
  return {
    context,

    stripeAccountId,

    accountAccessible,

    found:
      false,

    stripeCustomerId:
      null,

    stripeEmail:
      null,

    stripeName:
      null,

    defaultPaymentMethodId:
      null,

    paymentMethodType:
      null,

    cardBrand:
      null,

    cardLast4:
      null,

    cardExpiry:
      null,

    hasReusablePaymentMethod:
      false,

    activeStripeSubscriptions:
      0,

    stripeSubscriptionIds:
      [],

    recentSuccessfulPayments:
      [],

    matchingRecentPayment:
      false,

    multipleEmailMatches:
      false,

    invalidCustomerId:
      false,

    error,
  };
}

// ============================================================
// AUDIT MEMBER IN ONE STRIPE CONTEXT
// ============================================================

async function auditMemberInContext(
  member: AuditMember,
  context: StripeContext,
  accountAccessible: boolean,
  stripeAccountId?: string | null
): Promise<ContextAudit> {
  if (!accountAccessible) {
    return emptyContextAudit(
      context,
      stripeAccountId ??
        null,
      false,
      "Stripe account is not accessible using the configured TOTS Stripe credentials."
    );
  }

  const expectedAmountPence =
    Number.isInteger(
      member.expectedAmountPence
    ) &&
    Number(
      member.expectedAmountPence
    ) > 0
      ? Number(
          member.expectedAmountPence
        )
      : null;

  try {
    const lookup =
      await findCustomer(
        member,
        stripeAccountId
      );

    if (
      lookup.invalidCustomerId
    ) {
      const result =
        emptyContextAudit(
          context,
          stripeAccountId ??
            null,
          true
        );

      result.invalidCustomerId =
        true;

      return result;
    }

    if (
      lookup.multipleEmailMatches
    ) {
      const result =
        emptyContextAudit(
          context,
          stripeAccountId ??
            null,
          true
        );

      result.multipleEmailMatches =
        true;

      return result;
    }

    const customer =
      lookup.customer;

    if (!customer) {
      return emptyContextAudit(
        context,
        stripeAccountId ??
          null,
        true
      );
    }

    const [
      paymentMethod,
      subscriptions,
      payments,
    ] =
      await Promise.all([
        getPaymentMethod(
          customer,
          stripeAccountId
        ),

        getSubscriptions(
          customer.id,
          stripeAccountId
        ),

        getRecentPayments(
          customer.id,
          stripeAccountId
        ),
      ]);

    const card =
      paymentMethod?.card;

    const paymentMethodCustomer =
      paymentMethod?.customer;

    const paymentMethodCustomerId =
      typeof paymentMethodCustomer ===
      "string"
        ? paymentMethodCustomer
        : paymentMethodCustomer &&
            typeof paymentMethodCustomer ===
              "object" &&
            "id" in
              paymentMethodCustomer
          ? paymentMethodCustomer.id
          : null;

    const hasReusablePaymentMethod =
      Boolean(
        paymentMethod &&
        paymentMethodCustomerId ===
          customer.id
      );

    const matchingRecentPayment =
      expectedAmountPence !==
        null &&
      payments.some(
        payment =>
          payment.amountPence ===
          expectedAmountPence
      );

    return {
      context,

      stripeAccountId:
        stripeAccountId ??
        null,

      accountAccessible:
        true,

      found:
        true,

      stripeCustomerId:
        customer.id,

      stripeEmail:
        customer.email ??
        null,

      stripeName:
        customer.name ??
        null,

      defaultPaymentMethodId:
        paymentMethod?.id ??
        null,

      paymentMethodType:
        paymentMethod?.type ??
        null,

      cardBrand:
        card?.brand ??
        null,

      cardLast4:
        card?.last4 ??
        null,

      cardExpiry:
        card
          ? `${String(
              card.exp_month
            ).padStart(
              2,
              "0"
            )}/${card.exp_year}`
          : null,

      hasReusablePaymentMethod,

      activeStripeSubscriptions:
        subscriptions.length,

      stripeSubscriptionIds:
        subscriptions.map(
          subscription =>
            subscription.id
        ),

      recentSuccessfulPayments:
        payments,

      matchingRecentPayment,

      multipleEmailMatches:
        false,

      invalidCustomerId:
        false,

      error:
        null,
    };
  } catch (error) {
    return emptyContextAudit(
      context,
      stripeAccountId ??
        null,
      true,
      getErrorMessage(
        error
      )
    );
  }
}

// ============================================================
// EMPTY FINAL RESULT
// ============================================================

function emptyResult(
  member: {
    name: string;
    email: string | null;
    suppliedCustomerId:
      | string
      | null;
    expectedAmountPence:
      | number
      | null;
  },

  totsContext:
    ContextAudit,

  teamupContext:
    ContextAudit,

  auditStatus:
    StripeAuditResult["auditStatus"],

  message: string
): StripeAuditResult {
  return {
    name:
      member.name,

    email:
      member.email,

    suppliedCustomerId:
      member.suppliedCustomerId,

    expectedAmountPence:
      member.expectedAmountPence,

    found:
      false,

    foundInContext:
      null,

    foundInStripeAccountId:
      null,

    stripeCustomerId:
      null,

    stripeEmail:
      null,

    stripeName:
      null,

    defaultPaymentMethodId:
      null,

    paymentMethodType:
      null,

    cardBrand:
      null,

    cardLast4:
      null,

    cardExpiry:
      null,

    hasReusablePaymentMethod:
      false,

    activeStripeSubscriptions:
      0,

    stripeSubscriptionIds:
      [],

    recentSuccessfulPayments:
      [],

    matchingRecentPayment:
      false,

    totsContext,

    teamupContext,

    auditStatus,

    message,
  };
}

// ============================================================
// AUDIT ONE MEMBER
// ============================================================

async function auditMember(
  member: AuditMember,
  defaultAccount:
    StripeAccountInfo,
  teamupAccount:
    StripeAccountInfo
): Promise<StripeAuditResult> {
  const name =
    cleanString(
      member.name
    );

  const email =
    normaliseEmail(
      member.email
    ) || null;

  const suppliedCustomerId =
    nullableString(
      member.customerId
    );

  const expectedAmountPence =
    Number.isInteger(
      member.expectedAmountPence
    ) &&
    Number(
      member.expectedAmountPence
    ) > 0
      ? Number(
          member.expectedAmountPence
        )
      : null;

  const base = {
    name,
    email,
    suppliedCustomerId,
    expectedAmountPence,
  };

  // ----------------------------------------------------------
  // INVALID BASIC INPUT
  // ----------------------------------------------------------

  if (!name) {
    const totsContext =
      emptyContextAudit(
        "TOTS_DEFAULT",
        defaultAccount.accountId,
        defaultAccount.accessible
      );

    const teamupContext =
      emptyContextAudit(
        "TEAMUP_ACCOUNT",
        TEAMUP_STRIPE_ACCOUNT_ID,
        teamupAccount.accessible
      );

    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "ERROR",
      "Member name is required."
    );
  }

  if (
    !email &&
    !suppliedCustomerId
  ) {
    const totsContext =
      emptyContextAudit(
        "TOTS_DEFAULT",
        defaultAccount.accountId,
        defaultAccount.accessible
      );

    const teamupContext =
      emptyContextAudit(
        "TEAMUP_ACCOUNT",
        TEAMUP_STRIPE_ACCOUNT_ID,
        teamupAccount.accessible
      );

    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "CUSTOMER_NOT_FOUND",
      "No Stripe customer ID or email was supplied."
    );
  }

  // ==========================================================
  // 1. CHECK NORMAL TOTS STRIPE CONTEXT
  // ==========================================================

  const totsContext =
    await auditMemberInContext(
      member,
      "TOTS_DEFAULT",
      defaultAccount.accessible,
      null
    );

  // ==========================================================
  // 2. CHECK TEAMUP STRIPE ACCOUNT
  // ==========================================================

  const teamupContext =
    await auditMemberInContext(
      member,
      "TEAMUP_ACCOUNT",
      teamupAccount.accessible,
      TEAMUP_STRIPE_ACCOUNT_ID
    );

  // ==========================================================
  // INVALID CUSTOMER ID
  // ==========================================================

  if (
    totsContext.invalidCustomerId ||
    teamupContext.invalidCustomerId
  ) {
    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "INVALID_CUSTOMER_ID",
      `Supplied customer ID "${suppliedCustomerId}" is not a normal Stripe cus_ customer ID.`
    );
  }

  // ==========================================================
  // MULTIPLE EMAIL MATCHES
  // ==========================================================

  if (
    !suppliedCustomerId &&
    (
      totsContext.multipleEmailMatches ||
      teamupContext.multipleEmailMatches
    )
  ) {
    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "MULTIPLE_EMAIL_MATCHES",
      "Multiple Stripe customers use this email in at least one Stripe context. Manual matching is required."
    );
  }

  // ==========================================================
  // PREFER TEAMUP RESULT FOR LEGACY MIGRATION
  // ==========================================================

  /*
   * These are legacy TeamUp members.
   *
   * If the supplied legacy customer exists in the TeamUp
   * account, that is the authoritative migration result.
   */

  const selected =
    teamupContext.found
      ? teamupContext
      : totsContext.found
        ? totsContext
        : null;

  // ==========================================================
  // CUSTOMER FOUND
  // ==========================================================

  if (selected) {
    let auditStatus:
      StripeAuditResult["auditStatus"];

    if (
      selected.hasReusablePaymentMethod
    ) {
      auditStatus =
        selected.context ===
        "TEAMUP_ACCOUNT"
          ? "VERIFIED_IN_TEAMUP_ACCOUNT"
          : "VERIFIED_IN_TOTS_ACCOUNT";
    } else {
      auditStatus =
        "CUSTOMER_FOUND_NO_PAYMENT_METHOD";
    }

    let message: string;

    if (
      selected.context ===
      "TEAMUP_ACCOUNT"
    ) {
      if (
        selected.hasReusablePaymentMethod
      ) {
        message =
          selected.matchingRecentPayment
            ? "Legacy Stripe customer was verified inside the TeamUp Stripe account. It has an attached payment method and a recent successful payment matches the expected legacy amount. No billing changes were made."
            : "Legacy Stripe customer was verified inside the TeamUp Stripe account and has an attached payment method. No recent successful payment matched the expected amount, or no expected amount was supplied. No billing changes were made.";
      } else {
        message =
          "Legacy Stripe customer exists inside the TeamUp Stripe account, but no attached reusable card PaymentMethod was found. No billing changes were made.";
      }
    } else {
      if (
        selected.hasReusablePaymentMethod
      ) {
        message =
          selected.matchingRecentPayment
            ? "Stripe customer was verified in the default TOTS Stripe account with an attached payment method and matching recent payment. No billing changes were made."
            : "Stripe customer was verified in the default TOTS Stripe account with an attached payment method. No matching recent payment was found, or no expected amount was supplied. No billing changes were made.";
      } else {
        message =
          "Stripe customer exists in the default TOTS Stripe account, but no attached reusable card PaymentMethod was found. No billing changes were made.";
      }
    }

    return {
      name,
      email,
      suppliedCustomerId,
      expectedAmountPence,

      found:
        true,

      foundInContext:
        selected.context,

      foundInStripeAccountId:
        selected.stripeAccountId,

      stripeCustomerId:
        selected.stripeCustomerId,

      stripeEmail:
        selected.stripeEmail,

      stripeName:
        selected.stripeName,

      defaultPaymentMethodId:
        selected.defaultPaymentMethodId,

      paymentMethodType:
        selected.paymentMethodType,

      cardBrand:
        selected.cardBrand,

      cardLast4:
        selected.cardLast4,

      cardExpiry:
        selected.cardExpiry,

      hasReusablePaymentMethod:
        selected.hasReusablePaymentMethod,

      activeStripeSubscriptions:
        selected.activeStripeSubscriptions,

      stripeSubscriptionIds:
        selected.stripeSubscriptionIds,

      recentSuccessfulPayments:
        selected.recentSuccessfulPayments,

      matchingRecentPayment:
        selected.matchingRecentPayment,

      totsContext,

      teamupContext,

      auditStatus,

      message,
    };
  }

  // ==========================================================
  // TEAMUP ACCOUNT NOT ACCESSIBLE
  // ==========================================================

  if (
    !teamupAccount.accessible
  ) {
    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "TEAMUP_ACCOUNT_NOT_ACCESSIBLE",
      "The customer was not found in the default TOTS Stripe account, and the configured TOTS Stripe credentials cannot access the TeamUp Stripe account. This means the legacy customer cannot currently be verified or reused through this Stripe key."
    );
  }

  // ==========================================================
  // ERRORS
  // ==========================================================

  if (
    totsContext.error ||
    teamupContext.error
  ) {
    return emptyResult(
      base,
      totsContext,
      teamupContext,
      "ERROR",
      [
        totsContext.error
          ? `TOTS: ${totsContext.error}`
          : null,

        teamupContext.error
          ? `TeamUp: ${teamupContext.error}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ")
    );
  }

  // ==========================================================
  // NOT FOUND ANYWHERE
  // ==========================================================

  return emptyResult(
    base,
    totsContext,
    teamupContext,
    "CUSTOMER_NOT_FOUND",
    "No unique Stripe customer could be found in either accessible Stripe context."
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATE LOGGED-IN TOTS USER
    // ========================================================

    let auth;

    try {
      auth =
        await authenticateUser();
    } catch (error) {
      console.error(
        "[MTC STRIPE AUDIT] Supabase auth configuration error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Authentication service is not configured.",
        },
        {
          status: 500,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      auth.error ||
      !auth.user
    ) {
      console.error(
        "[MTC STRIPE AUDIT] Auth error:",
        auth.error
      );

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    let body:
      AuditRequest;

    try {
      body =
        (await req.json()) as
          AuditRequest;
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body must be valid JSON.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      !Array.isArray(
        body.members
      ) ||
      body.members.length ===
        0
    ) {
      return NextResponse.json(
        {
          error:
            "members must contain at least one member.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      body.members.length >
      100
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum 100 members per audit.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // DETERMINE STRIPE ACCOUNT ACCESS
    // ========================================================

    /*
     * Both calls are READ ONLY.
     */

    const [
      defaultStripeAccount,
      teamupStripeAccount,
    ] =
      await Promise.all([
        auditDefaultStripeAccount(),
        auditTeamUpStripeAccount(),
      ]);

    // ========================================================
    // AUDIT MEMBERS
    // ========================================================

    const results:
      StripeAuditResult[] =
      [];

    /*
     * Sequential on purpose to avoid
     * hammering Stripe while auditing
     * a large migration batch.
     */

    for (
      const member of
      body.members
    ) {
      results.push(
        await auditMember(
          member,
          defaultStripeAccount,
          teamupStripeAccount
        )
      );
    }

    // ========================================================
    // SUMMARY
    // ========================================================

    const verifiedInTots =
      results.filter(
        result =>
          result.auditStatus ===
          "VERIFIED_IN_TOTS_ACCOUNT"
      ).length;

    const verifiedInTeamUp =
      results.filter(
        result =>
          result.auditStatus ===
          "VERIFIED_IN_TEAMUP_ACCOUNT"
      ).length;

    const verifiedWithMatchingPayment =
      results.filter(
        result =>
          result.found &&
          result
            .hasReusablePaymentMethod &&
          result
            .matchingRecentPayment
      ).length;

    const noPaymentMethod =
      results.filter(
        result =>
          result.auditStatus ===
          "CUSTOMER_FOUND_NO_PAYMENT_METHOD"
      ).length;

    const notFound =
      results.filter(
        result =>
          result.auditStatus ===
          "CUSTOMER_NOT_FOUND"
      ).length;

    const teamupAccountNotAccessible =
      results.filter(
        result =>
          result.auditStatus ===
          "TEAMUP_ACCOUNT_NOT_ACCESSIBLE"
      ).length;

    const multipleMatches =
      results.filter(
        result =>
          result.auditStatus ===
          "MULTIPLE_EMAIL_MATCHES"
      ).length;

    const invalidIds =
      results.filter(
        result =>
          result.auditStatus ===
          "INVALID_CUSTOMER_ID"
      ).length;

    const errors =
      results.filter(
        result =>
          result.auditStatus ===
          "ERROR"
      ).length;

    const existingStripeSubscriptions =
      results.reduce(
        (
          total,
          result
        ) =>
          total +
          result
            .activeStripeSubscriptions,
        0
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          errors === 0,

        readOnly:
          true,

        authenticatedUserId:
          auth.user.id,

        generatedAt:
          new Date()
            .toISOString(),

        stripeAccounts: {
          totsDefault:
            defaultStripeAccount,

          teamup:
            teamupStripeAccount,

          sameAccount:
            Boolean(
              defaultStripeAccount
                .accountId &&
              teamupStripeAccount
                .accountId &&
              defaultStripeAccount
                .accountId ===
                teamupStripeAccount
                  .accountId
            ),
        },

        safety: {
          customersCreated:
            0,

          customersUpdated:
            0,

          subscriptionsCreated:
            0,

          subscriptionsUpdated:
            0,

          paymentMethodsChanged:
            0,

          paymentIntentsCreated:
            0,

          invoicesCreated:
            0,

          chargesCreated:
            0,

          paymentsChanged:
            0,

          teamupBillingChanged:
            0,
        },

        summary: {
          requested:
            results.length,

          verified:
            verifiedInTots +
            verifiedInTeamUp,

          verifiedInTots,

          verifiedInTeamUp,

          verifiedWithMatchingPayment,

          noPaymentMethod,

          notFound,

          teamupAccountNotAccessible,

          multipleMatches,

          invalidIds,

          errors,

          existingStripeSubscriptions,
        },

        results,
      },
      {
        status:
          errors === 0
            ? 200
            : 207,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "[MTC STRIPE AUDIT] Fatal error:",
      error
    );

    return NextResponse.json(
      {
        error:
          getErrorMessage(
            error
          ),
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}