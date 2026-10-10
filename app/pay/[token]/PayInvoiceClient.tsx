"use client";
import { useState } from "react";

export default function PayInvoiceClient({ token, disabled }: { token: string; disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/invoices/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.url) throw new Error(body.error || "Unable to start payment.");
      window.location.href = body.url;
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to start payment."); setLoading(false); }
  }
  if (disabled) return <div className="rounded-xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">Paid — thank you.</div>;
  return <div><button onClick={pay} disabled={loading} className="w-full rounded-xl bg-stone-900 px-5 py-4 text-sm font-black text-white disabled:opacity-60">{loading ? "Opening secure checkout…" : "Pay invoice securely"}</button>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<p className="mt-3 text-center text-[11px] text-stone-400">Secure card payment via Stripe</p></div>;
}
