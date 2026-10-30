
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import crypto from "node:crypto";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
export function signState(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.STRIPE_CONNECT_STATE_SECRET!).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyState(state: string): { organisationId: string; userId: string; expires: number } {
  const [body, signature] = state.split(".");
  if (!body || !signature) throw Error("Invalid Stripe state.");
  const expected = crypto.createHmac("sha256", process.env.STRIPE_CONNECT_STATE_SECRET!).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) throw Error("Invalid Stripe state signature.");
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (Date.now() > data.expires) throw Error("Stripe connection expired. Please try again.");
  return data;
}
export async function authorisedUser(token: string, organisationId: string, expectedUserId?: string) {
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user || (expectedUserId && expectedUserId !== user.id)) throw Error("Not authenticated.");
  const { data: org, error: orgError } = await admin.from("organisations").select("created_by").eq("id", organisationId).maybeSingle();
  if (orgError || !org) throw Error("Organisation not found.");
  if (org.created_by === user.id) return user;
  const { data: membership, error: memberError } = await admin.from("organisation_members")
    .select("role").eq("user_id", user.id).eq("organisation_id", organisationId).eq("role", "owner").maybeSingle();
  if (memberError || !membership) throw Error("Only organisation owners can manage Stripe connections.");
  return user;
}
export async function syncAccount(organisationId: string, accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  const { error } = await admin.from("store_stripe_accounts").upsert({
    organisation_id: organisationId, stripe_account_id: accountId,
    charges_enabled: account.charges_enabled === true,
    payouts_enabled: account.payouts_enabled === true,
    details_submitted: account.details_submitted === true,
    onboarding_complete: account.details_submitted === true && account.charges_enabled === true && account.payouts_enabled === true,
    default_currency: account.default_currency || "gbp", updated_at: new Date().toISOString(),
  }, { onConflict: "organisation_id" });
  if (error) throw error;
  return account;
}
