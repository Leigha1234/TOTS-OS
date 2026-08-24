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

export async function GET(
  req:
    Request
) {
  try {
    await requireAdmin(
      req
    );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .select(
          "*"
        )
        .limit(
          5000
        );

    if (
      error
    ) {
      throw error;
    }

    const organisations =
      (
        data ||
        []
      )
        .map(
          (
            organisation
          ) => ({
            id:
              String(
                organisation.id
              ),

            name:
              text(
                organisation.name
              ) ||
              text(
                organisation
                  .company_name
              ) ||
              "Unnamed organisation",

            createdAt:
              text(
                organisation
                  .created_at
              ),

            subscriptionTier:
              text(
                organisation
                  .subscription_tier
              ) ||
              text(
                organisation.plan
              ) ||
              text(
                organisation.tier
              ),

            subscriptionStatus:
              text(
                organisation
                  .subscription_status
              ) ||
              text(
                organisation
                  .stripe_subscription_status
              ),

            storeEnabled:
              organisation
                .store_enabled ===
              true,

            storeSubscriptionStatus:
              text(
                organisation
                  .store_subscription_status
              ),

            storeStripeCustomerId:
              text(
                organisation
                  .store_stripe_customer_id
              ),

            storeStripeSubscriptionId:
              text(
                organisation
                  .store_stripe_subscription_id
              ),
          })
        )
        .sort(
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
        organisations,

        total:
          organisations.length,

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
      "[TOTS ADMIN] Organisations failed:",
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
              : "Admin organisations could not be loaded.",
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