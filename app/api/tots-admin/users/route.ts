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

    const [
      authUsersResult,
      profilesResult,
      organisationsResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .auth
          .admin
          .listUsers({
            page:
              1,

            perPage:
              1000,
          }),

        supabaseAdmin
          .from(
            "profiles"
          )
          .select(
            "*"
          )
          .limit(
            2000
          ),

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
      ]);

    if (
      authUsersResult.error
    ) {
      throw authUsersResult.error;
    }

    if (
      profilesResult.error
    ) {
      throw profilesResult.error;
    }

    const profiles =
      profilesResult.data ||
      [];

    const profileMap =
      new Map(
        profiles.map(
          (
            profile
          ) => [
            String(
              profile.id
            ),
            profile,
          ]
        )
      );

    const organisationMap =
      new Map(
        (
          organisationsResult.data ||
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

    const users =
      authUsersResult
        .data
        .users
        .map(
          (
            user
          ) => {
            const profile =
              profileMap.get(
                user.id
              );

            const organisationId =
              text(
                profile
                  ?.organisation_id
              );

            const name =
              text(
                profile
                  ?.full_name
              ) ||
              text(
                profile
                  ?.name
              ) ||
              [
                text(
                  profile
                    ?.first_name
                ),

                text(
                  profile
                    ?.last_name
                ),
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                ) ||
              null;

            return {
              id:
                user.id,

              email:
                user.email ||
                text(
                  profile
                    ?.email
                ),

              name,

              organisationId,

              organisationName:
                organisationId
                  ? organisationMap.get(
                      organisationId
                    ) ||
                    null
                  : null,

              role:
                text(
                  profile
                    ?.platform_role
                ) ||
                text(
                  profile
                    ?.role
                ),

              subscriptionTier:
                text(
                  profile
                    ?.subscription_tier
                ),

              createdAt:
                user.created_at ||
                text(
                  profile
                    ?.created_at
                ),

              lastSignInAt:
                user
                  .last_sign_in_at ||
                null,
            };
          }
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
        users,

        total:
          users.length,

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
      "[TOTS ADMIN] Users failed:",
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
              : "Admin users could not be loaded.",
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