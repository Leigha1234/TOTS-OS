"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext"; 
import { 
  LayoutDashboard, Users, Menu, Calendar, Megaphone, 
  StickyNote, DollarSign, BarChart3, Globe, Lock,
  Briefcase, Settings, Sparkles, Loader2
} from "lucide-react";

// The source of truth for access levels
const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Business Pulse", "Contacts", "Notes", "Calendar"],
  PREMIUM: ["Business Pulse", "Clarity", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects"],
  ELITE: [
    "Business Pulse", "Clarity", "Calendar", "Campaigns", "Contacts", 
    "Notes", "Finance", "Projects", "Reports", "Social", "Vault", "Settings"
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  
  // 1. Attempt to get global settings, but don't crash if it fails
  let context: any = null;
  try {
    context = useSettings();
  } catch (e) {
    console.warn("Sidebar: SettingsContext not found. Falling back to local fetch.");
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
          // Force set Tier to uppercase for strict matching
          setUserTier(profile.tier?.toUpperCase() || "STANDARD");
          // If context isn't working, use the color from the profile
          if (profile.brand_color) setLocalColor(profile.brand_color);
        }
      } catch (err) {
        console.error("Sidebar Sync Error:", err);
        setUserTier("STANDARD");
      }
    }
    syncSidebar();
  }, [context?.settings]); // Re-sync if context settings update

  const allLinks = [
    { href: "/Business Pulse", label: "Business Pulse", icon: LayoutDashboard },
    { href: "/clarity", label: "Clarity", icon: Sparkles },
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

  // 🧬 Determine final color (Context > Profile Local > Default)
  const activeColor = context?.settings?.brandColor || context?.settings?.brand_color || localColor;

  // 🛡️ Filter links based on the fetched tier
  const visibleLinks = userTier 
    ? allLinks.filter(link => MODULE_PERMISSIONS[userTier]?.includes(link.label))
    : [];

  return (
    <aside className={`
      hidden md:flex flex-col h-screen bg-stone-50 border-r border-stone-200 
      transition-all duration-500 ease-in-out overflow-y-auto z-50
      ${collapsed ? "w-20" : "w-64"}
    `}>
      
      {/* BRANDING AREA */}
      <div className="flex items-center justify-between p-6 h-20 shrink-0">
        {!collapsed && (
          <h1 className="font-black italic uppercase tracking-widest text-[11px] text-stone-900">
            TOTS OS <span className="text-[8px] ml-2 opacity-30">v3.1</span>
          </h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-2 hover:bg-stone-200 rounded-xl transition-colors text-stone-400 hover:text-stone-900"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1.5 px-4 mb-6 mt-4">
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

      {/* SYSTEM STATUS FOOTER */}
      <div className="p-6 border-t border-stone-200 bg-stone-100/30">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} />
               <p className="text-[8px] uppercase tracking-[0.3em] text-stone-400 font-black">
                 Status: Nominal
               </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-stone-900 font-black italic">
              {userTier} NODE
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: activeColor }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}