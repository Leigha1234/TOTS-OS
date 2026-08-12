"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Repeat,
  X,
} from "lucide-react";

export type RecurringInvoiceForm = {
  client_name: string;
  amount: string;
  interval: string;
  next_run: string;
};

type RecurringInvoiceModalProps = {
  open: boolean;
  submitting?: boolean;
  form: RecurringInvoiceForm;
  onChange: (
    form: RecurringInvoiceForm
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function RecurringInvoiceModal({
  open,
  submitting = false,
  form,
  onChange,
  onClose,
  onSubmit,
}: RecurringInvoiceModalProps) {
  const canSubmit =
    !submitting &&
    form.client_name.trim().length > 0 &&
    form.amount.trim().length > 0 &&
    Number(form.amount) > 0 &&
    form.interval.trim().length > 0 &&
    form.next_run.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
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
                  <Repeat size={17} />
                </div>

                <h2 className="font-serif text-3xl italic tracking-tight">
                  Recurring Invoice
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Schedule repeat billing for
                  retainers, subscriptions or
                  recurring services.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close recurring invoice modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="recurring-client"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Client Name
                </label>

                <input
                  id="recurring-client"
                  value={form.client_name}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      client_name:
                        event.target.value,
                    })
                  }
                  placeholder="Client or company"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="recurring-amount"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Invoice Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    id="recurring-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) =>
                      onChange({
                        ...form,
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
                <label
                  htmlFor="recurring-frequency"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Frequency
                </label>

                <select
                  id="recurring-frequency"
                  value={form.interval}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      interval:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                >
                  <option value="weekly">
                    Weekly
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="quarterly">
                    Quarterly
                  </option>

                  <option value="yearly">
                    Yearly
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="recurring-next-run"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Next Invoice Date
                </label>

                <input
                  id="recurring-next-run"
                  type="date"
                  value={form.next_run}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      next_run:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Repeat size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                Schedule Invoice
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}