"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Cloud,
  ContactRound,
  FileText,
  FolderKanban,
  Gauge,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Menu,
  MessageSquareText,
  Network,
  NotebookPen,
  Play,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type IntroStage = "boot" | "opening" | "ready" | "complete";

type Feature = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
};

type PricingPlan = {
  name: string;
  price: number;
  description: string;
  featured?: boolean;
  badge?: string;
  features: string[];
};

const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const FEATURES: Feature[] = [
  {
    icon: ContactRound,
    eyebrow: "CRM",
    title: "Know your clients.",
    description:
      "Keep contacts, organisations, notes and relationships connected without losing the context behind them.",
  },
  {
    icon: FolderKanban,
    eyebrow: "Projects",
    title: "Keep work moving.",
    description:
      "Turn ideas into projects, projects into tasks and tasks into clear next actions from one organised workspace.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Planning",
    title: "See what is coming.",
    description:
      "Bring events, deadlines, meetings and priorities into one connected calendar built around your business.",
  },
  {
    icon: CircleDollarSign,
    eyebrow: "Finance",
    title: "Understand the numbers.",
    description:
      "Bring sales, expenses, tax, payroll and important financial information into a clearer business view.",
  },
  {
    icon: MessageSquareText,
    eyebrow: "Socials",
    title: "Plan your content.",
    description:
      "Organise social content and publishing workflows alongside everything else happening inside your business.",
  },
  {
    icon: NotebookPen,
    eyebrow: "Notes",
    title: "Capture every idea.",
    description:
      "Store notes, thoughts, plans and brain dumps before they disappear into another app, notebook or forgotten tab.",
  },
];

const PRICING: PricingPlan[] = [
  {
    name: "Standard",
    price: 29,
    description:
      "The essential operating system for founders building a more organised business.",
    features: [
      "Business dashboard",
      "Projects & tasks",
      "CRM & contacts",
      "Calendar & planning",
      "Notes & brain dump",
      "Core finance tools",
    ],
  },
  {
    name: "Professional",
    price: 59,
    description:
      "For growing businesses that need more power, visibility and connected workflows.",
    featured: true,
    badge: "Most popular",
    features: [
      "Everything in Standard",
      "Advanced business tools",
      "Social planning",
      "Expanded finance features",
      "Team workflows",
      "Business insights & KPIs",
    ],
  },
  {
    name: "Elite",
    price: 149,
    description:
      "A more complete operating environment for established teams and ambitious businesses.",
    features: [
      "Everything in Professional",
      "Advanced team access",
      "Enhanced operational tools",
      "Priority support",
      "Higher usage allowances",
      "Built for scaling businesses",
    ],
  },
];

const FAQS = [
  {
    question: "What is TOTS-OS?",
    answer:
      "TOTS-OS is an all-in-one business operating system designed to bring the everyday parts of running a business into one connected workspace — including projects, tasks, contacts, planning, finances, notes and more.",
  },
  {
    question: "Who is TOTS-OS designed for?",
    answer:
      "TOTS-OS is designed for founders, small businesses and growing teams who are tired of running their business across disconnected apps, spreadsheets, notebooks and browser tabs.",
  },
  {
    question: "Can I access TOTS-OS online?",
    answer:
      "Yes. TOTS-OS is a web-based platform, so your business workspace can be accessed through your account online.",
  },
  {
    question: "Does TOTS-OS include social media tools?",
    answer:
      "TOTS-OS includes social planning and connected social workflows designed to sit alongside the rest of your business operations.",
  },
  {
    question: "Can I log into an existing account?",
    answer:
      "Yes. Existing users can use the Log in button at the top of this page to access their TOTS-OS account.",
  },
];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 0,
              y: 42,
              filter: "blur(12px)",
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
        amount: 0.16,
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 backdrop-blur-xl">
      <span className="h-1.5 w-1.5 rounded-full bg-[#d8dfc8] shadow-[0_0_14px_rgba(216,223,200,0.8)]" />
      <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/55">
        {children}
      </span>
    </div>
  );
}

