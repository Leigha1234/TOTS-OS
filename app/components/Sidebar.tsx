"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase"; 
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard, Users, CheckSquare, CreditCard, BarChart,
  StickyNote, Settings, Menu, LogOut, Clock,
  Briefcase, Sparkles, Calendar, Mail, 
  Lock, ChevronRight, X, Zap, Database
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
  { href: "/settings/import", label: "Data Migration", icon: Database, tier: "standard" },
  { href: "/settings", label: "Settings", icon: Settings, tier: "standard" },
];

export default function Sidebar() {
  // Stabilize client initialization to prevent 400 errors and re-renders
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  
  const [collapsed, setCollapsed] = useState(false);
  const [currentTier, setCurrentTier] = useState<Tier>("standard");
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState<{show: boolean, targetTier: Tier | null}>({
    show: false,
    targetTier: null
  });

  // Fetch User Tier
  useEffect(() => {
    async function fetchUserTier() {
      // Ensure we are in a client environment before calling Auth
      if (typeof window === 'undefined') return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("tier")
            .eq("id", user.id)
            .single();

          if (error) throw error;
          if (data?.tier) setCurrentTier(data.tier as Tier);
        }
      } catch (err) {
        console.error("Tier fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserTier();
  }, [supabase]);

  // Safety Check
  if (pathname === "/login" || pathname === "/signup") return null;

  const hasAccess = (linkTier: string) => {
    if (currentTier === "elite") return true;
    if (currentTier === "premium" && linkTier !== "elite") return true;
    if (currentTier === "standard" && linkTier === "standard") return true;
    return false;
  };

  const handleTierChange = async (newTier: Tier) => {
    setCurrentTier(newTier);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ tier: newTier }).eq("id", user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <div className={`h-screen bg-[var(--bg)] border-r border-[var(--border)] px-4 py-6 flex flex-col transition-all duration-500 sticky top-0 z-40 ${collapsed ? "w-20" : "w-64"}`}>
        
        {/* Branding & Collapse Toggle */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between px-3">
            {!collapsed && (
              <h1 className="text-[11px] font-black italic uppercase tracking-[0.5em] text-[var(--text-main)]">
                TOTS OS
              </h1>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-2 hover:bg-[var(--bg-soft)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              <Menu size={18} />
            </button>
          </div>

          {!collapsed && (
            <div className="px-3">
              {loading ? (
                <div className="h-10 w-full bg-[var(--bg-soft)] animate-pulse rounded-xl" />
              ) : (
                <select 
                  value={currentTier} 
                  onChange={(e) => handleTierChange(e.target.value as Tier)} 
                  className="w-full text-[9px] font-black uppercase tracking-[0.3em] bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none cursor-pointer hover:border-[var(--accent)] transition-all shadow-sm"
                >
                  <option value="standard">Standard Node</option>
                  <option value="premium">Premium Node</option>
                  <option value="elite">Elite Node</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-grow overflow-y-auto no-scrollbar px-2">
          {links.map((link) => {
            const active = pathname === link.href;
            const locked = !hasAccess(link.tier);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={locked ? "#" : link.href}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    setShowUpgradeModal({ show: true, targetTier: link.tier as Tier });
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                  active 
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20 scale-[1.02]" 
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)]"
                } ${locked ? "opacity-40 grayscale" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className={active ? "text-white" : "opacity-70 group-hover:opacity-100 group-hover:text-[var(--accent)]"} />
                  {!collapsed && (
                    <span className={`text-[12px] font-bold uppercase tracking-wider ${active ? "font-black" : "font-medium"}`}>
                      {link.label}
                    </span>
                  )}
                </div>
                {!collapsed && locked && <Lock size={12} className="opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-6 space-y-4 border-t border-[var(--border)]">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logout</span>}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg)] border border-[var(--border)] w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center"
            >
              <button onClick={() => setShowUpgradeModal({show: false, targetTier: null})} className="absolute top-8 right-8"><X size={24} /></button>
              <div className="space-y-8 flex flex-col items-center">
                <div className="p-5 bg-[var(--accent)]/10 rounded-3xl text-[var(--accent)]"><Zap size={32} fill="currentColor" /></div>
                <div>
                  <h2 className="text-5xl font-serif italic text-[var(--text-main)] capitalize">{showUpgradeModal.targetTier} Tier</h2>
                  <p className="text-[var(--text-muted)] mt-4 font-serif italic text-lg">Higher architectural clearance required.</p>
                </div>
                <button 
                  onClick={() => window.open(TOTS_STORE_URL, '_blank')}
                  className="w-full py-6 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-black text-[10px] uppercase tracking-[0.4em]"
                >
                  Initiate Secure Upgrade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}