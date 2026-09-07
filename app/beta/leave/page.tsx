"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Loader2,
} from "lucide-react";

// ============================================================
// INNER PAGE
// ============================================================

function BetaLeaveContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  useEffect(
    () => {
      let cancelled =
        false;

      async function processBetaExit() {
        const token =
          searchParams.get(
            "token"
          );

        if (
          !token
        ) {
          if (
            !cancelled
          ) {
            setError(
              "This link is invalid."
            );
          }

          return;
        }

        try {
          const response =
            await fetch(
              "/api/beta/extend",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    token,
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                "Unable to process your request."
            );
          }

          if (
            cancelled
          ) {
            return;
          }

          // ==================================================
          // ALREADY SUBSCRIBED
          // ==================================================

          if (
            data.alreadySubscribed
          ) {
            router.replace(
              "/manage-subscription"
            );

            return;
          }

          // ==================================================
          // SURPRISE PAGE
          // ==================================================

          const params =
            new URLSearchParams();

          if (
            data.endsAt
          ) {
            params.set(
              "ends",
              data.endsAt
            );
          }

          if (
            data.organisationName
          ) {
            params.set(
              "name",
              data.organisationName
            );
          }

          const query =
            params.toString();

          router.replace(
            query
              ? `/beta/one-more-week?${query}`
              : "/beta/one-more-week"
          );
        } catch (
          requestError
        ) {
          console.error(
            "[BETA LEAVE] Error:",
            requestError
          );

          if (
            cancelled
          ) {
            return;
          }

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Something went wrong."
          );
        }
      }

      void processBetaExit();

      return () => {
        cancelled =
          true;
      };
    },
    [
      router,
      searchParams,
    ]
  );

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

        <div className="w-full max-w-xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">

          <h1 className="font-serif text-4xl italic text-stone-900">
            We couldn&apos;t open this link.
          </h1>

          <p className="mt-4 text-sm leading-7 text-stone-500">
            {
              error
            }
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/login"
              )
            }
            className="mt-8 rounded-full bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700"
          >
            Go to TOTS-OS
          </button>

        </div>

      </main>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

      <div className="text-center">

        <Loader2
          size={36}
          className="mx-auto animate-spin text-[#A3B18A]"
        />

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
          Updating your TOTS-OS access
        </p>

      </div>

    </main>
  );
}

// ============================================================
// SUSPENSE FALLBACK
// ============================================================

function BetaLeaveFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

      <div className="text-center">

        <Loader2
          size={36}
          className="mx-auto animate-spin text-[#A3B18A]"
        />

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
          Opening your TOTS-OS account
        </p>

      </div>

    </main>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function BetaLeavePage() {
  return (
    <Suspense
      fallback={
        <BetaLeaveFallback />
      }
    >
      <BetaLeaveContent />
    </Suspense>
  );
}