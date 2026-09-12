"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Mail,
  Megaphone,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type ModuleKey =
  | "core"
  | "clientsProjects"
  | "finance"
  | "social"
  | "email"
  | "store";

type AiTierKey =
  | "none"
  | "starter"
  | "plus"
  | "pro";

type BillingPackage =
  | "modular"
  | "complete";

type VerificationState =
  | "idle"
  | "verifying"
  | "success"
  | "error";

type ModuleInfo = {
  key: ModuleKey;
  name: string;
  shortName: string;
  description: string;
  price: number;
  icon: LucideIcon;
};

type AiTierInfo = {
  key: AiTierKey;
  name: string;
  shortName: string;
  description: string;
  allowance: string;
  price: number;
};

type PricingResult = {
  requestedModules: ModuleKey[];
  displayedModules: ModuleKey[];

  packageType: BillingPackage;

  moduleCount: number;

  undiscountedModuleTotal: number;
  discountedModuleTotal: number;

  moduleSaving: number;

  requestedAiTier: AiTierKey;
  displayedAiTier: AiTierKey;

  requestedAiPrice: number;

  modularTotal: number;
  totalMonthly: number;

  isComplete: boolean;

  completeSaving: number;

  discountPercent: number;
  discountLabel: string;

  aiUpgradeSuggested: boolean;
};

/* ============================================================
   CONFIG
============================================================ */

const COMPLETE_PRICE = 199;

const MODULE_ORDER: ModuleKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

/* ============================================================
   MODULES
============================================================ */

const MODULES: Record<
  ModuleKey,
  ModuleInfo
> = {
  core: {
    key: "core",

    name:
      "TOTS-OS Core",

    shortName:
      "Core",

    description:
      "Your central workspace for dashboards, contacts, tasks, calendar, notes and everyday business organisation.",

    price: 39,

    icon:
      LayoutDashboard,
  },

  clientsProjects: {
    key:
      "clientsProjects",

    name:
      "Clients & Projects",

    shortName:
      "Clients & Projects",

    description:
      "Manage client relationships, projects, tasks, deadlines, notes, files and delivery in one connected workspace.",

    price: 49,

    icon:
      FolderKanban,
  },

  finance: {
    key:
      "finance",

    name:
      "Finance",

    shortName:
      "Finance",

    description:
      "Manage invoices, quotes, expenses and day-to-day financial visibility alongside your wider business activity.",

    price: 49,

    icon:
      CircleDollarSign,
  },

  social: {
    key:
      "social",

    name:
      "Social Studio",

    shortName:
      "Social Studio",

    description:
      "Plan, organise and publish social content without separating marketing from the rest of your business.",

    price: 49,

    icon:
      Megaphone,
  },

  email: {
    key:
      "email",

    name:
      "Email Marketing",

    shortName:
      "Email Marketing",

    description:
      "Manage audiences, subscriber lists, campaigns, scheduling and customer email activity.",

    price: 39,

    icon:
      Mail,
  },

  store: {
    key:
      "store",

    name:
      "TOTS-OS Store",

    shortName:
      "Store",

    description:
      "Manage products, customers and orders without running your online store as another disconnected system.",

    price: 39,

    icon:
      Store,
  },
};

/* ============================================================
   CLARITY AI
============================================================ */

const AI_TIERS: Record<
  AiTierKey,
  AiTierInfo
> = {
  none: {
    key:
      "none",

    name:
      "No Clarity AI",

    shortName:
      "No AI",

    price: 0,

    allowance:
      "",

    description:
      "Use your TOTS-OS workspace without an additional Clarity AI allowance.",
  },

  starter: {
    key:
      "starter",

    name:
      "Clarity AI Starter",

    shortName:
      "Starter",

    price: 19,

    allowance:
      "100 AI actions / month",

    description:
      "For occasional summaries, ideas, recommendations and quick business assistance.",
  },

  plus: {
    key:
      "plus",

    name:
      "Clarity AI Plus",

    shortName:
      "Plus",

    price: 39,

    allowance:
      "500 AI actions / month",

    description:
      "For regular AI use throughout the week across several areas of your business.",
  },

  pro: {
    key:
      "pro",

    name:
      "Clarity AI Pro",

    shortName:
      "Pro",

    price: 69,

    allowance:
      "1,500 AI actions / month",

    description:
      "For businesses making Clarity AI part of their everyday operating workflow.",
  },
};

/* ============================================================
   HELPERS
============================================================ */

function isModuleKey(
  value: string,
): value is ModuleKey {
  return MODULE_ORDER.includes(
    value as ModuleKey,
  );
}

function isAiTierKey(
  value: string | null,
): value is AiTierKey {
  return (
    value === "none" ||
    value === "starter" ||
    value === "plus" ||
    value === "pro"
  );
}

function uniqueModules(
  modules: ModuleKey[],
) {
  return MODULE_ORDER.filter(
    (key) =>
      modules.includes(
        key,
      ),
  );
}

/* ============================================================
   PRICING

   1–2 modules:
   full module price

   3–4 modules:
   10% off

   5 modules:
   20% off

   Complete:
   £199 / month

   Complete includes:
   - all 6 main modules
   - Clarity AI Starter

   If the selected modular setup reaches £199 or more,
   Complete is automatically recommended instead.

   IMPORTANT:
   The browser calculates this for DISPLAY ONLY.
   Your Stripe API must calculate the real price server-side
   from trusted Price IDs / product configuration.
============================================================ */

