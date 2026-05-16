import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request, { params }: { params: { platform: string } }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code'); // Catch the code sent by the social platform
  const platform = params.platform;

  if (!code) return NextResponse.redirect('https://tots-os.co.uk/settings?error=no_code');

  // Initialize Supabase admin client to write safely to your table
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let accessToken = '';
  let accountId = '';

  // Example trade routine for TikTok (Pinterest and Meta follow this exact pattern)
  if (platform === 'tiktok') {
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://tots-os.co.uk/api/auth/callback/tiktok',
      }),
    });

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;
    accountId = tokenData.open_id;
  }

  // Save this newly minted token to Supabase for the current client
  if (accessToken) {
    // Get the authenticated user's session data
    const { data: { user } } = await supabase.auth.getUser(request.headers.get('Authorization')?.split(' ')[1] || '');
    
    if (user) {
      await supabase.from('social_tokens').upsert({
        user_id: user.id,
        platform: platform,
        access_token: accessToken,
        platform_account_id: accountId,
      });
    }
  }

  // Send them right back to their integrations page beautifully
  return NextResponse.redirect('https://tots-os.co.uk/settings?success=connected');
}