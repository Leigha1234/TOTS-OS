// app/api/cron/publish/route.ts

import {
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

const MAX_ATTEMPTS =
  5;

const DEFAULT_META_GRAPH_VERSION =
  "v25.0";

// ============================================================
// TIKTOK FILE UPLOAD LIMITS
// ============================================================

const TIKTOK_MIN_CHUNK_SIZE =
  5_000_000;

const TIKTOK_MAX_CHUNK_SIZE =
  64_000_000;

const TIKTOK_MAX_VIDEO_SIZE =
  4 *
  1024 *
  1024 *
  1024;

// ============================================================
// TYPES
// ============================================================

type MetaConnection = {
  id:
    string;

  user_id:
    string;

  organisation_id?:
    string | null;

  platform:
    string;

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

type PublishCounters = {
  processed:
    number;

  published:
    number;

  failed:
    number;

  processing:
    number;

  skipped:
    number;
};

// ============================================================

type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info";

// ============================================================

type NotificationInput = {
  supabase:
    any;

  userId:
    string;

  organisationId?:
    string | null;

  title:
    string;

  message:
    string;

  type:
    NotificationType;

  link?:
    string;

  metadata?:
    Record<
      string,
      unknown
    >;
};

// ============================================================
// BASIC HELPERS
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

// ============================================================

function sleep(
  milliseconds:
    number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
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

  return (
    timestamp <=
    Date.now()
  );
}

// ============================================================

function getPlatformLabel(
  platform:
    string
) {
  switch (
    cleanString(
      platform
    ).toLowerCase()
  ) {
    case "facebook":
      return "Facebook";

    case "instagram":
      return "Instagram";

    case "linkedin":
      return "LinkedIn";

    case "tiktok":
      return "TikTok";

    case "pinterest":
      return "Pinterest";

    case "meta":
      return "Meta";

    default:
      return (
        cleanString(
          platform
        ) ||
        "Social"
      );
  }
}

// ============================================================
// MEDIA HELPERS
// ============================================================

function getCleanMediaUrl(
  mediaUrl:
    string
) {
  return mediaUrl
    .toLowerCase()
    .split("?")[0]
    .split("#")[0];
}

// ============================================================

function isVideoMediaUrl(
  mediaUrl:
    string
) {
  if (
    !mediaUrl
  ) {
    return false;
  }

  const cleanUrl =
    getCleanMediaUrl(
      mediaUrl
    );

  return [
    ".mp4",
    ".mov",
    ".m4v",
    ".webm",
    ".avi",
  ].some(
    (
      extension
    ) =>
      cleanUrl.endsWith(
        extension
      )
  );
}

// ============================================================
// NOTIFICATION HELPER
// ============================================================

async function createNotification({
  supabase,
  userId,
  organisationId = null,
  title,
  message,
  type,
  link = "/social",
  metadata = {},
}: NotificationInput) {
  if (
    !userId ||
    !title ||
    !message
  ) {
    return;
  }

  const createdAt =
    new Date()
      .toISOString();

  const baseNotification: Record<
    string,
    unknown
  > = {
    user_id:
      userId,

    title,

    message,

    type,

    link,

    metadata,

    created_at:
      createdAt,
  };

  if (
    organisationId
  ) {
    baseNotification.organisation_id =
      organisationId;
  }

  // ==========================================================
  // FIRST TRY:
  // upgraded notification schema using is_read
  // ==========================================================

  try {
    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          ...baseNotification,

          is_read:
            false,
        });

    if (
      !error
    ) {
      console.log(
        "[NOTIFICATIONS] Created:",
        {
          userId,
          title,
          type,
        }
      );

      return;
    }

    // ========================================================
    // If is_read is not part of the schema, try legacy "read".
    // ========================================================

    const errorMessage =
      cleanString(
        error.message
      ).toLowerCase();

    const shouldTryLegacyRead =
      errorMessage.includes(
        "is_read"
      ) ||
      errorMessage.includes(
        "column"
      );

    if (
      !shouldTryLegacyRead
    ) {
      console.warn(
        "[NOTIFICATIONS] Insert failed:",
        error
      );

      return;
    }
  } catch (
    error
  ) {
    console.warn(
      "[NOTIFICATIONS] Primary notification insert failed:",
      error
    );
  }

  // ==========================================================
  // LEGACY FALLBACK:
  // notifications.read
  // ==========================================================

  try {
    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          ...baseNotification,

          read:
            false,
        });

    if (
      error
    ) {
      console.warn(
        "[NOTIFICATIONS] Legacy notification insert failed:",
        error
      );

      return;
    }

    console.log(
      "[NOTIFICATIONS] Created using legacy read field:",
      {
        userId,
        title,
        type,
      }
    );
  } catch (
    error
  ) {
    /*
     * Notification failures must NEVER stop a social post
     * from publishing.
     */
    console.warn(
      "[NOTIFICATIONS] Unexpected notification error:",
      error
    );
  }
}

