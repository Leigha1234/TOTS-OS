"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
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

type VerificationState =
  | "idle"
  | "verifying"
  | "success"
  | "error";

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

  const [
    existingAccount,
    setExistingAccount,
  ] =
    useState(
      false
    );

  const [
    modeReady,
    setModeReady,
  ] =
    useState(
      false
    );

  const [
    verificationState,
    setVerificationState,
  ] =
    useState<VerificationState>(
      "idle"
    );

  const [
    verificationError,
    setVerificationError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    verifiedTier,
    setVerifiedTier,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    verifiedOrganisationName,
    setVerifiedOrganisationName,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==================================================
  // DETECT BILLING MODE + VERIFY SUCCESS RETURN
  // ==================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function initialiseBillingPage() {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const existing =
          params.get(
            "existing"
          );

        const success =
          params.get(
            "success"
          );

        const sessionId =
          params.get(
            "session_id"
          );

        setExistingAccount(
          existing ===
            "true"
        );

        // ============================================
        // STRIPE SUCCESS RETURN
        // ============================================

        if (
          success ===
            "true" &&
          sessionId
        ) {
          setVerificationState(
            "verifying"
          );

          try {
            const response =
              await fetch(
                "/api/pay/stripe/verify",
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      sessionId,
                    }),
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => ({})
                );

            if (
              cancelled
            ) {
              return;
            }

            if (
              !response.ok
            ) {
              throw new Error(
                data.error ||
                  "Unable to verify your subscription."
              );
            }

            setVerifiedTier(
              typeof data.tier ===
                "string"
                ? data.tier
                : null
            );

            setVerifiedOrganisationName(
              typeof data.organisationName ===
                "string"
                ? data.organisationName
                : null
            );

            setVerificationState(
              "success"
            );

            setModeReady(
              true
            );

            return;
          } catch (
            error
          ) {
            console.error(
              "Subscription verification failed:",
              error
            );

            if (
              cancelled
            ) {
              return;
            }

            setVerificationError(
              error instanceof
                Error
                ? error.message
                : "Unable to verify your subscription."
            );

            setVerificationState(
              "error"
            );

            setModeReady(
              true
            );

            return;
          }
        }

        // ============================================
        // NORMAL BILLING PAGE
        // ============================================

        setModeReady(
          true
        );
      }

      void initialiseBillingPage();

      return () => {
        cancelled =
          true;
      };
    },
    []
  );

  // ==================================================
  // NORMALISE TIER
  // ==================================================

  function getApiTier(
    tier:
      Tier["name"]
  ) {
    return tier
      .toLowerCase();
  }

  // ==================================================
  // CHECKOUT
  // ==================================================

  const handleCheckout =
    async (
      tier:
        Tier
    ) => {
      if (
        loading ||
        !modeReady
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
        // ============================================
        // EXISTING / BETA CUSTOMER
        // ============================================

        if (
          existingAccount
        ) {
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
                  JSON.stringify({
                    tier:
                      getApiTier(
                        tier.name
                      ),

                    additionalSeats:
                      0,
                  }),
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
            if (
              response.status ===
              401
            ) {
              throw new Error(
                "Please sign in to your existing TOTS-OS account before choosing your plan."
              );
            }

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

          return;
        }

        // ============================================
        // NEW CUSTOMER
        // ============================================

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
  // VERIFYING SCREEN
  // ==================================================

  if (
    verificationState ===
    "verifying"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

        <div className="w-full max-w-xl rounded-[2.5rem] border border-stone-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(28,25,23,0.06)] md:p-14">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf1e8]">

            <Loader2
              size={24}
              className="animate-spin text-[#82936b]"
            />

          </div>

          <p className="mt-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#748361]">
            Confirming your membership
          </p>

          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-stone-900 md:text-5xl">
            Just a moment...
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500">
            We&apos;re confirming your Stripe subscription and
            reconnecting your TOTS-OS workspace.
          </p>

        </div>

      </main>
    );
  }

  // ==================================================
  // SUCCESS SCREEN
  // ==================================================

  if (
    verificationState ===
    "success"
  ) {
    const displayTier =
      verifiedTier
        ? verifiedTier
            .charAt(
              0
            )
            .toUpperCase() +
          verifiedTier.slice(
            1
          )
        : null;

    return (
      <main className="min-h-screen bg-[#f7f5f2] px-5 py-12 md:px-10 md:py-16">

        <div className="mx-auto max-w-3xl">

          <div className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(28,25,23,0.06)]">

            <div className="border-b border-stone-100 p-8 md:p-14">

              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-4 py-2">

                <Sparkles
                  size={13}
                  className="text-[#82936b]"
                />

                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#748361]">
                  Membership active
                </span>

              </div>

              <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf1e8]">

                <Check
                  size={23}
                  strokeWidth={3}
                  className="text-[#82936b]"
                />

              </div>

              <h1 className="mt-7 max-w-2xl font-serif text-5xl italic tracking-tight text-stone-900 md:text-7xl">
                You&apos;re all set.
              </h1>

              {verifiedOrganisationName && (
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#829473]">
                  {
                    verifiedOrganisationName
                  }
                </p>
              )}

              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
                Your TOTS-OS membership has been activated and
                your existing workspace is ready to use.
              </p>

            </div>

            <div className="p-8 md:p-14">

              <div className="rounded-[2rem] border border-[#cdd7c3] bg-[#edf1e8] p-6 md:p-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">

                    <ShieldCheck
                      size={18}
                      strokeWidth={2.5}
                      className="text-[#82936b]"
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#748361]">
                      Your access is active
                    </p>

                    {displayTier && (
                      <p className="mt-3 text-sm font-semibold text-stone-700">
                        {
                          displayTier
                        } membership
                      </p>
                    )}

                    <p className="mt-2 max-w-xl text-xs leading-6 text-stone-500">
                      Your existing projects, contacts, notes,
                      settings and business data are still exactly
                      where you left them.
                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-8">

                <p className="font-serif text-3xl italic text-stone-800">
                  Welcome back.
                </p>

                <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
                  Head straight back into TOTS-OS and carry on
                  running your business.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/dashboard";
                }}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700 sm:w-auto"
              >
                Go to TOTS-OS

                <ArrowRight
                  size={13}
                />

              </button>

            </div>

          </div>

        </div>

      </main>
    );
  }

  // ==================================================
  // VERIFICATION ERROR
  // ==================================================

  if (
    verificationState ===
    "error"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

        <div className="w-full max-w-xl rounded-[2.5rem] border border-stone-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(28,25,23,0.06)] md:p-14">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">

            <ShieldCheck
              size={22}
              className="text-stone-500"
            />

          </div>

          <p className="mt-7 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Payment received
          </p>

          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-stone-900 md:text-5xl">
            We couldn&apos;t finish activating your account.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500">
            Your Stripe payment may still have completed. Please
            don&apos;t make another payment.
          </p>

          {verificationError && (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">

              <p className="text-xs leading-6 text-stone-500">
                {
                  verificationError
                }
              </p>

            </div>
          )}

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-7 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700"
          >
            Try verification again
          </button>

        </div>

      </main>
    );
  }

  // ==================================================
  // MAIN BILLING UI
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
                  {existingAccount
                    ? "Continue with TOTS-OS"
                    : "TOTS-OS Membership"}
                </span>

              </div>

              <h1 className="max-w-3xl font-serif text-4xl italic tracking-tight text-stone-900 md:text-6xl">
                {existingAccount
                  ? "Choose the plan you want to continue with."
                  : "Choose how you want to run your business."}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
                {existingAccount
                  ? "Your TOTS-OS account, data and setup stay exactly where they are. Simply choose the membership that fits your business and continue where you left off."
                  : "Pick the level of TOTS-OS that fits your business now. You can upgrade later as your system grows."}
              </p>

              {/* ======================================
                  STATUS MESSAGE
              ====================================== */}

              {existingAccount ? (
                <div className="mt-6 flex max-w-xl items-start gap-4 rounded-2xl border border-[#cdd7c3] bg-[#edf1e8] px-5 py-4">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#82936b] shadow-sm">

                    <Check
                      size={16}
                      strokeWidth={3}
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#748361]">
                      Keep your TOTS-OS account
                    </p>

                    <p className="mt-1 text-sm font-semibold text-stone-700">
                      Nothing needs to be set up again.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Choose your membership below and your
                      existing account, data and workspace
                      will remain in place.
                    </p>

                  </div>

                </div>
              ) : (
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
              )}

            </div>

            {/* SELECTED PLAN */}

            <div className="w-fit rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Selected plan
              </p>

              <div className="mt-1 flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />

                <p className="font-serif text-xl italic text-stone-900">
                  {
                    selectedTier
                  }
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* ==========================================
            INFO STRIP
        ========================================== */}

        <section className="mb-7 grid gap-3 md:grid-cols-3">

          {existingAccount ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1e8]">

                  <Check
                    size={15}
                    strokeWidth={3}
                    className="text-[#82936b]"
                  />

                </div>

                <div>

                  <p className="text-xs font-semibold text-stone-700">
                    Keep your workspace
                  </p>

                  <p className="mt-0.5 text-[10px] text-stone-400">
                    Your existing data stays put
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
                    Simple monthly billing
                  </p>

                  <p className="mt-0.5 text-[10px] text-stone-400">
                    Choose the plan that suits you
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
                    Continue seamlessly
                  </p>

                  <p className="mt-0.5 text-[10px] text-stone-400">
                    No new account required
                  </p>

                </div>

              </div>
            </>
          ) : (
            <>
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
            </>
          )}

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
                      {
                        tier.name
                      }
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

                    {/* STATUS BADGE */}

                    {existingAccount ? (
                      <>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-3 py-2">

                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-[#82936b]"
                          />

                          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#748361]">
                            Continue on this plan
                          </span>

                        </div>

                        <p className="mt-2 text-[10px] font-medium text-stone-400">
                          Keep your existing TOTS-OS account
                        </p>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}

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
                        null ||
                      !modeReady
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
                    ) : existingAccount ? (
                      <>
                        Continue with{" "}
                        {
                          tier.name
                        }
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
                    {existingAccount
                      ? `£${tier.price}/month`
                      : "14 days free · no bank details"}
                  </p>

                </article>
              );
            }
          )}

        </section>

        {/* ==========================================
            CHECKOUT INFORMATION
        ========================================== */}

        {existingAccount ? (
          <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[2rem] border border-stone-200 bg-white px-6 py-5 text-center shadow-sm md:flex-row md:text-left">

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf1e8]">

                <Check
                  size={16}
                  strokeWidth={3}
                  className="text-[#82936b]"
                />

              </div>

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-500">
                  Continue with TOTS-OS
                </p>

                <p className="mt-1 text-xs font-semibold text-stone-600">
                  Your existing workspace stays exactly where it is.
                </p>

                <p className="mt-1 text-[10px] text-stone-400">
                  Choose your plan and continue using your
                  existing account, data and setup.
                </p>

              </div>

            </div>

            <div className="text-center md:text-right">

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                TOTS-OS
              </p>

              <p className="mt-1 text-[10px] text-stone-400">
                Secure monthly billing through Stripe.
              </p>

            </div>

          </div>
        ) : (
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
        )}

      </div>

    </main>
  );
}