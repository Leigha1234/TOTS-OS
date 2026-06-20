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
      .eq("user_id", userId);

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
      fetchConnections();
    },
    [userId, fetchConnections]
  );

  /**
   * Start OAuth flow
   */
  const connect = useCallback((platform: SocialPlatform) => {
    try {
      const state = crypto.randomUUID();

      sessionStorage.setItem(getOAuthStorageKey(platform), state);

      let authUrl = "";

      switch (platform) {
        case "meta":
          authUrl = `/api/oauth/meta?state=${state}`;
          break;
        case "instagram":
          authUrl = `/api/oauth/meta?state=${state}`;
          break;
        case "tiktok":
          authUrl = `/api/oauth/tiktok?state=${state}`;
          break;
        case "linkedin":
          authUrl = `/api/oauth/linkedin?state=${state}`;
          break;
      }

      window.location.href = authUrl;
    } catch (err) {
      console.error(err);
      toast.error("Failed to start connection");
    }
  }, []);

  /**
   * Check if connected
   */
  const isConnected = useCallback(
    (platform: SocialPlatform) => {
      return connections.some((c) => c.platform === platform && c.connected);
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