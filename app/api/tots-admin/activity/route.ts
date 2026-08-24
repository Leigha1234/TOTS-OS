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

function text(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  return (
    value.trim() ||
    null
  );
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
    string,

  limit:
    number
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
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          limit
        );

    if (
      error
    ) {
      console.warn(
        `[TOTS ADMIN] ${table} activity skipped:`,
        error.message
      );

      return [];
    }

    return data || [];
  } catch (
    error
  ) {
    console.warn(
      `[TOTS ADMIN] ${table} activity failed:`,
      error
    );

    return [];
  }
}

export async function GET(
  req:
    Request
) {
  try {
    await requireAdmin(
      req
    );

    const [
      organisationResult,
      notifications,
      storeOrders,
      projects,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "organisations"
          )
          .select(
            "id, name"
          )
          .limit(
            5000
          ),

        optionalRows(
          "notifications",
          50
        ),

        optionalRows(
          "store_orders",
          40
        ),

        optionalRows(
          "projects",
          40
        ),
      ]);

    const organisationMap =
      new Map(
        (
          organisationResult.data ||
          []
        ).map(
          (
            organisation
          ) => [
            String(
              organisation.id
            ),

            text(
              organisation.name
            ) ||
              "Unnamed organisation",
          ]
        )
      );

    const activity:
      Array<{
        id:
          string;

        type:
          string;

        title:
          string;

        description:
          string |
          null;

        organisationId:
          string |
          null;

        organisationName:
          string |
          null;

        createdAt:
          string |
          null;
      }> =
      [];

    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    notifications.forEach(
      (
        notification
      ) => {
        const organisationId =
          text(
            notification
              .organisation_id
          );

        activity.push({
          id:
            `notification-${notification.id}`,

          type:
            text(
              notification.type
            ) ||
            "notification",

          title:
            text(
              notification.title
            ) ||
            "Notification",

          description:
            text(
              notification.message
            ) ||
            text(
              notification.content
            ),

          organisationId,

          organisationName:
            organisationId
              ? organisationMap.get(
                  organisationId
                ) ||
                null
              : null,

          createdAt:
            text(
              notification.created_at
            ),
        });
      }
    );

    // ========================================================
    // STORE ORDERS
    // ========================================================

    storeOrders.forEach(
      (
        order
      ) => {
        const organisationId =
          text(
            order
              .organisation_id
          );

        const number =
          text(
            order
              .order_number
          ) ||
          String(
            order.id
          );

        activity.push({
          id:
            `store-${order.id}`,

          type:
            "store_order",

          title:
            `Store order ${number}`,

          description:
            `${text(
              order.payment_status
            ) || "unknown"} · £${Number(
              order.total ||
              0
            ).toFixed(
              2
            )}`,

          organisationId,

          organisationName:
            organisationId
              ? organisationMap.get(
                  organisationId
                ) ||
                null
              : null,

          createdAt:
            text(
              order.created_at
            ),
        });
      }
    );

    // ========================================================
    // PROJECTS
    // ========================================================

    projects.forEach(
      (
        project
      ) => {
        const organisationId =
          text(
            project
              .organisation_id
          );

        activity.push({
          id:
            `project-${project.id}`,

          type:
            "project",

          title:
            text(
              project.name
            ) ||
            "Project created",

          description:
            text(
              project
                .objective_summary
            ) ||
            text(
              project.description
            ),

          organisationId,

          organisationName:
            organisationId
              ? organisationMap.get(
                  organisationId
                ) ||
                null
              : null,

          createdAt:
            text(
              project.created_at
            ),
        });
      }
    );

    // ========================================================
    // SORT
    // ========================================================

    activity.sort(
      (
        first,
        second
      ) =>
        new Date(
          second.createdAt ||
          0
        ).getTime() -
        new Date(
          first.createdAt ||
          0
        ).getTime()
    );

    return NextResponse.json(
      {
        activity:
          activity.slice(
            0,
            100
          ),

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
      "[TOTS ADMIN] Activity failed:",
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
              : "Admin activity could not be loaded.",
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