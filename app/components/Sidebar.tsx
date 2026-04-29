"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase"; 
import { 
  LayoutDashboard, Users, CheckSquare, Briefcase, 
  Settings, Menu, User 
} from "lucide-react";

// 1. Define tier-based module visibility
const MODULE_PERMISSIONS: Record<string, string[]> = {
  STANDARD: ["Home", "Profile", "Contacts", "Tasks"],
  PREMIUM: ["Home", "Profile", "Contacts", "Tasks", "Projects"],
  ELITE: ["Home", "Profile", "Contacts", "Tasks", "Projects", "Settings"],
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
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // 2. Filter links based on current user tier
  const visibleLinks = allLinks.filter(link => 
    MODULE_PERMISSIONS[userTier]?.includes(link.label)
  );

  return (
    <aside className={`h-screen bg-stone-50 border-r border-stone-200 transition-all duration-300 flex flex-col ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between p-6 h-20">
        {!collapsed && (
          <h1 className="font-black italic uppercase tracking-widest text-sm">
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

      <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
        {visibleLinks.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname === item.href 
                ? "bg-stone-200 text-stone-900" 
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <item.icon size={18} />
            {!collapsed && (
              <span className="font-bold uppercase text-[10px] tracking-wider">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-stone-200">
        {!collapsed && (
          <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
            {userTier} NODE ONLINE
          </p>
        )}
      </div>
    </aside>
  );
}