"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import Image from "next/image";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Calendar,
  Megaphone,
  StickyNote,
  Globe,
  Settings,
  Loader2,
  LogOut,
  CircleDollarSign,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  supabase,
} from "../../lib/supabase";

import {
  useSettings,
} from "@/app/context/SettingsContext";

// ============================================================
// PRIVATE TOTS ADMIN USER
// ============================================================

const TOTS_ADMIN_USER_ID =
  "f0524a73-0559-467f-9465-095e43c3952e";

// ============================================================
// TYPES
// ============================================================

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

type SidebarLink = {
  href:
    string;

  label:
    string;

  icon:
    React.ElementType;

  adminOnly?:
    boolean;

  requiredModule?:
    ModuleKey;
};

type SidebarSection = {
  title?:
    string;

  links:
    SidebarLink[];
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

  modules?:
    string[];

  activeModules?:
    string[];

  accessStatus?:
    string | null;
};

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

// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  let context:
    any =
    null;

  try {
    context =
      useSettings();
  } catch {
    console.warn(
      "Sidebar: SettingsContext missing",
    );
  }

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    collapsed,
    setCollapsed,
  ] =
    useState(
      false,
    );

  const [
    isCompact,
    setIsCompact,
  ] =
    useState(
      false,
    );

  const [
    isMobile,
    setIsMobile,
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

  const [
    signedIn,
    setSignedIn,
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

  const [
    localColor,
    setLocalColor,
  ] =
    useState(
      "#a9b897",
    );

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  const isTotsAdmin =
    signedIn &&
    currentUserId ===
      TOTS_ADMIN_USER_ID;

  // ==========================================================
  // MODULE HELPER
  // ==========================================================

  const hasModule =
    (
      moduleKey:
        ModuleKey,
    ) => {
      if (
        isTotsAdmin
      ) {
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
    SidebarLink[] = [
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
          "/campaigns",

        label:
          "Campaigns",

        icon:
          Megaphone,

        requiredModule:
          "email",
      },

      {
        href:
          "/social",

        label:
          "Social",

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
          "/projects",

        label:
          "Clients & Projects",

        icon:
          Building2,

        requiredModule:
          "clientsProjects",
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
          "/tots-admin",

        label:
          "TOTS Admin",

        icon:
          ShieldCheck,

        adminOnly:
          true,
      },

      {
        href:
          "/settings",

        label:
          "Settings",

        icon:
          Settings,
      },
    ];

  // ==========================================================
  // RESPONSIVE MODE
  // ==========================================================

  useEffect(
    () => {
      function syncResponsiveMode() {
        const mobile =
          window.innerWidth <
          768;

        const compactHeight =
          window.innerHeight <=
          820;

        setIsMobile(
          mobile,
        );

        setIsCompact(
          mobile ||
            compactHeight,
        );

        if (
          mobile
        ) {
          setCollapsed(
            true,
          );
        }
      }

      syncResponsiveMode();

      window.addEventListener(
        "resize",
        syncResponsiveMode,
      );

      return () => {
        window.removeEventListener(
          "resize",
          syncResponsiveMode,
        );
      };
    },
    [],
  );

  // ==========================================================
  // LOAD SIDEBAR CONTEXT
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadSidebarContext() {
        try {
          setLoading(
            true,
          );

          setBillingMode(
            "loading",
          );

          setActiveModules(
            [],
          );

          // ==================================================
          // SESSION
          // ==================================================

          const {
            data:
              sessionData,

            error:
              sessionError,
          } =
            await supabase
              .auth
              .getSession();

          if (
            cancelled
          ) {
            return;
          }

          if (
            sessionError
          ) {
            console.warn(
              "Sidebar session load error:",
              sessionError,
            );
          }

          const user =
            sessionData
              ?.session
              ?.user;

          if (
            !user?.id
          ) {
            setSignedIn(
              false,
            );

            setCurrentUserId(
              null,
            );

            setBillingMode(
              "unknown",
            );

            return;
          }

          setSignedIn(
            true,
          );

          setCurrentUserId(
            user.id,
          );

          // ==================================================
          // BRAND COLOUR
          // ==================================================

          try {
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
                  "brand_color",
                )
                .eq(
                  "id",
                  user.id,
                )
                .maybeSingle();

            if (
              profileError
            ) {
              console.warn(
                "Sidebar brand colour load error:",
                profileError,
              );
            }

            if (
              !cancelled &&
              profile
                ?.brand_color
            ) {
              setLocalColor(
                String(
                  profile
                    .brand_color,
                ),
              );
            }
          } catch (
            profileError
          ) {
            console.warn(
              "Sidebar profile lookup failed:",
              profileError,
            );
          }

          // ==================================================
          // TOTS ADMIN
          // ==================================================

          if (
            user.id ===
            TOTS_ADMIN_USER_ID
          ) {
            setBillingMode(
              "legacy",
            );

            setActiveModules(
              [...MODULE_KEYS],
            );

            return;
          }

          // ==================================================
          // AUTHORITATIVE ACCOUNT ACCESS
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

          if (
            response.status ===
            401
          ) {
            setSignedIn(
              false,
            );

            setCurrentUserId(
              null,
            );

            setBillingMode(
              "unknown",
            );

            return;
          }

          if (
            !response.ok ||
            data.allowed !==
              true
          ) {
            console.warn(
              "Sidebar account access unavailable:",
              {
                status:
                  response.status,

                reason:
                  data.reason,
              },
            );

            setBillingMode(
              "unknown",
            );

            setActiveModules(
              [],
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

          if (
            rawBillingModel ===
            "legacy_tier"
          ) {
            setBillingMode(
              "legacy",
            );

            setActiveModules(
              [],
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

            return;
          }

          setBillingMode(
            "unknown",
          );

          setActiveModules(
            [],
          );
        } catch (
          error
        ) {
          console.error(
            "Sidebar load error:",
            error,
          );

          if (
            !cancelled
          ) {
            setBillingMode(
              "unknown",
            );

            setActiveModules(
              [],
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false,
            );
          }
        }
      }

      void loadSidebarContext();

      // ======================================================
      // AUTH STATE CHANGES
      // ======================================================

      const {
        data:
          authListener,
      } =
        supabase
          .auth
          .onAuthStateChange(
            (
              event,
              session,
            ) => {
              if (
                cancelled
              ) {
                return;
              }

              const user =
                session
                  ?.user;

              setSignedIn(
                Boolean(
                  user?.id,
                ),
              );

              setCurrentUserId(
                user?.id ||
                  null,
              );

              if (
                event ===
                  "SIGNED_IN" ||
                event ===
                  "USER_UPDATED" ||
                event ===
                  "TOKEN_REFRESHED"
              ) {
                void loadSidebarContext();
              }

              if (
                event ===
                "SIGNED_OUT"
              ) {
                setBillingMode(
                  "unknown",
                );

                setActiveModules(
                  [],
                );
              }
            },
          );

      return () => {
        cancelled =
          true;

        authListener
          .subscription
          .unsubscribe();
      };
    },
    [],
  );

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    async () => {
      try {
        const {
          error,
        } =
          await supabase
            .auth
            .signOut();

        if (
          error
        ) {
          throw error;
        }

        setSignedIn(
          false,
        );

        setCurrentUserId(
          null,
        );

        setBillingMode(
          "unknown",
        );

        setActiveModules(
          [],
        );

        toast.success(
          "Logged out successfully",
        );

        router.push(
          "/login",
        );

        router.refresh();
      } catch (
        error
      ) {
        console.error(
          "Logout error:",
          error,
        );

        toast.error(
          "Unable to log out",
        );
      }
    };

  // ==========================================================
  // BRAND COLOUR
  // ==========================================================

  const activeColor =
    context
      ?.settings
      ?.brandColor ||
    localColor;

  // ==========================================================
  // LINK ACCESS
  // ==========================================================

  const userCanAccessLink =
    (
      link:
        SidebarLink,
    ) => {
      if (
        !signedIn
      ) {
        return false;
      }

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
  // VISIBLE LINKS
  // ==========================================================

  const visibleLinks =
    signedIn
      ? allLinks.filter(
          userCanAccessLink,
        )
      : [];

  // ==========================================================
  // CAN SEE
  // ==========================================================

  const canSee =
    (
      href:
        string,
    ) => {
      if (
        !signedIn
      ) {
        return false;
      }

      return visibleLinks.some(
        (
          link,
        ) =>
          link.href ===
          href,
      );
    };

  // ==========================================================
  // SIDEBAR SECTIONS
  // ==========================================================

  const sections:
    SidebarSection[] = [
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
              Building2,

            requiredModule:
              "clientsProjects",
          },
        ],
      },

      {
        title:
          "TOTS Platform",

        links: [
          {
            href:
              "/tots-admin",

            label:
              "TOTS Admin",

            icon:
              ShieldCheck,

            adminOnly:
              true,
          },
        ],
      },
    ];

  // ==========================================================
  // ACTIVE LINK
  // ==========================================================

  const isActive =
    (
      href:
        string,
    ) => {
      if (
        href ===
        "/dashboard"
      ) {
        return (
          pathname ===
          "/dashboard"
        );
      }

      return (
        pathname ===
          href ||
        pathname.startsWith(
          `${href}/`,
        )
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <aside
      className={`
        relative
        z-[300]

        flex
        h-[100dvh]
        flex-col

        border-r
        border-stone-200

        bg-stone-50

        transition-all
        duration-300

        ${
          collapsed
            ? "w-16 sm:w-20"
            : "w-64"
        }
      `}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className={`
          flex
          shrink-0
          items-center

          ${
            collapsed
              ? "justify-center"
              : "justify-between"
          }

          ${
            isCompact
              ? "min-h-16 px-2 sm:px-3"
              : "min-h-24 px-4"
          }
        `}
      >
        {!collapsed ? (
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src="/icon.png"
              alt="TOTS-OS"
              width={
                isCompact
                  ? 42
                  : 52
              }
              height={
                isCompact
                  ? 42
                  : 52
              }
              priority
              className="shrink-0 object-contain"
            />

            <div className="min-w-0">
              <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                TOTS-OS
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
          >
            <Image
              src="/icon.png"
              alt="TOTS-OS"
              width={
                isMobile
                  ? 27
                  : isCompact
                    ? 28
                    : 34
              }
              height={
                isMobile
                  ? 27
                  : isCompact
                    ? 28
                    : 34
              }
              priority
              className="object-contain"
            />
          </Link>
        )}

        {!collapsed &&
          !isMobile && (
            <button
              type="button"
              onClick={() =>
                setCollapsed(
                  true,
                )
              }
              title="Collapse sidebar"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center

                rounded-xl

                text-stone-400

                transition

                hover:bg-white
                hover:text-stone-800
                hover:shadow-sm
              "
            >
              <PanelLeftClose
                size={17}
                strokeWidth={1.7}
              />
            </button>
          )}
      </div>

      {/* =====================================================
          COLLAPSED EXPAND CONTROL
      ===================================================== */}

      {collapsed &&
        !isMobile && (
          <div className="shrink-0 px-3 pb-3">
            <button
              type="button"
              onClick={() =>
                setCollapsed(
                  false,
                )
              }
              title="Expand sidebar"
              className="
                mx-auto

                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-xl

                text-stone-400

                transition

                hover:bg-white
                hover:text-stone-800
                hover:shadow-sm
              "
            >
              <PanelLeftOpen
                size={17}
                strokeWidth={1.7}
              />
            </button>
          </div>
        )}

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav
        className="
          min-h-0
          flex-1

          overflow-y-auto
          overscroll-contain

          px-2
          pb-3

          sm:px-3
        "
      >
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2
              size={20}
              className="animate-spin text-stone-400"
            />
          </div>
        ) : signedIn ? (
          <div
            className={
              isCompact
                ? "space-y-3"
                : "space-y-6"
            }
          >
            {sections.map(
              (
                section,
                sectionIndex,
              ) => {
                const sectionLinks =
                  section
                    .links
                    .filter(
                      userCanAccessLink,
                    );

                if (
                  sectionLinks.length ===
                  0
                ) {
                  return null;
                }

                return (
                  <div
                    key={
                      section.title ||
                      `section-${sectionIndex}`
                    }
                  >
                    {!collapsed &&
                      section.title && (
                        <p
                          className={`
                            px-3

                            font-semibold
                            uppercase

                            text-stone-400

                            ${
                              isCompact
                                ? "mb-1 text-[9px] tracking-[0.14em]"
                                : "mb-2 text-[10px] tracking-[0.16em]"
                            }
                          `}
                        >
                          {
                            section.title
                          }
                        </p>
                      )}

                    <div
                      className={
                        isCompact
                          ? "space-y-0.5"
                          : "space-y-1"
                      }
                    >
                      {sectionLinks.map(
                        (
                          item,
                        ) => {
                          const active =
                            isActive(
                              item.href,
                            );

                          const Icon =
                            item.icon;

                          return (
                            <Link
                              key={
                                item.href
                              }
                              href={
                                item.href
                              }
                              aria-label={
                                item.label
                              }
                              title={
                                collapsed
                                  ? item.label
                                  : undefined
                              }
                              style={{
                                backgroundColor:
                                  active
                                    ? activeColor
                                    : "transparent",
                              }}
                              className={`
                                group

                                flex
                                items-center

                                font-medium

                                transition-all
                                duration-200

                                ${
                                  isCompact
                                    ? "rounded-lg px-2.5 py-2 text-[12px]"
                                    : "rounded-xl px-3 py-2.5 text-sm"
                                }

                                ${
                                  collapsed
                                    ? "justify-center"
                                    : "gap-3"
                                }

                                ${
                                  active
                                    ? "text-white shadow-sm"
                                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                                }
                              `}
                            >
                              <Icon
                                size={
                                  isMobile
                                    ? 18
                                    : isCompact
                                      ? 16
                                      : 18
                                }
                                strokeWidth={
                                  active
                                    ? 2.2
                                    : 1.8
                                }
                              />

                              {!collapsed && (
                                <span>
                                  {
                                    item.label
                                  }
                                </span>
                              )}
                            </Link>
                          );
                        },
                      )}
                    </div>
                  </div>
                );
              },
            )}

            {billingMode ===
              "unknown" &&
              !isTotsAdmin && (
                <div
                  className={`
                    rounded-xl
                    border
                    border-stone-200
                    bg-white
                    text-stone-500

                    ${
                      collapsed
                        ? "flex justify-center p-2"
                        : "mx-1 p-3"
                    }
                  `}
                >
                  <LockKeyhole
                    size={15}
                    className="shrink-0"
                  />

                  {!collapsed && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-stone-700">
                        Modules unavailable
                      </p>

                      <p className="mt-1 text-[9px] leading-4">
                        We couldn&apos;t
                        verify your module
                        access. Home and
                        Settings remain
                        available.
                      </p>
                    </div>
                  )}
                </div>
              )}
          </div>
        ) : null}
      </nav>

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      {!loading &&
        signedIn &&
        canSee(
          "/settings",
        ) && (
          <div
            className={`
              shrink-0

              px-2

              sm:px-3

              ${
                isCompact
                  ? "pb-1"
                  : "pb-2"
              }
            `}
          >
            <Link
              href="/settings"
              aria-label="Settings"
              title={
                collapsed
                  ? "Settings"
                  : undefined
              }
              style={{
                backgroundColor:
                  isActive(
                    "/settings",
                  )
                    ? activeColor
                    : "transparent",
              }}
              className={`
                flex
                items-center

                font-medium

                transition-all

                ${
                  isCompact
                    ? "rounded-lg px-2.5 py-2 text-[12px]"
                    : "rounded-xl px-3 py-2.5 text-sm"
                }

                ${
                  collapsed
                    ? "justify-center"
                    : "gap-3"
                }

                ${
                  isActive(
                    "/settings",
                  )
                    ? "text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }
              `}
            >
              <Settings
                size={
                  isMobile
                    ? 18
                    : isCompact
                      ? 16
                      : 18
                }
              />

              {!collapsed && (
                <span>
                  Settings
                </span>
              )}
            </Link>
          </div>
        )}

      {/* =====================================================
          LOGOUT
      ===================================================== */}

      {signedIn && (
        <div
          className={`
            shrink-0

            border-t
            border-stone-200

            ${
              isCompact
                ? "p-2"
                : "p-3"
            }
          `}
        >
          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            aria-label="Logout"
            title={
              collapsed
                ? "Logout"
                : undefined
            }
            className={`
              flex
              w-full
              items-center

              font-medium

              text-stone-500

              transition

              hover:bg-red-50
              hover:text-red-600

              ${
                isCompact
                  ? "rounded-lg px-2.5 py-2 text-[12px]"
                  : "rounded-xl px-3 py-2.5 text-sm"
              }

              ${
                collapsed
                  ? "justify-center"
                  : "gap-3"
              }
            `}
          >
            <LogOut
              size={
                isMobile
                  ? 17
                  : isCompact
                    ? 15
                    : 17
              }
            />

            {!collapsed && (
              <span>
                Logout
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}