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
  Briefcase,
  Settings,
  Loader2,
  LogOut,
  CircleDollarSign,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { toast } from "sonner";

import { supabase } from "../../lib/supabase";

import {
  useSettings,
} from "@/app/context/SettingsContext";

import NotificationBell from "@/app/components/NotificationBell";

// ============================================================
// TYPES
// ============================================================

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type SidebarSection = {
  title?: string;
  links: SidebarLink[];
};

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
      "Sidebar: SettingsContext missing"
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
      false
    );

  const [
    isCompact,
    setIsCompact,
  ] =
    useState(
      false
    );

  const [
    allowedSlugs,
    setAllowedSlugs,
  ] =
    useState<
      string[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    userRole,
    setUserRole,
  ] =
    useState<string>(
      "guest"
    );

  const [
    subscriptionTier,
    setSubscriptionTier,
  ] =
    useState<string>(
      "unpaid"
    );

  const [
    localColor,
    setLocalColor,
  ] =
    useState(
      "#a9b897"
    );

  // ==========================================================
  // TIER ACCESS
  // ==========================================================

  const tierLinks:
    Record<
      string,
      string[]
    > =
    {
      unpaid: [],

      starter: [
        "/dashboard",
        "/calendar",
        "/crm",
        "/notes",
        "/settings",
      ],

      professional: [
        "/dashboard",
        "/calendar",
        "/campaigns",
        "/crm",
        "/notes",
        "/projects",
        "/settings",
      ],

      elite: [
        "/dashboard",
        "/calendar",
        "/campaigns",
        "/crm",
        "/notes",
        "/projects",
        "/social",
        "/payments",
        "/settings",
      ],
    };

  // ==========================================================
  // ALL LINKS
  // ==========================================================

  const allLinks:
    SidebarLink[] =
    [
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
      },

      {
        href:
          "/campaigns",

        label:
          "Campaigns",

        icon:
          Megaphone,
      },

      {
        href:
          "/social",

        label:
          "Social",

        icon:
          Globe,
      },

      {
        href:
          "/payments",

        label:
          "Finance",

        icon:
          CircleDollarSign,
      },

      {
        href:
          "/notes",

        label:
          "Notes",

        icon:
          StickyNote,
      },

      {
        href:
          "/projects",

        label:
          "Clients & Projects",

        icon:
          Briefcase,
      },

      {
        href:
          "/calendar",

        label:
          "Calendar",

        icon:
          Calendar,
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
  // COMPACT MODE
  // ==========================================================

  useEffect(
    () => {
      function syncCompactMode() {
        setIsCompact(
          window.innerHeight <=
            820
        );
      }

      syncCompactMode();

      window.addEventListener(
        "resize",
        syncCompactMode
      );

      return () => {
        window.removeEventListener(
          "resize",
          syncCompactMode
        );
      };
    },
    []
  );

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function syncPermissions() {
        try {
          setLoading(
            true
          );

          const {
            data:
              sessionData,
          } =
            await supabase.auth.getSession();

          if (
            cancelled
          ) {
            return;
          }

          const user =
            sessionData
              ?.session
              ?.user;

          if (
            !user?.id
          ) {
            setUserRole(
              "guest"
            );

            setSubscriptionTier(
              "unpaid"
            );

            setAllowedSlugs(
              tierLinks.unpaid
            );

            return;
          }

          const [
            {
              data:
                profile,
            },

            permsResult,

            {
              data:
                membership,
            },
          ] =
            await Promise.all([
              supabase
                .from(
                  "profiles"
                )
                .select(
                  "role, brand_color, subscription_tier"
                )
                .eq(
                  "id",
                  user.id
                )
                .maybeSingle(),

              supabase
                .from(
                  "permissions"
                )
                .select(
                  "page_slug"
                )
                .eq(
                  "user_id",
                  user.id
                )
                .eq(
                  "can_access",
                  true
                ),

              supabase
                .from(
                  "team_members"
                )
                .select(
                  "role"
                )
                .eq(
                  "user_id",
                  user.id
                )
                .maybeSingle(),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          // ==================================================
          // ROLE
          // ==================================================

          const resolvedRole =
            (
              (
                membership
                  ?.role ||
                profile
                  ?.role ||
                "user"
              ) +
              ""
            )
              .toLowerCase()
              .trim();

          // ==================================================
          // TIER
          // ==================================================

          const tier =
            (
              profile
                ?.subscription_tier ||
              "unpaid"
            )
              .toString()
              .toLowerCase()
              .trim();

          setUserRole(
            resolvedRole
          );

          setSubscriptionTier(
            tier
          );

          // ==================================================
          // INDIVIDUAL PERMISSIONS
          // ==================================================

          const permsData =
            permsResult
              ?.data ??
            [];

          const permissionSlugs =
            Array.isArray(
              permsData
            )
              ? permsData
                  .filter(
                    (
                      permission:
                        any
                    ) =>
                      Boolean(
                        permission
                          ?.page_slug
                      )
                  )
                  .map(
                    (
                      permission:
                        any
                    ) =>
                      permission
                        .page_slug
                  )
              : [];

          // ==================================================
          // ADMIN / OWNER OVERRIDE
          // ==================================================

          const isAdmin =
            resolvedRole.includes(
              "admin"
            ) ||
            resolvedRole.includes(
              "owner"
            ) ||
            resolvedRole ===
              "superadmin";

          if (
            isAdmin
          ) {
            setAllowedSlugs(
              allLinks.map(
                (
                  link
                ) =>
                  link.href
              )
            );
          } else if (
            tier ===
            "elite"
          ) {
            setAllowedSlugs(
              tierLinks.elite
            );
          } else if (
            permissionSlugs.length >
            0
          ) {
            setAllowedSlugs(
              permissionSlugs
            );
          } else {
            setAllowedSlugs(
              tierLinks[
                tier
              ] ||
                tierLinks.unpaid
            );
          }

          // ==================================================
          // BRAND COLOUR
          // ==================================================

          if (
            profile
              ?.brand_color
          ) {
            setLocalColor(
              profile.brand_color
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Sidebar permission error:",
            error
          );

          if (
            !cancelled
          ) {
            setAllowedSlugs(
              tierLinks.unpaid
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      }

      void syncPermissions();

      return () => {
        cancelled =
          true;
      };
    },
    []
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
          await supabase.auth.signOut();

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          "Logged out successfully"
        );

        router.push(
          "/login"
        );

        router.refresh();
      } catch (
        error
      ) {
        console.error(
          "Logout error:",
          error
        );

        toast.error(
          "Unable to log out"
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
  // VISIBLE LINKS
  // ==========================================================

  const visibleLinks =
    allowedSlugs.length >
    0
      ? allLinks.filter(
          (
            link
          ) =>
            allowedSlugs.includes(
              link.href
            )
        )
      : allLinks;

  const canSee =
    (
      href:
        string
    ) =>
      visibleLinks.some(
        (
          link
        ) =>
          link.href ===
          href
      );

  // ==========================================================
  // SIDEBAR SECTIONS
  // ==========================================================

  const sections:
    SidebarSection[] =
    [
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
          "My Business",

        links: [
          {
            href:
              "/crm",

            label:
              "Contacts",

            icon:
              Users,
          },

          {
            href:
              "/campaigns",

            label:
              "Campaigns",

            icon:
              Megaphone,
          },

          {
            href:
              "/social",

            label:
              "Social",

            icon:
              Globe,
          },

          {
            href:
              "/payments",

            label:
              "Finance",

            icon:
              CircleDollarSign,
          },

          {
            href:
              "/notes",

            label:
              "Notes",

            icon:
              StickyNote,
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
          },
        ],
      },

      {
        title:
          "Planning",

        links: [
          {
            href:
              "/calendar",

            label:
              "Calendar",

            icon:
              Calendar,
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
        string
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
          `${href}/`
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
        z-50
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
            ? "w-20"
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
              ? "min-h-16 px-3"
              : "min-h-24 px-4"
          }
        `}
      >
        {/* ===================================================
            LOGO
        =================================================== */}

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
                isCompact
                  ? 28
                  : 34
              }
              height={
                isCompact
                  ? 28
                  : 34
              }
              priority
              className="object-contain"
            />
          </Link>
        )}

        {/* ===================================================
            HEADER ACTIONS
        =================================================== */}

        {!collapsed && (
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            {/* ===============================================
                NOTIFICATION BELL
            =============================================== */}

            <div
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
              "
            >
              <NotificationBell />
            </div>

            {/* ===============================================
                COLLAPSE SIDEBAR
            =============================================== */}

            <button
              type="button"
              onClick={() =>
                setCollapsed(
                  true
                )
              }
              title="Collapse sidebar"
              className="
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
              <PanelLeftClose
                size={17}
                strokeWidth={1.7}
              />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          COLLAPSED ACTIONS
      ===================================================== */}

      {collapsed && (
        <div className="shrink-0 space-y-2 px-3 pb-3">
          {/* NOTIFICATIONS */}

          <div className="flex justify-center">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <NotificationBell />
            </div>
          </div>

          {/* EXPAND */}

          <button
            type="button"
            onClick={() =>
              setCollapsed(
                false
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
        className={`
          flex-1
          px-3

          ${
            isCompact
              ? "mt-1 overflow-y-auto pb-2"
              : "mt-3 overflow-y-auto pb-4"
          }
        `}
      >
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2
              size={20}
              className="animate-spin text-stone-400"
            />
          </div>
        ) : (
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
                sectionIndex
              ) => {
                const sectionLinks =
                  section.links.filter(
                    (
                      link
                    ) =>
                      canSee(
                        link.href
                      )
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
                    {/* =========================================
                        SECTION LABEL
                    ========================================= */}

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

                    {/* =========================================
                        LINKS
                    ========================================= */}

                    <div
                      className={
                        isCompact
                          ? "space-y-0.5"
                          : "space-y-1"
                      }
                    >
                      {sectionLinks.map(
                        (
                          item
                        ) => {
                          const active =
                            isActive(
                              item.href
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
                                    ? "rounded-lg px-2.5 py-1.5 text-[12px]"
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
                                  isCompact
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
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </nav>

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      {!loading &&
        canSee(
          "/settings"
        ) && (
          <div
            className={`
              shrink-0
              px-3

              ${
                isCompact
                  ? "pb-1"
                  : "pb-2"
              }
            `}
          >
            <Link
              href="/settings"
              title={
                collapsed
                  ? "Settings"
                  : undefined
              }
              style={{
                backgroundColor:
                  isActive(
                    "/settings"
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
                    ? "rounded-lg px-2.5 py-1.5 text-[12px]"
                    : "rounded-xl px-3 py-2.5 text-sm"
                }

                ${
                  collapsed
                    ? "justify-center"
                    : "gap-3"
                }

                ${
                  isActive(
                    "/settings"
                  )
                    ? "text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }
              `}
            >
              <Settings
                size={
                  isCompact
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
                ? "rounded-lg px-2.5 py-1.5 text-[12px]"
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
              isCompact
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
    </aside>
  );
}