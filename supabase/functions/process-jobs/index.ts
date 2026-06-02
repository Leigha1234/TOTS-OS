import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (_req) => {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "pending");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  for (const job of jobs ?? []) {
    try {
      if (job.type === "ai_triage") {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-triage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(job.payload),
        });
      }

      if (job.type === "gmail_sync") {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(job.payload),
        });
      }

      await supabase
        .from("jobs")
        .update({ status: "done" })
        .eq("id", job.id);
    } catch (err) {
      console.error("Job failed:", job.id, err);
    }
  }

  return new Response(JSON.stringify({ status: "done" }), {
    headers: { "Content-Type": "application/json" },
  });
});