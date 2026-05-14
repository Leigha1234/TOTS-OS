"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function TotsOSLanding() {
  const [phase, setPhase] = useState<
    "hidden" | "opening" | "booting" | "closing" | "signup"
  >("hidden");

  const [email, setEmail] = useState("");

  useEffect(() => {
    const sequence = async () => {
      setTimeout(() => setPhase("opening"), 500);
      setTimeout(() => setPhase("booting"), 3000);
      setTimeout(() => setPhase("closing"), 9000);
      setTimeout(() => setPhase("signup"), 11500);
    };

    sequence();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Replace with Supabase waitlist logic
    console.log(email);

    alert("Welcome to the TOTS-OS waitlist.");
    setEmail("");
  };

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_35%)]" />

      {/* FLOATING LIGHT */}
      <motion.div
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06] blur-[160px]"
      />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
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
        <h1 className="text-xs uppercase tracking-[0.6em] text-white/40">
          TOTS-OS
        </h1>
      </motion.div>

      <div className="relative flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase !== "signup" ? (
            <motion.div
              key="laptop"
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
              style={{
                perspective: 3000,
              }}
            >
              {/* LAPTOP CONTAINER */}
              <div className="relative flex flex-col items-center">
                {/* SCREEN */}
                <motion.div
                  animate={{
                    rotateX:
                      phase === "opening"
                        ? 0
                        : phase === "booting"
                        ? 0
                        : phase === "closing"
                        ? -105
                        : -110,
                  }}
                  initial={{
                    rotateX: -110,
                  }}
                  transition={{
                    duration: 2.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "bottom center",
                  }}
                  className="relative z-20 h-[360px] w-[640px] rounded-t-[34px] border border-white/10 bg-gradient-to-b from-zinc-900 via-black to-black shadow-[0_0_120px_rgba(255,255,255,0.12)]"
                >
                  {/* SCREEN SHINE */}
                  <div className="absolute inset-0 rounded-t-[34px] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40" />

                  {/* CAMERA */}
                  <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-white/30" />

                  {/* SCREEN CONTENT */}
                  <div className="relative flex h-full flex-col items-center justify-center overflow-hidden">
                    {/* BOOT FLASH */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity:
                          phase === "booting"
                            ? [0, 1, 0.2, 1, 0]
                            : 0,
                      }}
                      transition={{
                        duration: 1.5,
                      }}
                      className="absolute inset-0 bg-white"
                    />

                    {/* BOOT TEXT */}
                    {phase === "booting" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-20 text-center"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 220 }}
                          transition={{
                            duration: 2,
                            ease: "easeInOut",
                          }}
                          className="mx-auto mb-8 h-[1px] bg-white/40"
                        />

                        <motion.h1
                          initial={{
                            opacity: 0,
                            y: 20,
                            filter: "blur(10px)",
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                          }}
                          transition={{
                            duration: 1.5,
                            delay: 0.8,
                          }}
                          className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-7xl font-semibold tracking-tight text-transparent"
                        >
                          TOTS-OS
                        </motion.h1>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 1.8,
                            duration: 1,
                          }}
                          className="mt-6 text-sm uppercase tracking-[0.5em] text-white/40"
                        >
                          Coming Summer 2026
                        </motion.p>

                        {/* SYSTEM TEXT */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 2.5,
                          }}
                          className="mt-10 space-y-2 text-xs uppercase tracking-[0.3em] text-white/20"
                        >
                          <p>INITIALISING SYSTEM</p>
                          <p>SYNCING LIFE MODULES</p>
                          <p>TOTS-OS READY</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* KEYBOARD BASE */}
                <motion.div
                  animate={{
                    scaleX:
                      phase === "closing" ? 0.98 : 1,
                  }}
                  transition={{
                    duration: 1.5,
                  }}
                  className="relative z-10 h-[30px] w-[760px] rounded-b-[50px] border border-white/5 bg-gradient-to-b from-zinc-700 via-zinc-800 to-black shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                >
                  {/* TRACKPAD */}
                  <div className="absolute left-1/2 top-[7px] h-[8px] w-[160px] -translate-x-1/2 rounded-full bg-black/50" />

                  {/* KEYBOARD LIGHT */}
                  <div className="absolute inset-x-12 top-2 h-[2px] rounded-full bg-white/10 blur-sm" />
                </motion.div>

                {/* SHADOW */}
                <motion.div
                  animate={{
                    opacity:
                      phase === "opening" || phase === "booting"
                        ? 1
                        : 0.4,
                    scale:
                      phase === "opening" || phase === "booting"
                        ? 1
                        : 0.7,
                  }}
                  transition={{
                    duration: 2,
                  }}
                  className="absolute -bottom-20 h-[140px] w-[600px] rounded-full bg-white/[0.08] blur-[120px]"
                />

                {/* FLOAT */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0"
                />
              </div>
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
              className="relative z-20 w-full max-w-4xl px-6"
            >
              {/* GLASS PANEL */}
              <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.04] p-14 backdrop-blur-3xl">
                {/* SHINE */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />

                {/* TEXT */}
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
                  <br />
                  Secure early access to TOTS-OS.
                </motion.p>

                {/* FORM */}
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: 1.1,
                  }}
                  className="relative z-10 mx-auto mt-14 flex max-w-3xl flex-col gap-5 md:flex-row"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-20 flex-1 rounded-3xl border border-white/10 bg-black/50 px-8 text-lg text-white outline-none transition-all placeholder:text-white/20 focus:border-white/30 focus:bg-black/70"
                  />

                  <button
                    type="submit"
                    className="group flex h-20 items-center justify-center gap-3 rounded-3xl bg-white px-10 text-sm font-medium uppercase tracking-[0.3em] text-black transition-all hover:scale-[1.03]"
                  >
                    Request Access
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.form>

                {/* FOOTER */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: 1.5,
                  }}
                  className="relative z-10 mt-10 text-center text-xs uppercase tracking-[0.4em] text-white/20"
                >
                  Private Beta • Early Access • Exclusive Updates
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM TEXT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 4,
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.5em] text-white/15"
      >
        © 2026 TOTS-OS
      </motion.div>
    </main>
  );
}