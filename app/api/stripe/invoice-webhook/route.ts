import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_INVOICE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_INVOICE_WEBHOOK_SECRET); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid signature." }, { status: 400 }); }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.tots_type === "invoice" && session.metadata.invoice_id && session.payment_status === "paid") {
        const { data: invoice } = await admin.from("invoices").select("*").eq("id", session.metadata.invoice_id).single();
        if (invoice) {
          const paid = Number(session.amount_total || 0) / 100;
          const newPaid = Math.min(Number(invoice.amount || 0), Number(invoice.amount_paid || 0) + paid);
          const balance = Math.max(0, Number(invoice.amount || 0) - newPaid);
          const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
          await admin.from("payments").upsert({ invoice_id: invoice.id, organisation_id: invoice.organisation_id, customer_id: invoice.customer_id, amount: paid, currency: String(invoice.currency || "GBP"), status: "paid", type: "invoice", paid_at: new Date().toISOString(), description: `Payment for ${invoice.invoice_number || invoice.data?.document_number || "invoice"}`, payment_method: "card", stripe_payment_intent_id: paymentIntent, stripe_checkout_session_id: session.id, metadata: { stripe_account: event.account || null } }, { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true });
          await admin.from("invoices").update({ amount_paid: newPaid, balance_due: balance, status: balance <= 0 ? "paid" : "part_paid", paid_at: balance <= 0 ? new Date().toISOString() : null, stripe_payment_intent_id: paymentIntent, updated_at: new Date().toISOString() }).eq("id", invoice.id);
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("invoice webhook", e);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
