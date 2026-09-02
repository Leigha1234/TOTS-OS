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
  "tiktok",
] as const;

type SupportedPlatform =
  (typeof CLIENT_REFRESH_PLATFORMS)[number];

// ============================================================
// HELPERS
// ============================================================

function getOAuthStorageKey(
  platform: string,
  organisationId?: string | null
) {
  const baseKey =
    platform === "meta"
      ? "oauth_pending_meta"
      : `oauth_pending_${platform}`;

  /*
   * Keep pending OAuth state organisation-specific.
   *
   * This prevents:
   *
   * TOTS Meta pending
   *
   * from being mistaken for:
   *
   * MTC Meta pending
   */
  if (
    organisationId
  ) {
    return `${baseKey}_${organisationId}`;
  }

  return baseKey;
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
    platform === "facebook" ||
    platform === "instagram"
  ) {
    return "meta";
  }

  /*
   * Support any older TikTok naming variants.
   */

  if (
    platform ===
    "tik_tok"
  ) {
    return "tiktok";
  }

  return platform;
}

// ============================================================

function getPlatformLabel(
  platform:
    string
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

  if (
    platform ===
    "tiktok"
  ) {
    return "TikTok";
  }

  return platform;
}

// ============================================================

function cleanOrganisationId(
  value:
    | string
    | null
    | undefined
) {
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
// HOOK
// ============================================================

export function useSocialConnections(
  organisationId?:
    string | null
) {
  const resolvedOrganisationId =
    cleanOrganisationId(
      organisationId
    );

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
  // RESET STATE
  // ==========================================================

  const resetConnections =
    useCallback(
      () => {
        if (
          !isMountedRef.current
        ) {
          return;
        }

        setSocialAccounts(
          []
        );

        setConnectedPlatforms(
          []
        );

        setConnectionHealth({
          meta:
            "disconnected",

          linkedin:
            "disconnected",

          tiktok:
            "disconnected",
        });
      },
      []
    );

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
         * Connections are organisation-specific.
         *
         * Never refresh a token unless we know which
         * organisation owns it.
         */

        if (
          !resolvedOrganisationId
        ) {
          console.warn(
            `[TOTS SOCIAL] Cannot refresh ${platform}: no organisationId supplied.`
          );

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
                "organisation_id",
                resolvedOrganisationId
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
          //
          // All provider secrets remain server-side.
          //
          // TikTok refresh is also sent through this route so
          // client-side code never needs the TikTok secret.
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

                    organisationId:
                      resolvedOrganisationId,
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
                "id",
                data.id
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "organisation_id",
                resolvedOrganisationId
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

          console.log(
            `[TOTS SOCIAL] ${platform} token refreshed successfully.`
          );

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
      [
        resolvedOrganisationId,
      ]
    );

  // ==========================================================
  // VERIFY CONNECTIONS
  // ==========================================================

  const verifyConnections =
    useCallback(
      async () => {
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

        /*
         * Do not accidentally inspect another organisation when
         * the active organisation has not loaded yet.
         */

        if (
          !resolvedOrganisationId
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
          // LOAD CONNECTIONS FOR ACTIVE ORGANISATION ONLY
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
                  organisation_id,
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
              )
              .eq(
                "organisation_id",
                resolvedOrganisationId
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

            /*
             * Ignore unknown platform values rather than creating
             * random health keys.
             */

            if (
              platform !==
                "meta" &&
              platform !==
                "linkedin" &&
              platform !==
                "tiktok"
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
              //
              // LinkedIn and TikTok can both have refresh tokens.
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
               * Access token means Meta OAuth itself succeeded.
               *
               * Facebook Page credentials are useful for
               * publishing but are not required merely to
               * recognise Meta as connected.
               */

              health.meta =
                "connected";

              continue;
            }

            // =================================================
            // LINKEDIN
            // =================================================

            if (
              platform ===
              "linkedin"
            ) {
              health.linkedin =
                "connected";

              continue;
            }

            // =================================================
            // TIKTOK
            // =================================================

            if (
              platform ===
              "tiktok"
            ) {
              health.tiktok =
                "connected";

              continue;
            }
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
            {
              organisationId:
                resolvedOrganisationId,

              health,
            }
          );

          return health;
        } catch (
          error
        ) {
          console.error(
            "[TOTS SOCIAL] Verification failed:",
            error
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
      },
      [
        refreshSocialToken,
        resolvedOrganisationId,
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

        /*
         * No active organisation means there should be no
         * organisation-specific social accounts on screen.
         */

        if (
          !resolvedOrganisationId
        ) {
          resetConnections();

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
          // CRITICAL:
          //
          // We filter by BOTH:
          //
          // user_id
          // organisation_id
          //
          // Therefore switching organisations does not show
          // social accounts belonging to another business.
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
              .eq(
                "organisation_id",
                resolvedOrganisationId
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
                  .filter(
                    (
                      account
                    ) =>
                      Boolean(
                        account.access_token
                      )
                  )
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
            "[TOTS SOCIAL] Loaded organisation accounts:",
            {
              organisationId:
                resolvedOrganisationId,

              accounts,
            }
          );

          console.log(
            "[TOTS SOCIAL] Connected platforms:",
            {
              organisationId:
                resolvedOrganisationId,

              platforms,
            }
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
        resetConnections,
        resolvedOrganisationId,
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

        if (
          !resolvedOrganisationId
        ) {
          return;
        }

        // ====================================================
        // CHECK SESSION STORAGE
        //
        // Meta, LinkedIn and TikTok are all live platforms.
        // ====================================================

        const pending =
          CLIENT_REFRESH_PLATFORMS.filter(
            (
              platform
            ) =>
              window.sessionStorage.getItem(
                getOAuthStorageKey(
                  platform,
                  resolvedOrganisationId
                )
              ) ===
                "true" ||
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
                  organisation_id,
                  platform,
                  access_token
                `
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "organisation_id",
                resolvedOrganisationId
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

          // ==================================================
          // CLEAR ORGANISATION-SPECIFIC PENDING FLAG
          // ==================================================

          window.sessionStorage.removeItem(
            getOAuthStorageKey(
              platform,
              resolvedOrganisationId
            )
          );

          // ==================================================
          // CLEAR LEGACY PENDING FLAG
          // ==================================================

          window.sessionStorage.removeItem(
            getOAuthStorageKey(
              platform
            )
          );

          // ==================================================
          // SUCCESS
          // ==================================================

          if (
            data.access_token
          ) {
            toast.success(
              `${getPlatformLabel(
                platform
              )} connected successfully`
            );
          }
        }

        /*
         * Still refresh even when there wasn't a browser-side
         * OAuth pending flag.
         *
         * OAuth callbacks are server-side, so the database can
         * contain an account even when sessionStorage does not.
         */

        await refreshConnections();
      },
      [
        refreshConnections,
        resolvedOrganisationId,
      ]
    );

  // ==========================================================
  // INITIAL LOAD + REALTIME SUBSCRIPTION
  // ==========================================================

  useEffect(
    () => {
      isMountedRef.current =
        true;

      /*
       * Whenever organisation changes, immediately clear the
       * previous organisation's accounts.
       *
       * This prevents one organisation's account information
       * briefly flashing while another organisation is loading.
       */

      resetConnections();

      const subscribe =
        async () => {
          if (
            !resolvedOrganisationId
          ) {
            return;
          }

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
          // CLEAN OLD SUBSCRIPTION BEFORE NEW ORGANISATION
          // ==================================================

          if (
            channelRef.current
          ) {
            await supabase.removeChannel(
              channelRef.current
            );

            channelRef.current =
              null;
          }

          subscribedRef.current =
            false;

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
          //
          // Subscribe to the active organisation rather than
          // every social account belonging to the user.
          // ==================================================

          channelRef.current =
            supabase
              .channel(
                `social_accounts_${user.id}_${resolvedOrganisationId}`
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
                    `organisation_id=eq.${resolvedOrganisationId}`,
                },
                async (
                  payload
                ) => {
                  console.log(
                    "[TOTS SOCIAL] Realtime organisation social_accounts change:",
                    {
                      organisationId:
                        resolvedOrganisationId,

                      payload,
                    }
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
                    {
                      organisationId:
                        resolvedOrganisationId,

                      status,
                    }
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
      resetConnections,
      resolvedOrganisationId,
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