"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import type {
  ConnectionHealth,
  SocialAccount,
} from "../types";

const CLIENT_REFRESH_PLATFORMS = ["meta", "linkedin"] as const;

function getOAuthStorageKey(platform: string) {
  return platform === "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;
}

export function useSocialConnections() {
  const isMountedRef = useRef(true);
  const subscribedRef = useRef(false);
  const channelRef = useRef<any>(null);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connectionHealth, setConnectionHealth] = useState<
    Record<string, ConnectionHealth>
  >({
    meta: "unknown",
    linkedin: "unknown",
    tiktok: "unknown",
  });

  const refreshSocialToken = useCallback(
    async (platform: string) => {
      // TikTok refresh MUST happen server-side
      if (platform === "tiktok") {
        return false;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isMountedRef.current) {
          return false;
        }

        const { data } = await supabase
          .from("social_accounts")
          .select("refresh_token")
          .eq("user_id", user.id)
          .eq("platform", platform)
          .maybeSingle();

        if (!data?.refresh_token) {
          return false;
        }

        const response = await fetch("/api/oauth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
            refresh_token: data.refresh_token,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          return false;
        }

        const tokens = await response.json();

        const { error } = await supabase
          .from("social_accounts")
          .update({
            access_token: tokens.access_token,
            refresh_token:
              tokens.refresh_token || data.refresh_token,
            expires_at: tokens.expires_at,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("platform", platform);

        if (error) {
          return false;
        }

        return true;
      } catch (error) {
        console.warn("Token refresh failed:", error);
        return false;
      }
    },
    []
  );

  const verifyConnections = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const health: Record<string, ConnectionHealth> = {
      meta: "disconnected",
      linkedin: "disconnected",
      tiktok: "disconnected",
    };

    if (!user) {
      setConnectionHealth(health);
      return;
    }

    const { data: connections } = await supabase
      .from("social_accounts")
      .select("platform, expires_at, access_token")
      .eq("user_id", user.id);

    const now = Date.now();

    for (const connection of connections || []) {
      const platform = connection.platform;

      if (!connection.access_token) {
        health[platform] = "expired";
        continue;
      }

      const expiry = connection.expires_at
        ? new Date(connection.expires_at).getTime()
        : null;

      if (expiry && expiry < now) {
        if (platform === "tiktok") {
          // TikTok refresh handled by server callback
          health[platform] = "expired";
          continue;
        }

        const refreshed =
          await refreshSocialToken(platform);

        health[platform] = refreshed
          ? "connected"
          : "expired";

        continue;
      }

      health[platform] = "connected";
    }

    if (isMountedRef.current) {
      setConnectionHealth(health);
    }
  }, [refreshSocialToken]);

  const refreshConnections = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMountedRef.current) {
        return;
      }

      const { data, error } = await supabase
        .from("social_accounts")
        .select("id, platform, page_name")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const accounts = (data || []) as SocialAccount[];

      setSocialAccounts(accounts);

      setConnectedPlatforms(
        accounts.map((account) => account.platform)
      );

      await verifyConnections();
    } catch (error) {
      console.error(error);
    }
  }, [verifyConnections]);

  const verifyPendingOAuth = useCallback(async () => {
    const pending = CLIENT_REFRESH_PLATFORMS.filter(
      (platform) =>
        sessionStorage.getItem(
          getOAuthStorageKey(platform)
        ) === "true"
    );

    if (pending.length === 0) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    for (const platform of pending) {
      const { data } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .maybeSingle();

      if (!data) {
        continue;
      }

      sessionStorage.removeItem(
        getOAuthStorageKey(platform)
      );

      toast.success(`${platform} connected successfully`);
    }

    await refreshConnections();
  }, [refreshConnections]);

  useEffect(() => {
    isMountedRef.current = true;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      if (subscribedRef.current) {
        return;
      }

      subscribedRef.current = true;

      channelRef.current = supabase
        .channel(`social_accounts_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "social_accounts",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await refreshConnections();
          }
        );

      channelRef.current.subscribe();
    };

    void subscribe();

    return () => {
      isMountedRef.current = false;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      subscribedRef.current = false;
    };
  }, [refreshConnections]);

  return {
    socialAccounts,
    connectedPlatforms,
    connectionHealth,
    refreshConnections,
    verifyConnections,
    verifyPendingOAuth,
  };
}