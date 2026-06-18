import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const now = new Date().toISOString();

    // 1. Get due campaigns
    const { data: campaigns, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!campaigns?.length) {
      return NextResponse.json({ message: "No campaigns due" });
    }

    for (const campaign of campaigns) {
      // mark as sending immediately (prevents double send)
      await supabaseAdmin
        .from("campaigns")
        .update({ status: "sending" })
        .eq("id", campaign.id);

      // get subscribers
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("email")
        .eq("list_id", campaign.list_id)
        .eq("is_subscribed", true);

      if (!subscribers?.length) {
        await supabaseAdmin
          .from("campaigns")
          .update({ status: "sent", total_sent: 0 })
          .eq("id", campaign.id);

        continue;
      }

      let sent = 0;

      for (const sub of subscribers) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: sub.email,
            subject: campaign.subject || campaign.title,
            html: `
              <div style="font-family:Arial;padding:24px">
                <h2>${campaign.title}</h2>
                <div>${campaign.content}</div>
              </div>
            `,
          });

          sent++;
        } catch (e) {
          console.error("Email failed:", sub.email);
        }
      }

      await supabaseAdmin
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_sent: sent,
        })
        .eq("id", campaign.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "cron failed" },
      { status: 500 }
    );
  }
}