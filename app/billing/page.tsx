"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserPlan } from "@/lib/getUserPlan";
import Button from "../components/Button";

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/");
        return;
      }

      setUser(data.user);
      const p = await getUserPlan();
      setPlan(p || "free");
    } catch (err) {
      console.error("Initialization failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function upgrade() {
    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.url) throw new Error("No checkout URL");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe redirection failed:", err);
      alert("Stripe checkout failed to load. Please try again.");
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto text-gray-500">
        Loading billing details...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-400">{user?.email}</p>
      </header>

      {plan === "pro" && (
        <div className="bg-green-500/10 border border-green-500/30 p-3 rounded text-green-700">
          You are currently on the <b>Pro Plan</b> ✅
        </div>
      )}

      <div className="border border-gray-200 p-6 rounded-xl space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold">Pro Plan</h2>

        <p className="text-gray-500">
          £19/month — Full system unlocked
        </p>

        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">✅ Unlimited CRM</li>
          <li className="flex items-center gap-2">✅ Projects + Tasks</li>
          <li className="flex items-center gap-2">✅ Team system</li>
          <li className="flex items-center gap-2">✅ Notifications</li>
        </ul>

        <div className="pt-4">
          <Button 
            onClick={upgrade} 
            disabled={checkoutLoading || plan === "pro"}
            className="w-full"
          >
            {plan === "pro"
              ? "Already Pro"
              : checkoutLoading
              ? "Redirecting to Stripe..."
              : "Upgrade 🚀"}
          </Button>
        </div>
      </div>
    </div>
  );
}