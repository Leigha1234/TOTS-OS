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
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

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
  price: number;
};

type PricingResult = {
  requestedModules: ModuleKey[];
  displayedModules: ModuleKey[];
  packageType: BillingPackage;
  moduleCount: number;
  undiscountedModuleTotal: number;
  moduleBundleTotal: number;
  moduleSaving: number;
  requestedAiTier: AiTierKey;
  displayedAiTier: AiTierKey;
  requestedAiPrice: number;
  modularTotal: number;
  totalMonthly: number;
  isComplete: boolean;
  bundleLabel: string;
  aiUpgradeSuggested: boolean;
};

const COMPLETE_PRICE = 139;
const MODULE_PRICE = 29;

const MODULE_ORDER: ModuleKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

const MODULE_BUNDLE_PRICES: Record<number, number> = {
  0: 0,
  1: 29,
  2: 55,
  3: 79,
  4: 99,
  5: 119,
  6: 139,
};

const MODULES: Record<ModuleKey, ModuleInfo> = {
  core: {
    key: "core",
    name: "TOTS-OS Core",
    shortName: "Core",
    description:
      "Your central workspace for dashboards, contacts, tasks, calendar, notes and everyday business organisation.",
    price: MODULE_PRICE,
    icon: LayoutDashboard,
  },
  clientsProjects: {
    key: "clientsProjects",
    name: "Clients & Projects",
    shortName: "Clients & Projects",
    description:
      "Manage client relationships, projects, tasks, deadlines, notes, files and delivery in one connected workspace.",
    price: MODULE_PRICE,
    icon: FolderKanban,
  },
  finance: {
    key: "finance",
    name: "Finance",
    shortName: "Finance",
    description:
      "Manage invoices, quotes, expenses and day-to-day financial visibility alongside your wider business activity.",
    price: MODULE_PRICE,
    icon: CircleDollarSign,
  },
  social: {
    key: "social",
    name: "Social Studio",
    shortName: "Social Studio",
    description:
      "Plan, organise and publish social content without separating marketing from the rest of your business.",
    price: MODULE_PRICE,
    icon: Megaphone,
  },
  email: {
    key: "email",
    name: "Email Marketing",
    shortName: "Email Marketing",
    description:
      "Manage audiences, subscriber lists, campaigns, scheduling and customer email activity.",
    price: MODULE_PRICE,
    icon: Mail,
  },
  store: {
    key: "store",
    name: "TOTS-OS Store",
    shortName: "Store",
    description:
      "Manage products, customers and orders without running your online store as another disconnected system.",
    price: MODULE_PRICE,
    icon: Store,
  },
};

const AI_TIERS: Record<AiTierKey, AiTierInfo> = {
  none: {
    key: "none",
    name: "No Clarity AI",
    shortName: "No AI",
    price: 0,
    description: "Use your TOTS-OS workspace without adding Clarity AI.",
  },
  starter: {
    key: "starter",
    name: "Clarity AI Starter",
    shortName: "Starter",
    price: 19,
    description:
      "A simple way to add Clarity AI support to your everyday business workflow.",
  },
  plus: {
    key: "plus",
    name: "Clarity AI Plus",
    shortName: "Plus",
    price: 39,
    description:
      "More Clarity AI capability for businesses using AI regularly across their workspace.",
  },
  pro: {
    key: "pro",
    name: "Clarity AI Pro",
    shortName: "Pro",
    price: 69,
    description:
      "The highest Clarity AI level for businesses making AI a bigger part of their operating workflow.",
  },
};

function isModuleKey(value: unknown): value is ModuleKey {
  return (
    typeof value === "string" &&
    MODULE_ORDER.includes(value as ModuleKey)
  );
}

function isAiTierKey(value: unknown): value is AiTierKey {
  return (
    value === "none" ||
    value === "starter" ||
    value === "plus" ||
    value === "pro"
  );
}

function uniqueModules(modules: ModuleKey[]) {
  return MODULE_ORDER.filter((key) => modules.includes(key));
}

