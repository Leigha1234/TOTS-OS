import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(stripeSecretKey);

function serialiseError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      stripeError: true,
      type: error.type,
      code: error.code || null,
      message: error.message,
      statusCode: error.statusCode || null,
      requestId: error.requestId || null,
    };
  }

  if (error instanceof Error) {
    return {
      stripeError: false,
      type: error.name,
      code: null,
      message: error.message,
      statusCode: null,
      requestId: null,
    };
  }

  return {
    stripeError: false,
    type: "UnknownError",
    code: null,
    message: String(error),
    statusCode: null,
    requestId: null,
  };
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function GET() {
  const result: any = {
    checkedAt: new Date().toISOString(),

    mode: stripeSecretKey.startsWith("sk_live_")
      ? "live"
      : stripeSecretKey.startsWith("sk_test_")
        ? "test"
        : "unknown",

    platform: {
      ok: false,
      accountId: null,
      country: null,
      defaultCurrency: null,
      chargesEnabled: null,
      payoutsEnabled: null,
      detailsSubmitted: null,
      controller: null,
      error: null,
    },

    connectV1: {
      ok: false,
      accountCountReturned: null,
      hasMore: null,
      firstAccountIds: [],
      error: null,
    },

    connectV2: {
      attempted: true,
      readOnly: true,
      endpoint: "/v2/core/accounts",
      ok: false,
      httpStatus: null,
      stripeRequestId: null,
      response: null,
    },

    safety: {
      createdAccounts: 0,
      createdCustomers: 0,
      createdSubscriptions: 0,
      createdPaymentIntents: 0,
      createdAccountLinks: 0,
      databaseWrites: 0,
      teamupChanges: 0,
    },
  };

  // 1. Platform account — read only.
  try {
    const platform = await stripe.accounts.retrieve();

    result.platform = {
      ok: true,
      accountId: platform.id,
      country: platform.country || null,
      defaultCurrency: platform.default_currency || null,
      chargesEnabled: platform.charges_enabled === true,
      payoutsEnabled: platform.payouts_enabled === true,
      detailsSubmitted: platform.details_submitted === true,
      controller: platform.controller || null,
      error: null,
    };
  } catch (error: unknown) {
    result.platform.error = serialiseError(error);
  }

  // 2. Connect v1 account list — read only.
  try {
    const accounts = await stripe.accounts.list({ limit: 3 });

    result.connectV1 = {
      ok: true,
      accountCountReturned: accounts.data.length,
      hasMore: accounts.has_more,
      firstAccountIds: accounts.data.map((account) => account.id),
      error: null,
    };
  } catch (error: unknown) {
    result.connectV1.error = serialiseError(error);
  }

  // 3. Accounts v2 read test — GET only.
  try {
    const response = await fetch(
      "https://api.stripe.com/v2/core/accounts?limit=1",
      {
        method: "GET",
        headers: {
  Authorization: `Bearer ${stripeSecretKey}`,
  "Stripe-Version": "2026-08-26.dahlia",
  Accept: "application/json",
},
        cache: "no-store",
      }
    );

    const body = await readResponseBody(response);

    result.connectV2 = {
      attempted: true,
      readOnly: true,
      endpoint: "/v2/core/accounts",
      ok: response.ok,
      httpStatus: response.status,
      stripeRequestId:
        response.headers.get("request-id") ||
        response.headers.get("stripe-request-id") ||
        null,
      response: body,
    };
  } catch (error: unknown) {
    result.connectV2 = {
      attempted: true,
      readOnly: true,
      endpoint: "/v2/core/accounts",
      ok: false,
      httpStatus: null,
      stripeRequestId: null,
      response: serialiseError(error),
    };
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