// ============================================================
// META ERROR HELPER
// ============================================================

function getMetaErrorMessage(
  value:
    any
) {
  return (
    value
      ?.error
      ?.message ||
    value
      ?.message ||
    value
      ?.raw ||
    (
      value
        ? JSON.stringify(
            value
          )
        : ""
    ) ||
    "Unknown Meta error"
  );
}

// ============================================================
// META CONNECTION
// ============================================================

async function getMetaConnection({
  supabase,
  userId,
}: {
  supabase:
    any;

  userId:
    string;
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
          organisation_id,
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

  if (
    error
  ) {
    console.error(
      "[CRON META] Connection lookup failed:",
      error
    );

    throw new Error(
      `Meta connection lookup failed: ${error.message}`
    );
  }

  if (
    !data
  ) {
    throw new Error(
      "Meta is not connected. Reconnect Meta in Settings."
    );
  }

  const connection =
    data as unknown as
      MetaConnection;

  if (
    !connection
      .access_token
  ) {
    throw new Error(
      "Meta connection is missing its access token. Reconnect Meta in Settings."
    );
  }

  if (
    tokenExpired(
      connection
        .expires_at
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
    !connection
      .page_id
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

  const accessToken =
    connection
      .page_access_token;

  // ==========================================================
  // FACEBOOK VIDEO
  // ==========================================================

  if (
    mediaUrl &&
    isVideoMediaUrl(
      mediaUrl
    )
  ) {
    const endpoint =
      `https://graph.facebook.com/${graphVersion}/${connection.page_id}/videos`;

    const body =
      new URLSearchParams();

    body.set(
      "file_url",
      mediaUrl
    );

    body.set(
      "description",
      message
    );

    body.set(
      "access_token",
      accessToken
    );

    const response =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body,

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
        "[CRON META] Facebook video post failed:",
        result
      );

      throw new Error(
        `Facebook video publish failed: ${getMetaErrorMessage(
          result
        )}`
      );
    }

    return {
      destination:
        "facebook",

      type:
        "video",

      id:
        result?.id ??
        null,

      response:
        result,
    };
  }

  // ==========================================================
  // FACEBOOK IMAGE
  // ==========================================================

  if (
    mediaUrl
  ) {
    const endpoint =
      `https://graph.facebook.com/${graphVersion}/${connection.page_id}/photos`;

    const response =
      await fetch(
        endpoint,
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
                accessToken,
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
        `Facebook image publish failed: ${getMetaErrorMessage(
          result
        )}`
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
  // FACEBOOK TEXT
  // ==========================================================

  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${connection.page_id}/feed`;

  const response =
    await fetch(
      endpoint,
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
              accessToken,
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
      `Facebook publish failed: ${getMetaErrorMessage(
        result
      )}`
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
      "Instagram requires an image or video."
    );
  }

  const graphVersion =
    getMetaGraphVersion();

  const instagramId =
    connection
      .instagram_business_account_id;

  const accessToken =
    connection
      .page_access_token;

  const video =
    isVideoMediaUrl(
      mediaUrl
    );

  // ==========================================================
  // CREATE CONTAINER
  // ==========================================================

  const containerPayload: Record<
    string,
    unknown
  > = {
    caption:
      message,

    access_token:
      accessToken,
  };

  if (
    video
  ) {
    containerPayload.media_type =
      "REELS";

    containerPayload.video_url =
      mediaUrl;
  } else {
    containerPayload.image_url =
      mediaUrl;
  }

  const containerResponse =
    await fetch(
      `https://graph.facebook.com/${graphVersion}/${instagramId}/media`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            containerPayload
          ),

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
      `Instagram media creation failed: ${getMetaErrorMessage(
        containerData
      )}`
    );
  }

  const creationId =
    String(
      containerData.id
    );

  // ==========================================================
  // WAIT UNTIL INSTAGRAM HAS PROCESSED MEDIA
  // ==========================================================

  await waitForInstagramContainer({
    creationId,

    accessToken,

    graphVersion,
  });

  // ==========================================================
  // PUBLISH
  // ==========================================================

  const publishResponse =
    await fetch(
      `https://graph.facebook.com/${graphVersion}/${instagramId}/media_publish`,
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
              creationId,

            access_token:
              accessToken,
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
      "[CRON META] Instagram publish failed:",
      publishData
    );

    throw new Error(
      `Instagram publish failed: ${getMetaErrorMessage(
        publishData
      )}`
    );
  }

  return {
    destination:
      "instagram",

    type:
      video
        ? "reel"
        : "image",

    creationId,

    id:
      publishData.id,

    response:
      publishData,
  };
}

