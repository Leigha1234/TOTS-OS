"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

import {
  toast,
} from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================

type SocialPlatform =
  | "meta"
  | "instagram"
  | "tiktok"
  | "linkedin";

type StoredSocialPlatform =
  | "meta"
  | "tiktok"
  | "linkedin";

export type SocialConnection = {
  id: string;

  user_id: string;

  organisation_id?:
    string | null;

  platform: string;

  access_token:
    string | null;

  refresh_token?:
    string | null;

  expires_at?:
    string | null;

  platform_user_id?:
    string | null;

  page_id?:
    string | null;

  page_name?:
    string | null;

  page_access_token?:
    string | null;

  instagram_business_account_id?:
    string | null;

  display_name?:
    string | null;

  avatar_url?:
    string | null;

  created_at?:
    string | null;

  updated_at?:
    string | null;
};

// ============================================================
// HELPERS
// ============================================================

function normalisePlatform(
  platform:
    string
): StoredSocialPlatform | string {
  const value =
    String(
      platform ||
        ""
    )
      .trim()
      .toLowerCase();

  /*
   * Facebook and Instagram both live inside
   * the single stored Meta connection.
   */

  if (
    value ===
      "facebook" ||
    value ===
      "instagram"
  ) {
    return "meta";
  }

  return value;
}

// ============================================================

function getStoredPlatform(
  platform:
    SocialPlatform
): StoredSocialPlatform {
  if (
    platform ===
      "instagram"
  ) {
    return "meta";
  }

  return platform;
}

// ============================================================

function getOAuthStorageKey(
  platform:
    SocialPlatform
) {
  const storedPlatform =
    getStoredPlatform(
      platform
    );

  return `oauth_pending_${storedPlatform}`;
}

// ============================================================

function clearOAuthStorage(
  platform:
    SocialPlatform
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const storedPlatform =
    getStoredPlatform(
      platform
    );

  try {
    sessionStorage.removeItem(
      getOAuthStorageKey(
        platform
      )
    );

    sessionStorage.removeItem(
      `oauth_state_${storedPlatform}`
    );

    sessionStorage.removeItem(
      "oauth_started_at"
    );
  } catch {
    /*
     * Best effort only.
     */
  }
}

// ============================================================

function decodeReason(
  value:
    string | null
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}

// ============================================================
// HOOK
// ============================================================

