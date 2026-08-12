"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

import { useSettings } from "@/app/context/SettingsContext";

import {
  ClarityTourProvider,
} from "./claritytour/ClarityTourProvider";

import ClarityTourOverlay from "./claritytour/ClarityTourOverlay";

type DashboardLayoutProps = {
  children: ReactNode;
};

type DashboardLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

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
    mobileNav = [
      "/dashboard",
      "/clarity",
      "/calendar",
    ],
    fontFamily = "Inter",
  } = useSettings();

  const allLinks: DashboardLink[] = [
    {
      href: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/crm",
      label: "Contacts",
      icon: Users,
    },
    {
      href: "/notes",
      label: "Notes",
      icon: StickyNote,
    },
    {
      href: "/campaigns",
      label: "Campaigns",
      icon: Megaphone,
    },
    {
      href: "/projects",
      label: "Projects",
      icon: Briefcase,
    },
    {
      href: "/social",
      label: "Social",
      icon: Globe,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const pinnedMobileLinks =
    allLinks
      .filter((link) =>
        mobileNav?.includes(
          link.href
        )
      )
      .slice(0, 3);

  useEffect(() => {
    document.body.style.overflow =
      mobileMenuOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileMenuOpen]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#fcfaf7]"
      style={{
        fontFamily: `'${fontFamily}', sans-serif`,
      }}
    >
      {/* =========================================
          DESKTOP SIDEBAR
      ========================================= */}

      <aside
        data-tour="dashboard-navigation"
        className="hidden h-full flex-shrink-0 md:block"
      >
        <Sidebar />
      </aside>

      {/* =========================================
          MAIN CONTENT AREA
      ========================================= */}

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <div
          data-tour="dashboard-content"
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-32 md:p-12 md:pb-12"
        >
          {children}

          <Footer />
        </div>

        {/* =========================================
            MOBILE BOTTOM NAV
        ========================================= */}

        <nav
          data-tour="mobile-navigation"
          className="fixed bottom-0 left-0 right-0 z-[90] flex h-20 items-center justify-between border-t border-stone-100 bg-white/80 px-8 pb-safe backdrop-blur-2xl md:hidden"
        >
          {pinnedMobileLinks.map(
            (link) => (
              <MobileNavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={
                  pathname ===
                  link.href
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
            className="flex flex-col items-center gap-1 text-stone-400 transition-colors active:scale-90"
          >
            <Menu
              size={22}
              strokeWidth={1.5}
            />

            <span className="text-[7px] font-black uppercase tracking-tighter">
              System
            </span>
          </button>
        </nav>

        {/* =========================================
            MOBILE FULL-SCREEN MENU
        ========================================= */}

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{
                y: "100%",
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: "100%",
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed inset-0 z-[200] overflow-y-auto bg-[#fcfaf7]"
            >
              <div className="min-h-full p-8 pb-32">
                {/* HEADER */}

                <div className="mb-12 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src="/images/tots-os%20favicon.png"
                        alt="TOTS-OS"
                        className="h-10 w-10 rounded-xl object-contain"
                      />

                      <span className="font-serif text-4xl italic tracking-tighter text-stone-900">
                        TOTS-OS
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileMenuOpen(
                        false
                      )
                    }
                    className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm transition-transform active:scale-95"
                  >
                    <X
                      size={24}
                      className="text-stone-900"
                    />
                  </button>
                </div>

                {/* APP GRID */}

                <div
                  data-tour="mobile-system-menu"
                  className="grid grid-cols-2 gap-4"
                >
                  {allLinks.map(
                    (link) => {
                      const Icon =
                        link.icon;

                      const isActive =
                        pathname ===
                        link.href;

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
                          className={`flex h-32 flex-col justify-between rounded-[2.5rem] border p-6 transition-all duration-300 ${
                            isActive
                              ? "scale-[1.02] border-stone-200 bg-white shadow-xl"
                              : "border-stone-100 bg-white/50 hover:bg-white active:scale-95"
                          }`}
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
                              size={24}
                              strokeWidth={
                                1.5
                              }
                            />
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              isActive
                                ? "text-stone-900"
                                : "text-stone-400"
                            }`}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================
            EXISTING CLARITY ASSISTANT
        ========================================= */}

        <Clarity />

        {/* =========================================
            CLARITY PRODUCT TOUR
        ========================================= */}

        <ClarityTourOverlay />
      </main>
    </div>
  );
}

/* ==================================================
   MOBILE NAV ITEM
================================================== */

function MobileNavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      data-tour={`mobile-nav-${label
        .toLowerCase()
        .replaceAll(
          " ",
          "-"
        )}`}
      className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-90"
      style={{
        color: isActive
          ? "var(--brand-primary)"
          : "#d6d3d1",
      }}
    >
      <Icon
        size={22}
        strokeWidth={
          isActive
            ? 2.5
            : 1.5
        }
      />

      <span
        className={`text-[7px] font-black uppercase tracking-tighter ${
          isActive
            ? "opacity-100"
            : "opacity-60"
        }`}
      >
        {label}
      </span>

      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="mt-0.5 h-1 w-1 rounded-full"
          style={{
            backgroundColor:
              "var(--brand-primary)",
          }}
        />
      )}
    </Link>
  );
}