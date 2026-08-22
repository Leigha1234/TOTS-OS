// app/api/cron/publish/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

// ============================================================
// META
// ============================================================

const DEFAULT_META_GRAPH_VERSION = "v25.0";

// ============================================================
// TIKTOK FILE_UPLOAD LIMITS
// ============================================================

const TIKTOK_MIN_CHUNK_SIZE = 5_000_000;
const TIKTOK_MAX_CHUNK_SIZE = 64_000_000;

const TIKTOK_MAX_VIDEO_SIZE =
  4 * 1024 * 1024 * 1024;

// ============================================================
// TYPES
// ============================================================

type MetaConnection = {
  id: string;

  user_id: string;

  platform: string;

  access_token:
    | string
    | null;

  expires_at:
    | string
    | null;

  page_id:
    | string
    | null;

  page_name:
    | string
    | null;

  page_access_token:
    | string
    | null;

  instagram_business_account_id:
    | string
    | null;
};

// ============================================================
// HELPERS
// ============================================================

function getMetaGraphVersion() {
  const configured =
    process.env
      .META_GRAPH_API_VERSION
      ?.trim();

  if (configured) {
    return configured.startsWith("v")
      ? configured
      : `v${configured}`;
  }

  return DEFAULT_META_GRAPH_VERSION;
}

// ============================================================

function cleanString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================

function tokenExpired(
  expiresAt:
    | string
    | null
    | undefined
) {
  if (!expiresAt) {
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

  return (
    timestamp <=
    Date.now()
  );
}

// ============================================================
// META CONNECTION
// ============================================================

async function getMetaConnection({
  supabase,
  userId,
}: {
  supabase: any;

  userId: string;
}) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "social_accounts"
      )
      .select(
        `
          id,
          user_id,
          platform,
          access_token,
          expires_at,
          page_id,
          page_name,
          page_access_token,
          instagram_business_account_id
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
      .maybeSingle();

  if (error) {
    console.error(
      "[CRON META] Connection lookup failed:",
      error
    );

    throw new Error(
      `Meta connection lookup failed: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      "Meta is not connected. Reconnect Meta in Settings."
    );
  }

  const connection =
    data as unknown as
      MetaConnection;

  if (
    !connection.access_token
  ) {
    throw new Error(
      "Meta connection is missing its access token. Reconnect Meta in Settings."
    );
  }

  if (
    tokenExpired(
      connection.expires_at
    )
  ) {
    throw new Error(
      "Meta connection has expired. Reconnect Meta in Settings."
    );
  }

  return connection;
}

// ============================================================
// FACEBOOK PUBLISH
// ============================================================

async function publishFacebookPost({
  connection,
  message,
  mediaUrl,
}: {
  connection:
    MetaConnection;

  message:
    string;

  mediaUrl:
    string;
}) {
  if (
    !connection.page_id
  ) {
    throw new Error(
      "Facebook Page ID is missing. Reconnect Meta in Settings."
    );
  }

  if (
    !connection
      .page_access_token
  ) {
    throw new Error(
      "Facebook Page access token is missing. Reconnect Meta in Settings."
    );
  }

  const graphVersion =
    getMetaGraphVersion();

  // ==========================================================
  // FACEBOOK IMAGE POST
  // ==========================================================

  if (
    mediaUrl
  ) {
    const response =
      await fetch(
        `https://graph.facebook.com/${graphVersion}/${connection.page_id}/photos`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              url:
                mediaUrl,

              caption:
                message,

              published:
                true,

              access_token:
                connection
                  .page_access_token,
            }),

          cache:
            "no-store",
        }
      );

    const result =
      await safeJsonResponse(
        response
      );

    if (
      !response.ok
    ) {
      console.error(
        "[CRON META] Facebook image post failed:",
        result
      );

      throw new Error(
        `Facebook publish failed: ${
          getMetaErrorMessage(
            result
          )
        }`
      );
    }

    return {
      destination:
        "facebook",

      type:
        "image",

      id:
        result?.post_id ??
        result?.id ??
        null,

      response:
        result,
    };
  }

  // ==========================================================
  // FACEBOOK TEXT POST
  // ==========================================================

  const response =
    await fetch(
      `https://graph.facebook.com/${graphVersion}/${connection.page_id}/feed`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message,

            access_token:
              connection
                .page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    await safeJsonResponse(
      response
    );

  if (
    !response.ok
  ) {
    console.error(
      "[CRON META] Facebook text post failed:",
      result
    );

    throw new Error(
      `Facebook publish failed: ${
        getMetaErrorMessage(
          result
        )
      }`
    );
  }

  return {
    destination:
      "facebook",

    type:
      "text",

    id:
      result?.id ??
      null,

    response:
      result,
  };
}

