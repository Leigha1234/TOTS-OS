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
  Check,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type PendingRegistration = {
  email?: string;
  password?: string;

  full_name?: string;
  company_name?: string;
  job_title?: string;

  subscription_tier?: string;

  [key: string]: unknown;
};

type FinaliseResponse = {
  success?: boolean;

  userId?: string | null;
  organisationId?: string | null;

  email?: string | null;

  message?: string;
  error?: string;
};

// ============================================================
// SUCCESS HANDLER
// ============================================================

function SuccessHandler() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const sessionId =
    searchParams.get(
      "session_id"
    );

  const [
    status,
    setStatus,
  ] = useState<
    | "finalising"
    | "signing-in"
    | "redirecting"
  >("finalising");

  const [
    message,
    setMessage,
  ] = useState(
    "Creating your TOTS-OS workspace..."
  );

  useEffect(() => {
    let cancelled =
      false;

    // ==========================================================
    // FINALISE + SIGN IN
    // ==========================================================

    const completeSignup =
      async () => {
        try {
          // ====================================================
          // SESSION ID CHECK
          // ====================================================

          if (
            !sessionId
          ) {
            throw new Error(
              "Missing checkout session."
            );
          }

          // ====================================================
          // READ REGISTRATION DETAILS BEFORE API CALL
          //
          // We need the password to sign the browser into
          // Supabase after the server creates the account.
          // ====================================================

          const storedRegistration =
            sessionStorage.getItem(
              "pendingRegistration"
            );

          if (
            !storedRegistration
          ) {
            throw new Error(
              "Your registration details could not be found."
            );
          }

          let registration:
            PendingRegistration;

          try {
            registration =
              JSON.parse(
                storedRegistration
              ) as PendingRegistration;
          } catch {
            throw new Error(
              "Your saved registration details are invalid."
            );
          }

          const email =
            String(
              registration.email ||
                ""
            ).trim();

          const password =
            String(
              registration.password ||
                ""
            );

          if (
            !email
          ) {
            throw new Error(
              "Your signup email could not be found."
            );
          }

          if (
            !password
          ) {
            throw new Error(
              "Your signup password could not be found."
            );
          }

          // ====================================================
          // FINALISE REGISTRATION
          // ====================================================

          if (
            !cancelled
          ) {
            setStatus(
              "finalising"
            );

            setMessage(
              "Creating your TOTS-OS workspace..."
            );
          }

          const response =
            await fetch(
              "/api/auth/finalise-registration",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    sessionId,
                  }),

                cache:
                  "no-store",
              }
            );

          const data =
            (await response
              .json()
              .catch(
                () => ({})
              )) as FinaliseResponse;

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                "Registration could not be completed."
            );
          }

          if (
            data.success ===
            false
          ) {
            throw new Error(
              data.error ||
                data.message ||
                "Registration could not be completed."
            );
          }

          // ====================================================
          // SIGN USER INTO SUPABASE
          // ====================================================

          if (
            !cancelled
          ) {
            setStatus(
              "signing-in"
            );

            setMessage(
              "Signing you into TOTS-OS..."
            );
          }

          const {
            data:
              signInData,
            error:
              signInError,
          } =
            await supabase.auth.signInWithPassword(
              {
                email,
                password,
              }
            );

          if (
            signInError
          ) {
            console.error(
              "Automatic sign-in failed:",
              signInError
            );

            throw new Error(
              signInError.message ||
                "Your account was created, but automatic sign-in failed."
            );
          }

          if (
            !signInData.session
          ) {
            throw new Error(
              "Your account was created, but no login session was returned."
            );
          }

          // ====================================================
          // DOUBLE CHECK SESSION
          // ====================================================

          const {
            data:
              sessionData,
            error:
              sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError
          ) {
            console.error(
              "Session confirmation failed:",
              sessionError
            );

            throw new Error(
              "Your account was created, but your login session could not be confirmed."
            );
          }

          if (
            !sessionData.session
          ) {
            throw new Error(
              "Your account was created, but your login session is missing."
            );
          }

          // ====================================================
          // CLEAN UP TEMPORARY SIGNUP DATA
          // ====================================================

          sessionStorage.removeItem(
            "pendingRegistration"
          );

          // ====================================================
          // REDIRECT
          // ====================================================

          if (
            !cancelled
          ) {
            setStatus(
              "redirecting"
            );

            setMessage(
              "You're in — opening your dashboard..."
            );
          }

          /*
           * Your file:
           *
           * app/(dashboard)/dashboard/page.tsx
           *
           * resolves to:
           *
           * /dashboard
           *
           * because (dashboard) is a route group and is not
           * included in the public URL.
           */

          window.location.replace(
            "/dashboard"
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Registration finalisation error:",
            error
          );

          if (
            cancelled
          ) {
            return;
          }

          const errorMessage =
            error instanceof
            Error
              ? error.message
              : "Registration could not be completed.";

          /*
           * Preserve the error so the login page can show
           * something useful if required.
           */

          const params =
            new URLSearchParams({
              registration_error:
                "true",

              message:
                errorMessage,
            });

          router.replace(
            `/login?${params.toString()}`
          );
        }
      };

    void completeSignup();

    return () => {
      cancelled =
        true;
    };
  }, [
    sessionId,
    router,
  ]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex flex-col items-center text-center">

      {/* ICON */}

      <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-stone-200 bg-white shadow-sm">

        {status ===
        "redirecting" ? (
          <Check
            size={26}
            strokeWidth={2.5}
            className="text-[#829473]"
          />
        ) : (
          <Loader2
            size={28}
            className="animate-spin text-[#829473]"
          />
        )}

      </div>

      {/* EYEBROW */}

      <p className="mt-7 text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">
        TOTS-OS
      </p>

      {/* TITLE */}

      <h1 className="mt-3 max-w-xl font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">
        {status ===
        "redirecting"
          ? "Your workspace is ready."
          : "Setting everything up."}
      </h1>

      {/* MESSAGE */}

      <p className="mt-4 max-w-md text-sm leading-7 text-stone-500">
        {
          message
        }
      </p>

      {/* STEPS */}

      <div className="mt-8 w-full max-w-sm rounded-[1.5rem] border border-stone-200 bg-white p-5 text-left shadow-sm">

        <ProgressRow
          label="Create your account"
          complete={
            status ===
              "signing-in" ||
            status ===
              "redirecting"
          }
          active={
            status ===
            "finalising"
          }
        />

        <ProgressRow
          label="Start your secure session"
          complete={
            status ===
            "redirecting"
          }
          active={
            status ===
            "signing-in"
          }
        />

        <ProgressRow
          label="Open your dashboard"
          complete={
            status ===
            "redirecting"
          }
          active={
            status ===
            "redirecting"
          }
          last
        />

      </div>

    </div>
  );
}

