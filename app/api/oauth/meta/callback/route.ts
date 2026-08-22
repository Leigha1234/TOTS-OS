import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type MetaOAuthState = {
  platform?:
    string;

  userId?:
    string;

  createdAt?:
    number;
};

type ExchangeSuccessResponse = {
  success:
    true;

  platform?:
    string;

  userId?:
    string;

  socialAccountId?:
    string | null;

  accountId?:
    string | null;

  pageId?:
    string | null;

  pageName?:
    string | null;

  instagramBusinessAccountId?:
    string | null;
};

type ExchangeErrorResponse = {
  success?:
    false;

  error?:
    string;

  message?:
    string;

  details?:
    {
      error?: {
        message?:
          string;
      };

      message?:
        string;
    };
};

type ExchangeResponse =
  | ExchangeSuccessResponse
  | ExchangeErrorResponse;

// ============================================================
// HELPERS
// ============================================================

function getAppBaseUrl(
  request:
    NextRequest
) {
  const configuredUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (
    configuredUrl?.trim()
  ) {
    return configuredUrl
      .trim()
      .replace(
        /\/+$/,
        ""
      );
  }

  const redirectUri =
    process.env.META_REDIRECT_URI;

  if (
    redirectUri?.trim()
  ) {
    try {
      const parsed =
        new URL(
          redirectUri.trim()
        );

      return parsed.origin;
    } catch (
      error
    ) {
      console.warn(
        "[META OAUTH CALLBACK] Invalid META_REDIRECT_URI:",
        error
      );
    }
  }

  return request
    .nextUrl
    .origin;
}

// ============================================================

