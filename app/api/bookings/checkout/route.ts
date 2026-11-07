import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let reservationId: string | null = null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.ORBI_BOOKING_SERVICE_PAYMENTS_ENABLED !== "true") {
    return NextResponse.json({ error: "Service payments are not enabled" }, { status: 503 });
  }
  if (!url || !key || !stripeKey || !appUrl) {
    return NextResponse.json({ error: "Booking payments are not configured" }, { status: 503 });
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const body = await request.json();
    const { bookingPageId, customerName, customerEmail, startTime, meetingOption, serviceId } = body ?? {};
    if (!uuid.test(bookingPageId ?? "") || typeof customerName !== "string" ||
      typeof customerEmail !== "string" || typeof startTime !== "string" ||
      !Number.isFinite(Date.parse(startTime)) || (serviceId != null && !uuid.test(serviceId)) || !["online", "in_person"].includes(meetingOption)) {
      return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
    }
    const { data, error } = await db.rpc("reserve_public_service_payment", {
      p_booking_page_id: bookingPageId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_start_time: startTime,
      p_meeting_option: meetingOption,
      p_booking_service_id: serviceId ?? null,
    });
    if (error) return NextResponse.json({ error: error.code === "23P01" ? "That slot is no longer available" : "Unable to reserve appointment" }, { status: error.code === "23P01" ? 409 : 400 });
    const reservation = Array.isArray(data) ? data[0] : data;
    if (!reservation?.reservation_id || !reservation.connected_account_id || !reservation.amount_due_pence) throw new Error("Reservation failed");
    reservationId = reservation.reservation_id;
    const stripe = new Stripe(stripeKey);
    // Direct charge: funds are processed on the business's connected account.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail.trim().toLowerCase(),
      line_items: [{ price_data: { currency: "gbp", unit_amount: reservation.amount_due_pence,
        product_data: { name: "Appointment booking payment" } }, quantity: 1 }],
      metadata: { orbi_booking_reservation_id: reservationId },
      payment_intent_data: { metadata: { orbi_booking_reservation_id: reservationId } },
      success_url: `${appUrl.replace(/\/$/, "")}/book/${encodeURIComponent(body.slug || "")}?payment=processing&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl.replace(/\/$/, "")}/book/${encodeURIComponent(body.slug || "")}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }, { stripeAccount: reservation.connected_account_id, idempotencyKey: `orbi-booking-${reservationId}` });
    const { error: updateError } = await db.from("booking_payment_reservations")
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", reservationId).eq("status", "pending");
    if (updateError) throw updateError;
    return NextResponse.json({ checkoutUrl: session.url, reservationId });
  } catch (err) {
    console.error("Booking checkout setup failed", err);
    if (reservationId) await db.from("booking_payment_reservations").update({ status: "failed" }).eq("id", reservationId).eq("status", "pending");
    return NextResponse.json({ error: "Could not start secure checkout" }, { status: 500 });
  }
}
