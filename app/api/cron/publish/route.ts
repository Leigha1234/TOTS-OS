// app/api/cron/publish/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 5;

// TikTok FILE_UPLOAD chunk limits.
//
// Files up to 64 MB are easiest and safest to send
// as one single chunk:
//
// video_size === chunk_size
// total_chunk_count === 1
//
// Larger files are divided into chunks between
// approximately 5 MB and 64 MB.
const TIKTOK_MIN_CHUNK_SIZE = 5_000_000;
const TIKTOK_MAX_CHUNK_SIZE = 64_000_000;

// TikTok Content Posting API maximum video size.
const TIKTOK_MAX_VIDEO_SIZE =
  4 * 1024 * 1024 * 1024;

// ==================================================
// CRON ENDPOINT
// ==================================================

export async function GET(request: Request) {
  // ==================================================
  // 1. VERIFY CRON REQUEST
  // ==================================================

  const authHeader =
    request.headers.get("authorization");

  if (
    authHeader !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse(
      "Unauthorized",
      {
        status: 401,
      }
    );
  }

  // ==================================================
  // 2. SUPABASE
  // ==================================================

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
        processed: 0,
        error:
          "Missing Supabase environment variables",
      },
      {
        status: 500,
      }
    );
  }

  const supabase =
    createClient(
      supabaseUrl,
      serviceRoleKey
    );

  const now =
    new Date().toISOString();

  // ==================================================
  // 3. FETCH DUE POSTS
  //
  // scheduled:
  //   has not yet been submitted
  //
  // processing:
  //   TikTok accepted upload and we're waiting for
  //   TikTok to finish processing it.
  // ==================================================

  const {
    data: queue,
    error: queueError,
  } = await supabase
    .from("socials")
    .select("*")
    .in("status", [
      "scheduled",
      "processing",
    ])
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
        ascending: true,
      }
    )
    .limit(20);

  if (queueError) {
    console.error(
      "Queue fetch error:",
      queueError
    );

    return NextResponse.json(
      {
        processed: 0,
        error:
          queueError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (
    !queue ||
    queue.length === 0
  ) {
    return NextResponse.json({
      processed: 0,
    });
  }

  let processed = 0;

  // ==================================================
  // 4. PROCESS QUEUE
  // ==================================================

  for (const post of queue) {
    const platform =
      String(
        post.platform || ""
      ).toLowerCase();

    try {
      // ==============================================
      // TIKTOK:
      // CHECK AN EXISTING PROCESSING POST
      // ==============================================

      if (
        platform ===
          "tiktok" &&
        post.status ===
          "processing" &&
        post.platform_post_id
      ) {
        const result =
          await checkTikTokPostStatus(
            {
              supabase,
              post,
            }
          );

        await supabase
          .from("socials")
          .update({
            status:
              result.status,

            posted_at:
              result.status ===
              "published"
                ? new Date().toISOString()
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
              new Date().toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        processed += 1;
        continue;
      }

      // ==============================================
      // NEW PUBLISHING ATTEMPT
      // ==============================================

      const attempt =
        (post.attempts ??
          0) + 1;

      await supabase
        .from("socials")
        .update({
          attempts:
            attempt,

          last_attempt_at:
            new Date().toISOString(),

          last_error:
            null,

          error:
            null,
        })
        .eq(
          "id",
          post.id
        );

      const fullMessage = [
        post.caption || "",
        post.hashtags || "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // ==================================================
      // TIKTOK
      // ==================================================

      if (
        platform ===
        "tiktok"
      ) {
        const result =
          await publishTikTokPost(
            {
              supabase,
              post,
              fullMessage,
            }
          );

        await supabase
          .from("socials")
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
                ? new Date().toISOString()
                : null,

            last_attempt_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            post.id
          );

        processed += 1;
        continue;
      }

      // ==================================================
      // OTHER PLATFORM TOKEN LOOKUP
      // ==================================================

      const {
        data: dynamicToken,
        error: tokenError,
      } = await supabase
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
          platform
        )
        .maybeSingle();

      if (
        tokenError ||
        !dynamicToken
          ?.access_token
      ) {
        throw new Error(
          `Missing social token for ${platform}`
        );
      }

      const token =
        dynamicToken.access_token;

      const accountId =
        dynamicToken
          .platform_account_id;

      // ==================================================
      // FACEBOOK
      // ==================================================

      if (
        platform ===
        "facebook"
      ) {
        if (!accountId) {
          throw new Error(
            "Missing Facebook account ID"
          );
        }

        const fbRes =
          await fetch(
            `https://graph.facebook.com/v18.0/${accountId}/feed`,
            {
              method:
                "POST",

              body:
                new URLSearchParams(
                  {
                    message:
                      fullMessage,

                    link:
                      post.media_url ||
                      "",

                    access_token:
                      token,
                  }
                ),
            }
          );

        const fbData =
          await safeJsonResponse(
            fbRes
          );

        if (!fbRes.ok) {
          throw new Error(
            `Facebook publish failed: ${JSON.stringify(
              fbData
            )}`
          );
        }

        await supabase
          .from("socials")
          .update({
            status:
              "published",

            posted_at:
              new Date().toISOString(),

            platform_post_id:
              fbData?.id ??
              null,

            platform_response:
              fbData ??
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

        processed += 1;
        continue;
      }

      // ==================================================
      // INSTAGRAM
      // ==================================================

      if (
        platform ===
        "instagram"
      ) {
        if (!accountId) {
          throw new Error(
            "Missing Instagram account ID"
          );
        }

        if (
          !post.media_url
        ) {
          throw new Error(
            "Instagram post is missing media_url"
          );
        }

        // ----------------------------------------------
        // CREATE MEDIA CONTAINER
        // ----------------------------------------------

        const containerRes =
          await fetch(
            `https://graph.facebook.com/v18.0/${accountId}/media`,
            {
              method:
                "POST",

              body:
                new URLSearchParams(
                  {
                    image_url:
                      post.media_url,

                    caption:
                      fullMessage,

                    access_token:
                      token,
                  }
                ),
            }
          );

        const containerData =
          await safeJsonResponse(
            containerRes
          );

        if (
          !containerRes.ok ||
          !containerData?.id
        ) {
          throw new Error(
            `Instagram media creation failed: ${JSON.stringify(
              containerData
            )}`
          );
        }

        // ----------------------------------------------
        // PUBLISH MEDIA CONTAINER
        // ----------------------------------------------

        const publishRes =
          await fetch(
            `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
            {
              method:
                "POST",

              body:
                new URLSearchParams(
                  {
                    creation_id:
                      containerData.id,

                    access_token:
                      token,
                  }
                ),
            }
          );

        const publishData =
          await safeJsonResponse(
            publishRes
          );

        if (
          !publishRes.ok
        ) {
          throw new Error(
            `Instagram publish failed: ${JSON.stringify(
              publishData
            )}`
          );
        }

        await supabase
          .from("socials")
          .update({
            status:
              "published",

            posted_at:
              new Date().toISOString(),

            platform_post_id:
              publishData?.id ??
              null,

            platform_response:
              publishData ??
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

        processed += 1;
        continue;
      }

      // ==================================================
      // PINTEREST
      // ==================================================

      if (
        platform ===
        "pinterest"
      ) {
        if (!accountId) {
          throw new Error(
            "Missing Pinterest board ID"
          );
        }

        if (
          !post.media_url
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
                JSON.stringify(
                  {
                    link:
                      "https://tots-os.co.uk",

                    title:
                      "Shared via TOTS-OS",

                    description:
                      fullMessage,

                    board_id:
                      accountId,

                    media_source:
                      {
                        source_type:
                          "image_url",

                        url:
                          post.media_url,
                      },
                  }
                ),
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
          .from("socials")
          .update({
            status:
              "published",

            posted_at:
              new Date().toISOString(),

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

        processed += 1;
        continue;
      }

      throw new Error(
        `Unsupported platform: ${platform}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Cron publish error for post ${post.id}:`,
        error
      );

      // Processing posts are status-checks rather than
      // new upload attempts, so don't artificially add
      // another attempt here.
      const attempt =
        post.status ===
        "processing"
          ? post.attempts ??
            0
          : (post.attempts ??
              0) + 1;

      const finalFailure =
        attempt >=
        MAX_ATTEMPTS;

      await supabase
        .from("socials")
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
            new Date().toISOString(),
        })
        .eq(
          "id",
          post.id
        );

      processed += 1;
    }
  }

  return NextResponse.json({
    processed,
  });
}

// ==================================================
// TIKTOK DIRECT POST
// ==================================================

async function publishTikTokPost({
  supabase,
  post,
  fullMessage,
}: {
  supabase: any;
  post: any;
  fullMessage: string;
}) {
  // ==================================================
  // VALIDATE POST
  // ==================================================

  if (!post.user_id) {
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

  // ==================================================
  // GET TIKTOK CONNECTION
  // ==================================================

  const {
    data: connection,
    error: connectionError,
  } = await supabase
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
      "TikTok connection lookup failed:",
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

  const accessToken =
    connection.access_token;

  // ==================================================
  // STEP 1
  // QUERY CREATOR INFO
  // ==================================================

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
      }
    );

  const creatorData =
    await safeJsonResponse(
      creatorResponse
    );

  console.log(
    "TikTok creator info response:",
    creatorData
  );

  /*
   * TikTok returns:
   *
   * error.code === "ok"
   *
   * on a successful response.
   */
  if (
    !creatorResponse.ok ||
    creatorData?.error
      ?.code !== "ok"
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
    creatorData?.data
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

  // ==================================================
  // PRIVACY
  //
  // During sandbox / unaudited testing, SELF_ONLY is
  // generally the appropriate option when available.
  // ==================================================

  const privacyLevel =
    privacyOptions.includes(
      "SELF_ONLY"
    )
      ? "SELF_ONLY"
      : privacyOptions[0];

  console.log(
    "TikTok selected privacy level:",
    privacyLevel
  );

  // ==================================================
  // STEP 2
  // DOWNLOAD VIDEO FROM SUPABASE
  //
  // We download the file ourselves and then send it to
  // TikTok using FILE_UPLOAD.
  //
  // This avoids TikTok's PULL_FROM_URL domain ownership
  // requirement.
  // ==================================================

  console.log(
    "Downloading video before TikTok FILE_UPLOAD:",
    post.media_url
  );

  const videoResponse =
    await fetch(
      post.media_url
    );

  if (
    !videoResponse.ok
  ) {
    throw new Error(
      `Could not download video from storage: HTTP ${videoResponse.status}`
    );
  }

  const videoArrayBuffer =
    await videoResponse.arrayBuffer();

  const videoBytes =
    new Uint8Array(
      videoArrayBuffer
    );

  const videoSize =
    videoBytes.byteLength;

  if (!videoSize) {
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
    getTikTokVideoMimeType(
      {
        mediaUrl:
          post.media_url,

        responseContentType:
          videoResponse.headers.get(
            "content-type"
          ),
      }
    );

  console.log(
    "TikTok video downloaded:",
    {
      videoSize,
      contentType,
    }
  );

  // ==================================================
  // STEP 3
  // CALCULATE FILE_UPLOAD CHUNKS
  // ==================================================

  const {
    chunkSize,
    totalChunkCount,
  } =
    calculateTikTokChunks(
      videoSize
    );

  console.log(
    "TikTok upload chunk configuration:",
    {
      videoSize,
      chunkSize,
      totalChunkCount,
    }
  );

  // ==================================================
  // STEP 4
  // INITIALIZE DIRECT POST USING FILE_UPLOAD
  // ==================================================

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
          JSON.stringify(
            {
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
            }
          ),
      }
    );

  const initData =
    await safeJsonResponse(
      initResponse
    );

  console.log(
    "TikTok FILE_UPLOAD init response:",
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
      ?.code !== "ok"
  ) {
    throw new Error(
      `TikTok publish init failed: ${JSON.stringify(
        initData
      )}`
    );
  }

  const publishId =
    initData?.data
      ?.publish_id;

  const uploadUrl =
    initData?.data
      ?.upload_url;

  if (!publishId) {
    throw new Error(
      `TikTok did not return a publish_id: ${JSON.stringify(
        initData
      )}`
    );
  }

  if (!uploadUrl) {
    throw new Error(
      `TikTok did not return an upload_url for FILE_UPLOAD: ${JSON.stringify(
        initData
      )}`
    );
  }

  console.log(
    "TikTok FILE_UPLOAD initialized:",
    {
      publishId,

      uploadUrlReceived:
        Boolean(
          uploadUrl
        ),
    }
  );

  // ==================================================
  // STEP 5
  // UPLOAD VIDEO BINARY
  // ==================================================

  await uploadVideoToTikTok(
    {
      uploadUrl,
      videoBytes,
      videoSize,
      chunkSize,
      totalChunkCount,
      contentType,
    }
  );

  console.log(
    "TikTok video binary upload complete:",
    {
      publishId,
      videoSize,
    }
  );

  // ==================================================
  // TikTok now handles publishing asynchronously.
  //
  // Save the publish_id and mark as processing.
  // A future worker execution will query status/fetch.
  // ==================================================

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
          creatorData?.data
            ?.creator_username ??
          null,

        nickname:
          creatorData?.data
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

// ==================================================
// TIKTOK VIDEO UPLOAD
// ==================================================

async function uploadVideoToTikTok({
  uploadUrl,
  videoBytes,
  videoSize,
  chunkSize,
  totalChunkCount,
  contentType,
}: {
  uploadUrl: string;
  videoBytes: Uint8Array;
  videoSize: number;
  chunkSize: number;
  totalChunkCount: number;
  contentType: string;
}) {
  for (
    let chunkIndex = 0;
    chunkIndex <
    totalChunkCount;
    chunkIndex += 1
  ) {
    const startByte =
      chunkIndex *
      chunkSize;

    const isLastChunk =
      chunkIndex ===
      totalChunkCount - 1;

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
      endExclusive - 1;

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
          chunkIndex + 1
        } is empty`
      );
    }

    console.log(
      "Uploading TikTok chunk:",
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
        [chunk],
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
      await uploadResponse.text();

    console.log(
      "TikTok chunk upload response:",
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

    /*
     * Expected TikTok behaviour:
     *
     * 206:
     * intermediate chunk accepted
     *
     * 201:
     * final chunk / full upload accepted
     */

    if (
      !uploadResponse.ok
    ) {
      throw new Error(
        `TikTok video upload failed on chunk ${
          chunkIndex + 1
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
        "TikTok intermediate chunk returned unexpected HTTP status:",
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
        "TikTok final chunk returned unexpected HTTP status:",
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

// ==================================================
// TIKTOK STATUS CHECK
// ==================================================

async function checkTikTokPostStatus({
  supabase,
  post,
}: {
  supabase: any;
  post: any;
}) {
  if (!post.user_id) {
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
    data: connection,
    error: connectionError,
  } = await supabase
    .from(
      "social_accounts"
    )
    .select(
      "access_token, platform_user_id"
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
          JSON.stringify(
            {
              publish_id:
                post.platform_post_id,
            }
          ),
      }
    );

  const data =
    await safeJsonResponse(
      response
    );

  console.log(
    "TikTok publish status:",
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
      ?.code !== "ok"
  ) {
    throw new Error(
      `TikTok status check failed: ${JSON.stringify(
        data
      )}`
    );
  }

  const tikTokStatus =
    data?.data?.status;

  // ==============================================
  // PUBLISH COMPLETE
  // ==============================================

  if (
    tikTokStatus ===
    "PUBLISH_COMPLETE"
  ) {
    /*
     * TikTok has historically exposed this property
     * with the spelling:
     *
     * publicaly_available_post_id
     *
     * Support both that and the logically-correct
     * spelling so we're resilient to API changes.
     */

    const postIds =
      data?.data
        ?.publicaly_available_post_id ??
      data?.data
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
        : post.platform_post_id;

    console.log(
      "TikTok publishing complete:",
      {
        publishId:
          post.platform_post_id,

        actualPostId,
      }
    );

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

  // ==============================================
  // FAILED
  // ==============================================

  if (
    tikTokStatus ===
    "FAILED"
  ) {
    const failReason =
      data?.data
        ?.fail_reason ||
      "TikTok publishing failed";

    console.error(
      "TikTok publishing failed:",
      {
        publishId:
          post.platform_post_id,

        failReason,

        response:
          data,
      }
    );

    return {
      status:
        "failed",

      response:
        data,

      platformPostId:
        post.platform_post_id,

      error:
        failReason,
    };
  }

  // ==============================================
  // STILL PROCESSING
  //
  // Common examples:
  //
  // PROCESSING_UPLOAD
  // PROCESSING_DOWNLOAD
  // SEND_TO_USER_INBOX
  // ==============================================

  console.log(
    "TikTok is still processing:",
    {
      publishId:
        post.platform_post_id,

      status:
        tikTokStatus,
    }
  );

  return {
    status:
      "processing",

    response:
      data,

    platformPostId:
      post.platform_post_id,

    error:
      null,
  };
}

// ==================================================
// CHUNK CALCULATION
// ==================================================

function calculateTikTokChunks(
  videoSize: number
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

  /*
   * ==================================================
   * CRITICAL FIX
   * ==================================================
   *
   * For a file that fits inside TikTok's maximum
   * individual chunk size, upload the ENTIRE file as
   * one chunk.
   *
   * Example from your current test:
   *
   * videoSize:
   * 18,786,404
   *
   * OLD / INVALID:
   *
   * chunkSize:
   * 10,000,000
   *
   * totalChunkCount:
   * 1
   *
   * NEW / CORRECT:
   *
   * chunkSize:
   * 18,786,404
   *
   * totalChunkCount:
   * 1
   */

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

  /*
   * ==================================================
   * FILES LARGER THAN 64 MB
   * ==================================================
   *
   * Determine how many chunks are needed if no chunk
   * may exceed our configured 64 MB limit.
   */

  const totalChunkCount =
    Math.ceil(
      videoSize /
        TIKTOK_MAX_CHUNK_SIZE
    );

  /*
   * Divide the complete video as evenly as possible.
   *
   * Using floor here means:
   *
   * normal chunks = chunkSize
   * final chunk    = remaining bytes
   *
   * The final chunk can therefore be a few bytes larger
   * than the earlier chunks, but it will remain below the
   * 64 MB maximum because totalChunkCount was calculated
   * using ceil(videoSize / maxChunkSize).
   */

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
      (totalChunkCount -
        1);

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

// ==================================================
// MIME TYPE
// ==================================================

function getTikTokVideoMimeType({
  mediaUrl,
  responseContentType,
}: {
  mediaUrl: string;
  responseContentType:
    | string
    | null;
}) {
  const headerMime =
    responseContentType
      ?.split(";")[0]
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
      .split("?")[0];

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

// ==================================================
// SAFE JSON PARSER
// ==================================================

async function safeJsonResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
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