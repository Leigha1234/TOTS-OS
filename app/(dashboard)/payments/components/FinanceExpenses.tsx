"use client";

import {
  CheckCircle2,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";

import EmptyState from "./EmptyState";
import SectionShell from "./SectionShell";
import StatusPill from "./StatusPill";

export type FinanceExpense = {
  id: string;
  description: string | null;
  amount: number;
  date: string | null;
  status: string | null;

  category?: string | null;
  supplier?: string | null;
  receipt_url?: string | null;
};

type FinanceExpensesProps = {
  expenses: FinanceExpense[];
  totalExpenses?: number;

  onAddExpense?: () => void;
  onApprove?: (
    expense: FinanceExpense
  ) => void;
  onDelete?: (
    expense: FinanceExpense
  ) => void;
};

const currency = (
  value: number
) =>
  Number(value || 0).toLocaleString(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    }
  );

export default function FinanceExpenses({
  expenses,
  totalExpenses,
  onAddExpense,
  onApprove,
  onDelete,
}: FinanceExpensesProps) {
  const total =
    totalExpenses ??
    expenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount || 0
        ),
      0
    );

  const approvedTotal =
    expenses
      .filter((expense) =>
        [
          "approved",
          "paid",
        ].includes(
          (
            expense.status ||
            ""
          ).toLowerCase()
        )
      )
      .reduce(
        (sum, expense) =>
          sum +
          Number(
            expense.amount || 0
          ),
        0
      );

  const pendingTotal =
    expenses
      .filter(
        (expense) =>
          (
            expense.status ||
            ""
          ).toLowerCase() ===
          "pending"
      )
      .reduce(
        (sum, expense) =>
          sum +
          Number(
            expense.amount || 0
          ),
        0
      );

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 text-white rounded-[2rem] p-6 shadow-xl">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-500">
            Total Expenses
          </p>

          <p className="text-2xl font-mono tracking-tight mt-4 text-[#a9b897]">
            {currency(total)}
          </p>
        </div>

        <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">
            Approved
          </p>

          <p className="text-2xl font-mono tracking-tight mt-4">
            {currency(
              approvedTotal
            )}
          </p>
        </div>

        <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">
            Pending
          </p>

          <p className="text-2xl font-mono tracking-tight mt-4">
            {currency(
              pendingTotal
            )}
          </p>
        </div>
      </div>

      {/* EXPENSE LIST */}
      <SectionShell
        title="Business Expenses"
        subtitle="Track outgoing business costs, supplier payments and receipts."
        action={
          onAddExpense ? (
            <button
              type="button"
              onClick={
                onAddExpense
              }
              className="
                bg-stone-900
                text-white
                px-5 py-2.5
                rounded-full
                flex items-center
                gap-2
                hover:bg-[#a9b897]
                hover:text-stone-900
                transition-all
              "
            >
              <Plus size={14} />

              <span className="text-[8px] font-black uppercase tracking-widest">
                Log Expense
              </span>
            </button>
          ) : null
        }
      >
        {expenses.length ===
        0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Log your business costs here to keep your financial records up to date."
            actionLabel={
              onAddExpense
                ? "Log Expense"
                : undefined
            }
            onAction={
              onAddExpense
            }
          />
        ) : (
          <div className="space-y-3">
            {expenses.map(
              (expense) => {
                const status =
                  (
                    expense.status ||
                    "pending"
                  ).toLowerCase();

                const canApprove =
                  !!onApprove &&
                  ![
                    "approved",
                    "paid",
                  ].includes(
                    status
                  );

                return (
                  <div
                    key={
                      expense.id
                    }
                    className="
                      group
                      bg-[#faf9f6]
                      border
                      border-stone-100
                      rounded-[1.5rem]
                      p-4 sm:p-5
                      flex
                      flex-col
                      md:flex-row
                      md:items-center
                      justify-between
                      gap-4
                      hover:bg-white
                      hover:shadow-sm
                      transition-all
                    "
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-[#a9b897] shrink-0">
                        <Receipt
                          size={
                            17
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">
                          {expense.description ||
                            "Untitled expense"}
                        </p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                            {expense.date ||
                              "No date"}
                          </span>

                          {expense.category && (
                            <span className="text-[8px] uppercase tracking-widest text-stone-400">
                              {
                                expense.category
                              }
                            </span>
                          )}

                          {expense.supplier && (
                            <span className="text-[8px] uppercase tracking-widest text-stone-400">
                              {
                                expense.supplier
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <StatusPill
                        status={
                          expense.status ||
                          "pending"
                        }
                      />

                      <span className="font-mono font-bold text-lg min-w-[100px] text-right">
                        {currency(
                          expense.amount
                        )}
                      </span>

                      <div className="flex items-center gap-1">
                        {canApprove && (
                          <button
                            type="button"
                            title="Approve expense"
                            onClick={() =>
                              onApprove?.(
                                expense
                              )
                            }
                            className="p-2.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2
                              size={
                                14
                              }
                            />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            title="Delete expense"
                            onClick={() =>
                              onDelete(
                                expense
                              )
                            }
                            className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2
                              size={
                                14
                              }
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </SectionShell>
    </div>
  );
}