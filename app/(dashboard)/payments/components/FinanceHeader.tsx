"use client";

import {
  Download,
  Fingerprint,
  Plus,
  RefreshCw,
} from "lucide-react";

type FinanceHeaderProps = {
  onCreateDocument?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
};

export default function FinanceHeader({
  onCreateDocument,
  onRefresh,
  onExport,
  loading = false,
}: FinanceHeaderProps) {
  return (
    <header className="bg-white border border-stone-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        {/* LEFT */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 text-[#a9b897] rounded-xl flex items-center justify-center shadow-lg">
              <Fingerprint size={18} />
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />

            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">
              Financial Operations
            </span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic tracking-tighter leading-none text-stone-900">
              Finance
            </h1>

            <p className="text-sm text-stone-500 mt-4 max-w-2xl leading-relaxed">
              Manage money coming in, money going out,
              invoices, expenses, tax, payroll and financial
              performance from one place.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="
                h-11 px-4
                rounded-full
                border border-stone-200
                bg-white
                text-stone-500
                hover:text-stone-900
                hover:border-stone-300
                transition-all
                flex items-center gap-2
                disabled:opacity-50
              "
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
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
              className="
                h-11 px-4
                rounded-full
                border border-stone-200
                bg-white
                text-stone-500
                hover:text-stone-900
                hover:border-stone-300
                transition-all
                flex items-center gap-2
              "
            >
              <Download size={14} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                Export
              </span>
            </button>
          )}

          {onCreateDocument && (
            <button
              type="button"
              onClick={onCreateDocument}
              className="
                h-11 px-5
                rounded-full
                bg-[#a9b897]
                text-stone-900
                hover:bg-stone-900
                hover:text-white
                transition-all
                shadow-lg
                flex items-center gap-2
                active:scale-95
              "
            >
              <Plus size={15} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                Invoice / Quote
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}