function calculatePricing(
  modules: ModuleKey[],
  requestedAiTier: AiTierKey,
): PricingResult {
  const cleanModules = uniqueModules(modules);
  const moduleCount = cleanModules.length;
  const undiscountedModuleTotal = moduleCount * MODULE_PRICE;
  const isComplete = moduleCount === MODULE_ORDER.length;

  if (isComplete) {
    return {
      requestedModules: cleanModules,
      displayedModules: MODULE_ORDER,
      packageType: "complete",
      moduleCount: MODULE_ORDER.length,
      undiscountedModuleTotal,
      moduleBundleTotal: COMPLETE_PRICE,
      moduleSaving: Math.max(
        0,
        undiscountedModuleTotal - COMPLETE_PRICE,
      ),
      requestedAiTier,
      displayedAiTier: "starter",
      requestedAiPrice: AI_TIERS[requestedAiTier].price,
      modularTotal: COMPLETE_PRICE,
      totalMonthly: COMPLETE_PRICE,
      isComplete: true,
      bundleLabel: "TOTS-OS Complete",
      aiUpgradeSuggested:
        requestedAiTier === "plus" ||
        requestedAiTier === "pro",
    };
  }

  const moduleBundleTotal =
    MODULE_BUNDLE_PRICES[moduleCount] ?? 0;
  const moduleSaving = Math.max(
    0,
    undiscountedModuleTotal - moduleBundleTotal,
  );
  const requestedAiPrice =
    AI_TIERS[requestedAiTier].price;
  const modularTotal =
    moduleBundleTotal + requestedAiPrice;

  return {
    requestedModules: cleanModules,
    displayedModules: cleanModules,
    packageType: "modular",
    moduleCount,
    undiscountedModuleTotal,
    moduleBundleTotal,
    moduleSaving,
    requestedAiTier,
    displayedAiTier: requestedAiTier,
    requestedAiPrice,
    modularTotal,
    totalMonthly: modularTotal,
    isComplete: false,
    bundleLabel:
      moduleCount === 1
        ? "1 module"
        : `${moduleCount} module bundle`,
    aiUpgradeSuggested: false,
  };
}

