import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

// ==================================================
// HELPERS
// ==================================================

function getAppBaseUrl(
  request: NextRequest
) {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(
      /\/+$/,
      ""
    );
  }

  const redirectUri =
    process.env
      .META_REDIRECT_URI;

  if (redirectUri) {
    try {
      const parsed =
        new URL(
          redirectUri
        );

      return parsed.origin;
    } catch {
      // Ignore and fall through
    }
  }

  return request.nextUrl.origin;
}

function buildSettingsUrl(
  request: NextRequest,
  params: Record<
    string,
    string
  >
) {
  const baseUrl =
    getAppBaseUrl(
      request
    );

  const url =
    new URL(
      "/settings",
      baseUrl
    );

  Object.entries(
    params
  ).forEach(
    ([
      key,
      value,
    ]) => {
      url.searchParams.set(
        key,
        value
      );
    }
  );

  return url;
}

// ==================================================
// GET
// ==================================================

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

    // ==================================================
    // META RESPONSE
    // ==================================================

    const code =
      searchParams.get(
        "code"
      );

    const state =
      searchParams.get(
        "state"
      );

    const oauthError =
      searchParams.get(
        "error"
      );

    const errorReason =
      searchParams.get(
        "error_reason"
      );

    const errorDescription =
      searchParams.get(
        "error_description"
      );

    // ==================================================
    // META ERROR
    // ==================================================

    if (oauthError) {
      console.error(
        "Meta OAuth returned an error:",
        {
          error:
            oauthError,

          errorReason,

          errorDescription,
        }
      );

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              errorDescription ||
              errorReason ||
              oauthError,
          }
        )
      );
    }

    // ==================================================
    // VALIDATE CALLBACK
    // ==================================================

    if (
      !code ||
      !state
    ) {
      console.error(
        "Meta callback missing values:",
        {
          hasCode:
            Boolean(
              code
            ),

          hasState:
            Boolean(
              state
            ),
        }
      );

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              "missing_code_or_state",
          }
        )
      );
    }

    // ==================================================
    // VALIDATE STATE
    // ==================================================

    let parsedState:
      | {
          platform?: string;
          userId?: string;
        }
      | null =
      null;

    try {
      parsedState =
        JSON.parse(
          decodeURIComponent(
            state
          )
        );
    } catch (
      error
    ) {
      console.error(
        "Invalid Meta OAuth state:",
        error
      );

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              "invalid_state",
          }
        )
      );
    }

    if (
      !parsedState
        ?.userId
    ) {
      console.error(
        "Meta OAuth state missing userId:",
        parsedState
      );

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              "missing_user",
          }
        )
      );
    }

    // ==================================================
    // BUILD INTERNAL EXCHANGE URL
    // ==================================================

    const baseUrl =
      getAppBaseUrl(
        request
      );

    const exchangeUrl =
      new URL(
        "/api/oauth/exchange",
        baseUrl
      );

    // ==================================================
    // EXCHANGE META CODE
    // ==================================================

    const exchangeResponse =
      await fetch(
        exchangeUrl.toString(),
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              {
                code,

                state,

                platform:
                  "meta",
              }
            ),

          cache:
            "no-store",
        }
      );

    const exchangeResult =
      await exchangeResponse
        .json()
        .catch(
          () =>
            null
        );

    // ==================================================
    // EXCHANGE FAILED
    // ==================================================

    if (
      !exchangeResponse.ok
    ) {
      console.error(
        "Meta token exchange failed:",
        {
          status:
            exchangeResponse.status,

          result:
            exchangeResult,
        }
      );

      const reason =
        exchangeResult
          ?.details
          ?.error
          ?.message ||
        exchangeResult
          ?.details
          ?.message ||
        exchangeResult
          ?.message ||
        exchangeResult
          ?.error ||
        "token_exchange_failed";

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              String(
                reason
              ).slice(
                0,
                250
              ),
          }
        )
      );
    }

    // ==================================================
    // VALIDATE RESULT
    // ==================================================

    if (
      !exchangeResult
        ?.success
    ) {
      console.error(
        "Meta exchange returned unexpected response:",
        exchangeResult
      );

      return NextResponse.redirect(
        buildSettingsUrl(
          request,
          {
            oauth:
              "failed",

            platform:
              "meta",

            reason:
              "invalid_exchange_response",
          }
        )
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    console.log(
      "Meta OAuth completed successfully:",
      {
        userId:
          parsedState.userId,

        platform:
          exchangeResult.platform ||
          "meta",
      }
    );

    return NextResponse.redirect(
      buildSettingsUrl(
        request,
        {
          oauth:
            "success",

          platform:
            "meta",
        }
      )
    );
  } catch (
    error
  ) {
    console.error(
      "Meta OAuth callback error:",
      error
    );

    return NextResponse.redirect(
      buildSettingsUrl(
        request,
        {
          oauth:
            "failed",

          platform:
            "meta",

          reason:
            error instanceof
            Error
              ? error.message.slice(
                  0,
                  250
                )
              : "unknown_callback_error",
        }
      )
    );
  }
}