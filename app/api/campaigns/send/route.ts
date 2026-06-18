import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processCampaign({
  campaignId,
  subscribers,
  campaign,
  resend,
  fromEmail,
}: any) {
  const batchSize = 50;
  let sentCount = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((subscriber: any) =>
        resend.emails.send({
          from: fromEmail,
          to: subscriber.email,
          subject: campaign.subject || campaign.title || 'Campaign',
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.6;">
              <h2>${campaign.title ?? ''}</h2>
              <div>${campaign.content ?? ''}</div>
              <img src="https://www.tots-os.co.uk/api/campaigns/open?campaignId=${campaignId}&profileId=${encodeURIComponent(subscriber.id)}" width="1" height="1" style="display:none;" />
            </div>
          `,
        })
      )
    );

    results.forEach((r: any) => {
      if (r.status === 'fulfilled') sentCount++;
    });
  }

  await supabaseAdmin
    .from('campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      open_count: 0,
    })
    .eq('id', campaignId);
}

export async function POST(req: Request) {
  let campaignId: string | undefined;

  try {
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendKey || !fromEmail) {
      console.error('Missing RESEND configuration');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const body = await req.json();
    campaignId = body.campaignId;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (!campaign.list_id) {
      return NextResponse.json(
        { error: 'Campaign missing list_id' },
        { status: 400 }
      );
    }

    // Fetch subscribers
    const { data: subscriberLinks, error: subscriberError } = await supabaseAdmin
      .from('profile_subscriber_lists')
      .select(`
        profile_id,
        profiles (
          id,
          email,
          name,
          is_subscribed
        )
      `)
      .eq('list_id', campaign.list_id);

    if (subscriberError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    const subscribers = (subscriberLinks || [])
      .map((row: any) => row.profiles)
      .filter((p: any) => p?.email && p?.is_subscribed !== false);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribed recipients found' },
        { status: 400 }
      );
    }

    // Mark processing
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'processing' })
      .eq('id', campaignId);

    await supabaseAdmin.from('campaign_jobs').insert({
      campaign_id: campaignId,
      status: 'queued',
      created_at: new Date().toISOString(),
    });

    void processCampaign({
      campaignId,
      subscribers,
      campaign,
      resend,
      fromEmail,
    }).catch(async (err) => {
      console.error('Background campaign processing failed:', err);

      await supabaseAdmin
        .from('campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Campaign queued for delivery',
        total: subscribers.length,
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error('Campaign send error:', err);

    if (campaignId) {
      await supabaseAdmin
        .from('campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
    }

    return NextResponse.json(
      { error: err.message || 'Campaign send failed' },
      { status: 500 }
    );
  }
}