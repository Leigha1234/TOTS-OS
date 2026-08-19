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
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Mail,
  Minus,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
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

// ============================================================
// TYPES
// ============================================================

type MainTab =
  | "Overview"
  | "Calendar"
  | "Booking Page"
  | "Availability";

interface CalendarEvent {
  id: string;

  title?: string;
  created_at?: string;

  description?: string;
  location?: string;
  meeting_link?: string;
  guests?: string;
  tags?: string;

  user_id?: string | null;

  organisation_id?: string | null;

  startAt?: Date | null;
  endAt?: Date | null;

  repeat?: string;

  sourceType?:
    | "event"
    | "task"
    | "note";
}

interface AvailabilityWindow {
  start: string;
  end: string;
}

type AvailabilityMap = Record<
  string,
  AvailabilityWindow[]
>;

interface BookingPage {
  id?: string;

  user_id?: string;

  organisation_id?: string | null;

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

// ============================================================
// CONSTANTS
// ============================================================

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

const DEFAULT_WINDOW: AvailabilityWindow = {
  start: "09:00",
  end: "17:00",
};

const DEFAULT_BOOKING_PAGE: BookingPage = {
  slug: "",

  title: "Discovery Call",

  description:
    "Choose a time that works for you.",

  duration_minutes: 30,

  location_type: "video",

  location_value: "",

  video_provider: "google_meet",

  video_link: "",

  buffer_before_minutes: 0,

  buffer_after_minutes: 0,

  min_notice_hours: 4,

  max_days_ahead: 30,

  timezone:
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone || "Europe/London",

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

// ============================================================
// HELPERS
// ============================================================

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cloneAvailability(
  availability: AvailabilityMap
): AvailabilityMap {
  const clone: AvailabilityMap = {};

  WEEK_DAYS.forEach((day) => {
    clone[day.key] = (
      availability[day.key] || []
    ).map((window) => ({
      ...window,
    }));
  });

  return clone;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return 0;
  }

  return hour * 60 + minute;
}

function formatMinutes(total: number) {
  const hours = Math.floor(
    total / 60
  );

  const minutes =
    total % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function safeDate(
  value?: string | null
) {
  if (!value) return null;

  const date = new Date(value);

  return isValid(date)
    ? date
    : null;
}

// ============================================================
// PAGE
// ============================================================

export default function CalendarPage() {
  // ==========================================================
  // PRIMARY PAGE STATE
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<MainTab>(
      "Overview"
    );

  const [
    currentMonth,
    setCurrentMonth,
  ] =
    useState(
      new Date()
    );

  const [
    selectedDay,
    setSelectedDay,
  ] =
    useState(
      new Date()
    );

  const [
    events,
    setEvents,
  ] =
    useState<
      CalendarEvent[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

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

  // ==========================================================
  // EVENT MODAL
  // ==========================================================

  const [
    isModalOpen,
    setIsModalOpen,
  ] =
    useState(false);

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<
      CalendarEvent | null
    >(null);

  const [
    viewMode,
    setViewMode,
  ] =
    useState<
      | "VIEW"
      | "CREATE"
      | "EDIT"
    >(
      "CREATE"
    );

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

  // ==========================================================
  // EVENT FORM
  // ==========================================================

  const [
    formTitle,
    setFormTitle,
  ] =
    useState("");

  const [
    formDate,
    setFormDate,
  ] =
    useState(
      format(
        new Date(),
        "yyyy-MM-dd"
      )
    );

  const [
    formTime,
    setFormTime,
  ] =
    useState(
      "09:00"
    );

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
    useState(
      "none"
    );

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
    formDescription,
    setFormDescription,
  ] =
    useState("");

  const [
    attachedFileName,
    setAttachedFileName,
  ] =
    useState<
      string | null
    >(null);

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  // ==========================================================
  // BOOKING
  // ==========================================================

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
  ] =
    useState<
      string | null
    >(null);

  const [
    bookingSaved,
    setBookingSaved,
  ] =
    useState(false);

  const [
    siteOrigin,
    setSiteOrigin,
  ] =
    useState("");

  const [
    copiedLink,
    setCopiedLink,
  ] =
    useState(false);

  // ==========================================================
  // SITE ORIGIN
  // ==========================================================

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

  // ==========================================================
  // NORMALISE EVENT
  // ==========================================================

  const normaliseEvent =
    useCallback(
      (
        event: any
      ): CalendarEvent => {
        const startRaw =
          event?.start_time ||
          event?.start_at ||
          null;

        const endRaw =
          event?.end_time ||
          event?.end_at ||
          null;

        return {
          ...event,

          sourceType:
            "event",

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
            endRaw &&
            isValid(
              new Date(
                endRaw
              )
            )
              ? new Date(
                  endRaw
                )
              : null,
        };
      },
      []
    );

  // ==========================================================
  // LOAD SCHEDULE
  // ==========================================================

  const syncCalendar =
    useCallback(
      async () => {
        setIsLoading(
          true
        );

        setError(
          null
        );

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
            setCurrentUser(
              null
            );

            setCurrentProfile(
              null
            );

            setEvents(
              []
            );

            return;
          }

          setCurrentUser(
            user
          );

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
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "Schedule profile error:",
              profileError
            );
          }

          setCurrentProfile(
            profile
          );

          const [
            eventsResult,
            ownedTasksResult,
            assignedTasksResult,
            ownedNotesResult,
            assignedNotesResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "events"
                )
                .select("*")
                .eq(
                  "user_id",
                  user.id
                ),

              supabase
                .from(
                  "tasks"
                )
                .select("*")
                .eq(
                  "user_id",
                  user.id
                ),

              supabase
                .from(
                  "tasks"
                )
                .select("*")
                .eq(
                  "assigned_to",
                  user.id
                ),

              supabase
                .from(
                  "notes"
                )
                .select("*")
                .eq(
                  "user_id",
                  user.id
                ),

