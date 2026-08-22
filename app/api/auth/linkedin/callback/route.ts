import {
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
// TYPES
// ============================================================

type LinkedInOAuthState = {
  userId?: string;
  platform?: string;
  createdAt?: number;
};

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;

  error?: string;
  error_description?: string;
};

type LinkedInUserInfoResponse = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
};

type ExistingAccountRow = {
  id: string;
};

type SavedAccountRow = {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  expires_at: string | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned || null;
}

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

function getAppUrl(
  request: Request
) {
  const configured =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (
    configured?.trim()
  ) {
    return configured
      .trim()
      .replace(
        /\/+$/,
        ""
      );
  }

  return new URL(
    request.url
  ).origin;
}

// ============================================================

function parseState(
  value: string
): LinkedInOAuthState | null {
  const attempts: string[] =
    [
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
    // Ignore decode failure.
  }

  for (
    const candidate of
    attempts
  ) {
    try {
      const parsed =
        JSON.parse(
          candidate
        ) as LinkedInOAuthState;

      if (
        parsed &&
        typeof parsed ===
          "object"
      ) {
        return parsed;
      }
    } catch {
      /*
       * Older OAuth code may have passed
       * the raw user UUID directly.
       */
    }
  }

  /*
   * Backwards compatibility with the old
   * state=user.id implementation.
   */

  const possibleUserId =
    cleanString(
      value
    );

  if (
    possibleUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      possibleUserId
    )
  ) {
    return {
      userId:
        possibleUserId,

      platform:
        "linkedin",
    };
  }

  return null;
}

// ============================================================

