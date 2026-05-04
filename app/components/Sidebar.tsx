"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase"; 
import { 
  LayoutDashboard, Users, CheckSquare, Briefcase, Settings, Menu,
  Calendar, Megaphone, StickyNote, DollarSign, BarChart3, Share2, Globe, Clock, Lock
} from "lucide-react";

const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Dashboard", "Contacts", "Tasks", "Notes", "Calendar"],
  PREMIUM: ["Dashboard", "Contacts", "Tasks", "Notes", "Calendar", "Projects", "Finance", "Campaigns", "Timesheets"],
  ELITE: ["Dashboard", "Contacts", "Tasks", "Notes", "Calendar", "Projects", "Finance", "Campaigns", "Timesheets", "Reports", "Social Scheduler", "Social", "Vault", "Settings"],
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
    { href: "/scheduler", label: "Social Scheduler", icon: Share2 },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/timesheets", label: "Timesheets", icon: Clock },
    { href: "/vault", label: "Vault", icon: Lock },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const visibleLinks = allLinks.filter(link => 
    MODULE_PERMISSIONS[userTier]?.includes(link.label)
  );

  return (
    <aside className={`h-screen bg-stone-50 border-r border-stone-200 transition-all duration-300 flex flex-col overflow-y-auto ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between p-6 h-20">
        {!collapsed && <h1 className="font-black italic uppercase tracking-widest text-sm">TOTS OS</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-stone-200 rounded-lg">
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 mb-6">
        {visibleLinks.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex items-center gap-4 p-2.5 rounded-lg transition-colors ${
              pathname === item.href 
                ? "bg-stone-200 text-stone-900" 
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <item.icon size={16} />
            {!collapsed && (
              <span className="font-bold uppercase text-[9px] tracking-wider">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-200">
        {!collapsed && (
          <p className="text-[8px] uppercase tracking-widest text-stone-400 font-bold text-center">
            {userTier} NODE ONLINE
          </p>
        )}
      </div>
    </aside>
  );
}