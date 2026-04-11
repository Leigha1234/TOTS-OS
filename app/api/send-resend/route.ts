import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// @ts-ignore
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>', //
      to: [email],
      subject: 'Set Your TOTS OS Password',
      html: `<p>Welcome! Click <a href="https://tots-os.co.uk/set-password">here</a> to set your password.</p>`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}