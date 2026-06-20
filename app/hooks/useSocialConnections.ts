"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { supabase } from "@/app/lib/supabaseClient";

const getOAuthStorageKey = (platform: string) =>
  platform === "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;

export function useSocialConnections() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState<string[]>([]);

  const isMountedRef = useRef(true);
  const connectedRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setLoading = (platform: string, loading: boolean) => {
    setLoadingPlatforms((prev) => {
      if (loading) return [...prev, platform];
      return prev.filter((p) => p !== platform);
    });
  };

  const refreshConnections = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user || !isMountedRef.current) return;

    const { data } = await supabase
      .from("social_accounts")
      .select("platform")
      .eq("user_id", user.id);

    const platforms = data?.map((d: any) => d.platform) || [];

    setConnectedPlatforms(platforms);
    connectedRef.current = platforms;
  }, []);

  const verifyConnections = useCallback(async () => {
    // placeholder for your existing logic if needed
    return;
  }, []);

  const verifyPendingOAuth = useCallback(async () => {
    const pending = ["meta", "linkedin", "tiktok"].filter(
      (p) => sessionStorage.getItem(getOAuthStorageKey(p)) === "true"
    );

    if (pending.length === 0) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) return;

    for (const platform of pending) {
      try {
        const { data } = await supabase
          .from("social_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("platform", platform)
          .maybeSingle();

        if (data?.id) {
          sessionStorage.removeItem(getOAuthStorageKey(platform));

          await refreshConnections();

          setConnectedPlatforms((prev) =>
            prev.includes(platform) ? prev : [...prev, platform]
          );

          toast.success(`${platform} connected successfully`);
        }
      } catch (err) {
        console.warn("OAuth verify failed:", platform, err);
      }
    }
  }, [refreshConnections]);

  const exchangeOAuthCode = useCallback(
    async (platform: string, code: string, state: string) => {
      try {
        setLoading(platform, true);

        const res = await fetch("/api/oauth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, code, state }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "OAuth failed");

        sessionStorage.removeItem(getOAuthStorageKey(platform));

        await refreshConnections();

        toast.success(`${platform} connected`);
        return true;
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Connection failed");
        return false;
      } finally {
        setLoading(platform, false);
      }
    },
    [refreshConnections]
  );

  const handleOAuthCallback = useCallback(async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(state));
      const platform = parsed.platform;

      if (!platform) return;

      await exchangeOAuthCode(platform, code, state);

      // Prevent re-triggering on refresh
      window.history.replaceState({}, document.title, "/settings");
    } catch (err) {
      console.error("OAuth callback failed:", err);
    }
  }, [exchangeOAuthCode]);

  const connectSocialPlatform = useCallback(
    async (platform: string) => {
      try {
        setLoading(platform, true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          toast.error("You must be logged in to connect accounts");
          return;
        }

        if (platform !== "meta") {
          toast.error(`${platform} OAuth is not configured yet`);
          return;
        }

        const stateObj = {
          platform,
          userId: user.id,
          timestamp: Date.now(),
        };

        const state = encodeURIComponent(JSON.stringify(stateObj));

        const metaClientId = process.env.NEXT_PUBLIC_META_CLIENT_ID;
        const redirectUri = `${window.location.origin}/settings`;

        if (!metaClientId) {
          toast.error("Missing Meta Client ID environment variable");
          return;
        }

        sessionStorage.setItem(getOAuthStorageKey("meta"), "true");

        const url =
          `https://www.facebook.com/v23.0/dialog/oauth` +
          `?client_id=${metaClientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=pages_show_list,pages_manage_posts,pages_read_engagement` +
          `&state=${state}`;

        // IMPORTANT: redirect immediately
        window.location.href = url;
        return;
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to start OAuth flow");
      } finally {
        setLoading(platform, false);
      }
    },
    [] // supabase usage is stable, safe to omit from deps
  );

  const disconnectSocialPlatform = useCallback(
    async (platform: string) => {
      try {
        setLoading(platform, true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const { error } = await supabase
          .from("social_accounts")
          .delete()
          .eq("user_id", user.id)
          .eq("platform", platform);

        if (error) throw error;

        sessionStorage.removeItem(getOAuthStorageKey(platform));

        await refreshConnections();

        toast.success(`${platform} disconnected`);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to disconnect");
      } finally {
        setLoading(platform, false);
      }
    },
    [refreshConnections]
  );

  const handleFocus = useCallback(async () => {
    try {
      await refreshConnections();
      await verifyPendingOAuth();
    } catch (err) {
      console.warn("Focus sync failed:", err);
    }
  }, [refreshConnections, verifyPendingOAuth]);

  useEffect(() => {
    handleFocus();
    handleOAuthCallback();

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [handleFocus, handleOAuthCallback]);

  return {
    connectedPlatforms,
    loadingPlatforms,
    connectSocialPlatform,
    disconnectSocialPlatform,
    refreshConnections,
    verifyPendingOAuth,
    exchangeOAuthCode,
    setConnectedPlatforms,
  };
}