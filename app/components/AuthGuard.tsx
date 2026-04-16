"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. If we are on the login page, no need to guard
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initAuth = async () => {
      // 2. Initial check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && mounted) {
        setLoading(false);
      }
    };

    // 3. Listen for auth changes (Magic links, sign-outs, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session) {
        setLoading(false);
      } else if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
        // Only redirect if we aren't already going to login
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Loading state (Splash screen)
  if (loading && pathname !== "/login") {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 animate-spin rounded-full" />
          <p className="text-sm font-medium text-stone-600 animate-pulse">
            Authenticating TOTS OS...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}