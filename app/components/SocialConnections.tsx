"use client";

import React from "react";
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

export default function SocialConnections() {
  const {
    connections,
    loading,
    connect,
    disconnect,
    isConnected,
  } = useSocialConnections();

  const safeConnect = (platformId: string) => {
    if (!connect) return;
    connect(platformId as any);
  };

  const safeDisconnect = (platformId: string) => {
    if (!disconnect) return;
    disconnect(platformId as any);
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

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id as any);
          const isLoading = loading;

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

              <div>
                {connected ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => safeDisconnect(platform.id)}
                    style={{ backgroundColor: sageGreen }}
                    className="px-3 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => safeConnect(platform.id)}
                    style={{ backgroundColor: sageGreen }}
                    className="px-3 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? "Connecting..." : `Connect ${platform.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
