"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/auth";

// ==================================================
// TYPES
// ==================================================

interface BookingOwner {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface BookingClientProps {
  bookingPage: {
    id: string;
    user_id: string;
    title: string;
    duration_minutes: number;

    location_type: string;

    location_value?:
      | string
      | null;

    video_provider?:
      | string
      | null;

    video_link?:
      | string
      | null;

    availability: Record<
      string,
      {
        start: string;
        end: string;
      }[]
    >;

    min_notice_hours: number;
    max_days_ahead: number;
    timezone: string;
  };

  owner: BookingOwner;
}

// ==================================================
// HELPERS
// ==================================================

function getMeetingProviderLabel(
  provider?: string | null
) {
  switch (provider) {
    case "google_meet":
      return "🟢 Google Meet";

    case "zoom":
      return "🔵 Zoom";

    case "teams":
      return "🟣 Microsoft Teams";

    case "custom":
      return "🔗 Online meeting";

    default:
      return "💻 Online meeting";
  }
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

// ==================================================
// COMPONENT
// ==================================================

export default function BookingClient({
  bookingPage,
  owner,
}: BookingClientProps) {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedTime,
    setSelectedTime,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    meetingOption,
    setMeetingOption,
  ] = useState<
    "online" | "in_person"
  >(
    bookingPage.location_type ===
      "in_person"
      ? "in_person"
      : "online"
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    weekOffset,
    setWeekOffset,
  ] = useState(0);

  const [
    bookedTimes,
    setBookedTimes,
  ] = useState<string[]>([]);

  // ==================================================
  // RESET SELECTED TIME
  // ==================================================

  useEffect(() => {
    setSelectedTime("");
  }, [
    selectedDate,
  ]);

  // ==================================================
  // FORCE CORRECT MEETING TYPE
  // ==================================================

  useEffect(() => {
    if (
      bookingPage.location_type ===
      "in_person"
    ) {
      setMeetingOption(
        "in_person"
      );

      return;
    }

    if (
      bookingPage.location_type ===
        "video" ||
      bookingPage.location_type ===
        "phone"
    ) {
      setMeetingOption(
        "online"
      );
    }
  }, [
    bookingPage.location_type,
  ]);

  // ==================================================
  // LOAD EXISTING BOOKINGS
  // ==================================================

  useEffect(() => {
    async function loadBookedTimes() {
      if (
        !selectedDate
      ) {
        setBookedTimes([]);

        return;
      }

      const supabase =
        createClient();

      try {
        const startOfDay =
          new Date(
            `${selectedDate}T00:00:00`
          ).toISOString();

        const endOfDay =
          new Date(
            `${selectedDate}T23:59:59`
          ).toISOString();

        const {
          data,
          error,
        } = await supabase
          .from("events")
          .select(
            "start_time,end_time"
          )
          .eq(
            "user_id",
            bookingPage.user_id
          )
          .lt(
            "start_time",
            endOfDay
          )
          .gt(
            "end_time",
            startOfDay
          );

        if (error) {
          console.error(
            "LOAD BOOKED TIMES ERROR:",
            error
          );

          setBookedTimes([]);

          return;
        }

        setBookedTimes(
          (
            data || []
          ).map(
            (
              event: any
            ) =>
              new Date(
                event.start_time
              ).toLocaleTimeString(
                "en-GB",
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",

                  hour12:
                    false,
                }
              )
          )
        );
      } catch (error) {
        console.error(
          "LOAD BOOKED TIMES ERROR:",
          error
        );

        setBookedTimes(
          []
        );
      }
    }

    void loadBookedTimes();
  }, [
    selectedDate,
    bookingPage.user_id,
  ]);

  // ==================================================
  // AVAILABLE DATES
  // ==================================================

  const dates =
    useMemo(() => {
      const result:
        string[] = [];

      const now =
        new Date();

      const start =
        new Date();

      start.setHours(
        12,
        0,
        0,
        0
      );

      start.setDate(
        start.getDate() +
          weekOffset * 7
      );

      for (
        let i = 0;
        i < 7;
        i += 1
      ) {
        const date =
          new Date(start);

        date.setDate(
          start.getDate() +
            i
        );

        // Do not show dates outside the configured
        // booking horizon.

        const maxDate =
          new Date(now);

        maxDate.setDate(
          now.getDate() +
            bookingPage.max_days_ahead
        );

        maxDate.setHours(
          23,
          59,
          59,
          999
        );

        if (
          date >
          maxDate
        ) {
          continue;
        }

        const day =
          date
            .toLocaleDateString(
              "en-GB",
              {
                weekday:
                  "short",
              }
            )
            .toLowerCase()
            .slice(
              0,
              3
            );

        if (
          bookingPage
            .availability?.[
            day
          ]?.length
        ) {
          const year =
            date.getFullYear();

          const month =
            String(
              date.getMonth() +
                1
            ).padStart(
              2,
              "0"
            );

          const dayNumber =
            String(
              date.getDate()
            ).padStart(
              2,
              "0"
            );

          result.push(
            `${year}-${month}-${dayNumber}`
          );
        }
      }

      return result;
    }, [
      bookingPage.availability,
      bookingPage.max_days_ahead,
      weekOffset,
    ]);

