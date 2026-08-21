import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
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

    // -----------------------------------------
    // AUTHENTICATE USING THE LOGGED-IN SESSION
    // -----------------------------------------

    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

  setAll(
  cookiesToSet: {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  }[]
) {
  try {
    cookiesToSet.forEach(
      ({ name, value, options }) => {
        cookieStore.set(
          name,
          value,
          options
        );
      }
    );
  } catch {
    // This route only needs to read
    // the current auth session.
  }
},
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Campaign test auth error:",
        userError
      );

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // REQUEST BODY
    // -----------------------------------------

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

    const recipientEmail =
      String(to).trim();

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        recipientEmail
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

    // -----------------------------------------
    // RESEND CONFIGURATION
    // -----------------------------------------

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const configuredFrom =
      process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !configuredFrom) {
      console.error(
        "Campaign test email configuration missing."
      );

      return NextResponse.json(
        {
          error:
            "Email service is not configured.",
        },
        { status: 503 }
      );
    }

    const resend =
      new Resend(resendApiKey);

    const resolvedSenderName =
      String(
        senderName ||
          "The Organised Types"
      ).trim();

    /*
     * If RESEND_FROM_EMAIL already contains:
     *
     * TheOrganisedTypes <hello@tots-os.co.uk>
     *
     * use it exactly as configured.
     *
     * Otherwise wrap the plain email with
     * the campaign sender name.
     */

    const from =
      configuredFrom.includes("<")
        ? configuredFrom
        : `${resolvedSenderName} <${configuredFrom}>`;

    // -----------------------------------------
    // OPTIONAL REPLY-TO
    // -----------------------------------------

    let resolvedReplyTo:
      | string
      | undefined;

    if (replyTo) {
      const cleanReplyTo =
        String(replyTo).trim();

      if (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanReplyTo
        )
      ) {
        resolvedReplyTo =
          cleanReplyTo;
      }
    }

    // -----------------------------------------
    // SEND TEST EMAIL
    // -----------------------------------------

    const result =
      await resend.emails.send({
        from,
        to: [recipientEmail],
        subject:
          String(subject).trim(),
        html: String(html),
        replyTo:
          resolvedReplyTo,
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

    console.log(
      "Campaign test email sent:",
      {
        userId: user.id,
        to: recipientEmail,
        emailId:
          result.data?.id || null,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Test email sent.",
      id:
        result.data?.id || null,
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