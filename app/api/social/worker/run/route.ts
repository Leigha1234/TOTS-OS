import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          error: "Missing CRON_SECRET",
        },
        {
          status: 500,
        }
      );
    }

    const origin = new URL(request.url).origin;

    const response = await fetch(
      `${origin}/api/cron/publish`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
        cache: "no-store",
      }
    );

    const result = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.error ||
            "Social publishing worker failed",
          details: result,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "Social worker run error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run social publishing worker",
      },
      {
        status: 500,
      }
    );
  }
}