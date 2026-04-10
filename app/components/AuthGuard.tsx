"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

 async function checkUser() {
  // Give Supabase a heartbeat to catch the session from the URL
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session && window.location.pathname !== "/login") {
    // Check if we are currently "in the middle" of a login redirect
    const isRecoveringSession = window.location.hash.includes('access_token');
    
    if (!isRecoveringSession) {
      window.location.href = "/login";
      return;
    }
  }

  setLoading(false);
}

  // Prevent a "flash" of protected content while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Loading TOTS OS...</div>
      </div>
    );
  }

  return <>{children}</>;
}