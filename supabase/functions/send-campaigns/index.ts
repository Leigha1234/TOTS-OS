// Supabase Edge Function (Deno runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

Deno.serve(async () => {
  try {
    const now = new Date().toISOString();

    // 1. Get due campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "draft")
      .lte("scheduled_for", now);

    if (campaignError) throw campaignError;

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ message: "No campaigns to send" }), {
        status: 200,
      });
    }

    for (const campaign of campaigns) {
      // 2. Get subscribers for list
      const { data: subscribers, error: subError } = await supabase
        .from("profiles")
        .select("email")
        .eq("is_subscribed", true);

      if (subError) throw subError;

      if (!subscribers?.length) continue;

      // 3. Send emails via Resend
      const results = await Promise.allSettled(
        subscribers.map((sub) =>
          resend.emails.send({
            from: "TOTS OS <onboarding@resend.dev>",
            to: sub.email,
            subject: campaign.subject,
            html: campaign.content,
          })
        )
      );

      const sentCount = results.filter((r) => r.status === "fulfilled").length;

      // 4. Update campaign stats
      await supabase
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: now,
          total_sent: sentCount,
        })
        .eq("id", campaign.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: campaigns.length }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});