import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing invoice token." }, { status: 400 });
    const { data: invoice } = await admin.from("invoices").select("*").eq("public_token", token).single();
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    const balance = Number(invoice.balance_due ?? (Number(invoice.amount || 0) - Number(invoice.amount_paid || 0)));
    if (invoice.status === "paid" || balance <= 0) return NextResponse.json({ error: "This invoice has already been paid." }, { status: 409 });

    const [{ data: org }, { data: customer }, { data: storeSettings }] = await Promise.all([
      admin.from("organisations").select("name").eq("id", invoice.organisation_id).single(),
      invoice.customer_id ? admin.from("customers").select("name,email").eq("id", invoice.customer_id).maybeSingle() : Promise.resolve({ data: null }),
      admin.from("store_settings").select("stripe_account_id").eq("organisation_id", invoice.organisation_id).maybeSingle(),
    ]);
    const connectedAccount = invoice.stripe_connected_account_id || storeSettings?.stripe_account_id;
    if (!connectedAccount) return NextResponse.json({ error: "This business has not connected Stripe yet. Please contact them for another payment method." }, { status: 409 });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.tots-os.co.uk").replace(/\/$/, "");
    const number = invoice.invoice_number || invoice.data?.document_number || "Invoice";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer?.email || invoice.data?.customer_email || undefined,
      line_items: [{ price_data: { currency: String(invoice.currency || "GBP").toLowerCase(), product_data: { name: `${number} — ${org?.name || "Invoice"}` }, unit_amount: Math.round(balance * 100) }, quantity: 1 }],
      metadata: { tots_type: "invoice", invoice_id: invoice.id, organisation_id: invoice.organisation_id, public_token: String(invoice.public_token) },
      payment_intent_data: { metadata: { tots_type: "invoice", invoice_id: invoice.id, organisation_id: invoice.organisation_id } },
      success_url: `${appUrl}/pay/${invoice.public_token}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pay/${invoice.public_token}?cancelled=1`,
    }, { stripeAccount: connectedAccount });

    await admin.from("invoices").update({ stripe_checkout_session_id: session.id, stripe_connected_account_id: connectedAccount, updated_at: new Date().toISOString() }).eq("id", invoice.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("invoice checkout", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to start payment." }, { status: 500 });
  }
}
