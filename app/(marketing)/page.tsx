"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function TotsOSPage() {
  const [stage, setStage] = useState<
    "boot" | "opened" | "closing" | "signup"
  >("boot");

  const [email, setEmail] = useState("");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("opened"), 1200),
      setTimeout(() => setStage("closing"), 6500),
      setTimeout(() => setStage("signup"), 8200),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Replace with Supabase / API logic
    console.log(email);

    alert("Welcome to the TOTS-OS waitlist.");
    setEmail("");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_35%)]" />

      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06] blur-[180px]" />

      {/* NOISE */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-10 z-50"
      >
        <h1 className="text-xs uppercase tracking-[0.5em] text-white/40">
          TOTS-OS
        </h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage !== "signup" ? (
          <motion.div
            key="laptop"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative perspective-[2000px]"
          >
            {/* LAPTOP */}
            <div className="relative flex flex-col items-center">
              {/* SCREEN */}
              <motion.div
                animate={{
                  rotateX:
                    stage === "boot"
                      ? -110
                      : stage === "opened"
                      ? 0
                      : -100,
                }}
                transition={{
                  duration: 2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "bottom",
                }}
                className="relative h-[340px] w-[580px] rounded-t-[30px] border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_120px_rgba(255,255,255,0.08)]"
              >
                {/* SCREEN GLOW */}
                <div className="absolute inset-0 rounded-t-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

                {/* CAMERA */}
                <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-white/20" />

                {/* SCREEN CONTENT */}
                <div className="flex h-full flex-col items-center justify-center">
                  {/* BOOT TEXT */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: stage === "opened" ? 1 : 0 }}
                    transition={{ delay: 1 }}
                    className="text-center"
                  >
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: stage === "opened" ? 1 : 0,
                        y: stage === "opened" ? 0 : 10,
                      }}
                      transition={{
                        duration: 1.4,
                        delay: 1.8,
                      }}
                      className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-6xl font-semibold tracking-tight text-transparent"
                    >
                      TOTS-OS
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: stage === "opened" ? 1 : 0 }}
                      transition={{
                        duration: 1,
                        delay: 2.8,
                      }}
                      className="mt-6 text-xs uppercase tracking-[0.45em] text-white/35"
                    >
                      Coming Summer 2026
                    </motion.p>
                  </motion.div>

                  {/* BOOT LINE */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: stage === "opened" ? 180 : 0,
                    }}
                    transition={{
                      delay: 1,
                      duration: 1.8,
                    }}
                    className="absolute bottom-16 h-[1px] bg-white/30"
                  />
                </div>

                {/* REFLECTION */}
                <div className="absolute inset-0 rounded-t-[30px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30" />
              </motion.div>

              {/* KEYBOARD */}
              <motion.div
                animate={{
                  opacity: stage === "closing" ? 0.8 : 1,
                }}
                className="relative h-[26px] w-[680px] rounded-b-[50px] bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-2xl"
              >
                {/* TRACKPAD */}
                <div className="absolute left-1/2 top-[6px] h-[6px] w-[140px] -translate-x-1/2 rounded-full bg-black/40" />
              </motion.div>

              {/* UNDERGLOW */}
              <motion.div
                animate={{
                  opacity: stage === "opened" ? 1 : 0.5,
                  scale: stage === "opened" ? 1 : 0.8,
                }}
                transition={{ duration: 2 }}
                className="absolute -bottom-24 h-[140px] w-[500px] rounded-full bg-white/[0.08] blur-[100px]"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-20 w-full max-w-3xl px-6"
          >
            <div className="rounded-[40px] border border-white/10 bg-white/[0.03] p-12 backdrop-blur-3xl">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-6xl font-semibold tracking-tight"
              >
                Join The Waitlist
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-white/45"
              >
                TOTS-OS launches Summer 2026.
                <br />
                Secure early access and be the first to experience the future
                of life management.
              </motion.p>

              {/* FORM */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mx-auto mt-14 flex max-w-2xl flex-col gap-4 md:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-16 flex-1 rounded-2xl border border-white/10 bg-black/40 px-6 text-lg text-white outline-none transition-all placeholder:text-white/25 focus:border-white/30 focus:bg-black/60"
                />

                <button
                  type="submit"
                  className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-sm font-medium uppercase tracking-[0.25em] text-black transition-all hover:scale-[1.02]"
                >
                  Request Access
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 text-center text-xs uppercase tracking-[0.35em] text-white/20"
              >
                Private Beta • Early Access • Exclusive Updates
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-8 text-xs uppercase tracking-[0.4em] text-white/15"
      >
        © 2026 TOTS-OS
      </motion.div>
    </main>
  );
}