// ============================================================
// INSTAGRAM CONTAINER STATUS
// ============================================================

async function waitForInstagramContainer({
  creationId,
  accessToken,
  graphVersion,
}: {
  creationId:
    string;

  accessToken:
    string;

  graphVersion:
    string;
}) {
  /*
   * Images usually finish quickly.
   * Videos/Reels can take considerably longer.
   */

  const maximumChecks =
    20;

  const waitMs =
    1500;

  for (
    let check =
      1;
    check <=
    maximumChecks;
    check +=
      1
  ) {
    const statusUrl =
      new URL(
        `https://graph.facebook.com/${graphVersion}/${creationId}`
      );

    statusUrl
      .searchParams
      .set(
        "fields",
        "status_code,status"
      );

    statusUrl
      .searchParams
      .set(
        "access_token",
        accessToken
      );

    const response =
      await fetch(
        statusUrl.toString(),
        {
          method:
            "GET",

          cache:
            "no-store",
        }
      );

    const result =
      await safeJsonResponse(
        response
      );

    console.log(
      "[INSTAGRAM] Container check:",
      {
        creationId,

        check,

        status:
          result?.status,

        statusCode:
          result?.status_code,
      }
    );

    if (
      !response.ok
    ) {
      throw new Error(
        `Instagram media status check failed: ${getMetaErrorMessage(
          result
        )}`
      );
    }

    const statusCode =
      cleanString(
        result?.status_code
      ).toUpperCase();

    if (
      statusCode ===
      "FINISHED"
    ) {
      return;
    }

    if (
      statusCode ===
        "ERROR" ||
      statusCode ===
        "EXPIRED"
    ) {
      throw new Error(
        `Instagram media processing failed: ${
          result?.status ||
          statusCode
        }`
      );
    }

    if (
      check <
      maximumChecks
    ) {
      await sleep(
        waitMs
      );
    }
  }

  throw new Error(
    "Instagram is still processing the media. TOTS-OS will retry the post automatically."
  );
}

// ============================================================
// CRON / WORKER
// ============================================================

