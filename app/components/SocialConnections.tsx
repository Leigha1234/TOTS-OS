"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSocialConnections } from "@/app/hooks/useSocialConnections";

const platforms = [
  {
    id: "meta",
    name: "Facebook",
    description: "Facebook Pages and Instagram Business publishing",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional posts and updates",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Short-form content publishing",
  },
] as const;

type PlatformId = (typeof platforms)[number]["id"];

export default function SocialConnections() {
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to load authenticated user:", error);
        return;
      }

      setUserId(data.user?.id);
    };

    loadUser();
  }, []);

  const loadConnections = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("social_accounts")
      .select("id, platform, page_name, instagram_business_account_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed loading social accounts:", error);
      return;
    }

    setConnectedAccounts(data || []);
  };

  useEffect(() => {
    loadConnections();
  }, [userId]);

  const { loading, connect, disconnect, isConnected } =
    useSocialConnections(userId);

  const safeConnect = async (platformId: PlatformId) => {
    try {
      setError(null);
      setActivePlatform(platformId);

      await connect(platformId);
      await loadConnections();
    } catch (err) {
      console.error("Social connection failed:", err);
      setError(err instanceof Error ? err.message : "Unable to connect this account. Please try again.");
      setActivePlatform(null);
    }
  };

  const safeDisconnect = async (platformId: PlatformId) => {
    try {
      setError(null);
      setActivePlatform(platformId);

      await disconnect(platformId);
      await loadConnections();
    } catch (err) {
      console.error("Social disconnect failed:", err);
      setError("Unable to disconnect this account. Please try again.");
    } finally {
      setActivePlatform(null);
    }
  };

  const sageGreen = "#A3B18A";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Social Connections</h2>
        <p className="text-sm text-gray-500">
          Connect your platforms to publish and manage content from TOTS-OS.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id);
          const buttonLoading = activePlatform === platform.id && loading;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-white"
            >
              <div>
                <h3 className="font-medium">{platform.name}</h3>
                <p className="text-sm text-gray-500">
                  {platform.description}
                </p>
              </div>

              {connected ? (
                <button
                  type="button"
                  disabled={buttonLoading}
                  onClick={() => safeDisconnect(platform.id)}
                  style={{ backgroundColor: sageGreen }}
                  className="px-3 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                >
                  {buttonLoading ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!userId || buttonLoading}
                  onClick={() => safeConnect(platform.id)}
                  style={{ backgroundColor: sageGreen }}
                  className="px-3 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                >
                  {buttonLoading
                    ? "Connecting..."
                    : !userId
                    ? "Loading..."
                    : `Connect ${platform.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {connectedAccounts.length > 0 && (
        <div className="rounded-xl border bg-white p-4 space-y-2">
          <h3 className="font-medium">Connected accounts</h3>
          {connectedAccounts.map((account) => (
            <div key={account.id} className="text-sm text-gray-600">
              {account.platform}
              {account.page_name ? ` - ${account.page_name}` : ""}
              {account.instagram_business_account_id ? " (Instagram Business)" : ""}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
