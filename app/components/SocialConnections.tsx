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
  id: string;

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

// ============================================================
// HELPERS
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

  return platform;
}

// ============================================================

function getConnectionStorageKey(
  platform:
    PlatformId
) {
  if (
    platform ===
    "meta"
  ) {
    return "oauth_pending_meta";
  }

  return `oauth_pending_${platform}`;
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

function getConnectUrl(
  platform:
    PlatformId
) {
  /*
   * These should match your OAuth start routes.
   *
   * If one of your project routes uses a different pathname,
   * only change it here.
   */

  if (
    platform ===
    "meta"
  ) {
    return "/api/oauth/meta";
  }

  if (
    platform ===
    "linkedin"
  ) {
    return "/api/oauth/linkedin";
  }

  return "/api/oauth/tiktok";
}

// ============================================================
// COMPONENT
// ============================================================

export default function SocialConnections() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [
    userId,
    setUserId,
  ] =
    useState<
      string | null
    >(null);

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
    >(null);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      const loadUser =
        async () => {
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

          setUserId(
            user?.id ||
              null
          );

          if (
            !user
          ) {
            setLoading(
              false
            );
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
            "[TOTS SOCIAL CONNECTIONS] Loaded:",
            cleaned
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
      loadConnections,
    ]
  );

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `social-connections-${userId}`
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
            () => {
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
            /*
             * Prefer the first row because the query is already
             * ordered newest -> oldest.
             */

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
      !account
    ) {
      return false;
    }

    if (
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
      !userId ||
      activePlatform
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
      if (
        typeof window !==
        "undefined"
      ) {
        try {
          window.sessionStorage.setItem(
            getConnectionStorageKey(
              platform
            ),
            "true"
          );

          window.sessionStorage.setItem(
            "oauth_started_at",
            String(
              Date.now()
            )
          );
        } catch {
          /*
           * Storage is useful, but not required.
           */
        }
      }

      /*
       * OAuth cannot complete in this function because the
       * browser leaves this page and returns after Meta/
       * LinkedIn/TikTok has authenticated.
       */

      window.location.assign(
        getConnectUrl(
          platform
        )
      );
    } catch (
      connectError:
        unknown
    ) {
      console.error(
        `[TOTS SOCIAL CONNECTIONS] ${platform} connect failed:`,
        connectError
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
      /*
       * Delete by ID rather than platform so this remains safe
       * even if older duplicate social_accounts rows exist.
       */

      const {
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
          );

      if (
        deleteError
      ) {
        throw deleteError;
      }

      try {
        window.sessionStorage.removeItem(
          getConnectionStorageKey(
            platform
          )
        );
      } catch {
        /*
         * Best effort.
         */
      }

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
            size={
              22
            }
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

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <TriangleAlert
            size={
              17
            }
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="text-xs leading-5 text-red-600">
            {
              error
            }
          </p>
        </div>
      )}

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

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
            refreshing
          }
          onClick={() =>
            void loadConnections(
              true
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-[0.13em] text-stone-500 disabled:opacity-50"
        >
          <RefreshCw
            size={
              12
            }
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* =====================================================
          PLATFORM CARDS
      ===================================================== */}

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

                  {/* =========================================
                      INFO
                  ========================================= */}

                  <div className="flex min-w-0 items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
                      {platform.id ===
                      "meta" ? (
                        <Facebook
                          size={
                            20
                          }
                        />
                      ) : platform.id ===
                        "linkedin" ? (
                        <Linkedin
                          size={
                            20
                          }
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
                              size={
                                9
                              }
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

                      {/* =====================================
                          CONNECTED ACCOUNT DETAILS
                      ===================================== */}

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
                                  size={
                                    11
                                  }
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
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =========================================
                      ACTIONS
                  ========================================= */}

                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">

                    {connected ? (
                      <>
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
                              size={
                                12
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <LogOut
                              size={
                                12
                              }
                            />
                          )}

                          {buttonLoading
                            ? "Disconnecting"
                            : "Disconnect"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          !userId ||
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
                              size={
                                12
                              }
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
                              size={
                                11
                              }
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

      {/* =====================================================
          META DETAIL
      ===================================================== */}

      {accountMap.meta &&
        isConnected(
          "meta"
        ) && (
          <div className="rounded-[1.5rem] border border-[#dce4d2] bg-[#f5f7f2] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={
                  16
                }
                className="mt-0.5 shrink-0 text-[#829473]"
              />

              <div>
                <p className="text-xs font-semibold text-stone-700">
                  Meta is connected to TOTS-OS.
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
    </section>
  );
}