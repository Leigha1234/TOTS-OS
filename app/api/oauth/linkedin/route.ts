import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// HELPERS
// ============================================================

function requireEnv(
  name: string
) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value;
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    // ========================================================
    // STATE
    // ========================================================

    const state =
      searchParams.get(
        "state"
      );

    if (
      !state
    ) {
      console.error(
        "[LINKEDIN OAUTH START] Missing OAuth state."
      );

      return NextResponse.json(
        {
          error:
            "Missing OAuth state",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const clientId =
      requireEnv(
        "LINKEDIN_CLIENT_ID"
      );

    const redirectUri =
      requireEnv(
        "LINKEDIN_REDIRECT_URI"
      );

    // ========================================================
    // SCOPES
    // ========================================================

    const scopes =
      [
        "openid",
        "profile",
        "email",
        "w_member_social",
      ].join(
        " "
      );

    // ========================================================
    // BUILD LINKEDIN OAUTH URL
    // ========================================================

    const oauthUrl =
      new URL(
        "https://www.linkedin.com/oauth/v2/authorization"
      );

    oauthUrl.searchParams.set(
      "response_type",
      "code"
    );

    oauthUrl.searchParams.set(
      "client_id",
      clientId
    );

    oauthUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    oauthUrl.searchParams.set(
      "state",
      state
    );

    oauthUrl.searchParams.set(
      "scope",
      scopes
    );

    // ========================================================
    // DEBUGGING
    // ========================================================

    console.log(
      "[LINKEDIN OAUTH START] Starting LinkedIn OAuth:",
      {
        redirectUri,

        scopes:
          scopes.split(
            " "
          ),

        hasClientId:
          Boolean(
            clientId
          ),
      }
    );

    // ========================================================
    // REDIRECT
    // ========================================================

    return NextResponse.redirect(
      oauthUrl
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[LINKEDIN OAUTH START] Failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to start LinkedIn OAuth",

        message:
          error instanceof
            Error
            ? error.message
            : "Unknown LinkedIn OAuth error",
      },
      {
        status:
          500,
      }
    );
  }
}