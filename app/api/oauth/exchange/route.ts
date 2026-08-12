import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ==================================================
// CONFIG
// ==================================================

const GRAPH_VERSION = "v23.0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ==================================================
// TYPES
// ==================================================

type OAuthState = {
  userId?: string;
  platform?: string;
};

type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type MetaPage = {
  id: string;
  name?: string;
  access_token?: string;
};

type MetaPagesResponse = {
  data?: MetaPage[];
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type InstagramAccountResponse = {
  instagram_business_account?: {
    id?: string;
  };
  connected_instagram_account?: {
    id?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type LinkedInProfileResponse = {
  sub?: string;
  name?: string;
  email?: string;
};

type TikTokTokenResponse = {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type TikTokUserResponse = {
  data?: {
    user?: {
      open_id?: string;
      display_name?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

// ==================================================
// HELPERS
// ==================================================

function jsonError(
  error: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details !== undefined
        ? { details }
        : {}),
    },
    {
      status,
    }
  );
}

function parseState(
  state: string
): OAuthState | null {
  try {
    /*
     * URLSearchParams normally already decodes the value.
     * However, older parts of the app may have encoded the
     * JSON manually.
     *
     * Try both formats.
     */

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

function expiresAt(
  seconds?: number
) {
  if (
    !seconds ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }

  return new Date(
    Date.now() +
      seconds * 1000
  ).toISOString();
}

// ==================================================
// META
// ==================================================

async function exchangeMeta(
  code: string,
  userId: string
) {
  const clientId =
    process.env.META_CLIENT_ID;

  const clientSecret =
    process.env.META_CLIENT_SECRET;

  const redirectUri =
    process.env.META_REDIRECT_URI;

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
          Boolean(clientId),
        hasClientSecret:
          Boolean(clientSecret),
        hasRedirectUri:
          Boolean(redirectUri),
      }
    );
  }

  // ==================================================
  // 1. EXCHANGE AUTHORIZATION CODE
  // ==================================================

  const tokenUrl =
    new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
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
        method: "GET",
        cache: "no-store",
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(() => ({}))) as MetaTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "META TOKEN EXCHANGE ERROR:",
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

  // ==================================================
  // 2. TRY TO GET LONG-LIVED USER TOKEN
  // ==================================================

  try {
    const longTokenUrl =
      new URL(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
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
          method: "GET",
          cache: "no-store",
        }
      );

    const longTokenData =
      (await longTokenResponse
        .json()
        .catch(() => ({}))) as MetaTokenResponse;

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
      /*
       * This should not prevent connection.
       * We can still use the original token.
       */
      console.warn(
        "Could not exchange Meta token for long-lived token:",
        longTokenData
      );
    }
  } catch (error) {
    console.warn(
      "Meta long-lived token exchange failed:",
      error
    );
  }

  // ==================================================
  // 3. FETCH FACEBOOK PAGES
  // ==================================================

  const pagesUrl =
    new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`
    );

  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token"
  );

  pagesUrl.searchParams.set(
    "access_token",
    userAccessToken
  );

  const pagesResponse =
    await fetch(
      pagesUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const pagesData =
    (await pagesResponse
      .json()
      .catch(() => ({}))) as MetaPagesResponse;

  if (!pagesResponse.ok) {
    console.error(
      "META PAGE FETCH ERROR:",
      pagesData
    );

    return jsonError(
      "Unable to fetch Facebook Pages",
      400,
      pagesData
    );
  }

  const pages =
    pagesData.data ?? [];

  if (!pages.length) {
    return jsonError(
      "No Facebook Pages were found for this Meta account. You need access to a Facebook Page before it can be connected.",
      400
    );
  }

  // ==================================================
  // 4. FIND A PAGE WITH AN INSTAGRAM ACCOUNT
  // ==================================================

  let selectedPage:
    MetaPage | null = null;

  let instagramBusinessAccountId:
    string | null = null;

  for (const page of pages) {
    if (
      !page.id ||
      !page.access_token
    ) {
      continue;
    }

    try {
      const instagramUrl =
        new URL(
          `https://graph.facebook.com/${GRAPH_VERSION}/${page.id}`
        );

      instagramUrl.searchParams.set(
        "fields",
        [
          "instagram_business_account",
          "connected_instagram_account",
        ].join(",")
      );

      instagramUrl.searchParams.set(
        "access_token",
        page.access_token
      );

      const instagramResponse =
        await fetch(
          instagramUrl.toString(),
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const instagramData =
        (await instagramResponse
          .json()
          .catch(
            () => ({})
          )) as InstagramAccountResponse;

      if (
        !instagramResponse.ok
      ) {
        console.warn(
          `Could not inspect Instagram account for page ${page.id}:`,
          instagramData
        );

        continue;
      }

      const instagramId =
        instagramData
          .instagram_business_account
          ?.id ||
        instagramData
          .connected_instagram_account
          ?.id ||
        null;

      if (instagramId) {
        selectedPage =
          page;

        instagramBusinessAccountId =
          instagramId;

        break;
      }
    } catch (error) {
      console.warn(
        `Instagram discovery failed for page ${page.id}:`,
        error
      );
    }
  }

  // ==================================================
  // 5. FALL BACK TO FIRST FACEBOOK PAGE
  // ==================================================

  if (!selectedPage) {
    selectedPage =
      pages.find(
        (page) =>
          Boolean(
            page.id &&
              page.access_token
          )
      ) ?? null;
  }

  if (
    !selectedPage?.id ||
    !selectedPage.access_token
  ) {
    return jsonError(
      "A Facebook Page was found, but Meta did not return a Page access token.",
      400
    );
  }

  // ==================================================
  // 6. SAVE META CONNECTION
  // ==================================================

  const now =
    new Date().toISOString();

  const metaAccount = {
    user_id:
      userId,

    platform:
      "meta",

    /*
     * Facebook Page ID.
     */
    platform_user_id:
      selectedPage.id,

    /*
     * Keep the USER token as the general access token.
     */
    access_token:
      userAccessToken,

    /*
     * Facebook Page-specific information.
     */
    page_id:
      selectedPage.id,

    page_name:
      selectedPage.name ??
      null,

    /*
     * This is the token required for Page publishing.
     */
    page_access_token:
      selectedPage.access_token,

    /*
     * Used for Instagram publishing.
     */
    instagram_business_account_id:
      instagramBusinessAccountId,

    refresh_token:
      null,

    expires_at:
      expiresAt(
        userTokenExpiresIn
      ),

    updated_at:
      now,
  };

  const {
    error: saveError,
  } = await supabase
    .from(
      "social_accounts"
    )
    .upsert(
      metaAccount,
      {
        onConflict:
          "user_id,platform",
      }
    );

  if (saveError) {
    console.error(
      "META DATABASE SAVE ERROR:",
      saveError
    );

    return jsonError(
      "Meta connection could not be saved",
      500,
      saveError.message
    );
  }

  // ==================================================
  // 7. SUCCESS
  // ==================================================

  return NextResponse.json({
    success: true,

    platform:
      "meta",

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
    },

    pagesFound:
      pages.length,
  });
}

