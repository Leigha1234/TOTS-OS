"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { ThemeProvider } from "../components/GlobalProviders";
import Link from "next/link";
import { Sparkles, LayoutDashboard, Users, Receipt, Settings, Menu, X, Globe, Lock, BarChart3, Megaphone, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // All links for the "More" overlay
  const mobileLinks = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/payments", label: "Finance", icon: Receipt },
    { href: "/projects", label: "Projects", icon: Settings },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/vault", label: "Vault", icon: Lock },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <ThemeProvider>
      <div className="flex flex-col md:flex-row w-full h-screen md:overflow-hidden bg-[#fcfaf7]">
        <aside className="hidden md:block z-50 h-full flex-shrink-0 border-r border-stone-200">
          <Sidebar />
        </aside>

        <main className="flex-1 h-full overflow-y-auto relative">
          <div className="p-4 md:p-12 pb-32 md:pb-12">{children}</div>

          {/* MOBILE BOTTOM NAV */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-stone-200 z-[100] px-6 flex items-center justify-between pb-safe">
            <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Home" />
            <MobileNavLink href="/calendar" icon={<Calendar size={20} />} label="Events" />
            <MobileNavLink href="/crm" icon={<Users size={20} />} label="CRM" />
            {/* The "More" Trigger */}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[200] bg-white p-8 flex flex-col md:hidden"
              >
                <div className="flex justify-between items-center mb-12">
                  <span className="font-serif italic text-2xl">Tots OS Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {mobileLinks.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col gap-3 p-6 bg-stone-50 rounded-[2rem] border border-stone-100 active:scale-95 transition-all"
                    >
                      <div className="text-[#a9b897]">{<link.icon size={24} />}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ThemeProvider>
  );
}

function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-stone-400 active:text-stone-900 transition-colors">
      {icon}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}