// ============================================================
// PROGRESS ROW
// ============================================================

function ProgressRow({
  label,
  active,
  complete,
  last = false,
}: {
  label: string;
  active: boolean;
  complete: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        !last
          ? "mb-4 border-b border-stone-100 pb-4"
          : ""
      }`}
    >

      <div
        className={`
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full

          ${
            complete
              ? "bg-[#edf1e8] text-[#829473]"
              : active
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-300"
          }
        `}
      >

        {complete ? (
          <Check
            size={13}
            strokeWidth={3}
          />
        ) : active ? (
          <Loader2
            size={12}
            className="animate-spin"
          />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}

      </div>

      <p
        className={`text-xs ${
          active ||
          complete
            ? "font-semibold text-stone-700"
            : "text-stone-400"
        }`}
      >
        {
          label
        }
      </p>

    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf7] px-5 py-12">

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 text-center">

            <Loader2
              className="animate-spin text-[#829473]"
              size={40}
            />

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              Loading your registration...
            </p>

          </div>
        }
      >

        <SuccessHandler />

      </Suspense>

      <style jsx global>{`
        @import url(
          "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap"
        );

        .font-serif {
          font-family:
            "Instrument Serif",
            Georgia,
            serif;
        }
      `}</style>

    </main>
  );
}