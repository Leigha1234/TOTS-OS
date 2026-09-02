import {
  NextRequest,
  NextResponse,
} from "next/server";

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
    string | null | undefined
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
    // ENVIRONMENT
    // ========================================================

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
          error:
            "TikTok OAuth is not configured.",
          reason:
            "missing_client_key",
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
          error:
            "TikTok OAuth callback is not configured.",
          reason:
            "missing_redirect_uri",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // QUERY PARAMETERS FROM TOTS-OS
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

    const incomingState =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "state"
          )
      );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !userId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing authenticated user.",
          reason:
            "missing_user",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing organisation.",
          reason:
            "missing_organisation",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !incomingState
    ) {
      return NextResponse.json(
        {
          error:
            "Missing OAuth state.",
          reason:
            "missing_state",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // TIKTOK AUTHORISATION URL
    // ========================================================

    const tiktokUrl =
      new URL(
        "https://www.tiktok.com/v2/auth/authorize/"
      );

    tiktokUrl.searchParams.set(
      "client_key",
      clientKey
    );

    tiktokUrl.searchParams.set(
      "response_type",
      "code"
    );

    /*
     * user.info.basic
     * - allows us to retrieve basic TikTok account information.
     *
     * video.publish
     * - required for Direct Post through the Content Posting API.
     *
     * IMPORTANT:
     * video.publish must be approved for the production TikTok app.
     */
    tiktokUrl.searchParams.set(
      "scope",
      [
        "user.info.basic",
        "video.publish",
      ].join(
        ","
      )
    );

    tiktokUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    tiktokUrl.searchParams.set(
      "state",
      incomingState
    );

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TIKTOK OAUTH] Redirecting to TikTok:",
      {
        userId,
        organisationId,
        redirectUri,
        hasClientKey:
          Boolean(
            clientKey
          ),
        hasState:
          Boolean(
            incomingState
          ),
      }
    );

    // ========================================================
    // REDIRECT
    // ========================================================

    return NextResponse.redirect(
      tiktokUrl
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK OAUTH] Unexpected start error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Unable to start TikTok connection.",
        reason:
          "unexpected",
      },
      {
        status:
          500,
      }
    );
  }
}