import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type PublishWorkerResult = {
  success?:
    boolean;

  processed?:
    number;

  published?:
    number;

  failed?:
    number;

  skipped?:
    number;

  processing?:
    number;

  scheduled?:
    number;

  error?:
    string;

  message?:
    string;

  details?:
    unknown;

  [key: string]:
    unknown;
};

// ============================================================
// RESPONSE HEADERS
// ============================================================

const NO_CACHE_HEADERS = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate",
};

// ============================================================
// SAFE RESPONSE READER
// ============================================================

async function readWorkerResponse(
  response:
    Response
): Promise<PublishWorkerResult> {
  const text =
    await response.text();

  if (
    !text
  ) {
    return {};
  }

  try {
    return JSON.parse(
      text
    ) as PublishWorkerResult;
  } catch {
    return {
      error:
        response.ok
          ? undefined
          : text,

      details: {
        raw:
          text,
      },
    };
  }
}

// ============================================================
// NUMBER HELPER
// ============================================================

function safeNumber(
  value:
    unknown
) {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

// ============================================================
// RESULT MESSAGE
// ============================================================

function buildWorkerMessage(
  result:
    PublishWorkerResult
) {
  const processed =
    safeNumber(
      result.processed
    );

  const published =
    safeNumber(
      result.published
    );

  const failed =
    safeNumber(
      result.failed
    );

  const skipped =
    safeNumber(
      result.skipped
    );

  const processing =
    safeNumber(
      result.processing
    );

  if (
    failed > 0 &&
    published > 0
  ) {
    return `${published} post${
      published === 1
        ? ""
        : "s"
    } published, but ${failed} failed.`;
  }

  if (
    failed > 0
  ) {
    return `${failed} post${
      failed === 1
        ? ""
        : "s"
    } failed to publish.`;
  }

  if (
    published > 0
  ) {
    return `${published} post${
      published === 1
        ? ""
        : "s"
    } published successfully.`;
  }

  if (
    processing > 0
  ) {
    return `${processing} post${
      processing === 1
        ? " is"
        : "s are"
    } still processing.`;
  }

  if (
    skipped > 0
  ) {
    return `${skipped} post${
      skipped === 1
        ? " was"
        : "s were"
    } skipped.`;
  }

  if (
    processed > 0
  ) {
    return `${processed} publishing job${
      processed === 1
        ? ""
        : "s"
    } processed.`;
  }

  return (
    result.message ||
    "Publishing worker completed. No due posts were found."
  );
}

// ============================================================
// POST
//
// Manually triggers the same publishing worker used by the
// scheduled cron job.
//
// Social Studio calls this route when somebody presses:
//
// - Post Now
// - Publish Now
//
// The actual platform publishing logic lives in:
//
// /api/cron/publish
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const cronSecret =
      process.env
        .CRON_SECRET
        ?.trim();

    if (
      !cronSecret
    ) {
      console.error(
        "[SOCIAL WORKER] CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Social publishing is not configured correctly.",

          code:
            "MISSING_CRON_SECRET",
        },
        {
          status:
            500,

          headers:
            NO_CACHE_HEADERS,
        }
      );
    }

    // ========================================================
    // BUILD INTERNAL WORKER URL
    // ========================================================

    const requestUrl =
      new URL(
        request.url
      );

    const publishUrl =
      new URL(
        "/api/cron/publish",
        requestUrl.origin
      );

    console.log(
      "[SOCIAL WORKER] Triggering publishing worker:",
      publishUrl.toString()
    );

    // ========================================================
    // RUN PUBLISHING WORKER
    // ========================================================

    let response:
      Response;

    try {
      response =
        await fetch(
          publishUrl,
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${cronSecret}`,

              Accept:
                "application/json",
            },

            cache:
              "no-store",
          }
        );
    } catch (
      fetchError:
        unknown
    ) {
      console.error(
        "[SOCIAL WORKER] Could not reach publishing worker:",
        fetchError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The publishing worker could not be reached.",

          details:
            fetchError instanceof
              Error
              ? fetchError.message
              : String(
                  fetchError
                ),
        },
        {
          status:
            502,

          headers:
            NO_CACHE_HEADERS,
        }
      );
    }

    // ========================================================
    // READ WORKER RESULT
    // ========================================================

    const result =
      await readWorkerResponse(
        response
      );

    // ========================================================
    // HTTP FAILURE
    // ========================================================

    if (
      !response.ok
    ) {
      console.error(
        "[SOCIAL WORKER] Publishing worker returned an error:",
        {
          status:
            response.status,

          statusText:
            response.statusText,

          result,
        }
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            result.error ||
            "Social publishing worker failed.",

          details:
            result,

          workerStatus:
            response.status,
        },
        {
          status:
            response.status >=
              400
              ? response.status
              : 500,

          headers:
            NO_CACHE_HEADERS,
        }
      );
    }

    // ========================================================
    // NORMALISE COUNTS
    // ========================================================

    const processed =
      safeNumber(
        result.processed
      );

    const published =
      safeNumber(
        result.published
      );

    const failed =
      safeNumber(
        result.failed
      );

    const skipped =
      safeNumber(
        result.skipped
      );

    const processing =
      safeNumber(
        result.processing
      );

    // ========================================================
    // LOGICAL FAILURE
    //
    // The cron endpoint may itself return HTTP 200 while one
    // or more individual social posts fail.
    //
    // We preserve the result rather than pretending everything
    // published successfully.
    // ========================================================

    const partialSuccess =
      published >
        0 &&
      failed >
        0;

    const completeFailure =
      failed >
        0 &&
      published ===
        0 &&
      processing ===
        0;

    const message =
      buildWorkerMessage(
        result
      );

    if (
      completeFailure
    ) {
      console.error(
        "[SOCIAL WORKER] Publishing completed but all attempted posts failed:",
        result
      );

      return NextResponse.json(
        {
          success:
            false,

          partialSuccess:
            false,

          message,

          error:
            result.error ||
            message,

          processed,

          published,

          failed,

          skipped,

          processing,

          result,
        },
        {
          status:
            500,

          headers:
            NO_CACHE_HEADERS,
        }
      );
    }

    // ========================================================
    // SUCCESS / PARTIAL SUCCESS
    // ========================================================

    console.log(
      "[SOCIAL WORKER] Publishing worker completed:",
      {
        processed,

        published,

        failed,

        skipped,

        processing,

        partialSuccess,

        result,
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        partialSuccess,

        message,

        processed,

        published,

        failed,

        skipped,

        processing,

        result,
      },
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[SOCIAL WORKER] Unexpected error:",
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
            : "Unable to run social publishing worker.",
      },
      {
        status:
          500,

        headers:
          NO_CACHE_HEADERS,
      }
    );
  }
}