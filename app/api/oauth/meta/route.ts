import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==================================================
// CONFIG
// ==================================================

const DEFAULT_META_GRAPH_VERSION =
  "v25.0";

// ==================================================
// HELPERS
// ==================================================

function getMetaGraphVersion() {
  const configured =
    process.env.META_GRAPH_API_VERSION?.trim();

  if (configured) {
    return configured.startsWith("v")
      ? configured
      : `v${configured}`;
  }

  return DEFAULT_META_GRAPH_VERSION;
}

function safeDecodeState(
  state: string
) {
  try {
    return JSON.parse(
      decodeURIComponent(state)
    ) as {
      platform?: string;
      userId?: string;
    };
  } catch {
    return null;
  }
}

// ==================================================
// GET
// ==================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==================================================
    // QUERY PARAMS
    // ==================================================

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const state =
      searchParams.get(
        "state"
      );

    if (!state) {
      console.error(
        "Meta OAuth start: missing state"
      );

      return NextResponse.json(
        {
          error:
            "Missing OAuth state",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // ENVIRONMENT
    // ==================================================

    const appId =
      process.env
        .META_CLIENT_ID?.trim();

    const appSecret =
      process.env
        .META_CLIENT_SECRET?.trim();

    const redirectUri =
      process.env
        .META_REDIRECT_URI?.trim();

    if (
      !appId ||
      !appSecret ||
      !redirectUri
    ) {
      console.error(
        "Meta OAuth environment variables missing",
        {
          hasClientId:
            Boolean(appId),

          hasClientSecret:
            Boolean(
              appSecret
            ),

          hasRedirectUri:
            Boolean(
              redirectUri
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Meta OAuth environment variables are missing",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // VALIDATE STATE
    // ==================================================

    const parsedState =
      safeDecodeState(
        state
      );

    if (!parsedState) {
      console.error(
        "Meta OAuth start: invalid OAuth state"
      );

      return NextResponse.json(
        {
          error:
            "Invalid OAuth state",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !parsedState.userId
    ) {
      console.error(
        "Meta OAuth start: state missing userId",
        parsedState
      );

      return NextResponse.json(
        {
          error:
            "OAuth state is missing userId",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Your settings page sends Meta connections
     * using platform: "meta".
     *
     * We allow "instagram" too because the same
     * Meta OAuth connection can resolve a linked
     * Instagram professional account.
     */
    if (
      parsedState.platform &&
      parsedState.platform !==
        "meta" &&
      parsedState.platform !==
        "instagram"
    ) {
      console.error(
        "Meta OAuth start: unexpected platform",
        {
          platform:
            parsedState.platform,
        }
      );

      return NextResponse.json(
        {
          error:
            "Invalid platform for Meta OAuth",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // PERMISSIONS
    // ==================================================

    /*
     * Minimum permissions required by the current
     * TOTS-OS Meta integration:
     *
     * pages_show_list
     * - discover Pages managed by the user
     *
     * pages_read_engagement
     * - access Page metadata/engagement required
     *   by the Graph API
     *
     * pages_manage_posts
     * - create/manage Facebook Page posts
     *
     * instagram_basic
     * - discover the Instagram professional account
     *   linked to a Facebook Page
     *
     * instagram_content_publish
     * - publish Instagram content
     *
     * business_management has deliberately NOT been
     * requested here because your current publishing
     * flow does not require it. Asking for unnecessary
     * permissions makes Meta App Review harder.
     */

    const permissions = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    // ==================================================
    // GRAPH VERSION
    // ==================================================

    const graphVersion =
      getMetaGraphVersion();

    // ==================================================
    // BUILD OAUTH URL
    // ==================================================

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
      state
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
     * Forces Meta to reconsider permissions that
     * may previously have been declined.
     *
     * This is useful while you are testing and
     * reconnecting accounts during setup.
     */
    oauthUrl.searchParams.set(
      "auth_type",
      "rerequest"
    );

    // ==================================================
    // LOG SAFE DEBUG INFO
    // ==================================================

    console.log(
      "Starting Meta OAuth",
      {
        graphVersion,

        redirectUri,

        platform:
          parsedState.platform ||
          "meta",

        userId:
          parsedState.userId,

        permissions:
          permissions.split(
            ","
          ),

        /*
         * Never log client secret.
         */
        clientIdConfigured:
          Boolean(appId),
      }
    );

    // ==================================================
    // REDIRECT
    // ==================================================

    return NextResponse.redirect(
      oauthUrl.toString()
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Meta OAuth start error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Meta OAuth error";

    return NextResponse.json(
      {
        error:
          "Unable to start Meta OAuth",

        message,
      },
      {
        status: 500,
      }
    );
  }
}