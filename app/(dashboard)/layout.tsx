import Sidebar from "@/app/components/Sidebar";
import { ThemeProvider } from "../components/GlobalProviders";
import Link from "next/link";
import { Sparkles, LayoutDashboard, Users, Receipt, Settings, FolderKanban } from "lucide-react";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider>
      {/* Changed to flex-col on mobile so the Bottom Nav can sit at the base. 
        Kept overflow-hidden only for desktop (md:) to maintain your 'Command Center' feel.
      */}
      <div className="flex flex-col md:flex-row w-full h-screen md:overflow-hidden bg-[#fcfaf7]">
        
        {/* SIDEBAR: Desktop only */}
        <aside className="hidden md:block z-50 h-full flex-shrink-0 border-r border-stone-200">
          <Sidebar />
        </aside>
        
        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto relative">
          {/* Responsive Padding: p-4 for mobile, p-12 for desktop.
            pb-32 on mobile ensures content isn't hidden behind the Bottom Nav.
          */}
          <div className="p-4 md:p-12 pb-32 md:pb-12">
            {children}
          </div>

          {/* Floating Upgrade Button: Pushed up on mobile to clear the Bottom Nav */}
          <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
            <Link
              href="/billing"
              className="flex items-center gap-2.5 px-5 py-3.5 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-stone-800 active:scale-95 transition-all"
            >
              <Sparkles size={14} className="text-[#a9b897] animate-pulse" />
              <span className="hidden sm:inline">Upgrade Plan</span>
            </Link>
          </div>

          {/* MOBILE BOTTOM NAVIGATION: Only visible on small screens (< 768px) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-stone-200 z-[100] px-6 flex items-center justify-between pb-safe">
            <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Home" />
            <MobileNavLink href="/crm" icon={<Users size={20} />} label="CRM" />
            <MobileNavLink href="/projects" icon={<FolderKanban size={20} />} label="Projects" />
            <MobileNavLink href="/invoices" icon={<Receipt size={20} />} label="Invoices" />
            <MobileNavLink href="/settings" icon={<Settings size={20} />} label="Config" />
          </nav>
        </main>
      </div>
    </ThemeProvider>
  );
}

// Simple helper component for the Bottom Nav items
function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-stone-400 active:text-stone-900 transition-colors">
      {icon}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}