function calculatePricing(
  modules: ModuleKey[],
  requestedAiTier: AiTierKey,
): PricingResult {
  const cleanModules =
    uniqueModules(
      modules,
    );

  const moduleCount =
    cleanModules.length;

  const undiscountedModuleTotal =
    cleanModules.reduce(
      (
        total,
        key,
      ) =>
        total +
        MODULES[key].price,

      0,
    );

  let discountedModuleTotal =
    undiscountedModuleTotal;

  let discountPercent =
    0;

  let discountLabel =
    "Standard module pricing";

  if (
    moduleCount === 5
  ) {
    discountPercent =
      20;

    discountLabel =
      "20% bundle saving";

    discountedModuleTotal =
      Math.round(
        undiscountedModuleTotal *
          0.8,
      );
  } else if (
    moduleCount >= 3
  ) {
    discountPercent =
      10;

    discountLabel =
      "10% bundle saving";

    discountedModuleTotal =
      Math.round(
        undiscountedModuleTotal *
          0.9,
      );
  }

  const moduleSaving =
    undiscountedModuleTotal -
    discountedModuleTotal;

  const requestedAiPrice =
    AI_TIERS[
      requestedAiTier
    ].price;

  const modularTotal =
    discountedModuleTotal +
    requestedAiPrice;

  const shouldUseComplete =
    moduleCount ===
      MODULE_ORDER.length ||
    modularTotal >=
      COMPLETE_PRICE;

  if (
    shouldUseComplete
  ) {
    return {
      requestedModules:
        cleanModules,

      displayedModules:
        MODULE_ORDER,

      packageType:
        "complete",

      moduleCount:
        MODULE_ORDER.length,

      undiscountedModuleTotal,

      discountedModuleTotal,

      moduleSaving,

      requestedAiTier,

      displayedAiTier:
        "starter",

      requestedAiPrice,

      modularTotal,

      totalMonthly:
        COMPLETE_PRICE,

      isComplete:
        true,

      completeSaving:
        Math.max(
          0,

          modularTotal -
            COMPLETE_PRICE,
        ),

      discountPercent:
        0,

      discountLabel:
        "Complete fixed price",

      aiUpgradeSuggested:
        requestedAiTier ===
          "plus" ||
        requestedAiTier ===
          "pro",
    };
  }

  return {
    requestedModules:
      cleanModules,

    displayedModules:
      cleanModules,

    packageType:
      "modular",

    moduleCount,

    undiscountedModuleTotal,

    discountedModuleTotal,

    moduleSaving,

    requestedAiTier,

    displayedAiTier:
      requestedAiTier,

    requestedAiPrice,

    modularTotal,

    totalMonthly:
      modularTotal,

    isComplete:
      false,

    completeSaving:
      0,

    discountPercent,

    discountLabel,

    aiUpgradeSuggested:
      false,
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function BillingPage() {
  const [
    selectedModules,
    setSelectedModules,
  ] =
    useState<ModuleKey[]>(
      ["core"],
    );

  const [
    selectedAiTier,
    setSelectedAiTier,
  ] =
    useState<AiTierKey>(
      "none",
    );

  const [
    fromQuiz,
    setFromQuiz,
  ] =
    useState(
      false,
    );

  const [
    existingAccount,
    setExistingAccount,
  ] =
    useState(
      false,
    );

  const [
    modeReady,
    setModeReady,
  ] =
    useState(
      false,
    );

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] =
    useState(
      false,
    );

  const [
    checkoutError,
    setCheckoutError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    verificationState,
    setVerificationState,
  ] =
    useState<VerificationState>(
      "idle",
    );

  const [
    verificationError,
    setVerificationError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    verifiedOrganisationName,
    setVerifiedOrganisationName,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    verifiedPackage,
    setVerifiedPackage,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    verifiedModules,
    setVerifiedModules,
  ] =
    useState<string[]>(
      [],
    );

  const [
    verifiedAiTier,
    setVerifiedAiTier,
  ] =
    useState<
      string | null
    >(
      null,
    );

  /* ==========================================================
     PRICING RESULT
  ========================================================== */

  const pricing =
    useMemo(
      () =>
        calculatePricing(
          selectedModules,
          selectedAiTier,
        ),

      [
        selectedModules,
        selectedAiTier,
      ],
    );

  /* ==========================================================
     INITIALISE
  ========================================================== */

  useEffect(
    () => {
      let cancelled =
        false;

      async function initialiseBillingPage() {
        const params =
          new URLSearchParams(
            window.location.search,
          );

        const existing =
          params.get(
            "existing",
          );

        const success =
          params.get(
            "success",
          );

        const sessionId =
          params.get(
            "session_id",
          );

        const source =
          params.get(
            "source",
          );

        const packageParam =
          params.get(
            "package",
          );

        const modulesParam =
          params.get(
            "modules",
          );

        const aiParam =
          params.get(
            "ai",
          );

        setExistingAccount(
          existing ===
            "true",
        );

        /* ==============================================
           STRIPE SUCCESS
        ============================================== */

        if (
          success ===
            "true" &&
          sessionId
        ) {
          setVerificationState(
            "verifying",
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
                },
              );

            const data =
              await response
                .json()
                .catch(
                  () => ({}),
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
                  "Unable to verify your membership.",
              );
            }

            setVerifiedOrganisationName(
              typeof data.organisationName ===
                "string"
                ? data.organisationName
                : null,
            );

            setVerifiedPackage(
              typeof data.package ===
                "string"
                ? data.package
                : typeof data.membership ===
                    "string"
                  ? data.membership
                  : typeof data.tier ===
                      "string"
                    ? data.tier
                    : null,
            );

            setVerifiedModules(
              Array.isArray(
                data.modules,
              )
                ? data.modules.filter(
                    (
                      item: unknown,
                    ) =>
                      typeof item ===
                      "string",
                  )
                : [],
            );

            setVerifiedAiTier(
              typeof data.aiTier ===
                "string"
                ? data.aiTier
                : typeof data.ai ===
                    "string"
                  ? data.ai
                  : null,
            );

            setVerificationState(
              "success",
            );

            setModeReady(
              true,
            );

            return;
          } catch (
            error
          ) {
            console.error(
              "Membership verification failed:",
              error,
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
                : "Unable to verify your membership.",
            );

            setVerificationState(
              "error",
            );

            setModeReady(
              true,
            );

            return;
          }
        }

        /* ==============================================
           QUIZ RECOMMENDATION
        ============================================== */

        if (
          source ===
          "find-your-setup"
        ) {
          setFromQuiz(
            true,
          );
        }

        if (
          packageParam ===
          "complete"
        ) {
          setSelectedModules(
            MODULE_ORDER,
          );

          setSelectedAiTier(
            "starter",
          );
        } else {
          if (
            modulesParam
          ) {
            const parsedModules =
              modulesParam
                .split(",")
                .map(
                  (value) =>
                    value.trim(),
                )
                .filter(
                  isModuleKey,
                );

            if (
              parsedModules.length >
              0
            ) {
              setSelectedModules(
                uniqueModules(
                  parsedModules,
                ),
              );
            }
          }

          if (
            isAiTierKey(
              aiParam,
            )
          ) {
            setSelectedAiTier(
              aiParam,
            );
          }
        }

        setModeReady(
          true,
        );
      }

      void initialiseBillingPage();

      return () => {
        cancelled =
          true;
      };
    },
    [],
  );

  /* ==========================================================
     MODULE SELECTION
  ========================================================== */

  function toggleModule(
    moduleKey: ModuleKey,
  ) {
    setCheckoutError(
      null,
    );

    setSelectedModules(
      (
        current,
      ) => {
        if (
          current.includes(
            moduleKey,
          )
        ) {
          return current.filter(
            (key) =>
              key !==
              moduleKey,
          );
        }

        return uniqueModules(
          [
            ...current,
            moduleKey,
          ],
        );
      },
    );
  }

  function selectComplete() {
    setSelectedModules(
      MODULE_ORDER,
    );

    setSelectedAiTier(
      "starter",
    );

    setCheckoutError(
      null,
    );
  }

  /* ==========================================================
     CHECKOUT
  ========================================================== */

  async function handleCheckout() {
    if (
      checkoutLoading ||
      !modeReady
    ) {
      return;
    }

    if (
      selectedModules.length ===
      0
    ) {
      setCheckoutError(
        "Choose at least one TOTS-OS module before continuing.",
      );

      return;
    }

    setCheckoutLoading(
      true,
    );

    setCheckoutError(
      null,
    );

    try {
      /*
        IMPORTANT:

        Do NOT trust totalMonthly from the browser
        when creating Stripe prices.

        The API should calculate the real amount using
        trusted Stripe Price IDs / module configuration.
      */

      const checkoutPayload = {
        billingModel:
          "modular",

        package:
          pricing.packageType,

        modules:
          pricing.isComplete
            ? MODULE_ORDER
            : pricing.requestedModules,

        aiTier:
          pricing.isComplete
            ? "starter"
            : pricing.requestedAiTier,

        additionalSeats:
          0,

        source:
          fromQuiz
            ? "find-your-setup"
            : "billing",
      };

      /* ==============================================
         EXISTING CUSTOMER
      ============================================== */

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
                JSON.stringify(
                  checkoutPayload,
                ),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (
          !response.ok
        ) {
          if (
            response.status ===
            401
          ) {
            throw new Error(
              "Please sign in to your existing TOTS-OS account before buying your membership.",
            );
          }

          throw new Error(
            data.error ||
              "Unable to create your checkout session.",
          );
        }

        if (
          !data.url
        ) {
          throw new Error(
            "Stripe checkout URL was not returned.",
          );
        }

        window.location.href =
          data.url;

        return;
      }

      /* ==============================================
         NEW CUSTOMER
      ============================================== */

      const storedRegistration =
        sessionStorage.getItem(
          "pendingRegistration",
        );

      if (
        !storedRegistration
      ) {
        throw new Error(
          "Your registration details could not be found. Please return to signup, create your account and try again.",
        );
      }

      let registration:
        Record<
          string,
          unknown
        >;

      try {
        registration =
          JSON.parse(
            storedRegistration,
          );
      } catch {
        throw new Error(
          "Your registration details are invalid. Please return to signup and try again.",
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
              JSON.stringify({
                ...registration,

                ...checkoutPayload,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to create your checkout session.",
        );
      }

      if (
        !data.url
      ) {
        throw new Error(
          "Stripe checkout URL was not returned.",
        );
      }

      window.location.href =
        data.url;
    } catch (
      error
    ) {
      console.error(
        "Checkout failed:",
        error,
      );

      setCheckoutError(
        error instanceof
          Error
          ? error.message
          : "Unable to start checkout.",
      );

      setCheckoutLoading(
        false,
      );
    }
  }

  /* ==========================================================
     VERIFYING
  ========================================================== */

  if (
    verificationState ===
    "verifying"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-5">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-10 text-center shadow-[0_26px_80px_rgba(79,74,70,0.08)] md:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF3EB]">
            <Loader2
              size={24}
              className="animate-spin text-[#637454]"
              aria-hidden="true"
            />
          </div>

          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.16em] text-[#637454]">
            Confirming your membership
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#373330] md:text-5xl">
            Just a moment...
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#69645f]">
            We&apos;re confirming your Stripe payment and activating
            the right TOTS-OS modules for your workspace.
          </p>
        </div>
      </main>
    );
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  if (
    verificationState ===
    "success"
  ) {
    const successLabel =
      verifiedPackage
        ? verifiedPackage
            .replaceAll(
              "_",
              " ",
            )
        : "TOTS-OS";

    return (
      <main className="min-h-screen bg-[#FAF8F5] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] shadow-[0_26px_80px_rgba(79,74,70,0.08)]">

            <div className="border-b border-[#4f4a46]/10 p-8 md:p-14">

              <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF3EB] px-4 py-2 text-[#637454]">
                <Sparkles
                  size={13}
                  aria-hidden="true"
                />

                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  Membership active
                </span>
              </div>

              <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF3EB] text-[#637454]">
                <Check
                  size={23}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-7 max-w-2xl text-5xl font-semibold tracking-[-0.055em] text-[#373330] md:text-7xl">
                You&apos;re all set.
              </h1>

              {verifiedOrganisationName && (
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                  {
                    verifiedOrganisationName
                  }
                </p>
              )}

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#69645f]">
                Your TOTS-OS membership has been activated and your
                workspace is ready to use.
              </p>
            </div>

            <div className="p-8 md:p-14">

              <div className="rounded-[1.5rem] border border-[#A9B897]/50 bg-[#EFF3EB] p-6 md:p-8">
                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#637454] shadow-sm">
                    <ShieldCheck
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#637454]">
                      Your access is active
                    </p>

                    <p className="mt-3 text-sm font-semibold capitalize text-[#4f4a46]">
                      {
                        successLabel
                      }{" "}
                      membership
                    </p>

                    {verifiedModules.length >
                      0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {verifiedModules.map(
                          (
                            module,
                          ) => (
                            <span
                              key={
                                module
                              }
                              className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#5d5854]"
                            >
                              {
                                MODULES[
                                  module as ModuleKey
                                ]
                                  ?.shortName ||
                                module
                              }
                            </span>
                          ),
                        )}
                      </div>
                    )}

                    {verifiedAiTier && (
                      <p className="mt-4 text-xs text-[#69645f]">
                        Clarity AI:{" "}
                        <span className="font-semibold capitalize text-[#4f4a46]">
                          {
                            verifiedAiTier
                          }
                        </span>
                      </p>
                    )}

                    <p className="mt-4 max-w-xl text-xs leading-6 text-[#69645f]">
                      Your existing projects, contacts, notes, settings
                      and business data remain exactly where they were.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/dashboard";
                }}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#373330] px-8 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#373330]"
              >
                Go to TOTS-OS

                <ArrowRight
                  size={15}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     VERIFICATION ERROR
  ========================================================== */

  if (
    verificationState ===
    "error"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-5">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-10 text-center shadow-[0_26px_80px_rgba(79,74,70,0.08)] md:p-14">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0ECE7] text-[#69645f]">
            <ShieldCheck
              size={22}
              aria-hidden="true"
            />
          </div>

          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.16em] text-[#69645f]">
            Payment received
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#373330] md:text-5xl">
            We couldn&apos;t finish activating your membership.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#69645f]">
            Your Stripe payment may still have completed. Please do not
            make another payment.
          </p>

          {verificationError && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-[#4f4a46]/10 bg-[#F0ECE7] px-5 py-4"
            >
              <p className="text-xs leading-6 text-[#5d5854]">
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
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#373330] px-7 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#373330]"
          >
            Try verification again
          </button>
        </div>
      </main>
    );
  }

  /* ==========================================================
     MAIN BILLING PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-8 text-[#4f4a46] md:px-10 md:py-12">

      <a
        href="#membership-builder"
        className="fixed left-3 top-3 z-[100] -translate-y-[180%] rounded-lg bg-[#373330] px-4 py-3 text-sm font-bold text-white focus:translate-y-0"
      >
        Skip to membership builder
      </a>

      <div className="mx-auto max-w-[1380px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="mb-10 border-b border-[#4f4a46]/10 pb-8 md:mb-12">

          <a
            href="/find-your-setup"
            className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#4f4a46]/10 bg-white px-4 text-xs font-bold text-[#5d5854] transition hover:border-[#4f4a46]/20 hover:bg-[#FFFEFD] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#373330]"
          >
            <ArrowLeft
              size={14}
              aria-hidden="true"
            />

            Find your setup
          </a>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">

            <div className="max-w-4xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4f4a46]/10 bg-white px-4 py-2 text-[#637454]">

                <Sparkles
                  size={13}
                  aria-hidden="true"
                />

                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  {fromQuiz
                    ? "Your recommended TOTS-OS membership"
                    : "Build your TOTS-OS membership"}
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#373330] md:text-7xl">
                {fromQuiz
                  ? "Review your setup before you buy."
                  : "Pay for what your business actually needs."}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#69645f]">
                Choose the TOTS-OS modules you want, add Clarity AI if
                you need it, and we&apos;ll automatically apply the best
                available bundle price.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#4f4a46]/10 bg-[#FFFEFD] px-6 py-5 shadow-[0_12px_34px_rgba(79,74,70,0.05)]">

              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#69645f]">
                Current membership
              </p>

              <div className="mt-2 flex items-center gap-3">

                <span className="h-2.5 w-2.5 rounded-full bg-[#637454]" />

                <p className="text-xl font-semibold tracking-[-0.025em] text-[#373330]">
                  {pricing.isComplete
                    ? "TOTS-OS Complete"
                    : `${pricing.moduleCount} ${
                        pricing.moduleCount ===
                        1
                          ? "module"
                          : "modules"
                      }`}
                </p>
              </div>

              <p className="mt-2 text-sm text-[#69645f]">
                £
                {
                  pricing.totalMonthly
                }
                /month
              </p>
            </div>
          </div>

          {fromQuiz && (
            <div className="mt-7 flex max-w-3xl items-start gap-4 rounded-2xl border border-[#A9B897]/60 bg-[#EFF3EB] px-5 py-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#637454] shadow-sm">
                <CheckCircle2
                  size={18}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                  Loaded from your quiz
                </p>

                <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                  Your recommended setup is ready to review.
                </p>

                <p className="mt-1 text-xs leading-6 text-[#69645f]">
                  You can buy it exactly as recommended or change any
                  module before checkout.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ==================================================
            VALUE STRIP
        ================================================== */}

        <section
          aria-label="Membership benefits"
          className="mb-7 grid gap-3 md:grid-cols-3"
        >

          <div className="flex items-center gap-4 rounded-2xl border border-[#4f4a46]/10 bg-white px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF3EB] text-[#637454]">
              <Sparkles
                size={16}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#4f4a46]">
                Flexible modules
              </p>

              <p className="mt-0.5 text-xs text-[#69645f]">
                Choose only what you need
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#4f4a46]/10 bg-white px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF3EB] text-[#637454]">
              <CreditCard
                size={16}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#4f4a46]">
                Automatic bundle savings
              </p>

              <p className="mt-0.5 text-xs text-[#69645f]">
                The best eligible price is applied
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#4f4a46]/10 bg-white px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF3EB] text-[#637454]">
              <ShieldCheck
                size={16}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#4f4a46]">
                £199 maximum
              </p>

              <p className="mt-0.5 text-xs text-[#69645f]">
                Complete gives you everything
              </p>
            </div>
          </div>

        </section>

        <div
          id="membership-builder"
          className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]"
        >

          {/* ==================================================
              LEFT: MODULE BUILDER
          ================================================== */}

          <div>

            <section
              aria-labelledby="module-heading"
              className="rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-6 shadow-[0_12px_34px_rgba(79,74,70,0.04)] md:p-8"
            >

              <div className="flex flex-col gap-4 border-b border-[#4f4a46]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                    Step 1
                  </p>

                  <h2
                    id="module-heading"
                    className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#373330]"
                  >
                    Choose your modules
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-7 text-[#69645f]">
                    Select the areas of TOTS-OS you want access to.
                    Discounts are calculated automatically.
                  </p>
                </div>

                <p
                  aria-live="polite"
                  className="text-sm font-semibold text-[#637454]"
                >
                  {
                    selectedModules.length
                  }{" "}
                  {selectedModules.length ===
                  1
                    ? "module"
                    : "modules"}{" "}
                  selected
                </p>
              </div>

              <fieldset className="mt-6">
                <legend className="sr-only">
                  Select TOTS-OS modules
                </legend>

                <div className="grid gap-4 md:grid-cols-2">

                  {MODULE_ORDER.map(
                    (
                      key,
                    ) => {
                      const module =
                        MODULES[
                          key
                        ];

                      const Icon =
                        module.icon;

                      const selected =
                        selectedModules.includes(
                          key,
                        );

                      return (
                        <label
                          key={
                            key
                          }
                          className={`
                            relative
                            cursor-pointer
                            rounded-[1.35rem]
                            border
                            p-5
                            transition

                            ${
                              selected
                                ? "border-[#637454] bg-[#EFF3EB] shadow-[inset_0_0_0_1px_rgba(99,116,84,0.18)]"
                                : "border-[#4f4a46]/10 bg-white hover:border-[#A9B897]"
                            }

                            focus-within:outline
                            focus-within:outline-3
                            focus-within:outline-offset-3
                            focus-within:outline-[#373330]
                          `}
                        >

                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleModule(
                                key,
                              )
                            }
                            className="sr-only"
                          />

                          <div className="flex items-start gap-4">

                            <div
                              className={`
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl

                                ${
                                  selected
                                    ? "bg-white text-[#637454]"
                                    : "bg-[#F0ECE7] text-[#69645f]"
                                }
                              `}
                            >
                              <Icon
                                size={19}
                                aria-hidden="true"
                              />
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-4">

                                <div>
                                  <h3 className="text-base font-bold text-[#373330]">
                                    {
                                      module.name
                                    }
                                  </h3>

                                  <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                                    £
                                    {
                                      module.price
                                    }
                                    /month
                                  </p>
                                </div>

                                <span
                                  aria-hidden="true"
                                  className={`
                                    flex
                                    h-6
                                    w-6
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    border

                                    ${
                                      selected
                                        ? "border-[#637454] bg-[#637454] text-white"
                                        : "border-[#4f4a46]/20 bg-white text-transparent"
                                    }
                                  `}
                                >
                                  <Check
                                    size={13}
                                    strokeWidth={3}
                                  />
                                </span>

                              </div>

                              <p className="mt-3 text-xs leading-6 text-[#69645f]">
                                {
                                  module.description
                                }
                              </p>

                            </div>

                          </div>

                        </label>
                      );
                    },
                  )}

                </div>
              </fieldset>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#69645f]">
                    1–2 modules
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                    Standard pricing
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#69645f]">
                    3–4 modules
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                    10% off
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#69645f]">
                    5 modules
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                    20% off
                  </p>
                </div>

              </div>

            </section>

            {/* ==================================================
                CLARITY AI
            ================================================== */}

            <section
              aria-labelledby="ai-heading"
              className="mt-6 rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-6 shadow-[0_12px_34px_rgba(79,74,70,0.04)] md:p-8"
            >

              <div className="border-b border-[#4f4a46]/10 pb-6">

                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                  Step 2
                </p>

                <h2
                  id="ai-heading"
                  className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#373330]"
                >
                  Choose your Clarity AI level
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#69645f]">
                  Add only the AI allowance that matches how often you
                  expect to use it.
                </p>

              </div>

              {pricing.isComplete ? (
                <div className="mt-6">

                  <div className="flex items-start gap-4 rounded-[1.35rem] border border-[#637454] bg-[#EFF3EB] p-5">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#936d43]">
                      <BrainCircuit
                        size={19}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                        Included with Complete
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#373330]">
                        Clarity AI Starter
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                        100 AI actions / month
                      </p>

                      <p className="mt-3 max-w-xl text-xs leading-6 text-[#69645f]">
                        Complete includes Clarity AI Starter as standard.
                        Your total membership remains £199/month.
                      </p>

                    </div>

                  </div>

                  {pricing.aiUpgradeSuggested && (
                    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#C69D69]/30 bg-[#F2E7DA] px-4 py-4">

                      <Sparkles
                        size={16}
                        className="mt-0.5 shrink-0 text-[#936d43]"
                        aria-hidden="true"
                      />

                      <p className="text-xs leading-6 text-[#5d5854]">
                        Your quiz suggested{" "}
                        <strong>
                          {
                            AI_TIERS[
                              pricing.requestedAiTier
                            ].name
                          }
                        </strong>
                        , but Complete includes Starter. We recommend
                        starting there and only increasing your AI
                        allowance later if you actually need it.
                      </p>

                    </div>
                  )}

                </div>
              ) : (
                <fieldset className="mt-6">

                  <legend className="sr-only">
                    Choose your Clarity AI plan
                  </legend>

                  <div className="grid gap-3 md:grid-cols-2">

                    {(
                      Object.keys(
                        AI_TIERS,
                      ) as AiTierKey[]
                    ).map(
                      (
                        key,
                      ) => {
                        const tier =
                          AI_TIERS[
                            key
                          ];

                        const selected =
                          selectedAiTier ===
                          key;

                        return (
                          <label
                            key={
                              key
                            }
                            className={`
                              relative
                              cursor-pointer
                              rounded-[1.2rem]
                              border
                              p-5
                              transition

                              ${
                                selected
                                  ? "border-[#936d43] bg-[#F2E7DA]"
                                  : "border-[#4f4a46]/10 bg-white hover:border-[#C69D69]"
                              }

                              focus-within:outline
                              focus-within:outline-3
                              focus-within:outline-offset-3
                              focus-within:outline-[#373330]
                            `}
                          >

                            <input
                              type="radio"
                              name="clarity-ai"
                              value={
                                key
                              }
                              checked={
                                selected
                              }
                              onChange={() => {
                                setSelectedAiTier(
                                  key,
                                );

                                setCheckoutError(
                                  null,
                                );
                              }}
                              className="sr-only"
                            />

                            <div className="flex items-start justify-between gap-4">

                              <div>
                                <p className="text-base font-bold text-[#373330]">
                                  {
                                    tier.name
                                  }
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                                  {tier.price ===
                                  0
                                    ? "No additional charge"
                                    : `+£${tier.price}/month`}
                                </p>
                              </div>

                              <span
                                aria-hidden="true"
                                className={`
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  border

                                  ${
                                    selected
                                      ? "border-[#936d43] bg-[#936d43] text-white"
                                      : "border-[#4f4a46]/20 bg-white text-transparent"
                                  }
                                `}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={3}
                                />
                              </span>

                            </div>

                            {tier.allowance && (
                              <p className="mt-3 text-xs font-bold text-[#936d43]">
                                {
                                  tier.allowance
                                }
                              </p>
                            )}

                            <p className="mt-2 text-xs leading-6 text-[#69645f]">
                              {
                                tier.description
                              }
                            </p>

                          </label>
                        );
                      },
                    )}

                  </div>

                </fieldset>
              )}

            </section>

            {/* ==================================================
                COMPLETE OPTION
            ================================================== */}

            {!pricing.isComplete && (
              <section className="mt-6 overflow-hidden rounded-[2rem] bg-[#373330] text-white shadow-[0_24px_70px_rgba(55,51,48,0.16)]">

                <div className="grid md:grid-cols-[1fr_auto]">

                  <div className="p-7 md:p-8">

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[#D1DFC6]">
                      <WandSparkles
                        size={14}
                        aria-hidden="true"
                      />

                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        Everything in one membership
                      </span>
                    </div>

                    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                      TOTS-OS Complete
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                      Get all six main modules plus Clarity AI Starter
                      for one fixed monthly price.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {MODULE_ORDER.map(
                        (
                          key,
                        ) => (
                          <span
                            key={
                              key
                            }
                            className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/90"
                          >
                            {
                              MODULES[
                                key
                              ]
                                .shortName
                            }
                          </span>
                        ),
                      )}

                      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/90">
                        Clarity AI Starter
                      </span>
                    </div>

                  </div>

                  <div className="flex min-w-[220px] flex-col justify-center border-t border-white/10 bg-white/[0.04] p-7 md:border-l md:border-t-0">

                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/65">
                      Complete
                    </p>

                    <p className="mt-2 text-5xl font-bold tracking-[-0.05em]">
                      £199
                    </p>

                    <p className="mt-1 text-xs text-white/65">
                      per month
                    </p>

                    <button
                      type="button"
                      onClick={
                        selectComplete
                      }
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-black text-[#373330] transition hover:bg-[#EFF3EB] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white"
                    >
                      Choose Complete

                      <Plus
                        size={14}
                        aria-hidden="true"
                      />
                    </button>

                  </div>

                </div>

              </section>
            )}

          </div>

          {/* ==================================================
              RIGHT: STICKY SUMMARY
          ================================================== */}

          <aside
            aria-labelledby="summary-heading"
            className="xl:sticky xl:top-6"
          >

            <div className="overflow-hidden rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] shadow-[0_20px_60px_rgba(79,74,70,0.08)]">

              <div className="border-b border-[#4f4a46]/10 p-6">

                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                  Your membership
                </p>

                <h2
                  id="summary-heading"
                  className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#373330]"
                >
                  {pricing.isComplete
                    ? "TOTS-OS Complete"
                    : "Your TOTS-OS setup"}
                </h2>

                <p className="mt-2 text-xs leading-6 text-[#69645f]">
                  Review everything below before continuing to Stripe.
                </p>

              </div>

              <div className="p-6">

                {selectedModules.length ===
                0 ? (
                  <div className="rounded-2xl bg-[#FAF8F5] p-5 text-center">
                    <ShoppingBag
                      size={20}
                      className="mx-auto text-[#69645f]"
                      aria-hidden="true"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#4f4a46]">
                      No modules selected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#69645f]">
                      Choose at least one module to build your membership.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {pricing.displayedModules.map(
                      (
                        key,
                      ) => {
                        const module =
                          MODULES[
                            key
                          ];

                        return (
                          <div
                            key={
                              key
                            }
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">

                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF3EB] text-[#637454]">
                                <Check
                                  size={13}
                                  strokeWidth={3}
                                  aria-hidden="true"
                                />
                              </span>

                              <span className="truncate text-xs font-semibold text-[#4f4a46]">
                                {
                                  module.shortName
                                }
                              </span>
                            </div>

                            <span className="shrink-0 text-xs font-bold text-[#69645f]">
                              £
                              {
                                module.price
                              }
                            </span>
                          </div>
                        );
                      },
                    )}

                  </div>
                )}

                {pricing.isComplete ? (
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#4f4a46]/10 pt-5">

                    <div className="flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2E7DA] text-[#936d43]">
                        <BrainCircuit
                          size={14}
                          aria-hidden="true"
                        />
                      </span>

                      <div>
                        <p className="text-xs font-semibold text-[#4f4a46]">
                          Clarity AI Starter
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#69645f]">
                          100 actions / month
                        </p>
                      </div>

                    </div>

                    <span className="text-xs font-bold text-[#637454]">
                      Included
                    </span>

                  </div>
                ) : selectedAiTier !==
                  "none" ? (
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#4f4a46]/10 pt-5">

                    <div className="flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2E7DA] text-[#936d43]">
                        <BrainCircuit
                          size={14}
                          aria-hidden="true"
                        />
                      </span>

                      <div>
                        <p className="text-xs font-semibold text-[#4f4a46]">
                          {
                            AI_TIERS[
                              selectedAiTier
                            ]
                              .name
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#69645f]">
                          {
                            AI_TIERS[
                              selectedAiTier
                            ]
                              .allowance
                          }
                        </p>
                      </div>

                    </div>

                    <span className="text-xs font-bold text-[#69645f]">
                      +£
                      {
                        AI_TIERS[
                          selectedAiTier
                        ]
                          .price
                      }
                    </span>

                  </div>
                ) : null}

                {/* ============================================
                    DISCOUNT
                ============================================ */}

                {!pricing.isComplete &&
                  pricing.moduleSaving >
                    0 && (
                    <div className="mt-5 rounded-2xl border border-[#A9B897]/50 bg-[#EFF3EB] px-4 py-4">

                      <div className="flex items-center justify-between gap-4">

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#637454]">
                            {
                              pricing.discountLabel
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#69645f]">
                            Applied automatically
                          </p>
                        </div>

                        <p className="text-sm font-bold text-[#637454]">
                          -£
                          {
                            pricing.moduleSaving
                          }
                        </p>

                      </div>

                    </div>
                  )}

                {/* ============================================
                    COMPLETE AUTO-UPGRADE
                ============================================ */}

                {pricing.isComplete && (
                  <div className="mt-5 rounded-2xl border border-[#A9B897]/50 bg-[#EFF3EB] px-4 py-4">

                    <div className="flex items-start gap-3">

                      <WandSparkles
                        size={16}
                        className="mt-0.5 shrink-0 text-[#637454]"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#637454]">
                          Complete applied
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#69645f]">
                          Your selection reaches our Complete price, so
                          we&apos;ve given you all six modules plus
                          Clarity AI Starter for £199/month.
                        </p>
                      </div>

                    </div>

                  </div>
                )}

                {/* ============================================
                    TOTAL
                ============================================ */}

                <div className="mt-6 border-t border-[#4f4a46]/10 pt-6">

                  <div className="flex items-end justify-between gap-4">

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#69645f]">
                        Monthly total
                      </p>

                      {pricing.isComplete &&
                        pricing.modularTotal >
                          COMPLETE_PRICE && (
                          <p className="mt-1 text-xs text-[#69645f] line-through">
                            £
                            {
                              pricing.modularTotal
                            }
                            /month
                          </p>
                        )}
                    </div>

                    <div className="text-right">

                      <p
                        aria-live="polite"
                        className="text-4xl font-bold tracking-[-0.05em] text-[#373330]"
                      >
                        £
                        {
                          pricing.totalMonthly
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#69645f]">
                        per month
                      </p>

                    </div>

                  </div>

                  {pricing.isComplete && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EFF3EB] px-3 py-2 text-[10px] font-black text-[#637454]">
                      <Check
                        size={11}
                        strokeWidth={3}
                        aria-hidden="true"
                      />

                      £199 membership maximum
                    </div>
                  )}

                </div>

                {/* ============================================
                    ERROR
                ============================================ */}

                {checkoutError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-2xl border border-[#936d43]/25 bg-[#F2E7DA] px-4 py-4"
                  >
                    <p className="text-xs leading-6 text-[#5d5854]">
                      {
                        checkoutError
                      }
                    </p>
                  </div>
                )}

                {/* ============================================
                    CTA
                ============================================ */}

                <button
                  type="button"
                  disabled={
                    checkoutLoading ||
                    !modeReady ||
                    selectedModules.length ===
                      0
                  }
                  onClick={() => {
                    void handleCheckout();
                  }}
                  className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#373330] px-6 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#373330] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                        aria-hidden="true"
                      />

                      Preparing secure checkout
                    </>
                  ) : (
                    <>
                      Buy this membership

                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] font-semibold text-[#69645f]">
                  <ShieldCheck
                    size={12}
                    aria-hidden="true"
                  />

                  Secure checkout through Stripe
                </div>

              </div>

            </div>

            {/* ==================================================
                EXISTING ACCOUNT INFO
            ================================================== */}

            {existingAccount && (
              <div className="mt-4 rounded-[1.5rem] border border-[#4f4a46]/10 bg-white p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF3EB] text-[#637454]">
                    <Check
                      size={15}
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#4f4a46]">
                      Your workspace stays intact
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#69645f]">
                      Your existing clients, projects, files, settings and
                      business data stay exactly where they are.
                    </p>
                  </div>

                </div>

              </div>
            )}

          </aside>

        </div>

        {/* ==================================================
            FOOTER INFO
        ================================================== */}

        <section className="mt-10 grid gap-4 border-t border-[#4f4a46]/10 pt-8 md:grid-cols-3">

          <div>
            <p className="text-xs font-bold text-[#4f4a46]">
              Change as you grow
            </p>

            <p className="mt-2 text-xs leading-6 text-[#69645f]">
              Add or remove modules as the needs of your business
              change.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-[#4f4a46]">
              Clear monthly pricing
            </p>

            <p className="mt-2 text-xs leading-6 text-[#69645f]">
              Bundle savings are automatically applied when your setup
              qualifies.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-[#4f4a46]">
              Complete never exceeds £199
            </p>

            <p className="mt-2 text-xs leading-6 text-[#69645f]">
              If your configuration reaches £199, TOTS-OS Complete
              becomes the better-value membership automatically.
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}