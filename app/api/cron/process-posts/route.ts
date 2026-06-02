import { NextResponse } from "next/server";
import { processScheduledPosts } from "@/lib/posting-worker";

export async function GET() {
  await processScheduledPosts();
  return NextResponse.json({ ok: true });
}