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

// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  let context: any =
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
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    signedIn,
    setSignedIn,
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
  // ALL LINKS
  //
  // IMPORTANT:
  //
  // Store is shown in navigation like any other area.
  //
  // Store access itself is controlled by /store.
  //
  // If the organisation has not purchased the £39/month
  // Store add-on, /store displays the upgrade screen.
  //
  // This prevents the sidebar itself from accidentally
  // disappearing because of subscription / permission data.
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
  // SESSION + BRAND COLOUR
  //
  // Sidebar visibility now only depends on whether the user
  // is authenticated.
  //
  // Plan / feature restrictions should be enforced by the
  // destination page, not by hiding the navigation entirely.
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadSidebarContext() {
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

            error:
              sessionError,
          } =
            await supabase.auth.getSession();

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
              sessionError
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
              false
            );

            return;
          }

          setSignedIn(
            true
          );

          // ==================================================
          // PROFILE
          //
          // We only need the brand colour here.
          //
          // Do NOT make navigation visibility depend on this
          // query succeeding.
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
                  "profiles"
                )
                .select(
                  "brand_color"
                )
                .eq(
                  "id",
                  user.id
                )
                .maybeSingle();

            if (
              profileError
            ) {
              console.warn(
                "Sidebar profile load error:",
                profileError
              );
            }

            if (
              !cancelled &&
              profile
                ?.brand_color
            ) {
              setLocalColor(
                String(
                  profile.brand_color
                )
              );
            }
          } catch (
            profileError
          ) {
            console.warn(
              "Sidebar profile lookup failed:",
              profileError
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Sidebar load error:",
            error
          );

          if (
            !cancelled
          ) {
            /*
             * Do not leave a previously authenticated sidebar
             * permanently stuck on the loading state.
             */
            setSignedIn(
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

      void loadSidebarContext();

      // ======================================================
      // AUTH STATE CHANGES
      //
      // Keeps the sidebar in sync if the session changes.
      // ======================================================

      const {
        data:
          authListener,
      } =
        supabase.auth.onAuthStateChange(
          (
            _event,
            session
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setSignedIn(
              Boolean(
                session?.user?.id
              )
            );
          }
        );

      return () => {
        cancelled =
          true;

        authListener
          .subscription
          .unsubscribe();
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

        setSignedIn(
          false
        );

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
  // All standard navigation is visible to an authenticated
  // TOTS-OS user.
  //
  // Store is deliberately included.
  //
  // The /store page decides whether to show:
  //
  // - the £39/month Store upgrade screen
  // - or the actual Store dashboard
  // ==========================================================

  const visibleLinks =
    signedIn
      ? allLinks
      : [];

  // ==========================================================
  // CAN SEE
  // ==========================================================

  const canSee =
    (
      href:
        string
    ) => {
      if (
        !signedIn
      ) {
        return false;
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
      // Store is always visible to signed-in users.
      //
      // If they do not own the Store add-on, clicking it opens
      // the £39/month upgrade page.
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
        ) : null}
      </nav>

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      {!loading &&
        signedIn &&
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
      )}
    </aside>
  );
}