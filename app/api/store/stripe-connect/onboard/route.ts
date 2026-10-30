import { NextRequest, NextResponse } from "next/server";
import { admin, authorisedUser, baseUrl, stripe, syncAccount } from "@/lib/store-stripe-connect";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    const body = await request.json().catch(() => ({}));
    const organisationId = body.organisation_id;
    if (!token || typeof organisationId !== "string") return NextResponse.json({ error: "Organisation and authentication required." }, { status: 401 });
    const user = await authorisedUser(token, organisationId);
    const origin = baseUrl();
    if (!origin || !origin.startsWith("https://")) throw new Error("Configure NEXT_PUBLIC_APP_URL with your HTTPS application URL.");
    const { data: existing, error: readError } = await admin.from("store_stripe_accounts")
      .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (readError) throw readError;
    let accountId = existing?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express", country: "GB", email: user.email, capabilities: { card_payments: { requested: true }, transfers: { requested: true } }, metadata: { organisation_id: organisationId } }, { idempotencyKey: `store-connect-${organisationId}` });
      accountId = account.id;
      await syncAccount(organisationId, accountId);
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/store?stripe_connect=refresh`,
      return_url: `${origin}/store?stripe_connect=return`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Stripe onboarding.";
    return NextResponse.json({ error: message }, { status: /authenticated|owner|not found/i.test(message) ? 403 : 500 });
  }
}
