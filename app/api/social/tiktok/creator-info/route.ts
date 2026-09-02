// app/api/social/tiktok/creator-info/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type TikTokConnection = {
  id:
    string;

  user_id:
    string;

  organisation_id:
    | string
    | null;

  access_token:
    | string
    | null;

  refresh_token:
    | string
    | null;

  expires_at:
    | string
    | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function tokenExpired(
  expiresAt:
    | string
    | null
    | undefined
) {
  if (
    !expiresAt
  ) {
    return false;
  }

  const timestamp =
    new Date(
      expiresAt
    ).getTime();

  if (
    Number.isNaN(
      timestamp
    )
  ) {
    return false;
  }

  // Refresh a minute early so the token cannot expire during the request.
  return (
    timestamp <=
    Date.now() +
      60_000
  );
}

async function safeJsonResponse(
  response:
    Response
): Promise<any> {
  const text =
    await response.text();

  if (
    !text
  ) {
    return null;
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {
      raw:
        text,
    };
  }
}

function getTikTokErrorMessage(
  value:
    any
) {
  return (
    cleanString(
      value?.error?.message
    ) ||
    cleanString(
      value?.message
    ) ||
    cleanString(
      value?.raw
    ) ||
    "TikTok returned an unexpected error."
  );
}

// ============================================================
// CONNECTION LOOKUP
// ============================================================

