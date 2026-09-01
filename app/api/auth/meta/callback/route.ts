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

const db =
  supabaseAdmin as any;

// ============================================================
// TYPES
// ============================================================

type MetaOAuthState = {
  userId?: string;
  organisationId?: string;
  platform?: string;
  createdAt?: number;
  pageId?: string;
};

type ExistingSocialAccountRow = {
  id: string;
  user_id: string;
  organisation_id:
    string | null;
  platform: string;
};

type SavedSocialAccountRow = {
  id: string;
  user_id: string;
  organisation_id:
    string | null;
  platform: string;
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
  access_token?: string;
  expires_in?: number;
  token_type?: string;

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type MetaUserResponse = {
  id?: string;
  name?: string;

  picture?: {
    data?: {
      url?: string;
    };
  };

  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaPage = {
  id?: string;
  name?: string;
  access_token?: string;

  picture?: {
    data?: {
      url?: string;
    };
  };
};

type MetaPagesResponse = {
  data?: MetaPage[];

  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaInstagramResponse = {
  instagram_business_account?: {
    id?: string;
    username?: string;
    profile_picture_url?: string;
  };

  connected_instagram_account?: {
    id?: string;
    username?: string;
    profile_picture_url?: string;
  };

  error?: {
    message?: string;
    type?: string;
    code?: number;
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
    process.env
      .NEXT_PUBLIC_APP_URL ||
    process.env
      .NEXT_PUBLIC_SITE_URL;

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

function normaliseName(
  value: unknown
) {
  const cleaned =
    cleanString(
      value
    );

  if (
    !cleaned
  ) {
    return "";
  }

  return cleaned
    .toLowerCase()
    .replace(
      /&/g,
      "and"
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
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
// META STATE
// ============================================================

function parseMetaState(
  state: string
): MetaOAuthState | null {
  const candidates =
    new Set<string>();

  candidates.add(
    state
  );

  try {
    candidates.add(
      decodeURIComponent(
        state
      )
    );
  } catch {
    // Ignore.
  }

  for (
    const candidate of
    candidates
  ) {
    try {
      const parsed =
        JSON.parse(
          candidate
        ) as MetaOAuthState;

      if (
        parsed &&
        typeof parsed ===
          "object"
      ) {
        return parsed;
      }
    } catch {
      // Not JSON.
    }
  }

  const possibleUserId =
    cleanString(
      state
    );

  if (
    possibleUserId
  ) {
    return {
      userId:
        possibleUserId,

      platform:
        "meta",
    };
  }

  return null;
}

// ============================================================
// GRAPH VERSION
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

  return "v25.0";
}

// ============================================================
// REDIRECT HELPERS
// ============================================================

function redirectSuccess(
  appUrl: string
) {
  return NextResponse.redirect(
    new URL(
      "/settings?oauth=meta_success",
      appUrl
    )
  );
}

// ============================================================

function redirectFailure(
  appUrl: string,
  reason: string
) {
  return NextResponse.redirect(
    new URL(
      `/settings?oauth=meta_failed&reason=${encodeURIComponent(
        reason
      )}`,
      appUrl
    )
  );
}

// ============================================================
// INSTAGRAM LOOKUP
// ============================================================

async function getInstagramAccount({
  graphVersion,
  pageId,
  pageAccessToken,
}: {
  graphVersion: string;
  pageId: string;
  pageAccessToken: string;
}) {
  const instagramUrl =
    new URL(
      `https://graph.facebook.com/${graphVersion}/${pageId}`
    );

  instagramUrl.search =
    new URLSearchParams({
      fields:
        [
          "instagram_business_account{id,username,profile_picture_url}",
          "connected_instagram_account{id,username,profile_picture_url}",
        ].join(
          ","
        ),

      access_token:
        pageAccessToken,
    }).toString();

  const response =
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

  const data =
    (
      await response
        .json()
        .catch(
          () =>
            ({})
        )
    ) as MetaInstagramResponse;

  if (
    !response.ok
  ) {
    console.warn(
      `[META OAUTH] Instagram discovery failed for Page ${pageId}:`,
      data
    );

    return null;
  }

  return (
    data
      .instagram_business_account ||
    data
      .connected_instagram_account ||
    null
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

  const graphVersion =
    getMetaGraphVersion();

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

  const metaErrorReason =
    url.searchParams.get(
      "error_reason"
    );

  const metaErrorDescription =
    url.searchParams.get(
      "error_description"
    );

  // ==========================================================
  // META ERROR
  // ==========================================================

  if (
    metaError
  ) {
    const reason =
      metaErrorDescription ||
      metaErrorReason ||
      metaError;

    console.error(
      "[META OAUTH] Meta returned an error:",
      {
        metaError,
        metaErrorReason,
        metaErrorDescription,
      }
    );

    return redirectFailure(
      appUrl,
      reason
    );
  }

  // ==========================================================
  // CALLBACK VALIDATION
  // ==========================================================

  if (
    !code ||
    !state
  ) {
    return redirectFailure(
      appUrl,
      "Meta OAuth returned missing parameters."
    );
  }

  const parsedState =
    parseMetaState(
      state
    );

  const userId =
    cleanString(
      parsedState?.userId
    );

  const organisationId =
    cleanString(
      parsedState
        ?.organisationId
    );

  if (
    !parsedState ||
    !userId
  ) {
    return redirectFailure(
      appUrl,
      "The Meta connection request could not be verified."
    );
  }

  if (
    !organisationId
  ) {
    return redirectFailure(
      appUrl,
      "The Meta connection did not include an organisation. Please return to Settings and connect Meta again."
    );
  }

  const statePlatform =
    cleanString(
      parsedState.platform
    )
      ?.toLowerCase() ||
    "meta";

  if (
    ![
      "meta",
      "facebook",
      "instagram",
    ].includes(
      statePlatform
    )
  ) {
    return redirectFailure(
      appUrl,
      "The Meta connection returned an invalid platform."
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

    const maxAge =
      30 *
      60 *
      1000;

    if (
      age >
      maxAge
    ) {
      return redirectFailure(
        appUrl,
        "The Meta connection request expired. Please connect again."
      );
    }

    if (
      age <
      -60_000
    ) {
      return redirectFailure(
        appUrl,
        "The Meta connection request could not be verified."
      );
    }
  }

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

    return redirectFailure(
      appUrl,
      "Meta OAuth is not configured correctly."
    );
  }

  try {
    // ========================================================
    // 1. VERIFY USER
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
      throw new Error(
        "The signed-in TOTS-OS user could not be verified."
      );
    }

    // ========================================================
    // 2. VERIFY MEMBERSHIP
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
          userId
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (
      membershipError
    ) {
      throw new Error(
        `TOTS-OS could not verify your organisation access: ${membershipError.message}`
      );
    }

    if (
      !membership
    ) {
      throw new Error(
        "You do not have access to the organisation that requested this Meta connection."
      );
    }

    // ========================================================
    // 3. LOAD CURRENT ORGANISATION
    //
    // This is the important new part.
    //
    // We use the CURRENT workspace name to select the matching
    // Facebook Page rather than choosing the first Page Meta
    // happens to return.
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await db
        .from(
          "organisations"
        )
        .select(
          "id,name"
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.error(
        "[META OAUTH] Organisation lookup failed:",
        organisationError
      );

      throw new Error(
        `TOTS-OS could not load the current organisation: ${organisationError.message}`
      );
    }

    const organisationName =
      cleanString(
        organisation?.name
      );

    console.log(
      "[META OAUTH] Current organisation:",
      {
        organisationId,
        organisationName,
      }
    );

    // ========================================================
    // 4. SHORT TOKEN
    // ========================================================

    const tokenUrl =
      new URL(
        `https://graph.facebook.com/${graphVersion}/oauth/access_token`
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
      throw new Error(
        tokenData.error
          ?.message ||
        "Facebook did not return an access token."
      );
    }

    const shortLivedToken =
      tokenData.access_token;

    // ========================================================
    // 5. LONG TOKEN
    // ========================================================

    const longTokenUrl =
      new URL(
        `https://graph.facebook.com/${graphVersion}/oauth/access_token`
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

    const expiresAt =
      tokenExpiresIn
        ? new Date(
            Date.now() +
            tokenExpiresIn *
              1000
          ).toISOString()
        : null;

    // ========================================================
    // 6. FACEBOOK USER
    // ========================================================

    const meUrl =
      new URL(
        `https://graph.facebook.com/${graphVersion}/me`
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
        `https://graph.facebook.com/${graphVersion}/me/accounts`
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
      "[META OAUTH] Facebook Pages:",
      pages.map(
        (
          page
        ) => ({
          id:
            page.id,

          name:
            page.name,
        })
      )
    );

    if (
      pages.length ===
      0
    ) {
      throw new Error(
        "Meta connected, but no Facebook Pages were returned."
      );
    }

    // ========================================================
    // 8. SELECT FACEBOOK PAGE
    // ========================================================

    const requestedPageId =
      cleanString(
        parsedState.pageId
      );

    let selectedPage:
      MetaPage | null =
      null;

    // --------------------------------------------------------
    // A. EXPLICIT PAGE ID
    // --------------------------------------------------------

    if (
      requestedPageId
    ) {
      selectedPage =
        pages.find(
          (
            page
          ) =>
            cleanString(
              page.id
            ) ===
            requestedPageId
        ) ??
        null;

      if (
        !selectedPage
      ) {
        throw new Error(
          "The selected Facebook Page is no longer available."
        );
      }
    }

    // --------------------------------------------------------
    // B. MATCH CURRENT ORGANISATION NAME
    // --------------------------------------------------------

    if (
      !selectedPage &&
      organisationName
    ) {
      const targetName =
        normaliseName(
          organisationName
        );

      const exactMatches =
        pages.filter(
          (
            page
          ) =>
            normaliseName(
              page.name
            ) ===
            targetName
        );

      if (
        exactMatches.length ===
        1
      ) {
        selectedPage =
          exactMatches[0];

        console.log(
          "[META OAUTH] Facebook Page matched current organisation:",
          {
            organisationName,
            pageId:
              selectedPage.id,
            pageName:
              selectedPage.name,
          }
        );
      }
    }

    // --------------------------------------------------------
    // C. ONLY ONE PAGE
    // --------------------------------------------------------

    if (
      !selectedPage &&
      pages.length ===
        1
    ) {
      selectedPage =
        pages[0];
    }

    // --------------------------------------------------------
    // D. MULTIPLE PAGES + NO SAFE MATCH
    //
    // DO NOT silently pick the first page.
    // --------------------------------------------------------

    if (
      !selectedPage
    ) {
      const availableNames =
        pages
          .map(
            (
              page
            ) =>
              cleanString(
                page.name
              )
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          )
          .join(
            ", "
          );

      console.error(
        "[META OAUTH] Could not safely select Facebook Page.",
        {
          organisationId,
          organisationName,
          availablePages:
            pages.map(
              (
                page
              ) => ({
                id:
                  page.id,

                name:
                  page.name,
              })
            ),
        }
      );

      throw new Error(
        organisationName
          ? `TOTS-OS found multiple Facebook Pages but none matched "${organisationName}". Available Pages: ${availableNames}.`
          : `TOTS-OS found multiple Facebook Pages and could not safely decide which belongs to this workspace. Available Pages: ${availableNames}.`
      );
    }

    // ========================================================
    // 9. VALIDATE SELECTED PAGE
    // ========================================================

    const pageId =
      cleanString(
        selectedPage.id
      );

    const pageName =
      cleanString(
        selectedPage.name
      );

    const pageAccessToken =
      cleanString(
        selectedPage
          .access_token
      );

    const pageAvatarUrl =
      cleanString(
        selectedPage
          .picture
          ?.data
          ?.url
      );

    if (
      !pageId ||
      !pageAccessToken
    ) {
      throw new Error(
        "The selected Facebook Page did not provide the credentials TOTS-OS needs."
      );
    }

    console.log(
      "[META OAUTH] Selected Facebook Page:",
      {
        organisationId,
        organisationName,
        pageId,
        pageName,
      }
    );

    // ========================================================
    // 10. INSTAGRAM FOR SELECTED PAGE ONLY
    //
    // CRITICAL:
    // We no longer loop through every Page looking for the
    // first Instagram connection.
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

    try {
      const instagramAccount =
        await getInstagramAccount({
          graphVersion,
          pageId,
          pageAccessToken,
        });

      instagramBusinessAccountId =
        cleanString(
          instagramAccount?.id
        );

      instagramUsername =
        cleanString(
          instagramAccount
            ?.username
        );

      instagramAvatarUrl =
        cleanString(
          instagramAccount
            ?.profile_picture_url
        );
    } catch (
      error
    ) {
      console.warn(
        "[META OAUTH] Instagram lookup failed:",
        error
      );
    }

    console.log(
      "[META OAUTH] Selected Meta assets:",
      {
        organisationId,
        organisationName,
        pageId,
        pageName,
        instagramBusinessAccountId,
        instagramUsername,
      }
    );

    // ========================================================
    // 11. DISPLAY DATA
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
    // 12. EXISTING META CONNECTION
    // ========================================================

    const {
      data:
        rawExistingRows,

      error:
        existingLookupError,
    } =
      await db
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            user_id,
            organisation_id,
            platform
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
      throw new Error(
        `Social account lookup failed: ${existingLookupError.message}`
      );
    }

    const existingRows =
      (
        rawExistingRows ??
        []
      ) as
        ExistingSocialAccountRow[];

    const existingAccount =
      existingRows[0] ??
      null;

    // ========================================================
    // 13. PAYLOAD
    // ========================================================

    const socialAccountPayload:
      Record<
        string,
        unknown
      > = {
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
    // 14. SAVE
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
        await db
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
          .eq(
            "organisation_id",
            organisationId
          )
          .eq(
            "platform",
            "meta"
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

      savedConnectionId =
        (
          rawUpdatedAccount as
            SavedSocialAccountRow
        ).id;
    } else {
      const {
        data:
          rawInsertedAccount,

        error:
          insertError,
      } =
        await db
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

      savedConnectionId =
        (
          rawInsertedAccount as
            SavedSocialAccountRow
        ).id;
    }

    // ========================================================
    // 15. VERIFY
    // ========================================================

    const {
      data:
        rawVerifiedConnection,

      error:
        verificationError,
    } =
      await db
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
          "organisation_id",
          organisationId
        )
        .eq(
          "platform",
          "meta"
        )
        .maybeSingle();

    if (
      verificationError
    ) {
      throw new Error(
        "Meta authenticated successfully, but TOTS-OS could not verify the saved connection."
      );
    }

    if (
      !rawVerifiedConnection
    ) {
      throw new Error(
        "Meta authenticated successfully, but no saved connection could be found for this organisation."
      );
    }

    const verifiedConnection =
      rawVerifiedConnection as
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
    // SUCCESS
    // ========================================================

    console.log(
      "[META OAUTH] ✅ META CONNECTED SUCCESSFULLY",
      {
        connectionId:
          verifiedConnection.id,

        organisationId:
          verifiedConnection.organisation_id,

        organisationName,

        pageId:
          verifiedConnection.page_id,

        pageName:
          verifiedConnection.page_name,

        instagramBusinessAccountId:
          verifiedConnection.instagram_business_account_id,

        graphVersion,
      }
    );

    return redirectSuccess(
      appUrl
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

    return redirectFailure(
      appUrl,
      message
    );
  }
}