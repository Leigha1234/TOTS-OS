import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();

  try {
    const data = await resend.emails.send({
      from: "Your App <onboarding@resend.dev>",
      to,
      subject,
      html: `<p>${body}</p>`,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }
}