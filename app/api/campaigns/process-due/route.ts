import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST() {
  const now = new Date().toISOString();

  // 1. Get due campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (campaignsError) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }

  if (!campaigns?.length) {
    return NextResponse.json({ message: "No campaigns due" });
  }

  for (const campaign of campaigns) {
    try {
      // 2. Lock campaign
      await supabase
        .from("campaigns")
        .update({
          status: "sending",
          last_attempt_at: now,
          send_attempts: ((campaign as any).send_attempts ?? 0) + 1
        })
        .eq("id", campaign.id);

      // 3. Get subscribers
      const { data: recipients, error: recipientsError } = await supabase
        .from("profile_subscriber_lists")
        .select("profiles:profiles(id,email,is_subscribed)")
        .eq("list_id", campaign.list_id);

      if (recipientsError) {
        throw new Error("Failed to fetch recipients");
      }

      const users = (recipients ?? [])
        .map((r: any) => r?.profiles)
        .filter((p: any) => p?.email && p?.is_subscribed);

      // 4. Send emails
      for (const user of users) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "TOTS-OS <no-reply@resend.dev>",
            to: user.email,
            subject: campaign.subject,
            html: campaign.content
          });

          await supabase.from("email_logs").insert({
            campaign_id: campaign.id,
            profile_id: user.id,
            email: user.email,
            status: "sent"
          });

        } catch (err: any) {
          await supabase.from("email_logs").insert({
            campaign_id: campaign.id,
            profile_id: user.id,
            email: user.email,
            status: "failed",
            error: err.message
          });
        }
      }

      // 5. Mark complete
      await supabase
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", campaign.id);

    } catch (err: any) {
      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          error: err.message
        })
        .eq("id", campaign.id);
    }
  }

  return NextResponse.json({ success: true });
}