  // ==================================================
  // AVAILABLE TIMES
  // ==================================================

  const availableTimes =
    useMemo(() => {
      if (
        !selectedDate
      ) {
        return [];
      }

      const selected =
        new Date(
          `${selectedDate}T00:00:00`
        );

      const day =
        selected
          .toLocaleDateString(
            "en-GB",
            {
              weekday:
                "short",
            }
          )
          .toLowerCase()
          .slice(
            0,
            3
          );

      const slots:
        string[] = [];

      const ranges =
        bookingPage
          .availability?.[
          day
        ] || [];

      const now =
        Date.now();

      const minimumBookingTime =
        now +
        bookingPage.min_notice_hours *
          60 *
          60 *
          1000;

      ranges.forEach(
        (range) => {
          const [
            startHour,
            startMinute,
          ] =
            range.start
              .split(":")
              .map(Number);

          const [
            endHour,
            endMinute,
          ] =
            range.end
              .split(":")
              .map(Number);

          let currentMinutes =
            startHour *
              60 +
            startMinute;

          const endMinutes =
            endHour *
              60 +
            endMinute;

          while (
            currentMinutes +
              bookingPage.duration_minutes <=
            endMinutes
          ) {
            const hours =
              Math.floor(
                currentMinutes /
                  60
              )
                .toString()
                .padStart(
                  2,
                  "0"
                );

            const minutes =
              (
                currentMinutes %
                60
              )
                .toString()
                .padStart(
                  2,
                  "0"
                );

            const slotTime =
              `${hours}:${minutes}`;

            const slotDateTime =
              new Date(
                `${selectedDate}T${slotTime}:00`
              );

            const respectsNotice =
              slotDateTime.getTime() >=
              minimumBookingTime;

            if (
              respectsNotice &&
              !bookedTimes.includes(
                slotTime
              )
            ) {
              slots.push(
                slotTime
              );
            }

            currentMinutes +=
              bookingPage.duration_minutes;
          }
        }
      );

      return Array.from(
        new Set(slots)
      );
    }, [
      selectedDate,
      bookingPage.availability,
      bookingPage.duration_minutes,
      bookingPage.min_notice_hours,
      bookedTimes,
    ]);

  // ==================================================
  // CREATE BOOKING
  // ==================================================

