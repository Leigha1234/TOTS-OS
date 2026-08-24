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
    isMobile,
    setIsMobile,
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
  // STORE IS INCLUDED FOR ALL SIGNED-IN USERS.
  //
  // /store itself decides whether to show:
  //
  // - Store dashboard
  // - or £39/month Store upgrade screen
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
          mobile
        );

        setIsCompact(
          mobile ||
          compactHeight
        );

        // ====================================================
        // MOBILE SIDEBAR
        //
        // Keep mobile narrow so every icon remains accessible.
        // ====================================================

        if (
          mobile
        ) {
          setCollapsed(
            true
          );
        }
      }

      syncResponsiveMode();

      window.addEventListener(
        "resize",
        syncResponsiveMode
      );

      return () => {
        window.removeEventListener(
          "resize",
          syncResponsiveMode
        );
      };
    },
    []
  );

  // ==========================================================
  // SESSION + BRAND COLOUR
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
          // Only used for brand colour.
          //
          // Navigation must not disappear if this fails.
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
      // STORE APPEARS ON DESKTOP + MOBILE.
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

        {/* ===================================================
            DESKTOP COLLAPSE CONTROL
        =================================================== */}

        {!collapsed &&
          !isMobile && (
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

      {collapsed &&
        !isMobile && (
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
      //
      // IMPORTANT:
      // Always scrollable so Store cannot be pushed off-screen
      // on smaller phones.
      // ===================================================== */}

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
                    "/settings"
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