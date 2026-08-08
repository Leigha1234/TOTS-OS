"use client";

import SocialConnections from "@/app/components/SocialConnections";

import type {
  ConnectionHealth,
  SocialAccount,
} from "../types";

type SocialSettingsProps = {
  socialAccounts?: SocialAccount[];
  connectionHealth?: Record<string, ConnectionHealth>;
};

const PLATFORMS = [
  "meta",
  "linkedin",
  "tiktok",
] as const;

export default function SocialSettings({
  socialAccounts = [],
  connectionHealth = {},
}: SocialSettingsProps) {
  return (
    <div className="space-y-8">
      {/* =========================================
          CONNECTION STATUS
      ========================================= */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
            Social Connections
          </p>

          <h3 className="text-xl font-serif italic text-stone-900">
            Connected Platforms
          </h3>

          <p className="text-sm text-stone-500">
            Connect your social media accounts so TOTS-OS
            can publish and manage content through your
            connected platforms.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const status =
              connectionHealth[platform] ??
              "disconnected";

            const styles =
              status === "connected"
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : status === "expired"
                  ? "border-amber-200 bg-amber-100 text-amber-700"
                  : status === "unknown"
                    ? "border-stone-200 bg-stone-100 text-stone-500"
                    : "border-red-200 bg-red-100 text-red-700";

            const label =
              platform === "meta"
                ? "Meta"
                : platform === "linkedin"
                  ? "LinkedIn"
                  : "TikTok";

            return (
              <div
                key={platform}
                className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-wider ${styles}`}
              >
                {label} · {status}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================
          CONNECTION MANAGER
      ========================================= */}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
            Account Connections
          </p>

          <h3 className="mt-2 text-2xl font-serif italic text-stone-900">
            Manage Connected Accounts
          </h3>

          <p className="mt-2 text-sm text-stone-500">
            Connect, reconnect or disconnect your supported
            social media platforms.
          </p>
        </div>

        <SocialConnections
          socialAccounts={socialAccounts}
          connectionHealth={connectionHealth}
        />
      </div>
    </div>
  );
}