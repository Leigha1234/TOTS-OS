"use client";

import React, {
  useEffect,
  useMemo,
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
  BarChart3,
  Bot,
  Check,
  ContactRound,
  FolderKanban,
  Loader2,
  Mail,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import {
  toast,
} from "sonner";

// ============================================================
// TYPES
// ============================================================

type LegacySubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

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

type ModuleDefinition = {
  key:
    ModuleKey;

  name:
    string;

  description:
    string;

  price:
    number;

  icon:
    LucideIcon;

  features:
    string[];
};

type AiDefinition = {
  key:
    AiTierKey;

  name:
    string;

  price:
    number;

  description:
    string;
};

// ============================================================
// CONSTANTS
// ============================================================

const MODULE_ORDER:
  ModuleKey[] = [
    "core",
    "clientsProjects",
    "finance",
    "social",
    "email",
    "store",
  ];

const MODULE_BUNDLE_PRICES: Record<
  number,
  number
> = {
  0:
    0,

  1:
    29,

  2:
    55,

  3:
    79,

  4:
    99,

  5:
    119,

  6:
    139,
};

const TEAM_MEMBER_PRICE =
  19.95;

// ============================================================
// MODULES
// ============================================================

const MODULES:
  ModuleDefinition[] = [
    {
      key:
        "core",

      name:
        "Core",

      description:
        "Your everyday business workspace.",

      price:
        29,

      icon:
        ContactRound,

      features: [
        "Dashboard",
        "Tasks & planning",
        "Notes & business workspace",
        "Calendar",
        "Core business tools",
      ],
    },

    {
      key:
        "clientsProjects",

      name:
        "Clients & Projects",

      description:
        "Run client work from first contact to delivery.",

      price:
        29,

      icon:
        FolderKanban,

      features: [
        "Client management",
        "Projects",
        "Tasks & sub-projects",
        "Project timelines",
        "Client workspace",
      ],
    },

    {
      key:
        "finance",

      name:
        "Finance",

      description:
        "Keep the money side of your business organised.",

      price:
        29,

      icon:
        BarChart3,

      features: [
        "Sales",
        "Expenses",
        "Invoices",
        "Tax & VAT tools",
        "Financial overview",
      ],
    },

    {
      key:
        "social",

      name:
        "Social Studio",

      description:
        "Plan and manage your social content in one place.",

      price:
        29,

      icon:
        Share2,

      features: [
        "Social planning",
        "Post scheduling",
        "Content workspace",
        "Connected accounts",
        "Publishing tools",
      ],
    },

    {
      key:
        "email",

      name:
        "Email Marketing",

      description:
        "Create campaigns and stay connected with your audience.",

      price:
        29,

      icon:
        Mail,

      features: [
        "Email campaigns",
        "Subscriber lists",
        "Campaign management",
        "Audience tools",
        "Marketing workspace",
      ],
    },

    {
      key:
        "store",

      name:
        "Store",

      description:
        "Manage products, orders and customers.",

      price:
        29,

      icon:
        ShoppingBag,

      features: [
        "Products",
        "Orders",
        "Customers",
        "Payments",
        "Store management",
      ],
    },
  ];

// ============================================================
// CLARITY AI
// ============================================================

const AI_OPTIONS:
  AiDefinition[] = [
    {
      key:
        "none",

      name:
        "No Clarity AI",

      price:
        0,

      description:
        "Use your selected TOTS-OS modules without an AI add-on.",
    },

    {
      key:
        "starter",

      name:
        "Clarity AI Starter",

      price:
        19,

      description:
        "Add Clarity AI to support your everyday business workflow.",
    },

    {
      key:
        "plus",

      name:
        "Clarity AI Plus",

      price:
        39,

      description:
        "More Clarity AI capability for businesses using it regularly.",
    },

    {
      key:
        "pro",

      name:
        "Clarity AI Pro",

      price:
        69,

      description:
        "The highest Clarity AI level for heavier business use.",
    },
  ];

// ============================================================
// HELPERS
// ============================================================

function formatPounds(
  value:
    number,
) {
  return (
    Math.round(
      value *
        100,
    ) /
    100
  ).toFixed(
    Number.isInteger(
      value,
    )
      ? 0
      : 2,
  );
}

function normaliseLegacyTier(
  value:
    unknown,
):
  | LegacySubscriptionTier
  | null {
  const raw =
    String(
      value ||
        "",
    )
      .trim()
      .toLowerCase();

  if (
    raw ===
    "standard"
  ) {
    return "standard";
  }

  if (
    raw ===
      "professional" ||
    raw ===
      "premium"
  ) {
    return "professional";
  }

  if (
    raw ===
    "elite"
  ) {
    return "elite";
  }

  return null;
}

function normaliseAiTier(
  value:
    unknown,
): AiTierKey {
  const raw =
    String(
      value ||
        "",
    )
      .trim()
      .toLowerCase();

  if (
    raw ===
      "starter" ||
    raw ===
      "plus" ||
    raw ===
      "pro"
  ) {
    return raw;
  }

  return "none";
}

function arraysMatch(
  first:
    ModuleKey[],

  second:
    ModuleKey[],
) {
  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  const sortedFirst =
    [...first].sort();

  const sortedSecond =
    [...second].sort();

  return sortedFirst.every(
    (
      value,
      index,
    ) =>
      value ===
      sortedSecond[
        index
      ],
  );
}

// ============================================================
// PAGE
// ============================================================

export default function ManageSubscription() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createBrowserClient(
          process.env
            .NEXT_PUBLIC_SUPABASE_URL!,
          process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ),
      [],
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    billingModel,
    setBillingModel,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    currentPackage,
    setCurrentPackage,
  ] =
    useState<
      BillingPackage | null
    >(
      null,
    );

  const [
    currentLegacyTier,
    setCurrentLegacyTier,
  ] =
    useState<
      LegacySubscriptionTier | null
    >(
      null,
    );

  const [
    currentModules,
    setCurrentModules,
  ] =
    useState<
      ModuleKey[]
    >(
      [],
    );

  const [
    selectedModules,
    setSelectedModules,
  ] =
    useState<
      ModuleKey[]
    >(
      [],
    );

  const [
    currentAiTier,
    setCurrentAiTier,
  ] =
    useState<
      AiTierKey
    >(
      "none",
    );

  const [
    selectedAiTier,
    setSelectedAiTier,
  ] =
    useState<
      AiTierKey
    >(
      "none",
    );

  const [
    teamMembersCount,
    setTeamMembersCount,
  ] =
    useState(
      0,
    );

  const [
    initialTeamMembersCount,
    setInitialTeamMembersCount,
  ] =
    useState(
      0,
    );

  const [
    isProcessing,
    setIsProcessing,
  ] =
    useState(
      false,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  // ==========================================================
  // LOAD CURRENT ACCOUNT
  // ==========================================================

  useEffect(
    () => {
      async function loadSubscription() {
        try {
          const {
            data: {
              user,
            },

            error:
              userError,
          } =
            await supabase
              .auth
              .getUser();

          if (
            userError ||
            !user
          ) {
            router.push(
              "/login",
            );

            return;
          }

          // ==================================================
          // PROFILE
          // ==================================================

          const {
            data:
              profile,

            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles",
              )
              .select(
                `
                  organisation_id,
                  subscription_tier,
                  team_seats_allocated
                `,
              )
              .eq(
                "id",
                user.id,
              )
              .maybeSingle();

          if (
            profileError
          ) {
            throw profileError;
          }

          if (
            !profile
              ?.organisation_id
          ) {
            throw new Error(
              "Your organisation could not be found.",
            );
          }

          const loadedOrganisationId =
            String(
              profile
                .organisation_id,
            );

          setOrganisationId(
            loadedOrganisationId,
          );

          const seats =
            Number(
              profile
                .team_seats_allocated ||
                0,
            );

          setTeamMembersCount(
            seats,
          );

          setInitialTeamMembersCount(
            seats,
          );

          const legacyTier =
            normaliseLegacyTier(
              profile
                .subscription_tier,
            );

          setCurrentLegacyTier(
            legacyTier,
          );

          // ==================================================
          // ORGANISATION
          // ==================================================

          const {
            data:
              organisation,

            error:
              organisationError,
          } =
            await supabase
              .from(
                "organisations",
              )
              .select(
                `
                  billing_model,
                  billing_package,
                  clarity_ai_tier,
                  subscription_tier
                `,
              )
              .eq(
                "id",
                loadedOrganisationId,
              )
              .maybeSingle();

          if (
            organisationError
          ) {
            throw organisationError;
          }

          const loadedBillingModel =
            String(
              organisation
                ?.billing_model ||
                "",
            )
              .trim()
              .toLowerCase();

          setBillingModel(
            loadedBillingModel ||
              null,
          );

          const packageValue =
            String(
              organisation
                ?.billing_package ||
                "",
            )
              .trim()
              .toLowerCase();

          if (
            packageValue ===
            "complete"
          ) {
            setCurrentPackage(
              "complete",
            );
          } else if (
            packageValue ===
              "modular" ||
            loadedBillingModel ===
              "modular"
          ) {
            setCurrentPackage(
              "modular",
            );
          }

          const organisationLegacyTier =
            normaliseLegacyTier(
              organisation
                ?.subscription_tier,
            );

          if (
            organisationLegacyTier
          ) {
            setCurrentLegacyTier(
              organisationLegacyTier,
            );
          }

          const aiTier =
            normaliseAiTier(
              organisation
                ?.clarity_ai_tier,
            );

          setCurrentAiTier(
            aiTier,
          );

          setSelectedAiTier(
            aiTier,
          );

          // ==================================================
          // MODULE ENTITLEMENTS
          // ==================================================

          const {
            data:
              moduleRows,

            error:
              modulesError,
          } =
            await supabase
              .from(
                "organisation_modules",
              )
              .select(
                `
                  module_key,
                  status
                `,
              )
              .eq(
                "organisation_id",
                loadedOrganisationId,
              )
              .eq(
                "status",
                "active",
              );

          if (
            modulesError
          ) {
            throw modulesError;
          }

          const loadedModules =
            (
              moduleRows ||
              []
            )
              .map(
                (row) =>
                  String(
                    row
                      .module_key ||
                      "",
                  ) as
                    ModuleKey,
              )
              .filter(
                (
                  key,
                ): key is ModuleKey =>
                  MODULE_ORDER.includes(
                    key,
                  ),
              );

          const uniqueModules =
            Array.from(
              new Set(
                loadedModules,
              ),
            );

          setCurrentModules(
            uniqueModules,
          );

          setSelectedModules(
            uniqueModules,
          );
        } catch (
          error
        ) {
          console.error(
            "Subscription load error:",
            error,
          );

          toast.error(
            error instanceof
              Error
              ? error.message
              : "Unable to load your subscription.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      }

      void loadSubscription();
    },
    [
      router,
      supabase,
    ],
  );

  // ==========================================================
  // MODULE SELECTION
  // ==========================================================

  function toggleModule(
    moduleKey:
      ModuleKey,
  ) {
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

        return [
          ...current,
          moduleKey,
        ];
      },
    );
  }

  // ==========================================================
  // PRICING
  // ==========================================================

  const moduleCount =
    selectedModules.length;

  const isComplete =
    moduleCount ===
    MODULE_ORDER.length;

  const packageType:
    BillingPackage =
    isComplete
      ? "complete"
      : "modular";

  const modulePrice =
    MODULE_BUNDLE_PRICES[
      moduleCount
    ] ??
    0;

  // Complete includes Starter.
  const effectiveAiTier:
    AiTierKey =
    isComplete
      ? "starter"
      : selectedAiTier;

  const selectedAi =
    AI_OPTIONS.find(
      (option) =>
        option.key ===
        selectedAiTier,
    ) ??
    AI_OPTIONS[0];

  const aiPrice =
    isComplete
      ? 0
      : selectedAi.price;

  const seatsPrice =
    teamMembersCount *
    TEAM_MEMBER_PRICE;

  const monthlyTotal =
    modulePrice +
    aiPrice +
    seatsPrice;

  const setupChanged =
    billingModel !==
      "modular" ||
    !arraysMatch(
      currentModules,
      selectedModules,
    ) ||
    currentAiTier !==
      effectiveAiTier ||
    currentPackage !==
      packageType ||
    initialTeamMembersCount !==
      teamMembersCount;

  const canCheckout =
    moduleCount >
      0 &&
    setupChanged &&
    !isProcessing;

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  async function handleCheckout() {
    if (
      isProcessing
    ) {
      return;
    }

    if (
      selectedModules.length ===
      0
    ) {
      toast.error(
        "Choose at least one TOTS-OS module.",
      );

      return;
    }

    if (
      !organisationId
    ) {
      toast.error(
        "Your organisation could not be found.",
      );

      return;
    }

    setIsProcessing(
      true,
    );

    try {
      const checkoutPayload = {
        billingModel:
          "modular",

        package:
          packageType,

        modules:
          isComplete
            ? MODULE_ORDER
            : selectedModules,

        aiTier:
          isComplete
            ? "starter"
            : selectedAiTier,

        additionalSeats:
          teamMembersCount,

        source:
          "billing",
      };

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
        throw new Error(
          data.error ||
            "Unable to create Stripe checkout session.",
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

      toast.error(
        error instanceof
          Error
          ? error.message
          : "Checkout failed.",
      );

      setIsProcessing(
        false,
      );
    }
  }

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
                "/settings",
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
              void handleCheckout()
            }
            disabled={
              !canCheckout
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
                !canCheckout
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
              : !setupChanged
                ? "Current Setup"
                : isComplete
                  ? "Choose Complete"
                  : "Update Subscription"}
          </button>

        </header>

        {/* ==================================================
            TITLE
        ================================================== */}

        <section className="mb-10">

          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#82936b]">
            Build Your TOTS-OS
          </p>

          <h1 className="max-w-4xl font-serif text-4xl italic tracking-tight text-stone-900 md:text-6xl">
            Pay for the parts of your
            business you actually need.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-500">
            Choose your modules and
            TOTS-OS automatically applies
            the best module bundle price.
            Add Clarity AI if you want it,
            or choose all six modules for
            TOTS-OS Complete.
          </p>

        </section>

        {/* ==================================================
            LEGACY NOTICE
        ================================================== */}

        {currentLegacyTier &&
          billingModel !==
            "modular" && (
            <section className="mb-10 rounded-[2rem] border border-[#dfe5d7] bg-[#F8F9F5] p-6 md:p-8">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#82936b]">
                    Grandfathered Plan
                  </p>

                  <p className="mt-2 font-serif text-2xl italic capitalize text-stone-900">
                    {currentLegacyTier}
                  </p>

                  <p className="mt-2 max-w-2xl text-xs leading-6 text-stone-500">
                    Your existing legacy
                    plan remains in place
                    until you choose to
                    move onto the new
                    modular TOTS-OS
                    pricing.
                  </p>

                </div>

                <span className="w-fit rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-wider text-stone-600 shadow-sm">
                  Current legacy plan
                </span>

              </div>

            </section>
          )}

        {/* ==================================================
            BUNDLE PRICING STRIP
        ================================================== */}

        <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">

          {[
            {
              count:
                1,
              price:
                29,
            },
            {
              count:
                2,
              price:
                55,
            },
            {
              count:
                3,
              price:
                79,
            },
            {
              count:
                4,
              price:
                99,
            },
            {
              count:
                5,
              price:
                119,
            },
            {
              count:
                6,
              price:
                139,
            },
          ].map(
            (
              bundle,
            ) => {
              const active =
                moduleCount ===
                bundle.count;

              return (
                <div
                  key={
                    bundle.count
                  }
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-4
                    text-center
                    transition

                    ${
                      active
                        ? `
                          border-[#A3B18A]
                          bg-[#F8F9F5]
                          ring-1
                          ring-[#A3B18A]
                        `
                        : `
                          border-stone-200
                          bg-white
                        `
                    }
                  `}
                >
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                    {bundle.count ===
                    6
                      ? "Complete"
                      : `${bundle.count} ${
                          bundle.count ===
                          1
                            ? "Module"
                            : "Modules"
                        }`}
                  </p>

                  <p className="mt-1 font-serif text-2xl italic text-stone-900">
                    £
                    {
                      bundle.price
                    }
                  </p>

                  <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400">
                    / month
                  </p>
                </div>
              );
            },
          )}

        </section>

        {/* ==================================================
            MODULE CARDS
        ================================================== */}

        <section>

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Step 1
              </p>

              <h2 className="mt-2 font-serif text-3xl italic text-stone-900">
                Choose your modules
              </h2>

            </div>

            <p className="text-sm font-semibold text-stone-600">
              {
                moduleCount
              }{" "}
              {moduleCount ===
              1
                ? "module"
                : "modules"}{" "}
              selected
            </p>

          </div>

          <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {MODULES.map(
              (
                module,
              ) => {
                const selected =
                  selectedModules.includes(
                    module.key,
                  );

                const currentlyOwned =
                  currentModules.includes(
                    module.key,
                  );

                const Icon =
                  module.icon;

                return (
                  <button
                    key={
                      module.key
                    }
                    type="button"
                    onClick={() =>
                      toggleModule(
                        module.key,
                      )
                    }
                    className={`
                      relative
                      overflow-hidden
                      rounded-[2rem]
                      border
                      p-7
                      text-left
                      transition-all
                      duration-200

                      ${
                        selected
                          ? `
                            border-[#A3B18A]
                            bg-white
                            shadow-[0_18px_50px_rgba(28,25,23,0.07)]
                            ring-1
                            ring-[#A3B18A]
                          `
                          : `
                            border-stone-200
                            bg-white
                            hover:-translate-y-1
                            hover:border-stone-300
                            hover:shadow-md
                          `
                      }
                    `}
                  >

                    <div className="mb-6 flex items-start justify-between gap-4">

                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#82936b]">
                        <Icon
                          size={20}
                        />
                      </span>

                      <div className="flex items-center gap-2">

                        {currentlyOwned && (
                          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-stone-500">
                            Current
                          </span>
                        )}

                        <span
                          className={`
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            border

                            ${
                              selected
                                ? `
                                  border-[#A3B18A]
                                  bg-[#A3B18A]
                                  text-white
                                `
                                : `
                                  border-stone-200
                                  bg-white
                                  text-transparent
                                `
                            }
                          `}
                        >
                          <Check
                            size={13}
                            strokeWidth={3}
                          />
                        </span>

                      </div>

                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                      £
                      {
                        module.price
                      }{" "}
                      individually
                    </p>

                    <h3 className="mt-2 font-serif text-3xl italic text-stone-900">
                      {
                        module.name
                      }
                    </h3>

                    <p className="mt-3 min-h-[44px] text-xs leading-6 text-stone-500">
                      {
                        module.description
                      }
                    </p>

                    <ul className="mt-6 space-y-3">

                      {module.features.map(
                        (
                          feature,
                        ) => (
                          <li
                            key={
                              feature
                            }
                            className="flex items-start gap-3 text-xs leading-5 text-stone-600"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf1e8]">
                              <Check
                                size={10}
                                strokeWidth={3}
                                className="text-[#82936b]"
                              />
                            </span>

                            {
                              feature
                            }
                          </li>
                        ),
                      )}

                    </ul>

                  </button>
                );
              },
            )}

          </main>

        </section>

        {/* ==================================================
            COMPLETE MESSAGE
        ================================================== */}

        {isComplete && (
          <section className="mt-10 overflow-hidden rounded-[2rem] bg-stone-900 p-7 text-white md:p-9">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex gap-4">

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles
                    size={20}
                  />
                </span>

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A3B18A]">
                    TOTS-OS Complete
                  </p>

                  <h3 className="mt-2 font-serif text-3xl italic">
                    Everything. £139/month.
                  </h3>

                  <p className="mt-2 max-w-2xl text-xs leading-6 text-stone-400">
                    All six TOTS-OS
                    modules plus Clarity
                    AI Starter are included
                    in Complete.
                  </p>

                </div>

              </div>

              <div className="text-left md:text-right">

                <p className="font-serif text-4xl italic">
                  £139
                </p>

                <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400">
                  per month
                </p>

              </div>

            </div>

          </section>
        )}

        {/* ==================================================
            CLARITY AI
        ================================================== */}

        <section className="mt-14">

          <div className="mb-6">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
              Step 2
            </p>

            <h2 className="mt-2 font-serif text-3xl italic text-stone-900">
              Add Clarity AI
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-stone-500">
              {isComplete
                ? "Clarity AI Starter is already included with TOTS-OS Complete."
                : "Clarity AI is optional and is added on top of your selected module bundle."}
            </p>

          </div>

          {isComplete ? (
            <div className="rounded-[2rem] border border-[#A3B18A] bg-[#F8F9F5] p-7">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-4">

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#82936b]">
                    <Bot
                      size={21}
                    />
                  </span>

                  <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#82936b]">
                      Included
                    </p>

                    <p className="mt-1 font-serif text-2xl italic text-stone-900">
                      Clarity AI Starter
                    </p>

                  </div>

                </div>

                <p className="text-sm font-bold text-stone-700">
                  £0 extra
                </p>

              </div>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              {AI_OPTIONS.map(
                (
                  option,
                ) => {
                  const selected =
                    selectedAiTier ===
                    option.key;

                  const current =
                    currentAiTier ===
                      option.key &&
                    billingModel ===
                      "modular";

                  return (
                    <button
                      key={
                        option.key
                      }
                      type="button"
                      onClick={() =>
                        setSelectedAiTier(
                          option.key,
                        )
                      }
                      className={`
                        relative
                        rounded-[1.75rem]
                        border
                        p-6
                        text-left
                        transition

                        ${
                          selected
                            ? `
                              border-[#A3B18A]
                              bg-white
                              ring-1
                              ring-[#A3B18A]
                            `
                            : `
                              border-stone-200
                              bg-white
                              hover:border-stone-300
                            `
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <Bot
                          size={18}
                          className="text-[#82936b]"
                        />

                        <div className="flex gap-2">

                          {current && (
                            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-wide text-stone-500">
                              Current
                            </span>
                          )}

                          {selected && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A3B18A] text-white">
                              <Check
                                size={11}
                                strokeWidth={3}
                              />
                            </span>
                          )}

                        </div>

                      </div>

                      <h3 className="mt-5 font-serif text-xl italic text-stone-900">
                        {
                          option.name
                        }
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-stone-500">
                        {
                          option.description
                        }
                      </p>

                      <p className="mt-5 font-serif text-2xl italic text-stone-900">
                        {option.price ===
                        0
                          ? "£0"
                          : `£${option.price}`}
                        <span className="ml-1 font-sans text-[9px] not-italic uppercase tracking-wide text-stone-400">
                          /mo
                        </span>
                      </p>

                    </button>
                  );
                },
              )}

            </div>
          )}

        </section>

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
                {formatPounds(
                  TEAM_MEMBER_PRICE,
                )}{" "}
                per additional seat,
                per month.
              </p>

            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex items-center gap-5 rounded-2xl border border-stone-200 p-4">

                <button
                  type="button"
                  onClick={() =>
                    setTeamMembersCount(
                      Math.max(
                        0,
                        teamMembersCount -
                          1,
                      ),
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
                        1,
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200"
                >
                  <Plus
                    size={14}
                  />
                </button>

              </div>

              <div className="text-left sm:text-right">

                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400">
                  Seats total
                </p>

                <p className="mt-1 font-serif text-2xl italic text-stone-800">
                  £
                  {formatPounds(
                    seatsPrice,
                  )}
                  /mo
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-stone-900 p-7 text-white md:p-9">

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A3B18A]">
                Your TOTS-OS Setup
              </p>

              {moduleCount ===
              0 ? (
                <p className="mt-3 font-serif text-2xl italic text-white">
                  Choose at least one
                  module to continue.
                </p>
              ) : (
                <>
                  <p className="mt-3 font-serif text-3xl italic">
                    {isComplete
                      ? "TOTS-OS Complete"
                      : `${moduleCount} ${
                          moduleCount ===
                          1
                            ? "Module"
                            : "Module Bundle"
                        }`}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">

                    {selectedModules.map(
                      (
                        moduleKey,
                      ) => {
                        const module =
                          MODULES.find(
                            (
                              item,
                            ) =>
                              item.key ===
                              moduleKey,
                          );

                        return (
                          <span
                            key={
                              moduleKey
                            }
                            className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold text-stone-200"
                          >
                            {module
                              ?.name ||
                              moduleKey}
                          </span>
                        );
                      },
                    )}

                    {effectiveAiTier !==
                      "none" && (
                      <span className="rounded-full bg-[#A3B18A] px-3 py-1.5 text-[9px] font-black text-white">
                        Clarity AI{" "}
                        {effectiveAiTier ===
                        "starter"
                          ? "Starter"
                          : effectiveAiTier ===
                              "plus"
                            ? "Plus"
                            : "Pro"}
                      </span>
                    )}

                  </div>

                  <div className="mt-6 space-y-2 text-xs text-stone-400">

                    <p>
                      Modules: £
                      {formatPounds(
                        modulePrice,
                      )}
                      /month
                    </p>

                    {!isComplete &&
                      selectedAiTier !==
                        "none" && (
                        <p>
                          Clarity AI: +£
                          {formatPounds(
                            aiPrice,
                          )}
                          /month
                        </p>
                      )}

                    {isComplete && (
                      <p>
                        Clarity AI Starter:
                        included
                      </p>
                    )}

                    {teamMembersCount >
                      0 && (
                        <p>
                          Additional seats:
                          +£
                          {formatPounds(
                            seatsPrice,
                          )}
                          /month
                        </p>
                      )}

                  </div>
                </>
              )}

            </div>

            <div className="lg:min-w-[300px] lg:text-right">

              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400">
                Monthly total
              </p>

              <p className="mt-2 font-serif text-5xl italic">
                £
                {formatPounds(
                  monthlyTotal,
                )}
              </p>

              <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-stone-500">
                per month
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleCheckout()
                }
                disabled={
                  !canCheckout
                }
                className={`
                  mt-6
                  w-full
                  rounded-full
                  px-8
                  py-4
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  transition

                  ${
                    !canCheckout
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
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />

                    Preparing Checkout
                  </span>
                ) : !setupChanged ? (
                  "Current Setup"
                ) : currentLegacyTier &&
                  billingModel !==
                    "modular" ? (
                  "Move to Modular Pricing"
                ) : (
                  "Update Subscription"
                )}
              </button>

            </div>

          </div>

        </section>

        {/* ==================================================
            NOTE
        ================================================== */}

        <p className="mx-auto mt-6 max-w-3xl text-center text-[10px] leading-5 text-stone-400">
          Your price is calculated
          securely on the server. Module
          bundle discounts are applied
          automatically.
        </p>

      </div>
    </div>
  );
}