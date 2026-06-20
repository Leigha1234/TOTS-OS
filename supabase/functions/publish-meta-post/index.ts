import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { post_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!post_id) {
      return new Response(JSON.stringify({ error: "Missing post_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // -------------------------
    // 1. Fetch post
    // -------------------------
    const { data: post, error: postError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (post.status === "processing") {
      return new Response(JSON.stringify({ error: "Post already processing" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    if (post.status !== "scheduled") {
      return new Response(JSON.stringify({
        error: "Post not scheduled for publishing",
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Mark as processing
    await supabase
      .from("scheduled_posts")
      .update({
        status: "processing",
      })
      .eq("id", post_id);

    // -------------------------
    // 2. Fetch account
    // -------------------------
    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", post.account_id)
      .single();

    if (accError || !account?.access_token) {
      await supabase.from("scheduled_posts").update({
        status: "failed",
        error_message: "Missing access token",
        attempts: (post.attempts || 0) + 1,
      }).eq("id", post_id);

      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const token = account.access_token;
    const pageId = account.platform_user_id;

    // IMPORTANT: no fallback now — IG must be explicit
    const igId = account.instagram_business_account_id || account.platform_user_id;

    const platforms = post.platforms || [];

    const results: Record<string, any> = {};
    let successCount = 0;
    let failureCount = 0;

    // =====================================================
    // FACEBOOK / META POSTING
    // =====================================================
    if (platforms.includes("meta") || platforms.includes("facebook")) {
      try {
        let fbRes;

        if (post.media_url) {
          fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            {
              method: "POST",
              body: new URLSearchParams({
                url: post.media_url,
                caption: post.caption || "",
                access_token: token,
              }),
            }
          );
        } else {
          fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${pageId}/feed`,
            {
              method: "POST",
              body: new URLSearchParams({
                message: post.caption || "",
                access_token: token,
              }),
            }
          );
        }

        const fbJson = await fbRes.json();

        if (!fbRes.ok || fbJson?.error) {
          failureCount++;
          results.facebook = {
            success: false,
            error: fbJson,
          };
        } else {
          successCount++;
          results.facebook = {
            success: true,
            id: fbJson.id,
          };
        }
      } catch (err: unknown) {
  failureCount++;
  results.facebook = {
    success: false,
    error: err instanceof Error ? err.message : String(err),
  };
}
    }

    // =====================================================
    // INSTAGRAM POSTING (STRICT MODE)
    // =====================================================
    if (platforms.includes("instagram")) {
      try {
        if (!igId) {
          throw new Error("Instagram business account ID missing");
        }

        if (!post.media_url) {
          throw new Error("Instagram requires media_url");
        }

        // Step 1: create container
        const createRes = await fetch(
          `https://graph.facebook.com/v19.0/${igId}/media`,
          {
            method: "POST",
            body: new URLSearchParams({
              image_url: post.media_url,
              caption: post.caption || "",
              access_token: token,
            }),
          }
        );

        const createJson = await createRes.json();

        if (!createRes.ok || createJson?.error) {
          failureCount++;
          results.instagram = {
            success: false,
            stage: "create_container",
            error: createJson,
          };
        } else {
          const creationId = createJson.id;

          let publishJson;
          let publishRes;

          let lastError = null;

          // retry publish up to 5 times (handles Meta propagation delay)
          for (let i = 0; i < 5; i++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            publishRes = await fetch(
              `https://graph.facebook.com/v19.0/${igId}/media_publish`,
              {
                method: "POST",
                body: new URLSearchParams({
                  creation_id: creationId,
                  access_token: token,
                }),
              }
            );

            publishJson = await publishRes.json();

            if (publishRes.ok && !publishJson?.error) {
              lastError = null;
              break;
            }

            lastError = publishJson;
          }

          // final result handling
          if (lastError) {
            failureCount++;
            results.instagram = {
              success: false,
              stage: "publish",
              error: lastError,
            };
          } else {
            successCount++;
            results.instagram = {
              success: true,
              id: publishJson.id,
            };
          }
        }
      } catch (err: unknown) {
  failureCount++;
  results.facebook = {
    success: false,
    error: err instanceof Error ? err.message : String(err),
  };
}
      
    }

    // -------------------------
    // 3. Final status determination
    // -------------------------
    let finalStatus = "published";
    if (successCount > 0 && failureCount > 0) finalStatus = "partial_success";
    if (successCount === 0) finalStatus = "failed";

    await supabase.from("scheduled_posts").update({
      status: finalStatus,
      platform_post_id: JSON.stringify(results),
      error_message: failureCount ? JSON.stringify(results) : null,
      published_at: finalStatus === "published" ? new Date().toISOString() : null,
      attempts: (post.attempts || 0) + 1,
    }).eq("id", post_id);

    return new Response(JSON.stringify({
      success: finalStatus !== "failed",
      status: finalStatus,
      results,
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});