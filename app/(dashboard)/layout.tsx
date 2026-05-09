"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";
import { useSettings } from "../context/SettingsContext"; 
import { 
  LayoutDashboard, Users, Calendar, Megaphone, 
  DollarSign, Briefcase, BarChart3, Globe, Lock, Settings, Menu, X,
  Sparkles, StickyNote 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Pulling global state from our Context Brain
  const { mobileNav, logoUrl, brandColor, loading } = useSettings();

  // Registry of all possible links for mapping
  const allLinks = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
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

  // Dynamic filter for the 3 pinned items
  const pinnedMobileLinks = allLinks.filter(link => 
    mobileNav?.includes(link.href)
  ).slice(0, 3);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen w-full bg-[#fcfaf7] overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block h-full">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-12 pb-32 md:pb-12">
          {children}
        </div>

        {/* MOBILE BOTTOM NAV - Respects Pinned Settings */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-stone-200 z-[90] px-6 flex items-center justify-between pb-safe">
          {pinnedMobileLinks.map((link) => (
            <MobileNavItem 
              key={link.href} 
              href={link.href} 
              icon={link.icon} 
              label={link.label} 
            />
          ))}
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-stone-400"
          >
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-tighter">More</span>
          </button>
        </nav>

        {/* MOBILE FULL-SCREEN OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-white overflow-y-auto"
            >
              <div className="min-h-full p-8 pb-40">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <p 
                      className="text-[8px] font-black uppercase tracking-[0.4em]"
                      style={{ color: brandColor }}
                    >
                      System Menu
                    </p>
                    <div className="flex items-center gap-3">
                      {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />}
                      <span className="font-serif italic text-3xl text-stone-800 text-left block">Tots OS</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="p-3 bg-stone-100 rounded-2xl active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {allLinks.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col justify-between h-32 p-6 bg-[#faf9f6] rounded-[2rem] border border-stone-100 active:bg-stone-200 transition-all shadow-sm"
                    >
                      <div style={{ color: brandColor }}>
                        <link.icon size={22} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 text-left">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function MobileNavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  // We can use standard Tailwind 'active' states or pull the brandColor here too
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-stone-400 active:text-stone-900 transition-colors">
      <Icon size={20} />
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}