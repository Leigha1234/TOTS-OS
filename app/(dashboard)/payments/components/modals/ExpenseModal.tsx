"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Receipt,
  X,
} from "lucide-react";

type ExpenseForm = {
  description: string;
  amount: string;
  date: string;
  status: string;
};

type ExpenseModalProps = {
  open: boolean;
  submitting?: boolean;
  expense: ExpenseForm;
  onChange: (
    expense: ExpenseForm
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ExpenseModal({
  open,
  submitting = false,
  expense,
  onChange,
  onClose,
  onSubmit,
}: ExpenseModalProps) {
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
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                  <Receipt size={17} />
                </div>

                <h2 className="font-serif text-3xl italic tracking-tight">
                  Log Expense
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Add a business cost to your
                  expense ledger.
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Description
                </label>

                <input
                  value={
                    expense.description
                  }
                  onChange={(event) =>
                    onChange({
                      ...expense,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. Adobe Creative Cloud"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expense.amount}
                    onChange={(event) =>
                      onChange({
                        ...expense,
                        amount:
                          event.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-8 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Date
                </label>

                <input
                  type="date"
                  value={expense.date}
                  onChange={(event) =>
                    onChange({
                      ...expense,
                      date: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Status
                </label>

                <select
                  value={expense.status}
                  onChange={(event) =>
                    onChange({
                      ...expense,
                      status:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                >
                  <option value="pending">
                    Pending
                  </option>
                  <option value="approved">
                    Approved
                  </option>
                  <option value="paid">
                    Paid
                  </option>
                </select>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Plus size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                Log Expense
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}