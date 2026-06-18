import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  let campaignId: string | undefined;

  try {
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendKey || !fromEmail) {
      return NextResponse.json(
        { error: 'Missing RESEND configuration' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const body = await req.json();
    campaignId = body.campaignId;

    const batchSize = 50;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    // 1. Fetch campaign
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

    // 2. Fetch subscribers from profile_subscriber_lists
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
      .filter(
        (profile: any) =>
          profile?.email && profile?.is_subscribed === true
      );

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribed recipients found' },
        { status: 400 }
      );
    }

    // 3. Mark as sending
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    let sentCount = 0;

    // 4. Send emails in batches
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
                <img src="https://www.tots-os.co.uk/api/campaigns/open?campaignId=${campaignId}&profileId=${subscriber.id}" width="1" height="1" style="display:none;" />
              </div>
            `,
          })
        )
      );

      results.forEach((r) => {
        if (r.status === 'fulfilled') sentCount++;
      });
    }

    console.log('Campaign sent successfully', {
      campaignId,
      sentCount,
      totalRecipients: subscribers.length,
    });

    // 5. Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: subscribers.length,
    });
  } catch (err: any) {
    console.error('Campaign send error:', err);

    if (typeof campaignId !== 'undefined') {
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