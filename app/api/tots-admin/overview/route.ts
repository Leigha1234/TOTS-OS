import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ADMIN
// ============================================================

const ADMIN_USER_ID =
  "f0524a73-0559-467f-9465-095e43c3952e";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

if (
  !supabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !serviceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

// ============================================================
// CLIENT
// ============================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    }
  );

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toLowerCase()
    : "";
}

// ============================================================

function getBearerToken(
  req:
    Request
) {
  const header =
    req.headers.get(
      "authorization"
    );

  if (
    !header
      ?.toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  return (
    header
      .slice(
        7
      )
      .trim() ||
    null
  );
}

// ============================================================

async function requireAdmin(
  req:
    Request
) {
  const token =
    getBearerToken(
      req
    );

  if (
    !token
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        token
      );

  if (
    error ||
    !data.user
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  if (
    data.user.id !==
    ADMIN_USER_ID
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }
}

// ============================================================

function isRecent(
  value:
    unknown,

  days:
    number
) {
  if (
    typeof value !==
    "string"
  ) {
    return false;
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
    return false;
  }

  const cutoff =
    Date.now() -
    (
      days *
      24 *
      60 *
      60 *
      1000
    );

  return (
    date.getTime() >=
    cutoff
  );
}

// ============================================================

async function optionalTable(
  table:
    string
) {
  try {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          table
        )
        .select(
          "*"
        )
        .limit(
          10000
        );

    if (
      error
    ) {
      console.warn(
        `[TOTS ADMIN] ${table} could not be loaded:`,
        error.message
      );

      return [];
    }

    return data || [];
  } catch (
    error
  ) {
    console.warn(
      `[TOTS ADMIN] ${table} failed:`,
      error
    );

    return [];
  }
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req:
    Request
) {
  try {
    await requireAdmin(
      req
    );

    // ========================================================
    // USERS
    // ========================================================

    const {
      data:
        authUsersData,

      error:
        authUsersError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .listUsers({
          page:
            1,

          perPage:
            1000,
        });

    if (
      authUsersError
    ) {
      throw authUsersError;
    }

    const users =
      authUsersData
        .users ||
      [];

    // ========================================================
    // OTHER DATA
    // ========================================================

    const [
      organisations,
      profiles,
      storeOrders,
    ] =
      await Promise.all([
        optionalTable(
          "organisations"
        ),

        optionalTable(
          "profiles"
        ),

        optionalTable(
          "store_orders"
        ),
      ]);

    // ========================================================
    // TIERS
    // ========================================================

    const byTier:
      Record<
        string,
        number
      > =
      {};

    const organisationTierFound =
      organisations.some(
        (
          organisation
        ) =>
          Boolean(
            organisation
              .subscription_tier ||
            organisation.plan ||
            organisation.tier
          )
      );

    if (
      organisationTierFound
    ) {
      organisations.forEach(
        (
          organisation
        ) => {
          const tier =
            cleanString(
              organisation
                .subscription_tier ||
              organisation.plan ||
              organisation.tier
            ) ||
            "unknown";

          byTier[tier] =
            (
              byTier[tier] ||
              0
            ) +
            1;
        }
      );
    } else {
      profiles.forEach(
        (
          profile
        ) => {
          const tier =
            cleanString(
              profile
                .subscription_tier
            ) ||
            "unknown";

          byTier[tier] =
            (
              byTier[tier] ||
              0
            ) +
            1;
        }
      );
    }

    // ========================================================
    // CORE SUBSCRIPTIONS
    // ========================================================

    const subscriptionStatuses =
      organisations.map(
        (
          organisation
        ) =>
          cleanString(
            organisation
              .subscription_status ||
            organisation
              .stripe_subscription_status
          )
      );

    // ========================================================
    // STORE SUBSCRIPTIONS
    // ========================================================

    const storeStatuses =
      organisations.map(
        (
          organisation
        ) =>
          cleanString(
            organisation
              .store_subscription_status
          )
      );

    // ========================================================
    // ORDERS
    // ========================================================

    const paidOrders =
      storeOrders.filter(
        (
          order
        ) =>
          [
            "paid",
            "succeeded",
          ].includes(
            cleanString(
              order
                .payment_status
            )
          )
      );

    const storeRevenue =
      paidOrders.reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.total ||
            0
          ),
        0
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        users: {
          total:
            users.length,

          newLast7Days:
            users.filter(
              (
                user
              ) =>
                isRecent(
                  user.created_at,
                  7
                )
            ).length,

          newLast30Days:
            users.filter(
              (
                user
              ) =>
                isRecent(
                  user.created_at,
                  30
                )
            ).length,
        },

        organisations: {
          total:
            organisations.length,

          newLast7Days:
            organisations.filter(
              (
                organisation
              ) =>
                isRecent(
                  organisation
                    .created_at,
                  7
                )
            ).length,

          newLast30Days:
            organisations.filter(
              (
                organisation
              ) =>
                isRecent(
                  organisation
                    .created_at,
                  30
                )
            ).length,
        },

        subscriptions: {
          active:
            subscriptionStatuses.filter(
              (
                status
              ) =>
                status ===
                "active"
            ).length,

          trialing:
            subscriptionStatuses.filter(
              (
                status
              ) =>
                status ===
                "trialing"
            ).length,

          pastDue:
            subscriptionStatuses.filter(
              (
                status
              ) =>
                [
                  "past_due",
                  "unpaid",
                  "incomplete",
                ].includes(
                  status
                )
            ).length,

          canceled:
            subscriptionStatuses.filter(
              (
                status
              ) =>
                [
                  "canceled",
                  "cancelled",
                ].includes(
                  status
                )
            ).length,

          byTier,
        },

        store: {
          enabledOrganisations:
            organisations.filter(
              (
                organisation
              ) =>
                organisation
                  .store_enabled ===
                true
            ).length,

          activeSubscriptions:
            storeStatuses.filter(
              (
                status
              ) =>
                [
                  "active",
                  "trialing",
                ].includes(
                  status
                )
            ).length,

          pastDueSubscriptions:
            storeStatuses.filter(
              (
                status
              ) =>
                [
                  "past_due",
                  "unpaid",
                  "incomplete",
                ].includes(
                  status
                )
            ).length,

          orders:
            storeOrders.length,

          paidOrders:
            paidOrders.length,

          revenue:
            Number(
              storeRevenue.toFixed(
                2
              )
            ),
        },

        generatedAt:
          new Date()
            .toISOString(),
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS ADMIN] Overview failed:",
      error
    );

    const message =
      error instanceof
        Error
        ? error.message
        : "";

    const status =
      message ===
      "UNAUTHENTICATED"
        ? 401
        : message ===
            "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        error:
          status ===
          401
            ? "You need to sign in again."
            : status ===
                403
              ? "You do not have access to the TOTS admin dashboard."
              : "Admin overview could not be loaded.",
      },
      {
        status,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}