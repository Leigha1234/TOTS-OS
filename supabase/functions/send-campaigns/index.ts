// Supabase Edge Function (Deno runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

function getAppBaseUrl() {
  return (
    Deno.env.get("APP_URL") ||
    Deno.env.get("NEXT_PUBLIC_APP_URL") ||
    "https://www.tots-os.co.uk"
  ).replace(/\/+$/, "");
}

function base64urlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSignature(encodedPayload: string) {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!secret) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  return base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function createUnsubscribeToken(input: {
  campaignId: string;
  organisationId: string;
  listId: string;
  email: string;
  source: "profile" | "manual";
  recipientId: string;
}) {
  const payload = {
    campaignId: input.campaignId,
    organisationId: input.organisationId,
    listId: input.listId,
    email: input.email.toLowerCase().trim(),
    source: input.source,
    recipientId: input.recipientId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = await hmacSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

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
        .select("id,email")
        .eq("is_subscribed", true);

      if (subError) {
        console.error("Subscriber fetch error:", subError);
        continue;
      }

      if (!subscribers?.length) continue;

      // 3. Send emails via Resend
      const results = await Promise.allSettled(
        subscribers.map(async (sub) => {
          const unsubscribeToken = await createUnsubscribeToken({
            campaignId: String(campaign.id),
            organisationId: String(campaign.organisation_id || ""),
            listId: String(campaign.list_id || ""),
            email: String(sub.email || ""),
            source: "profile",
            recipientId: String(sub.id || sub.email || ""),
          });

          const unsubscribeUrl = `${getAppBaseUrl()}/api/campaigns/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

          const html = `${campaign.content || ""}
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e7e5e4;text-align:center;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 10px;color:#78716c;font-size:12px;line-height:1.6;">You are receiving this email because you subscribed to updates from TOTS-OS.</p>
              <a href="${unsubscribeUrl}" style="color:#57534e;font-size:12px;font-weight:700;text-decoration:underline;">Unsubscribe from this email list</a>
            </div>`;

          return resend.emails.send({
            from: "TOTS OS <onboarding@resend.dev>",
            to: sub.email,
            subject: campaign.subject,
            html,
          });
        })
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