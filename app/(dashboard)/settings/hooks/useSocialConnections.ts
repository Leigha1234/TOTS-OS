"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  supabase,
} from "@/lib/supabase";

import type {
  ConnectionHealth,
  SocialAccount,
} from "../types";

// ============================================================
// CONSTANTS
// ============================================================

const CLIENT_REFRESH_PLATFORMS = [
  "meta",
  "linkedin",
] as const;

// ============================================================
// HELPERS
// ============================================================

function getOAuthStorageKey(
  platform: string
) {
  return platform ===
    "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;
}

// ============================================================

function normalisePlatform(
  value:
    | string
    | null
    | undefined
) {
  const platform =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  /*
   * Support older records that may have been saved as
   * facebook or instagram before Meta was combined.
   */

  if (
    platform ===
      "facebook" ||
    platform ===
      "instagram"
  ) {
    return "meta";
  }

  return platform;
}

// ============================================================
// HOOK
// ============================================================

export function useSocialConnections() {
  const isMountedRef =
    useRef(
      true
    );

  const subscribedRef =
    useRef(
      false
    );

  const channelRef =
    useRef<any>(
      null
    );

  const refreshInProgressRef =
    useRef(
      false
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    socialAccounts,
    setSocialAccounts,
  ] =
    useState<
      SocialAccount[]
    >(
      []
    );

  const [
    connectedPlatforms,
    setConnectedPlatforms,
  ] =
    useState<
      string[]
    >(
      []
    );

  const [
    connectionHealth,
    setConnectionHealth,
  ] =
    useState<
      Record<
        string,
        ConnectionHealth
      >
    >({
      meta:
        "unknown",

      linkedin:
        "unknown",

      tiktok:
        "unknown",
    });

  // ==========================================================
  // REFRESH TOKEN
  // ==========================================================

  const refreshSocialToken =
    useCallback(
      async (
        platform:
          string
      ) => {
        /*
         * TikTok token refresh remains server-side.
         */

        if (
          platform ===
          "tiktok"
        ) {
          return false;
        }

        try {
          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError ||
            !user ||
            !isMountedRef.current
          ) {
            return false;
          }

          // ==================================================
          // LOAD REFRESH TOKEN
          // ==================================================

          const {
            data,
            error:
              tokenLookupError,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .select(
                `
                  id,
                  refresh_token
                `
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "platform",
                platform
              )
              .maybeSingle();

          if (
            tokenLookupError
          ) {
            console.error(
              `[TOTS SOCIAL] ${platform} refresh token lookup failed:`,
              tokenLookupError
            );

            return false;
          }

          /*
           * Meta long-lived user tokens generally do not use a
           * conventional refresh_token.
           *
           * Therefore a missing refresh token is not automatically
           * evidence that the Meta connection is broken.
           */

          if (
            !data?.refresh_token
          ) {
            return false;
          }

          // ==================================================
          // SERVER REFRESH
          // ==================================================

          const response =
            await fetch(
              "/api/oauth/refresh",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                cache:
                  "no-store",

                body:
                  JSON.stringify({
                    platform,

                    refresh_token:
                      data.refresh_token,

                    userId:
                      user.id,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            const text =
              await response
                .text()
                .catch(
                  () =>
                    ""
                );

            console.error(
              `[TOTS SOCIAL] ${platform} refresh endpoint failed:`,
              response.status,
              text
            );

            return false;
          }

          const tokens =
            await response.json();

          if (
            !tokens?.access_token
          ) {
            console.error(
              `[TOTS SOCIAL] ${platform} refresh did not return an access_token.`
            );

            return false;
          }

          // ==================================================
          // SAVE NEW TOKEN
          // ==================================================

          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .update({
                access_token:
                  tokens.access_token,

                refresh_token:
                  tokens.refresh_token ||
                  data.refresh_token,

                expires_at:
                  tokens.expires_at ||
                  null,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "platform",
                platform
              );

          if (
            updateError
          ) {
            console.error(
              `[TOTS SOCIAL] ${platform} token save failed:`,
              updateError
            );

            return false;
          }

          return true;
        } catch (
          error
        ) {
          console.warn(
            `[TOTS SOCIAL] ${platform} token refresh failed:`,
            error
          );

          return false;
        }
      },
      []
    );

  // ==========================================================
  // VERIFY CONNECTIONS
  // ==========================================================

  const verifyConnections =
    useCallback(
      async () => {
        try {
          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth.getUser();

          const health:
            Record<
              string,
              ConnectionHealth
            > = {
            meta:
              "disconnected",

            linkedin:
              "disconnected",

            tiktok:
              "disconnected",
          };

          if (
            authError ||
            !user
          ) {
            if (
              isMountedRef.current
            ) {
              setConnectionHealth(
                health
              );
            }

            return health;
          }

          // ==================================================
          // LOAD CONNECTIONS
          // ==================================================

          const {
            data:
              connections,

            error:
              connectionsError,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .select(
                `
                  id,
                  platform,
                  access_token,
                  refresh_token,
                  expires_at,
                  page_id,
                  page_name,
                  page_access_token,
                  instagram_business_account_id,
                  display_name
                `
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            connectionsError
          ) {
            console.error(
              "[TOTS SOCIAL] Connection verification query failed:",
              connectionsError
            );

            if (
              isMountedRef.current
            ) {
              setConnectionHealth(
                health
              );
            }

            return health;
          }

          const now =
            Date.now();

          // ==================================================
          // CHECK EACH CONNECTION
          // ==================================================

          for (
            const connection of
            connections ||
            []
          ) {
            const platform =
              normalisePlatform(
                connection.platform
              );

            if (
              !platform
            ) {
              continue;
            }

            // =================================================
            // NO ACCESS TOKEN
            // =================================================

            if (
              !connection.access_token
            ) {
              health[
                platform
              ] =
                "expired";

              continue;
            }

            // =================================================
            // TOKEN EXPIRY
            // =================================================

            const expiry =
              connection.expires_at
                ? new Date(
                    connection.expires_at
                  ).getTime()
                : null;

            if (
              expiry &&
              !Number.isNaN(
                expiry
              ) &&
              expiry <=
                now
            ) {
              // ===============================================
              // TIKTOK
              // ===============================================

              if (
                platform ===
                "tiktok"
              ) {
                health[
                  platform
                ] =
                  "expired";

                continue;
              }

              // ===============================================
              // META
              //
              // Meta usually has no normal refresh_token.
              // ===============================================

              if (
                platform ===
                "meta" &&
              !connection.refresh_token
              ) {
                health.meta =
                  "expired";

                continue;
              }

              // ===============================================
              // REFRESHABLE PROVIDERS
              // ===============================================

              if (
                connection.refresh_token
              ) {
                const refreshed =
                  await refreshSocialToken(
                    platform
                  );

                health[
                  platform
                ] =
                  refreshed
                    ? "connected"
                    : "expired";
              } else {
                health[
                  platform
                ] =
                  "expired";
              }

              continue;
            }

            // =================================================
            // META
            // =================================================

            if (
              platform ===
              "meta"
            ) {
              /*
               * An access token means Meta OAuth itself worked.
               *
               * page_id/page_access_token are useful for Facebook
               * publishing, but we should not mark the entire Meta
               * connection disconnected merely because a Page has
               * not been selected.
               */

              health.meta =
                "connected";

              continue;
            }

            // =================================================
            // OTHER PLATFORMS
            // =================================================

            health[
              platform
            ] =
              "connected";
          }

          if (
            isMountedRef.current
          ) {
            setConnectionHealth(
              health
            );
          }

          console.log(
            "[TOTS SOCIAL] Connection health:",
            health
          );

          return health;
        } catch (
          error
        ) {
          console.error(
            "[TOTS SOCIAL] Verification failed:",
            error
          );

          return null;
        }
      },
      [
        refreshSocialToken,
      ]
    );

  // ==========================================================
  // REFRESH CONNECTIONS
  // ==========================================================

  const refreshConnections =
    useCallback(
      async () => {
        /*
         * Prevent multiple Settings effects/realtime callbacks
         * requesting the same data simultaneously.
         */

        if (
          refreshInProgressRef.current
        ) {
          return;
        }

        refreshInProgressRef.current =
          true;

        try {
          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError
          ) {
            console.error(
              "[TOTS SOCIAL] User lookup failed:",
              authError
            );

            return;
          }

          if (
            !user ||
            !isMountedRef.current
          ) {
            return;
          }

          // ==================================================
          // LOAD SOCIAL ACCOUNTS
          //
          // IMPORTANT:
          //
          // Every field here exists in your actual
          // social_accounts table.
          //
          // platform_username was intentionally removed because
          // that column DOES NOT exist.
          // ==================================================

          const {
            data,

            error,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .select(
                `
                  id,
                  user_id,
                  organisation_id,
                  platform,
                  access_token,
                  refresh_token,
                  platform_user_id,
                  expires_at,
                  created_at,
                  instagram_business_account_id,
                  page_id,
                  page_name,
                  page_access_token,
                  updated_at,
                  avatar_url,
                  display_name
                `
              )
              .eq(
                "user_id",
                user.id
              )
              .order(
                "updated_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            error
          ) {
            console.error(
              "[TOTS SOCIAL] social_accounts query failed:",
              error
            );

            return;
          }

          // ==================================================
          // NORMALISE ACCOUNTS
          // ==================================================

          const rawAccounts =
            data ||
            [];

          const accounts =
            rawAccounts.map(
              (
                account
              ) => ({
                ...account,

                platform:
                  normalisePlatform(
                    account.platform
                  ),
              })
            ) as SocialAccount[];

          if (
            !isMountedRef.current
          ) {
            return;
          }

          setSocialAccounts(
            accounts
          );

          // ==================================================
          // CONNECTED PLATFORM LIST
          // ==================================================

          const platforms =
            Array.from(
              new Set(
                accounts
                  .map(
                    (
                      account
                    ) =>
                      normalisePlatform(
                        account.platform
                      )
                  )
                  .filter(
                    (
                      platform
                    ): platform is string =>
                      Boolean(
                        platform
                      )
                  )
              )
            );

          setConnectedPlatforms(
            platforms
          );

          console.log(
            "[TOTS SOCIAL] Loaded accounts:",
            accounts
          );

          console.log(
            "[TOTS SOCIAL] Connected platforms:",
            platforms
          );

          // ==================================================
          // VERIFY HEALTH
          // ==================================================

          await verifyConnections();
        } catch (
          error
        ) {
          console.error(
            "[TOTS SOCIAL] Refresh connections failed:",
            error
          );
        } finally {
          refreshInProgressRef.current =
            false;
        }
      },
      [
        verifyConnections,
      ]
    );

  // ==========================================================
  // VERIFY PENDING OAUTH
  // ==========================================================

  const verifyPendingOAuth =
    useCallback(
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        // ====================================================
        // CHECK SESSION STORAGE
        // ====================================================

        const pending =
          CLIENT_REFRESH_PLATFORMS.filter(
            (
              platform
            ) =>
              window.sessionStorage.getItem(
                getOAuthStorageKey(
                  platform
                )
              ) ===
              "true"
          );

        const {
          data: {
            user,
          },

          error:
            authError,
        } =
          await supabase.auth.getUser();

        if (
          authError ||
          !user
        ) {
          return;
        }

        // ====================================================
        // VERIFY EACH PENDING CONNECTION
        // ====================================================

        for (
          const platform of
          pending
        ) {
          const {
            data,

            error,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .select(
                `
                  id,
                  platform,
                  access_token
                `
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "platform",
                platform
              )
              .maybeSingle();

          if (
            error
          ) {
            console.error(
              `[TOTS SOCIAL] Pending ${platform} verification failed:`,
              error
            );

            continue;
          }

          if (
            !data
          ) {
            continue;
          }

          window.sessionStorage.removeItem(
            getOAuthStorageKey(
              platform
            )
          );

          if (
            data.access_token
          ) {
            toast.success(
              `${
                platform ===
                "meta"
                  ? "Meta"
                  : "LinkedIn"
              } connected successfully`
            );
          }
        }

        /*
         * IMPORTANT:
         *
         * Still refresh even when there wasn't a browser-side
         * OAuth pending flag.
         *
         * Meta's callback is server-side, so the database can
         * contain the new account even when sessionStorage does
         * not.
         */

        await refreshConnections();
      },
      [
        refreshConnections,
      ]
    );

  // ==========================================================
  // INITIAL LOAD + REALTIME SUBSCRIPTION
  // ==========================================================

  useEffect(
    () => {
      isMountedRef.current =
        true;

      const subscribe =
        async () => {
          const {
            data: {
              user,
            },

            error,
          } =
            await supabase.auth.getUser();

          if (
            error
          ) {
            console.error(
              "[TOTS SOCIAL] Subscription user lookup failed:",
              error
            );

            return;
          }

          if (
            !user
          ) {
            return;
          }

          // ==================================================
          // INITIAL LOAD
          // ==================================================

          await refreshConnections();

          if (
            !isMountedRef.current
          ) {
            return;
          }

          // ==================================================
          // PREVENT DUPLICATE SUBSCRIPTIONS
          // ==================================================

          if (
            subscribedRef.current
          ) {
            return;
          }

          subscribedRef.current =
            true;

          // ==================================================
          // REALTIME
          // ==================================================

          channelRef.current =
            supabase
              .channel(
                `social_accounts_${user.id}`
              )
              .on(
                "postgres_changes",
                {
                  event:
                    "*",

                  schema:
                    "public",

                  table:
                    "social_accounts",

                  filter:
                    `user_id=eq.${user.id}`,
                },
                async (
                  payload
                ) => {
                  console.log(
                    "[TOTS SOCIAL] Realtime social_accounts change:",
                    payload
                  );

                  await refreshConnections();
                }
              )
              .subscribe(
                (
                  status
                ) => {
                  console.log(
                    "[TOTS SOCIAL] Realtime subscription:",
                    status
                  );
                }
              );
        };

      void subscribe();

      // ======================================================
      // CLEANUP
      // ======================================================

      return () => {
        isMountedRef.current =
          false;

        if (
          channelRef.current
        ) {
          void supabase.removeChannel(
            channelRef.current
          );

          channelRef.current =
            null;
        }

        subscribedRef.current =
          false;
      };
    },
    [
      refreshConnections,
    ]
  );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    socialAccounts,

    connectedPlatforms,

    connectionHealth,

    refreshConnections,

    verifyConnections,

    verifyPendingOAuth,
  };
}