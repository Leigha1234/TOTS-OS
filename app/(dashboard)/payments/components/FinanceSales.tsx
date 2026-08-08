"use client";

import React, {
  useMemo,
  useState,
} from "react";

import {
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle2,
  Trash2,
  Receipt,
  TrendingUp,
  Clock3,
  CircleDollarSign,
  Repeat,
  AlertCircle,
} from "lucide-react";

import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import StatusPill from "./StatusPill";

// ==================================================
// TYPES
// ==================================================

type DocType =
  | "Invoice"
  | "Quote";

type LedgerEntry = {
  id: string;
  type: DocType;
  client: string;
  amount: number;
  status: string;
  date: string;
};

type Subscription = {
  id: string;
  client_name: string | null;
  amount: number | null;
  interval: string | null;
  next_run: string | null;
  active: boolean | null;
};

type FinanceSalesProps = {
  ledger?: LedgerEntry[];

  invoices?: any[];
  quotes?: any[];
  customers?: any[];

  subscriptions?: Subscription[];

  metrics?: any;

  onCreateInvoice?: () => void;
  onNewInvoice?: () => void;

  onCreateQuote?: () => void;
  onNewQuote?: () => void;

  onRecurring?: () => void;
  onScheduleRecurring?: () => void;

  onMarkInvoicePaid?: (
    id: string
  ) => void | Promise<void>;

  onMarkPaid?: (
    id: string
  ) => void | Promise<void>;

  onMarkQuoteAccepted?: (
    id: string
  ) => void | Promise<void>;

  onQuoteAccepted?: (
    id: string
  ) => void | Promise<void>;

  onDeleteInvoice?: (
    id: string
  ) => void | Promise<void>;

  onDeleteQuote?: (
    id: string
  ) => void | Promise<void>;

  onDelete?: (
    type: string,
    id: string
  ) => void | Promise<void>;

  onToggleSubscription?: (
    subscription: Subscription
  ) => void | Promise<void>;

  onToggleRecurring?: (
    subscription: Subscription
  ) => void | Promise<void>;

  refresh?: () =>
    | void
    | Promise<void>;
};

// ==================================================
// HELPERS
// ==================================================

const formatMoney = (
  value: number
) =>
  Number(
    value || 0
  ).toLocaleString(
    "en-GB",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  );

