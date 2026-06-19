import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("🔥 publish-social-post (FIXED PRODUCTION)");

Deno.serve(async (req) => {
  // CORS (required for frontend + edge safety)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { post_id } = await req.json();

    if (!post_id) {
      return new Response("Missing post_id", { status: 400 });
    }

    // 1. GET POST
    const { data: post, error: postError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return new Response("Post not found", { status: 404 });
    }

    // 2. GET SOCIAL ACCOUNT
    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", post.account_id)
      .single();

    if (accountError || !account) {
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed", error_message: "No account" })
        .eq("id", post_id);

      return new Response("Account not found", { status: 400 });
    }

    // 3. PLATFORM ROUTING (future-proof)
    if (account.platform !== "instagram") {
      return new Response("Unsupported platform", { status: 400 });
    }

    if (!account.access_token || !account.platform_user_id) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: "Missing Instagram credentials",
        })
        .eq("id", post_id);

      return new Response("Missing credentials", { status: 400 });
    }

    // 4. CREATE MEDIA CONTAINER
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${account.platform_user_id}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          image_url: post.media_url,
          caption: post.caption || "",
          access_token: account.access_token,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (!containerData.id) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: JSON.stringify(containerData),
        })
        .eq("id", post_id);

      return new Response("Container failed", { status: 400 });
    }

    // 5. PUBLISH POST
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${account.platform_user_id}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: containerData.id,
          access_token: account.access_token,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishData.id) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: JSON.stringify(publishData),
        })
        .eq("id", post_id);

      return new Response("Publish failed", { status: 400 });
    }

    // 6. SUCCESS UPDATE
    await supabase
      .from("scheduled_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: publishData.id,
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({
        success: true,
        platform: "instagram",
        post_id: publishData.id,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Publish error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
});