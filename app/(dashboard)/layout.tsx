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
// FALLBACK MOBILE NAV
// ============================================================

const FALLBACK_MOBILE_NAV = [
  "/dashboard",
  "/projects",
  "/calendar",
];

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
  ] = useState(false);

  const pathname =
    usePathname();

  const {
    mobileNav,
    fontFamily,
  } =
    useSettings();

  // ==========================================================
  // ALL LINKS
  // ==========================================================

  const allLinks:
    DashboardLink[] = [
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
  // RESOLVE MOBILE NAV
  //
  // IMPORTANT:
  // Map through mobileNav first rather than filtering allLinks.
  //
  // That means:
  //
  // ["/calendar", "/dashboard", "/projects"]
  //
  // actually renders:
  //
  // Calendar → Home → Projects
  //
  // instead of reverting to allLinks order.
  // ==========================================================

  const requestedMobileNav =
    Array.isArray(
      mobileNav
    ) &&
    mobileNav.length ===
      3
      ? mobileNav
      : FALLBACK_MOBILE_NAV;

  const pinnedMobileLinks =
    requestedMobileNav
      .map(
        (
          href
        ) =>
          allLinks.find(
            (
              link
            ) =>
              link.href ===
              href
          )
      )
      .filter(
        (
          link
        ): link is DashboardLink =>
          Boolean(
            link
          )
      )
      .slice(
        0,
        3
      );

  // ==========================================================
  // SAFE FALLBACK
  // ==========================================================

  const fallbackMobileLinks =
    FALLBACK_MOBILE_NAV
      .map(
        (
          href
        ) =>
          allLinks.find(
            (
              link
            ) =>
              link.href ===
              href
          )
      )
      .filter(
        (
          link
        ): link is DashboardLink =>
          Boolean(
            link
          )
      );

  const finalPinnedMobileLinks =
    pinnedMobileLinks.length ===
    3
      ? pinnedMobileLinks
      : fallbackMobileLinks;

  // ==========================================================
  // MORE ACTIVE STATE
  //
  // More becomes active whenever the current page isn't one
  // of the user's three pinned shortcuts.
  // ==========================================================

  const isMoreActive =
    !finalPinnedMobileLinks.some(
      (
        link
      ) =>
        pathname ===
          link.href ||
        pathname.startsWith(
          `${link.href}/`
        )
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
        document.body.style
          .overflow;

      const previousOverscroll =
        document.body.style
          .overscrollBehavior;

      document.body.style.overflow =
        "hidden";

      document.body.style.overscrollBehavior =
        "none";

      return () => {
        document.body.style.overflow =
          previousOverflow;

        document.body.style.overscrollBehavior =
          previousOverscroll;
      };
    },
    [
      mobileMenuOpen,
    ]
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
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setMobileMenuOpen(
              false
            );
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
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
          {/* ================================================
              CLARITY
          ================================================ */}

          <div
            className="
              pointer-events-auto
            "
          >
            <Clarity />
          </div>

          {/* ================================================
              NOTIFICATIONS
          ================================================ */}

          {!mobileMenuOpen && (
            <div
              className="
                pointer-events-auto
              "
            >
              <NotificationBell />
            </div>
          )}
        </div>

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

            {/* ================================================
                MORE BUTTON
            ================================================ */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  true
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
            CLARITY PRODUCT TOUR
        ==================================================== */}

        <ClarityTourOverlay />

        {/* ====================================================
            MOBILE FULL-SCREEN MENU
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
                    MENU INTRO
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
                    <div
                      className="
                        min-w-0
                      "
                    >
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
                        Access every area of TOTS-OS from here.
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

                              const isPinned =
                                finalPinnedMobileLinks.some(
                                  (
                                    pinned
                                  ) =>
                                    pinned.href ===
                                    link.href
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
                                      isActive
                                        ? "border-[#a9b897]/60 bg-white shadow-md"
                                        : "border-stone-100 bg-white/60 hover:border-stone-200 hover:bg-white"
                                    }
                                  `}
                                >
                                  {/* PINNED DOT */}

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
                                        isActive
                                          ? "var(--brand-primary, #829473)"
                                          : "#a8a29e",
                                    }}
                                  >
                                    <Icon
                                      size={
                                        19
                                      }
                                      strokeWidth={
                                        isActive
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
                                        isActive
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