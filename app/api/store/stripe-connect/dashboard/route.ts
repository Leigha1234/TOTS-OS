import { NextRequest, NextResponse } from "next/server";
import { admin, authorisedUser, stripe } from "@/lib/store-stripe-connect";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    const body = await request.json().catch(() => ({}));
    const organisationId = body.organisation_id;
    if (!token || typeof organisationId !== "string") return NextResponse.json({ error: "Organisation and authentication required." }, { status: 401 });
    await authorisedUser(token, organisationId);
    const { data, error } = await admin.from("store_stripe_accounts")
      .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (error) throw error;
    if (!data?.stripe_account_id) return NextResponse.json({ error: "Connect Stripe first." }, { status: 404 });
    const account = await stripe.accounts.retrieve(data.stripe_account_id);
    if (account.type !== "express") return NextResponse.json({ error: "Dashboard login links require an Express account." }, { status: 400 });
    const link = await stripe.accounts.createLoginLink(account.id);
    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open Stripe dashboard.";
    return NextResponse.json({ error: message }, { status: /authenticated|owner|not found/i.test(message) ? 403 : 500 });
  }
}
