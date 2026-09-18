import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractBookingCustomer(description?: string | null) {
  if (!description) return null;

  const match = description.match(
    /^Booking requested by\s+(.+?)\s+\(([^()\s]+@[^()\s]+)\)/i
  );

  if (!match) return null;

  return {
    name: match[1].trim(),
    email: match[2].trim().toLowerCase(),
  };
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
      console.error("BOOKING CANCELLATION ENVIRONMENT ERROR", {
        resendConfigured: Boolean(resendApiKey),
        supabaseUrlConfigured: Boolean(supabaseUrl),
        serviceRoleConfigured: Boolean(serviceRoleKey),
      });

      return NextResponse.json(
        { error: "Booking cancellation is not configured correctly." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "You must be signed in to cancel a booking." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";

    if (!eventId) {
      return NextResponse.json(
        { error: "A booking event ID is required." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("BOOKING CANCELLATION AUTH ERROR:", userError);

      return NextResponse.json(
        { error: "Your session could not be verified. Please sign in again." },
        { status: 401 }
      );
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,user_id,title,description,start_time,end_time,location")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      console.error("BOOKING CANCELLATION EVENT LOOKUP ERROR:", eventError);
      return NextResponse.json(
        { error: "Unable to find this booking." },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: "This booking no longer exists." },
        { status: 404 }
      );
    }

    if (event.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to cancel this booking." },
        { status: 403 }
      );
    }

    const customer = extractBookingCustomer(event.description);

    if (!customer) {
      return NextResponse.json(
        { error: "This calendar item is not a customer booking." },
        { status: 400 }
      );
    }

    const meetingTitle = String(event.title || "Meeting")
      .replace(new RegExp(`\\s+-\\s+${customer.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "")
      .trim() || "Meeting";

    const start = event.start_time ? new Date(event.start_time) : null;
    const end = event.end_time ? new Date(event.end_time) : null;

    const dateLabel = start
      ? new Intl.DateTimeFormat("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Europe/London",
        }).format(start)
      : "the scheduled date";

    const timeLabel = start
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Europe/London",
        }).format(start)
      : "";

    const endTimeLabel = end
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Europe/London",
        }).format(end)
      : "";

    // Delete first so the slot immediately becomes available again.
    const { error: deleteError } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", event.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("BOOKING CANCELLATION DELETE ERROR:", deleteError);
      return NextResponse.json(
        { error: "Unable to remove the booking from your calendar." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const safeName = escapeHtml(customer.name);
    const safeTitle = escapeHtml(meetingTitle);
    const safeDate = escapeHtml(dateLabel);
    const safeTime = escapeHtml(timeLabel);
    const safeEndTime = escapeHtml(endTimeLabel);

    const timeText = timeLabel
      ? `${timeLabel}${endTimeLabel ? `–${endTimeLabel}` : ""}`
      : "";

    const text = [
      `Hi ${customer.name},`,
      "",
      `Your ${meetingTitle} appointment on ${dateLabel}${timeText ? ` at ${timeText}` : ""} has been cancelled by the organiser.`,
      "",
      "If you would like to arrange another time, please return to the booking page you originally used.",
      "",
      "TOTS-OS Bookings",
    ].join("\n");

    const html = `
      <div style="margin:0;padding:32px 16px;background:#faf8f5;font-family:Arial,sans-serif;color:#292524;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;padding:32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#829473;margin-bottom:14px;">TOTS-OS Bookings</div>
          <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;color:#1c1917;">Your meeting has been cancelled</h1>
          <p style="font-size:15px;line-height:1.7;margin:0 0 18px;color:#57534e;">Hi ${safeName},</p>
          <p style="font-size:15px;line-height:1.7;margin:0 0 22px;color:#57534e;">The organiser has cancelled your booking.</p>
          <div style="background:#f5f5f4;border-radius:14px;padding:18px;margin:0 0 22px;">
            <p style="margin:0 0 8px;font-size:14px;"><strong>Meeting:</strong> ${safeTitle}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${safeDate}</p>
            ${safeTime ? `<p style="margin:0;font-size:14px;"><strong>Time:</strong> ${safeTime}${safeEndTime ? `–${safeEndTime}` : ""}</p>` : ""}
          </div>
          <p style="font-size:14px;line-height:1.7;margin:0;color:#78716c;">If you would like to arrange another time, please return to the booking page you originally used.</p>
        </div>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "TOTS-OS Bookings <bookings@tots-os.co.uk>",
      to: customer.email,
      subject: `Cancelled — ${meetingTitle}`,
      text,
      html,
    });

    if (emailError) {
      console.error("BOOKING CANCELLATION EMAIL ERROR:", emailError);

      // The booking has already been cancelled. Do not return a failing
      // status that could encourage a duplicate cancellation attempt.
      return NextResponse.json({
        success: true,
        cancelled: true,
        customerEmailSent: false,
        warning: "The booking was cancelled, but the customer email could not be sent.",
      });
    }

    console.log("BOOKING CANCELLED:", {
      eventId: event.id,
      ownerUserId: user.id,
      customerEmail: customer.email,
      resendId: emailData?.id || null,
    });

    return NextResponse.json({
      success: true,
      cancelled: true,
      customerEmailSent: true,
    });
  } catch (error) {
    console.error("BOOKING CANCELLATION ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to cancel this booking.",
      },
      { status: 500 }
    );
  }
}
