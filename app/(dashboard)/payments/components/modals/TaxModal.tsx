"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator,
  ClipboardCheck,
  Loader2,
  X,
} from "lucide-react";

/*
 * Exported so payments/page.tsx can use
 * the exact same form type.
 */
export type TaxForm = {
  amount: string;
  description: string;
};

type TaxModalProps = {
  open: boolean;
  submitting?: boolean;
  amount: string;
  description: string;
  estimatedAmount?: number;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function TaxModal({
  open,
  submitting = false,
  amount,
  description,
  estimatedAmount = 0,
  onAmountChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: TaxModalProps) {
  const formattedEstimate = Number(
    estimatedAmount || 0
  ).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{
              scale: 0.96,
              opacity: 0,
              y: 12,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.96,
              opacity: 0,
              y: 12,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            {/* HEADER */}
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                  <Calculator size={17} />
                </div>

                <h2 className="font-serif text-3xl italic tracking-tight text-stone-900">
                  Tax Return
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Record your tax provision or
                  return against the current
                  financial period.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close tax modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* ESTIMATED TAX */}
            <div className="mb-5 rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                Current Estimate
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
                £{formattedEstimate}
              </p>
            </div>

            {/* FORM */}
            <div className="space-y-4">
              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="tax-description"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Description
                </label>

                <input
                  id="tax-description"
                  type="text"
                  value={description}
                  disabled={submitting}
                  onChange={(event) =>
                    onDescriptionChange(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Corporation Tax FY 2026"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* AMOUNT */}
              <div>
                <label
                  htmlFor="tax-amount"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    id="tax-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    disabled={submitting}
                    onChange={(event) =>
                      onAmountChange(
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-8 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* HMRC NOTICE */}
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] leading-relaxed text-amber-700">
                TOTS-OS can help track and
                estimate tax figures, but it
                does not submit a statutory
                return to HMRC unless a
                supported HMRC integration is
                configured.
              </p>
            </div>

            {/* SUBMIT */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <ClipboardCheck size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                {submitting
                  ? "Saving..."
                  : "Save Tax Record"}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}