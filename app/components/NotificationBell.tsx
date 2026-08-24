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
  ] = useState(
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
  //
  // Only really applies to desktop.
  // Mobile uses a full-screen panel.
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
          if (
            window.innerWidth <
            768
          ) {
            return;
          }

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
  // LOCK BODY ON MOBILE WHILE OPEN
  // ==========================================================

  useEffect(
    () => {
      if (
        !open ||
        typeof window ===
          "undefined" ||
        window.innerWidth >=
          768
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      const previousOverscroll =
        document.body.style
          .overscrollBehavior;

      document.body.style.overflow =
        "hidden";

      document.body.style.overscrollBehavior =
        "none";

      return () => {
        document.body.style.overflow =
          previousOverflow;

        document.body.style.overscrollBehavior =
          previousOverscroll;
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
      className="
        relative
        z-[160]
      "
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
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`
          relative

          flex
          h-10
          w-10
          items-center
          justify-center

          rounded-xl

          border

          shadow-sm

          transition-all
          duration-200

          active:scale-95

          ${
            open
              ? "border-stone-300 bg-stone-900 text-white shadow-md"
              : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-900"
          }
        `}
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
            className="
              absolute

              -right-1.5
              -top-1.5

              flex

              min-h-[18px]
              min-w-[18px]

              items-center
              justify-center

              rounded-full

              border-2
              border-stone-50

              bg-red-500

              px-1

              text-[7px]
              font-black
              text-white
            "
          >
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </motion.span>
        )}
      </button>

      {/* ======================================================
          NOTIFICATION PANEL
      ====================================================== */}

      <AnimatePresence>
        {open && (
          <>
            {/* =================================================
                DESKTOP BACKDROP
            ================================================= */}

            <motion.button
              type="button"
              aria-label="Close notifications"
              onClick={() =>
                setOpen(
                  false
                )
              }
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              transition={{
                duration:
                  0.16,
              }}
              className="
                fixed
                inset-0

                z-[900]

                hidden

                cursor-default

                bg-stone-950/10

                backdrop-blur-[1px]

                md:block
              "
            />

            {/* =================================================
                PANEL

                MOBILE:
                - fixed
                - fills entire viewport
                - safe-area aware
                - no rounded corners

                DESKTOP:
                - anchored to bell
                - compact dropdown
            ================================================= */}

            <motion.div
              initial={{
                opacity:
                  0,

                y:
                  14,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,

                y:
                  14,
              }}
              transition={{
                duration:
                  0.2,

                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="
                fixed
                inset-0

                z-[10000]

                flex
                h-[100dvh]
                w-screen
                max-w-none
                flex-col

                overflow-hidden

                bg-[#fcfaf7]

                pt-[env(safe-area-inset-top)]
                pb-[env(safe-area-inset-bottom)]

                md:absolute
                md:inset-auto
                md:right-0
                md:top-[50px]

                md:h-auto
                md:max-h-[min(620px,calc(100vh-90px))]
                md:w-[410px]
                md:max-w-[calc(100vw-2rem)]

                md:rounded-[2rem]

                md:border
                md:border-stone-200

                md:bg-white

                md:pb-0
                md:pt-0

                md:shadow-[0_30px_80px_rgba(28,25,23,0.18)]
              "
            >
              {/* =================================================
                  HEADER
              ================================================= */}

              <div
                className="
                  shrink-0

                  border-b
                  border-stone-100

                  bg-[#fcfaf7]/95

                  px-5
                  pb-4
                  pt-5

                  backdrop-blur-xl

                  md:bg-white
                  md:backdrop-blur-none
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div
                    className="
                      min-w-0
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        font-black
                        uppercase
                        tracking-[0.25em]

                        text-[#829473]
                      "
                    >
                      TOTS-OS
                    </p>

                    <div
                      className="
                        mt-1

                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >
                      <h2
                        className="
                          font-serif

                          text-[28px]
                          italic
                          leading-none

                          text-stone-900

                          md:text-2xl
                        "
                      >
                        Notifications
                      </h2>

                      {unreadCount >
                        0 && (
                        <span
                          className="
                            rounded-full

                            bg-[#edf3e7]

                            px-2.5
                            py-1

                            text-[8px]
                            font-black
                            uppercase
                            tracking-wider

                            text-[#71805f]
                          "
                        >
                          {
                            unreadCount
                          }{" "}
                          unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ===========================================
                      CLOSE
                  =========================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(
                        false
                      )
                    }
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center

                      rounded-[1.15rem]

                      border
                      border-stone-200

                      bg-white

                      text-stone-500

                      shadow-sm

                      transition-all

                      hover:border-stone-300
                      hover:text-stone-900

                      active:scale-95

                      md:h-auto
                      md:w-auto

                      md:rounded-xl
                      md:border-0
                      md:bg-transparent
                      md:p-2
                      md:text-stone-300
                      md:shadow-none

                      md:hover:bg-stone-50
                      md:hover:text-stone-700
                    "
                    aria-label="Close notifications"
                  >
                    <X
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <div
                  className="
                    mt-5

                    flex
                    items-center
                    gap-2

                    overflow-x-auto

                    pb-1

                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden

                    md:mt-4
                    md:flex-wrap
                    md:overflow-visible
                    md:pb-0
                  "
                >
                  {unreadCount >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        void markAllAsRead()
                      }
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-1.5

                        rounded-xl

                        bg-stone-100

                        px-3
                        py-2.5

                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.12em]

                        text-stone-500

                        transition

                        hover:bg-stone-200

                        md:py-2
                        md:text-[7px]
                      "
                    >
                      <CheckCheck
                        size={
                          13
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
                    className="
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5

                      rounded-xl

                      border
                      border-stone-200

                      bg-white

                      px-3
                      py-2.5

                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.12em]

                      text-stone-400

                      transition

                      hover:text-stone-700

                      disabled:opacity-50

                      md:py-2
                      md:text-[7px]
                    "
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
                      className="
                        ml-auto
                        shrink-0

                        px-2

                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.12em]

                        text-stone-300

                        transition

                        hover:text-red-400

                        md:text-[7px]
                      "
                    >
                      Clear read
                    </button>
                  )}
                </div>
              </div>

              {/* =================================================
                  CONTENT
              ================================================= */}

              <div
                className="
                  min-h-0
                  flex-1

                  overflow-y-auto
                  overscroll-contain

                  bg-white

                  [-webkit-overflow-scrolling:touch]
                "
              >
                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (
                  <div
                    className="
                      flex
                      min-h-[55vh]
                      flex-col
                      items-center
                      justify-center

                      p-8

                      md:min-h-[260px]
                    "
                  >
                    <Loader2
                      size={
                        22
                      }
                      className="
                        animate-spin

                        text-[#829473]
                      "
                    />

                    <p
                      className="
                        mt-3

                        text-[9px]
                        font-black
                        uppercase
                        tracking-[0.2em]

                        text-stone-300

                        md:text-[8px]
                      "
                    >
                      Loading notifications
                    </p>
                  </div>
                )}

                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading &&
                  error && (
                  <div
                    className="
                      m-4

                      rounded-2xl

                      border
                      border-red-100

                      bg-red-50

                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      <CircleAlert
                        size={
                          16
                        }
                        className="
                          mt-0.5
                          shrink-0

                          text-red-400
                        "
                      />

                      <div>
                        <p
                          className="
                            text-sm
                            font-bold

                            text-red-600

                            md:text-xs
                          "
                        >
                          Notifications unavailable
                        </p>

                        <p
                          className="
                            mt-1

                            text-[11px]
                            leading-5

                            text-red-500

                            md:text-[10px]
                          "
                        >
                          {
                            error
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void refreshNotifications()
                          }
                          className="
                            mt-3

                            text-[9px]
                            font-black
                            uppercase
                            tracking-wider

                            text-red-600

                            md:text-[8px]
                          "
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                  !error &&
                  notifications.length ===
                    0 && (
                    <div
                      className="
                        flex
                        min-h-[60vh]
                        flex-col
                        items-center
                        justify-center

                        px-8
                        py-12

                        text-center

                        md:min-h-[290px]
                      "
                    >
                      <div
                        className="
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center

                          rounded-[1.5rem]

                          bg-[#edf3e7]

                          text-[#829473]

                          md:h-14
                          md:w-14
                          md:rounded-[1.4rem]
                        "
                      >
                        <Bell
                          size={
                            23
                          }
                          strokeWidth={
                            1.6
                          }
                        />
                      </div>

                      <h3
                        className="
                          mt-5

                          font-serif

                          text-[28px]
                          italic

                          text-stone-800

                          md:text-2xl
                        "
                      >
                        All quiet here
                      </h3>

                      <p
                        className="
                          mt-2

                          max-w-[290px]

                          text-[11px]
                          leading-6

                          text-stone-400

                          md:max-w-[250px]
                          md:text-[10px]
                          md:leading-5
                        "
                      >
                        Updates about your business,
                        projects, finance and social posts
                        will appear here.
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
                    <div
                      className="
                        divide-y
                        divide-stone-100
                      "
                    >
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
                  <div
                    className="
                      shrink-0

                      border-t
                      border-stone-100

                      bg-[#fcfaf7]

                      px-5
                      py-3.5

                      md:py-3
                    "
                  >
                    <p
                      className="
                        text-center

                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.16em]

                        text-stone-300

                        md:text-[7px]
                      "
                    >
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
          </>
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
      className={`
        group
        relative

        transition

        ${
          notification.is_read
            ? "bg-white"
            : "bg-[#fcfdfb]"
        }
      `}
    >
      {!notification
        .is_read && (
        <span
          className="
            absolute
            left-0
            top-0

            h-full
            w-[3px]

            bg-[#a9b897]
          "
        />
      )}

      {/* ======================================================
          MAIN NOTIFICATION BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          void onOpen(
            notification
          )
        }
        className="
          flex
          w-full
          items-start

          gap-3.5

          px-4
          py-5
          pr-[76px]

          text-left

          transition

          hover:bg-stone-50/80

          md:gap-3
          md:px-5
          md:py-4
          md:pr-16
        "
      >
        {/* ====================================================
            ICON
        ==================================================== */}

        <div
          className={`
            flex

            h-11
            w-11

            shrink-0

            items-center
            justify-center

            rounded-[0.9rem]

            md:h-10
            md:w-10
            md:rounded-xl

            ${style.wrapper}
            ${style.icon}
          `}
        >
          <Icon
            size={
              17
            }
            strokeWidth={
              1.8
            }
          />
        </div>

        {/* ====================================================
            BODY
        ==================================================== */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              items-start
              gap-2
            "
          >
            <p
              className={`
                flex-1

                text-[13px]
                leading-5

                md:text-[11px]
                md:leading-4

                ${
                  notification
                    .is_read
                    ? "font-semibold text-stone-600"
                    : "font-black text-stone-800"
                }
              `}
            >
              {
                notification.title
              }
            </p>

            {!notification
              .is_read && (
              <span
                className="
                  mt-2

                  h-1.5
                  w-1.5

                  shrink-0

                  rounded-full

                  bg-[#829473]

                  md:mt-1.5
                "
              />
            )}
          </div>

          {notification.message && (
            <p
              className="
                mt-1.5

                line-clamp-3

                text-[11px]
                leading-5

                text-stone-400

                md:mt-1
                md:line-clamp-2
                md:text-[9px]
                md:leading-4
              "
            >
              {
                notification.message
              }
            </p>
          )}

          <div
            className="
              mt-2.5

              flex
              items-center
              gap-2

              md:mt-2
            "
          >
            <span
              className="
                text-[8px]
                font-bold
                uppercase
                tracking-[0.08em]

                text-stone-300

                md:text-[7px]
              "
            >
              {formatRelativeTime(
                notification
                  .created_at
              )}
            </span>

            {notification.link && (
              <>
                <span
                  className="
                    h-1
                    w-1

                    rounded-full

                    bg-stone-200
                  "
                />

                <span
                  className="
                    inline-flex
                    items-center
                    gap-0.5

                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.08em]

                    text-[#829473]

                    md:text-[7px]
                  "
                >
                  Open

                  <ChevronRight
                    size={
                      9
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

      <div
        className="
          absolute

          right-3
          top-4

          flex
          items-center
          gap-1.5

          opacity-100

          transition

          md:top-3
          md:gap-1
          md:opacity-0
          md:group-hover:opacity-100
        "
      >
        {!notification
          .is_read && (
          <button
            type="button"
            title="Mark as read"
            aria-label="Mark notification as read"
            onClick={(
              event
            ) => {
              event.stopPropagation();

              void onMarkRead(
                notification.id
              );
            }}
            className="
              flex

              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              border
              border-stone-100

              bg-white

              text-stone-300

              shadow-sm

              transition

              hover:text-[#71805f]

              active:scale-95

              md:h-auto
              md:w-auto
              md:p-1.5
            "
          >
            <Check
              size={
                12
              }
            />
          </button>
        )}

        <button
          type="button"
          title="Delete notification"
          aria-label="Delete notification"
          onClick={(
            event
          ) => {
            event.stopPropagation();

            void onDelete(
              notification.id
            );
          }}
          className="
            flex

            h-8
            w-8

            items-center
            justify-center

            rounded-lg

            border
            border-stone-100

            bg-white

            text-stone-300

            shadow-sm

            transition

            hover:text-red-400

            active:scale-95

            md:h-auto
            md:w-auto
            md:p-1.5
          "
        >
          <Trash2
            size={
              12
            }
          />
        </button>
      </div>
    </div>
  );
}