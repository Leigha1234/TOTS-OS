import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();

    // 🔍 Debug: see exactly what is being sent into the API
    console.log("EMAIL REQUEST RECEIVED:", { to, subject, body });

    // 🚨 Guard: prevent accidental misrouting
    if (!to || typeof to !== "string") {
      return Response.json(
        {
          success: false,
          error: "Missing or invalid 'to' email address",
        },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return Response.json(
        {
          success: false,
          error: "Missing subject or body",
        },
        { status: 400 }
      );
    }

   const data = await resend.emails.send({
  from: "hello@tots-os.co.uk", // Change this to your verified domain email
  to: [to],
  subject,
  html: `<p>${body}</p>`,
});

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("EMAIL API ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Unknown error sending email",
      },
      { status: 500 }
    );
  }
}