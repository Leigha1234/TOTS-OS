"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
const supabase = getBrowserClient(); 
import { useSettings } from "@/app/context/SettingsContext"; 
import { 
  LayoutDashboard, Users, Menu, Calendar, Megaphone, 
  StickyNote, DollarSign, BarChart3, Globe, Lock,
  Briefcase, Settings, Loader2, LogOut
} from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS SIDEBAR v7.1.6
 * REVISION: DEPRECATION OF CLARITY MODULE & UK ENGLISH BUSINESS METADATA
 */

const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Dashboard", "Contacts", "Notes", "Calendar"],
  PREMIUM: ["Dashboard", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects"],
  ELITE: [
    "Dashboard", "Calendar", "Campaigns", "Contacts", 
    "Notes", "Finance", "Projects", "Reports", "Social", "Vault", "Settings"
  ],
};

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
  const [userTier, setUserTier] = useState<string | null>(null);
  const [localColor, setLocalColor] = useState("#a9b897");

  useEffect(() => {
    async function syncSidebar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("tier, brand_color")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserTier(profile.tier?.toUpperCase() || "STANDARD");
          if (profile.brand_color) setLocalColor(profile.brand_color);
        }
      } catch (err) {
        console.error("Sidebar Synchronisation Error:", err);
        setUserTier("STANDARD");
      }
    }
    syncSidebar();
  }, [context?.settings]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Session Terminated Safely");
      router.push("/login");
    } catch (error) {
      toast.error("Protocol Breach: Logout Operation Failed");
    }
  };

  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/payments", label: "Finance", icon: DollarSign },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/vault", label: "Vault", icon: Lock },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const activeColor = context?.settings?.brandColor || context?.settings?.brand_color || localColor;

  const visibleLinks = userTier 
    ? allLinks.filter(link => MODULE_PERMISSIONS[userTier]?.includes(link.label))
    : [];

  return (
    <aside className={`
      hidden md:flex flex-col h-screen bg-stone-50 border-r border-stone-200 
      transition-all duration-500 ease-in-out z-50 relative
      ${collapsed ? "w-20" : "w-64"}
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
        {!userTier ? (
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
                {userTier || "LOADING..."} ACCESS
              </p>
            </div>
          ) : (
            <div className="flex justify-center pb-2">
              <div 
                className="w-1.5 h-1.5 rounded-full animate-pulse" 
                style={{ backgroundColor: activeColor }}
                title={`${userTier || "Loading"} Access`}
              />
            </div>
          )}
        </div>
        </div>
      
    </aside>
  );
}