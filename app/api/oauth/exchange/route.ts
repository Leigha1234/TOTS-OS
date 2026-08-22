import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// CONFIG
// ============================================================

const DEFAULT_META_GRAPH_VERSION =
  "v25.0";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !serviceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

// ============================================================
// SUPABASE ADMIN
// ============================================================

const supabase =
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

// ============================================================
// TYPES
// ============================================================

type OAuthState = {
  userId?:
    string;

  platform?:
    string;

  createdAt?:
    number;
};

type MetaTokenResponse = {
  access_token?:
    string;

  token_type?:
    string;

  expires_in?:
    number;

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
  id:
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

type InstagramAccountResponse = {
  instagram_business_account?: {
    id?:
      string;

    username?:
      string;
  };

  connected_instagram_account?: {
    id?:
      string;

    username?:
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

type LinkedInTokenResponse = {
  access_token?:
    string;

  expires_in?:
    number;

  refresh_token?:
    string;

  refresh_token_expires_in?:
    number;

  scope?:
    string;

  error?:
    string;

  error_description?:
    string;
};

type LinkedInProfileResponse = {
  sub?:
    string;

  name?:
    string;

  email?:
    string;

  picture?:
    string;
};

type TikTokTokenResponse = {
  access_token?:
    string;

  expires_in?:
    number;

  open_id?:
    string;

  refresh_token?:
    string;

  refresh_expires_in?:
    number;

  scope?:
    string;

  token_type?:
    string;

  error?:
    string;

  error_description?:
    string;
};

type TikTokUserResponse = {
  data?: {
    user?: {
      open_id?:
        string;

      display_name?:
        string;

      avatar_url?:
        string;
    };
  };

  error?: {
    code?:
      string;

    message?:
      string;

    log_id?:
      string;
  };
};

// ============================================================
// HELPERS
// ============================================================

function jsonError(
  error:
    string,

  status:
    number,

  details?:
    unknown
) {
  return NextResponse.json(
    {
      success:
        false,

      error,

      ...(details !==
      undefined
        ? {
            details,
          }
        : {}),
    },
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================

function parseState(
  state:
    string
):
  | OAuthState
  | null {
  try {
    try {
      return JSON.parse(
        state
      ) as OAuthState;
    } catch {
      return JSON.parse(
        decodeURIComponent(
          state
        )
      ) as OAuthState;
    }
  } catch {
    return null;
  }
}

// ============================================================

function expiresAt(
  seconds?:
    number
) {
  if (
    !seconds ||
    !Number.isFinite(
      seconds
    ) ||
    seconds <=
      0
  ) {
    return null;
  }

  return new Date(
    Date.now() +
      seconds *
        1000
  ).toISOString();
}

// ============================================================

function normalisePlatform(
  value:
    string
) {
  const platform =
    value
      .trim()
      .toLowerCase();

  if (
    platform ===
      "facebook" ||
    platform ===
      "instagram"
  ) {
    return "meta";
  }

  return platform;
}

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

  return DEFAULT_META_GRAPH_VERSION;
}

// ============================================================
// VERIFY SUPABASE USER
// ============================================================

async function verifyUser(
  userId:
    string
) {
  const {
    data,
    error,
  } =
    await supabase
      .auth
      .admin
      .getUserById(
        userId
      );

  if (
    error ||
    !data.user
  ) {
    console.error(
      "[OAUTH EXCHANGE] Supabase user verification failed:",
      error
    );

    throw new Error(
      "The signed-in TOTS-OS user could not be verified."
    );
  }

  return data.user;
}

// ============================================================
// RESOLVE ORGANISATION
// ============================================================

async function resolveOrganisationId(
  userId:
    string
) {
  try {
    const {
      data:
        membershipRows,

      error:
        membershipError,
    } =
      await supabase
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
      !membershipError &&
      membershipRows?.[0]
        ?.organisation_id
    ) {
      return String(
        membershipRows[0]
          .organisation_id
      );
    }

    const {
      data:
        profile,

      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "id",
          userId
        )
        .maybeSingle();

    if (
      !profileError &&
      profile?.organisation_id
    ) {
      return String(
        profile.organisation_id
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[OAUTH EXCHANGE] Organisation resolution failed:",
      error
    );
  }

  return null;
}

// ============================================================
// SAVE SOCIAL ACCOUNT
// ============================================================

async function saveSocialAccount({
  userId,
  platform,
  payload,
}: {
  userId:
    string;

  platform:
    string;

  payload:
    Record<
      string,
      unknown
    >;
}) {
  const organisationId =
    await resolveOrganisationId(
      userId
    );

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "social_accounts"
      )
      .upsert(
        {
          user_id:
            userId,

          platform,

          organisation_id:
            organisationId,

          ...payload,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id,platform",
        }
      )
      .select(
        "*"
      )
      .single();

  if (
    error
  ) {
    console.error(
      "[OAUTH EXCHANGE] Social account save failed:",
      error
    );

    throw new Error(
      `Social account save failed: ${error.message}`
    );
  }

  return data;
}

// ============================================================
// META
// ============================================================

async function exchangeMeta(
  code:
    string,

  userId:
    string
) {
  const clientId =
    process.env
      .META_CLIENT_ID
      ?.trim();

  const clientSecret =
    process.env
      .META_CLIENT_SECRET
      ?.trim();

  const redirectUri =
    process.env
      .META_REDIRECT_URI
      ?.trim();

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    return jsonError(
      "Meta OAuth environment variables are missing",
      500,
      {
        hasClientId:
          Boolean(
            clientId
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
  }

  await verifyUser(
    userId
  );

  const graphVersion =
    getMetaGraphVersion();

  // ==========================================================
  // 1. AUTHORIZATION CODE -> SHORT-LIVED TOKEN
  // ==========================================================

  const tokenUrl =
    new URL(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token`
    );

  tokenUrl.searchParams.set(
    "client_id",
    clientId
  );

  tokenUrl.searchParams.set(
    "client_secret",
    clientSecret
  );

  tokenUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  tokenUrl.searchParams.set(
    "code",
    code
  );

  const tokenResponse =
    await fetch(
      tokenUrl.toString(),
      {
        method:
          "GET",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(
        () =>
          ({})
      )) as MetaTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "[META EXCHANGE] Token exchange failed:",
      tokenData
    );

    return jsonError(
      "Meta token exchange failed",
      400,
      tokenData
    );
  }

  let userAccessToken =
    tokenData.access_token;

  let userTokenExpiresIn =
    tokenData.expires_in;

  // ==========================================================
  // 2. LONG-LIVED TOKEN
  // ==========================================================

  try {
    const longTokenUrl =
      new URL(
        `https://graph.facebook.com/${graphVersion}/oauth/access_token`
      );

    longTokenUrl.searchParams.set(
      "grant_type",
      "fb_exchange_token"
    );

    longTokenUrl.searchParams.set(
      "client_id",
      clientId
    );

    longTokenUrl.searchParams.set(
      "client_secret",
      clientSecret
    );

    longTokenUrl.searchParams.set(
      "fb_exchange_token",
      userAccessToken
    );

    const longTokenResponse =
      await fetch(
        longTokenUrl.toString(),
        {
          method:
            "GET",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    const longTokenData =
      (await longTokenResponse
        .json()
        .catch(
          () =>
            ({})
        )) as MetaTokenResponse;

    if (
      longTokenResponse.ok &&
      longTokenData.access_token
    ) {
      userAccessToken =
        longTokenData.access_token;

      userTokenExpiresIn =
        longTokenData.expires_in ??
        userTokenExpiresIn;
    } else {
      console.warn(
        "[META EXCHANGE] Long-lived token exchange failed. Short-lived token will be stored.",
        longTokenData
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[META EXCHANGE] Long-lived token request failed:",
      error
    );
  }

  // ==========================================================
  // 3. FACEBOOK USER
  // ==========================================================

  const meUrl =
    new URL(
      `https://graph.facebook.com/${graphVersion}/me`
    );

  meUrl.searchParams.set(
    "fields",
    "id,name,picture"
  );

  meUrl.searchParams.set(
    "access_token",
    userAccessToken
  );

  const meResponse =
    await fetch(
      meUrl.toString(),
      {
        method:
          "GET",

        cache:
          "no-store",
      }
    );

  const meData =
    (await meResponse
      .json()
      .catch(
        () =>
          ({})
      )) as MetaUserResponse;

  if (
    !meResponse.ok ||
    !meData.id
  ) {
    console.error(
      "[META EXCHANGE] Facebook user lookup failed:",
      meData
    );

    return jsonError(
      "Unable to retrieve Facebook account",
      400,
      meData
    );
  }

  // ==========================================================
  // 4. FACEBOOK PAGES
  // ==========================================================

  const pagesUrl =
    new URL(
      `https://graph.facebook.com/${graphVersion}/me/accounts`
    );

  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token,picture"
  );

  pagesUrl.searchParams.set(
    "access_token",
    userAccessToken
  );

  const pagesResponse =
    await fetch(
      pagesUrl.toString(),
      {
        method:
          "GET",

        cache:
          "no-store",
      }
    );

  const pagesData =
    (await pagesResponse
      .json()
      .catch(
        () =>
          ({})
      )) as MetaPagesResponse;

  if (
    !pagesResponse.ok
  ) {
    console.error(
      "[META EXCHANGE] Facebook Page request failed:",
      pagesData
    );

    return jsonError(
      "Unable to fetch Facebook Pages",
      400,
      pagesData
    );
  }

  const pages =
    pagesData.data ??
    [];

  if (
    pages.length ===
    0
  ) {
    return jsonError(
      "Meta connected, but no Facebook Pages were returned. Make sure this Facebook account manages a Page and Page permissions were granted.",
      400
    );
  }

  // ==========================================================
  // 5. FIND BEST PAGE
  // ==========================================================

  let selectedPage:
    MetaPage |
    null =
    null;

  let instagramBusinessAccountId:
    string |
    null =
    null;

  let instagramUsername:
    string |
    null =
    null;

  for (
    const page of
    pages
  ) {
    if (
      !page.id ||
      !page.access_token
    ) {
      continue;
    }

    try {
      const instagramUrl =
        new URL(
          `https://graph.facebook.com/${graphVersion}/${page.id}`
        );

      instagramUrl.searchParams.set(
        "fields",
        [
          "instagram_business_account{id,username}",
          "connected_instagram_account{id,username}",
        ].join(
          ","
        )
      );

      instagramUrl.searchParams.set(
        "access_token",
        page.access_token
      );

      const instagramResponse =
        await fetch(
          instagramUrl.toString(),
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      const instagramData =
        (await instagramResponse
          .json()
          .catch(
            () =>
              ({})
          )) as InstagramAccountResponse;

      if (
        !instagramResponse.ok
      ) {
        console.warn(
          `[META EXCHANGE] Instagram lookup failed for Page ${page.id}:`,
          instagramData
        );

        continue;
      }

      const instagramAccount =
        instagramData
          .instagram_business_account ||
        instagramData
          .connected_instagram_account ||
        null;

      if (
        instagramAccount?.id
      ) {
        selectedPage =
          page;

        instagramBusinessAccountId =
          instagramAccount.id;

        instagramUsername =
          instagramAccount.username ??
          null;

        break;
      }
    } catch (
      error
    ) {
      console.warn(
        `[META EXCHANGE] Instagram discovery failed for Page ${page.id}:`,
        error
      );
    }
  }

  // ==========================================================
  // 6. FALLBACK PAGE
  // ==========================================================

  if (
    !selectedPage
  ) {
    selectedPage =
      pages.find(
        (
          page
        ) =>
          Boolean(
            page.id &&
              page.access_token
          )
      ) ??
      null;
  }

  if (
    !selectedPage?.id ||
    !selectedPage
      .access_token
  ) {
    return jsonError(
      "A Facebook Page was found, but Meta did not return a Page access token.",
      400
    );
  }

  // ==========================================================
  // 7. SAVE META CONNECTION
  // ==========================================================

  let savedAccount:
    any;

  try {
    savedAccount =
      await saveSocialAccount({
        userId,

        platform:
          "meta",

        payload: {
          platform_user_id:
            meData.id,

          access_token:
            userAccessToken,

          refresh_token:
            null,

          expires_at:
            expiresAt(
              userTokenExpiresIn
            ),

          page_id:
            selectedPage.id,

          page_name:
            selectedPage.name ??
            null,

          page_access_token:
            selectedPage
              .access_token,

          instagram_business_account_id:
            instagramBusinessAccountId,

          display_name:
            selectedPage.name ||
            meData.name ||
            instagramUsername ||
            null,

          avatar_url:
            selectedPage
              .picture
              ?.data
              ?.url ||
            meData.picture
              ?.data
              ?.url ||
            null,
        },
      });
  } catch (
    error
  ) {
    console.error(
      "[META EXCHANGE] Database save failed:",
      error
    );

    return jsonError(
      "Meta connection could not be saved",
      500,
      error instanceof
        Error
        ? error.message
        : error
    );
  }

  // ==========================================================
  // 8. VERIFY META SAVE
  // ==========================================================

  const {
    data:
      verifiedAccount,

    error:
      verificationError,
  } =
    await supabase
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
          page_id,
          page_name,
          page_access_token,
          instagram_business_account_id,
          expires_at
        `
      )
      .eq(
        "id",
        savedAccount.id
      )
      .maybeSingle();

  if (
    verificationError ||
    !verifiedAccount
  ) {
    console.error(
      "[META EXCHANGE] Saved Meta account could not be verified:",
      verificationError
    );

    return jsonError(
      "Meta authenticated, but the saved connection could not be verified.",
      500,
      verificationError?.message
    );
  }

  console.log(
    "[META EXCHANGE] ✅ Meta connection saved:",
    {
      socialAccountId:
        verifiedAccount.id,

      userId,

      organisationId:
        verifiedAccount
          .organisation_id,

      facebookUserId:
        verifiedAccount
          .platform_user_id,

      pageId:
        verifiedAccount
          .page_id,

      pageName:
        verifiedAccount
          .page_name,

      instagramBusinessAccountId:
        verifiedAccount
          .instagram_business_account_id,

      graphVersion,
    }
  );

  // ==========================================================
  // 9. SUCCESS
  // ==========================================================

  return NextResponse.json(
    {
      success:
        true,

      platform:
        "meta",

      userId,

      socialAccountId:
        verifiedAccount.id,

      displayName:
        verifiedAccount
          .display_name,

      pageId:
        verifiedAccount
          .page_id,

      pageName:
        verifiedAccount
          .page_name,

      instagramBusinessAccountId:
        verifiedAccount
          .instagram_business_account_id,

      page: {
        id:
          selectedPage.id,

        name:
          selectedPage.name ??
          null,
      },

      instagram: {
        connected:
          Boolean(
            instagramBusinessAccountId
          ),

        accountId:
          instagramBusinessAccountId,

        username:
          instagramUsername,
      },

      pagesFound:
        pages.length,
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// LINKEDIN
// ============================================================

async function exchangeLinkedIn(
  code:
    string,

  userId:
    string
) {
  const clientId =
    process.env
      .LINKEDIN_CLIENT_ID
      ?.trim();

  const clientSecret =
    process.env
      .LINKEDIN_CLIENT_SECRET
      ?.trim();

  const redirectUri =
    process.env
      .LINKEDIN_REDIRECT_URI
      ?.trim();

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    return jsonError(
      "LinkedIn OAuth environment variables are missing",
      500
    );
  }

  await verifyUser(
    userId
  );

  const tokenResponse =
    await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
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

            redirect_uri:
              redirectUri,
          }),

        cache:
          "no-store",
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(
        () =>
          ({})
      )) as LinkedInTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "[LINKEDIN EXCHANGE] Token error:",
      tokenData
    );

    return jsonError(
      "LinkedIn token exchange failed",
      400,
      tokenData
    );
  }

  const profileResponse =
    await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },

        cache:
          "no-store",
      }
    );

  const profile =
    (await profileResponse
      .json()
      .catch(
        () =>
          ({})
      )) as LinkedInProfileResponse;

  if (
    !profileResponse.ok ||
    !profile.sub
  ) {
    console.error(
      "[LINKEDIN EXCHANGE] Profile error:",
      profile
    );

    return jsonError(
      "Unable to retrieve LinkedIn profile",
      400,
      profile
    );
  }

  let savedAccount:
    any;

  try {
    savedAccount =
      await saveSocialAccount({
        userId,

        platform:
          "linkedin",

        payload: {
          platform_user_id:
            profile.sub,

          access_token:
            tokenData
              .access_token,

          refresh_token:
            tokenData
              .refresh_token ??
            null,

          expires_at:
            expiresAt(
              tokenData
                .expires_in
            ),

          display_name:
            profile.name ??
            null,

          avatar_url:
            profile.picture ??
            null,

          page_id:
            null,

          page_name:
            null,

          page_access_token:
            null,

          instagram_business_account_id:
            null,
        },
      });
  } catch (
    error
  ) {
    console.error(
      "[LINKEDIN EXCHANGE] Save error:",
      error
    );

    return jsonError(
      "LinkedIn connection could not be saved",
      500,
      error instanceof
        Error
        ? error.message
        : error
    );
  }

  return NextResponse.json(
    {
      success:
        true,

      platform:
        "linkedin",

      userId,

      socialAccountId:
        savedAccount.id,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// TIKTOK
// ============================================================

async function exchangeTikTok(
  code:
    string,

  userId:
    string
) {
  const clientKey =
    process.env
      .TIKTOK_CLIENT_KEY
      ?.trim();

  const clientSecret =
    process.env
      .TIKTOK_CLIENT_SECRET
      ?.trim();

  const redirectUri =
    process.env
      .TIKTOK_REDIRECT_URI
      ?.trim();

  if (
    !clientKey ||
    !clientSecret ||
    !redirectUri
  ) {
    return jsonError(
      "TikTok OAuth environment variables are missing",
      500
    );
  }

  await verifyUser(
    userId
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
          new URLSearchParams({
            client_key:
              clientKey,

            client_secret:
              clientSecret,

            code,

            grant_type:
              "authorization_code",

            redirect_uri:
              redirectUri,
          }),

        cache:
          "no-store",
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(
        () =>
          ({})
      )) as TikTokTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "[TIKTOK EXCHANGE] Token error:",
      tokenData
    );

    return jsonError(
      "TikTok token exchange failed",
      400,
      tokenData
    );
  }

  const userResponse =
    await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },

        cache:
          "no-store",
      }
    );

  const userData =
    (await userResponse
      .json()
      .catch(
        () =>
          ({})
      )) as TikTokUserResponse;

  const tiktokUser =
    userData.data
      ?.user;

  const openId =
    tiktokUser
      ?.open_id ||
    tokenData
      .open_id;

  if (
    !userResponse.ok ||
    !openId
  ) {
    console.error(
      "[TIKTOK EXCHANGE] User error:",
      userData
    );

    return jsonError(
      "Unable to retrieve TikTok profile",
      400,
      userData
    );
  }

  let savedAccount:
    any;

  try {
    savedAccount =
      await saveSocialAccount({
        userId,

        platform:
          "tiktok",

        payload: {
          platform_user_id:
            openId,

          access_token:
            tokenData
              .access_token,

          refresh_token:
            tokenData
              .refresh_token ??
            null,

          expires_at:
            expiresAt(
              tokenData
                .expires_in
            ),

          display_name:
            tiktokUser
              ?.display_name ??
            null,

          avatar_url:
            tiktokUser
              ?.avatar_url ??
            null,

          page_id:
            null,

          page_name:
            null,

          page_access_token:
            null,

          instagram_business_account_id:
            null,
        },
      });
  } catch (
    error
  ) {
    console.error(
      "[TIKTOK EXCHANGE] Save error:",
      error
    );

    return jsonError(
      "TikTok connection could not be saved",
      500,
      error instanceof
        Error
        ? error.message
        : error
    );
  }

  return NextResponse.json(
    {
      success:
        true,

      platform:
        "tiktok",

      userId,

      socialAccountId:
        savedAccount.id,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// MAIN EXCHANGE
// ============================================================

async function exchangeOAuth(
  code:
    string,

  state:
    string,

  platformOverride?:
    string
) {
  try {
    if (
      !code ||
      !state
    ) {
      return jsonError(
        "Missing code or state",
        400
      );
    }

    const parsedState =
      parseState(
        state
      );

    if (
      !parsedState
    ) {
      return jsonError(
        "Invalid OAuth state",
        400
      );
    }

    const userId =
      typeof parsedState
        .userId ===
        "string"
        ? parsedState
            .userId
            .trim()
        : "";

    const statePlatform =
      normalisePlatform(
        String(
          parsedState
            .platform ||
            ""
        )
      );

    const overridePlatform =
      platformOverride
        ? normalisePlatform(
            platformOverride
          )
        : "";

    const platform =
      overridePlatform ||
      statePlatform;

    if (
      !userId ||
      !platform
    ) {
      return jsonError(
        "Invalid OAuth state payload",
        400
      );
    }

    // ========================================================
    // STATE AGE
    // ========================================================

    if (
      typeof parsedState
        .createdAt ===
        "number" &&
      Number.isFinite(
        parsedState.createdAt
      )
    ) {
      const age =
        Date.now() -
        parsedState
          .createdAt;

      const maxAge =
        30 *
        60 *
        1000;

      if (
        age >
        maxAge
      ) {
        return jsonError(
          "OAuth state has expired",
          400
        );
      }

      if (
        age <
        -60_000
      ) {
        return jsonError(
          "Invalid OAuth state timestamp",
          400
        );
      }
    }

    // ========================================================
    // PLATFORM MISMATCH
    // ========================================================

    if (
      overridePlatform &&
      statePlatform &&
      overridePlatform !==
        statePlatform
    ) {
      return jsonError(
        "OAuth platform mismatch",
        400
      );
    }

    // ========================================================
    // META
    // ========================================================

    if (
      platform ===
      "meta"
    ) {
      return exchangeMeta(
        code,
        userId
      );
    }

    // ========================================================
    // LINKEDIN
    // ========================================================

    if (
      platform ===
      "linkedin"
    ) {
      return exchangeLinkedIn(
        code,
        userId
      );
    }

    // ========================================================
    // TIKTOK
    // ========================================================

    if (
      platform ===
      "tiktok"
    ) {
      return exchangeTikTok(
        code,
        userId
      );
    }

    return jsonError(
      `Unsupported OAuth platform: ${platform}`,
      400
    );
  } catch (
    error
  ) {
    console.error(
      "[OAUTH EXCHANGE] Fatal error:",
      error
    );

    return jsonError(
      "OAuth exchange failed",
      500,
      error instanceof
        Error
        ? error.message
        : "Unknown OAuth error"
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    const body =
      await request.json();

    return exchangeOAuth(
      String(
        body?.code ??
          ""
      ),

      String(
        body?.state ??
          ""
      ),

      body?.platform
        ? String(
            body.platform
          )
        : undefined
    );
  } catch (
    error
  ) {
    console.error(
      "[OAUTH EXCHANGE] POST error:",
      error
    );

    return jsonError(
      "Invalid OAuth request",
      400
    );
  }
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  const {
    searchParams,
  } =
    new URL(
      request.url
    );

  return exchangeOAuth(
    searchParams.get(
      "code"
    ) ||
      "",

    searchParams.get(
      "state"
    ) ||
      "",

    searchParams.get(
      "platform"
    ) ||
      undefined
  );
}