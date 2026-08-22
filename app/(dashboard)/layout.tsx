"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Briefcase,
  Calendar,
  Globe,
  LayoutDashboard,
  Megaphone,
  Menu,
  Settings,
  StickyNote,
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
// TYPES
// ============================================================

type DashboardLayoutProps = {
  children: ReactNode;
};

type DashboardLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MobileNavSection = {
  title?: string;
  links: DashboardLink[];
};

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
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false
    );

  const pathname =
    usePathname();

  const {
    mobileNav = [
      "/dashboard",
      "/clarity",
      "/calendar",
    ],

    fontFamily =
      "Inter",
  } =
    useSettings();

  // ==========================================================
  // ALL LINKS
  // ==========================================================

  const allLinks:
    DashboardLink[] =
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
          "/calendar",

        label:
          "Calendar",

        icon:
          Calendar,
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
          "/notes",

        label:
          "Notes",

        icon:
          StickyNote,
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
          "/projects",

        label:
          "Projects",

        icon:
          Briefcase,
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
          Briefcase,
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
  // MOBILE SECTIONS
  // ==========================================================

  const mobileSections:
    MobileNavSection[] =
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
              Briefcase,
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
              Briefcase,
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
  // PINNED MOBILE LINKS
  // ==========================================================

  const pinnedMobileLinks =
    allLinks
      .filter(
        (
          link
        ) =>
          mobileNav?.includes(
            link.href
          )
      )
      .slice(
        0,
        3
      );

  // ==========================================================
  // LOCK BODY WHEN MOBILE MENU IS OPEN
  // ==========================================================

  useEffect(
    () => {
      document.body.style.overflow =
        mobileMenuOpen
          ? "hidden"
          : "";

      return () => {
        document.body.style.overflow =
          "";
      };
    },
    [
      mobileMenuOpen,
    ]
  );

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
          `'${fontFamily}', sans-serif`,
      }}
    >
      {/* ======================================================
          DESKTOP SIDEBAR

          Desktop notification bell is entirely handled by
          Sidebar.tsx.
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
          MAIN CONTENT AREA
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
            SCROLLABLE PAGE CONTENT
        ==================================================== */}

        <div
          data-tour="dashboard-content"
          className="
            flex-1
            overflow-x-hidden
            overflow-y-auto
            p-4
            pb-32
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

        <nav
          data-tour="mobile-navigation"
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-[90]

            flex
            h-14
            items-center
            justify-between

            border-t
            border-stone-100

            bg-white/90

            px-3
            pb-safe

            backdrop-blur-2xl

            md:hidden
          "
        >
          {pinnedMobileLinks.map(
            (
              link
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
                    `${link.href}/`
                  )
                }
              />
            )
          )}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            className="
              flex
              flex-col
              items-center
              gap-1

              text-stone-400

              transition-colors

              active:scale-90
            "
            aria-label="Open menu"
          >
            <Menu
              size={
                18
              }
              strokeWidth={
                1.5
              }
            />

            <span
              className="
                text-[7px]
                font-black
                uppercase
                tracking-tighter
              "
            >
              More
            </span>
          </button>
        </nav>

        {/* ====================================================
            CLARITY ASSISTANT

            Clarity is intentionally rendered BEFORE the
            mobile menu overlay.
        ==================================================== */}

        <Clarity />

        {/* ====================================================
            CLARITY PRODUCT TOUR
        ==================================================== */}

        <ClarityTourOverlay />

        {/* ====================================================
            MOBILE FULL-SCREEN MENU

            Notification bell only exists here for mobile.
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

                overflow-y-auto

                bg-[#fcfaf7]

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
                    MOBILE MENU HEADER
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
                  {/* ==========================================
                      LOGO
                  ========================================== */}

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

                  {/* ==========================================
                      MOBILE HEADER ACTIONS
                  ========================================== */}

                  <div
                    className="
                      relative
                      z-[7000]

                      flex
                      items-center
                      gap-2
                    "
                  >
                    {/* ========================================
                        MOBILE NOTIFICATION BELL
                    ======================================== */}

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

                    {/* ========================================
                        CLOSE MOBILE MENU
                    ======================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        setMobileMenuOpen(
                          false
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

                        shadow-sm

                        transition-transform

                        active:scale-95
                      "
                      aria-label="Close menu"
                    >
                      <X
                        size={
                          20
                        }
                        className="
                          text-stone-900
                        "
                      />
                    </button>
                  </div>
                </div>

                {/* ============================================
                    NOTIFICATION INFORMATION
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
                    py-3

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
                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          text-[8px]
                          font-black
                          uppercase
                          tracking-[0.2em]
                          text-stone-400
                        "
                      >
                        Notifications
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
                        Orders, deadlines,
                        payments and business
                        updates.
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
                    MOBILE MENU LINKS
                ============================================ */}

                <div
                  data-tour="mobile-system-menu"
                  className="
                    relative
                    z-[50]
                    space-y-5
                  "
                >
                  {mobileSections.map(
                    (
                      section,
                      index
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

                              text-[8px]
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
                              link
                            ) => {
                              const Icon =
                                link.icon;

                              const isActive =
                                pathname ===
                                  link.href ||
                                pathname.startsWith(
                                  `${link.href}/`
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
                                      false
                                    )
                                  }
                                  data-tour={`nav-${link.label
                                    .toLowerCase()
                                    .replaceAll(
                                      " ",
                                      "-"
                                    )}`}
                                  className={`
                                    flex
                                    h-20
                                    flex-col
                                    justify-between

                                    rounded-[1.4rem]

                                    border

                                    p-3

                                    transition-all
                                    duration-300

                                    ${
                                      isActive
                                        ? "scale-[1.01] border-stone-200 bg-white shadow-md"
                                        : "border-stone-100 bg-white/60 hover:bg-white active:scale-95"
                                    }
                                  `}
                                >
                                  <div
                                    style={{
                                      color:
                                        isActive
                                          ? "var(--brand-primary)"
                                          : "#d6d3d1",
                                    }}
                                  >
                                    <Icon
                                      size={
                                        18
                                      }
                                      strokeWidth={
                                        1.5
                                      }
                                    />
                                  </div>

                                  <span
                                    className={`
                                      text-[7px]
                                      font-black
                                      uppercase
                                      tracking-[0.18em]

                                      ${
                                        isActive
                                          ? "text-stone-900"
                                          : "text-stone-400"
                                      }
                                    `}
                                  >
                                    {
                                      link.label
                                    }
                                  </span>
                                </Link>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )
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
          "-"
        )}`}
      className="
        flex
        flex-col
        items-center
        gap-1

        transition-all
        duration-300

        active:scale-90
      "
      style={{
        color:
          isActive
            ? "var(--brand-primary)"
            : "#d6d3d1",
      }}
    >
      <Icon
        size={
          22
        }
        strokeWidth={
          isActive
            ? 2.5
            : 1.5
        }
      />

      <span
        className={`
          text-[7px]
          font-black
          uppercase
          tracking-tighter

          ${
            isActive
              ? "opacity-100"
              : "opacity-60"
          }
        `}
      >
        {
          label
        }
      </span>

      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="
            mt-0.5
            h-1
            w-1
            rounded-full
          "
          style={{
            backgroundColor:
              "var(--brand-primary)",
          }}
        />
      )}
    </Link>
  );
}