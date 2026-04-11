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

    // The @ts-ignore below is CRITICAL to fix the Vercel Build Error
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore
      type: 'invite', 
      email: email,
      options: { redirectTo: 'https://www.tots-os.co.uk/set-password' }
    });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    // Send the email via Resend
    await resend.emails.send({
      from: 'TOTS OS <onboarding@resend.dev>',
      to: [email],
      subject: 'Activate Your Account',
      html: `<p>Click <a href="${data.properties.action_link}">here</a> to set your password.</p>`
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}