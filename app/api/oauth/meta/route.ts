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

// ============================================================
// HELPERS
// ============================================================

function requireEnv(
  name: string
) {
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
// STATE
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

function encodeState(
  state:
    MetaOAuthState
) {
  return encodeURIComponent(
    JSON.stringify(
      state
    )
  );
}

// ============================================================

function decodeState(
  state:
    string
):
  | MetaOAuthState
  | null {
  try {
    const decoded =
      JSON.parse(
        decodeURIComponent(
          state
        )
      ) as Partial<MetaOAuthState>;

    if (
      decoded.platform !==
        "meta" ||
      typeof decoded.userId !==
        "string" ||
      !decoded.userId.trim()
    ) {
      return null;
    }

    return {
      platform:
        "meta",

      userId:
        decoded.userId.trim(),

      createdAt:
        Number(
          decoded.createdAt ||
            Date.now()
        ),
    };
  } catch {
    return null;
  }
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
     * We deliberately don't need META_CLIENT_SECRET in this
     * start route.
     *
     * The client secret is only needed server-side when the
     * callback exchanges the code for an access token.
     */

    // ========================================================
    // INPUT
    // ========================================================

    const incomingState =
      url.searchParams.get(
        "state"
      );

    const incomingUserId =
      url.searchParams
        .get(
          "userId"
        )
        ?.trim();

    const incomingPlatform =
      url.searchParams
        .get(
          "platform"
        )
        ?.trim()
        .toLowerCase();

    // ========================================================
    // RESOLVE STATE
    //
    // We support two forms:
    //
    // 1. Existing encoded state
    // 2. userId passed from TOTS-OS
    //
    // This makes the route compatible while we clean up the
    // social connection system.
    // ========================================================

    let resolvedState:
      string;

    let parsedState:
      MetaOAuthState;

    // ========================================================
    // EXISTING STATE
    // ========================================================

    if (
      incomingState
    ) {
      const decoded =
        decodeState(
          incomingState
        );

      if (
        !decoded
      ) {
        console.error(
          "[META OAUTH START] Invalid state received."
        );

        return NextResponse.json(
          {
            error:
              "Invalid OAuth state.",
          },
          {
            status:
              400,
          }
        );
      }

      parsedState =
        decoded;

      resolvedState =
        incomingState;
    }

    // ========================================================
    // CREATE STATE FROM USER ID
    // ========================================================

    else {
      if (
        !incomingUserId
      ) {
        console.error(
          "[META OAUTH START] Missing userId."
        );

        return NextResponse.json(
          {
            error:
              "Missing authenticated user ID.",
          },
          {
            status:
              400,
          }
        );
      }

      if (
        incomingPlatform &&
        incomingPlatform !==
          "meta" &&
        incomingPlatform !==
          "facebook" &&
        incomingPlatform !==
          "instagram"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid platform for Meta OAuth.",
          },
          {
            status:
              400,
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

      resolvedState =
        encodeState(
          parsedState
        );
    }

    // ========================================================
    // STATE AGE
    //
    // Prevent very old OAuth links being reused indefinitely.
    // ========================================================

    const stateAge =
      Date.now() -
      parsedState.createdAt;

    const maximumStateAge =
      30 *
      60 *
      1000;

    if (
      stateAge >
      maximumStateAge
    ) {
      console.error(
        "[META OAUTH START] OAuth state expired."
      );

      return NextResponse.json(
        {
          error:
            "OAuth request has expired. Please try connecting Meta again.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // PERMISSIONS
    // ========================================================

    const permissions =
      [
        /*
         * See Pages managed by the user.
         */
        "pages_show_list",

        /*
         * Required for Page information and related Page API
         * functionality.
         */
        "pages_read_engagement",

        /*
         * Publish Facebook Page posts.
         */
        "pages_manage_posts",

        /*
         * Discover the Instagram professional account linked
         * to a Facebook Page.
         */
        "instagram_basic",

        /*
         * Publish media to Instagram.
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
     * During development this is useful because Meta will
     * prompt again for permissions previously declined.
     */
    oauthUrl.searchParams.set(
      "auth_type",
      "rerequest"
    );

    // ========================================================
    // DEBUGGING
    // ========================================================

    console.log(
      "[META OAUTH START] Starting OAuth:",
      {
        graphVersion,

        redirectUri,

        userId:
          parsedState.userId,

        platform:
          parsedState.platform,

        permissions:
          permissions.split(
            ","
          ),
      }
    );

    // ========================================================
    // REDIRECT TO META
    // ========================================================

    return NextResponse.redirect(
      oauthUrl
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[META OAUTH START] Failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to start Meta OAuth.",

        message:
          error instanceof
            Error
            ? error.message
            : "Unknown Meta OAuth error.",
      },
      {
        status:
          500,
      }
    );
  }
}