// ============================================================
// INSTAGRAM PUBLISH
// ============================================================

async function publishInstagramPost({
  connection,
  message,
  mediaUrl,
}: {
  connection:
    MetaConnection;

  message:
    string;

  mediaUrl:
    string;
}) {
  if (
    !connection
      .instagram_business_account_id
  ) {
    throw new Error(
      "No Instagram Business or Creator account is linked to this Meta connection."
    );
  }

  if (
    !connection
      .page_access_token
  ) {
    throw new Error(
      "Instagram publishing token is missing. Reconnect Meta in Settings."
    );
  }

  if (
    !mediaUrl
  ) {
    throw new Error(
      "Instagram post is missing media_url."
    );
  }

  const graphVersion =
    getMetaGraphVersion();

  // ==========================================================
  // CREATE MEDIA CONTAINER
  // ==========================================================

  const containerResponse =
    await fetch(
      `https://graph.facebook.com/${graphVersion}/${connection.instagram_business_account_id}/media`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            image_url:
              mediaUrl,

            caption:
              message,

            access_token:
              connection
                .page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const containerData =
    await safeJsonResponse(
      containerResponse
    );

  if (
    !containerResponse.ok ||
    !containerData?.id
  ) {
    console.error(
      "[CRON META] Instagram media creation failed:",
      containerData
    );

    throw new Error(
      `Instagram media creation failed: ${
        getMetaErrorMessage(
          containerData
        )
      }`
    );
  }

  // ==========================================================
  // PUBLISH MEDIA CONTAINER
  // ==========================================================

  const publishResponse =
    await fetch(
      `https://graph.facebook.com/${graphVersion}/${connection.instagram_business_account_id}/media_publish`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            creation_id:
              containerData.id,

            access_token:
              connection
                .page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const publishData =
    await safeJsonResponse(
      publishResponse
    );

  if (
    !publishResponse.ok ||
    !publishData?.id
  ) {
    console.error(
      "[CRON META] Instagram publishing failed:",
      publishData
    );

    throw new Error(
      `Instagram publish failed: ${
        getMetaErrorMessage(
          publishData
        )
      }`
    );
  }

  return {
    destination:
      "instagram",

    type:
      "image",

    creationId:
      containerData.id,

    id:
      publishData.id,

    response:
      publishData,
  };
}

// ============================================================
// META ERROR MESSAGE
// ============================================================

function getMetaErrorMessage(
  value: any
) {
  return (
    value?.error?.message ||
    value?.message ||
    JSON.stringify(
      value
    ) ||
    "Unknown Meta error"
  );
}

// ============================================================
// CRON ENDPOINT
// ============================================================

export async function GET(
  request: Request
) {
  // ==========================================================
  // 1. VERIFY CRON REQUEST
  // ==========================================================

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    authHeader !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse(
      "Unauthorized",
      {
        status:
          401,
      }
    );
  }

  // ==========================================================
  // 2. SUPABASE
  // ==========================================================

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return NextResponse.json(
      {
        processed:
          0,

        error:
          "Missing Supabase environment variables",
      },
      {
        status:
          500,
      }
    );
  }

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

  const now =
    new Date()
      .toISOString();

  // ==========================================================
  // 3. FETCH DUE POSTS
  // ==========================================================

  const {
    data:
      queue,

    error:
      queueError,
  } =
    await supabase
      .from(
        "socials"
      )
      .select("*")
      .in(
        "status",
        [
          "scheduled",
          "processing",
        ]
      )
      .lte(
        "scheduled_for",
        now
      )
      .lt(
        "attempts",
        MAX_ATTEMPTS
      )
      .order(
        "scheduled_for",
        {
          ascending:
            true,
        }
      )
      .limit(
        20
      );

  if (
    queueError
  ) {
    console.error(
      "[CRON SOCIAL] Queue fetch error:",
      queueError
    );

    return NextResponse.json(
      {
        processed:
          0,

        error:
          queueError.message,
      },
      {
        status:
          500,
      }
    );
  }

  if (
    !queue ||
    queue.length ===
      0
  ) {
    return NextResponse.json({
      processed:
        0,
    });
  }

  let processed =
    0;

  // ==========================================================
  // 4. PROCESS QUEUE
  // ==========================================================

  for (
    const post of
    queue
  ) {
    const platform =
      cleanString(
        post.platform
      ).toLowerCase();

    let attempt =
      Number(
        post.attempts ??
        0
      );

    try {
      // ======================================================
      // TIKTOK STATUS CHECK
      // ======================================================

      if (
        platform ===
          "tiktok" &&
        post.status ===
          "processing" &&
        post.platform_post_id
      ) {
        const result =
          await checkTikTokPostStatus({
            supabase,

            post,
          });

        await supabase
          .from(
            "socials"
          )
          .update({
            status:
              result.status,

            posted_at:
              result.status ===
              "published"
                ? new Date()
                    .toISOString()
                : null,

            platform_post_id:
              result.platformPostId ??
              post.platform_post_id,

            platform_response:
              result.response ??
              null,

            last_error:
              result.error ??
              null,

            error:
              result.error ??
              null,

            last_attempt_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        processed +=
          1;

        continue;
      }

      // ======================================================
      // NEW PUBLISHING ATTEMPT
      // ======================================================

      attempt += 1;

      await supabase
        .from(
          "socials"
        )
        .update({
          attempts:
            attempt,

          last_attempt_at:
            new Date()
              .toISOString(),

          last_error:
            null,

          error:
            null,
        })
        .eq(
          "id",
          post.id
        );

      const fullMessage =
        [
          post.caption ||
            "",

          post.hashtags ||
            "",
        ]
          .filter(
            Boolean
          )
          .join(
            "\n\n"
          );

      const mediaUrl =
        cleanString(
          post.media_url
        );

      // ======================================================
      // TIKTOK
      // ======================================================

      if (
        platform ===
        "tiktok"
      ) {
        const result =
          await publishTikTokPost({
            supabase,

            post,

            fullMessage,
          });

        await supabase
          .from(
            "socials"
          )
          .update({
            status:
              result.status,

            platform_post_id:
              result.platformPostId ??
              null,

            platform_response:
              result.response ??
              null,

            last_error:
              result.error ??
              null,

            error:
              result.error ??
              null,

            posted_at:
              result.status ===
              "published"
                ? new Date()
                    .toISOString()
                : null,

            last_attempt_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        processed +=
          1;

        continue;
      }

      // ======================================================
      // META / FACEBOOK / INSTAGRAM
      // ======================================================

      if (
        platform ===
          "meta" ||
        platform ===
          "facebook" ||
        platform ===
          "instagram"
      ) {
        if (
          !post.user_id
        ) {
          throw new Error(
            "Social post has no user_id."
          );
        }

        const connection =
          await getMetaConnection({
            supabase,

            userId:
              post.user_id,
          });

        // ====================================================
        // DESTINATION RULES
        //
        // facebook:
        //   Facebook only
        //
        // instagram:
        //   Instagram only
        //
        // meta:
        //   Facebook always.
        //   Instagram too when media exists and a linked
        //   Instagram professional account is available.
        // ====================================================

        const publishFacebook =
          platform ===
            "facebook" ||
          platform ===
            "meta";

        const publishInstagram =
          platform ===
            "instagram" ||
          (
            platform ===
              "meta" &&
            Boolean(
              mediaUrl
            ) &&
            Boolean(
              connection
                .instagram_business_account_id
            )
          );

        const results: Record<
          string,
          unknown
        > = {};

        const errors: Array<{
          destination:
            string;

          error:
            string;
        }> = [];

        // ====================================================
        // FACEBOOK
        // ====================================================

        if (
          publishFacebook
        ) {
          try {
            const result =
              await publishFacebookPost({
                connection,

                message:
                  fullMessage,

                mediaUrl,
              });

            results.facebook =
              result;
          } catch (
            error
          ) {
            const message =
              error instanceof
                Error
                ? error.message
                : "Facebook publishing failed.";

            console.error(
              "[CRON META] Facebook publish failed:",
              message
            );

            errors.push({
              destination:
                "facebook",

              error:
                message,
            });
          }
        }

        // ====================================================
        // INSTAGRAM
        // ====================================================

        if (
          publishInstagram
        ) {
          try {
            const result =
              await publishInstagramPost({
                connection,

                message:
                  fullMessage,

                mediaUrl,
              });

            results.instagram =
              result;
          } catch (
            error
          ) {
            const message =
              error instanceof
                Error
                ? error.message
                : "Instagram publishing failed.";

            console.error(
              "[CRON META] Instagram publish failed:",
              message
            );

            errors.push({
              destination:
                "instagram",

              error:
                message,
            });
          }
        }

        // ====================================================
        // EVERYTHING FAILED
        // ====================================================

        if (
          Object.keys(
            results
          ).length ===
            0
        ) {
          const message =
            errors
              .map(
                (
                  item
                ) =>
                  `${item.destination}: ${item.error}`
              )
              .join(
                " | "
              ) ||
            "Meta publishing failed.";

          throw new Error(
            message
          );
        }

        // ====================================================
        // GET PLATFORM POST ID
        // ====================================================

        const facebookResult =
          results.facebook as
            | {
                id?:
                  string;

                response?: {
                  id?:
                    string;

                  post_id?:
                    string;
                };
              }
            | undefined;

        const instagramResult =
          results.instagram as
            | {
                id?:
                  string;
              }
            | undefined;

        const platformPostId =
          facebookResult
            ?.id ||
          facebookResult
            ?.response
            ?.post_id ||
          facebookResult
            ?.response
            ?.id ||
          instagramResult
            ?.id ||
          null;

        // ====================================================
        // PARTIAL FAILURE
        //
        // We still mark the queued item published because at
        // least one requested platform succeeded.
        //
        // Any secondary failure remains visible in last_error.
        // ====================================================

        const warning =
          errors.length >
          0
            ? errors
                .map(
                  (
                    item
                  ) =>
                    `${item.destination}: ${item.error}`
                )
                .join(
                  " | "
                )
            : null;

        await supabase
          .from(
            "socials"
          )
          .update({
            status:
              "published",

            posted_at:
              new Date()
                .toISOString(),

            platform_post_id:
              platformPostId,

            platform_response: {
              results,

              errors,

              facebook:
                publishFacebook,

              instagram:
                publishInstagram,
            },

            last_error:
              warning,

            error:
              warning,

            last_attempt_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        console.log(
          "[CRON META] ✅ Meta publishing complete:",
          {
            postId:
              post.id,

            userId:
              post.user_id,

            pageId:
              connection.page_id,

            pageName:
              connection.page_name,

            instagramBusinessAccountId:
              connection
                .instagram_business_account_id,

            publishFacebook,

            publishInstagram,

            results,

            errors,
          }
        );

        processed +=
          1;

        continue;
      }

      // ======================================================
      // PINTEREST
      //
      // Pinterest still uses the legacy social_tokens table
      // until its OAuth connection is migrated.
      // ======================================================

      if (
        platform ===
        "pinterest"
      ) {
        const {
          data:
            dynamicToken,

          error:
            tokenError,
        } =
          await supabase
            .from(
              "social_tokens"
            )
            .select(
              "access_token, platform_account_id"
            )
            .eq(
              "user_id",
              post.user_id
            )
            .eq(
              "platform",
              "pinterest"
            )
            .maybeSingle();

        if (
          tokenError
        ) {
          throw new Error(
            `Pinterest token lookup failed: ${tokenError.message}`
          );
        }

        if (
          !dynamicToken
            ?.access_token
        ) {
          throw new Error(
            "Missing Pinterest social token"
          );
        }

        const token =
          dynamicToken
            .access_token;

        const accountId =
          dynamicToken
            .platform_account_id;

        if (
          !accountId
        ) {
          throw new Error(
            "Missing Pinterest board ID"
          );
        }

        if (
          !mediaUrl
        ) {
          throw new Error(
            "Pinterest post is missing media_url"
          );
        }

        const response =
          await fetch(
            "https://api.pinterest.com/v5/pins",
            {
              method:
                "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  link:
                    "https://tots-os.co.uk",

                  title:
                    "Shared via TOTS-OS",

                  description:
                    fullMessage,

                  board_id:
                    accountId,

                  media_source: {
                    source_type:
                      "image_url",

                    url:
                      mediaUrl,
                  },
                }),
            }
          );

        const result =
          await safeJsonResponse(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Pinterest publish failed: ${JSON.stringify(
              result
            )}`
          );
        }

        await supabase
          .from(
            "socials"
          )
          .update({
            status:
              "published",

            posted_at:
              new Date()
                .toISOString(),

            platform_post_id:
              result?.id ??
              null,

            platform_response:
              result ??
              null,

            last_error:
              null,

            error:
              null,
          })
          .eq(
            "id",
            post.id
          );

        processed +=
          1;

        continue;
      }

      // ======================================================
      // LINKEDIN
      //
      // Don't let an accidental LinkedIn queue item fall into
      // the old token system.
      // ======================================================

      if (
        platform ===
        "linkedin"
      ) {
        throw new Error(
          "LinkedIn scheduled publishing is not implemented yet."
        );
      }

      throw new Error(
        `Unsupported platform: ${
          platform ||
          "unknown"
        }`
      );
    } catch (
      error
    ) {
      const message =
        error instanceof
          Error
          ? error.message
          : String(
              error
            );

      console.error(
        `[CRON SOCIAL] Publish error for post ${post.id}:`,
        error
      );

      // ======================================================
      // FAILURE STATE
      // ======================================================

      /*
       * New publishing attempts were already incremented above.
       *
       * Processing TikTok status checks were not.
       */

      const effectiveAttempt =
        post.status ===
        "processing"
          ? Number(
              post.attempts ??
              0
            )
          : attempt;

      const finalFailure =
        effectiveAttempt >=
        MAX_ATTEMPTS;

      await supabase
        .from(
          "socials"
        )
        .update({
          status:
            finalFailure
              ? "failed"
              : post.status ===
                  "processing"
                ? "processing"
                : "scheduled",

          last_error:
            message,

          error:
            message,

          last_attempt_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          post.id
        );

      processed +=
        1;
    }
  }

  return NextResponse.json({
    processed,
  });
}

// ============================================================
// TIKTOK DIRECT POST
// ============================================================

async function publishTikTokPost({
  supabase,
  post,
  fullMessage,
}: {
  supabase:
    any;

  post:
    any;

  fullMessage:
    string;
}) {
  // ==========================================================
  // VALIDATE POST
  // ==========================================================

  if (
    !post.user_id
  ) {
    throw new Error(
      "TikTok post has no user_id"
    );
  }

  if (
    !post.media_url
  ) {
    throw new Error(
      "TikTok video is missing media_url"
    );
  }

  // ==========================================================
  // GET TIKTOK CONNECTION
  // ==========================================================

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
          access_token,
          refresh_token,
          expires_at,
          platform_user_id
        `
      )
      .eq(
        "user_id",
        post.user_id
      )
      .eq(
        "platform",
        "tiktok"
      )
      .maybeSingle();

  if (
    connectionError ||
    !connection
      ?.access_token
  ) {
    console.error(
      "[TIKTOK] Connection lookup failed:",
      {
        connectionError,

        hasConnection:
          Boolean(
            connection
          ),
      }
    );

    throw new Error(
      "TikTok account is not connected"
    );
  }

  if (
    tokenExpired(
      connection.expires_at
    )
  ) {
    throw new Error(
      "TikTok access token has expired. Reconnect TikTok."
    );
  }

  const accessToken =
    connection
      .access_token;

  // ==========================================================
  // STEP 1
  // QUERY CREATOR INFO
  // ==========================================================

  const creatorResponse =
    await fetch(
      "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json; charset=UTF-8",
        },

        cache:
          "no-store",
      }
    );

  const creatorData =
    await safeJsonResponse(
      creatorResponse
    );

  console.log(
    "[TIKTOK] Creator info response:",
    creatorData
  );

  if (
    !creatorResponse.ok ||
    creatorData?.error
      ?.code !==
      "ok"
  ) {
    throw new Error(
      `TikTok creator info failed: ${JSON.stringify(
        creatorData
      )}`
    );
  }

  const privacyOptions:
    | string[]
    | undefined =
    creatorData
      ?.data
      ?.privacy_level_options;

  if (
    !privacyOptions ||
    privacyOptions.length ===
      0
  ) {
    throw new Error(
      "TikTok did not return any allowed privacy options"
    );
  }

  const privacyLevel =
    privacyOptions.includes(
      "SELF_ONLY"
    )
      ? "SELF_ONLY"
      : privacyOptions[0];

  console.log(
    "[TIKTOK] Selected privacy level:",
    privacyLevel
  );

  // ==========================================================
  // STEP 2
  // DOWNLOAD VIDEO
  // ==========================================================

  console.log(
    "[TIKTOK] Downloading video:",
    post.media_url
  );

  const videoResponse =
    await fetch(
      post.media_url,
      {
        cache:
          "no-store",
      }
    );

  if (
    !videoResponse.ok
  ) {
    throw new Error(
      `Could not download video from storage: HTTP ${videoResponse.status}`
    );
  }

  const videoArrayBuffer =
    await videoResponse
      .arrayBuffer();

  const videoBytes =
    new Uint8Array(
      videoArrayBuffer
    );

  const videoSize =
    videoBytes
      .byteLength;

  if (
    !videoSize
  ) {
    throw new Error(
      "Downloaded TikTok video is empty"
    );
  }

  if (
    videoSize >
    TIKTOK_MAX_VIDEO_SIZE
  ) {
    throw new Error(
      "TikTok video exceeds the 4 GB upload limit"
    );
  }

  const contentType =
    getTikTokVideoMimeType({
      mediaUrl:
        post.media_url,

      responseContentType:
        videoResponse
          .headers
          .get(
            "content-type"
          ),
    });

  console.log(
    "[TIKTOK] Video downloaded:",
    {
      videoSize,

      contentType,
    }
  );

  // ==========================================================
  // STEP 3
  // CHUNKS
  // ==========================================================

  const {
    chunkSize,

    totalChunkCount,
  } =
    calculateTikTokChunks(
      videoSize
    );

  console.log(
    "[TIKTOK] Upload chunks:",
    {
      videoSize,

      chunkSize,

      totalChunkCount,
    }
  );

  // ==========================================================
  // STEP 4
  // INITIALISE FILE UPLOAD
  // ==========================================================

  const initResponse =
    await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json; charset=UTF-8",
        },

        body:
          JSON.stringify({
            post_info: {
              title:
                fullMessage.substring(
                  0,
                  2200
                ),

              privacy_level:
                privacyLevel,

              disable_comment:
                Boolean(
                  creatorData
                    ?.data
                    ?.comment_disabled
                ),

              disable_duet:
                Boolean(
                  creatorData
                    ?.data
                    ?.duet_disabled
                ),

              disable_stitch:
                Boolean(
                  creatorData
                    ?.data
                    ?.stitch_disabled
                ),

              video_cover_timestamp_ms:
                0,
            },

            source_info: {
              source:
                "FILE_UPLOAD",

              video_size:
                videoSize,

              chunk_size:
                chunkSize,

              total_chunk_count:
                totalChunkCount,
            },
          }),

        cache:
          "no-store",
      }
    );

  const initData =
    await safeJsonResponse(
      initResponse
    );

  console.log(
    "[TIKTOK] FILE_UPLOAD init response:",
    {
      status:
        initResponse.status,

      ok:
        initResponse.ok,

      data:
        initData,
    }
  );

  if (
    !initResponse.ok ||
    initData?.error
      ?.code !==
      "ok"
  ) {
    throw new Error(
      `TikTok publish init failed: ${JSON.stringify(
        initData
      )}`
    );
  }

  const publishId =
    initData
      ?.data
      ?.publish_id;

  const uploadUrl =
    initData
      ?.data
      ?.upload_url;

  if (
    !publishId
  ) {
    throw new Error(
      `TikTok did not return a publish_id: ${JSON.stringify(
        initData
      )}`
    );
  }

  if (
    !uploadUrl
  ) {
    throw new Error(
      `TikTok did not return an upload_url for FILE_UPLOAD: ${JSON.stringify(
        initData
      )}`
    );
  }

  // ==========================================================
  // STEP 5
  // UPLOAD BINARY
  // ==========================================================

  await uploadVideoToTikTok({
    uploadUrl,

    videoBytes,

    videoSize,

    chunkSize,

    totalChunkCount,

    contentType,
  });

  console.log(
    "[TIKTOK] Video upload complete:",
    {
      publishId,

      videoSize,
    }
  );

  return {
    status:
      "processing",

    platformPostId:
      publishId,

    response: {
      ...initData,

      upload: {
        transfer_method:
          "FILE_UPLOAD",

        video_size:
          videoSize,

        chunk_size:
          chunkSize,

        total_chunk_count:
          totalChunkCount,

        content_type:
          contentType,
      },

      creator: {
        username:
          creatorData
            ?.data
            ?.creator_username ??
          null,

        nickname:
          creatorData
            ?.data
            ?.creator_nickname ??
          null,

        privacy_level:
          privacyLevel,

        allowed_privacy_levels:
          privacyOptions,
      },
    },

    error:
      null,
  };
}

// ============================================================
// TIKTOK VIDEO UPLOAD
// ============================================================

async function uploadVideoToTikTok({
  uploadUrl,
  videoBytes,
  videoSize,
  chunkSize,
  totalChunkCount,
  contentType,
}: {
  uploadUrl:
    string;

  videoBytes:
    Uint8Array;

  videoSize:
    number;

  chunkSize:
    number;

  totalChunkCount:
    number;

  contentType:
    string;
}) {
  for (
    let chunkIndex =
      0;
    chunkIndex <
    totalChunkCount;
    chunkIndex +=
      1
  ) {
    const startByte =
      chunkIndex *
      chunkSize;

    const isLastChunk =
      chunkIndex ===
      totalChunkCount -
        1;

    const endExclusive =
      isLastChunk
        ? videoSize
        : Math.min(
            startByte +
              chunkSize,

            videoSize
          );

    if (
      startByte >=
      videoSize
    ) {
      throw new Error(
        `Invalid TikTok upload chunk start: ${startByte}/${videoSize}`
      );
    }

    const lastByte =
      endExclusive -
      1;

    const chunk =
      videoBytes.slice(
        startByte,
        endExclusive
      );

    const chunkLength =
      chunk.byteLength;

    if (
      chunkLength <=
      0
    ) {
      throw new Error(
        `TikTok upload chunk ${
          chunkIndex +
          1
        } is empty`
      );
    }

    console.log(
      "[TIKTOK] Uploading chunk:",
      {
        chunk:
          chunkIndex +
          1,

        totalChunkCount,

        startByte,

        lastByte,

        chunkLength,

        videoSize,

        contentRange:
          `bytes ${startByte}-${lastByte}/${videoSize}`,
      }
    );

    const blob =
      new Blob(
        [
          chunk,
        ],
        {
          type:
            contentType,
        }
      );

    const uploadResponse =
      await fetch(
        uploadUrl,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              contentType,

            "Content-Length":
              String(
                chunkLength
              ),

            "Content-Range":
              `bytes ${startByte}-${lastByte}/${videoSize}`,
          },

          body:
            blob,
        }
      );

    const uploadText =
      await uploadResponse
        .text();

    console.log(
      "[TIKTOK] Chunk response:",
      {
        chunk:
          chunkIndex +
          1,

        totalChunkCount,

        status:
          uploadResponse.status,

        ok:
          uploadResponse.ok,

        response:
          uploadText ||
          null,
      }
    );

    if (
      !uploadResponse.ok
    ) {
      throw new Error(
        `TikTok video upload failed on chunk ${
          chunkIndex +
          1
        }/${totalChunkCount}: HTTP ${
          uploadResponse.status
        } ${
          uploadText ||
          ""
        }`
      );
    }

    if (
      !isLastChunk &&
      uploadResponse.status !==
        206
    ) {
      console.warn(
        "[TIKTOK] Intermediate chunk returned unexpected status:",
        {
          status:
            uploadResponse.status,

          chunk:
            chunkIndex +
            1,

          totalChunkCount,
        }
      );
    }

    if (
      isLastChunk &&
      uploadResponse.status !==
        201
    ) {
      console.warn(
        "[TIKTOK] Final chunk returned unexpected status:",
        {
          status:
            uploadResponse.status,

          chunk:
            chunkIndex +
            1,

          totalChunkCount,
        }
      );
    }
  }
}

