"use client";

import { useState } from "react";

const TIERS = [
  { name: "Standard", priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID, price: "29" },
  { name: "Professional", priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID, price: "59" },
  { name: "Elite", priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID, price: "149" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (tier: typeof TIERS[number]) => {
    setLoading(tier.name);

    try {
      const registration = JSON.parse(sessionStorage.getItem("pendingRegistration") || "null");

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registration,
          tier: tier.name,
          priceId: tier.priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create checkout session.");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      alert(error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen p-10 bg-[#fcfaf7]">
      <h1 className="text-5xl mb-10">Choose your plan</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div key={tier.name} className="bg-white rounded-3xl p-8 border">
            <h2 className="text-3xl">{tier.name}</h2>
            <p className="text-4xl mt-4">£{tier.price}/mo</p>

            <button
              onClick={() => handleCheckout(tier)}
              disabled={loading !== null}
              className="mt-8 w-full rounded-xl bg-stone-900 text-white p-4"
            >
              {loading === tier.name ? "Loading..." : `Select ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}