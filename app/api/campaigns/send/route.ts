

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

    if (!resendKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY missing from environment variables.' },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        { error: 'RESEND_FROM_EMAIL missing from environment variables.' },
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

    const { data: subscribers, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('subscribed', true);

    if (subscriberError) {
      throw subscriberError;
    }

    if (!subscribers?.length) {
      return NextResponse.json(
        { error: 'No subscribers found in selected list.' },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    let sentCount = 0;

    for (const subscriber of subscribers) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: subscriber.email,
          subject: campaign.subject,
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.6;">
              <h2>${campaign.title}</h2>
              <div>${campaign.content}</div>
            </div>
          `,
        });

        sentCount++;
      } catch (emailErr) {
        console.error('Email failed:', subscriber.email, emailErr);
      }
    }

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
      message: `Campaign sent to ${sentCount} subscribers.`
    });
  } catch (err: any) {
    console.error('Campaign send error:', err);

    return NextResponse.json(
      {
        error: err.message || 'Campaign send failed'
      },
      { status: 500 }
    );
  }
}