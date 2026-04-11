import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Ensure you have RESEND_API_KEY in your Vercel Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, signupLink } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>', // Update this once your domain is verified in Resend
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `
        <div style="font-family: serif; padding: 20px; background-color: #f9f8f6;">
          <h1 style="font-style: italic;">TOTS OS</h1>
          <p>Click the button below to finalize your account and set your password.</p>
          <a href="${signupLink}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold;">
            ACTIVATE ACCOUNT
          </a>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}