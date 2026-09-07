"use client";

import {
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

export default function BetaLeavePage() {
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
      async function processBetaExit() {
        const token =
          searchParams.get(
            "token"
          );

        if (
          !token
        ) {
          setError(
            "This link is invalid."
          );

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
            data.alreadySubscribed
          ) {
            router.replace(
              "/settings/billing"
            );

            return;
          }

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

          router.replace(
            `/beta/one-more-week?${params.toString()}`
          );
        } catch (
          error
        ) {
          console.error(
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Something went wrong."
          );
        }
      }

      void processBetaExit();
    },
    [
      router,
      searchParams,
    ]
  );

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
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/login"
              )
            }
            className="mt-8 rounded-full bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Go to TOTS-OS
          </button>

        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

      <div className="text-center">

        <Loader2
          size={36}
          className="mx-auto animate-spin text-[#A3B18A]"
        />

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">
          Updating your TOTS-OS access
        </p>

      </div>

    </main>
  );
}