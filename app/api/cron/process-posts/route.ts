import { NextResponse } from "next/server";
import { processScheduledPosts } from "@/lib/posting-worker";

export async function GET() {
  try {
    console.log("CRON: process-posts triggered");

    await processScheduledPosts();

    return NextResponse.json({
      ok: true,
      message: "Scheduled posts processed successfully",
    });
  } catch (error: any) {
    console.error("CRON PROCESS-POSTS ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error processing posts",
      },
      { status: 500 }
    );
  }
}