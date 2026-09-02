import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createServerSupabaseClient,
} from "@/lib/supabase-server";

// ============================================================
// CONFIG
// ============================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type TikTokOAuthState = {
  userId?: string;
  organisationId?: string;
  platform?: string;
  createdAt?: number;
};

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  open_id?: string;
  scope?: string;
  token_type?: string;

  error?: string;
  error_description?: string;
};

type TikTokProfile = {
  open_id?: string;
  display_name?: string;
  avatar_url?: string;
};

type TikTokProfileResponse = {
  data?: {
    user?: TikTokProfile;
  };

  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

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

function decodeState(
  value:
    string
): string {
  let result =
    value;

  /*
   * Your frontend previously encoded the JSON state before
   * URLSearchParams encoded it again.
   *
   * Decode defensively so old/new OAuth attempts both work.
   */
  for (
    let index =
      0;
    index <
      2;
    index +=
      1
  ) {
    try {
      const decoded =
        decodeURIComponent(
          result
        );

      if (
        decoded ===
        result
      ) {
        break;
      }

      result =
        decoded;
    } catch {
      break;
    }
  }

  return result;
}

// ============================================================

function parseOAuthState(
  state:
    string
): {
  userId:
    string | null;

  organisationId:
    string | null;

  platform:
    string | null;

  createdAt:
    number | null;
} {
  const decoded =
    decodeState(
      state
    );

  try {
    const parsed =
      JSON.parse(
        decoded
      ) as TikTokOAuthState;

    return {
      userId:
        cleanString(
          parsed.userId
        ),

      organisationId:
        cleanString(
          parsed.organisationId
        ),

      platform:
        cleanString(
          parsed.platform
        ),

      createdAt:
        typeof parsed.createdAt ===
        "number"
          ? parsed.createdAt
          : null,
    };
  } catch {
    /*
     * Legacy support where state may have been only the user id.
     */
    return {
      userId:
        cleanString(
          decoded
        ),

      organisationId:
        null,

      platform:
        null,

      createdAt:
        null,
    };
  }
}

// ============================================================

function redirectToSettings(
  appUrl:
    string,

  params:
    Record<
      string,
      string
    >
) {
  const url =
    new URL(
      "/settings",
      appUrl
    );

  for (
    const [
      key,
      value,
    ] of Object.entries(
      params
    )
  ) {
    url.searchParams.set(
      key,
      value
    );
  }

  return NextResponse.redirect(
    url
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  const appUrl =
    cleanString(
      process.env
        .TIKTOK_POST_AUTH_REDIRECT
    ) ||
    cleanString(
      process.env
        .NEXT_PUBLIC_APP_URL
    ) ||
    "https://www.tots-os.co.uk";

  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    // ========================================================
    // CALLBACK PARAMETERS
    // ========================================================

    const code =
      cleanString(
        searchParams.get(
          "code"
        )
      );

    const state =
      cleanString(
        searchParams.get(
          "state"
        )
      );

    const oauthError =
      cleanString(
        searchParams.get(
          "error"
        )
      );

    const errorDescription =
      cleanString(
        searchParams.get(
          "error_description"
        )
      );

    const grantedScopesFromCallback =
      cleanString(
        searchParams.get(
          "scopes"
        )
      ) ||
      cleanString(
        searchParams.get(
          "scope"
        )
      );

    // ========================================================
    // PARSE STATE
    // ========================================================

    const parsedState =
      state
        ? parseOAuthState(
            state
          )
        : {
            userId:
              null,

            organisationId:
              null,

            platform:
              null,

            createdAt:
              null,
          };

    const {
      userId,
      organisationId,
      platform,
      createdAt,
    } =
      parsedState;

    console.log(
      "[TIKTOK CALLBACK] Received callback:",
      {
        hasCode:
          Boolean(
            code
          ),

        hasState:
          Boolean(
            state
          ),

        userId,

        organisationId,

        platform,

        createdAt,

        grantedScopesFromCallback,
      }
    );

    // ========================================================
    // TIKTOK REJECTED / RETURNED ERROR
    // ========================================================

    if (
      oauthError
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok OAuth rejected:",
        {
          oauthError,
          errorDescription,
          grantedScopesFromCallback,
        }
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            oauthError ===
            "access_denied"
              ? "access_denied"
              : "rejected",
        }
      );
    }

    // ========================================================
    // VALIDATE CALLBACK PARAMETERS
    // ========================================================

    if (
      !code ||
      !state ||
      !userId
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing callback parameters:",
        {
          hasCode:
            Boolean(
              code
            ),

          hasState:
            Boolean(
              state
            ),

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

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "missing_parameters",
        }
      );
    }

    if (
      !organisationId
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing organisation in OAuth state"
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "missing_organisation",
        }
      );
    }

    if (
      platform &&
      platform !==
        "tiktok"
    ) {
      console.error(
        "[TIKTOK CALLBACK] Invalid platform in state:",
        platform
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // BASIC STATE AGE CHECK
    // ========================================================

    if (
      createdAt
    ) {
      const stateAge =
        Date.now() -
        createdAt;

      const maximumStateAge =
        15 *
        60 *
        1000;

      if (
        stateAge <
          0 ||
        stateAge >
          maximumStateAge
      ) {
        console.error(
          "[TIKTOK CALLBACK] OAuth state expired:",
          {
            stateAge,
          }
        );

        return redirectToSettings(
          appUrl,
          {
            oauth:
              "tiktok_failed",

            reason:
              "state_mismatch",
          }
        );
      }
    }

    // ========================================================
    // ENVIRONMENT VARIABLES
    // ========================================================

    const clientKey =
      cleanString(
        process.env
          .TIKTOK_CLIENT_KEY
      );

    const clientSecret =
      cleanString(
        process.env
          .TIKTOK_CLIENT_SECRET
      );

    const redirectUri =
      cleanString(
        process.env
          .TIKTOK_REDIRECT_URI
      );

    if (
      !clientKey ||
      !clientSecret ||
      !redirectUri
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing TikTok environment variables:",
        {
          hasClientKey:
            Boolean(
              clientKey
            ),

          hasClientSecret:
            Boolean(
              clientSecret
            ),

          hasRedirectUri:
            Boolean(
              redirectUri
            ),
        }
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "config",
        }
      );
    }

    // ========================================================
    // VERIFY CURRENT TOTS-OS USER
    // ========================================================

    const supabase =
      await createServerSupabaseClient();

    const {
      data: {
        user:
          authenticatedUser,
      },

      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !authenticatedUser?.id
    ) {
      console.error(
        "[TIKTOK CALLBACK] TOTS-OS authentication failed:",
        authError
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "authentication",
        }
      );
    }

    if (
      authenticatedUser.id !==
      userId
    ) {
      console.error(
        "[TIKTOK CALLBACK] OAuth state user mismatch:",
        {
          authenticatedUserId:
            authenticatedUser.id,

          stateUserId:
            userId,
        }
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // EXCHANGE CODE FOR TOKEN
    // ========================================================

    const tokenResponse =
      await fetch(
        "https://open.tiktokapis.com/v2/oauth/token/",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams(
              {
                client_key:
                  clientKey,

                client_secret:
                  clientSecret,

                code,

                grant_type:
                  "authorization_code",

                redirect_uri:
                  redirectUri,
              }
            ),

          cache:
            "no-store",
        }
      );

    const tokenData =
      (
        await tokenResponse
          .json()
          .catch(
            () =>
              ({})
          )
      ) as TikTokTokenResponse;

    console.log(
      "[TIKTOK CALLBACK] Token response:",
      {
        ok:
          tokenResponse.ok,

        status:
          tokenResponse.status,

        scope:
          tokenData.scope,

        accessTokenReceived:
          Boolean(
            tokenData.access_token
          ),

        refreshTokenReceived:
          Boolean(
            tokenData.refresh_token
          ),

        expiresIn:
          tokenData.expires_in,

        refreshExpiresIn:
          tokenData.refresh_expires_in,

        openId:
          tokenData.open_id,

        tokenType:
          tokenData.token_type,

        error:
          tokenData.error,

        errorDescription:
          tokenData.error_description,
      }
    );

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "[TIKTOK CALLBACK] Token exchange failed:",
        tokenData
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "token_exchange",
        }
      );
    }

    const accessToken =
      tokenData.access_token;

    const refreshToken =
      cleanString(
        tokenData.refresh_token
      );

    const expiresIn =
      typeof tokenData.expires_in ===
      "number"
        ? tokenData.expires_in
        : null;

    const tokenScope =
      cleanString(
        tokenData.scope
      );

    // ========================================================
    // LOG GRANTED SCOPES
    // ========================================================

    console.log(
      "[TIKTOK CALLBACK] Granted scope check:",
      {
        callbackScopes:
          grantedScopesFromCallback,

        tokenScopes:
          tokenScope,

        hasBasicScope:
          tokenScope?.includes(
            "user.info.basic"
          ) ??
          false,

        hasPublishScope:
          tokenScope?.includes(
            "video.publish"
          ) ??
          false,

        hasUploadScope:
          tokenScope?.includes(
            "video.upload"
          ) ??
          false,
      }
    );

    // ========================================================
    // REQUIRE BASIC PROFILE SCOPE
    // ========================================================

    if (
      tokenScope &&
      !tokenScope.includes(
        "user.info.basic"
      )
    ) {
      console.error(
        "[TIKTOK CALLBACK] user.info.basic was not granted"
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "profile",
        }
      );
    }

    // ========================================================
    // GET BASIC TIKTOK PROFILE
    // ========================================================

    const profileUrl =
      new URL(
        "https://open.tiktokapis.com/v2/user/info/"
      );

    profileUrl.searchParams.set(
      "fields",
      [
        "open_id",
        "display_name",
        "avatar_url",
      ].join(
        ","
      )
    );

    const profileResponse =
      await fetch(
        profileUrl,
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );

    const profileData =
      (
        await profileResponse
          .json()
          .catch(
            () =>
              ({})
          )
      ) as TikTokProfileResponse;

    if (
      !profileResponse.ok ||
      !profileData
        ?.data
        ?.user
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok profile request failed:",
        {
          status:
            profileResponse.status,

          response:
            profileData,
        }
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "profile",
        }
      );
    }

    const profile =
      profileData.data.user;

    const platformUserId =
      cleanString(
        profile.open_id
      ) ||
      cleanString(
        tokenData.open_id
      );

    if (
      !platformUserId
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok did not return an open_id"
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "profile",
        }
      );
    }

    // ========================================================
    // SAVE CONNECTION
    // ========================================================

    const now =
      new Date();

    const expiresAt =
      expiresIn
        ? new Date(
            now.getTime() +
              expiresIn *
                1000
          ).toISOString()
        : null;

    const connectionData = {
      user_id:
        userId,

      organisation_id:
        organisationId,

      platform:
        "tiktok",

      platform_user_id:
        platformUserId,

      access_token:
        accessToken,

      refresh_token:
        refreshToken,

      expires_at:
        expiresAt,

      display_name:
        cleanString(
          profile.display_name
        ),

      avatar_url:
        cleanString(
          profile.avatar_url
        ),

      updated_at:
        now.toISOString(),
    };

    // ========================================================
    // FIND EXISTING TIKTOK CONNECTION
    // ========================================================

    const {
      data:
        existingConnection,

      error:
        existingConnectionError,
    } =
      await supabase
        .from(
          "social_accounts"
        )
        .select(
          "id"
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "platform",
          "tiktok"
        )
        .maybeSingle();

    if (
      existingConnectionError
    ) {
      console.error(
        "[TIKTOK CALLBACK] Existing connection lookup failed:",
        existingConnectionError
      );

      return redirectToSettings(
        appUrl,
        {
          oauth:
            "tiktok_failed",

          reason:
            "database",
        }
      );
    }

    // ========================================================
    // UPDATE OR INSERT
    // ========================================================

    if (
      existingConnection?.id
    ) {
      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "social_accounts"
          )
          .update(
            connectionData
          )
          .eq(
            "id",
            existingConnection.id
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        updateError
      ) {
        console.error(
          "[TIKTOK CALLBACK] TikTok connection update failed:",
          updateError
        );

        return redirectToSettings(
          appUrl,
          {
            oauth:
              "tiktok_failed",

            reason:
              "database",
          }
        );
      }
    } else {
      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "social_accounts"
          )
          .insert(
            connectionData
          );

      if (
        insertError
      ) {
        console.error(
          "[TIKTOK CALLBACK] TikTok connection insert failed:",
          insertError
        );

        return redirectToSettings(
          appUrl,
          {
            oauth:
              "tiktok_failed",

            reason:
              "database",
          }
        );
      }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[TIKTOK CALLBACK] TikTok connected successfully:",
      {
        userId,

        organisationId,

        platformUserId,

        displayName:
          profile.display_name,

        callbackScopes:
          grantedScopesFromCallback,

        tokenScopes:
          tokenScope,

        hasVideoPublish:
          tokenScope?.includes(
            "video.publish"
          ) ??
          false,

        hasVideoUpload:
          tokenScope?.includes(
            "video.upload"
          ) ??
          false,
      }
    );

    // ========================================================
    // REDIRECT BACK TO SETTINGS
    // ========================================================

    return redirectToSettings(
      appUrl,
      {
        oauth:
          "tiktok_success",

        connected:
          "tiktok",
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK CALLBACK] Unexpected callback error:",
      error
    );

    return redirectToSettings(
      appUrl,
      {
        oauth:
          "tiktok_failed",

        reason:
          "unexpected",
      }
    );
  }
}