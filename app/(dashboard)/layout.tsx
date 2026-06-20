"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  LayoutDashboard, Users, Calendar, Megaphone, 
  Briefcase, BarChart3, Globe, Lock, Settings, Menu, X,
  Sparkles, StickyNote 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const { 
    mobileNav = ["/dashboard", "/clarity", "/calendar"], 
    logoUrl, 
    fontFamily = "Inter"
  } = useSettings();

  const allLinks = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/crm", label: "Contacts", icon: Users },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/social", label: "Social", icon: Globe },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const pinnedMobileLinks = allLinks.filter(link => 
    mobileNav?.includes(link.href)
  ).slice(0, 3);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
  }, [mobileMenuOpen]);

  return (
    <div 
      className="flex h-screen w-full bg-[#fcfaf7] overflow-hidden"
      style={{ fontFamily: `'${fontFamily}', sans-serif` }}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block h-full flex-shrink-0">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-12 pb-32 md:pb-12">
          {children}
        </div>

        {/* MOBILE BOTTOM NAV */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-stone-100 z-[90] px-8 flex items-center justify-between pb-safe">
          {pinnedMobileLinks.map((link) => (
            <MobileNavItem 
              key={link.href} 
              href={link.href} 
              icon={link.icon} 
              label={link.label} 
              isActive={pathname === link.href}
            />
          ))}
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-stone-400 active:scale-90"
          >
            <Menu size={22} strokeWidth={1.5} />
            <span className="text-[7px] font-black uppercase tracking-tighter">System</span>
          </button>
        </nav>

        {/* MOBILE FULL-SCREEN OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[200] bg-[#fcfaf7] overflow-y-auto"
            >
              <div className="min-h-full p-8 pb-32">
                <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <p 
                      className="text-[9px] font-black uppercase tracking-[0.4em]"
                      style={{ color: 'var(--brand-primary)' }} // USE CSS VARIABLE
                    >
                      Infrastructure
                    </p>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white">
                           <LayoutDashboard size={20} />
                        </div>
                      )}
                      <span className="font-serif italic text-4xl tracking-tighter text-stone-900">Tots OS</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="p-4 bg-white border border-stone-200 rounded-[1.5rem] shadow-sm active:scale-95 transition-transform"
                  >
                    <X size={24} className="text-stone-900" />
                  </button>
                </div>

                {/* APP GRID */}
                <div className="grid grid-cols-2 gap-4">
                  {allLinks.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex flex-col justify-between h-32 p-6 rounded-[2.5rem] border transition-all duration-300 ${
                        pathname === link.href 
                        ? 'bg-white border-stone-200 shadow-xl scale-[1.02]' 
                        : 'bg-white/50 border-stone-100 hover:bg-white active:scale-95'
                      }`}
                    >
                      <div style={{ color: pathname === link.href ? 'var(--brand-primary)' : '#d6d3d1' }}>
                        <link.icon size={24} strokeWidth={1.5} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        pathname === link.href ? 'text-stone-900' : 'text-stone-400'
                      }`}>
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

function MobileNavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive
}: { 
  href: string; 
  icon: any; 
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link 
      href={href} 
      className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-90"
      style={{ color: isActive ? 'var(--brand-primary)' : '#d6d3d1' }} // USE CSS VARIABLE
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
      <span className={`text-[7px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
      
      {isActive && (
        <motion.div 
          layoutId="activeTabIndicator"
          className="w-1 h-1 rounded-full mt-0.5"
          style={{ backgroundColor: 'var(--brand-primary)' }} // USE CSS VARIABLE
        />
      )}
    </Link>
  );
}