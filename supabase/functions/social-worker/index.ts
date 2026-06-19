import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    // 1. Fetch due scheduled posts
    const { data: posts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled posts due" }),
        { status: 200, headers: corsHeaders }
      );
    }

    for (const post of posts) {
      try {
        // 2. Lock post
        await supabase
          .from("scheduled_posts")
          .update({
            status: "processing",
          })
          .eq("id", post.id);

        // 3. Get social accounts for user
        const { data: accounts } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("user_id", post.user_id);

        const platforms = post.platforms || [];

        for (const platform of platforms) {
          const account = accounts?.find((a) => a.platform === platform);

          if (!account?.access_token) continue;

          let response: Response | null = null;

          // =========================
          // META (Facebook / Instagram Pages)
          // =========================
          if (platform === "meta") {
            response = await fetch(
              `https://graph.facebook.com/v23.0/${account.platform_user_id}/feed`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: post.content,
                  access_token: account.access_token,
                }),
              }
            );
          }

          // =========================
          // LINKEDIN
          // =========================
          if (platform === "linkedin") {
            response = await fetch(
              "https://api.linkedin.com/v2/ugcPosts",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  author: account.platform_user_id,
                  lifecycleState: "PUBLISHED",
                  specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                      shareCommentary: { text: post.content },
                      shareMediaCategory: "NONE",
                    },
                  },
                  visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                  },
                }),
              }
            );
          }

          const text = await response?.text();

          // 4. Log result
          await supabase.from("post_logs").insert({
            post_id: post.id,
            platform,
            status: response?.ok ? "success" : "failed",
            response: text,
          });
        }

        // 5. Mark as published
        await supabase
          .from("scheduled_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .eq("id", post.id);
      } catch (err: any) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: err?.message ?? "Unknown error",
          })
          .eq("id", post.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: posts.length }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
