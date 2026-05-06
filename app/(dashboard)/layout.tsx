// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";
import { ThemeProvider } from "../components/GlobalProviders";

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
        <main className="flex-1 h-full overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
        
      </div>
    </ThemeProvider>
  );
}