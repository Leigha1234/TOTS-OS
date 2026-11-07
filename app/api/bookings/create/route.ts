import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { bookingPageId, customerName, customerEmail, startTime, meetingOption, serviceId } = payload ?? {};
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

    // Fail closed: a page configured to require payment must never be booked
    // through the legacy free-booking endpoint.
    const { data: paymentPage, error: paymentPageError } = await admin
      .from("booking_pages")
      .select("payment_requirement,price_pence")
      .eq("id", bookingPageId).eq("is_active", true).maybeSingle();
    if (paymentPageError || !paymentPage) return NextResponse.json({ error: "Booking page unavailable" }, { status: 404 });
    if (paymentPage.payment_requirement !== "none") {
      return NextResponse.json({ error: "Online payment is required for this appointment. Checkout is not yet available." }, { status: 409 });
    }

    // Catalogue bookings require a selected service. Do not silently use the page default.
    const { data: services, error: serviceError } = await admin.from("booking_services")
      .select("id,payment_rule").eq("booking_page_id", bookingPageId).eq("is_active", true);
    if (serviceError) return NextResponse.json({ error: "Unable to verify booking services" }, { status: 503 });
    if ((services?.length ?? 0) > 0 && (!serviceId || !services?.some(s => s.id === serviceId))) {
      return NextResponse.json({ error: "Select a valid service" }, { status: 400 });
    }
    const chosen = services?.find(s => s.id === serviceId);
    if (chosen && chosen.payment_rule !== "none") {
      return NextResponse.json({ error: "This service requires online payment. Checkout integration is not enabled for services yet." }, { status: 409 });
    }
    const rpcName = chosen ? "create_public_service_booking" : "create_linked_public_booking";
    const { data, error } = await admin.rpc(rpcName, {
      p_booking_page_id: bookingPageId,
      ...(chosen ? { p_booking_service_id: chosen.id } : {}),
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
