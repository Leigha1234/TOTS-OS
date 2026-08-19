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
  ChevronRight,
  CircleDollarSign,
  Cloud,
  ContactRound,
  FolderKanban,
  Gauge,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Megaphone,
  Menu,
  MessageSquareText,
  Network,
  NotebookPen,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
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

type DemoKey =
  | "home"
  | "contacts"
  | "campaigns"
  | "social"
  | "finance"
  | "notes"
  | "workspace"
  | "calendar"
  | "settings";

/* ---------------------------------------------------------------- */
/*  content                                                          */
/* ---------------------------------------------------------------- */

const LOGO_SRC = "/icon.png";

const NAV_ITEMS: NavItem[] = [
  { label: "Product", href: "#product" },
  { label: "Modules", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
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
    q: "Can I try it before I commit?",
    a: "Explore the live walkthrough on this page — it's built from the real TOTS-OS interface, so what you click through above is exactly what you'll get.",
  },
];

const ORBIT_MODULES: OrbitModule[] = [
  { icon: Users, label: "CRM", angle: -90 },
  { icon: FolderKanban, label: "Projects", angle: -30 },
  { icon: WalletCards, label: "Finance", angle: 30 },
  { icon: CalendarDays, label: "Calendar", angle: 90 },
  { icon: MessageSquareText, label: "Socials", angle: 150 },
  { icon: BarChart3, label: "Insights", angle: 210 },
];

/* ---------------------------------------------------------------- */
/*  demo content — a static, click-through replica of the product   */
/*  (visual only — nothing here talks to a server)                  */
/* ---------------------------------------------------------------- */

const DEMO_NAV: { key: DemoKey; label: string; icon: LucideIcon; group: string }[] = [
  { key: "home", label: "Home", icon: LayoutDashboard, group: "" },
  { key: "contacts", label: "Contacts", icon: Users, group: "My business" },
  { key: "campaigns", label: "Campaigns", icon: Megaphone, group: "My business" },
  { key: "social", label: "Social", icon: MessageSquareText, group: "My business" },
  { key: "finance", label: "Finance", icon: CircleDollarSign, group: "My business" },
  { key: "notes", label: "Notes", icon: NotebookPen, group: "My business" },
  { key: "workspace", label: "Workspace", icon: FolderKanban, group: "Clients & projects" },
  { key: "calendar", label: "Calendar", icon: CalendarDays, group: "Planning" },
  { key: "settings", label: "Settings", icon: SettingsIcon, group: "" },
];

const DEMO_CONTACTS = [
  { name: "Ava Stone", org: "Halstead & Co", tag: "Strategic partner" },
  { name: "Leo Bennett", org: "Halstead & Co", tag: "Strategic partner" },
  { name: "Priya N.", org: "Northfield Studio", tag: "Client" },
  { name: "Tom R.", org: "Marlow Fitness", tag: "Client" },
];

const DEMO_CAMPAIGNS = [
  {
    name: "Summer launch",
    list: "VIP clients",
    status: "SENT",
    sent: 128,
    opens: 74,
    clicks: 19,
    meta: "Sent 3 Aug 2026 at 09:12",
  },
  {
    name: "Autumn preview",
    list: "Newsletter",
    status: "DRAFT",
    sent: 0,
    opens: 0,
    clicks: 0,
    meta: "Scheduled 2 Sep 2026 at 08:00",
  },
];

const DEMO_TASKS = {
  todo: [
    { title: "Check socials queue", project: "TOTS-OS", lead: "Studio" },
    { title: "Chase overdue invoice", project: "Halstead & Co", lead: "Finance" },
  ],
  progress: [
    { title: "Upload new brand assets", project: "Settings", lead: "Studio" },
  ],
  done: [
    { title: "Rebuild homepage hero", project: "Website", lead: "Studio" },
  ],
};

