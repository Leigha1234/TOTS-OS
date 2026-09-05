// TOTS-OS — landing page
// Full redesign: editorial/premium visual system, interactive product explorer,
// working Clarity demo, and a problem→solution convergence section.
// NOTE: this file is a client component ("use client"), so Next.js metadata
// (title/description/OG tags) can't be exported from here — put that in
// app/layout.tsx or a server-side wrapper around this component instead.
"use client";

import { Fraunces, Inter } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Contact,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquareText,
  NotebookPen,
  Play,
  Send,
  Sparkles,
  StickyNote,
  Store,
  Table2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/* ============================================================
   ROUTES — unchanged, wired to existing auth / commerce / pages
============================================================ */

const LOGO_SRC = "/icon.png";
const LOGIN_URL = "https://tots-os.co.uk/login";
const SIGNUP_URL = "https://tots-os.co.uk/login";
const SHOP_BUY_URL = "https://tots-os.co.uk/login";
const FIND_YOUR_SETUP_URL = "/find-your-setup";

/* ============================================================
   CONTENT
============================================================ */

const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "Clarity", href: "#clarity" },
  { label: "Pricing", href: "#pricing" },
  { label: "Our story", href: "#story" },
];

// The scattered tools a business is currently stitched together from.
const SCATTERED_TOOLS: { label: string; icon: LucideIcon }[] = [
  { label: "Calendar", icon: CalendarDays },
  { label: "Spreadsheet", icon: Table2 },
  { label: "CRM", icon: Contact },
  { label: "Notes app", icon: StickyNote },
  { label: "Finance tool", icon: Wallet },
  { label: "Content planner", icon: Megaphone },
  { label: "Email", icon: Mail },
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Project board", icon: Kanban },
];

type ExplorerTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  headline: string;
  copy: string;
};

const EXPLORER_TABS: ExplorerTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    headline: "Open TOTS-OS and know exactly where things stand.",
    copy: "Revenue, tasks, projects and today's priorities — the whole shape of the business in one glance, not five tabs.",
  },
  {
    id: "clients",
    label: "Clients",
    icon: Contact,
    headline: "Open a client and see everything, instantly.",
    copy: "The relationship, the work, the notes and the money — together, so you never scroll WhatsApp trying to remember what you promised.",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
    headline: "See what's moving and what's stuck.",
    copy: "Every project, task and owner visible in one board — so Monday starts with priorities, not a status-chasing exercise.",
  },
  {
    id: "money",
    label: "Money",
    icon: CircleDollarSign,
    headline: "Know who owes you money, without opening three apps.",
    copy: "Quotes, invoices and expenses sit right next to the work that created them — so nothing outstanding slips through.",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    headline: "Plan and publish without leaving the workspace.",
    copy: "Your content calendar lives next to the clients and projects it's actually promoting — not scattered across Notes and Canva.",
  },
  {
    id: "planning",
    label: "Planning",
    icon: NotebookPen,
    headline: "Turn the brain dump into next actions.",
    copy: "Capture an idea the second you have it, then organise and connect it to real work — instead of losing it in a notes app.",
  },
  {
    id: "store",
    label: "Store",
    icon: Store,
    headline: "Sell, and see the order land in the same place.",
    copy: "Products, stock and orders connected to the rest of the business — no separate shop backend to keep in sync.",
  },
];

type ClarityPrompt = {
  id: string;
  prompt: string;
  reply: string;
  points: string[];
};

const CLARITY_PROMPTS: ClarityPrompt[] = [
  {
    id: "focus",
    prompt: "What should I focus on today?",
    reply: "Three things are worth your attention first:",
    points: [
      "Send the Acorn Studio invoice — £1,850, due this week",
      "Review the Northstar project — two delivery tasks due tomorrow",
      "Prep for your 2:00pm client call — notes are already saved",
    ],
  },
  {
    id: "owes",
    prompt: "Who owes me money?",
    reply: "Two invoices are currently outstanding:",
    points: [
      "Acorn Studio — £1,850, due in 4 days",
      "Bennett Interiors — £640, 2 days overdue",
    ],
  },
  {
    id: "projects",
    prompt: "Which projects need attention?",
    reply: "One project is at risk of slipping:",
    points: [
      "Website Refresh — delivery date in 3 days, two tasks still open",
      "Reed Wellness kickoff — on track, next milestone Thursday",
    ],
  },
  {
    id: "week",
    prompt: "What have I got coming up this week?",
    reply: "Here's what's on the calendar:",
    points: [
      "Mon 10:00 — Call with Amelia Hart",
      "Tue 09:30 — Reed Wellness kickoff",
      "Thu 16:00 — Strategy session",
    ],
  },
];

// Real client names. Industry / tools-used / quote are intentionally left
// blank — fill these in with real, approved detail rather than invented ones.
type BusinessCard = {
  name: string;
  industry?: string;
  areas?: string[];
  quote?: string;
};

const REAL_BUSINESSES: BusinessCard[] = [
  { name: "Moray Training Club" },
  { name: "Megoosh" },
  { name: "Lux Electrical Engineering" },
  { name: "WhyKnot Wardrobe" },
  { name: "DP Leadership" },
  { name: "TestMe Health" },
];

const TRUST_STRIP = [
  ...REAL_BUSINESSES.map((b) => b.name),
  "Brave Heart Property",
  "Precision Flows",
];

type PricingPlan = {
  name: string;
  price: number;
  tagline: string;
  featured?: boolean;
  badge?: string;
  features: string[];
};

const PRICING: PricingPlan[] = [
  {
    name: "Standard",
    price: 29,
    tagline: "Everything to get organised, solo.",
    features: [
      "Business dashboard",
      "Projects & tasks",
      "CRM & contacts",
      "Calendar & planning",
      "Notes & brain dump",
      "Core finance tools",
      "Clarity AI access",
    ],
  },
  {
    name: "Professional",
    price: 59,
    tagline: "The one most businesses need.",
    featured: true,
    badge: "THE ONE MOST BUSINESSES NEED",
    features: [
      "Everything in Standard",
      "Advanced finance features",
      "Social planning & publishing",
      "Campaign tools",
      "Team workflows",
      "Business insights & KPIs",
      "Expanded Clarity AI usage",
    ],
  },
  {
    name: "Elite",
    price: 99,
    tagline: "For teams with more to manage.",
    features: [
      "Everything in Professional",
      "Advanced team access",
      "Priority support",
      "Advanced automation",
      "Enhanced operational tools",
    ],
  },
];

