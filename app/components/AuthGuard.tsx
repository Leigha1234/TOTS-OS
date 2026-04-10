"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // 1. If we are on the login page, just stop loading and show the page
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      // 2. Check if we already have a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setLoading(false);
      } else {
        // 3. IMPORTANT: Wait a split second to see if a session is currently being 
        // recovered from the URL hash (common with Magic Links)
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            window.location.href = "/login";
          } else {
            // No session and no sign-in event? Boot to login.
            window.location.href = "/login";
          }
        });

        // Cleanup listener on unmount
        return () => listener.subscription.unsubscribe();
      }
    };

    initAuth();
  }, [pathname]);

  if (loading && pathname !== "/login") {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <p className="text-sm font-medium animate-pulse">Authenticating TOTS OS...</p>
      </div>
    );
  }

  return <>{children}</>;
}