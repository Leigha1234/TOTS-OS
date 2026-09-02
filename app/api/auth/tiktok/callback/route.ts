import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

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
// CONSTANTS
// ============================================================

const APP_URL =
  "https://www.tots-os.co.uk";

const OAUTH_COOKIE_NAME =
  "tiktok_oauth_nonce";

const MAX_STATE_AGE_MS =
  15 *
  60 *
  1000;

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
// BASIC HELPERS
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
// STATE DECODER
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
      ) as TikTokOAuthState;

    return parsed;
  } catch (
    error
  ) {
    console.error(
      "[TIKTOK CALLBACK] Failed to decode state:",
      error
    );

    return null;
  }
}

// ============================================================
// SCOPE HELPER
// ============================================================

function getScopes(
  value:
    string | null
): string[] {
  if (
    !value
  ) {
    return [];
  }

  return value
    .split(",")
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );
}

// ============================================================
// CLEAR COOKIE
// ============================================================

function clearOAuthCookie(
  response:
    NextResponse
) {
  response.cookies.set(
    OAUTH_COOKIE_NAME,
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

      expires:
        new Date(
          0
        ),

      maxAge:
        0,
    }
  );
}

// ============================================================
// SETTINGS REDIRECT
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
      APP_URL
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
      url,
      {
        status:
          302,
      }
    );

  response.headers.set(
    "Cache-Control",
    "no-store"
  );

  clearOAuthCookie(
    response
  );

  return response;
}

// ============================================================
// SERVICE ROLE CLIENT
// ============================================================