  async function createBooking() {
    if (
      !selectedDate ||
      !selectedTime ||
      !name.trim() ||
      !email.trim()
    ) {
      setMessage(
        "Please complete all required fields."
      );

      return;
    }

    if (
      !isValidEmail(
        email
      )
    ) {
      setMessage(
        "Please enter a valid email address."
      );

      return;
    }

    setLoading(
      true
    );

    setMessage(
      ""
    );

    try {
      const supabase =
        createClient();

      const start =
        new Date(
          `${selectedDate}T${selectedTime}:00`
        );

      const end =
        new Date(
          start.getTime() +
            bookingPage.duration_minutes *
              60000
        );

      // ==============================================
      // DOUBLE CHECK SLOT IS STILL AVAILABLE
      // ==============================================

      const {
        data:
          conflictingEvents,
        error:
          conflictError,
      } = await supabase
        .from("events")
        .select(
          "id,start_time,end_time"
        )
        .eq(
          "user_id",
          bookingPage.user_id
        )
        .lt(
          "start_time",
          end.toISOString()
        )
        .gt(
          "end_time",
          start.toISOString()
        );

      if (
        conflictError
      ) {
        console.error(
          "BOOKING CONFLICT CHECK ERROR:",
          conflictError
        );

        throw new Error(
          "We couldn't confirm this time is still available."
        );
      }

      if (
        conflictingEvents &&
        conflictingEvents.length >
          0
      ) {
        setSelectedTime(
          ""
        );

        setMessage(
          "Sorry, that time has just been booked. Please choose another."
        );

        return;
      }

      // ==============================================
      // LOCATION
      // ==============================================

      const location =
        meetingOption ===
        "online"
          ? `${getMeetingProviderLabel(
              bookingPage.video_provider
            )}: ${
              bookingPage.video_link ||
              "Link will be provided"
            }`
          : bookingPage.location_value ||
            "In person";

      // ==============================================
      // CREATE EVENT
      // ==============================================

      const {
        data:
          insertedEvent,
        error:
          bookingError,
      } = await supabase
        .from("events")
        .insert({
          user_id:
            bookingPage.user_id,

          title:
            `${bookingPage.title} - ${name.trim()}`,

          description:
            `Booking requested by ${name.trim()} (${email
              .trim()
              .toLowerCase()})`,

          start_time:
            start.toISOString(),

          end_time:
            end.toISOString(),

          location,
        })
        .select(
          "id,start_time,end_time"
        )
        .single();

      if (
        bookingError
      ) {
        console.error(
          "EVENT INSERT ERROR:",
          JSON.stringify(
            bookingError,
            null,
            2
          )
        );

        throw new Error(
          bookingError.message ||
            "Unable to create booking event"
        );
      }

      // ==============================================
      // SEND CUSTOMER + OWNER EMAILS
      // ==============================================

      const emailResponse =
        await fetch(
          "/api/bookings/confirmation",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                bookingPageId:
                  bookingPage.id,

                eventId:
                  insertedEvent.id,

                customerName:
                  name.trim(),

                customerEmail:
                  email
                    .trim()
                    .toLowerCase(),

                bookingTitle:
                  bookingPage.title,

                date:
                  selectedDate,

                time:
                  selectedTime,

                duration:
                  bookingPage.duration_minutes,

                location,

                meetingOption,

                meetingLink:
                  meetingOption ===
                  "online"
                    ? bookingPage.video_link ||
                      null
                    : null,

                ownerUserId:
                  bookingPage.user_id,

                ownerName:
                  owner.full_name,

                ownerEmail:
                  owner.email,

                startTime:
                  start.toISOString(),

                endTime:
                  end.toISOString(),

                timezone:
                  bookingPage.timezone,
              }),
          }
        );

      const emailResult =
        await emailResponse
          .json()
          .catch(
            () => null
          );

      if (
        !emailResponse.ok
      ) {
        console.error(
          "BOOKING EMAIL ERROR:",
          JSON.stringify(
            emailResult,
            null,
            2
          )
        );

        /*
         * The booking already exists at this point.
         * We should NOT tell the customer their booking
         * failed merely because an email notification failed.
         */

        setSuccess(
          true
        );

        setMessage(
          "Your booking was created, but there was a problem sending one of the confirmation emails."
        );

        return;
      }

      setSuccess(
        true
      );
    } catch (error) {
      console.error(
        "CREATE BOOKING ERROR:",
        error instanceof
          Error
          ? error.message
          : JSON.stringify(
              error,
              null,
              2
            )
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Something went wrong creating your booking."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // ==================================================
  // SUCCESS
  // ==================================================

  if (success) {
    return (
      <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8 text-center sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>

        <h2 className="text-2xl font-semibold text-stone-900">
          Booking confirmed
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">
          Your meeting with{" "}
          {owner.full_name ||
            "the organiser"}{" "}
          has been added to the
          calendar.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-5 text-left text-sm shadow-sm">
          <p>
            <strong>
              Date:
            </strong>{" "}
            {new Date(
              `${selectedDate}T12:00:00`
            ).toLocaleDateString(
              "en-GB",
              {
                weekday:
                  "long",

                day:
                  "numeric",

                month:
                  "long",

                year:
                  "numeric",
              }
            )}
          </p>

          <p className="mt-2">
            <strong>
              Time:
            </strong>{" "}
            {selectedTime}
          </p>

          <p className="mt-2">
            <strong>
              Duration:
            </strong>{" "}
            {
              bookingPage.duration_minutes
            }{" "}
            minutes
          </p>
        </div>

        <p className="mt-6 text-xs text-stone-500">
          A confirmation email
          has been sent to{" "}
          <strong>
            {email}
          </strong>
          .
        </p>

        {message && (
          <p className="mt-3 text-xs text-amber-700">
            {message}
          </p>
        )}
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="grid gap-8 md:grid-cols-2">

      {/* ==================================================
          DATE
      ================================================== */}

      <div>
        <div className="mb-5 flex items-center justify-between">

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">
              Step 1
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              Choose a date
            </h2>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              disabled={
                weekOffset ===
                0
              }
              onClick={() =>
                setWeekOffset(
                  (
                    value
                  ) =>
                    Math.max(
                      0,
                      value -
                        1
                    )
                )
              }
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-stone-600 transition hover:bg-stone-50 disabled:opacity-30"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() =>
                setWeekOffset(
                  (
                    value
                  ) =>
                    value +
                    1
                )
              }
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-stone-600 transition hover:bg-stone-50"
            >
              →
            </button>

          </div>
        </div>

        <div className="grid gap-3">

          {dates.length ===
            0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center">
              <p className="text-sm text-stone-400">
                No booking
                dates are
                available in
                this week.
              </p>
            </div>
          )}

          {dates.map(
            (date) => (
              <button
                key={
                  date
                }
                type="button"
                onClick={() =>
                  setSelectedDate(
                    date
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedDate ===
                  date
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <p className="font-semibold">
                  {new Date(
                    `${date}T12:00:00`
                  ).toLocaleDateString(
                    "en-GB",
                    {
                      weekday:
                        "long",

                      day:
                        "numeric",

                      month:
                        "long",
                    }
                  )}
                </p>
              </button>
            )
          )}

        </div>
      </div>

      {/* ==================================================
          TIME + DETAILS
      ================================================== */}

      <div>

        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">
            Step 2
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Choose a time
          </h2>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">

          {selectedDate &&
          availableTimes.length ===
            0 ? (
            <p className="col-span-2 rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">
              There are no
              available times
              remaining on this
              date.
            </p>
          ) : availableTimes.length ? (
            availableTimes.map(
              (
                time
              ) => (
                <button
                  key={
                    time
                  }
                  type="button"
                  onClick={() =>
                    setSelectedTime(
                      time
                    )
                  }
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    selectedTime ===
                    time
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 hover:border-stone-900"
                  }`}
                >
                  {
                    time
                  }
                </button>
              )
            )
          ) : (
            <p className="col-span-2 rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">
              Select a date to
              view available
              times.
            </p>
          )}

        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        {selectedDate &&
          selectedTime && (
            <div className="mb-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">

              <p className="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">
                Your Booking
              </p>

              <div className="space-y-2 text-sm text-stone-700">

                <p>
                  <strong>
                    Meeting:
                  </strong>{" "}
                  {
                    bookingPage.title
                  }
                </p>

                {owner.full_name && (
                  <p>
                    <strong>
                      With:
                    </strong>{" "}
                    {
                      owner.full_name
                    }
                  </p>
                )}

                <p>
                  <strong>
                    Date:
                  </strong>{" "}
                  {new Date(
                    `${selectedDate}T12:00:00`
                  ).toLocaleDateString(
                    "en-GB"
                  )}
                </p>

                <p>
                  <strong>
                    Time:
                  </strong>{" "}
                  {
                    selectedTime
                  }
                </p>

                <p>
                  <strong>
                    Duration:
                  </strong>{" "}
                  {
                    bookingPage.duration_minutes
                  }{" "}
                  minutes
                </p>

              </div>

              {/* ============================================
                  MEETING TYPE
              ============================================ */}

              {bookingPage.location_type ===
                "both" && (
                <div className="mt-5">

                  <p className="mb-2 text-sm font-semibold">
                    Meeting type
                  </p>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setMeetingOption(
                          "online"
                        )
                      }
                      className={`rounded-xl border px-4 py-2 text-sm ${
                        meetingOption ===
                        "online"
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white"
                      }`}
                    >
                      Online
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setMeetingOption(
                          "in_person"
                        )
                      }
                      className={`rounded-xl border px-4 py-2 text-sm ${
                        meetingOption ===
                        "in_person"
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white"
                      }`}
                    >
                      In person
                    </button>

                  </div>
                </div>
              )}

              {meetingOption ===
                "online" &&
                bookingPage.location_type !==
                  "in_person" && (
                  <p className="mt-4 text-sm text-stone-600">
                    {getMeetingProviderLabel(
                      bookingPage.video_provider
                    )}
                  </p>
                )}

              {meetingOption ===
                "in_person" &&
                bookingPage.location_value && (
                  <p className="mt-4 text-sm text-stone-600">
                    📍{" "}
                    {
                      bookingPage.location_value
                    }
                  </p>
                )}

            </div>
          )}

        {/* ==================================================
            CUSTOMER DETAILS
        ================================================== */}

        <div className="space-y-3">

          <input
            className="w-full rounded-xl border border-stone-200 bg-white p-4 text-sm outline-none transition focus:border-stone-900"
            placeholder="Your name"
            value={
              name
            }
            onChange={(
              event
            ) =>
              setName(
                event.target
                  .value
              )
            }
          />

          <input
            type="email"
            className="w-full rounded-xl border border-stone-200 bg-white p-4 text-sm outline-none transition focus:border-stone-900"
            placeholder="Email address"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target
                  .value
              )
            }
          />

          {message && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {
                message
              }
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              void createBooking()
            }
            disabled={
              loading ||
              !selectedDate ||
              !selectedTime ||
              !name.trim() ||
              !email.trim()
            }
            className="w-full rounded-xl bg-stone-900 p-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Confirming..."
              : "Confirm Booking"}
          </button>

        </div>
      </div>
    </div>
  );
}