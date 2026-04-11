import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Using ! ensures TypeScript knows these exist in Vercel
const resend = new Resend(process.env.RESEND_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // 1. Generate an INVITE link instead of signup
    // This removes the password requirement entirely
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { redirectTo: 'https://tots-os.co.uk/set-password' }
    });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    // 2. Send the link via Resend
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your Account',
      html: `
        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h1 style="font-style: italic;">TOTS OS</h1>
          <p>Click below to set your password and access your dashboard:</p>
          <a href="${data.properties.action_link}" 
             style="background: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block;">
            Set Password
          </a>
        </div>
      `
    });

    if (resendError) return NextResponse.json({ error: resendError.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}