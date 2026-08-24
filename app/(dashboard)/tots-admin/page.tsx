"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import {
  Activity,
  AlertTriangle,
  Building2,
  CircleDollarSign,
  CreditCard,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import {
  supabase,
} from "../../../lib/supabase";

import {
  toast,
} from "sonner";

// ============================================================
// TYPES
// ============================================================

type OverviewResponse = {
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
  };

  organisations: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
  };

  subscriptions: {
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
    byTier: Record<
      string,
      number
    >;
  };

  store: {
    enabledOrganisations: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    orders: number;
    paidOrders: number;
    revenue: number;
  };

  generatedAt: string;
};

type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;

  organisationId:
    | string
    | null;

  organisationName:
    | string
    | null;

  role:
    | string
    | null;

  subscriptionTier:
    | string
    | null;

  createdAt:
    | string
    | null;

  lastSignInAt:
    | string
    | null;
};

type AdminOrganisation = {
  id: string;

  name: string;

  createdAt:
    | string
    | null;

  subscriptionTier:
    | string
    | null;

  subscriptionStatus:
    | string
    | null;

  storeEnabled: boolean;

  storeSubscriptionStatus:
    | string
    | null;

  storeStripeCustomerId:
    | string
    | null;

  storeStripeSubscriptionId:
    | string
    | null;
};

type AdminActivity = {
  id: string;

  type: string;

  title: string;

  description:
    | string
    | null;

  organisationId:
    | string
    | null;

  organisationName:
    | string
    | null;

  createdAt:
    | string
    | null;
};

type RevenueTier = {
  organisations: number;

  monthlyPrice: number;

  estimatedMrr: number;
};

type RevenueResponse = {
  estimatedMrr: number;

  coreEstimatedMrr: number;

  storeEstimatedMrr: number;

  storeRevenue: number;

  paidStoreOrders: number;

  activeStoreSubscriptions: number;

  byTier: Record<
    string,
    RevenueTier
  >;

  generatedAt: string;
};

// ============================================================
// HELPERS
// ============================================================

function formatMoney(
  value:
    number
) {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style:
        "currency",

      currency:
        "GBP",

      maximumFractionDigits:
        0,
    }
  ).format(
    value || 0
  );
}

// ============================================================

