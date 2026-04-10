import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.link) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    // TODO: send email (Resend / Sendgrid)

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}