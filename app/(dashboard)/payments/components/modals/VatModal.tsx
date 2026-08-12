"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Landmark,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

export type VatForm = {
  amount: string;
  description: string;
};

type VatModalProps = {
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

export default function VatModal({
  open,
  submitting = false,
  amount,
  description,
  estimatedAmount = 0,
  onAmountChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: VatModalProps) {
  const canSubmit =
    !submitting &&
    description.trim().length > 0 &&
    amount.trim().length > 0 &&
    Number(amount) >= 0;

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
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                  <Landmark size={17} />
                </div>

                <h2 className="font-serif text-3xl italic tracking-tight">
                  VAT Return
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Record VAT owed, prepared or
                  submitted for the current
                  period.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close VAT modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-stone-900 p-5 text-white">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                Estimated VAT Position
              </p>

              <p className="mt-2 font-mono text-2xl text-[#a9b897]">
                £
                {Number(
                  estimatedAmount || 0
                ).toLocaleString(
                  "en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="vat-description"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Return Description
                </label>

                <input
                  id="vat-description"
                  value={description}
                  onChange={(event) =>
                    onDescriptionChange(
                      event.target.value
                    )
                  }
                  placeholder="e.g. VAT Return Q2 2026"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="vat-amount"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  VAT Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    id="vat-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) =>
                      onAmountChange(
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-8 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-stone-100 bg-[#faf9f6] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-[#8fa07d]"
                />

                <p className="text-[10px] leading-relaxed text-stone-500">
                  Saving this record updates
                  your TOTS-OS finance ledger.
                  It should only be described as
                  submitted to HMRC when an
                  actual HMRC submission has
                  taken place.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <ShieldCheck size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                Save VAT Return
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}