              supabase
                .from(
                  "notes"
                )
                .select("*")
                .eq(
                  "assigned_to",
                  user.id
                ),
            ]);

          if (
            eventsResult.error
          ) {
            throw eventsResult.error;
          }

          const normalisedEvents =
            (
              eventsResult.data ||
              []
            ).map(
              normaliseEvent
            );

          // IMPORTANT:
          // Tasks now appear only when actually scheduled.
          // created_at is deliberately NOT used as fallback.

          const taskMap =
            new Map<
              string,
              any
            >();

          [
            ...(
              ownedTasksResult.data ||
              []
            ),
            ...(
              assignedTasksResult.data ||
              []
            ),
          ].forEach(
            (
              task: any
            ) => {
              if (
                task?.id
              ) {
                taskMap.set(
                  task.id,
                  task
                );
              }
            }
          );

          const normalisedTasks =
            Array.from(
              taskMap.values()
            )
              .map(
                (
                  task: any
                ): CalendarEvent | null => {
                  const startRaw =
                    task?.due_date ||
                    task?.start_time ||
                    null;

                  if (
                    !startRaw
                  ) {
                    return null;
                  }

                  const start =
                    safeDate(
                      startRaw
                    );

                  if (!start) {
                    return null;
                  }

                  return {
                    ...task,

                    id:
                      `task-${task.id}`,

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
                      "Task",

                    sourceType:
                      "task",

                    startAt:
                      start,

                    endAt:
                      null,
                  };
                }
              )
              .filter(
                Boolean
              ) as CalendarEvent[];

          // IMPORTANT:
          // Notes now appear only when they have an actual due/scheduled date.

          const noteMap =
            new Map<
              string,
              any
            >();

          [
            ...(
              ownedNotesResult.data ||
              []
            ),
            ...(
              assignedNotesResult.data ||
              []
            ),
          ].forEach(
            (
              note: any
            ) => {
              if (
                note?.id
              ) {
                noteMap.set(
                  note.id,
                  note
                );
              }
            }
          );

          const normalisedNotes =
            Array.from(
              noteMap.values()
            )
              .map(
                (
                  note: any
                ): CalendarEvent | null => {
                  const startRaw =
                    note?.due_date ||
                    note?.start_time ||
                    null;

                  if (
                    !startRaw
                  ) {
                    return null;
                  }

                  const start =
                    safeDate(
                      startRaw
                    );

                  if (!start) {
                    return null;
                  }

                  return {
                    ...note,

                    id:
                      `note-${note.id}`,

                    title:
                      note.title ||
                      (
                        note.content
                          ? String(
                              note.content
                            ).slice(
                              0,
                              70
                            )
                          : null
                      ) ||
                      "Note",

                    description:
                      note.content ||
                      note.description ||
                      "",

                    tags:
                      note.tags ||
                      note.category ||
                      "Note",

                    sourceType:
                      "note",

                    startAt:
                      start,

                    endAt:
                      null,
                  };
                }
              )
              .filter(
                Boolean
              ) as CalendarEvent[];

          const combined = [
            ...normalisedEvents,
            ...normalisedTasks,
            ...normalisedNotes,
          ].sort(
            (
              a,
              b
            ) =>
              (
                a.startAt?.getTime() ||
                0
              ) -
              (
                b.startAt?.getTime() ||
                0
              )
          );

          setEvents(
            combined
          );
        } catch (
          syncError: any
        ) {
          console.error(
            "Schedule sync error:",
            syncError
          );

          setError(
            syncError?.message ||
              "Unable to sync your schedule."
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

  // ==========================================================
  // AUTH INITIALISE
  // ==========================================================

  useEffect(() => {
    void syncCalendar();

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

            void syncCalendar();
          }
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [
    syncCalendar,
  ]);

  // ==========================================================
  // LOAD BOOKING PAGE
  // ==========================================================

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
              fetchError,
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
            fetchError
          ) {
            console.error(
              "Booking page load error:",
              fetchError
            );
          }

          if (data) {
            setBookingPage({
              ...DEFAULT_BOOKING_PAGE,
              ...data,

              availability:
                cloneAvailability(
                  data.availability ||
                    DEFAULT_BOOKING_PAGE.availability
                ),
            });

            setBookingPageExists(
              true
            );
          } else {
            setBookingPage({
              ...DEFAULT_BOOKING_PAGE,

              slug:
                `book-${userId.slice(
                  0,
                  8
                )}`,

              availability:
                cloneAvailability(
                  DEFAULT_BOOKING_PAGE.availability
                ),
            });

            setBookingPageExists(
              false
            );
          }
        } catch (
          loadError
        ) {
          console.error(
            "Booking page load exception:",
            loadError
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
    if (
      currentUser?.id
    ) {
      void loadBookingPage(
        currentUser.id
      );
    }
  }, [
    currentUser?.id,
    loadBookingPage,
  ]);

  // ==========================================================
  // DERIVED SCHEDULE
  // ==========================================================

  const daysGrid =
    useMemo(
      () =>
        eachDayOfInterval({
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
        }),
      [
        currentMonth,
      ]
    );

  const getDayEvents =
    useCallback(
      (
        date: Date
      ) => {
        return events
          .filter(
            (
              event
            ) => {
              if (
                !event.startAt ||
                !isValid(
                  event.startAt
                )
              ) {
                return false;
              }

              return isSameDay(
                event.startAt,
                date
              );
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              (
                a.startAt?.getTime() ||
                0
              ) -
              (
                b.startAt?.getTime() ||
                0
              )
          );
      },
      [
        events,
      ]
    );

  const todayEvents =
    useMemo(
      () =>
        getDayEvents(
          new Date()
        ),
      [
        getDayEvents,
      ]
    );

  const upcomingEvents =
    useMemo(
      () => {
        const now =
          new Date();

        return events
          .filter(
            (
              event
            ) =>
              Boolean(
                event.startAt &&
                  event.startAt >=
                    now
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              (
                a.startAt?.getTime() ||
                0
              ) -
              (
                b.startAt?.getTime() ||
                0
              )
          )
          .slice(
            0,
            8
          );
      },
      [
        events,
      ]
    );

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

  const bookingLink =
    siteOrigin &&
    bookingPage.slug
      ? `${siteOrigin}/book/${slugify(
          bookingPage.slug
        )}`
      : "";

  // ==========================================================
  // OPEN EVENT
  // ==========================================================

  const openEvent =
    (
      event: CalendarEvent
    ) => {
      setSelectedEvent(
        event
      );

      setViewMode(
        "VIEW"
      );

      setIsModalOpen(
        true
      );
    };

  // ==========================================================
  // NEW EVENT
  // ==========================================================

  const openCreateEvent =
    (
      day = new Date()
    ) => {
      setSelectedDay(
        day
      );

      setSelectedEvent(
        null
      );

      setFormTitle(
        ""
      );

      setFormDate(
        format(
          day,
          "yyyy-MM-dd"
        )
      );

      setFormTime(
        "09:00"
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

      setFormTags(
        ""
      );

      setFormDescription(
        ""
      );

      setAttachedFileName(
        null
      );

      setViewMode(
        "CREATE"
      );

      setIsModalOpen(
        true
      );
    };

  // ==========================================================
  // EDIT EVENT
  // ==========================================================

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
    };

  // ==========================================================
  // FILE
  // ==========================================================

  const handleFileChange =
    (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (file) {
        setAttachedFileName(
          file.name
        );
      }
    };

  // ==========================================================
  // SAVE EVENT
  // ==========================================================

  const saveEntry =
    async () => {
      if (
        !formTitle.trim() ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(
        true
      );

      setError(
        null
      );

      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "You must be signed in."
          );
        }

        const orgId =
          currentProfile
            ?.organisation_id ||
          null;

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

        const description =
          `${formDescription}${
            formInternalTeam
              ? `\n\nInternal team: ${formInternalTeam}`
              : ""
          }${
            attachedFileName
              ? `\nAttachment: ${attachedFileName}`
              : ""
          }`;

        // ------------------------------------------------------
        // EDIT
        // ------------------------------------------------------

        if (
          viewMode ===
            "EDIT" &&
          selectedEvent
        ) {
          if (
            selectedEvent.sourceType ===
            "task"
          ) {
            const id =
              selectedEvent.id.replace(
                "task-",
                ""
              );

            const {
              error:
                updateError,
            } =
              await supabase
                .from(
                  "tasks"
                )
                .update({
                  title:
                    formTitle.trim(),

                  description:
                    formDescription,

                  due_date:
                    startISO,

                  tags:
                    formTags,
                })
                .eq(
                  "id",
                  id
                );

            if (
              updateError
            ) {
              throw updateError;
            }
          } else if (
            selectedEvent.sourceType ===
            "note"
          ) {
            const id =
              selectedEvent.id.replace(
                "note-",
                ""
              );

            const {
              error:
                updateError,
            } =
              await supabase
                .from(
                  "notes"
                )
                .update({
                  content:
                    formDescription ||
                    formTitle,

                  due_date:
                    startISO,

                  category:
                    formTags ||
                    null,
                })
                .eq(
                  "id",
                  id
                );

            if (
              updateError
            ) {
              throw updateError;
            }
          } else {
            const {
              error:
                updateError,
            } =
              await supabase
                .from(
                  "events"
                )
                .update({
                  title:
                    formTitle.trim(),

                  description,

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
                  user.id
                );

            if (
              updateError
            ) {
              throw updateError;
            }
          }

          await syncCalendar();

          setIsModalOpen(
            false
          );

          return;
        }

        // ------------------------------------------------------
        // CREATE
        // ------------------------------------------------------

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "events"
            )
            .insert({
              title:
                formTitle.trim(),

              description,

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
                user.id,

              organisation_id:
                orgId,

              source:
                "calendar",
            });

        if (
          insertError
        ) {
          throw insertError;
        }

        await syncCalendar();

        setIsModalOpen(
          false
        );
      } catch (
        saveError: any
      ) {
        console.error(
          "Save schedule item error:",
          saveError
        );

        setError(
          saveError?.message ||
            "Unable to save schedule item."
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // DELETE EVENT
  // ==========================================================

  const deleteEvent =
    async () => {
      if (
        !selectedEvent ||
        isDeleting
      ) {
        return;
      }

      if (
        !window.confirm(
          "Delete this item?"
        )
      ) {
        return;
      }

      setIsDeleting(
        true
      );

      try {
        if (
          selectedEvent.sourceType ===
          "task"
        ) {
          const id =
            selectedEvent.id.replace(
              "task-",
              ""
            );

          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "tasks"
              )
              .delete()
              .eq(
                "id",
                id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        } else if (
          selectedEvent.sourceType ===
          "note"
        ) {
          const id =
            selectedEvent.id.replace(
              "note-",
              ""
            );

          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "notes"
              )
              .delete()
              .eq(
                "id",
                id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        } else {
          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                "events"
              )
              .delete()
              .eq(
                "id",
                selectedEvent.id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }
        }

        await syncCalendar();

        setSelectedEvent(
          null
        );

        setIsModalOpen(
          false
        );
      } catch (
        deleteError: any
      ) {
        console.error(
          "Delete schedule item error:",
          deleteError
        );

        setError(
          deleteError?.message ||
            "Unable to delete item."
        );
      } finally {
        setIsDeleting(
          false
        );
      }
    };

  // ==========================================================
  // BOOKING AVAILABILITY
  // ==========================================================

  const toggleBookingDay =
    (
      dayKey: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const windows =
            previous
              .availability[
              dayKey
            ] || [];

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]:
                windows.length
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
          const windows = [
            ...(
              previous
                .availability[
                dayKey
              ] || []
            ),
          ];

          if (
            !windows[index]
          ) {
            return previous;
          }

          windows[index] = {
            ...windows[index],
            [field]:
              value,
          };

          return {
            ...previous,

            availability: {
              ...previous.availability,

              [dayKey]:
                windows,
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
            existing.length
          ) {
            const last =
              existing[
                existing.length -
                  1
              ];

            const lastEnd =
              timeToMinutes(
                last.end
              );

            const suggestedStart =
              Math.min(
                lastEnd + 30,
                22 * 60
              );

            const suggestedEnd =
              Math.min(
                suggestedStart +
                  120,
                23 * 60 +
                  59
              );

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
        ) => ({
          ...previous,

          availability: {
            ...previous.availability,

            [dayKey]:
              (
                previous
                  .availability[
                  dayKey
                ] || []
              ).filter(
                (
                  _window,
                  windowIndex
                ) =>
                  windowIndex !==
                  index
              ),
          },
        })
      );
    };

  const copyDayToWeekdays =
    (
      sourceKey: string
    ) => {
      setBookingPage(
        (
          previous
        ) => {
          const source =
            (
              previous
                .availability[
                sourceKey
              ] || []
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
                cloneWindows(
                  source
                ),

              tue:
                cloneWindows(
                  source
                ),

              wed:
                cloneWindows(
                  source
                ),

              thu:
                cloneWindows(
                  source
                ),

              fri:
                cloneWindows(
                  source
                ),
            },
          };
        }
      );
    };

  const restoreWeekdays =
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

  const clearAvailability =
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

  // ==========================================================
  // VALIDATE BOOKING
  // ==========================================================

  const validateAvailability =
    () => {
      let activeDays =
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
          windows.length
        ) {
          activeDays +=
            1;
        }

        for (
          let i = 0;
          i <
          windows.length;
          i++
        ) {
          const current =
            windows[i];

          if (
            timeToMinutes(
              current.end
            ) <=
            timeToMinutes(
              current.start
            )
          ) {
            return `${day.fullLabel}: end time must be after start time.`;
          }

          for (
            let j =
              i + 1;
            j <
            windows.length;
            j++
          ) {
            const other =
              windows[j];

            if (
              timeToMinutes(
                current.start
              ) <
                timeToMinutes(
                  other.end
                ) &&
              timeToMinutes(
                other.start
              ) <
                timeToMinutes(
                  current.end
                )
            ) {
              return `${day.fullLabel}: availability windows overlap.`;
            }
          }
        }
      }

      if (
        activeDays ===
        0
      ) {
        return "Choose at least one available day.";
      }

      return null;
    };

  // ==========================================================
  // SAVE BOOKING PAGE
  // ==========================================================

  const saveBookingPage =
    async () => {
      if (
        isBookingSaving
      ) {
        return;
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setBookingError(
          "You must be signed in."
        );

        return;
      }

      const slug =
        slugify(
          bookingPage.slug ||
            bookingPage.title
        );

      if (!slug) {
        setBookingError(
          "Enter a booking page link."
        );

        return;
      }

      const validationError =
        validateAvailability();

      if (
        validationError
      ) {
        setBookingError(
          validationError
        );

        return;
      }

      setIsBookingSaving(
        true
      );

      setBookingError(
        null
      );

      try {
        const payload = {
          user_id:
            user.id,

          organisation_id:
            currentProfile
              ?.organisation_id ||
            null,

          slug,

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
            bookingPage.video_provider,

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
            bookingPage.timezone ||
            "Europe/London",

          availability:
            bookingPage.availability,

          is_active:
            bookingPage.is_active,
        };

        const {
          data,
          error:
            saveError,
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
          saveError
        ) {
          throw saveError;
        }

        if (data) {
          setBookingPage({
            ...DEFAULT_BOOKING_PAGE,
            ...data,

            availability:
              cloneAvailability(
                data.availability ||
                  bookingPage.availability
              ),
          });

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
        saveError: any
      ) {
        console.error(
          "Booking save error:",
          saveError
        );

        setBookingError(
          saveError?.code ===
            "23505"
            ? "That booking link is already in use."
            : saveError?.message ||
                "Unable to save booking page."
        );
      } finally {
        setIsBookingSaving(
          false
        );
      }
    };

  // ==========================================================
  // COPY BOOKING LINK
  // ==========================================================

  const copyBookingLink =
    async () => {
      if (
        !bookingLink
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          bookingLink
        );

        setCopiedLink(
          true
        );

        window.setTimeout(
          () =>
            setCopiedLink(
              false
            ),
          1800
        );
      } catch (
        copyError
      ) {
        console.error(
          "Copy booking link error:",
          copyError
        );
      }
    };

  // ==========================================================
  // NAV
  // ==========================================================

  const tabs: {
    label: MainTab;
    icon: any;
  }[] = [
    {
      label: "Overview",
      icon: Sparkles,
    },
    {
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      label: "Booking Page",
      icon: LinkIcon,
    },
    {
      label: "Availability",
      icon: Clock,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 text-stone-900">
      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="fixed left-1/2 top-4 z-[2000] -translate-x-1/2 rounded-xl bg-red-500 px-5 py-3 text-xs font-semibold text-white shadow-xl">
          {error}
        </div>
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="mx-auto max-w-[1400px] px-4 pb-6 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-[#829473]">
              Your time
            </p>

            <h1 className="text-5xl font-serif italic leading-none tracking-tight text-stone-800 sm:text-6xl lg:text-8xl">
              Bookings & Schedule
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-500">
              Manage your schedule,
              availability and the
              way customers book
              time with your
              business.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void syncCalendar()
              }
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500"
            >
              <RefreshCw
                size={13}
                className={
                  isLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab(
                  "Calendar"
                );

                openCreateEvent(
                  new Date()
                );
              }}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#a9b897]"
            >
              <Plus
                size={14}
              />

              Add Event
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          NAV
      ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5">
            {tabs.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                const active =
                  activeTab ===
                  tab.label;

                return (
                  <button
                    key={
                      tab.label
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.label
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] transition ${
                      active
                        ? "bg-stone-900 text-white"
                        : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                    }`}
                  >
                    <Icon
                      size={
                        14
                      }
                    />

                    {
                      tab.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab ===
          "Overview" && (
          <div className="space-y-6">
            {/* SUMMARY */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                  <Sparkles
                    size={
                      18
                    }
                  />
                </div>

                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#829473]">
                    TOTS Schedule
                    Summary
                  </p>

                  <p className="max-w-4xl text-lg leading-8 text-stone-700">
                    {todayEvents.length >
                    0
                      ? `You have ${todayEvents.length} ${
                          todayEvents.length ===
                          1
                            ? "item"
                            : "items"
                        } scheduled today.`
                      : "Your schedule is clear today."}

                    {" "}

                    {upcomingEvents.length >
                    0
                      ? `${upcomingEvents.length} upcoming ${
                          upcomingEvents.length ===
                          1
                            ? "item is"
                            : "items are"
                        } currently visible in your schedule.`
                      : "There are no upcoming scheduled items."}

                    {" "}

                    {bookingPageExists &&
                    bookingPage.is_active
                      ? "Your public booking page is active."
                      : "Your public booking page is not currently active."}
                  </p>
                </div>
              </div>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={
                  CalendarDays
                }
                value={String(
                  todayEvents.length
                )}
                label="Today"
              />

              <StatCard
                icon={
                  Clock
                }
                value={String(
                  upcomingEvents.length
                )}
                label="Upcoming"
              />

              <StatCard
                icon={
                  CalendarDays
                }
                value={String(
                  availableDayCount
                )}
                label="Booking Days"
              />

              <StatCard
                icon={
                  LinkIcon
                }
                value={
                  bookingPageExists &&
                  bookingPage.is_active
                    ? "Live"
                    : "Off"
                }
                label="Booking Page"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* TODAY */}

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:col-span-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                      Today
                    </p>

                    <h2 className="mt-1 text-2xl font-serif italic text-stone-800">
                      {format(
                        new Date(),
                        "EEEE d MMMM"
                      )}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "Calendar"
                      )
                    }
                    className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400 hover:text-[#829473]"
                  >
                    Open Calendar
                  </button>
                </div>

                {todayEvents.length ===
                0 ? (
                  <div className="rounded-2xl bg-stone-50 p-10 text-center">
                    <Check className="mx-auto mb-3 text-[#a9b897]" />

                    <p className="text-sm font-semibold text-stone-600">
                      Nothing scheduled
                    </p>

                    <p className="mt-1 text-xs text-stone-400">
                      Your calendar
                      is clear today.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.map(
                      (
                        event
                      ) => (
                        <ScheduleRow
                          key={
                            event.id
                          }
                          event={
                            event
                          }
                          onClick={() =>
                            openEvent(
                              event
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>

              {/* BOOKING CARD */}

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                      Public Booking
                    </p>

                    <h2 className="mt-1 text-2xl font-serif italic text-stone-800">
                      {
                        bookingPage.title
                      }
                    </h2>
                  </div>

                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      bookingPageExists &&
                      bookingPage.is_active
                        ? "bg-[#a9b897]"
                        : "bg-stone-300"
                    }`}
                  />
                </div>

                <div className="mt-6 space-y-4">
                  <BookingDetail
                    label="Length"
                    value={`${bookingPage.duration_minutes} minutes`}
                  />

                  <BookingDetail
                    label="Availability"
                    value={`${availableDayCount} days per week`}
                  />

                  <BookingDetail
                    label="Notice"
                    value={`${bookingPage.min_notice_hours} hours`}
                  />

                  <BookingDetail
                    label="Status"
                    value={
                      bookingPageExists &&
                      bookingPage.is_active
                        ? "Accepting bookings"
                        : "Not accepting bookings"
                    }
                  />
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "Booking Page"
                      )
                    }
                    className="rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                  >
                    Manage Booking
                    Page
                  </button>

                  {bookingLink &&
                    bookingPageExists && (
                      <button
                        type="button"
                        onClick={() =>
                          void copyBookingLink()
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500"
                      >
                        <Copy
                          size={
                            12
                          }
                        />

                        {copiedLink
                          ? "Copied"
                          : "Copy Booking Link"}
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* UPCOMING */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
              <div className="mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                  Coming Up
                </p>

                <h2 className="mt-1 text-2xl font-serif italic text-stone-800">
                  Upcoming schedule
                </h2>
              </div>

              {upcomingEvents.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-400">
                  Nothing upcoming
                  yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map(
                    (
                      event
                    ) => (
                      <ScheduleRow
                        key={
                          event.id
                        }
                        event={
                          event
                        }
                        onClick={() =>
                          openEvent(
                            event
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            CALENDAR
        ==================================================== */}

        {activeTab ===
          "Calendar" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                  Schedule
                </p>

                <h2 className="mt-1 text-4xl font-serif italic text-stone-800 sm:text-5xl">
                  {format(
                    currentMonth,
                    "MMMM yyyy"
                  )}
                </h2>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      subMonths(
                        currentMonth,
                        1
                      )
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white"
                >
                  <ChevronLeft
                    size={
                      16
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date()
                    )
                  }
                  className="rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      addMonths(
                        currentMonth,
                        1
                      )
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white"
                >
                  <ChevronRight
                    size={
                      16
                    }
                  />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[450px] items-center justify-center rounded-[2rem] border border-stone-200 bg-white">
                <Loader2 className="animate-spin text-[#a9b897]" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
                <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50">
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
                        className="py-4 text-center text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
                      >
                        {
                          day
                        }
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7">
                  {daysGrid.map(
                    (
                      day,
                      index
                    ) => {
                      const dayEvents =
                        getDayEvents(
                          day
                        );

                      const today =
                        isSameDay(
                          day,
                          new Date()
                        );

                      const selected =
                        isSameDay(
                          day,
                          selectedDay
                        );

                      return (
                        <button
                          type="button"
                          key={
                            day.toISOString()
                          }
                          onClick={() => {
                            setSelectedDay(
                              day
                            );

                            openCreateEvent(
                              day
                            );
                          }}
                          className={`min-h-[100px] border-b border-r border-stone-100 p-2 text-left transition sm:min-h-[130px] sm:p-3 ${
                            !isSameMonth(
                              day,
                              currentMonth
                            )
                              ? "bg-stone-50/50 text-stone-300"
                              : "bg-white hover:bg-stone-50"
                          } ${
                            selected
                              ? "bg-[#a9b897]/5"
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
                          <div
                            className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                              today
                                ? "bg-stone-900 text-white"
                                : ""
                            }`}
                          >
                            {format(
                              day,
                              "d"
                            )}
                          </div>

                          <div className="space-y-1">
                            {dayEvents
                              .slice(
                                0,
                                4
                              )
                              .map(
                                (
                                  event
                                ) => (
                                  <div
                                    key={
                                      event.id
                                    }
                                    onClick={(
                                      clickEvent
                                    ) => {
                                      clickEvent.stopPropagation();

                                      openEvent(
                                        event
                                      );
                                    }}
                                    className={`truncate rounded-lg px-2 py-1.5 text-[7px] font-bold ${
                                      event.sourceType ===
                                      "task"
                                        ? "bg-[#a9b897]/15 text-[#6f8064]"
                                        : event.sourceType ===
                                            "note"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-stone-100 text-stone-600"
                                    }`}
                                  >
                                    {
                                      event.title
                                    }
                                  </div>
                                )
                              )}

                            {dayEvents.length >
                              4 && (
                              <p className="px-1 text-[7px] text-stone-400">
                                +
                                {dayEvents.length -
                                  4}{" "}
                                more
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            BOOKING PAGE
        ==================================================== */}

        {activeTab ===
          "Booking Page" && (
          <div className="space-y-6">
            {isBookingLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-[#a9b897]" />
              </div>
            ) : (
              <>
                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Public Booking
                  </p>

                  <h2 className="mt-1 text-3xl font-serif italic text-stone-800">
                    Let customers
                    book you
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                    Create a simple
                    public booking
                    page without
                    giving customers
                    access to your
                    actual calendar.
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      label="Booking Name"
                    >
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
                        className="form-input"
                      />
                    </FormField>

                    <FormField
                      label="Booking Link"
                    >
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
                        placeholder="discovery-call"
                        className="form-input"
                      />
                    </FormField>

                    <FormField
                      label="Meeting Length"
                    >
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
                        className="form-input"
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
                    </FormField>

                    <FormField
                      label="Timezone"
                    >
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
                        className="form-input"
                      />
                    </FormField>
                  </div>

                  <div className="mt-5">
                    <FormField
                      label="Description"
                    >
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
                        className="form-input min-h-[120px] resize-none"
                      />
                    </FormField>
                  </div>
                </div>

                {/* LOCATION */}

                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Meeting Location
                  </p>

                  <h2 className="mt-1 text-2xl font-serif italic text-stone-800">
                    Where will you
                    meet?
                  </h2>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      label="Meeting Type"
                    >
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
                        className="form-input"
                      >
                        <option value="video">
                          Video meeting
                        </option>

                        <option value="in_person">
                          In person
                        </option>

                        <option value="phone">
                          Phone call
                        </option>

                        <option value="both">
                          Customer
                          chooses
                        </option>
                      </select>
                    </FormField>

                    {(bookingPage.location_type ===
                      "video" ||
                      bookingPage.location_type ===
                        "both") && (
                      <FormField
                        label="Video Provider"
                      >
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
                          className="form-input"
                        >
                          <option value="google_meet">
                            Google Meet
                          </option>

                          <option value="teams">
                            Microsoft
                            Teams
                          </option>

                          <option value="zoom">
                            Zoom
                          </option>

                          <option value="custom">
                            Custom
                          </option>

                          <option value="none">
                            Add later
                          </option>
                        </select>
                      </FormField>
                    )}

                    {(bookingPage.location_type ===
                      "video" ||
                      bookingPage.location_type ===
                        "both") && (
                      <FormField
                        label="Meeting Link"
                      >
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
                          placeholder="https://..."
                          className="form-input"
                        />
                      </FormField>
                    )}

                    {(bookingPage.location_type ===
                      "in_person" ||
                      bookingPage.location_type ===
                        "both") && (
                      <FormField
                        label="Location"
                      >
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
                          placeholder="Office address"
                          className="form-input"
                        />
                      </FormField>
                    )}
                  </div>
                </div>

                {/* RULES */}

                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Booking Rules
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <BookingSelect
                      label="Notice"
                      value={
                        bookingPage.min_notice_hours
                      }
                      onChange={(
                        value
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            min_notice_hours:
                              Number(
                                value
                              ),
                          })
                        )
                      }
                      options={[
                        [
                          "0",
                          "No notice",
                        ],
                        [
                          "2",
                          "2 hours",
                        ],
                        [
                          "4",
                          "4 hours",
                        ],
                        [
                          "12",
                          "12 hours",
                        ],
                        [
                          "24",
                          "24 hours",
                        ],
                        [
                          "48",
                          "48 hours",
                        ],
                      ]}
                    />

                    <BookingSelect
                      label="Days Ahead"
                      value={
                        bookingPage.max_days_ahead
                      }
                      onChange={(
                        value
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            max_days_ahead:
                              Number(
                                value
                              ),
                          })
                        )
                      }
                      options={[
                        [
                          "7",
                          "7 days",
                        ],
                        [
                          "14",
                          "14 days",
                        ],
                        [
                          "30",
                          "30 days",
                        ],
                        [
                          "60",
                          "60 days",
                        ],
                        [
                          "90",
                          "90 days",
                        ],
                      ]}
                    />

                    <BookingSelect
                      label="Buffer Before"
                      value={
                        bookingPage.buffer_before_minutes
                      }
                      onChange={(
                        value
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            buffer_before_minutes:
                              Number(
                                value
                              ),
                          })
                        )
                      }
                      options={[
                        [
                          "0",
                          "None",
                        ],
                        [
                          "5",
                          "5 mins",
                        ],
                        [
                          "10",
                          "10 mins",
                        ],
                        [
                          "15",
                          "15 mins",
                        ],
                        [
                          "30",
                          "30 mins",
                        ],
                      ]}
                    />

                    <BookingSelect
                      label="Buffer After"
                      value={
                        bookingPage.buffer_after_minutes
                      }
                      onChange={(
                        value
                      ) =>
                        setBookingPage(
                          (
                            previous
                          ) => ({
                            ...previous,

                            buffer_after_minutes:
                              Number(
                                value
                              ),
                          })
                        )
                      }
                      options={[
                        [
                          "0",
                          "None",
                        ],
                        [
                          "5",
                          "5 mins",
                        ],
                        [
                          "10",
                          "10 mins",
                        ],
                        [
                          "15",
                          "15 mins",
                        ],
                        [
                          "30",
                          "30 mins",
                        ],
                      ]}
                    />
                  </div>
                </div>

                {/* LIVE STATUS */}

                <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        Accept public
                        bookings
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        Disable this
                        without
                        deleting your
                        booking page.
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
                      className={`relative h-8 w-14 rounded-full transition ${
                        bookingPage.is_active
                          ? "bg-stone-900"
                          : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                          bookingPage.is_active
                            ? "left-7"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {bookingError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">
                    {
                      bookingError
                    }
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    isBookingSaving
                  }
                  onClick={() =>
                    void saveBookingPage()
                  }
                  className="w-full rounded-2xl bg-stone-900 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#a9b897] disabled:opacity-50"
                >
                  {isBookingSaving
                    ? "Saving..."
                    : bookingSaved
                      ? "Saved ✓"
                      : bookingPageExists
                        ? "Save Booking Page"
                        : "Create Booking Page"}
                </button>

                {bookingPageExists &&
                  bookingLink && (
                    <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                        Your Link
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={
                            bookingLink
                          }
                          readOnly
                          className="flex-1 rounded-xl bg-stone-50 p-3 text-xs"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void copyBookingLink()
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-5 text-[8px] font-black uppercase tracking-[0.12em] text-stone-500"
                        >
                          <Copy
                            size={
                              12
                            }
                          />

                          {copiedLink
                            ? "Copied"
                            : "Copy"}
                        </button>

                        <a
                          href={
                            bookingLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-white"
                        >
                          Open

                          <ExternalLink
                            size={
                              12
                            }
                          />
                        </a>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* ====================================================
            AVAILABILITY
        ==================================================== */}

        {activeTab ===
          "Availability" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Availability
                  </p>

                  <h2 className="mt-1 text-3xl font-serif italic text-stone-800">
                    When can people
                    book you?
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                    These hours
                    control your
                    public booking
                    availability.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      restoreWeekdays
                    }
                    className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-stone-500"
                  >
                    Mon–Fri 9–5
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAvailability
                    }
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400"
                  >
                    Clear
                  </button>
                </div>
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
                      className={`rounded-[1.7rem] border p-5 ${
                        enabled
                          ? "border-[#a9b897]/40 bg-white"
                          : "border-stone-200 bg-stone-50"
                      }`}
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-start">
                        <div className="flex min-w-[180px] items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              toggleBookingDay(
                                day.key
                              )
                            }
                            className={`relative h-7 w-12 rounded-full ${
                              enabled
                                ? "bg-stone-900"
                                : "bg-stone-200"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                                enabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>

                          <div>
                            <p className="text-sm font-semibold text-stone-700">
                              {
                                day.fullLabel
                              }
                            </p>

                            <p className="text-[8px] uppercase tracking-[0.12em] text-stone-400">
                              {enabled
                                ? "Available"
                                : "Unavailable"}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1">
                          {!enabled ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleBookingDay(
                                  day.key
                                )
                              }
                              className="w-full rounded-xl border border-dashed border-stone-200 py-4 text-xs text-stone-400"
                            >
                              + Add
                              availability
                            </button>
                          ) : (
                            <div className="space-y-3">
                              {windows.map(
                                (
                                  window,
                                  index
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
                                      key={`${day.key}-${index}`}
                                      className="flex flex-col gap-2 sm:flex-row"
                                    >
                                      <div
                                        className={`flex flex-1 items-center gap-3 rounded-xl border bg-stone-50 p-2 ${
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
                                              index,
                                              "start",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          className="min-w-0 flex-1 bg-transparent p-2 text-xs outline-none"
                                        />

                                        <span className="text-[8px] font-black uppercase text-stone-300">
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
                                              index,
                                              "end",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          className="min-w-0 flex-1 bg-transparent p-2 text-xs outline-none"
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeBookingWindow(
                                            day.key,
                                            index
                                          )
                                        }
                                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 hover:text-red-500"
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

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    addBookingWindow(
                                      day.key
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-[#829473]"
                                >
                                  <Plus
                                    size={
                                      12
                                    }
                                  />

                                  Add Time
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
                                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400"
                                  >
                                    <Copy
                                      size={
                                        12
                                      }
                                    />

                                    Copy to
                                    weekdays
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

            {bookingError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">
                {
                  bookingError
                }
              </div>
            )}

            <button
              type="button"
              disabled={
                isBookingSaving
              }
              onClick={() =>
                void saveBookingPage()
              }
              className="w-full rounded-2xl bg-stone-900 py-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#a9b897]"
            >
              {isBookingSaving
                ? "Saving..."
                : bookingSaved
                  ? "Availability Saved ✓"
                  : "Save Availability"}
            </button>
          </div>
        )}
      </main>

      {/* ======================================================
          EVENT MODAL
      ====================================================== */}

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
              className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.97,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
                y: 12,
              }}
              className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Schedule
                  </p>

                  <h2 className="text-3xl font-serif italic text-stone-800">
                    {viewMode ===
                    "CREATE"
                      ? "New Event"
                      : viewMode ===
                          "EDIT"
                        ? "Edit Event"
                        : selectedEvent?.title ||
                          "Event"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              {viewMode ===
                "VIEW" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-stone-50 p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                      When
                    </p>

                    <p className="mt-2 text-sm font-semibold text-stone-700">
                      {selectedEvent?.startAt
                        ? format(
                            selectedEvent.startAt,
                            "EEEE d MMMM yyyy 'at' HH:mm"
                          )
                        : "No date"}
                    </p>
                  </div>

                  {selectedEvent?.description && (
                    <div className="rounded-2xl bg-stone-50 p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                        Notes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                        {
                          selectedEvent.description
                        }
                      </p>
                    </div>
                  )}

                  {selectedEvent?.meeting_link && (
                    <a
                      href={
                        selectedEvent.meeting_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-stone-200 p-5 text-sm font-semibold text-stone-700"
                    >
                      <span className="flex items-center gap-2">
                        <Video
                          size={
                            16
                          }
                        />

                        Join meeting
                      </span>

                      <ArrowUpRight
                        size={
                          15
                        }
                      />
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={
                        startEditEntry
                      }
                      className="rounded-xl bg-stone-900 py-4 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteEvent()
                      }
                      disabled={
                        isDeleting
                      }
                      className="rounded-xl bg-red-50 py-4 text-[8px] font-black uppercase tracking-[0.14em] text-red-500"
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField
                    label="Title"
                  >
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
                      placeholder="Project review"
                      className="form-input"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Start Date"
                    >
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
                        className="form-input"
                      />
                    </FormField>

                    <FormField
                      label="Start Time"
                    >
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
                        className="form-input"
                      />
                    </FormField>

                    <FormField
                      label="End Date"
                    >
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
                        className="form-input"
                      />
                    </FormField>

                    <FormField
                      label="End Time"
                    >
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
                        className="form-input"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Repeat"
                  >
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
                      className="form-input"
                    >
                      <option value="none">
                        No repeat
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
                  </FormField>

                  <FormField
                    label="Location"
                  >
                    <input
                      value={
                        formLocation
                      }
                      onChange={(
                        event
                      ) =>
                        setFormLocation(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Office, Zoom, etc."
                      className="form-input"
                    />
                  </FormField>

                  <FormField
                    label="Meeting Link"
                  >
                    <div className="relative">
                      <LinkIcon
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
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
                        placeholder="https://..."
                        className="form-input pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Guests"
                  >
                    <div className="relative">
                      <Mail
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
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
                        placeholder="client@email.com"
                        className="form-input pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Internal Team"
                  >
                    <div className="relative">
                      <Users
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
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
                        className="form-input pl-10"
                        placeholder="Team members"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Tags"
                  >
                    <div className="relative">
                      <Tag
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
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
                        placeholder="Client, Review"
                        className="form-input pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Notes"
                  >
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
                      className="form-input min-h-[110px] resize-none"
                    />
                  </FormField>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-xs text-stone-500"
                  >
                    <Paperclip
                      size={
                        14
                      }
                    />

                    {attachedFileName ||
                      "Attach file"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveEntry()
                    }
                    disabled={
                      isSubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-5 text-[8px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#a9b897] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2
                        size={
                          14
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={
                          13
                        }
                      />
                    )}

                    {viewMode ===
                    "EDIT"
                      ? "Save Changes"
                      : "Add to Schedule"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================
          GLOBAL STYLES
      ====================================================== */}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

        .font-serif {
          font-family: "Instrument Serif", serif;
        }

        .form-input {
          width: 100%;
          border: 1px solid #f0efec;
          background: #faf9f6;
          border-radius: 0.75rem;
          padding: 0.9rem 1rem;
          font-size: 0.8rem;
          outline: none;
          transition: 0.2s ease;
        }

        .form-input:focus {
          border-color: #a9b897;
          background: white;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// HELPERS / DISPLAY COMPONENTS
// ============================================================

function cloneWindows(
  windows: AvailabilityWindow[]
) {
  return windows.map(
    (
      window
    ) => ({
      ...window,
    })
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
        {label}
      </label>

      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <Icon
        size={18}
        className="mb-6 text-stone-300"
      />

      <p className="text-3xl font-serif italic text-stone-800">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
    </div>
  );
}

function BookingDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
      <span className="text-xs text-stone-400">
        {label}
      </span>

      <span className="text-right text-xs font-semibold text-stone-700">
        {value}
      </span>
    </div>
  );
}

function ScheduleRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-stone-50 p-4 text-left transition hover:bg-stone-100"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            event.sourceType ===
            "task"
              ? "bg-[#a9b897]/15 text-[#829473]"
              : event.sourceType ===
                  "note"
                ? "bg-amber-50 text-amber-600"
                : "bg-white text-stone-500"
          }`}
        >
          {event.sourceType ===
          "event" ? (
            <CalendarDays
              size={
                15
              }
            />
          ) : event.sourceType ===
            "task" ? (
            <Check
              size={
                15
              }
            />
          ) : (
            <Tag
              size={
                15
              }
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-700">
            {event.title ||
              "Untitled"}
          </p>

          <p className="mt-1 text-[10px] text-stone-400">
            {event.startAt
              ? format(
                  event.startAt,
                  "EEE d MMM • HH:mm"
                )
              : "No date"}
          </p>
        </div>
      </div>

      <ChevronRight
        size={
          15
        }
        className="shrink-0 text-stone-300"
      />
    </button>
  );
}

function BookingSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (
    value: string
  ) => void;
  options: [
    string,
    string,
  ][];
}) {
  return (
    <FormField
      label={
        label
      }
    >
      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="form-input"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {
                optionLabel
              }
            </option>
          )
        )}
      </select>
    </FormField>
  );
}