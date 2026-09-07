"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  createBrowserClient,
} from "@supabase/ssr";

// ============================================================
// TYPES
// ============================================================

type PaidTier =
  | "standard"
  | "professional"
  | "elite";

// ============================================================
// HELPERS
// ============================================================

function isPaidTier(
  value: unknown
): value is PaidTier {
  const tier =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  return (
    tier ===
      "standard" ||
    tier ===
      "professional" ||
    tier ===
      "elite"
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AccessEndedPage() {
  const router =
    useRouter();

  const [
    checkingAccess,
    setCheckingAccess,
  ] =
    useState(
      true
    );

  // ==========================================================
  // CHECK WHETHER USER HAS SINCE PAID
  // ==========================================================

  useEffect(
    () => {
      let mounted =
        true;

      async function checkAccess() {
        try {
          const supabase =
            createBrowserClient(
              process.env
                .NEXT_PUBLIC_SUPABASE_URL!,
              process.env
                .NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

          // ==================================================
          // GET LOGGED-IN USER
          // ==================================================

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase
              .auth
              .getUser();

          if (
            userError ||
            !user
          ) {
            if (
              mounted
            ) {
              setCheckingAccess(
                false
              );
            }

            return;
          }

          // ==================================================
          // GET PROFILE
          // ==================================================

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
                `
                  organisation_id,
                  subscription_tier,
                  is_subscribed
                `
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
              "[ACCESS ENDED] Profile lookup failed:",
              profileError
            );
          }

          // ==================================================
          // DETERMINE ORGANISATION ID
          // ==================================================

          let organisationId:
            string | null =
            profile
              ?.organisation_id ??
            null;

          // ==================================================
          // FALLBACK:
          // organisation_members
          // ==================================================

          if (
            !organisationId
          ) {
            const {
              data:
                membership,
              error:
                membershipError,
            } =
              await supabase
                .from(
                  "organisation_members"
                )
                .select(
                  "organisation_id"
                )
                .eq(
                  "user_id",
                  user.id
                )
                .limit(
                  1
                )
                .maybeSingle();

            if (
              membershipError
            ) {
              console.error(
                "[ACCESS ENDED] Membership lookup failed:",
                membershipError
              );
            }

            organisationId =
              membership
                ?.organisation_id ??
              null;
          }

          // ==================================================
          // FALLBACK:
          // user_organisations
          // ==================================================

          if (
            !organisationId
          ) {
            const {
              data:
                userOrganisation,
              error:
                userOrganisationError,
            } =
              await supabase
                .from(
                  "user_organisations"
                )
                .select(
                  "organisation_id"
                )
                .eq(
                  "user_id",
                  user.id
                )
                .limit(
                  1
                )
                .maybeSingle();

            if (
              userOrganisationError
            ) {
              console.error(
                "[ACCESS ENDED] User organisation lookup failed:",
                userOrganisationError
              );
            }

            organisationId =
              userOrganisation
                ?.organisation_id ??
              null;
          }

          // ==================================================
          // LOAD ORGANISATION
          // ==================================================

          if (
            organisationId
          ) {
            const {
              data:
                organisation,
              error:
                organisationError,
            } =
              await supabase
                .from(
                  "organisations"
                )
                .select(
                  `
                    id,
                    subscription_tier,
                    subscription_status,
                    access_status
                  `
                )
                .eq(
                  "id",
                  organisationId
                )
                .maybeSingle();

            if (
              organisationError
            ) {
              console.error(
                "[ACCESS ENDED] Organisation lookup failed:",
                organisationError
              );
            }

            // ==================================================
            // AUTHORITATIVE PAID ACCESS CHECK
            // ==================================================

            const organisationHasPaidAccess =
              Boolean(
                organisation &&
                  isPaidTier(
                    organisation
                      .subscription_tier
                  ) &&
                  organisation
                    .subscription_status ===
                    "active" &&
                  organisation
                    .access_status ===
                    "active"
              );

            if (
              organisationHasPaidAccess
            ) {
              router.replace(
                "/dashboard"
              );

              router.refresh();

              return;
            }
          }

          // ==================================================
          // PROFILE FALLBACK
          //
          // Useful if organisation SELECT is temporarily
          // blocked by RLS but the paid profile has already
          // been synchronised successfully.
          // ==================================================

          const profileHasPaidAccess =
            Boolean(
              profile
                ?.is_subscribed ===
                true &&
                isPaidTier(
                  profile
                    ?.subscription_tier
                )
            );

          if (
            profileHasPaidAccess
          ) {
            router.replace(
              "/dashboard"
            );

            router.refresh();

            return;
          }
        } catch (
          error
        ) {
          console.error(
            "[ACCESS ENDED] Access check failed:",
            error
          );
        }

        if (
          mounted
        ) {
          setCheckingAccess(
            false
          );
        }
      }

      void checkAccess();

      return () => {
        mounted =
          false;
      };
    },
    [
      router,
    ]
  );

  // ==========================================================
  // CHECKING ACCESS
  // ==========================================================

  if (
    checkingAccess
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">

        <div className="flex flex-col items-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">

            <Loader2
              size={22}
              className="animate-spin text-[#82936b]"
            />

          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
            Checking your TOTS-OS access
          </p>

        </div>

      </main>
    );
  }

  // ==========================================================
  // ACCESS ENDED UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-12 md:px-10 md:py-16">

      <div className="mx-auto max-w-4xl">

        {/* ====================================================
            LOGO / BRAND
        ==================================================== */}

        <div className="mb-8 flex items-center gap-3">

          {/* eslint-disable-next-line @next/next/no-img-element */}

          <img
            src="/icon.png"
            alt="TOTS-OS"
            className="h-10 w-10 rounded-xl object-contain"
          />

          <span className="font-serif text-2xl italic tracking-tighter text-stone-900">
            TOTS-OS
          </span>

        </div>

        {/* ====================================================
            MAIN CARD
        ==================================================== */}

        <div className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(28,25,23,0.06)]">

          {/* ==================================================
              HERO
          ================================================== */}

          <div className="border-b border-stone-100 p-8 md:p-14">

            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf1e8] px-4 py-2">

              <Sparkles
                size={13}
                className="text-[#82936b]"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#748361]">
                Your TOTS-OS access
              </span>

            </div>

            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">

              <LockKeyhole
                size={23}
                strokeWidth={1.8}
                className="text-stone-600"
              />

            </div>

            <h1 className="mt-7 max-w-3xl font-serif text-5xl italic tracking-tight text-stone-900 md:text-7xl">
              Your free access has come to an end.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              We hope you&apos;ve had a proper chance to explore
              TOTS-OS and see what it can do for your business.
            </p>

            <p className="mt-3 max-w-2xl text-base leading-8 text-stone-500">
              Your workspace hasn&apos;t gone anywhere. Choose a
              membership and you can pick up exactly where you
              left off.
            </p>

          </div>

          {/* ==================================================
              DATA SAFE MESSAGE
          ================================================== */}

          <div className="p-8 md:p-14">

            <div className="rounded-[2rem] border border-[#cdd7c3] bg-[#edf1e8] p-6 md:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">

                  <ShieldCheck
                    size={18}
                    strokeWidth={2.5}
                    className="text-[#82936b]"
                  />

                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#748361]">
                    Everything is still here
                  </p>

                  <p className="mt-3 text-sm font-semibold text-stone-700">
                    Your TOTS-OS workspace and data have been kept safe.
                  </p>

                  <p className="mt-2 max-w-xl text-xs leading-6 text-stone-500">
                    Your projects, contacts, notes and business
                    information haven&apos;t been deleted. Once
                    you choose a membership, you can continue
                    using your existing account.
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                BENEFITS
            ================================================== */}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf7] p-5">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf1e8]">

                  <Check
                    size={13}
                    strokeWidth={3}
                    className="text-[#82936b]"
                  />

                </div>

                <p className="mt-4 text-xs font-semibold text-stone-700">
                  Keep your workspace
                </p>

                <p className="mt-1 text-[10px] leading-5 text-stone-400">
                  Continue with the account you already built.
                </p>

              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf7] p-5">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf1e8]">

                  <Check
                    size={13}
                    strokeWidth={3}
                    className="text-[#82936b]"
                  />

                </div>

                <p className="mt-4 text-xs font-semibold text-stone-700">
                  Nothing to rebuild
                </p>

                <p className="mt-1 text-[10px] leading-5 text-stone-400">
                  Your existing business setup remains in place.
                </p>

              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fcfaf7] p-5">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf1e8]">

                  <Check
                    size={13}
                    strokeWidth={3}
                    className="text-[#82936b]"
                  />

                </div>

                <p className="mt-4 text-xs font-semibold text-stone-700">
                  Continue instantly
                </p>

                <p className="mt-1 text-[10px] leading-5 text-stone-400">
                  Choose a plan and get straight back to business.
                </p>

              </div>

            </div>

            {/* ==================================================
                CTA
            ================================================== */}

            <div className="mt-10">

              <p className="font-serif text-3xl italic text-stone-800">
                Ready to keep going?
              </p>

              <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
                Choose the TOTS-OS membership that fits your
                business. You can change your plan later as
                your business grows.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/billing?existing=true"
                  )
                }
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700 sm:w-auto"
              >
                Choose my TOTS-OS plan

                <ArrowRight
                  size={13}
                />
              </button>

              <p className="mt-4 text-[10px] leading-5 text-stone-400">
                Your existing TOTS-OS login and workspace will
                stay the same.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="mt-7 text-center">

          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
            TOTS-OS · Your business, organised.
          </p>

        </div>

      </div>

    </main>
  );
}