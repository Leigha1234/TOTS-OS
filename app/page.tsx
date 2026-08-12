"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cloud,
  ContactRound,
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
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

/* ---------------------------------------------------------------- */
/*  types                                                            */
/* ---------------------------------------------------------------- */

type NavItem = {
  label: string;
  href: string;
};

type Feature = {
  icon: LucideIcon;
  id: string;
  title: string;
  text: string;
};

type PricingPlan = {
  name: string;
  price: number;
  tag: string;
  featured?: boolean;
  badge?: string;
  description: string;
  features: string[];
};

type FAQ = {
  q: string;
  a: string;
};

type OrbitModule = {
  icon: LucideIcon;
  label: string;
  angle: number;
};

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
};

type BootSequenceProps = {
  done: boolean;
  onSkip: () => void;
};

/* ---------------------------------------------------------------- */
/*  content                                                          */
/* ---------------------------------------------------------------- */

const NAV_ITEMS: NavItem[] = [
  {
    label: "Product",
    href: "#product",
  },
  {
    label: "Modules",
    href: "#features",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "About",
    href: "#about",
  },
];

const BOOT_LINES = [
  "tots-os kernel  v1.0.4",
  "mounting workspace  ok",
  "loading module  CRM ................ ok",
  "loading module  PROJECTS ........... ok",
  "loading module  CALENDAR ........... ok",
  "loading module  FINANCE ............ ok",
  "loading module  SOCIALS ............ ok",
  "loading module  NOTES .............. ok",
  "indexing 6 modules  done",
  "workspace ready",
];

const FEATURES: Feature[] = [
  {
    icon: ContactRound,
    id: "01",
    title: "Know your clients",
    text: "Contacts, organisations and notes stay connected, so the context behind a relationship is never more than a click away.",
  },
  {
    icon: FolderKanban,
    id: "02",
    title: "Keep work moving",
    text: "Ideas become projects, projects become tasks, tasks become clear next actions — one workspace, no hand-offs.",
  },
  {
    icon: CalendarDays,
    id: "03",
    title: "See what's coming",
    text: "Events, deadlines and priorities sit on one connected calendar, built around how a business actually runs.",
  },
  {
    icon: CircleDollarSign,
    id: "04",
    title: "Understand the numbers",
    text: "Sales, expenses and the everyday financial picture, brought into a view that's built for founders, not accountants.",
  },
  {
    icon: MessageSquareText,
    id: "05",
    title: "Plan your content",
    text: "Social content and publishing sit beside everything else happening in the business, instead of off in another tab.",
  },
  {
    icon: NotebookPen,
    id: "06",
    title: "Capture every idea",
    text: "Notes, thoughts and brain-dumps land somewhere permanent, before they disappear into a forgotten app.",
  },
];

const PRICING: PricingPlan[] = [
  {
    name: "Standard",
    price: 29,
    tag: "boot",
    description:
      "The essential operating system for a founder building a more organised business.",
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
    tag: "run",
    featured: true,
    badge: "Most popular",
    description:
      "For growing businesses that need more power, visibility and connected workflows.",
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
    tag: "scale",
    description:
      "A complete operating environment for established teams and ambitious businesses.",
    features: [
      "Everything in Professional",
      "Advanced team access",
      "Enhanced operational tools",
      "Priority support",
      "Higher usage allowances",
      "Built for scaling",
    ],
  },
];

const FAQS: FAQ[] = [
  {
    q: "What is TOTS-OS?",
    a: "TOTS-OS is an all-in-one business operating system that brings projects, contacts, planning, finances and notes into one connected workspace.",
  },
  {
    q: "Who is it built for?",
    a: "Founders, small businesses and growing teams tired of running their business across disconnected apps, spreadsheets and browser tabs.",
  },
  {
    q: "Is it web based?",
    a: "Yes. TOTS-OS runs in the browser, so your workspace is reachable from any device through your account.",
  },
  {
    q: "Does it include social planning?",
    a: "Yes — social content and publishing workflows sit alongside the rest of your operations, not in a separate tool.",
  },
  {
    q: "I already have an account — where do I log in?",
    a: "Use the Log in button at the top of this page to open your existing TOTS-OS workspace.",
  },
];

const ORBIT_MODULES: OrbitModule[] = [
  {
    icon: Users,
    label: "CRM",
    angle: -90,
  },
  {
    icon: FolderKanban,
    label: "Projects",
    angle: -30,
  },
  {
    icon: WalletCards,
    label: "Finance",
    angle: 30,
  },
  {
    icon: CalendarDays,
    label: "Calendar",
    angle: 90,
  },
  {
    icon: MessageSquareText,
    label: "Socials",
    angle: 150,
  },
  {
    icon: BarChart3,
    label: "Insights",
    angle: 210,
  },
];

const WINDOW_NAV_ITEMS: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    active: true,
  },
  {
    icon: Users,
    label: "CRM",
  },
  {
    icon: FolderKanban,
    label: "Projects",
  },
  {
    icon: CalendarDays,
    label: "Calendar",
  },
  {
    icon: CircleDollarSign,
    label: "Finance",
  },
  {
    icon: MessageSquareText,
    label: "Socials",
  },
  {
    icon: NotebookPen,
    label: "Notes",
  },
];

/* ---------------------------------------------------------------- */
/*  primitives                                                       */
/* ---------------------------------------------------------------- */

function Cursor({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`tots-cursor ${className}`}
      aria-hidden="true"
    />
  );
}

function Eyebrow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="tots-eyebrow">
      <span className="tots-eyebrow-dot" />
      {children}
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="tots-corner tots-corner-tl" />
      <span className="tots-corner tots-corner-tr" />
      <span className="tots-corner tots-corner-bl" />
      <span className="tots-corner tots-corner-br" />
    </>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
  style,
}: RevealProps) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      initial={
        reduceMotion
          ? {
              opacity: 1,
            }
          : {
              opacity: 0,
              y: 36,
              filter:
                "blur(10px)",
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
        amount: 0.18,
      }}
      transition={{
        duration: 0.85,
        delay,
        ease: [
          0.19,
          1,
          0.22,
          1,
        ],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/*  boot sequence                                                    */
/* ---------------------------------------------------------------- */

function BootSequence({
  done,
  onSkip,
}: BootSequenceProps) {
  const [
    lineCount,
    setLineCount,
  ] = useState(0);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const reduceMotion =
    useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    if (
      lineCount >=
      BOOT_LINES.length
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setLineCount(
            (current) =>
              current + 1
          ),
        lineCount === 0
          ? 260
          : 190
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    lineCount,
    reduceMotion,
  ]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    setProgress(
      Math.min(
        100,
        Math.round(
          (lineCount /
            BOOT_LINES.length) *
            100
        )
      )
    );
  }, [
    lineCount,
    reduceMotion,
  ]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="tots-boot"
        >
          <div
            className="tots-boot-flash"
            data-done={
              progress >= 100
            }
          />

          <button
            className="tots-boot-skip"
            onClick={onSkip}
            type="button"
          >
            Skip intro
          </button>

          <div className="tots-boot-inner">
            <div className="tots-boot-brand">
              <span className="tots-boot-mark">
                TOTS–OS
              </span>

              <span className="tots-boot-sub">
                business operating
                system
              </span>
            </div>

            <div className="tots-boot-log">
              {BOOT_LINES.slice(
                0,
                lineCount
              ).map(
                (
                  line,
                  index
                ) => (
                  <div
                    key={`${line}-${index}`}
                    className="tots-boot-line"
                  >
                    <span className="tots-boot-caret">
                      ›
                    </span>

                    {line}
                  </div>
                )
              )}

              {lineCount <
                BOOT_LINES.length && (
                <div className="tots-boot-line tots-boot-line-active">
                  <span className="tots-boot-caret">
                    ›
                  </span>

                  <Cursor />
                </div>
              )}
            </div>

            <div className="tots-boot-bar-track">
              <motion.div
                className="tots-boot-bar-fill"
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: 0.25,
                }}
              />
            </div>

            <div className="tots-boot-progress-label">
              <span>
                booting workspace
              </span>

              <span>
                {progress}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------- */
