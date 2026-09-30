import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
  throw new Error("Missing Supabase/Stripe environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeSecretKey);

type Action = "setup" | "verify" | "teamup_stopped" | "activate";

type SubscriptionRow = {
  id: string;
  organisation_id: string;
  product_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  currency: string | null;
  unit_amount_pence: number | null;
  billing_interval: "week" | "month" | "year" | null;
  legacy_membership_name: string | null;
  collection_enabled: boolean;
  teamup_billing_active: boolean;
  cutover_status: string;
  metadata: Record<string, unknown> | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireUser(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("UNAUTHENTICATED");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHENTICATED");
  return data.user;
}

async function getStripeAccount(organisationId: string) {
  const { data, error } = await supabaseAdmin
    .from("store_stripe_accounts")
    .select("stripe_account_id, charges_enabled, onboarding_complete")
    .eq("organisation_id", organisationId)
    .maybeSingle();
  if (error) throw error;
  const accountId = text(data?.stripe_account_id);
  if (!accountId) throw new Error("MTC has no connected TOTS Stripe account.");
  const account = await stripe.accounts.retrieve(accountId);
  if ("deleted" in account && account.deleted) throw new Error("Connected Stripe account no longer exists.");
  if (!account.charges_enabled) throw new Error("Connected Stripe account cannot accept charges yet.");
  return accountId;
}

async function loadSubscription(subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from("store_subscriptions")
    .select("id, organisation_id, product_id, customer_name, customer_email, currency, unit_amount_pence, billing_interval, legacy_membership_name, collection_enabled, teamup_billing_active, cutover_status, metadata, stripe_customer_id, stripe_subscription_id")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Membership record not found.");
  return data as SubscriptionRow;
}

async function ensureCustomer(row: SubscriptionRow, accountId: string) {
  const meta = row.metadata || {};
  const saved = text(meta.tots_migration_customer_id) || text(row.stripe_customer_id);
  if (saved) {
    try {
      const customer = await stripe.customers.retrieve(saved, { stripeAccount: accountId });
      if (!("deleted" in customer && customer.deleted)) return customer.id;
    } catch { /* create below */ }
  }

  if (!text(row.customer_email)) throw new Error("This member has no email address for payment setup.");
  const customer = await stripe.customers.create(
    {
      email: text(row.customer_email),
      name: text(row.customer_name) || undefined,
      metadata: { tots_store_subscription_id: row.id, migration_source: "teamup" },
    },
    { stripeAccount: accountId },
  );
  return customer.id;
}

async function saveMetadata(row: SubscriptionRow, patch: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const metadata = { ...(row.metadata || {}), ...patch };
  const { error } = await supabaseAdmin
    .from("store_subscriptions")
    .update({ metadata, ...extra, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (error) throw error;
}

async function ensureRecurringPrice(row: SubscriptionRow, accountId: string) {
  const meta = row.metadata || {};
  const existingPriceId = text(meta.tots_migration_price_id);
  if (existingPriceId) {
    try {
      const price = await stripe.prices.retrieve(existingPriceId, { stripeAccount: accountId });
      if (price.active) return price.id;
    } catch { /* create below */ }
  }

  const amount = Number(row.unit_amount_pence || 0);
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("A valid recurring amount is required before TOTS billing can be activated.");
  const interval = row.billing_interval;
  if (!interval || !["week", "month", "year"].includes(interval)) throw new Error("A valid billing interval is required.");

  const product = await stripe.products.create(
    {
      name: row.legacy_membership_name || `MTC membership - ${row.customer_name || "member"}`,
      metadata: { tots_store_subscription_id: row.id, migration_source: "teamup" },
    },
    { stripeAccount: accountId },
  );
  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: (row.currency || "gbp").toLowerCase(),
      unit_amount: amount,
      recurring: { interval },
      metadata: { tots_store_subscription_id: row.id, migration_source: "teamup" },
    },
    { stripeAccount: accountId },
  );
  await saveMetadata(row, { tots_migration_product_id: product.id, tots_migration_price_id: price.id });
  return price.id;
}

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = await req.json();
    const subscriptionId = text(body.subscriptionId);
    const action = text(body.action) as Action;
    if (!subscriptionId || !["setup", "verify", "teamup_stopped", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid billing migration request." }, { status: 400 });
    }

    const row = await loadSubscription(subscriptionId);
    const accountId = await getStripeAccount(row.organisation_id);

    if (action === "setup") {
      if (row.collection_enabled) return NextResponse.json({ error: "TOTS billing is already active for this member." }, { status: 400 });
      if (!row.billing_interval || !row.unit_amount_pence || row.unit_amount_pence <= 0) {
        return NextResponse.json({ error: "This record does not have a valid recurring amount/interval." }, { status: 400 });
      }

      const customerId = await ensureCustomer(row, accountId);
      const origin = new URL(req.url).origin;
      const session = await stripe.checkout.sessions.create(
        {
          mode: "setup",
          customer: customerId,
          success_url: `${origin}/store?billing_setup=success&subscription=${encodeURIComponent(row.id)}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/store?billing_setup=cancelled&subscription=${encodeURIComponent(row.id)}`,
          metadata: { tots_store_subscription_id: row.id, organisation_id: row.organisation_id, migration_source: "teamup" },
          payment_method_types: ["card"],
        },
        { stripeAccount: accountId },
      );

      await saveMetadata(
        row,
        { tots_migration_customer_id: customerId, tots_migration_setup_session_id: session.id, tots_migration_setup_created_at: new Date().toISOString() },
        { cutover_status: "payment_setup_sent" },
      );

      return NextResponse.json({ success: true, url: session.url, cutoverStatus: "payment_setup_sent" });
    }

    if (action === "verify") {
      const sessionId = text((row.metadata || {}).tots_migration_setup_session_id);
      if (!sessionId) return NextResponse.json({ error: "No payment setup session has been created for this member yet." }, { status: 400 });
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["setup_intent"] }, { stripeAccount: accountId });
      if (session.status !== "complete" || !session.setup_intent) {
        return NextResponse.json({ error: "Payment setup has not been completed yet." }, { status: 409 });
      }
      const setupIntent = typeof session.setup_intent === "string"
        ? await stripe.setupIntents.retrieve(session.setup_intent, {}, { stripeAccount: accountId })
        : session.setup_intent;
      const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method?.id;
      if (!paymentMethodId || setupIntent.status !== "succeeded") {
        return NextResponse.json({ error: "Stripe has not confirmed a reusable payment method yet." }, { status: 409 });
      }
      const customerId = text(session.customer) || text((row.metadata || {}).tots_migration_customer_id);
      if (!customerId) throw new Error("Stripe customer could not be resolved.");
      await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } }, { stripeAccount: accountId });
      await saveMetadata(
        row,
        { tots_migration_customer_id: customerId, tots_migration_payment_method_id: paymentMethodId, tots_migration_setup_verified_at: new Date().toISOString() },
        { cutover_status: "payment_method_ready", processor_verification_status: "payment_method_verified", processor_verified_at: new Date().toISOString() },
      );
      return NextResponse.json({ success: true, cutoverStatus: "payment_method_ready" });
    }

    if (action === "teamup_stopped") {
      if (!["payment_method_ready", "teamup_stopped"].includes(row.cutover_status)) {
        return NextResponse.json({ error: "Verify the TOTS payment method before marking TeamUp billing as stopped." }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from("store_subscriptions")
        .update({
          teamup_billing_active: false,
          teamup_billing_disabled_at: new Date().toISOString(),
          cutover_status: "teamup_stopped",
          migration_notes: "TeamUp billing marked stopped by TOTS admin after external/manual cancellation. TOTS collection remains OFF until activation.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ success: true, cutoverStatus: "teamup_stopped" });
    }

    // ACTIVATE: intentionally requires TeamUp to have been manually stopped first.
    if (row.collection_enabled) return NextResponse.json({ success: true, alreadyActive: true });
    if (row.cutover_status !== "payment_method_ready") {
      return NextResponse.json({ error: "Verify the member’s TOTS payment setup before activation." }, { status: 400 });
    }
    if (row.teamup_billing_active !== false) {
      return NextResponse.json({ error: "TeamUp billing is still marked active. Stop TeamUp billing first, then mark teamup_billing_active=false before activating TOTS." }, { status: 409 });
    }

    const customerId = text((row.metadata || {}).tots_migration_customer_id);
    const paymentMethodId = text((row.metadata || {}).tots_migration_payment_method_id);
    if (!customerId || !paymentMethodId) throw new Error("Verified TOTS customer/payment method is missing.");
    const priceId = await ensureRecurringPrice(row, accountId);

    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        metadata: { tots_store_subscription_id: row.id, organisation_id: row.organisation_id, migration_source: "teamup" },
      },
      { stripeAccount: accountId, idempotencyKey: `mtc-cutover-${row.id}` },
    );

    const { error: updateError } = await supabaseAdmin
      .from("store_subscriptions")
      .update({
        stripe_account_id: accountId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        external_subscription_id: subscription.id,
        billing_provider: "stripe",
        payment_provider: "stripe",
        status: subscription.status,
        collection_enabled: true,
        collection_enabled_at: new Date().toISOString(),
        cutover_status: "tots_active",
        processor_verification_status: "verified",
        processor_verified_at: new Date().toISOString(),
        legacy_billing: false,
        metadata: { ...(row.metadata || {}), tots_migration_activated_at: new Date().toISOString(), tots_migration_subscription_id: subscription.id },
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, stripeSubscriptionId: subscription.id, status: subscription.status });
  } catch (error) {
    console.error("[TOTS BILLING MIGRATION]", error);
    const message = error instanceof Error ? error.message : "Billing migration failed.";
    return NextResponse.json({ error: message === "UNAUTHENTICATED" ? "You are not signed in." : message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
