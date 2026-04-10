"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
// ✅ Adjusted the path to find your AuthGuard inside app/components/
import AuthGuard from "../../components/AuthGuard";

export default function PortalPage() {
  return (
    <AuthGuard>
      <PortalDashboard />
    </AuthGuard>
  );
}

function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/portal/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    }
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Portal Dashboard 👋
        </h1>
        <p className="text-gray-400 mt-2">
          Logged in as: <span className="text-blue-400">{user?.email}</span>
        </p>
      </header>

      {/* PORTAL SPECIFIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
          <p className="text-gray-400 text-sm">Account Status</p>
          <p className="text-2xl font-bold mt-1 text-green-500">Active</p>
        </div>
        
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
          <p className="text-gray-400 text-sm">Active Projects</p>
          <p className="text-2xl font-bold mt-1 text-white">View All</p>
        </div>
        
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
          <p className="text-gray-400 text-sm">Support</p>
          <p className="text-2xl font-bold mt-1 text-white">Open Ticket</p>
        </div>
      </div>
    </div>
  );
}