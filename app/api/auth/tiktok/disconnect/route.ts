import {
  NextRequest,
  NextResponse,
} from "next/server";

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

type DisconnectBody = {
  organisationId?: string;
};

type TikTokRevokeError = {
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

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATE CURRENT TOTS-OS USER
    // ========================================================

    const supabase =
      await createServerSupabaseClient();

    const {
      data: {
        user,
      },

      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user?.id
    ) {
      console.error(
        "[TIKTOK DISCONNECT] Authentication failed:",
        authError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "You must be signed in to disconnect TikTok.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      (
        await request
          .json()
          .catch(
            () =>
              ({})
          )
      ) as DisconnectBody;

    const organisationId =
      cleanString(
        body.organisationId
      );

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

    // ========================================================
    // LOAD TIKTOK CONNECTION
    // ========================================================

    const {
      data:
        connection,

      error:
        connectionError,
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
            access_token
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
          "tiktok"
        )
        .maybeSingle();

    if (
      connectionError
    ) {
      console.error(
        "[TIKTOK DISCONNECT] Connection lookup failed:",
        connectionError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "TikTok connection could not be loaded.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // ALREADY DISCONNECTED
    // ========================================================

    if (
      !connection
    ) {
      return NextResponse.json(
        {
          success:
            true,

          message:
            "TikTok is already disconnected.",
        }
      );
    }

    const accessToken =
      cleanString(
        connection.access_token
      );

    // ========================================================
    // TIKTOK ENVIRONMENT
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

    // ========================================================
    // REVOKE TIKTOK ACCESS
    // ========================================================

    let revokeSucceeded =
      false;

    let revokeWarning:
      string | null =
      null;

    if (
      accessToken &&
      clientKey &&
      clientSecret
    ) {
      try {
        const revokeResponse =
          await fetch(
            "https://open.tiktokapis.com/v2/oauth/revoke/",
            {
              method:
                "POST",

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

                    token:
                      accessToken,
                  }
                ),

              cache:
                "no-store",
            }
          );

        if (
          revokeResponse.ok
        ) {
          revokeSucceeded =
            true;

          console.log(
            "[TIKTOK DISCONNECT] TikTok access revoked successfully:",
            {
              userId:
                user.id,

              organisationId,
            }
          );
        } else {
          const revokeData =
            (
              await revokeResponse
                .json()
                .catch(
                  () =>
                    ({})
                )
            ) as TikTokRevokeError;

          revokeWarning =
            revokeData
              .error_description ||
            revokeData
              .error ||
            `TikTok revoke returned HTTP ${revokeResponse.status}.`;

          console.warn(
            "[TIKTOK DISCONNECT] TikTok revoke failed:",
            {
              status:
                revokeResponse.status,

              response:
                revokeData,
            }
          );
        }
      } catch (
        revokeError:
          unknown
      ) {
        revokeWarning =
          revokeError instanceof
            Error
            ? revokeError.message
            : "TikTok token revocation failed.";

        console.warn(
          "[TIKTOK DISCONNECT] TikTok revoke request failed:",
          revokeError
        );
      }
    } else {
      revokeWarning =
        !accessToken
          ? "The TikTok connection had no access token to revoke."
          : "TikTok API credentials are not configured.";

      console.warn(
        "[TIKTOK DISCONNECT] Skipping TikTok revoke:",
        {
          hasAccessToken:
            Boolean(
              accessToken
            ),

          hasClientKey:
            Boolean(
              clientKey
            ),

          hasClientSecret:
            Boolean(
              clientSecret
            ),
        }
      );
    }

    // ========================================================
    // DELETE LOCAL CONNECTION
    // ========================================================

    const {
      data:
        deletedRows,

      error:
        deleteError,
    } =
      await supabase
        .from(
          "social_accounts"
        )
        .delete()
        .eq(
          "id",
          connection.id
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
          "tiktok"
        )
        .select(
          "id"
        );

    if (
      deleteError
    ) {
      console.error(
        "[TIKTOK DISCONNECT] Database delete failed:",
        deleteError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "TikTok was disconnected from TikTok, but the TOTS-OS connection could not be removed.",

          revokeSucceeded,
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !deletedRows ||
      deletedRows.length ===
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "The TikTok connection could not be removed.",

          revokeSucceeded,
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[TIKTOK DISCONNECT] TikTok disconnected:",
      {
        userId:
          user.id,

        organisationId,

        revokeSucceeded,

        revokeWarning,
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        revoked:
          revokeSucceeded,

        warning:
          revokeWarning,

        message:
          revokeSucceeded
            ? "TikTok disconnected successfully."
            : "TikTok was removed from TOTS-OS.",
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TIKTOK DISCONNECT] Unexpected error:",
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
            : "Unable to disconnect TikTok.",
      },
      {
        status:
          500,
      }
    );
  }
}