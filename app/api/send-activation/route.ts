import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Generate link using 'invite' - this is the cleanest way for new users
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore - this bypasses the Vercel build error you saw earlier
      type: 'invite',
      email: email,
      options: { redirectTo: 'https://tots-os.co.uk/set-password' }
    });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    // Send via Resend
    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1 style="font-style: italic;">TOTS OS</h1>
          <p>Click below to set your password and access your dashboard.</p>
          <a href="${data.properties.action_link}" 
             style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 20px;">
            SET PASSWORD
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