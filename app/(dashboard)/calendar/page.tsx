"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Hash,
  Link,
  Loader2,
  Mail,
  Minus,
  Paperclip,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

/**
 * TOTS OS | CALENDAR
 * Calendar + public booking availability
 */

// ==================================================
// TYPES
// ==================================================

interface CalendarEvent {
  id: string;

  title?: string;
  created_at?: string;

  description?: string;
  location?: string;
  meeting_link?: string;
  guests?: string;
  tags?: string;

  user_id: string;

  startAt?: Date | null;
  endAt?: Date | null;

  repeat?: string;
}

interface AvailabilityWindow {
  start: string;
  end: string;
}

type AvailabilityMap =
  Record<
    string,
    AvailabilityWindow[]
  >;

interface BookingPage {
  id?: string;

  user_id?: string;

  organisation_id?:
    | string
    | null;

  slug: string;

  title: string;

  description: string;

  duration_minutes: number;

  location_type:
    | "video"
    | "phone"
    | "in_person"
    | "custom"
    | "both";

  location_value: string;

  video_provider:
    | "zoom"
    | "teams"
    | "google_meet"
    | "custom"
    | "none";

  video_link: string;

  buffer_before_minutes: number;

  buffer_after_minutes: number;

  min_notice_hours: number;

  max_days_ahead: number;

  timezone: string;

  availability: AvailabilityMap;

  is_active: boolean;
}

type WeekDay = {
  key: string;
  label: string;
  fullLabel: string;
};

// ==================================================
// CONSTANTS
// ==================================================

const TAG_PALETTE = [
  {
    bg: "bg-[#A3B18A]/15",
    text: "text-[#6B705C]",
  },

  {
    bg: "bg-stone-900",
    text: "text-[#A3B18A]",
  },

  {
    bg: "bg-[#D6D6D2]",
    text: "text-stone-800",
  },

  {
    bg: "bg-amber-100",
    text: "text-amber-700",
  },

  {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },

  {
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
];

const WEEK_DAYS: WeekDay[] = [
  {
    key: "mon",
    label: "Mon",
    fullLabel: "Monday",
  },

  {
    key: "tue",
    label: "Tue",
    fullLabel: "Tuesday",
  },

  {
    key: "wed",
    label: "Wed",
    fullLabel: "Wednesday",
  },

  {
    key: "thu",
    label: "Thu",
    fullLabel: "Thursday",
  },

  {
    key: "fri",
    label: "Fri",
    fullLabel: "Friday",
  },

  {
    key: "sat",
    label: "Sat",
    fullLabel: "Saturday",
  },

  {
    key: "sun",
    label: "Sun",
    fullLabel: "Sunday",
  },
];

const DEFAULT_WINDOW:
  AvailabilityWindow = {
  start: "09:00",
  end: "17:00",
};

const DEFAULT_BOOKING_PAGE:
  BookingPage = {
  slug: "",

  title: "Book a meeting",

  description: "",

  duration_minutes: 30,

  location_type: "video",

  location_value: "",

  video_provider:
    "google_meet",

  video_link: "",

  buffer_before_minutes: 0,

  buffer_after_minutes: 0,

  min_notice_hours: 4,

  max_days_ahead: 30,

  timezone:
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone ||
    "Europe/London",

  availability: {
    mon: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],

    tue: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],

    wed: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],

    thu: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],

    fri: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],

    sat: [],

    sun: [],
  },

  is_active: true,
};

// ==================================================
// HELPERS
// ==================================================

const getTagStyle = (
  tag: string
) => {
  const index =
    tag.length %
    TAG_PALETTE.length;

  return TAG_PALETTE[
    index
  ];
};

const slugify = (
  value: string
) =>
  value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );

const dedupeById = (
  items: any[]
) => {
  const map =
    new Map<
      string,
      any
    >();

  for (
    const item of items
  ) {
    if (!item?.id) {
      continue;
    }

    map.set(
      item.id,
      item
    );
  }

  return Array.from(
    map.values()
  );
};

const cloneAvailability =
  (
    availability:
      AvailabilityMap
  ): AvailabilityMap => {
    const clone:
      AvailabilityMap =
      {};

    WEEK_DAYS.forEach(
      (day) => {
        clone[
          day.key
        ] = (
          availability[
            day.key
          ] || []
        ).map(
          (window) => ({
            ...window,
          })
        );
      }
    );

    return clone;
  };

const timeToMinutes = (
  value: string
) => {
  const [
    hour,
    minute,
  ] = value
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return 0;
  }

  return (
    hour * 60 +
    minute
  );
};

// ==================================================
// PAGE
// ==================================================

