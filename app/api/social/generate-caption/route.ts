// app/api/social/generate-caption/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// CONFIG
// ============================================================

const DEFAULT_MODEL =
  "gpt-5.6-luna";

const MAX_IMAGES =
  10;

const MAX_IMAGE_SIZE =
  20 *
  1024 *
  1024;

// ============================================================
// TYPES
// ============================================================

type GeneratedSocialContent = {
  caption:
    string;

  hashtags:
    string;
};

type OpenAIContentItem =
  | {
      type:
        "input_text";

      text:
        string;
    }
  | {
      type:
        "input_image";

      image_url:
        string;
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
// SAFE JSON
// ============================================================

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

// ============================================================
// PARSE JSON STRING
// ============================================================

function parseJsonString(
  value:
    string
): any {
  const cleaned =
    value
      .trim()
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/,
        ""
      )
      .trim();

  try {
    return JSON.parse(
      cleaned
    );
  } catch {
    /*
     * Sometimes a model may include a small amount of text
     * around the JSON despite instructions.
     *
     * Try extracting the first JSON object.
     */
    const firstBrace =
      cleaned.indexOf(
        "{"
      );

    const lastBrace =
      cleaned.lastIndexOf(
        "}"
      );

    if (
      firstBrace >=
        0 &&
      lastBrace >
        firstBrace
    ) {
      const possibleJson =
        cleaned.slice(
          firstBrace,
          lastBrace +
            1
        );

      try {
        return JSON.parse(
          possibleJson
        );
      } catch {
        return null;
      }
    }

    return null;
  }
}

// ============================================================
// ARRAY FIELD
// ============================================================

function parseStringArray(
  value:
    FormDataEntryValue | null
): string[] {
  if (
    !value ||
    typeof value !==
      "string"
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed
        .map(
          (
            item
          ) =>
            cleanString(
              item
            )
        )
        .filter(
          Boolean
        );
    }
  } catch {
    /*
     * Fallback for comma-separated strings.
     */
  }

  return value
    .split(
      ","
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );
}

// ============================================================
// MEDIA URL HELPERS
// ============================================================

function getCleanMediaUrl(
  value:
    string
) {
  return value
    .toLowerCase()
    .split(
      "?"
    )[0]
    .split(
      "#"
    )[0];
}

// ============================================================

function looksLikeVideoUrl(
  value:
    string
) {
  const url =
    getCleanMediaUrl(
      value
    );

  return [
    ".mp4",
    ".mov",
    ".m4v",
    ".webm",
    ".avi",
    ".mpeg",
    ".mpg",
  ].some(
    (
      extension
    ) =>
      url.endsWith(
        extension
      )
  );
}

// ============================================================

function looksLikeImageUrl(
  value:
    string
) {
  if (
    !value
  ) {
    return false;
  }

  if (
    value.startsWith(
      "data:image/"
    )
  ) {
    return true;
  }

  const url =
    getCleanMediaUrl(
      value
    );

  if (
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".avif",
    ].some(
      (
        extension
      ) =>
        url.endsWith(
          extension
        )
    )
  ) {
    return true;
  }

  /*
   * Supabase/public CDN URLs may not always expose the
   * extension clearly.
   *
   * If it is HTTP(S) and does not look like a video,
   * allow OpenAI to attempt to retrieve it.
   */
  return (
    (
      value.startsWith(
        "https://"
      ) ||
      value.startsWith(
        "http://"
      )
    ) &&
    !looksLikeVideoUrl(
      value
    )
  );
}

// ============================================================
// FILE -> DATA URL
// ============================================================

async function fileToDataUrl(
  file:
    File
) {
  const bytes =
    Buffer.from(
      await file.arrayBuffer()
    );

  return `data:${file.type};base64,${bytes.toString(
    "base64"
  )}`;
}

// ============================================================
// GET OUTPUT TEXT
// ============================================================

