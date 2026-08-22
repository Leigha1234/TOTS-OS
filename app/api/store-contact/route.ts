import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// CONSTANTS
// ============================================================

const TOTS_INBOX =
  "hello@tots-os.co.uk";

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;

// ============================================================
// TYPES
// ============================================================

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;

  storeName?: unknown;
  storeSlug?: unknown;
  pageUrl?: unknown;

  // Honeypot.
  website?: unknown;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function escapeHtml(
  value: unknown
) {
  return String(
    value ?? ""
  )
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

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "full",

      timeStyle:
        "short",

      timeZone:
        "Europe/London",
    }
  ).format(
    value
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // ========================================================
    // ENVIRONMENT
    // ========================================================

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (
      !resendApiKey
    ) {
      console.error(
        "Store contact error: RESEND_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "Messaging is temporarily unavailable.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !fromEmail
    ) {
      console.error(
        "Store contact error: RESEND_FROM_EMAIL is missing."
      );

      return NextResponse.json(
        {
          error:
            "Messaging is temporarily unavailable.",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    let body:
      ContactPayload;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // HONEYPOT
    // ========================================================

    const honeypot =
      cleanString(
        body.website
      );

    if (
      honeypot
    ) {
      /*
       * Pretend it worked.
       *
       * Bots that fill every input should not
       * learn that they were detected.
       */

      return NextResponse.json({
        success:
          true,
      });
    }

    // ========================================================
    // CLEAN VALUES
    // ========================================================

    const name =
      cleanString(
        body.name
      );

    const email =
      cleanString(
        body.email
      ).toLowerCase();

    const message =
      cleanString(
        body.message
      );

    const storeName =
      cleanString(
        body.storeName
      ) ||
      "TOTS Storefront";

    const storeSlug =
      cleanString(
        body.storeSlug
      ) ||
      "unknown-store";

    const pageUrl =
      cleanString(
        body.pageUrl
      );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !name
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter your name.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Your name is too long.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter your email address.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      email.length >
        MAX_EMAIL_LENGTH ||
      !isValidEmail(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !message
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a message.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Your message is too long.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // SEND
    // ========================================================

    const submittedAt =
      new Date();

    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              from:
                fromEmail,

              to: [
                TOTS_INBOX,
              ],

              reply_to:
                email,

              subject:
                `New storefront enquiry — ${storeName}`,

              text: `
New TOTS storefront enquiry

Store: ${storeName}
Store slug: ${storeSlug}

Name: ${name}
Email: ${email}

Message:
${message}

Page:
${pageUrl || "Not available"}

Received:
${formatDate(submittedAt)}
              `.trim(),

              html: `
                <div
                  style="
                    margin:0;
                    padding:32px 18px;
                    background:#f7f5f2;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#292524;
                  "
                >
                  <div
                    style="
                      max-width:640px;
                      margin:0 auto;
                      background:#ffffff;
                      border:1px solid #e7e5e4;
                      border-radius:26px;
                      overflow:hidden;
                    "
                  >
                    <div
                      style="
                        padding:32px;
                        border-bottom:1px solid #f5f5f4;
                      "
                    >
                      <div
                        style="
                          display:inline-block;
                          padding:8px 13px;
                          border-radius:999px;
                          background:#edf1e8;
                          color:#748361;
                          font-size:10px;
                          line-height:1;
                          font-weight:700;
                          letter-spacing:1.6px;
                          text-transform:uppercase;
                        "
                      >
                        TOTS storefront enquiry
                      </div>

                      <h1
                        style="
                          margin:22px 0 8px;
                          font-size:30px;
                          line-height:1.15;
                          color:#1c1917;
                        "
                      >
                        Someone wants to talk 🤍
                      </h1>

                      <p
                        style="
                          margin:0;
                          color:#78716c;
                          font-size:14px;
                          line-height:1.6;
                        "
                      >
                        A visitor sent a message through
                        ${escapeHtml(
                          storeName
                        )}.
                      </p>
                    </div>

                    <div
                      style="
                        padding:28px 32px;
                      "
                    >
                      <table
                        role="presentation"
                        style="
                          width:100%;
                          border-collapse:collapse;
                          font-size:14px;
                        "
                      >
                        <tr>
                          <td
                            style="
                              padding:11px 0;
                              color:#a8a29e;
                            "
                          >
                            Store
                          </td>

                          <td
                            style="
                              padding:11px 0;
                              text-align:right;
                              font-weight:700;
                              color:#44403c;
                            "
                          >
                            ${escapeHtml(
                              storeName
                            )}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              color:#a8a29e;
                            "
                          >
                            Name
                          </td>

                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              text-align:right;
                              font-weight:700;
                              color:#44403c;
                            "
                          >
                            ${escapeHtml(
                              name
                            )}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              color:#a8a29e;
                            "
                          >
                            Email
                          </td>

                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              text-align:right;
                              font-weight:700;
                              color:#44403c;
                            "
                          >
                            ${escapeHtml(
                              email
                            )}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              color:#a8a29e;
                            "
                          >
                            Received
                          </td>

                          <td
                            style="
                              padding:11px 0;
                              border-top:1px solid #f5f5f4;
                              text-align:right;
                              font-weight:700;
                              color:#44403c;
                            "
                          >
                            ${escapeHtml(
                              formatDate(
                                submittedAt
                              )
                            )}
                          </td>
                        </tr>
                      </table>

                      <div
                        style="
                          margin-top:24px;
                          padding:22px;
                          border-radius:18px;
                          background:#faf9f6;
                        "
                      >
                        <p
                          style="
                            margin:0 0 10px;
                            color:#a8a29e;
                            font-size:10px;
                            font-weight:700;
                            letter-spacing:1.4px;
                            text-transform:uppercase;
                          "
                        >
                          Message
                        </p>

                        <p
                          style="
                            margin:0;
                            white-space:pre-wrap;
                            color:#44403c;
                            font-size:15px;
                            line-height:1.7;
                          "
                        >${escapeHtml(
                          message
                        )}</p>
                      </div>

                      ${
                        pageUrl
                          ? `
                            <p
                              style="
                                margin:20px 0 0;
                                color:#a8a29e;
                                font-size:11px;
                                line-height:1.6;
                                word-break:break-all;
                              "
                            >
                              Sent from:
                              ${escapeHtml(
                                pageUrl
                              )}
                            </p>
                          `
                          : ""
                      }
                    </div>

                    <div
                      style="
                        padding:18px 32px;
                        background:#1c1917;
                        color:#d6d3d1;
                        font-size:11px;
                        line-height:1.5;
                      "
                    >
                      Reply directly to this email and your
                      response will go to
                      ${escapeHtml(
                        email
                      )}.
                    </div>
                  </div>
                </div>
              `,
            }),
        }
      );

    const responseData =
      await response
        .json()
        .catch(
          () =>
            null
        );

    if (
      !response.ok
    ) {
      console.error(
        "Resend storefront contact error:",
        responseData
      );

      throw new Error(
        responseData
          ?.message ||
          responseData
            ?.error ||
          "Message could not be sent."
      );
    }

    console.log(
      "Storefront contact sent:",
      responseData
    );

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Message sent successfully.",
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Store contact API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "We couldn't send your message right now.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}