"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

import {
  toast,
} from "sonner";

// ============================================================
// TYPES
// ============================================================

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "social"
  | "finance"
  | "project"
  | "task"
  | "calendar"
  | "system"
  | "order"
  | "invoice"
  | string;

export type TotsNotification = {
  id: string;

  user_id: string;

  organisation_id:
    | string
    | null;

  title: string;

  message:
    | string
    | null;

  type:
    NotificationType;

  link:
    | string
    | null;

  is_read:
    boolean;

  read_at:
    | string
    | null;

  metadata:
    | Record<
        string,
        unknown
      >
    | null;

  created_at:
    string;

  updated_at?:
    | string
    | null;

  entity_type?:
    | string
    | null;

  entity_id?:
    | string
    | null;

  dedupe_key?:
    | string
    | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================

function normaliseBoolean(
  value:
    unknown
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    value ===
      1 ||
    value ===
      "1" ||
    value ===
      "true"
  ) {
    return true;
  }

  return false;
}

// ============================================================
// NORMALISE NOTIFICATION
//
// IMPORTANT:
//
// New system uses:
//
// - is_read
// - read_at
// - link
//
// Older rows may still contain:
//
// - read
// - href
// - content
//
// We support both so legacy notifications cannot crash the UI.
// ============================================================

function normaliseNotification(
  value:
    Record<
      string,
      unknown
    >
): TotsNotification {
  const isRead =
    value.is_read !==
    undefined
      ? normaliseBoolean(
          value.is_read
        )
      : normaliseBoolean(
          value.read
        );

  const title =
    cleanString(
      value.title
    ) ||
    "Notification";

  const message =
    cleanString(
      value.message
    ) ||
    cleanString(
      value.content
    ) ||
    null;

  const link =
    cleanString(
      value.link
    ) ||
    cleanString(
      value.href
    ) ||
    null;

  return {
    id:
      cleanString(
        value.id
      ),

    user_id:
      cleanString(
        value.user_id
      ),

    organisation_id:
      cleanString(
        value.organisation_id
      ) ||
      null,

    title,

    message,

    type:
      cleanString(
        value.type
      ) ||
      "info",

    link,

    is_read:
      isRead,

    read_at:
      cleanString(
        value.read_at
      ) ||
      null,

    metadata:
      value.metadata &&
      typeof value.metadata ===
        "object" &&
      !Array.isArray(
        value.metadata
      )
        ? (
            value.metadata as Record<
              string,
              unknown
            >
          )
        : null,

    created_at:
      cleanString(
        value.created_at
      ) ||
      new Date()
        .toISOString(),

    updated_at:
      cleanString(
        value.updated_at
      ) ||
      null,

    entity_type:
      cleanString(
        value.entity_type
      ) ||
      null,

    entity_id:
      cleanString(
        value.entity_id
      ) ||
      null,

    dedupe_key:
      cleanString(
        value.dedupe_key
      ) ||
      null,
  };
}

// ============================================================
// HOOK
// ============================================================

