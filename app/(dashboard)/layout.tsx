// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-100">
      {/* TEMPORARY DEBUG SIDEBAR */}
      <div className="w-64 bg-red-600 text-white p-4 font-bold">
        SIDEBAR TEST
      </div>
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}