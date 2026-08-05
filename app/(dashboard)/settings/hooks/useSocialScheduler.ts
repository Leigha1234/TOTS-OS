"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

type PublishResult = {
  platform: string;
  status: "success" | "failed";
  result?: any;
  error?: string;
};

export function useSocialScheduler() {
  const publishToPlatform = useCallback(
    async (
      platform: string,
      content: string,
      media?: unknown
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/social/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          content,
          media: media || null,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Post failed");
      }

      return response.json();
    },
    []
  );

  const postToSocial = useCallback(
    async (
      content: string,
      platforms: string[],
      media?: unknown
    ): Promise<PublishResult[]> => {
      const results: PublishResult[] = [];

      for (const platform of platforms) {
        try {
          const result = await publishToPlatform(
            platform,
            content,
            media
          );

          results.push({
            platform,
            status: "success",
            result,
          });
        } catch (error) {
          results.push({
            platform,
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Unknown error",
          });
        }
      }

      return results;
    },
    [publishToPlatform]
  );

  const schedulePost = useCallback(
    async (
      caption: string,
      platforms: string[],
      scheduledFor: Date
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          caption,
          platforms,
          scheduled_for: scheduledFor.toISOString(),
          status: "scheduled",
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return true;
    },
    []
  );

  const processScheduledPosts = useCallback(async () => {
    const now = new Date().toISOString();

    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error || !posts) {
      return;
    }

    for (const post of posts) {
      try {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "processing",
          })
          .eq("id", post.id);

        const results = await postToSocial(
          post.caption,
          post.platforms || []
        );

        const failed = results.filter(
          (result) => result.status === "failed"
        );

        await supabase
          .from("scheduled_posts")
          .update({
            status:
              failed.length === 0
                ? "posted"
                : "failed",
            published_at:
              failed.length === 0
                ? new Date().toISOString()
                : null,
            error_message:
              failed.length > 0
                ? JSON.stringify(failed)
                : null,
          })
          .eq("id", post.id);
      } catch (error) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message:
              error instanceof Error
                ? error.message
                : "Unknown error",
          })
          .eq("id", post.id);
      }
    }
  }, [postToSocial]);

  const retryFailedPosts = useCallback(async () => {
    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "failed");

    if (error || !posts) {
      return;
    }

    for (const post of posts) {
      try {
        const results = await postToSocial(
          post.caption,
          post.platforms || []
        );

        const failed = results.filter(
          (result) => result.status === "failed"
        );

        await supabase
          .from("scheduled_posts")
          .update({
            status:
              failed.length === 0
                ? "posted"
                : "failed",
            published_at:
              failed.length === 0
                ? new Date().toISOString()
                : null,
            error_message:
              failed.length > 0
                ? JSON.stringify(failed)
                : null,
          })
          .eq("id", post.id);
      } catch (error) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message:
              error instanceof Error
                ? error.message
                : "Unknown error",
          })
          .eq("id", post.id);
      }
    }
  }, [postToSocial]);

  /**
   * Optional helper.
   * Trigger your server-side worker manually.
   * (Recommended instead of processing everything in the browser.)
   */
  const triggerWorker = useCallback(async () => {
    await fetch("/api/social/worker/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, []);

  return {
    publishToPlatform,
    postToSocial,
    schedulePost,
    processScheduledPosts,
    retryFailedPosts,
    triggerWorker,
  };
}