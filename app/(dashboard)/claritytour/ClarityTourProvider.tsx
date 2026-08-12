"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

import {
  CLARITY_TOUR_STEPS,
} from "./tourRegistry";

import type {
  ClarityTourContextType,
} from "./types";

const ClarityTourContext =
  createContext<
    ClarityTourContextType | null
  >(null);

type ClarityTourProviderProps = {
  children: ReactNode;
};

export function ClarityTourProvider({
  children,
}: ClarityTourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  /*
   * Prevent the first-login check from running
   * multiple times during re-renders.
   */
  const initialisedRef =
    useRef(false);

  const autoStartedRef =
    useRef(false);

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    currentStepId,
    setCurrentStepId,
  ] = useState<string | null>(
    null
  );

  const [userId, setUserId] =
    useState<string | null>(
      null
    );

  const [
    isInitialising,
    setIsInitialising,
  ] = useState(true);

  // ==================================================
  // CURRENT STEP
  // ==================================================

  const currentStepIndex =
    useMemo(() => {
      if (!currentStepId) {
        return 0;
      }

      const index =
        CLARITY_TOUR_STEPS.findIndex(
          (step) =>
            step.id ===
            currentStepId
        );

      return index >= 0
        ? index
        : 0;
    }, [currentStepId]);

  const currentStep =
    CLARITY_TOUR_STEPS[
      currentStepIndex
    ] ?? null;

  const totalSteps =
    CLARITY_TOUR_STEPS.length;

  // ==================================================
  // SAVE PROGRESS
  // ==================================================

  const saveProgress =
    useCallback(
      async (
        stepId: string | null,
        completed = false
      ) => {
        if (!userId) {
          return;
        }

        const payload: Record<
          string,
          unknown
        > = {
          clarity_tour_step:
            stepId,
        };

        if (completed) {
          payload.clarity_tour_completed =
            true;

          payload.clarity_tour_completed_at =
            new Date().toISOString();
        }

        const {
          error,
        } =
          await supabase
            .from("profiles")
            .update(payload)
            .eq(
              "id",
              userId
            );

        if (error) {
          console.error(
            "Unable to save Clarity tour progress:",
            error
          );
        }
      },
      [userId]
    );

  // ==================================================
  // MARK TOUR AS SEEN
  //
  // This happens as soon as the automatic first-login
  // tour is launched.
  //
  // Closing the tour therefore does NOT make it appear
  // again next time the user signs in.
  // ==================================================

  const markTourAsSeen =
    useCallback(
      async (
        targetUserId:
          string
      ) => {
        const {
          error,
        } =
          await supabase
            .from("profiles")
            .update({
              clarity_tour_seen:
                true,

              clarity_tour_started_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              targetUserId
            );

        if (error) {
          console.error(
            "Unable to mark Clarity tour as seen:",
            error
          );
        }
      },
      []
    );

  // ==================================================
  // START TOUR
  //
  // This is the manual start/restart function.
  //
  // We intentionally allow this even if the user has
  // already seen the automatic onboarding.
  // ==================================================

  const startTour =
    useCallback(() => {
      const firstStep =
        CLARITY_TOUR_STEPS[0];

      if (!firstStep) {
        return;
      }

      setCurrentStepId(
        firstStep.id
      );

      setIsOpen(true);

      void saveProgress(
        firstStep.id
      );

      if (
        pathname !==
        firstStep.route
      ) {
        router.push(
          firstStep.route
        );
      }
    }, [
      pathname,
      router,
      saveProgress,
    ]);

  // ==================================================
  // CONTINUE TOUR
  // ==================================================

  const continueTour =
    useCallback(() => {
      if (!currentStepId) {
        startTour();
        return;
      }

      const step =
        CLARITY_TOUR_STEPS.find(
          (item) =>
            item.id ===
            currentStepId
        );

      if (!step) {
        startTour();
        return;
      }

      setIsOpen(true);

      if (
        pathname !==
        step.route
      ) {
        router.push(
          step.route
        );
      }
    }, [
      currentStepId,
      pathname,
      router,
      startTour,
    ]);

  // ==================================================
  // COMPLETE TOUR
  // ==================================================

  const completeTour =
    useCallback(
      async () => {
        setIsOpen(false);

        setCurrentStepId(
          null
        );

        if (!userId) {
          return;
        }

        const {
          error,
        } =
          await supabase
            .from("profiles")
            .update({
              clarity_tour_seen:
                true,

              clarity_tour_completed:
                true,

              clarity_tour_step:
                null,

              clarity_tour_completed_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              userId
            );

        if (error) {
          console.error(
            "Unable to complete Clarity tour:",
            error
          );
        }
      },
      [userId]
    );

  // ==================================================
  // NEXT
  // ==================================================

  const nextStep =
    useCallback(() => {
      const nextIndex =
        currentStepIndex + 1;

      const next =
        CLARITY_TOUR_STEPS[
          nextIndex
        ];

      if (!next) {
        void completeTour();
        return;
      }

      setCurrentStepId(
        next.id
      );

      void saveProgress(
        next.id
      );

      if (
        pathname !==
        next.route
      ) {
        router.push(
          next.route
        );
      }
    }, [
      completeTour,
      currentStepIndex,
      pathname,
      router,
      saveProgress,
    ]);

  // ==================================================
  // PREVIOUS
  // ==================================================

  const previousStep =
    useCallback(() => {
      const previousIndex =
        currentStepIndex - 1;

      if (
        previousIndex < 0
      ) {
        return;
      }

      const previous =
        CLARITY_TOUR_STEPS[
          previousIndex
        ];

      if (!previous) {
        return;
      }

      setCurrentStepId(
        previous.id
      );

      void saveProgress(
        previous.id
      );

      if (
        pathname !==
        previous.route
      ) {
        router.push(
          previous.route
        );
      }
    }, [
      currentStepIndex,
      pathname,
      router,
      saveProgress,
    ]);

  // ==================================================
  // SKIP
  //
  // "Skip" means:
  //
  // - don't automatically show again
  // - mark onboarding as completed/skipped
  //
  // They can still manually restart it later.
  // ==================================================

  const skipTour =
    useCallback(
      async () => {
        setIsOpen(false);

        setCurrentStepId(
          null
        );

        if (!userId) {
          return;
        }

        const {
          error,
        } =
          await supabase
            .from("profiles")
            .update({
              clarity_tour_seen:
                true,

              clarity_tour_completed:
                true,

              clarity_tour_step:
                null,

              clarity_tour_completed_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              userId
            );

        if (error) {
          console.error(
            "Unable to skip Clarity tour:",
            error
          );
        }
      },
      [userId]
    );

  // ==================================================
  // CLOSE
  //
  // Closing is different from skipping.
  //
  // It hides the tour without completing it.
  //
  // Because clarity_tour_seen was already set TRUE
  // when onboarding started, it will NOT automatically
  // reopen on the user's next login.
  //
  // They could manually continue/restart it later.
  // ==================================================

  const closeTour =
    useCallback(() => {
      setIsOpen(false);
    }, []);

  // ==================================================
  // FIRST LOGIN DETECTION
  // ==================================================

  useEffect(() => {
    if (
      initialisedRef.current
    ) {
      return;
    }

    initialisedRef.current =
      true;

    let cancelled =
      false;

    const initialise =
      async () => {
        try {
          // ------------------------------------------
          // GET CURRENT USER
          // ------------------------------------------

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            userError
          ) {
            console.error(
              "Unable to load user for Clarity tour:",
              userError
            );

            return;
          }

          if (
            cancelled ||
            !user
          ) {
            return;
          }

          setUserId(
            user.id
          );

          // ------------------------------------------
          // GET PROFILE TOUR STATE
          // ------------------------------------------

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
              .select(`
                clarity_tour_seen,
                clarity_tour_completed,
                clarity_tour_step,
                clarity_tour_started_at,
                clarity_tour_completed_at
              `)
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "Unable to load Clarity onboarding state:",
              profileError
            );

            return;
          }

          if (
            cancelled
          ) {
            return;
          }

          // ------------------------------------------
          // ONLY BRAND-NEW / UNSEEN USERS AUTO START
          // ------------------------------------------

          if (
            profile
              ?.clarity_tour_seen
          ) {
            /*
             * They've already been shown onboarding.
             *
             * DO NOT automatically open it.
             *
             * We can still retain their saved step
             * so a future "Continue tour" button
             * can work.
             */

            if (
              !profile
                .clarity_tour_completed &&
              profile
                .clarity_tour_step
            ) {
              const validStep =
                CLARITY_TOUR_STEPS.some(
                  (step) =>
                    step.id ===
                    profile.clarity_tour_step
                );

              if (
                validStep
              ) {
                setCurrentStepId(
                  profile.clarity_tour_step
                );
              }
            }

            return;
          }

          // ------------------------------------------
          // FIRST-EVER LOGIN TOUR
          // ------------------------------------------

          if (
            autoStartedRef.current
          ) {
            return;
          }

          autoStartedRef.current =
            true;

          const firstStep =
            CLARITY_TOUR_STEPS[0];

          if (!firstStep) {
            return;
          }

          /*
           * Mark as seen BEFORE displaying.
           *
           * This guarantees that refreshing/logging
           * out midway cannot trigger another automatic
           * onboarding session next time.
           */
          await markTourAsSeen(
            user.id
          );

          if (
            cancelled
          ) {
            return;
          }

          setCurrentStepId(
            firstStep.id
          );

          /*
           * Save the first step.
           */
          const {
            error:
              progressError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({
                clarity_tour_step:
                  firstStep.id,
              })
              .eq(
                "id",
                user.id
              );

          if (
            progressError
          ) {
            console.error(
              "Unable to save initial Clarity step:",
              progressError
            );
          }

          /*
           * Send the user to the correct starting page.
           */
          if (
            pathname !==
            firstStep.route
          ) {
            router.push(
              firstStep.route
            );
          }

          /*
           * Give the workspace a moment to settle.
           */
          window.setTimeout(
            () => {
              if (
                !cancelled
              ) {
                setIsOpen(
                  true
                );
              }
            },
            900
          );
        } finally {
          if (
            !cancelled
          ) {
            setIsInitialising(
              false
            );
          }
        }
      };

    void initialise();

    return () => {
      cancelled =
        true;
    };
  }, [
    markTourAsSeen,
    pathname,
    router,
  ]);

  // ==================================================
  // CONTEXT
  // ==================================================

  const value =
    useMemo<
      ClarityTourContextType
    >(
      () => ({
        isOpen,

        currentStepId,

        currentStep,

        currentStepIndex,

        totalSteps,

        startTour,

        continueTour,

        nextStep,

        previousStep,

        skipTour,

        completeTour,

        closeTour,
      }),
      [
        isOpen,
        currentStepId,
        currentStep,
        currentStepIndex,
        totalSteps,
        startTour,
        continueTour,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        closeTour,
      ]
    );

  /*
   * isInitialising currently exists so we can add
   * onboarding-specific loading behaviour later.
   *
   * We intentionally still render the dashboard while
   * checking so returning users aren't held on a
   * loading screen unnecessarily.
   */
  void isInitialising;

  return (
    <ClarityTourContext.Provider
      value={value}
    >
      {children}
    </ClarityTourContext.Provider>
  );
}

// ==================================================
// HOOK
// ==================================================

export function useClarityTour() {
  const context =
    useContext(
      ClarityTourContext
    );

  if (!context) {
    throw new Error(
      "useClarityTour must be used inside ClarityTourProvider"
    );
  }

  return context;
}