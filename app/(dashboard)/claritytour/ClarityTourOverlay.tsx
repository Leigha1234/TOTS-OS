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

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minimize2,
  Sparkles,
  X,
} from "lucide-react";

import { useClarityTour } from "./ClarityTourProvider";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const CARD_WIDTH = 400;
const CARD_ESTIMATED_HEIGHT = 330;
const EDGE = 18;
const GAP = 22;

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

  const [targetRect, setTargetRect] =
    useState<TargetRect | null>(null);

  const [targetElement, setTargetElement] =
    useState<HTMLElement | null>(null);

  const [viewport, setViewport] =
    useState({
      width: 0,
      height: 0,
    });

  const [ready, setReady] =
    useState(false);

  // ================================================
  // VIEWPORT
  // ================================================

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
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

  // ================================================
  // FIND TARGET
  // ================================================

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      setTargetElement(null);
      setReady(false);

      return;
    }

    let cancelled = false;

    let resizeObserver:
      ResizeObserver | null = null;

    let timer:
      ReturnType<typeof setTimeout> | null =
      null;

    const getRect = (
      element: HTMLElement
    ) => {
      const rect =
        element.getBoundingClientRect();

      const padding =
        window.innerWidth < 640
          ? 7
          : 10;

      setTargetRect({
        top: Math.max(
          6,
          rect.top - padding
        ),

        left: Math.max(
          6,
          rect.left - padding
        ),

        width:
          rect.width +
          padding * 2,

        height:
          rect.height +
          padding * 2,
      });
    };

    const locate = () => {
      if (cancelled) {
        return;
      }

      const element =
        document.querySelector(
          currentStep.target
        ) as HTMLElement | null;

      /*
       * IMPORTANT:
       * Missing target is NOT an error.
       *
       * Clarity simply becomes a centred
       * explanatory card.
       */
      if (!element) {
        setTargetElement(null);
        setTargetRect(null);

        window.setTimeout(() => {
          if (!cancelled) {
            setReady(true);
          }
        }, 120);

        return;
      }

      setTargetElement(element);

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      /*
       * Give smooth scrolling time to settle.
       */
      timer =
        setTimeout(() => {
          if (cancelled) {
            return;
          }

          getRect(element);
          setReady(true);

          resizeObserver =
            new ResizeObserver(() => {
              getRect(element);
            });

          resizeObserver.observe(
            element
          );
        }, 450);
    };

    setReady(false);

    const locateTimer =
      setTimeout(locate, 180);

    /*
     * Keep highlight aligned during scrolling.
     */
    const handleScroll = () => {
      if (targetElement) {
        getRect(targetElement);
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    return () => {
      cancelled = true;

      clearTimeout(
        locateTimer
      );

      if (timer) {
        clearTimeout(timer);
      }

      resizeObserver?.disconnect();

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [
    isOpen,
    currentStep,
    targetElement,
  ]);

  // ================================================
  // POSITION CARD
  // ================================================

  const cardPosition = useMemo(() => {
    const width =
      Math.min(
        CARD_WIDTH,
        viewport.width - 32
      );

    /*
     * No target?
     *
     * Make this a gorgeous centred
     * explanation rather than exposing
     * anything technical.
     */
    if (!targetRect) {
      return {
        top: Math.max(
          EDGE,
          viewport.height / 2 -
            CARD_ESTIMATED_HEIGHT / 2
        ),

        left: Math.max(
          16,
          viewport.width / 2 -
            width / 2
        ),

        width,
      };
    }

    const placement =
      currentStep?.placement ??
      "bottom";

    let top =
      targetRect.top +
      targetRect.height +
      GAP;

    let left =
      targetRect.left +
      targetRect.width / 2 -
      width / 2;

    if (placement === "top") {
      top =
        targetRect.top -
        CARD_ESTIMATED_HEIGHT -
        GAP;
    }

    if (placement === "right") {
      left =
        targetRect.left +
        targetRect.width +
        GAP;

      top =
        targetRect.top +
        targetRect.height / 2 -
        CARD_ESTIMATED_HEIGHT / 2;
    }

    if (placement === "left") {
      left =
        targetRect.left -
        width -
        GAP;

      top =
        targetRect.top +
        targetRect.height / 2 -
        CARD_ESTIMATED_HEIGHT / 2;
    }

    if (
      placement === "center"
    ) {
      left =
        viewport.width / 2 -
        width / 2;

      top =
        viewport.height / 2 -
        CARD_ESTIMATED_HEIGHT / 2;
    }

    /*
     * Keep card on screen.
     */
    left = Math.max(
      EDGE,
      Math.min(
        left,
        viewport.width -
          width -
          EDGE
      )
    );

    top = Math.max(
      EDGE,
      Math.min(
        top,
        viewport.height -
          CARD_ESTIMATED_HEIGHT -
          EDGE
      )
    );

    /*
     * On mobile always put the card
     * near the bottom.
     */
    if (
      viewport.width < 640
    ) {
      left = 16;

      top = Math.max(
        16,
        viewport.height -
          CARD_ESTIMATED_HEIGHT -
          24
      );
    }

    return {
      top,
      left,
      width,
    };
  }, [
    currentStep?.placement,
    targetRect,
    viewport,
  ]);

  if (
    !isOpen ||
    !currentStep
  ) {
    return null;
  }

  const isLast =
    currentStepIndex ===
    totalSteps - 1;

  const progress =
    totalSteps > 0
      ? ((currentStepIndex + 1) /
          totalSteps) *
        100
      : 0;

  // ================================================
  // OVERLAY PANELS
  //
  // Four panels surround the highlighted element.
  // The hole itself remains interactive.
  // ================================================

  const renderBackdrop = () => {
    if (!targetRect) {
      return (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="pointer-events-auto fixed inset-0 bg-stone-950/55 backdrop-blur-[3px]"
        />
      );
    }

    return (
      <>
        {/* TOP */}
        <div
          className="pointer-events-auto fixed left-0 right-0 top-0 bg-stone-950/60 backdrop-blur-[2px]"
          style={{
            height:
              targetRect.top,
          }}
        />

        {/* LEFT */}
        <div
          className="pointer-events-auto fixed left-0 bg-stone-950/60 backdrop-blur-[2px]"
          style={{
            top:
              targetRect.top,

            width:
              targetRect.left,

            height:
              targetRect.height,
          }}
        />

        {/* RIGHT */}
        <div
          className="pointer-events-auto fixed right-0 bg-stone-950/60 backdrop-blur-[2px]"
          style={{
            top:
              targetRect.top,

            left:
              targetRect.left +
              targetRect.width,

            height:
              targetRect.height,
          }}
        />

        {/* BOTTOM */}
        <div
          className="pointer-events-auto fixed bottom-0 left-0 right-0 bg-stone-950/60 backdrop-blur-[2px]"
          style={{
            top:
              targetRect.top +
              targetRect.height,
          }}
        />
      </>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.id}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: ready
            ? 1
            : 0,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.3,
        }}
        className="pointer-events-none fixed inset-0 z-[10000]"
      >
        {renderBackdrop()}

        {/* =========================================
            INTERACTIVE SPOTLIGHT
        ========================================= */}

        {targetRect && (
          <>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.45,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              className="pointer-events-none fixed rounded-[1.6rem] border border-[#a9b897]/90"
              style={{
                top:
                  targetRect.top,

                left:
                  targetRect.left,

                width:
                  targetRect.width,

                height:
                  targetRect.height,

                boxShadow:
                  "0 0 0 1px rgba(255,255,255,.08), 0 0 30px rgba(169,184,151,.28), 0 0 80px rgba(169,184,151,.12)",
              }}
            />

            <motion.div
              animate={{
                opacity: [
                  0.2,
                  0.65,
                  0.2,
                ],

                scale: [
                  1,
                  1.012,
                  1,
                ],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none fixed rounded-[1.8rem] border border-[#d9e2ce]/40"
              style={{
                top:
                  targetRect.top -
                  5,

                left:
                  targetRect.left -
                  5,

                width:
                  targetRect.width +
                  10,

                height:
                  targetRect.height +
                  10,
              }}
            />
          </>
        )}

        {/* =========================================
            CLARITY CARD
        ========================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 18,
            scale: 0.965,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            delay: 0.08,
            duration: 0.45,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
          className="pointer-events-auto fixed z-[10010]"
          style={{
            top:
              cardPosition.top,

            left:
              cardPosition.left,

            width:
              cardPosition.width,
          }}
        >
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#171714]/95 text-white shadow-[0_30px_100px_rgba(0,0,0,.48)] backdrop-blur-3xl">
            {/* TOP GLOW */}

            <div className="relative">
              <div className="pointer-events-none absolute -left-20 -top-24 h-44 w-44 rounded-full bg-[#a9b897]/20 blur-[55px]" />

              <div className="relative flex items-center justify-between px-6 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 rgba(169,184,151,0)",
                        "0 0 22px rgba(169,184,151,.4)",
                        "0 0 0 rgba(169,184,151,0)",
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat:
                        Infinity,
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#a9b897]/20 bg-[#a9b897]/10"
                  >
                    <Sparkles
                      size={15}
                      className="text-[#c8d4bc]"
                    />
                  </motion.div>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.34em] text-[#a9b897]">
                      Clarity
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium text-white/35">
                      Your TOTS-OS
                      guide
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={
                      closeTour
                    }
                    title="Continue later"
                    className="rounded-full p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Minimize2
                      size={14}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      skipTour
                    }
                    title="End tour"
                    className="rounded-full p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X
                      size={14}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* PROGRESS */}

            <div className="px-6">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                <span>
                  Getting started
                </span>

                <span>
                  {currentStepIndex +
                    1}
                  /
                  {totalSteps}
                </span>
              </div>

              <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  animate={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.5,
                  }}
                  className="h-full bg-gradient-to-r from-[#7f9273] to-[#d5dfcb]"
                />
              </div>
            </div>

            {/* CONTENT */}

            <div className="px-6 pb-6 pt-6">
              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={
                    currentStep.id
                  }
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -6,
                  }}
                  transition={{
                    duration: 0.28,
                  }}
                >
                  <h3 className="font-serif text-[26px] italic leading-tight tracking-tight text-[#f5f3ed]">
                    {
                      currentStep.title
                    }
                  </h3>

                  <p className="mt-3 text-[13px] leading-[1.75] text-white/50">
                    {
                      currentStep.description
                    }
                  </p>

                  {targetRect && (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#a9b897]/10 bg-[#a9b897]/[0.06] px-3.5 py-3">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a9b897] opacity-50" />

                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a9b897]" />
                      </span>

                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#b8c5ae]">
                        Try the highlighted
                        area
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ACTIONS */}

              <div className="mt-7 flex items-center justify-between gap-3">
                <div>
                  {currentStepIndex >
                  0 ? (
                    <button
                      type="button"
                      onClick={
                        previousStep
                      }
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 transition hover:bg-white/[0.05] hover:text-white/70"
                    >
                      <ArrowLeft
                        size={12}
                      />

                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        skipTour
                      }
                      className="px-2 py-2 text-[8px] font-bold uppercase tracking-[0.16em] text-white/25 transition hover:text-white/50"
                    >
                      Skip tour
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    nextStep
                  }
                  className="group flex h-12 items-center gap-3 rounded-full bg-[#d5dfcb] px-5 text-[9px] font-black uppercase tracking-[0.17em] text-[#171714] shadow-[0_8px_30px_rgba(169,184,151,.15)] transition hover:bg-white hover:shadow-[0_10px_38px_rgba(255,255,255,.1)]"
                >
                  {isLast ? (
                    <>
                      Finish tour

                      <Check
                        size={13}
                      />
                    </>
                  ) : (
                    <>
                      Next

                      <ChevronRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}