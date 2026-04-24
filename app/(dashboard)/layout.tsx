// app/(dashboard)/layout.tsx
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar is now integrated */}
      <Sidebar /> 
      
      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        {children}
      </main>
    </div>
  );
}