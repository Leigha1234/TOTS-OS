import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, subject, text } = await req.json();

  console.log("EMAIL:", { to, subject, text });

  // 👉 plug Resend / SendGrid here later

  return NextResponse.json({ success: true });
}