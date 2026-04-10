"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserPlan } from "@/lib/getUserPlan";
import Button from "../components/Button";

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/";
      return;
    }

    setUser(data.user);

    const p = await getUserPlan();
    setPlan(p);
  }

  async function upgrade() {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.url) throw new Error("No checkout URL");

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Stripe failed");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <p className="text-gray-400">{user?.email}</p>

      {plan === "pro" && (
        <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
          You are on <b>Pro Plan</b> ✅
        </div>
      )}

      <div className="border p-6 rounded space-y-4">
        <h2 className="text-xl font-semibold">Pro Plan</h2>

        <p className="text-gray-400">
          £19/month — Full system unlocked
        </p>

<ul className="text-sm space-y-1">
  <li>✅ Unlimited CRM</li>
  <li>✅ Projects + Tasks</li>
  <li>✅ Team system</li>
  <li>✅ Notifications</li>
</ul>

<Button onClick={upgrade} disabled={loading || plan === "pro"}>
  {plan === "pro"
    ? "Already Pro"
    : loading
    ? "Redirecting..."
    : "Upgrade 🚀"}
</Button>
      </div>
    </div>
  );
}