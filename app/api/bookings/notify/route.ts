import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendKey || !fromEmail) {
      return NextResponse.json(
        {
          error: "Email service is not configured",
        },
        {
          status: 500,
        }
      );
    }

    const body = await req.json();

    const {
      bookingPageId,
      bookingOwnerId,
      eventId,
      customerName,
      customerEmail,
      startTime,
      endTime,
      location,
      meetingLink,
      notes,
      bookingTitle,
    } = body;

    if (!bookingOwnerId) {
      return NextResponse.json(
        {
          error: "Missing booking owner",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // LOAD BOOKING PAGE OWNER
    // ==================================================

    const {
      data: ownerProfile,
      error: ownerError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        name,
        full_name,
        email
      `
      )
      .eq("id", bookingOwnerId)
      .maybeSingle();

    if (ownerError) {
      console.error(
        "Booking owner lookup failed:",
        ownerError
      );

      return NextResponse.json(
        {
          error: "Could not load booking owner",
        },
        {
          status: 500,
        }
      );
    }

    if (!ownerProfile?.email) {
      return NextResponse.json(
        {
          error: "Booking owner has no email address",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // OPTIONAL BOOKING PAGE LOOKUP
    // ==================================================

    let resolvedBookingTitle =
      bookingTitle ||
      "New booking";

    if (bookingPageId) {
      const {
        data: bookingPage,
      } = await supabaseAdmin
        .from("booking_pages")
        .select("title")
        .eq("id", bookingPageId)
        .maybeSingle();

      if (bookingPage?.title) {
        resolvedBookingTitle =
          bookingPage.title;
      }
    }

    // ==================================================
    // DATE FORMATTING
    // ==================================================

    const formattedStart =
      startTime
        ? new Date(
            startTime
          ).toLocaleString(
            "en-GB",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        : "Not provided";

    const formattedEnd =
      endTime
        ? new Date(
            endTime
          ).toLocaleString(
            "en-GB",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        : null;

    const ownerName =
      ownerProfile.full_name ||
      ownerProfile.name ||
      "there";

    const resend =
      new Resend(
        resendKey
      );

    // ==================================================
    // SEND OWNER NOTIFICATION
    // ==================================================

    const {
      data,
      error,
    } = await resend.emails.send({
      from: fromEmail,

      to: ownerProfile.email,

      subject: `New booking: ${resolvedBookingTitle}`,

      html: `
        <div
          style="
            background:#f7f6f2;
            padding:40px 20px;
            font-family:Arial,Helvetica,sans-serif;
            color:#292524;
          "
        >
          <div
            style="
              max-width:600px;
              margin:0 auto;
              background:#ffffff;
              border-radius:24px;
              padding:40px;
            "
          >

            <p
              style="
                margin:0 0 12px;
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:0.18em;
                font-weight:700;
                color:#8fa07d;
              "
            >
              TOTS-OS Booking
            </p>

            <h1
              style="
                margin:0 0 24px;
                font-size:30px;
                line-height:1.15;
                color:#1c1917;
              "
            >
              You have a new booking
            </h1>

            <p
              style="
                margin:0 0 28px;
                font-size:15px;
                line-height:1.7;
                color:#57534e;
              "
            >
              Hi ${escapeHtml(ownerName)}, someone has just booked
              <strong>${escapeHtml(resolvedBookingTitle)}</strong>
              with you.
            </p>

            <div
              style="
                background:#fafaf9;
                border-radius:18px;
                padding:24px;
                margin-bottom:28px;
              "
            >

              ${
                customerName
                  ? `
                    <p style="margin:0 0 12px;font-size:14px;">
                      <strong>Name:</strong>
                      ${escapeHtml(customerName)}
                    </p>
                  `
                  : ""
              }

              ${
                customerEmail
                  ? `
                    <p style="margin:0 0 12px;font-size:14px;">
                      <strong>Email:</strong>
                      ${escapeHtml(customerEmail)}
                    </p>
                  `
                  : ""
              }

              <p style="margin:0 0 12px;font-size:14px;">
                <strong>Date & time:</strong>
                ${escapeHtml(formattedStart)}
                ${
                  formattedEnd
                    ? ` – ${escapeHtml(formattedEnd)}`
                    : ""
                }
              </p>

              ${
                location
                  ? `
                    <p style="margin:0 0 12px;font-size:14px;">
                      <strong>Location:</strong>
                      ${escapeHtml(location)}
                    </p>
                  `
                  : ""
              }

              ${
                meetingLink
                  ? `
                    <p style="margin:0 0 12px;font-size:14px;">
                      <strong>Meeting link:</strong>
                      <a
                        href="${escapeHtml(meetingLink)}"
                        style="color:#71805f;"
                      >
                        Open meeting
                      </a>
                    </p>
                  `
                  : ""
              }

              ${
                notes
                  ? `
                    <p style="margin:0;font-size:14px;line-height:1.6;">
                      <strong>Notes:</strong><br />
                      ${escapeHtml(notes)}
                    </p>
                  `
                  : ""
              }

            </div>

            <p
              style="
                margin:0;
                font-size:11px;
                color:#a8a29e;
                text-align:center;
              "
            >
              This booking has been added to your TOTS-OS calendar.
            </p>

          </div>
        </div>
      `,
    });

    if (error) {
      console.error(
        "Booking notification email failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to send booking notification",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id || null,
      eventId: eventId || null,
    });
  } catch (error) {
    console.error(
      "Booking notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send booking notification",
      },
      {
        status: 500,
      }
    );
  }
}

function escapeHtml(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}