/*  product window                                                   */
/* ---------------------------------------------------------------- */

function ProductWindow() {
  const ref =
    useRef<HTMLDivElement | null>(
      null
    );

  const {
    scrollYProgress,
  } = useScroll({
    target: ref,
    offset: [
      "start end",
      "end start",
    ],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [30, -30]
  );

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: 60,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: 0.5,
        duration: 1.2,
        ease: [
          0.19,
          1,
          0.22,
          1,
        ],
      }}
      style={{
        y,
      }}
      className="tots-window-wrap"
    >
      <div className="tots-window-glow" />

      <div className="tots-window">
        <div className="tots-window-bar">
          <div className="tots-window-dots">
            <span />
            <span />
            <span />
          </div>

          <div className="tots-window-tab">
            tots-os / workspace
          </div>

          <div className="tots-window-status">
            <span className="tots-status-dot" />
            live
          </div>
        </div>

        <div className="tots-window-body">
          <aside className="tots-window-side">
            <div className="tots-window-side-brand">
              <div className="tots-window-logo">
                T
              </div>

              <span className="tots-window-side-label">
                workspace
              </span>
            </div>

            <div className="tots-window-nav">
              {WINDOW_NAV_ITEMS.map(
                ({
                  icon: Icon,
                  label,
                  active,
                }) => (
                  <div
                    key={label}
                    className={`tots-window-navitem ${
                      active
                        ? "is-active"
                        : ""
                    }`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={
                        1.75
                      }
                    />

                    <span>
                      {label}
                    </span>
                  </div>
                )
              )}
            </div>
          </aside>

          <div className="tots-window-main">
            <div className="tots-window-mainhead">
              <div>
                <p className="tots-mono-label">
                  wed · 12 aug
                </p>

                <h3>
                  Good morning.
                </h3>
              </div>

              <div className="tots-window-avatar">
                TO
              </div>
            </div>

            <div className="tots-window-stats">
              {[
                [
                  "Revenue",
                  "£12,840",
                  "+14.2%",
                ],
                [
                  "Open projects",
                  "08",
                  "3 due soon",
                ],
                [
                  "Tasks",
                  "24",
                  "6 today",
                ],
                [
                  "Contacts",
                  "142",
                  "+8 mo",
                ],
              ].map(
                ([
                  label,
                  value,
                  note,
                ]) => (
                  <div
                    key={label}
                    className="tots-stat-card"
                  >
                    <p className="tots-mono-label">
                      {label}
                    </p>

                    <p className="tots-stat-value">
                      {value}
                    </p>

                    <p className="tots-stat-note">
                      {note}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="tots-window-panels">
              <div className="tots-panel">
                <div className="tots-panel-head">
                  <div>
                    <p className="tots-mono-label">
                      pulse
                    </p>

                    <p className="tots-panel-title">
                      Performance
                    </p>
                  </div>

                  <BarChart3
                    size={16}
                    strokeWidth={
                      1.5
                    }
                    className="tots-dim-icon"
                  />
                </div>

                <div className="tots-bars">
                  {[
                    36,
                    44,
                    40,
                    58,
                    52,
                    66,
                    62,
                    80,
                    72,
                    89,
                    84,
                    96,
                  ].map(
                    (
                      height,
                      index
                    ) => (
                      <motion.div
                        key={`${height}-${index}`}
                        initial={{
                          height:
                            0,
                        }}
                        whileInView={{
                          height: `${height}%`,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          duration:
                            0.7,
                          delay:
                            index *
                            0.035,
                        }}
                        className="tots-bar"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="tots-panel">
                <div className="tots-panel-head">
                  <div>
                    <p className="tots-mono-label">
                      today
                    </p>

                    <p className="tots-panel-title">
                      Focus
                    </p>
                  </div>

                  <Target
                    size={16}
                    strokeWidth={
                      1.5
                    }
                    className="tots-dim-icon"
                  />
                </div>

                <div className="tots-tasks">
                  {[
                    [
                      "Prepare client proposal",
                      "09:30",
                    ],
                    [
                      "Review campaign",
                      "11:00",
                    ],
                    [
                      "Finance check-in",
                      "14:30",
                    ],
                    [
                      "Schedule content",
                      "16:00",
                    ],
                  ].map(
                    ([
                      task,
                      time,
                    ]) => (
                      <div
                        key={task}
                        className="tots-task-row"
                      >
                        <span className="tots-task-dot" />

                        <span className="tots-task-label">
                          {task}
                        </span>

                        <span className="tots-task-time">
                          {time}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/*  main                                                             */
/* ---------------------------------------------------------------- */

export default function TotsOSLanding() {
  const reduceMotion =
    useReducedMotion();

  const [
    bootDone,
    setBootDone,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    openFaq,
    setOpenFaq,
  ] = useState<
    number | null
  >(0);

  useEffect(() => {
    if (reduceMotion) {
      setBootDone(true);
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setBootDone(true),
        2600
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [reduceMotion]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubmitted(true);
    setEmail("");
  }

  return (
    <div className="tots-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #08080a;
        }

        .tots-root {
          --bg: #08080a;
          --bg-1: #0e0e10;
          --bg-2: #131315;
          --ink: #f3f4ee;
          --ink-dim: rgba(243,244,238,0.44);
          --ink-faint: rgba(243,244,238,0.20);
          --ink-ghost: rgba(243,244,238,0.09);
          --accent: #d7e0a8;
          --accent-soft: rgba(215,224,168,0.14);
          --accent-deep: #7c8a52;
          --line: rgba(243,244,238,0.09);
          --line-soft: rgba(243,244,238,0.055);

          min-height: 100vh;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          position: relative;
          overflow-x: hidden;
          isolation: isolate;
        }

        .tots-root * {
          box-sizing: border-box;
        }

        .tots-root h1,
        .tots-root h2,
        .tots-root h3 {
          font-family: 'Space Grotesk', ui-sans-serif, sans-serif;
          letter-spacing: -0.04em;
          margin: 0;
        }

        .tots-root p {
          margin-top: 0;
          margin-bottom: 0;
        }

        .tots-root ::selection {
          background: var(--accent);
          color: #08080a;
        }

        .tots-mono {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }

        .tots-mono-label {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin: 0;
        }

        /* cursor */

        .tots-cursor {
          display: inline-block;
          width: 8px;
          height: 1em;
          background: var(--accent);
          margin-left: 2px;
          vertical-align: -0.15em;
          animation: tots-blink 1s steps(1) infinite;
        }

        @keyframes tots-blink {
          50% {
            opacity: 0;
          }
        }

        /* eyebrow */

        .tots-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,0.02);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-dim);
        }

        .tots-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
        }

        /* background */

        .tots-bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;

          background-image:
            linear-gradient(rgba(243,244,238,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(243,244,238,0.05) 1px, transparent 1px);

          background-size: 64px 64px;
          opacity: 0.35;

          -webkit-mask-image:
            radial-gradient(
              ellipse 70% 55% at 50% 0%,
              black 10%,
              transparent 75%
            );

          mask-image:
            radial-gradient(
              ellipse 70% 55% at 50% 0%,
              black 10%,
              transparent 75%
            );
        }

        .tots-bg-glow {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;

          background:
            radial-gradient(
              ellipse 60% 40% at 50% -8%,
              rgba(215,224,168,0.10),
              transparent 55%
            );
        }

        /* corners */

        .tots-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: var(--ink-ghost);
          border-style: solid;
          border-width: 0;
          opacity: 0;
          transition:
            opacity .3s ease,
            border-color .3s ease;
        }

        .tots-corner-tl {
          top: -1px;
          left: -1px;
          border-top-width: 1px;
          border-left-width: 1px;
        }

        .tots-corner-tr {
          top: -1px;
          right: -1px;
          border-top-width: 1px;
          border-right-width: 1px;
        }

        .tots-corner-bl {
          bottom: -1px;
          left: -1px;
          border-bottom-width: 1px;
          border-left-width: 1px;
        }

        .tots-corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom-width: 1px;
          border-right-width: 1px;
        }

        .tots-hud:hover .tots-corner {
          opacity: 1;
          border-color: var(--accent);
        }

        /* boot sequence */

        .tots-boot {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #050506;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .tots-boot-flash {
          position: absolute;
          inset: 0;
          background: var(--accent);
          opacity: 0;
          pointer-events: none;
        }

        .tots-boot-flash[data-done="true"] {
          animation: tots-flash 0.6s ease forwards;
          animation-delay: 0.15s;
        }

        @keyframes tots-flash {
          0% {
            opacity: 0;
          }

          45% {
            opacity: 0.9;
          }

          100% {
            opacity: 0;
          }
        }

        .tots-boot-skip {
          position: absolute;
          top: 22px;
          right: 22px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--ink-faint);

          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 14px;
          cursor: pointer;
        }

        .tots-boot-skip:hover {
          color: var(--ink);
        }

        .tots-boot-inner {
          width: min(560px, 88vw);
        }

        .tots-boot-brand {
          margin-bottom: 34px;
        }

        .tots-boot-mark {
          display: block;

          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2.2rem, 6vw, 3rem);
          font-weight: 600;
          letter-spacing: -0.04em;
        }

        .tots-boot-sub {
          display: block;
          margin-top: 6px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.7;
        }

        .tots-boot-log {
          min-height: 210px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 1.9;
          color: var(--ink-dim);
        }

        .tots-boot-line {
          display: flex;
          gap: 8px;
        }

        .tots-boot-caret {
          color: var(--accent);
        }

        .tots-boot-line-active {
          color: var(--ink);
        }

        .tots-boot-bar-track {
          margin-top: 22px;
          height: 2px;
          width: 100%;
          background: var(--line);
          overflow: hidden;
        }

        .tots-boot-bar-fill {
          height: 100%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
        }

        .tots-boot-progress-label {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        /* nav */

        .tots-nav-shell {
          position: fixed;
          inset-inline: 0;
          top: 0;
          z-index: 50;
          padding: 16px 20px 0;
        }

        .tots-nav {
          max-width: 1400px;
          margin: 0 auto;
          height: 64px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border: 1px solid var(--line);
          border-radius: 18px;

          background: rgba(8,8,10,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          padding: 0 10px 0 16px;
        }

        .tots-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          text-decoration: none;
          color: inherit;
        }

        .tots-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;

          background:
            linear-gradient(
              155deg,
              var(--accent),
              var(--accent-deep)
            );

          color: #08080a;

          display: flex;
          align-items: center;
          justify-content: center;

          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 15px;
        }

        .tots-brand-name {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
        }

        .tots-brand-sub {
          font-size: 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-faint);
          font-family: 'JetBrains Mono', monospace;
        }

        .tots-nav-links {
          display: none;
          align-items: center;
          gap: 2px;
        }

        .tots-nav-link {
          padding: 9px 15px;
          border-radius: 999px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;

          color: var(--ink-dim);
          text-decoration: none;

          transition:
            background .2s,
            color .2s;
        }

        .tots-nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: var(--ink);
        }

        .tots-nav-actions {
          display: none;
          align-items: center;
          gap: 8px;
        }

        .tots-btn-ghost {
          min-height: 40px;
          padding: 0 16px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border: 1px solid var(--line);
          border-radius: 999px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;

          color: var(--ink-dim);
          text-decoration: none;

          transition:
            border-color .2s,
            color .2s,
            transform .2s;
        }

        .tots-btn-ghost:hover {
          border-color: var(--ink-faint);
          color: var(--ink);
          transform: translateY(-1px);
        }

        .tots-btn-solid {
          min-height: 40px;
          padding: 0 18px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border-radius: 999px;
          background: var(--accent);
          color: #08080a;

          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;

          text-decoration: none;
          border: none;
          cursor: pointer;

          transition:
            transform .2s,
            background .2s;
        }

        .tots-btn-solid:hover {
          background: #fff;
          transform: translateY(-1px);
        }

        .tots-btn-solid.lg,
        .tots-btn-ghost.lg {
          min-height: 56px;
          padding: 0 28px;
          font-size: 10px;
        }

        .tots-menu-btn {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid var(--line);

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--ink-dim);
          background: transparent;
          cursor: pointer;
        }

        @media (min-width: 1024px) {
          .tots-nav-links {
            display: flex;
          }
        }

        @media (min-width: 640px) {
          .tots-nav-actions {
            display: flex;
          }

          .tots-menu-btn {
            display: none;
          }
        }

        .tots-mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 90;

          background: rgba(5,5,6,0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);

          padding: 16px;
        }

        .tots-mobile-panel {
          border: 1px solid var(--line);
          border-radius: 24px;
          background: var(--bg-1);
          padding: 20px;
        }

        .tots-mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 16px 14px;
          border-radius: 16px;

          color: var(--ink-dim);
          text-decoration: none;

          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .tots-mobile-link:hover {
          background: rgba(255,255,255,0.05);
        }

        /* hero */

        .tots-hero {
          position: relative;
          z-index: 10;
          padding: 150px 20px 90px;
          min-height: 100vh;
        }

        .tots-hero-inner {
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
        }

        .tots-hero h1 {
          margin: 28px auto 0;
          max-width: 1160px;

          font-size: clamp(2.6rem, 7.6vw, 7.6rem);
          line-height: 0.94;
          font-weight: 600;
        }

        .tots-hero-line2 {
          display: block;

          background:
            linear-gradient(
              90deg,
              #fff,
              var(--accent) 60%,
              rgba(255,255,255,0.4)
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .tots-hero p.lede {
          max-width: 640px;
          margin: 26px auto 0;

          font-size: clamp(0.95rem, 1.4vw, 1.1rem);
          line-height: 1.7;
          color: var(--ink-dim);
        }

        .tots-hero-ctas {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 12px;
          margin-top: 38px;
        }

        @media (min-width: 640px) {
          .tots-hero-ctas {
            flex-direction: row;
          }
        }

        .tots-hero-meta {
          margin-top: 30px;

          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;

          gap: 20px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .tots-hero-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* window */

        .tots-window-wrap {
          position: relative;
          margin: 88px auto 0;
          max-width: 1180px;
        }

        .tots-window-glow {
          position: absolute;
          inset: -30px;

          background:
            radial-gradient(
              ellipse,
              rgba(215,224,168,0.10),
              transparent 70%
            );

          filter: blur(40px);
        }

        .tots-window {
          position: relative;
          overflow: hidden;

          border-radius: 20px;
          border: 1px solid var(--line);
          background: #0a0a0b;

          box-shadow:
            0 60px 160px rgba(0,0,0,0.6);
        }

        .tots-window-bar {
          display: flex;
          align-items: center;
          gap: 12px;

          height: 42px;
          padding: 0 16px;

          border-bottom: 1px solid var(--line-soft);
          background: rgba(255,255,255,0.015);
        }

        .tots-window-dots {
          display: flex;
          gap: 6px;
        }

        .tots-window-dots span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
        }

        .tots-window-tab {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--ink-faint);
          letter-spacing: 0.08em;
        }

        .tots-window-status {
          margin-left: auto;

          display: flex;
          align-items: center;
          gap: 6px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;

          color: var(--accent);
          opacity: 0.8;
        }

        .tots-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;

          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
        }

        .tots-window-body {
          display: grid;
          grid-template-columns: 64px 1fr;
          min-height: 540px;
        }

        @media (min-width: 768px) {
          .tots-window-body {
            grid-template-columns: 190px 1fr;
          }
        }

        .tots-window-side {
          border-right: 1px solid var(--line-soft);
          background: #08080a;
          padding: 16px;
        }

        .tots-window-side-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tots-window-logo {
          width: 30px;
          height: 30px;
          border-radius: 8px;

          background: var(--accent);
          color: #08080a;

          display: flex;
          align-items: center;
          justify-content: center;

          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 13px;
        }

        .tots-window-side-label {
          display: none;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        @media (min-width: 768px) {
          .tots-window-side-label {
            display: inline;
          }
        }

        .tots-window-nav {
          margin-top: 30px;

          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tots-window-navitem {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px;
          border-radius: 10px;

          color: var(--ink-faint);
        }

        .tots-window-navitem span {
          display: none;
          font-size: 11px;
        }

        @media (min-width: 768px) {
          .tots-window-navitem span {
            display: inline;
          }
        }

        .tots-window-navitem.is-active {
          background: var(--accent);
          color: #08080a;
        }

        .tots-window-main {
          padding: 18px;
          min-width: 0;
        }

        @media (min-width: 640px) {
          .tots-window-main {
            padding: 26px;
          }
        }

        .tots-window-mainhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .tots-window-mainhead h3 {
          font-size: 22px;
          font-weight: 500;
          margin-top: 6px;
        }

        .tots-window-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;

          background: var(--accent);
          color: #08080a;

          display: flex;
          align-items: center;
          justify-content: center;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
        }

        .tots-window-stats {
          margin-top: 24px;

          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 1024px) {
          .tots-window-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .tots-stat-card {
          border: 1px solid var(--line-soft);
          background: rgba(255,255,255,0.02);
          border-radius: 14px;
          padding: 16px;
          min-width: 0;
        }

        .tots-stat-value {
          margin-top: 12px;

          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 500;
          letter-spacing: -0.03em;
        }

        .tots-stat-note {
          margin-top: 6px;
          font-size: 9px;
          color: var(--accent);
          opacity: 0.6;
        }

        .tots-window-panels {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        @media (min-width: 1024px) {
          .tots-window-panels {
            grid-template-columns: 1.35fr 0.65fr;
          }
        }

        .tots-panel {
          border: 1px solid var(--line-soft);
          background: rgba(255,255,255,0.02);
          border-radius: 14px;
          padding: 18px;
          min-width: 0;
        }

        .tots-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tots-panel-title {
          margin-top: 4px;
          font-size: 13px;
          color: rgba(243,244,238,0.8);
        }

        .tots-dim-icon {
          color: rgba(243,244,238,0.18);
        }

        .tots-bars {
          margin-top: 28px;

          display: flex;
          align-items: flex-end;
          gap: 6px;

          height: 170px;
        }

        .tots-bar {
          flex: 1;
          border-radius: 3px 3px 0 0;

          background:
            linear-gradient(
              180deg,
              var(--accent-soft),
              rgba(215,224,168,0.02)
            );
        }

        .tots-tasks {
          margin-top: 20px;

          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tots-task-row {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px;
          border-radius: 10px;

          background: rgba(0,0,0,0.2);
          border: 1px solid var(--line-soft);
        }

        .tots-task-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;

          border: 1px solid rgba(215,224,168,0.5);
          flex-shrink: 0;
        }

        .tots-task-label {
          flex: 1;
          min-width: 0;

          font-size: 11px;
          color: rgba(243,244,238,0.65);

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tots-task-time {
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--ink-faint);
        }

        /* marquee */

        .tots-marquee {
          position: relative;
          z-index: 10;

          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);

          overflow: hidden;
          padding: 26px 0;
        }

        .tots-marquee-track {
          display: flex;
          width: max-content;
        }

        .tots-marquee-item {
          padding: 0 32px;

          display: flex;
          align-items: center;
          gap: 12px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--ink-faint);

          white-space: nowrap;
        }

        @media (min-width: 640px) {
          .tots-marquee-item {
            padding: 0 48px;
          }
        }

        /* section */

        .tots-section {
          position: relative;
          z-index: 10;
          padding: 100px 20px;
        }

        @media (min-width: 1024px) {
          .tots-section {
            padding: 140px 24px;
          }
        }

        .tots-section.bordered {
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          background: rgba(255,255,255,0.008);
        }

        .tots-wrap {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tots-wrap-narrow {
          max-width: 1150px;
          margin: 0 auto;
        }

        /* why */

        .tots-why-grid {
          margin-top: 60px;
          display: grid;
          gap: 12px;
        }

        @media (min-width: 1024px) {
          .tots-why-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .tots-why-card {
          position: relative;

          min-height: 340px;

          border: 1px solid var(--line);
          border-radius: 24px;
          background: rgba(255,255,255,0.018);

          padding: 30px;

          display: flex;
          flex-direction: column;
        }

        .tots-why-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tots-why-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;

          border: 1px solid var(--line);
          background: rgba(255,255,255,0.03);

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--accent);
        }

        .tots-why-card h3 {
          margin-top: auto;
          padding-top: 90px;

          font-size: 24px;
          font-weight: 500;
        }

        .tots-why-card p {
          margin-top: 12px;

          font-size: 13.5px;
          line-height: 1.7;
          color: var(--ink-dim);

          max-width: 340px;
        }

        /* features */

        .tots-feat-grid {
          margin-top: 60px;

          display: grid;
          gap: 1px;

          background: var(--line);
          border: 1px solid var(--line);
          border-radius: 26px;

          overflow: hidden;
        }

        @media (min-width: 768px) {
          .tots-feat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .tots-feat-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .tots-feat-card {
          background: #08080a;
          padding: 32px;
          min-height: 300px;
          height: 100%;

          transition: background .25s;
        }

        .tots-feat-card:hover {
          background: rgba(255,255,255,0.025);
        }

        .tots-feat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .tots-feat-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;

          border: 1px solid var(--line);
          background: rgba(255,255,255,0.03);

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--accent);
        }

        .tots-feat-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--ink-ghost);
        }

        .tots-feat-card h3 {
          margin-top: 40px;
          font-size: 21px;
          font-weight: 500;
        }

        .tots-feat-card p {
          margin-top: 12px;

          font-size: 13px;
          line-height: 1.7;
          color: var(--ink-dim);

          max-width: 320px;
        }

        /* connected */

        .tots-connect-grid {
          display: grid;
          gap: 60px;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .tots-connect-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* orbit */

        .tots-orbit-wrap {
          position: relative;
          margin: 0 auto;
          aspect-ratio: 1;
          width: 100%;
          max-width: 560px;
        }

        .tots-orbit-ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid var(--line);
        }

        .tots-orbit-ring.r1 {
          inset: 12%;
        }

        .tots-orbit-ring.r2 {
          inset: 28%;
          border-style: dashed;
          border-color: var(--ink-ghost);
        }

        .tots-orbit-core {
          position: absolute;
          left: 50%;
          top: 50%;

          transform: translate(-50%, -50%);

          width: 118px;
          height: 118px;
          border-radius: 30px;

          background: rgba(215,224,168,0.06);
          border: 1px solid rgba(215,224,168,0.22);

          display: flex;
          align-items: center;
          justify-content: center;

          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 30px;
          color: var(--accent);
        }

        .tots-orbit-node {
          position: absolute;

          width: 84px;
          height: 84px;
          margin: -42px;

          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(10,10,11,0.9);

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;

          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .tots-orbit-node span {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        @media (max-width: 520px) {
          .tots-orbit-node {
            width: 66px;
            height: 66px;
            margin: -33px;
            border-radius: 15px;
          }

          .tots-orbit-node span {
            font-size: 6.5px;
          }

          .tots-orbit-core {
            width: 90px;
            height: 90px;
            border-radius: 24px;
          }
        }

        /* checklist */

        .tots-check-list {
          margin-top: 34px;

          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tots-check-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tots-check-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;

          border: 1px solid rgba(215,224,168,0.25);
          background: var(--accent-soft);

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--accent);
          flex-shrink: 0;
        }

        .tots-check-row span.txt {
          font-size: 14px;
          color: rgba(243,244,238,0.7);
        }

        /* security */

        .tots-sec-card {
          position: relative;
          overflow: hidden;

          border-radius: 32px;
          border: 1px solid var(--line);
          background: #0a0a09;

          padding: 34px;
        }

        @media (min-width: 1024px) {
          .tots-sec-card {
            padding: 60px;
          }
        }

        .tots-sec-grid {
          display: grid;
          gap: 40px;
        }

        @media (min-width: 1024px) {
          .tots-sec-grid {
            grid-template-columns: 1fr 0.85fr;
            align-items: center;
          }
        }

        .tots-sec-items {
          display: grid;
          gap: 10px;
        }

        @media (min-width: 640px) {
          .tots-sec-items {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .tots-sec-item {
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
          border-radius: 16px;
          padding: 18px;
        }

        .tots-sec-item h4 {
          margin: 16px 0 0;
          font-size: 13px;
          font-weight: 500;
        }

        .tots-sec-item p {
          margin-top: 6px;

          font-size: 11.5px;
          line-height: 1.6;
          color: var(--ink-faint);
        }

        /* pricing */

        .tots-price-grid {
          margin-top: 60px;
          display: grid;
          gap: 12px;
        }

        @media (min-width: 1024px) {
          .tots-price-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .tots-price-card {
          position: relative;

          display: flex;
          flex-direction: column;

          min-height: 640px;

          border-radius: 28px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.018);

          padding: 30px;
          height: 100%;
        }

        .tots-price-card.featured {
          border-color: rgba(215,224,168,0.35);
          background: rgba(215,224,168,0.045);
        }

        .tots-price-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .tots-price-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
        }

        .tots-price-badge {
          margin-top: 10px;

          display: inline-block;

          border: 1px solid rgba(215,224,168,0.3);
          background: var(--accent-soft);
          color: var(--accent);

          border-radius: 999px;
          padding: 4px 10px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .tots-price-figure {
          margin-top: 40px;
          display: flex;
          align-items: flex-end;
        }

        .tots-price-amount {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 58px;
          font-weight: 600;
          letter-spacing: -0.04em;
        }

        .tots-price-period {
          margin-bottom: 8px;
          margin-left: 6px;

          font-size: 12px;
          color: var(--ink-faint);
        }

        .tots-price-desc {
          margin-top: 22px;
          min-height: 68px;

          font-size: 13.5px;
          line-height: 1.6;
          color: var(--ink-dim);
        }

        .tots-price-includes {
          margin-top: 30px;
          border-top: 1px solid var(--line-soft);
          padding-top: 26px;
        }

        .tots-price-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-top: 14px;
        }

        .tots-price-feature span {
          font-size: 12.5px;
          line-height: 1.5;
          color: rgba(243,244,238,0.55);
        }

        /* FAQ */

        .tots-faq-grid {
          display: grid;
          gap: 50px;
        }

        @media (min-width: 1024px) {
          .tots-faq-grid {
            grid-template-columns: 0.7fr 1fr;
          }
        }

        .tots-faq-item {
          border-bottom: 1px solid var(--line);
        }

        .tots-faq-btn {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          padding: 22px 0;

          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          color: inherit;
        }

        .tots-faq-btn span {
          font-size: 14.5px;
          font-weight: 500;
          color: rgba(243,244,238,0.78);
        }

        .tots-faq-answer {
          font-size: 13.5px;
          line-height: 1.7;
          color: var(--ink-dim);

          max-width: 640px;
          padding-bottom: 26px;
        }

        /* email CTA */

        .tots-cta-card {
          position: relative;
          overflow: hidden;

          border-radius: 40px;
          border: 1px solid var(--line);
          background: #0b0b0a;

          padding: 60px 24px;
          text-align: center;
        }

        @media (min-width: 1024px) {
          .tots-cta-card {
            padding: 96px 40px;
          }
        }

        .tots-cta-icon {
          margin: 0 auto;

          width: 52px;
          height: 52px;
          border-radius: 15px;

          border: 1px solid var(--line);
          background: rgba(255,255,255,0.03);

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--accent);
        }

        .tots-cta-form {
          margin: 34px auto 0;
          max-width: 560px;

          display: flex;
          flex-direction: column;
          gap: 10px;

          border: 1px solid var(--line);
          border-radius: 20px;
          background: rgba(0,0,0,0.3);

          padding: 8px;
        }

        @media (min-width: 640px) {
          .tots-cta-form {
            flex-direction: row;
          }
        }

        .tots-cta-input {
          min-height: 50px;
          flex: 1;

          background: transparent;
          border: none;
          outline: none;

          padding: 0 16px;

          color: var(--ink);
          font-size: 13.5px;
        }

        .tots-cta-input::placeholder {
          color: var(--ink-ghost);
        }

        /* footer */

        .tots-footer {
          position: relative;
          z-index: 10;

          border-top: 1px solid var(--line);

          padding: 60px 20px 30px;
        }

        .tots-footer-grid {
          display: grid;
          gap: 40px;
          padding-bottom: 50px;
        }

        @media (min-width: 768px) {
          .tots-footer-grid {
            grid-template-columns: 1.5fr repeat(3, 1fr);
          }
        }

        .tots-footer h5 {
          margin: 0;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .tots-footer-links {
          margin-top: 16px;

          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tots-footer-links a {
          font-size: 12.5px;
          color: var(--ink-dim);
          text-decoration: none;
        }

        .tots-footer-links a:hover {
          color: var(--ink);
        }

        .tots-footer-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;

          border-top: 1px solid var(--line);
          padding-top: 22px;

          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          color: var(--ink-faint);
        }

        @media (min-width: 640px) {
          .tots-footer-bottom {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tots-cursor {
            animation: none;
          }
        }
      `}</style>

      <div className="tots-bg-grid" />
      <div className="tots-bg-glow" />

      <BootSequence
        done={bootDone}
        onSkip={() =>
          setBootDone(true)
        }
      />

      {/* NAV */}

      <div className="tots-nav-shell">
        <div className="tots-nav">
          <a
            href="#"
            className="tots-brand"
          >
            <span className="tots-brand-mark">
              T
            </span>

            <span>
              <span
                className="tots-brand-name"
                style={{
                  display:
                    "block",
                }}
              >
                TOTS-OS
              </span>

              <span className="tots-brand-sub">
                business os
              </span>
            </span>
          </a>

          <nav className="tots-nav-links">
            {NAV_ITEMS.map(
              (item) => (
                <a
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="tots-nav-link"
                >
                  {
                    item.label
                  }
                </a>
              )
            )}
          </nav>

          <div className="tots-nav-actions">
            <a
              href="/login"
              className="tots-btn-ghost"
            >
              <LogIn
                size={13}
              />
              Log in
            </a>

            <a
              href="#pricing"
              className="tots-btn-solid"
            >
              View plans
              <ArrowRight
                size={13}
              />
            </a>
          </div>

          <button
            type="button"
            className="tots-menu-btn"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            aria-label="Open menu"
          >
            <Menu
              size={16}
            />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}

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
            className="tots-mobile-menu"
          >
            <motion.div
              initial={{
                y: -24,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -16,
                opacity: 0,
              }}
              className="tots-mobile-panel"
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <div className="tots-brand">
                  <span className="tots-brand-mark">
                    T
                  </span>

                  <span className="tots-brand-name">
                    TOTS-OS
                  </span>
                </div>

                <button
                  type="button"
                  className="tots-menu-btn"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  aria-label="Close menu"
                >
                  <X
                    size={16}
                  />
                </button>
              </div>

              <div
                style={{
                  marginTop: 24,
                }}
              >
                {NAV_ITEMS.map(
                  (item) => (
                    <a
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className="tots-mobile-link"
                    >
                      {
                        item.label
                      }

                      <ArrowUpRight
                        size={
                          14
                        }
                      />
                    </a>
                  )
                )}
              </div>

              <div
                style={{
                  marginTop: 20,
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 8,
                }}
              >
                <a
                  href="/login"
                  className="tots-btn-ghost"
                  style={{
                    justifyContent:
                      "center",
                  }}
                >
                  Log in
                </a>

                <a
                  href="#pricing"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className="tots-btn-solid"
                  style={{
                    justifyContent:
                      "center",
                  }}
                >
                  View plans
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}

      <section className="tots-hero">
        <div className="tots-hero-inner">
          <Eyebrow>
            [ business os —
            v1.0 ]
          </Eyebrow>

          <h1>
            Run your business

            <span className="tots-hero-line2">
              without the chaos.
              <Cursor />
            </span>
          </h1>

          <p className="lede">
            TOTS-OS boots your
            business into one
            connected system —
            projects, clients,
            finances, planning and
            content, running from a
            single workspace.
          </p>

          <div className="tots-hero-ctas">
            <a
              href="#pricing"
              className="tots-btn-solid lg"
            >
              Explore TOTS-OS

              <ArrowRight
                size={15}
              />
            </a>

            <a
              href="#product"
              className="tots-btn-ghost lg"
            >
              <Play
                size={13}
                style={{
                  fill:
                    "currentColor",
                }}
              />

              See the system
            </a>
          </div>

          <div className="tots-hero-meta">
            <span>
              <Check
                size={12}
                color="var(--accent)"
              />
              web based
            </span>

            <span>
              <Check
                size={12}
                color="var(--accent)"
              />
              secure account
              access
            </span>

            <span>
              <Check
                size={12}
                color="var(--accent)"
              />
              6 modules, one
              system
            </span>
          </div>

          <ProductWindow />
        </div>
      </section>

      {/* MARQUEE */}

      <section className="tots-marquee">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    "0%",
                    "-50%",
                  ],
                }
          }
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "linear",
          }}
          className="tots-marquee-track"
        >
          {[0, 1].flatMap(
            (group) =>
              [
                "CRM",
                "PROJECTS",
                "FINANCE",
                "CALENDAR",
                "SOCIALS",
                "NOTES",
                "TASKS",
                "BUSINESS KPIS",
              ].map(
                (
                  item,
                  index
                ) => (
                  <span
                    key={`${group}-${index}`}
                    className="tots-marquee-item"
                  >
                    {item}

                    <Sparkles
                      size={11}
                      color="var(--accent)"
                      opacity={
                        0.4
                      }
                    />
                  </span>
                )
              )
          )}
        </motion.div>
      </section>

      {/* WHY */}

      <section
        id="product"
        className="tots-section"
      >
        <div className="tots-wrap">
          <Reveal>
            <div
              style={{
                display:
                  "grid",
                gap: 32,
              }}
            >
              <Eyebrow>
                why tots-os
              </Eyebrow>

              <h2
                style={{
                  fontSize:
                    "clamp(2.4rem,5.6vw,5.6rem)",
                  lineHeight:
                    0.98,
                  fontWeight:
                    500,
                  maxWidth:
                    900,
                }}
              >
                Stop building your
                business around{" "}

                <span
                  style={{
                    color:
                      "var(--ink-faint)",
                  }}
                >
                  disconnected
                  tools.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="tots-why-grid">
            {[
              {
                icon: Layers3,
                id: "why.01",
                title:
                  "One connected workspace",
                text:
                  "The parts of your business belong together — the context around clients, work, money and plans, always close at hand.",
              },
              {
                icon: Gauge,
                id: "why.02",
                title:
                  "Clarity at a glance",
                text:
                  "See what needs attention, what is moving and what comes next, without rebuilding the picture every morning.",
              },
              {
                icon: Zap,
                id: "why.03",
                title:
                  "Less admin friction",
                text:
                  "Spend less time maintaining your organisation system, and more time actually using it to move forward.",
              },
            ].map(
              (
                item,
                index
              ) => {
                const Icon =
                  item.icon;

                return (
                  <Reveal
                    key={
                      item.id
                    }
                    delay={
                      index *
                      0.08
                    }
                  >
                    <div className="tots-why-card tots-hud">
                      <Corners />

                      <div className="tots-why-top">
                        <span className="tots-mono-label">
                          {
                            item.id
                          }
                        </span>

                        <div className="tots-why-icon">
                          <Icon
                            size={
                              18
                            }
                            strokeWidth={
                              1.6
                            }
                          />
                        </div>
                      </div>

                      <h3>
                        {
                          item.title
                        }
                      </h3>

                      <p>
                        {
                          item.text
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section
        id="features"
        className="tots-section bordered"
      >
        <div className="tots-wrap">
          <Reveal className="tots-wrap-narrow">
            <div
              style={{
                textAlign:
                  "center",
              }}
            >
              <Eyebrow>
                inside the system
              </Eyebrow>

              <h2
                style={{
                  margin:
                    "26px auto 0",
                  maxWidth:
                    760,
                  fontSize:
                    "clamp(2.4rem,5.4vw,5rem)",
                  lineHeight:
                    0.98,
                  fontWeight:
                    500,
                }}
              >
                Everything has a
                place.
              </h2>

              <p
                style={{
                  margin:
                    "24px auto 0",
                  maxWidth:
                    560,
                  fontSize:
                    14.5,
                  lineHeight:
                    1.7,
                  color:
                    "var(--ink-dim)",
                }}
              >
                Six core modules,
                engineered to run
                as parts of one
                system — not a
                pile of separate
                subscriptions.
              </p>
            </div>
          </Reveal>

          <div className="tots-feat-grid">
            {FEATURES.map(
              (
                feature,
                index
              ) => {
                const Icon =
                  feature.icon;

                return (
                  <Reveal
                    key={
                      feature.id
                    }
                    delay={
                      (index %
                        3) *
                      0.06
                    }
                  >
                    <div className="tots-feat-card">
                      <div className="tots-feat-top">
                        <div className="tots-feat-icon">
                          <Icon
                            size={
                              19
                            }
                            strokeWidth={
                              1.6
                            }
                          />
                        </div>

                        <span className="tots-feat-id">
                          mod.
                          {
                            feature.id
                          }
                        </span>
                      </div>

                      <h3>
                        {
                          feature.title
                        }
                      </h3>

                      <p>
                        {
                          feature.text
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* CONNECTED SYSTEM */}

      <section className="tots-section">
        <div className="tots-wrap tots-connect-grid">
          <Reveal>
            <Eyebrow>
              connected by design
            </Eyebrow>

            <h2
              style={{
                marginTop: 26,
                maxWidth: 560,
                fontSize:
                  "clamp(2.4rem,4.6vw,4.6rem)",
                lineHeight:
                  0.98,
                fontWeight:
                  500,
              }}
            >
              Your business is not
              six different apps.
            </h2>

            <p
              style={{
                marginTop: 24,
                maxWidth: 480,
                fontSize:
                  14.5,
                lineHeight:
                  1.75,
                color:
                  "var(--ink-dim)",
              }}
            >
              A client becomes a
              project. A project
              creates tasks. Tasks
              have dates. Work
              creates revenue.
              TOTS-OS is built
              around those
              relationships.
            </p>

            <div className="tots-check-list">
              {[
                "See your work in context",
                "Reduce duplicate admin",
                "Build clearer business routines",
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="tots-check-row"
                  >
                    <span className="tots-check-icon">
                      <Check
                        size={
                          13
                        }
                      />
                    </span>

                    <span className="txt">
                      {item}
                    </span>
                  </div>
                )
              )}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="tots-orbit-wrap">
              <div className="tots-orbit-ring r1" />

              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        rotate:
                          360,
                      }
                }
                transition={{
                  duration: 46,
                  repeat:
                    Infinity,
                  ease:
                    "linear",
                }}
                className="tots-orbit-ring r2"
              />

              <div className="tots-orbit-core">
                T
              </div>

              {ORBIT_MODULES.map(
                ({
                  icon: Icon,
                  label,
                  angle,
                }) => {
                  const radians =
                    (angle *
                      Math.PI) /
                    180;

                  const radius =
                    44;

                  const left =
                    50 +
                    radius *
                      Math.cos(
                        radians
                      );

                  const top =
                    50 +
                    radius *
                      Math.sin(
                        radians
                      );

                  return (
                    <motion.div
                      key={label}
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              y: [
                                0,
                                -8,
                                0,
                              ],
                            }
                      }
                      transition={{
                        duration:
                          4,
                        repeat:
                          Infinity,
                        delay:
                          Math.abs(
                            angle
                          ) /
                          180,
                      }}
                      className="tots-orbit-node"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                    >
                      <Icon
                        size={16}
                        color="var(--accent)"
                        strokeWidth={
                          1.6
                        }
                      />

                      <span>
                        {label}
                      </span>
                    </motion.div>
                  );
                }
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECURITY */}

      <section
        className="tots-section"
        style={{
          paddingTop: 0,
        }}
      >
        <div className="tots-wrap">
          <Reveal>
            <div className="tots-sec-card">
              <div className="tots-sec-grid">
                <div>
                  <Eyebrow>
                    built for your
                    business
                  </Eyebrow>

                  <h2
                    style={{
                      marginTop:
                        26,
                      maxWidth:
                        560,
                      fontSize:
                        "clamp(2.2rem,4.4vw,4rem)",
                      lineHeight:
                        1,
                      fontWeight:
                        500,
                    }}
                  >
                    Your workspace
                    should feel
                    like yours.
                  </h2>

                  <p
                    style={{
                      marginTop:
                        20,
                      maxWidth:
                        480,
                      fontSize:
                        14,
                      lineHeight:
                        1.75,
                      color:
                        "var(--ink-dim)",
                    }}
                  >
                    TOTS-OS gives
                    your business a
                    dedicated,
                    account-based
                    workspace for
                    keeping
                    operational
                    information
                    together.
                  </p>
                </div>

                <div className="tots-sec-items">
                  {[
                    {
                      icon:
                        LockKeyhole,
                      title:
                        "Secure access",
                      text:
                        "Account-based access to your TOTS-OS workspace.",
                    },
                    {
                      icon:
                        ShieldCheck,
                      title:
                        "Privacy",
                      text:
                        "Clear privacy information and responsible data handling.",
                    },
                    {
                      icon:
                        Cloud,
                      title:
                        "Web based",
                      text:
                        "Access the platform through your browser.",
                    },
                    {
                      icon:
                        Network,
                      title:
                        "Connected",
                      text:
                        "Modules designed to work together across your business.",
                    },
                  ].map(
                    ({
                      icon: Icon,
                      title,
                      text,
                    }) => (
                      <div
                        key={
                          title
                        }
                        className="tots-sec-item"
                      >
                        <Icon
                          size={
                            16
                          }
                          color="var(--accent)"
                          strokeWidth={
                            1.6
                          }
                        />

                        <h4>
                          {
                            title
                          }
                        </h4>

                        <p>
                          {
                            text
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="tots-section bordered"
        style={{
          textAlign:
            "center",
        }}
      >
        <div className="tots-wrap-narrow">
          <Reveal>
            <Eyebrow>
              the idea behind
              tots-os
            </Eyebrow>

            <h2
              style={{
                margin:
                  "30px auto 0",
                fontSize:
                  "clamp(2.4rem,5.4vw,5.4rem)",
                lineHeight:
                  0.98,
                fontWeight:
                  500,
              }}
            >
              Your business
              deserves{" "}

              <span
                style={{
                  color:
                    "var(--ink-faint)",
                }}
              >
                its own operating
                system.
              </span>
            </h2>

            <p
              style={{
                margin:
                  "30px auto 0",
                maxWidth: 680,
                fontSize: 15,
                lineHeight:
                  1.85,
                color:
                  "var(--ink-dim)",
              }}
            >
              TOTS-OS was built
              around a simple
              idea: running a
              small business
              shouldn&apos;t
              require endless
              subscriptions,
              scattered
              spreadsheets,
              forgotten notes
              and a dozen tabs
              open just to
              understand
              what&apos;s going
              on.
            </p>

            <p
              style={{
                margin:
                  "18px auto 0",
                maxWidth: 680,
                fontSize: 15,
                lineHeight:
                  1.85,
                color:
                  "var(--ink-dim)",
              }}
            >
              We&apos;re building
              one organised place
              for the work behind
              the business — so
              founders spend less
              time managing their
              systems, and more
              time building what
              matters.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}

      <section
        id="pricing"
        className="tots-section"
      >
        <div className="tots-wrap">
          <Reveal>
            <div
              style={{
                textAlign:
                  "center",
              }}
            >
              <Eyebrow>
                simple pricing
              </Eyebrow>

              <h2
                style={{
                  marginTop: 26,
                  fontSize:
                    "clamp(2.6rem,5.4vw,5.2rem)",
                  fontWeight:
                    500,
                  letterSpacing:
                    "-0.04em",
                }}
              >
                Choose your
                system.
              </h2>

              <p
                style={{
                  margin:
                    "18px auto 0",
                  maxWidth:
                    480,
                  fontSize:
                    14,
                  lineHeight:
                    1.7,
                  color:
                    "var(--ink-dim)",
                }}
              >
                Start with the
                level of TOTS-OS
                that fits your
                business today.
              </p>
            </div>
          </Reveal>

          <div className="tots-price-grid">
            {PRICING.map(
              (
                plan,
                index
              ) => (
                <Reveal
                  key={
                    plan.name
                  }
                  delay={
                    index *
                    0.08
                  }
                >
                  <div
                    className={`tots-price-card ${
                      plan.featured
                        ? "featured"
                        : ""
                    }`}
                  >
                    <div className="tots-price-top">
                      <div>
                        <p className="tots-price-name">
                          {
                            plan.name
                          }
                        </p>

                        {plan.badge && (
                          <span className="tots-price-badge">
                            {
                              plan.badge
                            }
                          </span>
                        )}
                      </div>

                      <span className="tots-mono-label">
                        /{" "}
                        {
                          plan.tag
                        }
                      </span>
                    </div>

                    <div className="tots-price-figure">
                      <span className="tots-price-amount">
                        £
                        {
                          plan.price
                        }
                      </span>

                      <span className="tots-price-period">
                        /mo
                      </span>
                    </div>

                    <p className="tots-price-desc">
                      {
                        plan.description
                      }
                    </p>

                    <a
                      href="/login"
                      className={
                        plan.featured
                          ? "tots-btn-solid"
                          : "tots-btn-ghost"
                      }
                      style={{
                        marginTop:
                          "auto",
                        minHeight:
                          54,
                        justifyContent:
                          "center",
                        borderRadius:
                          16,
                      }}
                    >
                      Select{" "}
                      {
                        plan.name
                      }

                      <ArrowRight
                        size={
                          13
                        }
                      />
                    </a>

                    <div className="tots-price-includes">
                      <p className="tots-mono-label">
                        includes
                      </p>

                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <div
                            key={
                              feature
                            }
                            className="tots-price-feature"
                          >
                            <CheckCircle2
                              size={
                                15
                              }
                              color="var(--accent)"
                              style={{
                                flexShrink:
                                  0,
                                marginTop:
                                  1,
                              }}
                            />

                            <span>
                              {
                                feature
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            )}
          </div>

          <p
            style={{
              marginTop: 30,
              textAlign:
                "center",
              fontSize: 11,
              color:
                "var(--ink-ghost)",
            }}
          >
            Plan features and
            availability may
            evolve as TOTS-OS
            continues to grow.
          </p>
        </div>
      </section>

      {/* EMAIL CTA */}

      <section
        className="tots-section"
        style={{
          paddingTop: 0,
        }}
      >
        <Reveal className="tots-wrap">
          <div className="tots-cta-card">
            <div className="tots-cta-icon">
              <Sparkles
                size={18}
                strokeWidth={
                  1.6
                }
              />
            </div>

            <h2
              style={{
                marginTop: 30,
                fontSize:
                  "clamp(2.2rem,4.6vw,4.4rem)",
                lineHeight:
                  1,
                fontWeight:
                  500,
              }}
            >
              Keep up with{" "}

              <span
                style={{
                  color:
                    "var(--ink-faint)",
                }}
              >
                what comes next.
              </span>
            </h2>

            <p
              style={{
                margin:
                  "18px auto 0",
                maxWidth:
                  460,
                fontSize:
                  13.5,
                lineHeight:
                  1.7,
                color:
                  "var(--ink-dim)",
              }}
            >
              Join the mailing
              list for product
              updates,
              announcements and
              early-access news.
            </p>

            {!submitted ? (
              <form
                onSubmit={
                  handleSubmit
                }
                className="tots-cta-form"
              >
                <input
                  type="email"
                  required
                  aria-label="Email address"
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Enter your email address"
                  className="tots-cta-input"
                />

                <button
                  type="submit"
                  className="tots-btn-solid"
                  style={{
                    minHeight:
                      50,
                    justifyContent:
                      "center",
                  }}
                >
                  Join updates

                  <ArrowRight
                    size={
                      13
                    }
                  />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                style={{
                  margin:
                    "30px auto 0",
                  maxWidth:
                    380,
                  border:
                    "1px solid rgba(215,224,168,0.2)",
                  background:
                    "var(--accent-soft)",
                  borderRadius:
                    16,
                  padding:
                    18,
                }}
              >
                <CheckCircle2
                  size={18}
                  color="var(--accent)"
                  style={{
                    margin:
                      "0 auto",
                    display:
                      "block",
                  }}
                />

                <p
                  style={{
                    marginTop:
                      10,
                    fontSize:
                      13,
                    fontWeight:
                      500,
                  }}
                >
                  You&apos;re on
                  the list.
                </p>

                <p
                  style={{
                    marginTop:
                      4,
                    fontSize:
                      11.5,
                    color:
                      "var(--ink-faint)",
                  }}
                >
                  Thanks for
                  joining TOTS-OS
                  updates.
                </p>
              </motion.div>
            )}
          </div>
        </Reveal>
      </section>

      {/* FAQ */}

      <section className="tots-section bordered">
        <div className="tots-wrap-narrow tots-faq-grid">
          <Reveal>
            <Eyebrow>
              faq
            </Eyebrow>

            <h2
              style={{
                marginTop: 26,
                fontSize:
                  "clamp(1.9rem,3.4vw,3rem)",
                fontWeight:
                  500,
                letterSpacing:
                  "-0.03em",
              }}
            >
              A few things you
              might want to know.
            </h2>

            <p
              style={{
                marginTop: 20,
                maxWidth: 320,
                fontSize:
                  13.5,
                lineHeight:
                  1.7,
                color:
                  "var(--ink-dim)",
              }}
            >
              Need something
              else? Get in touch
              with the TOTS-OS
              team.
            </p>

            <a
              href="mailto:hello@theorganisedtypes.co.uk"
              style={{
                marginTop: 22,
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: 8,
                fontSize:
                  12.5,
                color:
                  "rgba(243,244,238,0.7)",
                textDecoration:
                  "none",
              }}
            >
              Contact us

              <ArrowUpRight
                size={14}
              />
            </a>
          </Reveal>

          <div
            style={{
              borderTop:
                "1px solid var(--line)",
            }}
          >
            {FAQS.map(
              (
                faq,
                index
              ) => {
                const open =
                  openFaq ===
                  index;

                return (
                  <Reveal
                    key={
                      faq.q
                    }
                    delay={
                      index *
                      0.03
                    }
                  >
                    <div className="tots-faq-item">
                      <button
                        type="button"
                        className="tots-faq-btn"
                        onClick={() =>
                          setOpenFaq(
                            open
                              ? null
                              : index
                          )
                        }
                      >
                        <span>
                          {
                            faq.q
                          }
                        </span>

                        <motion.span
                          animate={{
                            rotate:
                              open
                                ? 180
                                : 0,
                          }}
                          style={{
                            display:
                              "flex",
                            color:
                              "var(--ink-faint)",
                          }}
                        >
                          <ChevronDown
                            size={
                              16
                            }
                          />
                        </motion.span>
                      </button>

                      <AnimatePresence
                        initial={
                          false
                        }
                      >
                        {open && (
                          <motion.div
                            initial={{
                              height:
                                0,
                              opacity:
                                0,
                            }}
                            animate={{
                              height:
                                "auto",
                              opacity:
                                1,
                            }}
                            exit={{
                              height:
                                0,
                              opacity:
                                0,
                            }}
                            style={{
                              overflow:
                                "hidden",
                            }}
                          >
                            <p className="tots-faq-answer">
                              {
                                faq.a
                              }
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section
        className="tots-section"
        style={{
          textAlign:
            "center",
        }}
      >
        <div className="tots-wrap">
          <Reveal>
            <p
              className="tots-mono-label"
              style={{
                color:
                  "var(--accent)",
                opacity: 0.6,
              }}
            >
              tots-os
            </p>

            <h2
              style={{
                margin:
                  "20px auto 0",
                maxWidth:
                  900,
                fontSize:
                  "clamp(2.6rem,6.4vw,7rem)",
                lineHeight:
                  0.9,
                fontWeight:
                  600,
              }}
            >
              Your business.

              <span
                style={{
                  display:
                    "block",
                  color:
                    "var(--ink-faint)",
                }}
              >
                Finally
                organised.
                <Cursor />
              </span>
            </h2>

            <div
              className="tots-hero-ctas"
              style={{
                marginTop: 40,
              }}
            >
              <a
                href="#pricing"
                className="tots-btn-solid lg"
              >
                View pricing

                <ArrowRight
                  size={15}
                />
              </a>

              <a
                href="/login"
                className="tots-btn-ghost lg"
              >
                <LogIn
                  size={13}
                />

                Log in
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="tots-footer">
        <div className="tots-wrap">
          <div className="tots-footer-grid">
            <div>
              <div className="tots-brand">
                <span className="tots-brand-mark">
                  T
                </span>

                <span className="tots-brand-name">
                  TOTS-OS
                </span>
              </div>

              <p
                style={{
                  marginTop: 16,
                  maxWidth: 260,
                  fontSize: 12,
                  lineHeight:
                    1.7,
                  color:
                    "var(--ink-ghost)",
                }}
              >
                The all-in-one
                business operating
                system for
                bringing your
                work, clients,
                planning and
                operations
                together.
              </p>
            </div>

            <div>
              <h5>
                Product
              </h5>

              <div className="tots-footer-links">
                <a href="#features">
                  Features
                </a>

                <a href="#pricing">
                  Pricing
                </a>

                <a href="/login">
                  Log in
                </a>
              </div>
            </div>

            <div>
              <h5>
                Company
              </h5>

              <div className="tots-footer-links">
                <a href="#about">
                  About
                </a>

                <a href="mailto:hello@theorganisedtypes.co.uk">
                  Contact
                </a>
              </div>
            </div>

            <div>
              <h5>
                Legal
              </h5>

              <div className="tots-footer-links">
                <a href="/privacy">
                  Privacy Policy
                </a>

                <a href="/terms">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          <div className="tots-footer-bottom">
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              TOTS-OS. All rights
              reserved.
            </p>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 8,
              }}
            >
              <span className="tots-status-dot" />

              <span
                style={{
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.14em",
                }}
              >
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}