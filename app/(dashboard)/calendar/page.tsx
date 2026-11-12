"use client";

import BookingServicesEditor from "../../components/BookingServicesEditor";

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
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isValid,
  startOfDay,
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

  is_all_day?: boolean;
  color?: string;

  sourceType?:
    | "event"
    | "task"
    | "note";

  calendarOrigin?: string;
  sharedReadOnly?: boolean;

  seriesId?: string;

  isRecurringOccurrence?: boolean;

  occurrenceDate?: Date | null;
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
  price_pence: number;
  payment_requirement: "none" | "deposit" | "full";
  deposit_type: "fixed" | "percentage";
  deposit_value: number;
  payment_policy: string;
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

// ============================================================
// EVENT COLOURS
// ============================================================

const EVENT_COLORS = [
  {
    id: "sage",
    label: "Emerald",
    dot: "#0F3D32",
    background: "#E5F0EC",
    text: "#0F3D32",
    border: "#0F3D32",
  },

  {
    id: "pink",
    label: "Pink",
    dot: "#D98FA3",
    background: "#F8E2E8",
    text: "#9B5266",
    border: "#E9AEBE",
  },

  {
    id: "blue",
    label: "Blue",
    dot: "#7198BD",
    background: "#E1EDF7",
    text: "#496F93",
    border: "#9DBBD5",
  },

  {
    id: "purple",
    label: "Purple",
    dot: "#9B87BD",
    background: "#ECE6F5",
    text: "#6E598F",
    border: "#BCAED3",
  },

  {
    id: "orange",
    label: "Orange",
    dot: "#D89A62",
    background: "#FAEADB",
    text: "#9B6437",
    border: "#E6B88D",
  },

  {
    id: "red",
    label: "Red",
    dot: "#CA7772",
    background: "#F8E2E0",
    text: "#914D49",
    border: "#DFA09C",
  },

  {
    id: "yellow",
    label: "Yellow",
    dot: "#C7A650",
    background: "#F8F0D5",
    text: "#806A2E",
    border: "#DFC77E",
  },

  {
    id: "stone",
    label: "Stone",
    dot: "#78716C",
    background: "#EBE9E7",
    text: "#57534E",
    border: "#A8A29E",
  },
] as const;

function getEventColour(
  colour?: string | null
) {
  return (
    EVENT_COLORS.find(
      (option) =>
        option.id === colour
    ) ||
    EVENT_COLORS[0]
  );
}

// ============================================================
// 10 MINUTE TIMES
// ============================================================

const TIME_OPTIONS = Array.from(
  {
    length: 24 * 6,
  },
  (_, index) => {
    const totalMinutes =
      index * 10;

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

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
  }
);

const DEFAULT_WINDOW: AvailabilityWindow = {
  start: "09:00",
  end: "17:00",
};

const DEFAULT_BOOKING_PAGE: BookingPage = {
  price_pence: 0,
  payment_requirement: "none",
  deposit_type: "fixed",
  deposit_value: 0,
  payment_policy: "",
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

// ============================================================
// HELPERS
// ============================================================

function slugify(
  value: string
) {
  return value
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
}

// ============================================================
// SNAP TIME TO 10 MINUTES
// ============================================================

function snapTimeStringToTen(
  value?: string | null
) {
  if (!value) {
    return "09:00";
  }

  const [
    rawHour,
    rawMinute,
  ] =
    value
      .split(":")
      .map(Number);

  if (
    Number.isNaN(
      rawHour
    ) ||
    Number.isNaN(
      rawMinute
    )
  ) {
    return "09:00";
  }

  let totalMinutes =
    rawHour * 60 +
    rawMinute;

  totalMinutes =
    Math.round(
      totalMinutes / 10
    ) * 10;

  if (
    totalMinutes >=
    24 * 60
  ) {
    totalMinutes =
      23 * 60 + 50;
  }

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

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
}

function formatDateTimeToTen(
  value: Date
) {
  return snapTimeStringToTen(
    format(
      value,
      "HH:mm"
    )
  );
}

// ============================================================
// AVAILABILITY CLONE
// ============================================================

function cloneAvailability(
  availability: AvailabilityMap
): AvailabilityMap {
  const clone: AvailabilityMap =
    {};

  WEEK_DAYS.forEach(
    (
      day
    ) => {
      clone[
        day.key
      ] = (
        availability[
          day.key
        ] || []
      ).map(
        (
          window
        ) => ({
          start:
            snapTimeStringToTen(
              window.start
            ),

          end:
            snapTimeStringToTen(
              window.end
            ),
        })
      );
    }
  );

  // Preserve one-off date overrides alongside recurring weekday hours.
  Object.entries(availability).forEach(([key, windows]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      clone[key] = windows.map((window) => ({
        start: snapTimeStringToTen(window.start),
        end: snapTimeStringToTen(window.end),
      }));
    }
  });

  return clone;
}

// ============================================================
// TIME HELPERS
// ============================================================

function timeToMinutes(
  value: string
) {
  const [
    hour,
    minute,
  ] =
    value
      .split(":")
      .map(Number);

  if (
    Number.isNaN(
      hour
    ) ||
    Number.isNaN(
      minute
    )
  ) {
    return 0;
  }

  return (
    hour * 60 +
    minute
  );
}

function formatMinutes(
  total: number
) {
  const hours =
    Math.floor(
      total / 60
    );

  const minutes =
    total % 60;

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
}

function safeDate(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  return isValid(
    date
  )
    ? date
    : null;
}

// ============================================================
// DATE BETWEEN
// ============================================================

function dateFallsInsideEvent(
  date: Date,
  event: CalendarEvent
) {
  if (
    !event.startAt ||
    !isValid(
      event.startAt
    )
  ) {
    return false;
  }

  if (
    !event.is_all_day ||
    !event.endAt
  ) {
    return isSameDay(
      event.startAt,
      date
    );
  }

  const testDate =
    startOfDay(
      date
    );

  const start =
    startOfDay(
      event.startAt
    );

  const end =
    endOfDay(
      event.endAt
    );

  return (
    (
      isAfter(
        testDate,
        start
      ) ||
      isEqual(
        testDate,
        start
      )
    ) &&
    (
      isBefore(
        testDate,
        end
      ) ||
      isEqual(
        testDate,
        startOfDay(
          end
        )
      )
    )
  );
}

// ============================================================
// RECURRING EVENT EXPANSION
// ============================================================

function expandRecurringEvents(
  baseEvents: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
) {
  const expanded: CalendarEvent[] =
    [];

  baseEvents.forEach(
    (
      event
    ) => {
      if (
        event.sourceType !==
          "event" ||
        !event.startAt ||
        !isValid(
          event.startAt
        )
      ) {
        expanded.push(
          event
        );

        return;
      }

      const repeat =
        event.repeat ||
        "none";

      if (
        repeat ===
          "none" ||
        !repeat
      ) {
        expanded.push(
          event
        );

        return;
      }

      const originalStart =
        new Date(
          event.startAt
        );

      const originalEnd =
        event.endAt
          ? new Date(
              event.endAt
            )
          : null;

      const duration =
        originalEnd
          ? originalEnd.getTime() -
            originalStart.getTime()
          : 0;

      let occurrence =
        new Date(
          originalStart
        );

      let safetyCount =
        0;

      while (
        (
          isBefore(
            occurrence,
            rangeEnd
          ) ||
          isEqual(
            occurrence,
            rangeEnd
          )
        ) &&
        safetyCount <
          1500
      ) {
        const occurrenceEnd =
          duration >
          0
            ? new Date(
                occurrence.getTime() +
                  duration
              )
            : null;

        const occurrenceOverlapsRange =
          occurrenceEnd
            ? (
                occurrence <=
                  rangeEnd &&
                occurrenceEnd >=
                  rangeStart
              )
            : (
                (
                  isAfter(
                    occurrence,
                    rangeStart
                  ) ||
                  isEqual(
                    occurrence,
                    rangeStart
                  )
                ) &&
                (
                  isBefore(
                    occurrence,
                    rangeEnd
                  ) ||
                  isEqual(
                    occurrence,
                    rangeEnd
                  )
                )
              );

        if (
          occurrenceOverlapsRange
        ) {
          const occurrenceStart =
            new Date(
              occurrence
            );

          expanded.push({
            ...event,

            id: `${event.id}__${format(
              occurrenceStart,
              "yyyy-MM-dd-HH-mm"
            )}`,

            seriesId:
              event.id,

            isRecurringOccurrence:
              true,

            occurrenceDate:
              occurrenceStart,

            startAt:
              occurrenceStart,

            endAt:
              occurrenceEnd,
          });
        }

        if (
          repeat ===
          "daily"
        ) {
          occurrence =
            addDays(
              occurrence,
              1
            );
        } else if (
          repeat ===
          "weekly"
        ) {
          occurrence =
            addWeeks(
              occurrence,
              1
            );
        } else if (
          repeat ===
          "monthly"
        ) {
          occurrence =
            addMonths(
              occurrence,
              1
            );
        } else {
          break;
        }

        safetyCount +=
          1;
      }
    }
  );

  return expanded;
}

// ============================================================
// CLONE WINDOWS
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

// ============================================================
// PAGE
// ============================================================

