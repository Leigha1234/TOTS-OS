"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Info,
  Loader2,
  Megaphone,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  useNotifications,
  type TotsNotification,
} from "@/app/hooks/useNotifications";

// ============================================================
// TIME HELPERS
// ============================================================

function formatRelativeTime(
  value: string
) {
  const timestamp =
    new Date(
      value
    ).getTime();

  if (
    Number.isNaN(
      timestamp
    )
  ) {
    return "";
  }

  const difference =
    Date.now() -
    timestamp;

  const seconds =
    Math.floor(
      difference /
      1000
    );

  if (
    seconds <
    30
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds /
      60
    );

  if (
    minutes <
    60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  if (
    hours <
    24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours /
      24
    );

  if (
    days ===
    1
  ) {
    return "Yesterday";
  }

  if (
    days <
    7
  ) {
    return `${days}d ago`;
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",
    }
  );
}

// ============================================================
// TYPE STYLES
// ============================================================

function getNotificationStyle(
  type: string
) {
  switch (
    String(
      type ||
      ""
    ).toLowerCase()
  ) {
    case "success":
      return {
        wrapper:
          "bg-emerald-50",

        icon:
          "text-emerald-600",

        Icon:
          Check,
      };

    case "error":
      return {
        wrapper:
          "bg-red-50",

        icon:
          "text-red-500",

        Icon:
          CircleAlert,
      };

    case "warning":
      return {
        wrapper:
          "bg-amber-50",

        icon:
          "text-amber-600",

        Icon:
          CircleAlert,
      };

    case "social":
      return {
        wrapper:
          "bg-[#edf3e7]",

        icon:
          "text-[#71805f]",

        Icon:
          Megaphone,
      };

    case "finance":
    case "invoice":
      return {
        wrapper:
          "bg-stone-100",

        icon:
          "text-stone-600",

        Icon:
          CircleDollarSign,
      };

    case "calendar":
    case "task":
    case "project":
      return {
        wrapper:
          "bg-blue-50",

        icon:
          "text-blue-500",

        Icon:
          CalendarDays,
      };

    default:
      return {
        wrapper:
          "bg-stone-100",

        icon:
          "text-stone-500",

        Icon:
          Info,
      };
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationBell() {
  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const containerRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    );

  const {
    notifications,

    unreadCount,

    loading,

    refreshing,

    error,

    refreshNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

    clearReadNotifications,
  } =
    useNotifications();

  // ==========================================================
  // CLOSE ON OUTSIDE CLICK
  // ==========================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const handlePointerDown =
        (
          event:
            MouseEvent
        ) => {
          const target =
            event.target as
              Node;

          if (
            containerRef.current &&
            !containerRef.current.contains(
              target
            )
          ) {
            setOpen(
              false
            );
          }
        };

      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handlePointerDown
        );
      };
    },
    [
      open,
    ]
  );

  // ==========================================================
  // ESCAPE
  // ==========================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const handleKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(
              false
            );
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open,
    ]
  );

  // ==========================================================
  // OPEN NOTIFICATION
  // ==========================================================

  const handleNotificationClick =
    async (
      notification:
        TotsNotification
    ) => {
      if (
        !notification
          .is_read
      ) {
        await markAsRead(
          notification.id
        );
      }

      if (
        notification.link
      ) {
        setOpen(
          false
        );

        router.push(
          notification.link
        );
      }
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      ref={
        containerRef
      }
      className="relative z-[160]"
    >
      {/* ======================================================
          BELL
      ====================================================== */}

      <button
        type="button"
        aria-label={
          unreadCount >
          0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 active:scale-95 ${
          open
            ? "border-stone-300 bg-stone-900 text-white shadow-md"
            : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-900"
        }`}
      >
        <Bell
          size={
            17
          }
          strokeWidth={
            1.8
          }
        />

        {/* BADGE */}

        {unreadCount >
          0 && (
          <motion.span
            initial={{
              scale:
                0,
            }}
            animate={{
              scale:
                1,
            }}
            className="absolute -right-1.5 -top-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-stone-50 bg-red-500 px-1 text-[7px] font-black text-white"
          >
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </motion.span>
        )}
      </button>

      {/* ======================================================
          DROPDOWN
      ====================================================== */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity:
                0,

              y:
                -8,

              scale:
                0.98,
            }}
            animate={{
              opacity:
                1,

              y:
                0,

              scale:
                1,
            }}
            exit={{
              opacity:
                0,

              y:
                -8,

              scale:
                0.98,
            }}
            transition={{
              duration:
                0.16,
            }}
            className="
              absolute
              left-0
              top-[50px]
              z-[1000]
              flex
              max-h-[min(620px,calc(100vh-90px))]
              w-[calc(100vw-2rem)]
              max-w-[410px]
              flex-col
              overflow-hidden
              rounded-[2rem]
              border
              border-stone-200
              bg-white
              shadow-[0_30px_80px_rgba(28,25,23,0.18)]

              md:left-auto
              md:right-0
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="border-b border-stone-100 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#829473]">
                    TOTS-OS
                  </p>

                  <div className="mt-1 flex items-baseline gap-2">
                    <h2 className="font-serif text-2xl italic text-stone-900">
                      Notifications
                    </h2>

                    {unreadCount >
                      0 && (
                      <span className="rounded-full bg-[#edf3e7] px-2 py-1 text-[7px] font-black uppercase tracking-wider text-[#71805f]">
                        {
                          unreadCount
                        }{" "}
                        unread
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-stone-300 transition hover:bg-stone-50 hover:text-stone-700"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              {/* TOOLBAR */}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void markAllAsRead()
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-[7px] font-black uppercase tracking-[0.12em] text-stone-500 transition hover:bg-stone-200"
                  >
                    <CheckCheck
                      size={
                        12
                      }
                    />

                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    refreshing
                  }
                  onClick={() =>
                    void refreshNotifications(
                      true
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[7px] font-black uppercase tracking-[0.12em] text-stone-400 transition hover:text-stone-700 disabled:opacity-50"
                >
                  <RefreshCw
                    size={
                      11
                    }
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                {notifications.some(
                  (
                    item
                  ) =>
                    item.is_read
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      void clearReadNotifications()
                    }
                    className="ml-auto text-[7px] font-black uppercase tracking-[0.12em] text-stone-300 transition hover:text-red-400"
                  >
                    Clear read
                  </button>
                )}
              </div>
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* LOADING */}

              {loading && (
                <div className="flex min-h-[260px] flex-col items-center justify-center p-8">
                  <Loader2
                    size={
                      20
                    }
                    className="animate-spin text-[#829473]"
                  />

                  <p className="mt-3 text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">
                    Loading notifications
                  </p>
                </div>
              )}

              {/* ERROR */}

              {!loading &&
                error && (
                <div className="m-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <CircleAlert
                      size={
                        15
                      }
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <div>
                      <p className="text-xs font-bold text-red-600">
                        Notifications unavailable
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-red-500">
                        {
                          error
                        }
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          void refreshNotifications()
                        }
                        className="mt-3 text-[8px] font-black uppercase tracking-wider text-red-600"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPTY */}

              {!loading &&
                !error &&
                notifications.length ===
                  0 && (
                  <div className="flex min-h-[290px] flex-col items-center justify-center px-8 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[#edf3e7] text-[#829473]">
                      <Bell
                        size={
                          21
                        }
                        strokeWidth={
                          1.6
                        }
                      />
                    </div>

                    <h3 className="mt-5 font-serif text-2xl italic text-stone-800">
                      All quiet here
                    </h3>

                    <p className="mt-2 max-w-[250px] text-[10px] leading-5 text-stone-400">
                      Updates about your business, projects, finance and social posts will appear here.
                    </p>
                  </div>
                )}

              {/* =================================================
                  NOTIFICATION LIST
              ================================================= */}

              {!loading &&
                !error &&
                notifications.length >
                  0 && (
                  <div className="divide-y divide-stone-100">
                    {notifications.map(
                      (
                        notification
                      ) => (
                        <NotificationItem
                          key={
                            notification.id
                          }
                          notification={
                            notification
                          }
                          onOpen={
                            handleNotificationClick
                          }
                          onMarkRead={
                            markAsRead
                          }
                          onDelete={
                            deleteNotification
                          }
                        />
                      )
                    )}
                  </div>
                )}
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            {!loading &&
              !error &&
              notifications.length >
                0 && (
                <div className="border-t border-stone-100 bg-[#fcfaf7] px-5 py-3">
                  <p className="text-center text-[7px] font-black uppercase tracking-[0.16em] text-stone-300">
                    {
                      notifications.length
                    }{" "}
                    notification
                    {notifications.length ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// NOTIFICATION ITEM
// ============================================================

function NotificationItem({
  notification,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  notification:
    TotsNotification;

  onOpen: (
    notification:
      TotsNotification
  ) =>
    Promise<void>;

  onMarkRead: (
    id:
      string
  ) =>
    Promise<boolean>;

  onDelete: (
    id:
      string
  ) =>
    Promise<boolean>;
}) {
  const style =
    getNotificationStyle(
      notification.type
    );

  const Icon =
    style.Icon;

  return (
    <div
      className={`group relative transition ${
        notification.is_read
          ? "bg-white"
          : "bg-[#fcfdfb]"
      }`}
    >
      {!notification
        .is_read && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#a9b897]" />
      )}

      <button
        type="button"
        onClick={() =>
          void onOpen(
            notification
          )
        }
        className="flex w-full items-start gap-3 px-5 py-4 pr-16 text-left transition hover:bg-stone-50/80"
      >
        {/* ICON */}

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.wrapper} ${style.icon}`}
        >
          <Icon
            size={
              16
            }
            strokeWidth={
              1.8
            }
          />
        </div>

        {/* BODY */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className={`flex-1 text-[11px] leading-4 ${
                notification
                  .is_read
                  ? "font-semibold text-stone-600"
                  : "font-black text-stone-800"
              }`}
            >
              {
                notification.title
              }
            </p>

            {!notification
              .is_read && (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#829473]" />
            )}
          </div>

          {notification.message && (
            <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-stone-400">
              {
                notification.message
              }
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-stone-300">
              {formatRelativeTime(
                notification
                  .created_at
              )}
            </span>

            {notification.link && (
              <>
                <span className="h-1 w-1 rounded-full bg-stone-200" />

                <span className="inline-flex items-center gap-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-[#829473]">
                  Open

                  <ChevronRight
                    size={
                      8
                    }
                  />
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        {!notification
          .is_read && (
          <button
            type="button"
            title="Mark as read"
            onClick={(
              event
            ) => {
              event.stopPropagation();

              void onMarkRead(
                notification.id
              );
            }}
            className="rounded-lg border border-stone-100 bg-white p-1.5 text-stone-300 shadow-sm transition hover:text-[#71805f]"
          >
            <Check
              size={
                11
              }
            />
          </button>
        )}

        <button
          type="button"
          title="Delete notification"
          onClick={(
            event
          ) => {
            event.stopPropagation();

            void onDelete(
              notification.id
            );
          }}
          className="rounded-lg border border-stone-100 bg-white p-1.5 text-stone-300 shadow-sm transition hover:text-red-400"
        >
          <Trash2
            size={
              11
            }
          />
        </button>
      </div>
    </div>
  );
}