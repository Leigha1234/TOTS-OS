import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
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
    const { campaignId } = await req.json();

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

    // 2. Fetch subscribers (FIXED FIELD NAME)
    const { data: subscribers, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('is_subscribed', true);

    if (subscriberError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found' },
        { status: 400 }
      );
    }

    // 3. Mark as sending
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    let sentCount = 0;

    // 4. Send emails (SAFE PARALLEL BATCHING)
    const results = await Promise.allSettled(
      subscribers.map((subscriber) =>
        resend.emails.send({
          from: fromEmail,
          to: subscriber.email,
          subject: campaign.subject || campaign.title || 'Campaign',
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.6;">
              <h2>${campaign.title ?? ''}</h2>
              <div>${campaign.content ?? ''}</div>
            </div>
          `,
        })
      )
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') sentCount++;
    });

    // 5. Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_sent: sentCount,
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: subscribers.length,
    });
  } catch (err: any) {
    console.error('Campaign send error:', err);

    return NextResponse.json(
      { error: err.message || 'Campaign send failed' },
      { status: 500 }
    );
  }
}