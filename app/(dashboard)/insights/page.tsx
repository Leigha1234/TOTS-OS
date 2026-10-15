"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  ReceiptText,
  FolderKanban,
  CalendarDays,
  CheckSquare,
  Users,
  Repeat,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type InvoiceItem = {
  id: string;
  number: string | null;
  due_date: string | null;
  balance_due: number;
};

type ProductItem = {
  id: string;
  name: string;
  units: number;
  revenue: number;
  orders: number;
};

type TaskItem = {
  id: string;
  title: string;
  due_date: string | null;
  project_id?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  start_time: string;
};

type Report = {
  period: {
    from: string;
    to: string;
    days: number;
  };

  organisation?: {
    id: string;
    name: string;
  };

  modules?: string[];

  finance: {
    invoicePayments: number;
    storeRevenue: number;
    expenses: number;
    outstanding: number;
    overdueAmount: number;
    overdueCount: number;
    overdueInvoices: InvoiceItem[];
    invoicesIssued: number;
  };

  store: {
    revenue: number;
    orders: number;
    units: number;
    averageOrder: number;
    products: ProductItem[];
  };

  subscriptions: {
    active: number;
    storeMrr: number;
    otherActive: number;
    otherMrr: number;
    totalMrr: number;
  };

  work: {
    activeProjects: number;
    overdueProjects: number;
    overdueTasks: number;
    dueToday: number;
    totalTasks: number;
    overdueTaskItems: TaskItem[];
  };

  calendar: {
    upcomingEvents: number;
    upcomingBookings: number;
    events: EventItem[];
  };

  customers: {
    total: number;
    new: number;
  };

  notes: string[];
};

type AccountAccessResponse = {
  allowed?: boolean;
  organisationId?: string | null;
  organisationName?: string | null;
  reason?: string;
};

// ============================================================
// HELPERS
// ============================================================

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(value) || 0);

