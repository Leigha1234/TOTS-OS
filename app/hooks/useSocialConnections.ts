"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type SocialPlatform = "meta" | "instagram" | "tiktok" | "linkedin";

type SocialConnection = {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  access_token: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  connected: boolean;
};

const getOAuthStorageKey = (platform: string) =>
  platform === "meta"
    ? "meta_oauth_state"
    : `${platform}_oauth_state`;

export const useSocialConnections = (userId?: string) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all social connections for user
   */
  const fetchConnections = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch connections error:", error);
      toast.error("Failed to load social connections");
      setLoading(false);
      return;
    }

    setConnections(data || []);
    setLoading(false);
  }, [userId]);

  /**
   * Disconnect platform
   */
  const disconnect = useCallback(
    async (platform: SocialPlatform) => {
      if (!userId) return;

      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("user_id", userId)
        .eq("platform", platform);

      if (error) {
        toast.error("Failed to disconnect");
        return;
      }

      toast.success("Disconnected successfully");
      await fetchConnections();
    },
    [userId, fetchConnections]
  );

  /**
   * Start OAuth flow
   */
  const connect = useCallback(
    async (platform: SocialPlatform) => {
      try {
        if (!userId) {
          throw new Error("Missing user id");
        }

        const state = encodeURIComponent(
          JSON.stringify({
            userId,
            platform,
          })
        );

        sessionStorage.setItem(getOAuthStorageKey(platform), state);

        const routes: Record<SocialPlatform, string> = {
          meta: `/api/oauth/meta?state=${state}`,
          instagram: `/api/oauth/meta?state=${state}`,
          tiktok: `/api/oauth/tiktok?state=${state}`,
          linkedin: `/api/oauth/linkedin?state=${state}`,
        };

        const authUrl = routes[platform];

        if (!authUrl) {
          throw new Error("Unsupported social platform");
        }

        window.location.href = authUrl;
      } catch (err) {
        console.error("OAuth start error:", err);
        toast.error("Failed to start connection");
      }
    },
    [userId]
  );

  /**
   * Check if connected
   */
  const isConnected = useCallback(
    (platform: SocialPlatform) => {
      return connections.some(
        (c) => c.platform === platform && Boolean(c.access_token)
      );
    },
    [connections]
  );

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    fetchConnections,
    connect,
    disconnect,
    isConnected,
  };
};