function Logo({ size = 34, showWordmark = true, dark = false }: { size?: number; showWordmark?: boolean; dark?: boolean }) {
  return (
    <span className="tots-logo-unit">
      <img
        src={LOGO_SRC}
        alt="TOTS-OS"
        width={size}
        height={size}
        className="tots-logo-mark"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="tots-logo-word" data-dark={dark}>
          <span className="tots-logo-name">TOTS-OS</span>
          <span className="tots-logo-sub">business operating system</span>
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  primitives                                                       */
/* ---------------------------------------------------------------- */

function Cursor({ className = "" }: { className?: string }) {
  return <span className={`tots-cursor ${className}`} aria-hidden="true" />;
}

function Eyebrow({ children }: { children: ReactNode }) {
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

function Reveal({ children, delay = 0, className = "", style }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 36, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.9, delay, ease: [0.19, 1, 0.22, 1] }}
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

function BootSequence({ done, onSkip }: BootSequenceProps) {
  const [lineCount, setLineCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (lineCount >= BOOT_LINES.length) return;

    const timer = window.setTimeout(
      () => setLineCount((current) => current + 1),
      lineCount === 0 ? 260 : 190
    );

    return () => window.clearTimeout(timer);
  }, [lineCount, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    setProgress(Math.min(100, Math.round((lineCount / BOOT_LINES.length) * 100)));
  }, [lineCount, reduceMotion]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="tots-boot">
          <div className="tots-boot-flash" data-done={progress >= 100} />
          <div className="tots-boot-bars" aria-hidden="true">
            <span />
            <span />
          </div>

          <button className="tots-boot-skip" onClick={onSkip} type="button">
            Skip intro
          </button>

          <div className="tots-boot-inner">
            <div className="tots-boot-brand">
              <Logo size={40} showWordmark={false} />
              <span className="tots-boot-mark">TOTS&ndash;OS</span>
              <span className="tots-boot-sub">business operating system</span>
            </div>

            <div className="tots-boot-log">
              {BOOT_LINES.slice(0, lineCount).map((line, index) => (
                <div key={`${line}-${index}`} className="tots-boot-line">
                  <span className="tots-boot-caret">&rsaquo;</span>
                  {line}
                </div>
              ))}

              {lineCount < BOOT_LINES.length && (
                <div className="tots-boot-line tots-boot-line-active">
                  <span className="tots-boot-caret">&rsaquo;</span>
                  <Cursor />
                </div>
              )}
            </div>

            <div className="tots-boot-bar-track">
              <motion.div className="tots-boot-bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.25 }} />
            </div>

            <div className="tots-boot-progress-label">
              <span>booting workspace</span>
              <span>{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------- */
/*  interactive product demo — click through the real TOTS-OS UI    */
/*  everything here is static demo data; nothing saves or sends     */
/* ---------------------------------------------------------------- */

function DemoStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="tots-demo-stat">
      <p className="tots-demo-label">{label}</p>
      <p className="tots-demo-value">{value}</p>
      {note && <p className="tots-demo-note">{note}</p>}
    </div>
  );
}

function DemoPanel({ children, title, eyebrow, action }: { children: ReactNode; title: string; eyebrow: string; action?: ReactNode }) {
  return (
    <div className="tots-demo-panel">
      <div className="tots-demo-panel-head">
        <div>
          <p className="tots-demo-label">{eyebrow}</p>
          <p className="tots-demo-panel-title">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DemoHome() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">wed &middot; 19 aug</p>
          <h3 className="tots-demo-serif">Good afternoon.</h3>
          <p className="tots-demo-dim">Here&rsquo;s everything happening across your business.</p>
        </div>
        <div className="tots-demo-ai">
          <Sparkles size={14} strokeWidth={1.6} />
        </div>
      </div>

      <div className="tots-demo-stats tots-demo-stats-6">
        <DemoStat label="Health" value="82%" />
        <DemoStat label="Open tasks" value="12" />
        <DemoStat label="Projects" value="4" />
        <DemoStat label="Today" value="3" />
        <DemoStat label="Invoices due" value="2" />
        <DemoStat label="Revenue" value="&pound;8,240" note="+11.4%" />
      </div>

      <div className="tots-demo-grid-2">
        <DemoPanel eyebrow="focus" title="Today&rsquo;s priorities" action={<span className="tots-demo-pill">On track</span>}>
          <div className="tots-demo-list">
            <div className="tots-demo-row">
              <span className="tots-demo-num">1</span>
              <span>Send the Halstead proposal</span>
            </div>
            <div className="tots-demo-row">
              <span className="tots-demo-num">2</span>
              <span>Review Q3 campaign performance</span>
            </div>
            <div className="tots-demo-row">
              <span className="tots-demo-num">3</span>
              <span>Approve this week&rsquo;s content</span>
            </div>
          </div>
        </DemoPanel>

        <DemoPanel eyebrow="snapshot" title="Business now">
          <div className="tots-demo-stats tots-demo-stats-4" style={{ marginTop: 4 }}>
            <DemoStat label="Team" value="4" />
            <DemoStat label="Projects" value="4" />
            <DemoStat label="Events" value="9" />
            <DemoStat label="Emails" value="2" />
          </div>
        </DemoPanel>
      </div>
    </>
  );
}

function DemoContacts() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">Contacts</h3>
        <div className="tots-demo-searchbar">
          <Search size={13} strokeWidth={1.6} />
          <span>Search&hellip;</span>
        </div>
      </div>
      <div className="tots-demo-list" style={{ marginTop: 22 }}>
        {DEMO_CONTACTS.map((c) => (
          <div key={c.name} className="tots-demo-contact-row">
            <span className="tots-demo-avatar">
              {c.name.slice(0, 1)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="tots-demo-contact-name">{c.name}</p>
              <p className="tots-demo-dim">
                {c.org} &middot; <em>{c.tag}</em>
              </p>
            </div>
            <ChevronRight size={15} className="tots-dim-icon" />
          </div>
        ))}
      </div>
    </>
  );
}

function DemoCampaigns() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">Campaigns</h3>
        <span className="tots-demo-pill-btn">
          <Plus size={13} /> New campaign
        </span>
      </div>
      <div className="tots-demo-grid-2" style={{ marginTop: 22 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {DEMO_CAMPAIGNS.map((c) => (
            <div key={c.name} className="tots-demo-panel" style={{ padding: 20 }}>
              <div className="tots-demo-panel-head">
                <div>
                  <p className="tots-demo-contact-name" style={{ marginBottom: 2 }}>{c.name}</p>
                  <p className="tots-demo-dim">{c.list}</p>
                </div>
                <span className={`tots-demo-pill ${c.status === "SENT" ? "is-live" : ""}`}>{c.status}</span>
              </div>
              <div className="tots-demo-stats tots-demo-stats-3" style={{ marginTop: 16 }}>
                <DemoStat label="Sent" value={String(c.sent)} />
                <DemoStat label="Opens" value={String(c.opens)} />
                <DemoStat label="Clicks" value={String(c.clicks)} />
              </div>
              <p className="tots-demo-dim" style={{ marginTop: 14, fontSize: 10.5 }}>{c.meta}</p>
            </div>
          ))}
        </div>

        <DemoPanel eyebrow="campaign lists" title="Manage your audiences">
          <div className="tots-demo-list">
            {["Newsletter", "VIP clients", "Warm leads", "Welcome pack"].map((l) => (
              <div key={l} className="tots-demo-row">
                <span className="tots-demo-hash">#</span>
                <span style={{ flex: 1 }}>{l}</span>
              </div>
            ))}
          </div>
        </DemoPanel>
      </div>
    </>
  );
}

function DemoSocial() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">create content</p>
          <h3 className="tots-demo-serif">What are we posting?</h3>
        </div>
        <span className="tots-demo-pill-btn">
          <Sparkles size={13} /> Give me ideas
        </span>
      </div>
      <div className="tots-demo-grid-2" style={{ marginTop: 22 }}>
        <div className="tots-demo-upload">
          <ImageIcon size={20} strokeWidth={1.4} />
          <p className="tots-demo-contact-name" style={{ marginTop: 10 }}>Add your content</p>
          <p className="tots-demo-dim">Upload an image or video</p>
        </div>
        <DemoPanel eyebrow="where should it go?" title="Connected platforms">
          <div className="tots-demo-list">
            {["Instagram", "TikTok", "Facebook", "LinkedIn"].map((p, i) => (
              <div key={p} className="tots-demo-row">
                <span style={{ flex: 1 }}>{p}</span>
                <span className={`tots-demo-toggle ${i === 1 ? "is-on" : ""}`}>
                  <span />
                </span>
              </div>
            ))}
          </div>
        </DemoPanel>
      </div>
    </>
  );
}

function DemoFinance() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">Finance</h3>
        <span className="tots-demo-pill-btn">
          <RefreshCw size={12} /> Refresh
        </span>
      </div>
      <div className="tots-demo-tabs">
        {["Overview", "Invoices", "Expenses", "Tax & VAT", "Payroll"].map((t, i) => (
          <span key={t} className={`tots-demo-tab ${i === 0 ? "is-active" : ""}`}>{t}</span>
        ))}
      </div>
      <div className="tots-demo-panel tots-demo-panel-dark" style={{ marginTop: 16 }}>
        <div className="tots-demo-panel-head">
          <div>
            <p className="tots-demo-label" style={{ color: "rgba(243,244,238,0.4)" }}>financial control centre</p>
            <p className="tots-demo-serif" style={{ fontSize: 22 }}>Business position at a glance</p>
          </div>
          <span className="tots-demo-pill is-live">Health 91</span>
        </div>
        <div className="tots-demo-stats tots-demo-stats-4" style={{ marginTop: 18 }}>
          <DemoStat label="Net position" value="&pound;4,120" />
          <DemoStat label="Outstanding" value="&pound;1,860" />
          <DemoStat label="VAT owed" value="&pound;640" />
          <DemoStat label="Tax exposure" value="&pound;1,050" />
        </div>
      </div>
    </>
  );
}

