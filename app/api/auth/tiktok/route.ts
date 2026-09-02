import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  randomBytes,
} from "crypto";

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

  if (
    !cleaned
  ) {
    return null;
  }

  if (
    (
      cleaned.startsWith(
        "\""
      ) &&
      cleaned.endsWith(
        "\""
      )
    ) ||
    (
      cleaned.startsWith(
        "'"
      ) &&
      cleaned.endsWith(
        "'"
      )
    )
  ) {
    return cleaned.slice(
      1,
      -1
    );
  }

  return cleaned;
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
          success:
            false,

          error:
            "TikTok client key is not configured.",
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
            "TikTok redirect URI is not configured.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // TOTS-OS CONTEXT
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
      console.error(
        "[TIKTOK OAUTH] Missing connection context:",
        {
          hasUserId:
            Boolean(
              userId
            ),

          hasOrganisationId:
            Boolean(
              organisationId
            ),
        }
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Missing user or organisation.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // STATE
    // ========================================================

    const state =
      randomBytes(
        32
      ).toString(
        "hex"
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
      "user.info.basic"
    );

    authUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    authUrl.searchParams.set(
      "state",
      state
    );

    console.log(
      "[TIKTOK OAUTH] Starting OAuth:",
      {
        userId,

        organisationId,

        redirectUri,

        scope:
          "user.info.basic",

        stateLength:
          state.length,

        clientKeyPresent:
          Boolean(
            clientKey
          ),
      }
    );

    console.log(
      "[TIKTOK OAUTH] Authorisation destination:",
      authUrl.toString()
    );

    // ========================================================
    // REDIRECT + SECURE OAUTH COOKIES
    // ========================================================

    const response =
      NextResponse.redirect(
        authUrl.toString(),
        {
          status:
            302,
        }
      );

    const cookieOptions = {
      httpOnly:
        true,

      secure:
        true,

      sameSite:
        "lax" as const,

      path:
        "/",

      domain:
        ".tots-os.co.uk",

      maxAge:
        10 * 60,
    };

    response.cookies.set(
      "tiktok_oauth_state",
      state,
      cookieOptions
    );

    response.cookies.set(
      "tiktok_oauth_user_id",
      userId,
      cookieOptions
    );

    response.cookies.set(
      "tiktok_oauth_organisation_id",
      organisationId,
      cookieOptions
    );

    return response;
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