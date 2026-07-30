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
};

const getOAuthStorageKey = (platform: string) =>
  platform === "meta" ? "meta_oauth_state" : `${platform}_oauth_state`;

export const useSocialConnections = (userId?: string) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch social connections error:", error);
      toast.error("Failed to load social connections");
      setLoading(false);
      return;
    }

    setConnections(data || []);
    setLoading(false);
  }, [userId]);

  const connect = useCallback(
    async (platform: SocialPlatform) => {
      if (!userId) {
        toast.error("User not loaded yet");
        return;
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
        linkedin: `/api/oauth/linkedin?state=${state}`,
        tiktok: `/api/oauth/tiktok?state=${state}`,
      };

      window.location.href = routes[platform];
    },
    [userId]
  );

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

      await fetchConnections();
      toast.success("Disconnected successfully");
    },
    [userId, fetchConnections]
  );

  const isConnected = useCallback(
    (platform: SocialPlatform) =>
      connections.some(
        (connection) =>
          (connection.platform === platform ||
            (platform === "instagram" && connection.platform === "meta")) &&
          Boolean(connection.access_token)
      ),
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