export default function CalendarPage() {
  const [bookingStripe, setBookingStripe] = useState<{ connected: boolean; account_id: string | null; charges_enabled: boolean; payouts_enabled: boolean } | null>(null);
  const [bookingStripeLoading, setBookingStripeLoading] = useState(false);
  const [bookingStripeBusy, setBookingStripeBusy] = useState(false);
  const [bookingStripeError, setBookingStripeError] = useState<string | null>(null);

  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStart, setOverrideStart] = useState("15:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const saveDateOverride = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
      setOverrideError("Choose a date first.");
      return;
    }
    if (timeToMinutes(overrideEnd) <= timeToMinutes(overrideStart)) {
      setOverrideError("End time must be later than start time.");
      return;
    }
    setBookingPage(previous => ({
      ...previous,
      availability: {
        ...previous.availability,
        [overrideDate]: [{ start: overrideStart, end: overrideEnd }],
      },
    }));
    setBookingSaved(false);
    setOverrideError(null);
    setOverrideDate("");
  };

  // ==========================================================
  // PRIMARY STATE
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
    useState(
      true
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

  const refreshBookingStripe = useCallback(async () => {
    const organisationId = currentProfile?.organisation_id;
    if (!organisationId) { setBookingStripe(null); return; }
    setBookingStripeLoading(true);
    setBookingStripeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch(`/api/store/stripe-connect/status?organisation_id=${encodeURIComponent(organisationId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not check Stripe connection.");
      setBookingStripe({
        connected: Boolean(result.connected ?? result.account_id ?? result.stripe_account_id),
        account_id: result.account_id ?? result.stripe_account_id ?? null,
        charges_enabled: Boolean(result.charges_enabled),
        payouts_enabled: Boolean(result.payouts_enabled),
      });
    } catch (error) {
      setBookingStripeError(error instanceof Error ? error.message : "Could not check Stripe connection.");
    } finally { setBookingStripeLoading(false); }
  }, [currentProfile?.organisation_id]);

  useEffect(() => {
    if (activeTab === "Booking Page" && currentProfile?.organisation_id) void refreshBookingStripe();
  }, [activeTab, currentProfile?.organisation_id, refreshBookingStripe]);

  const openBookingStripe = async (action: "onboard" | "dashboard") => {
    if (!currentProfile?.organisation_id || bookingStripeBusy) return;
    setBookingStripeBusy(true);
    setBookingStripeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch(`/api/store/stripe-connect/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ organisation_id: currentProfile.organisation_id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not open Stripe.");
      const url = result.url ?? result.onboarding_url ?? result.dashboard_url;
      if (typeof url !== "string" || !url.startsWith("https://")) throw new Error("Stripe did not return a secure redirect URL.");
      window.location.assign(url);
    } catch (error) {
      setBookingStripeError(error instanceof Error ? error.message : "Could not open Stripe.");
      setBookingStripeBusy(false);
    }
  };

  const [
    isModalOpen,
    setIsModalOpen,
  ] =
    useState(
      false
    );

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<
      CalendarEvent | null
    >(
      null
    );

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
    useState(
      false
    );

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(
      false
    );

  const [
    isCancellingBooking,
    setIsCancellingBooking,
  ] =
    useState(
      false
    );

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
    formAllDay,
    setFormAllDay,
  ] =
    useState(
      false
    );

  const [
    formColor,
    setFormColor,
  ] =
    useState(
      "sage"
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
    >(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  // Persist unfinished new events across navigation and file-picker focus changes.
  // Drafts are isolated by signed-in user and organisation.
  const calendarDraftKey =
    currentUser?.id && currentProfile?.organisation_id
      ? `orbi:calendar:new-event:${currentUser.id}:${currentProfile.organisation_id}`
      : null;

  useEffect(() => {
    if (!isModalOpen || viewMode !== "CREATE" || !calendarDraftKey) return;
    const draft = {
      title: formTitle, date: formDate, time: formTime,
      endDate: formEndDate, endTime: formEndTime,
      repeat: formRepeat, allDay: formAllDay, color: formColor,
      location: formLocation, link: formLink, guests: formGuests,
      internalTeam: formInternalTeam, tags: formTags,
      description: formDescription,
    };
    try {
      // Do not save an untouched blank form as a draft.
      if (draft.title.trim() || draft.description.trim() || draft.location.trim() ||
          draft.link.trim() || draft.guests.trim() || draft.tags.trim() || draft.internalTeam.trim()) {
        localStorage.setItem(calendarDraftKey, JSON.stringify(draft));
      }
    } catch { /* Private browsing / storage disabled. */ }
  }, [isModalOpen, viewMode, calendarDraftKey, formTitle, formDate,
      formTime, formEndDate, formEndTime, formRepeat, formAllDay,
      formColor, formLocation, formLink, formGuests, formInternalTeam,
      formTags, formDescription]);

  // Keep the user's typed amount intact (including trailing decimal zeros).
  const [appointmentPriceInput, setAppointmentPriceInput] = useState<string | null>(null);

  // ==========================================================
  // BOOKING STATE
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
    useState(
      false
    );

  const [
    isBookingLoading,
    setIsBookingLoading,
  ] =
    useState(
      false
    );

  const [
    isBookingSaving,
    setIsBookingSaving,
  ] =
    useState(
      false
    );

  const [
    bookingError,
    setBookingError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    bookingSaved,
    setBookingSaved,
  ] =
    useState(
      false
    );

  const [
    siteOrigin,
    setSiteOrigin,
  ] =
    useState("");

  const [
    copiedLink,
    setCopiedLink,
  ] =
    useState(
      false
    );

  // Sharing preferences are local UI drafts until the server-side
  // invitation, authorization and notification endpoints are installed.
  const [shareRecipientEmail, setShareRecipientEmail] = useState("");
  const [shareCalendarEnabled, setShareCalendarEnabled] = useState(true);
  const [shareEmailEnabled, setShareEmailEnabled] = useState(true);

  // Secure invitations are handled by database RPCs; never grant access from the browser.
  const [sharingRows, setSharingRows] = useState<any[]>([]);
  const [sharingError, setSharingError] = useState("");
  const [sharingBusy, setSharingBusy] = useState(false);
  const [eventInviteId, setEventInviteId] = useState("");
  const [eventInviteEmail, setEventInviteEmail] = useState("");
  const [eventInviteNotice, setEventInviteNotice] = useState(true);
  const [dayAgendaOpen, setDayAgendaOpen] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("mine");
  const [sharedCalendarNames, setSharedCalendarNames] = useState<string[]>([]);
  const [sharedCalendarError, setSharedCalendarError] = useState("");


  const refreshSharing = useCallback(async () => {
    const { data, error } = await supabase.rpc("calendar_list_invitations");
    if (error) { setSharingError(error.message); return; }
    setSharingRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { void refreshSharing(); }, [refreshSharing]);

  const sendShareInvite = async (kind: "booking_page" | "event") => {
    setSharingError("");
    const email = kind === "event" ? eventInviteEmail : shareRecipientEmail;
    const id = kind === "event" ? eventInviteId : bookingPage.id;
    if (!email.trim() || !id) { setSharingError("Choose an item and enter an account email."); return; }
    setSharingBusy(true);
    const { error } = await supabase.rpc("calendar_invite", {
      p_kind: kind, p_item_id: id, p_recipient_email: email.trim(),
      p_email_notifications: kind === "event" ? eventInviteNotice : shareEmailEnabled,
    });
    setSharingBusy(false);
    if (error) { setSharingError(error.message); return; }
    setShareRecipientEmail(""); setEventInviteEmail("");
    await refreshSharing();
  };

  const respondShareInvite = async (id: string, action: "accepted" | "declined" | "revoked") => {
    setSharingError(""); setSharingBusy(true);
    const { error } = await supabase.rpc("calendar_respond_invitation", { p_share_id: id, p_action: action });
    setSharingBusy(false);
    if (error) { setSharingError(error.message); return; }
    await refreshSharing();
  };

  // ==========================================================
  // SITE ORIGIN
  // ==========================================================

  useEffect(
    () => {
      if (
        typeof window !==
        "undefined"
      ) {
        setSiteOrigin(
          window.location.origin
        );
      }
    },
    []
  );

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

          repeat:
            event?.repeat ||
            "none",

          is_all_day:
            Boolean(
              event?.is_all_day
            ),

          color:
            event?.color ||
            "sage",

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

          // Accepted cross-organisation shares are read through a security-definer RPC.
          // The function returns only authorised events; no service key is used in the browser.
          const { data: sharedRows, error: sharedError } = await supabase.rpc(
            "calendar_get_shared_events"
          );
          if (sharedError) {
            setSharedCalendarError(sharedError.message);
          } else {
            setSharedCalendarError("");
          }
          const sharedData = Array.isArray(sharedRows) ? sharedRows : [];
          const sharedNames = Array.from(new Set(sharedData.map((row: any) =>
            String(row.calendar_origin || "Shared calendar")
          )));
          setSharedCalendarNames(sharedNames);
          const sharedEvents: CalendarEvent[] = sharedData.map((row: any) => ({
            ...normaliseEvent(row),
            calendarOrigin: String(row.calendar_origin || "Shared calendar"),
            sharedReadOnly: true,
          }));

          const normalisedEvents =
            (
              eventsResult.data ||
              []
            ).map(
              normaliseEvent
            );

          // ====================================================
          // TASKS
          // ====================================================

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
                ):
                  | CalendarEvent
                  | null => {
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

                  if (
                    !start
                  ) {
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

                    repeat:
                      "none",

                    is_all_day:
                      false,

                    color:
                      "sage",

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

          // ====================================================
          // NOTES
          // ====================================================

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
                ):
                  | CalendarEvent
                  | null => {
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

                  if (
                    !start
                  ) {
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

                    repeat:
                      "none",

                    is_all_day:
                      false,

                    color:
                      "yellow",

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
            ...sharedEvents,
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

  useEffect(
    () => {
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
    },
    [
      syncCalendar,
    ]
  );

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

          if (
            data
          ) {
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

  useEffect(
    () => {
      if (
        currentUser?.id
      ) {
        void loadBookingPage(
          currentUser.id
        );
      }
    },
    [
      currentUser?.id,
      loadBookingPage,
    ]
  );

  // ==========================================================
  // CALENDAR RANGE
  // ==========================================================

  const calendarRangeStart =
    useMemo(
      () =>
        startOfWeek(
          startOfMonth(
            currentMonth
          )
        ),
      [
        currentMonth,
      ]
    );

  const calendarRangeEnd =
    useMemo(
      () =>
        endOfWeek(
          endOfMonth(
            currentMonth
          )
        ),
      [
        currentMonth,
      ]
    );

  const daysGrid =
    useMemo(
      () =>
        eachDayOfInterval({
          start:
            calendarRangeStart,

          end:
            calendarRangeEnd,
        }),
      [
        calendarRangeStart,
        calendarRangeEnd,
      ]
    );

  // ==========================================================
  // RECURRING MONTH EVENTS
  // ==========================================================

  const filterOptions = ["mine", "all", ...sharedCalendarNames];
  const visibleEvents = useMemo(() => events.filter((event) => {
    if (calendarFilter === "all") return true;
    if (calendarFilter === "mine") return !event.sharedReadOnly;
    return event.sharedReadOnly && event.calendarOrigin === calendarFilter;
  }), [events, calendarFilter]);

  const expandedCalendarEvents =
    useMemo(
      () =>
        expandRecurringEvents(
          visibleEvents,
          calendarRangeStart,
          calendarRangeEnd
        ),
      [
        visibleEvents,
        calendarRangeStart,
        calendarRangeEnd,
      ]
    );

  // ==========================================================
  // OVERVIEW RANGE
  // ==========================================================

  const overviewRangeStart =
    useMemo(
      () => {
        const start =
          new Date();

        start.setHours(
          0,
          0,
          0,
          0
        );

        return start;
      },
      []
    );

  const overviewRangeEnd =
    useMemo(
      () =>
        addMonths(
          overviewRangeStart,
          12
        ),
      [
        overviewRangeStart,
      ]
    );

  const expandedOverviewEvents =
    useMemo(
      () =>
        expandRecurringEvents(
          visibleEvents,
          overviewRangeStart,
          overviewRangeEnd
        ),
      [
        visibleEvents,
        overviewRangeStart,
        overviewRangeEnd,
      ]
    );

  // ==========================================================
  // DAY EVENTS
  // ==========================================================

  const getDayEvents =
    useCallback(
      (
        date: Date
      ) => {
        return expandedCalendarEvents
          .filter(
            (
              event
            ) =>
              dateFallsInsideEvent(
                date,
                event
              )
          )
          .sort(
            (
              a,
              b
            ) => {
              if (
                a.is_all_day &&
                !b.is_all_day
              ) {
                return -1;
              }

              if (
                !a.is_all_day &&
                b.is_all_day
              ) {
                return 1;
              }

              return (
                (
                  a.startAt?.getTime() ||
                  0
                ) -
                (
                  b.startAt?.getTime() ||
                  0
                )
              );
            }
          );
      },
      [
        expandedCalendarEvents,
      ]
    );

  // ==========================================================
  // TODAY
  // ==========================================================

  const todayEvents =
    useMemo(
      () => {
        return expandedOverviewEvents
          .filter(
            (
              event
            ) =>
              dateFallsInsideEvent(
                new Date(),
                event
              )
          )
          .sort(
            (
              a,
              b
            ) => {
              if (
                a.is_all_day &&
                !b.is_all_day
              ) {
                return -1;
              }

              if (
                !a.is_all_day &&
                b.is_all_day
              ) {
                return 1;
              }

              return (
                (
                  a.startAt?.getTime() ||
                  0
                ) -
                (
                  b.startAt?.getTime() ||
                  0
                )
              );
            }
          );
      },
      [
        expandedOverviewEvents,
      ]
    );

  // ==========================================================
  // UPCOMING
  // ==========================================================

  const upcomingEvents =
    useMemo(
      () => {
        const now =
          new Date();

        return expandedOverviewEvents
          .filter(
            (
              event
            ) => {
              if (
                !event.startAt
              ) {
                return false;
              }

              if (
                event.is_all_day &&
                dateFallsInsideEvent(
                  now,
                  event
                )
              ) {
                return true;
              }

              return (
                event.startAt >=
                now
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
          )
          .slice(
            0,
            8
          );
      },
      [
        expandedOverviewEvents,
      ]
    );

  // ==========================================================
  // BOOKING DATA
  // ==========================================================

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
  // BASE RECURRING EVENT
  // ==========================================================

  const getBaseEvent =
    useCallback(
      (
        event:
          | CalendarEvent
          | null
      ) => {
        if (
          !event
        ) {
          return null;
        }

        if (
          !event.seriesId
        ) {
          return event;
        }

        return (
          events.find(
            (
              original
            ) =>
              original.id ===
              event.seriesId
          ) ||
          event
        );
      },
      [
        events,
      ]
    );

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
  // CREATE EVENT
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

      setFormAllDay(
        false
      );

      setFormColor(
        "sage"
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

      // Restore the user's unfinished new-event draft, if present.
      if (calendarDraftKey) {
        try {
          const raw = localStorage.getItem(calendarDraftKey);
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft && typeof draft === "object") {
              if (typeof draft.title === "string") setFormTitle(draft.title);
              if (typeof draft.date === "string") setFormDate(draft.date);
              if (typeof draft.time === "string") setFormTime(draft.time);
              if (typeof draft.endDate === "string") setFormEndDate(draft.endDate);
              if (typeof draft.endTime === "string") setFormEndTime(draft.endTime);
              if (typeof draft.repeat === "string") setFormRepeat(draft.repeat);
              if (typeof draft.allDay === "boolean") setFormAllDay(draft.allDay);
              if (typeof draft.color === "string") setFormColor(draft.color);
              if (typeof draft.location === "string") setFormLocation(draft.location);
              if (typeof draft.link === "string") setFormLink(draft.link);
              if (typeof draft.guests === "string") setFormGuests(draft.guests);
              if (typeof draft.internalTeam === "string") setFormInternalTeam(draft.internalTeam);
              if (typeof draft.tags === "string") setFormTags(draft.tags);
              if (typeof draft.description === "string") setFormDescription(draft.description);
            }
          }
        } catch { /* Ignore invalid stored drafts. */ }
      }

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

      const eventToEdit =
        getBaseEvent(
          selectedEvent
        ) ||
        selectedEvent;

      setFormTitle(
        eventToEdit.title ||
          ""
      );

      setFormDescription(
        eventToEdit.description ||
          ""
      );

      setFormLocation(
        eventToEdit.location ||
          ""
      );

      setFormLink(
        eventToEdit.meeting_link ||
          ""
      );

      setFormGuests(
        eventToEdit.guests ||
          ""
      );

      setFormTags(
        eventToEdit.tags ||
          ""
      );

      setFormAllDay(
        Boolean(
          eventToEdit.is_all_day
        )
      );

      setFormColor(
        eventToEdit.color ||
          "sage"
      );

      setFormDate(
        eventToEdit.startAt
          ? format(
              eventToEdit.startAt,
              "yyyy-MM-dd"
            )
          : format(
              new Date(),
              "yyyy-MM-dd"
            )
      );

      setFormTime(
        eventToEdit.startAt
          ? formatDateTimeToTen(
              eventToEdit.startAt
            )
          : "09:00"
      );

      setFormEndDate(
        eventToEdit.endAt
          ? format(
              eventToEdit.endAt,
              "yyyy-MM-dd"
            )
          : ""
      );

      setFormEndTime(
        eventToEdit.endAt &&
        !eventToEdit.is_all_day
          ? formatDateTimeToTen(
              eventToEdit.endAt
            )
          : ""
      );

      setFormRepeat(
        eventToEdit.repeat ||
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
        event.target.files?.[
          0
        ];

      if (
        file
      ) {
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

        if (
          !user
        ) {
          throw new Error(
            "You must be signed in."
          );
        }

        const orgId =
          currentProfile
            ?.organisation_id ||
          null;

        let startISO:
          string;

        let endISO:
          string | null;

        // ======================================================
        // ALL DAY DATE STORAGE
        // ======================================================

        if (
          formAllDay
        ) {
          startISO =
            new Date(
              `${formDate}T00:00:00`
            ).toISOString();

          const chosenEndDate =
            formEndDate ||
            formDate;

          endISO =
            new Date(
              `${chosenEndDate}T23:59:59`
            ).toISOString();
        } else {
          const safeStartTime =
            snapTimeStringToTen(
              formTime
            );

          const safeEndTime =
            formEndTime
              ? snapTimeStringToTen(
                  formEndTime
                )
              : "";

          startISO =
            new Date(
              `${formDate}T${safeStartTime}:00`
            ).toISOString();

          endISO =
            formEndDate &&
            safeEndTime
              ? new Date(
                  `${formEndDate}T${safeEndTime}:00`
                ).toISOString()
              : null;
        }

        if (
          endISO &&
          new Date(
            endISO
          ) <=
            new Date(
              startISO
            )
        ) {
          throw new Error(
            "End date and time must be after the start."
          );
        }

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

        // ======================================================
        // EDIT
        // ======================================================

        if (
          viewMode ===
            "EDIT" &&
          selectedEvent
        ) {
          const originalEvent =
            getBaseEvent(
              selectedEvent
            ) ||
            selectedEvent;

          // TASK
          if (
            originalEvent.sourceType ===
            "task"
          ) {
            const id =
              originalEvent.id.replace(
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
          }

          // NOTE
          else if (
            originalEvent.sourceType ===
            "note"
          ) {
            const id =
              originalEvent.id.replace(
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
          }

          // EVENT
          else {
            const eventId =
              selectedEvent.seriesId ||
              selectedEvent.id;

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

                  is_all_day:
                    formAllDay,

                  color:
                    formColor,
                })
                .eq(
                  "id",
                  eventId
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

        // ======================================================
        // CREATE EVENT
        // ======================================================

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

              is_all_day:
                formAllDay,

              color:
                formColor,

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

        // Clear only after the new event has been saved successfully.
        if (calendarDraftKey) {
          try { localStorage.removeItem(calendarDraftKey); } catch { /* ignore */ }
        }
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
  // BOOKING HELPERS
  // ==========================================================

  const getBookingCustomer =
    useCallback(
      (
        event:
          | CalendarEvent
          | null
      ) => {
        if (
          !event ||
          event.sourceType !==
            "event" ||
          !event.description
        ) {
          return null;
        }

        const match =
          event.description.match(
            /^Booking requested by\s+(.+?)\s+\(([^()\s]+@[^()\s]+)\)/i
          );

        if (!match) {
          return null;
        }

        return {
          name:
            match[1].trim(),
          email:
            match[2]
              .trim()
              .toLowerCase(),
        };
      },
      []
    );

  const cancelBooking =
    async () => {
      if (
        !selectedEvent ||
        isCancellingBooking
      ) {
        return;
      }

      const bookingCustomer =
        getBookingCustomer(
          selectedEvent
        );

      if (!bookingCustomer) {
        setError(
          "This calendar item is not linked to a customer booking."
        );

        return;
      }

      if (
        !window.confirm(
          `Cancel this meeting with ${bookingCustomer.name}? The customer will be emailed automatically.`
        )
      ) {
        return;
      }

      setIsCancellingBooking(
        true
      );

      setError(
        null
      );

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          !session?.access_token
        ) {
          throw new Error(
            "You must be signed in to cancel this booking."
          );
        }

        const eventId =
          selectedEvent.seriesId ||
          selectedEvent.id;

        const response =
          await fetch(
            "/api/bookings/cancel",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  eventId,
                }),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => null
            );

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to cancel this booking."
          );
        }

        await syncCalendar();

        setSelectedEvent(
          null
        );

        setIsModalOpen(
          false
        );
      } catch (
        cancelError: any
      ) {
        console.error(
          "Cancel booking error:",
          cancelError
        );

        setError(
          cancelError?.message ||
            "Unable to cancel this booking."
        );
      } finally {
        setIsCancellingBooking(
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

      const isSeries =
        Boolean(
          selectedEvent.seriesId ||
            (
              selectedEvent.sourceType ===
                "event" &&
              selectedEvent.repeat &&
              selectedEvent.repeat !==
                "none"
            )
        );

      if (
        !window.confirm(
          isSeries
            ? "Delete this repeating event series?"
            : "Delete this item?"
        )
      ) {
        return;
      }

      setIsDeleting(
        true
      );

      try {
        const baseEvent =
          getBaseEvent(
            selectedEvent
          ) ||
          selectedEvent;

        if (
          baseEvent.sourceType ===
          "task"
        ) {
          const id =
            baseEvent.id.replace(
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
          baseEvent.sourceType ===
          "note"
        ) {
          const id =
            baseEvent.id.replace(
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
          const eventId =
            selectedEvent.seriesId ||
            selectedEvent.id;

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
                eventId
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
            !windows[
              index
            ]
          ) {
            return previous;
          }

          windows[
            index
          ] = {
            ...windows[
              index
            ],

            [field]:
              snapTimeStringToTen(
                value
              ),
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
                lastEnd +
                  10,
                23 * 60 +
                  40
              );

            const suggestedEnd =
              Math.min(
                suggestedStart +
                  120,
                23 * 60 +
                  50
              );

            start =
              snapTimeStringToTen(
                formatMinutes(
                  suggestedStart
                )
              );

            end =
              snapTimeStringToTen(
                formatMinutes(
                  suggestedEnd
                )
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
  // VALIDATE AVAILABILITY
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
          let i =
            0;
          i <
          windows.length;
          i++
        ) {
          const current =
            windows[
              i
            ];

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
              windows[
                j
              ];

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

      for (const [date, windows] of Object.entries(bookingPage.availability)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        for (let i = 0; i < windows.length; i++) {
          if (timeToMinutes(windows[i].end) <= timeToMinutes(windows[i].start)) {
            return `${date}: end time must be after start time.`;
          }
          for (let j = i + 1; j < windows.length; j++) {
            if (timeToMinutes(windows[i].start) < timeToMinutes(windows[j].end) &&
                timeToMinutes(windows[j].start) < timeToMinutes(windows[i].end)) {
              return `${date}: availability windows overlap.`;
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

      if (
        !user
      ) {
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

      if (
        !slug
      ) {
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
            ) ||
            30,

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
            ) ||
            0,

          buffer_after_minutes:
            Number(
              bookingPage.buffer_after_minutes
            ) ||
            0,

          min_notice_hours:
            Number(
              bookingPage.min_notice_hours
            ) ||
            0,

          max_days_ahead:
            Number(
              bookingPage.max_days_ahead
            ) ||
            30,

          timezone:
            bookingPage.timezone ||
            "Europe/London",

          availability:
            bookingPage.availability,

          price_pence: Math.max(0, Math.round(Number(bookingPage.price_pence) || 0)),
          // Payments remain disabled until Stripe Checkout + webhook confirmation is deployed.
          payment_requirement: "none",
          deposit_type: bookingPage.deposit_type,
          deposit_value: Math.max(0, Math.round(Number(bookingPage.deposit_value) || 0)),
          payment_policy: bookingPage.payment_policy || "",
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

        if (
          data
        ) {
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
  // TABS
  // ==========================================================

  const tabs: {
    label:
      MainTab;

    icon:
      any;
  }[] = [
    {
      label:
        "Overview",

      icon:
        Sparkles,
    },

    {
      label:
        "Calendar",

      icon:
        CalendarDays,
    },

    {
      label:
        "Booking Page",

      icon:
        LinkIcon,
    },

    {
      label:
        "Availability",

      icon:
        Clock,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#F8F9F6] pb-24 text-[#20332D]">
      {/* ERROR */}

      {error && (
        <div className="fixed left-1/2 top-4 z-[2000] -translate-x-1/2 rounded-xl bg-red-500 px-5 py-3 text-xs font-semibold text-white shadow-xl">
          {error}
        </div>
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="relative overflow-hidden bg-[#103F33] text-[#FAF7EF]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-40 h-[440px] w-[440px] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-24 h-[320px] w-[320px] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-16 top-4 h-[160px] w-[160px] rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-[1500px] px-5 pb-10 pt-9 sm:px-8 lg:px-10 lg:pb-12 lg:pt-12">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#C5D9CE]">
            <span>ORBI.</span><ChevronRight size={13} aria-hidden="true" /><span className="text-white">Calendar & bookings</span>
          </div>
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.26em] text-[#C2D6C9]">Your business, in sync</p>
              <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-[#FFF9F0] sm:text-6xl lg:text-[76px]">Your time. <span className="italic text-[#C6D9C8]">Beautifully organised.</span></h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#E0E9E1] sm:text-base">One place for appointments, events, availability and customer bookings — so nothing gets missed.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void syncCalendar()} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60">
                <RefreshCw size={16} aria-hidden="true" className={isLoading ? "animate-spin" : ""} />Refresh
              </button>
              <button type="button" onClick={() => { setActiveTab("Calendar"); openCreateEvent(new Date()); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FFF9F0] px-6 py-3 text-sm font-bold text-[#103F33] shadow-lg shadow-black/10 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Plus size={17} aria-hidden="true" />New event
              </button>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/20 pt-5 text-xs text-[#D8E5D9]">
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} aria-hidden="true" />{format(new Date(), "EEEE, d MMMM yyyy")}</span>
            <span className="inline-flex items-center gap-2"><Clock size={15} aria-hidden="true" />{todayEvents.length} scheduled today</span>
            <span className="inline-flex items-center gap-2"><Sparkles size={15} aria-hidden="true" />{upcomingEvents.length} upcoming</span>
          </div>
        </div>
      </header>

      {/* ======================================================
          NAV
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-5 pt-6 sm:px-8 lg:px-10">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-[#E2EAE3] bg-white p-2 shadow-[0_6px_28px_rgba(16,63,51,0.05)]">
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
                    className={`flex items-center gap-2 min-h-11 rounded-xl px-5 py-3 text-xs font-bold tracking-[0.02em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#103F33] transition ${
                      active
                        ? "bg-[#103F33] text-white shadow-sm"
                        : "text-[#53675C] hover:bg-[#EEF3EE] hover:text-[#103F33]"
                    }`}
                  >
                    <Icon
                      size={14}
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

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab ===
          "Overview" && (
          <div className="space-y-6">
            {/* SUMMARY */}

            <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0F3D32]/10 text-[#446D59]">
                  <Sparkles
                    size={18}
                  />
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#446D59]">
                    ORBI. Schedule Intelligence
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

              <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 lg:col-span-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                      Today
                    </p>

                    <h2 className="mt-1 text-2xl font-serif text-[#183E31]">
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
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#60746A] hover:text-[#446D59]"
                  >
                    Open Calendar
                  </button>
                </div>

                {todayEvents.length ===
                0 ? (
                  <div className="rounded-2xl bg-stone-50 p-10 text-center">
                    <Check className="mx-auto mb-3 text-[#0F3D32]" />

                    <p className="text-sm font-semibold text-stone-600">
                      Nothing scheduled
                    </p>

                    <p className="mt-1 text-xs text-[#60746A]">
                      Your calendar is
                      clear today.
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

              <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                      Public Booking
                    </p>

                    <h2 className="mt-1 text-2xl font-serif text-[#183E31]">
                      {
                        bookingPage.title
                      }
                    </h2>
                  </div>

                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      bookingPageExists &&
                      bookingPage.is_active
                        ? "bg-[#0F3D32]"
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
                    className="rounded-xl bg-[#103F33] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Manage Booking Page
                  </button>

                  {bookingLink &&
                    bookingPageExists && (
                      <button
                        type="button"
                        onClick={() =>
                          void copyBookingLink()
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#E1E8E1] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52665B]"
                      >
                        <Copy
                          size={12}
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

            <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                  Coming Up
                </p>

                <h2 className="mt-1 text-2xl font-serif text-[#183E31]">
                  Upcoming schedule
                </h2>
              </div>

              {upcomingEvents.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[#E1E8E1] p-10 text-center text-sm text-[#60746A]">
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
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                  Schedule
                </p>

                <h2 className="mt-1 text-4xl font-serif text-[#183E31] sm:text-5xl">
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
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E1E8E1] bg-white"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now =
                      new Date();

                    setCurrentMonth(
                      now
                    );

                    setSelectedDay(
                      now
                    );
                  }}
                  className="rounded-xl border border-[#E1E8E1] bg-white px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52665B]"
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
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E1E8E1] bg-white"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[450px] items-center justify-center rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)]">
                <Loader2 className="animate-spin text-[#0F3D32]" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)]">
                {/* DAYS */}

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
                        className="py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#60746A]"
                      >
                        {
                          day
                        }
                      </div>
                    )
                  )}
                </div>

                {dayAgendaOpen && (
                  <div className="border-b border-stone-200 bg-[#f7f8f4] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{format(selectedDay, "EEEE d MMMM")} — appointments</h3>
                      <div className="flex gap-2"><button type="button" onClick={() => openCreateEvent(selectedDay)} className="rounded-lg bg-stone-900 px-3 py-2 text-xs text-white">+ Add event</button><button type="button" onClick={() => setDayAgendaOpen(false)} aria-label="Close agenda"><X size={18}/></button></div>
                    </div>
                    <div className="mt-3 space-y-2">{getDayEvents(selectedDay).length ? getDayEvents(selectedDay).map(ev => <button key={ev.id} type="button" onClick={() => openEvent(ev)} className="block w-full rounded-lg border bg-white p-3 text-left text-sm">{ev.startAt ? format(ev.startAt, "HH:mm") : "All day"} · {ev.title || "Untitled"}</button>) : <p className="text-sm text-stone-500">No appointments for this day.</p>}</div>
                  </div>
                )}

                {/* CELLS */}

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

                            setDayAgendaOpen(true);
                          }}
                          className={`min-h-[115px] border-b border-r border-stone-100 p-2 text-left transition sm:min-h-[145px] sm:p-3 ${
                            !isSameMonth(
                              day,
                              currentMonth
                            )
                              ? "bg-stone-50/50 text-stone-300"
                              : "bg-white hover:bg-stone-50"
                          } ${
                            selected
                              ? "bg-[#0F3D32]/5"
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
                                ? "bg-[#103F33] text-white"
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
                                ) => {
                                  const colour =
                                    getEventColour(
                                      event.color
                                    );

                                  const isEvent =
                                    event.sourceType ===
                                    "event";

                                  return (
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
                                      className={`flex cursor-pointer items-center gap-1.5 truncate rounded-lg border-l-[3px] px-2 py-1.5 text-[7px] font-bold shadow-sm transition hover:brightness-[0.97] ${
                                        event.sourceType ===
                                        "task"
                                          ? "border-[#0F3D32] bg-[#0F3D32] text-white"
                                          : event.sourceType ===
                                              "note"
                                            ? "border-amber-400 bg-amber-100 text-amber-800"
                                            : ""
                                      }`}
                                      style={
                                        isEvent
                                          ? {
                                              backgroundColor:
                                                colour.background,

                                              color:
                                                colour.text,

                                              borderLeftColor:
                                                colour.dot,
                                            }
                                          : undefined
                                      }
                                    >
                                      {isEvent && (
                                        <span
                                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                                          style={{
                                            backgroundColor:
                                              colour.dot,
                                          }}
                                        />
                                      )}

                                      <span className="truncate">
                                        {event.is_all_day
                                          ? "All day · "
                                          : event.startAt
                                            ? `${format(
                                                event.startAt,
                                                "HH:mm"
                                              )} `
                                            : ""}

                                        {
                                          event.title
                                        }

                                        {event.isRecurringOccurrence &&
                                          " ↻"}
                                      </span>
                                    </div>
                                  );
                                }
                              )}

                            {dayEvents.length >
                              4 && (
                              <p className="px-1 text-[7px] font-semibold text-[#60746A]">
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

                {activeTab === "Calendar" && (
          <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2" aria-label="Filter calendars">
              <span className="mr-2 text-xs font-semibold text-stone-600">View calendar:</span>
              {filterOptions.map((option) => (
                <button key={option} type="button"
                  onClick={() => setCalendarFilter(option)}
                  aria-pressed={calendarFilter === option}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${calendarFilter === option ? "bg-stone-900 text-white" : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"}`}>
                  {option === "mine" ? "My calendar" : option === "all" ? "View all" : option}
                </button>
              ))}
              <button type="button" onClick={() => void syncCalendar()} className="ml-auto text-xs underline">Refresh calendars</button>
            </div>
            {sharedCalendarError && <p role="alert" className="mt-2 text-xs text-red-700">Shared calendars unavailable: {sharedCalendarError}</p>}
            {!sharedCalendarError && sharedCalendarNames.length === 0 && <p className="mt-2 text-xs text-stone-500">Shared calendars appear here after their invitations are accepted and appointments are available.</p>}
          </div>
        )}

{activeTab === "Calendar" && (
          <div className="mb-6 space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6">
            <h3 className="text-xl font-serif italic">Share a single event</h3>
            <p className="text-sm text-stone-500">Choose one of your events and invite another TOTS-OS account to view it.</p>
            <select aria-label="Event to share" value={eventInviteId} onChange={e => setEventInviteId(e.target.value)} className="w-full rounded-xl border p-3 text-sm"><option value="">Choose event</option>{events.filter(ev => ev.sourceType === "event" || !ev.sourceType).map(ev => <option key={ev.id} value={ev.id}>{ev.title || "Untitled"} — {ev.startAt ? format(ev.startAt, "d MMM yyyy") : ""}</option>)}</select>
            <input type="email" aria-label="Invitee email" placeholder="TOTS-OS account email" value={eventInviteEmail} onChange={e => setEventInviteEmail(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={eventInviteNotice} onChange={e => setEventInviteNotice(e.target.checked)} />Request email notifications</label>
            <button type="button" disabled={sharingBusy} onClick={() => void sendShareInvite("event")} className="rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">Invite to event</button>
            <SharingInvitations rows={sharingRows} busy={sharingBusy} error={sharingError} onRespond={respondShareInvite} onRefresh={() => void refreshSharing()} />
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
                <Loader2 className="animate-spin text-[#0F3D32]" />
              </div>
            ) : (
              <>
                <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                    Public Booking
                  </p>

                  <h2 className="mt-1 text-3xl font-serif text-[#183E31]">
                    Let customers book you
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52665B]">
                    Create a simple public
                    booking page without
                    giving customers access
                    to your actual calendar.
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField label="Booking Name">
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

                    <FormField label="Booking Link">
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

                    <FormField label="Meeting Length">
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
                        <option value={10}>
                          10 minutes
                        </option>

                        <option value={20}>
                          20 minutes
                        </option>

                        <option value={30}>
                          30 minutes
                        </option>

                        <option value={40}>
                          40 minutes
                        </option>

                        <option value={50}>
                          50 minutes
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

                    <FormField label="Timezone">
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
                    <FormField label="Description">
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

                <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                    Meeting Location
                  </p>

                  <h2 className="mt-1 text-2xl font-serif text-[#183E31]">
                    Where will you meet?
                  </h2>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Meeting Type">
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
                          Customer chooses
                        </option>
                      </select>
                    </FormField>

                    {(bookingPage.location_type ===
                      "video" ||
                      bookingPage.location_type ===
                        "both") && (
                      <FormField label="Video Provider">
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
                            Microsoft Teams
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
                      <FormField label="Meeting Link">
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
                      <FormField label="Location">
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

                <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
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
                          "10",
                          "10 mins",
                        ],
                        [
                          "20",
                          "20 mins",
                        ],
                        [
                          "30",
                          "30 mins",
                        ],
                        [
                          "40",
                          "40 mins",
                        ],
                        [
                          "50",
                          "50 mins",
                        ],
                        [
                          "60",
                          "60 mins",
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
                          "10",
                          "10 mins",
                        ],
                        [
                          "20",
                          "20 mins",
                        ],
                        [
                          "30",
                          "30 mins",
                        ],
                        [
                          "40",
                          "40 mins",
                        ],
                        [
                          "50",
                          "50 mins",
                        ],
                        [
                          "60",
                          "60 mins",
                        ],
                      ]}
                    />
                  </div>
                </div>

                {/* LIVE */}

                <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        Accept public bookings
                      </p>

                      <p className="mt-1 text-xs text-[#60746A]">
                        Disable this without
                        deleting your booking
                        page.
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
                          ? "bg-[#103F33]"
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

                {bookingPage.id && <BookingServicesEditor bookingPageId={bookingPage.id} />}

                <section className="rounded-[2rem] border border-[#E1EAE2] bg-white p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-stone-900">Stripe Connect</h3>
                      <p className="mt-2 text-sm text-stone-500">Connect your organisation’s Stripe account to accept payments and receive payouts.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bookingStripe?.charges_enabled && bookingStripe?.payouts_enabled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {bookingStripeLoading ? "Checking…" : bookingStripe?.charges_enabled && bookingStripe?.payouts_enabled ? "Ready to take payments" : bookingStripe?.connected ? "Setup incomplete" : "Not connected"}
                    </span>
                  </div>
                  {bookingStripeError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{bookingStripeError}</p>}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" disabled={bookingStripeBusy || bookingStripeLoading || !currentProfile?.organisation_id} onClick={() => void openBookingStripe("onboard")} className="inline-flex items-center gap-2 rounded-xl bg-[#103F33] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0F3D32] disabled:opacity-50">
                      {bookingStripeBusy ? <Loader2 size={17} className="animate-spin" /> : <LinkIcon size={17} />}
                      {!bookingStripe?.connected ? "Connect with Stripe" : bookingStripe.charges_enabled && bookingStripe.payouts_enabled ? "Manage Stripe setup" : "Complete Stripe setup"}
                    </button>
                    {bookingStripe?.connected && <button type="button" disabled={bookingStripeBusy} onClick={() => void openBookingStripe("dashboard")} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50">Open Stripe Dashboard <ExternalLink size={16} /></button>}
                    <button type="button" disabled={bookingStripeLoading || !currentProfile?.organisation_id} onClick={() => void refreshBookingStripe()} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"><RefreshCw size={17} className={bookingStripeLoading ? "animate-spin" : ""} /> Refresh status</button>
                  </div>
                  {bookingStripe?.connected && <p className="mt-4 text-xs text-stone-500">Connected account: {bookingStripe.account_id || "Unavailable"} · Payments: {bookingStripe.charges_enabled ? "Enabled" : "Pending"} · Payouts: {bookingStripe.payouts_enabled ? "Enabled" : "Pending"}</p>}
                  <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Stripe connection is shared with Store. Booking deposits and online appointment payments are not enabled until secure booking checkout and webhook confirmation are implemented.</p>
                </section>

                <section className="rounded-[2rem] border border-[#E1EAE2] bg-white p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">Payments &amp; deposits</p>
                  <h3 className="mt-2 text-2xl font-serif text-[#183E31]">Set your appointment price</h3>
                  <p className="mt-2 text-sm text-[#52665B]">Prices and booking terms can be saved now. Deposit collection will be enabled after secure Stripe checkout and payment confirmation are installed.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-stone-700">Appointment price (£)
                      <div className="relative mt-2">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-500">£</span>
                        <input
                          className="form-input w-full pl-7"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0.00"
                          aria-label="Appointment price in pounds"
                          value={appointmentPriceInput ?? (bookingPage.price_pence / 100).toFixed(2)}
                          onChange={e => {
                            const value = e.target.value.replace(/,/g, ".");
                            if (!/^\d*(?:\.\d{0,2})?$/.test(value)) return;
                            setAppointmentPriceInput(value);
                            const amount = Number(value);
                            setBookingPage(p => ({ ...p, price_pence: Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0 }));
                          }}
                          onBlur={() => setAppointmentPriceInput(null)}
                        />
                      </div>
                    </label>
                    <label className="text-sm font-medium text-stone-700">Payment at booking
                      <select className="form-input mt-2" value="none" disabled><option value="none">No online payment (currently)</option></select>
                    </label>
                  </div>
                  <label className="mt-5 block text-sm font-medium text-stone-700">Booking and cancellation terms
                    <textarea className="form-input mt-2 min-h-24" value={bookingPage.payment_policy} onChange={e => setBookingPage(p => ({...p, payment_policy: e.target.value}))} placeholder="e.g. Please give 24 hours notice to cancel." />
                  </label>
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">Deposits and full payments are not live yet. Customers can still book without paying online.</p>
                </section>

                <section className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
                  <h3 className="text-2xl font-serif italic text-stone-800">Share this booking calendar</h3>
                  <p className="mt-2 text-sm text-stone-500">Invite an existing TOTS-OS account. They must accept before they can view bookings.</p>
                  <input type="email" aria-label="Recipient account email" placeholder="Account email" value={shareRecipientEmail} onChange={e => setShareRecipientEmail(e.target.value)} className="mt-4 w-full rounded-xl border p-3 text-sm" />
                  <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={shareEmailEnabled} onChange={e => setShareEmailEnabled(e.target.checked)} />Request email notifications (delivery requires notification worker)</label>
                  <button type="button" disabled={sharingBusy || !bookingPage.id} onClick={() => void sendShareInvite("booking_page")} className="mt-4 rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">Send invitation</button>
                </section>
                <SharingInvitations rows={sharingRows} busy={sharingBusy} error={sharingError} onRespond={respondShareInvite} onRefresh={() => void refreshSharing()} />

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
                  className="w-full rounded-2xl bg-[#103F33] py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#0F3D32] disabled:opacity-50"
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
                    <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
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
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#E1E8E1] px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#52665B]"
                        >
                          <Copy
                            size={12}
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
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#103F33] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                        >
                          Open

                          <ExternalLink
                            size={12}
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
            <div className="rounded-[1.75rem] border border-[#E1EAE2] bg-white shadow-[0_8px_36px_rgba(16,63,51,0.045)] p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                    Availability
                  </p>

                  <h2 className="mt-1 text-3xl font-serif text-[#183E31]">
                    When can people book you?
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#52665B]">
                    These hours control your
                    public booking
                    availability. Times are
                    available in ten-minute
                    intervals.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      restoreWeekdays
                    }
                    className="rounded-xl border border-[#E1E8E1] bg-stone-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#52665B]"
                  >
                    Mon–Fri 9–5
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAvailability
                    }
                    className="rounded-xl border border-[#E1E8E1] bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#60746A]"
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
                          ? "border-[#0F3D32]/40 bg-white"
                          : "border-[#E1E8E1] bg-stone-50"
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
                                ? "bg-[#103F33]"
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

                            <p className="text-[8px] uppercase tracking-[0.12em] text-[#60746A]">
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
                              className="w-full rounded-xl border border-dashed border-[#E1E8E1] py-4 text-xs text-[#60746A]"
                            >
                              + Add availability
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
                                        <select
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
                                        >
                                          {TIME_OPTIONS.map(
                                            (
                                              time
                                            ) => (
                                              <option
                                                key={
                                                  time
                                                }
                                                value={
                                                  time
                                                }
                                              >
                                                {
                                                  time
                                                }
                                              </option>
                                            )
                                          )}
                                        </select>

                                        <span className="text-[11px] font-bold uppercase text-stone-300">
                                          to
                                        </span>

                                        <select
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
                                        >
                                          {TIME_OPTIONS.map(
                                            (
                                              time
                                            ) => (
                                              <option
                                                key={
                                                  time
                                                }
                                                value={
                                                  time
                                                }
                                              >
                                                {
                                                  time
                                                }
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeBookingWindow(
                                            day.key,
                                            index
                                          )
                                        }
                                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E1E8E1] bg-white text-[#60746A] hover:text-red-500"
                                      >
                                        <Minus
                                          size={14}
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
                                  className="flex items-center gap-2 rounded-xl border border-[#E1E8E1] bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#446D59]"
                                >
                                  <Plus
                                    size={12}
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
                                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#60746A]"
                                  >
                                    <Copy
                                      size={12}
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

            <section className="rounded-[1.75rem] border border-[#DCE8DF] bg-white p-6 md:p-8 space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">One-off changes</p>
                <h3 className="mt-2 text-2xl font-serif text-[#183E31]">Different hours on a specific date?</h3>
                <p className="mt-2 text-sm text-[#52665B]">Override your usual weekly hours for one day, or mark it unavailable. For example, 28 November: 3pm–5pm instead of 9am–5pm.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-[#183E31]">Date
                  <input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} className="mt-2 w-full rounded-xl border border-[#DCE8DF] bg-white p-3" />
                </label>
                <label className="text-xs font-semibold text-[#183E31]">From
                  <select value={overrideStart} onChange={e => setOverrideStart(e.target.value)} className="mt-2 w-full rounded-xl border border-[#DCE8DF] bg-white p-3">{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </label>
                <label className="text-xs font-semibold text-[#183E31]">Until
                  <select value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} className="mt-2 w-full rounded-xl border border-[#DCE8DF] bg-white p-3">{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </label>
              </div>
              {overrideError && <p className="text-xs text-red-600">{overrideError}</p>}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={saveDateOverride} className="rounded-xl bg-[#103F33] px-5 py-3 text-xs font-bold text-white">Add date override</button>
                <button type="button" disabled={!overrideDate} onClick={() => {
                  if (!overrideDate) return;
                  setBookingPage(previous => ({ ...previous, availability: { ...previous.availability, [overrideDate]: [] } }));
                  setBookingSaved(false); setOverrideDate(""); setOverrideError(null);
                }} className="rounded-xl border border-[#DCE8DF] px-5 py-3 text-xs font-bold text-[#183E31] disabled:opacity-50">Block this date</button>
              </div>
              <div className="space-y-2">
                {Object.entries(bookingPage.availability).filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort(([a], [b]) => a.localeCompare(b)).map(([date, windows]) => (
                  <div key={date} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 text-sm">
                    <span><strong>{date}</strong> — {windows.length ? windows.map(w => `${w.start}–${w.end}`).join(", ") : "Unavailable all day"}</span>
                    <button type="button" className="text-xs font-semibold text-red-600" onClick={() => {
                      setBookingPage(previous => {
                        const availability = { ...previous.availability };
                        delete availability[date];
                        return { ...previous, availability };
                      });
                      setBookingSaved(false);
                    }}>Remove</button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#60746A]">Click Save Availability below to save changes. The public booking slot generator must also read date overrides for these hours to affect customer bookings.</p>
            </section>

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
              className="w-full rounded-2xl bg-[#103F33] py-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0F3D32]"
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
              onClick={() =>
                setIsModalOpen(
                  false
                )
              }
              className="absolute inset-0 bg-[#103F33]/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.97,

                y:
                  12,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,

                scale:
                  0.97,

                y:
                  12,
              }}
              className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">
                    Schedule
                  </p>

                  <h2 className="text-3xl font-serif text-[#183E31]">
                    {viewMode ===
                    "CREATE"
                      ? "New Event"
                      : viewMode ===
                          "EDIT"
                        ? "Edit Event"
                        : selectedEvent?.title ||
                          "Event"}
                  </h2>

                  {selectedEvent?.isRecurringOccurrence &&
                    viewMode ===
                      "VIEW" && (
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#446D59]">
                        ↻ Repeating{" "}
                        {
                          selectedEvent.repeat
                        }{" "}
                        event
                      </p>
                    )}
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
                    size={16}
                  />
                </button>
              </div>

              {/* ==================================================
                  VIEW MODE
              ================================================== */}

              {viewMode ===
                "VIEW" ? (
                <div className="space-y-5">
                  {/* DATE CARD */}

                  <div
                    className="rounded-2xl border p-5"
                    style={
                      selectedEvent?.sourceType ===
                      "event"
                        ? {
                            backgroundColor:
                              getEventColour(
                                selectedEvent.color
                              ).background,

                            borderColor:
                              getEventColour(
                                selectedEvent.color
                              ).border,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#52665B]">
                        When
                      </p>

                      {selectedEvent?.sourceType ===
                        "event" && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              getEventColour(
                                selectedEvent.color
                              ).dot,
                          }}
                        />
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-stone-700">
                      {selectedEvent?.startAt
                        ? selectedEvent.is_all_day
                          ? `${format(
                              selectedEvent.startAt,
                              "EEEE d MMMM yyyy"
                            )} · All day`
                          : format(
                              selectedEvent.startAt,
                              "EEEE d MMMM yyyy 'at' HH:mm"
                            )
                        : "No date"}
                    </p>

                    {selectedEvent?.endAt &&
                      !selectedEvent.is_all_day && (
                        <p className="mt-1 text-xs text-[#52665B]">
                          Until{" "}
                          {format(
                            selectedEvent.endAt,
                            "EEEE d MMMM yyyy 'at' HH:mm"
                          )}
                        </p>
                      )}

                    {selectedEvent?.endAt &&
                      selectedEvent.is_all_day &&
                      selectedEvent.startAt &&
                      !isSameDay(
                        selectedEvent.startAt,
                        selectedEvent.endAt
                      ) && (
                        <p className="mt-1 text-xs text-[#52665B]">
                          Through{" "}
                          {format(
                            selectedEvent.endAt,
                            "EEEE d MMMM yyyy"
                          )}
                        </p>
                      )}
                  </div>

                  {/* REPEAT */}

                  {selectedEvent?.repeat &&
                    selectedEvent.repeat !==
                      "none" && (
                      <div className="rounded-2xl border border-[#0F3D32]/20 bg-[#0F3D32]/5 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#446D59]">
                          Repeats
                        </p>

                        <p className="mt-2 text-sm font-semibold capitalize text-stone-700">
                          {selectedEvent.repeat ===
                          "daily"
                            ? "Every day"
                            : selectedEvent.repeat ===
                                "weekly"
                              ? "Every week"
                              : "Every month"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#60746A]">
                          This is part of a
                          repeating event
                          series. Editing or
                          deleting it changes
                          the whole series.
                        </p>
                      </div>
                    )}

                  {/* DESCRIPTION */}

                  {selectedEvent?.description && (
                    <div className="rounded-2xl bg-stone-50 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#60746A]">
                        Notes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                        {
                          selectedEvent.description
                        }
                      </p>
                    </div>
                  )}

                  {/* LINK */}

                  {selectedEvent?.meeting_link && (
                    <a
                      href={
                        selectedEvent.meeting_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-[#E1E8E1] p-5 text-sm font-semibold text-stone-700"
                    >
                      <span className="flex items-center gap-2">
                        <Video
                          size={16}
                        />

                        Join meeting
                      </span>

                      <ArrowUpRight
                        size={15}
                      />
                    </a>
                  )}

                  {getBookingCustomer(
                    selectedEvent
                  ) ? (
                    <div className="space-y-2">
                      <div className="rounded-2xl border border-[#0F3D32]/30 bg-[#0F3D32]/10 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#446D59]">
                          Customer booking
                        </p>

                        <p className="mt-2 text-sm font-semibold text-stone-700">
                          {getBookingCustomer(
                            selectedEvent
                          )?.name}
                        </p>

                        <p className="mt-1 text-xs text-[#52665B]">
                          {getBookingCustomer(
                            selectedEvent
                          )?.email}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={
                            startEditEntry
                          }
                          className="rounded-xl bg-[#103F33] py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void cancelBooking()
                          }
                          disabled={
                            isCancellingBooking
                          }
                          className="rounded-xl bg-red-50 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-red-500 disabled:opacity-50"
                        >
                          {isCancellingBooking
                            ? "Cancelling..."
                            : "Cancel meeting"}
                        </button>
                      </div>

                      <p className="text-center text-[10px] leading-4 text-[#60746A]">
                        Cancelling removes the meeting from your calendar, frees the time slot and emails the customer.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={
                          startEditEntry
                        }
                        className="rounded-xl bg-[#103F33] py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                      >
                        {selectedEvent?.isRecurringOccurrence
                          ? "Edit Series"
                          : "Edit"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteEvent()
                        }
                        disabled={
                          isDeleting
                        }
                        className="rounded-xl bg-red-50 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-red-500"
                      >
                        {isDeleting
                          ? "Deleting..."
                          : selectedEvent?.isRecurringOccurrence
                            ? "Delete Series"
                            : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ==================================================
                   CREATE / EDIT
                ================================================== */

                <div className="space-y-4">
                  {/* TITLE */}

                  <FormField label="Title">
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

                  {/* =================================================
                      EVENT COLOUR
                  ================================================= */}

                  <FormField label="Event Colour">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {EVENT_COLORS.map(
                        (
                          colour
                        ) => {
                          const active =
                            formColor ===
                            colour.id;

                          return (
                            <button
                              key={
                                colour.id
                              }
                              type="button"
                              onClick={() =>
                                setFormColor(
                                  colour.id
                                )
                              }
                              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                                active
                                  ? "ring-2 ring-stone-900/10"
                                  : "hover:border-stone-300"
                              }`}
                              style={{
                                borderColor:
                                  active
                                    ? colour.border
                                    : "#f0efec",

                                backgroundColor:
                                  active
                                    ? colour.background
                                    : "white",
                              }}
                            >
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    colour.dot,
                                }}
                              />

                              <span
                                className="truncate text-[11px] font-bold uppercase tracking-[0.08em]"
                                style={{
                                  color:
                                    active
                                      ? colour.text
                                      : "#78716c",
                                }}
                              >
                                {
                                  colour.label
                                }
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </FormField>

                  {/* =================================================
                      ALL DAY
                  ================================================= */}

                  <div className="rounded-2xl border border-[#E1E8E1] bg-stone-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-700">
                          All day
                        </p>

                        <p className="mt-1 text-[10px] text-[#60746A]">
                          Show this event
                          without a specific
                          time.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            !formAllDay;

                          setFormAllDay(
                            next
                          );

                          if (
                            next
                          ) {
                            setFormTime(
                              "00:00"
                            );

                            if (
                              !formEndDate
                            ) {
                              setFormEndDate(
                                formDate
                              );
                            }

                            setFormEndTime(
                              ""
                            );
                          } else {
                            setFormTime(
                              "09:00"
                            );
                          }
                        }}
                        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                          formAllDay
                            ? "bg-[#829473]"
                            : "bg-stone-200"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
                            formAllDay
                              ? "left-7"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      DATES
                  ================================================= */}

                  <div
                    className={`grid gap-3 ${
                      formAllDay
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-2"
                    }`}
                  >
                    <FormField label="Start Date">
                      <input
                        type="date"
                        value={
                          formDate
                        }
                        onChange={(
                          event
                        ) => {
                          const value =
                            event
                              .target
                              .value;

                          setFormDate(
                            value
                          );

                          if (
                            formAllDay &&
                            (
                              !formEndDate ||
                              formEndDate <
                                value
                            )
                          ) {
                            setFormEndDate(
                              value
                            );
                          }
                        }}
                        className="form-input"
                      />
                    </FormField>

                    {!formAllDay && (
                      <FormField label="Start Time">
                        <select
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
                        >
                          {TIME_OPTIONS.map(
                            (
                              time
                            ) => (
                              <option
                                key={
                                  time
                                }
                                value={
                                  time
                                }
                              >
                                {
                                  time
                                }
                              </option>
                            )
                          )}
                        </select>
                      </FormField>
                    )}

                    <FormField label="End Date">
                      <input
                        type="date"
                        value={
                          formEndDate
                        }
                        min={
                          formDate
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

                    {!formAllDay && (
                      <FormField label="End Time">
                        <select
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
                        >
                          <option value="">
                            No end time
                          </option>

                          {TIME_OPTIONS.map(
                            (
                              time
                            ) => (
                              <option
                                key={
                                  time
                                }
                                value={
                                  time
                                }
                              >
                                {
                                  time
                                }
                              </option>
                            )
                          )}
                        </select>
                      </FormField>
                    )}
                  </div>

                  {/* =================================================
                      REPEAT
                  ================================================= */}

                  <FormField label="Repeat Event">
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
                        Does not repeat
                      </option>

                      <option value="daily">
                        Every day
                      </option>

                      <option value="weekly">
                        Every week
                      </option>

                      <option value="monthly">
                        Every month
                      </option>
                    </select>
                  </FormField>

                  {formRepeat !==
                    "none" && (
                    <div className="rounded-xl border border-[#0F3D32]/20 bg-[#0F3D32]/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <RefreshCw
                          size={13}
                          className="mt-0.5 shrink-0 text-[#446D59]"
                        />

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#446D59]">
                            Repeating Event
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#52665B]">
                            {formRepeat ===
                            "daily"
                              ? "This event will appear on every day in your calendar."
                              : formRepeat ===
                                  "weekly"
                                ? "This event will appear on the same day every week."
                                : "This event will appear on the same date every month."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOCATION */}

                  <FormField label="Location">
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

                  {/* LINK */}

                  <FormField label="Meeting Link">
                    <div className="relative">
                      <LinkIcon
                        size={14}
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

                  {/* GUESTS */}

                  <FormField label="Guests">
                    <div className="relative">
                      <Mail
                        size={14}
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

                  {/* TEAM */}

                  <FormField label="Internal Team">
                    <div className="relative">
                      <Users
                        size={14}
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

                  {/* TAGS */}

                  <FormField label="Tags">
                    <div className="relative">
                      <Tag
                        size={14}
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

                  {/* NOTES */}

                  <FormField label="Notes">
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

                  {/* FILE */}

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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E1E8E1] bg-stone-50 p-4 text-xs text-[#52665B]"
                  >
                    <Paperclip
                      size={14}
                    />

                    {attachedFileName ||
                      "Attach file"}
                  </button>

                  {/* SAVE */}

                  <button
                    type="button"
                    onClick={() =>
                      void saveEntry()
                    }
                    disabled={
                      isSubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#103F33] py-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0F3D32] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={13}
                      />
                    )}

                    {viewMode ===
                    "EDIT"
                      ? formRepeat !==
                        "none"
                        ? "Save Event Series"
                        : "Save Changes"
                      : formRepeat !==
                          "none"
                        ? "Add Repeating Event"
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
          font-family:
            "Instrument Serif",
            serif;
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
          color: #44403c;
        }

        .form-input:focus {
          border-color: #0F3D32;
          background: white;
          box-shadow:
            0 0 0 3px
            rgba(
              169,
              184,
              151,
              0.12
            );
        }

        select.form-input {
          cursor: pointer;
          appearance: auto;
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
// FORM FIELD
// ============================================================

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#60746A]">
        {label}
      </label>

      {children}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon:
    Icon,

  value,

  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-[#E1E8E1] bg-white p-5">
      <Icon
        size={18}
        className="mb-6 text-stone-300"
      />

      <p className="text-3xl font-serif text-[#183E31]">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#60746A]">
        {label}
      </p>
    </div>
  );
}

// ============================================================
// BOOKING DETAIL
// ============================================================

function BookingDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
      <span className="text-xs text-[#60746A]">
        {label}
      </span>

      <span className="text-right text-xs font-semibold text-stone-700">
        {value}
      </span>
    </div>
  );
}

// ============================================================
// SCHEDULE ROW
// ============================================================

function ScheduleRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const colour =
    getEventColour(
      event.color
    );

  const isNormalEvent =
    event.sourceType ===
    "event";

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-transparent p-4 text-left transition hover:-translate-y-[1px] hover:shadow-sm"
      style={
        isNormalEvent
          ? {
              backgroundColor:
                colour.background,

              borderColor:
                colour.border,
            }
          : {
              backgroundColor:
                "#fafaf9",
            }
      }
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            event.sourceType ===
            "task"
              ? "bg-[#0F3D32]/20 text-[#446D59]"
              : event.sourceType ===
                  "note"
                ? "bg-amber-100 text-amber-700"
                : ""
          }`}
          style={
            isNormalEvent
              ? {
                  backgroundColor:
                    colour.dot,

                  color:
                    "white",
                }
              : undefined
          }
        >
          {event.sourceType ===
          "event" ? (
            event.isRecurringOccurrence ? (
              <RefreshCw
                size={15}
              />
            ) : (
              <CalendarDays
                size={15}
              />
            )
          ) : event.sourceType ===
            "task" ? (
            <Check
              size={15}
            />
          ) : (
            <Tag
              size={15}
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="truncate text-sm font-semibold"
              style={
                isNormalEvent
                  ? {
                      color:
                        colour.text,
                    }
                  : {
                      color:
                        "#44403c",
                    }
              }
            >
              {event.title ||
                "Untitled"}
            </p>

            {event.is_all_day && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em]"
                style={
                  isNormalEvent
                    ? {
                        backgroundColor:
                          "rgba(255,255,255,.6)",

                        color:
                          colour.text,
                      }
                    : undefined
                }
              >
                All Day
              </span>
            )}

            {event.isRecurringOccurrence && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em]"
                style={{
                  backgroundColor:
                    isNormalEvent
                      ? "rgba(255,255,255,.6)"
                      : "#e4eadf",

                  color:
                    isNormalEvent
                      ? colour.text
                      : "#829473",
                }}
              >
                Repeats
              </span>
            )}
          </div>

          <p
            className="mt-1 text-[10px]"
            style={{
              color:
                isNormalEvent
                  ? colour.text
                  : "#a8a29e",

              opacity:
                isNormalEvent
                  ? 0.7
                  : 1,
            }}
          >
            {event.startAt
              ? event.is_all_day
                ? `${format(
                    event.startAt,
                    "EEE d MMM"
                  )} • All day`
                : format(
                    event.startAt,
                    "EEE d MMM • HH:mm"
                  )
              : "No date"}
          </p>
        </div>
      </div>

      <ChevronRight
        size={15}
        className="shrink-0"
        style={{
          color:
            isNormalEvent
              ? colour.text
              : "#d6d3d1",

          opacity:
            isNormalEvent
              ? 0.55
              : 1,
        }}
      />
    </button>
  );
}

// ============================================================
// BOOKING SELECT
// ============================================================

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
            event
              .target
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
function SharingInvitations({ rows, busy, error, onRespond, onRefresh }: { rows: any[]; busy: boolean; error: string; onRespond: (id: string, action: "accepted" | "declined" | "revoked") => void; onRefresh: () => void }) {
  return <section className="rounded-2xl border border-stone-200 bg-white p-5" aria-label="Calendar invitations">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Calendar invitations</h3><button type="button" onClick={onRefresh} className="text-xs underline">Refresh</button></div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    {rows.length === 0 && <p className="mt-3 text-sm text-stone-500">No invitations yet.</p>}
    {rows.map(row => <div key={row.id} className="mt-3 rounded-xl border p-3 text-sm"><p className="font-semibold">{row.item_title || row.kind} · {row.direction === "incoming" ? "From" : "To"} {row.other_email || "another account"}</p><p className="text-stone-500">{row.kind === "event" ? "Single event" : "Booking calendar"} · {row.status}</p><div className="mt-2 flex gap-2">{row.direction === "incoming" && row.status === "pending" && <><button disabled={busy} onClick={() => onRespond(row.id, "accepted")} className="rounded-lg bg-stone-900 px-3 py-2 text-xs text-white">Accept</button><button disabled={busy} onClick={() => onRespond(row.id, "declined")} className="rounded-lg border px-3 py-2 text-xs">Decline</button></>}{row.direction === "outgoing" && ["pending", "accepted"].includes(row.status) && <button disabled={busy} onClick={() => onRespond(row.id, "revoked")} className="rounded-lg border px-3 py-2 text-xs">Revoke</button>}</div></div>)}
  </section>;
}
