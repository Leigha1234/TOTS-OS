"use client";

import {
  Download,
  Fingerprint,
  Plus,
  RefreshCw,
} from "lucide-react";

type FinanceHeaderProps = {
  onCreateDocument?: () => void;
  onCreateInvoice?: () => void;
  onCreateQuote?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
};

export default function FinanceHeader({
  onCreateDocument,
  onCreateInvoice,
  onCreateQuote,
  onRefresh,
  onExport,
  loading = false,
}: FinanceHeaderProps) {
  const handleCreateInvoice = onCreateInvoice ?? onCreateDocument;

  return (
    <header className="rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897] shadow-lg">
              <Fingerprint size={16} />
            </div>

            <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897] animate-pulse" />

            <span className="text-[8px] font-black uppercase tracking-[0.28em] text-stone-300">
              Financial Operations
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-serif italic tracking-tighter text-stone-900 sm:text-4xl lg:text-5xl">
              Finance
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Manage money coming in, money going out, invoices,
              expenses, tax, payroll and financial performance from one place.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-stone-500 transition hover:border-stone-300 hover:text-stone-900 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />

              <span className="text-[8px] font-black uppercase tracking-widest">
                Refresh
              </span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-stone-500 transition hover:border-stone-300 hover:text-stone-900"
            >
              <Download size={13} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                Export
              </span>
            </button>
          )}

          {handleCreateInvoice && (
            <button
              type="button"
              onClick={handleCreateInvoice}
              className="flex h-10 items-center gap-2 rounded-full bg-[#a9b897] px-4 text-stone-900 shadow-lg transition hover:bg-stone-900 hover:text-white active:scale-95"
            >
              <Plus size={14} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                New Invoice
              </span>
            </button>
          )}

          {onCreateQuote && (
            <button
              type="button"
              onClick={onCreateQuote}
              className="flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 text-stone-700 transition hover:border-stone-300 hover:bg-white"
            >
              <Plus size={14} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                New Quote
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}