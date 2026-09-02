"use client";

import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  RefreshCw,
} from "lucide-react";

import SocialConnections from "@/app/components/SocialConnections";

import type {
  ConnectionHealth,
  SocialAccount,
} from "../types";

// ============================================================
// TYPES
// ============================================================

type SocialSettingsProps = {
  organisationId:
    string | null;

  socialAccounts?: SocialAccount[];

  connectionHealth?: Record<
    string,
    ConnectionHealth
  >;
};

// ============================================================
// CONSTANTS
// ============================================================

const PLATFORMS = [
  "meta",
  "linkedin",
  "tiktok",
] as const;

type SupportedPlatform =
  (typeof PLATFORMS)[number];

// ============================================================
// HELPERS
// ============================================================

function getPlatformLabel(
  platform:
    SupportedPlatform
) {
  if (
    platform ===
    "meta"
  ) {
    return "Meta";
  }

  if (
    platform ===
    "linkedin"
  ) {
    return "LinkedIn";
  }

  return "TikTok";
}

// ============================================================

function getHealthLabel(
  status:
    ConnectionHealth
) {
  if (
    status ===
    "connected"
  ) {
    return "Connected";
  }

  if (
    status ===
    "expired"
  ) {
    return "Needs reconnecting";
  }

  if (
    status ===
    "unknown"
  ) {
    return "Checking";
  }

  return "Not connected";
}

// ============================================================

function getHealthClasses(
  status:
    ConnectionHealth
) {
  if (
    status ===
    "connected"
  ) {
    return {
      wrapper:
        "border-emerald-200 bg-emerald-50",

      icon:
        "text-emerald-600",

      title:
        "text-emerald-800",

      text:
        "text-emerald-600",
    };
  }

  if (
    status ===
    "expired"
  ) {
    return {
      wrapper:
        "border-amber-200 bg-amber-50",

      icon:
        "text-amber-600",

      title:
        "text-amber-800",

      text:
        "text-amber-600",
    };
  }

  if (
    status ===
    "unknown"
  ) {
    return {
      wrapper:
        "border-stone-200 bg-stone-50",

      icon:
        "text-stone-400",

      title:
        "text-stone-700",

      text:
        "text-stone-400",
    };
  }

  return {
    wrapper:
      "border-red-100 bg-red-50",

    icon:
      "text-red-400",

    title:
      "text-red-700",

    text:
      "text-red-400",
  };
}

// ============================================================

function getAccountString(
  account:
    SocialAccount | undefined,

  key:
    string
) {
  if (
    !account
  ) {
    return null;
  }

  const value =
    (
      account as Record<
        string,
        unknown
      >
    )[key];

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned ||
    null;
}

// ============================================================

