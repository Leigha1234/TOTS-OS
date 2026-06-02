"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const isPublicRoute = pathname === "/login";

    const initAuth = async () => {
      // Skip auth guard on login page
      if (isPublicRoute) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        // Use getUser (more reliable than getSession for SSR/client sync)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          router.replace("/login");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        if (mounted) {
          router.replace("/login");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session) {
        setLoading(false);
      } else {
        router.replace("/login");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Loading state (prevents CRM blank page hang)
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