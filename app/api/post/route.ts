import { NextResponse } from "next/server";

// The unscoped legacy scheduled_posts endpoint is not used by Social Studio.
// Keep an explicit response for old clients instead of publishing unchecked.
export async function POST() {
  return NextResponse.json({ error: "Use ORBI. Social Studio to publish." }, { status: 410 });
}
