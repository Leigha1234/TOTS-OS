// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 'flex h-screen' ensures the layout fills the viewport
    // 'overflow-hidden' prevents the body from scrolling, allowing the sidebar/main to manage their own scroll
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      
      {/* Sidebar container - flex-shrink-0 prevents it from squishing */}
      <div className="flex-shrink-0">
        <Sidebar /> 
      </div>
      
      {/* Main content area - 'flex-1' takes remaining space, 'min-w-0' fixes flexbox text overflow issues */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="w-full">
          {children}
        </div>
      </main>
      
    </div>
  );
}