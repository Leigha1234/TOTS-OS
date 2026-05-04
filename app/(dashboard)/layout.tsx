// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    // 'fixed inset-0' ensures the layout fills the browser viewport exactly
    // 'flex' establishes the horizontal alignment for the sidebar + main
    <div className="fixed inset-0 flex w-full h-full overflow-hidden bg-[#faf9f6]">
      
      {/* Sidebar container 
         'flex-shrink-0' keeps it from squishing.
         'w-64' sets the sidebar width (ensure this matches Sidebar.tsx).
      */}
      <aside className="z-50 h-full flex-shrink-0 border-r border-stone-200">
        <Sidebar />
      </aside>
      
      {/* Main content area 
         'flex-1' takes up the remaining horizontal space.
         'overflow-y-auto' allows the dashboard content to scroll independently.
         'bg-[#faf9f6]' maintains a seamless aesthetic with the scheduler page.
      */}
      <main className="flex-1 h-full overflow-y-auto bg-[#faf9f6]">
        <div className="p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}