function formatDate(
  value:
    string |
    null
) {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

// ============================================================

function getStatusClass(
  value:
    string |
    null |
    undefined
) {
  const status =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    [
      "active",
      "paid",
      "trialing",
      "live",
    ].includes(
      status
    )
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "past_due",
      "unpaid",
      "incomplete",
      "paused",
    ].includes(
      status
    )
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (
    [
      "canceled",
      "cancelled",
      "inactive",
      "disabled",
    ].includes(
      status
    )
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-stone-100 bg-stone-50 text-stone-500";
}

// ============================================================
// PAGE
// ============================================================

export default function TotsAdminPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    overview,
    setOverview,
  ] =
    useState<
      OverviewResponse |
      null
    >(null);

  const [
    users,
    setUsers,
  ] =
    useState<
      AdminUser[]
    >([]);

  const [
    organisations,
    setOrganisations,
  ] =
    useState<
      AdminOrganisation[]
    >([]);

  const [
    activity,
    setActivity,
  ] =
    useState<
      AdminActivity[]
    >([]);

  const [
    revenue,
    setRevenue,
  ] =
    useState<
      RevenueResponse |
      null
    >(null);

  // ==========================================================
  // ACCESS TOKEN
  // ==========================================================

  const getAccessToken =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .auth
            .getSession();

        if (
          error
        ) {
          throw error;
        }

        const token =
          data
            .session
            ?.access_token;

        if (
          !token
        ) {
          throw new Error(
            "You need to sign in again."
          );
        }

        return token;
      },
      []
    );

  // ==========================================================
  // ADMIN FETCH
  // ==========================================================

  const adminFetch =
    useCallback(
      async <
        T,
      >(
        url:
          string
      ): Promise<T> => {
        const token =
          await getAccessToken();

        const response =
          await fetch(
            url,
            {
              method:
                "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache:
                "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
            `Request failed (${response.status})`
          );
        }

        return data as T;
      },
      [
        getAccessToken,
      ]
    );

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard =
    useCallback(
      async (
        background =
          false
      ) => {
        try {
          if (
            background
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setPageError(
            null
          );

          const [
            overviewData,
            usersData,
            organisationData,
            activityData,
            revenueData,
          ] =
            await Promise.all([
              adminFetch<
                OverviewResponse
              >(
                "/api/tots-admin/overview"
              ),

              adminFetch<{
                users:
                  AdminUser[];
              }>(
                "/api/tots-admin/users"
              ),

              adminFetch<{
                organisations:
                  AdminOrganisation[];
              }>(
                "/api/tots-admin/organisations"
              ),

              adminFetch<{
                activity:
                  AdminActivity[];
              }>(
                "/api/tots-admin/activity"
              ),

              adminFetch<
                RevenueResponse
              >(
                "/api/tots-admin/revenue"
              ),
            ]);

          setOverview(
            overviewData
          );

          setUsers(
            usersData
              .users ||
            []
          );

          setOrganisations(
            organisationData
              .organisations ||
            []
          );

          setActivity(
            activityData
              .activity ||
            []
          );

          setRevenue(
            revenueData
          );
        } catch (
          error:
            unknown
        ) {
          console.error(
            "[TOTS ADMIN] Dashboard load failed:",
            error
          );

          const message =
            error instanceof
              Error
              ? error.message
              : "TOTS admin dashboard could not be loaded.";

          setPageError(
            message
          );

          toast.error(
            message
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        adminFetch,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      void loadDashboard();
    },
    [
      loadDashboard,
    ]
  );

  // ==========================================================
  // STORE ADOPTION
  // ==========================================================

  const storeAdoption =
    useMemo(
      () => {
        if (
          !overview ||
          overview
            .organisations
            .total <=
            0
        ) {
          return 0;
        }

        return Math.round(
          (
            overview
              .store
              .enabledOrganisations /
            overview
              .organisations
              .total
          ) *
            100
        );
      },
      [
        overview,
      ]
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2
            size={
              28
            }
            className="mx-auto mb-4 animate-spin text-[#a9b897]"
          />

          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-400">
            Loading TOTS Control Centre
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR / ACCESS DENIED
  // ==========================================================

  if (
    pageError ||
    !overview ||
    !revenue
  ) {
    return (
      <div className="min-h-screen bg-stone-50 p-5 md:p-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-red-100 bg-white p-8">
          <AlertTriangle
            size={
              24
            }
            className="mb-5 text-red-500"
          />

          <h1 className="font-serif text-4xl italic text-stone-800">
            Admin dashboard unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {
              pageError ||
              "The dashboard could not be loaded."
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="mt-6 rounded-2xl bg-stone-900 px-5 py-3 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-24 md:p-8 lg:p-10">
      <div className="mx-auto max-w-[1500px]">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-[#829473]">
              Private Founder Dashboard
            </p>

            <h1 className="font-serif text-5xl italic text-stone-800 md:text-7xl">
              TOTS Control Centre
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              Everything happening across
              TOTS-OS in one private
              platform dashboard.
            </p>
          </div>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              void loadDashboard(
                true
              )
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-stone-600 transition hover:border-[#a9b897]"
          >
            <RefreshCw
              size={
                14
              }
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </header>

        {/* ===================================================
            MAIN METRICS
        =================================================== */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
          <Metric
            icon={
              Users
            }
            label="Users"
            value={String(
              overview
                .users
                .total
            )}
            sub={`+${overview.users.newLast7Days} this week`}
          />

          <Metric
            icon={
              Building2
            }
            label="Organisations"
            value={String(
              overview
                .organisations
                .total
            )}
            sub={`+${overview.organisations.newLast30Days} this month`}
          />

          <Metric
            icon={
              CreditCard
            }
            label="Active Plans"
            value={String(
              overview
                .subscriptions
                .active
            )}
            sub={`${overview.subscriptions.trialing} trialing`}
          />

          <Metric
            icon={
              AlertTriangle
            }
            label="Payment Issues"
            value={String(
              overview
                .subscriptions
                .pastDue
            )}
            sub="Need attention"
          />

          <Metric
            icon={
              Store
            }
            label="Store Add-ons"
            value={String(
              overview
                .store
                .enabledOrganisations
            )}
            sub={`${storeAdoption}% adoption`}
          />

          <Metric
            icon={
              ShoppingBag
            }
            label="Paid Orders"
            value={String(
              overview
                .store
                .paidOrders
            )}
            sub={`${overview.store.orders} total`}
          />

          <Metric
            icon={
              CircleDollarSign
            }
            label="Est. MRR"
            value={formatMoney(
              revenue
                .estimatedMrr
            )}
            sub="Core + Store"
          />

          <Metric
            icon={
              TrendingUp
            }
            label="Store GMV"
            value={formatMoney(
              overview
                .store
                .revenue
            )}
            sub="Paid sales"
          />
        </section>

        {/* ===================================================
            REVENUE / HEALTH
        =================================================== */}

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel
            eyebrow="Commercial"
            title="Revenue snapshot"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniMetric
                label="Core Estimated MRR"
                value={formatMoney(
                  revenue
                    .coreEstimatedMrr
                )}
              />

              <MiniMetric
                label="Store Add-on MRR"
                value={formatMoney(
                  revenue
                    .storeEstimatedMrr
                )}
              />

              <MiniMetric
                label="Store GMV"
                value={formatMoney(
                  revenue
                    .storeRevenue
                )}
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-stone-100">
              <table className="w-full text-left">
                <thead className="bg-stone-50">
                  <tr className="text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
                    <th className="px-4 py-3">
                      Plan
                    </th>

                    <th className="px-4 py-3">
                      Businesses
                    </th>

                    <th className="px-4 py-3">
                      Price
                    </th>

                    <th className="px-4 py-3">
                      Est. MRR
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(
                    revenue.byTier
                  ).map(
                    ([
                      tier,
                      row,
                    ]) => (
                      <tr
                        key={
                          tier
                        }
                        className="border-t border-stone-100 text-sm"
                      >
                        <td className="px-4 py-3 font-semibold capitalize text-stone-800">
                          {
                            tier
                          }
                        </td>

                        <td className="px-4 py-3 text-stone-500">
                          {
                            row.organisations
                          }
                        </td>

                        <td className="px-4 py-3 text-stone-500">
                          {formatMoney(
                            row.monthlyPrice
                          )}
                        </td>

                        <td className="px-4 py-3 font-semibold text-stone-800">
                          {formatMoney(
                            row.estimatedMrr
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            eyebrow="Billing"
            title="Subscription health"
          >
            <div className="space-y-3">
              <HealthRow
                label="Active"
                value={
                  overview
                    .subscriptions
                    .active
                }
              />

              <HealthRow
                label="Trialing"
                value={
                  overview
                    .subscriptions
                    .trialing
                }
              />

              <HealthRow
                label="Past due"
                value={
                  overview
                    .subscriptions
                    .pastDue
                }
              />

              <HealthRow
                label="Canceled"
                value={
                  overview
                    .subscriptions
                    .canceled
                }
              />

              <HealthRow
                label="Store active"
                value={
                  overview
                    .store
                    .activeSubscriptions
                }
              />

              <HealthRow
                label="Store payment issues"
                value={
                  overview
                    .store
                    .pastDueSubscriptions
                }
              />
            </div>
          </Panel>
        </section>

        {/* ===================================================
            USERS + ACTIVITY
        =================================================== */}

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel
            eyebrow="Growth"
            title="Newest users"
            icon={
              UserPlus
            }
          >
            <div className="space-y-2">
              {users
                .slice(
                  0,
                  10
                )
                .map(
                  (
                    user
                  ) => (
                    <div
                      key={
                        user.id
                      }
                      className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {user.name ||
                            user.email ||
                            user.id}
                        </p>

                        <p className="mt-1 truncate text-xs text-stone-400">
                          {user.organisationName ||
                            "No organisation"}

                          {" · "}

                          {formatDate(
                            user.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] ${getStatusClass(
                          user.subscriptionTier
                        )}`}
                      >
                        {user.subscriptionTier ||
                          "unknown"}
                      </span>
                    </div>
                  )
                )}
            </div>
          </Panel>

          <Panel
            eyebrow="Live Feed"
            title="Recent activity"
            icon={
              Activity
            }
          >
            <div className="space-y-2">
              {activity.length ===
              0 ? (
                <p className="py-8 text-center text-sm text-stone-400">
                  No recent activity found.
                </p>
              ) : (
                activity
                  .slice(
                    0,
                    12
                  )
                  .map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-stone-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-stone-800">
                              {
                                item.title
                              }
                            </p>

                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-400">
                                {
                                  item.description
                                }
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-[8px] font-semibold text-stone-300">
                            {formatDate(
                              item.createdAt
                            )}
                          </span>
                        </div>

                        {item.organisationName && (
                          <p className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#829473]">
                            {
                              item.organisationName
                            }
                          </p>
                        )}
                      </div>
                    )
                  )
              )}
            </div>
          </Panel>
        </section>

        {/* ===================================================
            ORGANISATIONS
        =================================================== */}

        <Panel
          eyebrow="Platform"
          title="Organisations"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
                  <th className="px-3 py-3">
                    Organisation
                  </th>

                  <th className="px-3 py-3">
                    Plan
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Store
                  </th>

                  <th className="px-3 py-3">
                    Store Status
                  </th>

                  <th className="px-3 py-3">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody>
                {organisations.map(
                  (
                    organisation
                  ) => (
                    <tr
                      key={
                        organisation.id
                      }
                      className="border-t border-stone-100 text-sm"
                    >
                      <td className="px-3 py-3 font-semibold text-stone-800">
                        {
                          organisation.name
                        }
                      </td>

                      <td className="px-3 py-3 capitalize text-stone-500">
                        {organisation.subscriptionTier ||
                          "—"}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge
                          value={
                            organisation.subscriptionStatus
                          }
                        />
                      </td>

                      <td className="px-3 py-3 text-stone-500">
                        {organisation.storeEnabled
                          ? "Enabled"
                          : "Off"}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge
                          value={
                            organisation.storeSubscriptionStatus
                          }
                        />
                      </td>

                      <td className="px-3 py-3 text-stone-400">
                        {formatDate(
                          organisation.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <p className="mt-5 text-right text-[8px] font-black uppercase tracking-[0.14em] text-stone-300">
          Last updated{" "}
          {formatDate(
            overview.generatedAt
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function Metric({
  icon:
    Icon,

  label,

  value,

  sub,
}: {
  icon:
    ElementType;

  label:
    string;

  value:
    string;

  sub:
    string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <Icon
        size={
          17
        }
        className="mb-5 text-[#829473]"
      />

      <p className="font-serif text-3xl italic text-stone-800">
        {
          value
        }
      </p>

      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
        {
          label
        }
      </p>

      <p className="mt-1 text-[9px] text-stone-300">
        {
          sub
        }
      </p>
    </div>
  );
}

// ============================================================

function Panel({
  title,

  eyebrow,

  icon:
    Icon,

  children,
}: {
  title:
    string;

  eyebrow:
    string;

  icon?:
    ElementType;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
            {
              eyebrow
            }
          </p>

          <h2 className="mt-1 font-serif text-2xl italic text-stone-800">
            {
              title
            }
          </h2>
        </div>

        {Icon && (
          <Icon
            size={
              18
            }
            className="text-stone-300"
          />
        )}
      </div>

      {
        children
      }
    </section>
  );
}

// ============================================================

function MiniMetric({
  label,

  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
        {
          label
        }
      </p>

      <p className="mt-2 font-serif text-2xl italic text-stone-800">
        {
          value
        }
      </p>
    </div>
  );
}

// ============================================================

function HealthRow({
  label,

  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
      <span className="text-sm text-stone-500">
        {
          label
        }
      </span>

      <span className="font-serif text-xl italic text-stone-800">
        {
          value
        }
      </span>
    </div>
  );
}

// ============================================================

function StatusBadge({
  value,
}: {
  value:
    string |
    null;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.1em] ${getStatusClass(
        value
      )}`}
    >
      {
        value ||
        "—"
      }
    </span>
  );
}