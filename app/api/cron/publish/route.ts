// app/api/cron/publish/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // 1. Verify cron request
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // 2. Fetch scheduled posts
  const { data: queue, error } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (error) {
    console.error("Queue fetch error:", error);
    return NextResponse.json({ processed: 0, error: error.message });
  }

  if (!queue || queue.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  for (const post of queue) {
    try {
      // 3. Fetch token
      const { data: dynamicToken, error: tokenError } = await supabase
        .from("social_tokens")
        .select("access_token, platform_account_id")
        .eq("user_id", post.user_id)
        .eq("platform", post.platform)
        .maybeSingle();

      if (tokenError || !dynamicToken) {
        await supabase
          .from("socials")
          .update({
            status: "failed",
            error_message: "Missing social token for platform"
          })
          .eq("id", post.id);
        continue;
      }

      const fullMessage = `${post.caption || ""}\n\n${post.hashtags || ""}`;
      const token = dynamicToken.access_token;
      const accountId = dynamicToken.platform_account_id;

      // ---------------- FACEBOOK ----------------
      if (post.platform === "facebook") {
        const fbRes = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/feed`,
          {
            method: "POST",
            body: new URLSearchParams({
              message: fullMessage,
              link: post.media_url || "",
              access_token: token,
            }),
          }
        );

        const fbText = await fbRes.text();

        if (fbRes.ok) {
          await supabase
            .from("socials")
            .update({ status: "published" })
            .eq("id", post.id);
        } else {
          await supabase
            .from("socials")
            .update({ status: "failed", error_message: fbText })
            .eq("id", post.id);
        }
      }

      // ---------------- INSTAGRAM ----------------
      else if (post.platform === "instagram") {
        // Step 1: create media container
        const containerRes = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/media`,
          {
            method: "POST",
            body: new URLSearchParams({
              image_url: post.media_url,
              caption: fullMessage,
              access_token: token,
            }),
          }
        );

        const containerData = await containerRes.json();

        if (!containerRes.ok || !containerData.id) {
          await supabase
            .from("socials")
            .update({
              status: "failed",
              error_message: JSON.stringify(containerData),
            })
            .eq("id", post.id);
          continue;
        }

        // Step 2: publish container
        const publishRes = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
          {
            method: "POST",
            body: new URLSearchParams({
              creation_id: containerData.id,
              access_token: token,
            }),
          }
        );

        const publishText = await publishRes.text();

        if (publishRes.ok) {
          await supabase
            .from("socials")
            .update({ status: "published" })
            .eq("id", post.id);
        } else {
          await supabase
            .from("socials")
            .update({ status: "failed", error_message: publishText })
            .eq("id", post.id);
        }
      }

      // ---------------- TIKTOK ----------------
      else if (post.platform === "tiktok") {
        const response = await fetch(
          "https://open.tiktokapis.com/v2/post/publish/video/init/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              post_info: {
                title: (post.caption || "").substring(0, 150),
                privacy_level: "PUBLIC_TO_EVERYONE",
                video_cover_timestamp_ms: 0,
              },
              source_info: {
                source: "FILE_URL",
                video_url: post.media_url,
              },
            }),
          }
        );

        const text = await response.text();

        await supabase
          .from("socials")
          .update({
            status: response.ok ? "published" : "failed",
            error_message: response.ok ? null : text,
          })
          .eq("id", post.id);
      }

      // ---------------- PINTEREST ----------------
      else if (post.platform === "pinterest") {
        const response = await fetch("https://api.pinterest.com/v5/pins", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            link: "https://tots-os.co.uk",
            title: "Shared via TOTS OS",
            description: fullMessage,
            board_id: accountId,
            media_source: {
              source_type: "image_url",
              url: post.media_url,
            },
          }),
        });

        const text = await response.text();

        await supabase
          .from("socials")
          .update({
            status: response.ok ? "published" : "failed",
            error_message: response.ok ? null : text,
          })
          .eq("id", post.id);
      }
    } catch (e: any) {
      console.error("Cron publish runtime error:", e);
    }
  }

  return NextResponse.json({ processed: queue.length });
}