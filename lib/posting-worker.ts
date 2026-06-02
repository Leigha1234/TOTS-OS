import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processScheduledPosts() {
  const now = new Date().toISOString();

  // 1. get due posts
  const { data: posts, error } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (error || !posts) return;

  for (const post of posts) {
    await handlePost(post);
  }
}