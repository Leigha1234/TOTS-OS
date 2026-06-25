import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// -----------------------------
// Clients
// -----------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: server-only
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// -----------------------------
// Route
// -----------------------------
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 1. Generate Supabase reset link (server-side)
    // -----------------------------
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/set-password`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const resetUrl = data?.properties?.action_link;

    if (!resetUrl) {
      return NextResponse.json(
        { error: "Failed to generate reset link" },
        { status: 500 }
      );
    }

    // -----------------------------
    // 2. Send email via Resend (TOTS OS branded)
    // -----------------------------
    await resend.emails.send({
      from: "TOTS OS Security <no-reply@yourdomain.com>",
      to: email,
      subject: "Reset your TOTS OS password",

      html: `
      <div style="font-family: Inter, Arial, sans-serif; background:#0f0f0f; padding:40px;">
        <div style="max-width:520px; margin:0 auto; background:#111; border-radius:16px; padding:32px; border:1px solid #222;">

          <h1 style="color:#ffffff; font-size:20px; margin-bottom:8px;">
            Security Request
          </h1>

          <p style="color:#a1a1a1; font-size:13px; line-height:1.6;">
            We received a request to reset your <strong style="color:#fff;">TOTS OS</strong> password.
            If this was you, you can safely reset it below.
          </p>

          <a href="${resetUrl}"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 18px;
              background:#ffffff;
              color:#000;
              text-decoration:none;
              font-weight:600;
              border-radius:10px;
              font-size:13px;
            ">
            Reset Password
          </a>

          <p style="margin-top:24px; color:#666; font-size:11px; line-height:1.5;">
            This link will expire for security reasons.<br/>
            If you didn’t request this, you can ignore this email.
          </p>

          <div style="margin-top:30px; padding-top:16px; border-top:1px solid #222; color:#444; font-size:10px;">
            TOTS OS · Secure Workspace Platform
          </div>

        </div>
      </div>
      `,
    });

    // -----------------------------
    // 3. Done
    // -----------------------------
    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}