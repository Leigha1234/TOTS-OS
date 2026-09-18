import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/auth";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ============================================================
// TYPES
// ============================================================

type BookingConfirmationBody = {
  bookingPageId?: string;

  eventId?: string;

  customerName?: string;
  customerEmail?: string;

  bookingTitle?: string;

  date?: string;
  time?: string;

  duration?: number;

  location?: string | null;

  meetingOption?:
    | "online"
    | "in_person";

  meetingLink?: string | null;

  ownerUserId?: string;

  ownerName?: string | null;
  ownerEmail?: string | null;

  startTime?: string;
  endTime?: string;

  timezone?: string;
};

// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(
  value:
    | string
    | null
    | undefined
) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}

// ============================================================
// ICS ESCAPING
// ============================================================

function escapeIcsText(
  value:
    | string
    | null
    | undefined
) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

// ============================================================
// ICS DATE
// ============================================================

function toIcsDate(
  value: string
) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";
}

// ============================================================
// CREATE CALENDAR INVITE
// ============================================================

function createCalendarInvite({
  uid,
  title,
  startTime,
  endTime,
  description,
  location,
}: {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string;
  location?: string | null;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//TOTS-OS//Booking//EN",

    "BEGIN:VEVENT",

    `UID:${escapeIcsText(uid)}`,

    `DTSTAMP:${toIcsDate(
      new Date().toISOString()
    )}`,

    `DTSTART:${toIcsDate(
      startTime
    )}`,

    `DTEND:${toIcsDate(
      endTime
    )}`,

    `SUMMARY:${escapeIcsText(
      title
    )}`,

    `DESCRIPTION:${escapeIcsText(
      description
    )}`,
  ];

  if (location) {
    lines.push(
      `LOCATION:${escapeIcsText(
        location
      )}`
    );
  }

  lines.push(
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

// ============================================================
// EMAIL WRAPPER
// ============================================================

function emailWrapper(
  content: string
) {
  return `
    <!DOCTYPE html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>TOTS-OS Booking</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#FAF8F5;
          font-family:
            Inter,
            Arial,
            sans-serif;
          color:#4f4a46;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background:#FAF8F5;
            padding:32px 16px;
          "
        >
          <tr>
            <td align="center">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width:600px;
                  background:#ffffff;
                  border-radius:24px;
                  overflow:hidden;
                  border:1px solid #eee9e4;
                "
              >

                <tr>
                  <td
                    style="
                      padding:24px 28px;
                      background:#4f4a46;
                    "
                  >
                    <div
                      style="
                        font-size:12px;
                        font-weight:700;
                        letter-spacing:2px;
                        color:#A9B897;
                      "
                    >
                      TOTS-OS
                    </div>

                    <div
                      style="
                        margin-top:5px;
                        font-size:13px;
                        color:#ffffff;
                        opacity:0.8;
                      "
                    >
                      Bookings
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:32px 28px;
                    "
                  >
                    ${content}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:20px 28px;
                      background:#FAF8F5;
                      font-size:11px;
                      line-height:18px;
                      color:#8b8682;
                    "
                  >
                    Sent automatically by
                    TOTS-OS.
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // ========================================================
    // READ BODY
    // ========================================================

    const body =
      (await request.json()) as BookingConfirmationBody;

    const customerName =
      body.customerName?.trim();

    const customerEmail =
      body.customerEmail
        ?.trim()
        .toLowerCase();

    const bookingTitle =
      body.bookingTitle?.trim();

    const ownerUserId =
      body.ownerUserId?.trim();

    const suppliedOwnerEmail =
      body.ownerEmail
        ?.trim()
        .toLowerCase();

    const suppliedOwnerName =
      body.ownerName?.trim();

    const startTime =
      body.startTime;

    const endTime =
      body.endTime;

    const duration =
      Number(
        body.duration || 0
      );

    const location =
      body.location?.trim() ||
      null;

    const meetingLink =
      body.meetingLink?.trim() ||
      null;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !customerName ||
      !customerEmail ||
      !bookingTitle ||
      !ownerUserId ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            "Missing booking confirmation details",
        },
        {
          status: 400,
        }
      );
    }

    const parsedStart =
      new Date(startTime);

    const parsedEnd =
      new Date(endTime);

    if (
      Number.isNaN(
        parsedStart.getTime()
      ) ||
      Number.isNaN(
        parsedEnd.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid booking date or time",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase =
      await createClient();

    // ========================================================
    // OWNER DETAILS
    //
    // IMPORTANT:
    // BookingClient already sends ownerEmail.
    //
    // We use that first and only use profiles as a fallback.
    // ========================================================

    let ownerEmail =
      suppliedOwnerEmail;

    let ownerName =
      suppliedOwnerName;

    if (
      !ownerEmail ||
      !ownerName
    ) {
      const {
        data: owner,
        error: ownerError,
      } = await supabase
        .from("profiles")
        .select(
          "email, full_name"
        )
        .eq(
          "id",
          ownerUserId
        )
        .maybeSingle();

      if (ownerError) {
        console.error(
          "OWNER LOOKUP ERROR:",
          ownerError
        );
      }

      if (!ownerEmail) {
        ownerEmail =
          owner?.email
            ?.trim()
            .toLowerCase() ||
          undefined;
      }

      if (!ownerName) {
        ownerName =
          owner?.full_name
            ?.trim() ||
          undefined;
      }
    }

    // ========================================================
    // DATE/TIME DISPLAY
    // ========================================================

    const formattedDate =
      parsedStart.toLocaleDateString(
        "en-GB",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

    const formattedStartTime =
      parsedStart.toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );

    const formattedEndTime =
      parsedEnd.toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );

    // ========================================================
    // CALENDAR INVITE
    // ========================================================

    const calendarUid =
      body.eventId
        ? `${body.eventId}@tots-os.co.uk`
        : `${crypto.randomUUID()}@tots-os.co.uk`;

    const calendarInvite =
      createCalendarInvite({
        uid: calendarUid,

        title:
          bookingTitle,

        startTime,

        endTime,

        location,

        description:
          `${bookingTitle} with ${customerName}. Customer email: ${customerEmail}`,
      });

    const attachment = {
      filename:
        "tots-os-booking.ics",

      content:
        Buffer.from(
          calendarInvite
        ).toString(
          "base64"
        ),
    };

    // ========================================================
    // CUSTOMER EMAIL
    // ========================================================

    const customerResult =
      await resend.emails.send({
        from:
          "TOTS-OS Bookings <bookings@tots-os.co.uk>",

        to:
          customerEmail,

        subject:
          `Booking confirmed — ${bookingTitle}`,

        attachments: [
          attachment,
        ],

        html:
          emailWrapper(`
            <div
              style="
                display:inline-block;
                padding:7px 12px;
                border-radius:999px;
                background:#edf2e9;
                color:#6f8064;
                font-size:11px;
                font-weight:700;
                letter-spacing:1px;
                text-transform:uppercase;
              "
            >
              Booking confirmed
            </div>

            <h1
              style="
                margin:18px 0 8px;
                font-size:27px;
                line-height:34px;
                color:#292624;
              "
            >
              You're booked.
            </h1>

            <p
              style="
                margin:0;
                font-size:15px;
                line-height:24px;
                color:#6b6662;
              "
            >
              Hi ${escapeHtml(
                customerName
              )}, your meeting${
                ownerName
                  ? ` with <strong>${escapeHtml(
                      ownerName
                    )}</strong>`
                  : ""
              } has been confirmed.
            </p>

            <div
              style="
                margin-top:26px;
                padding:22px;
                border-radius:18px;
                background:#FAF8F5;
                border:1px solid #eee9e4;
              "
            >
              <p
                style="
                  margin:0 0 12px;
                  font-size:17px;
                  font-weight:700;
                  color:#292624;
                "
              >
                ${escapeHtml(
                  bookingTitle
                )}
              </p>

              <p
                style="
                  margin:6px 0;
                  font-size:14px;
                  color:#5f5a56;
                "
              >
                <strong>Date:</strong>
                ${escapeHtml(
                  formattedDate
                )}
              </p>

              <p
                style="
                  margin:6px 0;
                  font-size:14px;
                  color:#5f5a56;
                "
              >
                <strong>Time:</strong>
                ${escapeHtml(
                  formattedStartTime
                )}
                –
                ${escapeHtml(
                  formattedEndTime
                )}
              </p>

              ${
                duration
                  ? `
                    <p
                      style="
                        margin:6px 0;
                        font-size:14px;
                        color:#5f5a56;
                      "
                    >
                      <strong>Duration:</strong>
                      ${duration} minutes
                    </p>
                  `
                  : ""
              }

              ${
                location
                  ? `
                    <p
                      style="
                        margin:6px 0;
                        font-size:14px;
                        color:#5f5a56;
                      "
                    >
                      <strong>Location:</strong>
                      ${escapeHtml(
                        location
                      )}
                    </p>
                  `
                  : ""
              }
            </div>

            ${
              meetingLink
                ? `
                  <div
                    style="
                      margin-top:24px;
                    "
                  >
                    <a
                      href="${escapeHtml(
                        meetingLink
                      )}"
                      style="
                        display:inline-block;
                        padding:13px 20px;
                        border-radius:12px;
                        background:#4f4a46;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:13px;
                        font-weight:700;
                      "
                    >
                      Join meeting
                    </a>
                  </div>
                `
                : ""
            }

            <p
              style="
                margin:24px 0 0;
                font-size:12px;
                line-height:20px;
                color:#8b8682;
              "
            >
              A calendar invite is attached
              to this email.
            </p>
          `),
      });

    if (
      customerResult.error
    ) {
      console.error(
        "CUSTOMER EMAIL ERROR:",
        customerResult.error
      );

      throw new Error(
        "Customer confirmation email failed"
      );
    }

    // ========================================================
    // OWNER EMAIL
    // ========================================================

    let ownerEmailSent =
      false;

    let ownerEmailError:
      unknown = null;

    if (ownerEmail) {
      const dashboardUrl =
        new URL(
          "/calendar",
          request.url
        ).toString();

      const ownerResult =
        await resend.emails.send({
          from:
            "TOTS-OS Bookings <bookings@tots-os.co.uk>",

          to:
            ownerEmail,

          subject:
            `New booking — ${customerName} booked ${bookingTitle}`,

          attachments: [
            attachment,
          ],

          html:
            emailWrapper(`
              <div
                style="
                  display:inline-block;
                  padding:7px 12px;
                  border-radius:999px;
                  background:#edf2e9;
                  color:#6f8064;
                  font-size:11px;
                  font-weight:700;
                  letter-spacing:1px;
                  text-transform:uppercase;
                "
              >
                New booking
              </div>

              <h1
                style="
                  margin:18px 0 8px;
                  font-size:27px;
                  line-height:34px;
                  color:#292624;
                "
              >
                Someone booked a meeting with you.
              </h1>

              <p
                style="
                  margin:0;
                  font-size:15px;
                  line-height:24px;
                  color:#6b6662;
                "
              >
                ${
                  ownerName
                    ? `Hi ${escapeHtml(
                        ownerName
                      )}, `
                    : ""
                }

                <strong>
                  ${escapeHtml(
                    customerName
                  )}
                </strong>

                has booked

                <strong>
                  ${escapeHtml(
                    bookingTitle
                  )}
                </strong>

                with you.
              </p>

              <div
                style="
                  margin-top:26px;
                  padding:22px;
                  border-radius:18px;
                  background:#FAF8F5;
                  border:1px solid #eee9e4;
                "
              >
                <p
                  style="
                    margin:0 0 14px;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1.4px;
                    text-transform:uppercase;
                    color:#A9B897;
                  "
                >
                  Booking details
                </p>

                <p
                  style="
                    margin:7px 0;
                    font-size:14px;
                    color:#5f5a56;
                  "
                >
                  <strong>Customer:</strong>
                  ${escapeHtml(
                    customerName
                  )}
                </p>

                <p
                  style="
                    margin:7px 0;
                    font-size:14px;
                    color:#5f5a56;
                  "
                >
                  <strong>Email:</strong>
                  <a
                    href="mailto:${escapeHtml(
                      customerEmail
                    )}"
                    style="
                      color:#5f5a56;
                    "
                  >
                    ${escapeHtml(
                      customerEmail
                    )}
                  </a>
                </p>

                <p
                  style="
                    margin:7px 0;
                    font-size:14px;
                    color:#5f5a56;
                  "
                >
                  <strong>Meeting:</strong>
                  ${escapeHtml(
                    bookingTitle
                  )}
                </p>

                <p
                  style="
                    margin:7px 0;
                    font-size:14px;
                    color:#5f5a56;
                  "
                >
                  <strong>Date:</strong>
                  ${escapeHtml(
                    formattedDate
                  )}
                </p>

                <p
                  style="
                    margin:7px 0;
                    font-size:14px;
                    color:#5f5a56;
                  "
                >
                  <strong>Time:</strong>
                  ${escapeHtml(
                    formattedStartTime
                  )}
                  –
                  ${escapeHtml(
                    formattedEndTime
                  )}
                </p>

                ${
                  duration
                    ? `
                      <p
                        style="
                          margin:7px 0;
                          font-size:14px;
                          color:#5f5a56;
                        "
                      >
                        <strong>Duration:</strong>
                        ${duration} minutes
                      </p>
                    `
                    : ""
                }

                ${
                  location
                    ? `
                      <p
                        style="
                          margin:7px 0;
                          font-size:14px;
                          color:#5f5a56;
                        "
                      >
                        <strong>Location:</strong>
                        ${escapeHtml(
                          location
                        )}
                      </p>
                    `
                    : ""
                }
              </div>

              <div
                style="
                  margin-top:24px;
                "
              >
                <a
                  href="${escapeHtml(
                    dashboardUrl
                  )}"
                  style="
                    display:inline-block;
                    padding:13px 20px;
                    border-radius:12px;
                    background:#4f4a46;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:700;
                  "
                >
                  Open TOTS-OS Calendar
                </a>
              </div>

              <p
                style="
                  margin:24px 0 0;
                  font-size:12px;
                  line-height:20px;
                  color:#8b8682;
                "
              >
                This meeting has already
                been added to your TOTS-OS
                calendar. A calendar invite
                is also attached.
              </p>
            `),
        });

      if (
        ownerResult.error
      ) {
        ownerEmailError =
          ownerResult.error;

        console.error(
          "OWNER EMAIL ERROR:",
          ownerResult.error
        );
      } else {
        ownerEmailSent =
          true;
      }
    } else {
      console.error(
        "OWNER EMAIL NOT AVAILABLE:",
        {
          ownerUserId,
          suppliedOwnerEmail:
            body.ownerEmail,
        }
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      customerEmailSent:
        true,

      ownerEmailSent,

      ownerEmail:
        ownerEmail || null,

      ownerEmailError:
        ownerEmailError
          ? "Owner notification failed"
          : null,
    });
  } catch (error) {
    console.error(
      "BOOKING CONFIRMATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send booking confirmation emails",
      },
      {
        status: 500,
      }
    );
  }
}