"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ArrowRight, Sparkles } from "lucide-react";

// Change this identifier only when launching a new announcement.
const ANNOUNCEMENT = "orbi-rebrand-2026-v1";

export default function OrbiRebrandWelcome({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      const key = `${ANNOUNCEMENT}:${userId}`;
      if (window.localStorage.getItem(key) !== "seen") setOpen(true);
    } catch {
      // Storage may be disabled. Avoid trapping users in an announcement.
    }
  }, [userId]);

  function dismiss() {
    if (userId) {
      try { window.localStorage.setItem(`${ANNOUNCEMENT}:${userId}`, "seen"); }
      catch { /* Private browsing can block storage. */ }
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#082C24]/75 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="orbi-welcome-title" aria-describedby="orbi-welcome-description" className="relative w-full max-w-[540px] overflow-hidden rounded-[28px] bg-[#F7EFE6] shadow-2xl">
        <div className="relative bg-[#0F3D32] px-8 pb-9 pt-10 text-center text-[#F7EFE6]">
          <button type="button" aria-label="Close welcome message" onClick={dismiss} className="absolute right-4 top-4 rounded-full p-2 text-[#F7EFE6] transition hover:bg-white/15"><X size={20} /></button>
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#082C24]">
            <Image src="/icon.png" alt="ORBI. icon" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl object-cover" />
          </div>
          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#A8BDA8]"><Sparkles size={14} /> A new chapter</div>
          <h2 id="orbi-welcome-title" className="!font-serif !text-[clamp(2.5rem,6vw,4rem)] !font-normal !leading-tight !text-[#F7EFE6]">Welcome to ORBI.</h2>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#F7EFE6]/90">Everything in your orbit.</p>
        </div>
        <div className="px-7 pb-8 pt-7 text-center sm:px-10">
          <p id="orbi-welcome-description" className="text-lg font-semibold text-[#1E2A27]">TOTS-OS has a new name and a fresh new look.</p>
          <p className="mt-3 text-sm leading-7 text-[#42564E]">Meet ORBI. — the same business operating system you know, now with a clearer identity and a more connected experience. Your account, projects, invoices and existing data are all right where you left them.</p>
          <p className="mt-4 text-sm font-medium text-[#0F3D32]">Less chaos. More progress. Your business. One place.</p>
          <button type="button" onClick={dismiss} autoFocus className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D32] px-6 py-4 text-sm font-semibold text-[#F7EFE6] transition hover:bg-[#082C24]">Explore ORBI. <ArrowRight size={18} /></button>
          <p className="mt-4 text-xs text-[#6B7B73]">Nothing you need to do — you're ready to go.</p>
        </div>
      </section>
    </div>
  );
}