function buildSettingsUrl(
  request:
    NextRequest,

  params:
    Record<
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

// ============================================================

function parseMetaState(
  state:
    string
):
  | MetaOAuthState
  | null {
  const attempts =
    [
      state,

      (() => {
        try {
          return decodeURIComponent(
            state
          );
        } catch {
          return null;
        }
      })(),
    ].filter(
      (
        value
      ): value is string =>
        Boolean(
          value
        )
    );

  for (
    const candidate of
    attempts
  ) {
    try {
      const parsed =
        JSON.parse(
          candidate
        ) as MetaOAuthState;

      if (
        parsed &&
        typeof parsed ===
          "object"
      ) {
        return parsed;
      }
    } catch {
      /*
       * Try the next representation.
       */
    }
  }

  return null;
}

// ============================================================

function safeReason(
  value:
    unknown,

  fallback:
    string
) {
  if (
    typeof value !==
      "string"
  ) {
    return fallback;
  }

  const cleaned =
    value.trim();

  if (
    !cleaned
  ) {
    return fallback;
  }

  return cleaned.slice(
    0,
    250
  );
}

// ============================================================

function getExchangeFailureReason(
  result:
    ExchangeResponse | null
) {
  if (
    !result
  ) {
    return "Meta token exchange failed.";
  }

  if (
    "details" in result &&
    result.details
  ) {
    const nestedMessage =
      result.details.error?.message ||
      result.details.message;

    if (
      nestedMessage
    ) {
      return safeReason(
        nestedMessage,
        "Meta token exchange failed."
      );
    }
  }

  if (
    "message" in result &&
    result.message
  ) {
    return safeReason(
      result.message,
      "Meta token exchange failed."
    );
  }

  if (
    "error" in result &&
    result.error
  ) {
    return safeReason(
      result.error,
      "Meta token exchange failed."
    );
  }

  return "Meta token exchange failed.";
}

// ============================================================
// SUCCESS REDIRECT
// ============================================================

function metaSuccessRedirect(
  request:
    NextRequest
) {
  return NextResponse.redirect(
    buildSettingsUrl(
      request,
      {
        oauth:
          "meta_success",
      }
    )
  );
}

// ============================================================
// FAILURE REDIRECT
// ============================================================

function metaFailureRedirect(
  request:
    NextRequest,

  reason:
    string
) {
  return NextResponse.redirect(
    buildSettingsUrl(
      request,
      {
        oauth:
          "meta_failed",

        reason:
          safeReason(
            reason,
            "Meta connection failed"
          ),
      }
    )
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    // ========================================================
    // META RESPONSE
    // ========================================================

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

    // ========================================================
    // META RETURNED AN ERROR
    // ========================================================

    if (
      oauthError
    ) {
      console.error(
        "[META OAUTH CALLBACK] Meta returned an error:",
        {
          error:
            oauthError,

          errorReason,

          errorDescription,
        }
      );

      return metaFailureRedirect(
        request,

        errorDescription ||
          errorReason ||
          oauthError
      );
    }

    // ========================================================
    // VALIDATE CALLBACK VALUES
    // ========================================================

    if (
      !code ||
      !state
    ) {
      console.error(
        "[META OAUTH CALLBACK] Missing callback values:",
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

      return metaFailureRedirect(
        request,
        "Meta did not return the required OAuth code or state."
      );
    }

    // ========================================================
    // PARSE STATE
    // ========================================================

    const parsedState =
      parseMetaState(
        state
      );

    if (
      !parsedState
    ) {
      console.error(
        "[META OAUTH CALLBACK] Invalid OAuth state."
      );

      return metaFailureRedirect(
        request,
        "The Meta connection request could not be verified."
      );
    }

    // ========================================================
    // VALIDATE PLATFORM
    //
    // Your current Meta start route should always use:
    //
    // platform: "meta"
    // ========================================================

    const statePlatform =
      String(
        parsedState.platform ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      statePlatform &&
      statePlatform !==
        "meta"
    ) {
      console.error(
        "[META OAUTH CALLBACK] Unexpected platform in state:",
        {
          platform:
            parsedState.platform,
        }
      );

      return metaFailureRedirect(
        request,
        "Invalid platform returned during Meta connection."
      );
    }

    // ========================================================
    // VALIDATE USER
    // ========================================================

    const userId =
      typeof parsedState.userId ===
      "string"
        ? parsedState.userId.trim()
        : "";

    if (
      !userId
    ) {
      console.error(
        "[META OAUTH CALLBACK] OAuth state missing userId."
      );

      return metaFailureRedirect(
        request,
        "The signed-in TOTS-OS user could not be identified."
      );
    }

    // ========================================================
    // STATE AGE
    // ========================================================

    if (
      typeof parsedState.createdAt ===
        "number" &&
      Number.isFinite(
        parsedState.createdAt
      )
    ) {
      const age =
        Date.now() -
        parsedState.createdAt;

      const maxAge =
        30 *
        60 *
        1000;

      if (
        age >
        maxAge
      ) {
        console.error(
          "[META OAUTH CALLBACK] OAuth state expired:",
          {
            userId,

            createdAt:
              parsedState.createdAt,

            age,
          }
        );

        return metaFailureRedirect(
          request,
          "The Meta connection request expired. Please connect again."
        );
      }

      if (
        age <
        -60_000
      ) {
        console.error(
          "[META OAUTH CALLBACK] OAuth state timestamp is in the future:",
          {
            userId,

            createdAt:
              parsedState.createdAt,
          }
        );

        return metaFailureRedirect(
          request,
          "The Meta connection request could not be verified."
        );
      }
    }

    // ========================================================
    // BUILD INTERNAL EXCHANGE URL
    // ========================================================

    const baseUrl =
      getAppBaseUrl(
        request
      );

    const exchangeUrl =
      new URL(
        "/api/oauth/exchange",
        baseUrl
      );

    // ========================================================
    // EXCHANGE META CODE
    // ========================================================

    let exchangeResponse:
      Response;

    try {
      exchangeResponse =
        await fetch(
          exchangeUrl.toString(),
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                code,

                state,

                platform:
                  "meta",
              }),

            cache:
              "no-store",
          }
        );
    } catch (
      exchangeFetchError
    ) {
      console.error(
        "[META OAUTH CALLBACK] Could not reach OAuth exchange route:",
        exchangeFetchError
      );

      return metaFailureRedirect(
        request,
        "TOTS-OS could not complete the Meta token exchange."
      );
    }

    // ========================================================
    // READ EXCHANGE RESPONSE
    // ========================================================

    let exchangeResult:
      ExchangeResponse | null =
      null;

    try {
      exchangeResult =
        (await exchangeResponse.json()) as ExchangeResponse;
    } catch (
      parseError
    ) {
      console.error(
        "[META OAUTH CALLBACK] OAuth exchange returned invalid JSON:",
        parseError
      );

      return metaFailureRedirect(
        request,
        "TOTS-OS received an invalid response while connecting Meta."
      );
    }

    // ========================================================
    // EXCHANGE FAILED
    // ========================================================

    if (
      !exchangeResponse.ok
    ) {
      console.error(
        "[META OAUTH CALLBACK] Meta token exchange failed:",
        {
          status:
            exchangeResponse.status,

          result:
            exchangeResult,
        }
      );

      return metaFailureRedirect(
        request,
        getExchangeFailureReason(
          exchangeResult
        )
      );
    }

    // ========================================================
    // VALIDATE EXCHANGE RESULT
    // ========================================================

    if (
      !exchangeResult ||
      exchangeResult.success !==
        true
    ) {
      console.error(
        "[META OAUTH CALLBACK] Exchange returned an unexpected response:",
        exchangeResult
      );

      return metaFailureRedirect(
        request,
        "Meta authenticated, but TOTS-OS could not save the connection."
      );
    }

    // ========================================================
    // USER VALIDATION
    // ========================================================

    if (
      exchangeResult.userId &&
      String(
        exchangeResult.userId
      ).trim() !==
        userId
    ) {
      console.error(
        "[META OAUTH CALLBACK] Exchange user mismatch:",
        {
          stateUserId:
            userId,

          exchangeUserId:
            exchangeResult.userId,
        }
      );

      return metaFailureRedirect(
        request,
        "The Meta connection was returned for a different TOTS-OS user."
      );
    }

    // ========================================================
    // PLATFORM VALIDATION
    // ========================================================

    if (
      exchangeResult.platform &&
      String(
        exchangeResult.platform
      )
        .trim()
        .toLowerCase() !==
        "meta"
    ) {
      console.error(
        "[META OAUTH CALLBACK] Exchange returned unexpected platform:",
        exchangeResult.platform
      );

      return metaFailureRedirect(
        request,
        "Meta connected using an unexpected social platform."
      );
    }

    // ========================================================
    // SUCCESS LOG
    // ========================================================

    console.log(
      "[META OAUTH CALLBACK] ✅ Meta OAuth completed successfully:",
      {
        userId,

        platform:
          exchangeResult.platform ||
          "meta",

        socialAccountId:
          exchangeResult.socialAccountId ||
          exchangeResult.accountId ||
          null,

        pageId:
          exchangeResult.pageId ||
          null,

        pageName:
          exchangeResult.pageName ||
          null,

        instagramBusinessAccountId:
          exchangeResult.instagramBusinessAccountId ||
          null,
      }
    );

    // ========================================================
    // SUCCESS
    //
    // Settings page expects:
    //
    // /settings?oauth=meta_success
    // ========================================================

    return metaSuccessRedirect(
      request
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[META OAUTH CALLBACK] Unexpected callback error:",
      error
    );

    return metaFailureRedirect(
      request,
      error instanceof
        Error
        ? error.message
        : "An unexpected Meta connection error occurred."
    );
  }
}