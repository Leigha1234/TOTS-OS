"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, UserPlus, X } from "lucide-react";

type EmployeeModalProps = {
  open: boolean;
  submitting?: boolean;
  employee: {
    name: string;
    role: string;
    salary_gross: string;
  };
  onChange: (employee: {
    name: string;
    role: string;
    salary_gross: string;
  }) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function EmployeeModal({
  open,
  submitting = false,
  employee,
  onChange,
  onClose,
  onSubmit,
}: EmployeeModalProps) {
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
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.35em] text-[#a9b897]">
                  Payroll
                </p>

                <h2 className="font-serif text-3xl italic tracking-tight text-stone-900">
                  Add Employee
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Add a member of staff to your
                  finance and payroll records.
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Full Name
                </label>

                <input
                  value={employee.name}
                  onChange={(event) =>
                    onChange({
                      ...employee,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Sam Day-Clark"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Role
                </label>

                <input
                  value={employee.role}
                  onChange={(event) =>
                    onChange({
                      ...employee,
                      role: event.target.value,
                    })
                  }
                  placeholder="e.g. Operations Manager"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
                  Gross Annual Salary
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      employee.salary_gross
                    }
                    onChange={(event) =>
                      onChange({
                        ...employee,
                        salary_gross:
                          event.target.value,
                      })
                    }
                    placeholder="30000"
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-8 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-stone-900 py-4 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <UserPlus size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                Add Employee
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}