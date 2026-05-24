"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const finalizeRegistration = async () => {
      if (!sessionId) return;
      
      try {
        // Call a server action or API to finish the setup
        const res = await fetch("/api/auth/finalize-registration", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
        
        if (res.ok) router.push("/dashboard");
      } catch (err) {
        console.error("Failed to finalize:", err);
      }
    };
    
    finalizeRegistration();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-stone-400" size={48} />
      <p className="mt-4 font-black uppercase tracking-widest text-xs">Initializing your workspace...</p>
    </div>
  );
}