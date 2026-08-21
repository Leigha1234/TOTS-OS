"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    price: "29",
    description: "FOUNDATIONAL SYSTEM ACCESS",
    features: [
      "Core TOTS-OS access",
      "Task management",
      "CRM",
      "Projects",
      "Notes & vault",
      "Calendar",
    ],
  },
  {
    name: "Professional",
    price: "59",
    description: "SCALABLE GROWTH ARCHITECTURE",
    popular: true,
    features: [
      "Everything in Standard",
      "Advanced CRM",
      "Campaigns",
      "Social tools",
      "Automations",
      "Enhanced reporting",
    ],
  },
  {
    name: "Elite",
    price: "149",
    description: "COMPLETE BUSINESS OS",
    features: [
      "Everything in Professional",
      "Clarity AI",
      "Advanced automation",
      "Full reporting suite",
      "Priority support",
      "Premium system access",
    ],
  },
] as const;

export default function BillingPage() {
  const [loading, setLoading] =
    useState<string | null>(null);

  const [selectedTier, setSelectedTier] =
    useState<string>("Professional");

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
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-[1400px]">
        {/* HEADER */}

        <header className="mb-10 border-b border-stone-200 pb-8 md:mb-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2">
                <Sparkles
                  size={13}
                  className="text-[#A3B18A]"
                />

                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500">
                  TOTS-OS Membership
                </span>
              </div>

              <h1 className="max-w-3xl font-serif text-4xl italic tracking-tight text-stone-900 md:text-6xl">
                Choose how you want to
                run your business.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
                Pick the level of TOTS-OS
                that fits your business now.
                You can upgrade later as your
                system grows.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Selected plan
              </p>

              <p className="mt-1 font-serif text-xl italic text-stone-900">
                {selectedTier}
              </p>
            </div>
          </div>
        </header>

        {/* PLANS */}

        <section className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const selected =
              selectedTier ===
              tier.name;

            const isLoading =
              loading ===
              tier.name;

            return (
              <article
                key={tier.name}
                onClick={() =>
                  setSelectedTier(
                    tier.name
                  )
                }
                className={`relative flex min-h-[560px] cursor-pointer flex-col rounded-[2rem] border bg-white p-7 transition-all duration-200 md:p-8 ${
                  selected
                    ? "border-[#A3B18A] shadow-[0_20px_60px_rgba(28,25,23,0.08)] ring-1 ring-[#A3B18A]"
                    : "border-stone-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_16px_50px_rgba(28,25,23,0.06)]"
                }`}
              >
                {tier.popular && (
                  <span className="absolute right-5 top-5 rounded-full bg-[#A3B18A] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                    Most Popular
                  </span>
                )}

                <div>
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                    {
                      tier.description
                    }
                  </p>

                  <h2 className="font-serif text-4xl italic text-stone-900">
                    {tier.name}
                  </h2>

                  <div className="mt-7 flex items-end gap-2">
                    <span className="font-serif text-6xl leading-none text-stone-900">
                      £{tier.price}
                    </span>

                    <span className="pb-1 text-xs font-bold uppercase tracking-wide text-stone-400">
                      / month
                    </span>
                  </div>
                </div>

                <div className="my-8 h-px bg-stone-100" />

                <div className="flex-1">
                  <p className="mb-5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                    Included
                  </p>

                  <ul className="space-y-4">
                    {tier.features.map(
                      (feature) => (
                        <li
                          key={
                            feature
                          }
                          className="flex items-start gap-3 text-sm text-stone-600"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              selected
                                ? "bg-[#edf1e8]"
                                : "bg-stone-100"
                            }`}
                          >
                            <Check
                              size={
                                12
                              }
                              className={
                                selected
                                  ? "text-[#82936b]"
                                  : "text-stone-400"
                              }
                            />
                          </span>

                          <span>
                            {
                              feature
                            }
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation();

                    setSelectedTier(
                      tier.name
                    );

                    void handleCheckout(
                      tier
                    );
                  }}
                  disabled={
                    loading !==
                    null
                  }
                  className={`mt-10 flex w-full items-center justify-center rounded-full px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                    selected
                      ? "bg-stone-900 text-white hover:bg-stone-700"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        size={
                          14
                        }
                        className="mr-2 animate-spin"
                      />
                      Preparing checkout
                    </>
                  ) : (
                    `Choose ${tier.name}`
                  )}
                </button>
              </article>
            );
          })}
        </section>

        {/* FOOTER NOTE */}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-stone-200 bg-white px-6 py-5 text-center md:flex-row md:text-left">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
              Secure checkout
            </p>

            <p className="mt-1 text-xs text-stone-500">
              Payment is handled securely
              through Stripe.
            </p>
          </div>

          <p className="text-[10px] text-stone-400">
            Prices shown are monthly.
          </p>
        </div>
      </div>
    </main>
  );
}