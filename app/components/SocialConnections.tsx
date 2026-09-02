"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  LogOut,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type SocialConnectionsProps = {
  organisationId?:
    string | null;
};

const platforms = [
  {
    id: "meta",
    name: "Meta",
    description:
      "Connect Facebook Pages and Instagram Business.",
  },

  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Connect LinkedIn for professional posts and updates.",
  },

  {
    id: "tiktok",
    name: "TikTok",
    description:
      "Connect TikTok for short-form publishing.",
  },
] as const;

type PlatformId =
  (typeof platforms)[number]["id"];

type SocialAccountRow = {
  id:
    string;

  user_id:
    string;

  platform:
    string;

  platform_user_id:
    string | null;

  access_token:
    string | null;

  refresh_token:
    string | null;

  expires_at:
    string | null;

  page_id:
    string | null;

  page_name:
    string | null;

  page_access_token:
    string | null;

  instagram_business_account_id:
    string | null;

  organisation_id:
    string | null;

  avatar_url:
    string | null;

  display_name:
    string | null;

  created_at:
    string | null;

  updated_at:
    string | null;
};

type OAuthState = {
  userId:
    string;

  organisationId:
    string;

  platform:
    PlatformId;

  createdAt:
    number;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
): string | null {
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
    | string
    | null
    | undefined
): PlatformId | string {
  const platform =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    platform ===
      "facebook" ||
    platform ===
      "instagram"
  ) {
    return "meta";
  }

  if (
    platform ===
    "tik_tok"
  ) {
    return "tiktok";
  }

  return platform;
}

// ============================================================

function getConnectionStorageKey(
  platform:
    PlatformId,

  organisationId?:
    string | null
) {
  if (
    organisationId
  ) {
    return `oauth_pending_${platform}_${organisationId}`;
  }

  return `oauth_pending_${platform}`;
}

// ============================================================

function getStateStorageKey(
  platform:
    PlatformId,

  organisationId?:
    string | null
) {
  if (
    organisationId
  ) {
    return `oauth_state_${platform}_${organisationId}`;
  }

  return `oauth_state_${platform}`;
}

// ============================================================