function DemoNotes() {
  const columns: { key: keyof typeof DEMO_TASKS; label: string }[] = [
    { key: "todo", label: "To do" },
    { key: "progress", label: "In progress" },
    { key: "done", label: "Done" },
  ];

  return (
    <>
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">Notes</h3>
        <span className="tots-demo-dim">18 tasks</span>
      </div>
      <div className="tots-demo-kanban">
        {columns.map((col) => (
          <div key={col.key} className="tots-demo-kanban-col">
            <p className="tots-demo-label">{col.label} &middot; {DEMO_TASKS[col.key].length}</p>
            {DEMO_TASKS[col.key].map((t) => (
              <div key={t.title} className="tots-demo-card">
                <p className="tots-demo-label">{t.project}</p>
                <p className="tots-demo-serif" style={{ fontSize: 15, marginTop: 6 }}>{t.title}</p>
                <p className="tots-demo-dim" style={{ marginTop: 8 }}>Lead: {t.lead}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function DemoWorkspace() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">commercial workspace</p>
          <h3 className="tots-demo-serif">Clients &amp; Projects</h3>
        </div>
        <span className="tots-demo-pill-btn">
          <Plus size={13} /> New project
        </span>
      </div>
      <DemoPanel eyebrow="tots summary" title="" >
        <p className="tots-demo-dim" style={{ fontSize: 13 }}>
          You currently have 4 active projects. 1 project is overdue. Active project value is &pound;6,400.
        </p>
      </DemoPanel>
      <div className="tots-demo-stats tots-demo-stats-4" style={{ marginTop: 12 }}>
        <DemoStat label="Active projects" value="4" />
        <DemoStat label="Active clients" value="6" />
        <DemoStat label="Overdue" value="1" />
        <DemoStat label="Project value" value="&pound;6,400" />
      </div>
    </>
  );
}

function DemoCalendar() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">your time</p>
          <h3 className="tots-demo-serif">Bookings &amp; Schedule</h3>
        </div>
        <span className="tots-demo-pill-btn">
          <Plus size={13} /> Add event
        </span>
      </div>
      <div className="tots-demo-tabs">
        {["Overview", "Calendar", "Booking page", "Availability"].map((t, i) => (
          <span key={t} className={`tots-demo-tab ${i === 0 ? "is-active" : ""}`}>{t}</span>
        ))}
      </div>
      <div className="tots-demo-stats tots-demo-stats-4" style={{ marginTop: 16 }}>
        <DemoStat label="Today" value="1" />
        <DemoStat label="Upcoming" value="5" />
        <DemoStat label="Booking days" value="4" />
        <DemoStat label="Booking page" value="Live" />
      </div>
    </>
  );
}

function DemoSettings() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">administrative centre</p>
          <h3 className="tots-demo-serif">Settings</h3>
        </div>
        <span className="tots-demo-pill-btn" style={{ background: "var(--ink)", color: "#08080a" }}>
          Save changes
        </span>
      </div>
      <DemoPanel eyebrow="profile" title="">
        <div className="tots-demo-grid-2" style={{ marginTop: 0 }}>
          <div>
            <p className="tots-demo-label">Full name</p>
            <div className="tots-demo-field" />
          </div>
          <div>
            <p className="tots-demo-label">Email address</p>
            <div className="tots-demo-field">hello@yourbusiness.com</div>
          </div>
        </div>
      </DemoPanel>
    </>
  );
}

const DEMO_VIEWS: Record<DemoKey, () => JSX.Element> = {
  home: DemoHome,
  contacts: DemoContacts,
  campaigns: DemoCampaigns,
  social: DemoSocial,
  finance: DemoFinance,
  notes: DemoNotes,
  workspace: DemoWorkspace,
  calendar: DemoCalendar,
  settings: DemoSettings,
};

function ProductDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<DemoKey>("home");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [26, -26]);

  const ActiveView = DEMO_VIEWS[active];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
      style={{ y }}
      className="tots-window-wrap"
      id="demo"
    >
      <div className="tots-window-glow" />
  

      <div className="tots-window">
        {/* browser-style chrome, matching the real product */}
        <div className="tots-window-bar">
          <div className="tots-window-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="tots-window-url">
            <LockKeyhole size={9} strokeWidth={2} />
            tots-os.co.uk / {active}
          </div>
          <div className="tots-window-status">
            <span className="tots-status-dot" />
            demo
          </div>
        </div>

        <div className="tots-window-body">
          <aside className="tots-window-side">
            <div className="tots-window-side-brand">
              <Logo size={26} showWordmark={false} />
              <span className="tots-window-side-label">workspace</span>
            </div>

            <div className="tots-window-nav">
              {DEMO_NAV.map((item, i) => {
                const Icon = item.icon;
                const showGroup = item.group && DEMO_NAV[i - 1]?.group !== item.group;
                return (
                  <div key={item.key}>
                    {showGroup && <p className="tots-window-navgroup">{item.group}</p>}
                    <button
                      type="button"
                      onClick={() => setActive(item.key)}
                      className={`tots-window-navitem ${active === item.key ? "is-active" : ""}`}
                    >
                      <Icon size={15} strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="tots-window-main">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
              >
                <ActiveView />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="tots-window-nav-hint">
        {DEMO_NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            className={`tots-window-hint-chip ${active === item.key ? "is-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/*  main                                                             */
/* ---------------------------------------------------------------- */

export default function TotsOSLanding() {
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <div className="tots-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:ital,wght@0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        html { scroll-behavior: smooth; }
        body { margin: 0; background: #08080a; }

        .tots-root {
          --bg: #08080a;
          --bg-1: #0e0e10;
          --bg-2: #131315;
          --ink: #f3f4ee;
          --ink-dim: rgba(243,244,238,0.44);
          --ink-faint: rgba(243,244,238,0.20);
          --ink-ghost: rgba(243,244,238,0.09);
          --accent: #d7e0a8;
          --accent-gold: #cbab6e;
          --accent-soft: rgba(215,224,168,0.14);
          --accent-deep: #7c8a52;
          --line: rgba(243,244,238,0.09);
          --line-soft: rgba(243,244,238,0.055);
          --font-serif: 'Fraunces', ui-serif, georgia, serif;

          min-height: 100vh;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          position: relative;
          overflow-x: hidden;
          isolation: isolate;
        }

        .tots-root * { box-sizing: border-box; }
        .tots-root h1, .tots-root h2, .tots-root h3 { font-family: 'Space Grotesk', ui-sans-serif, sans-serif; letter-spacing: -0.04em; margin: 0; }
        .tots-root p { margin-top: 0; margin-bottom: 0; }
        .tots-root ::selection { background: var(--accent); color: #08080a; }
        .tots-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .tots-mono-label { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); margin: 0; }

        /* film grain, for a cinematic texture across the whole page */
        .tots-grain {
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .tots-cursor { display: inline-block; width: 8px; height: 1em; background: var(--accent); margin-left: 2px; vertical-align: -0.15em; animation: tots-blink 1s steps(1) infinite; }
        @keyframes tots-blink { 50% { opacity: 0; } }

        .tots-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,0.02); font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-dim); }
        .tots-eyebrow-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 10px var(--accent); }

        /* logo unit, shared everywhere so the icon stays consistent */
        .tots-logo-unit { display: flex; align-items: center; gap: 10px; }
        .tots-logo-mark { object-fit: contain; border-radius: 9px; display: block; box-shadow: 0 0 0 1px var(--line); }
        .tots-logo-word { display: flex; flex-direction: column; line-height: 1.2; }
        .tots-logo-name { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; color: var(--ink); }
        .tots-logo-sub { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; }

        .tots-bg-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(243,244,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(243,244,238,0.05) 1px, transparent 1px);
          background-size: 64px 64px; opacity: 0.35;
          -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, black 10%, transparent 75%);
          mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, black 10%, transparent 75%);
        }
        .tots-bg-glow { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 60% 40% at 50% -8%, rgba(215,224,168,0.10), transparent 55%); }

        .tots-corner { position: absolute; width: 10px; height: 10px; border-color: var(--ink-ghost); border-style: solid; border-width: 0; opacity: 0; transition: opacity .3s ease, border-color .3s ease; }
        .tots-corner-tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
        .tots-corner-tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
        .tots-corner-bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
        .tots-corner-br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
        .tots-hud:hover .tots-corner { opacity: 1; border-color: var(--accent); }

        /* boot sequence */
        .tots-boot { position: fixed; inset: 0; z-index: 100; background: #050506; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .tots-boot-flash { position: absolute; inset: 0; background: var(--accent); opacity: 0; pointer-events: none; }
        .tots-boot-flash[data-done="true"] { animation: tots-flash 0.6s ease forwards; animation-delay: 0.15s; }
        @keyframes tots-flash { 0% { opacity: 0; } 45% { opacity: 0.9; } 100% { opacity: 0; } }
        .tots-boot-bars { position: absolute; inset: 0; pointer-events: none; }
        .tots-boot-bars span { position: absolute; left: 0; right: 0; height: 6vh; background: #000; }
        .tots-boot-bars span:first-child { top: 0; }
        .tots-boot-bars span:last-child { bottom: 0; }
        .tots-boot-skip { position: absolute; top: 22px; right: 22px; font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--ink-faint); background: rgba(255,255,255,0.03); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; cursor: pointer; }
        .tots-boot-skip:hover { color: var(--ink); }
        .tots-boot-inner { width: min(560px, 88vw); }
        .tots-boot-brand { margin-bottom: 34px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .tots-boot-mark { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.8rem, 5vw, 2.6rem); font-weight: 600; letter-spacing: -0.04em; }
        .tots-boot-sub { width: 100%; margin-left: 54px; margin-top: -8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent); opacity: 0.7; }
        .tots-boot-log { min-height: 210px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.9; color: var(--ink-dim); }
        .tots-boot-line { display: flex; gap: 8px; }
        .tots-boot-caret { color: var(--accent); }
        .tots-boot-line-active { color: var(--ink); }
        .tots-boot-bar-track { margin-top: 22px; height: 2px; width: 100%; background: var(--line); overflow: hidden; }
        .tots-boot-bar-fill { height: 100%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
        .tots-boot-progress-label { margin-top: 10px; display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); }

        /* nav */
        .tots-nav-shell { position: fixed; inset-inline: 0; top: 0; z-index: 50; padding: 16px 20px 0; }
        .tots-nav { max-width: 1400px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--line); border-radius: 18px; background: rgba(8,8,10,0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 0 10px 0 16px; }
        .tots-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
        .tots-nav-links { display: none; align-items: center; gap: 2px; }
        .tots-nav-link { padding: 9px 15px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-dim); text-decoration: none; transition: background .2s, color .2s; }
        .tots-nav-link:hover { background: rgba(255,255,255,0.05); color: var(--ink); }
        .tots-nav-actions { display: none; align-items: center; gap: 8px; }
        .tots-btn-ghost { min-height: 40px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--line); border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-dim); text-decoration: none; transition: border-color .2s, color .2s, transform .2s; }
        .tots-btn-ghost:hover { border-color: var(--ink-faint); color: var(--ink); transform: translateY(-1px); }
        .tots-btn-solid { min-height: 40px; padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 999px; background: linear-gradient(135deg, var(--accent), var(--accent-gold)); color: #08080a; font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; border: none; cursor: pointer; transition: transform .2s, filter .2s; }
        .tots-btn-solid:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .tots-btn-solid.lg, .tots-btn-ghost.lg { min-height: 56px; padding: 0 28px; font-size: 10px; }
        .tots-menu-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--ink-dim); background: transparent; cursor: pointer; }
        @media (min-width: 1024px) { .tots-nav-links { display: flex; } }
        @media (min-width: 640px) { .tots-nav-actions { display: flex; } .tots-menu-btn { display: none; } }

        .tots-mobile-menu { position: fixed; inset: 0; z-index: 90; background: rgba(5,5,6,0.9); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); padding: 16px; }
        .tots-mobile-panel { border: 1px solid var(--line); border-radius: 24px; background: var(--bg-1); padding: 20px; }
        .tots-mobile-link { display: flex; align-items: center; justify-content: space-between; padding: 16px 14px; border-radius: 16px; color: var(--ink-dim); text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.08em; }
        .tots-mobile-link:hover { background: rgba(255,255,255,0.05); }

        /* hero */
        .tots-hero { position: relative; z-index: 10; padding: 120px 20px 60px; min-height: auto; }
        .tots-hero-inner { max-width: 1400px; margin: 0 auto; text-align: center; }
        .tots-hero h1 { margin: 24px auto 0; max-width: 1100px; font-size: clamp(2.5rem, 6.6vw, 6.4rem); line-height: 0.96; font-weight: 600; }
        .tots-hero-line2 { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 500; background: linear-gradient(90deg, #fff, var(--accent) 60%, rgba(255,255,255,0.4)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .tots-hero p.lede { max-width: 640px; margin: 26px auto 0; font-size: clamp(0.95rem, 1.4vw, 1.1rem); line-height: 1.7; color: var(--ink-dim); }
        .tots-hero-ctas { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; margin-top: 38px; }
        @media (min-width: 640px) { .tots-hero-ctas { flex-direction: row; } }
        .tots-hero-meta { margin-top: 30px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 20px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
        .tots-hero-meta span { display: inline-flex; align-items: center; gap: 6px; }

        /* demo window */
        .tots-window-wrap { position: relative; margin: 54px auto 0; max-width: 1180px; }
        .tots-window-glow { position: absolute; inset: -30px; background: radial-gradient(ellipse, rgba(215,224,168,0.10), transparent 70%); filter: blur(40px); }
        .tots-window-frame-label { position: relative; display: inline-flex; align-items: center; gap: 8px; margin: 0 auto 16px; padding: 7px 14px; border: 1px solid var(--line); border-radius: 999px; background: rgba(0,0,0,0.3); font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-dim); left: 50%; transform: translateX(-50%); white-space: nowrap; }
        .tots-window { position: relative; overflow: hidden; border-radius: 20px; border: 1px solid var(--line); background: #f7f6f1; box-shadow: 0 60px 160px rgba(0,0,0,0.6), 0 0 0 1px rgba(215,224,168,0.08); }
        .tots-window-bar { display: flex; align-items: center; gap: 12px; height: 42px; padding: 0 16px; border-bottom: 1px solid rgba(20,20,18,0.08); background: #eeece3; }
        .tots-window-dots { display: flex; gap: 6px; }
        .tots-window-dots span { width: 8px; height: 8px; border-radius: 999px; background: rgba(20,20,18,0.18); }
        .tots-window-url { display: flex; align-items: center; gap: 6px; margin: 0 auto; padding: 5px 14px; border-radius: 999px; background: rgba(255,255,255,0.6); font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(20,20,18,0.5); letter-spacing: 0.03em; }
        .tots-window-status { display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-deep); }
        .tots-status-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
        .tots-window-body { display: grid; grid-template-columns: 64px 1fr; min-height: 560px; }
        @media (min-width: 768px) { .tots-window-body { grid-template-columns: 200px 1fr; } }
        .tots-window-side { border-right: 1px solid rgba(20,20,18,0.07); background: #fbfaf6; padding: 16px; }
        .tots-window-side-brand { display: flex; align-items: center; gap: 10px; }
        .tots-window-side-label { display: none; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(20,20,18,0.35); }
        @media (min-width: 768px) { .tots-window-side-label { display: inline; } }
        .tots-window-nav { margin-top: 26px; display: flex; flex-direction: column; gap: 2px; }
        .tots-window-navgroup { margin: 14px 0 6px 10px; font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(20,20,18,0.3); }
        .tots-window-navitem { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; color: rgba(20,20,18,0.55); width: 100%; background: transparent; border: none; cursor: pointer; text-align: left; font-family: inherit; transition: background .15s, color .15s; }
        .tots-window-navitem:hover { background: rgba(20,20,18,0.05); }
        .tots-window-navitem span { display: none; font-size: 11px; }
        @media (min-width: 768px) { .tots-window-navitem span { display: inline; } }
        .tots-window-navitem.is-active { background: var(--accent); color: #08080a; }
        .tots-window-main { padding: 18px; min-width: 0; color: #16160f; }
        @media (min-width: 640px) { .tots-window-main { padding: 28px; } }
        .tots-window-nav-hint { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
        .tots-window-hint-chip { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--ink-faint); cursor: pointer; }
        .tots-window-hint-chip.is-active, .tots-window-hint-chip:hover { color: var(--accent); border-color: rgba(215,224,168,0.35); }

        /* demo content typography + widgets (light theme, matches the real app) */
        .tots-demo-serif { font-family: var(--font-serif); font-style: italic; font-weight: 500; font-size: 26px; letter-spacing: -0.01em; margin: 4px 0 0; color: #16160f; }
        .tots-demo-mainhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .tots-demo-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(20,20,18,0.38); margin: 0; }
        .tots-demo-dim { font-size: 12.5px; color: rgba(20,20,18,0.5); line-height: 1.6; }
        .tots-demo-ai { width: 30px; height: 30px; border-radius: 999px; background: #16160f; color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tots-demo-stats { display: grid; gap: 8px; margin-top: 20px; }
        .tots-demo-stats-6 { grid-template-columns: repeat(2, 1fr); }
        .tots-demo-stats-4 { grid-template-columns: repeat(2, 1fr); }
        .tots-demo-stats-3 { grid-template-columns: repeat(3, 1fr); }
        @media (min-width: 640px) { .tots-demo-stats-6 { grid-template-columns: repeat(3, 1fr); } .tots-demo-stats-4 { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .tots-demo-stats-6 { grid-template-columns: repeat(6, 1fr); } }
        .tots-demo-stat { border: 1px solid rgba(20,20,18,0.08); background: rgba(255,255,255,0.55); border-radius: 12px; padding: 12px 14px; min-width: 0; }
        .tots-demo-value { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 500; letter-spacing: -0.02em; margin-top: 8px; color: #16160f; }
        .tots-demo-note { font-size: 9px; color: var(--accent-deep); margin-top: 4px; }
        .tots-demo-grid-2 { display: grid; gap: 12px; margin-top: 16px; }
        @media (min-width: 900px) { .tots-demo-grid-2 { grid-template-columns: 1.3fr 0.9fr; } }
        .tots-demo-panel { border: 1px solid rgba(20,20,18,0.08); background: rgba(255,255,255,0.55); border-radius: 16px; padding: 18px; }
        .tots-demo-panel-dark { background: #16160f; color: #f3f4ee; border-color: rgba(255,255,255,0.08); }
        .tots-demo-panel-dark .tots-demo-serif { color: #f3f4ee; }
        .tots-demo-panel-dark .tots-demo-value { color: #f3f4ee; }
        .tots-demo-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .tots-demo-panel-title { font-family: var(--font-serif); font-style: italic; font-size: 15px; color: #16160f; margin-top: 2px; }
        .tots-demo-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .tots-demo-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(20,20,18,0.03); font-size: 12.5px; color: rgba(20,20,18,0.7); }
        .tots-demo-num { width: 18px; height: 18px; border-radius: 999px; background: #16160f; color: var(--accent); font-size: 9px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tots-demo-hash { color: rgba(20,20,18,0.3); font-family: 'JetBrains Mono', monospace; }
        .tots-demo-pill { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; background: rgba(20,20,18,0.06); color: rgba(20,20,18,0.5); white-space: nowrap; }
        .tots-demo-pill.is-live { background: var(--accent-soft); color: var(--accent-deep); }
        .tots-demo-pill-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 9px 14px; border-radius: 999px; background: #16160f; color: var(--accent); white-space: nowrap; }
        .tots-demo-searchbar { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px; border: 1px solid rgba(20,20,18,0.1); font-size: 12px; color: rgba(20,20,18,0.4); }
        .tots-demo-contact-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; border: 1px solid rgba(20,20,18,0.08); background: rgba(255,255,255,0.5); }
        .tots-demo-avatar { width: 34px; height: 34px; border-radius: 999px; background: var(--accent); color: #16160f; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .tots-demo-contact-name { font-size: 13.5px; font-weight: 600; color: #16160f; }
        .tots-demo-upload { border: 1.5px dashed rgba(20,20,18,0.15); border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; color: rgba(20,20,18,0.4); min-height: 180px; }
        .tots-demo-toggle { width: 32px; height: 18px; border-radius: 999px; background: rgba(20,20,18,0.12); display: inline-flex; align-items: center; padding: 2px; flex-shrink: 0; }
        .tots-demo-toggle span { width: 14px; height: 14px; border-radius: 999px; background: #fff; transition: transform .2s; }
        .tots-demo-toggle.is-on { background: var(--accent-deep); }
        .tots-demo-toggle.is-on span { transform: translateX(14px); }
        .tots-demo-tabs { display: flex; gap: 4px; margin-top: 18px; flex-wrap: wrap; }
        .tots-demo-tab { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; padding: 8px 12px; border-radius: 999px; color: rgba(20,20,18,0.4); }
        .tots-demo-tab.is-active { background: #16160f; color: var(--accent); }
        .tots-demo-kanban { display: grid; gap: 12px; margin-top: 18px; }
        @media (min-width: 768px) { .tots-demo-kanban { grid-template-columns: repeat(3, 1fr); } }
        .tots-demo-kanban-col { border: 1px solid rgba(20,20,18,0.08); border-radius: 14px; padding: 12px; background: rgba(20,20,18,0.02); }
        .tots-demo-card { border: 1px solid rgba(20,20,18,0.08); background: #fff; border-radius: 12px; padding: 12px; margin-top: 10px; }
        .tots-demo-field { margin-top: 6px; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(20,20,18,0.12); background: rgba(255,255,255,0.6); font-size: 12.5px; color: rgba(20,20,18,0.55); min-height: 20px; }
        .tots-dim-icon { color: rgba(20,20,18,0.2); flex-shrink: 0; }

        /* marquee */
        .tots-marquee { position: relative; z-index: 10; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); overflow: hidden; padding: 26px 0; }
        .tots-marquee-track { display: flex; width: max-content; }
        .tots-marquee-item { padding: 0 32px; display: flex; align-items: center; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--ink-faint); white-space: nowrap; }
        @media (min-width: 640px) { .tots-marquee-item { padding: 0 48px; } }

        /* section */
        .tots-section { position: relative; z-index: 10; padding: 80px 20px; }
        @media (min-width: 1024px) { .tots-section { padding: 110px 24px; } }
        .tots-section.bordered { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: rgba(255,255,255,0.008); }
        .tots-wrap { max-width: 1400px; margin: 0 auto; }
        .tots-wrap-narrow { max-width: 1150px; margin: 0 auto; }

        /* why */
        .tots-why-grid { margin-top: 60px; display: grid; gap: 12px; }
        @media (min-width: 1024px) { .tots-why-grid { grid-template-columns: repeat(3, 1fr); } }
        .tots-why-card { position: relative; min-height: 340px; border: 1px solid var(--line); border-radius: 24px; background: rgba(255,255,255,0.018); padding: 30px; display: flex; flex-direction: column; }
        .tots-why-top { display: flex; align-items: center; justify-content: space-between; }
        .tots-why-icon { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .tots-why-card h3 { margin-top: auto; padding-top: 90px; font-size: 24px; font-weight: 500; }
        .tots-why-card p { margin-top: 12px; font-size: 13.5px; line-height: 1.7; color: var(--ink-dim); max-width: 340px; }

        /* features */
        .tots-feat-grid { margin-top: 60px; display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 26px; overflow: hidden; }
        @media (min-width: 768px) { .tots-feat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .tots-feat-grid { grid-template-columns: repeat(3, 1fr); } }
        .tots-feat-card { background: #08080a; padding: 32px; min-height: 300px; height: 100%; transition: background .25s; }
        .tots-feat-card:hover { background: rgba(255,255,255,0.025); }
        .tots-feat-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .tots-feat-icon { width: 46px; height: 46px; border-radius: 13px; border: 1px solid var(--line); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .tots-feat-id { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--ink-ghost); }
        .tots-feat-card h3 { margin-top: 40px; font-size: 21px; font-weight: 500; }
        .tots-feat-card p { margin-top: 12px; font-size: 13px; line-height: 1.7; color: var(--ink-dim); max-width: 320px; }

        /* connected */
        .tots-connect-grid { display: grid; gap: 60px; align-items: center; }
        @media (min-width: 1024px) { .tots-connect-grid { grid-template-columns: 1fr 1fr; } }
        .tots-orbit-wrap { position: relative; margin: 0 auto; aspect-ratio: 1; width: 100%; max-width: 560px; }
        .tots-orbit-ring { position: absolute; border-radius: 999px; border: 1px solid var(--line); }
        .tots-orbit-ring.r1 { inset: 12%; }
        .tots-orbit-ring.r2 { inset: 28%; border-style: dashed; border-color: var(--ink-ghost); }
        .tots-orbit-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 118px; height: 118px; border-radius: 30px; background: rgba(215,224,168,0.06); border: 1px solid rgba(215,224,168,0.22); display: flex; align-items: center; justify-content: center; padding: 0; overflow: hidden; }
        .tots-orbit-node { position: absolute; width: 84px; height: 84px; margin: -42px; border-radius: 18px; border: 1px solid var(--line); background: rgba(10,10,11,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
        .tots-orbit-node span { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
        @media (max-width: 520px) { .tots-orbit-node { width: 66px; height: 66px; margin: -33px; border-radius: 15px; } .tots-orbit-node span { font-size: 6.5px; } .tots-orbit-core { width: 90px; height: 90px; border-radius: 24px; } }

        .tots-check-list { margin-top: 34px; display: flex; flex-direction: column; gap: 16px; }
        .tots-check-row { display: flex; align-items: center; gap: 14px; }
        .tots-check-icon { width: 28px; height: 28px; border-radius: 999px; border: 1px solid rgba(215,224,168,0.25); background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
        .tots-check-row span.txt { font-size: 14px; color: rgba(243,244,238,0.7); }

        /* security */
        .tots-sec-card { position: relative; overflow: hidden; border-radius: 32px; border: 1px solid var(--line); background: #0a0a09; padding: 34px; }
        @media (min-width: 1024px) { .tots-sec-card { padding: 60px; } }
        .tots-sec-grid { display: grid; gap: 40px; }
        @media (min-width: 1024px) { .tots-sec-grid { grid-template-columns: 1fr 0.85fr; align-items: center; } }
        .tots-sec-items { display: grid; gap: 10px; }
        @media (min-width: 640px) { .tots-sec-items { grid-template-columns: repeat(2, 1fr); } }
        .tots-sec-item { border: 1px solid var(--line); background: rgba(255,255,255,0.02); border-radius: 16px; padding: 18px; }
        .tots-sec-item h4 { margin: 16px 0 0; font-size: 13px; font-weight: 500; }
        .tots-sec-item p { margin-top: 6px; font-size: 11.5px; line-height: 1.6; color: var(--ink-faint); }

        /* pricing */
        .tots-price-grid { margin-top: 60px; display: grid; gap: 12px; }
        @media (min-width: 1024px) { .tots-price-grid { grid-template-columns: repeat(3, 1fr); } }
        .tots-price-card { position: relative; display: flex; flex-direction: column; min-height: 540px; border-radius: 28px; border: 1px solid var(--line); background: rgba(255,255,255,0.018); padding: 30px; height: 100%; }
        .tots-price-card.featured { border-color: rgba(215,224,168,0.35); background: rgba(215,224,168,0.045); }
        .tots-price-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .tots-price-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 500; }
        .tots-price-badge { margin-top: 10px; display: inline-block; border: 1px solid rgba(215,224,168,0.3); background: var(--accent-soft); color: var(--accent); border-radius: 999px; padding: 4px 10px; font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; }
        .tots-price-figure { margin-top: 40px; display: flex; align-items: flex-end; }
        .tots-price-amount { font-family: 'Space Grotesk', sans-serif; font-size: 58px; font-weight: 600; letter-spacing: -0.04em; }
        .tots-price-period { margin-bottom: 8px; margin-left: 6px; font-size: 12px; color: var(--ink-faint); }
        .tots-price-desc { margin-top: 22px; min-height: 68px; font-size: 13.5px; line-height: 1.6; color: var(--ink-dim); }
        .tots-price-includes { margin-top: 30px; border-top: 1px solid var(--line-soft); padding-top: 26px; }
        .tots-price-feature { display: flex; align-items: flex-start; gap: 10px; margin-top: 14px; }
        .tots-price-feature span { font-size: 12.5px; line-height: 1.5; color: rgba(243,244,238,0.55); }

        /* FAQ */
        .tots-faq-grid { display: grid; gap: 50px; }
        @media (min-width: 1024px) { .tots-faq-grid { grid-template-columns: 0.7fr 1fr; } }
        .tots-faq-item { border-bottom: 1px solid var(--line); }
        .tots-faq-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0; background: none; border: none; text-align: left; cursor: pointer; color: inherit; }
        .tots-faq-btn span { font-size: 14.5px; font-weight: 500; color: rgba(243,244,238,0.78); }
        .tots-faq-answer { font-size: 13.5px; line-height: 1.7; color: var(--ink-dim); max-width: 640px; padding-bottom: 26px; }

        /* email CTA */
        .tots-cta-card { position: relative; overflow: hidden; border-radius: 32px; border: 1px solid var(--line); background: #0b0b0a; padding: 42px 20px; text-align: center; }
        @media (min-width: 1024px) { .tots-cta-card { padding: 72px 32px; } }
        .tots-cta-icon { margin: 0 auto; width: 52px; height: 52px; border-radius: 15px; border: 1px solid var(--line); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .tots-cta-form { margin: 34px auto 0; max-width: 560px; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--line); border-radius: 20px; background: rgba(0,0,0,0.3); padding: 8px; }
        @media (min-width: 640px) { .tots-cta-form { flex-direction: row; } }
        .tots-cta-input { min-height: 50px; flex: 1; background: transparent; border: none; outline: none; padding: 0 16px; color: var(--ink); font-size: 13.5px; }
        .tots-cta-input::placeholder { color: var(--ink-ghost); }

        /* footer */
        .tots-footer { position: relative; z-index: 10; border-top: 1px solid var(--line); padding: 42px 20px 24px; }
        .tots-footer-grid { display: grid; gap: 40px; padding-bottom: 50px; }
        @media (min-width: 768px) { .tots-footer-grid { grid-template-columns: 1.5fr repeat(3, 1fr); } }
        .tots-footer h5 { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); }
        .tots-footer-links { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
        .tots-footer-links a { font-size: 12.5px; color: var(--ink-dim); text-decoration: none; }
        .tots-footer-links a:hover { color: var(--ink); }
        .tots-footer-bottom { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--line); padding-top: 22px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; color: var(--ink-faint); }
        @media (min-width: 640px) { .tots-footer-bottom { flex-direction: row; align-items: center; justify-content: space-between; } }

        @media (prefers-reduced-motion: reduce) { .tots-cursor { animation: none; } }
      `}</style>

      <div className="tots-bg-grid" />
      <div className="tots-bg-glow" />
      <div className="tots-grain" />

      {/* NAV */}
      <div className="tots-nav-shell">
        <div className="tots-nav">
          <a href="/" className="tots-brand" aria-label="TOTS-OS home">
            <Logo size={38} />
          </a>

          <nav className="tots-nav-links">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="tots-nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="tots-nav-actions">
            <a href="/login" className="tots-btn-ghost">
              <LogIn size={13} />
              Log in
            </a>
            <a href="#pricing" className="tots-btn-solid">
              View plans
              <ArrowRight size={13} />
            </a>
          </div>

          <button type="button" className="tots-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tots-mobile-menu">
            <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="tots-mobile-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Logo size={30} />
                <button type="button" className="tots-menu-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                  <X size={16} />
                </button>
              </div>

              <div style={{ marginTop: 24 }}>
                {NAV_ITEMS.map((item) => (
                  <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="tots-mobile-link">
                    {item.label}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>

              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <a href="/login" className="tots-btn-ghost" style={{ justifyContent: "center" }}>
                  Log in
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="tots-btn-solid" style={{ justifyContent: "center" }}>
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

          <h1>
            Run your business
            <span className="tots-hero-line2">
              without the chaos.
              <Cursor />
            </span>
          </h1>

          <p className="lede">
            TOTS-OS boots your business into one connected system &mdash; projects, clients, finances, planning and
            content, running from a single, quietly beautiful workspace.
          </p>

          <div className="tots-hero-ctas">
            <a href="#demo" className="tots-btn-solid lg">
              Explore the live demo
              <ArrowRight size={15} />
            </a>
            <a href="#pricing" className="tots-btn-ghost lg">
              <Play size={13} style={{ fill: "currentColor" }} />
              View pricing
            </a>
          </div>

          <div className="tots-hero-meta">
            <span><Check size={12} color="var(--accent)" /> web based</span>
            <span><Check size={12} color="var(--accent)" /> secure account access</span>
            <span><Check size={12} color="var(--accent)" /> 6 modules, one system</span>
          </div>

          <ProductDemo />
        </div>
      </section>

      {/* MARQUEE */}
      <section className="tots-marquee">
        <motion.div
          animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="tots-marquee-track"
        >
          {[0, 1].flatMap((group) =>
            ["CRM", "PROJECTS", "FINANCE", "CALENDAR", "SOCIALS", "NOTES", "TASKS", "BUSINESS KPIS"].map((item, index) => (
              <span key={`${group}-${index}`} className="tots-marquee-item">
                {item}
                <Sparkles size={11} color="var(--accent)" opacity={0.4} />
              </span>
            ))
          )}
        </motion.div>
      </section>

      {/* WHY */}
      <section id="product" className="tots-section">
        <div className="tots-wrap">
          <Reveal>
            <div style={{ display: "grid", gap: 32 }}>
              <Eyebrow>why tots-os</Eyebrow>
              <h2 style={{ fontSize: "clamp(2.4rem,5.6vw,5.6rem)", lineHeight: 0.98, fontWeight: 500, maxWidth: 900 }}>
                Stop building your business around{" "}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--ink-faint)" }}>
                  disconnected tools.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="tots-why-grid">
            {[
              { icon: Layers3, id: "why.01", title: "One connected workspace", text: "The parts of your business belong together — the context around clients, work, money and plans, always close at hand." },
              { icon: Gauge, id: "why.02", title: "Clarity at a glance", text: "See what needs attention, what is moving and what comes next, without rebuilding the picture every morning." },
              { icon: Zap, id: "why.03", title: "Less admin friction", text: "Spend less time maintaining your organisation system, and more time actually using it to move forward." },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.id} delay={index * 0.08}>
                  <div className="tots-why-card tots-hud">
                    <Corners />
                    <div className="tots-why-top">
                      <span className="tots-mono-label">{item.id}</span>
                      <div className="tots-why-icon">
                        <Icon size={18} strokeWidth={1.6} />
                      </div>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="tots-section bordered">
        <div className="tots-wrap">
          <Reveal className="tots-wrap-narrow">
            <div style={{ textAlign: "center" }}>
              <Eyebrow>inside the system</Eyebrow>
              <h2 style={{ margin: "26px auto 0", maxWidth: 760, fontSize: "clamp(2.4rem,5.4vw,5rem)", lineHeight: 0.98, fontWeight: 500 }}>
                Everything has a place.
              </h2>
              <p style={{ margin: "24px auto 0", maxWidth: 560, fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-dim)" }}>
                Six core modules, engineered to run as parts of one system — not a pile of separate subscriptions.
              </p>
            </div>
          </Reveal>

          <div className="tots-feat-grid">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.id} delay={(index % 3) * 0.06}>
                  <div className="tots-feat-card">
                    <div className="tots-feat-top">
                      <div className="tots-feat-icon">
                        <Icon size={19} strokeWidth={1.6} />
                      </div>
                      <span className="tots-feat-id">mod.{feature.id}</span>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONNECTED SYSTEM */}
      <section className="tots-section">
        <div className="tots-wrap tots-connect-grid">
          <Reveal>
            <Eyebrow>connected by design</Eyebrow>
            <h2 style={{ marginTop: 26, maxWidth: 560, fontSize: "clamp(2.4rem,4.6vw,4.6rem)", lineHeight: 0.98, fontWeight: 500 }}>
              Your business is not six different apps.
            </h2>
            <p style={{ marginTop: 24, maxWidth: 480, fontSize: 14.5, lineHeight: 1.75, color: "var(--ink-dim)" }}>
              A client becomes a project. A project creates tasks. Tasks have dates. Work creates revenue. TOTS-OS is
              built around those relationships.
            </p>
            <div className="tots-check-list">
              {["See your work in context", "Reduce duplicate admin", "Build clearer business routines"].map((item) => (
                <div key={item} className="tots-check-row">
                  <span className="tots-check-icon">
                    <Check size={13} />
                  </span>
                  <span className="txt">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="tots-orbit-wrap">
              <div className="tots-orbit-ring r1" />
              <motion.div
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
                className="tots-orbit-ring r2"
              />
              <div className="tots-orbit-core">
                <Logo size={54} showWordmark={false} />
              </div>

              {ORBIT_MODULES.map(({ icon: Icon, label, angle }) => {
                const radians = (angle * Math.PI) / 180;
                const radius = 44;
                const left = 50 + radius * Math.cos(radians);
                const top = 50 + radius * Math.sin(radians);

                return (
                  <motion.div
                    key={label}
                    animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: Math.abs(angle) / 180 }}
                    className="tots-orbit-node"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <Icon size={16} color="var(--accent)" strokeWidth={1.6} />
                    <span>{label}</span>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="tots-section">
        <div className="tots-wrap">
          <Reveal>
            <div style={{ textAlign: "center" }}>
              <Eyebrow>simple pricing</Eyebrow>
              <h2 style={{ marginTop: 26, fontSize: "clamp(2.6rem,5.4vw,5.2rem)", fontWeight: 500, letterSpacing: "-0.04em" }}>
                Choose your system.
              </h2>
              <p style={{ margin: "18px auto 0", maxWidth: 480, fontSize: 14, lineHeight: 1.7, color: "var(--ink-dim)" }}>
                Start with the level of TOTS-OS that fits your business today.
              </p>
            </div>
          </Reveal>

          <div className="tots-price-grid">
            {PRICING.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 0.08}>
                <div className={`tots-price-card ${plan.featured ? "featured" : ""}`}>
                  <div className="tots-price-top">
                    <div>
                      <p className="tots-price-name">{plan.name}</p>
                      {plan.badge && <span className="tots-price-badge">{plan.badge}</span>}
                    </div>
                    <span className="tots-mono-label">/ {plan.tag}</span>
                  </div>

                  <div className="tots-price-figure">
                    <span className="tots-price-amount">&pound;{plan.price}</span>
                    <span className="tots-price-period">/mo</span>
                  </div>

                  <p className="tots-price-desc">{plan.description}</p>

                  <a
                    href="/login"
                    className={plan.featured ? "tots-btn-solid" : "tots-btn-ghost"}
                    style={{ marginTop: "auto", minHeight: 54, justifyContent: "center", borderRadius: 16 }}
                  >
                    Select {plan.name}
                    <ArrowRight size={13} />
                  </a>

                  <div className="tots-price-includes">
                    <p className="tots-mono-label">includes</p>
                    {plan.features.map((feature) => (
                      <div key={feature} className="tots-price-feature">
                        <CheckCircle2 size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <p style={{ marginTop: 30, textAlign: "center", fontSize: 11, color: "var(--ink-ghost)" }}>
            Plan features and availability may evolve as TOTS-OS continues to grow.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tots-section" style={{ textAlign: "center" }}>
        <div className="tots-wrap">
          <Reveal>
            <p className="tots-mono-label" style={{ color: "var(--accent)", opacity: 0.6 }}>
              tots-os
            </p>
            <h2 style={{ margin: "20px auto 0", maxWidth: 900, fontSize: "clamp(2.6rem,6.4vw,7rem)", lineHeight: 0.9, fontWeight: 600 }}>
              Your business.
              <span style={{ display: "block", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, color: "var(--ink-faint)" }}>
                Finally organised.
                <Cursor />
              </span>
            </h2>

            <div className="tots-hero-ctas" style={{ marginTop: 40 }}>
              <a href="#demo" className="tots-btn-solid lg">
                Explore the demo
                <ArrowRight size={15} />
              </a>
              <a href="/login" className="tots-btn-ghost lg">
                <LogIn size={13} />
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
              <Logo size={32} />
              <p style={{ marginTop: 16, maxWidth: 260, fontSize: 12, lineHeight: 1.7, color: "var(--ink-ghost)" }}>
                The all-in-one business operating system for bringing your work, clients, planning and operations
                together.
              </p>
            </div>

            <div>
              <h5>Product</h5>
              <div className="tots-footer-links">
                <a href="#features">Features</a>
                <a href="#demo">Demo</a>
                <a href="#pricing">Pricing</a>
                <a href="/login">Log in</a>
              </div>
            </div>

            <div>
              <h5>Company</h5>
              <div className="tots-footer-links">
                <a href="#about">About</a>
                <a href="mailto:hello@theorganisedtypes.co.uk">Contact</a>
              </div>
            </div>

            <div>
              <h5>Legal</h5>
              <div className="tots-footer-links">
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="tots-footer-bottom">
            <p>&copy; {new Date().getFullYear()} TOTS-OS. All rights reserved.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tots-status-dot" />
              <span style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}