// ============================================================
// TIKTOK STATUS CHECK
// ============================================================

async function checkTikTokPostStatus({
  supabase,
  post,
}: {
  supabase:
    any;

  post:
    any;
}) {
  if (
    !post.user_id
  ) {
    throw new Error(
      "TikTok post has no user_id"
    );
  }

  if (
    !post.platform_post_id
  ) {
    throw new Error(
      "TikTok processing post has no publish_id"
    );
  }

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
          access_token,
          expires_at,
          platform_user_id
        `
      )
      .eq(
        "user_id",
        post.user_id
      )
      .eq(
        "platform",
        "tiktok"
      )
      .maybeSingle();

  if (
    connectionError ||
    !connection
      ?.access_token
  ) {
    throw new Error(
      "TikTok account is not connected"
    );
  }

  if (
    tokenExpired(
      connection.expires_at
    )
  ) {
    throw new Error(
      "TikTok access token has expired. Reconnect TikTok."
    );
  }

  const response =
    await fetch(
      "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${connection.access_token}`,

          "Content-Type":
            "application/json; charset=UTF-8",
        },

        body:
          JSON.stringify({
            publish_id:
              post.platform_post_id,
          }),

        cache:
          "no-store",
      }
    );

  const data =
    await safeJsonResponse(
      response
    );

  console.log(
    "[TIKTOK] Publish status:",
    {
      postId:
        post.id,

      publishId:
        post.platform_post_id,

      httpStatus:
        response.status,

      response:
        data,
    }
  );

  if (
    !response.ok ||
    data?.error
      ?.code !==
      "ok"
  ) {
    throw new Error(
      `TikTok status check failed: ${JSON.stringify(
        data
      )}`
    );
  }

  const tikTokStatus =
    data
      ?.data
      ?.status;

  // ==========================================================
  // COMPLETE
  // ==========================================================

  if (
    tikTokStatus ===
    "PUBLISH_COMPLETE"
  ) {
    const postIds =
      data
        ?.data
        ?.publicaly_available_post_id ??
      data
        ?.data
        ?.publicly_available_post_id;

    const actualPostId =
      Array.isArray(
        postIds
      ) &&
      postIds.length >
        0
        ? String(
            postIds[0]
          )
        : post
            .platform_post_id;

    return {
      status:
        "published",

      response:
        data,

      platformPostId:
        actualPostId,

      error:
        null,
    };
  }

  // ==========================================================
  // FAILED
  // ==========================================================

  if (
    tikTokStatus ===
    "FAILED"
  ) {
    const failReason =
      data
        ?.data
        ?.fail_reason ||
      "TikTok publishing failed";

    return {
      status:
        "failed",

      response:
        data,

      platformPostId:
        post
          .platform_post_id,

      error:
        failReason,
    };
  }

  // ==========================================================
  // STILL PROCESSING
  // ==========================================================

  return {
    status:
      "processing",

    response:
      data,

    platformPostId:
      post
        .platform_post_id,

    error:
      null,
  };
}

