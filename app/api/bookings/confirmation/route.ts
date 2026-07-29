import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      bookingTitle,
      date,
      time,
      duration,
      location,
      ownerUserId,
    } = body;

    if (!customerEmail || !ownerUserId) {
      return NextResponse.json(
        { error: "Missing booking email details" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", ownerUserId)
      .single();

    if (ownerError) {
      console.error("Owner lookup failed:", ownerError);
    }

    const ownerEmail = owner?.email;

    const formattedDate = new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await resend.emails.send({
      from: "TOTS-OS Bookings <bookings@tots-os.co.uk>",
      to: customerEmail,
      subject: `Booking confirmed - ${bookingTitle}`,
      html: `
        <h2>Your booking is confirmed</h2>
        <p>Hi ${customerName},</p>
        <p>Your booking has been successfully confirmed.</p>
        <hr />
        <p><strong>Meeting:</strong> ${bookingTitle}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
        <br />
        <p>We look forward to speaking with you.</p>
      `,
    });

    if (ownerEmail) {
      await resend.emails.send({
        from: "TOTS-OS Bookings <bookings@tots-os.co.uk>",
        to: ownerEmail,
        subject: `New booking received - ${bookingTitle}`,
        html: `
          <h2>New booking received</h2>
          <p>A new booking has been made.</p>
          <hr />
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Meeting:</strong> ${bookingTitle}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Duration:</strong> ${duration} minutes</p>
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking confirmation email error:", error);

    return NextResponse.json(
      { error: "Failed to send booking confirmation emails" },
      { status: 500 }
    );
  }
}