export default function BillingPage() {
  const [selectedModules, setSelectedModules] =
    useState<ModuleKey[]>(["core"]);
  const [selectedAiTier, setSelectedAiTier] =
    useState<AiTierKey>("none");
  const [fromQuiz, setFromQuiz] = useState(false);
  const [existingAccount, setExistingAccount] =
    useState(false);
  const [modeReady, setModeReady] = useState(false);
  const [checkoutLoading, setCheckoutLoading] =
    useState(false);
  const [checkoutError, setCheckoutError] =
    useState<string | null>(null);

  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");
  const [verificationError, setVerificationError] =
    useState<string | null>(null);
  const [
    verifiedOrganisationName,
    setVerifiedOrganisationName,
  ] = useState<string | null>(null);
  const [verifiedPackage, setVerifiedPackage] =
    useState<string | null>(null);
  const [verifiedModules, setVerifiedModules] =
    useState<string[]>([]);
  const [verifiedAiTier, setVerifiedAiTier] =
    useState<string | null>(null);

  const pricing = useMemo(
    () =>
      calculatePricing(
        selectedModules,
        selectedAiTier,
      ),
    [selectedModules, selectedAiTier],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialiseBillingPage() {
      const params = new URLSearchParams(
        window.location.search,
      );

      const existing =
        params.get("existing");
      const success =
        params.get("success");
      const sessionId =
        params.get("session_id");
      const source =
        params.get("source");
      const packageParam =
        params.get("package");
      const modulesParam =
        params.get("modules");
      const aiParam =
        params.get("ai");
      const requiredModuleParam =
        params.get("requiredModule");

      const isExisting =
        existing === "true";

      setExistingAccount(isExisting);

      if (
        success === "true" &&
        sessionId
      ) {
        setVerificationState("verifying");

        try {
          const response = await fetch(
            "/api/pay/stripe/verify",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sessionId,
              }),
            },
          );

          const data = await response
            .json()
            .catch(() => ({}));

          if (cancelled) {
            return;
          }

          if (!response.ok) {
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
            Array.isArray(data.modules)
              ? data.modules.filter(
                  (item: unknown) =>
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

          setVerificationState("success");
          setModeReady(true);
          return;
        } catch (error) {
          console.error(
            "Membership verification failed:",
            error,
          );

          if (cancelled) {
            return;
          }

          setVerificationError(
            error instanceof Error
              ? error.message
              : "Unable to verify your membership.",
          );
          setVerificationState("error");
          setModeReady(true);
          return;
        }
      }

      if (isExisting) {
        try {
          const accessResponse = await fetch(
            "/api/account/access",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            },
          );

          const accessData =
            await accessResponse
              .json()
              .catch(() => ({}));

          if (cancelled) {
            return;
          }

          if (!accessResponse.ok) {
            throw new Error(
              accessData.error ||
                "Unable to load your current membership.",
            );
          }

          const currentModules =
            Array.isArray(
              accessData.modules,
            )
              ? accessData.modules.filter(
                  (
                    value: unknown,
                  ): value is ModuleKey =>
                    isModuleKey(value),
                )
              : [];

          const requiredModule =
            isModuleKey(
              requiredModuleParam,
            )
              ? requiredModuleParam
              : null;

          let nextModules =
            uniqueModules(
              currentModules,
            );

          if (
            requiredModule &&
            !nextModules.includes(
              requiredModule,
            )
          ) {
            nextModules =
              uniqueModules([
                ...nextModules,
                requiredModule,
              ]);
          }

          if (nextModules.length > 0) {
            setSelectedModules(
              nextModules,
            );
          }

          const currentAi =
            accessData.clarityAiTier ??
            accessData.aiTier ??
            accessData.ai ??
            "none";

          if (isAiTierKey(currentAi)) {
            setSelectedAiTier(
              currentAi,
            );
          }

          setModeReady(true);
          return;
        } catch (error) {
          console.error(
            "Unable to load existing membership:",
            error,
          );

          setCheckoutError(
            error instanceof Error
              ? error.message
              : "Unable to load your current membership.",
          );

          setModeReady(true);
          return;
        }
      }

      if (
        source ===
        "find-your-setup"
      ) {
        setFromQuiz(true);
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
        if (modulesParam) {
          const parsedModules =
            modulesParam
              .split(",")
              .map((value) =>
                value.trim(),
              )
              .filter(isModuleKey);

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

        if (isAiTierKey(aiParam)) {
          setSelectedAiTier(aiParam);
        }
      }

      setModeReady(true);
    }

    void initialiseBillingPage();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleModule(
    moduleKey: ModuleKey,
  ) {
    setCheckoutError(null);

    setSelectedModules(
      (current) => {
        if (
          current.includes(moduleKey)
        ) {
          return current.filter(
            (key) =>
              key !== moduleKey,
          );
        }

        return uniqueModules([
          ...current,
          moduleKey,
        ]);
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
    setCheckoutError(null);
  }

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

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const checkoutPayload = {
        billingModel: "modular",
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
        source:
          fromQuiz
            ? "find-your-setup"
            : "billing",
      };

      if (existingAccount) {
        const response = await fetch(
          "/api/pay/stripe/checkout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              checkoutPayload,
            ),
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          if (
            response.status === 401
          ) {
            throw new Error(
              "Please sign in to your existing TOTS-OS account before changing your membership.",
            );
          }

          throw new Error(
            data.error ||
              "Unable to update your membership.",
          );
        }

        if (
          data.updated === true
        ) {
          window.location.href =
            data.redirectUrl ||
            "/dashboard";
          return;
        }

        if (!data.url) {
          throw new Error(
            "Stripe checkout URL was not returned.",
          );
        }

        window.location.href =
          data.url;
        return;
      }

      const storedRegistration =
        sessionStorage.getItem(
          "pendingRegistration",
        );

      if (!storedRegistration) {
        throw new Error(
          "Your registration details could not be found. Please return to signup, create your account and try again.",
        );
      }

      let registration: Record<
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

      const response = await fetch(
        "/api/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...registration,
            ...checkoutPayload,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create your checkout session.",
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned.",
        );
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Checkout failed:",
        error,
      );

      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout.",
      );
      setCheckoutLoading(false);
    }
  }

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
            />
          </div>
          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.16em] text-[#637454]">
            Confirming your membership
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#373330] md:text-5xl">
            Just a moment...
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#69645f]">
            We&apos;re confirming your Stripe subscription and activating the right TOTS-OS modules for your workspace.
          </p>
        </div>
      </main>
    );
  }

  if (
    verificationState ===
    "success"
  ) {
    const successLabel =
      verifiedPackage
        ? verifiedPackage.replaceAll(
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
                <Sparkles size={13} />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  Membership active
                </span>
              </div>

              <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF3EB] text-[#637454]">
                <Check
                  size={23}
                  strokeWidth={3}
                />
              </div>

              <h1 className="mt-7 max-w-2xl text-5xl font-semibold tracking-[-0.055em] text-[#373330] md:text-7xl">
                You&apos;re all set.
              </h1>

              {verifiedOrganisationName && (
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                  {verifiedOrganisationName}
                </p>
              )}

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#69645f]">
                Your TOTS-OS membership has been activated and your workspace is ready to use.
              </p>
            </div>

            <div className="p-8 md:p-14">
              <div className="rounded-[1.5rem] border border-[#A9B897]/50 bg-[#EFF3EB] p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#637454] shadow-sm">
                    <ShieldCheck
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#637454]">
                      Your access is active
                    </p>
                    <p className="mt-3 text-sm font-semibold capitalize text-[#4f4a46]">
                      {successLabel} membership
                    </p>

                    {verifiedModules.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {verifiedModules.map(
                          (module) => (
                            <span
                              key={module}
                              className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#5d5854]"
                            >
                              {MODULES[
                                module as ModuleKey
                              ]?.shortName ||
                                module}
                            </span>
                          ),
                        )}
                      </div>
                    )}

                    {verifiedAiTier &&
                      verifiedAiTier !==
                        "none" && (
                        <p className="mt-4 text-xs text-[#69645f]">
                          Clarity AI:{" "}
                          <span className="font-semibold capitalize text-[#4f4a46]">
                            {verifiedAiTier}
                          </span>
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/dashboard";
                }}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#373330] px-8 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46]"
              >
                Go to TOTS-OS
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    verificationState ===
    "error"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-5">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-10 text-center shadow-[0_26px_80px_rgba(79,74,70,0.08)] md:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0ECE7] text-[#69645f]">
            <ShieldCheck size={22} />
          </div>
          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.16em] text-[#69645f]">
            Subscription created
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#373330] md:text-5xl">
            We couldn&apos;t finish activating your membership.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#69645f]">
            Your Stripe subscription may still have completed. Please do not start another checkout yet.
          </p>

          {verificationError && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-[#4f4a46]/10 bg-[#F0ECE7] px-5 py-4"
            >
              <p className="text-xs leading-6 text-[#5d5854]">
                {verificationError}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#373330] px-7 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46]"
          >
            Try verification again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-8 text-[#4f4a46] md:px-10 md:py-12">
      <div className="mx-auto max-w-[1380px]">
        <header className="mb-10 border-b border-[#4f4a46]/10 pb-8 md:mb-12">
          <a
            href={
              existingAccount
                ? "/dashboard"
                : "/find-your-setup"
            }
            className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#4f4a46]/10 bg-white px-4 text-xs font-bold text-[#5d5854] transition hover:border-[#4f4a46]/20 hover:bg-[#FFFEFD]"
          >
            <ArrowLeft size={14} />
            {existingAccount
              ? "Back to dashboard"
              : "Find your setup"}
          </a>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4f4a46]/10 bg-white px-4 py-2 text-[#637454]">
                <Sparkles size={13} />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  {existingAccount
                    ? "Update your TOTS-OS membership"
                    : fromQuiz
                      ? "Your recommended TOTS-OS membership"
                      : "Build your TOTS-OS membership"}
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#373330] md:text-7xl">
                {existingAccount
                  ? "Change your setup as your business changes."
                  : fromQuiz
                    ? "Review your setup before you start."
                    : "Pay for what your business actually needs."}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#69645f]">
                Choose the TOTS-OS modules you want, add Clarity AI if you need it, and your fixed module bundle price is applied automatically.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#4f4a46]/10 bg-[#FFFEFD] px-6 py-5 shadow-[0_12px_34px_rgba(79,74,70,0.05)]">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#69645f]">
                Selected setup
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#637454]" />
                <p className="text-xl font-semibold tracking-[-0.025em] text-[#373330]">
                  {pricing.isComplete
                    ? "TOTS-OS Complete"
                    : pricing.moduleCount === 0
                      ? "No modules selected"
                      : `${pricing.moduleCount} ${
                          pricing.moduleCount === 1
                            ? "module"
                            : "modules"
                        }`}
                </p>
              </div>
              <p className="mt-2 text-sm text-[#69645f]">
                £{pricing.totalMonthly}/month
              </p>
            </div>
          </div>

          {fromQuiz && !existingAccount && (
            <div className="mt-7 flex max-w-3xl items-start gap-4 rounded-2xl border border-[#A9B897]/60 bg-[#EFF3EB] px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#637454] shadow-sm">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                  Loaded from your quiz
                </p>
                <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                  Your recommended setup is ready to review.
                </p>
              </div>
            </div>
          )}
        </header>

        <section className="mb-7 grid gap-3 md:grid-cols-3">
          <InfoCard
            icon={Sparkles}
            title="Flexible modules"
            text="Choose only what you need"
          />
          <InfoCard
            icon={CreditCard}
            title="Fixed bundle pricing"
            text="Save as you add modules"
          />
          <InfoCard
            icon={ShieldCheck}
            title="Complete for £139"
            text="All six modules + Starter"
          />
        </section>

        <section className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            [1, 29, "1 module"],
            [2, 55, "2 modules"],
            [3, 79, "3 modules"],
            [4, 99, "4 modules"],
            [5, 119, "5 modules"],
            [6, 139, "Complete"],
          ].map(([count, price, label]) => {
            const countNumber =
              Number(count);
            const selected =
              pricing.moduleCount ===
              countNumber;

            return (
              <div
                key={countNumber}
                className={`rounded-2xl border px-4 py-4 text-center transition ${
                  selected
                    ? "border-[#637454] bg-[#EFF3EB]"
                    : "border-[#4f4a46]/10 bg-white"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#69645f]">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#373330]">
                  £{price}
                </p>
                <p className="mt-0.5 text-[10px] text-[#69645f]">
                  /month
                </p>
              </div>
            );
          })}
        </section>

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div>
            <section className="rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-6 shadow-[0_12px_34px_rgba(79,74,70,0.04)] md:p-8">
              <div className="flex flex-col gap-4 border-b border-[#4f4a46]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                    Step 1
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#373330]">
                    Choose your modules
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[#69645f]">
                    Every module is £29 individually. Select more and your fixed module bundle price is applied automatically.
                  </p>
                </div>

                <p className="text-sm font-semibold text-[#637454]">
                  {selectedModules.length}{" "}
                  {selectedModules.length === 1
                    ? "module"
                    : "modules"}{" "}
                  selected
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {MODULE_ORDER.map((key) => {
                  const module =
                    MODULES[key];
                  const Icon =
                    module.icon;
                  const selected =
                    selectedModules.includes(
                      key,
                    );

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        toggleModule(key)
                      }
                      className={`relative rounded-[1.35rem] border p-5 text-left transition ${
                        selected
                          ? "border-[#637454] bg-[#EFF3EB]"
                          : "border-[#4f4a46]/10 bg-white hover:border-[#A9B897]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-white text-[#637454]"
                              : "bg-[#F0ECE7] text-[#69645f]"
                          }`}
                        >
                          <Icon size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-bold text-[#373330]">
                                {module.name}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                                £29/month individually
                              </p>
                            </div>

                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-[#637454] bg-[#637454] text-white"
                                  : "border-[#4f4a46]/20 bg-white text-transparent"
                              }`}
                            >
                              <Check
                                size={13}
                                strokeWidth={3}
                              />
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-6 text-[#69645f]">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] p-6 shadow-[0_12px_34px_rgba(79,74,70,0.04)] md:p-8">
              <div className="border-b border-[#4f4a46]/10 pb-6">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                  Step 2
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#373330]">
                  Choose your Clarity AI level
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#69645f]">
                  Clarity AI is optional with modular setups. Starter is included with TOTS-OS Complete.
                </p>
              </div>

              {pricing.isComplete ? (
                <div className="mt-6 flex items-start gap-4 rounded-[1.35rem] border border-[#637454] bg-[#EFF3EB] p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#936d43]">
                    <BrainCircuit size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#637454]">
                      Included with Complete
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#373330]">
                      Clarity AI Starter
                    </h3>
                    <p className="mt-3 max-w-xl text-xs leading-6 text-[#69645f]">
                      Complete includes Clarity AI Starter as standard. Your Complete membership is £139/month.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {(Object.keys(
                    AI_TIERS,
                  ) as AiTierKey[]).map(
                    (key) => {
                      const tier =
                        AI_TIERS[key];
                      const selected =
                        selectedAiTier ===
                        key;

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => {
                            setSelectedAiTier(
                              key,
                            );
                            setCheckoutError(
                              null,
                            );
                          }}
                          className={`relative rounded-[1.2rem] border p-5 text-left transition ${
                            selected
                              ? "border-[#936d43] bg-[#F2E7DA]"
                              : "border-[#4f4a46]/10 bg-white hover:border-[#C69D69]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-bold text-[#373330]">
                                {tier.name}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#4f4a46]">
                                {tier.price ===
                                0
                                  ? "No additional charge"
                                  : `+£${tier.price}/month`}
                              </p>
                            </div>
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-[#936d43] bg-[#936d43] text-white"
                                  : "border-[#4f4a46]/20 bg-white text-transparent"
                              }`}
                            >
                              <Check
                                size={13}
                                strokeWidth={3}
                              />
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-6 text-[#69645f]">
                            {tier.description}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            {!pricing.isComplete && (
              <section className="mt-6 overflow-hidden rounded-[2rem] bg-[#373330] text-white shadow-[0_24px_70px_rgba(55,51,48,0.16)]">
                <div className="grid md:grid-cols-[1fr_auto]">
                  <div className="p-7 md:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[#D1DFC6]">
                      <WandSparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        Everything in one membership
                      </span>
                    </div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                      TOTS-OS Complete
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                      Get all six main modules plus Clarity AI Starter for one fixed monthly price.
                    </p>
                  </div>

                  <div className="flex min-w-[220px] flex-col justify-center border-t border-white/10 bg-white/[0.04] p-7 md:border-l md:border-t-0">
                    <p className="text-5xl font-bold tracking-[-0.05em]">
                      £139
                    </p>
                    <p className="mt-1 text-xs text-white/65">
                      per month
                    </p>
                    <button
                      type="button"
                      onClick={
                        selectComplete
                      }
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-black text-[#373330] transition hover:bg-[#EFF3EB]"
                    >
                      Choose Complete
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-[2rem] border border-[#4f4a46]/10 bg-[#FFFEFD] shadow-[0_20px_60px_rgba(79,74,70,0.08)]">
              <div className="border-b border-[#4f4a46]/10 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#936d43]">
                  Your membership
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#373330]">
                  {pricing.isComplete
                    ? "TOTS-OS Complete"
                    : "Your TOTS-OS setup"}
                </h2>
              </div>

              <div className="p-6">
                {selectedModules.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF8F5] p-5 text-center">
                    <ShoppingBag
                      size={20}
                      className="mx-auto text-[#69645f]"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#4f4a46]">
                      No modules selected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pricing.displayedModules.map(
                      (key) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF3EB] text-[#637454]">
                              <Check
                                size={13}
                                strokeWidth={3}
                              />
                            </span>
                            <span className="truncate text-xs font-semibold text-[#4f4a46]">
                              {MODULES[key]
                                .shortName}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-[#69645f]">
                            £29
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {selectedModules.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-[#A9B897]/50 bg-[#EFF3EB] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#637454]">
                          {pricing.isComplete
                            ? "Complete"
                            : pricing.bundleLabel}
                        </p>
                        <p className="mt-1 text-xs text-[#69645f]">
                          {pricing.isComplete
                            ? "All six modules"
                            : "Fixed module bundle price"}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#637454]">
                        £
                        {pricing.moduleBundleTotal}
                      </p>
                    </div>
                  </div>
                )}

                {!pricing.isComplete &&
                  selectedAiTier !==
                    "none" && (
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#4f4a46]/10 pt-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2E7DA] text-[#936d43]">
                          <BrainCircuit size={14} />
                        </span>
                        <p className="text-xs font-semibold text-[#4f4a46]">
                          {
                            AI_TIERS[
                              selectedAiTier
                            ].name
                          }
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#69645f]">
                        +£
                        {
                          AI_TIERS[
                            selectedAiTier
                          ].price
                        }
                      </span>
                    </div>
                  )}

                <div className="mt-6 border-t border-[#4f4a46]/10 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#69645f]">
                      Monthly total
                    </p>
                    <div className="text-right">
                      <p className="text-4xl font-bold tracking-[-0.05em] text-[#373330]">
                        £{pricing.totalMonthly}
                      </p>
                      <p className="mt-1 text-xs text-[#69645f]">
                        per month
                      </p>
                    </div>
                  </div>
                </div>

                {existingAccount ? (
                  <div className="mt-5 rounded-2xl bg-[#FAF8F5] px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#637454]">
                      Update membership
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#69645f]">
                      Your existing workspace, data and subscription stay connected. Your membership will be updated to this setup.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-[#FAF8F5] px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#637454]">
                      14-day free trial
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#69645f]">
                      Start with two weeks free. No bank details are required to begin your trial.
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-2xl border border-[#936d43]/25 bg-[#F2E7DA] px-4 py-4"
                  >
                    <p className="text-xs leading-6 text-[#5d5854]">
                      {checkoutError}
                    </p>
                  </div>
                )}

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
                  className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#373330] px-6 py-4 text-xs font-black text-white transition hover:bg-[#4f4a46] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      {existingAccount
                        ? "Updating membership"
                        : "Preparing secure checkout"}
                    </>
                  ) : (
                    <>
                      {existingAccount
                        ? "Update my membership"
                        : "Start my free trial"}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] font-semibold text-[#69645f]">
                  <ShieldCheck size={12} />
                  {existingAccount
                    ? "Secure subscription update through Stripe"
                    : "Secure checkout through Stripe"}
                </div>
              </div>
            </div>

            {existingAccount && (
              <div className="mt-4 rounded-[1.5rem] border border-[#4f4a46]/10 bg-white p-5">
                <p className="text-xs font-bold text-[#4f4a46]">
                  Your workspace stays intact
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#69645f]">
                  Your existing clients, projects, files, settings and business data stay exactly where they are.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#4f4a46]/10 bg-white px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF3EB] text-[#637454]">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#4f4a46]">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-[#69645f]">
          {text}
        </p>
      </div>
    </div>
  );
}
