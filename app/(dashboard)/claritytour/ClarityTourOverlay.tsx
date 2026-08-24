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
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

import {
  useClarityTour,
} from "./ClarityTourProvider";

// ============================================================
// TYPES
// ============================================================

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

// ============================================================
// CONSTANTS
// ============================================================

const CARD_WIDTH = 400;
const CARD_ESTIMATED_HEIGHT = 330;
const EDGE = 18;
const GAP = 22;

// ============================================================
// COMPONENT
// ============================================================

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

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    targetRect,
    setTargetRect,
  ] = useState<TargetRect | null>(
    null
  );

  const [
    viewport,
    setViewport,
  ] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });

  const [
    ready,
    setReady,
  ] = useState(false);

  // ==========================================================
  // VIEWPORT
  // ==========================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const updateViewport =
      () => {
        setViewport({
          width:
            window.innerWidth,

          height:
            window.innerHeight,
        });
      };

    updateViewport();

    window.addEventListener(
      "resize",
      updateViewport
    );

    window.addEventListener(
      "orientationchange",
      updateViewport
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateViewport
      );

      window.removeEventListener(
        "orientationchange",
        updateViewport
      );
    };
  }, []);

  // ==========================================================
  // FIND / TRACK TARGET
  // ==========================================================

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      typeof document ===
        "undefined"
    ) {
      return;
    }

    if (
      !isOpen ||
      !currentStep
    ) {
      setTargetRect(
        null
      );

      setReady(
        false
      );

      return;
    }

    let cancelled =
      false;

    let trackedElement:
      HTMLElement | null =
      null;

    let resizeObserver:
      ResizeObserver | null =
      null;

    let settleTimer:
      ReturnType<
        typeof window.setTimeout
      > | null =
      null;

    let readyTimer:
      ReturnType<
        typeof window.setTimeout
      > | null =
      null;

    // ========================================================
    // GET ELEMENT RECT
    // ========================================================

    const updateRect = (
      element: HTMLElement
    ) => {
      if (cancelled) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const padding =
        window.innerWidth <
        640
          ? 7
          : 10;

      const top =
        Math.max(
          6,
          rect.top -
            padding
        );

      const left =
        Math.max(
          6,
          rect.left -
            padding
        );

      const maxWidth =
        Math.max(
          0,
          window.innerWidth -
            left -
            6
        );

      const maxHeight =
        Math.max(
          0,
          window.innerHeight -
            top -
            6
        );

      const width =
        Math.min(
          rect.width +
            padding * 2,
          maxWidth
        );

      const height =
        Math.min(
          rect.height +
            padding * 2,
          maxHeight
        );

      setTargetRect({
        top,
        left,
        width,
        height,
      });
    };

    // ========================================================
    // LOCATE ELEMENT
    // ========================================================

    const locateTarget =
      () => {
        if (cancelled) {
          return;
        }

        let element:
          HTMLElement | null =
          null;

        try {
          element =
            document.querySelector(
              currentStep.target
            ) as
              | HTMLElement
              | null;
        } catch (
          selectorError
        ) {
          console.warn(
            "[CLARITY TOUR] Invalid target selector:",
            currentStep.target,
            selectorError
          );
        }

        // ====================================================
        // NO TARGET
        //
        // Missing targets are intentionally supported.
        // The tour becomes a centred explanatory card.
        // ====================================================

        if (!element) {
          trackedElement =
            null;

          setTargetRect(
            null
          );

          readyTimer =
            window.setTimeout(
              () => {
                if (
                  !cancelled
                ) {
                  setReady(
                    true
                  );
                }
              },
              120
            );

          return;
        }

        trackedElement =
          element;

        // ====================================================
        // SCROLL TARGET INTO VIEW
        // ====================================================

        try {
          element.scrollIntoView({
            behavior:
              "smooth",

            block:
              "center",

            inline:
              "nearest",
          });
        } catch {
          element.scrollIntoView();
        }

        // ====================================================
        // WAIT FOR SMOOTH SCROLL
        // ====================================================

        settleTimer =
          window.setTimeout(
            () => {
              if (
                cancelled ||
                !trackedElement
              ) {
                return;
              }

              updateRect(
                trackedElement
              );

              setReady(
                true
              );

              // ==============================================
              // TRACK TARGET SIZE CHANGES
              // ==============================================

              if (
                typeof ResizeObserver !==
                "undefined"
              ) {
                resizeObserver =
                  new ResizeObserver(
                    () => {
                      if (
                        !cancelled &&
                        trackedElement
                      ) {
                        updateRect(
                          trackedElement
                        );
                      }
                    }
                  );

                resizeObserver.observe(
                  trackedElement
                );
              }
            },
            450
          );
      };

    // ========================================================
    // SCROLL TRACKING
    // ========================================================

    const handleScroll =
      () => {
        if (
          cancelled ||
          !trackedElement
        ) {
          return;
        }

        updateRect(
          trackedElement
        );
      };

    // ========================================================
    // RESIZE TRACKING
    // ========================================================

    const handleResize =
      () => {
        if (
          cancelled ||
          !trackedElement
        ) {
          return;
        }

        updateRect(
          trackedElement
        );
      };

    // ========================================================
    // INITIALISE
    // ========================================================

    setReady(
      false
    );

    setTargetRect(
      null
    );

    const locateTimer =
      window.setTimeout(
        locateTarget,
        180
      );

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        locateTimer
      );

      if (settleTimer) {
        window.clearTimeout(
          settleTimer
        );
      }

      if (readyTimer) {
        window.clearTimeout(
          readyTimer
        );
      }

      resizeObserver?.disconnect();

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [
    isOpen,
    currentStep,
  ]);

  // ==========================================================
  // CARD POSITION
  // ==========================================================

  const cardPosition =
    useMemo(() => {
      const safeViewportWidth =
        Math.max(
          viewport.width,
          320
        );

      const safeViewportHeight =
        Math.max(
          viewport.height,
          500
        );

      const width =
        Math.max(
          260,
          Math.min(
            CARD_WIDTH,
            safeViewportWidth -
              32
          )
        );

      // ======================================================
      // NO TARGET
      // ======================================================

      if (!targetRect) {
        return {
          top:
            Math.max(
              EDGE,
              safeViewportHeight /
                2 -
                CARD_ESTIMATED_HEIGHT /
                  2
            ),

          left:
            Math.max(
              16,
              safeViewportWidth /
                2 -
                width /
                  2
            ),

          width,
        };
      }

      const placement =
        currentStep
          ?.placement ??
        "bottom";

      let top =
        targetRect.top +
        targetRect.height +
        GAP;

      let left =
        targetRect.left +
        targetRect.width /
          2 -
        width /
          2;

      // ======================================================
      // TOP
      // ======================================================

      if (
        placement ===
        "top"
      ) {
        top =
          targetRect.top -
          CARD_ESTIMATED_HEIGHT -
          GAP;
      }

      // ======================================================
      // RIGHT
      // ======================================================

      if (
        placement ===
        "right"
      ) {
        left =
          targetRect.left +
          targetRect.width +
          GAP;

        top =
          targetRect.top +
          targetRect.height /
            2 -
          CARD_ESTIMATED_HEIGHT /
            2;
      }

      // ======================================================
      // LEFT
      // ======================================================

      if (
        placement ===
        "left"
      ) {
        left =
          targetRect.left -
          width -
          GAP;

        top =
          targetRect.top +
          targetRect.height /
            2 -
          CARD_ESTIMATED_HEIGHT /
            2;
      }

      // ======================================================
      // CENTER
      // ======================================================

      if (
        placement ===
        "center"
      ) {
        left =
          safeViewportWidth /
            2 -
          width /
            2;

        top =
          safeViewportHeight /
            2 -
          CARD_ESTIMATED_HEIGHT /
            2;
      }

      // ======================================================
      // KEEP CARD WITHIN VIEWPORT
      // ======================================================

      left =
        Math.max(
          EDGE,
          Math.min(
            left,
            safeViewportWidth -
              width -
              EDGE
          )
        );

      top =
        Math.max(
          EDGE,
          Math.min(
            top,
            safeViewportHeight -
              CARD_ESTIMATED_HEIGHT -
              EDGE
          )
        );

      // ======================================================
      // MOBILE
      //
      // Keep the tour card above the mobile navigation.
      // ======================================================

      if (
        safeViewportWidth <
        640
      ) {
        left =
          16;

        top =
          Math.max(
            16,
            safeViewportHeight -
              CARD_ESTIMATED_HEIGHT -
              96
          );
      }

      return {
        top,
        left,
        width,
      };
    }, [
      currentStep
        ?.placement,

      targetRect,

      viewport.width,

      viewport.height,
    ]);

  // ==========================================================
  // NOTHING TO RENDER
  // ==========================================================

  if (
    !isOpen ||
    !currentStep
  ) {
    return null;
  }

  // ==========================================================
  // STEP DATA
  // ==========================================================

  const isLast =
    currentStepIndex ===
    totalSteps -
      1;

  const progress =
    totalSteps > 0
      ? (
          (
            currentStepIndex +
            1
          ) /
          totalSteps
        ) *
        100
      : 0;

  // ==========================================================
  // BACKDROP
  // ==========================================================

  const renderBackdrop =
    () => {
      // ======================================================
      // NO TARGET
      // ======================================================

      if (!targetRect) {
        return (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="
              pointer-events-auto
              fixed
              inset-0
              bg-stone-950/55
              backdrop-blur-[3px]
            "
          />
        );
      }

      // ======================================================
      // SPOTLIGHT PANELS
      // ======================================================

      return (
        <>
          {/* TOP */}

          <div
            className="
              pointer-events-auto
              fixed
              left-0
              right-0
              top-0
              bg-stone-950/60
              backdrop-blur-[2px]
            "
            style={{
              height:
                targetRect.top,
            }}
          />

          {/* LEFT */}

          <div
            className="
              pointer-events-auto
              fixed
              left-0
              bg-stone-950/60
              backdrop-blur-[2px]
            "
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
            className="
              pointer-events-auto
              fixed
              right-0
              bg-stone-950/60
              backdrop-blur-[2px]
            "
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
            className="
              pointer-events-auto
              fixed
              bottom-0
              left-0
              right-0
              bg-stone-950/60
              backdrop-blur-[2px]
            "
            style={{
              top:
                targetRect.top +
                targetRect.height,
            }}
          />
        </>
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AnimatePresence
      mode="wait"
    >
      <motion.div
        key={
          currentStep.id
        }
        initial={{
          opacity:
            0,
        }}
        animate={{
          opacity:
            ready
              ? 1
              : 0,
        }}
        exit={{
          opacity:
            0,
        }}
        transition={{
          duration:
            0.3,
        }}
        className="
          pointer-events-none
          fixed
          inset-0
          z-[10000]
        "
      >
        {renderBackdrop()}

        {/* ====================================================
            INTERACTIVE SPOTLIGHT
        ==================================================== */}

        {targetRect && (
          <>
            {/* MAIN OUTLINE */}

            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.96,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,
              }}
              transition={{
                duration:
                  0.45,

                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              className="
                pointer-events-none
                fixed
                rounded-[1.6rem]
                border
                border-[#a9b897]/90
              "
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

            {/* PULSE OUTLINE */}

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
                duration:
                  2.4,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
              }}
              className="
                pointer-events-none
                fixed
                rounded-[1.8rem]
                border
                border-[#d9e2ce]/40
              "
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

        {/* ====================================================
            CLARITY CARD
        ==================================================== */}

        <motion.div
          initial={{
            opacity:
              0,

            y:
              18,

            scale:
              0.965,
          }}
          animate={{
            opacity:
              1,

            y:
              0,

            scale:
              1,
          }}
          transition={{
            delay:
              0.08,

            duration:
              0.45,

            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
          className="
            pointer-events-auto
            fixed
            z-[10010]
          "
          style={{
            top:
              cardPosition.top,

            left:
              cardPosition.left,

            width:
              cardPosition.width,
          }}
        >
          <div
            className="
              overflow-hidden
              rounded-[2rem]
              border
              border-white/10
              bg-[#171714]/95
              text-white
              shadow-[0_30px_100px_rgba(0,0,0,.48)]
              backdrop-blur-3xl
            "
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              className="
                relative
              "
            >
              {/* GLOW */}

              <div
                className="
                  pointer-events-none
                  absolute
                  -left-20
                  -top-24
                  h-44
                  w-44
                  rounded-full
                  bg-[#a9b897]/20
                  blur-[55px]
                "
              />

              <div
                className="
                  relative
                  flex
                  items-center
                  justify-between
                  px-6
                  pb-3
                  pt-5
                "
              >
                {/* BRAND */}

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 rgba(169,184,151,0)",
                        "0 0 22px rgba(169,184,151,.4)",
                        "0 0 0 rgba(169,184,151,0)",
                      ],
                    }}
                    transition={{
                      duration:
                        2.5,

                      repeat:
                        Infinity,

                      ease:
                        "easeInOut",
                    }}
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#a9b897]/20
                      bg-[#a9b897]/10
                    "
                  >
                    <Sparkles
                      size={
                        15
                      }
                      className="
                        text-[#c8d4bc]
                      "
                    />
                  </motion.div>

                  <div>
                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.34em]
                        text-[#a9b897]
                      "
                    >
                      Clarity
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[9px]
                        font-medium
                        text-white/35
                      "
                    >
                      Your TOTS-OS guide
                    </p>
                  </div>
                </div>

                {/* HEADER ACTIONS */}

                <div
                  className="
                    flex
                    items-center
                    gap-1
                  "
                >
                  <button
                    type="button"
                    onClick={
                      closeTour
                    }
                    title="Continue later"
                    aria-label="Continue tour later"
                    className="
                      rounded-full
                      p-2
                      text-white/30
                      transition
                      hover:bg-white/[0.06]
                      hover:text-white
                    "
                  >
                    <ChevronDown
                      size={
                        14
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      skipTour
                    }
                    title="End tour"
                    aria-label="End tour"
                    className="
                      rounded-full
                      p-2
                      text-white/30
                      transition
                      hover:bg-white/[0.06]
                      hover:text-white
                    "
                  >
                    <X
                      size={
                        14
                      }
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ==================================================
                PROGRESS
            ================================================== */}

            <div
              className="
                px-6
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-white/25
                "
              >
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

              <div
                className="
                  mt-3
                  h-[2px]
                  overflow-hidden
                  rounded-full
                  bg-white/[0.07]
                "
              >
                <motion.div
                  initial={{
                    width:
                      0,
                  }}
                  animate={{
                    width:
                      `${progress}%`,
                  }}
                  transition={{
                    duration:
                      0.5,
                  }}
                  className="
                    h-full
                    bg-gradient-to-r
                    from-[#7f9273]
                    to-[#d5dfcb]
                  "
                />
              </div>
            </div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div
              className="
                px-6
                pb-6
                pt-6
              "
            >
              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={
                    currentStep.id
                  }
                  initial={{
                    opacity:
                      0,

                    y:
                      8,
                  }}
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
                  }}
                  exit={{
                    opacity:
                      0,

                    y:
                      -6,
                  }}
                  transition={{
                    duration:
                      0.28,
                  }}
                >
                  <h3
                    className="
                      font-serif
                      text-[26px]
                      italic
                      leading-tight
                      tracking-tight
                      text-[#f5f3ed]
                    "
                  >
                    {
                      currentStep.title
                    }
                  </h3>

                  <p
                    className="
                      mt-3
                      text-[13px]
                      leading-[1.75]
                      text-white/50
                    "
                  >
                    {
                      currentStep.description
                    }
                  </p>

                  {/* ============================================
                      TARGET HINT
                  ============================================ */}

                  {targetRect && (
                    <div
                      className="
                        mt-5
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-[#a9b897]/10
                        bg-[#a9b897]/[0.06]
                        px-3.5
                        py-3
                      "
                    >
                      <span
                        className="
                          relative
                          flex
                          h-2
                          w-2
                        "
                      >
                        <span
                          className="
                            absolute
                            inline-flex
                            h-full
                            w-full
                            animate-ping
                            rounded-full
                            bg-[#a9b897]
                            opacity-50
                          "
                        />

                        <span
                          className="
                            relative
                            inline-flex
                            h-2
                            w-2
                            rounded-full
                            bg-[#a9b897]
                          "
                        />
                      </span>

                      <span
                        className="
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.16em]
                          text-[#b8c5ae]
                        "
                      >
                        Try the highlighted area
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div
                className="
                  mt-7
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                {/* LEFT ACTION */}

                <div>
                  {currentStepIndex >
                  0 ? (
                    <button
                      type="button"
                      onClick={
                        previousStep
                      }
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        px-3
                        py-2
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-white/35
                        transition
                        hover:bg-white/[0.05]
                        hover:text-white/70
                      "
                    >
                      <ArrowLeft
                        size={
                          12
                        }
                      />

                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        skipTour
                      }
                      className="
                        px-2
                        py-2
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-white/25
                        transition
                        hover:text-white/50
                      "
                    >
                      Skip tour
                    </button>
                  )}
                </div>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={
                    nextStep
                  }
                  className="
                    group
                    flex
                    h-12
                    items-center
                    gap-3
                    rounded-full
                    bg-[#d5dfcb]
                    px-5
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.17em]
                    text-[#171714]
                    shadow-[0_8px_30px_rgba(169,184,151,.15)]
                    transition
                    hover:bg-white
                    hover:shadow-[0_10px_38px_rgba(255,255,255,.1)]
                  "
                >
                  {isLast ? (
                    <>
                      Finish tour

                      <Check
                        size={
                          13
                        }
                      />
                    </>
                  ) : (
                    <>
                      Next

                      <ChevronRight
                        size={
                          14
                        }
                        className="
                          transition-transform
                          group-hover:translate-x-0.5
                        "
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