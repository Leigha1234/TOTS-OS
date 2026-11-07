"use client";

import { ArrowUpRight, Download, Plus, RefreshCw, WalletCards } from "lucide-react";

type FinanceHeaderProps = {
  onCreateDocument?: () => void;
  onCreateInvoice?: () => void;
  onCreateQuote?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
};

export default function FinanceHeader({ onCreateDocument, onCreateInvoice, onCreateQuote, onRefresh, onExport, loading = false }: FinanceHeaderProps) {
  const createInvoice = onCreateInvoice ?? onCreateDocument;
  return (
    <header className="relative isolate overflow-hidden rounded-[28px] bg-[#0F3D32] px-6 py-8 text-[#F7EFE6] shadow-[0_18px_50px_-24px_rgba(15,61,50,.65)] sm:px-9 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-24 h-44 w-44 translate-y-1/2 rounded-full bg-[#8CB7A1]/10 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[.14em] text-[#D9E9E0]">
            <WalletCards size={14} aria-hidden="true" /> ORBI. / FINANCIAL WORKSPACE
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-[58px]">Your finances, <em className="font-normal text-[#C4D8CA]">in focus.</em></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#DCE9E1] sm:text-base">Stay on top of invoices, expenses and cash flow — with everything your business needs in one connected workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onRefresh && <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>}
          {onExport && <button type="button" onClick={onExport} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"><Download size={16} />Export</button>}
          {onCreateQuote && <button type="button" onClick={onCreateQuote} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"><Plus size={16} />New quote</button>}
          {createInvoice && <button type="button" onClick={createInvoice} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F7EFE6] px-5 text-sm font-bold text-[#0F3D32] shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Plus size={17} />New invoice<ArrowUpRight size={15} /></button>}
        </div>
      </div>
    </header>
  );
}
