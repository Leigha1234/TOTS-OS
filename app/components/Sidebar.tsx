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

type OrganisationStoreAccess = {
  id: string;

  store_enabled:
    | boolean
    | null;

  store_subscription_status:
    | string
    | null;
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
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    storeEnabled,
    setStoreEnabled,
  ] =
    useState(
      false
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
  //
  // IMPORTANT:
  //
  // Store is NOT part of any subscription tier.
  //
  // Store is a separate £39/month add-on.
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

      standard: [
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
  //
  // Store exists here so it can render in the sidebar,
  // but access is controlled independently by storeEnabled.
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
          "/store",

        label:
          "Store",

        icon:
          Store,
      },

      {
        href:
          "/projects",

        label:
          "Clients & Projects",

        icon:
          Building2,
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

          // ==================================================
          // SESSION
          // ==================================================

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

            setOrganisationId(
              null
            );

            setStoreEnabled(
              false
            );

            setAllowedSlugs(
              []
            );

            return;
          }

          // ==================================================
          // PROFILE + PERMISSIONS + MEMBERSHIP
          // ==================================================

          const [
            profileResult,
            permsResult,
            membershipResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "profiles"
                )
                .select(
                  `
                    role,
                    brand_color,
                    subscription_tier,
                    organisation_id
                  `
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
                  `
                    role,
                    organisation_id
                  `
                )
                .eq(
                  "user_id",
                  user.id
                )
                .limit(
                  1
                )
                .maybeSingle(),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          const profile =
            profileResult.data;

          const membership =
            membershipResult.data;

          if (
            profileResult.error
          ) {
            console.warn(
              "Sidebar profile load error:",
              profileResult.error
            );
          }

          if (
            membershipResult.error
          ) {
            console.warn(
              "Sidebar team membership load error:",
              membershipResult.error
            );
          }

          if (
            permsResult.error
          ) {
            console.warn(
              "Sidebar permissions load error:",
              permsResult.error
            );
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

          setUserRole(
            resolvedRole
          );

          // ==================================================
          // ORGANISATION
          // ==================================================

          let resolvedOrganisationId =
            (
              profile
                ?.organisation_id ||
              membership
                ?.organisation_id ||
              ""
            )
              .toString()
              .trim();

          // ==================================================
          // FALLBACK:
          // USER_ORGANISATIONS
          // ==================================================

          if (
            !resolvedOrganisationId
          ) {
            try {
              const {
                data:
                  userOrganisationRows,

                error:
                  userOrganisationError,
              } =
                await supabase
                  .from(
                    "user_organisations"
                  )
                  .select(
                    "organisation_id"
                  )
                  .eq(
                    "user_id",
                    user.id
                  )
                  .limit(
                    1
                  );

              if (
                userOrganisationError
              ) {
                console.warn(
                  "Sidebar user_organisations lookup failed:",
                  userOrganisationError
                );
              } else {
                resolvedOrganisationId =
                  (
                    userOrganisationRows?.[0]
                      ?.organisation_id ||
                    ""
                  )
                    .toString()
                    .trim();
              }
            } catch (
              error
            ) {
              console.warn(
                "Sidebar user_organisations fallback failed:",
                error
              );
            }
          }

          // ==================================================
          // FALLBACK:
          // ORGANISATION_MEMBERS
          // ==================================================

          if (
            !resolvedOrganisationId
          ) {
            try {
              const {
                data:
                  organisationMemberRows,

                error:
                  organisationMemberError,
              } =
                await supabase
                  .from(
                    "organisation_members"
                  )
                  .select(
                    "organisation_id"
                  )
                  .eq(
                    "user_id",
                    user.id
                  )
                  .limit(
                    1
                  );

              if (
                organisationMemberError
              ) {
                console.warn(
                  "Sidebar organisation_members lookup failed:",
                  organisationMemberError
                );
              } else {
                resolvedOrganisationId =
                  (
                    organisationMemberRows?.[0]
                      ?.organisation_id ||
                    ""
                  )
                    .toString()
                    .trim();
              }
            } catch (
              error
            ) {
              console.warn(
                "Sidebar organisation_members fallback failed:",
                error
              );
            }
          }

          setOrganisationId(
            resolvedOrganisationId ||
              null
          );

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
                  .map(
                    (
                      permission:
                        any
                    ) =>
                      String(
                        permission
                          ?.page_slug ||
                        ""
                      ).trim()
                  )
                  .filter(
                    Boolean
                  )
              : [];

          // ==================================================
          // NEVER ALLOW GENERAL PERMISSIONS TO UNLOCK STORE
          // ==================================================

          const corePermissionSlugs =
            permissionSlugs.filter(
              (
                slug
              ) =>
                slug !==
                "/store"
            );

          // ==================================================
          // ADMIN / OWNER
          //
          // Gets all core TOTS modules.
          //
          // Store remains separate.
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

          let resolvedAllowedSlugs:
            string[] =
            [];

          if (
            isAdmin
          ) {
            resolvedAllowedSlugs =
              allLinks
                .filter(
                  (
                    link
                  ) =>
                    link.href !==
                    "/store"
                )
                .map(
                  (
                    link
                  ) =>
                    link.href
                );
          } else {
            // ==================================================
            // BASE TIER ACCESS
            // ==================================================

            const tierAccess =
              tierLinks[
                tier
              ] ||
              tierLinks.unpaid;

            // ==================================================
            // ADD EXPLICIT USER PERMISSIONS
            //
            // Important:
            // permissions should add to tier access rather than
            // replace the user's entire sidebar.
            // ==================================================

            resolvedAllowedSlugs =
              Array.from(
                new Set([
                  ...tierAccess,
                  ...corePermissionSlugs,
                ])
              );
          }

          // ==================================================
          // SAFETY FALLBACK
          //
          // A signed-in user should never end up with a totally
          // blank sidebar because one permission record is bad.
          // ==================================================

          if (
            resolvedAllowedSlugs.length ===
            0 &&
            tier !==
            "unpaid"
          ) {
            resolvedAllowedSlugs =
              [
                "/dashboard",
                "/settings",
              ];
          }

          setAllowedSlugs(
            resolvedAllowedSlugs
          );

          // ==================================================
          // STORE ADD-ON
          //
          // This reads the same organisations.store_enabled
          // value used by the £39/month Store subscription.
          // ==================================================

          if (
            resolvedOrganisationId
          ) {
            try {
              const {
                data:
                  organisation,

                error:
                  organisationError,
              } =
                await supabase
                  .from(
                    "organisations"
                  )
                  .select(
                    `
                      id,
                      store_enabled,
                      store_subscription_status
                    `
                  )
                  .eq(
                    "id",
                    resolvedOrganisationId
                  )
                  .maybeSingle();

              if (
                organisationError
              ) {
                console.warn(
                  "Sidebar Store subscription lookup failed:",
                  organisationError
                );

                setStoreEnabled(
                  false
                );
              } else {
                const storeAccess =
                  organisation as
                    | OrganisationStoreAccess
                    | null;

                const status =
                  (
                    storeAccess
                      ?.store_subscription_status ||
                    ""
                  )
                    .toString()
                    .toLowerCase()
                    .trim();

                const statusAllowsAccess =
                  [
                    "active",
                    "trialing",
                    "trial",
                  ].includes(
                    status
                  );

                const enabled =
                  storeAccess
                    ?.store_enabled ===
                    true &&
                  (
                    !status ||
                    statusAllowsAccess
                  );

                setStoreEnabled(
                  enabled
                );
              }
            } catch (
              storeError
            ) {
              console.error(
                "Sidebar Store access check failed:",
                storeError
              );

              setStoreEnabled(
                false
              );
            }
          } else {
            setStoreEnabled(
              false
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
            // ==================================================
            // DO NOT BLANK THE WHOLE SIDEBAR
            // ==================================================

            setAllowedSlugs([
              "/dashboard",
              "/settings",
            ]);

            setStoreEnabled(
              false
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
  //
  // Core modules = subscription tier / permissions.
  //
  // Store = separate £39/month add-on.
  // ==========================================================

  const visibleLinks =
    allLinks.filter(
      (
        link
      ) => {
        if (
          link.href ===
          "/store"
        ) {
          return storeEnabled;
        }

        return allowedSlugs.includes(
          link.href
        );
      }
    );

  // ==========================================================
  // CAN SEE
  // ==========================================================

  const canSee =
    (
      href:
        string
    ) => {
      if (
        href ===
        "/store"
      ) {
        return storeEnabled;
      }

      return visibleLinks.some(
        (
          link
        ) =>
          link.href ===
          href
      );
    };

  // ==========================================================
  // SIDEBAR SECTIONS
  // ==========================================================

  const sections:
    SidebarSection[] =
    [
      // ======================================================
      // HOME
      // ======================================================

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

      // ======================================================
      // MY BUSINESS
      // ======================================================

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

      // ======================================================
      // COMMERCE
      //
      // Only renders when Store add-on is active.
      // ======================================================

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
          },
        ],
      },

      // ======================================================
      // CLIENTS & PROJECTS
      // ======================================================

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

      // ======================================================
      // PLANNING
      // ======================================================

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
        z-[300]

        flex
        h-[100dvh]
        flex-col

        overflow-visible

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
            COLLAPSE CONTROL
        =================================================== */}

        {!collapsed && (
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

      {collapsed && (
        <div className="shrink-0 px-3 pb-3">
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
              : "mt-2 overflow-y-auto pb-4"
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