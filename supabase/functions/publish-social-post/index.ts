// Edge Function: publish-social-post

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

console.log("publish-social-post function loaded");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const {
      name,
      platform,
      post_id,
      account_id,
      caption,
      media_url,
      platforms,
    } = body;

    console.log("Incoming publish request:", body);

    // Support both single + multi platform calls
    const targetPlatforms = platforms || (platform ? [platform] : []);

    const results = [];

    for (const p of targetPlatforms) {
      switch (p) {
        case "meta":
          results.push({ platform: "meta", status: "queued" });
          break;

        case "instagram":
          results.push({ platform: "instagram", status: "queued" });
          break;

        case "tiktok":
          results.push({ platform: "tiktok", status: "queued" });
          break;

        case "linkedin":
          results.push({ platform: "linkedin", status: "queued" });
          break;

        default:
          results.push({ platform: p, status: "unsupported" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Publish request received",
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("publish-social-post error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
