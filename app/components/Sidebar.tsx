"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Users, CheckSquare, CreditCard, BarChart,
  StickyNote, Settings, Menu, BookOpen, LogOut, Clock,
  Briefcase, Sparkles, Calendar, Mail, Wifi, WifiOff,
  Lock, ChevronRight, X, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ FIXED: Defined at top level so it's accessible everywhere in the file
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
  const [isOnline, setIsOnline] = useState(true);
  const [currentTier, setCurrentTier] = useState<Tier>("standard");
  const [showUpgradeModal, setShowUpgradeModal] = useState<{show: boolean, targetTier: Tier | null}>({
    show: false,
    targetTier: null
  });

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.push("/login");
        router.refresh();
    } catch (err) {
        console.error("Logout lock error ignored:", err);
        router.push("/login"); // Force redirect even if lock fails
    }
  }

  return (
    <>
      <div className={`h-screen bg-[var(--bg)] border-r border-[var(--border)] px-4 py-4 flex flex-col transition-all sticky top-0 ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between">
            {!collapsed && <h1 className="text-lg font-semibold italic uppercase tracking-widest text-stone-800">TOTs OS</h1>}
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors"><Menu size={20} /></button>
          </div>
          {!collapsed && (
            <select value={currentTier} onChange={(e) => setCurrentTier(e.target.value as Tier)} className="text-[9px] font-black uppercase tracking-widest bg-stone-100 border-none rounded-full px-3 py-1 outline-none cursor-pointer">
              <option value="standard">Standard Node</option>
              <option value="premium">Premium Node</option>
              <option value="elite">Elite Node</option>
            </select>
          )}
        </div>

        <nav className="space-y-1 flex-grow overflow-y-auto no-scrollbar">
          {links.map((link) => {
            const active = pathname === link.href;
            const locked = !hasAccess(link.tier);
            const Icon = link.icon;

            return (
              <div key={link.href} className="relative group">
                <Link
                  href={locked ? "#" : link.href}
                  onClick={(e) => handleLinkClick(e, link.tier as Tier)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${active ? "bg-white text-black font-medium border border-gray-200 shadow-sm" : "text-[var(--muted)]"} ${locked ? "hover:bg-stone-50" : "hover:bg-white/5 hover:text-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? "text-black" : "group-hover:text-white"} />
                    {!collapsed && <span className="text-sm">{link.label}</span>}
                  </div>
                  {!collapsed && locked && <Lock size={12} className="text-stone-300" />}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--border)]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showUpgradeModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <button onClick={() => setShowUpgradeModal({show: false, targetTier: null})} className="absolute top-6 right-6 text-stone-300 hover:text-stone-800 transition-colors"><X size={24} /></button>
              
              <div className="space-y-6">
                <div className="inline-flex p-4 bg-purple-50 rounded-2xl text-purple-500"><Zap size={32} fill="currentColor" /></div>
                <div>
                  <h2 className="text-4xl font-serif italic text-stone-800 leading-tight">Unlock {showUpgradeModal.targetTier} Tier</h2>
                  <p className="text-stone-400 mt-2 font-medium italic">Upgrade to access this node.</p>
                </div>

                <button 
                  onClick={() => window.open(TOTS_STORE_URL, '_blank')}
                  className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
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