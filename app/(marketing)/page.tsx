"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function TotsOSLandingPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const glowOpacity = useTransform(scrollYProgress, [0, 0.5], [0.4, 1]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignup(true);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Replace this with your backend / supabase logic
    console.log("Email submitted:", email);

    alert("You’ve joined the TOTS-OS waitlist.");
    setEmail("");
  };

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-black text-white"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />

      <motion.div
        style={{ opacity: glowOpacity }}
        className="absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/10 blur-[180px]" />
      </motion.div>

      {/* NOISE */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-soft-light">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-10 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <h1 className="text-sm tracking-[0.4em] text-white/70 uppercase">
            TOTS-OS
          </h1>
        </motion.div>

        {/* LAPTOP */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showSignup ? (
              <motion.div
                key="laptop"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="relative"
              >
                {/* SCREEN */}
                <motion.div
                  initial={{ rotateX: -90 }}
                  animate={{ rotateX: 0 }}
                  transition={{
                    duration: 2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "bottom",
                  }}
                  className="relative h-[320px] w-[540px] rounded-t-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_100px_rgba(255,255,255,0.08)]"
                >
                  {/* CAMERA */}
                  <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-white/20" />

                  {/* SCREEN CONTENT */}
                  <div className="flex h-full flex-col items-center justify-center">
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 1.2 }}
                      className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-5xl font-semibold tracking-tight text-transparent"
                    >
                      TOTS-OS
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.2, duration: 1 }}
                      className="mt-5 text-sm uppercase tracking-[0.35em] text-white/40"
                    >
                      Coming Summer 2026
                    </motion.p>
                  </div>

                  {/* REFLECTION */}
                  <div className="absolute inset-0 rounded-t-[28px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
                </motion.div>

                {/* KEYBOARD BASE */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="relative mx-auto h-[22px] w-[620px] rounded-b-[40px] bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-2xl"
                >
                  <div className="absolute left-1/2 top-1 h-[6px] w-[120px] -translate-x-1/2 rounded-full bg-black/40" />
                </motion.div>

                {/* CLOSING ANIMATION */}
                <motion.div
                  initial={{ rotateX: 0 }}
                  animate={{ rotateX: showSignup ? -90 : 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0"
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full max-w-2xl"
              >
                <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-2xl">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-5xl font-semibold tracking-tight"
                  >
                    The Future Is Loading
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mx-auto mt-5 max-w-xl text-center text-lg leading-relaxed text-white/50"
                  >
                    TOTS-OS is arriving Summer 2026.
                    <br />
                    A new premium digital experience designed to redefine
                    productivity, organisation, and lifestyle.
                  </motion.p>

                  {/* FORM */}
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    onSubmit={handleSubmit}
                    className="mt-12"
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 flex-1 rounded-2xl border border-white/10 bg-black/40 px-6 text-lg text-white outline-none transition-all placeholder:text-white/25 focus:border-white/30 focus:bg-black/60"
                      />

                      <button
                        type="submit"
                        className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-sm font-medium uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02]"
                      >
                        Join Waitlist
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.form>

                  {/* SMALL TEXT */}
                  <div className="mt-8 text-center text-xs uppercase tracking-[0.25em] text-white/25">
                    Early access • Private beta • Exclusive updates
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-10 text-center text-xs uppercase tracking-[0.35em] text-white/20"
        >
          © 2026 TOTS-OS
        </motion.div>
      </div>
    </main>
  );
}