const formatDate = (value: string | null | undefined) => {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================
// METRIC CARD
// ============================================================

function Metric({
  label,
  value,
  sub,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  icon?: React.ElementType;
}) {
  const content = (
    <div
      className="
        group
        h-full
        rounded-2xl
        border
        border-stone-200
        bg-white
        p-5
        transition-all
        duration-200
        hover:border-[#A9B897]
        hover:shadow-sm
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </div>

        {Icon && (
          <div className="rounded-xl bg-[#FAF8F5] p-2 text-[#4f4a46]">
            <Icon size={17} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-bold text-[#4f4a46]">
        {value}
      </div>

      {sub && (
        <div className="mt-2 text-xs leading-5 text-stone-500">
          {sub}
        </div>
      )}

      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#7C9470]">
          View details
          <ArrowUpRight size={13} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================
// PANEL
// ============================================================

function Panel({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#4f4a46]">
          {title}
        </h2>

        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-semibold text-[#7C9470] hover:underline"
          >
            View all
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}

// ============================================================
// INSIGHTS PAGE
// ============================================================

export default function InsightsPage() {
  const [days, setDays] = useState(30);

  const [report, setReport] = useState<Report | null>(null);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // LOAD INSIGHTS
  // ==========================================================

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        // ====================================================
        // GET AUTHENTICATED SESSION
        // ====================================================

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error(
            "Please sign in to view your business insights.",
          );
        }

        // ====================================================
        // GET AUTHORITATIVE ORGANISATION
        //
        // Uses the same endpoint as the main TOTS-OS sidebar.
        // No localStorage or organisation_members-only lookup.
        // ====================================================

        let organisationId = "";

        const accessResponse = await fetch(
          "/api/account/access",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (accessResponse.ok) {
          const accessData =
            (await accessResponse.json()) as AccountAccessResponse;

          if (
            accessData.allowed === true &&
            accessData.organisationId &&
            UUID_REGEX.test(accessData.organisationId)
          ) {
            organisationId = accessData.organisationId;
          }
        }

        // ====================================================
        // FETCH INSIGHTS
        //
        // If account/access cannot resolve an organisation,
        // the Insights API performs its own authenticated
        // organisation lookup.
        // ====================================================

        const params = new URLSearchParams({
          days: String(days),
        });

        if (organisationId) {
          params.set("organisation_id", organisationId);
        }

        const response = await fetch(
          `/api/insights?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          },
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json?.error ||
              "Unable to load your business insights.",
          );
        }

        setReport(json as Report);
      } catch (error) {
        console.error("Insights loading error:", error);

        setReport(null);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load Insights.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days],
  );

  // ==========================================================
  // INITIAL LOAD / DATE CHANGE
  // ==========================================================

  useEffect(() => {
    void load();
  }, [load]);

  // ==========================================================
  // MODULE VISIBILITY
  // ==========================================================

  const modules = report?.modules;

  const hasModule = (module: string) => {
    // Compatibility with an older API response that does
    // not yet provide module entitlements.
    if (!Array.isArray(modules)) {
      return true;
    }

    return modules.includes(module);
  };

  const showFinance = hasModule("finance");
  const showStore = hasModule("store");
  const showProjects = hasModule("clientsProjects");
  const showCore = hasModule("core");

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-20 md:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4f4a46]">
            <BarChart3 className="h-7 w-7" />

            <h1 className="text-3xl font-bold">
              Insights
            </h1>
          </div>

          <p className="mt-1 text-sm text-stone-500">
            Your business, all in one picture.
          </p>

          {report?.organisation?.name && (
            <div className="mt-2 inline-flex items-center rounded-full border border-[#DCE5D4] bg-[#F0F5EB] px-3 py-1 text-xs font-semibold text-[#607754]">
              {report.organisation.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Reporting period"
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value))
            }
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#4f4a46] outline-none focus:border-[#A9B897]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            className="rounded-xl border border-stone-200 bg-white p-3 text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
            aria-label="Refresh insights"
            title="Refresh insights"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading || refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load Insights
            </p>

            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && !report && !error && (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-8">
          <Loader2 className="h-7 w-7 animate-spin text-[#A9B897]" />

          <p className="mt-4 text-sm font-medium text-stone-600">
            Loading your business insights…
          </p>

          <p className="mt-1 text-xs text-stone-400">
            Gathering your latest business data.
          </p>
        </div>
      )}

      {/* =====================================================
          REPORT
      ===================================================== */}

      {report && (
        <>
          {/* =================================================
              MAIN METRICS
          ================================================= */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {showStore && (
              <Metric
                label="Store revenue"
                value={money(report.store.revenue)}
                sub="Paid orders less recorded refunds"
                href="/store"
                icon={ShoppingBag}
              />
            )}

            {showFinance && (
              <>
                <Metric
                  label="Invoice payments"
                  value={money(report.finance.invoicePayments)}
                  sub="Paid invoices in selected period"
                  href="/payments"
                  icon={ReceiptText}
                />

                <Metric
                  label="Expenses"
                  value={money(report.finance.expenses)}
                  href="/payments"
                  icon={ReceiptText}
                />

                <Metric
                  label="Overdue invoices"
                  value={report.finance.overdueCount}
                  sub={`${money(
                    report.finance.overdueAmount,
                  )} outstanding`}
                  href="/payments"
                  icon={AlertCircle}
                />
              </>
            )}

            {(showFinance || showStore) && (
              <Metric
                label="Monthly recurring"
                value={money(
                  report.subscriptions.totalMrr,
                )}
                sub="Estimated run rate; check overlaps"
                icon={Repeat}
              />
            )}

            {showProjects && (
              <>
                <Metric
                  label="Active projects"
                  value={report.work.activeProjects}
                  sub={`${report.work.overdueProjects} overdue`}
                  href="/projects"
                  icon={FolderKanban}
                />

                <Metric
                  label="Overdue tasks"
                  value={report.work.overdueTasks}
                  sub={`${report.work.dueToday} due today`}
                  href="/projects"
                  icon={CheckSquare}
                />
              </>
            )}

            {showCore && (
              <Metric
                label="Events next 30 days"
                value={report.calendar.upcomingEvents}
                sub={`${report.calendar.upcomingBookings} upcoming bookings`}
                href="/calendar"
                icon={CalendarDays}
              />
            )}
          </div>

          {/* =================================================
              DETAILED REPORTS
          ================================================= */}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ===============================================
                STORE
            =============================================== */}

            {showStore && (
              <Panel
                title="Store performance"
                href="/store"
              >
                <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#4f4a46]">
                      {report.store.orders}
                    </div>

                    <div className="mt-1 text-xs text-stone-500">
                      Paid orders
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-[#4f4a46]">
                      {report.store.units}
                    </div>

                    <div className="mt-1 text-xs text-stone-500">
                      Units sold
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-[#4f4a46]">
                      {money(report.store.averageOrder)}
                    </div>

                    <div className="mt-1 text-xs text-stone-500">
                      Average order
                    </div>
                  </div>
                </div>

                {report.store.products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b text-stone-500">
                        <tr>
                          <th className="py-3 font-medium">
                            Product
                          </th>

                          <th className="font-medium">
                            Units
                          </th>

                          <th className="text-right font-medium">
                            Revenue
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {report.store.products
                          .slice(0, 12)
                          .map((product) => (
                            <tr
                              key={product.id}
                              className="border-b border-stone-100"
                            >
                              <td className="py-3 font-medium text-[#4f4a46]">
                                {product.name}
                              </td>

                              <td className="text-stone-600">
                                {product.units}
                              </td>

                              <td className="text-right font-semibold text-[#4f4a46]">
                                {money(product.revenue)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No paid product sales in this period." />
                )}
              </Panel>
            )}

            {/* ===============================================
                SUBSCRIPTIONS
            =============================================== */}

            {(showStore || showFinance) && (
              <Panel title="Subscriptions">
                <div className="space-y-4">
                  {showStore && (
                    <Metric
                      label="Store subscriptions"
                      value={report.subscriptions.active}
                      sub={`${money(
                        report.subscriptions.storeMrr,
                      )} per month`}
                      icon={Repeat}
                    />
                  )}

                  {showFinance && (
                    <Metric
                      label="Other subscriptions"
                      value={
                        report.subscriptions.otherActive
                      }
                      sub={`${money(
                        report.subscriptions.otherMrr,
                      )} per month`}
                      icon={Repeat}
                    />
                  )}

                  <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    If a subscription appears in both
                    systems, combined recurring revenue
                    may count it twice.
                  </div>
                </div>
              </Panel>
            )}

            {/* ===============================================
                INVOICES
            =============================================== */}

            {showFinance && (
              <Panel
                title="Invoices needing attention"
                href="/payments"
              >
                <div className="mb-4 rounded-xl bg-[#FAF8F5] p-4">
                  <div className="text-xs text-stone-500">
                    Total outstanding
                  </div>

                  <div className="mt-1 text-2xl font-bold text-[#4f4a46]">
                    {money(report.finance.outstanding)}
                  </div>
                </div>

                {report.finance.overdueInvoices.length ? (
                  <div className="space-y-2">
                    {report.finance.overdueInvoices
                      .slice(0, 10)
                      .map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-[#4f4a46]">
                              Invoice{" "}
                              {invoice.number ||
                                invoice.id.slice(0, 8)}
                            </p>

                            <p className="mt-1 text-xs text-stone-500">
                              Due{" "}
                              {formatDate(
                                invoice.due_date,
                              )}
                            </p>
                          </div>

                          <strong className="text-red-600">
                            {money(
                              Number(invoice.balance_due),
                            )}
                          </strong>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState message="No overdue invoices. You're all caught up!" />
                )}
              </Panel>
            )}

            {/* ===============================================
                WORKLOAD
            =============================================== */}

            {showProjects && (
              <Panel
                title="Workload & deadlines"
                href="/projects"
              >
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <Metric
                    label="Total tasks"
                    value={report.work.totalTasks}
                    icon={CheckSquare}
                  />

                  <Metric
                    label="Overdue"
                    value={report.work.overdueTasks}
                    icon={AlertCircle}
                  />
                </div>

                {report.work.overdueTaskItems.length ? (
                  <div className="space-y-1">
                    {report.work.overdueTaskItems
                      .slice(0, 8)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-3 border-b border-stone-100 py-3 text-sm"
                        >
                          <span className="font-medium text-[#4f4a46]">
                            {task.title || "Untitled task"}
                          </span>

                          <span className="shrink-0 text-xs font-medium text-red-600">
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState message="No overdue tasks." />
                )}
              </Panel>
            )}

            {/* ===============================================
                EVENTS
            =============================================== */}

            {showCore && (
              <Panel
                title="Upcoming events"
                href="/calendar"
              >
                {report.calendar.events.length ? (
                  <div className="space-y-1">
                    {report.calendar.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between gap-4 border-b border-stone-100 py-3 text-sm"
                      >
                        <span className="font-medium text-[#4f4a46]">
                          {event.title}
                        </span>

                        <span className="shrink-0 text-xs text-stone-500">
                          {formatDate(event.start_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No events in the next 30 days." />
                )}
              </Panel>
            )}

            {/* ===============================================
                CUSTOMERS
            =============================================== */}

            {showCore && (
              <Panel
                title="Customers & business activity"
                href="/crm"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Metric
                    label="Total customers"
                    value={report.customers.total}
                    icon={Users}
                  />

                  <Metric
                    label="New customers"
                    value={report.customers.new}
                    icon={Users}
                  />

                  {showFinance && (
                    <Metric
                      label="Invoices issued"
                      value={report.finance.invoicesIssued}
                      icon={ReceiptText}
                    />
                  )}

                  <Metric
                    label="Upcoming bookings"
                    value={
                      report.calendar.upcomingBookings
                    }
                    icon={CalendarDays}
                  />
                </div>
              </Panel>
            )}
          </div>

          {/* =================================================
              REPORTING NOTES
          ================================================= */}

          {report.notes?.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5">
              <h2 className="font-semibold text-[#4f4a46]">
                About these figures
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-stone-600">
                {report.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-xs text-stone-400">
            <span>
              Reporting period:{" "}
              {formatDate(report.period.from)} –{" "}
              {formatDate(report.period.to)}
            </span>

            <span>
              Powered by TOTS-OS Insights
            </span>
          </div>
        </>
      )}
    </main>
  );
}