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
// ENV
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// ADMIN CLIENT
// ============================================================

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
    // ENV CHECK
    // ========================================================

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "[TOTS PUSH TEST] Supabase environment variables are missing."
      );

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
    // AUTHORIZATION HEADER
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

    if (
      !token
    ) {
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
    // VERIFY USER
    // ========================================================

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "[TOTS PUSH TEST] User verification failed:",
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
    // FIND ORGANISATION
    // ========================================================

    let organisationId:
      string | null =
      null;

    // ========================================================
    // FIRST TRY PROFILE
    // ========================================================

    const {
      data:
        profile,

      error:
        profileError,
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
      profileError
    ) {
      console.warn(
        "[TOTS PUSH TEST] Profile organisation lookup failed:",
        profileError
      );
    }

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        profile.organisation_id;
    }

    // ========================================================
    // FALLBACK TO TEAM MEMBERS
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          membership,

        error:
          membershipError,
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

      if (
        membershipError
      ) {
        console.warn(
          "[TOTS PUSH TEST] Team membership lookup failed:",
          membershipError
        );
      }

      organisationId =
        membership
          ?.organisation_id ||
        null;
    }

    // ========================================================
    // ORGANISATION REQUIRED
    // ========================================================

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a TOTS-OS workspace.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // CONFIRM USER HAS A PUSH SUBSCRIPTION
    // ========================================================

    const {
      data:
        subscriptions,

      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          "push_subscriptions"
        )
        .select(
          `
            id,
            user_id,
            organisation_id,
            endpoint
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "organisation_id",
          organisationId
        );

    if (
      subscriptionError
    ) {
      console.error(
        "[TOTS PUSH TEST] Subscription lookup failed:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Your push subscription could not be checked.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !subscriptions ||
      subscriptions.length ===
        0
    ) {
      return NextResponse.json(
        {
          error:
            "No registered push devices were found for your account.",
        },
        {
          status:
            404,
        }
      );
    }

    // ========================================================
    // SEND TEST PUSH
    //
    // IMPORTANT:
    //
    // userId is deliberately supplied here.
    //
    // A test notification should only be delivered to devices
    // belonging to the person pressing "Send push test".
    // ========================================================

    const result =
      await sendPushNotification({
        organisationId,

        userId:
          user.id,

        title:
          "TOTS-OS test notification",

        body:
          "Push notifications are working. You’ll receive important TOTS-OS updates here.",

        url:
          "/settings",

        tag:
          `tots-test-${user.id}`,
      });

    // ========================================================
    // RESULT
    // ========================================================

    const sent =
      Number(
        result?.sent ??
        0
      );

    const failed =
      Number(
        result?.failed ??
        0
      );

    console.log(
      "[TOTS PUSH TEST] Result:",
      {
        userId:
          user.id,

        organisationId,

        subscriptions:
          subscriptions.length,

        sent,

        failed,
      }
    );

    // ========================================================
    // NOTHING SENT
    // ========================================================

    if (
      sent ===
        0 &&
      failed ===
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          sent,

          failed,

          error:
            "No registered push devices were available for delivery.",
        },
        {
          status:
            404,
        }
      );
    }

    // ========================================================
    // ALL FAILED
    // ========================================================

    if (
      sent ===
        0 &&
      failed >
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          sent,

          failed,

          error:
            "The push notification was created but delivery failed.",
        },
        {
          status:
            502,
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        sent,

        failed,

        message:
          sent ===
          1
            ? "Test push sent successfully."
            : `Test push sent to ${sent} devices.`,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS PUSH TEST] Route failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Test push notification could not be sent.",
      },
      {
        status:
          500,
      }
    );
  }
}