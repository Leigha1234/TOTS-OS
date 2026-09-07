"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

import {
  toast,
} from "sonner";

// ============================================================
// TYPES
// ============================================================

type SubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

interface TierFeature {
  text: string;
  included: boolean;
}

type TierDetails = {
  name: string;
  price: number;
  description: string;
  features: TierFeature[];
};

// ============================================================
// PAGE
// ============================================================

export default function ManageSubscription() {
  const router =
    useRouter();

  const supabase =
    createBrowserClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    currentTier,
    setCurrentTier,
  ] =
    useState<
      SubscriptionTier | null
    >(
      null
    );

  const [
    selectedTier,
    setSelectedTier,
  ] =
    useState<
      SubscriptionTier
    >(
      "professional"
    );

  const [
    teamMembersCount,
    setTeamMembersCount,
  ] =
    useState<number>(
      0
    );

  const [
    promoCode,
  ] =
    useState<string>(
      ""
    );

  const [
    isProcessing,
    setIsProcessing,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  // ==========================================================
  // PRICING
  // ==========================================================

  const TEAM_MEMBER_PRICE =
    19.95;

  const formatPounds =
    (
      value: number
    ) =>
      (
        Math.round(
          value * 100
        ) / 100
      ).toFixed(
        2
      );

  const tierMatrix:
    Record<
      SubscriptionTier,
      TierDetails
    > =
    {
      standard: {
        name:
          "Standard",

        price:
          29,

        description:
          "FOUNDATIONAL SYSTEM ACCESS",

        features: [
          {
            text:
              "Core TOTS-OS access",
            included:
              true,
          },
          {
            text:
              "Task management",
            included:
              true,
          },
          {
            text:
              "CRM",
            included:
              true,
          },
          {
            text:
              "Projects",
            included:
              true,
          },
          {
            text:
              "Notes & vault",
            included:
              true,
          },
          {
            text:
              "Calendar",
            included:
              true,
          },
        ],
      },

      professional: {
        name:
          "Professional",

        price:
          59,

        description:
          "SCALABLE GROWTH ARCHITECTURE",

        features: [
          {
            text:
              "Everything in Standard",
            included:
              true,
          },
          {
            text:
              "Advanced CRM",
            included:
              true,
          },
          {
            text:
              "Campaigns",
            included:
              true,
          },
          {
            text:
              "Social tools",
            included:
              true,
          },
          {
            text:
              "Automations",
            included:
              true,
          },
          {
            text:
              "Enhanced reporting",
            included:
              true,
          },
        ],
      },

      elite: {
        name:
          "Elite",

        price:
          99,

        description:
          "COMPLETE BUSINESS OS",

        features: [
          {
            text:
              "Everything in Professional",
            included:
              true,
          },
          {
            text:
              "Clarity AI",
            included:
              true,
          },
          {
            text:
              "Advanced automation",
            included:
              true,
          },
          {
            text:
              "Full reporting suite",
            included:
              true,
          },
          {
            text:
              "Priority support",
            included:
              true,
          },
          {
            text:
              "Premium system access",
            included:
              true,
          },
        ],
      },
    };

  // ==========================================================
  // LOAD CURRENT USER + PLAN
  // ==========================================================

  useEffect(
    () => {
      async function loadSession() {
        try {
          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !user
          ) {
            router.push(
              "/login"
            );

            return;
          }

          const {
            data:
              profile,
            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                `
                  subscription_tier,
                  team_seats_allocated
                `
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "Profile load error:",
              profileError
            );
          }

          if (
            profile
          ) {
            const rawTier =
              String(
                profile
                  .subscription_tier ||
                  ""
              )
                .trim()
                .toLowerCase();

            /*
             * Backwards compatibility:
             *
             * Older records may still
             * contain "premium".
             *
             * Treat those as
             * "professional".
             */

            let normalisedTier:
              SubscriptionTier | null =
              null;

            if (
              rawTier ===
              "standard"
            ) {
              normalisedTier =
                "standard";
            } else if (
              rawTier ===
                "professional" ||
              rawTier ===
                "premium"
            ) {
              normalisedTier =
                "professional";
            } else if (
              rawTier ===
              "elite"
            ) {
              normalisedTier =
                "elite";
            }

            setCurrentTier(
              normalisedTier
            );

            setSelectedTier(
              normalisedTier ||
                "professional"
            );

            setTeamMembersCount(
              Number(
                profile
                  .team_seats_allocated ||
                  0
              )
            );
          } else {
            /*
             * Existing user with no
             * subscription tier set yet.
             *
             * Default selection to
             * Professional.
             */

            setCurrentTier(
              null
            );

            setSelectedTier(
              "professional"
            );

            setTeamMembersCount(
              0
            );
          }
        } catch (
          err
        ) {
          console.error(
            "Session load error:",
            err
          );

          toast.error(
            "Unable to load your subscription."
          );
        } finally {
          setLoading(
            false
          );
        }
      }

      void loadSession();
    },
    [
      router,
      supabase,
    ]
  );

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  const handleTierUpdate =
    async () => {
      if (
        isProcessing
      ) {
        return;
      }

      setIsProcessing(
        true
      );

      try {
        const response =
          await fetch(
            "/api/pay/stripe/checkout",
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
                    tier:
                      selectedTier,

                    additionalSeats:
                      teamMembersCount,

                    couponCode:
                      promoCode.trim() ||
                      null,
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
              "Unable to create Stripe checkout session."
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
        err
      ) {
        console.error(
          "Checkout failed:",
          err
        );

        toast.error(
          err instanceof Error
            ? err.message
            : "Checkout failed."
        );

        setIsProcessing(
          false
        );
      }
    };

  // ==========================================================
  // CURRENT PLAN STATE
  // ==========================================================

  const isCurrentTier =
    currentTier !== null &&
    selectedTier ===
      currentTier;

  const isButtonDisabled =
    isProcessing ||
    isCurrentTier;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2
          className="animate-spin text-[#A3B18A]"
          size={40}
        />
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-stone-50 px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-[1400px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="mb-12 flex flex-col gap-6 border-b border-stone-200 pb-8 md:flex-row md:items-center md:justify-between">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/settings"
              )
            }
            className="flex w-fit items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-700"
          >
            <ArrowLeft
              size={12}
            />

            Back
          </button>

          <button
            type="button"
            onClick={() =>
              void handleTierUpdate()
            }
            disabled={
              isButtonDisabled
            }
            className={`
              rounded-full
              px-10
              py-4
              text-[10px]
              font-black
              uppercase
              tracking-widest
              transition-all

              ${
                isButtonDisabled
                  ? `
                    cursor-not-allowed
                    bg-stone-200
                    text-stone-500
                  `
                  : `
                    bg-stone-900
                    text-white
                    hover:bg-stone-700
                  `
              }
            `}
          >
            {isProcessing
              ? "Preparing Checkout..."
              : isCurrentTier
                ? "Current Plan"
                : currentTier
                  ? `Switch to ${tierMatrix[selectedTier].name}`
                  : `Choose ${tierMatrix[selectedTier].name}`}
          </button>

        </header>

        {/* ==================================================
            TITLE
        ================================================== */}

        <section className="mb-10">

          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#82936b]">
            TOTS-OS Membership
          </p>

          <h1 className="font-serif text-4xl italic tracking-tight text-stone-900 md:text-6xl">
            Choose the plan that
            works for your business.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">
            Choose your TOTS-OS
            membership below. You can
            change your plan as your
            business grows.
          </p>

        </section>

        {/* ==================================================
            PLAN CARDS
        ================================================== */}

        <main className="grid gap-8 lg:grid-cols-3">

          {(
            Object.keys(
              tierMatrix
            ) as SubscriptionTier[]
          ).map(
            (
              key
            ) => {
              const tier =
                tierMatrix[
                  key
                ];

              const selected =
                selectedTier ===
                key;

              const active =
                currentTier ===
                key;

              return (
                <div
                  key={
                    key
                  }
                  role="button"
                  tabIndex={
                    0
                  }
                  onClick={() =>
                    setSelectedTier(
                      key
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Enter" ||
                      event.key ===
                        " "
                    ) {
                      setSelectedTier(
                        key
                      );
                    }
                  }}
                  className={`
                    relative
                    cursor-pointer
                    rounded-[2rem]
                    border
                    bg-white
                    p-8
                    transition-all
                    duration-200

                    ${
                      selected
                        ? `
                          border-[#A3B18A]
                          shadow-[0_18px_50px_rgba(28,25,23,0.07)]
                          ring-1
                          ring-[#A3B18A]
                        `
                        : `
                          border-stone-200
                          hover:-translate-y-1
                          hover:border-stone-300
                          hover:shadow-md
                        `
                    }

                    ${
                      active
                        ? "bg-[#F8F9F5]"
                        : ""
                    }
                  `}
                >

                  {/* ACTIVE */}

                  {active && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#A3B18A] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                      Active
                    </span>
                  )}

                  {/* POPULAR */}

                  {key ===
                    "professional" &&
                    !active && (
                      <span className="absolute right-4 top-4 rounded-full bg-stone-900 px-3 py-1 text-[8px] font-black uppercase tracking-wide text-white">
                        Most Popular
                      </span>
                    )}

                  {/* NAME */}

                  <p className="mb-3 pr-28 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                    {
                      tier.description
                    }
                  </p>

                  <h3 className="mb-4 font-serif text-3xl italic text-stone-900">
                    {
                      tier.name
                    }
                  </h3>

                  {/* PRICE */}

                  <div className="mb-8 flex items-end gap-2">

                    <p className="font-serif text-5xl text-stone-900">
                      £
                      {
                        tier.price
                      }
                    </p>

                    <span className="pb-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                      / month
                    </span>

                  </div>

                  {/* FEATURES */}

                  <ul className="space-y-4">

                    {tier.features.map(
                      (
                        feature,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                          className="flex gap-3 text-xs leading-5 text-stone-600"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf1e8]">
                            <Check
                              size={11}
                              strokeWidth={3}
                              className="text-[#82936b]"
                            />
                          </span>

                          {
                            feature.text
                          }
                        </li>
                      )
                    )}

                  </ul>

                  {/* SELECT */}

                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      setSelectedTier(
                        key
                      );
                    }}
                    className={`
                      mt-9
                      w-full
                      rounded-full
                      px-5
                      py-3.5
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      transition

                      ${
                        selected
                          ? `
                            bg-stone-900
                            text-white
                          `
                          : `
                            bg-stone-100
                            text-stone-600
                            hover:bg-stone-200
                          `
                      }
                    `}
                  >
                    {active
                      ? "Current Plan"
                      : selected
                        ? "Selected"
                        : `Select ${tier.name}`}
                  </button>

                </div>
              );
            }
          )}

        </main>

        {/* ==================================================
            TEAM SEATS
        ================================================== */}

        <section className="mt-12 rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Additional team members
              </p>

              <p className="mt-2 text-sm font-semibold text-stone-700">
                Add extra seats to your
                TOTS-OS workspace.
              </p>

              <p className="mt-1 text-xs text-stone-400">
                £
                {
                  formatPounds(
                    TEAM_MEMBER_PRICE
                  )
                }{" "}
                per additional seat,
                per month.
              </p>

            </div>

            <div className="flex items-center gap-5">

              <div className="flex items-center gap-5 rounded-2xl border border-stone-200 p-4">

                <button
                  type="button"
                  onClick={() =>
                    setTeamMembersCount(
                      Math.max(
                        0,
                        teamMembersCount -
                          1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200"
                >
                  <Minus
                    size={14}
                  />
                </button>

                <span className="w-8 text-center text-sm font-bold text-stone-800">
                  {
                    teamMembersCount
                  }
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setTeamMembersCount(
                      teamMembersCount +
                        1
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200"
                >
                  <Plus
                    size={14}
                  />
                </button>

              </div>

              <div className="text-right">

                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400">
                  Seats total
                </p>

                <p className="mt-1 font-serif text-2xl italic text-stone-800">
                  £
                  {
                    formatPounds(
                      teamMembersCount *
                        TEAM_MEMBER_PRICE
                    )
                  }
                  /mo
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            BOTTOM CHECKOUT
        ================================================== */}

        <section className="mt-8 flex flex-col gap-5 rounded-[2rem] bg-stone-900 p-7 text-white md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
              Selected Membership
            </p>

            <p className="mt-2 font-serif text-2xl italic">
              {
                tierMatrix[
                  selectedTier
                ].name
              }{" "}
              — £
              {
                tierMatrix[
                  selectedTier
                ].price
              }
              /month
            </p>

            {teamMembersCount >
              0 && (
                <p className="mt-2 text-xs text-stone-400">
                  + £
                  {
                    formatPounds(
                      teamMembersCount *
                        TEAM_MEMBER_PRICE
                    )
                  }
                  /month for{" "}
                  {
                    teamMembersCount
                  }{" "}
                  additional{" "}
                  {teamMembersCount ===
                  1
                    ? "seat"
                    : "seats"}
                </p>
              )}

          </div>

          <button
            type="button"
            onClick={() =>
              void handleTierUpdate()
            }
            disabled={
              isButtonDisabled
            }
            className={`
              min-w-[220px]
              rounded-full
              px-8
              py-4
              text-[10px]
              font-black
              uppercase
              tracking-[0.16em]
              transition

              ${
                isButtonDisabled
                  ? `
                    cursor-not-allowed
                    bg-stone-700
                    text-stone-400
                  `
                  : `
                    bg-white
                    text-stone-900
                    hover:bg-stone-100
                  `
              }
            `}
          >
            {isProcessing
              ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />

                  Preparing Checkout
                </span>
              )
              : isCurrentTier
                ? "Current Plan"
                : currentTier
                  ? `Switch to ${tierMatrix[selectedTier].name}`
                  : `Continue with ${tierMatrix[selectedTier].name}`}
          </button>

        </section>

      </div>
    </div>
  );
}