// ==================================================
// LINKEDIN
// ==================================================

async function exchangeLinkedIn(
  code: string,
  userId: string
) {
  const clientId =
    process.env.LINKEDIN_CLIENT_ID;

  const clientSecret =
    process.env.LINKEDIN_CLIENT_SECRET;

  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI;

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

  // ==================================================
  // TOKEN
  // ==================================================

  const tokenResponse =
    await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams(
            {
              grant_type:
                "authorization_code",

              code,

              client_id:
                clientId,

              client_secret:
                clientSecret,

              redirect_uri:
                redirectUri,
            }
          ),

        cache: "no-store",
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(
        () => ({})
      )) as LinkedInTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "LINKEDIN TOKEN ERROR:",
      tokenData
    );

    return jsonError(
      "LinkedIn token exchange failed",
      400,
      tokenData
    );
  }

  // ==================================================
  // PROFILE
  // ==================================================

  const profileResponse =
    await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },

        cache: "no-store",
      }
    );

  const profile =
    (await profileResponse
      .json()
      .catch(
        () => ({})
      )) as LinkedInProfileResponse;

  if (
    !profileResponse.ok ||
    !profile.sub
  ) {
    console.error(
      "LINKEDIN PROFILE ERROR:",
      profile
    );

    return jsonError(
      "Unable to retrieve LinkedIn profile",
      400,
      profile
    );
  }

  // ==================================================
  // SAVE
  // ==================================================

  const {
    error: saveError,
  } = await supabase
    .from(
      "social_accounts"
    )
    .upsert(
      {
        user_id:
          userId,

        platform:
          "linkedin",

        platform_user_id:
          profile.sub,

        access_token:
          tokenData.access_token,

        refresh_token:
          tokenData.refresh_token ??
          null,

        expires_at:
          expiresAt(
            tokenData.expires_in
          ),

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "user_id,platform",
      }
    );

  if (saveError) {
    console.error(
      "LINKEDIN DATABASE SAVE ERROR:",
      saveError
    );

    return jsonError(
      "LinkedIn connection could not be saved",
      500,
      saveError.message
    );
  }

  return NextResponse.json({
    success: true,
    platform:
      "linkedin",
  });
}

// ==================================================
// TIKTOK
// ==================================================

