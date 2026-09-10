import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Resend,
} from "resend";

// ============================================================
// TYPES
// ============================================================

type EmailLink = {
  label?: string;
  url?: string;
};

type EmailCTA = {
  label?: string;
  url?: string;
};

type EmailAttachment = {
  name?: string;
  type?: string;
  size?: number;
  data?: string;
};

type SendEmailRequest = {
  fromName?: string;
  fromEmail?: string;

  to?: string;
  email?: string;

  cc?: string;
  bcc?: string;

  subject?: string;

  title?: string;
  preview?: string;

  body?: string;
  html?: string;
  message?: string;

  cta?: EmailCTA;

  links?: EmailLink[];

  attachments?: EmailAttachment[];

  type?: string;
};

// ============================================================
// HELPERS
// ============================================================

function normaliseEmail(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function parseEmailList(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return [];
  }

  return value
    .split(/[;,]/)
    .map((email) =>
      normaliseEmail(email)
    )
    .filter(
      (email) =>
        Boolean(email) &&
        isValidEmail(email)
    );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function normaliseUrl(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url =
      new URL(
        trimmed
      );

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function bodyToHtml(
  body: string
) {
  return escapeHtml(
    body
  )
    .replaceAll(
      "\r\n",
      "\n"
    )
    .replaceAll(
      "\r",
      "\n"
    )
    .split("\n\n")
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;">${paragraph.replaceAll(
          "\n",
          "<br />"
        )}</p>`
    )
    .join("");
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    const resendApiKey =
      process.env
        .RESEND_API_KEY;

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

    // ==========================================================
    // SENDER
    // ==========================================================

    const fromEmail =
      normaliseEmail(
        payload.fromEmail
      );

    const fromName =
      typeof payload.fromName ===
      "string"
        ? payload.fromName.trim()
        : "";

    if (
      !fromEmail ||
      !isValidEmail(
        fromEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid From email address.",
        },
        {
          status: 400,
        }
      );
    }

    const from =
      fromName
        ? `${fromName.replace(/[<>]/g, "")} <${fromEmail}>`
        : fromEmail;

    // ==========================================================
    // RECIPIENTS
    // ==========================================================

    const to =
      normaliseEmail(
        payload.to ||
          payload.email
      );

    const cc =
      parseEmailList(
        payload.cc
      );

    const bcc =
      parseEmailList(
        payload.bcc
      );

    const subject =
      typeof payload.subject ===
      "string"
        ? payload.subject.trim()
        : "";

    const title =
      typeof payload.title ===
      "string"
        ? payload.title.trim()
        : "";

    const preview =
      typeof payload.preview ===
      "string"
        ? payload.preview.trim()
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

    const ctaLabel =
      typeof payload.cta
        ?.label ===
      "string"
        ? payload.cta.label.trim()
        : "";

    const ctaUrl =
      normaliseUrl(
        payload.cta?.url
      );

    const links =
      Array.isArray(
        payload.links
      )
        ? payload.links
            .map(
              (link) => ({
                label:
                  typeof link.label ===
                  "string"
                    ? link.label.trim()
                    : "",
                url:
                  normaliseUrl(
                    link.url
                  ),
              })
            )
            .filter(
              (link) =>
                Boolean(
                  link.label
                ) &&
                Boolean(
                  link.url
                )
            )
        : [];

    const attachments =
      Array.isArray(
        payload.attachments
      )
        ? payload.attachments
            .filter(
              (
                attachment
              ) =>
                Boolean(
                  attachment?.name
                ) &&
                Boolean(
                  attachment?.data
                )
            )
            .map(
              (
                attachment
              ) => ({
                filename:
                  String(
                    attachment.name
                  ),
                content:
                  Buffer.from(
                    String(
                      attachment.data
                    ),
                    "base64"
                  ),
              })
            )
        : [];

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (
      !to ||
      !isValidEmail(to)
    ) {
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

    const previewHtml =
      preview
        ? `
          <div
            style="
              display:none;
              max-height:0;
              overflow:hidden;
              opacity:0;
              color:transparent;
              mso-hide:all;
            "
          >
            ${escapeHtml(
              preview
            )}
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
          </div>
        `
        : "";

    const titleHtml =
      title
        ? `
          <h1
            style="
              margin:0 0 22px;
              font-size:30px;
              line-height:1.15;
              font-weight:700;
              letter-spacing:-0.8px;
              color:#2f2c29;
            "
          >
            ${escapeHtml(
              title
            )}
          </h1>
        `
        : "";

    const bodyHtml =
      body
        ? bodyToHtml(
            body
          )
        : "";

    const ctaHtml =
      ctaLabel &&
      ctaUrl
        ? `
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="margin:28px 0;"
          >
            <tr>
              <td
                style="
                  border-radius:10px;
                  background:#829473;
                "
              >
                <a
                  href="${escapeHtml(
                    ctaUrl
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    font-weight:700;
                    line-height:1;
                    text-decoration:none;
                    color:#ffffff;
                  "
                >
                  ${escapeHtml(
                    ctaLabel
                  )}
                </a>
              </td>
            </tr>
          </table>
        `
        : "";

    const linksHtml =
      links.length > 0
        ? `
          <div
            style="
              margin-top:30px;
              padding-top:24px;
              border-top:1px solid #ece8e4;
            "
          >
            <p
              style="
                margin:0 0 12px;
                font-size:12px;
                line-height:1.4;
                font-weight:700;
                text-transform:uppercase;
                letter-spacing:1px;
                color:#8b8580;
              "
            >
              Useful links
            </p>

            ${links
              .map(
                (
                  link
                ) => `
                  <p style="margin:0 0 8px;">
                    <a
                      href="${escapeHtml(
                        link.url
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        color:#68785e;
                        text-decoration:underline;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        link.label
                      )}
                    </a>
                  </p>
                `
              )
              .join("")}
          </div>
        `
        : "";

    const generatedHtml =
      `
        <!DOCTYPE html>
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <meta
              http-equiv="Content-Type"
              content="text/html; charset=UTF-8"
            />
            <title>
              ${escapeHtml(
                subject
              )}
            </title>
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f7f5f2;
            "
          >
            ${previewHtml}

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="
                width:100%;
                background:#f7f5f2;
                padding:36px 16px;
              "
            >
              <tr>
                <td align="center">
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      width:100%;
                      max-width:640px;
                      background:#ffffff;
                      border-radius:18px;
                      overflow:hidden;
                      border:1px solid #ebe7e2;
                    "
                  >
                    <tr>
                      <td
                        style="
                          padding:28px 34px;
                          background:#4f4a46;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            font-family:Arial,Helvetica,sans-serif;
                            font-size:12px;
                            line-height:1;
                            font-weight:700;
                            text-transform:uppercase;
                            letter-spacing:2px;
                            color:#dfe6da;
                          "
                        >
                          TOTS-OS
                        </p>
                        <p
                          style="
                            margin:8px 0 0;
                            font-family:Arial,Helvetica,sans-serif;
                            font-size:11px;
                            line-height:1.4;
                            color:#d3cfcb;
                          "
                        >
                          by The Organised Types
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:38px 34px;
                          font-family:Arial,Helvetica,sans-serif;
                          font-size:15px;
                          line-height:1.7;
                          color:#4f4a46;
                        "
                      >
                        ${titleHtml}
                        ${bodyHtml}
                        ${ctaHtml}
                        ${linksHtml}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:24px 34px;
                          background:#faf8f5;
                          border-top:1px solid #ece8e4;
                          font-family:Arial,Helvetica,sans-serif;
                        "
                      >
                        <p
                          style="
                            margin:0 0 5px;
                            font-size:12px;
                            line-height:1.5;
                            font-weight:700;
                            color:#4f4a46;
                          "
                        >
                          TOTS-OS
                        </p>
                        <p
                          style="
                            margin:0;
                            font-size:11px;
                            line-height:1.5;
                            color:#938d87;
                          "
                        >
                          Your business, organised.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

    const html =
      suppliedHtml ||
      generatedHtml;

    const plainTextParts: string[] =
      [];

    if (title) {
      plainTextParts.push(
        title
      );
    }

    if (body) {
      plainTextParts.push(
        body
      );
    }

    if (
      ctaLabel &&
      ctaUrl
    ) {
      plainTextParts.push(
        `${ctaLabel}: ${ctaUrl}`
      );
    }

    if (
      links.length >
      0
    ) {
      plainTextParts.push(
        links
          .map(
            (
              link
            ) =>
              `${link.label}: ${link.url}`
          )
          .join(
            "\n"
          )
      );
    }

    const text =
      plainTextParts
        .filter(Boolean)
        .join(
          "\n\n"
        ) ||
      undefined;

    console.log(
      "EMAIL REQUEST RECEIVED:",
      {
        from,
        to,
        ccCount:
          cc.length,
        bccCount:
          bcc.length,
        subject,
        hasBody:
          Boolean(body),
        hasHtml:
          Boolean(
            suppliedHtml
          ),
        hasCTA:
          Boolean(
            ctaLabel &&
              ctaUrl
          ),
        links:
          links.length,
        attachments:
          attachments.length,
        type:
          payload.type ||
          null,
      }
    );

    // ==========================================================
    // SEND THROUGH RESEND
    // ==========================================================

    const {
      data,
      error,
    } =
      await resend.emails.send({
        from,

        to: [
          to,
        ],

        ...(cc.length >
        0
          ? {
              cc,
            }
          : {}),

        ...(bcc.length >
        0
          ? {
              bcc,
            }
          : {}),

        subject,
        html,
        text,

        ...(attachments.length >
        0
          ? {
              attachments,
            }
          : {}),
      });

    if (error) {
      console.error(
        "RESEND SEND ERROR:",
        {
          from,
          to,
          subject,
          error,
        }
      );

      const message =
        error.message ||
        "Resend rejected the email.";

      const looksLikeDomainError =
        /domain|sender|from|verify|verified/i.test(
          message
        );

      return NextResponse.json(
        {
          success: false,
          error:
            looksLikeDomainError
              ? `${message} Make sure the From email uses a domain verified in your Resend account.`
              : message,
          resendError:
            error,
        },
        {
          status: 500,
        }
      );
    }

    if (!data?.id) {
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
        from,
        to,
        subject,
      }
    );

    return NextResponse.json(
      {
        success: true,
        id:
          data.id,
        from,
        to,
        cc,
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