const formatDate = (
  value?: string | null
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

// ==================================================
// COMPONENT
// ==================================================

export default function FinanceSales({
  ledger = [],
  invoices = [],
  quotes = [],
  customers = [],
  subscriptions = [],
  metrics = {},

  onCreateInvoice,
  onNewInvoice,

  onCreateQuote,
  onNewQuote,

  onRecurring,
  onScheduleRecurring,

  onMarkInvoicePaid,
  onMarkPaid,

  onMarkQuoteAccepted,
  onQuoteAccepted,

  onDeleteInvoice,
  onDeleteQuote,
  onDelete,

  onToggleSubscription,
  onToggleRecurring,
}: FinanceSalesProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      | "all"
      | "invoice"
      | "quote"
    >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  // ==================================================
  // CUSTOMER LOOKUP
  // ==================================================

  const customerMap =
    useMemo(() => {
      return new Map<
        string,
        string
      >(
        customers.map(
          (
            customer: any
          ) => [
            String(
              customer?.id ??
                ""
            ),

            String(
              customer?.name ??
                "Unknown Client"
            ),
          ]
        )
      );
    }, [customers]);

  // ==================================================
  // NORMALISE INVOICES + QUOTES INTO LEDGER
  // ==================================================

  const combinedLedger =
    useMemo<
      LedgerEntry[]
    >(() => {
      /*
       * If a pre-built ledger was supplied,
       * use it.
       */
      if (
        Array.isArray(
          ledger
        ) &&
        ledger.length > 0
      ) {
        return ledger;
      }

      const invoiceEntries: LedgerEntry[] =
        (
          Array.isArray(
            invoices
          )
            ? invoices
            : []
        ).map(
          (
            invoice: any
          ) => ({
            id: String(
              invoice?.id ??
                ""
            ),

            type:
              "Invoice",

            client:
              invoice?.client_name ||
              customerMap.get(
                String(
                  invoice?.customer_id ??
                    ""
                )
              ) ||
              "Unknown Client",

            amount:
              Number(
                invoice?.amount ??
                  0
              ),

            status:
              String(
                invoice?.status ??
                  "pending"
              ),

            date:
              String(
                invoice?.due_date ??
                  invoice?.date ??
                  invoice?.created_at ??
                  ""
              ),
          })
        );

      const quoteEntries: LedgerEntry[] =
        (
          Array.isArray(
            quotes
          )
            ? quotes
            : []
        ).map(
          (
            quote: any
          ) => ({
            id: String(
              quote?.id ??
                ""
            ),

            type:
              "Quote",

            client:
              String(
                quote?.client_name ??
                  "Unknown Client"
              ),

            amount:
              Number(
                quote?.amount ??
                  0
              ),

            status:
              String(
                quote?.status ??
                  "draft"
              ),

            date:
              String(
                quote?.date ??
                  quote?.created_at ??
                  ""
              ),
          })
        );

      return [
        ...invoiceEntries,
        ...quoteEntries,
      ].sort(
        (
          a,
          b
        ) => {
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
      );
    }, [
      ledger,
      invoices,
      quotes,
      customerMap,
    ]);

  // ==================================================
  // DERIVED SALES METRICS
  // ==================================================

  const derivedMetrics =
    useMemo(() => {
      const invoiceRows =
        combinedLedger.filter(
          (
            entry
          ) =>
            entry.type ===
            "Invoice"
        );

      const quoteRows =
        combinedLedger.filter(
          (
            entry
          ) =>
            entry.type ===
            "Quote"
        );

      const revenuePaid =
        invoiceRows
          .filter(
            (
              entry
            ) =>
              String(
                entry.status ??
                  ""
              ).toLowerCase() ===
              "paid"
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

      const outstandingRevenue =
        invoiceRows
          .filter(
            (
              entry
            ) =>
              ![
                "paid",
                "cancelled",
                "void",
              ].includes(
                String(
                  entry.status ??
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

      const overdueRows =
        invoiceRows.filter(
          (
            entry
          ) =>
            String(
              entry.status ??
                ""
            ).toLowerCase() ===
            "overdue"
        );

      const overdueRevenue =
        overdueRows.reduce(
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

      const openQuoteRows =
        quoteRows.filter(
          (
            entry
          ) =>
            ![
              "accepted",
              "converted",
              "rejected",
              "expired",
              "cancelled",
            ].includes(
              String(
                entry.status ??
                  ""
              ).toLowerCase()
            )
        );

      const quotesOpenValue =
        openQuoteRows.reduce(
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

      return {
        revenuePaid:
          Number(
            metrics?.revenuePaid ??
              metrics?.revYtd ??
              revenuePaid
          ),

        outstandingRevenue:
          Number(
            metrics?.outstandingRevenue ??
              metrics?.outstanding ??
              outstandingRevenue
          ),

        overdueRevenue:
          Number(
            metrics?.overdueRevenue ??
              overdueRevenue
          ),

        quotesOpenValue:
          Number(
            metrics?.quotesOpenValue ??
              quotesOpenValue
          ),

        overdueCount:
          overdueRows.length,
      };
    }, [
      combinedLedger,
      metrics,
    ]);

  // ==================================================
  // SALES SIGNALS
  // ==================================================

  const salesSignals =
    useMemo(() => {
      const overdueCount =
        combinedLedger.filter(
          (
            entry
          ) =>
            String(
              entry.status ??
                ""
            ).toLowerCase() ===
            "overdue"
        ).length;

      const pendingCount =
        combinedLedger.filter(
          (
            entry
          ) =>
            [
              "pending",
              "sent",
              "draft",
            ].includes(
              String(
                entry.status ??
                  ""
              ).toLowerCase()
            )
        ).length;

      const safeSubscriptions =
        Array.isArray(
          subscriptions
        )
          ? subscriptions
          : [];

      const activeSubscriptions =
        safeSubscriptions.filter(
          (
            subscription
          ) =>
            Boolean(
              subscription?.active
            )
        ).length;

      const recurringMonthlyValue =
        safeSubscriptions
          .filter(
            (
              subscription
            ) =>
              Boolean(
                subscription?.active
              )
          )
          .reduce(
            (
              total,
              subscription
            ) => {
              const amount =
                Number(
                  subscription?.amount ??
                    0
                );

              const interval =
                String(
                  subscription?.interval ??
                    "monthly"
                ).toLowerCase();

              if (
                interval ===
                "weekly"
              ) {
                return (
                  total +
                  (amount *
                    52) /
                    12
                );
              }

              if (
                interval ===
                "yearly"
              ) {
                return (
                  total +
                  amount /
                    12
                );
              }

              if (
                interval ===
                "quarterly"
              ) {
                return (
                  total +
                  amount /
                    3
                );
              }

              return (
                total +
                amount
              );
            },
            0
          );

      return {
        overdueCount,
        pendingCount,
        activeSubscriptions,
        recurringMonthlyValue,
      };
    }, [
      combinedLedger,
      subscriptions,
    ]);

  // ==================================================
  // STATUS OPTIONS
  // ==================================================

  const statusOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          combinedLedger
            .map(
              (
                entry
              ) =>
                String(
                  entry?.status ??
                    ""
                )
                  .trim()
                  .toLowerCase()
            )
            .filter(
              Boolean
            )
        )
      ).sort();
    }, [
      combinedLedger,
    ]);

  // ==================================================
  // FILTER LEDGER
  // ==================================================

  const filteredLedger =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return combinedLedger.filter(
        (
          entry
        ) => {
          const client =
            String(
              entry?.client ??
                ""
            ).toLowerCase();

          const id =
            String(
              entry?.id ??
                ""
            ).toLowerCase();

          const status =
            String(
              entry?.status ??
                ""
            ).toLowerCase();

          const type =
            String(
              entry?.type ??
                ""
            ).toLowerCase();

          const matchesSearch =
            !query ||
            client.includes(
              query
            ) ||
            id.includes(
              query
            ) ||
            status.includes(
              query
            );

          const matchesType =
            typeFilter ===
              "all" ||
            type ===
              typeFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      combinedLedger,
      searchQuery,
      typeFilter,
      statusFilter,
    ]);

  // ==================================================
  // NORMALISED CALLBACKS
  // ==================================================

  const handleCreateInvoice =
    onCreateInvoice ??
    onNewInvoice;

  const handleCreateQuote =
    onCreateQuote ??
    onNewQuote;

  const handleRecurring =
    onRecurring ??
    onScheduleRecurring;

  const handleToggleRecurring =
    onToggleSubscription ??
    onToggleRecurring;

  const handleMarkStatus =
    async (
      entry: LedgerEntry
    ) => {
      if (
        entry.type ===
        "Invoice"
      ) {
        const handler =
          onMarkInvoicePaid ??
          onMarkPaid;

        if (handler) {
          await handler(
            entry.id
          );
        }

        return;
      }

      const handler =
        onMarkQuoteAccepted ??
        onQuoteAccepted;

      if (handler) {
        await handler(
          entry.id
        );
      }
    };

  const handleDelete =
    async (
      entry: LedgerEntry
    ) => {
      if (
        entry.type ===
        "Invoice"
      ) {
        if (
          onDeleteInvoice
        ) {
          await onDeleteInvoice(
            entry.id
          );

          return;
        }

        if (
          onDelete
        ) {
          await onDelete(
            "invoice",
            entry.id
          );
        }

        return;
      }

      if (
        onDeleteQuote
      ) {
        await onDeleteQuote(
          entry.id
        );

        return;
      }

      if (
        onDelete
      ) {
        await onDelete(
          "quote",
          entry.id
        );
      }
    };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          METRICS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Paid Revenue"
          value={
            derivedMetrics.revenuePaid
          }
          sub="Settled invoices"
          icon={
            <TrendingUp />
          }
          isDark
        />

        <MetricCard
          label="Outstanding"
          value={
            derivedMetrics.outstandingRevenue
          }
          sub="Still to collect"
          icon={
            <Clock3 />
          }
        />

        <MetricCard
          label="Overdue"
          value={
            derivedMetrics.overdueRevenue
          }
          sub={`${
            salesSignals.overdueCount
          } overdue record${
            salesSignals.overdueCount ===
            1
              ? ""
              : "s"
          }`}
          icon={
            <AlertCircle />
          }
        />

        <MetricCard
          label="Open Quotes"
          value={
            derivedMetrics.quotesOpenValue
          }
          sub="Pipeline value"
          icon={
            <FileText />
          }
        />
      </div>

      {/* ==================================================
          SALES OVERVIEW
      ================================================== */}

      <SectionShell
        title="Sales Overview"
        subtitle="Monitor invoices, quotes, money owed and recurring revenue."
        action={
          <div className="flex flex-wrap gap-2">
            {handleCreateInvoice && (
              <button
                type="button"
                onClick={
                  handleCreateInvoice
                }
                className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
              >
                <Plus
                  size={14}
                />
                Invoice
              </button>
            )}

            {handleCreateQuote && (
              <button
                type="button"
                onClick={
                  handleCreateQuote
                }
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-stone-700 transition-all hover:bg-stone-900 hover:text-white"
              >
                <FileText
                  size={14}
                />
                Quote
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Pending
              Documents
            </p>

            <p className="mt-3 font-mono text-3xl font-bold">
              {
                salesSignals.pendingCount
              }
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Draft,
              pending or
              sent
              documents
              awaiting
              completion.
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf9f6] p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Active
              Recurring
            </p>

            <p className="mt-3 font-mono text-3xl font-bold">
              {
                salesSignals.activeSubscriptions
              }
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Active
              recurring
              billing
              schedules.
            </p>
          </div>

          <div className="rounded-2xl bg-stone-900 p-5 text-white">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Monthly
              Recurring
            </p>

            <p className="mt-3 font-mono text-3xl font-bold text-[#a9b897]">
              £
              {formatMoney(
                salesSignals.recurringMonthlyValue
              )}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Estimated
              monthly value
              of recurring
              billing.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* ==================================================
          RECURRING INVOICES
      ================================================== */}

      <SectionShell
        title="Recurring Invoices"
        subtitle="Manage subscriptions and repeat billing schedules."
        action={
          handleRecurring ? (
            <button
              type="button"
              onClick={
                handleRecurring
              }
              className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
            >
              <Repeat
                size={14}
              />
              Schedule
            </button>
          ) : null
        }
      >
        {subscriptions.length ===
        0 ? (
          <div className="py-12 text-center">
            <Repeat
              size={28}
              className="mx-auto mb-4 text-stone-200"
            />

            <p className="text-sm font-semibold text-stone-600">
              No recurring
              invoices
              scheduled.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Repeat
              billing
              schedules
              will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(
              (
                subscription
              ) => (
                <div
                  key={
                    subscription.id
                  }
                  className="flex flex-col justify-between gap-4 rounded-2xl bg-[#faf9f6] p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-900">
                      {subscription.client_name ||
                        "Unnamed client"}
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-widest text-stone-400">
                      {subscription.interval ||
                        "No interval"}{" "}
                      · next{" "}
                      {formatDate(
                        subscription.next_run
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono font-bold text-stone-900">
                      £
                      {formatMoney(
                        Number(
                          subscription.amount ||
                            0
                        )
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleRecurring?.(
                          subscription
                        )
                      }
                      disabled={
                        !handleToggleRecurring
                      }
                      className={`rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all disabled:cursor-default ${
                        subscription.active
                          ? "border-green-100 bg-green-50 text-green-600"
                          : "border-stone-200 bg-stone-100 text-stone-400"
                      }`}
                    >
                      {subscription.active
                        ? "Active"
                        : "Paused"}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </SectionShell>

      {/* ==================================================
          TRANSACTIONS
      ================================================== */}

      <section className="overflow-hidden rounded-[2.5rem] border border-stone-100 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <h3 className="font-serif text-3xl italic tracking-tighter sm:text-4xl">
                Transaction
                Logs
              </h3>

              <p className="mt-2 text-sm text-stone-500">
                Invoices,
                quotes,
                payments
                and
                outstanding
                revenue.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative flex-1 xl:w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9b897]"
                  size={14}
                />

                <input
                  value={
                    searchQuery
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchQuery(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search transactions..."
                  className="w-full rounded-full border border-stone-100 bg-[#faf9f6] py-3 pl-10 pr-4 text-xs outline-none transition-all focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={
                    typeFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setTypeFilter(
                      event
                        .target
                        .value as
                        | "all"
                        | "invoice"
                        | "quote"
                    )
                  }
                  className="rounded-full border border-stone-100 bg-[#faf9f6] px-4 py-3 text-[9px] font-black uppercase tracking-widest outline-none"
                >
                  <option value="all">
                    All Types
                  </option>

                  <option value="invoice">
                    Invoices
                  </option>

                  <option value="quote">
                    Quotes
                  </option>
                </select>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event
                        .target
                        .value
                    )
                  }
                  className="rounded-full border border-stone-100 bg-[#faf9f6] px-4 py-3 text-[9px] font-black uppercase tracking-widest outline-none"
                >
                  <option value="all">
                    All Status
                  </option>

                  {statusOptions.map(
                    (
                      status
                    ) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {
                          status
                        }
                      </option>
                    )
                  )}
                </select>

                <div className="flex items-center justify-center rounded-full bg-stone-900 p-3 text-[#a9b897]">
                  <Filter
                    size={15}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="bg-[#faf9f6]">
                {[
                  "Reference",
                  "Client",
                  "Type",
                  "Status",
                  "Date",
                  "Amount",
                  "Actions",
                ].map(
                  (
                    heading
                  ) => (
                    <th
                      key={
                        heading
                      }
                      className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400"
                    >
                      {
                        heading
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-50">
              {filteredLedger.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      7
                    }
                    className="px-8 py-14 text-center"
                  >
                    <Receipt
                      size={28}
                      className="mx-auto mb-4 text-stone-200"
                    />

                    <p className="text-sm font-semibold text-stone-600">
                      No matching
                      transactions.
                    </p>

                    <p className="mt-1 text-xs text-stone-400">
                      Create an
                      invoice or
                      quote to get
                      started.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLedger.map(
                  (
                    entry
                  ) => {
                    const lowerStatus =
                      String(
                        entry.status ||
                          ""
                      ).toLowerCase();

                    const completed =
                      [
                        "paid",
                        "accepted",
                        "converted",
                      ].includes(
                        lowerStatus
                      );

                    const hasMarkHandler =
                      entry.type ===
                      "Invoice"
                        ? Boolean(
                            onMarkInvoicePaid ||
                              onMarkPaid
                          )
                        : Boolean(
                            onMarkQuoteAccepted ||
                              onQuoteAccepted
                          );

                    const hasDeleteHandler =
                      entry.type ===
                      "Invoice"
                        ? Boolean(
                            onDeleteInvoice ||
                              onDelete
                          )
                        : Boolean(
                            onDeleteQuote ||
                              onDelete
                          );

                    return (
                      <tr
                        key={`${entry.type}-${entry.id}`}
                        className="group transition-colors hover:bg-[#faf9f6]/60"
                      >
                        <td className="px-6 py-5">
                          <span className="font-mono text-[9px] font-black text-[#a9b897]">
                            {entry.type ===
                            "Invoice"
                              ? "INV"
                              : "QT"}
                            -
                            {entry.id
                              .slice(
                                0,
                                6
                              )
                              .toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-stone-900">
                            {
                              entry.client
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <FileText
                              size={
                                13
                              }
                            />

                            {
                              entry.type
                            }
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <StatusPill
                            status={
                              entry.status ||
                              "draft"
                            }
                          />
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-xs text-stone-500">
                            {formatDate(
                              entry.date
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-mono font-bold text-stone-900">
                            £
                            {formatMoney(
                              entry.amount
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {!completed &&
                              hasMarkHandler && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleMarkStatus(
                                      entry
                                    )
                                  }
                                  title={
                                    entry.type ===
                                    "Invoice"
                                      ? "Mark paid"
                                      : "Mark accepted"
                                  }
                                  className="rounded-full bg-green-50 p-2 text-green-600 transition-all hover:bg-green-100"
                                >
                                  <CheckCircle2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              )}

                            {hasDeleteHandler && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(
                                    entry
                                  )
                                }
                                title="Delete"
                                className="rounded-full bg-red-50 p-2 text-red-500 transition-all hover:bg-red-100"
                              >
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================================================
          OVERDUE WARNING
      ================================================== */}

      {derivedMetrics.overdueRevenue >
        0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <CircleDollarSign
            size={17}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="font-bold text-red-600">
              Outstanding
              overdue
              revenue
            </p>

            <p className="mt-1 text-xs text-red-400">
              £
              {formatMoney(
                derivedMetrics.overdueRevenue
              )}{" "}
              is currently
              marked
              overdue.
              Follow-up
              may be
              required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}