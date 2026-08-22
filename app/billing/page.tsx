"use client";

import { useState } from "react";

import {
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// ==================================================
// TYPES
// ==================================================

type Tier = {
  name:
    | "Standard"
    | "Professional"
    | "Elite";

  price:
    string;

  description:
    string;

  features:
    readonly string[];

  popular?:
    boolean;
};

// ==================================================
// PLANS
// ==================================================

const TIERS: readonly Tier[] = [
  {
    name:
      "Standard",

    price:
      "29",

    description:
      "FOUNDATIONAL SYSTEM ACCESS",

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
    name:
      "Professional",

    price:
      "59",

    description:
      "SCALABLE GROWTH ARCHITECTURE",

    popular:
      true,

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
    name:
      "Elite",

    price:
      "99",

    description:
      "COMPLETE BUSINESS OS",

    features: [
      "Everything in Professional",
      "Clarity AI",
      "Advanced automation",
      "Full reporting suite",
      "Priority support",
      "Premium system access",
    ],
  },
];

// ==================================================
// PAGE
// ==================================================

export default function BillingPage() {
  const [
    loading,
    setLoading,
  ] =
    useState<
      Tier["name"] | null
    >(
      null
    );

  const [
    selectedTier,
    setSelectedTier,
  ] =
    useState<
      Tier["name"]
    >(
      "Professional"
    );

  // ==================================================
  // CHECKOUT
  // ==================================================

  const handleCheckout =
    async (
      tier:
        Tier
    ) => {
      if (
        loading
      ) {
        return;
      }

      setSelectedTier(
        tier.name
      );

      setLoading(
        tier.name
      );

      try {
        const storedRegistration =
          sessionStorage.getItem(
            "pendingRegistration"
          );

        if (
          !storedRegistration
        ) {
          throw new Error(
            "Your registration details could not be found. Please return to signup and try again."
          );
        }

        let registration;

        try {
          registration =
            JSON.parse(
              storedRegistration
            );
        } catch {
          throw new Error(
            "Your registration details are invalid. Please return to signup and try again."
          );
        }

        if (
          !registration
        ) {
          throw new Error(
            "Your registration details could not be found. Please return to signup and try again."
          );
        }

        const response =
          await fetch(
            "/api/create-checkout-session",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    ...registration,

                    tier:
                      tier.name,
                  }
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              "Unable to create checkout session."
          );
        }

        if (
          !data.url
        ) {
          throw new Error(
            "Stripe checkout URL was not returned."
          );
        }

        window.location.href =
          data.url;
      } catch (
        error
      ) {
        console.error(
          "Checkout failed:",
          error
        );

        alert(
          error instanceof
            Error
            ? error.message
            : "Unable to start checkout."
        );

        setLoading(
          null
        );
      }
    };

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-[1400px]">

        {/* ==========================================
            HEADER
        ========================================== */}

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
                Choose how you want
                to run your business.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
                Pick the level of
                TOTS-OS that fits your
                business now. You can
                upgrade later as your
                system grows.
              </p>

              {/* ======================================
                  FREE TRIAL MESSAGE
              ====================================== */}

              <div className="mt-6 flex max-w-xl items-start gap-4 rounded-2xl border border-[#cdd7c3] bg-[#edf1e8] px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#82936b] shadow-sm">
                  <Check
                    size={16}
                    strokeWidth={3}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#748361]">
                    14-day free trial
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-700">
                    No bank details required.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    Create your account, choose
                    your plan and use TOTS-OS
                    completely free for two weeks.
                  </p>
                </div>
              </div>
            </div>

            {/* SELECTED PLAN */}

            <div className="w-fit rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Selected plan
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />

                <p className="font-serif text-xl italic text-stone-900">
                  {selectedTier}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ==========================================
            TRIAL STRIP
        ========================================== */}

        <section className="mb-7 grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1e8]">
              <Sparkles
                size={15}
                className="text-[#82936b]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-700">
                2 weeks free
              </p>

              <p className="mt-0.5 text-[10px] text-stone-400">
                Full trial access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1e8]">
              <CreditCard
                size={15}
                className="text-[#82936b]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-700">
                No bank details
              </p>

              <p className="mt-0.5 text-[10px] text-stone-400">
                Nothing charged upfront
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1e8]">
              <ShieldCheck
                size={15}
                className="text-[#82936b]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-700">
                No commitment
              </p>

              <p className="mt-0.5 text-[10px] text-stone-400">
                Decide after your trial
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================
            PRICING CARDS
        ========================================== */}

        <section className="grid gap-6 lg:grid-cols-3">
          {TIERS.map(
            (
              tier
            ) => {
              const selected =
                selectedTier ===
                tier.name;

              const isLoading =
                loading ===
                tier.name;

              return (
                <article
                  key={
                    tier.name
                  }
                  onClick={() => {
                    if (
                      !loading
                    ) {
                      setSelectedTier(
                        tier.name
                      );
                    }
                  }}
                  className={`
                    relative
                    flex
                    min-h-[590px]
                    cursor-pointer
                    flex-col
                    rounded-[2rem]
                    border
                    bg-white
                    p-7
                    transition-all
                    duration-200
                    md:p-8

                    ${
                      selected
                        ? `
                          border-[#A3B18A]
                          shadow-[0_20px_60px_rgba(28,25,23,0.08)]
                          ring-1
                          ring-[#A3B18A]
                        `
                        : `
                          border-stone-200
                          hover:-translate-y-1
                          hover:border-stone-300
                          hover:shadow-[0_16px_50px_rgba(28,25,23,0.06)]
                        `
                    }
                  `}
                >

                  {/* MOST POPULAR */}

                  {tier.popular && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#A3B18A] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                      Most Popular
                    </span>
                  )}

                  {/* PLAN HEADING */}

                  <div>
                    <p className="mb-3 pr-24 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                      {
                        tier.description
                      }
                    </p>

                    <h2 className="font-serif text-4xl italic text-stone-900">
                      {tier.name}
                    </h2>

                    {/* PRICE */}

                    <div className="mt-7 flex items-end gap-2">
                      <span className="font-serif text-6xl leading-none text-stone-900">
                        £
                        {
                          tier.price
                        }
                      </span>

                      <span className="pb-1 text-xs font-bold uppercase tracking-wide text-stone-400">
                        / month
                      </span>
                    </div>

                    {/* FREE TRIAL */}

                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-3 py-2">
                      <Check
                        size={11}
                        strokeWidth={3}
                        className="text-[#82936b]"
                      />

                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#748361]">
                        14 days free
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] font-medium text-stone-400">
                      No bank details required
                    </p>
                  </div>

                  <div className="my-8 h-px bg-stone-100" />

                  {/* FEATURES */}

                  <div className="flex-1">
                    <p className="mb-5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                      Included
                    </p>

                    <ul className="space-y-4">
                      {tier.features.map(
                        (
                          feature
                        ) => (
                          <li
                            key={
                              feature
                            }
                            className="flex items-start gap-3 text-sm text-stone-600"
                          >
                            <span
                              className={`
                                mt-0.5
                                flex
                                h-5
                                w-5
                                shrink-0
                                items-center
                                justify-center
                                rounded-full

                                ${
                                  selected
                                    ? "bg-[#edf1e8]"
                                    : "bg-stone-100"
                                }
                              `}
                            >
                              <Check
                                size={12}
                                strokeWidth={3}
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

                  {/* CHECKOUT BUTTON */}

                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      void handleCheckout(
                        tier
                      );
                    }}
                    disabled={
                      loading !==
                      null
                    }
                    className={`
                      mt-10
                      flex
                      w-full
                      items-center
                      justify-center
                      rounded-full
                      px-6
                      py-4
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      transition-all

                      ${
                        selected
                          ? `
                            bg-stone-900
                            text-white
                            hover:bg-stone-700
                          `
                          : `
                            bg-stone-100
                            text-stone-700
                            hover:bg-stone-200
                          `
                      }

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          size={14}
                          className="mr-2 animate-spin"
                        />

                        Preparing checkout
                      </>
                    ) : (
                      <>
                        Start free with{" "}
                        {
                          tier.name
                        }
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[9px] font-medium text-stone-400">
                    14 days free · no bank details
                  </p>
                </article>
              );
            }
          )}
        </section>

        {/* ==========================================
            CHECKOUT INFORMATION
        ========================================== */}

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[2rem] border border-stone-200 bg-white px-6 py-5 text-center shadow-sm md:flex-row md:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1e8]">
              <Check
                size={16}
                strokeWidth={3}
                className="text-[#82936b]"
              />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-500">
                Start completely free
              </p>

              <p className="mt-1 text-xs font-semibold text-stone-600">
                14-day free trial · no bank details required.
              </p>

              <p className="mt-1 text-[10px] text-stone-400">
                Choose your plan now and decide whether
                you want to continue once you&apos;ve
                properly tried TOTS-OS.
              </p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
              TOTS-OS
            </p>

            <p className="mt-1 text-[10px] text-stone-400">
              Monthly pricing begins only
              after your free trial.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}