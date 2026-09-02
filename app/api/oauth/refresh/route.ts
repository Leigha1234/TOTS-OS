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
// TYPES
// ============================================================

type RefreshRequestBody = {
  platform?: string;
  refresh_token?: string;
  refreshToken?: string;
  userId?: string;
  organisationId?: string;
};

type TikTokRefreshResponse = {
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

function normalisePlatform(
  value:
    unknown
): string {
  const platform =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    platform ===
    "tik_tok"
  ) {
    return "tiktok";
  }

  return platform;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATE TOTS-OS USER
    // ========================================================

    const supabase =
      await createServerSupabaseClient();

    const {
      data: {
        user,
      },

      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user?.id
    ) {
      console.error(
        "[SOCIAL REFRESH] Authentication failed:",
        userError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "You must be signed in.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    const body =
      (
        await request
          .json()
          .catch(
            () => ({})
          )
      ) as
        RefreshRequestBody;

    const platform =
      normalisePlatform(
        body.platform
      );

    const requestedUserId =
      cleanString(
        body.userId
      );

    const organisationId =
      cleanString(
        body.organisationId
      );

    const suppliedRefreshToken =
      cleanString(
        body.refresh_token
      ) ||
      cleanString(
        body.refreshToken
      );

    if (
      !platform
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Platform is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Organisation ID is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // Never trust a different user ID supplied by the browser.

    if (
      requestedUserId &&
      requestedUserId !==
        user.id
    ) {
      console.error(
        "[SOCIAL REFRESH] User mismatch:",
        {
          authenticatedUser:
            user.id,

          requestedUser:
            requestedUserId,
        }
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "User verification failed.",
        },
        {
          status:
            403,
        }
      );
    }

    // ========================================================
    // SERVER SUPABASE
    // ========================================================

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
      console.error(
        "[SOCIAL REFRESH] Supabase server configuration missing."
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Server configuration is incomplete.",
        },
        {
          status:
            500,
        }
      );
    }

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
    // LOAD CONNECTION
    // ========================================================

    const {
      data:
        connection,

      error:
        connectionError,
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
    access_token,
    refresh_token,
    expires_at
  `
)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "platform",
          platform
        )
        .maybeSingle();

    if (
      connectionError
    ) {
      console.error(
        "[SOCIAL REFRESH] Connection lookup failed:",
        connectionError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Unable to load the social connection.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !connection
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Social account connection was not found.",
        },
        {
          status:
            404,
        }
      );
    }

    // ========================================================
    // TIKTOK
    // ========================================================

    if (
      platform ===
      "tiktok"
    ) {
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
          connection
            .refresh_token
        ) ||
        suppliedRefreshToken;

      if (
        !clientKey ||
        !clientSecret
      ) {
        console.error(
          "[SOCIAL REFRESH] TikTok credentials missing."
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              "TikTok is not configured correctly.",
          },
          {
            status:
              500,
          }
        );
      }

      if (
        !refreshToken
      ) {
        console.error(
          "[SOCIAL REFRESH] TikTok refresh token missing."
        );

        return NextResponse.json(
          {
            success:
              false,

            reconnectRequired:
              true,

            error:
              "TikTok needs to be reconnected.",
          },
          {
            status:
              400,
          }
        );
      }

      // ======================================================
      // REFRESH TIKTOK TOKEN
      // ======================================================

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
        "grant_type",
        "refresh_token"
      );

      tokenBody.set(
        "refresh_token",
        refreshToken
      );

      console.log(
        "[SOCIAL REFRESH] Refreshing TikTok token:",
        {
          userId:
            user.id,

          organisationId,

          connectionId:
            connection.id,

          hasRefreshToken:
            true,
        }
      );

      const refreshResponse =
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

      const refreshData =
        (
          await refreshResponse
            .json()
            .catch(
              () => ({})
            )
        ) as
          TikTokRefreshResponse;

      if (
        !refreshResponse.ok ||
        !refreshData
          .access_token
      ) {
        console.error(
          "[SOCIAL REFRESH] TikTok refresh failed:",
          {
            status:
              refreshResponse.status,

            error:
              refreshData.error,

            description:
              refreshData
                .error_description,

            logId:
              refreshData.log_id,
          }
        );

        return NextResponse.json(
          {
            success:
              false,

            reconnectRequired:
              true,

            error:
              refreshData
                .error_description ||
              refreshData
                .error ||
              "TikTok needs to be reconnected.",
          },
          {
            status:
              400,
          }
        );
      }

      // ======================================================
      // EXPIRY
      // ======================================================

      const expiresIn =
        Number(
          refreshData
            .expires_in ||
          86400
        );

      const expiresAt =
        new Date(
          Date.now() +
          expiresIn *
            1000
        ).toISOString();

      const newRefreshToken =
        cleanString(
          refreshData
            .refresh_token
        ) ||
        refreshToken;

      const now =
        new Date()
          .toISOString();

      // ======================================================
      // UPDATE DATABASE
      // ======================================================

      const {
        data:
          updatedConnection,

        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "social_accounts"
          )
          .update(
            {
              access_token:
                refreshData
                  .access_token,

              refresh_token:
                newRefreshToken,

              expires_at:
                expiresAt,

              platform_user_id:
                cleanString(
                  refreshData
                    .open_id
                ) ||
                connection
                  .platform_user_id,

              updated_at:
                now,
            }
          )
          .eq(
            "id",
            connection.id
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
          .single();

      if (
        updateError ||
        !updatedConnection
      ) {
        console.error(
          "[SOCIAL REFRESH] TikTok database update failed:",
          updateError
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              "TikTok refreshed but the connection could not be updated.",
          },
          {
            status:
              500,
          }
        );
      }

      console.log(
        "[SOCIAL REFRESH] TikTok refreshed successfully:",
        {
          connectionId:
            updatedConnection.id,

          expiresAt:
            updatedConnection
              .expires_at,

          updatedAt:
            updatedConnection
              .updated_at,
        }
      );

      return NextResponse.json(
        {
          success:
            true,

          platform:
            "tiktok",

          reconnectRequired:
            false,

          account: {
            id:
              updatedConnection.id,

            platform:
              updatedConnection
                .platform,

            platformUserId:
              updatedConnection
                .platform_user_id,

            displayName:
              updatedConnection
                .display_name,

            expiresAt:
              updatedConnection
                .expires_at,

            updatedAt:
              updatedConnection
                .updated_at,
          },
        }
      );
    }

    // ========================================================
    // OTHER PROVIDERS
    // ========================================================

    /*
     * TikTok is the provider currently handled by this endpoint.
     *
     * Meta / LinkedIn can be added here if their existing
     * refresh implementation is moved to this shared endpoint.
     */

    return NextResponse.json(
      {
        success:
          false,

        error:
          `Token refresh is not implemented for ${platform}.`,
      },
      {
        status:
          400,
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[SOCIAL REFRESH] Unexpected error:",
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
            : "Unable to refresh the social connection.",
      },
      {
        status:
          500,
      }
    );
  }
}