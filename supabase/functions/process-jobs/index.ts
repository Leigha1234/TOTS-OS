import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ status: "no_jobs" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    for (const job of jobs) {
      try {
        // Mark as processing (prevents double execution in race conditions)
        await supabase
          .from("jobs")
          .update({ status: "processing" })
          .eq("id", job.id)
          .eq("status", "pending");

        let response: Response | null = null;

        // Route job types
        if (job.type === "ai_triage") {
          response = await fetch(
            `${supabaseUrl}/functions/v1/ai-triage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(job.payload),
            }
          );
        }

        if (job.type === "gmail_sync") {
          response = await fetch(
            `${supabaseUrl}/functions/v1/gmail-sync`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(job.payload),
            }
          );
        }

        let responseText: string | null = null;
        if (response) {
          try {
            responseText = await response.text();
          } catch {
            responseText = "Failed to read response";
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Job execution failed: ${responseText || "no response"}`);
        }

        // Mark success
        await supabase
          .from("jobs")
          .update({ status: "done" })
          .eq("id", job.id)
          .eq("status", "processing");
      } catch (err: any) {
        console.error("Job failed:", job.id, err);

        await supabase
          .from("jobs")
          .update({
            status: "failed",
            error_message: err?.message ?? "Unknown error",
          })
          .eq("id", job.id);
      }
    }

    return new Response(JSON.stringify({ status: "done" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});