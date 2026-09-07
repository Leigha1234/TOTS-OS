"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

export default function OneMoreWeekPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const ends =
    searchParams.get(
      "ends"
    );

  const organisationName =
    searchParams.get(
      "name"
    );

  const formattedDate =
    ends
      ? new Date(
          ends
        ).toLocaleDateString(
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
      : null;

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-16 md:px-10">

      <div className="mx-auto max-w-3xl">

        <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-sm md:p-14">

          <div className="inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-4 py-2">

            <Sparkles
              size={13}
              className="text-[#82936b]"
            />

            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#748361]">
              Before you go...
            </span>

          </div>

          <h1 className="mt-7 font-serif text-5xl italic tracking-tight text-stone-900 md:text-6xl">
            We&apos;re giving you one more week.
          </h1>

          {organisationName && (
            <p className="mt-4 text-sm font-semibold text-stone-700">
              {organisationName}
            </p>
          )}

          <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
            We&apos;re not quite ready to say goodbye.
            We&apos;ve added another 7 days of TOTS-OS
            access to your account, completely free.
          </p>

          <div className="mt-8 rounded-2xl border border-[#cdd7c3] bg-[#edf1e8] p-5">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">

                <Check
                  size={14}
                  strokeWidth={3}
                  className="text-[#82936b]"
                />

              </div>

              <div>

                <p className="text-sm font-semibold text-stone-700">
                  Your account is staying active.
                </p>

                {formattedDate && (
                  <p className="mt-1 text-xs text-stone-500">
                    Your extra access runs until{" "}
                    <strong>
                      {formattedDate}
                    </strong>.
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-stone-500">
                  No payment details. No commitment.
                  Just another chance to properly explore
                  anything you haven&apos;t tried yet.
                </p>

              </div>

            </div>

          </div>

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
                  "/settings/billing"
                )
              }
              className="rounded-full border border-stone-200 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-700 transition hover:bg-stone-50"
            >
              Actually, I&apos;m ready to stay
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}