import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

function createCalendarInvite({
  title,
  startTime,
  endTime,
  description,
  location,
}: {
  title: string;
  startTime: string;
  endTime: string;
  description: string;
  location?: string;
}) {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TOTS-OS//Booking//EN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${new Date(startTime).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(endTime).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${title}
DESCRIPTION:${description}
${location ? `LOCATION:${location}` : ""}
END:VEVENT
END:VCALENDAR`;
}

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
      startTime,
      endTime,
    } = body;

    if (!customerEmail || !ownerUserId || !startTime || !endTime) {
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

    const calendarInvite = createCalendarInvite({
      title: bookingTitle,
      startTime,
      endTime,
      location,
      description: `Booking with ${customerName}`,
    });

    const attachment = {
      filename: "booking.ics",
      content: Buffer.from(calendarInvite).toString("base64"),
    };

    await resend.emails.send({
      from: "TOTS-OS Bookings <bookings@tots-os.co.uk>",
      to: customerEmail,
      subject: `Booking confirmed - ${bookingTitle}`,
      attachments: [attachment],
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
        <p>The calendar invite is attached.</p>
      `,
    });

    if (ownerEmail) {
      await resend.emails.send({
        from: "TOTS-OS Bookings <bookings@tots-os.co.uk>",
        to: ownerEmail,
        subject: `New booking received - ${bookingTitle}`,
        attachments: [attachment],
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
          <p>The calendar invite is attached.</p>
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
