"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    currentStepId,
    setCurrentStepId,
  ] = useState<string | null>(
    null
  );

  const [
    userId,
    setUserId,
  ] = useState<string | null>(
    null
  );

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
        } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", userId);

        if (error) {
          console.error(
            "Unable to save Clarity tour progress:",
            error
          );
        }
      },
      [userId]
    );

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

  const continueTour =
    useCallback(() => {
      if (!currentStepId) {
        startTour();
        return;
      }

      setIsOpen(true);

      const step =
        CLARITY_TOUR_STEPS.find(
          (item) =>
            item.id ===
            currentStepId
        );

      if (
        step &&
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

  const completeTour =
    useCallback(async () => {
      setIsOpen(false);

      setCurrentStepId(
        null
      );

      await saveProgress(
        null,
        true
      );
    }, [saveProgress]);

  const nextStep =
    useCallback(() => {
      const nextIndex =
        currentStepIndex + 1;

      const nextStep =
        CLARITY_TOUR_STEPS[
          nextIndex
        ];

      if (!nextStep) {
        void completeTour();
        return;
      }

      setCurrentStepId(
        nextStep.id
      );

      void saveProgress(
        nextStep.id
      );

      if (
        pathname !==
        nextStep.route
      ) {
        router.push(
          nextStep.route
        );
      }
    }, [
      completeTour,
      currentStepIndex,
      pathname,
      router,
      saveProgress,
    ]);

  const previousStep =
    useCallback(() => {
      const previousIndex =
        currentStepIndex - 1;

      if (
        previousIndex < 0
      ) {
        return;
      }

      const previousStep =
        CLARITY_TOUR_STEPS[
          previousIndex
        ];

      if (!previousStep) {
        return;
      }

      setCurrentStepId(
        previousStep.id
      );

      void saveProgress(
        previousStep.id
      );

      if (
        pathname !==
        previousStep.route
      ) {
        router.push(
          previousStep.route
        );
      }
    }, [
      currentStepIndex,
      pathname,
      router,
      saveProgress,
    ]);

  const skipTour =
    useCallback(() => {
      void completeTour();
    }, [completeTour]);

  const closeTour =
    useCallback(() => {
      setIsOpen(false);
    }, []);

  /*
   * Load tour state from Supabase.
   */
  useEffect(() => {
    let cancelled =
      false;

    const initialise =
      async () => {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (
          cancelled ||
          !user
        ) {
          return;
        }

        setUserId(
          user.id
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              `
                clarity_tour_completed,
                clarity_tour_step
              `
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          error
        ) {
          console.error(
            "Unable to load Clarity tour:",
            error
          );

          return;
        }

        if (
          data
            ?.clarity_tour_completed
        ) {
          return;
        }

        const savedStepId =
          data
            ?.clarity_tour_step;

        if (
          savedStepId &&
          CLARITY_TOUR_STEPS.some(
            (step) =>
              step.id ===
              savedStepId
          )
        ) {
          setCurrentStepId(
            savedStepId
          );

          return;
        }

        const firstStep =
          CLARITY_TOUR_STEPS[0];

        if (firstStep) {
          setCurrentStepId(
            firstStep.id
          );
        }
      };

    void initialise();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /*
   * Automatically open for a user
   * who has not completed onboarding.
   */
  useEffect(() => {
    if (
      !userId ||
      !currentStepId
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setIsOpen(true);
        },
        900
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    userId,
    currentStepId,
  ]);

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

  return (
    <ClarityTourContext.Provider
      value={value}
    >
      {children}
    </ClarityTourContext.Provider>
  );
}

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