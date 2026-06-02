"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    let mounted = true;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.push("/login");
      }

      setLoading(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session) {
        setLoading(false);
      } else if (pathname !== "/login") {
        router.push("/login");
      }
    });

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