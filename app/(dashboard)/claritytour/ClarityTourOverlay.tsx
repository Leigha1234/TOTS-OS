"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import ClarityTourCard from "./ClarityTourCard";
import { useClarityTour } from "./ClarityTourProvider";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function ClarityTourOverlay() {
  const {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
    closeTour,
  } = useClarityTour();

  const [
    targetRect,
    setTargetRect,
  ] = useState<TargetRect | null>(null);

  const [
    targetFound,
    setTargetFound,
  ] = useState(false);

  const [
    viewportWidth,
    setViewportWidth,
  ] = useState(0);

  const [
    viewportHeight,
    setViewportHeight,
  ] = useState(0);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const updateViewport = () => {
      setViewportWidth(
        window.innerWidth
      );

      setViewportHeight(
        window.innerHeight
      );
    };

    updateViewport();

    window.addEventListener(
      "resize",
      updateViewport
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateViewport
      );
    };
  }, []);

  useEffect(() => {
    if (
      !isOpen ||
      !currentStep
    ) {
      setTargetRect(null);
      setTargetFound(false);
      return;
    }

    let cancelled = false;

    let animationFrameId:
      number | null = null;

    let retryTimer:
      ReturnType<
        typeof setTimeout
      > | null = null;

    let resizeObserver:
      ResizeObserver | null = null;

    const findTarget = () => {
      if (cancelled) {
        return;
      }

      const element =
        document.querySelector(
          currentStep.target
        ) as HTMLElement | null;

      if (!element) {
        setTargetFound(false);

        retryTimer =
          setTimeout(
            findTarget,
            250
          );

        return;
      }

      setTargetFound(true);

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      const updateRect = () => {
        if (
          cancelled ||
          !element
        ) {
          return;
        }

        const rect =
          element.getBoundingClientRect();

        const padding = 10;

        setTargetRect({
          top:
            rect.top -
            padding,
          left:
            rect.left -
            padding,
          width:
            rect.width +
            padding * 2,
          height:
            rect.height +
            padding * 2,
        });
      };

      const startTracking =
        () => {
          updateRect();

          animationFrameId =
            window.requestAnimationFrame(
              startTracking
            );
        };

      startTracking();

      if (
        typeof ResizeObserver !==
        "undefined"
      ) {
        resizeObserver =
          new ResizeObserver(
            updateRect
          );

        resizeObserver.observe(
          element
        );
      }
    };

    const initialTimer =
      setTimeout(
        findTarget,
        350
      );

    return () => {
      cancelled = true;

      clearTimeout(
        initialTimer
      );

      if (retryTimer) {
        clearTimeout(
          retryTimer
        );
      }

      if (
        animationFrameId !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameId
        );
      }

      resizeObserver?.disconnect();
    };
  }, [
    isOpen,
    currentStep,
  ]);

  const cardPosition =
    useMemo(() => {
      const CARD_WIDTH =
        390;

      const CARD_HEIGHT =
        320;

      const GAP = 20;

      const EDGE =
        16;

      if (
        !targetRect ||
        !currentStep
      ) {
        return {
          position:
            "fixed" as const,

          top: Math.max(
            EDGE,
            viewportHeight /
              2 -
              CARD_HEIGHT /
                2
          ),

          left: Math.max(
            EDGE,
            viewportWidth /
              2 -
              CARD_WIDTH /
                2
          ),
        };
      }

      const placement =
        currentStep.placement ??
        "bottom";

      let top =
        targetRect.top +
        targetRect.height +
        GAP;

      let left =
        targetRect.left +
        targetRect.width /
          2 -
        CARD_WIDTH /
          2;

      if (
        placement ===
        "top"
      ) {
        top =
          targetRect.top -
          CARD_HEIGHT -
          GAP;
      }

      if (
        placement ===
        "left"
      ) {
        top =
          targetRect.top +
          targetRect.height /
            2 -
          CARD_HEIGHT /
            2;

        left =
          targetRect.left -
          CARD_WIDTH -
          GAP;
      }

      if (
        placement ===
        "right"
      ) {
        top =
          targetRect.top +
          targetRect.height /
            2 -
          CARD_HEIGHT /
            2;

        left =
          targetRect.left +
          targetRect.width +
          GAP;
      }

      if (
        placement ===
        "center"
      ) {
        top =
          viewportHeight /
            2 -
          CARD_HEIGHT /
            2;

        left =
          viewportWidth /
            2 -
          CARD_WIDTH /
            2;
      }

      if (
        left + CARD_WIDTH >
        viewportWidth - EDGE
      ) {
        left =
          viewportWidth -
          CARD_WIDTH -
          EDGE;
      }

      if (
        left < EDGE
      ) {
        left = EDGE;
      }

      if (
        top + CARD_HEIGHT >
        viewportHeight - EDGE
      ) {
        top =
          viewportHeight -
          CARD_HEIGHT -
          EDGE;
      }

      if (
        top < EDGE
      ) {
        top = EDGE;
      }

      return {
        position:
          "fixed" as const,
        top,
        left,
      };
    }, [
      currentStep,
      targetRect,
      viewportHeight,
      viewportWidth,
    ]);

  if (
    !isOpen ||
    !currentStep
  ) {
    return null;
  }

  const isLastStep =
    currentStepIndex ===
    totalSteps - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={
          currentStep.id
        }
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.25,
        }}
        className="pointer-events-none fixed inset-0 z-[10000]"
      >
        {/* =========================================
            DARK OVERLAY
        ========================================= */}

        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px]" />

        {/* =========================================
            TARGET HIGHLIGHT
        ========================================= */}

        {targetRect &&
          targetFound && (
            <motion.div
              layout
              transition={{
                duration: 0.25,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="pointer-events-none fixed rounded-[1.5rem] border-2 border-[#a9b897] shadow-[0_0_0_9999px_rgba(12,10,9,0.68),0_0_40px_rgba(169,184,151,0.55)]"
              style={{
                top:
                  targetRect.top,
                left:
                  targetRect.left,
                width:
                  targetRect.width,
                height:
                  targetRect.height,
              }}
            >
              <motion.div
                animate={{
                  opacity: [
                    0.35,
                    0.9,
                    0.35,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat:
                    Infinity,
                  ease:
                    "easeInOut",
                }}
                className="absolute inset-[-6px] rounded-[1.7rem] border border-[#a9b897]/50"
              />
            </motion.div>
          )}

        {/* =========================================
            CARD
        ========================================= */}

        <motion.div
          key={`card-${currentStep.id}`}
          initial={{
            opacity: 0,
            y: 12,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 10,
            scale: 0.98,
          }}
          transition={{
            duration: 0.3,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="pointer-events-auto z-[10002]"
          style={
            cardPosition
          }
        >
          <ClarityTourCard
            title={
              currentStep.title
            }
            description={
              targetFound
                ? currentStep.description
                : `${currentStep.description} We're locating this part of your workspace...`
            }
            currentStep={
              currentStepIndex +
              1
            }
            totalSteps={
              totalSteps
            }
            canGoBack={
              currentStepIndex >
              0
            }
            onBack={
              previousStep
            }
            onNext={
              nextStep
            }
            onSkip={
              skipTour
            }
            onClose={
              closeTour
            }
            isLastStep={
              isLastStep
            }
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}