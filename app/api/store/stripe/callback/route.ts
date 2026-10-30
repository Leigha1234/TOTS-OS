import { NextRequest, NextResponse } from "next/server";
import { admin, baseUrl, stripe, syncAccount, verifyState } from "@/lib/store-stripe-connect";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const back = new URL("/dashboard/store?stripe=connected", baseUrl());
  try {
    const params = req.nextUrl.searchParams;
    if (params.has("error")) throw Error(params.get("error_description") || "Stripe connection cancelled.");
    const state = params.get("state") || "";
    if (!state || state !== req.cookies.get("orbi_stripe_connect")?.value) throw Error("Stripe connection state mismatch.");
    const { organisationId, userId } = verifyState(state);
    // The signed state is bound to the authenticated user who initiated OAuth.
    // Recheck the user's current organisation membership before persisting the account.
    const { data: org } = await admin.from("organisations").select("*").eq("id", organisationId).maybeSingle();
    if (!org) throw Error("Organisation not found.");
    let permitted = ["user_id", "owner_id", "created_by"].some(k => org[k] === userId);
    for (const table of ["organisation_members", "organization_members", "organisation_users", "organization_users"]) {
      if (permitted) break;
      const { data } = await admin.from(table).select("user_id").eq("organisation_id", organisationId).eq("user_id", userId).limit(1);
      permitted = !!data?.length;
    }
    if (!permitted) throw Error("Organisation access was revoked.");
    const code = params.get("code");
    if (!code) throw Error("Stripe did not return an authorisation code.");
    const token = await stripe.oauth.token({ grant_type: "authorization_code", code });
    if (!token.stripe_user_id) throw Error("Stripe did not return an account ID.");
    const { data: existing } = await admin.from("store_stripe_accounts").select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (existing?.stripe_account_id && existing.stripe_account_id !== token.stripe_user_id) {
      // Prevent silently changing the recipient of payments on an established store.
      throw Error("This store is already connected to a different Stripe account. Contact support to change it safely.");
    }
    await syncAccount(organisationId, token.stripe_user_id);
  } catch (e) {
    back.searchParams.set("stripe", "error");
    back.searchParams.set("stripe_error", e instanceof Error ? e.message.slice(0, 180) : "Connection failed");
  }
  const response = NextResponse.redirect(back);
  response.cookies.delete("orbi_stripe_connect");
  return response;
}
