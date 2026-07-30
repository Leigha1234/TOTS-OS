"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/auth";

interface BookingClientProps {
  bookingPage: {
    id: string;
    user_id: string;
    title: string;
    duration_minutes: number;
    location_type: string;
    location_value?: string | null;
    availability: Record<string, { start: string; end: string }[]>;
    min_notice_hours: number;
    max_days_ahead: number;
    timezone: string;
  };
}

export default function BookingClient({ bookingPage }: BookingClientProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  const dates = useMemo(() => {
    const result: string[] = [];
    const start = new Date();
    start.setDate(start.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const day = date
        .toLocaleDateString("en-GB", { weekday: "short" })
        .toLowerCase()
        .slice(0, 3);

      if (bookingPage.availability?.[day]?.length) {
        result.push(date.toISOString().split("T")[0]);
      }
    }

    return result;
  }, [bookingPage, weekOffset]);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];

    const day = new Date(selectedDate)
      .toLocaleDateString("en-GB", { weekday: "short" })
      .toLowerCase()
      .slice(0, 3);

    const slots: string[] = [];
    const ranges = bookingPage.availability?.[day] || [];

    ranges.forEach((range) => {
      let current = new Date(`${selectedDate}T${range.start}`);
      const end = new Date(`${selectedDate}T${range.end}`);

      while (current < end) {
        slots.push(
          current.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        current = new Date(
          current.getTime() + bookingPage.duration_minutes * 60000
        );
      }
    });

    return slots;
  }, [selectedDate, bookingPage]);

  async function createBooking() {
    if (!selectedDate || !selectedTime || !name || !email) {
      setMessage("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const start = new Date(`${selectedDate}T${selectedTime}`);
      const end = new Date(
        start.getTime() + bookingPage.duration_minutes * 60000
      );

      const { error: bookingError } = await supabase.from("events").insert({
        user_id: bookingPage.user_id,
        title: `${bookingPage.title} - ${name}`,
        description: `Booking requested by ${name} (${email})`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: bookingPage.location_value,
      });

      if (bookingError) {
        console.error("EVENT INSERT ERROR:", JSON.stringify(bookingError, null, 2));
        throw new Error(bookingError.message || "Unable to create booking event");
      }

      const emailResponse = await fetch("/api/bookings/confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          bookingTitle: bookingPage.title,
          date: selectedDate,
          time: selectedTime,
          duration: bookingPage.duration_minutes,
          location: bookingPage.location_value,
          ownerUserId: bookingPage.user_id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      const emailResult = await emailResponse.json().catch(() => null);

      if (!emailResponse.ok) {
        console.error("BOOKING EMAIL ERROR:", JSON.stringify(emailResult, null, 2));
        throw new Error(emailResult?.error || "Unable to send confirmation emails");
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        "CREATE BOOKING ERROR:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      );
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong creating your booking."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-green-50 p-8 text-center">
        <h2 className="text-2xl font-semibold">Booking confirmed</h2>
        <p className="mt-2 text-neutral-600">
          Your meeting has been added to the calendar and a confirmation email has been sent.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose a date</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((value) => Math.max(0, value - 1))}
              className="rounded-lg border px-3 py-1"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((value) => value + 1)}
              className="rounded-lg border px-3 py-1"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          {dates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`rounded-xl border p-3 text-left ${
                selectedDate === date ? "border-black" : ""
              }`}
            >
              {new Date(date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Choose a time</h2>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {availableTimes.length ? (
            availableTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`rounded-xl border p-3 transition ${
                  selectedTime === time
                    ? "border-black bg-black text-white"
                    : "hover:border-black"
                }`}
              >
                {time}
              </button>
            ))
          ) : (
            <p className="col-span-2 text-sm text-neutral-500">
              Select a date to view available times.
            </p>
          )}
        </div>

        {selectedDate && selectedTime && (
          <div className="mb-6 rounded-2xl border bg-neutral-50 p-5">
            <h3 className="mb-3 font-semibold">Booking summary</h3>
            <p><strong>Meeting:</strong> {bookingPage.title}</p>
            <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString("en-GB")}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            <p><strong>Duration:</strong> {bookingPage.duration_minutes} minutes</p>
          </div>
        )}

        <div className="space-y-3">
          <input className="w-full rounded-xl border p-3" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded-xl border p-3" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />

          {message && <p className="text-sm text-red-600">{message}</p>}

          <button
            type="button"
            onClick={createBooking}
            disabled={loading || !selectedDate || !selectedTime || !name || !email}
            className="w-full rounded-xl bg-black p-3 text-white disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}