const FAQS = [
  {
    q: "What exactly is TOTS-OS?",
    a: "One connected workspace for running your business. Clients, projects, tasks, finances, calendar, notes, content and business visibility — in one organised system.",
  },
  {
    q: "Who is TOTS-OS for?",
    a: "Founders, freelancers, small businesses and growing teams who want a simpler way to organise the everyday running of their business.",
  },
  {
    q: "What is Clarity?",
    a: "The AI assistant inside TOTS-OS. It uses information already in your workspace to surface priorities, overdue work, deadlines and useful next actions.",
  },
  {
    q: "Is TOTS-OS web based?",
    a: "Yes — it works through your browser, so you can reach your workspace anywhere you can securely log in.",
  },
  {
    q: "Can TOTS-OS help with social media?",
    a: "Yes. Social planning and publishing sit alongside the rest of your business, not in a separate app.",
  },
  {
    q: "Can I try it first?",
    a: "Every account starts with a 14-day free trial — no bank or card details required. Explore the full system, then choose a plan only if you want to continue.",
  },
];

/* ============================================================
   SHARED COMPONENTS
============================================================ */

function Logo({ size = 36, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <span className="tots-logo">
      <img src={LOGO_SRC} alt="" width={size} height={size} style={{ width: size, height: size }} />
      {showWordmark && (
        <span className="tots-logo-copy">
          <strong>TOTS-OS</strong>
          <small>by The Organised Types</small>
        </span>
      )}
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span aria-hidden="true" />
      {children}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.19, 1, 0.22, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/* ============================================================
   NAVIGATION
============================================================ */

function SiteNav() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="tots-container site-nav-inner">
        <a href="#top" className="site-nav-logo" aria-label="TOTS-OS home">
          <Logo size={32} />
        </a>

        <nav className="site-nav-links" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <a href={LOGIN_URL} className="site-nav-login">
            Log in
          </a>
          <a href={SIGNUP_URL} className="button button-primary button-sm">
            Try TOTS-OS free
          </a>
        </div>

        <button
          type="button"
          className="site-nav-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <nav aria-label="Mobile" className="mobile-menu-links">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
              <a href={LOGIN_URL} onClick={() => setOpen(false)}>
                Log in
              </a>
            </nav>
            <a href={SIGNUP_URL} className="button button-primary button-lg mobile-menu-cta">
              Try TOTS-OS free
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ============================================================
   HERO
============================================================ */

function Hero({ onExploreDemo }: { onExploreDemo: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="tots-container hero-inner">
        <Reveal className="hero-copy">
          <Eyebrow>Your business isn&apos;t the problem.</Eyebrow>
          <h1 className="hero-title">
            It&apos;s the <em>7 different places</em> you&apos;re trying to run it from.
          </h1>
          <p className="hero-sub">
            Clients. Projects. Invoices. Content. Calendar. Tasks. Notes.
            <br />
            TOTS-OS brings it all together in one calm business workspace.
          </p>

          <div className="hero-actions">
            <a href={SIGNUP_URL} className="button button-primary button-lg">
              Start free for 14 days
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <button type="button" className="button button-ghost button-lg" onClick={onExploreDemo}>
              <Play size={14} aria-hidden="true" />
              Explore the demo
            </button>
          </div>

          <p className="hero-micro">
            <Check size={13} aria-hidden="true" /> No card required &nbsp;·&nbsp; No commitment
          </p>
        </Reveal>

        <Reveal delay={0.14} className="hero-visual-wrap">
          <div className="hero-visual" role="img" aria-label="The TOTS-OS dashboard, showing revenue, tasks, projects and today's priorities">
            <div className="hero-visual-glow" aria-hidden="true" />
            <div className="hero-window">
              <div className="hero-window-bar">
                <span className="window-dots" aria-hidden="true">
                  <i /> <i /> <i />
                </span>
                <span className="hero-window-title">TOTS-OS</span>
              </div>

              <div className="hero-window-body">
                <aside className="hero-mini-nav" aria-hidden="true">
                  <Logo size={26} showWordmark={false} />
                  {[LayoutDashboard, Contact, FolderKanban, CircleDollarSign, CalendarDays].map((Icon, i) => (
                    <div key={i} className={i === 0 ? "active" : ""}>
                      <Icon size={14} />
                    </div>
                  ))}
                </aside>

                <div className="hero-mini-main">
                  <div className="hero-mini-head">
                    <div>
                      <span>Good morning.</span>
                      <strong>Here&apos;s your business today.</strong>
                    </div>
                    <span className="pill pill-gold">
                      <Sparkles size={12} aria-hidden="true" /> Clarity
                    </span>
                  </div>

                  <div className="hero-mini-metrics">
                    <div>
                      <span>Revenue</span>
                      <strong>£18.4k</strong>
                    </div>
                    <div>
                      <span>Tasks</span>
                      <strong>12</strong>
                    </div>
                    <div>
                      <span>Projects</span>
                      <strong>6</strong>
                    </div>
                  </div>

                  <div className="hero-mini-panels">
                    <div className="hero-mini-panel">
                      <span>Focus</span>
                      <strong>Today&apos;s priorities</strong>
                      <div className="hero-mini-lines">
                        <i /> <i /> <i />
                      </div>
                    </div>
                    <div className="hero-mini-panel">
                      <span>Coming up</span>
                      <div className="hero-mini-lines">
                        <i /> <i /> <i />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-float hero-float-a" aria-hidden="true">
              <span>
                <Sparkles size={12} /> Clarity
              </span>
              <strong>3 things need your attention</strong>
            </div>
            <div className="hero-float hero-float-b" aria-hidden="true">
              <span>Business health</span>
              <strong>82%</strong>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   PROBLEM → CONVERGENCE
============================================================ */

function ProblemConverge() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="converge">
      <div className="tots-container">
        <Reveal className="converge-head">
          <h2 className="section-title">Your business doesn&apos;t need more tabs.</h2>
          <p className="section-copy">
            It needs one place where the important things connect.
          </p>
        </Reveal>

        <div className="converge-stage" aria-hidden="true">
          <div className="converge-scatter">
            {SCATTERED_TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              const angle = (i / SCATTERED_TOOLS.length) * 360;
              const radius = 42;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <motion.div
                  key={tool.label}
                  className="converge-chip"
                  style={{ ["--x" as string]: `${x}%`, ["--y" as string]: `${y}%` }}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Icon size={16} />
                  <span>{tool.label}</span>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="converge-core"
            initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Logo size={30} showWordmark={false} />
            <strong>TOTS-OS</strong>
          </motion.div>
        </div>

        <Reveal delay={0.1} className="converge-caption">
          <p>One connected workspace for the everyday running of your business.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCT EXPLORER
============================================================ */

function ProductExplorer({ registerRef }: { registerRef: (el: HTMLElement | null) => void }) {
  const [active, setActive] = useState(EXPLORER_TABS[0].id);
  const tab = EXPLORER_TABS.find((t) => t.id === active) ?? EXPLORER_TABS[0];

  return (
    <section className="explorer" id="product" ref={registerRef}>
      <div className="tots-container">
        <Reveal className="explorer-head">
          <Eyebrow>The product</Eyebrow>
          <h2 className="section-title">Don&apos;t imagine how it works. Look inside.</h2>
        </Reveal>

        <div className="explorer-layout">
          <div className="explorer-tabs" role="tablist" aria-label="Explore TOTS-OS by area">
            {EXPLORER_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`explorer-tab ${isActive ? "active" : ""}`}
                  onClick={() => setActive(t.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="explorer-panel">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="explorer-panel-inner"
              >
                <div className="explorer-copy">
                  <h3>{tab.headline}</h3>
                  <p>{tab.copy}</p>
                </div>
                <ExplorerPreview tabId={tab.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplorerPreview({ tabId }: { tabId: string }) {
  switch (tabId) {
    case "clients":
      return (
        <div className="preview-window" role="img" aria-label="A client profile in TOTS-OS">
          <div className="preview-client-head">
            <div className="preview-avatar">AH</div>
            <div>
              <strong>Amelia Hart</strong>
              <span>Bennett Interiors · Client since 2024</span>
            </div>
          </div>
          <div className="preview-tabs-row">
            <span className="active">Overview</span>
            <span>Notes</span>
            <span>Financials</span>
          </div>
          <div className="preview-rows">
            <div>
              <span>Active project</span>
              <strong>Website Refresh</strong>
            </div>
            <div>
              <span>Outstanding</span>
              <strong>£640</strong>
            </div>
            <div>
              <span>Last contact</span>
              <strong>3 days ago</strong>
            </div>
          </div>
        </div>
      );
    case "projects":
      return (
        <div className="preview-window preview-kanban" role="img" aria-label="A project board in TOTS-OS">
          {[
            { label: "To do", items: ["Moodboard v2", "Client sign-off"] },
            { label: "In progress", items: ["Homepage build", "Copy review"] },
            { label: "Done", items: ["Brand kit"] },
          ].map((col) => (
            <div key={col.label} className="preview-kanban-col">
              <span>{col.label}</span>
              {col.items.map((it) => (
                <div key={it} className="preview-kanban-card">
                  {it}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "money":
      return (
        <div className="preview-window" role="img" aria-label="Invoices and revenue in TOTS-OS">
          <div className="preview-rows">
            <div>
              <span>Acorn Studio</span>
              <strong className="warn">Due in 4 days · £1,850</strong>
            </div>
            <div>
              <span>Bennett Interiors</span>
              <strong className="danger">2 days overdue · £640</strong>
            </div>
            <div>
              <span>Northstar Ltd</span>
              <strong className="ok">Paid · £3,200</strong>
            </div>
          </div>
          <div className="preview-bars" aria-hidden="true">
            {[40, 65, 30, 80, 55, 90].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      );
    case "marketing":
      return (
        <div className="preview-window preview-calendar" role="img" aria-label="A content calendar in TOTS-OS">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={`preview-cal-cell ${[2, 5, 9, 11].includes(i) ? "has-post" : ""}`} />
          ))}
        </div>
      );
    case "planning":
      return (
        <div className="preview-window" role="img" aria-label="Notes turning into tasks in TOTS-OS">
          <div className="preview-rows">
            <div>
              <span>New pricing idea</span>
              <strong className="tag">Note</strong>
            </div>
            <div>
              <span>Follow up with supplier</span>
              <strong className="tag tag-active">Task</strong>
            </div>
            <div>
              <span>Rebrand moodboard link</span>
              <strong className="tag">Note</strong>
            </div>
          </div>
        </div>
      );
    case "store":
      return (
        <div className="preview-window" role="img" aria-label="A storefront and orders in TOTS-OS">
          <div className="preview-rows">
            <div>
              <span>New order · #1042</span>
              <strong className="ok">Paid</strong>
            </div>
            <div>
              <span>Ceramic mug (x2)</span>
              <strong>Low stock</strong>
            </div>
            <div>
              <span>Store revenue (7d)</span>
              <strong>£860</strong>
            </div>
          </div>
        </div>
      );
    case "dashboard":
    default:
      return (
        <div className="preview-window" role="img" aria-label="The TOTS-OS dashboard">
          <div className="preview-rows">
            <div>
              <span>Revenue</span>
              <strong>£18.4k</strong>
            </div>
            <div>
              <span>Open tasks</span>
              <strong>12</strong>
            </div>
            <div>
              <span>Projects</span>
              <strong>6</strong>
            </div>
          </div>
          <div className="preview-bars" aria-hidden="true">
            {[30, 55, 40, 70, 60, 85].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      );
  }
}

/* ============================================================
   OUTCOMES
============================================================ */

const OUTCOMES = [
  "Know what needs your attention.",
  "Know which invoices are outstanding.",
  "Know what your team is working on.",
  "Know what's happening this week.",
  "Know which projects are falling behind.",
  "Know what's actually happening in your business.",
];

function Outcomes() {
  return (
    <section className="outcomes">
      <div className="tots-container">
        <Reveal className="outcomes-head">
          <Eyebrow>Clarity, not more software</Eyebrow>
          <h2 className="section-title">
            TOTS-OS isn&apos;t selling you features.
            <br />
            It&apos;s selling you knowing.
          </h2>
        </Reveal>

        <div className="outcomes-list">
          {OUTCOMES.map((line, i) => (
            <Reveal key={line} delay={i * 0.05} className="outcomes-item">
              <span className="outcomes-num">{String(i + 1).padStart(2, "0")}</span>
              <p>{line}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CLARITY
============================================================ */

function ClaritySection() {
  const [active, setActive] = useState(CLARITY_PROMPTS[0].id);
  const current = CLARITY_PROMPTS.find((p) => p.id === active) ?? CLARITY_PROMPTS[0];

  return (
    <section className="clarity" id="clarity">
      <div className="tots-container clarity-layout">
        <Reveal className="clarity-copy">
          <Eyebrow>Meet Clarity</Eyebrow>
          <h2 className="section-title">The AI that already knows what&apos;s happening in your business.</h2>
          <p className="section-copy">
            Clarity doesn&apos;t need you to explain your business to it — it&apos;s already inside your workspace. Ask it a real question and get a real answer, built from your own data.
          </p>

          <div className="clarity-prompt-list" role="tablist" aria-label="Try a question">
            {CLARITY_PROMPTS.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === active}
                className={`clarity-prompt ${p.id === active ? "active" : ""}`}
                onClick={() => setActive(p.id)}
              >
                {p.prompt}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="clarity-visual">
          <div className="clarity-chat">
            <div className="clarity-chat-head">
              <Sparkles size={14} aria-hidden="true" />
              Clarity
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="clarity-chat-body"
              >
                <div className="clarity-bubble clarity-bubble-user">{current.prompt}</div>
                <div className="clarity-bubble clarity-bubble-reply">
                  <p>{current.reply}</p>
                  <ol>
                    {current.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="clarity-chat-input" aria-hidden="true">
              <span>Ask Clarity anything about your business…</span>
              <Send size={14} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   SOCIAL PROOF
============================================================ */

function SocialProof() {
  return (
    <section className="proof">
      <div className="tots-container">
        <Reveal className="proof-head">
          <Eyebrow>Social proof</Eyebrow>
          <h2 className="section-title">Real businesses. Running on TOTS-OS.</h2>
        </Reveal>

        <div className="proof-grid">
          {REAL_BUSINESSES.map((biz, i) => (
            <Reveal key={biz.name} delay={i * 0.04} className="proof-card">
              <div className="proof-card-mark" aria-hidden="true">
                <Building2 size={18} />
              </div>
              <strong>{biz.name}</strong>
              <span className="proof-card-industry">{biz.industry ?? "Industry — add detail"}</span>
              <div className="proof-card-areas">
                {(biz.areas ?? ["Add tools used"]).map((a) => (
                  <span key={a} className="pill pill-quiet">
                    {a}
                  </span>
                ))}
              </div>
              {biz.quote && <p className="proof-card-quote">&ldquo;{biz.quote}&rdquo;</p>}
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="proof-strip">
          <span>Also trusted by</span>
          <div className="proof-strip-row">
            {TRUST_STRIP.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   BUSINESS CHECK
============================================================ */

function BusinessCheck() {
  return (
    <section className="check">
      <div className="tots-container">
        <Reveal className="check-card">
          <div className="check-copy">
            <Eyebrow>60-second business check</Eyebrow>
            <h2 className="section-title">How organised is your business, really?</h2>
            <p className="section-copy">
              Answer a few quick questions and we&apos;ll show you the TOTS-OS setup we&apos;d recommend.
            </p>
            <a href={FIND_YOUR_SETUP_URL} className="button button-primary button-lg">
              Take the 60-second business check
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="check-visual" aria-hidden="true">
            {["Where do your client details live?", "How do you track what's outstanding?", "How is content planned?"].map((q, i) => (
              <div key={q} className="check-quiz-row" style={{ opacity: 1 - i * 0.22 }}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{q}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   TOTS COMMERCE
============================================================ */

function Commerce() {
  return (
    <section className="commerce">
      <div className="tots-container">
        <Reveal className="commerce-card">
          <div className="commerce-copy">
            <Eyebrow>Need to sell too?</Eyebrow>
            <h2 className="section-title">Meet TOTS Commerce.</h2>
            <ul className="commerce-list">
              <li>Your storefront.</li>
              <li>Your products.</li>
              <li>Your customers.</li>
              <li>Your orders.</li>
              <li>One backend.</li>
            </ul>
            <p className="section-copy">
              A standalone commerce module that sits alongside TOTS-OS, so selling online doesn&apos;t become another disconnected system to manage.
            </p>
            <div className="commerce-price">
              <strong>£39</strong>
              <span>/ month</span>
            </div>
            <a href={SHOP_BUY_URL} className="button button-secondary button-lg">
              Explore TOTS Commerce
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="commerce-visual" role="img" aria-label="The TOTS Commerce storefront and orders backend">
            <div className="preview-window">
              <div className="preview-rows">
                <div>
                  <span>New product</span>
                  <strong>+ Add</strong>
                </div>
                <div>
                  <span>Order #1042</span>
                  <strong className="ok">Paid</strong>
                </div>
                <div>
                  <span>Stock: Ceramic mug</span>
                  <strong className="warn">Low</strong>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   PRICING
============================================================ */

function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="tots-container">
        <Reveal className="pricing-head">
          <Eyebrow>Simple pricing</Eyebrow>
          <h2 className="section-title">Pick the workspace that fits.</h2>
          <p className="section-copy">14-day free trial. No bank details. Choose a plan after exploring.</p>
        </Reveal>

        <div className="pricing-grid">
          {PRICING.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.06} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
              <span className="pricing-name">{plan.name}</span>
              <div className="pricing-price">
                <span>£</span>
                <strong>{plan.price}</strong>
                <small>/ month</small>
              </div>
              <p className="pricing-tagline">{plan.tagline}</p>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={13} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={SIGNUP_URL}
                className={`button button-lg ${plan.featured ? "button-primary" : "button-secondary"} pricing-cta`}
              >
                Start free trial
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="pricing-note">
          <p>
            Not sure which fits? <a href={FIND_YOUR_SETUP_URL}>Take the business check</a> for a personalised starting point.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   FOUNDERS
============================================================ */

function Founders() {
  return (
    <section className="founders" id="story">
      <div className="tots-container">
        <Reveal className="founders-head">
          <Eyebrow>Our story</Eyebrow>
          <h2 className="section-title">Built by people who actually run small businesses.</h2>
          <p className="section-copy founders-lede">
            One of us organises it. The other asks why it still takes five apps.
          </p>
        </Reveal>

        <div className="founders-grid">
          <Reveal delay={0.05} className="founder-card">
            {/* Replace with a real photo when available */}
            <div className="founder-avatar">S</div>
            <span>Mum · Co-founder</span>
            <h3>Sam</h3>
            <p>Brings the business and big-picture thinking — always asking how it should work for a real owner, not just how it looks on screen.</p>
          </Reveal>

          <Reveal delay={0.1} className="founder-card">
            <div className="founder-avatar">L</div>
            <span>Daughter · Co-founder</span>
            <h3>Leigha</h3>
            <p>Brings the technology and design — turning the ideas into the product, from how it feels to how it all connects.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
============================================================ */

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="faq">
      <div className="tots-container">
        <Reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="section-title">The things you&apos;ll probably ask.</h2>
        </Reveal>

        <div className="faq-list">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={17} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="faq-a"
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA + FOOTER
============================================================ */

function FinalCTA() {
  return (
    <section className="final">
      <div className="tots-container">
        <Reveal className="final-card">
          <h2>
            Run the business.
            <br />
            <em>Not the chaos.</em>
          </h2>
          <p>Bring your clients, projects, money, planning, marketing and everyday admin together.</p>
          <div className="final-actions">
            <a href={SIGNUP_URL} className="button button-primary button-lg">
              Start your 14-day free trial
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#product" className="button button-ghost button-lg">
              Explore TOTS-OS first
            </a>
          </div>
          <p className="final-micro">No card. No commitment.</p>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="tots-container footer-inner">
        <Logo size={30} />
        <nav aria-label="Footer">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </nav>
        <a href={SIGNUP_URL} className="button button-primary button-sm">
          Start free trial
        </a>
      </div>
      <div className="tots-container footer-bottom">
        <span>© {new Date().getFullYear()} The Organised Types. All rights reserved.</span>
        <span>TOTS-OS · Your business, organised.</span>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function Page() {
  const productRef = useRef<HTMLElement | null>(null);

  const scrollToProduct = () => {
    productRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`tots-page ${fraunces.variable} ${inter.variable}`}>
      <a href="#product" className="skip-link">
        Skip to main content
      </a>

      <SiteNav />

      <main>
        <Hero onExploreDemo={scrollToProduct} />
        <ProblemConverge />
        <ProductExplorer registerRef={(el) => (productRef.current = el)} />
        <Outcomes />
        <ClaritySection />
        <SocialProof />
        <BusinessCheck />
        <Commerce />
        <Pricing />
        <Founders />
        <FAQSection />
        <FinalCTA />
      </main>

      <SiteFooter />

      <style jsx global>{`
        :root {
          --font-display: ${fraunces.style.fontFamily};
          --font-body: ${inter.style.fontFamily};
          --ink: #1b1f16;
          --ink-soft: #565f4c;
          --paper: #faf7ef;
          --paper-alt: #f1ede1;
          --white: #ffffff;
          --sage: #a9b897;
          --sage-deep: #6f7f5c;
          --sage-pale: #e4e9da;
          --gold: #c98f3c;
          --line: rgba(27, 31, 22, 0.1);
          --shadow: 0 20px 60px -30px rgba(27, 31, 22, 0.35);
          --radius: 20px;
        }

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        body {
          margin: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-body);
        }

        .tots-page h1, .tots-page h2, .tots-page h3 {
          font-family: var(--font-display);
          font-weight: 500;
          line-height: 1.08;
          margin: 0 0 16px;
          letter-spacing: -0.01em;
        }

        .tots-page em { font-style: italic; color: var(--sage-deep); }

        .tots-container { max-width: 1180px; margin: 0 auto; padding: 0 28px; }

        .skip-link {
          position: absolute; left: -999px; top: 0; background: var(--ink); color: var(--paper);
          padding: 12px 18px; z-index: 200; border-radius: 0 0 8px 0;
        }
        .skip-link:focus { left: 0; }

        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; cursor: pointer; }

        :focus-visible {
          outline: 2.5px solid var(--gold);
          outline-offset: 3px;
          border-radius: 4px;
        }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--sage-deep); margin-bottom: 14px;
        }
        .eyebrow span { width: 20px; height: 1.5px; background: var(--gold); display: inline-block; }

        .section-title { font-size: clamp(28px, 3.6vw, 44px); max-width: 720px; }
        .section-copy { font-size: 17px; color: var(--ink-soft); max-width: 560px; line-height: 1.55; }

        .pill {
          display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
          border-radius: 999px; font-size: 12.5px; font-weight: 600;
        }
        .pill-gold { background: rgba(201, 143, 60, 0.14); color: #8a5f22; }
        .pill-quiet { background: var(--sage-pale); color: var(--sage-deep); }

        .button {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          border-radius: 999px; font-weight: 600; border: 1.5px solid transparent;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }
        .button:hover { transform: translateY(-1px); }
        .button-primary { background: var(--ink); color: var(--paper); }
        .button-primary:hover { background: var(--sage-deep); }
        .button-secondary { background: transparent; color: var(--ink); border-color: var(--line); }
        .button-secondary:hover { border-color: var(--ink); }
        .button-ghost { background: transparent; color: var(--ink); }
        .button-ghost:hover { color: var(--sage-deep); }
        .button-lg { padding: 15px 26px; font-size: 15.5px; }
        .button-sm { padding: 10px 18px; font-size: 14px; }

        /* ---------- NAV ---------- */
        .site-nav {
          position: sticky; top: 0; z-index: 100; padding: 18px 0;
          transition: background 0.25s ease, box-shadow 0.25s ease, padding 0.25s ease;
        }
        .site-nav.is-scrolled {
          background: rgba(250, 247, 239, 0.86); backdrop-filter: blur(14px);
          box-shadow: 0 1px 0 var(--line); padding: 12px 0;
        }
        .site-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .tots-logo { display: inline-flex; align-items: center; gap: 10px; }
        .tots-logo img { border-radius: 8px; }
        .tots-logo-copy { display: flex; flex-direction: column; line-height: 1.1; }
        .tots-logo-copy strong { font-size: 15px; }
        .tots-logo-copy small { font-size: 10.5px; color: var(--ink-soft); }
        .site-nav-links { display: flex; gap: 30px; font-size: 14.5px; font-weight: 600; }
        .site-nav-links a:hover { color: var(--sage-deep); }
        .site-nav-actions { display: flex; align-items: center; gap: 18px; }
        .site-nav-login { font-size: 14.5px; font-weight: 600; }
        .site-nav-burger { display: none; background: none; border: none; padding: 6px; }

        .mobile-menu {
          position: fixed; inset: 68px 0 0 0; background: var(--paper); z-index: 99;
          padding: 24px 28px; display: flex; flex-direction: column; gap: 24px;
        }
        .mobile-menu-links { display: flex; flex-direction: column; gap: 20px; font-size: 20px; font-weight: 600; }
        .mobile-menu-cta { align-self: flex-start; }

        @media (max-width: 880px) {
          .site-nav-links, .site-nav-actions { display: none; }
          .site-nav-burger { display: inline-flex; }
        }

        /* ---------- HERO ---------- */
        .hero { padding: 56px 0 90px; }
        .hero-inner { display: grid; grid-template-columns: 1.05fr 1fr; gap: 60px; align-items: center; }
        .hero-title { font-size: clamp(34px, 4.6vw, 58px); max-width: 620px; }
        .hero-sub { font-size: 18px; color: var(--ink-soft); line-height: 1.6; max-width: 460px; margin-bottom: 30px; }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .hero-micro { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--ink-soft); }
        .hero-micro svg { color: var(--sage-deep); }

        .hero-visual-wrap { position: relative; }
        .hero-visual { position: relative; }
        .hero-visual-glow {
          position: absolute; inset: -40px; background: radial-gradient(circle at 60% 30%, rgba(169, 184, 151, 0.45), transparent 65%);
          filter: blur(10px); z-index: 0;
        }
        .hero-window {
          position: relative; z-index: 1; background: var(--white); border-radius: var(--radius);
          box-shadow: var(--shadow); border: 1px solid var(--line); overflow: hidden;
        }
        .hero-window-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
        .window-dots { display: inline-flex; gap: 5px; }
        .window-dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line); display: inline-block; }
        .hero-window-title { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; }
        .hero-window-body { display: grid; grid-template-columns: 54px 1fr; min-height: 320px; }
        .hero-mini-nav { background: var(--paper-alt); display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 18px 0; }
        .hero-mini-nav > div { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 9px; color: var(--ink-soft); }
        .hero-mini-nav > div.active { background: var(--sage); color: var(--white); }
        .hero-mini-main { padding: 22px; }
        .hero-mini-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .hero-mini-head span { display: block; font-size: 12.5px; color: var(--ink-soft); }
        .hero-mini-head strong { font-size: 17px; font-family: var(--font-display); }
        .hero-mini-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
        .hero-mini-metrics > div { background: var(--paper-alt); border-radius: 12px; padding: 12px; }
        .hero-mini-metrics span { display: block; font-size: 11.5px; color: var(--ink-soft); margin-bottom: 4px; }
        .hero-mini-metrics strong { font-size: 18px; }
        .hero-mini-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .hero-mini-panel { background: var(--paper-alt); border-radius: 12px; padding: 12px; }
        .hero-mini-panel span { display: block; font-size: 11.5px; color: var(--ink-soft); margin-bottom: 6px; }
        .hero-mini-panel strong { display: block; font-size: 13px; margin-bottom: 10px; }
        .hero-mini-lines { display: flex; flex-direction: column; gap: 6px; }
        .hero-mini-lines i { height: 7px; border-radius: 4px; background: var(--line); display: block; }
        .hero-mini-lines i:nth-child(2) { width: 80%; }
        .hero-mini-lines i:nth-child(3) { width: 55%; }

        .hero-float {
          position: absolute; background: var(--white); border-radius: 14px; padding: 12px 16px;
          box-shadow: var(--shadow); border: 1px solid var(--line); z-index: 2;
        }
        .hero-float span { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--sage-deep); font-weight: 700; margin-bottom: 4px; }
        .hero-float strong { font-size: 14px; }
        .hero-float-a { left: -22px; bottom: 34px; max-width: 190px; }
        .hero-float-b { right: -14px; top: 30px; }

        @media (max-width: 980px) {
          .hero-inner { grid-template-columns: 1fr; }
          .hero-float { display: none; }
        }

        /* ---------- CONVERGE ---------- */
        .converge { padding: 90px 0; background: var(--paper-alt); }
        .converge-head { text-align: center; margin: 0 auto 50px; display: flex; flex-direction: column; align-items: center; }
        .converge-stage { position: relative; height: 360px; max-width: 640px; margin: 0 auto; }
        .converge-scatter { position: absolute; inset: 0; }
        .converge-chip {
          position: absolute; left: calc(50% + var(--x)); top: calc(50% + var(--y));
          transform: translate(-50%, -50%); display: flex; align-items: center; gap: 6px;
          background: var(--white); border: 1px solid var(--line); border-radius: 999px;
          padding: 8px 14px; font-size: 12.5px; font-weight: 600; color: var(--ink-soft);
          box-shadow: 0 8px 20px -12px rgba(27,31,22,0.25);
        }
        .converge-core {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: var(--ink); color: var(--paper); border-radius: 20px; padding: 22px 30px;
          box-shadow: var(--shadow);
        }
        .converge-core strong { font-family: var(--font-display); font-size: 17px; }
        .converge-caption { text-align: center; margin-top: 24px; }
        .converge-caption p { font-size: 18px; color: var(--ink-soft); }

        @media (max-width: 720px) {
          .converge-stage { height: 460px; }
          .converge-chip { font-size: 11px; padding: 6px 10px; }
        }

        /* ---------- EXPLORER ---------- */
        .explorer { padding: 100px 0; }
        .explorer-head { text-align: center; margin: 0 auto 46px; display: flex; flex-direction: column; align-items: center; }
        .explorer-layout { display: grid; grid-template-columns: 220px 1fr; gap: 40px; align-items: start; }
        .explorer-tabs { display: flex; flex-direction: column; gap: 6px; position: sticky; top: 100px; }
        .explorer-tab {
          display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px;
          background: transparent; border: none; text-align: left; font-size: 14.5px; font-weight: 600;
          color: var(--ink-soft); transition: background 0.18s ease, color 0.18s ease;
        }
        .explorer-tab:hover { background: var(--paper-alt); }
        .explorer-tab.active { background: var(--ink); color: var(--paper); }
        .explorer-panel { background: var(--paper-alt); border-radius: 24px; padding: 40px; min-height: 420px; }
        .explorer-panel-inner { display: flex; flex-direction: column; gap: 26px; }
        .explorer-copy h3 { font-size: 24px; max-width: 480px; }
        .explorer-copy p { color: var(--ink-soft); font-size: 15.5px; max-width: 480px; }

        @media (max-width: 880px) {
          .explorer-layout { grid-template-columns: 1fr; }
          .explorer-tabs { flex-direction: row; overflow-x: auto; position: static; gap: 8px; padding-bottom: 4px; }
          .explorer-tab { flex-shrink: 0; }
          .explorer-panel { padding: 24px; }
        }

        /* preview windows, reused across explorer / commerce */
        .preview-window { background: var(--white); border-radius: 18px; border: 1px solid var(--line); padding: 22px; box-shadow: var(--shadow); }
        .preview-rows { display: flex; flex-direction: column; gap: 12px; }
        .preview-rows > div { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
        .preview-rows > div:last-child { border-bottom: none; }
        .preview-rows span { color: var(--ink-soft); }
        .preview-rows strong.ok { color: var(--sage-deep); }
        .preview-rows strong.warn { color: var(--gold); }
        .preview-rows strong.danger { color: #b0462f; }
        .preview-rows strong.tag { font-size: 11.5px; padding: 3px 9px; border-radius: 999px; background: var(--sage-pale); color: var(--sage-deep); }
        .preview-rows strong.tag-active { background: var(--ink); color: var(--paper); }
        .preview-bars { display: flex; align-items: flex-end; gap: 10px; height: 90px; margin-top: 18px; }
        .preview-bars span { flex: 1; background: var(--sage); border-radius: 6px 6px 0 0; opacity: 0.75; }
        .preview-client-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .preview-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--sage-pale); color: var(--sage-deep); display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .preview-client-head strong { display: block; }
        .preview-client-head span { font-size: 12.5px; color: var(--ink-soft); }
        .preview-tabs-row { display: flex; gap: 18px; font-size: 13px; font-weight: 600; color: var(--ink-soft); border-bottom: 1px solid var(--line); margin-bottom: 16px; padding-bottom: 10px; }
        .preview-tabs-row .active { color: var(--ink); }
        .preview-kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .preview-kanban-col { display: flex; flex-direction: column; gap: 8px; }
        .preview-kanban-col > span { font-size: 12px; font-weight: 700; color: var(--ink-soft); margin-bottom: 4px; }
        .preview-kanban-card { background: var(--paper-alt); border-radius: 10px; padding: 10px; font-size: 12.5px; }
        .preview-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .preview-cal-cell { aspect-ratio: 1; border-radius: 8px; background: var(--paper-alt); }
        .preview-cal-cell.has-post { background: var(--sage); }

        /* ---------- OUTCOMES ---------- */
        .outcomes { padding: 90px 0; background: var(--ink); color: var(--paper); }
        .outcomes-head { text-align: center; margin: 0 auto 50px; display: flex; flex-direction: column; align-items: center; }
        .outcomes .eyebrow { color: var(--sage); }
        .outcomes .section-title { color: var(--paper); }
        .outcomes-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(250,247,239,0.14); border-radius: 20px; overflow: hidden; }
        .outcomes-item { background: var(--ink); padding: 34px 26px; }
        .outcomes-num { display: block; font-family: var(--font-display); font-size: 13px; color: var(--sage); margin-bottom: 12px; }
        .outcomes-item p { font-size: 19px; margin: 0; font-family: var(--font-display); }
        @media (max-width: 880px) { .outcomes-list { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .outcomes-list { grid-template-columns: 1fr; } }

        /* ---------- CLARITY ---------- */
        .clarity { padding: 100px 0; }
        .clarity-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .clarity-prompt-list { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }
        .clarity-prompt {
          text-align: left; padding: 13px 16px; border-radius: 12px; border: 1.5px solid var(--line);
          background: var(--white); font-size: 14.5px; font-weight: 600; color: var(--ink-soft);
        }
        .clarity-prompt.active { border-color: var(--sage-deep); color: var(--ink); background: var(--sage-pale); }
        .clarity-chat { background: var(--white); border-radius: 22px; border: 1px solid var(--line); box-shadow: var(--shadow); padding: 22px; }
        .clarity-chat-head { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13.5px; color: var(--sage-deep); margin-bottom: 18px; }
        .clarity-chat-body { min-height: 180px; display: flex; flex-direction: column; gap: 12px; }
        .clarity-bubble { border-radius: 14px; padding: 13px 16px; font-size: 14.5px; }
        .clarity-bubble-user { background: var(--paper-alt); align-self: flex-end; max-width: 80%; }
        .clarity-bubble-reply { background: var(--sage-pale); }
        .clarity-bubble-reply ol { margin: 10px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
        .clarity-chat-input { margin-top: 18px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 12px 16px; color: var(--ink-soft); font-size: 13.5px; }
        @media (max-width: 880px) { .clarity-layout { grid-template-columns: 1fr; } }

        /* ---------- PROOF ---------- */
        .proof { padding: 100px 0; background: var(--paper-alt); }
        .proof-head { text-align: center; margin: 0 auto 50px; display: flex; flex-direction: column; align-items: center; }
        .proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .proof-card { background: var(--white); border-radius: 18px; padding: 24px; border: 1px solid var(--line); }
        .proof-card-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--sage-pale); color: var(--sage-deep); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .proof-card strong { display: block; font-size: 16px; margin-bottom: 4px; }
        .proof-card-industry { display: block; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 12px; font-style: italic; }
        .proof-card-areas { display: flex; flex-wrap: wrap; gap: 6px; }
        .proof-card-quote { margin-top: 14px; font-size: 13.5px; color: var(--ink-soft); border-top: 1px solid var(--line); padding-top: 12px; }
        .proof-strip { margin-top: 50px; text-align: center; }
        .proof-strip > span { display: block; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); margin-bottom: 16px; }
        .proof-strip-row { display: flex; flex-wrap: wrap; gap: 12px 26px; justify-content: center; font-size: 13.5px; font-weight: 600; color: var(--ink-soft); }
        @media (max-width: 880px) { .proof-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .proof-grid { grid-template-columns: 1fr; } }

        /* ---------- BUSINESS CHECK ---------- */
        .check { padding: 90px 0; }
        .check-card { background: var(--sage-pale); border-radius: 28px; padding: 56px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 50px; align-items: center; }
        .check-copy .button { margin-top: 24px; }
        .check-visual { display: flex; flex-direction: column; gap: 14px; }
        .check-quiz-row { background: var(--white); border-radius: 14px; padding: 16px 18px; display: flex; gap: 14px; align-items: center; box-shadow: var(--shadow); }
        .check-quiz-row span { font-family: var(--font-display); color: var(--sage-deep); font-size: 13px; }
        .check-quiz-row p { margin: 0; font-size: 14px; font-weight: 600; }
        @media (max-width: 880px) { .check-card { grid-template-columns: 1fr; padding: 34px; } }

        /* ---------- COMMERCE ---------- */
        .commerce { padding: 90px 0; }
        .commerce-card { background: var(--ink); color: var(--paper); border-radius: 28px; padding: 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        .commerce .eyebrow { color: var(--sage); }
        .commerce-list { list-style: none; padding: 0; margin: 0 0 20px; font-family: var(--font-display); font-size: 22px; }
        .commerce-list li { padding: 3px 0; }
        .commerce .section-copy { color: rgba(250,247,239,0.72); }
        .commerce-price { display: flex; align-items: baseline; gap: 6px; margin: 22px 0; }
        .commerce-price strong { font-family: var(--font-display); font-size: 40px; }
        .commerce .button-secondary { border-color: rgba(250,247,239,0.3); color: var(--paper); }
        .commerce .button-secondary:hover { border-color: var(--paper); }
        @media (max-width: 880px) { .commerce-card { grid-template-columns: 1fr; padding: 34px; } }

        /* ---------- PRICING ---------- */
        .pricing { padding: 100px 0; }
        .pricing-head { text-align: center; margin: 0 auto 50px; display: flex; flex-direction: column; align-items: center; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; align-items: start; }
        .pricing-card { background: var(--white); border: 1px solid var(--line); border-radius: 22px; padding: 32px; display: flex; flex-direction: column; gap: 14px; }
        .pricing-card.featured { background: var(--ink); color: var(--paper); border-color: var(--ink); transform: scale(1.04); box-shadow: var(--shadow); }
        .pricing-badge { align-self: flex-start; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; background: var(--gold); color: var(--ink); padding: 5px 12px; border-radius: 999px; }
        .pricing-name { font-size: 14px; font-weight: 700; color: var(--ink-soft); }
        .pricing-card.featured .pricing-name { color: rgba(250,247,239,0.7); }
        .pricing-price { display: flex; align-items: baseline; gap: 4px; }
        .pricing-price strong { font-family: var(--font-display); font-size: 40px; }
        .pricing-tagline { color: var(--ink-soft); font-size: 14.5px; margin: 0; }
        .pricing-card.featured .pricing-tagline { color: rgba(250,247,239,0.75); }
        .pricing-divider { height: 1px; background: var(--line); }
        .pricing-card.featured .pricing-divider { background: rgba(250,247,239,0.18); }
        .pricing-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 11px; flex: 1; }
        .pricing-features li { display: flex; gap: 9px; align-items: flex-start; font-size: 14px; }
        .pricing-features svg { color: var(--sage-deep); flex-shrink: 0; margin-top: 2px; }
        .pricing-card.featured .pricing-features svg { color: var(--sage); }
        .pricing-cta { justify-content: center; }
        .pricing-note { text-align: center; margin-top: 40px; font-size: 14.5px; color: var(--ink-soft); }
        .pricing-note a { text-decoration: underline; color: var(--ink); }
        @media (max-width: 940px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card.featured { transform: none; }
        }

        /* ---------- FOUNDERS ---------- */
        .founders { padding: 90px 0; background: var(--paper-alt); }
        .founders-head { text-align: center; margin: 0 auto 20px; display: flex; flex-direction: column; align-items: center; }
        .founders-lede { font-family: var(--font-display); font-style: italic; font-size: 20px; color: var(--ink); }
        .founders-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
        .founder-card { background: var(--white); border-radius: 20px; padding: 30px; border: 1px solid var(--line); }
        .founder-avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--sage); color: var(--white); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 20px; margin-bottom: 16px; }
        .founder-card span { font-size: 12.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; }
        .founder-card h3 { font-size: 22px; margin: 4px 0 10px; }
        .founder-card p { color: var(--ink-soft); font-size: 14.5px; margin: 0; }
        @media (max-width: 720px) { .founders-grid { grid-template-columns: 1fr; } }

        /* ---------- FAQ ---------- */
        .faq { padding: 90px 0; }
        .faq-list { max-width: 720px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 10px; }
        .faq-item { border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: var(--white); }
        .faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; background: none; border: none; font-size: 15.5px; font-weight: 600; text-align: left; }
        .faq-q svg { transition: transform 0.2s ease; flex-shrink: 0; }
        .faq-item.open .faq-q svg { transform: rotate(180deg); }
        .faq-a { overflow: hidden; }
        .faq-a p { margin: 0 22px 20px; color: var(--ink-soft); font-size: 14.5px; line-height: 1.6; }

        /* ---------- FINAL CTA ---------- */
        .final { padding: 40px 0 100px; }
        .final-card { background: var(--ink); color: var(--paper); border-radius: 32px; padding: 80px 40px; text-align: center; }
        .final-card h2 { font-size: clamp(32px, 5vw, 54px); color: var(--paper); }
        .final-card p { font-size: 17px; color: rgba(250,247,239,0.75); max-width: 480px; margin: 0 auto 32px; }
        .final-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 18px; }
        .final .button-primary { background: var(--sage); color: var(--ink); }
        .final .button-primary:hover { background: var(--paper); }
        .final .button-ghost { color: var(--paper); }
        .final-micro { font-size: 13px; color: rgba(250,247,239,0.55); }

        /* ---------- FOOTER ---------- */
        .site-footer { padding: 50px 0 30px; border-top: 1px solid var(--line); }
        .footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
        .footer-inner nav { display: flex; gap: 22px; flex-wrap: wrap; font-size: 13.5px; color: var(--ink-soft); }
        .footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12.5px; color: var(--ink-soft); }
      `}</style>
    </div>
  );
}