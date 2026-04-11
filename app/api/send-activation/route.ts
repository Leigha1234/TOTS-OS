import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Initialize Supabase Admin with Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Initialize Resend with API Key
    const resend = new Resend(process.env.RESEND_API_KEY!);

    // 3. Generate the magic invite link
    // The @ts-ignore is needed because the 'invite' type is sometimes hidden in standard types
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore
      type: 'invite',
      email: email,
      options: { 
        // This is where the user lands after clicking the email link
        redirectTo: 'https://www.tots-os.co.uk/set-password' 
      }
    });

    if (linkError) {
      console.error('Supabase Error:', linkError.message);
      return NextResponse.json({ error: `Supabase Error: ${linkError.message}` }, { status: 400 });
    }

    // 4. Send the email via Resend using your verified domain
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <hello@tots-os.co.uk>',
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; text-align: center;">
          <h1 style="font-style: italic; margin-bottom: 20px;">TOTS OS</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Welcome! Your account is ready. Please click the button below to set your password and access the dashboard.
          </p>
          <a href="${data.properties.action_link}" 
             style="background: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
            Set Password
          </a>
          <p style="color: #999; font-size: 11px; margin-top: 40px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <span style="word-break: break-all; color: #000;">${data.properties.action_link}</span>
          </p>
        </div>
      `
    });

    if (resendError) {
      console.error('Resend Error:', resendError.message);
      return NextResponse.json({ error: `Resend Error: ${resendError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Global Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}