function getOpenAIOutputText(
  response:
    any
) {
  /*
   * Some SDK/API responses expose output_text directly.
   */
  if (
    typeof response
      ?.output_text ===
      "string"
  ) {
    return response
      .output_text
      .trim();
  }

  /*
   * Responses API fallback.
   */
  if (
    Array.isArray(
      response?.output
    )
  ) {
    const textParts:
      string[] =
      [];

    for (
      const outputItem of
      response.output
    ) {
      if (
        !Array.isArray(
          outputItem
            ?.content
        )
      ) {
        continue;
      }

      for (
        const contentItem of
        outputItem.content
      ) {
        if (
          typeof contentItem
            ?.text ===
            "string"
        ) {
          textParts.push(
            contentItem.text
          );
        }
      }
    }

    return textParts
      .join(
        "\n"
      )
      .trim();
  }

  return "";
}

// ============================================================
// NORMALISE HASHTAGS
// ============================================================

function normaliseHashtags(
  value:
    unknown
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (
          hashtag
        ) =>
          cleanString(
            hashtag
          )
      )
      .filter(
        Boolean
      )
      .map(
        (
          hashtag
        ) =>
          hashtag.startsWith(
            "#"
          )
            ? hashtag
            : `#${hashtag.replace(
                /\s+/g,
                ""
              )}`
      )
      .join(
        " "
      );
  }

  const stringValue =
    cleanString(
      value
    );

  if (
    !stringValue
  ) {
    return "";
  }

  /*
   * If the model returned normal hashtag text,
   * preserve it while ensuring every item has #.
   */
  return stringValue
    .split(
      /\s+/
    )
    .map(
      (
        hashtag
      ) =>
        hashtag.trim()
    )
    .filter(
      Boolean
    )
    .map(
      (
        hashtag
      ) =>
        hashtag.startsWith(
          "#"
        )
          ? hashtag
          : `#${hashtag.replace(
              /^#+/,
              ""
            )}`
    )
    .join(
      " "
    );
}

// ============================================================
// BUILD PROMPT
// ============================================================

