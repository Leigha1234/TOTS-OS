"use client";

import React, { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  Landmark,
  Receipt,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import MetricCard from "./MetricCard";
import SectionShell from "./SectionShell";
import MiniStat from "./MiniStat";
import StatusPill from "./StatusPill";

type FinanceOverviewProps = {
  metrics?: any;

  invoices?: any[];
  quotes?: any[];
  expenses?: any[];
  vatReturns?: any[];
  taxReturns?: any[];
  payrollEmployees?: any[];
  payslips?: any[];
  timesheets?: any[];
  subscriptions?: any[];
  bankTransactions?: any[];

  onCreateInvoice?: () => void;
  onCreateQuote?: () => void;
  onLogExpense?: () => void;
  onVat?: () => void;
  onTax?: () => void;
  onAddEmployee?: () => void;
  onRecurring?: () => void;
  onNavigate?: (tab: any) => void;

  refresh?: () => void | Promise<void>;
};

const money = (value: number) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function FinanceOverview({
  metrics = {},
  invoices = [],
  quotes = [],
  expenses = [],
  payrollEmployees = [],
  timesheets = [],
  subscriptions = [],

  onLogExpense,
  onVat,
  onTax,
  onNavigate,
}: FinanceOverviewProps) {
  // ==================================================
  // HARDEN ARRAYS
  // ==================================================

  const safeInvoices = Array.isArray(invoices)
    ? invoices
    : [];

  const safeQuotes = Array.isArray(quotes)
    ? quotes
    : [];

  const safeExpenses = Array.isArray(expenses)
    ? expenses
    : [];

  const safePayrollEmployees = Array.isArray(payrollEmployees)
    ? payrollEmployees
    : [];

  const safeTimesheets = Array.isArray(timesheets)
    ? timesheets
    : [];

  const safeSubscriptions = Array.isArray(subscriptions)
    ? subscriptions
    : [];

  // ==================================================
  // METRIC FALLBACKS
  // ==================================================

  const revenue = Number(
    metrics?.revenue ??
      metrics?.revYtd ??
      metrics?.paidRevenue ??
      0
  );

  const operatingCosts = Number(
    metrics?.operatingCosts ??
      metrics?.expensesTotal ??
      metrics?.costs ??
      0
  );

  const vatOwed = Number(
    metrics?.vatOwed ??
      metrics?.vatPool ??
      0
  );

  const taxExposure = Number(
    metrics?.taxExposure ??
      metrics?.taxDue ??
      0
  );

  const healthScore = Number(
    metrics?.healthScore ??
      metrics?.financeHealth ??
      100
  );

  const healthStatus = String(
    metrics?.healthStatus ??
      metrics?.status ??
      "strong"
  );

  const riskSignals = Array.isArray(
    metrics?.riskSignals
  )
    ? metrics.riskSignals
    : [];

  // ==================================================
  // BUILD LEDGER
  // ==================================================

  const ledger = useMemo(() => {
    const invoiceRows = safeInvoices.map(
      (invoice: any) => ({
        id: String(invoice?.id || ""),
        type: "Invoice" as const,
        client:
          invoice?.client_name ||
          invoice?.customer_name ||
          invoice?.customer?.name ||
          "Customer",
        amount: Number(invoice?.amount || 0),
        status: String(
          invoice?.status || "pending"
        ),
        date:
          invoice?.due_date ||
          invoice?.date ||
          invoice?.created_at ||
          "",
      })
    );

    const quoteRows = safeQuotes.map(
      (quote: any) => ({
        id: String(quote?.id || ""),
        type: "Quote" as const,
        client:
          quote?.client_name ||
          quote?.customer_name ||
          quote?.customer?.name ||
          "Client",
        amount: Number(quote?.amount || 0),
        status: String(
          quote?.status || "draft"
        ),
        date:
          quote?.date ||
          quote?.created_at ||
          "",
      })
    );

    return [
      ...invoiceRows,
      ...quoteRows,
    ];
  }, [
    safeInvoices,
    safeQuotes,
  ]);

  // ==================================================
  // DERIVED DATA
  // ==================================================

  const derived = useMemo(() => {
    const netPosition =
      revenue -
      operatingCosts;

    const outstandingInvoices =
      ledger
        .filter(
          (entry) =>
            entry.type ===
              "Invoice" &&
            ![
              "paid",
              "cancelled",
            ].includes(
              String(
                entry.status ||
                  ""
              ).toLowerCase()
            )
        )
        .reduce(
          (
            total,
            entry
          ) =>
            total +
            Number(
              entry.amount ||
                0
            ),
          0
        );

    const overdueInvoices =
      ledger.filter(
        (entry) =>
          entry.type ===
            "Invoice" &&
          String(
            entry.status ||
              ""
          ).toLowerCase() ===
            "overdue"
      );

    const pendingQuotes =
      ledger.filter(
        (entry) =>
          entry.type ===
            "Quote" &&
          [
            "draft",
            "pending",
            "sent",
          ].includes(
            String(
              entry.status ||
                ""
            ).toLowerCase()
          )
      );

    const activeRecurring =
      safeSubscriptions.filter(
        (subscription) =>
          subscription?.active !==
          false
      );

    const recurringMonthly =
      activeRecurring.reduce(
        (
          total,
          subscription
        ) => {
          const amount =
            Number(
              subscription?.amount ||
                0
            );

          const interval =
            String(
              subscription?.interval ||
                ""
            ).toLowerCase();

          if (
            interval ===
            "weekly"
          ) {
            return (
              total +
              (amount * 52) /
                12
            );
          }

          if (
            interval ===
            "yearly"
          ) {
            return (
              total +
              amount / 12
            );
          }

          return (
            total +
            amount
          );
        },
        0
      );

    const recentExpenses =
      [...safeExpenses]
        .sort(
          (a, b) => {
            const aTime =
              a?.date
                ? new Date(
                    a.date
                  ).getTime()
                : 0;

            const bTime =
              b?.date
                ? new Date(
                    b.date
                  ).getTime()
                : 0;

            return (
              bTime -
              aTime
            );
          }
        )
        .slice(
          0,
          5
        );

    const recentLedger =
      [...ledger]
        .sort(
          (a, b) => {
            const aTime =
              a.date
                ? new Date(
                    a.date
                  ).getTime()
                : 0;

            const bTime =
              b.date
                ? new Date(
                    b.date
                  ).getTime()
                : 0;

            return (
              bTime -
              aTime
            );
          }
        )
        .slice(
          0,
          6
        );

    const margin =
      revenue > 0
        ? ((revenue -
            operatingCosts) /
            revenue) *
          100
        : 0;

    const totalPayrollMonthly =
      safePayrollEmployees.reduce(
        (
          total,
          employee
        ) =>
          total +
          Number(
            employee?.salary_gross ||
              0
          ) /
            12,
        0
      );

    const totalHours =
      safeTimesheets.reduce(
        (
          total,
          row
        ) => {
          const hours =
            Number(
              row?.mon || 0
            ) +
            Number(
              row?.tue || 0
            ) +
            Number(
              row?.wed || 0
            ) +
            Number(
              row?.thu || 0
            ) +
            Number(
              row?.fri || 0
            ) +
            Number(
              row?.sat || 0
            ) +
            Number(
              row?.sun || 0
            );

          return (
            total +
            hours
          );
        },
        0
      );

    const labourCost =
      safeTimesheets.reduce(
        (
          total,
          row
        ) => {
          const hours =
            Number(
              row?.mon || 0
            ) +
            Number(
              row?.tue || 0
            ) +
            Number(
              row?.wed || 0
            ) +
            Number(
              row?.thu || 0
            ) +
            Number(
              row?.fri || 0
            ) +
            Number(
              row?.sat || 0
            ) +
            Number(
              row?.sun || 0
            );

          const rate =
            Number(
              row?.hourly_rate ||
                0
            );

          return (
            total +
            hours * rate
          );
        },
        0
      );

    return {
      netPosition,
      outstandingInvoices,
      overdueInvoices,
      pendingQuotes,
      activeRecurring,
      recurringMonthly,
      recentExpenses,
      recentLedger,
      margin,
      totalPayrollMonthly,
      totalHours,
      labourCost,
    };
  }, [
    revenue,
    operatingCosts,
    ledger,
    safeExpenses,
    safeSubscriptions,
    safePayrollEmployees,
    safeTimesheets,
  ]);

  // ==================================================
  // ACTION ITEMS
  // ==================================================

  const actionItems =
    useMemo(() => {
      const items: {
        title: string;
        description: string;
        level:
          | "high"
          | "medium"
          | "low";
        action?: () => void;
      }[] = [];

      if (
        derived
          .overdueInvoices
          .length > 0
      ) {
        items.push({
          title: `${
            derived
              .overdueInvoices
              .length
          } overdue invoice${
            derived
              .overdueInvoices
              .length === 1
              ? ""
              : "s"
          }`,

          description:
            "Outstanding income needs follow-up.",

          level:
            "high",

          action:
            onNavigate
              ? () =>
                  onNavigate(
                    "sales"
                  )
              : undefined,
        });
      }

      if (
        vatOwed > 0
      ) {
        items.push({
          title:
            "VAT provision",

          description: `£${money(
            vatOwed
          )} currently estimated as payable.`,

          level:
            "medium",

          action:
            onVat,
        });
      }

      if (
        taxExposure > 0
      ) {
        items.push({
          title:
            "Tax exposure",

          description: `£${money(
            taxExposure
          )} currently estimated as payable.`,

          level:
            "medium",

          action:
            onTax,
        });
      }

      if (
        derived.netPosition <
        0
      ) {
        items.push({
          title:
            "Negative net position",

          description:
            "Recorded operating costs exceed paid revenue.",

          level:
            "high",

          action:
            onLogExpense,
        });
      }

      riskSignals
        .slice(
          0,
          3
        )
        .forEach(
          (
            signal: string
          ) => {
            items.push({
              title:
                signal,

              description:
                "Review this finance signal and take action if required.",

              level:
                "medium",
            });
          }
        );

      return items.slice(
        0,
        5
      );
    }, [
      derived
        .overdueInvoices
        .length,
      derived.netPosition,
      vatOwed,
      taxExposure,
      riskSignals,
      onNavigate,
      onVat,
      onTax,
      onLogExpense,
    ]);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                Financial
                Control
                Centre
              </p>

              <h2 className="mt-3 text-3xl font-serif italic tracking-tighter sm:text-4xl">
                Business
                position at
                a glance
              </h2>

              <p className="mt-3 max-w-2xl text-sm text-stone-400">
                Revenue,
                costs, cash
                exposure,
                liabilities
                and
                operational
                finance
                signals
                across the
                business.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.3em] text-stone-500">
                  Finance
                  Health
                </p>

                <p className="mt-1 text-2xl font-mono font-bold text-[#a9b897]">
                  {
                    healthScore
                  }
                  /100
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <Activity
                  size={
                    20
                  }
                  className="text-[#a9b897]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MiniStat
              label="Net Position"
              value={`£${money(
                derived.netPosition
              )}`}
              icon={
                <CircleDollarSign
                  size={
                    15
                  }
                />
              }
            />

            <MiniStat
              label="Outstanding"
              value={`£${money(
                derived.outstandingInvoices
              )}`}
              icon={
                <Clock3
                  size={
                    15
                  }
                />
              }
            />

            <MiniStat
              label="VAT Owed"
              value={`£${money(
                vatOwed
              )}`}
              icon={
                <Landmark
                  size={
                    15
                  }
                />
              }
            />

            <MiniStat
              label="Tax Exposure"
              value={`£${money(
                taxExposure
              )}`}
              icon={
                <ShieldCheck
                  size={
                    15
                  }
                />
              }
            />
          </div>
        </div>

        <WalletCards
          size={
            240
          }
          className="absolute -bottom-16 -right-12 opacity-[0.025]"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Paid Revenue"
          value={
            revenue
          }
          sub="Settled invoices"
          icon={
            <TrendingUp />
          }
          isDark
        />

        <MetricCard
          label="Operating Costs"
          value={
            operatingCosts
          }
          sub="Recorded expenses"
          icon={
            <TrendingDown />
          }
        />

        <MetricCard
          label="Recurring MRR"
          value={
            derived.recurringMonthly
          }
          sub={`${
            derived
              .activeRecurring
              .length
          } active schedule${
            derived
              .activeRecurring
              .length ===
            1
              ? ""
              : "s"
          }`}
          icon={
            <Banknote />
          }
        />

        <MetricCard
          label="Monthly Payroll"
          value={
            derived.totalPayrollMonthly
          }
          sub="Gross payroll commitment"
          icon={
            <WalletCards />
          }
        />
      </section>

      <SectionShell
        title="Business Snapshot"
        subtitle="The most useful finance signals for day-to-day decision making."
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Profit Margin
            </p>

            <p className="mt-3 text-2xl font-mono font-bold">
              {derived.margin.toFixed(
                1
              )}
              %
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Overdue
            </p>

            <p className="mt-3 text-2xl font-mono font-bold">
              {
                derived
                  .overdueInvoices
                  .length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Open Quotes
            </p>

            <p className="mt-3 text-2xl font-mono font-bold">
              {
                derived
                  .pendingQuotes
                  .length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-stone-900 p-5 text-white">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Finance Status
            </p>

            <div className="mt-3">
              <StatusPill
                status={
                  healthStatus
                }
              />
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Action Required"
        subtitle="Priority finance items that may need attention."
      >
        {actionItems.length ===
        0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
            <ShieldCheck
              size={
                18
              }
              className="mt-0.5 text-green-600"
            />

            <div>
              <p className="font-bold text-green-700">
                No urgent
                finance
                actions
              </p>

              <p className="mt-1 text-xs text-green-600">
                There are
                currently
                no major
                finance
                warnings
                based on
                recorded
                data.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map(
              (
                item,
                index
              ) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={
                    item.action
                  }
                  disabled={
                    !item.action
                  }
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                    item.level ===
                    "high"
                      ? "border-red-100 bg-red-50"
                      : item.level ===
                        "medium"
                      ? "border-amber-100 bg-amber-50"
                      : "border-stone-100 bg-[#faf9f6]"
                  } ${
                    item.action
                      ? "cursor-pointer hover:shadow-sm"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={
                        16
                      }
                      className={
                        item.level ===
                        "high"
                          ? "mt-0.5 text-red-500"
                          : item.level ===
                            "medium"
                          ? "mt-0.5 text-amber-500"
                          : "mt-0.5 text-stone-400"
                      }
                    />

                    <div>
                      <p
                        className={`font-bold ${
                          item.level ===
                          "high"
                            ? "text-red-700"
                            : item.level ===
                              "medium"
                            ? "text-amber-700"
                            : "text-stone-800"
                        }`}
                      >
                        {
                          item.title
                        }
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          item.level ===
                          "high"
                            ? "text-red-500"
                            : item.level ===
                              "medium"
                            ? "text-amber-600"
                            : "text-stone-400"
                        }`}
                      >
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </div>

                  {item.action && (
                    <ArrowUpRight
                      size={
                        15
                      }
                      className="shrink-0 opacity-50"
                    />
                  )}
                </button>
              )
            )}
          </div>
        )}
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionShell
          title="Recent Sales Activity"
          subtitle="Latest invoices and quotes."
          action={
            onNavigate ? (
              <button
                onClick={() =>
                  onNavigate(
                    "sales"
                  )
                }
                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-900"
              >
                View all
                <ArrowUpRight
                  size={
                    13
                  }
                />
              </button>
            ) : null
          }
        >
          <div className="space-y-2">
            {derived
              .recentLedger
              .length ===
            0 ? (
              <p className="text-sm text-stone-400">
                No sales
                activity
                recorded
                yet.
              </p>
            ) : (
              derived.recentLedger.map(
                (
                  entry
                ) => (
                  <div
                    key={`${entry.type}-${entry.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#faf9f6] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {
                          entry.client
                        }
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-widest text-stone-400">
                        {
                          entry.type
                        }{" "}
                        ·{" "}
                        {formatDate(
                          entry.date
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill
                        status={
                          entry.status ||
                          "draft"
                        }
                      />

                      <span className="font-mono font-bold">
                        £
                        {money(
                          entry.amount
                        )}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </SectionShell>

        <SectionShell
          title="Recent Expenses"
          subtitle="Latest costs recorded against the business."
          action={
            onNavigate ? (
              <button
                onClick={() =>
                  onNavigate(
                    "expenses"
                  )
                }
                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-900"
              >
                View all
                <ArrowUpRight
                  size={
                    13
                  }
                />
              </button>
            ) : null
          }
        >
          <div className="space-y-2">
            {derived
              .recentExpenses
              .length ===
            0 ? (
              <p className="text-sm text-stone-400">
                No expenses
                recorded
                yet.
              </p>
            ) : (
              derived.recentExpenses.map(
                (
                  expense: any
                ) => (
                  <div
                    key={
                      expense.id
                    }
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#faf9f6] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-white">
                        <Receipt
                          size={
                            14
                          }
                          className="text-stone-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {expense.description ||
                            "Business expense"}
                        </p>

                        <p className="mt-1 text-[8px] uppercase tracking-widest text-stone-400">
                          {formatDate(
                            expense.date
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill
                        status={
                          expense.status ||
                          "pending"
                        }
                      />

                      <span className="font-mono font-bold">
                        £
                        {money(
                          expense.amount
                        )}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </SectionShell>
      </div>

      <SectionShell
        title="Workforce Cost"
        subtitle="Payroll and timesheet finance signals connected to the wider system."
        action={
          onNavigate ? (
            <button
              onClick={() =>
                onNavigate(
                  "payroll"
                )
              }
              className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-900"
            >
              Payroll
              <ArrowUpRight
                size={
                  13
                }
              />
            </button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Logged Hours
            </p>

            <p className="mt-3 text-2xl font-mono font-bold">
              {Number(
                derived.totalHours ||
                  0
              ).toLocaleString(
                "en-GB",
                {
                  maximumFractionDigits:
                    1,
                }
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Timesheet
              Labour
            </p>

            <p className="mt-3 text-2xl font-mono font-bold">
              £
              {money(
                derived.labourCost
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-900 p-5 text-white">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Monthly
              Payroll
            </p>

            <p className="mt-3 text-2xl font-mono font-bold text-[#a9b897]">
              £
              {money(
                derived.totalPayrollMonthly
              )}
            </p>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}