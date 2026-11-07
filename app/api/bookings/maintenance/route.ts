import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

/** Reconcile expired unpaid Checkout sessions. Invoke from an authenticated cron. */
export async function GET(request: Request) {
  const token = process.env.CRON_SECRET;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !key || !stripeKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const stripe = new Stripe(stripeKey);
  const { data, error } = await db.from("booking_payment_reservations")
    .select("id,status,expires_at,stripe_checkout_session_id,stripe_account_id")
    .in("status", ["pending", "processing"])
    .lte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: "Database read failed" }, { status: 500 });
  let expired = 0, review = 0, deferred = 0;
  for (const row of data ?? []) {
    try {
      if (!row.stripe_checkout_session_id || !row.stripe_account_id) {
        // No checkout session was created. No payment could be collected through this reservation.
        const result = await db.from("booking_payment_reservations")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", row.id).eq("status", row.status);
        if (result.error) throw result.error;
        expired++;
        continue;
      }
      const account = { stripeAccount: row.stripe_account_id };
      let session = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id, {}, account);
      if (session.payment_status === "paid" || session.status === "complete") {
        // Never mark a paid/possibly paid reservation expired. Webhook must reconcile it.
        await db.from("booking_payment_reservations")
          .update({ status: "manual_review", updated_at: new Date().toISOString() })
          .eq("id", row.id).eq("status", row.status);
        review++;
        continue;
      }
      if (session.status === "open") {
        if (session.expires_at && session.expires_at > Math.floor(Date.now() / 1000)) {
          deferred++;
          continue;
        }
        session = await stripe.checkout.sessions.expire(session.id, {}, account);
      }
      if (session.status !== "expired") { deferred++; continue; }
      const result = await db.from("booking_payment_reservations")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", row.id).eq("status", row.status);
      if (result.error) throw result.error;
      expired++;
    } catch (err) {
      console.error("ORBI booking maintenance error", { reservationId: row.id, err });
      review++;
    }
  }
  return NextResponse.json({ checked: (data ?? []).length, expired, review, deferred });
}