function buildSettingsUrl(
  request: Request,
  params: Record<
    string,
    string
  >
) {
  const appUrl =
    getAppUrl(
      request
    );

  const url =
    new URL(
      "/settings",
      appUrl
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

function failureRedirect(
  request: Request,
  reason: string
) {
  return NextResponse.redirect(
    buildSettingsUrl(
      request,
      {
        oauth:
          "linkedin_failed",

        reason:
          reason.slice(
            0,
            250
          ),
      }
    )
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: Request
) {
  const url =
    new URL(
      request.url
    );

  // ==========================================================
  // LINKEDIN RESPONSE
  // ==========================================================

  const code =
    url.searchParams.get(
      "code"
    );

  const state =
    url.searchParams.get(
      "state"
    );

  const oauthError =
    url.searchParams.get(
      "error"
    );

  const oauthErrorDescription =
    url.searchParams.get(
      "error_description"
    );

  // ==========================================================
  // LINKEDIN ERROR / CANCEL
  // ==========================================================

  if (
    oauthError
  ) {
    console.error(
      "[LINKEDIN OAUTH] LinkedIn returned an error:",
      {
        error:
          oauthError,

        description:
          oauthErrorDescription,
      }
    );

    return failureRedirect(
      request,
      oauthErrorDescription ||
        oauthError ||
        "LinkedIn connection failed."
    );
  }

  // ==========================================================
  // VALIDATE CALLBACK
  // ==========================================================

  if (
    !code ||
    !state
  ) {
    console.error(
      "[LINKEDIN OAUTH] Missing callback parameters:",
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

    return failureRedirect(
      request,
      "LinkedIn did not return the required OAuth code or state."
    );
  }

  // ==========================================================
  // PARSE STATE
  // ==========================================================

  const parsedState =
    parseState(
      state
    );

  if (
    !parsedState
  ) {
    console.error(
      "[LINKEDIN OAUTH] Invalid OAuth state."
    );

    return failureRedirect(
      request,
      "The LinkedIn connection request could not be verified."
    );
  }

  const userId =
    cleanString(
      parsedState.userId
    );

  if (
    !userId
  ) {
    return failureRedirect(
      request,
      "The signed-in TOTS-OS user could not be identified."
    );
  }

  const statePlatform =
    cleanString(
      parsedState.platform
    )?.toLowerCase();

  if (
    statePlatform &&
    statePlatform !==
      "linkedin"
  ) {
    return failureRedirect(
      request,
      "Invalid platform returned during LinkedIn authentication."
    );
  }

  // ==========================================================
  // STATE EXPIRY
  // ==========================================================

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

    const maximumAge =
      30 *
      60 *
      1000;

    if (
      age >
      maximumAge
    ) {
      return failureRedirect(
        request,
        "The LinkedIn connection request expired. Please connect again."
      );
    }

    if (
      age <
      -60_000
    ) {
      return failureRedirect(
        request,
        "The LinkedIn connection request could not be verified."
      );
    }
  }

  try {
    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const clientId =
      requireEnv(
        "LINKEDIN_CLIENT_ID"
      );

    const clientSecret =
      requireEnv(
        "LINKEDIN_CLIENT_SECRET"
      );

    const redirectUri =
      requireEnv(
        "LINKEDIN_REDIRECT_URI"
      );

    console.log(
      "[LINKEDIN OAUTH] Callback configuration:",
      {
        redirectUri,

        userId,

        /*
         * Never log clientSecret.
         */
        clientIdConfigured:
          Boolean(
            clientId
          ),
      }
    );

    // ========================================================
    // 1. VERIFY TOTS-OS USER
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
          userId
        );

    if (
      authUserError ||
      !authUserData.user
    ) {
      console.error(
        "[LINKEDIN OAUTH] Supabase user verification failed:",
        authUserError
      );

      throw new Error(
        "The signed-in TOTS-OS user could not be verified."
      );
    }

    // ========================================================
    // 2. EXCHANGE AUTHORIZATION CODE
    // ========================================================

    const tokenResponse =
      await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            Accept:
              "application/json",
          },

          body:
            new URLSearchParams({
              grant_type:
                "authorization_code",

              code,

              client_id:
                clientId,

              client_secret:
                clientSecret,

              /*
               * CRITICAL:
               *
               * This must be IDENTICAL to the redirect URI
               * configured in your LinkedIn Developer app.
               */
              redirect_uri:
                redirectUri,
            }),

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
      ) as LinkedInTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "[LINKEDIN OAUTH] Token exchange failed:",
        {
          status:
            tokenResponse.status,

          error:
            tokenData.error,

          description:
            tokenData.error_description,
        }
      );

      throw new Error(
        tokenData.error_description ||
          tokenData.error ||
          "LinkedIn token exchange failed."
      );
    }

    const accessToken =
      tokenData.access_token;

    // ========================================================
    // 3. EXPIRY
    // ========================================================

    const expiresIn =
      Number(
        tokenData.expires_in
      );

    const expiresAt =
      Number.isFinite(
        expiresIn
      ) &&
      expiresIn >
        0
        ? new Date(
            Date.now() +
              expiresIn *
                1000
          ).toISOString()
        : null;

    // ========================================================
    // 4. LOAD LINKEDIN PROFILE
    //
    // Share on LinkedIn / OIDC works with userinfo.
    // ========================================================

    const profileResponse =
      await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const profile =
      (
        await profileResponse
          .json()
          .catch(
            () =>
              ({})
          )
      ) as LinkedInUserInfoResponse;

    if (
      !profileResponse.ok ||
      !profile.sub
    ) {
      console.error(
        "[LINKEDIN OAUTH] Profile lookup failed:",
        {
          status:
            profileResponse.status,

          profile,
        }
      );

      throw new Error(
        "LinkedIn authenticated, but the profile could not be loaded."
      );
    }

    const linkedinUserId =
      profile.sub;

    const displayName =
      cleanString(
        profile.name
      ) ||
      [
        cleanString(
          profile.given_name
        ),
        cleanString(
          profile.family_name
        ),
      ]
        .filter(
          Boolean
        )
        .join(
          " "
        ) ||
      "LinkedIn";

    const avatarUrl =
      cleanString(
        profile.picture
      );

    // ========================================================
    // 5. FIND EXISTING LINKEDIN CONNECTION
    // ========================================================

    const {
      data:
        rawExistingRows,

      error:
        lookupError,
    } =
      await (
        supabaseAdmin as any
      )
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
          "platform",
          "linkedin"
        )
        .limit(
          1
        );

    if (
      lookupError
    ) {
      console.error(
        "[LINKEDIN OAUTH] Existing account lookup failed:",
        lookupError
      );

      throw new Error(
        `LinkedIn account lookup failed: ${lookupError.message}`
      );
    }

    const existingRows =
      (
        rawExistingRows ??
        []
      ) as ExistingAccountRow[];

    const existingAccount =
      existingRows[0] ??
      null;

    // ========================================================
    // 6. PAYLOAD
    // ========================================================

    const payload = {
      user_id:
        userId,

      platform:
        "linkedin",

      platform_user_id:
        linkedinUserId,

      display_name:
        displayName,

      avatar_url:
        avatarUrl,

      access_token:
        accessToken,

      refresh_token:
        tokenData.refresh_token ??
        null,

      expires_at:
        expiresAt,

      /*
       * These are Meta-specific fields and should be empty
       * for LinkedIn.
       */
      page_id:
        null,

      page_name:
        null,

      page_access_token:
        null,

      instagram_business_account_id:
        null,

      updated_at:
        new Date().toISOString(),
    };

    // ========================================================
    // 7. UPDATE / INSERT
    // ========================================================

    let savedAccount:
      SavedAccountRow;

    if (
      existingAccount?.id
    ) {
      const {
        data:
          rawUpdatedAccount,

        error:
          updateError,
      } =
        await (
          supabaseAdmin as any
        )
          .from(
            "social_accounts"
          )
          .update(
            payload
          )
          .eq(
            "id",
            existingAccount.id
          )
          .eq(
            "user_id",
            userId
          )
          .select(
            `
              id,
              user_id,
              platform,
              platform_user_id,
              display_name,
              avatar_url,
              expires_at
            `
          )
          .single();

      if (
        updateError ||
        !rawUpdatedAccount
      ) {
        console.error(
          "[LINKEDIN OAUTH] Update failed:",
          updateError
        );

        throw new Error(
          updateError?.message ||
            "LinkedIn connection could not be updated."
        );
      }

      savedAccount =
        rawUpdatedAccount as
          SavedAccountRow;
    } else {
      const {
        data:
          rawInsertedAccount,

        error:
          insertError,
      } =
        await (
          supabaseAdmin as any
        )
          .from(
            "social_accounts"
          )
          .insert(
            payload
          )
          .select(
            `
              id,
              user_id,
              platform,
              platform_user_id,
              display_name,
              avatar_url,
              expires_at
            `
          )
          .single();

      if (
        insertError ||
        !rawInsertedAccount
      ) {
        console.error(
          "[LINKEDIN OAUTH] Insert failed:",
          insertError
        );

        throw new Error(
          insertError?.message ||
            "LinkedIn connection could not be saved."
        );
      }

      savedAccount =
        rawInsertedAccount as
          SavedAccountRow;
    }

    // ========================================================
    // 8. SUCCESS LOG
    // ========================================================

    console.log(
      "[LINKEDIN OAUTH] ✅ LINKEDIN CONNECTED",
      {
        socialAccountId:
          savedAccount.id,

        userId,

        linkedinUserId:
          savedAccount
            .platform_user_id,

        displayName:
          savedAccount
            .display_name,

        expiresAt:
          savedAccount
            .expires_at,
      }
    );

    // ========================================================
    // 9. SUCCESS REDIRECT
    //
    // Matches your settings page:
    //
    // oauth === "linkedin_success"
    // ========================================================

    return NextResponse.redirect(
      buildSettingsUrl(
        request,
        {
          oauth:
            "linkedin_success",
        }
      )
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[LINKEDIN OAUTH] Callback failed:",
      error
    );

    return failureRedirect(
      request,
      error instanceof
        Error
        ? error.message
        : "LinkedIn connection failed."
    );
  }
}