function createServiceRoleClient() {
  const supabaseUrl =
    cleanString(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL
    );

  const serviceRoleKey =
    cleanString(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY
    );

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase service-role configuration is missing."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
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
    console.log(
      "[TIKTOK CALLBACK] Callback started:",
      request.nextUrl.pathname
    );

    // ========================================================
    // CALLBACK PARAMS
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

    const callbackScopesRaw =
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
      "[TIKTOK CALLBACK] Parameters:",
      {
        hasCode:
          Boolean(
            code
          ),

        hasState:
          Boolean(
            state
          ),

        oauthError,

        errorDescription,

        callbackScopes:
          callbackScopesRaw,
      }
    );

    // ========================================================
    // TIKTOK RETURNED ERROR
    // ========================================================

    if (
      oauthError
    ) {
      console.error(
        "[TIKTOK CALLBACK] OAuth rejected:",
        {
          oauthError,
          errorDescription,
        }
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          oauthError ===
          "access_denied"
            ? "access_denied"
            : "rejected",
      });
    }

    // ========================================================
    // REQUIRED CALLBACK VALUES
    // ========================================================

    if (
      !code
    ) {
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "missing_code",
      });
    }

    if (
      !state
    ) {
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "missing_state",
      });
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
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "state_mismatch",
      });
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
      "[TIKTOK CALLBACK] State decoded:",
      {
        hasNonce:
          Boolean(
            nonce
          ),

        userId,

        organisationId,

        platform,

        createdAt,
      }
    );

    // ========================================================
    // VALIDATE STATE
    // ========================================================

    if (
      !nonce ||
      !userId ||
      !organisationId ||
      platform !==
        "tiktok" ||
      !createdAt
    ) {
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "state_mismatch",
      });
    }

    const stateAge =
      Date.now() -
      createdAt;

    if (
      stateAge <
        0 ||
      stateAge >
        MAX_STATE_AGE_MS
    ) {
      console.error(
        "[TIKTOK CALLBACK] State expired:",
        {
          stateAge,
        }
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "state_expired",
      });
    }

    // ========================================================
    // NONCE COOKIE
    // ========================================================

    const expectedNonce =
      cleanString(
        request.cookies
          .get(
            OAUTH_COOKIE_NAME
          )
          ?.value
      );

    if (
      !expectedNonce ||
      expectedNonce !==
        nonce
    ) {
      console.error(
        "[TIKTOK CALLBACK] Nonce mismatch:",
        {
          hasExpectedNonce:
            Boolean(
              expectedNonce
            ),

          hasReturnedNonce:
            Boolean(
              nonce
            ),
        }
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "state_mismatch",
      });
    }

    // ========================================================
    // TIKTOK ENV
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
        "[TIKTOK CALLBACK] TikTok environment missing."
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "config",
      });
    }

    // ========================================================
    // VERIFY TOTS-OS USER
    // ========================================================

    const authSupabase =
      await createServerSupabaseClient();

    const {
      data: {
        user:
          authenticatedUser,
      },

      error:
        authError,
    } =
      await authSupabase
        .auth
        .getUser();

    if (
      authError ||
      !authenticatedUser?.id
    ) {
      console.error(
        "[TIKTOK CALLBACK] User is not authenticated:",
        authError
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "authentication",
      });
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

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "state_mismatch",
      });
    }

    // ========================================================
    // TOKEN EXCHANGE
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
      "[TIKTOK CALLBACK] Token exchange:",
      {
        ok:
          tokenResponse.ok,

        status:
          tokenResponse.status,

        hasAccessToken:
          Boolean(
            tokenData.access_token
          ),

        hasRefreshToken:
          Boolean(
            tokenData.refresh_token
          ),

        expiresIn:
          tokenData.expires_in,

        scope:
          tokenData.scope,

        error:
          tokenData.error,

        errorDescription:
          tokenData
            .error_description,

        logId:
          tokenData.log_id,
      }
    );

    if (
      !tokenResponse.ok ||
      !tokenData
        .access_token
    ) {
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "token_exchange",
      });
    }

    const accessToken =
      tokenData.access_token;

    const refreshToken =
      cleanString(
        tokenData
          .refresh_token
      );

    const tokenScopeRaw =
      cleanString(
        tokenData.scope
      );

    const tokenScopes =
      getScopes(
        tokenScopeRaw
      );

    const callbackScopes =
      getScopes(
        callbackScopesRaw
      );

    console.log(
      "[TIKTOK CALLBACK] Granted scopes:",
      {
        callbackScopes,

        tokenScopes,
      }
    );

    // ========================================================
    // REQUIRE PUBLISHING PERMISSION
    // ========================================================

    const hasVideoPublish =
      tokenScopes.includes(
        "video.publish"
      ) ||
      callbackScopes.includes(
        "video.publish"
      );

    if (
      !hasVideoPublish
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok did not grant video.publish:",
        {
          callbackScopes,

          tokenScopes,
        }
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "missing_video_publish",
      });
    }

    // ========================================================
    // FETCH PROFILE
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

    console.log(
      "[TIKTOK CALLBACK] Profile response:",
      {
        ok:
          profileResponse.ok,

        status:
          profileResponse.status,

        hasUser:
          Boolean(
            profileData
              .data
              ?.user
          ),

        error:
          profileData.error ||
          null,
      }
    );

    if (
      !profileResponse.ok ||
      !profileData
        .data
        ?.user
    ) {
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "profile",
      });
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
      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "profile",
      });
    }

    // ========================================================
    // EXPIRY
    // ========================================================

    const now =
      new Date();

    const expiresIn =
      typeof tokenData
        .expires_in ===
      "number"
        ? tokenData.expires_in
        : 86400;

    const expiresAt =
      new Date(
        now.getTime() +
        expiresIn *
          1000
      ).toISOString();

    // ========================================================
    // SERVICE ROLE FOR DATABASE WRITE
    // ========================================================

    const adminSupabase =
      createServiceRoleClient();

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
        ) ||
        "TikTok",

      avatar_url:
        cleanString(
          profile.avatar_url
        ),

      updated_at:
        now.toISOString(),
    };

    // ========================================================
    // LOOK FOR EXISTING CONNECTION
    // ========================================================

    const {
      data:
        existingConnection,

      error:
        existingConnectionError,
    } =
      await adminSupabase
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

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "database",
      });
    }

    // ========================================================
    // UPDATE / INSERT
    // ========================================================

    if (
      existingConnection?.id
    ) {
      const {
        error:
          updateError,
      } =
        await adminSupabase
          .from(
            "social_accounts"
          )
          .update(
            connectionData
          )
          .eq(
            "id",
            existingConnection.id
          );

      if (
        updateError
      ) {
        console.error(
          "[TIKTOK CALLBACK] Update failed:",
          updateError
        );

        return redirectToSettings({
          oauth:
            "tiktok_failed",

          reason:
            "database",
        });
      }
    } else {
      const {
        error:
          insertError,
      } =
        await adminSupabase
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
          "[TIKTOK CALLBACK] Insert failed:",
          insertError
        );

        return redirectToSettings({
          oauth:
            "tiktok_failed",

          reason:
            "database",
        });
      }
    }

    // ========================================================
    // VERIFY
    // ========================================================

    const {
      data:
        savedConnection,

      error:
        savedConnectionError,
    } =
      await adminSupabase
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            platform,
            organisation_id,
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
        "[TIKTOK CALLBACK] Save verification failed:",
        savedConnectionError
      );

      return redirectToSettings({
        oauth:
          "tiktok_failed",

        reason:
          "database",
      });
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[TIKTOK CALLBACK] Connected successfully:",
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

        tokenScopes,

        callbackScopes,

        hasVideoPublish,
      }
    );

    return redirectToSettings({
      oauth:
        "tiktok_success",

      connected:
        "tiktok",
    });
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK CALLBACK] Unexpected error:",
      error
    );

    return redirectToSettings({
      oauth:
        "tiktok_failed",

      reason:
        "unexpected",
    });
  }
}