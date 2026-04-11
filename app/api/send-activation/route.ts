// @ts-nocheck
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Setup Clients inside the function to avoid scope errors
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Generate the "Invite" link
    // This allows the user to join WITHOUT a password initially
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo: 'https://tots-os.co.uk/set-password' }
    });

    if (linkError) {
      console.error('Supabase Error:', linkError.message);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    // 3. Send the link via Resend
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `
        <div style="font-family: sans-serif; padding: 40px; background-color: #f9f8f6; text-align: center;">
          <h1 style="font-style: italic; font-weight: normal;">TOTS OS</h1>
          <p style="color: #666;">Click the button below to set your password and access your dashboard.</p>
          <a href="${data.properties.action_link}" 
             style="background-color: #000; color: #fff; padding: 15px 30px; border-radius: 50px; text-decoration: none; display: inline-block; font-weight: bold; margin-top: 20px;">
            SET PASSWORD
          </a>
        </div>
      `
    });

    if (resendError) {
      console.error('Resend Error:', resendError.message);
      return NextResponse.json({ error: resendError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}