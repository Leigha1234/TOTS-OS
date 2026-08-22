import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnv(
  name: string
) {
  const value =
    process.env[name];

  if (
    !value ||
    !value.trim()
  ) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value.trim();
}

// ============================================================
// HELPERS
// ============================================================

function getAppUrl(
  req: Request
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
        /\/$/,
        ""
      );
  }

  return new URL(
    req.url
  ).origin;
}

// ============================================================

function cleanString(
  value: unknown
) {
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
// GET
// ============================================================

export async function GET(
  req: Request
) {
  const url =
    new URL(
      req.url
    );

  const appUrl =
    getAppUrl(
      req
    );

  // ==========================================================
  // QUERY PARAMS
  // ==========================================================

  const code =
    url.searchParams.get(
      "code"
    );

  const state =
    url.searchParams.get(
      "state"
    );

  const metaError =
    url.searchParams.get(
      "error"
    );

  const metaErrorDescription =
    url.searchParams.get(
      "error_description"
    );

  // ==========================================================
  // USER CANCELLED / META ERROR
  // ==========================================================

  if (
    metaError
  ) {
    console.error(
      "[META OAUTH] Meta returned an error:",
      {
        error:
          metaError,

        description:
          metaErrorDescription,
      }
    );

    const reason =
      metaErrorDescription ||
      metaError;

    return NextResponse.redirect(
      new URL(
        `/settings?oauth=meta_failed&reason=${encodeURIComponent(
          reason
        )}`,
        appUrl
      )
    );
  }

  // ==========================================================
  // VALIDATE CALLBACK PARAMS
  // ==========================================================

  if (
    !code ||
    !state
  ) {
    console.error(
      "[META OAUTH] Missing code or state.",
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

    return NextResponse.redirect(
      new URL(
        "/settings?oauth=meta_failed&reason=Meta%20OAuth%20returned%20missing%20parameters",
        appUrl
      )
    );
  }

  /*
   * CURRENT IMPLEMENTATION:
   *
   * state contains the signed-in Supabase user UUID.
   *
   * This works with your current start route.
   *
   * A stronger production setup would replace this later with
   * a cryptographically random/signed state token mapped to the
   * user server-side.
   */

  const userId =
    state.trim();

  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  let clientId:
    string;

  let clientSecret:
    string;

  let redirectUri:
    string;

  try {
    clientId =
      requireEnv(
        "META_CLIENT_ID"
      );

    clientSecret =
      requireEnv(
        "META_CLIENT_SECRET"
      );

    redirectUri =
      requireEnv(
        "META_REDIRECT_URI"
      );
  } catch (
    error
  ) {
    console.error(
      "[META OAUTH] Environment configuration error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/settings?oauth=meta_failed&reason=Meta%20OAuth%20is%20not%20configured%20correctly",
        appUrl
      )
    );
  }

  try {
    // ========================================================
    // 1. VERIFY SUPABASE USER
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
        "[META OAUTH] Invalid Supabase user from OAuth state:",
        authUserError
      );

      throw new Error(
        "The signed-in TOTS-OS user could not be verified."
      );
    }

    // ========================================================
    // 2. RESOLVE ORGANISATION
    //
    // social_accounts contains organisation_id, so store it
    // when possible.
    // ========================================================

    let organisationId:
      string | null =
      null;

    const {
      data:
        membershipRows,

      error:
        membershipError,
    } =
      await supabaseAdmin
        .from(
          "user_organisations"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          userId
        )
        .limit(
          1
        );

    if (
      membershipError
    ) {
      console.warn(
        "[META OAUTH] Organisation membership lookup failed:",
        membershipError
      );
    } else {
      organisationId =
        cleanString(
          membershipRows?.[0]
            ?.organisation_id
        );
    }

    // ========================================================
    // 3. EXCHANGE CODE FOR SHORT-LIVED USER ACCESS TOKEN
    // ========================================================

    const tokenUrl =
      new URL(
        "https://graph.facebook.com/v23.0/oauth/access_token"
      );

    tokenUrl.search =
      new URLSearchParams({
        client_id:
          clientId,

        client_secret:
          clientSecret,

        redirect_uri:
          redirectUri,

        code,
      }).toString();

    const tokenRes =
      await fetch(
        tokenUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const tokenData =
      await tokenRes
        .json()
        .catch(
          () =>
            null
        );

    if (
      !tokenRes.ok ||
      !tokenData?.access_token
    ) {
      console.error(
        "[META OAUTH] Short-lived token exchange failed:",
        tokenData
      );

      throw new Error(
        tokenData?.error?.message ||
        "Facebook did not return an access token."
      );
    }

    const shortLivedToken =
      String(
        tokenData.access_token
      );

    // ========================================================
    // 4. EXCHANGE FOR LONG-LIVED USER TOKEN
    // ========================================================

    const longTokenUrl =
      new URL(
        "https://graph.facebook.com/v23.0/oauth/access_token"
      );

    longTokenUrl.search =
      new URLSearchParams({
        grant_type:
          "fb_exchange_token",

        client_id:
          clientId,

        client_secret:
          clientSecret,

        fb_exchange_token:
          shortLivedToken,
      }).toString();

    const longTokenRes =
      await fetch(
        longTokenUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const longTokenData =
      await longTokenRes
        .json()
        .catch(
          () =>
            null
        );

    let accessToken =
      shortLivedToken;

    let tokenExpiresIn:
      number | null =
      null;

    if (
      longTokenRes.ok &&
      longTokenData?.access_token
    ) {
      accessToken =
        String(
          longTokenData.access_token
        );

      const parsedExpiresIn =
        Number(
          longTokenData.expires_in
        );

      if (
        Number.isFinite(
          parsedExpiresIn
        ) &&
        parsedExpiresIn >
          0
      ) {
        tokenExpiresIn =
          parsedExpiresIn;
      }
    } else {
      console.warn(
        "[META OAUTH] Long-lived token exchange failed. Falling back to short-lived token:",
        longTokenData
      );

      const parsedExpiresIn =
        Number(
          tokenData.expires_in
        );

      if (
        Number.isFinite(
          parsedExpiresIn
        ) &&
        parsedExpiresIn >
          0
      ) {
        tokenExpiresIn =
          parsedExpiresIn;
      }
    }

    // ========================================================
    // 5. TOKEN EXPIRY
    // ========================================================

    const expiresAt =
      tokenExpiresIn
        ? new Date(
            Date.now() +
            tokenExpiresIn *
              1000
          ).toISOString()
        : null;

    // ========================================================
    // 6. GET FACEBOOK USER
    // ========================================================

    const meUrl =
      new URL(
        "https://graph.facebook.com/v23.0/me"
      );

    meUrl.search =
      new URLSearchParams({
        fields:
          "id,name,picture",

        access_token:
          accessToken,
      }).toString();

    const meRes =
      await fetch(
        meUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const me =
      await meRes
        .json()
        .catch(
          () =>
            null
        );

    if (
      !meRes.ok ||
      !me?.id
    ) {
      console.error(
        "[META OAUTH] Facebook user lookup failed:",
        me
      );

      throw new Error(
        me?.error?.message ||
        "Facebook account details could not be loaded."
      );
    }

    const facebookUserId =
      String(
        me.id
      );

    const facebookDisplayName =
      cleanString(
        me.name
      );

    const facebookAvatarUrl =
      cleanString(
        me?.picture
          ?.data
          ?.url
      );

    // ========================================================
    // 7. LOAD FACEBOOK PAGES
    // ========================================================

    const pagesUrl =
      new URL(
        "https://graph.facebook.com/v23.0/me/accounts"
      );

    pagesUrl.search =
      new URLSearchParams({
        fields:
          "id,name,access_token,picture",

        access_token:
          accessToken,
      }).toString();

    const pagesRes =
      await fetch(
        pagesUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const pagesData =
      await pagesRes
        .json()
        .catch(
          () =>
            null
        );

    if (
      !pagesRes.ok
    ) {
      console.error(
        "[META OAUTH] Facebook Pages request failed:",
        pagesData
      );

      throw new Error(
        pagesData?.error?.message ||
        "Your Facebook Pages could not be loaded."
      );
    }

    const pages =
      Array.isArray(
        pagesData?.data
      )
        ? pagesData.data
        : [];

    console.log(
      `[META OAUTH] Facebook returned ${pages.length} Page(s).`
    );

    // ========================================================
    // 8. SELECT PAGE
    //
    // Current behaviour:
    // use the first available Page.
    //
    // Later this can become a proper Page selection screen.
    // ========================================================

    const page =
      pages[0] ||
      null;

    const pageId =
      cleanString(
        page?.id
      );

    const pageName =
      cleanString(
        page?.name
      );

    const pageAccessToken =
      cleanString(
        page?.access_token
      );

    const pageAvatarUrl =
      cleanString(
        page?.picture
          ?.data
          ?.url
      );

    // ========================================================
    // 9. GET LINKED INSTAGRAM BUSINESS ACCOUNT
    // ========================================================

    let instagramBusinessAccountId:
      string | null =
      null;

    let instagramUsername:
      string | null =
      null;

    let instagramAvatarUrl:
      string | null =
      null;

    if (
      pageId &&
      pageAccessToken
    ) {
      const instagramUrl =
        new URL(
          `https://graph.facebook.com/v23.0/${pageId}`
        );

      instagramUrl.search =
        new URLSearchParams({
          fields:
            "instagram_business_account{id,username,profile_picture_url}",

          access_token:
            pageAccessToken,
        }).toString();

      const igRes =
        await fetch(
          instagramUrl,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",
            },

            cache:
              "no-store",
          }
        );

      const igData =
        await igRes
          .json()
          .catch(
            () =>
              null
          );

      if (
        igRes.ok
      ) {
        instagramBusinessAccountId =
          cleanString(
            igData
              ?.instagram_business_account
              ?.id
          );

        instagramUsername =
          cleanString(
            igData
              ?.instagram_business_account
              ?.username
          );

        instagramAvatarUrl =
          cleanString(
            igData
              ?.instagram_business_account
              ?.profile_picture_url
          );

        console.log(
          "[META OAUTH] Instagram account lookup:",
          {
            instagramBusinessAccountId,

            instagramUsername,
          }
        );
      } else {
        /*
         * Facebook remains a valid Meta connection even when
         * there is no linked Instagram Business account.
         */

        console.warn(
          "[META OAUTH] Instagram business account lookup failed:",
          igData
        );
      }
    }

    // ========================================================
    // 10. CHOOSE DISPLAY DATA
    // ========================================================

    const displayName =
      pageName ||
      instagramUsername ||
      facebookDisplayName ||
      "Meta";

    const avatarUrl =
      pageAvatarUrl ||
      instagramAvatarUrl ||
      facebookAvatarUrl ||
      null;

    // ========================================================
    // 11. FIND EXISTING META ROW
    // ========================================================

    const {
      data:
        existingRows,

      error:
        existingLookupError,
    } =
      await supabaseAdmin
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            user_id,
            platform
          `
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "platform",
          "meta"
        )
        .order(
          "updated_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          1
        );

    if (
      existingLookupError
    ) {
      console.error(
        "[META OAUTH] Existing social account lookup failed:",
        existingLookupError
      );

      throw new Error(
        `Social account lookup failed: ${existingLookupError.message}`
      );
    }

    const existingAccount =
      existingRows?.[0] ||
      null;

    // ========================================================
    // 12. SOCIAL ACCOUNT PAYLOAD
    //
    // These fields match your actual social_accounts schema.
    // ========================================================

    const socialAccountPayload = {
      user_id:
        userId,

      organisation_id:
        organisationId,

      platform:
        "meta",

      platform_user_id:
        facebookUserId,

      display_name:
        displayName,

      avatar_url:
        avatarUrl,

      access_token:
        accessToken,

      /*
       * Meta does not use a conventional OAuth refresh token
       * here.
       */
      refresh_token:
        null,

      page_id:
        pageId,

      page_name:
        pageName,

      page_access_token:
        pageAccessToken,

      instagram_business_account_id:
        instagramBusinessAccountId,

      expires_at:
        expiresAt,

      updated_at:
        new Date().toISOString(),
    };

    // ========================================================
    // 13. UPDATE OR INSERT
    // ========================================================

    let savedConnectionId:
      string;

    if (
      existingAccount?.id
    ) {
      const {
        data:
          updatedAccount,

        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "social_accounts"
          )
          .update(
            socialAccountPayload
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
              organisation_id,
              platform,
              platform_user_id,
              display_name,
              avatar_url,
              page_id,
              page_name,
              instagram_business_account_id,
              expires_at
            `
          )
          .maybeSingle();

      if (
        updateError
      ) {
        console.error(
          "[META OAUTH] Meta account UPDATE failed:",
          updateError
        );

        throw new Error(
          `Meta connection could not be saved: ${updateError.message}`
        );
      }

      if (
        !updatedAccount
      ) {
        throw new Error(
          "Meta connection update returned no record."
        );
      }

      savedConnectionId =
        updatedAccount.id;

      console.log(
        "[META OAUTH] Existing Meta connection updated:",
        {
          socialAccountId:
            updatedAccount.id,

          userId,

          organisationId,

          facebookUserId,

          displayName,

          pageId,

          pageName,

          instagramBusinessAccountId,

          expiresAt,
        }
      );
    } else {
      const {
        data:
          insertedAccount,

        error:
          insertError,
      } =
        await supabaseAdmin
          .from(
            "social_accounts"
          )
          .insert(
            socialAccountPayload
          )
          .select(
            `
              id,
              user_id,
              organisation_id,
              platform,
              platform_user_id,
              display_name,
              avatar_url,
              page_id,
              page_name,
              instagram_business_account_id,
              expires_at
            `
          )
          .single();

      if (
        insertError
      ) {
        console.error(
          "[META OAUTH] Meta account INSERT failed:",
          insertError
        );

        throw new Error(
          `Meta connection could not be saved: ${insertError.message}`
        );
      }

      savedConnectionId =
        insertedAccount.id;

      console.log(
        "[META OAUTH] New Meta connection created:",
        {
          socialAccountId:
            insertedAccount.id,

          userId,

          organisationId,

          facebookUserId,

          displayName,

          pageId,

          pageName,

          instagramBusinessAccountId,

          expiresAt,
        }
      );
    }

    // ========================================================
    // 14. FINAL DATABASE VERIFICATION
    //
    // Do not redirect with success until the exact saved row
    // can be read back.
    // ========================================================

    const {
      data:
        verifiedConnection,

      error:
        verificationError,
    } =
      await supabaseAdmin
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            user_id,
            organisation_id,
            platform,
            platform_user_id,
            display_name,
            avatar_url,
            access_token,
            page_id,
            page_name,
            page_access_token,
            instagram_business_account_id,
            expires_at,
            updated_at
          `
        )
        .eq(
          "id",
          savedConnectionId
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "platform",
          "meta"
        )
        .maybeSingle();

    if (
      verificationError
    ) {
      console.error(
        "[META OAUTH] Final Meta connection verification query failed:",
        verificationError
      );

      throw new Error(
        "Meta authenticated successfully, but TOTS-OS could not verify the saved connection."
      );
    }

    if (
      !verifiedConnection
    ) {
      throw new Error(
        "Meta authenticated successfully, but no saved connection could be found."
      );
    }

    if (
      !verifiedConnection
        .access_token
    ) {
      throw new Error(
        "The Meta connection was saved without an access token."
      );
    }

    // ========================================================
    // 15. SUCCESS LOG
    // ========================================================

    console.log(
      "[META OAUTH] ✅ META CONNECTED SUCCESSFULLY",
      {
        connectionId:
          verifiedConnection.id,

        userId:
          verifiedConnection.user_id,

        organisationId:
          verifiedConnection.organisation_id,

        facebookUserId:
          verifiedConnection.platform_user_id,

        displayName:
          verifiedConnection.display_name,

        pageId:
          verifiedConnection.page_id,

        pageName:
          verifiedConnection.page_name,

        hasPageAccessToken:
          Boolean(
            verifiedConnection.page_access_token
          ),

        instagramBusinessAccountId:
          verifiedConnection.instagram_business_account_id,

        expiresAt:
          verifiedConnection.expires_at,
      }
    );

    // ========================================================
    // 16. SUCCESS REDIRECT
    //
    // IMPORTANT:
    //
    // Your Settings page listens for:
    //
    // ?oauth=meta_success
    //
    // NOT ?connected=meta
    // ========================================================

    return NextResponse.redirect(
      new URL(
        "/settings?oauth=meta_success",
        appUrl
      )
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "[META OAUTH] Callback failed:",
      error
    );

    const message =
      error instanceof
        Error
        ? error.message
        : "Meta connection failed.";

    // ========================================================
    // ERROR REDIRECT
    // ========================================================

    return NextResponse.redirect(
      new URL(
        `/settings?oauth=meta_failed&reason=${encodeURIComponent(
          message
        )}`,
        appUrl
      )
    );
  }
}