function buildPrompt({
  businessName,
  businessDescription,
  audience,
  tone,
  goals,
  platforms,
  format,
  currentCaption,
  currentHashtags,
  imageCount,
  videoCount,
}: {
  businessName:
    string;

  businessDescription:
    string;

  audience:
    string;

  tone:
    string;

  goals:
    string;

  platforms:
    string[];

  format:
    string;

  currentCaption:
    string;

  currentHashtags:
    string;

  imageCount:
    number;

  videoCount:
    number;
}) {
  return `
You are the social media copywriter inside TOTS-OS.

Your job is to analyse the supplied social media images and create a polished caption and relevant hashtags for the business.

IMPORTANT:
Actually inspect every supplied image.
Do not invent details that cannot reasonably be inferred from the images or supplied business context.

BUSINESS
Name: ${businessName || "Unknown business"}

About:
${businessDescription || "No business description supplied."}

Target audience:
${audience || "Not supplied."}

Brand tone:
${tone || "Natural, confident, friendly and human."}

Business goals:
${goals || "Not supplied."}

POST
Platform(s): ${
    platforms.length
      ? platforms.join(
          ", "
        )
      : "Not selected"
  }

Format: ${format || "Post"}

Images supplied: ${imageCount}

Videos referenced: ${videoCount}

${
  videoCount >
  0
    ? `
The post also contains video media.
You have not been given the complete video itself, so do not claim to know something that is only visible inside the video.
Use the visible images and the rest of the context to create an appropriate caption.
`
    : ""
}

EXISTING USER TEXT
${
  currentCaption
    ? `
The user has already written this caption or draft:
${currentCaption}

Use this as guidance. Improve it rather than ignoring the user's intent.
`
    : "There is no existing caption."
}

${
  currentHashtags
    ? `
Existing hashtags:
${currentHashtags}

You may retain strong ones but improve the final selection.
`
    : ""
}

WRITING STYLE
- Write like a real person or business owner, not an AI.
- Avoid generic marketing filler.
- Avoid phrases such as "unlock", "elevate", "game-changer", "journey", "we're thrilled", and other obvious AI clichés unless genuinely appropriate.
- Match the subject and energy visible in the media.
- Use British English.
- Keep the opening line strong.
- Make the caption useful, engaging or conversational.
- Emojis are allowed when they suit the brand and media, but do not overuse them.
- Do not describe the image mechanically.
- Do not say "in this image", "pictured here", or similar.
- Do not mention that AI analysed the media.
- If the images contain important readable wording, dates, names, offers or calls to action, incorporate those details naturally where appropriate.
- If multiple images form a carousel, understand them together as one post.
- Do not create fake prices, dates, names, statistics, events or offers.

HASHTAGS
- Generate relevant, specific hashtags.
- Prefer niche/business/local hashtags over generic spam hashtags.
- Avoid irrelevant viral tags.
- Do not repeat hashtags.
- Return approximately 5 hashtags unless the context strongly calls for fewer.

OUTPUT
Return ONLY valid JSON.

Use exactly this structure:

{
  "caption": "the completed caption",
  "hashtags": "#tagone #tagtwo #tagthree #tagfour #tagfive"
}
`.trim();
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
    // CONFIG
    // ========================================================

    const apiKey =
      process.env
        .OPENAI_API_KEY
        ?.trim();

    if (
      !apiKey
    ) {
      console.error(
        "[SOCIAL AI] OPENAI_API_KEY is missing."
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "AI caption generation is not configured. Add OPENAI_API_KEY to your environment variables.",
        },
        {
          status:
            500,
        }
      );
    }

    const model =
      process.env
        .OPENAI_SOCIAL_MODEL
        ?.trim() ||
      DEFAULT_MODEL;

    // ========================================================
    // FORM DATA
    // ========================================================

    let formData:
      FormData;

    try {
      formData =
        await request.formData();
    } catch (
      error
    ) {
      console.error(
        "[SOCIAL AI] Could not read form data:",
        error
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The AI request could not be read.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // BUSINESS CONTEXT
    // ========================================================

    const businessName =
      cleanString(
        formData.get(
          "businessName"
        )
      );

    const businessDescription =
      cleanString(
        formData.get(
          "businessDescription"
        )
      );

    const audience =
      cleanString(
        formData.get(
          "audience"
        )
      );

    const tone =
      cleanString(
        formData.get(
          "tone"
        )
      );

    const goals =
      cleanString(
        formData.get(
          "goals"
        )
      );

    // ========================================================
    // POST CONTEXT
    // ========================================================

    const platforms =
      parseStringArray(
        formData.get(
          "platforms"
        )
      );

    const format =
      cleanString(
        formData.get(
          "format"
        )
      );

    const currentCaption =
      cleanString(
        formData.get(
          "currentCaption"
        )
      );

    const currentHashtags =
      cleanString(
        formData.get(
          "currentHashtags"
        )
      );

    // ========================================================
    // EXISTING MEDIA URLS
    // ========================================================

    const suppliedMediaUrls =
      parseStringArray(
        formData.get(
          "mediaUrls"
        )
      );

    // ========================================================
    // NEW FILES
    // ========================================================

    const allEntries =
      formData.getAll(
        "files"
      );

    const uploadedFiles =
      allEntries.filter(
        (
          entry
        ): entry is File =>
          entry instanceof
            File &&
          entry.size >
            0
      );

    // ========================================================
    // VALIDATE MEDIA
    // ========================================================

    const imageFiles =
      uploadedFiles.filter(
        (
          file
        ) =>
          file.type.startsWith(
            "image/"
          )
      );

    const videoFiles =
      uploadedFiles.filter(
        (
          file
        ) =>
          file.type.startsWith(
            "video/"
          )
      );

    const remoteImageUrls =
      suppliedMediaUrls.filter(
        (
          url
        ) =>
          looksLikeImageUrl(
            url
          )
      );

    const remoteVideoUrls =
      suppliedMediaUrls.filter(
        (
          url
        ) =>
          looksLikeVideoUrl(
            url
          )
      );

    const totalImages =
      imageFiles.length +
      remoteImageUrls.length;

    const totalVideos =
      videoFiles.length +
      remoteVideoUrls.length;

    if (
      totalImages ===
        0 &&
      totalVideos ===
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Add an image or video before generating a caption.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // IMAGE COUNT
    // ========================================================

    if (
      totalImages >
      MAX_IMAGES
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            `AI caption generation supports up to ${MAX_IMAGES} images at once.`,
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // FILE SIZE
    // ========================================================

    for (
      const file of
      imageFiles
    ) {
      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        return NextResponse.json(
          {
            success:
              false,

            error:
              `${file.name} is too large for AI analysis. Please use an image under 20 MB.`,
          },
          {
            status:
              400,
          }
        );
      }
    }

    // ========================================================
    // BUILD MODEL CONTENT
    // ========================================================

    const content:
      OpenAIContentItem[] =
      [];

    const prompt =
      buildPrompt({
        businessName,

        businessDescription,

        audience,

        tone,

        goals,

        platforms,

        format,

        currentCaption,

        currentHashtags,

        imageCount:
          totalImages,

        videoCount:
          totalVideos,
      });

    content.push({
      type:
        "input_text",

      text:
        prompt,
    });

    // ========================================================
    // EXISTING IMAGE URLS
    // ========================================================

    for (
      const imageUrl of
      remoteImageUrls.slice(
        0,
        MAX_IMAGES
      )
    ) {
      content.push({
        type:
          "input_image",

        image_url:
          imageUrl,
      });
    }

    // ========================================================
    // NEW IMAGE FILES
    // ========================================================

    const remainingImageSlots =
      Math.max(
        0,
        MAX_IMAGES -
        remoteImageUrls.length
      );

    for (
      const file of
      imageFiles.slice(
        0,
        remainingImageSlots
      )
    ) {
      const dataUrl =
        await fileToDataUrl(
          file
        );

      content.push({
        type:
          "input_image",

        image_url:
          dataUrl,
      });
    }

    // ========================================================
    // OPENAI RESPONSES API
    // ========================================================

    console.log(
      "[SOCIAL AI] Generating caption:",
      {
        model,

        businessName,

        platforms,

        format,

        imageCount:
          totalImages,

        videoCount:
          totalVideos,
      }
    );

    const openAIResponse =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model,

              input: [
                {
                  role:
                    "user",

                  content,
                },
              ],

              /*
               * We want polished copy but don't need an
               * enormous response.
               */
              max_output_tokens:
                1200,
            }),

          cache:
            "no-store",
        }
      );

    const openAIData =
      await safeJsonResponse(
        openAIResponse
      );

    // ========================================================
    // OPENAI ERROR
    // ========================================================

    if (
      !openAIResponse.ok
    ) {
      console.error(
        "[SOCIAL AI] OpenAI request failed:",
        {
          status:
            openAIResponse.status,

          result:
            openAIData,
        }
      );

      const apiMessage =
        cleanString(
          openAIData
            ?.error
            ?.message
        );

      return NextResponse.json(
        {
          success:
            false,

          error:
            apiMessage ||
            "AI caption generation failed.",
        },
        {
          status:
            openAIResponse.status >=
              400 &&
            openAIResponse.status <
              600
              ? openAIResponse.status
              : 500,
        }
      );
    }

    // ========================================================
    // EXTRACT OUTPUT
    // ========================================================

    const outputText =
      getOpenAIOutputText(
        openAIData
      );

    if (
      !outputText
    ) {
      console.error(
        "[SOCIAL AI] OpenAI returned no text:",
        openAIData
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The AI did not return a caption. Please try again.",
        },
        {
          status:
            502,
        }
      );
    }

    // ========================================================
    // PARSE RESULT
    // ========================================================

    const parsed =
      parseJsonString(
        outputText
      );

    if (
      !parsed
    ) {
      console.error(
        "[SOCIAL AI] Could not parse model result:",
        outputText
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The AI generated a response but it could not be read. Please try again.",
        },
        {
          status:
            502,
        }
      );
    }

    const caption =
      cleanString(
        parsed.caption
      );

    const hashtags =
      normaliseHashtags(
        parsed.hashtags
      );

    if (
      !caption
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "The AI did not generate a caption. Please try again.",
        },
        {
          status:
            502,
        }
      );
    }

    const result:
      GeneratedSocialContent = {
        caption,

        hashtags,
      };

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[SOCIAL AI] Caption generated successfully:",
      {
        model,

        captionLength:
          caption.length,

        hasHashtags:
          Boolean(
            hashtags
          ),

        imagesAnalysed:
          totalImages,

        videosReferenced:
          totalVideos,
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        ...result,

        metadata: {
          model,

          imagesAnalysed:
            totalImages,

          videosReferenced:
            totalVideos,

          /*
           * Videos aren't sent directly to the vision model
           * by this endpoint. We'll use extracted frames from
           * the Social Studio client when we add video
           * analysis.
           */
          fullVideoAnalysis:
            false,
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
    error:
      unknown
  ) {
    console.error(
      "[SOCIAL AI] Unexpected error:",
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
            : "AI caption generation failed.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}