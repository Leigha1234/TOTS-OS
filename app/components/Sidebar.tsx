"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  LayoutDashboard, Users, Calendar, Megaphone, 
  DollarSign, Briefcase, BarChart3, Globe, Lock, 
  Settings, Menu, Sparkles, StickyNote, Zap,
  User as UserIcon, Clock, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Business Pulse", "Contacts", "Notes", "Calendar"],
  PREMIUM: ["Business Pulse", "Clarity", "Calendar", "Campaigns", "Contacts", "Notes", "Finance", "Projects"],
  ELITE: [
    "Business Pulse", "Clarity", "Calendar", "Campaigns", "Contacts", 
    "Notes", "Finance", "Projects", "Reports", "Social", "Vault", "Settings"
  ],
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const context = useSettings();

  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState<string>("OPERATOR");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTier, setUserTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localColor, setLocalColor] = useState("#a9b897");

  // Clock Sync
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Profile & Tier Sync
  const syncSidebarData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, tier, brand_color")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile) {
        if (profile.full_name) setUserName(profile.full_name.toUpperCase());
        setUserTier(profile.tier?.toUpperCase() || "STANDARD");
        if (profile.brand_color) setLocalColor(profile.brand_color);
      }
    } catch (err) {
      console.warn("Sidebar Sync Error");
      setUserTier("STANDARD");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSidebarData();
  }, [syncSidebarData]);

  const allLinks = [
    { href: "/dashboard", label: "Business Pulse", icon: LayoutDashboard },
    { href: "/clarity", label: "Clarity", icon: Sparkles },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/payments", label: "Finance", icon: DollarSign },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/vault", label: "Vault", icon: Lock },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const brandColor = context?.settings?.brandColor || localColor;
  const visibleLinks = userTier 
    ? allLinks.filter(link => MODULE_PERMISSIONS[userTier]?.includes(link.label))
    : [];

  return (
    <aside 
      className={`hidden md:flex flex-col h-screen bg-white border-r border-stone-100 transition-all duration-500 ease-in-out shrink-0 sticky top-0 z-[100] ${collapsed ? "w-24" : "w-72"}`}
    >
      {/* BRAND SECTION */}
      <div className="h-24 flex items-center justify-between px-8 border-b border-stone-50">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-xl bg-stone-900 text-white">
                <Zap size={16} fill={brandColor} stroke={brandColor} />
              </div>
              <span className="font-black uppercase tracking-[0.4em] text-[11px] text-stone-900">Tots OS</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 hover:bg-stone-50 rounded-xl transition-colors text-stone-400 hover:text-stone-900"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* NODE INFO (Only visible when expanded) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-8 py-6 space-y-4 border-b border-stone-50 bg-[#faf9f6]/30"
          >
            <div className="flex items-center gap-3 text-stone-400">
              <UserIcon size={12} fill="currentColor" className="opacity-50" />
              <p className="font-black uppercase text-[8px] tracking-[0.3em] truncate">{userName}</p>
            </div>
            <div className="flex items-center gap-3 text-stone-400">
              <Clock size={12} className="opacity-50" />
              <p className="font-black uppercase text-[8px] tracking-[0.3em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV LINKS */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-stone-200" size={24} />
            {!collapsed && <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">Syncing Permissions</p>}
          </div>
        ) : (
          visibleLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`group relative flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 ${
                  isActive 
                    ? "text-white shadow-xl scale-[1.02]" 
                    : "text-stone-400 hover:bg-stone-50 hover:text-stone-900"
                }`}
                style={{ backgroundColor: isActive ? brandColor : 'transparent' }}
              >
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 1.5} 
                  className={isActive ? "text-white" : "group-hover:text-stone-900"} 
                />
                {!collapsed && (
                  <span className="font-black uppercase text-[10px] tracking-[0.2em] whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                
                {isActive && !collapsed && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-[1.5rem] blur-lg opacity-20"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* SYSTEM STATUS FOOTER */}
      <div className="p-6 border-t border-stone-50 bg-[#faf9f6]/50">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-4"}`}>
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full blur-[4px] animate-pulse" style={{ backgroundColor: brandColor }} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <p className="text-[8px] uppercase tracking-[0.4em] text-stone-900 font-black">System Nominal</p>
              <p className="text-[7px] uppercase tracking-[0.2em] text-stone-400 font-bold">{userTier} ACCESS</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}