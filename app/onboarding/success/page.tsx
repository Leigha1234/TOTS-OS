"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * SuccessHandler component contains the logic that uses searchParams.
 * By moving this into its own component, we can wrap it in a Suspense
 * boundary, which is required by Next.js for client-side search parameter access.
 */
function SuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    
    const finaliseRegistration = async () => {
      try {
        // Calling your server-side route to finalise account creation
        const res = await fetch("/api/auth/finalise-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        
        if (res.ok) {
          router.push("/dashboard");
        } else {
          console.error("Failed to finalise registration.");
        }
      } catch (err) {
        console.error("Finalisation error:", err);
      }
    };
    
    finaliseRegistration();
  }, [sessionId, router]);

  return <Loader2 className="animate-spin text-stone-400" size={48} />;
}

/**
 * The main page component must be the default export.
 * It wraps the logic in a Suspense boundary to satisfy Next.js requirements.
 */
export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-300" size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
            Starting your workspace...
          </p>
        </div>
      }>
        <SuccessHandler />
      </Suspense>
      <p className="mt-8 font-black uppercase tracking-[0.2em] text-[9px] text-stone-300">
        Secure Hand-off in Progress
      </p>
    </div>
  );
}