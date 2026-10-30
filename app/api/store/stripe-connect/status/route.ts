import { NextRequest, NextResponse } from "next/server";
import { admin, authorisedUser, syncAccount } from "@/lib/store-stripe-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const organisationId = request.nextUrl.searchParams.get("organisation_id");
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!organisationId || !token) return NextResponse.json({ error: "Organisation and authentication required." }, { status: 401 });
    await authorisedUser(token, organisationId);
    const { data, error } = await admin.from("store_stripe_accounts")
      .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (error) throw error;
    if (!data?.stripe_account_id) return NextResponse.json({ connected: false, account_id: null, charges_enabled: false, payouts_enabled: false, details_submitted: false });
    const account = await syncAccount(organisationId, data.stripe_account_id);
    return NextResponse.json({ connected: true, account_id: account.id, charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled, details_submitted: account.details_submitted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check Stripe connection.";
    return NextResponse.json({ error: message }, { status: /authenticated|owner|not found/i.test(message) ? 403 : 500 });
  }
}
