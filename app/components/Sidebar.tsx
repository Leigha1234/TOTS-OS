"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useSettings } from "@/app/context/SettingsContext";
import {
  LayoutDashboard,
  Users,
  Menu,
  Calendar,
  Megaphone,
  StickyNote,
  Globe,
  Briefcase,
  Settings,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

/**
 * FIXED SIDEBAR:
 * - Hardened Supabase responses
 * - Fixed null/undefined crashes
 * - Fixed role/tier enforcement
 * - Admin/elite always full access
 */

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  let context: any = null;
  try {
    context = useSettings();
  } catch {
    console.warn("Sidebar: SettingsContext missing");
  }

  const [collapsed, setCollapsed] = useState(false);
  const [allowedSlugs, setAllowedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [subscriptionTier, setSubscriptionTier] = useState<string>("unpaid");
  const [localColor, setLocalColor] = useState("#a9b897");

  const tierLinks: Record<string, string[]> = {
    unpaid: [],
    starter: ["/dashboard", "/calendar", "/crm", "/notes", "/settings"],
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
      "/settings",
    ],
  };

  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    async function syncPermissions() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user?.id) {
          setUserRole("guest");
          setSubscriptionTier("unpaid");
          setAllowedSlugs(tierLinks.unpaid);
          setLoading(false);
          return;
        }

        const [{ data: profile }, permsResult, { data: membership }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("role, brand_color, subscription_tier")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("permissions")
              .select("page_slug")
              .eq("user_id", user.id)
              .eq("can_access", true),

            supabase
              .from("team_members")
              .select("role")
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);

        const resolvedRole = (
  (membership?.role || profile?.role || "user") + ""
)
  .toLowerCase()
  .trim();

        const tier = (profile?.subscription_tier || "unpaid")
  .toString()
  .toLowerCase()
  .trim();

        setUserRole(resolvedRole);
        setSubscriptionTier(tier);

        const permsData = permsResult?.data ?? [];

        const permissionSlugs = Array.isArray(permsData)
          ? permsData
              .filter((p: any) => p?.page_slug)
              .map((p: any) => p.page_slug)
          : [];

        // ✅ HARD OVERRIDE: admin/owner ALWAYS full access
        const isAdmin =
  resolvedRole.includes("admin") ||
  resolvedRole.includes("owner") ||
  resolvedRole === "superadmin";

if (isAdmin) {
  setAllowedSlugs(allLinks.map((l) => l.href));
} else if (tier === "elite") {
          setAllowedSlugs(tierLinks.elite);
        } else if (!isAdmin && permissionSlugs.length > 0) {
  setAllowedSlugs(permissionSlugs);
} else {
          setAllowedSlugs(tierLinks[tier] || tierLinks.unpaid);
        }

        if (profile?.brand_color) {
          setLocalColor(profile.brand_color);
        }
      } catch (err) {
        console.error("Sidebar permission error:", err);
        setAllowedSlugs(tierLinks.unpaid);
      } finally {
        setLoading(false);
      }
    }

    syncPermissions();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Unable to log out");
    }
  };

  const activeColor = context?.settings?.brandColor || localColor;

  const visibleLinks =
    allowedSlugs.length > 0
      ? allLinks.filter((l) => allowedSlugs.includes(l.href))
      : allLinks;

  return (
    <aside
      className={`flex flex-col h-screen bg-stone-50 border-r border-stone-200
      transition-all duration-500 z-50
      ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 h-24">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Image
              src="/images/TOTS-favicon.jpeg"
              alt="logo"
              width={40}
              height={40}
            />
            <h1 className="font-black text-xs">TOTS-OS</h1>
          </div>
        ) : (
          <Image
            src="/images/TOTS-OS.jpeg"
            alt="logo"
            width={32}
            height={32}
          />
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 mx-4 rounded hover:bg-stone-200"
      >
        <Menu size={14} />
      </button>

      {/* NAV */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {loading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          visibleLinks.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  backgroundColor: active ? activeColor : "transparent",
                }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  active ? "text-white" : "text-stone-600"
                }`}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500"
        >
          <LogOut size={16} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}