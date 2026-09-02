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
  nonce?: string;
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
  log_id?: string;
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

function getAppUrl(): string {
  return (
    cleanString(
      process.env
        .TIKTOK_POST_AUTH_REDIRECT
    ) ||
    cleanString(
      process.env
        .NEXT_PUBLIC_APP_URL
    ) ||
    "https://www.tots-os.co.uk"
  );
}

// ============================================================

function decodeOAuthState(
  state:
    string
): TikTokOAuthState | null {
  try {
    const decoded =
      Buffer.from(
        state,
        "base64url"
      ).toString(
        "utf8"
      );

    const parsed =
      JSON.parse(
        decoded
      ) as
        TikTokOAuthState;

    return parsed;
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK CALLBACK] Could not decode OAuth state:",
      error
    );

    return null;
  }
}

// ============================================================

function clearOAuthCookie(
  response:
    NextResponse
) {
  response.cookies.set(
    "tiktok_oauth_nonce",
    "",
    {
      httpOnly:
        true,

      secure:
        true,

      sameSite:
        "lax",

      path:
        "/",

      domain:
        ".tots-os.co.uk",

      maxAge:
        0,
    }
  );
}

// ============================================================

function redirectToSettings(
  params:
    Record<
      string,
      string
    >
) {
  const url =
    new URL(
      "/settings",
      getAppUrl()
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

  const response =
    NextResponse.redirect(
      url
    );

  clearOAuthCookie(
    response
  );

  return response;
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
    // CALLBACK PARAMETERS
    // ========================================================

    const code =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "code"
          )
      );

    const state =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "state"
          )
      );

    const oauthError =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "error"
          )
      );

    const errorDescription =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "error_description"
          )
      );

    const grantedScopesFromCallback =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "scopes"
          )
      ) ||
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "scope"
          )
      );

    console.log(
      "[TIKTOK CALLBACK] Incoming callback:",
      {
        hasCode:
          Boolean(
            code
          ),

        hasState:
          Boolean(
            state
          ),

        hasOAuthError:
          Boolean(
            oauthError
          ),

        grantedScopesFromCallback,
      }
    );

    // ========================================================
    // TIKTOK ERROR
    // ========================================================

    if (
      oauthError
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok OAuth rejected:",
        {
          oauthError,
          errorDescription,
        }
      );

      return redirectToSettings(
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
    // REQUIRED PARAMETERS
    // ========================================================

    if (
      !code
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing authorization code."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "missing_code",
        }
      );
    }

    if (
      !state
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing OAuth state."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "missing_state",
        }
      );
    }

    // ========================================================
    // DECODE STATE
    // ========================================================

    const parsedState =
      decodeOAuthState(
        state
      );

    if (
      !parsedState
    ) {
      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    const nonce =
      cleanString(
        parsedState.nonce
      );

    const userId =
      cleanString(
        parsedState.userId
      );

    const organisationId =
      cleanString(
        parsedState.organisationId
      );

    const platform =
      cleanString(
        parsedState.platform
      );

    const createdAt =
      typeof parsedState
        .createdAt ===
      "number"
        ? parsedState.createdAt
        : null;

    console.log(
      "[TIKTOK CALLBACK] Decoded state:",
      {
        hasNonce:
          Boolean(
            nonce
          ),

        hasUserId:
          Boolean(
            userId
          ),

        hasOrganisationId:
          Boolean(
            organisationId
          ),

        platform,

        createdAt,
      }
    );

    // ========================================================
    // VALIDATE STATE CONTENT
    // ========================================================

    if (
      !nonce ||
      !userId ||
      !organisationId
    ) {
      console.error(
        "[TIKTOK CALLBACK] State is missing required context."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "missing_parameters",
        }
      );
    }

    if (
      platform !==
      "tiktok"
    ) {
      console.error(
        "[TIKTOK CALLBACK] Invalid platform in state:",
        platform
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // VALIDATE STATE AGE
    // ========================================================

    if (
      !createdAt
    ) {
      console.error(
        "[TIKTOK CALLBACK] State creation time is missing."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    const stateAge =
      Date.now() -
      createdAt;

    const maxStateAge =
      15 *
      60 *
      1000;

    if (
      stateAge <
        0 ||
      stateAge >
        maxStateAge
    ) {
      console.error(
        "[TIKTOK CALLBACK] OAuth state expired:",
        {
          stateAge,
        }
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // VALIDATE NONCE COOKIE
    // ========================================================

    const expectedNonce =
      cleanString(
        request.cookies
          .get(
            "tiktok_oauth_nonce"
          )
          ?.value
      );

    console.log(
      "[TIKTOK CALLBACK] Nonce validation:",
      {
        hasReturnedNonce:
          Boolean(
            nonce
          ),

        hasExpectedNonce:
          Boolean(
            expectedNonce
          ),

        matches:
          Boolean(
            nonce &&
            expectedNonce &&
            nonce ===
              expectedNonce
          ),
      }
    );

    if (
      !expectedNonce ||
      nonce !==
        expectedNonce
    ) {
      console.error(
        "[TIKTOK CALLBACK] OAuth nonce mismatch."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // ENVIRONMENT
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
        "[TIKTOK CALLBACK] TikTok configuration missing:",
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
        "[TIKTOK CALLBACK] User mismatch:",
        {
          authenticatedUserId:
            authenticatedUser.id,

          stateUserId:
            userId,
        }
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "state_mismatch",
        }
      );
    }

    // ========================================================
    // EXCHANGE CODE FOR TOKENS
    // ========================================================

    const tokenBody =
      new URLSearchParams();

    tokenBody.set(
      "client_key",
      clientKey
    );

    tokenBody.set(
      "client_secret",
      clientSecret
    );

    tokenBody.set(
      "code",
      code
    );

    tokenBody.set(
      "grant_type",
      "authorization_code"
    );

    tokenBody.set(
      "redirect_uri",
      redirectUri
    );

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
            tokenBody.toString(),

          cache:
            "no-store",
        }
      );

    const tokenData =
      (
        await tokenResponse
          .json()
          .catch(
            () => ({})
          )
      ) as
        TikTokTokenResponse;

    console.log(
      "[TIKTOK CALLBACK] Token response:",
      {
        ok:
          tokenResponse.ok,

        status:
          tokenResponse.status,

        accessTokenReceived:
          Boolean(
            tokenData
              .access_token
          ),

        refreshTokenReceived:
          Boolean(
            tokenData
              .refresh_token
          ),

        expiresIn:
          tokenData
            .expires_in,

        refreshExpiresIn:
          tokenData
            .refresh_expires_in,

        openId:
          tokenData.open_id ||
          null,

        scope:
          tokenData.scope ||
          null,

        error:
          tokenData.error ||
          null,

        errorDescription:
          tokenData
            .error_description ||
          null,

        logId:
          tokenData.log_id ||
          null,
      }
    );

    if (
      !tokenResponse.ok ||
      !tokenData
        .access_token
    ) {
      console.error(
        "[TIKTOK CALLBACK] Token exchange failed."
      );

      return redirectToSettings(
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
        tokenData
          .refresh_token
      );

    const expiresIn =
      typeof tokenData
        .expires_in ===
      "number"
        ? tokenData.expires_in
        : 86400;

    const tokenScope =
      cleanString(
        tokenData.scope
      );

    // ========================================================
    // GET TIKTOK PROFILE
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
        profileUrl.toString(),
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
            () => ({})
          )
      ) as
        TikTokProfileResponse;

    if (
      !profileResponse.ok ||
      !profileData
        .data
        ?.user
    ) {
      console.error(
        "[TIKTOK CALLBACK] Profile request failed:",
        {
          status:
            profileResponse.status,

          error:
            profileData.error ||
            null,
        }
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "profile",
        }
      );
    }

    const profile =
      profileData
        .data
        .user;

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
        "[TIKTOK CALLBACK] No TikTok open_id returned."
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "profile",
        }
      );
    }

    // ========================================================
    // PREPARE DATABASE DATA
    // ========================================================

    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime() +
        expiresIn *
          1000
      ).toISOString();

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
          profile
            .display_name
        ) ||
        "TikTok",

      avatar_url:
        cleanString(
          profile
            .avatar_url
        ),

      updated_at:
        now.toISOString(),
    };

    // ========================================================
    // FIND EXISTING CONNECTION
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
        "[TIKTOK CALLBACK] Existing TikTok connection lookup failed:",
        existingConnectionError
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "database",
        }
      );
    }

    // ========================================================
    // UPDATE EXISTING CONNECTION
    // ========================================================

    if (
      existingConnection
        ?.id
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
          {
            oauth:
              "tiktok_failed",

            reason:
              "database",
          }
        );
      }
    } else {
      // ======================================================
      // INSERT NEW CONNECTION
      // ======================================================

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
    // VERIFY SAVE
    // ========================================================

    const {
      data:
        savedConnection,

      error:
        savedConnectionError,
    } =
      await supabase
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            platform,
            platform_user_id,
            display_name,
            expires_at,
            updated_at
          `
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
      savedConnectionError ||
      !savedConnection
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok save verification failed:",
        savedConnectionError
      );

      return redirectToSettings(
        {
          oauth:
            "tiktok_failed",

          reason:
            "database",
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[TIKTOK CALLBACK] TikTok connected successfully:",
      {
        id:
          savedConnection.id,

        userId,

        organisationId,

        platformUserId:

          savedConnection
            .platform_user_id,

        displayName:
          savedConnection
            .display_name,

        expiresAt:
          savedConnection
            .expires_at,

        updatedAt:
          savedConnection
            .updated_at,

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

    return redirectToSettings(
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
      {
        oauth:
          "tiktok_failed",

        reason:
          "unexpected",
      }
    );
  }
}