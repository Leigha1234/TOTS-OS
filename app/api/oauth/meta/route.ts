import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// CONFIG
// ============================================================

const DEFAULT_META_GRAPH_VERSION =
  "v25.0";

const MAX_STATE_AGE_MS =
  30 *
  60 *
  1000;

// ============================================================
// TYPES
// ============================================================

type MetaOAuthState = {
  platform:
    "meta";

  userId:
    string;

  createdAt:
    number;
};

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnv(
  name: string
): string {
  const value =
    process.env[
      name
    ]?.trim();

  if (
    !value
  ) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value;
}

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

function getMetaGraphVersion() {
  const configured =
    process.env
      .META_GRAPH_API_VERSION
      ?.trim();

  if (
    configured
  ) {
    return configured.startsWith(
      "v"
    )
      ? configured
      : `v${configured}`;
  }

  return DEFAULT_META_GRAPH_VERSION;
}

// ============================================================
// UUID VALIDATION
// ============================================================

function isValidUuid(
  value:
    string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ============================================================
// ENCODE STATE
// ============================================================

function encodeState(
  state:
    MetaOAuthState
) {
  /*
   * IMPORTANT:
   *
   * We return normal JSON here.
   *
   * URLSearchParams will URL-encode this for us when the Meta
   * OAuth URL is created.
   *
   * This avoids accidental double-encoding.
   */

  return JSON.stringify(
    state
  );
}

// ============================================================
// DECODE STATE
// ============================================================

function decodeState(
  value:
    string
):
  | MetaOAuthState
  | null {
  /*
   * Support both:
   *
   * 1. Raw JSON returned by URLSearchParams
   * 2. Older manually encodeURIComponent() state values
   */

  const attempts:
    string[] = [
      value,
    ];

  try {
    const decoded =
      decodeURIComponent(
        value
      );

    if (
      decoded !==
      value
    ) {
      attempts.push(
        decoded
      );
    }
  } catch {
    /*
     * Ignore.
     */
  }

  for (
    const candidate of
    attempts
  ) {
    try {
      const parsed =
        JSON.parse(
          candidate
        ) as Partial<MetaOAuthState>;

      const userId =
        cleanString(
          parsed.userId
        );

      const rawPlatform =
        cleanString(
          parsed.platform
        )
          ?.toLowerCase();

      const createdAt =
        Number(
          parsed.createdAt
        );

      if (
        !userId
      ) {
        continue;
      }

      if (
        rawPlatform !==
          "meta" &&
        rawPlatform !==
          "facebook" &&
        rawPlatform !==
          "instagram"
      ) {
        continue;
      }

      return {
        platform:
          "meta",

        userId,

        createdAt:
          Number.isFinite(
            createdAt
          )
            ? createdAt
            : Date.now(),
      };
    } catch {
      /*
       * Try next candidate.
       */
    }
  }

  return null;
}

// ============================================================
// ERROR RESPONSE
// ============================================================

function errorResponse(
  message:
    string,

  status:
    number,

  details?:
    Record<
      string,
      unknown
    >
) {
  return NextResponse.json(
    {
      success:
        false,

      error:
        message,

      ...(details
        ? {
            details,
          }
        : {}),
    },
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
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
    const url =
      new URL(
        request.url
      );

    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const appId =
      requireEnv(
        "META_CLIENT_ID"
      );

    const redirectUri =
      requireEnv(
        "META_REDIRECT_URI"
      );

    /*
     * META_CLIENT_SECRET is intentionally NOT needed here.
     *
     * This route only redirects the user to Meta.
     *
     * The secret is used later by the server-side exchange
     * endpoint.
     */

    // ========================================================
    // QUERY PARAMS
    // ========================================================

    const incomingState =
      cleanString(
        url.searchParams.get(
          "state"
        )
      );

    const incomingUserId =
      cleanString(
        url.searchParams.get(
          "userId"
        )
      );

    const incomingPlatform =
      cleanString(
        url.searchParams.get(
          "platform"
        )
      )
        ?.toLowerCase() ||
      null;

    // ========================================================
    // DEBUG INPUT
    // ========================================================

    console.log(
      "[META OAUTH START] Incoming request:",
      {
        hasState:
          Boolean(
            incomingState
          ),

        hasUserId:
          Boolean(
            incomingUserId
          ),

        platform:
          incomingPlatform,
      }
    );

    // ========================================================
    // RESOLVE STATE
    // ========================================================

    let parsedState:
      MetaOAuthState |
      null =
      null;

    // ========================================================
    // OPTION 1:
    // EXISTING STRUCTURED STATE
    // ========================================================

    if (
      incomingState
    ) {
      parsedState =
        decodeState(
          incomingState
        );

      if (
        !parsedState
      ) {
        console.error(
          "[META OAUTH START] Invalid state received:",
          {
            stateLength:
              incomingState.length,
          }
        );

        return errorResponse(
          "Invalid Meta OAuth state.",
          400
        );
      }
    }

    // ========================================================
    // OPTION 2:
    // CREATE STATE FROM USER ID
    // ========================================================

    if (
      !parsedState &&
      incomingUserId
    ) {
      if (
        incomingPlatform &&
        incomingPlatform !==
          "meta" &&
        incomingPlatform !==
          "facebook" &&
        incomingPlatform !==
          "instagram"
      ) {
        return errorResponse(
          "Invalid platform for Meta OAuth.",
          400,
          {
            platform:
              incomingPlatform,
          }
        );
      }

      parsedState = {
        platform:
          "meta",

        userId:
          incomingUserId,

        createdAt:
          Date.now(),
      };
    }

    // ========================================================
    // NO USER
    // ========================================================

    if (
      !parsedState
    ) {
      console.error(
        "[META OAUTH START] No valid state or userId was supplied."
      );

      return errorResponse(
        "Missing authenticated user ID.",
        400,
        {
          expected:
            "The Meta connection must be started from the TOTS-OS Settings page.",
        }
      );
    }

    // ========================================================
    // VALIDATE USER ID
    // ========================================================

    if (
      !isValidUuid(
        parsedState.userId
      )
    ) {
      console.error(
        "[META OAUTH START] Invalid Supabase user UUID:",
        {
          userId:
            parsedState.userId,
        }
      );

      return errorResponse(
        "Invalid authenticated user ID.",
        400
      );
    }

    // ========================================================
    // STATE AGE
    // ========================================================

    const stateAge =
      Date.now() -
      parsedState.createdAt;

    if (
      !Number.isFinite(
        stateAge
      )
    ) {
      return errorResponse(
        "Invalid OAuth request timestamp.",
        400
      );
    }

    if (
      stateAge >
      MAX_STATE_AGE_MS
    ) {
      console.error(
        "[META OAUTH START] OAuth state expired:",
        {
          userId:
            parsedState.userId,

          stateAge,
        }
      );

      return errorResponse(
        "OAuth request has expired. Please try connecting Meta again.",
        400
      );
    }

    /*
     * Allow a small amount of clock difference.
     */

    if (
      stateAge <
      -60_000
    ) {
      console.error(
        "[META OAUTH START] OAuth state timestamp is in the future:",
        {
          userId:
            parsedState.userId,

          createdAt:
            parsedState.createdAt,

          stateAge,
        }
      );

      return errorResponse(
        "The Meta connection request could not be verified.",
        400
      );
    }

    // ========================================================
    // CREATE CLEAN STATE
    //
    // Always generate a clean canonical representation rather
    // than forwarding whatever arrived.
    // ========================================================

    const canonicalState:
      MetaOAuthState = {
      platform:
        "meta",

      userId:
        parsedState.userId,

      createdAt:
        parsedState.createdAt,
    };

    const resolvedState =
      encodeState(
        canonicalState
      );

    // ========================================================
    // PERMISSIONS
    // ========================================================

    const permissions =
      [
        /*
         * Discover Facebook Pages the user manages.
         */
        "pages_show_list",

        /*
         * Read Page information required by the Graph API.
         */
        "pages_read_engagement",

        /*
         * Publish/manage Facebook Page posts.
         */
        "pages_manage_posts",

        /*
         * Discover professional Instagram account linked to
         * the Facebook Page.
         */
        "instagram_basic",

        /*
         * Publish content to Instagram.
         */
        "instagram_content_publish",
      ].join(
        ","
      );

    // ========================================================
    // GRAPH VERSION
    // ========================================================

    const graphVersion =
      getMetaGraphVersion();

    // ========================================================
    // BUILD META OAUTH URL
    // ========================================================

    const oauthUrl =
      new URL(
        `https://www.facebook.com/${graphVersion}/dialog/oauth`
      );

    oauthUrl.searchParams.set(
      "client_id",
      appId
    );

    oauthUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    /*
     * URLSearchParams handles encoding automatically.
     *
     * Do not encodeURIComponent() this again.
     */

    oauthUrl.searchParams.set(
      "state",
      resolvedState
    );

    oauthUrl.searchParams.set(
      "scope",
      permissions
    );

    oauthUrl.searchParams.set(
      "response_type",
      "code"
    );

    /*
     * Helpful while testing because declined permissions are
     * requested again.
     */

    oauthUrl.searchParams.set(
      "auth_type",
      "rerequest"
    );

    // ========================================================
    // SAFE DEBUG LOG
    // ========================================================

    console.log(
      "[META OAUTH START] ✅ Starting Meta OAuth:",
      {
        graphVersion,

        redirectUri,

        userId:
          canonicalState.userId,

        platform:
          canonicalState.platform,

        createdAt:
          canonicalState.createdAt,

        permissions:
          permissions.split(
            ","
          ),

        /*
         * Never log META_CLIENT_SECRET or OAuth tokens.
         */
        clientIdConfigured:
          Boolean(
            appId
          ),
      }
    );

    // ========================================================
    // REDIRECT TO META
    // ========================================================

    return NextResponse.redirect(
      oauthUrl,
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
      "[META OAUTH START] Failed:",
      error
    );

    return errorResponse(
      "Unable to start Meta OAuth.",
      500,
      {
        message:
          error instanceof
            Error
            ? error.message
            : "Unknown Meta OAuth error.",
      }
    );
  }
}