async function getTikTokConnection({
  admin,
  userId,
  organisationId,
}: {
  admin:
    any;

  userId:
    string;

  organisationId:
    string | null;
}) {
  if (
    organisationId
  ) {
    const {
      data,
      error,
    } =
      await admin
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            user_id,
            organisation_id,
            access_token,
            refresh_token,
            expires_at
          `
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "platform",
          "tiktok"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .limit(
          1
        )
        .maybeSingle();

    if (
      error
    ) {
      throw new Error(
        `TikTok connection lookup failed: ${error.message}`
      );
    }

    if (
      data
    ) {
      return data as TikTokConnection;
    }
  }

  // Legacy fallback for TikTok rows created before organisation_id
  // was written consistently. This only considers an unscoped row and
  // never silently selects a TikTok account belonging to another org.
  const {
    data:
      fallback,
    error:
      fallbackError,
  } =
    await admin
      .from(
        "social_accounts"
      )
      .select(
        `
          id,
          user_id,
          organisation_id,
          access_token,
          refresh_token,
          expires_at
        `
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "platform",
        "tiktok"
      )
      .is(
        "organisation_id",
        null
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    fallbackError
  ) {
    throw new Error(
      `TikTok connection lookup failed: ${fallbackError.message}`
    );
  }

  if (
    !fallback
  ) {
    throw new Error(
      "TikTok is not connected for this organisation. Connect TikTok in Settings."
    );
  }

  return fallback as TikTokConnection;
}

// ============================================================
// TOKEN REFRESH
// ============================================================

async function refreshTikTokConnection({
  admin,
  connection,
}: {
  admin:
    any;

  connection:
    TikTokConnection;
}) {
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

  const refreshToken =
    cleanString(
      connection.refresh_token
    );

  if (
    !clientKey ||
    !clientSecret
  ) {
    throw new Error(
      "TikTok OAuth credentials are not configured."
    );
  }

  if (
    !refreshToken
  ) {
    throw new Error(
      "TikTok access has expired and no refresh token is available. Reconnect TikTok in Settings."
    );
  }

  const form =
    new URLSearchParams();

  form.set(
    "client_key",
    clientKey
  );

  form.set(
    "client_secret",
    clientSecret
  );

  form.set(
    "grant_type",
    "refresh_token"
  );

  form.set(
    "refresh_token",
    refreshToken
  );

  const response =
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
          form,

        cache:
          "no-store",
      }
    );

  const data =
    await safeJsonResponse(
      response
    );

  if (
    !response.ok ||
    !data?.access_token
  ) {
    throw new Error(
      `TikTok token refresh failed: ${getTikTokErrorMessage(
        data
      )}`
    );
  }

  const accessToken =
    cleanString(
      data.access_token
    );

  const rotatedRefreshToken =
    cleanString(
      data.refresh_token
    ) ||
    refreshToken;

  const expiresIn =
    Number(
      data.expires_in ??
        0
    );

  const expiresAt =
    expiresIn >
    0
      ? new Date(
          Date.now() +
            expiresIn *
              1000
        ).toISOString()
      : null;

  const updatePayload:
    Record<
      string,
      unknown
    > = {
    access_token:
      accessToken,

    refresh_token:
      rotatedRefreshToken,
  };

  if (
    expiresAt
  ) {
    updatePayload.expires_at =
      expiresAt;
  }

  const {
    error:
      updateError,
  } =
    await admin
      .from(
        "social_accounts"
      )
      .update(
        updatePayload
      )
      .eq(
        "id",
        connection.id
      );

  if (
    updateError
  ) {
    throw new Error(
      `TikTok token refreshed but could not be saved: ${updateError.message}`
    );
  }

  return {
    ...connection,

    access_token:
      accessToken,

    refresh_token:
      rotatedRefreshToken,

    expires_at:
      expiresAt ??
      connection.expires_at,
  } as TikTokConnection;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  const supabaseUrl =
    cleanString(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL
    );

  const supabaseAnonKey =
    cleanString(
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  const serviceRoleKey =
    cleanString(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Missing Supabase environment variables.",
      },
      {
        status:
          500,
      }
    );
  }

  const cookieStore =
    await cookies();

  const authClient =
    createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: any;
            }>
          ) {
            try {
              for (
                const {
                  name,
                  value,
                  options,
                } of
                cookiesToSet
              ) {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            } catch {
              // Route handlers can safely ignore cookie writes here.
            }
          },
        },
      }
    );

  const {
    data:
      userData,
    error:
      userError,
  } =
    await authClient
      .auth
      .getUser();

  if (
    userError ||
    !userData.user
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "You must be signed in to load TikTok creator settings.",
      },
      {
        status:
          401,
      }
    );
  }

  let body:
    any =
    {};

  try {
    body =
      await request.json();
  } catch {
    body =
      {};
  }

  const organisationId =
    cleanString(
      body?.organisationId
    ) ||
    null;

  const admin =
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

  try {
    let connection =
      await getTikTokConnection({
        admin,

        userId:
          userData.user.id,

        organisationId,
      });

    if (
      !connection.access_token
    ) {
      throw new Error(
        "TikTok connection is missing an access token. Reconnect TikTok in Settings."
      );
    }

    if (
      tokenExpired(
        connection.expires_at
      )
    ) {
      connection =
        await refreshTikTokConnection({
          admin,
          connection,
        });
    }

    const creatorResponse =
      await fetch(
        "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${connection.access_token}`,

            "Content-Type":
              "application/json; charset=UTF-8",
          },

          cache:
            "no-store",
        }
      );

    const creatorResult =
      await safeJsonResponse(
        creatorResponse
      );

    if (
      !creatorResponse.ok ||
      creatorResult?.error?.code !==
        "ok"
    ) {
      const code =
        cleanString(
          creatorResult?.error?.code
        );

      const message =
        getTikTokErrorMessage(
          creatorResult
        );

      const reconnect =
        code ===
          "access_token_invalid" ||
        code ===
          "scope_not_authorized";

      return NextResponse.json(
        {
          success:
            false,

          error:
            reconnect
              ? "TikTok needs to be reconnected before creator settings can be loaded."
              : message,

          code:
            code ||
            "tiktok_creator_info_failed",

          reconnect,

          details:
            creatorResult,
        },
        {
          status:
            reconnect
              ? 401
              : creatorResponse.status >=
                  400
                ? creatorResponse.status
                : 400,
        }
      );
    }

    const creator =
      creatorResult?.data ??
      {};

    const privacyLevelOptions =
      Array.isArray(
        creator
          .privacy_level_options
      )
        ? creator
            .privacy_level_options
            .map(
              cleanString
            )
            .filter(
              Boolean
            )
        : [];

    return NextResponse.json(
      {
        success:
          true,

        creator: {
          open_id:
            cleanString(
              creator
                .creator_username
            ) ||
            null,

          display_name:
            cleanString(
              creator
                .creator_nickname
            ) ||
            null,

          avatar_url:
            cleanString(
              creator
                .creator_avatar_url
            ) ||
            null,

          creator_username:
            cleanString(
              creator
                .creator_username
            ) ||
            null,

          creator_nickname:
            cleanString(
              creator
                .creator_nickname
            ) ||
            null,

          creator_avatar_url:
            cleanString(
              creator
                .creator_avatar_url
            ) ||
            null,

          privacy_level_options:
            privacyLevelOptions,

          comment_disabled:
            Boolean(
              creator
                .comment_disabled
            ),

          duet_disabled:
            Boolean(
              creator
                .duet_disabled
            ),

          stitch_disabled:
            Boolean(
              creator
                .stitch_disabled
            ),

          max_video_post_duration_sec:
            Number.isFinite(
              Number(
                creator
                  .max_video_post_duration_sec
              )
            )
              ? Number(
                  creator
                    .max_video_post_duration_sec
                )
              : null,
        },
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
  } catch (
    error
  ) {
    console.error(
      "[TIKTOK CREATOR INFO] Failed:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Could not load TikTok creator settings.",
      },
      {
        status:
          500,
      }
    );
  }
}
