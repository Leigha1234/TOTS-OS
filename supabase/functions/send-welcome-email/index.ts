import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response("Missing email", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response("Missing RESEND_API_KEY", {
        status: 500,
        headers: corsHeaders,
      });
    }


    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});