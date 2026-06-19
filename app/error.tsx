"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ✅ SAFE LOGGING ONLY (no Supabase calls that can crash the app)
    console.error("Global Error Captured:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: typeof window !== "undefined" ? window.location.href : "server",
    });

    // 🧠 OPTIONAL: future-safe hook (Sentry / analytics can go here later)
    // NEVER block UI on external requests here.
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-12 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-4xl font-serif italic text-stone-800">
          System Deviation.
        </h2>

        <p className="text-stone-400 text-sm">
          A glitch was detected in the grid. Please refresh the session.
        </p>

        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
        >
          Re-Initialize
        </button>
      </div>
    </div>
  );
}