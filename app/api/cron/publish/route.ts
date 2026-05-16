// app/api/cron/publish/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Verify request legitimacy from your Supabase pg_cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // 2. Pull due posts from the grid queue
  const { data: queue, error } = await supabase
    .from('socials')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now);

  if (error || !queue || queue.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  for (const post of queue) {
    try {
      // 3. Dynamically resolve the specific tenant client's connected OAuth access tokens
      const { data: dynamicToken, error: tokenError } = await supabase
        .from('social_tokens')
        .select('access_token, platform_account_id')
        .eq('user_id', post.user_id)
        .eq('platform', post.platform)
        .maybeSingle();

      if (tokenError || !dynamicToken) {
        await supabase.from('socials').update({ 
          status: 'failed', 
          error_message: 'No authorized social token found connected for this platform account channel.' 
        }).eq('id', post.id);
        continue;
      }

      const fullMessage = `${post.caption}\n\n${post.hashtags || ''}`;
      const token = dynamicToken.access_token;
      const accountId = dynamicToken.platform_account_id;

      // --- FACEBOOK INTEGRATION ROUTING ---
      if (post.platform === 'facebook') {
        const fbUrl = `https://graph.facebook.com/v18.0/${accountId}/feed`;
        const response = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullMessage,
            link: post.media_url,
            access_token: token
          })
        });

        if (response.ok) {
          await supabase.from('socials').update({ status: 'published' }).eq('id', post.id);
        } else {
          const errText = await response.text();
          await supabase.from('socials').update({ status: 'failed', error_message: `FB: ${errText}` }).eq('id', post.id);
        }
      }

      // --- INSTAGRAM INTEGRATION ROUTING ---
      else if (post.platform === 'instagram') {
        const containerUrl = `https://graph.facebook.com/v18.0/${accountId}/media`;
        const containerRes = await fetch(containerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: post.media_url,
            caption: fullMessage,
            access_token: token
          })
        });

        if (!containerRes.ok) {
          const errText = await containerRes.text();
          await supabase.from('socials').update({ status: 'failed', error_message: `IG Container: ${errText}` }).eq('id', post.id);
          continue;
        }

        const containerData = await containerRes.json();
        
        const publishUrl = `https://graph.facebook.com/v18.0/${accountId}/media_publish`;
        const publishRes = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: token
          })
        });

        if (publishRes.ok) {
          await supabase.from('socials').update({ status: 'published' }).eq('id', post.id);
        } else {
          const errText = await publishRes.text();
          await supabase.from('socials').update({ status: 'failed', error_message: `IG Publish: ${errText}` }).eq('id', post.id);
        }
      }

      // --- TIKTOK INTEGRATION ROUTING ---
      else if (post.platform === 'tiktok') {
        const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            post_info: {
              title: post.caption.substring(0, 150),
              privacy_level: "PUBLIC_TO_EVERYONE",
              video_cover_timestamp_ms: 0
            },
            source_info: {
              source: "FILE_URL",
              video_url: post.media_url
            }
          })
        });

        if (response.ok) {
          await supabase.from('socials').update({ status: 'published' }).eq('id', post.id);
        } else {
          const errText = await response.text();
          await supabase.from('socials').update({ status: 'failed', error_message: `TikTok: ${errText}` }).eq('id', post.id);
        }
      }

      // --- PINTEREST INTEGRATION ROUTING ---
      else if (post.platform === 'pinterest') {
        const response = await fetch('https://api.pinterest.com/v5/pins', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            link: "https://tots-os.co.uk",
            title: "Shared via TOTs OS Container Node",
            description: fullMessage,
            board_id: accountId, // Pulls the target board path out dynamically from column records
            media_source: {
              source_type: "image_url",
              url: post.media_url
            }
          })
        });

        if (response.ok) {
          await supabase.from('socials').update({ status: 'published' }).eq('id', post.id);
        } else {
          const errText = await response.text();
          await supabase.from('socials').update({ status: 'failed', error_message: `Pinterest: ${errText}` }).eq('id', post.id);
        }
      }

    } catch (e: any) {
      console.error("Direct multi-tenant routing runtime engine issue:", e);
    }
  }

  return NextResponse.json({ processed: queue.length });
}