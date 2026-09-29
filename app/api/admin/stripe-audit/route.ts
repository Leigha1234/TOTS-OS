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

type StripeAuditResult = {
  name: string;
  email: string | null;

  suppliedCustomerId:
    | string
    | null;

  stripeCustomerId:
    | string
    | null;

  found: boolean;

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

  expectedAmountPence:
    | number
    | null;

  matchingRecentPayment:
    boolean;

  auditStatus:
    | "VERIFIED_CUSTOMER_AND_PAYMENT_METHOD"
    | "CUSTOMER_FOUND_NO_PAYMENT_METHOD"
    | "CUSTOMER_NOT_FOUND"
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
               * This route only needs to
               * read the current session.
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
// FIND CUSTOMER
// ============================================================

async function findCustomer(
  member: AuditMember
): Promise<{
  customer:
    | Stripe.Customer
    | null;

  multipleEmailMatches:
    boolean;

  invalidCustomerId:
    boolean;
}> {
  const customerId =
    nullableString(
      member.customerId
    );

  // ----------------------------------------------------------
  // 1. EXACT CUSTOMER ID
  // ----------------------------------------------------------

  if (customerId) {
    /*
     * Only normal Stripe customer IDs are accepted here.
     *
     * This deliberately prevents gcus_... or other identifiers
     * from being treated as verified Stripe cus_ customers.
     */

    if (
      !customerId.startsWith(
        "cus_"
      )
    ) {
      return {
        customer: null,
        multipleEmailMatches:
          false,
        invalidCustomerId:
          true,
      };
    }

    try {
      const customer =
        await stripe.customers.retrieve(
          customerId
        );

      if (customer.deleted) {
        return {
          customer: null,
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
      /*
       * A customer ID may have come from another Stripe account
       * or may simply no longer exist.
       *
       * Treat a Stripe "not found" style request error as an
       * unsuccessful lookup rather than a fatal audit error.
       */

      if (
        error instanceof
        Stripe.errors
          .StripeInvalidRequestError
      ) {
        return {
          customer: null,
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
      customer: null,
      multipleEmailMatches:
        false,
      invalidCustomerId:
        false,
    };
  }

  const customers =
    await stripe.customers.list({
      email,
      limit: 10,
    });

  if (
    customers.data.length === 0
  ) {
    return {
      customer: null,
      multipleEmailMatches:
        false,
      invalidCustomerId:
        false,
    };
  }

  /*
   * Do not guess if multiple Stripe customers use the same
   * email address.
   *
   * This is especially important for MTC guardian/child and
   * other shared-email memberships.
   */

  if (
    customers.data.length > 1
  ) {
    return {
      customer: null,
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
  customer: Stripe.Customer
): Promise<
  Stripe.PaymentMethod | null
> {
  let paymentMethod:
    | Stripe.PaymentMethod
    | null = null;

  // ----------------------------------------------------------
  // 1. CUSTOMER DEFAULT PAYMENT METHOD
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
            invoiceDefault
          );
    } catch {
      paymentMethod = null;
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
  // 2. ATTACHED CARD FALLBACK
  // ----------------------------------------------------------

  if (!paymentMethod) {
    const methods =
      await stripe
        .paymentMethods
        .list({
          customer:
            customer.id,

          type: "card",

          limit: 10,
        });

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
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions =
    await stripe
      .subscriptions
      .list({
        customer:
          customerId,

        status:
          "all",

        limit:
          100,
      });

  /*
   * TeamUp appears to create individual membership payments
   * rather than Stripe Billing subscriptions for legacy MTC
   * memberships.
   *
   * We still audit Stripe subscriptions so we can detect any
   * member who DOES already have one and avoid accidentally
   * creating duplicate recurring billing later.
   */

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
// RECENT SUCCESSFUL PAYMENTS
// ============================================================

async function getRecentPayments(
  customerId: string
): Promise<
  RecentSuccessfulPayment[]
> {
  const intents =
    await stripe
      .paymentIntents
      .list({
        customer:
          customerId,

        limit:
          20,
      });

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
// EMPTY RESULT HELPER
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

    stripeCustomerId:
      null,

    found:
      false,

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

    expectedAmountPence:
      member.expectedAmountPence,

    matchingRecentPayment:
      false,

    auditStatus,

    message,
  };
}

// ============================================================
// AUDIT ONE MEMBER
// ============================================================

async function auditMember(
  member: AuditMember
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

  try {
    // --------------------------------------------------------
    // BASIC INPUT VALIDATION
    // --------------------------------------------------------

    if (!name) {
      return emptyResult(
        base,
        "ERROR",
        "Member name is required."
      );
    }

    if (
      !email &&
      !suppliedCustomerId
    ) {
      return emptyResult(
        base,
        "CUSTOMER_NOT_FOUND",
        "No Stripe customer ID or email was supplied."
      );
    }

    // --------------------------------------------------------
    // CUSTOMER LOOKUP
    // --------------------------------------------------------

    const lookup =
      await findCustomer(
        member
      );

    if (
      lookup.invalidCustomerId
    ) {
      return emptyResult(
        base,
        "INVALID_CUSTOMER_ID",
        `Supplied customer ID "${suppliedCustomerId}" is not a normal Stripe cus_ customer ID.`
      );
    }

    if (
      lookup.multipleEmailMatches
    ) {
      return emptyResult(
        base,
        "MULTIPLE_EMAIL_MATCHES",
        "Multiple Stripe customers use this email. Manual matching is required."
      );
    }

    const customer =
      lookup.customer;

    if (!customer) {
      return emptyResult(
        base,
        "CUSTOMER_NOT_FOUND",
        "No unique Stripe customer could be found."
      );
    }

    // --------------------------------------------------------
    // READ-ONLY STRIPE AUDIT
    // --------------------------------------------------------

    const [
      paymentMethod,
      subscriptions,
      payments,
    ] =
      await Promise.all([
        getPaymentMethod(
          customer
        ),

        getSubscriptions(
          customer.id
        ),

        getRecentPayments(
          customer.id
        ),
      ]);

    const card =
      paymentMethod?.card;

    /*
     * Stripe PaymentMethod.customer can be a string, Customer,
     * DeletedCustomer or null depending on API expansion/state.
     */

    const paymentMethodCustomer =
      paymentMethod?.customer;

    const paymentMethodCustomerId =
      typeof paymentMethodCustomer ===
      "string"
        ? paymentMethodCustomer
        : paymentMethodCustomer &&
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
      name,
      email,
      suppliedCustomerId,

      stripeCustomerId:
        customer.id,

      found:
        true,

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

      expectedAmountPence,

      matchingRecentPayment,

      auditStatus:
        hasReusablePaymentMethod
          ? "VERIFIED_CUSTOMER_AND_PAYMENT_METHOD"
          : "CUSTOMER_FOUND_NO_PAYMENT_METHOD",

      message:
        hasReusablePaymentMethod
          ? matchingRecentPayment
            ? "Stripe customer exists, has an attached payment method, and a recent successful payment matches the expected legacy amount."
            : "Stripe customer exists and has an attached payment method. No recent successful payment matched the expected legacy amount, or no expected amount was supplied."
          : "Stripe customer exists but no attached reusable card payment method was found.",
    };
  } catch (error) {
    console.error(
      `[MTC STRIPE AUDIT] ${name}:`,
      error
    );

    return emptyResult(
      base,
      "ERROR",
      getErrorMessage(
        error
      )
    );
  }
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
    // AUDIT
    // ========================================================
    //
    // Sequential on purpose.
    //
    // This endpoint only READS:
    //
    // - Stripe customers
    // - attached payment methods
    // - Stripe Billing subscriptions
    // - successful PaymentIntents
    //
    // It does NOT create or modify payments.
    // ========================================================

    const results:
      StripeAuditResult[] =
      [];

    for (
      const member of
      body.members
    ) {
      results.push(
        await auditMember(
          member
        )
      );
    }

    // ========================================================
    // SUMMARY
    // ========================================================

    const verified =
      results.filter(
        result =>
          result.auditStatus ===
          "VERIFIED_CUSTOMER_AND_PAYMENT_METHOD"
      ).length;

    const verifiedWithMatchingPayment =
      results.filter(
        result =>
          result.auditStatus ===
            "VERIFIED_CUSTOMER_AND_PAYMENT_METHOD" &&
          result.matchingRecentPayment
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

          verified,

          verifiedWithMatchingPayment,

          noPaymentMethod,

          notFound,

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