export async function GET(
  request:
    Request
) {
  // ==========================================================
  // VERIFY CRON SECRET
  // ==========================================================

  const cronSecret =
    process.env
      .CRON_SECRET
      ?.trim();

  if (
    !cronSecret
  ) {
    console.error(
      "[CRON SOCIAL] CRON_SECRET is missing."
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          "CRON_SECRET is not configured.",
      },
      {
        status:
          500,
      }
    );
  }

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    authHeader !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Unauthorized",
      },
      {
        status:
          401,
      }
    );
  }

  // ==========================================================
  // SUPABASE
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
        success:
          false,

        processed:
          0,

        published:
          0,

        failed:
          0,

        processing:
          0,

        skipped:
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

  const counters:
    PublishCounters = {
      processed:
        0,

      published:
        0,

      failed:
        0,

      processing:
        0,

      skipped:
        0,
    };

  const now =
    new Date()
      .toISOString();

  // ==========================================================
  // FETCH DUE NEW POSTS
  // ==========================================================

  const {
    data:
      scheduledQueue,

    error:
      scheduledQueueError,
  } =
    await supabase
      .from(
        "socials"
      )
      .select("*")
      .eq(
        "status",
        "scheduled"
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
    scheduledQueueError
  ) {
    console.error(
      "[CRON SOCIAL] Scheduled queue error:",
      scheduledQueueError
    );

    return NextResponse.json(
      {
        success:
          false,

        ...counters,

        error:
          scheduledQueueError.message,
      },
      {
        status:
          500,
      }
    );
  }

  // ==========================================================
  // FETCH TIKTOK POSTS ALREADY PROCESSING
  //
  // These are deliberately fetched separately so attempts = 5
  // cannot prevent us checking TikTok's asynchronous status.
  // ==========================================================

  const {
    data:
      processingQueue,

    error:
      processingQueueError,
  } =
    await supabase
      .from(
        "socials"
      )
      .select("*")
      .eq(
        "status",
        "processing"
      )
      .eq(
        "platform",
        "tiktok"
      )
      .lte(
        "scheduled_for",
        now
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
    processingQueueError
  ) {
    console.error(
      "[CRON SOCIAL] Processing queue error:",
      processingQueueError
    );

    return NextResponse.json(
      {
        success:
          false,

        ...counters,

        error:
          processingQueueError.message,
      },
      {
        status:
          500,
      }
    );
  }

  const queue =
    [
      ...(
        scheduledQueue ||
        []
      ),

      ...(
        processingQueue ||
        []
      ),
    ];

  if (
    queue.length ===
    0
  ) {
    return NextResponse.json(
      {
        success:
          true,

        ...counters,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // PROCESS QUEUE
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
      // TIKTOK ASYNC STATUS CHECK
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

        counters.processed +=
          1;

        if (
          result.status ===
          "published"
        ) {
          counters.published +=
            1;

          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              null,

            title:
              "TikTok published",

            message:
              "Your TikTok post was published successfully.",

            type:
              "success",

            metadata: {
              platform:
                "tiktok",

              social_post_id:
                post.id,

              platform_post_id:
                result.platformPostId,
            },
          });
        } else if (
          result.status ===
          "failed"
        ) {
          counters.failed +=
            1;

          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              null,

            title:
              "TikTok post failed",

            message:
              result.error ||
              "TikTok could not publish your video.",

            type:
              "error",

            metadata: {
              platform:
                "tiktok",

              social_post_id:
                post.id,
            },
          });
        } else {
          counters.processing +=
            1;
        }

        continue;
      }

      // ======================================================
      // NEW PUBLISH ATTEMPT
      // ======================================================

      attempt +=
        1;

      const {
        error:
          attemptUpdateError,
      } =
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

      if (
        attemptUpdateError
      ) {
        throw new Error(
          `Could not update publishing attempt: ${attemptUpdateError.message}`
        );
      }

      const fullMessage =
        [
          cleanString(
            post.caption
          ),

          cleanString(
            post.hashtags
          ),
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

        counters.processed +=
          1;

        if (
          result.status ===
          "published"
        ) {
          counters.published +=
            1;

          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              null,

            title:
              "TikTok published",

            message:
              "Your TikTok post was published successfully.",

            type:
              "success",

            metadata: {
              platform:
                "tiktok",

              social_post_id:
                post.id,

              platform_post_id:
                result.platformPostId,
            },
          });
        } else {
          counters.processing +=
            1;
        }

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

        /*
         * Individual rows:
         *
         * facebook -> Facebook only
         * instagram -> Instagram only
         *
         * Legacy meta rows:
         *
         * Facebook + Instagram where possible.
         */

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

        const results:
          Record<
            string,
            any
          > =
          {};

        const errors:
          Array<{
            destination:
              string;

            error:
              string;
          }> =
          [];

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
              "[CRON FACEBOOK] Failed:",
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
              "[CRON INSTAGRAM] Failed:",
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
                  `${getPlatformLabel(
                    item.destination
                  )}: ${item.error}`
              )
              .join(
                " | "
              ) ||
            "Social publishing failed.";

          throw new Error(
            message
          );
        }

        // ====================================================
        // PLATFORM POST ID
        // ====================================================

        const facebookResult =
          results.facebook;

        const instagramResult =
          results.instagram;

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

        const warning =
          errors.length >
          0
            ? errors
                .map(
                  (
                    item
                  ) =>
                    `${getPlatformLabel(
                      item.destination
                    )}: ${item.error}`
                )
                .join(
                  " | "
                )
            : null;

        // ====================================================
        // SAVE SUCCESS
        // ====================================================

        const {
          error:
            publishUpdateError,
        } =
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

        if (
          publishUpdateError
        ) {
          console.error(
            "[CRON SOCIAL] Post published externally but database update failed:",
            publishUpdateError
          );
        }

        counters.processed +=
          1;

        counters.published +=
          1;

        // ====================================================
        // FACEBOOK SUCCESS NOTIFICATION
        // ====================================================

        if (
          results.facebook
        ) {
          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              connection.organisation_id ??
              null,

            title:
              "Facebook post published",

            message:
              connection
                .page_name
                ? `Your post was published successfully to ${connection.page_name}.`
                : "Your post was published successfully to Facebook.",

            type:
              "success",

            link:
              "/social",

            metadata: {
              platform:
                "facebook",

              social_post_id:
                post.id,

              platform_post_id:
                results.facebook
                  ?.id ??
                null,
            },
          });
        }

        // ====================================================
        // INSTAGRAM SUCCESS NOTIFICATION
        // ====================================================

        if (
          results.instagram
        ) {
          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              connection.organisation_id ??
              null,

            title:
              "Instagram post published",

            message:
              results.instagram
                ?.type ===
                "reel"
                ? "Your Reel was published successfully to Instagram."
                : "Your post was published successfully to Instagram.",

            type:
              "success",

            link:
              "/social",

            metadata: {
              platform:
                "instagram",

              social_post_id:
                post.id,

              platform_post_id:
                results.instagram
                  ?.id ??
                null,
            },
          });
        }

        // ====================================================
        // PARTIAL FAILURE
        // ====================================================

        if (
          warning
        ) {
          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              connection.organisation_id ??
              null,

            title:
              "Some social publishing failed",

            message:
              warning,

            type:
              "warning",

            link:
              "/social",

            metadata: {
              platform,

              social_post_id:
                post.id,

              partial_success:
                true,
            },
          });
        }

        continue;
      }

      // ======================================================
      // PINTEREST
      //
      // Retained for compatibility, even though Pinterest is
      // currently not exposed through your Social Studio.
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

        if (
          !dynamicToken
            .platform_account_id
        ) {
          throw new Error(
            "Missing Pinterest board ID"
          );
        }

        if (
          !mediaUrl
        ) {
          throw new Error(
            "Pinterest requires an image."
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
                  `Bearer ${dynamicToken.access_token}`,

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
                    dynamicToken
                      .platform_account_id,

                  media_source: {
                    source_type:
                      "image_url",

                    url:
                      mediaUrl,
                  },
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

            last_attempt_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        counters.processed +=
          1;

        counters.published +=
          1;

        await createNotification({
          supabase,

          userId:
            post.user_id,

          organisationId:
            post.organisation_id ??
            null,

          title:
            "Pinterest post published",

          message:
            "Your post was published successfully to Pinterest.",

          type:
            "success",

          link:
            "/social",

          metadata: {
            platform:
              "pinterest",

            social_post_id:
              post.id,

            platform_post_id:
              result?.id ??
              null,
          },
        });

        continue;
      }

      // ======================================================
      // LINKEDIN
      //
      // Connection can exist, but publishing isn't active yet.
      // ======================================================

      if (
        platform ===
        "linkedin"
      ) {
        throw new Error(
          "LinkedIn publishing is not available yet."
        );
      }

      // ======================================================
      // UNSUPPORTED PLATFORM
      // ======================================================

      counters.skipped +=
        1;

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
      // RETRY / FAILURE
      // ======================================================

      const effectiveAttempt =
        post.status ===
        "processing"
          ? Number(
              post.attempts ??
              0
            )
          : attempt;

      const finalFailure =
        post.status ===
          "processing"
          ? false
          : effectiveAttempt >=
            MAX_ATTEMPTS;

      const nextStatus =
        finalFailure
          ? "failed"
          : post.status ===
              "processing"
            ? "processing"
            : "scheduled";

      const {
        error:
          failureUpdateError,
      } =
        await supabase
          .from(
            "socials"
          )
          .update({
            status:
              nextStatus,

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

      if (
        failureUpdateError
      ) {
        console.error(
          "[CRON SOCIAL] Could not save publishing failure:",
          failureUpdateError
        );
      }

      counters.processed +=
        1;

      // ======================================================
      // FINAL FAILURE
      // ======================================================

      if (
        finalFailure
      ) {
        counters.failed +=
          1;

        if (
          post.user_id
        ) {
          await createNotification({
            supabase,

            userId:
              post.user_id,

            organisationId:
              post.organisation_id ??
              null,

            title:
              `${getPlatformLabel(
                platform
              )} post failed`,

            message:
              message ||
              `Your ${getPlatformLabel(
                platform
              )} post could not be published.`,

            type:
              "error",

            link:
              "/social",

            metadata: {
              platform,

              social_post_id:
                post.id,

              attempts:
                effectiveAttempt,

              final_failure:
                true,
            },
          });
        }
      } else if (
        post.status ===
        "processing"
      ) {
        counters.processing +=
          1;
      }

      console.log(
        "[CRON SOCIAL] Failure handled:",
        {
          postId:
            post.id,

          platform,

          effectiveAttempt,

          finalFailure,

          nextStatus,

          message,
        }
      );
    }
  }

  // ==========================================================
  // FINISHED
  // ==========================================================

  console.log(
    "[CRON SOCIAL] Worker finished:",
    counters
  );

  return NextResponse.json(
    {
      success:
        true,

      ...counters,
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
  // CONNECTION
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
    throw new Error(
      "TikTok account is not connected"
    );
  }

  if (
    tokenExpired(
      connection
        .expires_at
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
  // CREATOR INFO
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

  // ==========================================================
  // DOWNLOAD VIDEO
  // ==========================================================

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

  const {
    chunkSize,

    totalChunkCount,
  } =
    calculateTikTokChunks(
      videoSize
    );

  // ==========================================================
  // INITIALISE UPLOAD
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
      `TikTok did not return an upload_url: ${JSON.stringify(
        initData
      )}`
    );
  }

  // ==========================================================
  // UPLOAD VIDEO
  // ==========================================================

  await uploadVideoToTikTok({
    uploadUrl,

    videoBytes,

    videoSize,

    chunkSize,

    totalChunkCount,

    contentType,
  });

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
// TIKTOK BINARY UPLOAD
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
      "[TIKTOK] Upload chunk:",
      {
        chunk:
          chunkIndex +
          1,

        total:
          totalChunkCount,

        status:
          uploadResponse.status,
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
      connection
        .expires_at
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
    cleanString(
      data
        ?.data
        ?.status
    ).toUpperCase();

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
  // PROCESSING
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
// TIKTOK CHUNK CALCULATION
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

  // ==========================================================
  // ONE CHUNK
  // ==========================================================

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

  // ==========================================================
  // MULTIPLE CHUNKS
  // ==========================================================

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
      `Calculated TikTok chunk size ${chunkSize} is below the minimum.`
    );
  }

  if (
    chunkSize >
    TIKTOK_MAX_CHUNK_SIZE
  ) {
    throw new Error(
      `Calculated TikTok chunk size ${chunkSize} exceeds the maximum.`
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
      `TikTok final chunk ${finalChunkSize} exceeds the maximum.`
    );
  }

  if (
    finalChunkSize <
    TIKTOK_MIN_CHUNK_SIZE
  ) {
    throw new Error(
      `TikTok final chunk ${finalChunkSize} is below the minimum.`
    );
  }

  return {
    chunkSize,

    totalChunkCount,
  };
}

// ============================================================
// TIKTOK MIME TYPE
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
    getCleanMediaUrl(
      mediaUrl
    );

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
    `Unsupported TikTok video type. TikTok supports MP4, MOV and WebM. Received: ${
      responseContentType ||
      mediaUrl
    }`
  );
}

// ============================================================
// SAFE JSON
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