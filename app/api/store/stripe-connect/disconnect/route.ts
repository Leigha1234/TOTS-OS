import { NextRequest, NextResponse } from "next/server";
import { admin, authorisedUser, stripe } from "@/lib/store-stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Intentionally fail closed: switching an account with payment history requires
// a migration that also updates checkout, refunds, webhooks and subscriptions.
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    const body = await request.json().catch(() => ({}));
    const organisationId = body.organisation_id;
    const expectedAccountId = body.expected_account_id;
    if (!token || typeof organisationId !== "string" || !organisationId ||
        typeof expectedAccountId !== "string" || !expectedAccountId) {
      return NextResponse.json({ error: "Organisation, account and authentication are required." }, { status: 400 });
    }
    await authorisedUser(token, organisationId);
    const { data: current, error: readError } = await admin.from("store_stripe_accounts")
      .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (readError) throw readError;
    if (!current?.stripe_account_id) return NextResponse.json({ error: "No Stripe account is connected." }, { status: 409 });
    if (current.stripe_account_id !== expectedAccountId) {
      return NextResponse.json({ error: "The connected Stripe account changed. Refresh and try again." }, { status: 409 });
    }
    const accountId = current.stripe_account_id;
    // Even a successful historical charge can have future refunds or disputes.
    // Do not unlink accounts that have ever processed a charge or subscription.
    const [charges, subscriptions, paymentIntents, balance, disputes] = await Promise.all([
      stripe.charges.list({ limit: 1 }, { stripeAccount: accountId }),
      stripe.subscriptions.list({ limit: 1, status: "all" }, { stripeAccount: accountId }),
      stripe.paymentIntents.list({ limit: 1 }, { stripeAccount: accountId }),
      stripe.balance.retrieve({ stripeAccount: accountId }),
      stripe.disputes.list({ limit: 1 }, { stripeAccount: accountId }),
    ]);
    const hasBalance = [...balance.available, ...balance.pending].some((item) => item.amount !== 0);
    if (charges.data.length || subscriptions.data.length || paymentIntents.data.length ||
        disputes.data.length || hasBalance) {
      return NextResponse.json({
        error: "This Stripe account has payment activity, subscriptions, disputes or funds. Automatic disconnection is blocked to protect existing transactions. A reviewed account migration is required.",
        requires_migration: true,
      }, { status: 409 });
    }
    // Delete only the exact account the owner reviewed; never delete Stripe itself.
    const { data: removed, error: deleteError } = await admin.from("store_stripe_accounts")
      .delete().eq("organisation_id", organisationId).eq("stripe_account_id", accountId)
      .select("stripe_account_id");
    if (deleteError) throw deleteError;
    if (removed?.length !== 1) throw new Error("Account changed while disconnecting. Refresh and try again.");
    return NextResponse.json({ disconnected: true, previous_account_id: accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect Stripe.";
    return NextResponse.json({ error: message }, { status: /authenticated|owner|not found/i.test(message) ? 403 : 500 });
  }
}
