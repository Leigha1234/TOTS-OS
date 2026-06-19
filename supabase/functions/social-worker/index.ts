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
    const MAX_BATCH = 10;

    // 1. Fetch due scheduled posts
    const { data: posts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .is("locked_at", null)
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(MAX_BATCH);

    const platformsMap: Record<string, (account: any, content: string) => Promise<Response>> = {
      meta: async (account: any, content: string) => {
        return fetch(
          `https://graph.facebook.com/v23.0/${account.platform_user_id}/feed`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: content,
              access_token: account.access_token,
            }),
          }
        );
      },

      linkedin: async (account: any, content: string) => {
        return fetch("https://api.linkedin.com/v2/ugcPosts", {
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
                shareCommentary: { text: content },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        });
      },
    };

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled posts due" }),
        { status: 200, headers: corsHeaders }
      );
    }

    for (const post of posts) {
      try {
        const nowIso = new Date().toISOString();

        await supabase
          .from("scheduled_posts")
          .update({
            status: "processing",
            locked_at: nowIso,
          })
          .eq("id", post.id);

        // 3. Get social accounts for user
        const { data: accounts } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("user_id", post.user_id);

        const platforms = post.platforms || [];

        for (const platform of platforms) {
          const { data: existing } = await supabase
            .from("post_logs")
            .select("id")
            .eq("post_id", post.id)
            .eq("platform", platform)
            .eq("status", "success")
            .maybeSingle();

          if (existing) continue;

          const account = accounts?.find((a) => a.platform === platform);

          if (!account?.access_token) continue;

          const handler = platformsMap[platform];
          if (!handler) continue;

          const content = post.content ?? post.message ?? "";

          const response = await handler(account, content);
          const text = await response.text();

          await supabase.from("post_logs").insert({
            post_id: post.id,
            platform,
            status: response.ok ? "success" : "failed",
            response: text,
          });

          if (!response.ok) {
            throw new Error(text);
          }
        }

        // 5. Mark as published
        await supabase
          .from("scheduled_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            locked_at: null,
          })
          .eq("id", post.id);
      } catch (err: any) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: post.retry_count >= 3 ? "failed" : "scheduled",
            retry_count: (post.retry_count || 0) + 1,
            next_retry_at: new Date(
              Date.now() + Math.pow(2, post.retry_count || 0) * 60000
            ).toISOString(),
            error_message: err?.message ?? "Unknown error",
            locked_at: null,
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
