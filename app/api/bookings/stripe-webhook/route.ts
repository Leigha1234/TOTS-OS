import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

/** Dedicated Stripe Connect webhook endpoint. Never use a client callback as proof of payment. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_BOOKING_CONNECT_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !stripeKey || !dbUrl || !serviceKey) {
    return NextResponse.json({ error: "Booking webhook not configured" }, { status: 503 });
  }
  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const reservationId = session.metadata?.orbi_booking_reservation_id;
  const connectedAccount = event.account;
  if (!reservationId || !connectedAccount || session.mode !== "payment") {
    return NextResponse.json({ received: true });
  }
  const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    // Fetch from the CONNECTED account, not the ORBI platform account.
    const verified = await stripe.checkout.sessions.retrieve(session.id, {}, { stripeAccount: connectedAccount });
    if (verified.payment_status !== "paid" || verified.status !== "complete") {
      return NextResponse.json({ received: true, pending: true });
    }
    const paymentIntent = typeof verified.payment_intent === "string" ? verified.payment_intent : verified.payment_intent?.id;
    if (!paymentIntent || !verified.amount_total || !verified.currency) {
      throw new Error("Checkout session missing payment details");
    }
    const { data, error } = await db.rpc("confirm_paid_public_booking", {
      p_reservation_id: reservationId,
      p_stripe_checkout_session_id: verified.id,
      p_stripe_payment_intent_id: paymentIntent,
      p_stripe_account_id: connectedAccount,
      p_amount_paid_pence: verified.amount_total,
      p_currency: verified.currency,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.outcome === "manual_review") {
      // Paid after expiry or conflicting slot. Do not confirm; investigate/refund.
      console.error("ORBI booking payment needs refund/manual review", { reservationId, sessionId: verified.id, connectedAccount });
    }
    // IMPORTANT: confirmation emails are NOT implemented in this part.
    return NextResponse.json({ received: true, outcome: result?.outcome });
  } catch (error) {
    console.error("ORBI booking webhook processing failed", { eventId: event.id, error });
    return NextResponse.json({ error: "Processing failed; Stripe should retry" }, { status: 500 });
  }
}
