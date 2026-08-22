import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type PublishWorkerResult = {
  success?: boolean;

  processed?: number;

  published?: number;

  failed?: number;

  skipped?: number;

  error?: string;

  details?: unknown;

  [key: string]: unknown;
};

// ============================================================
// SAFE JSON
// ============================================================

async function readJsonResponse(
  response: Response
): Promise<PublishWorkerResult | null> {
  try {
    return (await response.json()) as PublishWorkerResult;
  } catch {
    return null;
  }
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
// The actual Facebook / Instagram publishing logic lives in:
//
// /api/cron/publish
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const cronSecret =
      process.env.CRON_SECRET?.trim();

    if (!cronSecret) {
      console.error(
        "[SOCIAL WORKER] CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing CRON_SECRET",
        },
        {
          status: 500,

          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ========================================================
    // BUILD INTERNAL WORKER URL
    // ========================================================

    const requestUrl =
      new URL(request.url);

    const origin =
      requestUrl.origin;

    const publishUrl =
      `${origin}/api/cron/publish`;

    console.log(
      "[SOCIAL WORKER] Triggering publishing worker:",
      publishUrl
    );

    // ========================================================
    // RUN REAL PUBLISHING WORKER
    // ========================================================

    const response =
      await fetch(
        publishUrl,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${cronSecret}`,

            Accept:
              "application/json",
          },

          cache: "no-store",
        }
      );

    // ========================================================
    // READ RESULT
    // ========================================================

    const result =
      await readJsonResponse(
        response
      );

    // ========================================================
    // WORKER FAILED
    // ========================================================

    if (!response.ok) {
      console.error(
        "[SOCIAL WORKER] Publishing worker failed:",
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
          success: false,

          error:
            result?.error ||
            "Social publishing worker failed",

          details:
            result,
        },
        {
          status:
            response.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[SOCIAL WORKER] Publishing worker completed:",
      result
    );

    return NextResponse.json(
      {
        success: true,

        result:
          result || {
            success: true,
          },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "[SOCIAL WORKER] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to run social publishing worker",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}