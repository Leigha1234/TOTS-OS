import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ status: "no_jobs" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const job of jobs) {
      try {
        // Mark as processing (prevents double execution in race conditions)
        await supabase
          .from("jobs")
          .update({ status: "processing" })
          .eq("id", job.id);

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

        const responseText = response ? await response.text() : null;

        if (!response || !response.ok) {
          throw new Error(responseText || "Job execution failed");
        }

        // Mark success
        await supabase
          .from("jobs")
          .update({ status: "done" })
          .eq("id", job.id);
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});