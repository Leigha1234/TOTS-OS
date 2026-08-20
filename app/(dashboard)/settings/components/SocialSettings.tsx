"use client";

import SocialConnections from "@/app/components/SocialConnections";

import type {
  ConnectionHealth,
  SocialAccount,
} from "../types";

type SocialSettingsProps = {
  socialAccounts?: SocialAccount[];
  connectionHealth?: Record<
    string,
    ConnectionHealth
  >;
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
  /*
   * Keep the account data available here because
   * SocialSettings may use it for additional status
   * information in future.
   *
   * SocialConnections currently manages its own state
   * and does not accept props.
   */
  void socialAccounts;

  return (
    <div className="space-y-8">
      {/* =========================================
          CONNECTION STATUS
      ========================================= */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">

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
          CONNECTION LINKS
      ========================================= */}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
            Account Connections
          </p>
        </div>

        <SocialConnections />
      </div>
    </div>
  );
}