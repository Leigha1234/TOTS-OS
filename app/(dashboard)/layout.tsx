"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";
import Image from "next/image";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Building2,
  Calendar,
  CircleDollarSign,
  Globe,
  LayoutDashboard,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  StickyNote,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import Sidebar from "@/app/components/Sidebar";
import Footer from "@/app/components/Footer";
import Clarity from "@/app/components/Clarity";
import NotificationBell from "@/app/components/NotificationBell";

import {
  useSettings,
} from "@/app/context/SettingsContext";

import {
  ClarityTourProvider,
} from "./claritytour/ClarityTourProvider";

import ClarityTourOverlay from "./claritytour/ClarityTourOverlay";

// ============================================================
// PRIVATE TOTS ADMIN
// ============================================================

const TOTS_ADMIN_USER_ID =
  "f0524a73-0559-467f-9465-095e43c3952e";

// ============================================================
// TYPES
// ============================================================

type DashboardLayoutProps = {
  children: ReactNode;
};

type ModuleKey =
  | "core"
  | "clientsProjects"
  | "finance"
  | "social"
  | "email"
  | "store";

type BillingMode =
  | "loading"
  | "legacy"
  | "modular"
  | "unknown";

type DashboardLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredModule?: ModuleKey;
  adminOnly?: boolean;
};

type MobileNavSection = {
  title?: string;
  links: DashboardLink[];
};

type AccountAccessResponse = {
  allowed?: boolean;
  reason?: string;
  userId?: string | null;
  organisationId?: string | null;
  organisationName?: string | null;
  billingModel?: string | null;
  billingPackage?: string | null;
  billingVersion?: string | null;
  modules?: string[];
  activeModules?: string[];
  clarityAiTier?: string | null;
  subscriptionStatus?: string | null;
  accessStatus?: string | null;
};

// ============================================================
// FALLBACK MOBILE NAV
// ============================================================

const FALLBACK_MOBILE_NAV = [
  "/dashboard",
  "/projects",
  "/calendar",
];

// ============================================================
// MODULE KEYS
// ============================================================

const MODULE_KEYS: ModuleKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

// ============================================================
// ROUTE → MODULE MAPPING
// ============================================================

const MODULE_ROUTE_RULES: {
  prefix: string;
  module: ModuleKey;
}[] = [
  {
    prefix: "/crm",
    module: "core",
  },
  {
    prefix: "/notes",
    module: "core",
  },
  {
    prefix: "/calendar",
    module: "core",
  },
  {
    prefix: "/campaigns",
    module: "email",
  },
  {
    prefix: "/social",
    module: "social",
  },
  {
    prefix: "/payments",
    module: "finance",
  },
  {
    prefix: "/projects",
    module: "clientsProjects",
  },
  {
    prefix: "/store",
    module: "store",
  },
];

// ============================================================
// HELPERS
// ============================================================

function isModuleKey(
  value: unknown,
): value is ModuleKey {
  return (
    typeof value === "string" &&
    MODULE_KEYS.includes(
      value as ModuleKey,
    )
  );
}

function getRequiredModuleForPath(
  pathname: string,
): ModuleKey | null {
  const rule =
    MODULE_ROUTE_RULES.find(
      (item) =>
        pathname === item.prefix ||
        pathname.startsWith(
          `${item.prefix}/`,
        ),
    );

  return rule?.module || null;
}

function routeIsActive(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

// ============================================================
// DASHBOARD LAYOUT
// ============================================================

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <ClarityTourProvider>
      <DashboardLayoutInner>
        {children}
      </DashboardLayoutInner>
    </ClarityTourProvider>
  );
}

// ============================================================
// DASHBOARD LAYOUT INNER
// ============================================================

