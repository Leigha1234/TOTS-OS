"use client";

import { useState } from "react";

const TIERS = [
  {
    name: "Standard",
    price: "29",
  },
  {
    name: "Professional",
    price: "59",
  },
  {
    name: "Elite",
    price: "149",
  },
] as const;

export default function BillingPage() {
  const [loading, setLoading] =
    useState<string | null>(null);

  const handleCheckout = async (
    tier: (typeof TIERS)[number]
  ) => {
    setLoading(tier.name);

    try {
      const registration =
        JSON.parse(
          sessionStorage.getItem(
            "pendingRegistration"
          ) || "null"
        );

      if (!registration) {
        throw new Error(
          "Your registration details could not be found. Please return to signup and try again."
        );
      }

      const response =
        await fetch(
          "/api/create-checkout-session",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...registration,

              /*
               * Only send the plan name.
               *
               * The server decides which
               * Stripe Price ID belongs
               * to this tier.
               */
              tier: tier.name,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create checkout session."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Checkout failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to start checkout."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] p-10">
      <h1 className="mb-10 text-5xl">
        Choose your plan
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map(
          (tier) => (
            <div
              key={tier.name}
              className="rounded-3xl border bg-white p-8"
            >
              <h2 className="text-3xl">
                {tier.name}
              </h2>

              <p className="mt-4 text-4xl">
                £{tier.price}/mo
              </p>

              <button
                type="button"
                onClick={() =>
                  handleCheckout(
                    tier
                  )
                }
                disabled={
                  loading !== null
                }
                className="mt-8 w-full rounded-xl bg-stone-900 p-4 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ===
                tier.name
                  ? "Loading..."
                  : `Select ${tier.name}`}
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}