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

    // We use 'invite' instead of 'signup' to avoid the "password missing" error
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { redirectTo: 'https://tots-os.co.uk/set-password' }
    });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    const { error: resendError } = await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your TOTS OS Account',
      html: `<p>Welcome! Click <a href="${data.properties.action_link}">here</a> to set your password.</p>`
    });

    if (resendError) return NextResponse.json({ error: resendError.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}