async function exchangeTikTok(
  code: string,
  userId: string
) {
  const clientKey =
    process.env.TIKTOK_CLIENT_KEY;

  const clientSecret =
    process.env.TIKTOK_CLIENT_SECRET;

  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI;

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

  // ==================================================
  // TOKEN
  // ==================================================

  const tokenResponse =
    await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",

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

        cache: "no-store",
      }
    );

  const tokenData =
    (await tokenResponse
      .json()
      .catch(
        () => ({})
      )) as TikTokTokenResponse;

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "TIKTOK TOKEN ERROR:",
      tokenData
    );

    return jsonError(
      "TikTok token exchange failed",
      400,
      tokenData
    );
  }

  // ==================================================
  // PROFILE
  // ==================================================

  const userResponse =
    await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },

        cache: "no-store",
      }
    );

  const userData =
    (await userResponse
      .json()
      .catch(
        () => ({})
      )) as TikTokUserResponse;

  const tiktokUser =
    userData.data?.user;

  const openId =
    tiktokUser?.open_id ||
    tokenData.open_id;

  if (
    !userResponse.ok ||
    !openId
  ) {
    console.error(
      "TIKTOK USER ERROR:",
      userData
    );

    return jsonError(
      "Unable to retrieve TikTok profile",
      400,
      userData
    );
  }

  // ==================================================
  // SAVE
  // ==================================================

  const {
    error: saveError,
  } = await supabase
    .from(
      "social_accounts"
    )
    .upsert(
      {
        user_id:
          userId,

        platform:
          "tiktok",

        platform_user_id:
          openId,

        access_token:
          tokenData.access_token,

        refresh_token:
          tokenData.refresh_token ??
          null,

        expires_at:
          expiresAt(
            tokenData.expires_in
          ),

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "user_id,platform",
      }
    );

  if (saveError) {
    console.error(
      "TIKTOK DATABASE SAVE ERROR:",
      saveError
    );

    return jsonError(
      "TikTok connection could not be saved",
      500,
      saveError.message
    );
  }

  return NextResponse.json({
    success: true,
    platform:
      "tiktok",
  });
}

// ==================================================
// MAIN EXCHANGE
// ==================================================

async function exchangeOAuth(
  code: string,
  state: string,
  platformOverride?: string
) {
  try {
    // ==================================================
    // VALIDATE REQUEST
    // ==================================================

    if (
      !code ||
      !state
    ) {
      return jsonError(
        "Missing code or state",
        400
      );
    }

    // ==================================================
    // PARSE STATE
    // ==================================================

    const parsedState =
      parseState(
        state
      );

    if (!parsedState) {
      return jsonError(
        "Invalid OAuth state",
        400
      );
    }

    const userId =
      parsedState.userId;

    const platform =
      (
        platformOverride ||
        parsedState.platform ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !userId ||
      !platform
    ) {
      return jsonError(
        "Invalid OAuth state payload",
        400
      );
    }

    // ==================================================
    // IMPORTANT SECURITY CHECK
    //
    // If a platform override is supplied by the callback,
    // it must agree with the platform stored in state.
    // ==================================================

    if (
      platformOverride &&
      parsedState.platform &&
      platformOverride.toLowerCase() !==
        parsedState.platform.toLowerCase()
    ) {
      return jsonError(
        "OAuth platform mismatch",
        400
      );
    }

    // ==================================================
    // META
    // ==================================================

    if (
      platform ===
        "meta" ||
      platform ===
        "instagram"
    ) {
      return exchangeMeta(
        code,
        userId
      );
    }

    // ==================================================
    // LINKEDIN
    // ==================================================

    if (
      platform ===
      "linkedin"
    ) {
      return exchangeLinkedIn(
        code,
        userId
      );
    }

    // ==================================================
    // TIKTOK
    // ==================================================

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
  } catch (error) {
    console.error(
      "OAUTH EXCHANGE FATAL ERROR:",
      error
    );

    return jsonError(
      "OAuth exchange failed",
      500,
      error instanceof Error
        ? error.message
        : "Unknown OAuth error"
    );
  }
}

// ==================================================
// POST
// ==================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    return exchangeOAuth(
      String(
        body?.code ?? ""
      ),

      String(
        body?.state ?? ""
      ),

      body?.platform
        ? String(
            body.platform
          )
        : undefined
    );
  } catch (error) {
    console.error(
      "OAUTH POST ERROR:",
      error
    );

    return jsonError(
      "Invalid OAuth request",
      400
    );
  }
}

// ==================================================
// GET
// ==================================================

export async function GET(
  request: NextRequest
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
    ) || "",

    searchParams.get(
      "state"
    ) || "",

    searchParams.get(
      "platform"
    ) || undefined
  );
}