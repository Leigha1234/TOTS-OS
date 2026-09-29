import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(stripeSecretKey);

const MTC_ACCOUNT_ID = "acct_1MtG4wPm08azSDKq";

export async function GET() {
  try {
    const account = await stripe.accounts.retrieve(MTC_ACCOUNT_ID);

    if ("deleted" in account && account.deleted) {
      return NextResponse.json({
        connected: false,
        reason: "Account is deleted",
      });
    }

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      type: account.type,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      country: account.country,
      defaultCurrency: account.default_currency,
    });
  } catch (error: unknown) {
    const stripeError = error as {
      message?: string;
      code?: string;
      statusCode?: number;
    };

    return NextResponse.json({
      connected: false,
      message: stripeError.message ?? "Unknown Stripe error",
      code: stripeError.code ?? null,
      statusCode: stripeError.statusCode ?? null,
    });
  }
}