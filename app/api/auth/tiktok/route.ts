import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

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

type TikTokTokenResponse = {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  log_id?: string;
};

type TikTokProfileUser = {
  open_id?: string;
  display_name?: string;
  avatar_url?: string;
};

type TikTokProfileResponse = {
  data?: {
    user?: TikTokProfileUser;
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

function getAppUrl() {
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

function buildSettingsRedirect(
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
    ] of
    Object.entries(
      params
    )
  ) {
    url.searchParams.set(
      key,
      value
    );
  }

  return url;
}

function clearOAuthCookies(
  response:
    NextResponse
) {
  const cookieNames = [
    "tiktok_oauth_state",
    "tiktok_oauth_user_id",
    "tiktok_oauth_organisation_id",
  ];

  for (
    const cookieName of
    cookieNames
  ) {
    response.cookies.set(
      cookieName,
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
}

function redirectWithError(
  reason:
    string
) {
  return NextResponse.redirect(
    buildSettingsRedirect(
      {
        oauth:
          "tiktok_failed",

        reason,
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
    // ========================================================
    // TIKTOK RESPONSE
    // ========================================================

    const code =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "code"
          )
      );

    const returnedState =
      cleanString(
        request.nextUrl
          .searchParams
          .get(
            "state"
          )
      );

    const error =
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

    if (
      error
    ) {
      console.error(
        "[TIKTOK CALLBACK] TikTok returned an OAuth error:",
        {
          error,
          errorDescription,
        }
      );

      return redirectWithError(
        error ===
          "access_denied"
          ? "access_denied"
          : error
      );
    }

    // ========================================================
    // READ SECURE OAUTH CONTEXT
    // ========================================================

    const expectedState =
      cleanString(
        request.cookies
          .get(
            "tiktok_oauth_state"
          )
          ?.value
      );

    const userId =
      cleanString(
        request.cookies
          .get(
            "tiktok_oauth_user_id"
          )
          ?.value
      );

    const organisationId =
      cleanString(
        request.cookies
          .get(
            "tiktok_oauth_organisation_id"
          )
          ?.value
      );

    console.log(
      "[TIKTOK CALLBACK] OAuth context:",
      {
        hasCode:
          Boolean(
            code
          ),

        hasReturnedState:
          Boolean(
            returnedState
          ),

        hasExpectedState:
          Boolean(
            expectedState
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

    if (
      !code
    ) {
      return redirectWithError(
        "missing_code"
      );
    }

    if (
      !returnedState ||
      !expectedState
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing OAuth state."
      );

      return redirectWithError(
        "missing_state"
      );
    }

    if (
      returnedState !==
      expectedState
    ) {
      console.error(
        "[TIKTOK CALLBACK] State mismatch."
      );

      return redirectWithError(
        "state_mismatch"
      );
    }

    if (
      !userId ||
      !organisationId
    ) {
      console.error(
        "[TIKTOK CALLBACK] OAuth context cookies are missing."
      );

      return redirectWithError(
        "missing_parameters"
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
      !clientKey ||
      !clientSecret ||
      !redirectUri
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing TikTok configuration."
      );

      return redirectWithError(
        "config"
      );
    }

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "[TIKTOK CALLBACK] Missing Supabase server configuration."
      );

      return redirectWithError(
        "database"
      );
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

    if (
      !tokenResponse.ok ||
      !tokenData
        .access_token
    ) {
      console.error(
        "[TIKTOK CALLBACK] Token exchange failed:",
        {
          status:
            tokenResponse.status,

          error:
            tokenData.error,

          description:
            tokenData
              .error_description,

          logId:
            tokenData.log_id,
        }
      );

      return redirectWithError(
        "token_exchange"
      );
    }

    console.log(
      "[TIKTOK CALLBACK] Token exchange successful:",
      {
        openId:
          tokenData.open_id ||
          null,

        expiresIn:
          tokenData.expires_in ||
          null,

        hasRefreshToken:
          Boolean(
            tokenData
              .refresh_token
          ),

        scope:
          tokenData.scope ||
          null,
      }
    );

    // ========================================================
    // EXPIRY
    // ========================================================

    const expiresIn =
      Number(
        tokenData
          .expires_in ||
        86400
      );

    const expiresAt =
      new Date(
        Date.now() +
        expiresIn *
          1000
      ).toISOString();

    // ========================================================
    // TIKTOK PROFILE
    // ========================================================

    let profile:
      TikTokProfileUser |
      undefined;

    try {
      const profileUrl =
        new URL(
          "https://open.tiktokapis.com/v2/user/info/"
        );

      profileUrl
        .searchParams
        .set(
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
                `Bearer ${tokenData.access_token}`,
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

      const profileErrorCode =
        cleanString(
          profileData
            .error
            ?.code
        );

      const profileWorked =
        profileResponse.ok &&
        (
          !profileErrorCode ||
          profileErrorCode ===
            "ok"
        );

      if (
        profileWorked
      ) {
        profile =
          profileData
            .data
            ?.user;
      } else {
        console.warn(
          "[TIKTOK CALLBACK] Profile request failed:",
          {
            status:
              profileResponse.status,

            error:
              profileData.error,
          }
        );
      }
    } catch (
      profileError:
        unknown
    ) {
      console.warn(
        "[TIKTOK CALLBACK] Profile request threw:",
        profileError
      );
    }

    const platformUserId =
      cleanString(
        profile?.open_id
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

      return redirectWithError(
        "profile"
      );
    }

    // ========================================================
    // SUPABASE ADMIN
    // ========================================================

    const supabaseAdmin =
      createClient(
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

    // ========================================================
    // FIND EXISTING CONNECTION
    // ========================================================

    const {
      data:
        existingConnection,

      error:
        existingError,
    } =
      await supabaseAdmin
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
      existingError
    ) {
      console.error(
        "[TIKTOK CALLBACK] Existing account lookup failed:",
        existingError
      );

      return redirectWithError(
        "database"
      );
    }

    // ========================================================
    // CONNECTION DATA
    // ========================================================

    const now =
      new Date()
        .toISOString();

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
        tokenData
          .access_token,

      refresh_token:
        tokenData
          .refresh_token ||
        null,

      expires_at:
        expiresAt,

      display_name:
        cleanString(
          profile
            ?.display_name
        ) ||
        "TikTok",

      avatar_url:
        cleanString(
          profile
            ?.avatar_url
        ),

      updated_at:
        now,
    };

    // ========================================================
    // UPDATE EXISTING
    // ========================================================

    if (
      existingConnection
        ?.id
    ) {
      console.log(
        "[TIKTOK CALLBACK] Updating existing TikTok connection:",
        existingConnection.id
      );

      const {
        error:
          updateError,
      } =
        await supabaseAdmin
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
          "[TIKTOK CALLBACK] TikTok update failed:",
          updateError
        );

        return redirectWithError(
          "database"
        );
      }
    } else {
      // ======================================================
      // INSERT NEW
      // ======================================================

      console.log(
        "[TIKTOK CALLBACK] Creating new TikTok connection."
      );

      const {
        error:
          insertError,
      } =
        await supabaseAdmin
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
          "[TIKTOK CALLBACK] TikTok insert failed:",
          insertError
        );

        return redirectWithError(
          "database"
        );
      }
    }

    // ========================================================
    // CONFIRM DATABASE WRITE
    // ========================================================

    const {
      data:
        savedConnection,

      error:
        savedError,
    } =
      await supabaseAdmin
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
      savedError ||
      !savedConnection
    ) {
      console.error(
        "[TIKTOK CALLBACK] Could not confirm saved connection:",
        savedError
      );

      return redirectWithError(
        "database"
      );
    }

    console.log(
      "[TIKTOK CALLBACK] TikTok saved successfully:",
      {
        id:
          savedConnection.id,

        displayName:
          savedConnection
            .display_name,

        expiresAt:
          savedConnection
            .expires_at,

        updatedAt:
          savedConnection
            .updated_at,
      }
    );

    // ========================================================
    // SUCCESS REDIRECT
    // ========================================================

    const response =
      NextResponse.redirect(
        buildSettingsRedirect(
          {
            oauth:
              "tiktok_success",

            connected:
              "tiktok",
          }
        )
      );

    clearOAuthCookies(
      response
    );

    return response;
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK CALLBACK] Unexpected error:",
      error
    );

    return redirectWithError(
      "unexpected"
    );
  }
}