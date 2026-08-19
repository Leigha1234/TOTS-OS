import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// ============================================================
// TYPES
// ============================================================

type SendEmailRequest = {
  to?: string;
  email?: string;
  subject?: string;
  body?: string;
  html?: string;
  message?: string;
  type?: string;
};

// ============================================================
// HELPERS
// ============================================================

function normaliseEmail(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// POST
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        "SEND EMAIL ERROR: RESEND_API_KEY is missing"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Email service is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const resend =
      new Resend(
        resendApiKey
      );

    // ==========================================================
    // BODY
    // ==========================================================

    let payload: SendEmailRequest;

    try {
      payload =
        (await req.json()) as SendEmailRequest;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const to =
      normaliseEmail(
        payload.to ||
          payload.email
      );

    const subject =
      typeof payload.subject ===
      "string"
        ? payload.subject.trim()
        : "";

    const body =
      typeof payload.body ===
      "string"
        ? payload.body.trim()
        : typeof payload.message ===
            "string"
          ? payload.message.trim()
          : "";

    const suppliedHtml =
      typeof payload.html ===
      "string"
        ? payload.html.trim()
        : "";

    console.log(
      "EMAIL REQUEST RECEIVED:",
      {
        to,
        subject,
        hasBody:
          Boolean(body),
        hasHtml:
          Boolean(
            suppliedHtml
          ),
        type:
          payload.type ||
          null,
      }
    );

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing or invalid 'to' email address",
        },
        {
          status: 400,
        }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing subject",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body &&
      !suppliedHtml
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing email body",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // EMAIL CONTENT
    // ==========================================================

    const html =
      suppliedHtml ||
      `
        <div
          style="
            font-family:Arial,Helvetica,sans-serif;
            line-height:1.6;
            color:#4f4a46;
          "
        >
          <p>
            ${escapeHtml(body)}
          </p>
        </div>
      `;

    // ==========================================================
    // SEND THROUGH RESEND
    // ==========================================================

    const {
      data,
      error,
    } =
      await resend.emails.send({
        from:
          "TOTS-OS <hello@tots-os.co.uk>",

        to: [
          to,
        ],

        subject,

        html,

        text:
          body ||
          undefined,
      });

    // ==========================================================
    // IMPORTANT:
    // Resend SDK can return an error object without throwing.
    // ==========================================================

    if (error) {
      console.error(
        "RESEND SEND ERROR:",
        {
          to,
          subject,
          error,
        }
      );

      return NextResponse.json(
        {
          success: false,

          error:
            error.message ||
            "Resend rejected the email.",

          resendError:
            error,
        },
        {
          status: 500,
        }
      );
    }

    if (!data?.id) {
      console.error(
        "RESEND SEND ERROR: No email ID returned",
        {
          to,
          subject,
          data,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Resend did not return an email ID.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "EMAIL ACCEPTED BY RESEND:",
      {
        id:
          data.id,
        to,
        subject,
      }
    );

    return NextResponse.json(
      {
        success: true,

        id:
          data.id,

        to,

        message:
          "Email accepted by Resend.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "EMAIL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error sending email",
      },
      {
        status: 500,
      }
    );
  }
}