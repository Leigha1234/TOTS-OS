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

    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // @ts-ignore
      type: 'invite',
      email: email,
      options: { 
        // THIS IS THE KEY: It must match the URL you added to Supabase settings
        redirectTo: 'https://www.tots-os.co.uk/set-password' 
      }
    });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    await resend.emails.send({
      from: 'TOTS OS <hello@tots-os.co.uk>',
      to: [email],
      subject: 'Activate Your Account',
      html: `<p>Click <a href="${data.properties.action_link}">here</a> to set your password.</p>`
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}