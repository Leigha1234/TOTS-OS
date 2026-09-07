"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

// ============================================================
// PAGE
// ============================================================

export default function OneMoreWeekPage() {
  const router =
    useRouter();

  const [
    organisationName,
    setOrganisationName,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    formattedDate,
    setFormattedDate,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // READ QUERY STRING CLIENT-SIDE
  // ==========================================================

  useEffect(
    () => {
      const params =
        new URLSearchParams(
          window.location.search
        );

      const ends =
        params.get(
          "ends"
        );

      const name =
        params.get(
          "name"
        );

      if (
        name
      ) {
        setOrganisationName(
          name
        );
      }

      if (
        ends
      ) {
        const date =
          new Date(
            ends
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          setFormattedDate(
            date.toLocaleDateString(
              "en-GB",
              {
                day:
                  "numeric",

                month:
                  "long",

                year:
                  "numeric",
              }
            )
          );
        }
      }
    },
    []
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-16 md:px-10">

      <div className="mx-auto max-w-3xl">

        <div className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(28,25,23,0.06)]">

          {/* ==================================================
              TOP
          ================================================== */}

          <div className="border-b border-stone-100 p-8 md:p-14">

            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-4 py-2">

              <Sparkles
                size={13}
                className="text-[#82936b]"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#748361]">
                Before you go...
              </span>

            </div>

            <h1 className="mt-8 max-w-2xl font-serif text-5xl italic tracking-tight text-stone-900 md:text-7xl">
              We&apos;re giving you one more week.
            </h1>

            {organisationName && (
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#829473]">
                {
                  organisationName
                }
              </p>
            )}

            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              We&apos;re not quite ready to say goodbye.
            </p>

            <p className="mt-3 max-w-2xl text-base leading-8 text-stone-500">
              We&apos;ve added another{" "}
              <strong className="font-semibold text-stone-800">
                7 days of TOTS-OS
              </strong>{" "}
              to your account, completely free.
            </p>

          </div>

          {/* ==================================================
              EXTENSION DETAILS
          ================================================== */}

          <div className="p-8 md:p-14">

            <div className="rounded-[2rem] border border-[#cdd7c3] bg-[#edf1e8] p-6 md:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">

                  <Check
                    size={17}
                    strokeWidth={3}
                    className="text-[#82936b]"
                  />

                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#748361]">
                    Your access is staying active
                  </p>

                  {formattedDate && (
                    <p className="mt-4 text-sm font-semibold text-stone-700">
                      Your additional access runs until{" "}
                      {
                        formattedDate
                      }.
                    </p>
                  )}

                  <p className="mt-3 max-w-xl text-xs leading-6 text-stone-500">
                    No payment details.
                    No commitment.
                    Just another week to properly use TOTS-OS
                    and see whether it earns its place in your
                    business.
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                EXTRA MESSAGE
            ================================================== */}

            <div className="mt-8">

              <p className="font-serif text-3xl italic text-stone-800">
                Make the most of it.
              </p>

              <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
                Have another look around, try the tools you
                haven&apos;t used yet and see how TOTS-OS fits
                into the way you actually run your business.
              </p>

            </div>

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700"
              >
                Take me back to TOTS-OS

                <ArrowRight
                  size={13}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/manage-subscription"
                  )
                }
                className="rounded-full border border-stone-200 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#a9b897] hover:bg-[#edf1e8]"
              >
                Actually, I&apos;m ready to stay
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}