// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)]">
      
      {/* Sidebar - Ensures it keeps its width and does not shrink */}
      <aside className="flex-shrink-0">
        <Sidebar />
      </aside>
      
      {/* Main Content - Flex-1 takes remaining width, min-w-0 allows content to shrink appropriately */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
      
    </div>
  );
}