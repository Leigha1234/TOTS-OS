import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY!;

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

// ============================================================
// STRIPE
// ============================================================

const stripe =
  new Stripe(
    stripeSecretKey
  );

// ============================================================
// SAFE ERROR SERIALISER
// ============================================================

function serialiseError(
  error: unknown
) {
  if (
    error instanceof
    Stripe.errors.StripeError
  ) {
    return {
      stripeError: true,

      type:
        error.type,

      code:
        error.code || null,

      message:
        error.message,

      statusCode:
        error.statusCode || null,

      requestId:
        error.requestId || null,
    };
  }

  if (
    error instanceof
    Error
  ) {
    return {
      stripeError: false,

      type:
        error.name,

      code:
        null,

      message:
        error.message,

      statusCode:
        null,

      requestId:
        null,
    };
  }

  return {
    stripeError: false,

    type:
      "UnknownError",

    code:
      null,

    message:
      String(error),

    statusCode:
      null,

    requestId:
      null,
  };
}

// ============================================================
// GET
//
// IMPORTANT:
//
// This endpoint is deliberately READ ONLY.
//
// It does NOT:
//
// - create a connected account
// - create an Account Link
// - create a Customer
// - create a Subscription
// - create a PaymentIntent
// - charge anybody
// - write to Supabase
// - alter TeamUp
//
// It only asks Stripe what the current live platform can see.
// ============================================================

export async function GET() {
  const result: {
    checkedAt:
      string;

    mode:
      "live" | "test" | "unknown";

    platform: {
      ok:
        boolean;

      accountId:
        string | null;

      country:
        string | null;

      defaultCurrency:
        string | null;

      chargesEnabled:
        boolean | null;

      payoutsEnabled:
        boolean | null;

      detailsSubmitted:
        boolean | null;

      controller:
        unknown;

      error:
        ReturnType<
          typeof serialiseError
        > | null;
    };

    connectV1: {
      ok:
        boolean;

      accountCountReturned:
        number | null;

      hasMore:
        boolean | null;

      firstAccountIds:
        string[];

      error:
        ReturnType<
          typeof serialiseError
        > | null;
    };

    safety: {
      createdAccounts:
        number;

      createdCustomers:
        number;

      createdSubscriptions:
        number;

      createdPaymentIntents:
        number;

      databaseWrites:
        number;

      teamupChanges:
        number;
    };
  } = {
    checkedAt:
      new Date()
        .toISOString(),

    mode:
      stripeSecretKey.startsWith(
        "sk_live_"
      )
        ? "live"
        : stripeSecretKey.startsWith(
              "sk_test_"
            )
          ? "test"
          : "unknown",

    platform: {
      ok:
        false,

      accountId:
        null,

      country:
        null,

      defaultCurrency:
        null,

      chargesEnabled:
        null,

      payoutsEnabled:
        null,

      detailsSubmitted:
        null,

      controller:
        null,

      error:
        null,
    },

    connectV1: {
      ok:
        false,

      accountCountReturned:
        null,

      hasMore:
        null,

      firstAccountIds:
        [],

      error:
        null,
    },

    safety: {
      createdAccounts:
        0,

      createdCustomers:
        0,

      createdSubscriptions:
        0,

      createdPaymentIntents:
        0,

      databaseWrites:
        0,

      teamupChanges:
        0,
    },
  };

  // ==========================================================
  // 1. RETRIEVE PLATFORM ACCOUNT
  //
  // stripe.accounts.retrieve() with no account ID retrieves the
  // Stripe account belonging to the API key.
  //
  // READ ONLY.
  // ==========================================================

  try {
    const platform =
      await stripe.accounts.retrieve();

    result.platform = {
      ok:
        true,

      accountId:
        platform.id,

      country:
        platform.country || null,

      defaultCurrency:
        platform.default_currency ||
        null,

      chargesEnabled:
        platform.charges_enabled ===
        true,

      payoutsEnabled:
        platform.payouts_enabled ===
        true,

      detailsSubmitted:
        platform.details_submitted ===
        true,

      controller:
        platform.controller || null,

      error:
        null,
    };
  } catch (
    error:
      unknown
  ) {
    result.platform.error =
      serialiseError(
        error
      );
  }

  // ==========================================================
  // 2. TEST READ ACCESS TO CONNECTED ACCOUNTS V1
  //
  // This LISTS accounts only.
  //
  // It does NOT call:
  //
  // stripe.accounts.create()
  //
  // Therefore it cannot create an MTC account.
  // ==========================================================

  try {
    const accounts =
      await stripe.accounts.list({
        limit:
          3,
      });

    result.connectV1 = {
      ok:
        true,

      accountCountReturned:
        accounts.data.length,

      hasMore:
        accounts.has_more,

      firstAccountIds:
        accounts.data.map(
          (
            account
          ) =>
            account.id
        ),

      error:
        null,
    };
  } catch (
    error:
      unknown
  ) {
    result.connectV1.error =
      serialiseError(
        error
      );
  }

  // ==========================================================
  // RESPONSE
  // ==========================================================

  return NextResponse.json(
    result,
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}