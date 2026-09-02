// app/api/social/media/route.ts

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

const ALLOWED_MEDIA_HOSTS =
  new Set([
    "onytzlfsegmcngchsnnl.supabase.co",
  ]);

const ALLOWED_MEDIA_PATH_PREFIX =
  "/storage/v1/object/public/social-assets/";

const MAX_MEDIA_BYTES =
  100 * 1024 * 1024;

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isAllowedMediaUrl(
  value:
    string
) {
  let url:
    URL;

  try {
    url =
      new URL(
        value
      );
  } catch {
    return false;
  }

  if (
    url.protocol !==
    "https:"
  ) {
    return false;
  }

  if (
    !ALLOWED_MEDIA_HOSTS.has(
      url.hostname.toLowerCase()
    )
  ) {
    return false;
  }

  if (
    !url.pathname.startsWith(
      ALLOWED_MEDIA_PATH_PREFIX
    )
  ) {
    return false;
  }

  return true;
}

function getSafeContentType(
  value:
    string | null
) {
  const contentType =
    cleanString(
      value
    )
      .split(";")[0]
      .toLowerCase();

  if (
    contentType.startsWith(
      "image/"
    ) ||
    contentType.startsWith(
      "video/"
    )
  ) {
    return contentType;
  }

  return "application/octet-stream";
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  const sourceUrl =
    cleanString(
      request.nextUrl.searchParams.get(
        "url"
      )
    );

  if (
    !sourceUrl
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Missing media URL.",
      },
      {
        status:
          400,
      }
    );
  }

  if (
    !isAllowedMediaUrl(
      sourceUrl
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Media URL is not allowed.",
      },
      {
        status:
          403,
      }
    );
  }

  try {
    const response =
      await fetch(
        sourceUrl,
        {
          method:
            "GET",

          cache:
            "no-store",

          redirect:
            "error",
        }
      );

    if (
      !response.ok
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            `Could not fetch media. HTTP ${response.status}.`,
        },
        {
          status:
            502,
        }
      );
    }

    const contentLengthHeader =
      response.headers.get(
        "content-length"
      );

    if (
      contentLengthHeader
    ) {
      const contentLength =
        Number(
          contentLengthHeader
        );

      if (
        Number.isFinite(
          contentLength
        ) &&
        contentLength >
          MAX_MEDIA_BYTES
      ) {
        return NextResponse.json(
          {
            success:
              false,

            error:
              "Media file is too large.",
          },
          {
            status:
              413,
          }
        );
      }
    }

    const bytes =
      await response
        .arrayBuffer();

    if (
      bytes.byteLength >
      MAX_MEDIA_BYTES
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Media file is too large.",
        },
        {
          status:
            413,
        }
      );
    }

    const contentType =
      getSafeContentType(
        response.headers.get(
          "content-type"
        )
      );

    return new NextResponse(
      bytes,
      {
        status:
          200,

        headers: {
          "Content-Type":
            contentType,

          "Content-Length":
            String(
              bytes.byteLength
            ),

          "Cache-Control":
            "public, max-age=3600, s-maxage=3600",

          "X-Content-Type-Options":
            "nosniff",

          "Content-Disposition":
            "inline",
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[SOCIAL MEDIA PROXY] Error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          "Could not load media.",
      },
      {
        status:
          502,
      }
    );
  }
}
