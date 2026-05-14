"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function TotsOS() {
  const [stage, setStage] = useState<
    "intro" | "open" | "close" | "signup"
  >("intro");

  const [email, setEmail] = useState("");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("open"), 1200),
      setTimeout(() => setStage("close"), 8000),
      setTimeout(() => setStage("signup"), 9800),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_45%)]" />

      {/* FLOATING LIGHT */}
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.05] blur-[180px]"
      />

      {/* NOISE */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* TOP LOGO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute left-1/2 top-10 z-50 -translate-x-1/2"
      >
        <p className="text-xs uppercase tracking-[0.6em] text-white/40">
          TOTS-OS
        </p>
      </motion.div>

      <div className="relative flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          {stage !== "signup" ? (
            <motion.div
              key="laptop"
              initial={{
                opacity: 0,
                y: 100,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
              style={{
                perspective: "4000px",
              }}
            >
              {/* CAMERA FLOAT */}
              <motion.div
                animate={{
                  y: [0, -12, 0],
                  rotateZ: [0, 0.3, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                {/* LAPTOP */}
                <div className="relative flex flex-col items-center">
                  {/* SCREEN/LID */}
                  <motion.div
                    initial={{
                      rotateX: -110,
                    }}
                    animate={{
                      rotateX:
                        stage === "open"
                          ? 0
                          : stage === "close"
                          ? -105
                          : -110,
                    }}
                    transition={{
                      duration: 2.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      transformOrigin: "bottom center",
                      transformStyle: "preserve-3d",
                    }}
                    className="relative z-20 h-[380px] w-[680px] rounded-t-[32px] border border-white/10 bg-gradient-to-b from-zinc-800 via-black to-black shadow-[0_0_120px_rgba(255,255,255,0.12)]"
                  >
                    {/* SCREEN REFLECTION */}
                    <div className="absolute inset-0 rounded-t-[32px] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40" />

                    {/* SCREEN GLOW */}
                    <motion.div
                      animate={{
                        opacity: stage === "open" ? 1 : 0,
                      }}
                      className="absolute inset-0 rounded-t-[32px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]"
                    />

                    {/* CAMERA */}
                    <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-white/20" />

                    {/* SCREEN CONTENT */}
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden">
                      {/* BOOT FLASH */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity:
                            stage === "open"
                              ? [0, 1, 0.2, 1, 0]
                              : 0,
                        }}
                        transition={{
                          duration: 1.6,
                          delay: 1,
                        }}
                        className="absolute inset-0 bg-white"
                      />

                      {/* CONTENT */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 30,
                          filter: "blur(20px)",
                        }}
                        animate={{
                          opacity: stage === "open" ? 1 : 0,
                          y: stage === "open" ? 0 : 30,
                          filter:
                            stage === "open"
                              ? "blur(0px)"
                              : "blur(20px)",
                        }}
                        transition={{
                          duration: 2,
                          delay: 2,
                        }}
                        className="relative z-20 text-center"
                      >
                        {/* SYSTEM LINE */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              stage === "open"
                                ? 240
                                : 0,
                          }}
                          transition={{
                            duration: 2,
                            delay: 2.2,
                          }}
                          className="mx-auto mb-10 h-[1px] bg-white/30"
                        />

                        {/* TITLE */}
                        <motion.h1
                          animate={{
                            letterSpacing:
                              stage === "open"
                                ? "-0.04em"
                                : "0em",
                          }}
                          transition={{
                            duration: 2,
                          }}
                          className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-8xl font-semibold text-transparent"
                        >
                          TOTS-OS
                        </motion.h1>

                        {/* SUBTEXT */}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity:
                              stage === "open"
                                ? 1
                                : 0,
                          }}
                          transition={{
                            delay: 3,
                            duration: 1.5,
                          }}
                          className="mt-8 text-sm uppercase tracking-[0.5em] text-white/35"
                        >
                          Coming Summer 2026
                        </motion.p>

                        {/* TERMINAL TEXT */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity:
                              stage === "open"
                                ? 1
                                : 0,
                          }}
                          transition={{
                            delay: 4,
                          }}
                          className="mt-12 space-y-3 text-xs uppercase tracking-[0.35em] text-white/20"
                        >
                          <p>INITIALISING SYSTEM</p>
                          <p>SYNCING LIFE MODULES</p>
                          <p>TOTS-OS READY</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* KEYBOARD BASE */}
                  <div className="relative z-10 h-[34px] w-[820px] rounded-b-[60px] border border-white/5 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-[0_50px_100px_rgba(0,0,0,0.9)]">
                    {/* TRACKPAD */}
                    <div className="absolute left-1/2 top-[8px] h-[8px] w-[180px] -translate-x-1/2 rounded-full bg-black/50" />

                    {/* KEYBOARD LIGHT */}
                    <div className="absolute inset-x-16 top-[3px] h-[2px] rounded-full bg-white/10 blur-sm" />
                  </div>

                  {/* UNDERGLOW */}
                  <motion.div
                    animate={{
                      opacity:
                        stage === "open"
                          ? 1
                          : 0.5,
                      scale:
                        stage === "open"
                          ? 1
                          : 0.8,
                    }}
                    transition={{
                      duration: 2,
                    }}
                    className="absolute -bottom-24 h-[180px] w-[700px] rounded-full bg-white/[0.08] blur-[140px]"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{
                opacity: 0,
                y: 80,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 1.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative z-50 w-full max-w-4xl px-6"
            >
              {/* GLASS CARD */}
              <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.04] p-14 backdrop-blur-3xl">
                {/* SHINE */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative z-10 text-center text-7xl font-semibold tracking-tight"
                >
                  Join The Waitlist
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="relative z-10 mx-auto mt-8 max-w-2xl text-center text-xl leading-relaxed text-white/45"
                >
                  The future of life management arrives Summer 2026.
                </motion.p>

                {/* FORM */}
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: 1.2,
                  }}
                  className="relative z-10 mx-auto mt-14 flex max-w-3xl flex-col gap-5 md:flex-row"
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="h-20 flex-1 rounded-3xl border border-white/10 bg-black/50 px-8 text-lg text-white outline-none placeholder:text-white/20"
                  />

                  <button className="group flex h-20 items-center justify-center gap-3 rounded-3xl bg-white px-10 text-sm font-medium uppercase tracking-[0.3em] text-black transition-all hover:scale-[1.03]">
                    Request Access
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.form>

                <div className="mt-10 text-center text-xs uppercase tracking-[0.4em] text-white/20">
                  Private Beta • Exclusive Access
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}