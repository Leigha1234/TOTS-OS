// Supabase Edge Function (Deno runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing required environment variables" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(resendApiKey);
  try {
    const now = new Date().toISOString();

    // 1. Get due campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "draft")
      .lte("scheduled_for", now);

    if (campaignError) {
      return new Response(
        JSON.stringify({ error: campaignError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ message: "No campaigns to send" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const campaign of campaigns) {
      // 2. Get subscribers for list
      const { data: subscribers, error: subError } = await supabase
        .from("profiles")
        .select("email")
        .eq("is_subscribed", true);

      if (subError) {
        console.error("Subscriber fetch error:", subError);
        continue;
      }

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
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});