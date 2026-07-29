"use client";

import React, { useState } from "react";
import { useSocialConnections } from "@/app/hooks/useSocialConnections";

const platforms = [
  {
    id: "meta",
    name: "Meta",
    description: "Facebook Pages and Instagram publishing",
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

  const {
    loading,
    connect,
    disconnect,
    isConnected,
  } = useSocialConnections();

  const safeConnect = async (platformId: PlatformId) => {
    try {
      setError(null);
      setActivePlatform(platformId);

      await connect(platformId);
    } catch (err) {
      console.error("Social connection failed:", err);
      setError("Unable to connect this account. Please try again.");
      setActivePlatform(null);
    }
  };

  const safeDisconnect = async (platformId: PlatformId) => {
    try {
      setError(null);
      setActivePlatform(platformId);

      await disconnect(platformId);
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
                  disabled={buttonLoading}
                  onClick={() => safeConnect(platform.id)}
                  style={{ backgroundColor: sageGreen }}
                  className="px-3 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                >
                  {buttonLoading ? "Connecting..." : `Connect ${platform.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
