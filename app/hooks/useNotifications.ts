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
  | string;

export type TotsNotification = {
  id: string;

  user_id: string;

  organisation_id?:
    string | null;

  title: string;

  message:
    string | null;

  type:
    NotificationType;

  link:
    string | null;

  read:
    boolean;

  metadata?:
    Record<
      string,
      unknown
    > | null;

  created_at:
    string;

  read_at?:
    string | null;
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

function normaliseNotification(
  value:
    Record<
      string,
      unknown
    >
): TotsNotification {
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

    title:
      cleanString(
        value.title
      ) ||
      "Notification",

    message:
      cleanString(
        value.message
      ) ||
      null,

    type:
      cleanString(
        value.type
      ) ||
      "info",

    link:
      cleanString(
        value.link
      ) ||
      null,

    read:
      Boolean(
        value.read
      ),

    metadata:
      (
        value.metadata &&
        typeof value.metadata ===
          "object"
      )
        ? value.metadata as Record<
            string,
            unknown
          >
        : null,

    created_at:
      cleanString(
        value.created_at
      ) ||
      new Date()
        .toISOString(),

    read_at:
      cleanString(
        value.read_at
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

  // ==========================================================
  // DATABASE CLIENT
  //
  // Using an untyped wrapper prevents stale generated Supabase
  // types from incorrectly inferring notification payloads as
  // `never`.
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
              data: {
                user,
              },

              error:
                authError,
            } =
              await supabase
                .auth
                .getUser();

            if (
              cancelled
            ) {
              return;
            }

            if (
              authError
            ) {
              console.error(
                "[TOTS NOTIFICATIONS] User lookup failed:",
                authError
              );

              setError(
                "Notifications could not identify the signed-in user."
              );

              setLoading(
                false
              );

              return;
            }

            setUserId(
              user?.id ??
              null
            );

            if (
              !user
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

      return () => {
        cancelled =
          true;

        mountedRef.current =
          false;
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
                  read,
                  metadata,
                  created_at,
                  read_at
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
          existing?.read
        ) {
          return true;
        }

        // Optimistic UI
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

                      read:
                        true,

                      read_at:
                        new Date()
                          .toISOString(),
                    }
                  : notification
            )
        );

        const now =
          new Date()
            .toISOString();

        const {
          error:
            updateError,
        } =
          await db
            .from(
              "notifications"
            )
            .update({
              read:
                true,

              read_at:
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
          console.error(
            "[TOTS NOTIFICATIONS] Mark as read failed:",
            updateError
          );

          await refreshNotifications(
            true
          );

          return false;
        }

        return true;
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
              !notification.read
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

        // Optimistic UI
        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                notification
              ) => ({
                ...notification,

                read:
                  true,

                read_at:
                  notification.read_at ||
                  now,
              })
            )
        );

        const {
          error:
            updateError,
        } =
          await db
            .from(
              "notifications"
            )
            .update({
              read:
                true,

              read_at:
                now,
            })
            .eq(
              "user_id",
              userId
            )
            .eq(
              "read",
              false
            );

        if (
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

        toast.success(
          "All notifications marked as read"
        );

        return true;
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

        // Optimistic UI
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

        return true;
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
                !notification.read
            )
        );

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
              "read",
              true
            );

        if (
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

        toast.success(
          "Read notifications cleared"
        );

        return true;
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
              const raw =
                payload.new as Record<
                  string,
                  unknown
                >;

              const incoming =
                normaliseNotification(
                  raw
                );

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

              if (
                initialLoadCompleteRef.current
              ) {
                if (
                  incoming.type ===
                  "error"
                ) {
                  toast.error(
                    incoming.title,
                    {
                      description:
                        incoming.message ||
                        undefined,
                    }
                  );
                } else if (
                  incoming.type ===
                  "success"
                ) {
                  toast.success(
                    incoming.title,
                    {
                      description:
                        incoming.message ||
                        undefined,
                    }
                  );
                } else {
                  toast.info(
                    incoming.title,
                    {
                      description:
                        incoming.message ||
                        undefined,
                    }
                  );
                }
              }
            }
          )
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
                  )?.id
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
  // FALLBACK REFRESH
  //
  // Realtime is useful, but the UI should not depend entirely
  // on a WebSocket connection.
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
          60_000
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

      const handleFocus =
        () => {
          void refreshNotifications(
            true
          );
        };

      const handleVisibility =
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void refreshNotifications(
              true
            );
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
            !notification.read
        ).length,
      [
        notifications,
      ]
    );

  const hasUnread =
    unreadCount >
    0;

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    notifications,

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