"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Info,
  Loader2,
  Package,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useNotifications,
  type Notification,
} from "@/app/hooks/useNotifications";

// ============================================================
// NOTIFICATION BELL
// ============================================================

export default function NotificationBell() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // ==========================================================
  // CLOSE WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================================
  // CLOSE WITH ESCAPE
  // ==========================================================

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ==========================================================
  // REFRESH WHEN OPENED
  // ==========================================================

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [
    open,
    refresh,
  ]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      {/* ======================================================
          BELL BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-label="Notifications"
        aria-expanded={open}
        className="
          relative
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          border
          border-stone-200
          bg-white/95
          text-stone-700
          shadow-sm
          backdrop-blur-xl
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:border-stone-300
          hover:bg-white
          hover:shadow-md
          active:translate-y-0
          active:scale-95
        "
      >
        <Bell
          size={19}
          strokeWidth={1.8}
        />

        {/* ====================================================
            UNREAD BADGE
        ==================================================== */}

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-h-[18px]
              min-w-[18px]
              items-center
              justify-center
              rounded-full
              bg-stone-900
              px-1
              text-[9px]
              font-black
              leading-none
              text-white
              shadow-sm
              ring-2
              ring-[#fcfaf7]
            "
          >
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* ======================================================
          NOTIFICATION PANEL
      ====================================================== */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
              ease: "easeOut",
            }}
            className="
              absolute
              right-0
              top-full
              z-[300]
              mt-3
              w-[min(390px,calc(100vw-2rem))]
              overflow-hidden
              rounded-[1.75rem]
              border
              border-stone-200
              bg-white
              shadow-[0_24px_70px_rgba(28,25,23,0.18)]
            "
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-stone-100
                px-5
                py-4
              "
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-tight text-stone-900">
                    Notifications
                  </h2>

                  {unreadCount >
                    0 && (
                    <span
                      className="
                        rounded-full
                        bg-stone-100
                        px-2
                        py-0.5
                        text-[9px]
                        font-black
                        uppercase
                        tracking-wider
                        text-stone-600
                      "
                    >
                      {
                        unreadCount
                      }{" "}
                      new
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                  Updates from
                  across your
                  business.
                </p>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      markAllAsRead()
                    }
                    title="Mark all as read"
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      text-stone-400
                      transition-colors
                      hover:bg-stone-100
                      hover:text-stone-800
                    "
                  >
                    <CheckCheck
                      size={
                        16
                      }
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setOpen(
                      false
                    )
                  }
                  aria-label="Close notifications"
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    text-stone-400
                    transition-colors
                    hover:bg-stone-100
                    hover:text-stone-800
                  "
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>
            </div>

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading &&
            notifications.length ===
              0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <Loader2
                  size={22}
                  className="mb-3 animate-spin text-stone-400"
                />

                <p className="text-xs font-bold text-stone-700">
                  Loading
                  notifications...
                </p>
              </div>
            ) : error ? (
              /* =================================================
                 ERROR
              ================================================= */

              <div className="p-5">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-black text-red-700">
                        Notifications
                        unavailable
                      </p>

                      <p className="mt-1 break-words text-[11px] leading-relaxed text-red-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          refresh()
                        }
                        className="mt-3 text-[10px] font-black uppercase tracking-wider text-red-700"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : notifications.length ===
              0 ? (
              /* =================================================
                 EMPTY
              ================================================= */

              <div className="flex min-h-[240px] flex-col items-center justify-center px-8 text-center">
                <div
                  className="
                    mb-4
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-stone-100
                    text-stone-400
                  "
                >
                  <Bell
                    size={
                      20
                    }
                  />
                </div>

                <p className="text-sm font-black text-stone-800">
                  You&apos;re
                  all caught up
                </p>

                <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-stone-400">
                  Important
                  updates,
                  reminders and
                  business
                  activity will
                  appear here.
                </p>
              </div>
            ) : (
              /* =================================================
                 NOTIFICATION LIST
              ================================================= */

              <div
                className="
                  max-h-[min(520px,70vh)]
                  overflow-y-auto
                  overscroll-contain
                "
              >
                {notifications.map(
                  (
                    notification
                  ) => (
                    <NotificationRow
                      key={
                        notification.id
                      }
                      notification={
                        notification
                      }
                      onRead={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      onDelete={() =>
                        deleteNotification(
                          notification.id
                        )
                      }
                      onClose={() =>
                        setOpen(
                          false
                        )
                      }
                    />
                  )
                )}
              </div>
            )}

            {/* ==================================================
                FOOTER
            ================================================== */}

            {!loading &&
              !error &&
              notifications.length >
                0 && (
                <div
                  className="
                    border-t
                    border-stone-100
                    bg-stone-50/70
                    px-5
                    py-3
                    text-center
                  "
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400">
                    TOTS-OS
                    Business
                    Notifications
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
// NOTIFICATION ROW
// ============================================================

function NotificationRow({
  notification,
  onRead,
  onDelete,
  onClose,
}: {
  notification: Notification;

  onRead: () => void;

  onDelete: () => void;

  onClose: () => void;
}) {
  const isRead =
    Boolean(
      notification.read
    );

  const link =
    notification.link ||
    getDefaultLink(
      notification
    );

  const content = (
    <div
      className={`
        group
        relative
        flex
        gap-3
        border-b
        border-stone-100
        px-5
        py-4
        transition-colors

        ${
          isRead
            ? "bg-white hover:bg-stone-50"
            : "bg-[#fcfaf7] hover:bg-[#faf7f2]"
        }
      `}
    >
      {/* ======================================================
          ICON
      ====================================================== */}

      <div
        className={`
          mt-0.5
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl

          ${
            getNotificationStyle(
              notification
            )
          }
        `}
      >
        <NotificationIcon
          notification={
            notification
          }
        />
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`
                  truncate
                  text-[12px]
                  leading-tight
                  text-stone-900

                  ${
                    isRead
                      ? "font-bold"
                      : "font-black"
                  }
                `}
              >
                {
                  notification.title
                }
              </p>

              {!isRead && (
                <span
                  className="
                    h-1.5
                    w-1.5
                    shrink-0
                    rounded-full
                    bg-stone-900
                  "
                />
              )}
            </div>

            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
              {
                notification.message
              }
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-stone-300">
              {formatNotificationTime(
                notification.created_at
              )}
            </p>
          </div>

          {link && (
            <ChevronRight
              size={
                15
              }
              className="
                mt-1
                shrink-0
                text-stone-300
                transition-transform
                group-hover:translate-x-0.5
                group-hover:text-stone-500
              "
            />
          )}
        </div>
      </div>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div
        className="
          absolute
          bottom-2
          right-3
          flex
          items-center
          gap-1
          opacity-0
          transition-opacity
          group-hover:opacity-100
        "
      >
        {!isRead && (
          <button
            type="button"
            title="Mark as read"
            onClick={(
              event
            ) => {
              event.preventDefault();
              event.stopPropagation();

              onRead();
            }}
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              bg-white
              text-stone-400
              shadow-sm
              transition-colors
              hover:text-stone-900
            "
          >
            <Check
              size={
                13
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
            event.preventDefault();
            event.stopPropagation();

            onDelete();
          }}
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            bg-white
            text-stone-400
            shadow-sm
            transition-colors
            hover:text-red-500
          "
        >
          <Trash2
            size={
              13
            }
          />
        </button>
      </div>
    </div>
  );

  // ==========================================================
  // CLICKABLE NOTIFICATION
  // ==========================================================

  if (link) {
    return (
      <Link
        href={link}
        onClick={() => {
          if (
            !isRead
          ) {
            onRead();
          }

          onClose();
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  // ==========================================================
  // NON CLICKABLE NOTIFICATION
  // ==========================================================

  return (
    <button
      type="button"
      onClick={() => {
        if (
          !isRead
        ) {
          onRead();
        }
      }}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}

// ============================================================
// NOTIFICATION ICON
// ============================================================

function NotificationIcon({
  notification,
}: {
  notification: Notification;
}) {
  const category =
    getNotificationCategory(
      notification
    );

  if (
    category ===
    "shop"
  ) {
    return (
      <Package
        size={16}
        strokeWidth={1.8}
      />
    );
  }

  if (
    category ===
    "invoice"
  ) {
    return (
      <ReceiptText
        size={16}
        strokeWidth={1.8}
      />
    );
  }

  switch (
    notification.type
  ) {
    case "error":
      return (
        <AlertCircle
          size={16}
          strokeWidth={1.8}
        />
      );

    case "warning":
      return (
        <CircleAlert
          size={16}
          strokeWidth={1.8}
        />
      );

    case "success":
      return (
        <Check
          size={16}
          strokeWidth={2}
        />
      );

    default:
      return (
        <Info
          size={16}
          strokeWidth={1.8}
        />
      );
  }
}

// ============================================================
// NOTIFICATION STYLE
// ============================================================

function getNotificationStyle(
  notification: Notification
) {
  const category =
    getNotificationCategory(
      notification
    );

  if (
    category ===
    "shop"
  ) {
    return "bg-violet-50 text-violet-600";
  }

  if (
    category ===
    "invoice"
  ) {
    return "bg-amber-50 text-amber-600";
  }

  switch (
    notification.type
  ) {
    case "success":
      return "bg-emerald-50 text-emerald-600";

    case "error":
      return "bg-red-50 text-red-600";

    case "warning":
      return "bg-amber-50 text-amber-600";

    default:
      return "bg-blue-50 text-blue-600";
  }
}

// ============================================================
// NOTIFICATION CATEGORY
// ============================================================

function getNotificationCategory(
  notification: Notification
) {
  const metadata =
    notification.metadata &&
    typeof notification.metadata ===
      "object"
      ? notification.metadata
      : {};

  const category =
    typeof metadata.category ===
    "string"
      ? metadata.category.toLowerCase()
      : "";

  const source =
    typeof metadata.source ===
    "string"
      ? metadata.source.toLowerCase()
      : "";

  const title =
    (
      notification.title ||
      ""
    ).toLowerCase();

  if (
    category.includes(
      "shop"
    ) ||
    source.includes(
      "shop"
    ) ||
    title.includes(
      "order"
    ) ||
    title.includes(
      "purchase"
    )
  ) {
    return "shop";
  }

  if (
    category.includes(
      "invoice"
    ) ||
    source.includes(
      "invoice"
    ) ||
    title.includes(
      "invoice"
    )
  ) {
    return "invoice";
  }

  return "general";
}

// ============================================================
// DEFAULT LINK
// ============================================================

function getDefaultLink(
  notification: Notification
) {
  const category =
    getNotificationCategory(
      notification
    );

  const metadata =
    notification.metadata &&
    typeof notification.metadata ===
      "object"
      ? notification.metadata
      : {};

  const platform =
    typeof metadata.platform ===
    "string"
      ? metadata.platform.toLowerCase()
      : "";

  if (
    category ===
    "shop"
  ) {
    return "/store";
  }

  if (
    category ===
    "invoice"
  ) {
    return "/payments";
  }

  if (
    platform
  ) {
    return "/social";
  }

  return null;
}

// ============================================================
// TIME FORMATTER
// ============================================================

function formatNotificationTime(
  value:
    string |
    null |
    undefined
) {
  if (
    !value
  ) {
    return "Just now";
  }

  const date =
    new Date(
      value
    );

  const timestamp =
    date.getTime();

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
    60
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

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
    }
  );
}