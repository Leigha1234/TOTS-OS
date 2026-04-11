import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize inside the function to catch environment variable errors
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY!);

    // Generate the invite link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore
      type: 'invite',
      email: email,
      options: { redirectTo: 'https://www.tots-os.co.uk/set-password' }
    });

    if (linkError) {
      return NextResponse.json({ error: `Supabase Auth Error: ${linkError.message}` }, { status: 400 });
    }

    // Attempt to send email
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your Account',
      html: `<p>Click <a href="${data.properties.action_link}">here</a> to set your password.</p>`
    });

    if (resendError) {
      return NextResponse.json({ error: `Resend Error: ${resendError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // This sends the SPECIFIC error back to your browser console
    return NextResponse.json({ error: err.message || 'Server Crash' }, { status: 500 });
  }
}