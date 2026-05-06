// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";
import { ThemeProvider } from "../components/GlobalProviders";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider>
      <div className="fixed inset-0 flex w-full h-full overflow-hidden">
        
        {/* Sidebar container */}
        <aside className="z-50 h-full flex-shrink-0 border-r border-stone-200">
          <Sidebar />
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 h-full overflow-y-auto relative">
          <div className="p-8">
            {children}
          </div>

          {/* Floating Upgrade Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Link
              href="/settings/billing" // Or the target route for your upgrade / billing view
              className="flex items-center gap-2.5 px-5 py-3.5 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-stone-800 active:scale-95 transition-all"
            >
              <Sparkles size={14} className="text-stone-300 animate-pulse" />
              <span>Upgrade Plan</span>
            </Link>
          </div>

        </main>
        
      </div>
    </ThemeProvider>
  );
}