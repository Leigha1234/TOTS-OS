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
// ENV
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl ||
  !serviceRoleKey
) {
  console.error(
    "[TOTS PUSH] Supabase environment variables missing."
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl || "",
    serviceRoleKey || "",
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
// POST
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // ========================================================
    // VERIFY ENV
    // ========================================================

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Push notification server is not configured.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // AUTHORIZATION
    // ========================================================

    const authorization =
      request.headers.get(
        "authorization"
      );

    const token =
      authorization?.startsWith(
        "Bearer "
      )
        ? authorization.slice(
            7
          )
        : null;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Not authenticated.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // USER
    // ========================================================

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAdmin
        .auth
        .getUser(
          token
        );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "[TOTS PUSH] User verification failed:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Invalid session.",
        },
        {
          status:
            401,
        }
      );
    }

    const user =
      userData.user;

    // ========================================================
    // BODY
    // ========================================================

    const body =
      await request.json();

    const subscription =
      body.subscription;

    if (
      !subscription?.endpoint
    ) {
      return NextResponse.json(
        {
          error:
            "Push subscription endpoint is missing.",
        },
        {
          status:
            400,
        }
      );
    }

    const p256dh =
      subscription.keys
        ?.p256dh;

    const auth =
      subscription.keys
        ?.auth;

    if (
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          error:
            "Push subscription keys are missing.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // FIND ORGANISATION
    // ========================================================

    let organisationId:
      string | null =
      null;

    const {
      data:
        profile,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        profile.organisation_id;
    }

    if (
      !organisationId
    ) {
      const {
        data:
          membership,
      } =
        await supabaseAdmin
          .from(
            "team_members"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      organisationId =
        membership
          ?.organisation_id ||
        null;
    }

    // ========================================================
    // SAVE SUBSCRIPTION
    // ========================================================

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "push_subscriptions"
        )
        .upsert(
          {
            user_id:
              user.id,

            organisation_id:
              organisationId,

            endpoint:
              subscription.endpoint,

            p256dh,

            auth,

            user_agent:
              request.headers.get(
                "user-agent"
              ),

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "endpoint",
          }
        )
        .select(
          "id, user_id, organisation_id"
        )
        .single();

    if (error) {
      console.error(
        "[TOTS PUSH] Subscription save failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            500,
        }
      );
    }

    console.log(
      `[TOTS PUSH] Subscription saved for ${user.id}`
    );

    return NextResponse.json(
      {
        success:
          true,

        subscription:
          data,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[TOTS PUSH] Subscribe route failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to save push subscription.",
      },
      {
        status:
          500,
      }
    );
  }
}