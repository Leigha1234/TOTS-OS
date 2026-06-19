import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const now = new Date().toISOString();

  // 1. Get due posts
  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (!posts?.length) {
    return NextResponse.json({ message: "No posts" });
  }

  for (const post of posts) {
    try {
      // 2. lock post
      await supabase
        .from("scheduled_posts")
        .update({ status: "processing" })
        .eq("id", post.id);

      // 3. execute post
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });

    } catch (err) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
        })
        .eq("id", post.id);
    }
  }

  return NextResponse.json({ success: true });
}