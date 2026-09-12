"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Briefcase,
  Calendar,
  CircleDollarSign,
  Globe,
  LayoutDashboard,
  Megaphone,
  Menu,
  Settings,
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
  children:
    ReactNode;
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
  href:
    string;

  label:
    string;

  icon:
    LucideIcon;

  requiredModule?:
    ModuleKey;
};

type MobileNavSection = {
  title?:
    string;

  links:
    DashboardLink[];
};

type AccountAccessResponse = {
  allowed?:
    boolean;

  reason?:
    string;

  userId?:
    string | null;

  organisationId?:
    string | null;

  organisationName?:
    string | null;

  billingModel?:
    string | null;

  billingPackage?:
    string | null;

  billingVersion?:
    string | null;

  modules?:
    string[];

  activeModules?:
    string[];

  clarityAiTier?:
    string | null;

  subscriptionStatus?:
    string | null;

  accessStatus?:
    string | null;
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

const MODULE_KEYS:
  ModuleKey[] = [
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
  prefix:
    string;

  module:
    ModuleKey;
}[] = [
  {
    prefix:
      "/crm",

    module:
      "core",
  },

  {
    prefix:
      "/notes",

    module:
      "core",
  },

  {
    prefix:
      "/calendar",

    module:
      "core",
  },

  {
    prefix:
      "/campaigns",

    module:
      "email",
  },

  {
    prefix:
      "/social",

    module:
      "social",
  },

  {
    prefix:
      "/payments",

    module:
      "finance",
  },

  {
    prefix:
      "/projects",

    module:
      "clientsProjects",
  },

  {
    prefix:
      "/store",

    module:
      "store",
  },
];

// ============================================================
// HELPERS
// ============================================================

function isModuleKey(
  value:
    unknown,
): value is ModuleKey {
  return (
    typeof value ===
      "string" &&
    MODULE_KEYS.includes(
      value as ModuleKey,
    )
  );
}

function getRequiredModuleForPath(
  pathname:
    string,
):
  | ModuleKey
  | null {
  const rule =
    MODULE_ROUTE_RULES.find(
      (
        item,
      ) =>
        pathname ===
          item.prefix ||
        pathname.startsWith(
          `${item.prefix}/`,
        ),
    );

  return (
    rule?.module ||
    null
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
  ] =
    useState(
      false,
    );

  const [
    accessLoading,
    setAccessLoading,
  ] =
    useState(
      true,
    );

  const [
    accessChecked,
    setAccessChecked,
  ] =
    useState(
      false,
    );

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string |
      null
    >(
      null,
    );

  const [
    billingMode,
    setBillingMode,
  ] =
    useState<
      BillingMode
    >(
      "loading",
    );

  const [
    activeModules,
    setActiveModules,
  ] =
    useState<
      ModuleKey[]
    >(
      [],
    );

  // ==========================================================
  // ROUTER
  // ==========================================================

  const pathname =
    usePathname();

  const router =
    useRouter();

  const {
    mobileNav,
    fontFamily,
  } =
    useSettings();

  // ==========================================================
  // ADMIN
  // ==========================================================

  const isTotsAdmin =
    currentUserId ===
    TOTS_ADMIN_USER_ID;

  // ==========================================================
  // MODULE ACCESS HELPER
  // ==========================================================

  const hasModule =
    (
      moduleKey:
        ModuleKey,
    ) => {
      // ======================================================
      // PRIVATE TOTS ADMIN
      // ======================================================

      if (
        isTotsAdmin
      ) {
        return true;
      }

      // ======================================================
      // GRANDFATHERED LEGACY ACCOUNT
      // ======================================================

      if (
        billingMode ===
        "legacy"
      ) {
        return true;
      }

      // ======================================================
      // MODULAR ACCOUNT
      // ======================================================

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
          href:
            "/dashboard",

          label:
            "Home",

          icon:
            LayoutDashboard,
        },

        {
          href:
            "/calendar",

          label:
            "Calendar",

          icon:
            Calendar,

          requiredModule:
            "core",
        },

        {
          href:
            "/crm",

          label:
            "Contacts",

          icon:
            Users,

          requiredModule:
            "core",
        },

        {
          href:
            "/notes",

          label:
            "Notes",

          icon:
            StickyNote,

          requiredModule:
            "core",
        },

        {
          href:
            "/campaigns",

          label:
            "Email Marketing",

          icon:
            Megaphone,

          requiredModule:
            "email",
        },

        {
          href:
            "/projects",

          label:
            "Projects",

          icon:
            Briefcase,

          requiredModule:
            "clientsProjects",
        },

        {
          href:
            "/social",

          label:
            "Social Studio",

          icon:
            Globe,

          requiredModule:
            "social",
        },

        {
          href:
            "/payments",

          label:
            "Finance",

          icon:
            CircleDollarSign,

          requiredModule:
            "finance",
        },

        {
          href:
            "/store",

          label:
            "Store",

          icon:
            Store,

          requiredModule:
            "store",
        },

        {
          href:
            "/settings",

          label:
            "Settings",

          icon:
            Settings,
        },
      ],
      [],
    );

  // ==========================================================
  // LINK ACCESS
  // ==========================================================

  const canAccessLink =
    (
      link:
        DashboardLink,
    ) => {
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
            href:
              "/dashboard",

            label:
              "Home",

            icon:
              LayoutDashboard,
          },
        ],
      },

      {
        title:
          "Core",

        links: [
          {
            href:
              "/crm",

            label:
              "Contacts",

            icon:
              Users,

            requiredModule:
              "core",
          },

          {
            href:
              "/notes",

            label:
              "Notes",

            icon:
              StickyNote,

            requiredModule:
              "core",
          },

          {
            href:
              "/calendar",

            label:
              "Calendar",

            icon:
              Calendar,

            requiredModule:
              "core",
          },
        ],
      },

      {
        title:
          "Marketing",

        links: [
          {
            href:
              "/campaigns",

            label:
              "Email Marketing",

            icon:
              Megaphone,

            requiredModule:
              "email",
          },

          {
            href:
              "/social",

            label:
              "Social Studio",

            icon:
              Globe,

            requiredModule:
              "social",
          },
        ],
      },

      {
        title:
          "Finance",

        links: [
          {
            href:
              "/payments",

            label:
              "Finance",

            icon:
              CircleDollarSign,

            requiredModule:
              "finance",
          },
        ],
      },

      {
        title:
          "Commerce",

        links: [
          {
            href:
              "/store",

            label:
              "Store",

            icon:
              Store,

            requiredModule:
              "store",
          },
        ],
      },

      {
        title:
          "Clients & Projects",

        links: [
          {
            href:
              "/projects",

            label:
              "Workspace",

            icon:
              Briefcase,

            requiredModule:
              "clientsProjects",
          },
        ],
      },

      {
        title:
          "Settings",

        links: [
          {
            href:
              "/settings",

            label:
              "Settings",

            icon:
              Settings,
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

          // ==================================================
          // SINGLE AUTHORITATIVE ACCESS REQUEST
          // ==================================================

          const response =
            await fetch(
              "/api/account/access",
              {
                method:
                  "GET",

                cache:
                  "no-store",
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

          if (
            cancelled
          ) {
            return;
          }

          // ==================================================
          // NOT SIGNED IN
          // ==================================================

          if (
            response.status ===
            401
          ) {
            router.replace(
              "/login",
            );

            return;
          }

          // ==================================================
          // ACCOUNT ACCESS ENDED
          // ==================================================

          if (
            !response.ok ||
            data.allowed !==
              true
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

          // ==================================================
          // USER
          // ==================================================

          setCurrentUserId(
            typeof data.userId ===
              "string"
              ? data.userId
              : null,
          );

          // ==================================================
          // TOTS ADMIN
          // ==================================================

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

          // ==================================================
          // BILLING MODEL
          // ==================================================

          const rawBillingModel =
            String(
              data.billingModel ||
                "",
            )
              .trim()
              .toLowerCase();

          // ==================================================
          // LEGACY
          // ==================================================

          if (
            rawBillingModel ===
            "legacy_tier"
          ) {
            setBillingMode(
              "legacy",
            );

            /*
             * Grandfathered users currently retain
             * access to the existing platform.
             */
            setActiveModules(
              [...MODULE_KEYS],
            );

            setAccessChecked(
              true,
            );

            return;
          }

          // ==================================================
          // MODULAR
          // ==================================================

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

          // ==================================================
          // UNKNOWN BILLING STATE
          // ==================================================

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
        } catch (
          error
        ) {
          console.error(
            "Unable to check account access:",
            error,
          );

          if (
            !cancelled
          ) {
            router.replace(
              "/access-ended",
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setAccessLoading(
              false,
            );
          }
        }
      }

      void loadAccess();

      return () => {
        cancelled =
          true;
      };
    },
    [
      router,
    ],
  );

  // ==========================================================
  // DIRECT ROUTE GUARD
  // ==========================================================

  useEffect(
    () => {
      if (
        !accessChecked
      ) {
        return;
      }

      // ======================================================
      // ADMIN
      // ======================================================

      if (
        isTotsAdmin
      ) {
        return;
      }

      const requiredModule =
        getRequiredModuleForPath(
          pathname,
        );

      // ======================================================
      // UNRESTRICTED ROUTE
      // ======================================================

      if (
        !requiredModule
      ) {
        return;
      }

      // ======================================================
      // LEGACY CUSTOMER
      // ======================================================

      if (
        billingMode ===
        "legacy"
      ) {
        return;
      }

      // ======================================================
      // MODULAR CUSTOMER WITH MODULE
      // ======================================================

      if (
        billingMode ===
          "modular" &&
        activeModules.includes(
          requiredModule,
        )
      ) {
        return;
      }

      // ======================================================
      // MODULE NOT PURCHASED
      // ======================================================

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
    mobileNav.length ===
      3
      ? mobileNav
      : FALLBACK_MOBILE_NAV;

  // ==========================================================
  // USER'S PINNED LINKS
  // ==========================================================

  const selectedPinnedLinks =
    requestedMobileNav
      .map(
        (
          href,
        ) =>
          availableLinks.find(
            (
              link,
            ) =>
              link.href ===
              href,
          ),
      )
      .filter(
        (
          link,
        ): link is DashboardLink =>
          Boolean(
            link,
          ),
      );

  // ==========================================================
  // ACCESSIBLE FALLBACKS
  // ==========================================================

  const accessibleFallbackLinks =
    FALLBACK_MOBILE_NAV
      .map(
        (
          href,
        ) =>
          availableLinks.find(
            (
              link,
            ) =>
              link.href ===
              href,
          ),
      )
      .filter(
        (
          link,
        ): link is DashboardLink =>
          Boolean(
            link,
          ),
      );

  // ==========================================================
  // FINAL 3 MOBILE LINKS
  // ==========================================================

  const finalPinnedMobileLinks =
    Array.from(
      new Map(
        [
          ...selectedPinnedLinks,
          ...accessibleFallbackLinks,
          ...availableLinks,
        ].map(
          (
            link,
          ) => [
            link.href,
            link,
          ],
        ),
      ).values(),
    )
      .filter(
        (
          link,
        ) =>
          link.href !==
          "/settings",
      )
      .slice(
        0,
        3,
      );

  // ==========================================================
  // MORE ACTIVE STATE
  // ==========================================================

  const isMoreActive =
    !finalPinnedMobileLinks.some(
      (
        link,
      ) =>
        pathname ===
          link.href ||
        pathname.startsWith(
          `${link.href}/`,
        ),
    );

  // ==========================================================
  // FILTER MOBILE SECTIONS
  // ==========================================================

  const visibleMobileSections =
    mobileSections
      .map(
        (
          section,
        ) => ({
          ...section,

          links:
            section
              .links
              .filter(
                canAccessLink,
              ),
        }),
      )
      .filter(
        (
          section,
        ) =>
          section.links.length >
          0,
      );

  // ==========================================================
  // LOCK BODY WHEN MOBILE MENU IS OPEN
  // ==========================================================

  useEffect(
    () => {
      if (
        !mobileMenuOpen
      ) {
        return;
      }

      const previousOverflow =
        document
          .body
          .style
          .overflow;

      const previousOverscroll =
        document
          .body
          .style
          .overscrollBehavior;

      document
        .body
        .style
        .overflow =
        "hidden";

      document
        .body
        .style
        .overscrollBehavior =
        "none";

      return () => {
        document
          .body
          .style
          .overflow =
          previousOverflow;

        document
          .body
          .style
          .overscrollBehavior =
          previousOverscroll;
      };
    },
    [
      mobileMenuOpen,
    ],
  );

  // ==========================================================
  // ESCAPE CLOSE MOBILE MENU
  // ==========================================================

  useEffect(
    () => {
      if (
        !mobileMenuOpen
      ) {
        return;
      }

      const handleKeyDown =
        (
          event:
            KeyboardEvent,
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
    [
      mobileMenuOpen,
    ],
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    accessLoading ||
    !accessChecked
  ) {
    return (
      <div
        className="
          flex
          h-screen
          w-full
          items-center
          justify-center
          bg-[#fcfaf7]
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              rounded-full
              border-2
              border-stone-200
              border-t-[#829473]
            "
          />

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
    billingMode ===
      "legacy" ||
    (
      billingMode ===
        "modular" &&
      activeModules.includes(
        requiredModule,
      )
    );

  // ==========================================================
  // DON'T RENDER PAGE WHILE REDIRECTING
  // ==========================================================

  if (
    !routeAllowed
  ) {
    return (
      <div
        className="
          flex
          h-screen
          w-full
          items-center
          justify-center
          bg-[#fcfaf7]
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              rounded-full
              border-2
              border-stone-200
              border-t-[#829473]
            "
          />

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
          {/* CLARITY */}

          <div className="pointer-events-auto">
            <Clarity />
          </div>

          {/* NOTIFICATIONS */}

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
              grid-cols-4
              items-center

              min-h-[72px]

              rounded-[1.65rem]

              border
              border-stone-200/80

              bg-white/95

              p-1.5

              shadow-[0_12px_40px_rgba(28,25,23,0.10)]

              backdrop-blur-2xl

              md:hidden
            "
          >
            {finalPinnedMobileLinks.map(
              (
                link,
              ) => (
                <MobileNavItem
                  key={
                    link.href
                  }
                  href={
                    link.href
                  }
                  icon={
                    link.icon
                  }
                  label={
                    link.label
                  }
                  isActive={
                    pathname ===
                      link.href ||
                    pathname.startsWith(
                      `${link.href}/`,
                    )
                  }
                />
              ),
            )}

            {/* MORE */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  true,
                )
              }
              className={`
                relative

                flex

                h-[58px]

                min-w-0

                flex-col
                items-center
                justify-center

                gap-1.5

                rounded-[1.25rem]

                transition-all
                duration-200

                active:scale-[0.96]

                ${
                  isMoreActive
                    ? "bg-[#a9b897] text-white shadow-sm"
                    : "bg-transparent text-stone-400 hover:bg-stone-50"
                }
              `}
              aria-label="Open full navigation menu"
              aria-expanded={
                mobileMenuOpen
              }
            >
              <Menu
                size={
                  22
                }
                strokeWidth={
                  isMoreActive
                    ? 2
                    : 1.7
                }
              />

              <span
                className="
                  max-w-full
                  truncate
                  px-1

                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.04em]
                "
              >
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
            MOBILE FULL MENU
        ==================================================== */}

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{
                y:
                  "100%",
              }}
              animate={{
                y:
                  0,
              }}
              exit={{
                y:
                  "100%",
              }}
              transition={{
                type:
                  "spring",

                damping:
                  30,

                stiffness:
                  300,
              }}
              className="
                fixed
                inset-0

                z-[5000]

                h-[100dvh]

                overflow-y-auto
                overscroll-contain

                bg-[#fcfaf7]

                pt-[env(safe-area-inset-top)]
                pb-[env(safe-area-inset-bottom)]

                [-webkit-overflow-scrolling:touch]

                md:hidden
              "
            >
              <div
                className="
                  relative

                  min-h-full

                  p-5
                  pb-24
                "
              >
                {/* ============================================
                    HEADER
                ============================================ */}

                <div
                  className="
                    relative
                    z-[6000]

                    mb-6

                    flex
                    items-center
                    justify-between
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}

                    <img
                      src="/icon.png"
                      alt="TOTS-OS"
                      className="
                        h-9
                        w-9

                        rounded-xl

                        object-contain
                      "
                    />

                    <span
                      className="
                        font-serif

                        text-2xl
                        italic
                        tracking-tighter

                        text-stone-900
                      "
                    >
                      TOTS-OS
                    </span>
                  </div>

                  <div
                    className="
                      relative
                      z-[7000]

                      flex
                      items-center
                      gap-2
                    "
                  >
                    <div
                      className="
                        relative
                        z-[8000]

                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                      "
                    >
                      <NotificationBell />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setMobileMenuOpen(
                          false,
                        )
                      }
                      className="
                        flex

                        h-11
                        w-11

                        shrink-0

                        items-center
                        justify-center

                        rounded-[1.25rem]

                        border
                        border-stone-200

                        bg-white

                        text-stone-900

                        shadow-sm

                        transition-all
                        duration-200

                        hover:border-stone-300

                        active:scale-95
                      "
                      aria-label="Close menu"
                    >
                      <X
                        size={
                          20
                        }
                      />
                    </button>
                  </div>
                </div>

                {/* ============================================
                    INTRO
                ============================================ */}

                <div
                  className="
                    relative
                    z-[100]

                    mb-6

                    rounded-[1.5rem]

                    border
                    border-stone-200

                    bg-white

                    px-4
                    py-4

                    shadow-sm
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.2em]

                          text-[#829473]
                        "
                      >
                        Your workspace
                      </p>

                      <p
                        className="
                          mt-1

                          text-xs
                          font-semibold
                          leading-5

                          text-stone-700
                        "
                      >
                        Your TOTS-OS modules,
                        all in one place.
                      </p>
                    </div>

                    <div
                      className="
                        h-2
                        w-2

                        shrink-0

                        rounded-full

                        bg-[#a9b897]
                      "
                    />
                  </div>
                </div>

                {/* ============================================
                    MENU LINKS
                ============================================ */}

                <div
                  data-tour="mobile-system-menu"
                  className="
                    relative
                    z-[50]

                    space-y-5
                  "
                >
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
                              mb-2
                              px-1

                              text-[9px]
                              font-black
                              uppercase
                              tracking-[0.2em]

                              text-stone-400
                            "
                          >
                            {
                              section.title
                            }
                          </p>
                        )}

                        <div
                          className="
                            grid
                            grid-cols-2
                            gap-2.5
                          "
                        >
                          {section.links.map(
                            (
                              link,
                            ) => {
                              const Icon =
                                link.icon;

                              const linkIsActive =
                                pathname ===
                                  link.href ||
                                pathname.startsWith(
                                  `${link.href}/`,
                                );

                              const isPinned =
                                finalPinnedMobileLinks.some(
                                  (
                                    pinned,
                                  ) =>
                                    pinned.href ===
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
                                  className={`
                                    relative

                                    flex

                                    h-20

                                    flex-col
                                    justify-between

                                    rounded-[1.4rem]

                                    border

                                    p-3

                                    transition-all
                                    duration-300

                                    active:scale-[0.98]

                                    ${
                                      linkIsActive
                                        ? "border-[#a9b897]/60 bg-white shadow-md"
                                        : "border-stone-100 bg-white/60 hover:border-stone-200 hover:bg-white"
                                    }
                                  `}
                                >
                                  {isPinned && (
                                    <span
                                      className="
                                        absolute

                                        right-3
                                        top-3

                                        h-1.5
                                        w-1.5

                                        rounded-full

                                        bg-[#a9b897]
                                      "
                                    />
                                  )}

                                  <div
                                    style={{
                                      color:
                                        linkIsActive
                                          ? "var(--brand-primary, #829473)"
                                          : "#a8a29e",
                                    }}
                                  >
                                    <Icon
                                      size={
                                        19
                                      }
                                      strokeWidth={
                                        linkIsActive
                                          ? 2
                                          : 1.5
                                      }
                                    />
                                  </div>

                                  <span
                                    className={`
                                      text-[8px]
                                      font-black
                                      uppercase
                                      tracking-[0.14em]

                                      ${
                                        linkIsActive
                                          ? "text-stone-900"
                                          : "text-stone-500"
                                      }
                                    `}
                                  >
                                    {
                                      link.label
                                    }
                                  </span>
                                </Link>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </motion.div>
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

  icon:
    Icon,

  label,

  isActive,
}: {
  href:
    string;

  icon:
    LucideIcon;

  label:
    string;

  isActive:
    boolean;
}) {
  return (
    <Link
      href={
        href
      }
      data-tour={`mobile-nav-${label
        .toLowerCase()
        .replaceAll(
          " ",
          "-",
        )}`}
      className={`
        relative

        flex

        h-[58px]

        min-w-0

        flex-col
        items-center
        justify-center

        gap-1.5

        rounded-[1.25rem]

        transition-all
        duration-200

        active:scale-[0.96]

        ${
          isActive
            ? "bg-[#a9b897] text-white shadow-sm"
            : "bg-transparent text-stone-400 hover:bg-stone-50"
        }
      `}
    >
      <Icon
        size={
          22
        }
        strokeWidth={
          isActive
            ? 2
            : 1.7
        }
      />

      <span
        className="
          max-w-full

          truncate

          px-1

          text-[9px]
          font-bold
          uppercase
          tracking-[0.04em]
        "
      >
        {
          label
        }
      </span>
    </Link>
  );
}