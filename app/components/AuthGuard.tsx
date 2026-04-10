"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    check();
  }, []);

  async function check() {
    const {
      data: { session },
    } = await supabase.auth.getSession(); // ✅ FIXED (no more lock error)

    if (!session) {
      window.location.href = "/login";
      return;
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return <>{children}</>;
}