function DashboardLayoutInner({
  children,
}: DashboardLayoutProps) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    accessLoading,
    setAccessLoading,
  ] = useState(true);

  const [
    accessChecked,
    setAccessChecked,
  ] = useState(false);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null,
  );

  const [
    billingMode,
    setBillingMode,
  ] = useState<BillingMode>(
    "loading",
  );

  const [
    activeModules,
    setActiveModules,
  ] = useState<ModuleKey[]>(
    [],
  );

  // ==========================================================
  // ROUTER
  // ==========================================================

  const pathname =
    usePathname();

  const router =
    useRouter();

  const settingsContext =
    useSettings();

  const {
    mobileNav,
    fontFamily,
  } = settingsContext;

  // ==========================================================
  // BRAND COLOUR
  // ==========================================================

  const brandColor =
    settingsContext
      ?.settings
      ?.brandColor ||
    "#a9b897";

  // ==========================================================
  // ADMIN
  // ==========================================================

  const isTotsAdmin =
    currentUserId ===
    TOTS_ADMIN_USER_ID;

  // ==========================================================
  // MODULE ACCESS
  // ==========================================================

  const hasModule = (
    moduleKey: ModuleKey,
  ) => {
    if (isTotsAdmin) {
      return true;
    }

    if (
      billingMode ===
      "legacy"
    ) {
      return true;
    }

    if (
      billingMode ===
      "modular"
    ) {
      return activeModules.includes(
        moduleKey,
      );
    }

    return false;
  };

  // ==========================================================
  // ALL LINKS
  // ==========================================================

  const allLinks:
    DashboardLink[] =
    useMemo(
      () => [
        {
          href: "/dashboard",
          label: "Home",
          icon: LayoutDashboard,
        },
        {
          href: "/calendar",
          label: "Calendar",
          icon: Calendar,
          requiredModule: "core",
        },
        {
          href: "/crm",
          label: "Contacts",
          icon: Users,
          requiredModule: "core",
        },
        {
          href: "/notes",
          label: "Notes",
          icon: StickyNote,
          requiredModule: "core",
        },
        {
          href: "/campaigns",
          label: "Email Marketing",
          icon: Megaphone,
          requiredModule: "email",
        },
        {
          href: "/projects",
          label: "Clients & Projects",
          icon: Building2,
          requiredModule:
            "clientsProjects",
        },
        {
          href: "/social",
          label: "Social Studio",
          icon: Globe,
          requiredModule: "social",
        },
        {
          href: "/payments",
          label: "Finance",
          icon: CircleDollarSign,
          requiredModule: "finance",
        },
        {
          href: "/store",
          label: "Store",
          icon: Store,
          requiredModule: "store",
        },
        {
          href: "/tots-admin",
          label: "TOTS Admin",
          icon: ShieldCheck,
          adminOnly: true,
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
      [],
    );

  // ==========================================================
  // LINK ACCESS
  // ==========================================================

  const canAccessLink = (
    link: DashboardLink,
  ) => {
    if (
      link.adminOnly
    ) {
      return isTotsAdmin;
    }

    if (
      !link.requiredModule
    ) {
      return true;
    }

    return hasModule(
      link.requiredModule,
    );
  };

  // ==========================================================
  // MOBILE SECTIONS
  // ==========================================================

  const mobileSections:
    MobileNavSection[] = [
      {
        links: [
          {
            href: "/dashboard",
            label: "Home",
            icon: LayoutDashboard,
          },
        ],
      },

      {
        title: "Core",

        links: [
          {
            href: "/crm",
            label: "Contacts",
            icon: Users,
            requiredModule: "core",
          },
          {
            href: "/notes",
            label: "Notes",
            icon: StickyNote,
            requiredModule: "core",
          },
          {
            href: "/calendar",
            label: "Calendar",
            icon: Calendar,
            requiredModule: "core",
          },
        ],
      },

      {
        title: "Marketing",

        links: [
          {
            href: "/campaigns",
            label: "Email Marketing",
            icon: Megaphone,
            requiredModule: "email",
          },
          {
            href: "/social",
            label: "Social Studio",
            icon: Globe,
            requiredModule: "social",
          },
        ],
      },

      {
        title: "Finance",

        links: [
          {
            href: "/payments",
            label: "Finance",
            icon: CircleDollarSign,
            requiredModule: "finance",
          },
        ],
      },

      {
        title: "Commerce",

        links: [
          {
            href: "/store",
            label: "Store",
            icon: Store,
            requiredModule: "store",
          },
        ],
      },

      {
        title:
          "Clients & Projects",

        links: [
          {
            href: "/projects",
            label: "Workspace",
            icon: Building2,
            requiredModule:
              "clientsProjects",
          },
        ],
      },

      {
        title: "TOTS Platform",

        links: [
          {
            href: "/tots-admin",
            label: "TOTS Admin",
            icon: ShieldCheck,
            adminOnly: true,
          },
        ],
      },
    ];

  // ==========================================================
  // LOAD AUTHORITATIVE ACCOUNT ACCESS
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadAccess() {
        try {
          setAccessLoading(
            true,
          );

          setAccessChecked(
            false,
          );

          setBillingMode(
            "loading",
          );

          setActiveModules(
            [],
          );

          const response =
            await fetch(
              "/api/account/access",
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const data =
            (
              await response
                .json()
                .catch(
                  () => ({}),
                )
            ) as AccountAccessResponse;

          if (cancelled) {
            return;
          }

          if (
            response.status ===
            401
          ) {
            router.replace(
              "/login",
            );

            return;
          }

          if (
            !response.ok ||
            data.allowed !== true
          ) {
            console.warn(
              "Dashboard access denied:",
              {
                status:
                  response.status,
                reason:
                  data.reason,
              },
            );

            router.replace(
              "/access-ended",
            );

            return;
          }

          setCurrentUserId(
            typeof data.userId ===
              "string"
              ? data.userId
              : null,
          );

          if (
            data.userId ===
            TOTS_ADMIN_USER_ID
          ) {
            setBillingMode(
              "legacy",
            );

            setActiveModules(
              [...MODULE_KEYS],
            );

            setAccessChecked(
              true,
            );

            return;
          }

          const rawBillingModel =
            String(
              data.billingModel ||
                "",
            )
              .trim()
              .toLowerCase();

          if (
            rawBillingModel ===
            "legacy_tier"
          ) {
            setBillingMode(
              "legacy",
            );

            setActiveModules(
              [...MODULE_KEYS],
            );

            setAccessChecked(
              true,
            );

            return;
          }

          if (
            rawBillingModel ===
            "modular"
          ) {
            const rawModules =
              Array.isArray(
                data.modules,
              )
                ? data.modules
                : Array.isArray(
                      data.activeModules,
                    )
                  ? data.activeModules
                  : [];

            const modules =
              rawModules.filter(
                isModuleKey,
              );

            setBillingMode(
              "modular",
            );

            setActiveModules(
              Array.from(
                new Set(
                  modules,
                ),
              ),
            );

            setAccessChecked(
              true,
            );

            return;
          }

          console.error(
            "Dashboard received unknown billing model:",
            data.billingModel,
          );

          setBillingMode(
            "unknown",
          );

          setActiveModules(
            [],
          );

          setAccessChecked(
            true,
          );
        } catch (error) {
          console.error(
            "Unable to check account access:",
            error,
          );

          if (!cancelled) {
            router.replace(
              "/access-ended",
            );
          }
        } finally {
          if (!cancelled) {
            setAccessLoading(
              false,
            );
          }
        }
      }

      void loadAccess();

      return () => {
        cancelled = true;
      };
    },
    [router],
  );

  // ==========================================================
  // DIRECT ROUTE GUARD
  // ==========================================================

  useEffect(
    () => {
      if (!accessChecked) {
        return;
      }

      if (isTotsAdmin) {
        return;
      }

      const requiredModule =
        getRequiredModuleForPath(
          pathname,
        );

      if (!requiredModule) {
        return;
      }

      if (
        billingMode ===
        "legacy"
      ) {
        return;
      }

      if (
        billingMode ===
          "modular" &&
        activeModules.includes(
          requiredModule,
        )
      ) {
        return;
      }

      const params =
        new URLSearchParams();

      params.set(
        "existing",
        "true",
      );

      params.set(
        "requiredModule",
        requiredModule,
      );

      params.set(
        "from",
        pathname,
      );

      router.replace(
        `/billing?${params.toString()}`,
      );
    },
    [
      accessChecked,
      isTotsAdmin,
      billingMode,
      activeModules,
      pathname,
      router,
    ],
  );

  // ==========================================================
  // CLOSE DRAWER AFTER ROUTE CHANGE
  // ==========================================================

  useEffect(
    () => {
      setMobileMenuOpen(
        false,
      );
    },
    [pathname],
  );

  // ==========================================================
  // AVAILABLE LINKS
  // ==========================================================

  const availableLinks =
    allLinks.filter(
      canAccessLink,
    );

  // ==========================================================
  // RESOLVE MOBILE NAV
  // ==========================================================

  const requestedMobileNav =
    Array.isArray(
      mobileNav,
    ) &&
    mobileNav.length === 3
      ? mobileNav
      : FALLBACK_MOBILE_NAV;

  // ==========================================================
  // USER PINNED LINKS
  // ==========================================================

  const selectedPinnedLinks =
    requestedMobileNav
      .map((href) =>
        availableLinks.find(
          (link) =>
            link.href === href,
        ),
      )
      .filter(
        (
          link,
        ): link is DashboardLink =>
          Boolean(link),
      );

  // ==========================================================
  // FALLBACK LINKS
  // ==========================================================

  const accessibleFallbackLinks =
    FALLBACK_MOBILE_NAV
      .map((href) =>
        availableLinks.find(
          (link) =>
            link.href === href,
        ),
      )
      .filter(
        (
          link,
        ): link is DashboardLink =>
          Boolean(link),
      );

  // ==========================================================
  // FINAL MOBILE LINKS
  // ==========================================================

  const finalPinnedMobileLinks =
    Array.from(
      new Map(
        [
          ...selectedPinnedLinks,
          ...accessibleFallbackLinks,
          ...availableLinks,
        ].map((link) => [
          link.href,
          link,
        ]),
      ).values(),
    )
      .filter(
        (link) =>
          link.href !==
            "/settings" &&
          link.href !==
            "/tots-admin",
      )
      .slice(0, 3);

  // ==========================================================
  // MORE ACTIVE
  // ==========================================================

  const isMoreActive =
    !finalPinnedMobileLinks.some(
      (link) =>
        routeIsActive(
          pathname,
          link.href,
        ),
    );

  // ==========================================================
  // VISIBLE MOBILE SECTIONS
  // ==========================================================

  const visibleMobileSections =
    mobileSections
      .map((section) => ({
        ...section,

        links:
          section.links.filter(
            canAccessLink,
          ),
      }))
      .filter(
        (section) =>
          section.links.length >
          0,
      );

  // ==========================================================
  // BODY LOCK
  // ==========================================================

  useEffect(
    () => {
      if (!mobileMenuOpen) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      const previousOverscroll =
        document.body.style
          .overscrollBehavior;

      document.body.style.overflow =
        "hidden";

      document.body.style
        .overscrollBehavior =
        "none";

      return () => {
        document.body.style.overflow =
          previousOverflow;

        document.body.style
          .overscrollBehavior =
          previousOverscroll;
      };
    },
    [mobileMenuOpen],
  );

  // ==========================================================
  // ESCAPE CLOSE
  // ==========================================================

  useEffect(
    () => {
      if (!mobileMenuOpen) {
        return;
      }

      const handleKeyDown = (
        event: KeyboardEvent,
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setMobileMenuOpen(
            false,
          );
        }
      };

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [mobileMenuOpen],
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    accessLoading ||
    !accessChecked
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fcfaf7]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#829473]" />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
            Loading your workspace
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CURRENT ROUTE ACCESS
  // ==========================================================

  const requiredModule =
    getRequiredModuleForPath(
      pathname,
    );

  const routeAllowed =
    !requiredModule ||
    isTotsAdmin ||
    billingMode === "legacy" ||
    (
      billingMode ===
        "modular" &&
      activeModules.includes(
        requiredModule,
      )
    );

  // ==========================================================
  // REDIRECTING
  // ==========================================================

  if (!routeAllowed) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fcfaf7]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#829473]" />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
            Opening membership options
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        flex
        h-screen
        w-full
        overflow-hidden
        bg-[#fcfaf7]
      "
      style={{
        fontFamily:
          `'${fontFamily || "Inter"}', sans-serif`,
      }}
    >
      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        data-tour="dashboard-navigation"
        className="
          hidden
          h-full
          flex-shrink-0
          md:block
        "
      >
        <Sidebar />
      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="
          relative
          flex
          h-full
          min-w-0
          flex-1
          flex-col
        "
      >
        {/* ====================================================
            GLOBAL TOP-RIGHT ACTIONS
        ==================================================== */}

        <div
          className="
            pointer-events-none
            fixed
            right-4
            top-[calc(1rem+env(safe-area-inset-top))]
            z-[500]
            flex
            items-center
            gap-3
            sm:right-5
            sm:top-5
            md:right-8
            md:top-8
          "
        >
          <div className="pointer-events-auto">
            <Clarity />
          </div>

          {!mobileMenuOpen && (
            <div className="pointer-events-auto">
              <NotificationBell />
            </div>
          )}
        </div>

        {/* ====================================================
            PAGE CONTENT
        ==================================================== */}

        <div
          data-tour="dashboard-content"
          className="
            flex-1
            overflow-x-hidden
            overflow-y-auto
            p-4
            pb-[calc(7.5rem+env(safe-area-inset-bottom))]
            md:p-12
            md:pb-12
          "
        >
          {children}

          <Footer />
        </div>

        {/* ====================================================
            MOBILE BOTTOM NAV
        ==================================================== */}

        {!mobileMenuOpen && (
          <nav
            data-tour="mobile-navigation"
            aria-label="Mobile navigation"
            className="
              fixed
              bottom-[calc(0.65rem+env(safe-area-inset-bottom))]
              left-3
              right-3
              z-[900]
              grid
              min-h-[70px]
              grid-cols-4
              items-center
              rounded-[1.35rem]
              border
              border-stone-200
              bg-stone-50/95
              p-1.5
              shadow-[0_12px_35px_rgba(28,25,23,0.10)]
              backdrop-blur-xl
              md:hidden
            "
          >
            {finalPinnedMobileLinks.map(
              (link) => (
                <MobileNavItem
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  isActive={routeIsActive(
                    pathname,
                    link.href,
                  )}
                  brandColor={
                    brandColor
                  }
                />
              ),
            )}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  true,
                )
              }
              style={{
                backgroundColor:
                  isMoreActive
                    ? brandColor
                    : "transparent",
              }}
              className={`
                relative
                flex
                h-[56px]
                min-w-0
                flex-col
                items-center
                justify-center
                gap-1.5
                rounded-xl
                transition-all
                duration-200
                active:scale-[0.96]

                ${
                  isMoreActive
                    ? "text-white shadow-sm"
                    : "text-stone-500 hover:bg-stone-100"
                }
              `}
              aria-label="Open navigation"
              aria-expanded={
                mobileMenuOpen
              }
            >
              <Menu
                size={21}
                strokeWidth={
                  isMoreActive
                    ? 2.2
                    : 1.8
                }
              />

              <span className="max-w-full truncate px-1 text-[9px] font-semibold">
                More
              </span>
            </button>
          </nav>
        )}

        {/* ====================================================
            CLARITY TOUR
        ==================================================== */}

        <ClarityTourOverlay />

        {/* ====================================================
            MOBILE DRAWER
        ==================================================== */}

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* ==============================================
                  BACKDROP
              ============================================== */}

              <motion.button
                type="button"
                aria-label="Close navigation"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                onClick={() =>
                  setMobileMenuOpen(
                    false,
                  )
                }
                className="
                  fixed
                  inset-0
                  z-[4999]
                  bg-stone-950/25
                  backdrop-blur-[2px]
                  md:hidden
                "
              />

              {/* ==============================================
                  DRAWER
              ============================================== */}

              <motion.aside
                initial={{
                  x: "-100%",
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: "-100%",
                }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 320,
                  mass: 0.85,
                }}
                role="dialog"
                aria-modal="true"
                aria-label="TOTS-OS navigation"
                className="
                  fixed
                  bottom-0
                  left-0
                  top-0
                  z-[5000]
                  flex
                  h-[100dvh]
                  w-[min(86vw,340px)]
                  flex-col
                  border-r
                  border-stone-200
                  bg-stone-50
                  pt-[env(safe-area-inset-top)]
                  shadow-[20px_0_60px_rgba(28,25,23,0.16)]
                  md:hidden
                "
              >
                {/* ============================================
                    HEADER
                ============================================ */}

                <div
                  className="
                    flex
                    min-h-[84px]
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    border-stone-200/70
                    px-4
                  "
                >
                  <Link
                    href="/dashboard"
                    onClick={() =>
                      setMobileMenuOpen(
                        false,
                      )
                    }
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        shadow-sm
                        ring-1
                        ring-stone-200/70
                      "
                    >
                      <Image
                        src="/icon.png"
                        alt="TOTS-OS"
                        width={34}
                        height={34}
                        priority
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.22em]
                          text-stone-400
                        "
                      >
                        TOTS-OS
                      </p>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-sm
                          font-semibold
                          text-stone-800
                        "
                      >
                        Your workspace
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileMenuOpen(
                        false,
                      )
                    }
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      text-stone-400
                      transition
                      hover:bg-white
                      hover:text-stone-900
                      hover:shadow-sm
                      active:scale-95
                    "
                    aria-label="Close menu"
                  >
                    <X
                      size={19}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>

                {/* ============================================
                    NAVIGATION
                ============================================ */}

                <nav
                  data-tour="mobile-system-menu"
                  className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    overscroll-contain
                    px-3
                    py-4
                    [-webkit-overflow-scrolling:touch]
                  "
                >
                  <div className="space-y-5">
                    {visibleMobileSections.map(
                      (
                        section,
                        index,
                      ) => (
                        <div
                          key={
                            section.title ||
                            `mobile-section-${index}`
                          }
                        >
                          {section.title && (
                            <p
                              className="
                                mb-1.5
                                px-3
                                text-[9px]
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-stone-400
                              "
                            >
                              {
                                section.title
                              }
                            </p>
                          )}

                          <div className="space-y-1">
                            {section.links.map(
                              (link) => {
                                const Icon =
                                  link.icon;

                                const active =
                                  routeIsActive(
                                    pathname,
                                    link.href,
                                  );

                                return (
                                  <Link
                                    key={
                                      link.href
                                    }
                                    href={
                                      link.href
                                    }
                                    onClick={() =>
                                      setMobileMenuOpen(
                                        false,
                                      )
                                    }
                                    data-tour={`nav-${link.label
                                      .toLowerCase()
                                      .replaceAll(
                                        " ",
                                        "-",
                                      )}`}
                                    style={{
                                      backgroundColor:
                                        active
                                          ? brandColor
                                          : "transparent",
                                    }}
                                    className={`
                                      group
                                      flex
                                      min-h-[46px]
                                      items-center
                                      gap-3
                                      rounded-xl
                                      px-3
                                      py-2.5
                                      text-[13px]
                                      font-medium
                                      transition-all
                                      duration-200
                                      active:scale-[0.98]

                                      ${
                                        active
                                          ? "text-white shadow-sm"
                                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                                      }
                                    `}
                                  >
                                    <div
                                      className={`
                                        flex
                                        h-8
                                        w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        transition

                                        ${
                                          active
                                            ? "bg-white/15"
                                            : "bg-white text-stone-500 shadow-sm ring-1 ring-stone-200/70 group-hover:text-stone-800"
                                        }
                                      `}
                                    >
                                      <Icon
                                        size={
                                          17
                                        }
                                        strokeWidth={
                                          active
                                            ? 2.2
                                            : 1.8
                                        }
                                      />
                                    </div>

                                    <span className="min-w-0 flex-1 truncate">
                                      {
                                        link.label
                                      }
                                    </span>

                                    {active && (
                                      <span
                                        className="
                                          h-1.5
                                          w-1.5
                                          shrink-0
                                          rounded-full
                                          bg-white/80
                                        "
                                      />
                                    )}
                                  </Link>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </nav>

                {/* ============================================
                    BOTTOM ACTIONS
                ============================================ */}

                <div
                  className="
                    shrink-0
                    border-t
                    border-stone-200
                    bg-stone-50
                    px-3
                    pb-[calc(0.75rem+env(safe-area-inset-bottom))]
                    pt-3
                  "
                >
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-stone-200
                      bg-white
                      px-3
                      py-2
                      shadow-sm
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.16em]
                          text-stone-400
                        "
                      >
                        Workspace
                      </p>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-[11px]
                          font-semibold
                          text-stone-700
                        "
                      >
                        {billingMode ===
                        "modular"
                          ? `${activeModules.length} active ${
                              activeModules.length ===
                              1
                                ? "module"
                                : "modules"
                            }`
                          : billingMode ===
                              "legacy"
                            ? "Full platform access"
                            : "TOTS-OS"}
                      </p>
                    </div>

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-stone-50
                      "
                    >
                      <NotificationBell />
                    </div>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() =>
                      setMobileMenuOpen(
                        false,
                      )
                    }
                    style={{
                      backgroundColor:
                        routeIsActive(
                          pathname,
                          "/settings",
                        )
                          ? brandColor
                          : "transparent",
                    }}
                    className={`
                      flex
                      min-h-[46px]
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-[13px]
                      font-medium
                      transition-all
                      duration-200
                      active:scale-[0.98]

                      ${
                        routeIsActive(
                          pathname,
                          "/settings",
                        )
                          ? "text-white shadow-sm"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      }
                    `}
                  >
                    <Settings
                      size={18}
                      strokeWidth={1.8}
                    />

                    <span>
                      Settings
                    </span>
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================================
// MOBILE NAV ITEM
// ============================================================

function MobileNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  brandColor,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  brandColor: string;
}) {
  return (
    <Link
      href={href}
      data-tour={`mobile-nav-${label
        .toLowerCase()
        .replaceAll(
          " ",
          "-",
        )}`}
      style={{
        backgroundColor:
          isActive
            ? brandColor
            : "transparent",
      }}
      className={`
        relative
        flex
        h-[56px]
        min-w-0
        flex-col
        items-center
        justify-center
        gap-1.5
        rounded-xl
        transition-all
        duration-200
        active:scale-[0.96]

        ${
          isActive
            ? "text-white shadow-sm"
            : "text-stone-500 hover:bg-stone-100"
        }
      `}
    >
      <Icon
        size={21}
        strokeWidth={
          isActive
            ? 2.2
            : 1.8
        }
      />

      <span
        className="
          max-w-full
          truncate
          px-1
          text-[9px]
          font-semibold
        "
      >
        {label}
      </span>
    </Link>
  );
}