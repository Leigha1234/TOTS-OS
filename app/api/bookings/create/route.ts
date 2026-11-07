import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { bookingPageId, customerName, customerEmail, startTime, meetingOption } = payload ?? {};
    if (
      typeof bookingPageId !== "string" || !/^[0-9a-f-]{36}$/i.test(bookingPageId) ||
      typeof customerName !== "string" || typeof customerEmail !== "string" ||
      typeof startTime !== "string" || Number.isNaN(Date.parse(startTime)) ||
      !["online", "in_person"].includes(meetingOption)
    ) return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "Booking service unavailable" }, { status: 503 });
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data, error } = await admin.rpc("create_linked_public_booking", {
      p_booking_page_id: bookingPageId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_start_time: startTime,
      p_meeting_option: meetingOption,
    });
    if (error) {
      console.error("Public booking transaction failed:", error);
      return NextResponse.json({ error: error.code === "23P01" ? "That slot has just been booked" : "Could not complete booking" },
        { status: error.code === "23P01" ? 409 : 400 });
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.event_id || !row?.booking_id) throw new Error("Booking transaction returned no IDs");

    // Best-effort email to accepted calendar-share recipients. A failed email
    // never undoes an already committed appointment.
    try {
      const { data: page } = await admin.from("booking_pages")
        .select("title,organisation_id").eq("id", bookingPageId).single();
      const { data: shares } = await admin.from("calendar_shares")
        .select("notify_email").eq("booking_page_id", bookingPageId)
        .eq("source_organisation_id", page?.organisation_id)
        .eq("status", "accepted").eq("email_notifications", true);
      const recipients = [...new Set((shares ?? []).map(s => s.notify_email).filter((x): x is string => !!x))];
      if (recipients.length && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        for (const to of recipients) {
          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to,
            subject: `New shared booking: ${page?.title ?? "Appointment"}`,
            text: `A new appointment was booked.\nBooking: ${page?.title ?? "Appointment"}\nCustomer: ${customerName}\nEmail: ${customerEmail}\nStart: ${startTime}\nView the appointment in your shared TOTS-OS calendar.`,
          });
          if (result.error) console.error("Shared booking notification failed", result.error);
        }
      }
    } catch (notifyError) { console.error("Shared booking notification failed", notifyError); }

    return NextResponse.json({ eventId: row.event_id, bookingId: row.booking_id });
  } catch (error) {
    console.error("Create public booking failed", error);
    return NextResponse.json({ error: "Could not complete booking" }, { status: 500 });
  }
}
