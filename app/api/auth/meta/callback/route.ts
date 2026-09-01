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
// UNTYPED ADMIN DATABASE CLIENT
//
// Your generated Supabase Database types are currently stale
// for tables such as:
//
// - social_accounts
// - user_organisations
//
// That causes Supabase's insert/update payload type to become
// `never` during `next build`.
//
// Authentication remains strongly available on supabaseAdmin,
// but database calls in this route use this alias until your
// generated Supabase types are regenerated.
// ============================================================

const db =
  supabaseAdmin as any;

// ============================================================
// TYPES
// ============================================================

type MetaOAuthState = {
  userId?:
    string;

  organisationId?:
    string;

  platform?:
    string;

  createdAt?:
    number;

  /*
   * Optional future support for explicitly selecting
   * a Facebook Page before completing the connection.
   */
  pageId?:
    string;
};

type ExistingSocialAccountRow = {
  id:
    string;

  user_id:
    string;

  organisation_id:
    string | null;

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

  connected_instagram_account?: {
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
// META STATE
//
// Current Meta OAuth should send:
//
// {
//   userId: "...",
//   organisationId: "...",
//   platform: "meta",
//   createdAt: Date.now()
// }
//
// We still parse older raw-user-id state so we can return a
// useful error instead of crashing, but organisationId is now
// REQUIRED before a connection can be saved.
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
    // Ignore decode failure.
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
      // Candidate was not JSON.
    }
  }

  /*
   * Backwards compatibility only.
   *
   * Older versions used the raw Supabase user UUID as state.
   *
   * This can no longer complete successfully because we now
   * require organisationId to prevent cross-business accounts
   * from overwriting each other.
   */

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

  const metaErrorReason =
    url.searchParams.get(
      "error_reason"
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

        reason:
          metaErrorReason,

        description:
          metaErrorDescription,
      }
    );

    const reason =
      metaErrorDescription ||
      metaErrorReason ||
      metaError;

    return redirectFailure(
      appUrl,
      reason
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

    return redirectFailure(
      appUrl,
      "Meta OAuth returned missing parameters."
    );
  }

  // ==========================================================
  // PARSE STATE
  // ==========================================================

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
    console.error(
      "[META OAUTH] Could not parse OAuth state:",
      state
    );

    return redirectFailure(
      appUrl,
      "The Meta connection request could not be verified."
    );
  }

  // ==========================================================
  // ORGANISATION IS NOW REQUIRED
  // ==========================================================

  if (
    !organisationId
  ) {
    console.error(
      "[META OAUTH] OAuth state is missing organisationId.",
      {
        userId,
        parsedState,
      }
    );

    return redirectFailure(
      appUrl,
      "The Meta connection did not include an organisation. Please return to Settings and connect Meta again."
    );
  }

  // ==========================================================
  // PLATFORM CHECK
  // ==========================================================

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
    console.error(
      "[META OAUTH] Invalid platform in OAuth state:",
      statePlatform
    );

    return redirectFailure(
      appUrl,
      "The Meta connection returned an invalid platform."
    );
  }

  // ==========================================================
  // OPTIONAL STATE EXPIRY
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
    // 2. VERIFY ORGANISATION MEMBERSHIP
    //
    // IMPORTANT:
    // We DO NOT pick the first organisation the user belongs to.
    //
    // The organisation that initiated OAuth MUST come through
    // state, and we verify the user belongs to it.
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
      console.error(
        "[META OAUTH] Organisation membership verification failed:",
        membershipError
      );

      throw new Error(
        `TOTS-OS could not verify your organisation access: ${membershipError.message}`
      );
    }

    if (
      !membership
    ) {
      console.error(
        "[META OAUTH] User does not belong to requested organisation:",
        {
          userId,
          organisationId,
        }
      );

      throw new Error(
        "You do not have access to the organisation that requested this Meta connection."
      );
    }

    console.log(
      "[META OAUTH] Organisation verified:",
      {
        userId,
        organisationId,
      }
    );

    // ========================================================
    // 3. EXCHANGE CODE FOR SHORT-LIVED USER TOKEN
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

      console.log(
        "[META OAUTH] Long-lived Meta token acquired."
      );
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

    if (
      pages.length ===
      0
    ) {
      throw new Error(
        "Meta connected, but no Facebook Pages were returned. Make sure you manage a Facebook Page and granted TOTS-OS access to it."
      );
    }

    // ========================================================
    // 8. FIND PAGE
    //
    // If a pageId is supplied through OAuth state, honour it.
    //
    // Otherwise retain the existing behaviour:
    // prefer a Page with a linked Instagram professional account.
    //
    // IMPORTANT:
    // Later we should add a proper Facebook Page selector when
    // a user manages multiple businesses.
    // ========================================================

    const requestedPageId =
      cleanString(
        parsedState.pageId
      );

    let selectedPage:
      MetaPage | null =
      null;

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
      requestedPageId
    ) {
      selectedPage =
        pages.find(
          (
            candidatePage
          ) =>
            cleanString(
              candidatePage.id
            ) ===
            requestedPageId
        ) ??
        null;

      if (
        !selectedPage
      ) {
        throw new Error(
          "The Facebook Page selected for this connection is no longer available."
        );
      }
    }

    // ========================================================
    // DISCOVER INSTAGRAM + CHOOSE BEST PAGE WHEN NONE REQUESTED
    // ========================================================

    const candidatePages =
      selectedPage
        ? [
            selectedPage,
          ]
        : pages;

    for (
      const candidatePage of
      candidatePages
    ) {
      const candidatePageId =
        cleanString(
          candidatePage.id
        );

      const candidatePageToken =
        cleanString(
          candidatePage.access_token
        );

      if (
        !candidatePageId ||
        !candidatePageToken
      ) {
        continue;
      }

      try {
        const instagramUrl =
          new URL(
            `https://graph.facebook.com/${graphVersion}/${candidatePageId}`
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
              candidatePageToken,
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
          !igRes.ok
        ) {
          console.warn(
            `[META OAUTH] Instagram discovery failed for Page ${candidatePageId}:`,
            igData
          );

          continue;
        }

        const instagramAccount =
          igData
            .instagram_business_account ||
          igData
            .connected_instagram_account ||
          null;

        if (
          instagramAccount?.id
        ) {
          /*
           * Only automatically select this page when there
           * wasn't already an explicit requested page.
           */
          if (
            !selectedPage
          ) {
            selectedPage =
              candidatePage;
          }

          instagramBusinessAccountId =
            cleanString(
              instagramAccount.id
            );

          instagramUsername =
            cleanString(
              instagramAccount.username
            );

          instagramAvatarUrl =
            cleanString(
              instagramAccount
                .profile_picture_url
            );

          break;
        }
      } catch (
        error
      ) {
        console.warn(
          `[META OAUTH] Instagram discovery error for Page ${candidatePageId}:`,
          error
        );
      }
    }

    // ========================================================
    // 9. FALL BACK TO FIRST VALID PAGE
    // ========================================================

    if (
      !selectedPage
    ) {
      selectedPage =
        pages.find(
          (
            candidatePage
          ) =>
            Boolean(
              cleanString(
                candidatePage.id
              ) &&
              cleanString(
                candidatePage.access_token
              )
            )
        ) ??
        null;
    }

    const pageId =
      cleanString(
        selectedPage
          ?.id
      );

    const pageName =
      cleanString(
        selectedPage
          ?.name
      );

    const pageAccessToken =
      cleanString(
        selectedPage
          ?.access_token
      );

    const pageAvatarUrl =
      cleanString(
        selectedPage
          ?.picture
          ?.data
          ?.url
      );

    if (
      !pageId ||
      !pageAccessToken
    ) {
      throw new Error(
        "A Facebook Page was returned, but Meta did not provide the Page credentials TOTS-OS needs."
      );
    }

    // ========================================================
    // 10. IF INSTAGRAM WASN'T FOUND ABOVE, CHECK SELECTED PAGE
    // ========================================================

    if (
      !instagramBusinessAccountId
    ) {
      try {
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
          const instagramAccount =
            igData
              .instagram_business_account ||
            igData
              .connected_instagram_account ||
            null;

          instagramBusinessAccountId =
            cleanString(
              instagramAccount
                ?.id
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
        } else {
          console.warn(
            "[META OAUTH] Instagram business account lookup failed:",
            igData
          );
        }
      } catch (
        error
      ) {
        console.warn(
          "[META OAUTH] Instagram account lookup threw:",
          error
        );
      }
    }

    console.log(
      "[META OAUTH] Selected Meta assets:",
      {
        organisationId,

        pageId,

        pageName,

        instagramBusinessAccountId,

        instagramUsername,
      }
    );

    // ========================================================
    // 11. CHOOSE DISPLAY DATA
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
    // 12. FIND EXISTING META ROW
    //
    // CRITICAL:
    // Existing connections are now scoped to BOTH user and
    // organisation.
    //
    // This means:
    //
    // TOTS + Meta
    //
    // and
    //
    // MTC + Meta
    //
    // are separate database records.
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
      ) as
        ExistingSocialAccountRow[];

    const existingAccount =
      existingRows[0] ??
      null;

    // ========================================================
    // 13. SOCIAL ACCOUNT PAYLOAD
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

      /*
       * Meta long-lived user tokens are not refreshed using the
       * normal OAuth refresh_token flow.
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
    // 14. UPDATE OR INSERT
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
        rawUpdatedAccount as
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
        rawInsertedAccount as
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
    // 15. FINAL DATABASE VERIFICATION
    //
    // Again, organisation_id is included so we cannot
    // accidentally validate a connection belonging to another
    // organisation.
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

    if (
      !verifiedConnection
        .page_id ||
      !verifiedConnection
        .page_access_token
    ) {
      console.warn(
        "[META OAUTH] Meta login was saved but Page publishing credentials are incomplete."
      );
    }

    // ========================================================
    // 16. SUCCESS LOG
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

        graphVersion,
      }
    );

    // ========================================================
    // 17. SUCCESS REDIRECT
    // ========================================================

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