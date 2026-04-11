import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY!);

    // 1. Generate the magic setup link in Supabase
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore - bypasses strict type check for 'invite'
      type: 'invite',
      email: email,
      options: { redirectTo: 'https://www.tots-os.co.uk/set-password' }
    });

    if (linkError) {
      return NextResponse.json({ error: `Supabase Auth Error: ${linkError.message}` }, { status: 400 });
    }

    // 2. Send the email using your VERIFIED domain
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <hello@tots-os.co.uk>', // Must use @tots-os.co.uk
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h1 style="font-style: italic;">TOTS OS</h1>
          <p>Welcome! Please click the button below to set your password and activate your account access.</p>
          <a href="${data.properties.action_link}" 
             style="background: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin-top: 20px;">
            Set My Password
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link: <br/>
            ${data.properties.action_link}
          </p>
        </div>
      `
    });

    if (resendError) {
      return NextResponse.json({ error: `Resend Error: ${resendError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}