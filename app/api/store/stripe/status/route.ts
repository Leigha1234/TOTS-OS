import { NextRequest, NextResponse } from "next/server";
import { admin, authorisedUser, syncAccount } from "@/lib/store-stripe-connect";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const organisationId = req.nextUrl.searchParams.get("organisationId") || "";
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
    await authorisedUser(token, organisationId);
    const { data, error } = await admin.from("store_stripe_accounts").select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (error) throw error;
    if (!data?.stripe_account_id) return NextResponse.json({ connected: false });
    const account = await syncAccount(organisationId, data.stripe_account_id);
    return NextResponse.json({
      connected: true, stripe_account_id: account.id,
      charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to check Stripe status." }, { status: 403 });
  }
}
