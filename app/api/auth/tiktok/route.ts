import {
  NextRequest,
  NextResponse,
} from "next/server";

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
    const clientKey =
      cleanString(
        process.env
          .TIKTOK_CLIENT_KEY
      );

    const redirectUri =
      cleanString(
        process.env
          .TIKTOK_REDIRECT_URI
      );

    if (
      !clientKey
    ) {
      console.error(
        "[TIKTOK OAUTH] Missing TIKTOK_CLIENT_KEY"
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "TIKTOK_CLIENT_KEY is missing.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !redirectUri
    ) {
      console.error(
        "[TIKTOK OAUTH] Missing TIKTOK_REDIRECT_URI"
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "TIKTOK_REDIRECT_URI is missing.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // REQUEST PARAMETERS
    // ========================================================

    const userId =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "userId"
          )
      );

    const organisationId =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "organisationId"
          )
      );

    if (
      !userId ||
      !organisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Missing userId or organisationId.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // BUILD STATE HERE
    // ========================================================

    /*
     * Do NOT accept an already encoded state value from the
     * browser. Build the raw JSON state here and let URLSearchParams
     * encode it once.
     */

    const state =
      JSON.stringify(
        {
          userId,

          organisationId,

          platform:
            "tiktok",

          createdAt:
            Date.now(),
        }
      );

    // ========================================================
    // TIKTOK AUTHORISATION URL
    // ========================================================

    const authUrl =
      new URL(
        "https://www.tiktok.com/v2/auth/authorize/"
      );

    authUrl.searchParams.set(
      "client_key",
      clientKey
    );

    authUrl.searchParams.set(
      "response_type",
      "code"
    );

    authUrl.searchParams.set(
      "scope",
      [
        "user.info.basic",
        "video.publish",
      ].join(
        ","
      )
    );

    authUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    authUrl.searchParams.set(
      "state",
      state
    );

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      "[TIKTOK OAUTH] Starting OAuth:",
      {
        userId,

        organisationId,

        clientKeyPresent:
          Boolean(
            clientKey
          ),

        redirectUri,

        scope:
          "user.info.basic,video.publish",

        destination:
          authUrl.origin +
          authUrl.pathname,
      }
    );

    console.log(
      "[TIKTOK OAUTH] TikTok URL:",
      authUrl.toString()
    );

    // ========================================================
    // REDIRECT
    // ========================================================

    return NextResponse.redirect(
      authUrl.toString(),
      {
        status:
          302,
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK OAUTH] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unable to start TikTok OAuth.",
      },
      {
        status:
          500,
      }
    );
  }
}