function ProductWindow() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 70,
        rotateX: 6,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
      }}
      transition={{
        delay: 0.9,
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mx-auto mt-20 w-full max-w-[1180px]"
      style={{
        perspective: 1800,
      }}
    >
      <div className="absolute -inset-8 rounded-[60px] bg-[#cfd8b8]/[0.08] blur-[80px]" />

      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.12] bg-[#0a0a0a] shadow-[0_70px_180px_rgba(0,0,0,0.75)]">
        <div className="flex h-11 items-center border-b border-white/[0.07] bg-white/[0.035] px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 rounded-lg border border-white/[0.06] bg-black/40 px-14 py-1.5">
            <span className="text-[8px] uppercase tracking-[0.22em] text-white/25">
              TOTS-OS / Dashboard
            </span>
          </div>
        </div>

        <div className="grid min-h-[570px] grid-cols-[74px_1fr] md:grid-cols-[210px_1fr]">
          <aside className="border-r border-white/[0.07] bg-[#090909] p-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/tots-os%20favicon.png"
                alt=""
                className="h-9 w-9 rounded-xl object-contain"
              />

              <div className="hidden md:block">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-white">
                  TOTS-OS
                </p>
                <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/25">
                  Workspace
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-2">
              {[
                [LayoutDashboard, "Dashboard", true],
                [Users, "CRM", false],
                [FolderKanban, "Projects", false],
                [CalendarDays, "Calendar", false],
                [ReceiptText, "Finance", false],
                [MessageSquareText, "Socials", false],
                [NotebookPen, "Notes", false],
              ].map(([Icon, label, active]) => {
                const MenuIcon = Icon as LucideIcon;

                return (
                  <div
                    key={String(label)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                      active
                        ? "bg-white text-black"
                        : "text-white/30"
                    }`}
                  >
                    <MenuIcon className="h-4 w-4 shrink-0" />

                    <span className="hidden text-[10px] font-medium md:block">
                      {String(label)}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="overflow-hidden bg-[#0d0d0c] p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[9px] uppercase tracking-[0.26em] text-white/25">
                  Wednesday, 12 August
                </p>

                <h3 className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl">
                  Good morning.
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[9px] text-white/35">
                  + New task
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8dfc8] text-[9px] font-semibold text-black">
                  TO
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["Revenue", "£12,840", "+14.2%"],
                ["Open projects", "08", "3 due soon"],
                ["Tasks", "24", "6 today"],
                ["Contacts", "142", "+8 this month"],
              ].map(([label, value, note]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5"
                >
                  <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                    {label}
                  </p>

                  <p className="mt-4 text-xl font-medium tracking-tight text-white sm:text-2xl">
                    {value}
                  </p>

                  <p className="mt-2 text-[8px] text-[#d8dfc8]/55">
                    {note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1.35fr_.65fr]">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                      Business pulse
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/80">
                      Performance
                    </p>
                  </div>

                  <BarChart3 className="h-4 w-4 text-white/20" />
                </div>

                <div className="mt-8 flex h-[180px] items-end gap-2 sm:gap-3">
                  {[36, 44, 40, 58, 52, 66, 62, 80, 72, 89, 84, 96].map(
                    (height, index) => (
                      <motion.div
                        key={index}
                        initial={{
                          height: 0,
                        }}
                        whileInView={{
                          height: `${height}%`,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.04,
                        }}
                        className="relative flex-1 overflow-hidden rounded-t-md bg-white/[0.075]"
                      >
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#d8dfc8]/30 to-transparent" />
                      </motion.div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                      Today
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/80">
                      Focus
                    </p>
                  </div>

                  <Target className="h-4 w-4 text-white/20" />
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["Prepare client proposal", "09:30"],
                    ["Review campaign", "11:00"],
                    ["Finance check-in", "14:30"],
                    ["Schedule content", "16:00"],
                  ].map(([task, time], index) => (
                    <motion.div
                      initial={{
                        opacity: 0,
                        x: 15,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.15 + index * 0.1,
                      }}
                      key={task}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-black/20 p-3"
                    >
                      <span className="h-2 w-2 rounded-full border border-[#d8dfc8]/40" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] text-white/60">
                          {task}
                        </p>
                      </div>

                      <span className="text-[8px] text-white/20">
                        {time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto h-[34px] w-[94%] rounded-b-[50%] bg-gradient-to-b from-zinc-800 to-black shadow-[0_40px_80px_rgba(0,0,0,0.8)]" />
    </motion.div>
  );
}

function Intro({
  stage,
  setStage,
}: {
  stage: IntroStage;
  setStage: (stage: IntroStage) => void;
}) {
  return (
    <AnimatePresence>
      {stage !== "complete" && (
        <motion.div
          exit={{
            opacity: 0,
            scale: 1.06,
            filter: "blur(20px)",
          }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505]"
        >
          <motion.div
            animate={{
              opacity: [0.25, 0.7, 0.25],
              scale: [0.85, 1.08, 0.85],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
            className="absolute h-[600px] w-[600px] rounded-full bg-[#d8dfc8]/10 blur-[150px]"
          />

          <button
            onClick={() => setStage("complete")}
            className="absolute right-6 top-6 z-50 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[9px] uppercase tracking-[0.22em] text-white/35 transition hover:text-white md:right-10 md:top-10"
          >
            Skip intro
          </button>

          <motion.div
            initial={{
              opacity: 0,
              y: 50,
              scale: 0.92,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex w-full max-w-5xl flex-col items-center px-6"
          >
            <div
              className="relative w-full max-w-3xl"
              style={{
                perspective: 2200,
              }}
            >
              <motion.div
                initial={{
                  rotateX: -105,
                }}
                animate={{
                  rotateX:
                    stage === "boot"
                      ? -105
                      : stage === "opening"
                        ? -8
                        : 0,
                }}
                transition={{
                  duration: 1.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformOrigin: "bottom",
                  transformStyle: "preserve-3d",
                }}
                className="relative h-[300px] rounded-t-[28px] border border-white/10 bg-black shadow-[0_0_100px_rgba(216,223,200,.12)] sm:h-[390px]"
              >
                <div className="absolute inset-0 overflow-hidden rounded-t-[28px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(216,223,200,.12),transparent_45%)]" />

                  <div className="absolute left-1/2 top-3 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/25" />

                  <AnimatePresence>
                    {stage === "ready" && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.86,
                          filter: "blur(24px)",
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        className="flex h-full flex-col items-center justify-center text-center"
                      >
                        <motion.img
                          initial={{
                            opacity: 0,
                            scale: 0.7,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          src="/images/tots-os%20favicon.png"
                          alt=""
                          className="mb-7 h-12 w-12 rounded-2xl"
                        />

                        <p className="text-[8px] uppercase tracking-[0.4em] text-[#d8dfc8]/55">
                          Business operating system
                        </p>

                        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                          TOTS-OS
                        </h2>

                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: 180,
                          }}
                          transition={{
                            delay: 0.4,
                            duration: 1,
                          }}
                          className="mt-8 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
                        />

                        <motion.p
                          initial={{
                            opacity: 0,
                          }}
                          animate={{
                            opacity: 1,
                          }}
                          transition={{
                            delay: 0.65,
                          }}
                          className="mt-6 text-[8px] uppercase tracking-[0.32em] text-white/25"
                        >
                          System ready
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <div className="h-7 w-full rounded-b-[50px] border-t border-white/[0.08] bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-[0_40px_80px_rgba(0,0,0,.8)]">
                <div className="mx-auto h-1.5 w-32 rounded-b-full bg-black/70" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TotsOSLanding() {
  const reduceMotion = useReducedMotion();

  const [introStage, setIntroStage] =
    useState<IntroStage>("boot");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [openFaq, setOpenFaq] =
    useState<number | null>(0);

  useEffect(() => {
    if (reduceMotion) {
      setIntroStage("complete");
      return;
    }

    const opening = window.setTimeout(
      () => setIntroStage("opening"),
      350
    );

    const ready = window.setTimeout(
      () => setIntroStage("ready"),
      1250
    );

    const complete = window.setTimeout(
      () => setIntroStage("complete"),
      3100
    );

    return () => {
      window.clearTimeout(opening);
      window.clearTimeout(ready);
      window.clearTimeout(complete);
    };
  }, [reduceMotion]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) return;

    setSubmitting(true);

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
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Intro
        stage={introStage}
        setStage={setIntroStage}
      />

      <main className="relative overflow-hidden bg-[#050505] text-white selection:bg-[#d8dfc8] selection:text-black">
        {/* GLOBAL BACKGROUND */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(216,223,200,0.09),transparent_32%)]" />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
            }}
          />

          <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-transparent to-[#050505]" />
        </div>

        {/* NAV */}
        <header className="fixed inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
            <div className="flex h-[68px] items-center justify-between rounded-[22px] border border-white/[0.08] bg-black/55 px-4 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:px-5">
              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <img
                  src="/images/tots-os%20favicon.png"
                  alt="TOTS-OS"
                  className="h-9 w-9 rounded-xl object-contain"
                />

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em]">
                    TOTS-OS
                  </p>

                  <p className="mt-0.5 hidden text-[7px] uppercase tracking-[0.22em] text-white/25 sm:block">
                    Business operating system
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-1 lg:flex">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[9px] font-medium uppercase tracking-[0.16em] text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log in
                </Link>

                <a
                  href="#pricing"
                  className="group flex h-10 items-center gap-2 rounded-full bg-[#e5e8dc] px-5 text-[9px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white"
                >
                  View plans
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>

              <button
                type="button"
                aria-label="Open menu"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 sm:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-[80] bg-black/80 p-4 backdrop-blur-2xl sm:hidden"
            >
              <motion.div
                initial={{
                  y: -30,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  y: -20,
                  opacity: 0,
                }}
                className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/tots-os%20favicon.png"
                      alt=""
                      className="h-9 w-9 rounded-xl"
                    />
                    <span className="text-xs font-semibold tracking-[0.16em]">
                      TOTS-OS
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    aria-label="Close menu"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-8 space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileMenuOpen(false)
                      }
                      className="flex items-center justify-between rounded-2xl px-4 py-4 text-sm text-white/65 transition hover:bg-white/[0.05]"
                    >
                      {item.label}
                      <ArrowUpRight className="h-4 w-4 text-white/20" />
                    </a>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center rounded-2xl border border-white/10 text-xs"
                  >
                    Log in
                  </Link>

                  <a
                    href="#pricing"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="flex h-12 items-center justify-center rounded-2xl bg-white text-xs font-medium text-black"
                  >
                    View plans
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO */}
        <section className="relative z-10 min-h-screen px-5 pb-24 pt-40 sm:px-6 lg:px-8 lg:pt-48">
          <motion.div
            animate={{
              x: ["-5%", "5%", "-5%"],
              y: ["0%", "7%", "0%"],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute left-1/2 top-[25%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#d8dfc8]/[0.06] blur-[160px]"
          />

          <div className="relative mx-auto max-w-[1400px]">
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.15,
                duration: 0.8,
              }}
              className="text-center"
            >
              <Eyebrow>
                Your business. One operating system.
              </Eyebrow>

              <motion.h1
                initial={{
                  opacity: 0,
                  y: 40,
                  filter: "blur(16px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  delay: 0.25,
                  duration: 1.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mx-auto mt-8 max-w-[1100px] text-[clamp(3.5rem,8vw,8.7rem)] font-medium leading-[0.88] tracking-[-0.075em]"
              >
                Run your business
                <span className="block bg-gradient-to-r from-white via-[#dfe4d3] to-white/55 bg-clip-text text-transparent">
                  without the chaos.
                </span>
              </motion.h1>

              <motion.p
                initial={{
                  opacity: 0,
                  y: 22,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.55,
                  duration: 0.9,
                }}
                className="mx-auto mt-8 max-w-[680px] text-base leading-7 text-white/42 sm:text-lg"
              >
                TOTS-OS brings your projects, clients,
                finances, planning, content and everyday
                operations into one beautifully organised
                business system.
              </motion.p>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 22,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.75,
                }}
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <a
                  href="#pricing"
                  className="group flex h-14 min-w-[190px] items-center justify-center gap-3 rounded-full bg-[#e8eadf] px-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition duration-300 hover:scale-[1.025] hover:bg-white"
                >
                  Explore TOTS-OS
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>

                <a
                  href="#product"
                  className="group flex h-14 min-w-[190px] items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-7 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 backdrop-blur-xl transition hover:border-white/20 hover:text-white"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  See the system
                </a>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: 1.1,
                }}
                className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] uppercase tracking-[0.16em] text-white/22"
              >
                <span className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-[#d8dfc8]/60" />
                  Web based
                </span>

                <span className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-[#d8dfc8]/60" />
                  Secure account access
                </span>

                <span className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-[#d8dfc8]/60" />
                  Built for real businesses
                </span>
              </motion.div>
            </motion.div>

            <ProductWindow />
          </div>
        </section>

        {/* MARQUEE */}
        <section className="relative z-10 overflow-hidden border-y border-white/[0.06] py-7">
          <motion.div
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex w-max items-center"
          >
            {[...Array(2)].flatMap((_, group) =>
              [
                "CRM",
                "PROJECTS",
                "FINANCE",
                "CALENDAR",
                "SOCIALS",
                "NOTES",
                "TASKS",
                "BUSINESS KPIs",
              ].map((item, index) => (
                <div
                  key={`${group}-${index}`}
                  className="flex items-center"
                >
                  <span className="px-8 text-[10px] font-medium tracking-[0.28em] text-white/25 sm:px-12">
                    {item}
                  </span>
                  <Sparkles className="h-3 w-3 text-[#d8dfc8]/25" />
                </div>
              ))
            )}
          </motion.div>
        </section>

        {/* PRODUCT PHILOSOPHY */}
        <section
          id="product"
          className="relative z-10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40"
        >
          <div className="mx-auto max-w-[1400px]">
            <Reveal>
              <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
                <div>
                  <Eyebrow>Why TOTS-OS</Eyebrow>

                  <p className="mt-7 max-w-md text-sm leading-6 text-white/35">
                    Businesses outgrow scattered systems.
                    TOTS-OS is designed to make running one
                    feel simpler again.
                  </p>
                </div>

                <h2 className="text-[clamp(2.7rem,5.7vw,6.4rem)] font-medium leading-[0.96] tracking-[-0.06em]">
                  Stop building your business around
                  <span className="text-white/22">
                    {" "}
                    disconnected tools.
                  </span>
                </h2>
              </div>
            </Reveal>

            <div className="mt-20 grid gap-4 lg:grid-cols-3">
              {[
                {
                  number: "01",
                  icon: Layers3,
                  title: "One connected workspace",
                  text: "The parts of your business belong together. Keep the context around your clients, work, money and plans close at hand.",
                },
                {
                  number: "02",
                  icon: Gauge,
                  title: "Clarity at a glance",
                  text: "See what needs attention, what is moving and what comes next without rebuilding the picture every morning.",
                },
                {
                  number: "03",
                  icon: Zap,
                  title: "Less admin friction",
                  text: "Spend less time maintaining your organisation system and more time actually using it to move forward.",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <Reveal
                    key={item.number}
                    delay={index * 0.1}
                  >
                    <motion.div
                      whileHover={{
                        y: -5,
                      }}
                      className="group relative min-h-[390px] overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.025] p-7 sm:p-9"
                    >
                      <div className="absolute right-0 top-0 h-52 w-52 bg-[#d8dfc8]/[0.035] blur-[80px] transition group-hover:bg-[#d8dfc8]/[0.07]" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-[0.22em] text-white/20">
                            {item.number}
                          </span>

                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                            <Icon className="h-4 w-4 text-[#d8dfc8]/60" />
                          </div>
                        </div>

                        <div className="mt-auto pt-28">
                          <h3 className="text-2xl font-medium tracking-[-0.035em]">
                            {item.title}
                          </h3>

                          <p className="mt-4 max-w-sm text-sm leading-6 text-white/35">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="relative z-10 border-y border-white/[0.06] bg-white/[0.012] px-5 py-28 sm:px-6 lg:px-8 lg:py-40"
        >
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="text-center">
              <Eyebrow>Inside the system</Eyebrow>

              <h2 className="mx-auto mt-7 max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-medium leading-[0.95] tracking-[-0.06em]">
                Everything has a place.
              </h2>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/35">
                Core business tools designed to work as
                parts of one system instead of a pile of
                separate subscriptions.
              </p>
            </Reveal>

            <div className="mt-20 grid gap-px overflow-hidden rounded-[32px] border border-white/[0.07] bg-white/[0.07] md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <Reveal
                    key={feature.title}
                    delay={(index % 3) * 0.07}
                  >
                    <motion.div
                      whileHover={{
                        backgroundColor:
                          "rgba(255,255,255,0.045)",
                      }}
                      className="group min-h-[330px] bg-[#090909] p-8 lg:p-9"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                          <Icon className="h-5 w-5 text-[#d8dfc8]/65" />
                        </div>

                        <ArrowUpRight className="h-4 w-4 text-white/10 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white/50" />
                      </div>

                      <div className="mt-16">
                        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#d8dfc8]/35">
                          {feature.eyebrow}
                        </p>

                        <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
                          {feature.title}
                        </h3>

                        <p className="mt-4 max-w-sm text-sm leading-6 text-white/32">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONNECTED SYSTEM */}
        <section className="relative z-10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <Eyebrow>Connected by design</Eyebrow>

              <h2 className="mt-7 max-w-xl text-[clamp(2.8rem,5vw,5.6rem)] font-medium leading-[0.95] tracking-[-0.06em]">
                Your business is not six different apps.
              </h2>

              <p className="mt-7 max-w-lg text-base leading-7 text-white/35">
                A client becomes a project. A project
                creates tasks. Tasks have dates. Work
                creates revenue. TOTS-OS is built around
                those relationships.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  "See your work in context",
                  "Reduce duplicate admin",
                  "Build clearer business routines",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8dfc8]/15 bg-[#d8dfc8]/[0.05]">
                      <Check className="h-3.5 w-3.5 text-[#d8dfc8]/70" />
                    </div>

                    <span className="text-sm text-white/55">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative mx-auto aspect-square max-w-[610px]">
                <div className="absolute inset-[13%] rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[28%] rounded-full border border-white/[0.08]" />

                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 42,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-[13%] rounded-full border border-dashed border-[#d8dfc8]/10"
                />

                <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[35px] border border-[#d8dfc8]/15 bg-[#d8dfc8]/[0.06] shadow-[0_0_100px_rgba(216,223,200,.08)] backdrop-blur-xl">
                  <img
                    src="/images/tots-os%20favicon.png"
                    alt=""
                    className="h-16 w-16 rounded-2xl"
                  />
                </div>

                {[
                  {
                    icon: Users,
                    label: "CRM",
                    position: "left-[5%] top-[17%]",
                  },
                  {
                    icon: FolderKanban,
                    label: "Projects",
                    position: "right-[3%] top-[18%]",
                  },
                  {
                    icon: WalletCards,
                    label: "Finance",
                    position: "left-[2%] bottom-[18%]",
                  },
                  {
                    icon: CalendarDays,
                    label: "Calendar",
                    position:
                      "right-[2%] bottom-[17%]",
                  },
                  {
                    icon: MessageSquareText,
                    label: "Socials",
                    position:
                      "left-1/2 top-[3%] -translate-x-1/2",
                  },
                  {
                    icon: BarChart3,
                    label: "Insights",
                    position:
                      "bottom-[2%] left-1/2 -translate-x-1/2",
                  },
                ].map(
                  ({
                    icon: Icon,
                    label,
                    position,
                  }) => (
                    <motion.div
                      key={label}
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: Math.random(),
                      }}
                      className={`absolute ${position} flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-black/70 backdrop-blur-xl sm:h-24 sm:w-24`}
                    >
                      <Icon className="h-4 w-4 text-[#d8dfc8]/55" />

                      <span className="mt-2 text-[8px] uppercase tracking-[0.15em] text-white/30">
                        {label}
                      </span>
                    </motion.div>
                  )
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* SECURITY */}
        <section className="relative z-10 px-5 pb-28 sm:px-6 lg:px-8 lg:pb-40">
          <div className="mx-auto max-w-[1400px]">
            <Reveal>
              <div className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#0a0a09] p-8 sm:p-12 lg:p-16">
                <div className="absolute right-[-5%] top-[-70%] h-[500px] w-[500px] rounded-full bg-[#d8dfc8]/[0.06] blur-[120px]" />

                <div className="relative grid gap-14 lg:grid-cols-[1fr_.8fr] lg:items-center">
                  <div>
                    <Eyebrow>
                      Built for your business
                    </Eyebrow>

                    <h2 className="mt-7 max-w-2xl text-[clamp(2.6rem,5vw,5.2rem)] font-medium leading-[0.96] tracking-[-0.055em]">
                      Your workspace should feel like
                      yours.
                    </h2>

                    <p className="mt-6 max-w-xl text-sm leading-7 text-white/35 sm:text-base">
                      TOTS-OS gives your business a
                      dedicated account-based workspace for
                      keeping operational information
                      together.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        icon: LockKeyhole,
                        title: "Secure access",
                        text: "Account-based access to your TOTS-OS workspace.",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Privacy",
                        text: "Clear privacy information and responsible data handling.",
                      },
                      {
                        icon: Cloud,
                        title: "Web based",
                        text: "Access the platform through your browser.",
                      },
                      {
                        icon: Network,
                        title: "Connected",
                        text: "Modules designed to work together across your business.",
                      },
                    ].map(({ icon: Icon, title, text }) => (
                      <div
                        key={title}
                        className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                      >
                        <Icon className="h-4 w-4 text-[#d8dfc8]/60" />

                        <p className="mt-5 text-sm font-medium">
                          {title}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-white/30">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="relative z-10 border-y border-white/[0.06] bg-white/[0.012] px-5 py-28 sm:px-6 lg:px-8 lg:py-40"
        >
          <div className="mx-auto max-w-[1150px] text-center">
            <Reveal>
              <Eyebrow>The idea behind TOTS-OS</Eyebrow>

              <h2 className="mx-auto mt-8 text-[clamp(2.8rem,6vw,6.5rem)] font-medium leading-[0.94] tracking-[-0.06em]">
                Your business deserves
                <span className="text-white/22">
                  {" "}
                  its own operating system.
                </span>
              </h2>

              <p className="mx-auto mt-9 max-w-3xl text-base leading-8 text-white/38 sm:text-lg">
                TOTS-OS was created around a simple idea:
                running a small business should not require
                endless subscriptions, scattered
                spreadsheets, forgotten notes and a dozen
                tabs open just to understand what is going
                on.
              </p>

              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/38 sm:text-lg">
                We are building one organised place for the
                work behind the business — so founders can
                spend less time managing their systems and
                more time building what matters.
              </p>
            </Reveal>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          className="relative z-10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40"
        >
          <div className="mx-auto max-w-[1250px]">
            <Reveal className="text-center">
              <Eyebrow>Simple pricing</Eyebrow>

              <h2 className="mt-7 text-[clamp(3rem,6vw,6rem)] font-medium tracking-[-0.06em]">
                Choose your system.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/35 sm:text-base">
                Start with the level of TOTS-OS that fits
                your business today.
              </p>
            </Reveal>

            <div className="mt-20 grid gap-4 lg:grid-cols-3">
              {PRICING.map((plan, index) => (
                <Reveal
                  key={plan.name}
                  delay={index * 0.1}
                  className={
                    plan.featured
                      ? "lg:-translate-y-5"
                      : ""
                  }
                >
                  <div
                    className={`relative flex min-h-[650px] flex-col overflow-hidden rounded-[32px] border p-7 sm:p-9 ${
                      plan.featured
                        ? "border-[#d8dfc8]/30 bg-[#d8dfc8]/[0.065] shadow-[0_30px_120px_rgba(216,223,200,.07)]"
                        : "border-white/[0.08] bg-white/[0.025]"
                    }`}
                  >
                    {plan.featured && (
                      <>
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8dfc8]/80 to-transparent" />

                        <div className="absolute right-[-20%] top-[-20%] h-72 w-72 rounded-full bg-[#d8dfc8]/[0.07] blur-[100px]" />
                      </>
                    )}

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {plan.name}
                          </p>

                          {plan.badge && (
                            <div className="mt-3 inline-flex rounded-full border border-[#d8dfc8]/15 bg-[#d8dfc8]/[0.06] px-3 py-1 text-[8px] uppercase tracking-[0.18em] text-[#d8dfc8]/65">
                              {plan.badge}
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                          Monthly
                        </span>
                      </div>

                      <div className="mt-12 flex items-end">
                        <span className="text-6xl font-medium tracking-[-0.07em] sm:text-7xl">
                          £{plan.price}
                        </span>

                        <span className="mb-2 ml-2 text-xs text-white/30">
                          /mo
                        </span>
                      </div>

                      <p className="mt-7 min-h-[72px] text-sm leading-6 text-white/35">
                        {plan.description}
                      </p>

                      <Link
                        href={`/login?plan=${plan.name.toLowerCase()}`}
                        className={`group mt-9 flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                          plan.featured
                            ? "bg-[#e6e9dd] text-black hover:bg-white"
                            : "border border-white/10 bg-white/[0.035] text-white hover:border-white/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        Select {plan.name}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>

                      <div className="mt-9 border-t border-white/[0.07] pt-8">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">
                          Includes
                        </p>

                        <div className="mt-6 space-y-4">
                          {plan.features.map((feature) => (
                            <div
                              key={feature}
                              className="flex items-start gap-3"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d8dfc8]/55" />

                              <span className="text-xs leading-5 text-white/45">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-8 text-center text-[10px] leading-5 text-white/20">
              Plan features and availability may evolve as
              TOTS-OS continues to grow.
            </p>
          </div>
        </section>

        {/* EMAIL CTA */}
        <section className="relative z-10 px-5 pb-28 sm:px-6 lg:px-8 lg:pb-40">
          <Reveal className="mx-auto max-w-[1250px]">
            <div className="relative overflow-hidden rounded-[44px] border border-white/[0.09] bg-[#0b0b0a] px-6 py-20 text-center sm:px-10 lg:py-28">
              <motion.div
                animate={{
                  scale: [0.8, 1.1, 0.8],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
                className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8dfc8]/[0.06] blur-[120px]"
              />

              <div className="relative mx-auto max-w-3xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                  <Sparkles className="h-5 w-5 text-[#d8dfc8]/60" />
                </div>

                <h2 className="mt-8 text-[clamp(2.8rem,5vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.06em]">
                  Keep up with
                  <span className="text-white/25">
                    {" "}
                    what comes next.
                  </span>
                </h2>

                <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/35">
                  Join the TOTS-OS mailing list for product
                  updates, announcements and early-access
                  news.
                </p>

                {!submitted ? (
                  <form
                    onSubmit={handleSubmit}
                    className="mx-auto mt-9 flex max-w-[620px] flex-col gap-3 rounded-[22px] border border-white/[0.08] bg-black/35 p-2 sm:flex-row"
                  >
                    <input
                      type="email"
                      required
                      aria-label="Email address"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="Enter your email address"
                      className="h-14 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/20"
                    />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#e6e9dd] px-7 text-[9px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white disabled:opacity-50"
                    >
                      {submitting
                        ? "Joining..."
                        : "Join updates"}

                      {!submitting && (
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      )}
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mx-auto mt-9 max-w-md rounded-2xl border border-[#d8dfc8]/10 bg-[#d8dfc8]/[0.045] p-5"
                  >
                    <CheckCircle2 className="mx-auto h-5 w-5 text-[#d8dfc8]/70" />

                    <p className="mt-3 text-sm font-medium">
                      You're on the list.
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Thanks for joining TOTS-OS updates.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.012] px-5 py-28 sm:px-6 lg:px-8 lg:py-36">
          <div className="mx-auto grid max-w-[1150px] gap-14 lg:grid-cols-[.7fr_1fr]">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>

              <h2 className="mt-7 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">
                A few things you might want to know.
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-6 text-white/35">
                Need something else? Get in touch with the
                TOTS-OS team.
              </p>

              <a
                href="mailto:hello@theorganisedtypes.co.uk"
                className="mt-7 inline-flex items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white"
              >
                Contact us
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Reveal>

            <div className="border-t border-white/[0.08]">
              {FAQS.map((faq, index) => {
                const open = openFaq === index;

                return (
                  <Reveal
                    key={faq.question}
                    delay={index * 0.04}
                  >
                    <div className="border-b border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaq(
                            open ? null : index
                          )
                        }
                        className="flex w-full items-center justify-between gap-8 py-6 text-left"
                      >
                        <span className="text-sm font-medium text-white/70 sm:text-base">
                          {faq.question}
                        </span>

                        <motion.div
                          animate={{
                            rotate: open ? 180 : 0,
                          }}
                        >
                          <ChevronDown className="h-4 w-4 text-white/25" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{
                              height: 0,
                              opacity: 0,
                            }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                            }}
                            className="overflow-hidden"
                          >
                            <p className="max-w-2xl pb-7 pr-10 text-sm leading-7 text-white/35">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative z-10 px-5 py-28 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-[1250px] text-center">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d8dfc8]/40">
                TOTS-OS
              </p>

              <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(3.3rem,7vw,8rem)] font-medium leading-[0.87] tracking-[-0.075em]">
                Your business.
                <span className="block text-white/20">
                  Finally organised.
                </span>
              </h2>

              <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#pricing"
                  className="group flex h-14 min-w-[190px] items-center justify-center gap-3 rounded-full bg-[#e7eadf] px-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white"
                >
                  View pricing
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>

                <Link
                  href="/login"
                  className="flex h-14 min-w-[190px] items-center justify-center gap-3 rounded-full border border-white/10 px-7 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55 transition hover:border-white/20 hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 border-t border-white/[0.07] px-5 pb-8 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-12 pb-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3"
                >
                  <img
                    src="/images/tots-os%20favicon.png"
                    alt="TOTS-OS"
                    className="h-10 w-10 rounded-xl"
                  />

                  <span className="text-xs font-semibold tracking-[0.18em]">
                    TOTS-OS
                  </span>
                </Link>

                <p className="mt-5 max-w-xs text-xs leading-6 text-white/28">
                  The all-in-one business operating system
                  for bringing your work, clients, planning
                  and operations together.
                </p>
              </div>

              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">
                  Product
                </p>

                <div className="mt-5 space-y-3 text-xs text-white/38">
                  <a
                    href="#features"
                    className="block transition hover:text-white"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="block transition hover:text-white"
                  >
                    Pricing
                  </a>
                  <Link
                    href="/login"
                    className="block transition hover:text-white"
                  >
                    Log in
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">
                  Company
                </p>

                <div className="mt-5 space-y-3 text-xs text-white/38">
                  <a
                    href="#about"
                    className="block transition hover:text-white"
                  >
                    About
                  </a>

                  <a
                    href="mailto:hello@theorganisedtypes.co.uk"
                    className="block transition hover:text-white"
                  >
                    Contact
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">
                  Legal
                </p>

                <div className="mt-5 space-y-3 text-xs text-white/38">
                  <Link
                    href="/privacy"
                    className="block transition hover:text-white"
                  >
                    Privacy Policy
                  </Link>

                  <Link
                    href="/terms"
                    className="block transition hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/[0.07] pt-7 text-[9px] text-white/20 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} TOTS-OS. All
                rights reserved.
              </p>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d8dfc8] opacity-30" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8dfc8]/60" />
                </span>

                <span className="uppercase tracking-[0.16em]">
                  TOTS-OS online
                </span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}