function normalisePlatform(
  value:
    unknown
) {
  return String(
    value ??
      ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================
// COMPONENT
// ============================================================

export default function SocialSettings({
  organisationId,

  socialAccounts = [],

  connectionHealth = {},
}: SocialSettingsProps) {
  // ==========================================================
  // CONNECTION HELPERS
  // ==========================================================

  function getPlatformAccount(
    platform:
      SupportedPlatform
  ) {
    return socialAccounts.find(
      (
        account
      ) => {
        const accountPlatform =
          normalisePlatform(
            account.platform
          );

        // ------------------------------------------------------
        // META
        // ------------------------------------------------------

        if (
          platform ===
          "meta"
        ) {
          return (
            accountPlatform ===
              "meta" ||
            accountPlatform ===
              "facebook" ||
            accountPlatform ===
              "instagram"
          );
        }

        // ------------------------------------------------------
        // LINKEDIN
        // ------------------------------------------------------

        if (
          platform ===
          "linkedin"
        ) {
          return (
            accountPlatform ===
            "linkedin"
          );
        }

        // ------------------------------------------------------
        // TIKTOK
        // ------------------------------------------------------

        if (
          platform ===
          "tiktok"
        ) {
          return (
            accountPlatform ===
              "tiktok" ||
            accountPlatform ===
              "tik_tok"
          );
        }

        return false;
      }
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#829473]">
          Social integrations
        </p>

        <h2 className="mt-2 font-serif text-3xl italic text-stone-800">
          Connected accounts
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Connect the social accounts you want to manage and
          publish through TOTS-OS.
        </p>
      </div>

      {/* =====================================================
          CONNECTION STATUS
      ===================================================== */}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
              Connection health
            </p>

            <p className="mt-2 text-xs leading-5 text-stone-500">
              This shows what TOTS-OS currently sees in your
              connected social account records.
            </p>
          </div>

          <RefreshCw
            size={15}
            className="mt-1 shrink-0 text-stone-300"
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {PLATFORMS.map(
            (
              platform
            ) => {
              const status =
                connectionHealth[
                  platform
                ] ??
                "unknown";

              const account =
                getPlatformAccount(
                  platform
                );

              const styles =
                getHealthClasses(
                  status
                );

              const label =
                getPlatformLabel(
                  platform
                );

              const displayName =
                getAccountString(
                  account,
                  "display_name"
                );

              const pageName =
                getAccountString(
                  account,
                  "page_name"
                );

              const instagramBusinessAccountId =
                getAccountString(
                  account,
                  "instagram_business_account_id"
                );

              const username =
                getAccountString(
                  account,
                  "username"
                ) ||
                getAccountString(
                  account,
                  "user_name"
                );

              const tiktokOpenId =
                getAccountString(
                  account,
                  "open_id"
                );

              return (
                <div
                  key={
                    platform
                  }
                  className={`rounded-2xl border p-4 ${styles.wrapper}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 ${styles.icon}`}
                    >
                      {status ===
                      "connected" ? (
                        <CheckCircle2
                          size={
                            17
                          }
                        />
                      ) : status ===
                        "expired" ? (
                        <CircleAlert
                          size={
                            17
                          }
                        />
                      ) : (
                        <CircleHelp
                          size={
                            17
                          }
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold ${styles.title}`}
                      >
                        {
                          label
                        }
                      </p>

                      <p
                        className={`mt-1 text-[9px] font-black uppercase tracking-[0.13em] ${styles.text}`}
                      >
                        {getHealthLabel(
                          status
                        )}
                      </p>

                      {account && (
                        <div className="mt-3 space-y-1">
                          {displayName && (
                            <p className="truncate text-[10px] font-medium text-stone-600">
                              {
                                displayName
                              }
                            </p>
                          )}

                          {platform ===
                            "meta" &&
                            pageName && (
                              <p className="truncate text-[9px] text-stone-400">
                                Page:{" "}
                                {
                                  pageName
                                }
                              </p>
                            )}

                          {platform ===
                            "meta" &&
                            instagramBusinessAccountId && (
                              <p className="truncate text-[9px] font-medium text-emerald-600">
                                Instagram Business linked
                              </p>
                            )}

                          {platform ===
                            "linkedin" &&
                            !displayName && (
                              <p className="truncate text-[9px] text-stone-400">
                                LinkedIn account connected
                              </p>
                            )}

                          {platform ===
                            "tiktok" &&
                            username && (
                              <p className="truncate text-[9px] text-stone-500">
                                @
                                {
                                  username.replace(
                                    /^@/,
                                    ""
                                  )
                                }
                              </p>
                            )}

                          {platform ===
                            "tiktok" &&
                            !displayName &&
                            !username &&
                            tiktokOpenId && (
                              <p className="truncate text-[9px] font-medium text-emerald-600">
                                TikTok account linked
                              </p>
                            )}

                          {platform ===
                            "tiktok" &&
                            !displayName &&
                            !username &&
                            !tiktokOpenId && (
                              <p className="truncate text-[9px] text-stone-400">
                                TikTok account connected
                              </p>
                            )}
                        </div>
                      )}

                      {status ===
                        "connected" &&
                        !account && (
                          <p className="mt-3 text-[9px] leading-4 text-stone-400">
                            Connection found. Account details are
                            still loading.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* =====================================================
          CONNECTION CONTROLS
      ===================================================== */}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Account connections
          </p>

          <h3 className="mt-2 font-serif text-2xl italic text-stone-800">
            Manage integrations
          </h3>

          <p className="mt-2 text-xs leading-5 text-stone-500">
            Connect, reconnect or remove the accounts TOTS-OS can
            use for Facebook, Instagram, LinkedIn and TikTok.
          </p>
        </div>

        <SocialConnections
          organisationId={
            organisationId
          }
        />
      </div>
    </div>
  );
}