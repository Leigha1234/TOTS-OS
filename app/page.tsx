"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  LogIn,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      setTimeout(() => setStage("closing"), 9000),
      setTimeout(() => setStage("signup"), 11200),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
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
      setSubmitted(true);
    }
  }

  const features = [
    {
      icon: FolderKanban,
      title: "Projects & Tasks",
      text: "Keep work, ideas and next actions organised in one place.",
    },
    {
      icon: Users,
      title: "CRM",
      text: "Manage contacts, organisations and client relationships clearly.",
    },
    {
      icon: CalendarDays,
      title: "Calendar & Planning",
      text: "Bring important dates, events and priorities into one connected view.",
    },
    {
      icon: CheckCircle2,
      title: "Business Operations",
      text: "Run the day-to-day side of your business without juggling endless tools.",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
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

      {/* HEADER */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <img
            src="/images/tots-os%20favicon.png"
            alt="TOTS-OS"
            className="h-10 w-10 rounded-xl object-contain"
          />

          <span className="text-xs font-medium uppercase tracking-[0.35em] text-white/70">
            TOTS-OS
          </span>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:border-white/30 hover:bg-white/[0.1]"
        >
          <LogIn className="h-4 w-4" />
          Log in
        </Link>
      </header>

      <section className="relative flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-14">
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
              {/* FLOATING LAPTOP */}
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
                      duration: stage === "closing" ? 1.8 : 2.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "bottom center",
                    }}
                    className="relative z-20 h-[420px] w-[760px] max-w-[86vw] rounded-t-[36px] border border-white/10 bg-gradient-to-b from-zinc-800 via-black to-black shadow-[0_0_120px_rgba(255,255,255,0.14)]"
                  >
                    {/* SCREEN REFLECTION */}
                    <div className="absolute inset-0 rounded-t-[36px] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40" />

                    {/* SCREEN GLOW */}
                    <motion.div
                      animate={{
                        opacity: stage === "active" ? 1 : 0,
                      }}
                      transition={{
                        duration: 2,
                      }}
                      className="absolute inset-0 rounded-t-[36px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]"
                    />

                    {/* CAMERA */}
                    <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-white/30" />

                    {/* SCREEN CONTENT */}
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
                      {/* BOOT FLASH */}
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
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
                        <motion.div
                          initial={{
                            width: 0,
                          }}
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
                          className="bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-6xl font-semibold text-transparent md:text-8xl"
                        >
                          TOTS-OS
                        </motion.h1>

                        <motion.p
                          initial={{
                            opacity: 0,
                          }}
                          animate={{
                            opacity:
                              stage === "active" ? 1 : 0,
                          }}
                          transition={{
                            delay: 2,
                            duration: 1.5,
                          }}
                          className="mx-auto mt-8 max-w-xl text-sm uppercase tracking-[0.35em] text-white/40"
                        >
                          The all-in-one operating system for running
                          and growing your business
                        </motion.p>

                        <motion.div
                          initial={{
                            opacity: 0,
                          }}
                          animate={{
                            opacity:
                              stage === "active" ? 1 : 0,
                          }}
                          transition={{
                            delay: 3,
                          }}
                          className="mt-14 space-y-3 text-xs uppercase tracking-[0.4em] text-white/20"
                        >
                          <p>CONNECTING BUSINESS MODULES</p>
                          <p>SYNCING WORKFLOWS</p>
                          <p>SYSTEM READY</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* LAPTOP BASE */}
                  <div className="relative z-10 h-[38px] w-[920px] max-w-[96vw] rounded-b-[70px] border border-white/5 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-[0_60px_120px_rgba(0,0,0,0.9)]">
                    <div className="absolute left-1/2 top-[9px] h-[10px] w-[220px] -translate-x-1/2 rounded-full bg-black/50" />

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
                    className="absolute -bottom-28 h-[220px] w-[760px] max-w-[86vw] rounded-full bg-white/[0.08] blur-[160px]"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* MAIN PRODUCT HOMEPAGE */
            <motion.div
              key="product"
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
              className="relative z-50 w-full max-w-6xl"
            >
              <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl md:p-14">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />

                {/* PRODUCT INTRO */}
                <div className="relative z-10 mx-auto max-w-4xl text-center">
                  <div className="mb-6 flex items-center justify-center gap-3">
                    <img
                      src="/images/tots-os%20favicon.png"
                      alt="TOTS-OS"
                      className="h-12 w-12 rounded-2xl object-contain"
                    />

                    <span className="text-xs font-medium uppercase tracking-[0.35em] text-white/50">
                      TOTS-OS
                    </span>
                  </div>

                  <motion.h2
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.3,
                    }}
                    className="text-5xl font-semibold tracking-tight md:text-7xl"
                  >
                    One system for your business.
                  </motion.h2>

                  <motion.p
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.7,
                    }}
                    className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-white/50 md:text-xl"
                  >
                    TOTS-OS brings your projects, contacts,
                    planning and everyday business operations
                    together so you can spend less time switching
                    between tools and more time moving your
                    business forward.
                  </motion.p>

                  <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/login"
                      className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-7 text-sm font-medium uppercase tracking-[0.2em] text-black transition hover:scale-[1.02]"
                    >
                      Access TOTS-OS
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <a
                      href="#features"
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 px-7 text-sm font-medium uppercase tracking-[0.2em] text-white transition hover:border-white/30 hover:bg-white/[0.05]"
                    >
                      Explore features
                    </a>
                  </div>
                </div>

                {/* FEATURES */}
                <div
                  id="features"
                  className="relative z-10 mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                  {features.map(
                    ({
                      icon: Icon,
                      title,
                      text,
                    }) => (
                      <div
                        key={title}
                        className="rounded-3xl border border-white/10 bg-black/30 p-6 text-left"
                      >
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                          <Icon className="h-5 w-5" />
                        </div>

                        <h3 className="text-lg font-semibold">
                          {title}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-white/45">
                          {text}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* EMAIL UPDATES */}
                <div className="relative z-10 mt-14 rounded-3xl border border-white/10 bg-black/30 p-7 md:p-8">
                  <div className="mx-auto max-w-3xl text-center">
                    <h3 className="text-2xl font-semibold">
                      Want product updates?
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-white/45">
                      Join the TOTS-OS mailing list for product
                      updates and early-access announcements.
                    </p>
                  </div>

                  {!submitted ? (
                    <motion.form
                      onSubmit={handleSubmit}
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay: 1.2,
                      }}
                      className="mx-auto mt-7 flex max-w-3xl flex-col gap-4 md:flex-row"
                    >
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        className="h-14 flex-1 rounded-2xl border border-white/10 bg-black/50 px-6 text-base text-white outline-none transition-all placeholder:text-white/20 focus:border-white/30"
                      />

                      <button
                        type="submit"
                        className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-7 text-sm font-medium uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02]"
                      >
                        Join updates

                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      className="mt-7 text-center"
                    >
                      <p className="text-lg font-medium text-white">
                        ✓ You're on the list.
                      </p>

                      <p className="mt-2 text-sm text-white/40">
                        Thanks for joining TOTS-OS updates.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* FOOTER */}
                <footer className="relative z-10 mt-10 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-7 text-xs text-white/35 md:flex-row">
                  <p>
                    © {new Date().getFullYear()} TOTS-OS. All
                    rights reserved.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <Link
                      href="/privacy"
                      className="transition hover:text-white"
                    >
                      Privacy Policy
                    </Link>

                    <Link
                      href="/terms"
                      className="transition hover:text-white"
                    >
                      Terms of Service
                    </Link>

                    <a
                      href="mailto:hello@theorganisedtypes.co.uk"
                      className="transition hover:text-white"
                    >
                      Contact
                    </a>
                  </div>
                </footer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}