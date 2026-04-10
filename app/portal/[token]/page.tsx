"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/auth";
import { generateInsights } from "@/lib/clarity";

export default function ClientDashboard() {
  const supabase = createClient();

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [headline, setHeadline] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // middleware already handles redirect

    // 👇 use REAL user id now
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", user.id)
      .order("due_date", { ascending: true });

    const invoices = data || [];

    setDocs(invoices);

    const result = generateInsights(invoices, []);
    setInsights(result.insights);
    setActions(result.actions);
    setHeadline(result.headline);

    setLoading(false);
  }

  async function pay(inv: any) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        amount: inv.amount,
        invoiceId: inv.id,
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  }

  useEffect(() => {
    if (!insights.length) return;

    const i = setInterval(() => {
      setActiveSlide((p) => (p + 1) % insights.length);
    }, 4000);

    return () => clearInterval(i);
  }, [insights]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Dashboard</h1>

      {/* CLARITY */}
      {insights.length > 0 && (
        <div className="card">
          <p className="clarity-title">Clarity</p>
          <p className="clarity-headline">{headline}</p>
          <p className="clarity-sub">{insights[activeSlide]}</p>
        </div>
      )}

      {/* INVOICES */}
      {docs.map((d) => (
        <div key={d.id} className="card">
          <div className="flex justify-between">
            <div>
              <p className="text-lg font-semibold">£{d.amount}</p>
              <p className="text-xs text-muted">
                Due: {d.due_date || "No due date"}
              </p>
            </div>

            <span className="badge">{d.status}</span>
          </div>

          {d.status !== "paid" && (
            <button onClick={() => pay(d)} className="mt-3">
              Pay now
            </button>
          )}
        </div>
      ))}
    </div>
  );
}