import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;

export async function processScheduledPosts() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .lt("attempts", MAX_ATTEMPTS)
    .limit(20);

  if (error || !posts) {
    console.error("Fetch error:", error);
    return;
  }

  for (const post of posts) {
    await processPost(post);
  }
}

async function processPost(post: any) {
  const nextAttempt = (post.attempts ?? 0) + 1;
  let status = "posted";

  // If there is a problem posting, keep it scheduled until max attempts is reached.
  // In a real implementation this is where the external posting API call would happen.
  try {
    // TODO: replace with actual posting logic.
    if (!post.id) {
      throw new Error("Missing post id");
    }
  } catch (error) {
    status = nextAttempt >= MAX_ATTEMPTS ? "failed" : "scheduled";
    console.error("Post processing error:", error);
  }

  const { error } = await supabase
    .from("socials")
    .update({ attempts: nextAttempt, status })
    .eq("id", post.id);

  if (error) {
    console.error("Update error:", error);
  }
}
