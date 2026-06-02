"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const isPublicRoute = pathname === "/login";

    const initAuth = async () => {
      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session && !isPublicRoute) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

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