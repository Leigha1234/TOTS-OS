// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    // We use 'fixed inset-0' to force this layout to take over the entire viewport.
    // This prevents the root layout (or other styles) from collapsing its height to 0.
    <div className="fixed inset-0 flex w-full overflow-hidden bg-[var(--bg)]">
      
      {/* Sidebar container 
          'flex-shrink-0' ensures the sidebar never gets compressed.
      */}
      <aside className="z-50 h-full flex-shrink-0">
        <Sidebar />
      </aside>
      
      {/* Main content area 
          'flex-1' makes it fill all remaining horizontal space.
          'overflow-y-auto' enables scrolling for your dashboard content.
      */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-white">
        {children}
      </main>
      
    </div>
  );
}