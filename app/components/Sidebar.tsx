"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "./ThemeToggle"; // Make sure the file path matches
import {
  LayoutDashboard, Users, CheckSquare, CreditCard, BarChart,
  StickyNote, Settings, Menu, LogOut, Clock,
  Briefcase, Sparkles, Calendar, Mail, 
  Lock, ChevronRight, X, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOTS_STORE_URL = "https://xiaiqp-g3.myshopify.com/";

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
  { href: "/settings", label: "Settings", icon: Settings, tier: "standard" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTier, setCurrentTier] = useState<Tier>("standard");
  const [showUpgradeModal, setShowUpgradeModal] = useState<{show: boolean, targetTier: Tier | null}>({
    show: false,
    targetTier: null
  });

  // Safety check: Don't show on login/signup pages
  if (pathname === "/login" || pathname === "/signup") return null;

  const hasAccess = (linkTier: string) => {
    if (currentTier === "elite") return true;
    if (currentTier === "premium" && linkTier !== "elite") return true;
    if (currentTier === "standard" && linkTier === "standard") return true;
    return false;
  };

  const handleLinkClick = (e: React.MouseEvent, linkTier: Tier) => {
    if (!hasAccess(linkTier)) {
      e.preventDefault();
      setShowUpgradeModal({ show: true, targetTier: linkTier });
    }
  };

  async function handleLogout() {
    try {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    } catch (err) {
        console.error("Logout error:", err);
        router.push("/login"); 
    }
  }

  return (
    <>
      <div className={`h-screen bg-[var(--bg)] border-r border-[var(--border)] px-4 py-4 flex flex-col transition-all duration-300 sticky top-0 z-40 ${collapsed ? "w-20" : "w-64"}`}>
        
        {/* LOGO & TOGGLE */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between px-2">
            {!collapsed && (
              <h1 className="text-sm font-black italic uppercase tracking-[0.3em] text-[var(--text)]">
                TOTs OS
              </h1>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-1.5 hover:bg-[var(--accent)] hover:text-white rounded-md transition-colors text-[var(--muted)]"
            >
              <Menu size={20} />
            </button>
          </div>

          {!collapsed && (
            <div className="px-2">
               <select 
                value={currentTier} 
                onChange={(e) => setCurrentTier(e.target.value as Tier)} 
                className="w-full text-[9px] font-black uppercase tracking-widest bg-[var(--bg-soft)] text-[var(--text)] border border-[var(--border)] rounded-full px-3 py-2 outline-none cursor-pointer hover:border-[var(--accent)] transition-all"
              >
                <option value="standard">Standard Node</option>
                <option value="premium">Premium Node</option>
                <option value="elite">Elite Node</option>
              </select>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-1 flex-grow overflow-y-auto no-scrollbar px-1">
          {links.map((link) => {
            const active = pathname === link.href;
            const locked = !hasAccess(link.tier);
            const Icon = link.icon;

            return (
              <div key={link.href} className="relative group">
                <Link
                  href={locked ? "#" : link.href}
                  onClick={(e) => handleLinkClick(e, link.tier as Tier)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    active 
                      ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20" 
                      : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  } ${locked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? "text-white" : "opacity-70 group-hover:opacity-100"} />
                    {!collapsed && <span className="text-[13px] font-medium tracking-tight">{link.label}</span>}
                  </div>
                  {!collapsed && locked && <Lock size={12} className="opacity-40" />}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="mt-auto pt-4 space-y-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-center py-2">
             <ThemeToggle />
          </div>

          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-[13px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[var(--bg)] border border-[var(--border)] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowUpgradeModal({show: false, targetTier: null})} 
                className="absolute top-6 right-6 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-6">
                <div className="inline-flex p-4 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)]">
                  <Zap size={32} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-4xl font-serif italic text-[var(--text)] leading-tight capitalize">
                    {showUpgradeModal.targetTier} Tier
                  </h2>
                  <p className="text-[var(--muted)] mt-2 font-medium italic">
                    This node requires a higher clearancce level.
                  </p>
                </div>

                <button 
                  onClick={() => window.open(TOTS_STORE_URL, '_blank')}
                  className="w-full py-5 bg-[var(--text)] text-[var(--bg)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
                >
                  Initiate Secure Upgrade <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}