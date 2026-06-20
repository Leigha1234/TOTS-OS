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
    connectedPlatforms,
    loadingPlatforms,
    connectSocialPlatform,
    disconnectSocialPlatform,
  } = useSocialConnections();

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
          const connected = connectedPlatforms.includes(platform.id);
          const isLoading = loadingPlatforms.includes(platform.id);

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 border rounded-lg"
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
                    onClick={() => disconnectSocialPlatform(platform.id)}
                    className="px-3 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50"
                  >
                    {isLoading ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => connectSocialPlatform(platform.id)}
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
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
