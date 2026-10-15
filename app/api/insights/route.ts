import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// HELPERS
// ============================================================

type Row = Record<string, any>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const num = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const iso = (value: unknown): string =>
  typeof value === "string" ? value : "";

const inRange = (
  value: unknown,
  from: string,
  to: string,
): boolean => {
  const date = iso(value).slice(0, 10);
  return Boolean(date && date >= from && date <= to);
};

const done = (value: unknown): boolean =>
  [
    "completed",
    "complete",
    "done",
    "finished",
    "closed",
    "cancelled",
    "canceled",
    "archived",
  ].includes(String(value || "").toLowerCase());

const paid = (value: unknown): boolean =>
  [
    "paid",
    "succeeded",
    "completed",
    "complete",
  ].includes(String(value || "").toLowerCase());

const activeSubscription = (value: unknown): boolean =>
  ["active", "trialing"].includes(
    String(value || "").toLowerCase(),
  );

function monthlyAmount(
  amount: number,
  interval: unknown,
): number {
  const value = String(interval || "month").toLowerCase();

  if (value.includes("year")) return amount / 12;
  if (value.includes("week")) return (amount * 52) / 12;
  if (value.includes("day")) return (amount * 365) / 12;

  return amount;
}

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

// ============================================================
// GET INSIGHTS
// ============================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anon || !service) {
      return errorResponse(
        "Supabase configuration missing.",
        503,
      );
    }

    // ========================================================
    // AUTHENTICATION
    // Supports existing Bearer-token requests and SSR cookies.
    // ========================================================

    const authorization =
      request.headers.get("authorization") || "";

    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    let userId: string | null = null;

    if (token) {
      const auth = createClient(url, anon, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const {
        data: { user },
        error,
      } = await auth.auth.getUser(token);

      if (!error && user) {
        userId = user.id;
      }
    } else {
      const cookieStore = await cookies();

      const auth = createServerClient(url, anon, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only route.
          },
        },
      });

      const {
        data: { user },
        error,
      } = await auth.auth.getUser();

      if (!error && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return errorResponse(
        "Please sign in again.",
        401,
      );
    }

    // ========================================================
    // SERVICE CLIENT
    // Never expose this client or its credentials to the browser.
    // ========================================================

    const db = createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // ========================================================
    // RESOLVE AUTHORISED ORGANISATIONS
    // Mirrors the sources used by /api/account/access.
    // ========================================================

    const authorisedOrganisationIds = new Set<string>();

    const {
      data: profile,
      error: profileError,
    } = await db
      .from("profiles")
      .select("organisation_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Insights profile lookup failed:",
        profileError,
      );

      return errorResponse(
        "Unable to verify organisation access.",
        500,
      );
    }

    if (
      profile?.organisation_id &&
      UUID_REGEX.test(String(profile.organisation_id))
    ) {
      authorisedOrganisationIds.add(
        String(profile.organisation_id),
      );
    }

    const {
      data: memberships,
      error: membershipError,
    } = await db
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", userId);

    if (membershipError) {
      console.error(
        "Insights membership lookup failed:",
        membershipError,
      );

      return errorResponse(
        "Unable to verify organisation access.",
        500,
      );
    }

    for (const membership of memberships || []) {
      if (
        membership.organisation_id &&
        UUID_REGEX.test(String(membership.organisation_id))
      ) {
        authorisedOrganisationIds.add(
          String(membership.organisation_id),
        );
      }
    }

    const {
      data: userOrganisations,
      error: userOrganisationError,
    } = await db
      .from("user_organisations")
      .select("organisation_id")
      .eq("user_id", userId);

    if (userOrganisationError) {
      console.error(
        "Insights user_organisations lookup failed:",
        userOrganisationError,
      );

      return errorResponse(
        "Unable to verify organisation access.",
        500,
      );
    }

    for (const membership of userOrganisations || []) {
      if (
        membership.organisation_id &&
        UUID_REGEX.test(String(membership.organisation_id))
      ) {
        authorisedOrganisationIds.add(
          String(membership.organisation_id),
        );
      }
    }

    const {
      data: ownedOrganisations,
      error: ownershipError,
    } = await db
      .from("organisations")
      .select("id")
      .eq("created_by", userId);

    if (ownershipError) {
      console.error(
        "Insights ownership lookup failed:",
        ownershipError,
      );

      return errorResponse(
        "Unable to verify organisation access.",
        500,
      );
    }

    for (const organisation of ownedOrganisations || []) {
      if (
        organisation.id &&
        UUID_REGEX.test(String(organisation.id))
      ) {
        authorisedOrganisationIds.add(String(organisation.id));
      }
    }

    // ========================================================
    // CHOOSE ACTIVE ORGANISATION
    // ========================================================

    const requestedOrganisationId =
      request.nextUrl.searchParams.get("organisation_id")?.trim() ||
      "";

    if (
      requestedOrganisationId &&
      !UUID_REGEX.test(requestedOrganisationId)
    ) {
      return errorResponse("Invalid organisation.", 400);
    }

    if (authorisedOrganisationIds.size === 0) {
      return errorResponse(
        "No organisation is linked to your account.",
        403,
      );
    }

    let organisationId: string;

    if (requestedOrganisationId) {
      if (!authorisedOrganisationIds.has(requestedOrganisationId)) {
        return errorResponse(
          "You do not have access to this organisation.",
          403,
        );
      }

      organisationId = requestedOrganisationId;
    } else if (
      profile?.organisation_id &&
      authorisedOrganisationIds.has(
        String(profile.organisation_id),
      )
    ) {
      organisationId = String(profile.organisation_id);
    } else if (authorisedOrganisationIds.size === 1) {
      organisationId = [...authorisedOrganisationIds][0];
    } else {
      return errorResponse(
        "Multiple organisations are linked to your account. Please select an active organisation.",
        400,
      );
    }

    // ========================================================
    // VERIFY ORGANISATION EXISTS
    // ========================================================

    const {
      data: organisation,
      error: organisationError,
    } = await db
      .from("organisations")
      .select(
        "id,name,billing_model,subscription_tier,subscription_status,access_status",
      )
      .eq("id", organisationId)
      .maybeSingle();

    if (organisationError || !organisation) {
      console.error(
        "Insights organisation lookup failed:",
        organisationError,
      );

      return errorResponse(
        "Organisation could not be verified.",
        403,
      );
    }

    // ========================================================
    // CHECK MODULE ENTITLEMENTS
    // ========================================================

    const billingModel = String(
      organisation.billing_model || "",
    ).toLowerCase();

    const isLegacy =
      billingModel === "legacy_tier" ||
      (
        !billingModel &&
        ["standard", "professional", "premium", "elite"].includes(
          String(organisation.subscription_tier || "").toLowerCase(),
        )
      );

    let enabledModules: string[] = [];

    if (isLegacy) {
      enabledModules = [
        "core",
        "clientsProjects",
        "finance",
        "social",
        "email",
        "store",
      ];
    } else if (billingModel === "modular") {
      const {
        data: modules,
        error: modulesError,
      } = await db
        .from("organisation_modules")
        .select("module_key")
        .eq("organisation_id", organisationId)
        .eq("status", "active");

      if (modulesError) {
        console.error(
          "Insights module lookup failed:",
          modulesError,
        );

        return errorResponse(
          "Unable to verify reporting permissions.",
          500,
        );
      }

      enabledModules = (modules || []).map(
        (module) => String(module.module_key),
      );
    }

    // A valid organisation link alone is not proof of an
    // active subscription. Require the account access policy
    // to be satisfied before exposing reporting data.
    const subscriptionStatus = String(
      organisation.subscription_status || "",
    ).toLowerCase();

    const accessStatus = String(
      organisation.access_status || "",
    ).toLowerCase();

    if (
      accessStatus !== "active" ||
      !["active", "trialing", "beta", "trial"].includes(
        subscriptionStatus,
      )
    ) {
      return errorResponse(
        "Insights is unavailable for this organisation.",
        403,
      );
    }

    // ========================================================
    // REPORTING PERIOD
    // ========================================================

    const today = new Date().toISOString().slice(0, 10);

    const requestedDays = Number(
      request.nextUrl.searchParams.get("days") || 30,
    );

    const days = Math.min(
      366,
      Math.max(
        7,
        Number.isFinite(requestedDays)
          ? requestedDays
          : 30,
      ),
    );

    const fromDate = new Date(
      Date.now() - (days - 1) * 86400000,
    )
      .toISOString()
      .slice(0, 10);

    const next30 = new Date(
      Date.now() + 30 * 86400000,
    )
      .toISOString()
      .slice(0, 10);

    // ========================================================
    // FETCH REPORTING TABLES
    // ========================================================

    const tables = [
      "invoices",
      "expenses",
      "store_orders",
      "store_products",
      "store_subscriptions",
      "subscriptions",
      "projects",
      "tasks",
      "project_tasks",
      "events",
      "bookings",
      "customers",
    ] as const;

    const financeTables = new Set([
      "invoices",
      "expenses",
    ]);

    const storeTables = new Set([
      "store_orders",
      "store_products",
      "store_subscriptions",
    ]);

    const projectTables = new Set([
      "projects",
      "tasks",
      "project_tasks",
    ]);

    function canReadTable(table: string): boolean {
      if (financeTables.has(table)) {
        return enabledModules.includes("finance");
      }

      if (storeTables.has(table)) {
        return enabledModules.includes("store");
      }

      if (projectTables.has(table)) {
        return enabledModules.includes("clientsProjects");
      }

      if (table === "subscriptions") {
        return enabledModules.includes("finance");
      }

      if (
        table === "events" ||
        table === "bookings" ||
        table === "customers"
      ) {
        return enabledModules.includes("core");
      }

      return false;
    }

    async function all(table: string): Promise<Row[]> {
      if (!canReadTable(table)) {
        return [];
      }

      const rows: Row[] = [];

      for (let start = 0; start < 100000; start += 1000) {
        const { data, error } = await db
          .from(table)
          .select("*")
          .eq("organisation_id", organisationId)
          .range(start, start + 999);

        if (error) {
          throw new Error(`${table}: ${error.message}`);
        }

        rows.push(...(data || []));

        if (!data || data.length < 1000) {
          break;
        }
      }

      return rows;
    }

    const fetched = await Promise.all(
      tables.map((table) => all(table)),
    );

    const data = Object.fromEntries(
      tables.map((table, index) => [
        table,
        fetched[index],
      ]),
    ) as Record<string, Row[]>;

    // ========================================================
    // FINANCE
    // ========================================================

    const invoices = data.invoices.filter(
      (invoice) =>
        ![
          "void",
          "voided",
          "cancelled",
          "canceled",
          "draft",
        ].includes(
          String(invoice.status || "").toLowerCase(),
        ),
    );

    const overdueInvoices = invoices.filter(
      (invoice) =>
        num(invoice.balance_due) > 0 &&
        Boolean(invoice.due_date) &&
        iso(invoice.due_date).slice(0, 10) < today,
    );

    const invoicePaid = invoices
      .filter((invoice) =>
        inRange(invoice.paid_at, fromDate, today),
      )
      .reduce(
        (sum, invoice) =>
          sum + num(invoice.amount_paid),
        0,
      );

    const expenses = data.expenses.filter(
      (expense) =>
        inRange(
          expense.date || expense.created_at,
          fromDate,
          today,
        ) &&
        ![
          "void",
          "cancelled",
          "canceled",
        ].includes(
          String(expense.status || "").toLowerCase(),
        ),
    );

    // ========================================================
    // STORE ORDERS
    // ========================================================

    const orders = data.store_orders.filter(
      (order) =>
        paid(order.payment_status) &&
        inRange(
          order.paid_at ||
            order.checkout_completed_at ||
            order.created_at,
          fromDate,
          today,
        ),
    );

    const orderIds = orders.map((order) => String(order.id));

    const items: Row[] = [];

    if (enabledModules.includes("store")) {
      for (let index = 0; index < orderIds.length; index += 100) {
        const ids = orderIds.slice(index, index + 100);

        const { data: rows, error } = await db
          .from("store_order_items")
          .select(
            "id,order_id,product_id,product_name,quantity,total",
          )
          .in("order_id", ids);

        if (error) {
          throw new Error(
            `store_order_items: ${error.message}`,
          );
        }

        items.push(...(rows || []));
      }
    }

    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        units: number;
        revenue: number;
        orders: Set<string>;
      }
    >();

    for (const item of items) {
      const key = String(
        item.product_id ||
          item.product_name ||
          item.id,
      );

      const row = productMap.get(key) || {
        id: key,
        name: String(
          item.product_name || "Unnamed product",
        ),
        units: 0,
        revenue: 0,
        orders: new Set<string>(),
      };

      row.units += num(item.quantity);
      row.revenue += num(item.total);
      row.orders.add(String(item.order_id));

      productMap.set(key, row);
    }

    const products = [...productMap.values()]
      .map(({ orders: productOrders, ...rest }) => ({
        ...rest,
        orders: productOrders.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ========================================================
    // SUBSCRIPTIONS
    // ========================================================

    const activeSubscriptions =
      data.store_subscriptions.filter(
        (subscription) =>
          activeSubscription(subscription.status),
      );

    const storeMrr = activeSubscriptions.reduce(
      (sum, subscription) =>
        sum +
        monthlyAmount(
          (num(subscription.unit_amount_pence) / 100) *
            num(subscription.quantity || 1),
          subscription.billing_interval,
        ),
      0,
    );

    const otherSubscriptions = data.subscriptions.filter(
      (subscription) =>
        subscription.active === true ||
        String(subscription.status || "").toLowerCase() ===
          "active",
    );

    const otherMrr = otherSubscriptions.reduce(
      (sum, subscription) =>
        sum +
        monthlyAmount(
          num(subscription.amount),
          subscription.interval,
        ),
      0,
    );

    // ========================================================
    // PROJECTS AND TASKS
    // ========================================================

    const activeProjects = data.projects.filter(
      (project) =>
        !project.deleted_at &&
        !done(project.status),
    );

    const allTasks = [
      ...data.tasks.filter((task) => !task.deleted_at),
      ...data.project_tasks,
    ];

    const overdueTasks = allTasks.filter(
      (task) =>
        !done(task.status) &&
        Boolean(task.due_date) &&
        iso(task.due_date).slice(0, 10) < today,
    );

    // ========================================================
    // CALENDAR
    // ========================================================

    const upcomingEvents = data.events.filter(
      (event) =>
        iso(event.start_time).slice(0, 10) >= today &&
        iso(event.start_time).slice(0, 10) <= next30,
    );

    const upcomingBookings = data.bookings.filter(
      (booking) =>
        iso(booking.start_time).slice(0, 10) >= today &&
        iso(booking.start_time).slice(0, 10) <= next30 &&
        !["cancelled", "canceled"].includes(
          String(booking.status || "").toLowerCase(),
        ),
    );

    // ========================================================
    // STORE REVENUE
    // ========================================================

    const storeRevenue = orders.reduce(
      (sum, order) =>
        sum +
        num(order.total) -
        num(order.refunded_amount),
      0,
    );

    // ========================================================
    // RESPONSE
    // Preserve the existing Insights frontend data structure.
    // ========================================================

    const result = {
      period: {
        from: fromDate,
        to: today,
        days,
      },

      finance: {
        invoicePayments: invoicePaid,
        storeRevenue,

        expenses: expenses.reduce(
          (sum, expense) =>
            sum + num(expense.amount),
          0,
        ),

        outstanding: invoices.reduce(
          (sum, invoice) =>
            sum + Math.max(0, num(invoice.balance_due)),
          0,
        ),

        overdueAmount: overdueInvoices.reduce(
          (sum, invoice) =>
            sum + num(invoice.balance_due),
          0,
        ),

        overdueCount: overdueInvoices.length,

        overdueInvoices: overdueInvoices
          .slice(0, 30)
          .map((invoice) => ({
            id: invoice.id,
            number: invoice.invoice_number,
            due_date: invoice.due_date,
            balance_due: invoice.balance_due,
            customer_id: invoice.customer_id,
          })),

        invoicesIssued: invoices.filter((invoice) =>
          inRange(
            invoice.invoice_date || invoice.created_at,
            fromDate,
            today,
          ),
        ).length,
      },

      store: {
        revenue: storeRevenue,
        orders: orders.length,

        units: items.reduce(
          (sum, item) =>
            sum + num(item.quantity),
          0,
        ),

        averageOrder: orders.length
          ? storeRevenue / orders.length
          : 0,

        products: products.slice(0, 50),
      },

      subscriptions: {
        active: activeSubscriptions.length,
        storeMrr,

        otherActive: otherSubscriptions.length,
        otherMrr,

        totalMrr: storeMrr + otherMrr,
      },

      work: {
        activeProjects: activeProjects.length,

        overdueProjects: activeProjects.filter(
          (project) =>
            Boolean(project.due_date) &&
            iso(project.due_date).slice(0, 10) < today,
        ).length,

        overdueTasks: overdueTasks.length,

        dueToday: allTasks.filter(
          (task) =>
            !done(task.status) &&
            iso(task.due_date).slice(0, 10) === today,
        ).length,

        totalTasks: allTasks.length,

        overdueTaskItems: overdueTasks
          .slice(0, 25)
          .map((task) => ({
            id: task.id,
            title: task.title || task.name,
            due_date: task.due_date,
            project_id: task.project_id,
          })),
      },

      calendar: {
        upcomingEvents: upcomingEvents.length,
        upcomingBookings: upcomingBookings.length,

        events: upcomingEvents
          .slice(0, 15)
          .map((event) => ({
            id: event.id,
            title: event.title,
            start_time: event.start_time,
          })),
      },

      customers: {
        total: data.customers.length,

        new: data.customers.filter((customer) =>
          inRange(
            customer.created_at,
            fromDate,
            today,
          ),
        ).length,
      },

      modules: enabledModules,

      organisation: {
        id: organisation.id,
        name: organisation.name,
      },

      notes: [
        "Store revenue and invoice payments are shown separately to avoid assuming they are distinct income sources.",
        "Invoice payments shown use paid invoices; partial payments outside the selected paid date may not be represented.",
        "MRR is a run rate, not cash received. Legacy and Store subscriptions may overlap; review before adding them together.",
        "Event and booking counts may overlap if a booking creates an event.",
      ],
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Insights report error:", error);

    return errorResponse(
      "Could not load Insights. Check server logs and table permissions.",
      500,
    );
  }
}