export default function Calendar() {
  // ==================================================
  // CALENDAR STATE
  // ==================================================

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(
    new Date()
  );

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(
    new Date()
  );

  const [
    events,
    setEvents,
  ] = useState<
    CalendarEvent[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    activeTagFilter,
    setActiveTagFilter,
  ] =
    useState("ALL");

  const [
    activeColorFilter,
    setActiveColorFilter,
  ] =
    useState("ALL");

  const [
    isFilterOpen,
    setIsFilterOpen,
  ] =
    useState(false);

  const [
    isSettingsOpen,
    setIsSettingsOpen,
  ] =
    useState(false);

  // ==================================================
  // EVENT MODAL STATE
  // ==================================================

  const [
    isModalOpen,
    setIsModalOpen,
  ] =
    useState(false);

  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<
    CalendarEvent | null
  >(null);

  const [
    viewMode,
    setViewMode,
  ] = useState<
    | "VIEW"
    | "CREATE"
    | "EDIT"
  >("CREATE");

  // ==================================================
  // EVENT FORM
  // ==================================================

  const [
    formTitle,
    setFormTitle,
  ] =
    useState("");

  const [
    formDate,
    setFormDate,
  ] = useState(
    format(
      new Date(),
      "yyyy-MM-dd"
    )
  );

  const [
    formTime,
    setFormTime,
  ] =
    useState("09:00");

  const [
    formEndDate,
    setFormEndDate,
  ] =
    useState("");

  const [
    formEndTime,
    setFormEndTime,
  ] =
    useState("");

  const [
    formRepeat,
    setFormRepeat,
  ] =
    useState("none");

  const [
    formLocation,
    setFormLocation,
  ] =
    useState("");

  const [
    formLink,
    setFormLink,
  ] =
    useState("");

  const [
    formGuests,
    setFormGuests,
  ] =
    useState("");

  const [
    formInternalTeam,
    setFormInternalTeam,
  ] =
    useState("");

  const [
    formTags,
    setFormTags,
  ] =
    useState("");

  const [
    formTagColor,
    setFormTagColor,
  ] =
    useState(
      "#A3B18A"
    );

  const [
    formDescription,
    setFormDescription,
  ] =
    useState("");

  const [
    attachedFileName,
    setAttachedFileName,
  ] = useState<
    string | null
  >(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<any>(
      null
    );

  const [
    currentProfile,
    setCurrentProfile,
  ] =
    useState<any>(
      null
    );

  const [
    tagColorMap,
    setTagColorMap,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  // ==================================================
  // BOOKING STATE
  // ==================================================

  const [
    bookingPage,
    setBookingPage,
  ] =
    useState<BookingPage>(
      DEFAULT_BOOKING_PAGE
    );

  const [
    bookingPageExists,
    setBookingPageExists,
  ] =
    useState(false);

  const [
    isBookingLoading,
    setIsBookingLoading,
  ] =
    useState(false);

  const [
    isBookingSaving,
    setIsBookingSaving,
  ] =
    useState(false);

  const [
    bookingError,
    setBookingError,
  ] = useState<
    string | null
  >(null);

  const [
    bookingSaved,
    setBookingSaved,
  ] =
    useState(false);

  const [
    copiedLink,
    setCopiedLink,
  ] =
    useState(false);

  const [
    copiedEmbed,
    setCopiedEmbed,
  ] =
    useState(false);

  const [
    siteOrigin,
    setSiteOrigin,
  ] =
    useState("");

  const [
    shareMessage,
    setShareMessage,
  ] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  // ==================================================
  // TAG COLOURS
  // ==================================================

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          "tots-calendar-tag-colors"
        );

      if (raw) {
        const parsed =
          JSON.parse(
            raw
          );

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          setTagColorMap(
            parsed
          );
        }
      }
    } catch (e) {
      console.warn(
        "Failed reading calendar tag colors",
        e
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tots-calendar-tag-colors",
        JSON.stringify(
          tagColorMap
        )
      );
    } catch (e) {
      console.warn(
        "Failed persisting calendar tag colors",
        e
      );
    }
  }, [
    tagColorMap,
  ]);

  useEffect(() => {
    if (
      typeof window !==
      "undefined"
    ) {
      setSiteOrigin(
        window.location.origin
      );
    }
  }, []);

  // ==================================================
  // EVENT HELPERS
  // ==================================================

  const normaliseEvent =
    useCallback(
      (
        e: any
      ): CalendarEvent => {
        const raw =
          e?.start_time ||
          e?.start_at ||
          e?.created_at;

        const rawEnd =
          e?.end_time ||
          e?.end_at;

        return {
          ...e,

          startAt:
            raw &&
            isValid(
              new Date(
                raw
              )
            )
              ? new Date(
                  raw
                )
              : null,

          endAt:
            rawEnd &&
            isValid(
              new Date(
                rawEnd
              )
            )
              ? new Date(
                  rawEnd
                )
              : null,
        };
      },
      []
    );

  const resolveTagStyle =
    useCallback(
      (
        tag: string
      ) => {
        const key =
          String(
            tag || ""
          )
            .trim()
            .toLowerCase();

        const custom =
          tagColorMap[
            key
          ];

        if (
          custom
        ) {
          return {
            bg: "",

            text:
              "text-stone-800",

            customBg:
              custom,
          };
        }

        const fallback =
          getTagStyle(
            tag || ""
          );

        return {
          ...fallback,

          customBg:
            null as
              | string
              | null,
        };
      },
      [
        tagColorMap,
      ]
    );

  // ==================================================
  // CALENDAR SYNC
  // ==================================================

  const syncCalendar =
    useCallback(
      async () => {
        setIsLoading(
          true
        );

        try {
          const {
            data: {
              user,
            },
          } =
            await supabase.auth
              .getUser()
              .catch(
                () => ({
                  data: {
                    user: null,
                  },
                })
              );

          if (!user) {
            setCurrentUser(
              null
            );

            setCurrentProfile(
              null
            );

            setEvents(
              []
            );

            setIsLoading(
              false
            );

            return;
          }

          const {
            data:
              profile,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "organisation_id"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          setCurrentUser(
            user
          );

          setCurrentProfile(
            profile
          );

          const eventsPromise =
            supabase
              .from(
                "events"
              )
              .select("*")
              .eq(
                "user_id",
                user.id
              );

          const tasksOwnedPromise =
            supabase
              .from(
                "tasks"
              )
              .select("*")
              .eq(
                "user_id",
                user.id
              );

          const tasksAssignedPromise =
            supabase
              .from(
                "tasks"
              )
              .select("*")
              .eq(
                "assigned_to",
                user.id
              );

          const notesOwnedPromise =
            supabase
              .from(
                "notes"
              )
              .select("*")
              .eq(
                "user_id",
                user.id
              );

          const notesAssignedPromise =
            supabase
              .from(
                "notes"
              )
              .select("*")
              .eq(
                "assigned_to",
                user.id
              );

          const [
            eventsRes,
            tasksOwnedRes,
            tasksAssignedRes,
            notesOwnedRes,
            notesAssignedRes,
          ] =
            await Promise.all(
              [
                eventsPromise,
                tasksOwnedPromise,
                tasksAssignedPromise,
                notesOwnedPromise,
                notesAssignedPromise,
              ]
            );

          const {
            data:
              eventData,
            error:
              eventsError,
          } =
            eventsRes;

          const {
            data:
              tasksOwned,
          } =
            tasksOwnedRes;

          const {
            data:
              tasksAssigned,
          } =
            tasksAssignedRes;

          const {
            data:
              notesOwned,
            error:
              notesOwnedError,
          } =
            notesOwnedRes;

          const {
            data:
              notesAssigned,
            error:
              notesAssignedError,
          } =
            notesAssignedRes;

          if (
            notesOwnedError
          ) {
            console.warn(
              "Notes owned fetch error:",
              notesOwnedError
            );
          }

          if (
            notesAssignedError
          ) {
            console.warn(
              "Notes assigned fetch error:",
              notesAssignedError
            );
          }

          if (
            eventsError
          ) {
            console.error(
              "SYNC CALENDAR ERROR:",
              eventsError
            );

            setError(
              eventsError.message ||
                "Failed to sync calendar"
            );

            return;
          }

          const taskMap =
            new Map();

          [
            ...(
              tasksOwned ||
              []
            ),
            ...(
              tasksAssigned ||
              []
            ),
          ]
            .filter(
              Boolean
            )
            .forEach(
              (
                task: any
              ) => {
                taskMap.set(
                  task.id,
                  task
                );
              }
            );

          const normalisedTasks =
            Array.from(
              taskMap.values()
            ).map(
              (
                task: any
              ) => {
                const startRaw =
                  task?.due_date ||
                  task?.start_time ||
                  task?.created_at ||
                  null;

                return {
                  ...task,

                  id: `task-${task.id}`,

                  title:
                    task.title ||
                    task.name ||
                    "Task",

                  description:
                    task.description ||
                    task.content ||
                    "",

                  tags:
                    task.tags ||
                    "",

                  user_id:
                    task.user_id ||
                    task.assigned_to ||
                    user.id,

                  startAt:
                    startRaw &&
                    isValid(
                      new Date(
                        startRaw
                      )
                    )
                      ? new Date(
                          startRaw
                        )
                      : null,

                  endAt:
                    null,
                } as CalendarEvent;
              }
            );

          const noteMap =
            new Map();

          [
            ...(
              notesOwned ||
              []
            ),
            ...(
              notesAssigned ||
              []
            ),
          ]
            .filter(
              Boolean
            )
            .forEach(
              (
                note: any
              ) => {
                noteMap.set(
                  note.id,
                  note
                );
              }
            );

          const normalisedNotes =
            Array.from(
              noteMap.values()
            ).map(
              (
                note: any
              ) => {
                const startRaw =
                  note?.due_date ||
                  note?.start_time ||
                  note?.created_at ||
                  null;

                const title =
                  (note.content &&
                    String(
                      note.content
                    ).slice(
                      0,
                      80
                    )) ||
                  note.title ||
                  note.category ||
                  "Note";

                return {
                  ...note,

                  id: `note-${note.id}`,

                  title,

                  description:
                    note.content ||
                    note.description ||
                    "",

                  tags:
                    note.tags ||
                    note.category ||
                    "",

                  user_id:
                    note.user_id ||
                    note.assigned_to ||
                    user.id,

                  startAt:
                    startRaw &&
                    isValid(
                      new Date(
                        startRaw
                      )
                    )
                      ? new Date(
                          startRaw
                        )
                      : null,

                  endAt:
                    null,
                } as CalendarEvent;
              }
            );

          const normalisedEvents =
            (
              eventData ||
              []
            ).map(
              normaliseEvent
            );

          const combined =
            dedupeById([
              ...normalisedEvents,
              ...normalisedTasks,
              ...normalisedNotes,
            ]);

          combined.sort(
            (
              a,
              b
            ) => {
              const aTime =
                a.startAt
                  ?.getTime?.() ??
                0;

              const bTime =
                b.startAt
                  ?.getTime?.() ??
                0;

              return (
                aTime -
                bTime
              );
            }
          );

          setEvents(
            combined
          );
        } catch (
          err: any
        ) {
          console.error(
            "Sync error:",
            err
          );

          setError(
            err?.message ||
              "Could not sync calendar."
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        normaliseEvent,
      ]
    );

  // ==================================================
  // AUTH
  // ==================================================

  useEffect(() => {
    const initialiseAuth =
      async () => {
        const {
          data,
        } =
          await supabase.auth.getSession();

        if (
          data.session
            ?.user
        ) {
          setCurrentUser(
            data.session.user
          );

          void syncCalendar();
        } else {
          setIsLoading(
            false
          );
        }
      };

    void initialiseAuth();

    const {
      data:
        listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (
            session?.user
          ) {
            setCurrentUser(
              session.user
            );
          }
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [
    syncCalendar,
  ]);

  // ==================================================
  // BOOKING PAGE LOAD
  // ==================================================

  const loadBookingPage =
    useCallback(
      async (
        userId: string
      ) => {
        setIsBookingLoading(
          true
        );

        setBookingError(
          null
        );

        try {
          const {
            data,
            error:
              bookingFetchError,
          } =
            await supabase
              .from(
                "booking_pages"
              )
              .select("*")
              .eq(
                "user_id",
                userId
              )
              .maybeSingle();

          if (
            bookingFetchError
          ) {
            console.warn(
              "Booking page fetch error:",
              bookingFetchError
            );
          }

          if (data) {
            const loadedAvailability =
              cloneAvailability(
                data.availability ||
                  DEFAULT_BOOKING_PAGE.availability
              );

            setBookingPage({
              ...DEFAULT_BOOKING_PAGE,

              ...data,

              video_provider:
                data.video_provider ||
                DEFAULT_BOOKING_PAGE.video_provider,

              video_link:
                data.video_link ||
                "",

              availability:
                loadedAvailability,
            });

            setBookingPageExists(
              true
            );
          } else {
            setBookingPage({
              ...DEFAULT_BOOKING_PAGE,

              availability:
                cloneAvailability(
                  DEFAULT_BOOKING_PAGE.availability
                ),

              slug: `book-${userId.slice(
                0,
                8
              )}`,
            });

            setBookingPageExists(
              false
            );
          }
        } catch (
          err
        ) {
          console.error(
            "Booking page load error:",
            err
          );
        } finally {
          setIsBookingLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    const resolveBookingUser =
      async () => {
        if (
          currentUser?.id
        ) {
          void loadBookingPage(
            currentUser.id
          );

          return;
        }

        const {
          data,
        } =
          await supabase.auth.getUser();

        if (
          data.user?.id
        ) {
          setCurrentUser(
            data.user
          );

          void loadBookingPage(
            data.user.id
          );
        }
      };

    void resolveBookingUser();
  }, [
    currentUser?.id,
    loadBookingPage,
  ]);

  // ==================================================
  // CALENDAR COMPUTED
  // ==================================================

  const allTags =
    useMemo(
      () => {
        const tags =
          new Set<string>();

        events.forEach(
          (event) => {
            if (
              event.tags
            ) {
              event.tags
                .split(",")
                .forEach(
                  (
                    tag
                  ) =>
                    tags.add(
                      tag
                        .trim()
                        .toUpperCase()
                    )
                );
            }
          }
        );

        return [
          "ALL",
          ...Array.from(
            tags
          ),
        ];
      },
      [
        events,
      ]
    );

  const allColors =
    useMemo(
      () => {
        const colors =
          new Set<string>();

        events.forEach(
          (event) => {
            const firstTag =
              event.tags
                ?.split(
                  ","
                )?.[0]
                ?.trim()
                ?.toLowerCase();

            if (
              firstTag &&
              tagColorMap[
                firstTag
              ]
            ) {
              colors.add(
                tagColorMap[
                  firstTag
                ].toUpperCase()
              );
            }
          }
        );

        return [
          "ALL",
          ...Array.from(
            colors
          ),
        ];
      },
      [
        events,
        tagColorMap,
      ]
    );

  const daysGrid =
    useMemo(
      () =>
        eachDayOfInterval(
          {
            start:
              startOfWeek(
                startOfMonth(
                  currentMonth
                )
              ),

            end:
              endOfWeek(
                endOfMonth(
                  currentMonth
                )
              ),
          }
        ),
      [
        currentMonth,
      ]
    );

  const getDayEvents =
    useCallback(
      (
        date: Date
      ) => {
        return events.filter(
          (
            event
          ) => {
            const start =
              event.startAt;

            if (
              !(
                start instanceof
                Date
              ) ||
              Number.isNaN(
                start.getTime()
              )
            ) {
              return false;
            }

            const end =
              event.endAt &&
              isValid(
                event.endAt
              )
                ? event.endAt
                : start;

            const dayStart =
              new Date(
                date
              );

            dayStart.setHours(
              0,
              0,
              0,
              0
            );

            const dayEnd =
              new Date(
                date
              );

            dayEnd.setHours(
              23,
              59,
              59,
              999
            );

            const matchesDate =
              start <=
                dayEnd &&
              end >=
                dayStart;

            const matchesTag =
              activeTagFilter ===
                "ALL" ||
              Boolean(
                event.tags &&
                  event.tags
                    .toUpperCase()
                    .includes(
                      activeTagFilter
                    )
              );

            const firstTag =
              event.tags
                ?.split(
                  ","
                )?.[0]
                ?.trim()
                ?.toLowerCase();

            const mappedColor =
              firstTag
                ? tagColorMap[
                    firstTag
                  ] || ""
                : "";

            const matchesColor =
              activeColorFilter ===
                "ALL" ||
              mappedColor.toUpperCase() ===
                activeColorFilter.toUpperCase();

            return (
              matchesDate &&
              matchesTag &&
              matchesColor
            );
          }
        );
      },
      [
        events,
        activeTagFilter,
        activeColorFilter,
        tagColorMap,
      ]
    );

  const eventSpans =
    useMemo(
      () => {
        return events
          .filter(
            (
              event
            ) =>
              event.startAt &&
              isValid(
                event.startAt
              )
          )
          .map(
            (
              event
            ) => {
              const start =
                event.startAt!;

              const end =
                event.endAt &&
                isValid(
                  event.endAt
                )
                  ? event.endAt
                  : start;

              const startIndex =
                daysGrid.findIndex(
                  (
                    day
                  ) =>
                    isSameDay(
                      day,
                      start
                    ) ||
                    day >=
                      start
                );

              const possibleEnds =
                daysGrid
                  .map(
                    (
                      day,
                      index
                    ) => ({
                      day,
                      index,
                    })
                  )
                  .filter(
                    (
                      item
                    ) =>
                      item.day >=
                        start &&
                      item.day <=
                        end
                  );

              const endIndex =
                possibleEnds.length
                  ? possibleEnds[
                      possibleEnds.length -
                        1
                    ].index
                  : startIndex;

              return {
                ...event,

                startIndex,

                endIndex:
                  endIndex ===
                  -1
                    ? startIndex
                    : endIndex,
              };
            }
          )
          .filter(
            (
              event
            ) =>
              event.startIndex !==
              -1
          );
      },
      [
        events,
        daysGrid,
      ]
    );

  // ==================================================
  // EVENT ACTIONS
  // ==================================================

  const handleDayClick =
    (
      day: Date
    ) => {
      setSelectedDay(
        day
      );

      setFormDate(
        format(
          day,
          "yyyy-MM-dd"
        )
      );

      setFormTitle(
        ""
      );

      setFormDescription(
        ""
      );

      setFormTags(
        ""
      );

      setFormLocation(
        ""
      );

      setFormLink(
        ""
      );

      setFormGuests(
        ""
      );

      setFormInternalTeam(
        ""
      );

      setAttachedFileName(
        null
      );

      setViewMode(
        "CREATE"
      );

      setFormEndDate(
        ""
      );

      setFormEndTime(
        ""
      );

      setFormRepeat(
        "none"
      );

      setFormTagColor(
        "#A3B18A"
      );

      setIsModalOpen(
        true
      );
    };

  const startEditEntry =
    () => {
      if (
        !selectedEvent
      ) {
        return;
      }

      setFormTitle(
        selectedEvent.title ||
          ""
      );

      setFormDescription(
        selectedEvent.description ||
          ""
      );

      setFormLocation(
        selectedEvent.location ||
          ""
      );

      setFormLink(
        selectedEvent.meeting_link ||
          ""
      );

      setFormGuests(
        selectedEvent.guests ||
          ""
      );

      setFormTags(
        selectedEvent.tags ||
          ""
      );

      setFormDate(
        selectedEvent.startAt
          ? format(
              selectedEvent.startAt,
              "yyyy-MM-dd"
            )
          : format(
              new Date(),
              "yyyy-MM-dd"
            )
      );

      setFormTime(
        selectedEvent.startAt
          ? format(
              selectedEvent.startAt,
              "HH:mm"
            )
          : "09:00"
      );

      setFormEndDate(
        selectedEvent.endAt
          ? format(
              selectedEvent.endAt,
              "yyyy-MM-dd"
            )
          : ""
      );

      setFormEndTime(
        selectedEvent.endAt
          ? format(
              selectedEvent.endAt,
              "HH:mm"
            )
          : ""
      );

      setFormRepeat(
        selectedEvent.repeat ||
          "none"
      );

      setViewMode(
        "EDIT"
      );

      const firstTag =
        selectedEvent.tags
          ?.split(
            ","
          )?.[0]
          ?.trim()
          ?.toLowerCase();

      setFormTagColor(
        firstTag &&
          tagColorMap[
            firstTag
          ]
          ? tagColorMap[
              firstTag
            ]
          : "#A3B18A"
      );
    };

  const handleFileChange =
    (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (
        event.target.files &&
        event.target.files
          .length > 0
      ) {
        setAttachedFileName(
          event.target
            .files[0].name
        );
      }
    };

  const deleteEvent =
    async (
      eventId: string
    ) => {
      if (
        !confirm(
          "Delete this item?"
        )
      ) {
        return;
      }

      setIsDeleting(
        true
      );

      setEvents(
        (
          previous
        ) =>
          previous.filter(
            (
              event
            ) =>
              event.id !==
              eventId
          )
      );

      setSelectedEvent(
        null
      );

      setIsModalOpen(
        false
      );

      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          await syncCalendar();

          return;
        }

        if (
          String(
            eventId
          ).startsWith(
            "task-"
          )
        ) {
          const taskId =
            String(
              eventId
            ).replace(
              "task-",
              ""
            );

          const {
            error:
              taskDeleteError,
          } =
            await supabase
              .from(
                "tasks"
              )
              .delete()
              .eq(
                "id",
                taskId
              );

          if (
            taskDeleteError
          ) {
            throw taskDeleteError;
          }
        } else if (
          String(
            eventId
          ).startsWith(
            "note-"
          )
        ) {
          const noteId =
            String(
              eventId
            ).replace(
              "note-",
              ""
            );

          const {
            error:
              noteDeleteError,
          } =
            await supabase
              .from(
                "notes"
              )
              .delete()
              .eq(
                "id",
                noteId
              );

          if (
            noteDeleteError
          ) {
            throw noteDeleteError;
          }
        } else {
          const {
            error:
              eventDeleteError,
          } =
            await supabase
              .from(
                "events"
              )
              .delete()
              .eq(
                "id",
                eventId
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            eventDeleteError
          ) {
            throw eventDeleteError;
          }
        }
      } catch (
        err: any
      ) {
        console.error(
          "Delete error:",
          err
        );

        setError(
          err?.message ||
            "Failed to delete item."
        );

        await syncCalendar();
      } finally {
        setIsDeleting(
          false
        );
      }
    };

  // ==================================================
  // BOOKING AVAILABILITY
  // ==================================================

  const toggleBookingDay =
    (
      dayKey: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const current =
            previous.availability[
              dayKey
            ] || [];

          const enabled =
            current.length >
            0;

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]:
                enabled
                  ? []
                  : [
                      {
                        ...DEFAULT_WINDOW,
                      },
                    ],
            },
          };
        }
      );
    };

  const updateBookingWindow =
    (
      dayKey: string,
      index: number,
      field:
        | "start"
        | "end",
      value: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const existing =
            [
              ...(
                previous
                  .availability[
                  dayKey
                ] ||
                []
              ),
            ];

          if (
            !existing[
              index
            ]
          ) {
            return previous;
          }

          existing[
            index
          ] = {
            ...existing[
              index
            ],

            [field]:
              value,
          };

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]:
                existing,
            },
          };
        }
      );
    };

  const addBookingWindow =
    (
      dayKey: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const existing =
            previous
              .availability[
              dayKey
            ] || [];

          let start =
            "09:00";

          let end =
            "17:00";

          if (
            existing.length >
            0
          ) {
            const last =
              existing[
                existing.length -
                  1
              ];

            const lastEndMinutes =
              timeToMinutes(
                last.end
              );

            const suggestedStart =
              Math.min(
                lastEndMinutes +
                  60,
                22 * 60
              );

            const suggestedEnd =
              Math.min(
                suggestedStart +
                  120,
                23 * 60 +
                  59
              );

            const formatMinutes =
              (
                total: number
              ) => {
                const hours =
                  Math.floor(
                    total /
                      60
                  );

                const minutes =
                  total %
                  60;

                return `${String(
                  hours
                ).padStart(
                  2,
                  "0"
                )}:${String(
                  minutes
                ).padStart(
                  2,
                  "0"
                )}`;
              };

            start =
              formatMinutes(
                suggestedStart
              );

            end =
              formatMinutes(
                suggestedEnd
              );
          }

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]: [
                ...existing,

                {
                  start,
                  end,
                },
              ],
            },
          };
        }
      );
    };

  const removeBookingWindow =
    (
      dayKey: string,
      index: number
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const existing =
            previous
              .availability[
              dayKey
            ] || [];

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]:
                existing.filter(
                  (
                    _window,
                    windowIndex
                  ) =>
                    windowIndex !==
                    index
                ),
            },
          };
        }
      );
    };

  const copyDayToWeekdays =
    (
      sourceDayKey: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const source =
            (
              previous
                .availability[
                sourceDayKey
              ] ||
              []
            ).map(
              (
                window
              ) => ({
                ...window,
              })
            );

          return {
            ...previous,

            availability: {
              ...previous.availability,

              mon:
                source.map(
                  (
                    window
                  ) => ({
                    ...window,
                  })
                ),

              tue:
                source.map(
                  (
                    window
                  ) => ({
                    ...window,
                  })
                ),

              wed:
                source.map(
                  (
                    window
                  ) => ({
                    ...window,
                  })
                ),

              thu:
                source.map(
                  (
                    window
                  ) => ({
                    ...window,
                  })
                ),

              fri:
                source.map(
                  (
                    window
                  ) => ({
                    ...window,
                  })
                ),
            },
          };
        }
      );
    };

  const clearAllAvailability =
    () => {
      setBookingPage(
        (
          previous
        ) => ({
          ...previous,

          availability: {
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
            sun: [],
          },
        })
      );
    };

  const restoreWeekdayAvailability =
    () => {
      setBookingPage(
        (
          previous
        ) => ({
          ...previous,

          availability:
            cloneAvailability(
              DEFAULT_BOOKING_PAGE.availability
            ),
        })
      );
    };

  const validateAvailability =
    () => {
      let enabledDayCount =
        0;

      for (
        const day of
          WEEK_DAYS
      ) {
        const windows =
          bookingPage
            .availability[
            day.key
          ] || [];

        if (
          windows.length >
          0
        ) {
          enabledDayCount +=
            1;
        }

        for (
          let i = 0;
          i <
          windows.length;
          i += 1
        ) {
          const window =
            windows[i];

          if (
            !window.start ||
            !window.end
          ) {
            return `${day.fullLabel}: choose a start and end time.`;
          }

          if (
            timeToMinutes(
              window.end
            ) <=
            timeToMinutes(
              window.start
            )
          ) {
            return `${day.fullLabel}: the end time must be after the start time.`;
          }

          for (
            let j =
              i + 1;
            j <
            windows.length;
            j += 1
          ) {
            const other =
              windows[j];

            const startA =
              timeToMinutes(
                window.start
              );

            const endA =
              timeToMinutes(
                window.end
              );

            const startB =
              timeToMinutes(
                other.start
              );

            const endB =
              timeToMinutes(
                other.end
              );

            if (
              startA <
                endB &&
              startB <
                endA
            ) {
              return `${day.fullLabel}: two availability windows overlap.`;
            }
          }
        }
      }

      if (
        enabledDayCount ===
        0
      ) {
        return "Choose at least one day that customers can book.";
      }

      return null;
    };

  const availableDayCount =
    useMemo(
      () =>
        WEEK_DAYS.filter(
          (
            day
          ) =>
            (
              bookingPage
                .availability[
                day.key
              ] || []
            ).length >
            0
        ).length,
      [
        bookingPage.availability,
      ]
    );

  // ==================================================
  // SAVE BOOKING PAGE
  // ==================================================

  const saveBookingPage =
    async () => {
      const {
        data:
          sessionData,
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      const activeUser =
        sessionData
          ?.session
          ?.user ||
        currentUser;

      if (
        sessionError
      ) {
        console.error(
          "Auth session error:",
          sessionError
        );
      }

      if (
        !activeUser?.id
      ) {
        setBookingError(
          "Your account session could not be found. Please sign in again."
        );

        return;
      }

      const cleanSlug =
        slugify(
          bookingPage.slug ||
            bookingPage.title ||
            ""
        );

      if (
        !cleanSlug
      ) {
        setBookingError(
          "Enter a link name for your booking page."
        );

        return;
      }

      const availabilityError =
        validateAvailability();

      if (
        availabilityError
      ) {
        setBookingError(
          availabilityError
        );

        return;
      }

      setCurrentUser(
        activeUser
      );

      setIsBookingSaving(
        true
      );

      setBookingError(
        null
      );

      setBookingSaved(
        false
      );

      try {
        const payload = {
          user_id:
            activeUser.id,

          organisation_id:
            currentProfile
              ?.organisation_id ??
            null,

          slug:
            cleanSlug,

          title:
            bookingPage.title ||
            "Book a meeting",

          description:
            bookingPage.description ||
            "",

          duration_minutes:
            Number(
              bookingPage.duration_minutes
            ) || 30,

          location_type:
            bookingPage.location_type,

          location_value:
            bookingPage.location_value ||
            "",

          video_provider:
            bookingPage.video_provider ||
            "none",

          video_link:
            bookingPage.video_link ||
            "",

          buffer_before_minutes:
            Number(
              bookingPage.buffer_before_minutes
            ) || 0,

          buffer_after_minutes:
            Number(
              bookingPage.buffer_after_minutes
            ) || 0,

          min_notice_hours:
            Number(
              bookingPage.min_notice_hours
            ) || 0,

          max_days_ahead:
            Number(
              bookingPage.max_days_ahead
            ) || 30,

          timezone:
            bookingPage.timezone,

          availability:
            bookingPage.availability,

          is_active:
            bookingPage.is_active,
        };

        const {
          data,
          error:
            bookingSaveError,
        } =
          await supabase
            .from(
              "booking_pages"
            )
            .upsert(
              payload,
              {
                onConflict:
                  "user_id",
              }
            )
            .select("*")
            .maybeSingle();

        if (
          bookingSaveError
        ) {
          console.error(
            "Booking page database error:",
            bookingSaveError
          );

          if (
            bookingSaveError.code ===
            "23505"
          ) {
            setBookingError(
              "That booking link is already being used. Try another link name."
            );
          } else {
            setBookingError(
              bookingSaveError.message ||
                "Unable to save booking page."
            );
          }

          return;
        }

        if (data) {
          setBookingPage(
            (
              previous
            ) => ({
              ...previous,
              ...data,

              availability:
                cloneAvailability(
                  data.availability ||
                    previous.availability
                ),
            })
          );

          setBookingPageExists(
            true
          );
        }

        setBookingSaved(
          true
        );

        window.setTimeout(
          () =>
            setBookingSaved(
              false
            ),
          2500
        );
      } catch (
        err: any
      ) {
        console.error(
          "Booking page save error:",
          err
        );

        setBookingError(
          err?.message ||
            "Failed to save booking page."
        );
      } finally {
        setIsBookingSaving(
          false
        );
      }
    };

  // ==================================================
  // BOOKING LINK
  // ==================================================

  const bookingLink =
    siteOrigin &&
    bookingPage.slug
      ? `${siteOrigin}/book/${slugify(
          bookingPage.slug
        )}`
      : "";

  const bookingEmbedCode =
    bookingLink
      ? `<iframe src="${bookingLink}?embed=1" width="100%" height="720" frameborder="0" style="border:0;border-radius:16px;"></iframe>`
      : "";

  const copyToClipboard =
    async (
      text: string,
      which:
        | "link"
        | "embed"
    ) => {
      try {
        await navigator.clipboard.writeText(
          text
        );

        if (
          which ===
          "link"
        ) {
          setCopiedLink(
            true
          );

          window.setTimeout(
            () =>
              setCopiedLink(
                false
              ),
            2000
          );
        } else {
          setCopiedEmbed(
            true
          );

          window.setTimeout(
            () =>
              setCopiedEmbed(
                false
              ),
            2000
          );
        }
      } catch (
        err
      ) {
        console.warn(
          "Clipboard copy failed",
          err
        );
      }
    };

  const shareBookingLink =
    async () => {
      if (
        !bookingLink
      ) {
        return;
      }

      const message =
        `Here is the link to book a meeting with me: ${bookingLink}`;

      setShareMessage(
        message
      );

      if (
        navigator.share
      ) {
        try {
          await navigator.share(
            {
              title:
                bookingPage.title ||
                "Book a meeting",

              text:
                "Here is the link to book a meeting with me:",

              url:
                bookingLink,
            }
          );

          return;
        } catch {
          // User closed share sheet.
        }
      }

      await copyToClipboard(
        message,
        "link"
      );
    };

  // ==================================================
  // SAVE EVENT
  // ==================================================

  const saveEntry =
    async () => {
      if (
        !formTitle ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(
        true
      );

      try {
        const authResult =
          currentUser
            ? {
                data: {
                  user:
                    currentUser,
                },
              }
            : await supabase.auth.getUser();

        const authUser =
          authResult
            ?.data
            ?.user;

        if (
          !authUser
        ) {
          setError(
            "Please sign in to save calendar entries."
          );

          return;
        }

        const {
          data:
            profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "organisation_id"
            )
            .eq(
              "id",
              authUser.id
            )
            .maybeSingle();

        if (
          profileError
        ) {
          console.error(
            "PROFILE ERROR:",
            profileError
          );
        }

        const startISO =
          new Date(
            `${formDate}T${formTime}:00`
          ).toISOString();

        const endISO =
          formEndDate &&
          formEndTime
            ? new Date(
                `${formEndDate}T${formEndTime}:00`
              ).toISOString()
            : null;

        const combinedDescription =
          `${formDescription}${
            formInternalTeam
              ? `\n\n[Internal Team: ${formInternalTeam}]`
              : ""
          }${
            attachedFileName
              ? `\n[Attachment: ${attachedFileName}]`
              : ""
          }`;

        const enteredTags =
          (
            formTags ||
            ""
          )
            .split(",")
            .map(
              (
                tag
              ) =>
                tag.trim()
            )
            .filter(
              Boolean
            );

        if (
          enteredTags.length >
          0
        ) {
          setTagColorMap(
            (
              previous
            ) => {
              const next = {
                ...previous,
              };

              enteredTags.forEach(
                (
                  tag
                ) => {
                  next[
                    tag.toLowerCase()
                  ] =
                    formTagColor;
                }
              );

              return next;
            }
          );
        }

        const orgId =
          currentProfile
            ?.organisation_id ??
          profile
            ?.organisation_id ??
          null;

        if (
          viewMode ===
            "EDIT" &&
          selectedEvent
        ) {
          if (
            String(
              selectedEvent.id
            ).startsWith(
              "task-"
            )
          ) {
            const taskId =
              String(
                selectedEvent.id
              ).replace(
                "task-",
                ""
              );

            const {
              error:
                taskError,
            } =
              await supabase
                .from(
                  "tasks"
                )
                .update({
                  title:
                    formTitle,

                  description:
                    formDescription,

                  due_date:
                    startISO,

                  tags:
                    formTags,
                })
                .eq(
                  "id",
                  taskId
                );

            if (
              taskError
            ) {
              throw taskError;
            }
          } else if (
            String(
              selectedEvent.id
            ).startsWith(
              "note-"
            )
          ) {
            const noteId =
              String(
                selectedEvent.id
              ).replace(
                "note-",
                ""
              );

            if (
              !orgId
            ) {
              throw new Error(
                "Missing organisation context"
              );
            }

            const {
              data:
                sessionData,
              error:
                sessionError,
            } =
              await supabase.auth.getSession();

            if (
              sessionError ||
              !sessionData
                ?.session
                ?.access_token
            ) {
              throw new Error(
                "Unable to authenticate note update"
              );
            }

            const response =
              await fetch(
                "/api/notes",
                {
                  method:
                    "PUT",

                  headers:
                    {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${sessionData.session.access_token}`,
                    },

                  body:
                    JSON.stringify(
                      {
                        id:
                          noteId,

                        organisation_id:
                          orgId,

                        content:
                          formDescription ||
                          formTitle,

                        due_date:
                          startISO,

                        category:
                          formTags ||
                          undefined,
                      }
                    ),
                }
              );

            const body =
              await response.json();

            if (
              !response.ok ||
              body.error
            ) {
              throw new Error(
                body.error ||
                  "Failed to update note"
              );
            }
          } else {
            const {
              error:
                eventUpdateError,
            } =
              await supabase
                .from(
                  "events"
                )
                .update({
                  title:
                    formTitle,

                  description:
                    combinedDescription,

                  location:
                    formLocation,

                  meeting_link:
                    formLink,

                  guests:
                    formGuests,

                  tags:
                    formTags,

                  start_time:
                    startISO,

                  end_time:
                    endISO,

                  repeat:
                    formRepeat,
                })
                .eq(
                  "id",
                  selectedEvent.id
                )
                .eq(
                  "user_id",
                  authUser.id
                );

            if (
              eventUpdateError
            ) {
              throw eventUpdateError;
            }
          }

          await syncCalendar();

          setIsModalOpen(
            false
          );

          setViewMode(
            "VIEW"
          );

          return;
        }

        const tempId =
          `temp-${Date.now()}`;

        const tempEvent:
          CalendarEvent = {
          id:
            tempId,

          title:
            formTitle,

          description:
            combinedDescription,

          location:
            formLocation,

          meeting_link:
            formLink,

          guests:
            formGuests,

          tags:
            formTags,

          user_id:
            authUser.id,

          startAt:
            new Date(
              startISO
            ),

          endAt:
            endISO
              ? new Date(
                  endISO
                )
              : null,

          repeat:
            formRepeat,
        };

        setEvents(
          (
            previous
          ) => [
            tempEvent,
            ...previous,
          ]
        );

        setIsModalOpen(
          false
        );

        const {
          data:
            insertedEvent,
          error:
            insertError,
        } =
          await supabase
            .from(
              "events"
            )
            .insert([
              {
                title:
                  formTitle,

                description:
                  combinedDescription,

                location:
                  formLocation,

                meeting_link:
                  formLink,

                guests:
                  formGuests,

                tags:
                  formTags,

                start_time:
                  startISO,

                end_time:
                  endISO,

                repeat:
                  formRepeat,

                user_id:
                  authUser.id,

                organisation_id:
                  orgId,

                source:
                  "calendar",
              },
            ])
            .select("*")
            .maybeSingle();

        if (
          insertError
        ) {
          console.error(
            "EVENT SAVE FAILED:",
            insertError
          );

          setError(
            insertError.message ||
              "Failed to save event"
          );

          setEvents(
            (
              previous
            ) =>
              previous.filter(
                (
                  event
                ) =>
                  event.id !==
                  tempId
              )
          );
        } else if (
          insertedEvent
        ) {
          const newEvent =
            normaliseEvent(
              insertedEvent
            );

          setEvents(
            (
              previous
            ) =>
              previous.map(
                (
                  event
                ) =>
                  event.id ===
                  tempId
                    ? newEvent
                    : event
              )
          );
        }

        setFormTitle(
          ""
        );

        setFormDescription(
          ""
        );

        setFormTags(
          ""
        );

        setFormGuests(
          ""
        );

        setFormInternalTeam(
          ""
        );

        setFormEndDate(
          ""
        );

        setFormEndTime(
          ""
        );

        setFormRepeat(
          "none"
        );

        setAttachedFileName(
          null
        );
      } catch (
        err
      ) {
        console.error(
          "Save error:",
          err
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#F9F9F7] p-3 font-sans text-stone-900 sm:p-4 lg:p-10">
      {error && (
        <div className="fixed left-1/2 top-4 z-[2000] -translate-x-1/2 rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white">
          {error}
        </div>
      )}

      {/* ==================================================
          EVENT MODAL
      ================================================== */}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setIsModalOpen(
                  false
                )
              }
              className="absolute inset-0 bg-stone-900/5 backdrop-blur-md"
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-4xl lg:rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between p-8 pb-4">
                <h2 className="font-serif text-2xl italic">
                  {viewMode ===
                  "CREATE"
                    ? "New Entry"
                    : viewMode ===
                        "EDIT"
                      ? "Edit Entry"
                      : "Event Name"}
                </h2>

                <button
                  onClick={() =>
                    setIsModalOpen(
                      false
                    )
                  }
                  className="rounded-full bg-stone-50 p-2"
                >
                  <X
                    size={
                      18
                    }
                  />
                </button>
              </div>

              <div className="no-scrollbar max-h-[75vh] space-y-4 overflow-y-auto p-4 pt-2 lg:p-8 lg:pt-2">
                {viewMode ===
                  "CREATE" ||
                viewMode ===
                  "EDIT" ? (
                  <>
                    <input
                      value={
                        formTitle
                      }
                      onChange={(
                        event
                      ) =>
                        setFormTitle(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Entry Title"
                      className="w-full rounded-xl border-none bg-stone-50 p-4 text-sm outline-none ring-1 ring-stone-100"
                    />

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          formDate
                        }
                        onChange={(
                          event
                        ) =>
                          setFormDate(
                            event
                              .target
                              .value
                          )
                        }
                        className="flex-1 rounded-xl border-none bg-stone-50 p-4 text-xs font-bold outline-none ring-1 ring-stone-100"
                      />

                      <input
                        type="time"
                        value={
                          formTime
                        }
                        onChange={(
                          event
                        ) =>
                          setFormTime(
                            event
                              .target
                              .value
                          )
                        }
                        className="flex-1 rounded-xl border-none bg-stone-50 p-4 text-xs font-bold outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          formEndDate
                        }
                        onChange={(
                          event
                        ) =>
                          setFormEndDate(
                            event
                              .target
                              .value
                          )
                        }
                        className="flex-1 rounded-xl border-none bg-stone-50 p-4 text-xs font-bold outline-none ring-1 ring-stone-100"
                      />

                      <input
                        type="time"
                        value={
                          formEndTime
                        }
                        onChange={(
                          event
                        ) =>
                          setFormEndTime(
                            event
                              .target
                              .value
                          )
                        }
                        className="flex-1 rounded-xl border-none bg-stone-50 p-4 text-xs font-bold outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <select
                      value={
                        formRepeat
                      }
                      onChange={(
                        event
                      ) =>
                        setFormRepeat(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border-none bg-stone-50 p-4 text-xs font-bold outline-none ring-1 ring-stone-100"
                    >
                      <option value="none">
                        No Repeat
                      </option>

                      <option value="daily">
                        Daily
                      </option>

                      <option value="weekly">
                        Weekly
                      </option>

                      <option value="monthly">
                        Monthly
                      </option>
                    </select>

                    <div className="relative">
                      <Link
                        size={
                          14
                        }
                        className="absolute left-4 top-4 text-stone-300"
                      />

                      <input
                        value={
                          formLink
                        }
                        onChange={(
                          event
                        ) =>
                          setFormLink(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Virtual Meeting Link"
                        className="w-full rounded-xl border-none bg-stone-50 p-4 pl-10 text-xs outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <div className="relative">
                      <Mail
                        size={
                          14
                        }
                        className="absolute left-4 top-4 text-stone-300"
                      />

                      <input
                        value={
                          formGuests
                        }
                        onChange={(
                          event
                        ) =>
                          setFormGuests(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="External Invitees"
                        className="w-full rounded-xl border-none bg-stone-50 p-4 pl-10 text-xs outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <div className="relative">
                      <Users
                        size={
                          14
                        }
                        className="absolute left-4 top-4 text-stone-300"
                      />

                      <input
                        value={
                          formInternalTeam
                        }
                        onChange={(
                          event
                        ) =>
                          setFormInternalTeam(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Internal Team Members"
                        className="w-full rounded-xl border-none bg-stone-50 p-4 pl-10 text-xs outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <div className="relative">
                      <Tag
                        size={
                          14
                        }
                        className="absolute left-4 top-4 text-stone-300"
                      />

                      <input
                        value={
                          formTags
                        }
                        onChange={(
                          event
                        ) =>
                          setFormTags(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Tags"
                        className="w-full rounded-xl border-none bg-stone-50 p-4 pl-10 text-xs outline-none ring-1 ring-stone-100"
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-100">
                      <Tag
                        size={
                          14
                        }
                        className="text-stone-300"
                      />

                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                        Tag Color
                      </span>

                      <input
                        type="color"
                        value={
                          formTagColor
                        }
                        onChange={(
                          event
                        ) =>
                          setFormTagColor(
                            event
                              .target
                              .value
                          )
                        }
                        className="h-8 w-12 rounded border border-stone-200"
                      />
                    </div>

                    <div className="w-full">
                      <input
                        type="file"
                        ref={
                          fileInputRef
                        }
                        onChange={
                          handleFileChange
                        }
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-xs font-bold text-stone-500 transition-all hover:bg-stone-100"
                      >
                        <Paperclip
                          size={
                            14
                          }
                        />

                        {attachedFileName
                          ? `Attached: ${attachedFileName}`
                          : "Add Attachment"}
                      </button>
                    </div>

                    <textarea
                      value={
                        formDescription
                      }
                      onChange={(
                        event
                      ) =>
                        setFormDescription(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Notes..."
                      className="h-24 w-full resize-none rounded-xl border-none bg-stone-50 p-4 text-xs outline-none ring-1 ring-stone-100"
                    />

                    <button
                      onClick={() =>
                        void saveEntry()
                      }
                      className="w-full rounded-xl bg-stone-900 py-5 text-[10px] font-black uppercase tracking-widest text-[#A3B18A] transition-all hover:bg-stone-800"
                    >
                      {isSubmitting ? (
                        <Loader2
                          className="mx-auto animate-spin"
                          size={
                            16
                          }
                        />
                      ) : viewMode ===
                        "EDIT" ? (
                        "Save Changes"
                      ) : (
                        "Add"
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent?.tags
                        ?.split(
                          ","
                        )
                        .map(
                          (
                            tag
                          ) => {
                            const style =
                              resolveTagStyle(
                                tag
                              );

                            return (
                              <span
                                key={
                                  tag
                                }
                                className={`rounded-md px-2 py-1 text-[8px] font-black uppercase ${style.bg} ${style.text}`}
                                style={
                                  style.customBg
                                    ? {
                                        backgroundColor:
                                          style.customBg,
                                      }
                                    : undefined
                                }
                              >
                                {tag.trim()}
                              </span>
                            );
                          }
                        )}
                    </div>

                    <h3 className="font-serif text-3xl italic">
                      {
                        selectedEvent?.title
                      }
                    </h3>

                    <p className="whitespace-pre-wrap text-xs italic text-stone-400">
                      "
                      {selectedEvent?.description ||
                        "No description provided."}
                      "
                    </p>

                    {selectedEvent?.meeting_link && (
                      <a
                        href={
                          selectedEvent.meeting_link
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                      >
                        <Video
                          size={
                            14
                          }
                        />

                        Join Meeting
                      </a>
                    )}

                    <button
                      onClick={
                        startEditEntry
                      }
                      className="mt-4 w-full rounded-xl bg-stone-900 py-4 text-[10px] font-black uppercase tracking-widest text-[#A3B18A]"
                    >
                      Edit Entry
                    </button>

                    <button
                      onClick={() =>
                        selectedEvent &&
                        void deleteEvent(
                          selectedEvent.id
                        )
                      }
                      disabled={
                        isDeleting
                      }
                      className="mt-6 w-full rounded-xl bg-red-500 py-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <Loader2
                          className="mx-auto animate-spin"
                          size={
                            16
                          }
                        />
                      ) : (
                        "Delete Event"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-[clamp(2.5rem,12vw,7.5rem)] font-serif italic capitalize leading-[0.8] tracking-tighter text-stone-800">
          {format(
            currentMonth,
            "MMMM"
          )}

          <span className="ml-2 text-stone-300">
            {format(
              currentMonth,
              "yyyy"
            )}
          </span>
        </h1>

        <div className="mb-2 flex items-center gap-2 rounded-full border border-stone-100 bg-white p-2 shadow-sm">
          <button
            onClick={() =>
              setCurrentMonth(
                subMonths(
                  currentMonth,
                  1
                )
              )
            }
            className="rounded-full p-3 transition-all hover:bg-stone-50"
          >
            <ChevronLeft
              size={
                20
              }
              className="text-stone-400"
            />
          </button>

          <div className="h-6 w-px bg-stone-100" />

          <button
            onClick={() =>
              setCurrentMonth(
                addMonths(
                  currentMonth,
                  1
                )
              )
            }
            className="rounded-full p-3 transition-all hover:bg-stone-50"
          >
            <ChevronRight
              size={
                20
              }
              className="text-stone-400"
            />
          </button>
        </div>
      </header>

      {/* ==================================================
          CALENDAR
      ================================================== */}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <section className="flex flex-col overflow-hidden rounded-[3rem] border border-stone-100 bg-white shadow-3xl lg:col-span-8">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/5">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map(
              (
                day
              ) => (
                <div
                  key={
                    day
                  }
                  className="py-4 text-center text-[8px] font-black uppercase tracking-[0.3em] text-stone-300"
                >
                  {
                    day
                  }
                </div>
              )
            )}
          </div>

          <div className="no-scrollbar relative grid flex-1 grid-cols-7 overflow-y-auto">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
              {eventSpans.map(
                (
                  event
                ) => {
                  if (
                    event.startIndex ===
                      -1 ||
                    event.endIndex ===
                      -1
                  ) {
                    return null;
                  }

                  const startCol =
                    (event.startIndex %
                      7) +
                    1;

                  const startRow =
                    Math.floor(
                      event.startIndex /
                        7
                    ) +
                    1;

                  const spanCols =
                    event.startIndex ===
                    event.endIndex
                      ? 1
                      : Math.min(
                          7 -
                            (startCol -
                              1),

                          event.endIndex -
                            event.startIndex +
                            1
                        );

                  const style =
                    resolveTagStyle(
                      event.tags
                        ?.split(
                          ","
                        )[0] ||
                        ""
                    );

                  return (
                    <div
                      key={`span-${event.id}`}
                      className={`absolute h-4 rounded-md opacity-80 ${style.bg}`}
                      style={{
                        ...(style.customBg
                          ? {
                              backgroundColor:
                                style.customBg,
                            }
                          : {}),

                        gridColumnStart:
                          startCol,

                        gridColumnEnd:
                          `span ${spanCols}`,

                        gridRowStart:
                          startRow,
                      }}
                    />
                  );
                }
              )}
            </div>

            {daysGrid.map(
              (
                day,
                index
              ) => {
                const dayEvents =
                  getDayEvents(
                    day
                  );

                const isToday =
                  isSameDay(
                    day,
                    new Date()
                  );

                return (
                  <div
                    key={
                      day.toISOString()
                    }
                    onClick={() =>
                      handleDayClick(
                        day
                      )
                    }
                    className={`group relative min-h-[72px] cursor-pointer border-b border-r border-stone-50 p-2 transition-all lg:min-h-[100px] lg:p-4 ${
                      !isSameMonth(
                        day,
                        currentMonth
                      )
                        ? "opacity-10"
                        : "bg-white hover:bg-[#FDFDFB]"
                    } ${
                      isSameDay(
                        day,
                        selectedDay
                      )
                        ? "bg-[#A3B18A]/5"
                        : ""
                    } ${
                      (index +
                        1) %
                        7 ===
                      0
                        ? "border-r-0"
                        : ""
                    }`}
                  >
                    <span
                      className={`mb-2 inline-block rounded-lg px-2 py-1 text-[10px] font-black ${
                        isToday
                          ? "bg-stone-900 text-[#A3B18A]"
                          : "text-stone-200 group-hover:text-stone-800"
                      }`}
                    >
                      {format(
                        day,
                        "d"
                      )}
                    </span>

                    <div className="space-y-1">
                      {dayEvents.map(
                        (
                          event
                        ) => {
                          const primaryTag =
                            event.tags
                              ?.split(
                                ","
                              )[0] ||
                            "";

                          const style =
                            primaryTag
                              ? resolveTagStyle(
                                  primaryTag
                                )
                              : {
                                  bg:
                                    "bg-stone-50",

                                  text:
                                    "text-stone-500",

                                  customBg:
                                    null,
                                };

                          return (
                            <div
                              key={
                                event.id
                              }
                              onClick={(
                                clickEvent
                              ) => {
                                clickEvent.stopPropagation();

                                setSelectedEvent(
                                  event
                                );

                                setViewMode(
                                  "VIEW"
                                );

                                setIsModalOpen(
                                  true
                                );
                              }}
                              className={`truncate rounded-lg border border-stone-100 px-2 py-1 text-[7px] font-black uppercase ${style.bg} ${style.text}`}
                              style={
                                style.customBg
                                  ? {
                                      backgroundColor:
                                        style.customBg,
                                    }
                                  : undefined
                              }
                            >
                              {
                                event.title
                              }
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="relative flex flex-col overflow-hidden rounded-[3rem] border border-stone-100 bg-white p-8 shadow-3xl lg:col-span-4">
          <div className="mb-8">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#A3B18A]">
              {format(
                selectedDay,
                "EEEE"
              )}
            </p>

            <h2 className="text-3xl font-serif italic capitalize leading-[0.8] text-stone-800 lg:text-5xl">
              {format(
                selectedDay,
                "do MMM"
              )}
            </h2>
          </div>

          <div className="relative z-[100] mb-2">
            <button
              onClick={() =>
                setIsFilterOpen(
                  !isFilterOpen
                )
              }
              className="flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-[9px] font-black uppercase tracking-widest text-stone-400 shadow-inner transition-all hover:text-stone-800"
            >
              <div className="flex items-center gap-3">
                <Tag
                  size={
                    14
                  }
                  className={
                    activeTagFilter !==
                    "ALL"
                      ? "text-[#A3B18A]"
                      : ""
                  }
                />

                Filter:{" "}
                {
                  activeTagFilter
                }
              </div>

              <ChevronDown
                size={
                  14
                }
                className={
                  isFilterOpen
                    ? "rotate-180"
                    : ""
                }
              />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-4xl"
                >
                  {allTags.map(
                    (
                      tag
                    ) => (
                      <div
                        key={
                          tag
                        }
                        onClick={() => {
                          setActiveTagFilter(
                            tag
                          );

                          setIsFilterOpen(
                            false
                          );
                        }}
                        className={`cursor-pointer border-b border-stone-50 p-4 text-[8px] font-black uppercase tracking-widest transition-all last:border-0 hover:bg-stone-50 ${
                          tag ===
                          activeTagFilter
                            ? "text-[#A3B18A]"
                            : "text-stone-400"
                        }`}
                      >
                        {
                          tag
                        }
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-6">
            <select
              value={
                activeColorFilter
              }
              onChange={(
                event
              ) =>
                setActiveColorFilter(
                  event
                    .target
                    .value
                )
              }
              className="w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 text-[9px] font-black uppercase tracking-widest text-stone-500"
            >
              <option value="ALL">
                COLOR: ALL
              </option>

              {allColors
                .filter(
                  (
                    color
                  ) =>
                    color !==
                    "ALL"
                )
                .map(
                  (
                    color
                  ) => (
                    <option
                      key={
                        color
                      }
                      value={
                        color
                      }
                    >
                      {
                        color
                      }
                    </option>
                  )
                )}
            </select>
          </div>

          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto">
            {getDayEvents(
              selectedDay
            ).map(
              (
                event
              ) => (
                <div
                  key={
                    event.id
                  }
                  onClick={() => {
                    setSelectedEvent(
                      event
                    );

                    setViewMode(
                      "VIEW"
                    );

                    setIsModalOpen(
                      true
                    );
                  }}
                  className="group cursor-pointer rounded-3xl border border-stone-100 bg-stone-50 p-5 transition-all hover:shadow-2xl"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex gap-1">
                      {event.tags
                        ?.split(
                          ","
                        )
                        .map(
                          (
                            tag
                          ) => {
                            const style =
                              resolveTagStyle(
                                tag
                              );

                            return (
                              <span
                                key={
                                  tag
                                }
                                className={`text-[7px] font-black uppercase ${style.text}`}
                              >
                                {tag.trim()}
                              </span>
                            );
                          }
                        )}
                    </div>

                    <span className="text-[9px] font-bold text-stone-300">
                      {event.startAt &&
                      isValid(
                        event.startAt
                      )
                        ? format(
                            event.startAt,
                            "HH:mm"
                          )
                        : ""}
                    </span>
                  </div>

                  <p className="truncate text-[11px] font-black uppercase text-stone-800 transition-colors group-hover:text-[#A3B18A]">
                    {
                      event.title
                    }
                  </p>
                </div>
              )
            )}

            {getDayEvents(
              selectedDay
            ).length ===
              0 && (
              <div className="py-20 text-center opacity-10">
                <Shield
                  size={
                    40
                  }
                  className="mx-auto mb-2"
                />

                <p className="text-[8px] font-black uppercase tracking-widest">
                  Calendar Clear
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              handleDayClick(
                selectedDay
              )
            }
            className="mt-6 flex w-full items-center justify-center gap-4 rounded-3xl bg-stone-900 py-6 text-[#A3B18A] shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus
              size={
                20
              }
            />

            <span className="text-[11px] font-black uppercase tracking-[0.4em]">
              New Entry
            </span>
          </button>
        </aside>
      </div>

      {/* ==================================================
          SETTINGS
      ================================================== */}

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 50,
            }}
            className="fixed bottom-6 right-6 top-6 z-[1001] flex w-80 flex-col rounded-[3rem] border border-stone-100 bg-white p-10 shadow-4xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-serif text-xl italic">
                Settings
              </h3>

              <button
                onClick={() =>
                  setIsSettingsOpen(
                    false
                  )
                }
                className="rounded-full bg-stone-50 p-2"
              >
                <X
                  size={
                    16
                  }
                />
              </button>
            </div>

            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto pr-1" />

            <div className="border-t border-stone-50 pt-4">
              <p className="text-[9px] uppercase tracking-widest text-stone-300">
                Event actions are
                available in event
                view
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================
          ONLINE BOOKING
      ================================================== */}

      <section className="mt-6 rounded-[3rem] border border-stone-100 bg-white p-6 shadow-3xl sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#A3B18A]">
              Online Booking
            </p>

            <h2 className="font-serif text-4xl italic leading-none text-stone-800 lg:text-6xl">
              Your booking page
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
              Choose exactly
              which days and
              times customers
              are allowed to book
              with you.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-5 py-4">
            <CalendarDays
              size={
                18
              }
              className="text-[#82906f]"
            />

            <div>
              <p className="text-lg font-black text-stone-800">
                {
                  availableDayCount
                }
              </p>

              <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                Available Days
              </p>
            </div>
          </div>
        </div>

        {isBookingLoading ? (
          <div className="flex justify-center py-10">
            <Loader2
              className="animate-spin text-stone-300"
              size={
                20
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ==================================================
                BASIC BOOKING SETTINGS
            ================================================== */}

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Booking Name
                </label>

                <input
                  value={
                    bookingPage.title
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingPage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Discovery Call"
                  className="w-full rounded-xl bg-stone-50 p-4 text-xs outline-none ring-1 ring-stone-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Booking Link
                </label>

                <input
                  value={
                    bookingPage.slug
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingPage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        slug:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="alex-consultation"
                  className="w-full rounded-xl bg-stone-50 p-4 text-xs outline-none ring-1 ring-stone-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Meeting Length
                </label>

                <select
                  value={
                    bookingPage.duration_minutes
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingPage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        duration_minutes:
                          Number(
                            event
                              .target
                              .value
                          ),
                      })
                    )
                  }
                  className="w-full rounded-xl bg-stone-50 p-4 text-xs outline-none ring-1 ring-stone-100"
                >
                  <option value={15}>
                    15 minutes
                  </option>

                  <option value={30}>
                    30 minutes
                  </option>

                  <option value={45}>
                    45 minutes
                  </option>

                  <option value={60}>
                    60 minutes
                  </option>

                  <option value={90}>
                    90 minutes
                  </option>

                  <option value={120}>
                    2 hours
                  </option>
                </select>
              </div>
            </div>

            <textarea
              value={
                bookingPage.description
              }
              onChange={(
                event
              ) =>
                setBookingPage(
                  (
                    previous
                  ) => ({
                    ...previous,

                    description:
                      event
                        .target
                        .value,
                  })
                )
              }
              placeholder="Tell customers what this meeting is for..."
              className="h-24 w-full resize-none rounded-xl bg-stone-50 p-4 text-xs outline-none ring-1 ring-stone-100"
            />

            {/* ==================================================
                LOCATION
            ================================================== */}

            <div className="rounded-[2rem] border border-stone-100 bg-[#FCFCFA] p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#82906f]">
                  Meeting Location
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Choose how your
                  customer will meet
                  with you.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <select
                  value={
                    bookingPage.location_type
                  }
                  onChange={(
                    event
                  ) =>
                    setBookingPage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        location_type:
                          event
                            .target
                            .value as BookingPage["location_type"],
                      })
                    )
                  }
                  className="rounded-xl bg-white p-4 text-xs outline-none ring-1 ring-stone-100"
                >
                  <option value="video">
                    Online meeting
                    only
                  </option>

                  <option value="in_person">
                    In person only
                  </option>

                  <option value="both">
                    Customer chooses
                  </option>

                  <option value="phone">
                    Phone call
                  </option>
                </select>

                {(bookingPage.location_type ===
                  "video" ||
                  bookingPage.location_type ===
                    "both") && (
                  <>
                    <select
                      value={
                        bookingPage.video_provider
                      }
                      onChange={(
                        event
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            video_provider:
                              event
                                .target
                                .value as BookingPage["video_provider"],
                          })
                        )
                      }
                      className="rounded-xl bg-white p-4 text-xs outline-none ring-1 ring-stone-100"
                    >
                      <option value="google_meet">
                        Google Meet
                      </option>

                      <option value="zoom">
                        Zoom
                      </option>

                      <option value="teams">
                        Microsoft Teams
                      </option>

                      <option value="custom">
                        Custom Link
                      </option>

                      <option value="none">
                        Add Later
                      </option>
                    </select>

                    <input
                      value={
                        bookingPage.video_link
                      }
                      onChange={(
                        event
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            video_link:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Meeting link"
                      className="rounded-xl bg-white p-4 text-xs outline-none ring-1 ring-stone-100"
                    />
                  </>
                )}

                {(bookingPage.location_type ===
                  "in_person" ||
                  bookingPage.location_type ===
                    "both") && (
                  <input
                    value={
                      bookingPage.location_value
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          location_value:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Office address or meeting location"
                    className="rounded-xl bg-white p-4 text-xs outline-none ring-1 ring-stone-100"
                  />
                )}
              </div>
            </div>

            {/* ==================================================
                AVAILABILITY
            ================================================== */}

            <div className="rounded-[2.25rem] border border-stone-200 bg-white p-5 sm:p-7">
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Clock
                      size={
                        16
                      }
                      className="text-[#82906f]"
                    />

                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#82906f]">
                      Booking
                      Availability
                    </p>
                  </div>

                  <h3 className="text-2xl font-black text-stone-800">
                    When can people
                    book you?
                  </h3>

                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-stone-400">
                    Turn on only the
                    days you accept
                    bookings and set
                    one or more time
                    ranges for each
                    day.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      restoreWeekdayAvailability
                    }
                    className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-stone-500 transition hover:bg-stone-100"
                  >
                    Mon–Fri 9–5
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllAvailability
                    }
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-wider text-stone-400 transition hover:bg-stone-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {WEEK_DAYS.map(
                  (
                    day
                  ) => {
                    const windows =
                      bookingPage
                        .availability[
                        day.key
                      ] || [];

                    const enabled =
                      windows.length >
                      0;

                    return (
                      <div
                        key={
                          day.key
                        }
                        className={`rounded-2xl border p-4 transition sm:p-5 ${
                          enabled
                            ? "border-[#A3B18A]/40 bg-[#A3B18A]/5"
                            : "border-stone-100 bg-stone-50/60"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          {/* DAY TOGGLE */}

                          <div className="flex min-w-[150px] items-center gap-3">
                            <button
                              type="button"
                              aria-label={`Toggle ${day.fullLabel}`}
                              onClick={() =>
                                toggleBookingDay(
                                  day.key
                                )
                              }
                              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                enabled
                                  ? "bg-stone-900"
                                  : "bg-stone-200"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                  enabled
                                    ? "left-6"
                                    : "left-1"
                                }`}
                              />
                            </button>

                            <div>
                              <p
                                className={`text-sm font-black ${
                                  enabled
                                    ? "text-stone-800"
                                    : "text-stone-400"
                                }`}
                              >
                                {
                                  day.fullLabel
                                }
                              </p>

                              <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-stone-300">
                                {enabled
                                  ? "Accepting bookings"
                                  : "Unavailable"}
                              </p>
                            </div>
                          </div>

                          {/* WINDOWS */}

                          <div className="min-w-0 flex-1">
                            {!enabled ? (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleBookingDay(
                                    day.key
                                  )
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 py-4 text-[9px] font-bold text-stone-400 transition hover:border-[#A3B18A] hover:text-[#71805f]"
                              >
                                <Plus
                                  size={
                                    13
                                  }
                                />

                                Add availability
                              </button>
                            ) : (
                              <div className="space-y-2">
                                {windows.map(
                                  (
                                    window,
                                    windowIndex
                                  ) => {
                                    const invalid =
                                      timeToMinutes(
                                        window.end
                                      ) <=
                                      timeToMinutes(
                                        window.start
                                      );

                                    return (
                                      <div
                                        key={`${day.key}-${windowIndex}`}
                                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                                      >
                                        <div
                                          className={`flex flex-1 items-center gap-2 rounded-xl border bg-white p-2 ${
                                            invalid
                                              ? "border-red-300"
                                              : "border-stone-100"
                                          }`}
                                        >
                                          <input
                                            type="time"
                                            value={
                                              window.start
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateBookingWindow(
                                                day.key,
                                                windowIndex,
                                                "start",
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs font-bold outline-none"
                                          />

                                          <span className="text-[9px] font-black uppercase text-stone-300">
                                            to
                                          </span>

                                          <input
                                            type="time"
                                            value={
                                              window.end
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateBookingWindow(
                                                day.key,
                                                windowIndex,
                                                "end",
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs font-bold outline-none"
                                          />
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeBookingWindow(
                                              day.key,
                                              windowIndex
                                            )
                                          }
                                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-white text-stone-300 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
                                          title="Remove time window"
                                        >
                                          <Minus
                                            size={
                                              14
                                            }
                                          />
                                        </button>
                                      </div>
                                    );
                                  }
                                )}

                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addBookingWindow(
                                        day.key
                                      )
                                    }
                                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[8px] font-black uppercase tracking-wider text-[#71805f] ring-1 ring-stone-100 transition hover:ring-[#A3B18A]"
                                  >
                                    <Plus
                                      size={
                                        12
                                      }
                                    />

                                    Add another time
                                  </button>

                                  {[
                                    "mon",
                                    "tue",
                                    "wed",
                                    "thu",
                                    "fri",
                                  ].includes(
                                    day.key
                                  ) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyDayToWeekdays(
                                          day.key
                                        )
                                      }
                                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-[8px] font-black uppercase tracking-wider text-stone-400 transition hover:bg-white hover:text-stone-700"
                                    >
                                      <Copy
                                        size={
                                          11
                                        }
                                      />

                                      Copy to weekdays
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* ==================================================
                BOOKING RULES
            ================================================== */}

            <div className="rounded-[2rem] border border-stone-100 bg-stone-50/60 p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#82906f]">
                  Booking Rules
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Control notice,
                  buffers and how far
                  ahead customers can
                  book.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Notice
                  </label>

                  <select
                    value={
                      bookingPage.min_notice_hours
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          min_notice_hours:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-stone-100"
                  >
                    <option value={0}>
                      No notice
                    </option>

                    <option value={1}>
                      1 hour
                    </option>

                    <option value={2}>
                      2 hours
                    </option>

                    <option value={4}>
                      4 hours
                    </option>

                    <option value={12}>
                      12 hours
                    </option>

                    <option value={24}>
                      24 hours
                    </option>

                    <option value={48}>
                      48 hours
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Days Ahead
                  </label>

                  <select
                    value={
                      bookingPage.max_days_ahead
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          max_days_ahead:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-stone-100"
                  >
                    <option value={7}>
                      7 days
                    </option>

                    <option value={14}>
                      14 days
                    </option>

                    <option value={30}>
                      30 days
                    </option>

                    <option value={60}>
                      60 days
                    </option>

                    <option value={90}>
                      90 days
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Buffer Before
                  </label>

                  <select
                    value={
                      bookingPage.buffer_before_minutes
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          buffer_before_minutes:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-stone-100"
                  >
                    <option value={0}>
                      None
                    </option>

                    <option value={5}>
                      5 mins
                    </option>

                    <option value={10}>
                      10 mins
                    </option>

                    <option value={15}>
                      15 mins
                    </option>

                    <option value={30}>
                      30 mins
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Buffer After
                  </label>

                  <select
                    value={
                      bookingPage.buffer_after_minutes
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          buffer_after_minutes:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-stone-100"
                  >
                    <option value={0}>
                      None
                    </option>

                    <option value={5}>
                      5 mins
                    </option>

                    <option value={10}>
                      10 mins
                    </option>

                    <option value={15}>
                      15 mins
                    </option>

                    <option value={30}>
                      30 mins
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
                    Timezone
                  </label>

                  <input
                    value={
                      bookingPage.timezone
                    }
                    onChange={(
                      event
                    ) =>
                      setBookingPage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          timezone:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* ==================================================
                ACTIVE SWITCH
            ================================================== */}

            <div className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-stone-800">
                  Public booking
                  page
                </p>

                <p className="mt-1 text-[10px] text-stone-400">
                  Turn this off to
                  temporarily stop
                  new bookings
                  without deleting
                  your page.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBookingPage(
                    (
                      previous
                    ) => ({
                      ...previous,

                      is_active:
                        !previous.is_active,
                    })
                  )
                }
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  bookingPage.is_active
                    ? "bg-stone-900"
                    : "bg-stone-200"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    bookingPage.is_active
                      ? "left-7"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* ==================================================
                ERRORS
            ================================================== */}

            {bookingError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-bold text-red-600">
                  {
                    bookingError
                  }
                </p>
              </div>
            )}

            {!bookingError &&
              !bookingPageExists && (
                <p className="text-xs text-stone-400">
                  Saving will
                  create your
                  public booking
                  page and
                  generate a
                  shareable link.
                </p>
              )}

            {/* ==================================================
                SAVE
            ================================================== */}

            <button
              onClick={() =>
                void saveBookingPage()
              }
              disabled={
                isBookingSaving
              }
              className="w-full rounded-xl bg-stone-900 py-5 text-[10px] font-black uppercase tracking-widest text-[#A3B18A] transition hover:bg-stone-800 disabled:opacity-50"
            >
              {isBookingSaving ? (
                <Loader2
                  className="mx-auto animate-spin"
                  size={
                    16
                  }
                />
              ) : bookingSaved ? (
                "Booking Availability Saved ✓"
              ) : bookingPageExists ? (
                "Save Booking Page"
              ) : (
                "Create Booking Page"
              )}
            </button>

            {/* ==================================================
                LINK + EMBED
            ================================================== */}

            {bookingPageExists &&
              bookingLink && (
                <>
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-stone-50 p-4 lg:flex-row">
                    <input
                      readOnly
                      value={
                        bookingLink
                      }
                      className="flex-1 rounded-xl bg-white p-3 text-xs"
                    />

                    <button
                      onClick={() =>
                        void copyToClipboard(
                          bookingLink,
                          "link"
                        )
                      }
                      className="rounded-xl bg-white px-5 py-3 text-[10px] font-black uppercase text-stone-600 ring-1 ring-stone-100"
                    >
                      {copiedLink
                        ? "Copied"
                        : "Copy Link"}
                    </button>

                    <button
                      onClick={() =>
                        void shareBookingLink()
                      }
                      className="rounded-xl bg-stone-900 px-5 py-3 text-[10px] font-black uppercase text-[#A3B18A]"
                    >
                      Share Link
                    </button>
                  </div>

                  <div className="space-y-4 rounded-2xl bg-stone-50 p-6">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#A3B18A]">
                        Embed On Your
                        Website
                      </p>

                      <p className="text-xs text-stone-400">
                        Paste this
                        iframe into
                        your website
                        so customers
                        can book
                        directly.
                      </p>
                    </div>

                    <textarea
                      readOnly
                      value={
                        bookingEmbedCode
                      }
                      className="h-32 w-full resize-none rounded-xl bg-white p-4 font-mono text-xs"
                    />

                    <button
                      onClick={() =>
                        void copyToClipboard(
                          bookingEmbedCode,
                          "embed"
                        )
                      }
                      className="rounded-xl bg-stone-900 px-5 py-3 text-[10px] font-black uppercase text-[#A3B18A]"
                    >
                      {copiedEmbed
                        ? "Copied Embed"
                        : "Copy Embed Code"}
                    </button>
                  </div>

                  {shareMessage && (
                    <div className="rounded-xl bg-stone-50 p-4 text-xs text-stone-400">
                      {
                        shareMessage
                      }
                    </div>
                  )}
                </>
              )}
          </div>
        )}
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="mt-4 flex flex-col items-center justify-between gap-2 px-2 opacity-50 lg:mt-6 lg:flex-row">
        <div className="flex gap-4 text-stone-300">
          <RefreshCw
            size={
              14
            }
            onClick={() =>
              void syncCalendar()
            }
            className={`cursor-pointer ${
              isLoading
                ? "animate-spin"
                : ""
            }`}
          />

          <Settings
            size={
              14
            }
            onClick={() =>
              setIsSettingsOpen(
                true
              )
            }
            className="cursor-pointer transition-all hover:text-stone-800"
          />
        </div>
      </footer>

      {/* ==================================================
          GLOBAL STYLES
      ================================================== */}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .shadow-3xl {
          box-shadow:
            0 40px 80px -20px
            rgba(0, 0, 0, 0.08);
        }

        .shadow-4xl {
          box-shadow:
            0 60px 120px -30px
            rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}