// ============================================================
// CHUNK CALCULATION
// ============================================================

function calculateTikTokChunks(
  videoSize:
    number
) {
  if (
    !Number.isFinite(
      videoSize
    ) ||
    videoSize <=
      0
  ) {
    throw new Error(
      `Invalid TikTok video size: ${videoSize}`
    );
  }

  if (
    videoSize <=
    TIKTOK_MAX_CHUNK_SIZE
  ) {
    return {
      chunkSize:
        videoSize,

      totalChunkCount:
        1,
    };
  }

  const totalChunkCount =
    Math.ceil(
      videoSize /
      TIKTOK_MAX_CHUNK_SIZE
    );

  const chunkSize =
    Math.floor(
      videoSize /
      totalChunkCount
    );

  if (
    chunkSize <
    TIKTOK_MIN_CHUNK_SIZE
  ) {
    throw new Error(
      `Unable to calculate valid TikTok upload chunks. Calculated chunk size ${chunkSize} bytes is below the minimum.`
    );
  }

  if (
    chunkSize >
    TIKTOK_MAX_CHUNK_SIZE
  ) {
    throw new Error(
      `Unable to calculate valid TikTok upload chunks. Calculated chunk size ${chunkSize} bytes exceeds the maximum.`
    );
  }

  const finalChunkSize =
    videoSize -
    chunkSize *
      (
        totalChunkCount -
        1
      );

  if (
    finalChunkSize >
    TIKTOK_MAX_CHUNK_SIZE
  ) {
    throw new Error(
      `Unable to calculate valid TikTok final chunk. Final chunk would be ${finalChunkSize} bytes.`
    );
  }

  if (
    finalChunkSize <
    TIKTOK_MIN_CHUNK_SIZE
  ) {
    throw new Error(
      `Unable to calculate valid TikTok final chunk. Final chunk would be ${finalChunkSize} bytes.`
    );
  }

  return {
    chunkSize,

    totalChunkCount,
  };
}

