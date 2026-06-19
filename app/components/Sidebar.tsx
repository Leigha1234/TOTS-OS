"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  LayoutDashboard, Users, Menu, Calendar, Megaphone, 
  StickyNote, Globe,
  Briefcase, Settings, Loader2, LogOut
} from "lucide-react";
import { toast } from "sonner";


/**
 * TOTS OS SIDEBAR v7.1.6
 * REVISION: DEPRECATION OF CLARITY MODULE & UK ENGLISH BUSINESS METADATA
 */

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  let context: any = null;
  try {
    context = useSettings();
  } catch (e) {
    console.warn("Sidebar: SettingsContext not found. Falling back to local data retrieval.");
  }

  const [collapsed, setCollapsed] = useState(false);
  const [allowedSlugs, setAllowedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  const tierLinks: Record<string, string[]> = {
    unpaid: [],
    starter: [
      "/dashboard",
      "/calendar",
      "/crm",
      "/notes",
      "/settings"
    ],
    professional: [
      "/dashboard",
      "/calendar",
      "/campaigns",
      "/crm",
      "/notes",
      "/projects",
      "/settings"
    ],
    elite: [
      "/dashboard",
      "/calendar",
      "/campaigns",
      "/crm",
      "/notes",
      "/projects",
      "/social",
      "/settings"
    ]
  };

  const [localColor, setLocalColor] = useState("#a9b897");

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
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user?.id) {
          setUserRole("guest");
          setSubscriptionTier("unpaid");
          setAllowedSlugs(tierLinks.unpaid);
          setLoading(false);
          return;
        }

        const [{ data: profile }, permsResult, { data: membership }] = await Promise.all([
          supabase
            .from("profiles")
            .select("role, brand_color, subscription_tier")
            .eq("id", user.id)
            .single(),

          supabase
            .from("permissions")
            .select("page_slug")
            .eq("user_id", user.id)
            .eq("can_access", true),

          supabase
            .from("team_members")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle()
        ]);

        const resolvedRole = membership?.role ?? profile?.role ?? "user";
        setUserRole(resolvedRole);

        const tier = (profile?.subscription_tier || "unpaid").toLowerCase();
        setSubscriptionTier(tier);

        const permsData = permsResult?.data ?? [];

        const permissionSlugs = Array.isArray(permsData)
          ? permsData
              .filter((p: any) => p?.page_slug)
              .map((p: any) => p.page_slug)
          : [];
        const tierAccess = tierLinks[tier] || tierLinks.unpaid;

        if (resolvedRole === "admin" || resolvedRole === "owner") {
          setAllowedSlugs(allLinks.map((link) => link.href));
        } else if (permissionSlugs.length > 0) {
          setAllowedSlugs(permissionSlugs);
        } else {
          setAllowedSlugs(tierAccess);
        }

        if (profile?.brand_color) {
          setLocalColor(profile.brand_color);
        }
      } catch (err) {
        console.error("Sidebar Permission Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }

    syncPermissions();
  }, [context?.settings]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Unable to log out");
    }
  };

  const activeColor = context?.settings?.brandColor || context?.settings?.brand_color || localColor;

  const visibleLinks =
    allowedSlugs.length > 0
      ? allLinks.filter((link) => allowedSlugs.includes(link.href))
      : allLinks.filter((link) =>
          ["/dashboard", "/notes", "/calendar"].includes(link.href)
        );

  return (
    <aside className={`
      flex flex-col h-screen bg-stone-50 border-r border-stone-200
      transition-all duration-500 ease-in-out z-50 relative
      ${collapsed ? "w-20" : "w-64"}
      max-md:fixed max-md:left-0 max-md:top-0 max-md:z-[100] max-md:shadow-xl
    `}>
      {/* BRANDING AREA */}
      <div className="flex items-center justify-between p-6 h-24 shrink-0 overflow-hidden">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-sm border border-stone-100 bg-white shrink-0">
              <Image 
                src="/images/TOTS-favicon.jpeg" 
                alt="TOTS OS Logo" 
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black italic uppercase tracking-widest text-[11px] text-stone-900 leading-none">
                TOTS-OS
              </h1>
            </div>
          </div>
        ) : (
          <div className="relative w-8 h-8 mx-auto overflow-hidden rounded-lg border border-stone-100 bg-white shrink-0">
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="Logo" 
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* COLLAPSE TOGGLE */}
      <button 
        onClick={() => setCollapsed(!collapsed)} 
        className={`absolute z-10 p-1.5 hover:bg-stone-200 rounded-lg transition-colors text-stone-400 hover:text-stone-900 ${collapsed ? "left-1/2 -translate-x-1/2 top-20" : "right-4 top-8"}`}
      >
        <Menu size={14} />
      </button>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 px-4 mb-6 mt-4 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="animate-spin text-stone-200" size={20} />
          </div>
        ) : (
          visibleLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{ backgroundColor: isActive ? activeColor : 'transparent' }}
                className={`
                  group flex items-center gap-4 p-3 rounded-[1rem] transition-all duration-300
                  ${isActive 
                    ? "text-white shadow-xl shadow-stone-200 scale-[1.02]" 
                    : "text-stone-500 hover:bg-white hover:shadow-sm hover:text-stone-900"}
                `}
              >
                <item.icon 
                  size={18} 
                  style={{ color: isActive ? '#fff' : undefined }}
                  className={`${!isActive ? "text-stone-300 group-hover:text-stone-900 transition-colors" : ""}`} 
                />
                {!collapsed && (
                  <span className="font-bold uppercase text-[9px] tracking-[0.2em]">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* FOOTER & LOGOUT */}
      <div className="p-4 border-t border-stone-200 bg-stone-100/30 space-y-4 shrink-0">
        <button 
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300
            text-stone-400 hover:bg-red-50 hover:text-red-600 group
          `}
        >
          <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
          {!collapsed && (
            <span className="font-black uppercase text-[8px] tracking-[0.2em]">
             Logout
            </span>
          )}
        </button>

        <div className="pt-1 px-2">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-stone-900 font-black italic">
                {(userRole || "Business").toUpperCase()} ACCESS
              </p>
            </div>
          ) : (
            <div className="flex justify-center pb-2">
              <div 
                className="w-1.5 h-1.5 rounded-full animate-pulse" 
                style={{ backgroundColor: activeColor }}
                title={`${(subscriptionTier || "unpaid").toUpperCase()} • ${userRole || "User"} Access`}
              />
            </div>
          )}
        </div>
        </div>
      
    </aside>
  );
}