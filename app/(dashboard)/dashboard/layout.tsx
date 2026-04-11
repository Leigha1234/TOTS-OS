"use client";

import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import AuthGuard from "../../components/AuthGuard";
import SetupTeam from "../../components/SetupTeam";
import ErrorBoundary from "../../components/ErrorBoundary";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex relative bg-[#e9e9e1] text-stone-900 antialiased font-sans">
      <Toaster position="top-right" />
      <div className="hidden md:block"><Sidebar /></div>
      <main className="flex-1 min-h-screen p-8 flex flex-col">
        <AuthGuard>
          <SetupTeam />
          <div className="max-w-7xl w-full flex-grow">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </AuthGuard>
        <Footer />
      </main>
    </div>
  );
}