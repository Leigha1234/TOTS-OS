import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  sendPushNotification,
} from "@/lib/sendPushNotification";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    Request
) {
  try {
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
      return NextResponse.json(
        {
          error:
            "Supabase is not configured.",
        },
        {
          status:
            500,
        }
      );
    }

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

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

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
          userData.user.id
        )
        .maybeSingle();

    let organisationId =
      profile
        ?.organisation_id;

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
            userData.user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      organisationId =
        membership
          ?.organisation_id;
    }

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "No organisation found.",
        },
        {
          status:
            400,
        }
      );
    }

    const result =
      await sendPushNotification({
        organisationId,

        title:
          "TOTS-OS Test",

        body:
          "Push notifications are working 🎉",

        url:
          "/dashboard",

        tag:
          `test-${Date.now()}`,
      });

    return NextResponse.json({
      success:
        true,

      ...result,
    });
  } catch (
    error
  ) {
    console.error(
      "[TOTS PUSH TEST]",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Push test failed.",
      },
      {
        status:
          500,
      }
    );
  }
}