export function useNotifications() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      TotsNotification[]
    >([]);

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
    userId,
    setUserId,
  ] =
    useState<
      string | null
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

  const mountedRef =
    useRef(
      true
    );

  const initialLoadCompleteRef =
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
  // DATABASE CLIENT
  // ==========================================================

  const db =
    supabase as any;

  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(
    () => {
      mountedRef.current =
        true;

      let cancelled =
        false;

      const loadUser =
        async () => {
          try {
            const {
              data:
                sessionData,

              error:
                sessionError,
            } =
              await supabase
                .auth
                .getSession();

            if (
              cancelled
            ) {
              return;
            }

            if (
              sessionError
            ) {
              console.error(
                "[TOTS NOTIFICATIONS] Session lookup failed:",
                sessionError
              );

              setError(
                "Notifications could not identify your account."
              );

              setLoading(
                false
              );

              return;
            }

            const currentUser =
              sessionData
                ?.session
                ?.user;

            setUserId(
              currentUser
                ?.id ??
              null
            );

            if (
              !currentUser
            ) {
              setNotifications(
                []
              );

              setLoading(
                false
              );
            }
          } catch (
            authError
          ) {
            console.error(
              "[TOTS NOTIFICATIONS] Unexpected auth error:",
              authError
            );

            if (
              mountedRef.current
            ) {
              setError(
                "Notifications are temporarily unavailable."
              );

              setLoading(
                false
              );
            }
          }
        };

      void loadUser();

      // ======================================================
      // AUTH STATE CHANGES
      // ======================================================

      const {
        data:
          authListener,
      } =
        supabase.auth.onAuthStateChange(
          (
            _event,
            session
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            const nextUserId =
              session
                ?.user
                ?.id ??
              null;

            setUserId(
              nextUserId
            );

            if (
              !nextUserId
            ) {
              setNotifications(
                []
              );

              setError(
                null
              );

              setLoading(
                false
              );
            }
          }
        );

      return () => {
        cancelled =
          true;

        mountedRef.current =
          false;

        authListener
          ?.subscription
          ?.unsubscribe();
      };
    },
    []
  );

  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const refreshNotifications =
    useCallback(
      async (
        quiet =
          false
      ) => {
        if (
          !userId
        ) {
          if (
            mountedRef.current
          ) {
            setNotifications(
              []
            );

            setLoading(
              false
            );
          }

          return;
        }

        if (
          refreshInProgressRef.current
        ) {
          return;
        }

        refreshInProgressRef.current =
          true;

        try {
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

          const {
            data,
            error:
              loadError,
          } =
            await db
              .from(
                "notifications"
              )
              .select(
                `
                  id,
                  user_id,
                  organisation_id,
                  title,
                  message,
                  type,
                  link,
                  is_read,
                  read_at,
                  metadata,
                  created_at,
                  updated_at,
                  entity_type,
                  entity_id,
                  dedupe_key
                `
              )
              .eq(
                "user_id",
                userId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(
                100
              );

          if (
            loadError
          ) {
            console.error(
              "[TOTS NOTIFICATIONS] Load failed:",
              loadError
            );

            throw new Error(
              loadError.message ||
              "Notifications could not be loaded."
            );
          }

          const cleaned =
            (
              data ||
              []
            )
              .map(
                (
                  row:
                    Record<
                      string,
                      unknown
                    >
                ) =>
                  normaliseNotification(
                    row
                  )
              )
              .filter(
                (
                  notification:
                    TotsNotification
                ) =>
                  Boolean(
                    notification.id
                  )
              );

          if (
            mountedRef.current
          ) {
            setNotifications(
              cleaned
            );

            initialLoadCompleteRef.current =
              true;
          }
        } catch (
          loadError:
            unknown
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Refresh failed:",
            loadError
          );

          if (
            mountedRef.current
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Notifications could not be loaded."
            );
          }
        } finally {
          refreshInProgressRef.current =
            false;

          if (
            mountedRef.current
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      [
        db,
        userId,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId
      ) {
        return;
      }

      void refreshNotifications();
    },
    [
      userId,
      refreshNotifications,
    ]
  );

  // ==========================================================
  // MARK ONE AS READ
  // ==========================================================

  const markAsRead =
    useCallback(
      async (
        notificationId:
          string
      ) => {
        if (
          !userId ||
          !notificationId
        ) {
          return false;
        }

        const existing =
          notifications.find(
            (
              notification
            ) =>
              notification.id ===
              notificationId
          );

        if (
          existing
            ?.is_read
        ) {
          return true;
        }

        const now =
          new Date()
            .toISOString();

        // ====================================================
        // OPTIMISTIC UPDATE
        // ====================================================

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                notification
              ) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,

                      is_read:
                        true,

                      read_at:
                        now,
                    }
                  : notification
            )
        );

        try {
          const {
            error:
              updateError,
          } =
            await db
              .from(
                "notifications"
              )
              .update({
                is_read:
                  true,

                read_at:
                  now,

                updated_at:
                  now,
              })
              .eq(
                "id",
                notificationId
              )
              .eq(
                "user_id",
                userId
              );

          if (
            updateError
          ) {
            throw updateError;
          }

          return true;
        } catch (
          updateError
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Mark as read failed:",
            updateError
          );

          await refreshNotifications(
            true
          );

          return false;
        }
      },
      [
        db,
        userId,
        notifications,
        refreshNotifications,
      ]
    );

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const markAllAsRead =
    useCallback(
      async () => {
        if (
          !userId
        ) {
          return false;
        }

        const unread =
          notifications.filter(
            (
              notification
            ) =>
              !notification
                .is_read
          );

        if (
          unread.length ===
          0
        ) {
          return true;
        }

        const now =
          new Date()
            .toISOString();

        // ====================================================
        // OPTIMISTIC UPDATE
        // ====================================================

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                notification
              ) => ({
                ...notification,

                is_read:
                  true,

                read_at:
                  notification
                    .read_at ||
                  now,
              })
            )
        );

        try {
          const {
            error:
              updateError,
          } =
            await db
              .from(
                "notifications"
              )
              .update({
                is_read:
                  true,

                read_at:
                  now,

                updated_at:
                  now,
              })
              .eq(
                "user_id",
                userId
              )
              .eq(
                "is_read",
                false
              );

          if (
            updateError
          ) {
            throw updateError;
          }

          toast.success(
            "All notifications marked as read"
          );

          return true;
        } catch (
          updateError
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Mark all as read failed:",
            updateError
          );

          await refreshNotifications(
            true
          );

          toast.error(
            "Notifications could not be marked as read."
          );

          return false;
        }
      },
      [
        db,
        userId,
        notifications,
        refreshNotifications,
      ]
    );

  // ==========================================================
  // DELETE NOTIFICATION
  // ==========================================================

  const deleteNotification =
    useCallback(
      async (
        notificationId:
          string
      ) => {
        if (
          !userId ||
          !notificationId
        ) {
          return false;
        }

        const previous =
          notifications;

        setNotifications(
          (
            current
          ) =>
            current.filter(
              (
                notification
              ) =>
                notification.id !==
                notificationId
            )
        );

        try {
          const {
            error:
              deleteError,
          } =
            await db
              .from(
                "notifications"
              )
              .delete()
              .eq(
                "id",
                notificationId
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

          return true;
        } catch (
          deleteError
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Delete failed:",
            deleteError
          );

          setNotifications(
            previous
          );

          toast.error(
            "Notification could not be removed."
          );

          return false;
        }
      },
      [
        db,
        userId,
        notifications,
      ]
    );

  // ==========================================================
  // CLEAR READ NOTIFICATIONS
  // ==========================================================

  const clearReadNotifications =
    useCallback(
      async () => {
        if (
          !userId
        ) {
          return false;
        }

        const previous =
          notifications;

        setNotifications(
          (
            current
          ) =>
            current.filter(
              (
                notification
              ) =>
                !notification
                  .is_read
            )
        );

        try {
          const {
            error:
              deleteError,
          } =
            await db
              .from(
                "notifications"
              )
              .delete()
              .eq(
                "user_id",
                userId
              )
              .eq(
                "is_read",
                true
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }

          toast.success(
            "Read notifications cleared"
          );

          return true;
        } catch (
          deleteError
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Clear read failed:",
            deleteError
          );

          setNotifications(
            previous
          );

          toast.error(
            "Read notifications could not be cleared."
          );

          return false;
        }
      },
      [
        db,
        userId,
        notifications,
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

      // ======================================================
      // REMOVE OLD CHANNEL
      // ======================================================

      if (
        channelRef.current
      ) {
        void supabase
          .removeChannel(
            channelRef.current
          );

        channelRef.current =
          null;
      }

      const channel =
        supabase
          .channel(
            `notifications-${userId}`
          )

          // ==================================================
          // INSERT
          // ==================================================

          .on(
            "postgres_changes",
            {
              event:
                "INSERT",

              schema:
                "public",

              table:
                "notifications",

              filter:
                `user_id=eq.${userId}`,
            },
            (
              payload
            ) => {
              const incoming =
                normaliseNotification(
                  payload.new as Record<
                    string,
                    unknown
                  >
                );

              if (
                !incoming.id
              ) {
                return;
              }

              setNotifications(
                (
                  current
                ) => {
                  if (
                    current.some(
                      (
                        notification
                      ) =>
                        notification.id ===
                        incoming.id
                    )
                  ) {
                    return current;
                  }

                  return [
                    incoming,
                    ...current,
                  ];
                }
              );

              // ==============================================
              // LIVE TOAST
              // ==============================================

              if (
                initialLoadCompleteRef.current
              ) {
                const options = {
                  description:
                    incoming.message ||
                    undefined,
                };

                if (
                  incoming.type ===
                  "error"
                ) {
                  toast.error(
                    incoming.title,
                    options
                  );

                  return;
                }

                if (
                  incoming.type ===
                  "success"
                ) {
                  toast.success(
                    incoming.title,
                    options
                  );

                  return;
                }

                if (
                  incoming.type ===
                  "warning"
                ) {
                  toast.warning(
                    incoming.title,
                    options
                  );

                  return;
                }

                toast.info(
                  incoming.title,
                  options
                );
              }
            }
          )

          // ==================================================
          // UPDATE
          // ==================================================

          .on(
            "postgres_changes",
            {
              event:
                "UPDATE",

              schema:
                "public",

              table:
                "notifications",

              filter:
                `user_id=eq.${userId}`,
            },
            (
              payload
            ) => {
              const incoming =
                normaliseNotification(
                  payload.new as Record<
                    string,
                    unknown
                  >
                );

              if (
                !incoming.id
              ) {
                return;
              }

              setNotifications(
                (
                  current
                ) =>
                  current.map(
                    (
                      notification
                    ) =>
                      notification.id ===
                        incoming.id
                        ? incoming
                        : notification
                  )
              );
            }
          )

          // ==================================================
          // DELETE
          // ==================================================

          .on(
            "postgres_changes",
            {
              event:
                "DELETE",

              schema:
                "public",

              table:
                "notifications",
            },
            (
              payload
            ) => {
              const deletedId =
                cleanString(
                  (
                    payload.old as
                      Record<
                        string,
                        unknown
                      >
                  )
                    ?.id
                );

              if (
                !deletedId
              ) {
                return;
              }

              setNotifications(
                (
                  current
                ) =>
                  current.filter(
                    (
                      notification
                    ) =>
                      notification.id !==
                      deletedId
                  )
              );
            }
          )

          .subscribe(
            (
              realtimeStatus
            ) => {
              console.log(
                "[TOTS NOTIFICATIONS] Realtime:",
                realtimeStatus
              );
            }
          );

      channelRef.current =
        channel;

      return () => {
        void supabase
          .removeChannel(
            channel
          );

        if (
          channelRef.current ===
          channel
        ) {
          channelRef.current =
            null;
        }
      };
    },
    [
      userId,
    ]
  );

  // ==========================================================
  // FALLBACK POLLING
  //
  // Realtime remains primary.
  // Polling protects against lost websocket connections.
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId
      ) {
        return;
      }

      const interval =
        window.setInterval(
          () => {
            if (
              document.visibilityState ===
              "visible"
            ) {
              void refreshNotifications(
                true
              );
            }
          },

          120_000
        );

      return () => {
        window.clearInterval(
          interval
        );
      };
    },
    [
      userId,
      refreshNotifications,
    ]
  );

  // ==========================================================
  // REFRESH ON FOCUS / VISIBILITY
  // ==========================================================

  useEffect(
    () => {
      if (
        !userId
      ) {
        return;
      }

      let lastRefresh =
        0;

      const triggerRefresh =
        () => {
          const now =
            Date.now();

          // Avoid several Safari/browser events causing the
          // exact same query in quick succession.
          if (
            now -
              lastRefresh <
            5000
          ) {
            return;
          }

          lastRefresh =
            now;

          void refreshNotifications(
            true
          );
        };

      const handleFocus =
        () => {
          triggerRefresh();
        };

      const handleVisibility =
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            triggerRefresh();
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
      refreshNotifications,
    ]
  );

  // ==========================================================
  // COMPUTED VALUES
  // ==========================================================

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification
          ) =>
            !notification
              .is_read
        ).length,
      [
        notifications,
      ]
    );

  const hasUnread =
    unreadCount >
    0;

  const unreadNotifications =
    useMemo(
      () =>
        notifications.filter(
          (
            notification
          ) =>
            !notification
              .is_read
        ),
      [
        notifications,
      ]
    );

  const readNotifications =
    useMemo(
      () =>
        notifications.filter(
          (
            notification
          ) =>
            notification
              .is_read
        ),
      [
        notifications,
      ]
    );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    notifications,

    unreadNotifications,

    readNotifications,

    unreadCount,

    hasUnread,

    loading,

    refreshing,

    error,

    userId,

    refreshNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

    clearReadNotifications,
  };
}

export default useNotifications;