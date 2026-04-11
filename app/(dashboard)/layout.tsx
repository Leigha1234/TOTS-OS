"use client";

import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#050505]">
        {/* Sidebar is fixed on the left */}
        <Sidebar />

        {/* Main content area on the right */}
        <main className="flex-1 h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}