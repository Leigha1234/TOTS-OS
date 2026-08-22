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
// TYPES
// ============================================================

type OrganisationMembershipRow = {
  organisation_id:
    string | null;
};

type ExistingSocialAccountRow = {
  id:
    string;

  user_id:
    string;

  platform:
    string;
};

type SavedSocialAccountRow = {
  id:
    string;

  user_id:
    string;

  organisation_id:
    string | null;

  platform:
    string;

  platform_user_id:
    string | null;

  display_name:
    string | null;

  avatar_url:
    string | null;

  page_id:
    string | null;

  page_name:
    string | null;

  instagram_business_account_id:
    string | null;

  expires_at:
    string | null;
};

type VerifiedSocialAccountRow =
  SavedSocialAccountRow & {
    access_token:
      string | null;

    page_access_token:
      string | null;

    updated_at:
      string | null;
  };

type MetaTokenResponse = {
  access_token?:
    string;

  expires_in?:
    number;

  token_type?:
    string;

  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;

    error_subcode?:
      number;
  };
};

type MetaUserResponse = {
  id?:
    string;

  name?:
    string;

  picture?: {
    data?: {
      url?:
        string;
    };
  };

  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;
  };
};

type MetaPage = {
  id?:
    string;

  name?:
    string;

  access_token?:
    string;

  picture?: {
    data?: {
      url?:
        string;
    };
  };
};

type MetaPagesResponse = {
  data?:
    MetaPage[];

  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;
  };
};

type MetaInstagramResponse = {
  instagram_business_account?: {
    id?:
      string;

    username?:
      string;

    profile_picture_url?:
      string;
  };

  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;
  };
};

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
        /\/+$/,
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

function getErrorMessage(
  value: unknown,
  fallback: string
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return fallback;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const error =
    record.error;

  if (
    error &&
    typeof error ===
      "object"
  ) {
    const errorRecord =
      error as Record<
        string,
        unknown
      >;

    const message =
      cleanString(
        errorRecord.message
      );

    if (
      message
    ) {
      return message;
    }
  }

  const directMessage =
    cleanString(
      record.message
    );

  return (
    directMessage ||
    fallback
  );
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
    // ========================================================

    let organisationId:
      string | null =
      null;

    const {
      data:
        rawMembershipRows,

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
      /*
       * Supabase's generated database types can infer `never`
       * here if user_organisations is not present in the
       * generated Database type.
       *
       * Explicitly type the returned row shape.
       */

      const membershipRows =
        (
          rawMembershipRows ??
          []
        ) as unknown as
          OrganisationMembershipRow[];

      const membership =
        membershipRows[0] ??
        null;

      organisationId =
        cleanString(
          membership
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
      (
        await tokenRes
          .json()
          .catch(
            () =>
              ({})
          )
      ) as MetaTokenResponse;

    if (
      !tokenRes.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "[META OAUTH] Short-lived token exchange failed:",
        tokenData
      );

      throw new Error(
        tokenData.error
          ?.message ||
        "Facebook did not return an access token."
      );
    }

    const shortLivedToken =
      tokenData.access_token;

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
      (
        await longTokenRes
          .json()
          .catch(
            () =>
              ({})
          )
      ) as MetaTokenResponse;

    let accessToken =
      shortLivedToken;

    let tokenExpiresIn:
      number | null =
      null;

    if (
      longTokenRes.ok &&
      longTokenData.access_token
    ) {
      accessToken =
        longTokenData.access_token;

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
      (
        await meRes
          .json()
          .catch(
            () =>
              ({})
          )
      ) as MetaUserResponse;

    if (
      !meRes.ok ||
      !me.id
    ) {
      console.error(
        "[META OAUTH] Facebook user lookup failed:",
        me
      );

      throw new Error(
        me.error
          ?.message ||
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
        me.picture
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
      (
        await pagesRes
          .json()
          .catch(
            () =>
              ({})
          )
      ) as MetaPagesResponse;

    if (
      !pagesRes.ok
    ) {
      console.error(
        "[META OAUTH] Facebook Pages request failed:",
        pagesData
      );

      throw new Error(
        pagesData.error
          ?.message ||
        "Your Facebook Pages could not be loaded."
      );
    }

    const pages:
      MetaPage[] =
      Array.isArray(
        pagesData.data
      )
        ? pagesData.data
        : [];

    console.log(
      `[META OAUTH] Facebook returned ${pages.length} Page(s).`
    );

    // ========================================================
    // 8. SELECT PAGE
    // ========================================================

    const page:
      MetaPage | null =
      pages[0] ??
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
        (
          await igRes
            .json()
            .catch(
              () =>
                ({})
            )
        ) as MetaInstagramResponse;

      if (
        igRes.ok
      ) {
        instagramBusinessAccountId =
          cleanString(
            igData
              .instagram_business_account
              ?.id
          );

        instagramUsername =
          cleanString(
            igData
              .instagram_business_account
              ?.username
          );

        instagramAvatarUrl =
          cleanString(
            igData
              .instagram_business_account
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
        rawExistingRows,

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

    const existingRows =
      (
        rawExistingRows ??
        []
      ) as unknown as
        ExistingSocialAccountRow[];

    const existingAccount =
      existingRows[0] ??
      null;

    // ========================================================
    // 12. SOCIAL ACCOUNT PAYLOAD
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
          rawUpdatedAccount,

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
        !rawUpdatedAccount
      ) {
        throw new Error(
          "Meta connection update returned no record."
        );
      }

      const updatedAccount =
        rawUpdatedAccount as unknown as
          SavedSocialAccountRow;

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
          rawInsertedAccount,

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

      if (
        !rawInsertedAccount
      ) {
        throw new Error(
          "Meta connection insert returned no record."
        );
      }

      const insertedAccount =
        rawInsertedAccount as unknown as
          SavedSocialAccountRow;

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
    // ========================================================

    const {
      data:
        rawVerifiedConnection,

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
      !rawVerifiedConnection
    ) {
      throw new Error(
        "Meta authenticated successfully, but no saved connection could be found."
      );
    }

    const verifiedConnection =
      rawVerifiedConnection as unknown as
        VerifiedSocialAccountRow;

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
        : getErrorMessage(
            error,
            "Meta connection failed."
          );

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