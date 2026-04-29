"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase"; 
import { 
  LayoutDashboard, Users, CheckSquare, Briefcase, 
  Settings, Menu, User // 1. Import User icon
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // ... rest of your useEffect ...

  return (
    <aside className={`h-screen bg-stone-50 border-r border-stone-200 transition-all duration-300 flex flex-col ${collapsed ? "w-20" : "w-64"}`}>
      {/* ... header code ... */}

      <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
        {[
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/profile", label: "Profile", icon: User }, // 2. Add Profile Link
          { href: "/crm", label: "Contacts", icon: Users },
          { href: "/tasks", label: "Tasks", icon: CheckSquare },
          { href: "/projects", label: "Projects", icon: Briefcase },
          { href: "/settings", label: "Settings", icon: Settings },
        ].map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${pathname === item.href ? "bg-stone-200 text-stone-900" : "text-stone-600 hover:bg-stone-100"}`}
          >
            <item.icon size={18} />
            {!collapsed && <span className="font-bold uppercase text-[10px] tracking-wider">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}