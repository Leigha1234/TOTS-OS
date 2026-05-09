"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase"; 
import { 
  LayoutDashboard, Users, CheckSquare, Briefcase, Settings, Menu,
  Calendar, Megaphone, StickyNote, DollarSign, BarChart3, Share2, Globe, Clock, Lock,
  X
} from "lucide-react";

const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Dashboard", "Contacts", "Notes", "Calendar"],
  PREMIUM: ["Dashboard", "Contacts", "Notes", "Calendar", "Projects", "Finance", "Campaigns"],
  ELITE: ["Dashboard", "Contacts", "Notes", "Calendar", "Projects", "Finance", "Campaigns", "Reports", "Social", "Vault", "Settings"],
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userTier, setUserTier] = useState("STANDARD");

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
        if (data) setUserTier(data.tier.toUpperCase());
      }
    };
    fetchUserData();
  }, []);

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

  const visibleLinks = allLinks.filter(link => 
    MODULE_PERMISSIONS[userTier]?.includes(link.label)
  );

  return (
    /* RESPONSIVE LOGIC:
       - Hidden on mobile ('hidden')
       - Becomes a flexible column on desktop ('md:flex')
       - Height matches viewport ('h-screen')
    */
    <aside className={`
      hidden md:flex flex-col
      h-screen bg-stone-50 border-r border-stone-200 
      transition-all duration-300 overflow-y-auto 
      ${collapsed ? "w-20" : "w-64"}
    `}>
      
      {/* Header Area */}
      <div className="flex items-center justify-between p-6 h-20 shrink-0">
        {!collapsed && (
          <h1 className="font-black italic uppercase tracking-widest text-sm text-stone-900">
            TOTS OS
          </h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 mb-6">
        {visibleLinks.map((item) => {
          if (item.label === "Profile") return null;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                group flex items-center gap-4 p-2.5 rounded-xl transition-all
                ${isActive 
                  ? "bg-stone-900 text-white shadow-lg shadow-stone-200" 
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}
              `}
            >
              <item.icon 
                size={16} 
                className={`${isActive ? "text-[#a9b897]" : "text-stone-400 group-hover:text-stone-900"}`} 
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

      {/* Footer Info */}
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
            <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}