"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Loader2,
  Plus,
  Receipt,
  UserRound,
  X,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

export type ExpenseCustomer = {
  id: string;
  name: string;
  email?: string | null;
};

export type ExpenseProject = {
  id: string;
  name: string;
  customer_id?: string | null;
  status?: string | null;
};

export type ExpenseForm = {
  description: string;
  amount: string;
  date: string;
  status: string;

  customerId: string;
  projectId: string;
};

// ============================================================
// PROPS
// ============================================================

type ExpenseModalProps = {
  open: boolean;
  submitting?: boolean;

  expense: ExpenseForm;

  customers: ExpenseCustomer[];
  projects: ExpenseProject[];

  onChange: (
    expense: ExpenseForm
  ) => void;

  onClose: () => void;
  onSubmit: () => void;
};

// ============================================================
// COMPONENT
// ============================================================

export default function ExpenseModal({
  open,
  submitting = false,
  expense,
  customers,
  projects,
  onChange,
  onClose,
  onSubmit,
}: ExpenseModalProps) {
  // ==========================================================
  // PROJECTS FOR SELECTED CLIENT
  // ==========================================================

  const availableProjects =
    expense.customerId
      ? projects.filter(
          (project) =>
            project.customer_id ===
            expense.customerId
        )
      : [];

  // ==========================================================
  // CAN SUBMIT
  // ==========================================================

  const canSubmit =
    !submitting &&
    expense.description.trim().length > 0 &&
    expense.amount.trim().length > 0 &&
    Number(expense.amount) > 0 &&
    expense.date.trim().length > 0;

  // ==========================================================
  // RENDER
  // ==========================================================

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
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                  <Receipt size={17} />
                </div>

                <h2 className="font-serif text-3xl italic tracking-tight">
                  Log Expense
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Add a business cost and optionally connect it
                  to a client and project.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close expense modal"
                className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* =================================================
                FIELDS
            ================================================= */}

            <div className="space-y-4">
              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="expense-description"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Description
                </label>

                <input
                  id="expense-description"
                  value={expense.description}
                  disabled={submitting}
                  onChange={(event) =>
                    onChange({
                      ...expense,

                      description:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. Adobe Creative Cloud"
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
                />
              </div>

              {/* CLIENT */}

              <div>
                <label
                  htmlFor="expense-client"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Client
                </label>

                <div className="relative">
                  <UserRound
                    size={14}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                  />

                  <select
                    id="expense-client"
                    value={expense.customerId}
                    disabled={submitting}
                    onChange={(event) =>
                      onChange({
                        ...expense,

                        customerId:
                          event.target.value,

                        projectId: "",
                      })
                    }
                    className="w-full appearance-none rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
                  >
                    <option value="">
                      General business expense
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {!expense.customerId && (
                  <p className="mt-2 text-[10px] leading-4 text-stone-400">
                    Leave this as a general business expense if
                    it does not belong to a specific client.
                  </p>
                )}
              </div>

              {/* PROJECT */}

              {expense.customerId && (
                <div>
                  <label
                    htmlFor="expense-project"
                    className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                  >
                    Project
                  </label>

                  <div className="relative">
                    <Briefcase
                      size={14}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <select
                      id="expense-project"
                      value={expense.projectId}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange({
                          ...expense,

                          projectId:
                            event.target.value,
                        })
                      }
                      className="w-full appearance-none rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">
                        Client expense — no project
                      </option>

                      {availableProjects.map(
                        (project) => (
                          <option
                            key={project.id}
                            value={project.id}
                          >
                            {project.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {availableProjects.length ===
                    0 && (
                    <p className="mt-2 text-[10px] leading-4 text-stone-400">
                      This client has no linked projects yet.
                      You can still record the expense against
                      the client.
                    </p>
                  )}

                  {expense.projectId && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#a9b897]/10 p-3">
                      <Briefcase
                        size={13}
                        className="mt-0.5 shrink-0 text-[#829473]"
                      />

                      <p className="text-[10px] leading-4 text-stone-600">
                        This expense will contribute to the
                        selected project's{" "}
                        <strong>
                          Expenses, Budget Remaining and
                          Projected Profit
                        </strong>
                        .
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AMOUNT */}

              <div>
                <label
                  htmlFor="expense-amount"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    £
                  </span>

                  <input
                    id="expense-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={expense.amount}
                    disabled={submitting}
                    onChange={(event) =>
                      onChange({
                        ...expense,

                        amount:
                          event.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] py-3 pl-8 pr-4 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              {/* DATE */}

              <div>
                <label
                  htmlFor="expense-date"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Date
                </label>

                <input
                  id="expense-date"
                  type="date"
                  value={expense.date}
                  disabled={submitting}
                  onChange={(event) =>
                    onChange({
                      ...expense,

                      date:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
                />
              </div>

              {/* STATUS */}

              <div>
                <label
                  htmlFor="expense-status"
                  className="mb-2 block text-[8px] font-black uppercase tracking-[0.25em] text-stone-400"
                >
                  Status
                </label>

                <select
                  id="expense-status"
                  value={expense.status}
                  disabled={submitting}
                  onChange={(event) =>
                    onChange({
                      ...expense,

                      status:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-100 bg-[#faf9f6] px-4 py-3 text-sm outline-none transition focus:border-stone-900 focus:bg-white disabled:opacity-60"
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

            {/* =================================================
                SUBMIT
            ================================================= */}

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
                <Plus size={15} />
              )}

              <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                {submitting
                  ? "Saving..."
                  : "Log Expense"}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}