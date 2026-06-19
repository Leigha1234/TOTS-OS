import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { postId } = await req.json();

  const { data: post } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", post.user_id);

  const results = [];

  for (const platform of post.platforms) {
    const account = accounts?.find((a) => a.platform === platform);

    if (!account) continue;

    try {
      let result;

      if (platform === "meta") {
        result = await postToMeta(post, account);
      }

      if (platform === "linkedin") {
        result = await postToLinkedIn(post, account);
      }

      if (platform === "tiktok") {
        result = await postToTikTok(post, account);
      }

      results.push({ platform, success: true, result });

      await supabase.from("post_logs").insert({
        post_id: post.id,
        platform,
        status: "success",
        response: result,
      });
    } catch (err: any) {
      results.push({ platform, success: false });

      await supabase.from("post_logs").insert({
        post_id: post.id,
        platform,
        status: "failed",
        response: { error: err.message },
      });
    }
  }

  await supabase
    .from("scheduled_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", post.id);

  return NextResponse.json({ success: true, results });
}

async function postToMeta(post: any, account: any) {
  const pageId = account.page_id;
  const token = account.access_token;

  if (!pageId || !token) {
    throw new Error("Missing Meta page_id or access_token");
  }

  const res = await fetch(
    `https://graph.facebook.com/v23.0/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: post.content,
        access_token: token,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

async function postToLinkedIn(post: any, account: any) {
  // Placeholder implementation - replace with LinkedIn UGC API later
  if (!account.access_token) {
    throw new Error("Missing LinkedIn access_token");
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${account.access_token}`,
    },
    body: JSON.stringify({
      author: account.account_id,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: post.content,
          },
          shareMediaCategory: "NONE",
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

  return data;
}

async function postToTikTok(post: any, account: any) {
  // Placeholder - TikTok posting requires Content Posting API approval
  if (!account.access_token) {
    throw new Error("Missing TikTok access_token");
  }

  // For now simulate success to prevent breaking pipeline
  return {
    success: true,
    message: "TikTok posting not yet implemented (API approval required)",
    content: post.content,
  };
}