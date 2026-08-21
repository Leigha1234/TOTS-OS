import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: authHeader
            ? {
                Authorization: authHeader,
              }
            : {},
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      to,
      subject,
      html,
      senderName,
      replyTo,
    } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          error:
            "Recipient, subject and HTML are required.",
        },
        { status: 400 }
      );
    }

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(to).trim()
      );

    if (!validEmail) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid test email address.",
        },
        { status: 400 }
      );
    }

    /*
     * This route expects your existing email provider.
     *
     * If TOTS-OS already uses Resend, replace this section
     * with the exact same Resend setup used elsewhere.
     *
     * For now this uses Resend because it is the most likely
     * provider in a Next.js campaign setup.
     */

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured.",
        },
        { status: 503 }
      );
    }

    const { Resend } = await import("resend");

    const resend = new Resend(
      resendApiKey
    );

 const resolvedSenderName =
  String(senderName || "TOTS-OS").trim();

const from = fromEmail.includes("<")
  ? fromEmail
  : `${resolvedSenderName} <${fromEmail}>`;

    const result =
      await resend.emails.send({
        from,
        to: [String(to).trim()],
        subject:
          String(subject).trim(),
        html: String(html),
        replyTo:
          replyTo &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            String(replyTo).trim()
          )
            ? String(replyTo).trim()
            : undefined,
      });

    if (result.error) {
      console.error(
        "Campaign test email error:",
        result.error
      );

      return NextResponse.json(
        {
          error:
            result.error.message ||
            "Test email could not be sent.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent.",
      id: result.data?.id || null,
    });
  } catch (error) {
    console.error(
      "Campaign send-test route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Test email could not be sent.",
      },
      { status: 500 }
    );
  }
}
