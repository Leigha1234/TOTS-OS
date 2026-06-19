import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const platformsMap: Record<
      string,
      (account: any, content: string, post?: any) => Promise<Response>
    > = {
      meta: async (account: any, content: string, post?: any) => {
        const pageId = account.page_id || account.platform_user_id;

        const url = post?.media_url
          ? `https://graph.facebook.com/v23.0/${pageId}/photos`
          : `https://graph.facebook.com/v23.0/${pageId}/feed`;

        const body = new URLSearchParams();
        body.append("access_token", account.access_token);

        if (post?.media_url) {
          body.append("url", post.media_url);
          body.append("caption", content);
        } else {
          body.append("message", content);
        }

        return fetch(url, {
          method: "POST",
          body,
        });
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
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
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
        const { data: accounts = [] } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("organisation_id", post.organisation_id);
        const platforms = Array.isArray(post.platforms) ? post.platforms : [];

        for (const platform of platforms) {
          const { data: existing } = await supabase
            .from("post_logs")
            .select("id")
            .eq("post_id", post.id)
            .eq("platform", platform)
            .eq("status", "success")
            .maybeSingle();

          if (existing) continue;

          const account = (accounts || []).find((a) => a.platform === platform);

          if (!account?.access_token) continue;

          const handler = platformsMap[platform];
          if (!handler) continue;

          const content = post.caption ?? "";

          const response = await handler(account, content, post);
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
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
