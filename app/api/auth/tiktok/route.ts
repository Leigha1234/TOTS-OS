import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  randomBytes,
} from "crypto";

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

  /*
   * Protect against env values accidentally being saved as:
   *
   * "abc123"
   * or
   * 'abc123'
   */
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

    /*
     * Hard-code the production redirect while debugging.
     *
     * This removes the possibility of a bad env value causing
     * TikTok's invalid_request response.
     */
    const redirectUri =
      "https://www.tots-os.co.uk/api/auth/tiktok/callback";

    if (
      !clientKey
    ) {
      console.error(
        "[TIKTOK OAUTH] TIKTOK_CLIENT_KEY is missing"
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
        "[TIKTOK OAUTH] Missing TOTS-OS context:",
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
    // RANDOM OAUTH STATE
    // ========================================================

    const state =
      randomBytes(
        32
      ).toString(
        "hex"
      );

    // ========================================================
    // AUTHORIZATION URL
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
      "scope",
      "user.info.basic"
    );

    authUrl.searchParams.set(
      "response_type",
      "code"
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
      "[TIKTOK OAUTH] Configuration:",
      {
        clientKeyLength:
          clientKey.length,

        clientKeyStart:
          `${clientKey.slice(
            0,
            4
          )}...`,

        redirectUri,

        scope:
          "user.info.basic",

        stateLength:
          state.length,
      }
    );

    console.log(
      "[TIKTOK OAUTH] Authorisation destination:",
      authUrl.toString()
    );

    // ========================================================
    // CREATE REDIRECT
    // ========================================================

    const response =
      NextResponse.redirect(
        authUrl.toString(),
        {
          status:
            302,
        }
      );

    // ========================================================
    // STORE STATE + CONTEXT SECURELY
    // ========================================================

    response.cookies.set(
      "tiktok_oauth_state",
      state,
      {
        httpOnly:
          true,

        secure:
          true,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          10 *
          60,
      }
    );

    response.cookies.set(
      "tiktok_oauth_user_id",
      userId,
      {
        httpOnly:
          true,

        secure:
          true,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          10 *
          60,
      }
    );

    response.cookies.set(
      "tiktok_oauth_organisation_id",
      organisationId,
      {
        httpOnly:
          true,

        secure:
          true,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          10 *
          60,
      }
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