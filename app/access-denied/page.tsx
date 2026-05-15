"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * AccessDeniedContent handles the actual logic of reading
 * the URL parameters. This must be a separate component 
 * to work with the Suspense boundary.
 */
function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-xl text-center space-y-6">
        <ShieldAlert className="mx-auto text-red-400" size={48} />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-serif italic text-stone-900">Access Denied</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">
            Security Protocol Violation
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-xs text-red-600 font-bold leading-relaxed">
            {reason || "The security token provided is invalid or has expired."}
          </p>
        </div>

        <Link 
          href="/login" 
          className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors pt-4"
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
}

/**
 * The main page component wraps the content in Suspense.
 * This tells Next.js to skip pre-rendering this during the build,
 * which fixes the "useSearchParams() should be wrapped in a suspense boundary" error.
 */
export default function AccessDeniedPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
          <div className="animate-pulse text-stone-300 font-black uppercase tracking-[0.4em] text-[10px]">
            Verifying Security Credentials...
          </div>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}