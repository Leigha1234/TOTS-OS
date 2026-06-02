import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 5;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .lt("attempts", MAX_ATTEMPTS)
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return new Response(JSON.stringify({ message: "No posts due" }));
  }

  for (const post of posts) {
    await processPost(supabase, post);
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: posts.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

async function processPost(supabase: any, post: any) {
  const attempt = (post.attempts || 0) + 1;

  try {
    const { data: locked } = await supabase
      .from("socials")
      .update({
        status: "processing",
        attempts: attempt,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("status", "scheduled")
      .select()
      .single();

    if (!locked) return;

    const start = Date.now();

    const result = await publishToPlatform(post);

    const duration = Date.now() - start;

    await supabase
      .from("socials")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        platform_post_id: result?.id ?? null,
        platform_response: result,
        analytics: {
          duration_ms: duration,
          attempts: attempt,
          success: true,
        },
        last_error: null,
      })
      .eq("id", post.id);
  } catch (err) {
    console.error("Post failed:", post.id, err);

    const isFinalAttempt = attempt >= MAX_ATTEMPTS;

    const backoffMinutes = Math.pow(2, post.attempts || 0);

    await supabase
      .from("socials")
      .update({
        status: isFinalAttempt ? "failed" : "scheduled",
        last_error: String(err),
        last_attempt_at: new Date().toISOString(),
        scheduled_for: isFinalAttempt
          ? post.scheduled_for
          : new Date(Date.now() + backoffMinutes * 60000).toISOString(),
      })
      .eq("id", post.id);
  }
}

async function publishToPlatform(post: any) {
  switch (post.platform) {
    case "instagram":
      return await publishInstagram(post);
    case "tiktok":
      return await publishTikTok(post);
    case "linkedin":
      return await publishLinkedIn(post);
    default:
      throw new Error(`Unsupported platform: ${post.platform}`);
  }
}

async function publishInstagram(post: any) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${Deno.env.get("IG_USER_ID")}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        image_url: post.media_url,
        caption: post.caption || "",
        access_token: Deno.env.get("META_TOKEN")!,
      }),
    }
  );

  const data = await res.json();
  if (!data.id) throw new Error(JSON.stringify(data));

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${Deno.env.get("IG_USER_ID")}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: data.id,
        access_token: Deno.env.get("META_TOKEN")!,
      }),
    }
  );

  const publishData = await publishRes.json();

  if (!publishData.id) {
    throw new Error(JSON.stringify(publishData));
  }

  return {
    id: publishData.id,
    platform: "instagram",
    raw: publishData,
  };
}

async function publishTikTok(post: any) {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("TIKTOK_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: post.caption || "",
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: post.media_url,
      },
    }),
  });

  const data = await res.json();

  if (!data.data?.publish_id && !data.id) {
    throw new Error(JSON.stringify(data));
  }

  return {
    id: data.data?.publish_id || data.id,
    platform: "tiktok",
    raw: data,
  };
}

async function publishLinkedIn(post: any) {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LINKEDIN_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: `urn:li:person:${Deno.env.get("LINKEDIN_USER_ID")}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: post.caption || "",
          },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              originalUrl: post.media_url,
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return {
    id: data.id,
    platform: "linkedin",
    raw: data,
  };
}