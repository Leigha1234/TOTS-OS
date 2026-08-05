"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

type UseTikTokOAuthResultOptions = {
  refreshConnections: () => Promise<void>;
  verifyConnections: () => Promise<void>;
  onConnected?: () => void;
};

const TIKTOK_ERROR_MESSAGES: Record<string, string> = {
  rejected: "TikTok connection was cancelled or rejected.",
  missing_parameters: "TikTok returned incomplete callback information.",
  config: "TikTok is not configured correctly.",
  authentication: "Your session expired. Please sign in and try again.",
  state_mismatch:
    "TikTok security validation failed. Please reconnect your account.",
  token_exchange: "TikTok could not complete the token exchange.",
  token_expiry: "TikTok returned an invalid token expiry.",
  profile: "TikTok connected, but the profile could not be loaded.",
  database: "TikTok connected, but the account could not be saved.",
  unexpected: "An unexpected TikTok connection error occurred.",
};

function getTikTokErrorMessage(reason: string | null) {
  if (!reason) {
    return "TikTok connection failed. Please try again.";
  }

  return (
    TIKTOK_ERROR_MESSAGES[reason] ||
    "TikTok connection failed. Please try again."
  );
}

function cleanOAuthUrl() {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

export function useTikTokOAuthResult({
  refreshConnections,
  verifyConnections,
  onConnected,
}: UseTikTokOAuthResultOptions) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (processingRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const connected = params.get("connected");
    const oauthStatus = params.get("oauth");
    const reason = params.get("reason");

    const isTikTokSuccess = connected === "tiktok";
    const isTikTokFailure = oauthStatus === "tiktok_failed";

    if (!isTikTokSuccess && !isTikTokFailure) {
      return;
    }

    processingRef.current = true;

    const handleTikTokOAuthResult = async () => {
      try {
        if (isTikTokSuccess) {
          const { error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            throw refreshError;
          }

          await refreshConnections();
          await verifyConnections();

          sessionStorage.removeItem("oauth_pending_tiktok");
          sessionStorage.removeItem("oauth_started_at");

          toast.success("TikTok connected successfully");

          onConnected?.();

          return;
        }

        toast.error(getTikTokErrorMessage(reason));
      } catch (error) {
        console.error(
          "TikTok OAuth result handling failed:",
          error
        );

        toast.error(
          "TikTok connected, but the settings page could not refresh."
        );
      } finally {
        cleanOAuthUrl();
        processingRef.current = false;
      }
    };

    void handleTikTokOAuthResult();
  }, [
    onConnected,
    refreshConnections,
    verifyConnections,
  ]);
}