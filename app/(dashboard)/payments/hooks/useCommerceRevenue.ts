"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RevenueRow = {
  id: string;
  amount: number;
  intent: string | null;
  session: string | null;
  invoiceId?: string | null;
};

async function allRows(table: string, organisationId: string, columns: string) {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from(table)
      .select(columns).eq("organisation_id", organisationId)
      .range(offset, offset + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const paid = (status: unknown) => ["paid", "succeeded", "completed"].includes(String(status ?? "").toLowerCase());
const money = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function useCommerceRevenue(organisationId: string | null) {
  const [state, setState] = useState({ amount: 0, loading: true, error: null as string | null });

  useEffect(() => {
    let cancelled = false;
    if (!organisationId) {
      setState({ amount: 0, loading: false, error: null });
      return;
    }
    setState(previous => ({ ...previous, loading: true, error: null }));
    (async () => {
      const [orders, bookings, payments] = await Promise.all([
        allRows("store_orders", organisationId, "id,total,payment_status,stripe_payment_intent_id,stripe_checkout_session_id"),
        allRows("booking_payment_reservations", organisationId, "id,due_now_pence,status,stripe_payment_intent_id,stripe_checkout_session_id"),
        allRows("payments", organisationId, "id,amount,status,type,invoice_id,stripe_payment_intent_id,stripe_checkout_session_id"),
      ]);
      const collected: RevenueRow[] = [];
      for (const order of orders) if (String(order.payment_status).toLowerCase() === "paid") {
        collected.push({ id: `store:${order.id}`, amount: money(order.total), intent: order.stripe_payment_intent_id, session: order.stripe_checkout_session_id });
      }
      for (const booking of bookings) if (paid(booking.status) && (booking.stripe_payment_intent_id || booking.stripe_checkout_session_id)) {
        collected.push({ id: `booking:${booking.id}`, amount: money(booking.due_now_pence) / 100, intent: booking.stripe_payment_intent_id, session: booking.stripe_checkout_session_id });
      }
      for (const payment of payments) if (paid(payment.status) && !payment.invoice_id && money(payment.amount) > 0) {
        collected.push({ id: `payment:${payment.id}`, amount: money(payment.amount), intent: payment.stripe_payment_intent_id, session: payment.stripe_checkout_session_id });
      }
      const seenIntents = new Set<string>();
      const seenSessions = new Set<string>();
      let amount = 0;
      for (const row of collected) {
        if ((row.intent && seenIntents.has(row.intent)) || (row.session && seenSessions.has(row.session))) continue;
        amount += row.amount;
        if (row.intent) seenIntents.add(row.intent);
        if (row.session) seenSessions.add(row.session);
      }
      if (!cancelled) setState({ amount, loading: false, error: null });
    })().catch(error => {
      console.error("Finance commerce revenue:", error);
      if (!cancelled) setState({ amount: 0, loading: false, error: error.message });
    });
    return () => { cancelled = true; };
  }, [organisationId]);

  return state;
}