// ============================================================
// MIME TYPE
// ============================================================

function getTikTokVideoMimeType({
  mediaUrl,
  responseContentType,
}: {
  mediaUrl:
    string;

  responseContentType:
    | string
    | null;
}) {
  const headerMime =
    responseContentType
      ?.split(
        ";"
      )[0]
      ?.trim()
      ?.toLowerCase();

  if (
    headerMime ===
      "video/mp4" ||
    headerMime ===
      "video/quicktime" ||
    headerMime ===
      "video/webm"
  ) {
    return headerMime;
  }

  const cleanUrl =
    mediaUrl
      .toLowerCase()
      .split(
        "?"
      )[0];

  if (
    cleanUrl.endsWith(
      ".mov"
    )
  ) {
    return "video/quicktime";
  }

  if (
    cleanUrl.endsWith(
      ".webm"
    )
  ) {
    return "video/webm";
  }

  if (
    cleanUrl.endsWith(
      ".mp4"
    ) ||
    cleanUrl.endsWith(
      ".m4v"
    )
  ) {
    return "video/mp4";
  }

  throw new Error(
    `Unsupported TikTok video type. TikTok FILE_UPLOAD supports MP4, MOV and WebM. Received: ${
      responseContentType ||
      mediaUrl
    }`
  );
}

// ============================================================
// SAFE JSON PARSER
// ============================================================

async function safeJsonResponse(
  response:
    Response
): Promise<any> {
  const text =
    await response
      .text();

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