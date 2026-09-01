import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

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
// UNTYPED ADMIN DATABASE CLIENT
//
// Temporary until generated Supabase types are refreshed.
// ============================================================

const db =
  supabaseAdmin as any;

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
   * Optional future support for explicitly selecting a
   * Facebook Page before OAuth.
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
   * URLSearchParams will safely encode it when we add it to
   * the Meta OAuth URL.
   *
   * Do NOT encodeURIComponent() this again.
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
   * Support:
   *
   * 1. Raw JSON state
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
     * Ignore malformed encoded state.
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

      const organisationId =
        cleanString(
          parsed.organisationId
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

      const pageId =
        cleanString(
          parsed.pageId
        );

      if (
        !userId ||
        !organisationId
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

        organisationId,

        createdAt:
          Number.isFinite(
            createdAt
          )
            ? createdAt
            : Date.now(),

        ...(pageId
          ? {
              pageId,
            }
          : {}),
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
     * META_CLIENT_SECRET is deliberately NOT used here.
     *
     * This endpoint only creates the Meta authorisation URL.
     *
     * The secret remains server-side and is used by the
     * callback when exchanging the authorisation code.
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

        platform:
          incomingPlatform,

        hasPageId:
          Boolean(
            incomingPageId
          ),
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
    // CREATE STATE FROM QUERY PARAMETERS
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

      // ======================================================
      // ORGANISATION REQUIRED
      // ======================================================

      if (
        !incomingOrganisationId
      ) {
        console.error(
          "[META OAUTH START] Missing organisationId.",
          {
            userId:
              incomingUserId,
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

      parsedState = {
        platform:
          "meta",

        userId:
          incomingUserId,

        organisationId:
          incomingOrganisationId,

        createdAt:
          Date.now(),

        ...(incomingPageId
          ? {
              pageId:
                incomingPageId,
            }
          : {}),
      };
    }

    // ========================================================
    // NO USER / STATE
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
    // REQUIRE ORGANISATION
    // ========================================================

    if (
      !parsedState.organisationId
    ) {
      console.error(
        "[META OAUTH START] Parsed OAuth state has no organisationId.",
        {
          userId:
            parsedState.userId,
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
    // VALIDATE ORGANISATION UUID
    // ========================================================

    if (
      !isValidUuid(
        parsedState.organisationId
      )
    ) {
      console.error(
        "[META OAUTH START] Invalid organisation UUID:",
        {
          organisationId:
            parsedState.organisationId,
        }
      );

      return errorResponse(
        "Invalid organisation ID.",
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

          organisationId:
            parsedState.organisationId,

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

          organisationId:
            parsedState.organisationId,

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
    // VERIFY AUTH USER
    // ========================================================

    const {
      data:
        authUserData,

      error:
        authUserError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .getUserById(
          parsedState.userId
        );

    if (
      authUserError ||
      !authUserData.user
    ) {
      console.error(
        "[META OAUTH START] Supabase user verification failed:",
        authUserError
      );

      return errorResponse(
        "The signed-in TOTS-OS user could not be verified.",
        401
      );
    }

    // ========================================================
    // VERIFY ORGANISATION MEMBERSHIP
    //
    // This is important.
    //
    // We do not trust organisationId just because the browser
    // sent it.
    //
    // The server verifies that this user actually belongs to
    // that organisation before starting OAuth.
    // ========================================================

    const {
      data:
        membership,

      error:
        membershipError,
    } =
      await db
        .from(
          "user_organisations"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          parsedState.userId
        )
        .eq(
          "organisation_id",
          parsedState.organisationId
        )
        .maybeSingle();

    if (
      membershipError
    ) {
      console.error(
        "[META OAUTH START] Organisation membership verification failed:",
        membershipError
      );

      return errorResponse(
        "TOTS-OS could not verify your organisation access.",
        500,
        {
          message:
            membershipError.message,
        }
      );
    }

    if (
      !membership
    ) {
      console.error(
        "[META OAUTH START] User does not belong to organisation:",
        {
          userId:
            parsedState.userId,

          organisationId:
            parsedState.organisationId,
        }
      );

      return errorResponse(
        "You do not have access to this organisation.",
        403
      );
    }

    // ========================================================
    // CREATE CLEAN CANONICAL STATE
    //
    // This is the state Meta will return to:
    //
    // /api/auth/meta/callback
    //
    // The callback can therefore know EXACTLY which TOTS-OS
    // organisation initiated this connection.
    // ========================================================

    const canonicalState:
      MetaOAuthState = {
      platform:
        "meta",

      userId:
        parsedState.userId,

      organisationId:
        parsedState.organisationId,

      createdAt:
        parsedState.createdAt,

      ...(parsedState.pageId
        ? {
            pageId:
              parsedState.pageId,
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
         * Read Page information required by Graph API.
         */
        "pages_read_engagement",

        /*
         * Publish/manage Facebook Page posts.
         */
        "pages_manage_posts",

        /*
         * Discover the professional Instagram account linked
         * to a Facebook Page.
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
     * Do NOT encodeURIComponent() resolvedState.
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
     * During testing this is useful because Meta will request
     * previously declined permissions again.
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
          canonicalState.pageId ||
          null,

        permissions:
          permissions.split(
            ","
          ),

        /*
         * Never log:
         *
         * META_CLIENT_SECRET
         * access tokens
         * page access tokens
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