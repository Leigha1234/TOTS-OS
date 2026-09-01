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

  organisationId:
    string;

  createdAt:
    number;

  /*
   * Optional future support for explicitly selecting
   * a Facebook Page before completing OAuth.
   */
  pageId?:
    string;
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
// GRAPH VERSION
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
   * Return normal JSON.
   *
   * URLSearchParams will encode the value when generating
   * the Facebook OAuth URL.
   *
   * Do NOT manually encodeURIComponent() this value.
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
  | Partial<MetaOAuthState>
  | null {
  /*
   * Support:
   *
   * 1. Current raw JSON state
   * 2. Older manually URL-encoded state
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
     * Ignore decoding errors.
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

      if (
        !parsed ||
        typeof parsed !==
          "object"
      ) {
        continue;
      }

      return parsed;
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
     * META_CLIENT_SECRET is intentionally NOT required here.
     *
     * This route only creates the Meta authorisation URL.
     *
     * Token exchange happens later inside the callback.
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

    const incomingOrganisationId =
      cleanString(
        url.searchParams.get(
          "organisationId"
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

    const incomingPageId =
      cleanString(
        url.searchParams.get(
          "pageId"
        )
      );

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

        hasOrganisationId:
          Boolean(
            incomingOrganisationId
          ),

        hasPageId:
          Boolean(
            incomingPageId
          ),

        platform:
          incomingPlatform,
      }
    );

    // ========================================================
    // RESOLVE VALUES
    // ========================================================

    let parsedState:
      Partial<MetaOAuthState> |
      null =
      null;

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
    // USER ID
    //
    // Direct query param wins, otherwise use structured state.
    // ========================================================

    const userId =
      incomingUserId ||
      cleanString(
        parsedState
          ?.userId
      );

    // ========================================================
    // ORGANISATION ID
    //
    // CRITICAL:
    // This is what keeps MTC and TOTS separate.
    //
    // Direct query param wins, otherwise use structured state.
    // ========================================================

    const organisationId =
      incomingOrganisationId ||
      cleanString(
        parsedState
          ?.organisationId
      );

    // ========================================================
    // PAGE ID
    // ========================================================

    const pageId =
      incomingPageId ||
      cleanString(
        parsedState
          ?.pageId
      );

    // ========================================================
    // PLATFORM
    // ========================================================

    const parsedPlatform =
      cleanString(
        parsedState
          ?.platform
      )
        ?.toLowerCase() ||
      null;

    const platform =
      incomingPlatform ||
      parsedPlatform ||
      "meta";

    if (
      platform !==
        "meta" &&
      platform !==
        "facebook" &&
      platform !==
        "instagram"
    ) {
      return errorResponse(
        "Invalid platform for Meta OAuth.",
        400,
        {
          platform,
        }
      );
    }

    // ========================================================
    // REQUIRE USER
    // ========================================================

    if (
      !userId
    ) {
      console.error(
        "[META OAUTH START] Missing userId."
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
    // REQUIRE ORGANISATION
    // ========================================================

    if (
      !organisationId
    ) {
      console.error(
        "[META OAUTH START] Missing organisationId.",
        {
          userId,
        }
      );

      return errorResponse(
        "Missing organisation ID.",
        400,
        {
          expected:
            "The Settings page must send the currently selected organisationId when starting Meta OAuth.",
        }
      );
    }

    // ========================================================
    // VALIDATE USER UUID
    // ========================================================

    if (
      !isValidUuid(
        userId
      )
    ) {
      console.error(
        "[META OAUTH START] Invalid Supabase user UUID:",
        {
          userId,
        }
      );

      return errorResponse(
        "Invalid authenticated user ID.",
        400
      );
    }

    // ========================================================
    // VALIDATE ORGANISATION UUID
    // ========================================================

    if (
      !isValidUuid(
        organisationId
      )
    ) {
      console.error(
        "[META OAUTH START] Invalid organisation UUID:",
        {
          organisationId,
        }
      );

      return errorResponse(
        "Invalid organisation ID.",
        400
      );
    }

    // ========================================================
    // CREATED AT
    // ========================================================

    const parsedCreatedAt =
      Number(
        parsedState
          ?.createdAt
      );

    const createdAt =
      Number.isFinite(
        parsedCreatedAt
      )
        ? parsedCreatedAt
        : Date.now();

    // ========================================================
    // STATE AGE
    // ========================================================

    const stateAge =
      Date.now() -
      createdAt;

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
          userId,
          organisationId,
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
          userId,
          organisationId,
          createdAt,
          stateAge,
        }
      );

      return errorResponse(
        "The Meta connection request could not be verified.",
        400
      );
    }

    // ========================================================
    // CREATE CANONICAL STATE
    //
    // THIS is the important part.
    //
    // organisationId now travels:
    //
    // Settings
    //   ↓
    // Meta start route
    //   ↓
    // Facebook
    //   ↓
    // Meta callback
    //   ↓
    // social_accounts.organisation_id
    // ========================================================

    const canonicalState:
      MetaOAuthState = {
      platform:
        "meta",

      userId,

      organisationId,

      createdAt,

      ...(pageId
        ? {
            pageId,
          }
        : {}),
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
         * Read Facebook Page information.
         */
        "pages_read_engagement",

        /*
         * Publish/manage Facebook Page posts.
         */
        "pages_manage_posts",

        /*
         * Discover professional Instagram accounts attached
         * to Facebook Pages.
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
     * URLSearchParams handles encoding.
     *
     * Do NOT wrap resolvedState in encodeURIComponent().
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
     * During testing, this asks Meta to request permissions
     * again when they were previously declined.
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

        organisationId:
          canonicalState.organisationId,

        platform:
          canonicalState.platform,

        createdAt:
          canonicalState.createdAt,

        pageId:
          canonicalState.pageId ??
          null,

        permissions:
          permissions.split(
            ","
          ),

        /*
         * Never log:
         *
         * - META_CLIENT_SECRET
         * - access tokens
         * - Page access tokens
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