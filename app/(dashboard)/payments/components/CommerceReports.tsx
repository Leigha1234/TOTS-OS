"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Kind = "store" | "bookings";
type Row = Record<string, any>;
const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
const paid = (s: unknown) => ["paid", "succeeded", "completed"].includes(String(s || "").toLowerCase());
const date = (s: unknown) => s ? new Date(String(s)).toLocaleDateString("en-GB") : "—";

export default function CommerceReports({ organisationId, kind }: { organisationId: string | null; kind: Kind }) {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [services, setServices] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setRows([]); setServices([]); setError(null); setLoading(true);
    if (!organisationId) { setLoading(false); return; }
    (async () => {
      const table = kind === "store" ? "store_orders" : "booking_payment_reservations";
      const all: Row[] = [];
      for (let offset = 0; ; offset += 1000) {
        const result = await supabase.from(table).select("*").eq("organisation_id", organisationId).order("created_at", { ascending: false }).range(offset, offset + 999);
        if (result.error) throw result.error;
        all.push(...(result.data || []));
        if (!result.data || result.data.length < 1000) break;
      }
      if (kind === "bookings") {
        const pageIds = [...new Set(all.map(r => r.booking_page_id).filter(Boolean))];
        const servicesResult = pageIds.length ? await supabase.from("booking_services").select("id,name,booking_page_id,price_pence").in("booking_page_id", pageIds) : { data: [], error: null };
        if (servicesResult.error) throw servicesResult.error;
        if (active) setServices(servicesResult.data || []);
      }
      if (active) setRows(all);
    })().catch(e => { if (active) setError(e.message || String(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organisationId, kind, supabase]);

  const amount = (r: Row) => kind === "store" ? Number(r.total || 0) : Number(r.due_now_pence || 0) / 100;
  const status = (r: Row) => kind === "store" ? r.payment_status : r.status;
  const successful = rows.filter(r => paid(status(r)));
  const revenue = successful.reduce((s, r) => s + amount(r), 0);
  const serviceMap = new Map(services.map(s => [s.id, s.name]));
  const groups = new Map<string, { count: number; amount: number }>();
  for (const r of successful) {
    const name = kind === "store" ? "Store orders" : (serviceMap.get(r.booking_service_id) || "Unassigned service");
    const entry = groups.get(name) || { count: 0, amount: 0 };
    entry.count++; entry.amount += amount(r); groups.set(name, entry);
  }
  return <section className="space-y-6 text-[#123B30]">
    <header className="rounded-3xl bg-[#0F3D32] p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/75">Financial reporting</p><h2 className="mt-2 text-3xl font-semibold">{kind === "store" ? "Store Reports" : "Booking Reports"}</h2><p className="mt-2 text-sm text-white/80">{kind === "store" ? "Sales and orders recorded through ORBI Store." : "Booking checkout payments and deposits recorded through ORBI Booking Pages."}</p></header>
    {loading ? <p>Loading reporting data…</p> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">Could not load reports: {error}</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ["Collected revenue", gbp(revenue)], ["Paid transactions", String(successful.length)], ["Other / pending", String(rows.length - successful.length)], ["Average paid value", gbp(successful.length ? revenue / successful.length : 0)]
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#E1EAE3] bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#52665C]">{label}</p><p className="mt-3 text-2xl font-semibold text-[#0F3D32]">{value}</p></div>)}</div>
      <div className="rounded-2xl border border-[#E1EAE3] bg-white p-5"><h3 className="text-lg font-semibold">{kind === "store" ? "Sales overview" : "Revenue by service"}</h3><div className="mt-4 space-y-3">{[...groups.entries()].sort((a,b) => b[1].amount-a[1].amount).map(([name, item]) => <div key={name} className="flex justify-between border-b border-stone-100 pb-3 text-sm"><span>{name} <span className="text-stone-500">({item.count})</span></span><strong>{gbp(item.amount)}</strong></div>)}{groups.size === 0 && <p className="text-sm text-stone-500">No paid transactions found.</p>}</div></div>
      <div className="overflow-x-auto rounded-2xl border border-[#E1EAE3] bg-white"><div className="p-5"><h3 className="text-lg font-semibold">Transaction history</h3></div><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#F1F5F2] text-[#52665C]"><tr><th className="p-3">Date</th><th className="p-3">Reference</th><th className="p-3">Customer</th><th className="p-3">Status</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-stone-100"><td className="p-3">{date(r.created_at)}</td><td className="p-3">{kind === "store" ? (r.order_number || r.id) : (serviceMap.get(r.booking_service_id) || "Booking")}</td><td className="p-3">{r.customer_name || r.customer_email || "—"}</td><td className="p-3">{String(status(r) || "unknown")}</td><td className="p-3 text-right font-semibold">{gbp(amount(r))}</td></tr>)}</tbody></table>{!rows.length && <p className="p-5 text-sm text-stone-500">No records found for this organisation.</p>}</div>
      <p className="text-xs text-[#52665C]">These figures reflect ORBI records, not a full Stripe ledger. Booking revenue reflects amounts due at checkout, not unpaid remaining balances. Profit requires recorded costs; refunds and Stripe fees require verified reconciliation.</p>
    </>}
  </section>;
}
