"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function TotsOSLanding() {
  const [stage, setStage] = useState<
    "closed" | "opening" | "active" | "closing" | "signup"
  >("closed");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("opening"), 800),
      setTimeout(() => setStage("active"), 3500),
      setTimeout(() => setStage("closing"), 9500),
      setTimeout(() => setStage("signup"), 12000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    // MailerLite requires the "fields[email]" key for custom forms
    formData.append("fields[email]", email);

    try {
      await fetch(
        "https://assets.mailerlite.com/jsonp/1976098/forms/173944037984699428/subscribe",
        {
          method: "POST",
          body: formData,
          mode: "no-cors",
        }
      );

      setSubmitted(true);
      setEmail("");
    } catch {
      // In 'no-cors' mode, we often hit the catch block even on success.
      // We set submitted to true to show the success state to the user.
      setSubmitted(true);
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_45%)]" />

      {/* MOVING LIGHT */}
      <motion.div
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.05] blur-[180px]"
      />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "90px 90px",
          }}
        />
      </div>

      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-10 left-1/2 z-50 -translate-x-1/2"
      >
        <p className="text-xs uppercase tracking-[0.7em] text-white/40">
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
              style={{
                perspective: 5000,
              }}
              className="relative"
            >
              {/* FLOATING CAMERA */}
              <motion.div
                animate={{
                  y: [0, -12, 0],
                  rotateZ: [0, 0.4, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                {/* LAPTOP */}
                <div className="relative flex flex-col items-center">
                  {/* SCREEN */}
                  <motion.div
                    initial={{
                      rotateX: -115,
                    }}
                    animate={{
                      rotateX:
                        stage === "opening"
                          ? -15
                          : stage === "active"
                          ? 0
                          : stage === "closing"
                          ? -115
                          : -115,
                    }}
                    transition={{
                      duration:
                        stage === "closing" ? 1.8 : 2.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "bottom center",
                    }}
                    className="relative z-20 h-[420px] w-[760px] rounded-t-[36px] border border-white/10 bg-gradient-to-b from-zinc-800 via-black to-black shadow-[0_0_120px_rgba(255,255,255,0.14)]"
                  >
                    {/* SCREEN REFLECTION */}
                    <div className="absolute inset-0 rounded-t-[36px] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40" />

                    {/* SCREEN GLOW */}
                    <motion.div
                      animate={{
                        opacity:
                          stage === "active" ? 1 : 0,
                      }}
                      transition={{
                        duration: 2,
                      }}
                      className="absolute inset-0 rounded-t-[36px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]"
                    />

                    {/* CAMERA */}
                    <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-white/30" />

                    {/* SCREEN CONTENT */}
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden">
                      {/* BOOT FLASH */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity:
                            stage === "active"
                              ? [0, 1, 0.2, 1, 0]
                              : 0,
                        }}
                        transition={{
                          duration: 1.8,
                          delay: 0.4,
                        }}
                        className="absolute inset-0 bg-white"
                      />

                      {/* CONTENT */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          filter: "blur(20px)",
                          y: 30,
                        }}
                        animate={{
                          opacity:
                            stage === "active" ? 1 : 0,
                          filter:
                            stage === "active"
                              ? "blur(0px)"
                              : "blur(20px)",
                          y:
                            stage === "active" ? 0 : 30,
                        }}
                        transition={{
                          duration: 2,
                          delay: 1,
                        }}
                        className="relative z-20 text-center"
                      >
                        {/* SYSTEM BAR */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              stage === "active"
                                ? 260
                                : 0,
                          }}
                          transition={{
                            duration: 2,
                            delay: 1.2,
                          }}
                          className="mx-auto mb-12 h-[1px] bg-white/30"
                        />

                        {/* TITLE */}
                        <motion.h1
                          animate={{
                            letterSpacing:
                              stage === "active"
                                ? "-0.06em"
                                : "0em",
                          }}
                          transition={{
                            duration: 2,
                          }}
                          className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-8xl font-semibold text-transparent"
                        >
                          TOTS-OS
                        </motion.h1>

                        {/* SUBTITLE */}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity:
                              stage === "active" ? 1 : 0,
                          }}
                          transition={{
                            delay: 2,
                            duration: 1.5,
                          }}
                          className="mt-8 text-sm uppercase tracking-[0.6em] text-white/35"
                        >
                          Coming Summer 2026
                        </motion.p>

                        {/* TERMINAL TEXT */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity:
                              stage === "active" ? 1 : 0,
                          }}
                          transition={{
                            delay: 3,
                          }}
                          className="mt-14 space-y-3 text-xs uppercase tracking-[0.4em] text-white/20"
                        >
                          <p>INITIALISING TOTS-OS</p>
                          <p>SYNCING LIFE MODULES</p>
                          <p>SYSTEM READY</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* BASE */}
                  <div className="relative z-10 h-[38px] w-[920px] rounded-b-[70px] border border-white/5 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-[0_60px_120px_rgba(0,0,0,0.9)]">
                    {/* TRACKPAD */}
                    <div className="absolute left-1/2 top-[9px] h-[10px] w-[220px] -translate-x-1/2 rounded-full bg-black/50" />

                    {/* EDGE LIGHT */}
                    <div className="absolute inset-x-20 top-[2px] h-[2px] rounded-full bg-white/10 blur-sm" />
                  </div>

                  {/* UNDERGLOW */}
                  <motion.div
                    animate={{
                      opacity:
                        stage === "active" ? 1 : 0.4,
                      scale:
                        stage === "active" ? 1 : 0.7,
                    }}
                    transition={{
                      duration: 2,
                    }}
                    className="absolute -bottom-28 h-[220px] w-[760px] rounded-full bg-white/[0.08] blur-[160px]"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{
                opacity: 0,
                y: 100,
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
              <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-white/[0.04] p-14 backdrop-blur-3xl">
                {/* CARD SHINE */}
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
                  Secure early access to TOTS-OS before launch.
                </motion.p>

                {!submitted ? (
                  <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 1.2,
                    }}
                    className="relative z-10 mx-auto mt-14 flex max-w-3xl flex-col gap-5 md:flex-row"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="h-20 flex-1 rounded-3xl border border-white/10 bg-black/50 px-8 text-lg text-white outline-none transition-all placeholder:text-white/20 focus:border-white/30"
                    />

                    <button
                      type="submit"
                      className="group flex h-20 items-center justify-center gap-3 rounded-3xl bg-white px-10 text-sm font-medium uppercase tracking-[0.3em] text-black transition-all hover:scale-[1.03]"
                    >
                      Request Access
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-12 text-center"
                  >
                    <p className="text-2xl font-medium text-white">
                      ✓ You're on the list.
                    </p>

                    <p className="mt-4 text-white/40">
                      Check your inbox soon.
                    </p>
                  </motion.div>
                )}

                <div className="mt-10 text-center text-xs uppercase tracking-[0.4em] text-white/20">
                  Exclusive Access
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}