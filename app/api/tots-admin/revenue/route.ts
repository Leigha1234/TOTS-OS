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

const ADMIN_USER_ID =
  "f0524a73-0559-467f-9465-095e43c3952e";

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

if (
  !supabaseUrl ||
  !serviceRoleKey
) {
  throw new Error(
    "Supabase environment variables are missing."
  );
}

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
// CURRENT TOTS MONTHLY PRICES
//
// Update this if your prices change.
// ============================================================

const PLAN_PRICES:
  Record<
    string,
    number
  > =
  {
    starter:
      29,

    standard:
      29,

    professional:
      59,

    elite:
      99,
  };

const STORE_PRICE =
  39;

// ============================================================
// HELPERS
// ============================================================

function clean(
  value:
    unknown
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();
}

function bearer(
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

async function requireAdmin(
  req:
    Request
) {
  const token =
    bearer(
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

async function optionalRows(
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
        `[TOTS ADMIN] Revenue table ${table} unavailable:`,
        error.message
      );

      return [];
    }

    return data || [];
  } catch (
    error
  ) {
    console.warn(
      `[TOTS ADMIN] Revenue table ${table} failed:`,
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

    const [
      organisations,
      profiles,
      storeOrders,
    ] =
      await Promise.all([
        optionalRows(
          "organisations"
        ),

        optionalRows(
          "profiles"
        ),

        optionalRows(
          "store_orders"
        ),
      ]);

    // ========================================================
    // PLAN PER ORGANISATION
    // ========================================================

    const organisationTiers =
      new Map<
        string,
        string
      >();

    organisations.forEach(
      (
        organisation
      ) => {
        const id =
          String(
            organisation.id ||
            ""
          );

        if (
          !id
        ) {
          return;
        }

        const tier =
          clean(
            organisation
              .subscription_tier ||
            organisation.plan ||
            organisation.tier
          );

        if (
          tier
        ) {
          organisationTiers.set(
            id,
            tier
          );
        }
      }
    );

    // ========================================================
    // PROFILE FALLBACK
    // ========================================================

    profiles.forEach(
      (
        profile
      ) => {
        const organisationId =
          String(
            profile
              .organisation_id ||
            ""
          );

        if (
          !organisationId ||
          organisationTiers.has(
            organisationId
          )
        ) {
          return;
        }

        const tier =
          clean(
            profile
              .subscription_tier
          );

        if (
          tier
        ) {
          organisationTiers.set(
            organisationId,
            tier
          );
        }
      }
    );

    // ========================================================
    // CORE MRR
    // ========================================================

    const byTier:
      Record<
        string,
        {
          organisations:
            number;

          monthlyPrice:
            number;

          estimatedMrr:
            number;
        }
      > =
      {};

    let coreEstimatedMrr =
      0;

    organisationTiers.forEach(
      (
        tier
      ) => {
        const price =
          PLAN_PRICES[
            tier
          ] ||
          0;

        if (
          !byTier[tier]
        ) {
          byTier[tier] = {
            organisations:
              0,

            monthlyPrice:
              price,

            estimatedMrr:
              0,
          };
        }

        byTier[
          tier
        ].organisations +=
          1;

        byTier[
          tier
        ].estimatedMrr +=
          price;

        coreEstimatedMrr +=
          price;
      }
    );

    // ========================================================
    // STORE MRR
    // ========================================================

    const activeStoreOrganisations =
      organisations.filter(
        (
          organisation
        ) => {
          const status =
            clean(
              organisation
                .store_subscription_status
            );

          return (
            organisation
              .store_enabled ===
              true &&
            [
              "active",
              "trialing",
            ].includes(
              status
            )
          );
        }
      );

    const storeEstimatedMrr =
      activeStoreOrganisations.length *
      STORE_PRICE;

    // ========================================================
    // STORE SALES
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
            clean(
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
        estimatedMrr:
          coreEstimatedMrr +
          storeEstimatedMrr,

        coreEstimatedMrr,

        storeEstimatedMrr,

        storeRevenue:
          Number(
            storeRevenue.toFixed(
              2
            )
          ),

        paidStoreOrders:
          paidOrders.length,

        activeStoreSubscriptions:
          activeStoreOrganisations.length,

        byTier,

        pricing: {
          plans:
            PLAN_PRICES,

          store:
            STORE_PRICE,
        },

        generatedAt:
          new Date()
            .toISOString(),
      },
      {
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
      "[TOTS ADMIN] Revenue failed:",
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
              ? "You do not have access to TOTS admin."
              : "Admin revenue could not be loaded.",
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