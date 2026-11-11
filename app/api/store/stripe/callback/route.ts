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
    const { organisationId, userId, expectedAccountId, targetAccountId } = verifyState(state);
    // Only the organisation owner can redirect funds. Never accept ordinary members.
    const { data: org, error: orgError } = await admin.from("organisations")
      .select("created_by").eq("id", organisationId).maybeSingle();
    if (orgError || !org) throw Error("Organisation not found.");
    if (org.created_by !== userId) {
      const { data: membership, error: membershipError } = await admin.from("organisation_members")
        .select("role").eq("organisation_id", organisationId).eq("user_id", userId)
        .eq("role", "owner").maybeSingle();
      if (membershipError || !membership) throw Error("Only organisation owners can change Stripe accounts.");
    }
    // Re-check current account before consuming the OAuth code.
    const { data: current, error: readError } = await admin.from("store_stripe_accounts")
      .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
    if (readError) throw readError;
    if ((current?.stripe_account_id || null) !== (expectedAccountId || null)) throw Error("Stripe account changed while connecting. No changes made.");
    const code = params.get("code");
    if (!code) throw Error("Stripe did not return an authorisation code.");
    const token = await stripe.oauth.token({ grant_type: "authorization_code", code });
    if (!token.stripe_user_id) throw Error("Stripe did not return an account ID.");
    if (targetAccountId && token.stripe_user_id !== targetAccountId) {
      throw Error("You authorised a different Stripe account. No changes made.");
    }
    const destination = await stripe.accounts.retrieve(token.stripe_user_id);
    if ("deleted" in destination && destination.deleted) throw Error("Stripe account is unavailable.");
    if (!destination.charges_enabled || !destination.payouts_enabled || !destination.details_submitted) {
      throw Error("Destination Stripe account must have charges, payouts and onboarding enabled before switching.");
    }
    if (expectedAccountId) {
      // Atomic compare-and-swap and durable audit are performed in Postgres.
      // The SQL migration MUST be installed before this flow is enabled.
      const { data: switched, error: switchError } = await admin.rpc("switch_store_stripe_account", {
        p_organisation_id: organisationId,
        p_expected_account_id: expectedAccountId,
        p_new_account_id: token.stripe_user_id,
        p_authorised_user_id: userId,
        p_charges_enabled: destination.charges_enabled,
        p_payouts_enabled: destination.payouts_enabled,
        p_details_submitted: destination.details_submitted,
        p_currency: destination.default_currency || "gbp",
      });
      if (switchError) throw switchError;
      if (switched !== true) throw Error("Stripe account changed while connecting. No changes made.");
    } else {
      // Initial connection: fail closed if another request connected an account.
      const { data: existing, error: existingError } = await admin.from("store_stripe_accounts")
        .select("stripe_account_id").eq("organisation_id", organisationId).maybeSingle();
      if (existingError) throw existingError;
      if (existing?.stripe_account_id) throw Error("A Stripe account was connected in another tab. Refresh and try again.");
      await syncAccount(organisationId, token.stripe_user_id);
    }
  } catch (e) {
    back.searchParams.set("stripe", "error");
    back.searchParams.set("stripe_error", e instanceof Error ? e.message.slice(0, 180) : "Connection failed");
  }
  const response = NextResponse.redirect(back);
  response.cookies.delete("orbi_stripe_connect");
  return response;
}
