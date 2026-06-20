// app/api/auth/deletion/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    // Parse the data payload sent by the request
    const body = await request.json();
    const platformAccountId = body.user_id || body.signed_request; 

    if (!platformAccountId) {
      return NextResponse.json({ error: 'Missing account identifier parameters.' }, { status: 400 });
    }

    // Purge the oauth token mapping records for this specific social profile link completely
    const { error } = await supabaseAdmin
      .from('social_tokens')
      .delete()
      .eq('platform_account_id', platformAccountId);

    if (error) throw error;

    // Meta expects a tracking URL and a unique confirmation code sent back in this exact structural format
    return NextResponse.json({
      url: 'https://tots-os.co.uk/settings?status=data-purged',
      confirmation_code: `tots_purge_${Date.now()}`
    });

  } catch (err: any) {
    console.error("Data deletion callback execution failure:", err);
    return NextResponse.json({ error: 'Internal pipeline purge error' }, { status: 500 });
  }
}