"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext"; // 🧬 Use the context here
import { 
  LayoutDashboard, Users, Menu, Calendar, Megaphone, 
  StickyNote, DollarSign, BarChart3, Globe, Lock,
  Briefcase, Settings, Sparkles
} from "lucide-react";

const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Dashboard", "Contacts", "Notes", "Calendar"],
  PREMIUM: ["Dashboard", "Clarity", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects"],
  ELITE: ["Dashboard", "Clarity", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects", "Reports", "Social", "Vault", "Settings"],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings(); // 🧬 Get real-time settings from context
  const [collapsed, setCollapsed] = useState(false);
  const [userTier, setUserTier] = useState("STANDARD");

  useEffect(() => {
    async function getTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier")
          .eq("id", user.id)
          .single();
        if (profile?.tier) setUserTier(profile.tier.toUpperCase());
      }
    }
    getTier();
  }, []);

  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  // Logic to filter based on ELITE tier
  const visibleLinks = allLinks.filter(link => 
    MODULE_PERMISSIONS[userTier]?.includes(link.label)
  );

  return (
    <aside className={`
      hidden md:flex flex-col h-screen bg-stone-50 border-r border-stone-200 
      transition-all duration-300 overflow-y-auto z-50
      ${collapsed ? "w-20" : "w-64"}
    `}>
      
      <div className="flex items-center justify-between p-6 h-20 shrink-0">
        {!collapsed && (
          <h1 className="font-black italic uppercase tracking-widest text-sm text-stone-900">
            TOTS OS
          </h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 mb-6">
        {visibleLinks.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              // 🧬 Dynamic color from Context
              style={{ backgroundColor: isActive ? settings.brandColor : 'transparent' }}
              className={`
                group flex items-center gap-4 p-2.5 rounded-xl transition-all
                ${isActive 
                  ? "text-white shadow-lg shadow-stone-200" 
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}
              `}
            >
              <item.icon 
                size={16} 
                style={{ color: isActive ? '#fff' : undefined }}
                className={`${!isActive ? "text-stone-400 group-hover:text-stone-900" : ""}`} 
              />
              {!collapsed && (
                <span className="font-bold uppercase text-[9px] tracking-widest">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-stone-200 bg-stone-100/50">
        {!collapsed ? (
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-[0.3em] text-stone-400 font-black">
              System Status
            </p>
            <p className="text-[9px] uppercase tracking-widest text-stone-900 font-bold">
              {userTier} NODE ONLINE
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              // 🧬 Dynamic color from Context
              style={{ backgroundColor: settings.brandColor }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}