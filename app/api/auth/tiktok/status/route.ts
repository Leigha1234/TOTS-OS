import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createServerSupabaseClient,
} from "@/lib/supabase-server";

// ============================================================
// CONFIG
// ============================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned ||
    null;
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATE CURRENT USER
    // ========================================================

    const supabase =
      await createServerSupabaseClient();

    const {
      data: {
        user,
      },

      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user?.id
    ) {
      console.error(
        "[TIKTOK STATUS] Authentication failed:",
        authError
      );

      return NextResponse.json(
        {
          success:
            false,

          connected:
            false,

          error:
            "You must be signed in.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisationId =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "organisationId"
          )
      );

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          connected:
            false,

          error:
            "Organisation ID is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // LOAD TIKTOK CONNECTION
    // ========================================================

    const {
      data:
        connection,

      error:
        connectionError,
    } =
      await supabase
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            platform,
            platform_user_id,
            expires_at,
            display_name,
            avatar_url,
            created_at,
            updated_at
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "platform",
          "tiktok"
        )
        .maybeSingle();

    if (
      connectionError
    ) {
      console.error(
        "[TIKTOK STATUS] Connection lookup failed:",
        connectionError
      );

      return NextResponse.json(
        {
          success:
            false,

          connected:
            false,

          error:
            "TikTok connection status could not be loaded.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // NOT CONNECTED
    // ========================================================

    if (
      !connection
    ) {
      return NextResponse.json(
        {
          success:
            true,

          connected:
            false,

          expired:
            false,

          requiresReconnect:
            false,

          account:
            null,
        }
      );
    }

    // ========================================================
    // TOKEN EXPIRY
    // ========================================================

    let expired =
      false;

    if (
      connection.expires_at
    ) {
      const expiryTime =
        new Date(
          connection.expires_at
        ).getTime();

      if (
        !Number.isNaN(
          expiryTime
        )
      ) {
        expired =
          expiryTime <=
          Date.now();
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        connected:
          !expired,

        expired,

        requiresReconnect:
          expired,

        account: {
          id:
            connection.id,

          platform:
            "tiktok",

          platformUserId:
            connection.platform_user_id,

          displayName:
            connection.display_name,

          avatarUrl:
            connection.avatar_url,

          expiresAt:
            connection.expires_at,

          createdAt:
            connection.created_at,

          updatedAt:
            connection.updated_at,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK STATUS] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        connected:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unable to check TikTok connection.",
      },
      {
        status:
          500,
      }
    );
  }
}