export const useSocialConnections =
  (
    userId?:
      string
  ) => {
    // ========================================================
    // STATE
    // ========================================================

    const [
      connections,
      setConnections,
    ] =
      useState<
        SocialConnection[]
      >(
        []
      );

    const [
      loading,
      setLoading,
    ] =
      useState(
        true
      );

    const [
      activeOperation,
      setActiveOperation,
    ] =
      useState<
        string | null
      >(
        null
      );

    const mountedRef =
      useRef(
        true
      );

    const channelRef =
      useRef<any>(
        null
      );

    const callbackHandledRef =
      useRef(
        false
      );

    const fetchInProgressRef =
      useRef(
        false
      );

    // ========================================================
    // FETCH CONNECTIONS
    // ========================================================

    const fetchConnections =
      useCallback(
        async () => {
          if (
            !userId
          ) {
            if (
              mountedRef.current
            ) {
              setConnections(
                []
              );

              setLoading(
                false
              );
            }

            return;
          }

          /*
           * Prevent several simultaneous refreshes caused by
           * realtime + focus + OAuth return.
           */

          if (
            fetchInProgressRef.current
          ) {
            return;
          }

          fetchInProgressRef.current =
            true;

          try {
            if (
              mountedRef.current
            ) {
              setLoading(
                true
              );
            }

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
                    platform_user_id,
                    access_token,
                    refresh_token,
                    expires_at,
                    page_id,
                    page_name,
                    page_access_token,
                    instagram_business_account_id,
                    display_name,
                    avatar_url,
                    created_at,
                    updated_at
                  `
                )
                .eq(
                  "user_id",
                  userId
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
                "[TOTS SOCIAL CONNECTIONS] Fetch failed:",
                error
              );

              if (
                mountedRef.current
              ) {
                toast.error(
                  "Failed to load social connections"
                );
              }

              return;
            }

            const cleaned =
              (
                data ||
                []
              ).map(
                (
                  connection
                ) => ({
                  ...connection,

                  platform:
                    normalisePlatform(
                      connection.platform
                    ),
                })
              ) as SocialConnection[];

            if (
              mountedRef.current
            ) {
              setConnections(
                cleaned
              );
            }

            console.log(
              "[TOTS SOCIAL CONNECTIONS] Loaded:",
              cleaned
            );
          } catch (
            error
          ) {
            console.error(
              "[TOTS SOCIAL CONNECTIONS] Unexpected fetch error:",
              error
            );
          } finally {
            fetchInProgressRef.current =
              false;

            if (
              mountedRef.current
            ) {
              setLoading(
                false
              );
            }
          }
        },
        [
          userId,
        ]
      );

    // ========================================================
    // CONNECT
    // ========================================================

    const connect =
      useCallback(
        async (
          requestedPlatform:
            SocialPlatform
        ) => {
          if (
            !userId
          ) {
            toast.error(
              "User not loaded yet"
            );

            return;
          }

          if (
            typeof window ===
            "undefined"
          ) {
            return;
          }

          const platform =
            getStoredPlatform(
              requestedPlatform
            );

          // ==================================================
          // STORE OAUTH PENDING STATE
          // ==================================================

          try {
            sessionStorage.setItem(
              getOAuthStorageKey(
                requestedPlatform
              ),
              "true"
            );

            sessionStorage.setItem(
              "oauth_started_at",
              String(
                Date.now()
              )
            );
          } catch (
            storageError
          ) {
            console.warn(
              "[TOTS SOCIAL CONNECTIONS] OAuth session storage unavailable:",
              storageError
            );
          }

          let route:
            string;

          // ==================================================
          // META / FACEBOOK / INSTAGRAM
          //
          // IMPORTANT FIX:
          //
          // Your current /api/oauth/meta route expects:
          //
          // ?userId=...
          //
          // It then generates the OAuth state server-side.
          //
          // Do NOT send only ?state=... here anymore.
          // ==================================================

          if (
            platform ===
            "meta"
          ) {
            const params =
              new URLSearchParams({
                userId,

                platform:
                  "meta",
              });

            route =
              `/api/oauth/meta?${params.toString()}`;
          }

          // ==================================================
          // LINKEDIN
          // ==================================================

          else if (
            platform ===
            "linkedin"
          ) {
            const statePayload = {
              userId,

              platform:
                "linkedin",

              createdAt:
                Date.now(),
            };

            const rawState =
              JSON.stringify(
                statePayload
              );

            const encodedState =
              encodeURIComponent(
                rawState
              );

            try {
              sessionStorage.setItem(
                "oauth_state_linkedin",
                rawState
              );
            } catch {
              /*
               * Best effort.
               */
            }

            route =
              `/api/oauth/linkedin?state=${encodedState}`;
          }

          // ==================================================
          // TIKTOK
          // ==================================================

          else if (
            platform ===
            "tiktok"
          ) {
            const statePayload = {
              userId,

              platform:
                "tiktok",

              createdAt:
                Date.now(),
            };

            const rawState =
              JSON.stringify(
                statePayload
              );

            const encodedState =
              encodeURIComponent(
                rawState
              );

            try {
              sessionStorage.setItem(
                "oauth_state_tiktok",
                rawState
              );
            } catch {
              /*
               * Best effort.
               */
            }

            route =
              `/api/oauth/tiktok?state=${encodedState}`;
          }

          // ==================================================
          // UNSUPPORTED
          // ==================================================

          else {
            throw new Error(
              `Unsupported social platform: ${platform}`
            );
          }

          console.log(
            "[TOTS SOCIAL CONNECTIONS] Starting OAuth:",
            {
              requestedPlatform,

              storedPlatform:
                platform,

              userId,

              route,
            }
          );

          setActiveOperation(
            platform
          );

          /*
           * OAuth is a full browser navigation.
           */

          window.location.assign(
            route
          );
        },
        [
          userId,
        ]
      );

    // ========================================================
    // DISCONNECT
    // ========================================================

    const disconnect =
      useCallback(
        async (
          requestedPlatform:
            SocialPlatform
        ) => {
          if (
            !userId
          ) {
            return;
          }

          const platform =
            getStoredPlatform(
              requestedPlatform
            );

          setActiveOperation(
            platform
          );

          try {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "social_accounts"
                )
                .delete()
                .eq(
                  "user_id",
                  userId
                )
                .eq(
                  "platform",
                  platform
                )
                .select(
                  "id"
                );

            if (
              error
            ) {
              console.error(
                `[TOTS SOCIAL CONNECTIONS] ${platform} disconnect failed:`,
                error
              );

              toast.error(
                "Failed to disconnect"
              );

              return;
            }

            /*
             * Supabase may return no SQL error when an RLS
             * policy prevents rows being deleted.
             */

            if (
              !data ||
              data.length ===
                0
            ) {
              console.warn(
                `[TOTS SOCIAL CONNECTIONS] No ${platform} row was deleted. Check social_accounts DELETE RLS.`
              );

              toast.error(
                "The account could not be disconnected"
              );

              return;
            }

            clearOAuthStorage(
              requestedPlatform
            );

            await fetchConnections();

            toast.success(
              `${
                platform ===
                "meta"
                  ? "Meta"
                  : platform ===
                      "linkedin"
                    ? "LinkedIn"
                    : "TikTok"
              } disconnected successfully`
            );
          } catch (
            error
          ) {
            console.error(
              "[TOTS SOCIAL CONNECTIONS] Disconnect error:",
              error
            );

            toast.error(
              "Unable to disconnect this account"
            );
          } finally {
            if (
              mountedRef.current
            ) {
              setActiveOperation(
                null
              );
            }
          }
        },
        [
          userId,
          fetchConnections,
        ]
      );

    // ========================================================
    // GET CONNECTION
    // ========================================================

    const getConnection =
      useCallback(
        (
          requestedPlatform:
            SocialPlatform
        ) => {
          const platform =
            getStoredPlatform(
              requestedPlatform
            );

          return (
            connections.find(
              (
                connection
              ) =>
                normalisePlatform(
                  connection.platform
                ) ===
                platform
            ) ||
            null
          );
        },
        [
          connections,
        ]
      );

    // ========================================================
    // IS TOKEN EXPIRED
    // ========================================================

    const isExpired =
      useCallback(
        (
          connection:
            SocialConnection |
            null
        ) => {
          if (
            !connection
          ) {
            return false;
          }

          if (
            !connection.expires_at
          ) {
            return false;
          }

          const timestamp =
            new Date(
              connection.expires_at
            ).getTime();

          if (
            Number.isNaN(
              timestamp
            )
          ) {
            return false;
          }

          return (
            timestamp <=
            Date.now()
          );
        },
        []
      );

    // ========================================================
    // IS CONNECTED
    // ========================================================

    const isConnected =
      useCallback(
        (
          requestedPlatform:
            SocialPlatform
        ) => {
          const connection =
            getConnection(
              requestedPlatform
            );

          if (
            !connection
          ) {
            return false;
          }

          if (
            !connection.access_token
          ) {
            return false;
          }

          if (
            isExpired(
              connection
            )
          ) {
            return false;
          }

          // ==================================================
          // INSTAGRAM
          //
          // Meta OAuth alone does not mean Instagram is
          // connected. We need a linked IG professional account.
          // ==================================================

          if (
            requestedPlatform ===
            "instagram"
          ) {
            return Boolean(
              connection
                .instagram_business_account_id
            );
          }

          // ==================================================
          // META
          // ==================================================

          if (
            requestedPlatform ===
            "meta"
          ) {
            return Boolean(
              connection
                .access_token
            );
          }

          return true;
        },
        [
          getConnection,
          isExpired,
        ]
      );

    // ========================================================
    // FACEBOOK PAGE
    // ========================================================

    const hasFacebookPage =
      useCallback(
        () => {
          const connection =
            getConnection(
              "meta"
            );

          return Boolean(
            connection
              ?.page_id &&
            connection
              ?.page_access_token
          );
        },
        [
          getConnection,
        ]
      );

    // ========================================================
    // INSTAGRAM
    // ========================================================

    const hasInstagram =
      useCallback(
        () => {
          const connection =
            getConnection(
              "meta"
            );

          return Boolean(
            connection
              ?.instagram_business_account_id
          );
        },
        [
          getConnection,
        ]
      );

    // ========================================================
    // INITIAL FETCH
    // ========================================================

    useEffect(
      () => {
        mountedRef.current =
          true;

        void fetchConnections();

        return () => {
          mountedRef.current =
            false;
        };
      },
      [
        fetchConnections,
      ]
    );

    // ========================================================
    // HANDLE OAUTH RETURN
    // ========================================================

    useEffect(
      () => {
        if (
          typeof window ===
            "undefined" ||
          !userId ||
          callbackHandledRef.current
        ) {
          return;
        }

        const params =
          new URLSearchParams(
            window.location.search
          );

        const oauth =
          params.get(
            "oauth"
          );

        const connected =
          params.get(
            "connected"
          );

        const reason =
          decodeReason(
            params.get(
              "reason"
            )
          );

        const socialError =
          decodeReason(
            params.get(
              "social_error"
            )
          );

        if (
          !oauth &&
          !connected &&
          !socialError
        ) {
          return;
        }

        callbackHandledRef.current =
          true;

        const handleReturn =
          async () => {
            try {
              // ==============================================
              // GENERIC / LEGACY ERROR
              // ==============================================

              if (
                socialError
              ) {
                toast.error(
                  socialError
                );

                return;
              }

              // ==============================================
              // META SUCCESS
              //
              // Supports both current and older callbacks.
              // ==============================================

              if (
                oauth ===
                  "meta_success" ||
                connected ===
                  "meta" ||
                connected ===
                  "facebook"
              ) {
                clearOAuthStorage(
                  "meta"
                );

                await fetchConnections();

                if (
                  mountedRef.current
                ) {
                  setActiveOperation(
                    null
                  );
                }

                toast.success(
                  "Facebook connected successfully"
                );

                return;
              }

              // ==============================================
              // META FAILURE
              // ==============================================

              if (
                oauth ===
                "meta_failed"
              ) {
                clearOAuthStorage(
                  "meta"
                );

                if (
                  mountedRef.current
                ) {
                  setActiveOperation(
                    null
                  );
                }

                toast.error(
                  reason ||
                    "Meta connection failed"
                );

                return;
              }

              // ==============================================
              // LINKEDIN SUCCESS
              // ==============================================

              if (
                oauth ===
                  "linkedin_success" ||
                connected ===
                  "linkedin"
              ) {
                clearOAuthStorage(
                  "linkedin"
                );

                await fetchConnections();

                if (
                  mountedRef.current
                ) {
                  setActiveOperation(
                    null
                  );
                }

                toast.success(
                  "LinkedIn connected successfully"
                );

                return;
              }

              // ==============================================
              // LINKEDIN FAILURE
              // ==============================================

              if (
                oauth ===
                "linkedin_failed"
              ) {
                clearOAuthStorage(
                  "linkedin"
                );

                if (
                  mountedRef.current
                ) {
                  setActiveOperation(
                    null
                  );
                }

                toast.error(
                  reason ||
                    "LinkedIn connection failed"
                );
              }
            } finally {
              // ==============================================
              // REMOVE CALLBACK PARAMS
              // ==============================================

              const cleanUrl =
                new URL(
                  window.location.href
                );

              cleanUrl.searchParams.delete(
                "oauth"
              );

              cleanUrl.searchParams.delete(
                "connected"
              );

              cleanUrl.searchParams.delete(
                "reason"
              );

              cleanUrl.searchParams.delete(
                "platform"
              );

              cleanUrl.searchParams.delete(
                "social_error"
              );

              window.history.replaceState(
                {},
                "",
                cleanUrl.pathname +
                  cleanUrl.search +
                  cleanUrl.hash
              );
            }
          };

        void handleReturn();
      },
      [
        userId,
        fetchConnections,
      ]
    );

    // ========================================================
    // REFRESH WHEN WINDOW REGAINS FOCUS
    // ========================================================

    useEffect(
      () => {
        if (
          typeof window ===
            "undefined" ||
          !userId
        ) {
          return;
        }

        const handleFocus =
          () => {
            void fetchConnections();
          };

        const handleVisibility =
          () => {
            if (
              document.visibilityState ===
              "visible"
            ) {
              void fetchConnections();
            }
          };

        window.addEventListener(
          "focus",
          handleFocus
        );

        document.addEventListener(
          "visibilitychange",
          handleVisibility
        );

        return () => {
          window.removeEventListener(
            "focus",
            handleFocus
          );

          document.removeEventListener(
            "visibilitychange",
            handleVisibility
          );
        };
      },
      [
        userId,
        fetchConnections,
      ]
    );

    // ========================================================
    // REALTIME
    // ========================================================

    useEffect(
      () => {
        if (
          !userId
        ) {
          return;
        }

        if (
          channelRef.current
        ) {
          void supabase.removeChannel(
            channelRef.current
          );

          channelRef.current =
            null;
        }

        const channel =
          supabase
            .channel(
              `social_connections_ui_${userId}`
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
                  `user_id=eq.${userId}`,
              },
              (
                payload
              ) => {
                console.log(
                  "[TOTS SOCIAL CONNECTIONS] Realtime update:",
                  payload
                );

                void fetchConnections();
              }
            )
            .subscribe(
              (
                status
              ) => {
                console.log(
                  "[TOTS SOCIAL CONNECTIONS] Realtime status:",
                  status
                );
              }
            );

        channelRef.current =
          channel;

        return () => {
          if (
            channelRef.current ===
            channel
          ) {
            void supabase.removeChannel(
              channel
            );

            channelRef.current =
              null;
          }
        };
      },
      [
        userId,
        fetchConnections,
      ]
    );

    // ========================================================
    // RETURN
    // ========================================================

    return {
      connections,

      loading,

      activeOperation,

      fetchConnections,

      connect,

      disconnect,

      isConnected,

      getConnection,

      hasFacebookPage,

      hasInstagram,
    };
  };