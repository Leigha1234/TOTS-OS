"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; // Import singleton
import {
  LayoutDashboard, Users, CheckSquare, CreditCard, BarChart,
  StickyNote, Settings, Menu, LogOut, Clock,
  Briefcase, Sparkles, Calendar, Mail, 
  Lock, ChevronRight, X, Zap, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tier = "standard" | "premium" | "elite";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, tier: "standard" },
  { href: "/crm", label: "Contacts", icon: Users, tier: "standard" },
  { href: "/projects", label: "Projects", icon: Briefcase, tier: "standard" },
  { href: "/tasks", label: "To Do", icon: CheckSquare, tier: "standard" },
  { href: "/notes", label: "Notes", icon: StickyNote, tier: "standard" },
  { href: "/calendar", label: "Calendar", icon: Calendar, tier: "standard" },
  { href: "/payments", label: "Money", icon: CreditCard, tier: "premium" },
  { href: "/timesheets", label: "Timesheets", icon: Clock, tier: "premium" },
  { href: "/reports", label: "Reports", icon: BarChart, tier: "premium" },
  { href: "/vault", label: "Vault", icon: Lock, tier: "elite" },
  { href: "/social", label: "Social Lab", icon: Sparkles, tier: "elite" },
  { href: "/scheduler", label: "Scheduler", icon: Calendar, tier: "elite" },
  { href: "/campaigns", label: "Campaigns", icon: Mail, tier: "elite" },
  { href: "/settings/import", label: "Data Migration", icon: Database, tier: "standard" },
  { href: "/settings", label: "Settings", icon: Settings, tier: "standard" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [collapsed, setCollapsed] = useState(false);
  const [currentTier, setCurrentTier] = useState<Tier>("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Simplified query to prevent 400 errors
          const { data } = await supabase
            .from("profiles")
            .select("tier")
            .eq("id", user.id)
            .single();
          if (data?.tier) setCurrentTier(data.tier as Tier);
        }
      } catch (err) {
        console.error("Sidebar load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserTier();
  }, []);

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <div className={`h-screen bg-stone-50 border-r border-stone-200 px-4 py-6 flex flex-col transition-all duration-300 z-50 ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between px-3 mb-10">
        {!collapsed && <h1 className="text-[11px] font-black italic uppercase tracking-[0.5em]">TOTS OS</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 text-stone-600"><Menu size={18} /></button>
      </div>

      <nav className="flex-grow space-y-1.5 px-2 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-stone-200 transition-colors text-stone-700"
          >
            <link.icon size={18} />
            {!collapsed && <span className="text-[12px] font-bold uppercase">{link.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}