function platformLabel(
  platform:
    PlatformId
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

function getConnectPath(
  platform:
    PlatformId
) {
  if (
    platform ===
    "meta"
  ) {
    return "/api/auth/meta";
  }

  if (
    platform ===
    "linkedin"
  ) {
    return "/api/auth/linkedin";
  }

  return "/api/auth/tiktok";
}

// ============================================================

function createOAuthState(
  userId:
    string,

  organisationId:
    string,

  platform:
    PlatformId
): {
  raw:
    string;

  encoded:
    string;
} {
  const payload:
    OAuthState = {
    userId,

    organisationId,

    platform,

    createdAt:
      Date.now(),
  };

  const raw =
    JSON.stringify(
      payload
    );

  return {
    raw,

    encoded:
      encodeURIComponent(
        raw
      ),
  };
}

// ============================================================

function clearOAuthStorage(
  platform:
    PlatformId,

  organisationId?:
    string | null
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      getConnectionStorageKey(
        platform,
        organisationId
      )
    );

    window.sessionStorage.removeItem(
      getStateStorageKey(
        platform,
        organisationId
      )
    );

    window.sessionStorage.removeItem(
      getConnectionStorageKey(
        platform
      )
    );

    window.sessionStorage.removeItem(
      getStateStorageKey(
        platform
      )
    );

    window.sessionStorage.removeItem(
      "oauth_started_at"
    );

    window.sessionStorage.removeItem(
      "oauth_organisation_id"
    );
  } catch {
    /*
     * Best effort only.
     */
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function SocialConnections({
  organisationId:
    organisationIdProp = null,
}: SocialConnectionsProps) {
  const organisationId =
    cleanString(
      organisationIdProp
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    userId,
    setUserId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    accounts,
    setAccounts,
  ] =
    useState<
      SocialAccountRow[]
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
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    activePlatform,
    setActivePlatform,
  ] =
    useState<
      PlatformId | null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      const loadUser =
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

            if (
              cancelled
            ) {
              return;
            }

            if (
              authError
            ) {
              console.error(
                "[TOTS SOCIAL CONNECTIONS] Auth user lookup failed:",
                authError
              );

              setError(
                "We couldn't identify the signed-in user."
              );

              setLoading(
                false
              );

              return;
            }

            if (
              !user?.id
            ) {
              setUserId(
                null
              );

              setError(
                "You need to be signed in before connecting a social account."
              );

              setLoading(
                false
              );

              return;
            }

            setUserId(
              user.id
            );
          } catch (
            userError:
              unknown
          ) {
            console.error(
              "[TOTS SOCIAL CONNECTIONS] User loading failed:",
              userError
            );

            if (
              !cancelled
            ) {
              setError(
                userError instanceof
                  Error
                  ? userError.message
                  : "The signed-in user could not be loaded."
              );

              setLoading(
                false
              );
            }
          }
        };

      void loadUser();

      return () => {
        cancelled =
          true;
      };
    },
    []
  );

  // ==========================================================
  // RESET WHEN ORGANISATION CHANGES
  // ==========================================================

  useEffect(
    () => {
      setAccounts(
        []
      );

      setError(
        null
      );
    },
    [
      organisationId,
    ]
  );

  // ==========================================================
  // LOAD CONNECTIONS
  // ==========================================================

  const loadConnections =
    useCallback(
      async (
        quiet =
          false
      ) => {
        if (
          !userId
        ) {
          return;
        }

        if (
          !organisationId
        ) {
          setAccounts(
            []
          );

          setLoading(
            false
          );

          setRefreshing(
            false
          );

          return;
        }

        if (
          quiet
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setError(
          null
        );

        try {
          const {
            data,

            error:
              loadError,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .select(
                `
                  id,
                  user_id,
                  platform,
                  platform_user_id,
                  access_token,
                  refresh_token,
                  expires_at,
                  page_id,
                  page_name,
                  page_access_token,
                  instagram_business_account_id,
                  organisation_id,
                  avatar_url,
                  display_name,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "user_id",
                userId
              )
              .eq(
                "organisation_id",
                organisationId
              )
              .order(
                "updated_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            loadError
          ) {
            throw loadError;
          }

          const cleaned =
            (
              data ||
              []
            ).map(
              (
                account
              ) => ({
                ...account,

                platform:
                  normalisePlatform(
                    account.platform
                  ),
              })
            ) as SocialAccountRow[];

          setAccounts(
            cleaned
          );

          console.log(
            "[TOTS SOCIAL CONNECTIONS] Loaded organisation accounts:",
            {
              organisationId,

              count:
                cleaned.length,
            }
          );
        } catch (
          loadError:
            unknown
        ) {
          console.error(
            "[TOTS SOCIAL CONNECTIONS] Loading failed:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Your social connections could not be loaded."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        userId,
        organisationId,
      ]
    );

  // ==========================================================
  // INITIAL CONNECTION LOAD
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId
      ) {
        return;
      }

      void loadConnections();
    },
    [
      userId,
      organisationId,
      loadConnections,
    ]
  );

  // ==========================================================
  // CALLBACK RETURN REFRESH
  // ==========================================================

  useEffect(
    () => {
      if (
        typeof window ===
          "undefined" ||
        !userId ||
        !organisationId
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

      if (
        oauth ===
          "meta_success" ||
        oauth ===
          "linkedin_success" ||
        oauth ===
          "tiktok_success" ||
        connected ===
          "meta" ||
        connected ===
          "linkedin" ||
        connected ===
          "tiktok"
      ) {
        void loadConnections(
          true
        );
      }
    },
    [
      userId,
      organisationId,
      loadConnections,
    ]
  );

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId ||
        !organisationId
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `social-connections-${userId}-${organisationId}`
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
                `organisation_id=eq.${organisationId}`,
            },
            (
              payload
            ) => {
              console.log(
                "[TOTS SOCIAL CONNECTIONS] Realtime organisation update:",
                payload
              );

              void loadConnections(
                true
              );
            }
          )
          .subscribe();

      return () => {
        void supabase.removeChannel(
          channel
        );
      };
    },
    [
      userId,
      organisationId,
      loadConnections,
    ]
  );

  // ==========================================================
  // REFRESH ON FOCUS
  // ==========================================================

  useEffect(
    () => {
      if (
        typeof window ===
          "undefined" ||
        !userId ||
        !organisationId
      ) {
        return;
      }

      const handleFocus =
        () => {
          void loadConnections(
            true
          );
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    [
      userId,
      organisationId,
      loadConnections,
    ]
  );

  // ==========================================================
  // ACCOUNT MAP
  // ==========================================================

  const accountMap =
    useMemo(
      () => {
        const map:
          Partial<
            Record<
              PlatformId,
              SocialAccountRow
            >
          > = {};

        for (
          const account of
          accounts
        ) {
          const platform =
            normalisePlatform(
              account.platform
            );

          if (
            platform ===
              "meta" ||
            platform ===
              "linkedin" ||
            platform ===
              "tiktok"
          ) {
            if (
              !map[
                platform
              ]
            ) {
              map[
                platform
              ] =
                account;
            }
          }
        }

        return map;
      },
      [
        accounts,
      ]
    );

  // ==========================================================
  // IS CONNECTED
  // ==========================================================

  function isConnected(
    platform:
      PlatformId
  ) {
    const account =
      accountMap[
        platform
      ];

    if (
      !account ||
      !account.access_token
    ) {
      return false;
    }

    if (
      account.expires_at
    ) {
      const expiry =
        new Date(
          account.expires_at
        ).getTime();

      if (
        !Number.isNaN(
          expiry
        ) &&
        expiry <=
          Date.now()
      ) {
        return false;
      }
    }

    return true;
  }

  // ==========================================================
  // CONNECT
  // ==========================================================

  async function connect(
    platform:
      PlatformId
  ) {
    if (
      activePlatform
    ) {
      return;
    }

    setError(
      null
    );

    if (
      !organisationId
    ) {
      setError(
        "No active organisation is selected. Select your workspace before connecting a social account."
      );

      return;
    }

    let authenticatedUserId =
      userId;

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
        throw authError;
      }

      authenticatedUserId =
        user?.id ||
        null;
    } catch (
      authError
    ) {
      console.error(
        "[TOTS SOCIAL CONNECTIONS] OAuth auth verification failed:",
        authError
      );
    }

    if (
      !authenticatedUserId
    ) {
      setError(
        "Your login session could not be verified. Please refresh the page and sign in again."
      );

      return;
    }

    setUserId(
      authenticatedUserId
    );

    setActivePlatform(
      platform
    );

    try {
      const {
        raw:
          rawState,

        encoded:
          encodedState,
      } =
        createOAuthState(
          authenticatedUserId,
          organisationId,
          platform
        );

      if (
        typeof window !==
        "undefined"
      ) {
        try {
          window.sessionStorage.setItem(
            getConnectionStorageKey(
              platform,
              organisationId
            ),
            "true"
          );

          window.sessionStorage.setItem(
            getStateStorageKey(
              platform,
              organisationId
            ),
            rawState
          );

          window.sessionStorage.setItem(
            getConnectionStorageKey(
              platform
            ),
            "true"
          );

          window.sessionStorage.setItem(
            getStateStorageKey(
              platform
            ),
            rawState
          );

          window.sessionStorage.setItem(
            "oauth_started_at",
            String(
              Date.now()
            )
          );

          window.sessionStorage.setItem(
            "oauth_organisation_id",
            organisationId
          );
        } catch (
          storageError
        ) {
          console.warn(
            "[TOTS SOCIAL CONNECTIONS] Could not save OAuth state:",
            storageError
          );
        }
      }

      const path =
        getConnectPath(
          platform
        );

      const connectUrl =
        new URL(
          path,
          window.location.origin
        );

      connectUrl.searchParams.set(
        "userId",
        authenticatedUserId
      );

      connectUrl.searchParams.set(
        "organisationId",
        organisationId
      );

      connectUrl.searchParams.set(
        "platform",
        platform
      );

      connectUrl.searchParams.set(
        "state",
        encodedState
      );

      console.log(
        "[TOTS SOCIAL CONNECTIONS] Starting OAuth:",
        {
          platform,

          userId:
            authenticatedUserId,

          organisationId,

          path,

          hasState:
            true,
        }
      );

      window.location.assign(
        connectUrl.toString()
      );
    } catch (
      connectError:
        unknown
    ) {
      console.error(
        `[TOTS SOCIAL CONNECTIONS] ${platform} connect failed:`,
        connectError
      );

      clearOAuthStorage(
        platform,
        organisationId
      );

      setError(
        connectError instanceof
          Error
          ? connectError.message
          : `Unable to connect ${platformLabel(
              platform
            )}.`
      );

      setActivePlatform(
        null
      );
    }
  }

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  async function disconnect(
    platform:
      PlatformId
  ) {
    if (
      !userId ||
      !organisationId ||
      activePlatform
    ) {
      return;
    }

    const account =
      accountMap[
        platform
      ];

    if (
      !account
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Disconnect ${platformLabel(
          platform
        )}? TOTS-OS will no longer be able to use this account for publishing.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setError(
      null
    );

    setActivePlatform(
      platform
    );

    try {
      const {
        data:
          deletedRows,

        error:
          deleteError,
      } =
        await supabase
          .from(
            "social_accounts"
          )
          .delete()
          .eq(
            "id",
            account.id
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select(
            "id"
          );

      if (
        deleteError
      ) {
        throw deleteError;
      }

      if (
        !deletedRows ||
        deletedRows.length ===
          0
      ) {
        throw new Error(
          "The social connection could not be removed. Check the social_accounts DELETE policy."
        );
      }

      clearOAuthStorage(
        platform,
        organisationId
      );

      await loadConnections(
        true
      );
    } catch (
      disconnectError:
        unknown
    ) {
      console.error(
        `[TOTS SOCIAL CONNECTIONS] ${platform} disconnect failed:`,
        disconnectError
      );

      setError(
        disconnectError instanceof
          Error
          ? disconnectError.message
          : `Unable to disconnect ${platformLabel(
              platform
            )}.`
      );
    } finally {
      setActivePlatform(
        null
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] bg-stone-50">
        <div className="text-center">
          <Loader2
            size={22}
            className="mx-auto animate-spin text-[#829473]"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
            Loading connections
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <TriangleAlert
            size={17}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="text-xs leading-5 text-red-600">
            {
              error
            }
          </p>
        </div>
      )}

      {!organisationId && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert
            size={17}
            className="mt-0.5 shrink-0 text-amber-500"
          />

          <div>
            <p className="text-xs font-semibold text-amber-800">
              No active organisation
            </p>

            <p className="mt-1 text-[10px] leading-5 text-amber-700">
              TOTS-OS needs to know which workspace you are currently
              using before social accounts can be connected.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-[9px] text-stone-400">
          {accounts.length ===
          0
            ? "No accounts connected yet."
            : `${accounts.length} connected account${
                accounts.length ===
                1
                  ? ""
                  : "s"
              } found.`}
        </p>

        <button
          type="button"
          disabled={
            refreshing ||
            !organisationId
          }
          onClick={() =>
            void loadConnections(
              true
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-[0.13em] text-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {platforms.map(
          (
            platform
          ) => {
            const account =
              accountMap[
                platform.id
              ];

            const connected =
              isConnected(
                platform.id
              );

            const buttonLoading =
              activePlatform ===
              platform.id;

            const expired =
              Boolean(
                account &&
                !connected
              );

            return (
              <div
                key={
                  platform.id
                }
                className="rounded-[1.5rem] border border-stone-200 bg-white p-5 transition hover:border-stone-300 sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
                      {platform.id ===
                      "meta" ? (
                        <Facebook
                          size={20}
                        />
                      ) : platform.id ===
                        "linkedin" ? (
                        <Linkedin
                          size={20}
                        />
                      ) : (
                        <span className="text-xs font-black">
                          TT
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-stone-800">
                          {
                            platform.name
                          }
                        </h3>

                        {connected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-emerald-700">
                            <CheckCircle2
                              size={9}
                            />

                            Connected
                          </span>
                        )}

                        {expired && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-amber-700">
                            Reconnect required
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        {
                          platform.description
                        }
                      </p>

                      {account && (
                        <div className="mt-3 space-y-1">
                          {account.display_name && (
                            <p className="truncate text-[10px] font-semibold text-stone-600">
                              {
                                account.display_name
                              }
                            </p>
                          )}

                          {account.page_name && (
                            <p className="truncate text-[10px] text-stone-400">
                              Facebook Page:{" "}
                              <strong className="font-semibold text-stone-600">
                                {
                                  account.page_name
                                }
                              </strong>
                            </p>
                          )}

                          {platform.id ===
                            "meta" &&
                            account.instagram_business_account_id && (
                              <p className="inline-flex items-center gap-1.5 text-[10px] text-stone-400">
                                <Instagram
                                  size={11}
                                />

                                Instagram Business connected
                              </p>
                            )}

                          {platform.id ===
                            "meta" &&
                            connected &&
                            !account.page_id && (
                              <p className="text-[10px] leading-4 text-amber-600">
                                Meta login is connected, but no Facebook Page was returned.
                              </p>
                            )}

                          {platform.id ===
                            "meta" &&
                            connected &&
                            account.page_id &&
                            !account.page_access_token && (
                              <p className="text-[10px] leading-4 text-amber-600">
                                Facebook Page found, but publishing access is unavailable. Reconnecting Meta may be required.
                              </p>
                            )}

                          {platform.id ===
                            "tiktok" &&
                            connected &&
                            !account.display_name && (
                              <p className="text-[10px] leading-4 text-emerald-600">
                                TikTok account connected successfully.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    {connected ? (
                      <button
                        type="button"
                        disabled={
                          buttonLoading
                        }
                        onClick={() =>
                          void disconnect(
                            platform.id
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.13em] text-stone-500 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {buttonLoading ? (
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                        ) : (
                          <LogOut
                            size={12}
                          />
                        )}

                        {buttonLoading
                          ? "Disconnecting"
                          : "Disconnect"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          !userId ||
                          !organisationId ||
                          buttonLoading
                        }
                        onClick={() =>
                          void connect(
                            platform.id
                          )
                        }
                        className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-[#A3B18A] px-4 py-3 text-[8px] font-black uppercase tracking-[0.13em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {buttonLoading ? (
                          <>
                            <Loader2
                              size={12}
                              className="animate-spin"
                            />

                            Connecting
                          </>
                        ) : (
                          <>
                            {expired
                              ? `Reconnect ${platform.name}`
                              : `Connect ${platform.name}`}

                            <ExternalLink
                              size={11}
                            />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {accountMap.meta &&
        isConnected(
          "meta"
        ) && (
          <div className="rounded-[1.5rem] border border-[#dce4d2] bg-[#f5f7f2] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-[#829473]"
              />

              <div>
                <p className="text-xs font-semibold text-stone-700">
                  Meta is connected to this workspace.
                </p>

                <p className="mt-1 text-[10px] leading-5 text-stone-500">
                  {accountMap.meta.page_name
                    ? `Facebook Page: ${accountMap.meta.page_name}.`
                    : "Facebook authentication has completed."}

                  {" "}

                  {accountMap.meta
                    .instagram_business_account_id
                    ? "An Instagram Business account is also linked."
                    : "No Instagram Business account was returned for this Page."}
                </p>
              </div>
            </div>
          </div>
        )}

      {accountMap.tiktok &&
        isConnected(
          "tiktok"
        ) && (
          <div className="rounded-[1.5rem] border border-[#dce4d2] bg-[#f5f7f2] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-[#829473]"
              />

              <div>
                <p className="text-xs font-semibold text-stone-700">
                  TikTok is connected to this workspace.
                </p>

                <p className="mt-1 text-[10px] leading-5 text-stone-500">
                  {accountMap.tiktok.display_name
                    ? `${accountMap.tiktok.display_name} is ready for TikTok publishing through TOTS-OS.`
                    : "TikTok authentication has completed and this account is ready for publishing through TOTS-OS."}
                </p>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}