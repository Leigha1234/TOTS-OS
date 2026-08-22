"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
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
  NotebookPen,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  type CSSProperties,
  type ReactNode,
  useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

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
  featured?: boolean;
  badge?: string;
  description: string;
  features: string[];
};

type FAQ = {
  q: string;
  a: string;
};

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
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

/* ============================================================
   GLOBAL CONTENT
============================================================ */

const LOGO_SRC = "/icon.png";

const SIGNUP_URL =
  "https://tots-os.co.uk/login";

const NAV_ITEMS: NavItem[] = [
  {
    label: "Product",
    href: "#product",
  },
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "Demo",
    href: "#demo",
  },
  {
    label: "Clarity",
    href: "#clarity",
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

const TRUSTED_BY = [
  "WhyKnot Wardrobe",
  "DP Leadership",
  "Megoosh",
  "Moray Training Club",
  "Lux Electrical Engineering",
  "TestMe Health",
  "Brave Heart Property",
  "Precision Flows",
];

const FEATURES: Feature[] = [
  {
    icon: ContactRound,
    id: "01",
    title: "Clients",
    text:
      "Keep contacts, client details, notes and project history together so you always know where things stand.",
  },
  {
    icon: FolderKanban,
    id: "02",
    title: "Projects",
    text:
      "Plan projects, assign tasks and keep work moving without relying on scattered notes and spreadsheets.",
  },
  {
    icon: CalendarDays,
    id: "03",
    title: "Calendar",
    text:
      "Keep deadlines, events, bookings and upcoming work visible in one simple business calendar.",
  },
  {
    icon: CircleDollarSign,
    id: "04",
    title: "Finances",
    text:
      "Create quotes and invoices, record expenses and understand the financial position of your business.",
  },
  {
    icon: MessageSquareText,
    id: "05",
    title: "Social",
    text:
      "Plan and organise your content without separating marketing from everything else happening in the business.",
  },
  {
    icon: NotebookPen,
    id: "06",
    title: "Notes",
    text:
      "Capture ideas, brain dumps and useful information somewhere they can actually become action.",
  },
];

const PRICING: PricingPlan[] = [
  {
    name: "Standard",
    price: 29,
    description:
      "Everything you need to bring the everyday running of your business into one organised workspace.",
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
    featured: true,
    badge: "Most popular",
    description:
      "For growing businesses that want more visibility, stronger workflows and additional tools.",
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
    description:
      "More capacity, automation and operational control for businesses that are ready to scale.",
    features: [
      "Everything in Professional",
      "Advanced team access",
      "Higher usage allowances",
      "Enhanced operational tools",
      "Priority support",
      "Advanced automation",
      "Built for scaling",
    ],
  },
];

const FAQS: FAQ[] = [
  {
    q: "What exactly is TOTS-OS?",
    a:
      "TOTS-OS is one connected workspace for running your business. It brings your clients, projects, tasks, finances, calendar, notes, content and business visibility into one organised system.",
  },
  {
    q: "Who is TOTS-OS for?",
    a:
      "TOTS-OS is designed for founders, freelancers, small businesses and growing teams who want a simpler way to organise the everyday running of their business.",
  },
  {
    q: "What is Clarity?",
    a:
      "Clarity is the AI PA inside TOTS-OS. It uses information already inside your workspace to help surface priorities, deadlines, overdue work and areas that may need your attention.",
  },
  {
    q: "Is TOTS-OS web based?",
    a:
      "Yes. TOTS-OS works through your browser, so you can access your workspace wherever you can securely log in to your account.",
  },
  {
    q: "Can TOTS-OS help with social media?",
    a:
      "Yes. Social planning and publishing tools help keep your content workflow alongside the rest of your business.",
  },
  {
    q: "Can I try it first?",
    a:
      "Yes. Create an account and start with a 14-day free trial with no commitment.",
  },
];

/* ============================================================
   DEMO DATA
============================================================ */

const DEMO_NAV: {
  key: DemoKey;
  label: string;
  icon: LucideIcon;
  group: string;
}[] = [
  {
    key: "home",
    label: "Home",
    icon: LayoutDashboard,
    group: "",
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: Users,
    group: "Business",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    group: "Business",
  },
  {
    key: "social",
    label: "Social",
    icon: MessageSquareText,
    group: "Business",
  },
  {
    key: "finance",
    label: "Finances",
    icon: CircleDollarSign,
    group: "Business",
  },
  {
    key: "notes",
    label: "Notes",
    icon: NotebookPen,
    group: "Business",
  },
  {
    key: "workspace",
    label: "Projects",
    icon: FolderKanban,
    group: "Clients",
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    group: "Planning",
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    group: "",
  },
];

const DEMO_CONTACTS = [
  {
    name: "Ava Stone",
    org: "Halstead & Co",
    tag: "Strategic partner",
  },
  {
    name: "Leo Bennett",
    org: "Halstead & Co",
    tag: "Client",
  },
  {
    name: "Priya N.",
    org: "Northfield Studio",
    tag: "Client",
  },
  {
    name: "Tom R.",
    org: "Marlow Fitness",
    tag: "Client",
  },
];

const DEMO_CAMPAIGNS = [
  {
    name: "Summer launch",
    list: "VIP clients",
    status: "Sent",
    sent: 128,
    opens: 74,
    clicks: 19,
  },
  {
    name: "Autumn preview",
    list: "Newsletter",
    status: "Draft",
    sent: 0,
    opens: 0,
    clicks: 0,
  },
];

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Logo({
  size = 38,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className="tots-logo">
      <img
        src={LOGO_SRC}
        alt="TOTS-OS"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
        }}
      />

      {showWordmark && (
        <span className="tots-logo-copy">
          <strong>TOTS-OS</strong>

          <small>
            by The Organised Types
          </small>
        </span>
      )}
    </span>
  );
}

function Eyebrow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="tots-eyebrow">
      <span />
      {children}
    </div>
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
              y: 24,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.12,
      }}
      transition={{
        duration: 0.7,
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

function DemoStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="demo-stat">
      <span>{label}</span>

      <strong>{value}</strong>

      {note && (
        <small>{note}</small>
      )}
    </div>
  );
}

function DemoPanel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="demo-panel">
      <span className="demo-label">
        {eyebrow}
      </span>

      <h4>{title}</h4>

      {children}
    </div>
  );
}

/* ============================================================
   DEMO VIEWS
============================================================ */

function DemoHome() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Wednesday · 19 August
          </span>

          <h3>
            Good afternoon.
          </h3>

          <p>
            Here&apos;s what&apos;s
            happening across your
            business.
          </p>
        </div>

        <div className="demo-spark">
          <Sparkles size={15} />
        </div>
      </div>

      <div className="demo-stats demo-six">
        <DemoStat
          label="Health"
          value="82%"
        />

        <DemoStat
          label="Open tasks"
          value="12"
        />

        <DemoStat
          label="Projects"
          value="4"
        />

        <DemoStat
          label="Today"
          value="3"
        />

        <DemoStat
          label="Invoices"
          value="2"
        />

        <DemoStat
          label="Revenue"
          value="£8,240"
          note="+11.4%"
        />
      </div>

      <div className="demo-grid">
        <DemoPanel
          eyebrow="Today"
          title="Your priorities"
        >
          <div className="demo-list">
            {[
              "Send the Halstead proposal",
              "Review campaign performance",
              "Approve this week's content",
            ].map(
              (
                item,
                index
              ) => (
                <div
                  className="demo-row"
                  key={item}
                >
                  <span className="demo-number">
                    {index + 1}
                  </span>

                  <span>
                    {item}
                  </span>
                </div>
              )
            )}
          </div>
        </DemoPanel>

        <DemoPanel
          eyebrow="Clarity"
          title="Worth your attention"
        >
          <p className="demo-muted">
            One invoice is overdue and
            your website project has
            three tasks due this week.
          </p>

          <div className="demo-clarity">
            <Sparkles size={14} />

            Ask Clarity what to
            prioritise.
          </div>
        </DemoPanel>
      </div>
    </>
  );
}

function DemoContacts() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            CRM
          </span>

          <h3>
            Contacts
          </h3>
        </div>

        <div className="demo-search">
          <Search size={14} />
          Search
        </div>
      </div>

      <div className="demo-list demo-margin">
        {DEMO_CONTACTS.map(
          (
            contact
          ) => (
            <div
              className="demo-contact"
              key={contact.name}
            >
              <div className="demo-avatar">
                {contact.name.charAt(
                  0
                )}
              </div>

              <div className="demo-grow">
                <strong>
                  {contact.name}
                </strong>

                <span>
                  {contact.org} ·{" "}
                  {contact.tag}
                </span>
              </div>

              <ChevronRight
                size={15}
              />
            </div>
          )
        )}
      </div>
    </>
  );
}

function DemoCampaigns() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Marketing
          </span>

          <h3>
            Campaigns
          </h3>
        </div>

        <button
          type="button"
          className="demo-button"
        >
          <Plus size={13} />
          New campaign
        </button>
      </div>

      <div className="demo-grid demo-margin">
        {DEMO_CAMPAIGNS.map(
          (
            campaign
          ) => (
            <div
              className="demo-panel"
              key={campaign.name}
            >
              <div className="demo-between">
                <div>
                  <strong>
                    {campaign.name}
                  </strong>

                  <p className="demo-muted">
                    {campaign.list}
                  </p>
                </div>

                <span className="demo-badge">
                  {campaign.status}
                </span>
              </div>

              <div className="demo-stats demo-three">
                <DemoStat
                  label="Sent"
                  value={String(
                    campaign.sent
                  )}
                />

                <DemoStat
                  label="Opens"
                  value={String(
                    campaign.opens
                  )}
                />

                <DemoStat
                  label="Clicks"
                  value={String(
                    campaign.clicks
                  )}
                />
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}

function DemoSocial() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Content
          </span>

          <h3>
            Social
          </h3>
        </div>

        <button
          type="button"
          className="demo-button"
        >
          <Sparkles size={13} />
          Ideas
        </button>
      </div>

      <div className="demo-grid demo-margin">
        <div className="demo-upload">
          <ImageIcon size={24} />

          <strong>
            Add content
          </strong>

          <span>
            Upload an image or
            video
          </span>
        </div>

        <DemoPanel
          eyebrow="Publishing"
          title="Connected platforms"
        >
          <div className="demo-list">
            {[
              "Instagram",
              "TikTok",
              "Facebook",
              "LinkedIn",
            ].map(
              (
                platform,
                index
              ) => (
                <div
                  className="demo-row"
                  key={platform}
                >
                  <span className="demo-grow">
                    {platform}
                  </span>

                  <span
                    className={`demo-toggle ${
                      index < 2
                        ? "on"
                        : ""
                    }`}
                  >
                    <span />
                  </span>
                </div>
              )
            )}
          </div>
        </DemoPanel>
      </div>
    </>
  );
}

function DemoFinance() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Overview
          </span>

          <h3>
            Finances
          </h3>
        </div>

        <button
          type="button"
          className="demo-button"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="demo-tabs">
        {[
          "Overview",
          "Sales",
          "Expenses",
          "Tax & VAT",
          "Payroll",
        ].map(
          (
            item,
            index
          ) => (
            <span
              className={
                index === 0
                  ? "active"
                  : ""
              }
              key={item}
            >
              {item}
            </span>
          )
        )}
      </div>

      <div className="demo-finance-card">
        <span className="demo-label light">
          Financial overview
        </span>

        <h4>
          Your position at a
          glance
        </h4>

        <div className="demo-stats demo-four">
          <DemoStat
            label="Net position"
            value="£4,120"
          />

          <DemoStat
            label="Outstanding"
            value="£1,860"
          />

          <DemoStat
            label="VAT"
            value="£640"
          />

          <DemoStat
            label="Tax"
            value="£1,050"
          />
        </div>
      </div>
    </>
  );
}

function DemoNotes() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Organisation
          </span>

          <h3>
            Notes & Tasks
          </h3>
        </div>
      </div>

      <div className="demo-kanban">
        {[
          {
            name: "To do",
            tasks: [
              "Send proposal",
              "Create launch content",
            ],
          },
          {
            name:
              "In progress",
            tasks: [
              "Website refresh",
            ],
          },
          {
            name: "Done",
            tasks: [
              "Client onboarding",
            ],
          },
        ].map(
          (
            column
          ) => (
            <div
              className="demo-kanban-column"
              key={column.name}
            >
              <span className="demo-label">
                {column.name}
              </span>

              {column.tasks.map(
                (
                  task
                ) => (
                  <div
                    className="demo-task"
                    key={task}
                  >
                    <strong>
                      {task}
                    </strong>

                    <small>
                      TOTS-OS
                    </small>
                  </div>
                )
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}

function DemoWorkspace() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Workspace
          </span>

          <h3>
            Clients & Projects
          </h3>
        </div>

        <button
          type="button"
          className="demo-button"
        >
          <Plus size={13} />
          New project
        </button>
      </div>

      <div className="demo-stats demo-four">
        <DemoStat
          label="Projects"
          value="4"
        />

        <DemoStat
          label="Clients"
          value="6"
        />

        <DemoStat
          label="Overdue"
          value="1"
        />

        <DemoStat
          label="Value"
          value="£6,400"
        />
      </div>

      <div className="demo-list demo-margin">
        {[
          "Website redesign",
          "Autumn campaign",
          "Brand refresh",
        ].map(
          (
            project
          ) => (
            <div
              className="demo-row"
              key={project}
            >
              <FolderKanban
                size={14}
              />

              <span className="demo-grow">
                {project}
              </span>

              <ChevronRight
                size={14}
              />
            </div>
          )
        )}
      </div>
    </>
  );
}

function DemoCalendar() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Planning
          </span>

          <h3>
            Calendar
          </h3>
        </div>

        <button
          type="button"
          className="demo-button"
        >
          <Plus size={13} />
          Add event
        </button>
      </div>

      <div className="demo-stats demo-four">
        <DemoStat
          label="Today"
          value="1"
        />

        <DemoStat
          label="Upcoming"
          value="5"
        />

        <DemoStat
          label="Booking days"
          value="4"
        />

        <DemoStat
          label="Booking page"
          value="Live"
        />
      </div>
    </>
  );
}

function DemoSettings() {
  return (
    <>
      <div className="demo-page-head">
        <div>
          <span className="demo-label">
            Workspace
          </span>

          <h3>
            Settings
          </h3>
        </div>
      </div>

      <div className="demo-panel demo-margin">
        <span className="demo-label">
          Business
        </span>

        <h4>
          Workspace settings
        </h4>

        <div className="demo-grid">
          <div>
            <span className="demo-label">
              Business name
            </span>

            <div className="demo-field">
              Your Business
            </div>
          </div>

          <div>
            <span className="demo-label">
              Email
            </span>

            <div className="demo-field">
              hello@yourbusiness.com
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const DEMO_VIEWS: Record<
  DemoKey,
  () => ReactNode
> = {
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

/* ============================================================
   PRODUCT DEMO
============================================================ */

function ProductDemo() {
  const [
    active,
    setActive,
  ] =
    useState<DemoKey>(
      "home"
    );

  const ActiveView =
    DEMO_VIEWS[active];

  return (
    <Reveal>
      <div
        className="demo-shell"
        id="demo"
      >
        <div className="demo-browser">
          <div className="demo-browser-top">
            <div className="demo-dots">
              <span />
              <span />
              <span />
            </div>

            <div className="demo-address">
              <LockKeyhole
                size={11}
              />

              tots-os.co.uk
            </div>

            <span className="demo-live">
              <span />
              Demo
            </span>
          </div>

          <div className="demo-body">
            <aside className="demo-sidebar">
              <div className="demo-sidebar-logo">
                <Logo
                  size={30}
                  showWordmark={
                    false
                  }
                />
              </div>

              <div className="demo-nav">
                {DEMO_NAV.map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setActive(
                            item.key
                          )
                        }
                        className={
                          active ===
                          item.key
                            ? "active"
                            : ""
                        }
                      >
                        <Icon
                          size={15}
                        />

                        <span>
                          {item.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </aside>

            <main className="demo-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{
                    opacity:
                      0,
                    y: 6,
                  }}
                  animate={{
                    opacity:
                      1,
                    y: 0,
                  }}
                  exit={{
                    opacity:
                      0,
                  }}
                  transition={{
                    duration:
                      0.2,
                  }}
                >
                  <ActiveView />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        <div className="demo-mobile-tabs">
          {DEMO_NAV.map(
            (
              item
            ) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setActive(
                    item.key
                  )
                }
                className={
                  active ===
                  item.key
                    ? "active"
                    : ""
                }
              >
                {item.label}
              </button>
            )
          )}
        </div>

        <div className="demo-cta">
          <div>
            <span>
              Ready to make it
              yours?
            </span>

            <h3>
              Put your actual
              business inside
              TOTS-OS.
            </h3>

            <p>
              Create your account,
              add your clients and
              start bringing the
              everyday running of
              your business into
              one place.
            </p>
          </div>

          <a
            href={SIGNUP_URL}
            className="button-primary button-large"
          >
            Start free

            <ArrowRight
              size={16}
            />
          </a>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function TotsOSLanding() {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false
    );

  const [
    openFaq,
    setOpenFaq,
  ] =
    useState<
      number | null
    >(0);

  return (
    <div className="tots-root">
      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f5f2eb;
        }

        .tots-root {
          --cream: #f5f2eb;
          --cream-deep: #ebe6dc;
          --white: #fffefd;

          --charcoal: #373735;
          --charcoal-soft: #575753;
          --muted: #77756e;

          --tan: #c69d69;
          --tan-dark: #a77d4d;
          --tan-soft: #eadcc9;

          --border:
            rgba(
              55,
              55,
              53,
              0.10
            );

          --border-strong:
            rgba(
              55,
              55,
              53,
              0.16
            );

          --shadow:
            0 25px 70px
            rgba(
              55,
              55,
              53,
              0.08
            );

          min-height: 100vh;

          overflow-x: hidden;

          background:
            var(--cream);

          color:
            var(--charcoal);

          font-family:
            'DM Sans',
            sans-serif;
        }

        .tots-root * {
          box-sizing:
            border-box;
        }

        .tots-root h1,
        .tots-root h2,
        .tots-root h3,
        .tots-root h4,
        .tots-root p {
          margin: 0;
        }

        .tots-root h1,
        .tots-root h2,
        .tots-root h3,
        .tots-root h4 {
          font-family:
            'Manrope',
            sans-serif;

          letter-spacing:
            -0.045em;

          line-height:
            1.05;
        }

        .tots-root a {
          color: inherit;
        }

        .tots-root button,
        .tots-root a {
          -webkit-tap-highlight-color:
            transparent;
        }

        .tots-root ::selection {
          background:
            var(--tan);

          color:
            white;
        }

        /* =====================================================
           GLOBAL
        ===================================================== */

        .tots-container {
          width:
            min(
              1180px,
              calc(
                100% -
                40px
              )
            );

          margin:
            0 auto;
        }

        .tots-section {
          padding:
            110px 0;

          position:
            relative;
        }

        .tots-section.soft {
          background:
            rgba(
              255,
              255,
              255,
              0.38
            );

          border-top:
            1px solid
            var(--border);

          border-bottom:
            1px solid
            var(--border);
        }

        .tots-eyebrow {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            9px;

          color:
            var(--charcoal-soft);

          font-size:
            12px;

          font-weight:
            600;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .tots-eyebrow > span {
          width:
            7px;

          height:
            7px;

          border-radius:
            50%;

          background:
            var(--tan);
        }

        .section-title {
          max-width:
            820px;

          margin-top:
            20px !important;

          font-size:
            clamp(
              2.5rem,
              5vw,
              5rem
            );

          font-weight:
            500;
        }

        .section-copy {
          max-width:
            590px;

          margin-top:
            22px !important;

          color:
            var(--muted);

          font-size:
            16px;

          line-height:
            1.75;
        }

        .gold-text {
          color:
            var(--tan-dark);
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .tots-logo {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            11px;
        }

        .tots-logo img {
          display:
            block;

          object-fit:
            contain;

          border-radius:
            10px;
        }

        .tots-logo-copy {
          display:
            flex;

          flex-direction:
            column;

          gap:
            2px;
        }

        .tots-logo-copy strong {
          font-family:
            'Manrope',
            sans-serif;

          font-size:
            13px;

          letter-spacing:
            0.04em;
        }

        .tots-logo-copy small {
          color:
            var(--muted);

          font-size:
            9px;

          letter-spacing:
            0.04em;
        }

        /* =====================================================
           BUTTONS
        ===================================================== */

        .button-primary,
        .button-secondary {
          min-height:
            46px;

          padding:
            0 21px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;

          border-radius:
            999px;

          text-decoration:
            none;

          font-size:
            13px;

          font-weight:
            600;

          transition:
            transform .2s ease,
            background .2s ease,
            border-color .2s ease;
        }

        .button-primary {
          border:
            1px solid
            var(--charcoal);

          background:
            var(--charcoal);

          color:
            white !important;
        }

        .button-primary:hover {
          transform:
            translateY(
              -2px
            );

          background:
            #282826;
        }

        .button-secondary {
          border:
            1px solid
            var(--border-strong);

          background:
            rgba(
              255,
              255,
              255,
              .55
            );

          color:
            var(--charcoal);

          backdrop-filter:
            blur(
              10px
            );
        }

        .button-secondary:hover {
          transform:
            translateY(
              -2px
            );

          border-color:
            rgba(
              55,
              55,
              53,
              .28
            );
        }

        .button-large {
          min-height:
            55px;

          padding:
            0 27px;

          font-size:
            14px;
        }

        /* =====================================================
           NAV
        ===================================================== */

        .tots-nav-wrap {
          position:
            fixed;

          top:
            0;

          left:
            0;

          right:
            0;

          z-index:
            80;

          padding:
            14px 20px;
        }

        .tots-nav {
          width:
            min(
              1180px,
              100%
            );

          height:
            66px;

          margin:
            0 auto;

          padding:
            0 10px
            0 17px;

          display:
            grid;

          grid-template-columns:
            minmax(
              210px,
              1fr
            )
            auto
            minmax(
              210px,
              1fr
            );

          align-items:
            center;

          gap:
            20px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .08
            );

          border-radius:
            18px;

          background:
            rgba(
              245,
              242,
              235,
              .88
            );

          box-shadow:
            0 8px 30px
            rgba(
              55,
              55,
              53,
              .05
            );

          backdrop-filter:
            blur(
              18px
            );
        }

        .tots-brand {
          justify-self:
            start;

          text-decoration:
            none;
        }

        .tots-nav-links {
          justify-self:
            center;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            4px;
        }

        .tots-nav-links a {
          padding:
            9px 11px;

          border-radius:
            999px;

          color:
            var(--muted);

          text-decoration:
            none;

          font-size:
            12px;

          font-weight:
            500;
        }

        .tots-nav-links a:hover {
          background:
            rgba(
              255,
              255,
              255,
              .65
            );

          color:
            var(--charcoal);
        }

        .tots-nav-actions {
          justify-self:
            end;

          display:
            flex;

          gap:
            7px;
        }

        .tots-menu-button {
          width:
            42px;

          height:
            42px;

          display:
            none;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            var(--border);

          border-radius:
            50%;

          background:
            white;

          color:
            var(--charcoal);

          cursor:
            pointer;
        }

        /* =====================================================
           MOBILE MENU
        ===================================================== */

        .mobile-overlay {
          position:
            fixed;

          inset:
            0;

          z-index:
            120;

          padding:
            14px;

          background:
            rgba(
              55,
              55,
              53,
              .2
            );

          backdrop-filter:
            blur(
              15px
            );
        }

        .mobile-menu {
          max-width:
            500px;

          margin:
            0 auto;

          padding:
            20px;

          border:
            1px solid
            var(--border);

          border-radius:
            24px;

          background:
            var(--cream);
        }

        .mobile-menu-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;
        }

        .mobile-links {
          margin-top:
            24px;

          display:
            grid;

          gap:
            5px;
        }

        .mobile-links a {
          padding:
            15px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border-bottom:
            1px solid
            var(--border);

          text-decoration:
            none;

          font-size:
            15px;
        }

        .mobile-actions {
          margin-top:
            24px;

          display:
            grid;

          gap:
            8px;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .tots-hero {
          width:
            100%;

          min-height:
            720px;

          padding:
            135px 24px
            70px;

          position:
            relative;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          overflow:
            hidden;
        }

        .tots-hero::before {
          content:
            "";

          position:
            absolute;

          width:
            700px;

          height:
            700px;

          top:
            40px;

          left:
            50%;

          transform:
            translateX(
              -50%
            );

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              rgba(
                198,
                157,
                105,
                .15
              )
              0%,
              rgba(
                198,
                157,
                105,
                .07
              )
              40%,
              transparent
              72%
            );

          filter:
            blur(
              45px
            );

          pointer-events:
            none;
        }

        .tots-hero-inner {
          width:
            100%;

          max-width:
            1000px;

          margin:
            0 auto;

          padding:
            0;

          position:
            relative;

          z-index:
            2;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          text-align:
            center;
        }

        .tots-hero-pill {
          width:
            fit-content;

          margin:
            0 auto;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          padding:
            9px 15px;

          border:
            1px solid
            rgba(
              198,
              157,
              105,
              .26
            );

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .48
            );

          color:
            var(--charcoal-soft);

          font-size:
            11px;

          font-weight:
            600;

          line-height:
            1.2;

          text-align:
            center;
        }

        .tots-hero-pill svg {
          flex-shrink:
            0;

          color:
            var(--tan-dark);
        }

        .tots-hero-title {
          width:
            100%;

          max-width:
            900px;

          margin:
            30px auto
            0 !important;

          padding:
            0;

          color:
            var(--charcoal);

          font-size:
            clamp(
              3.7rem,
              6.4vw,
              6.4rem
            ) !important;

          font-weight:
            500 !important;

          letter-spacing:
            -.06em !important;

          line-height:
            .96 !important;

          text-align:
            center !important;
        }

        .tots-hero-accent {
          width:
            100%;

          display:
            block;

          margin-top:
            4px;

          color:
            var(--tan-dark);

          text-align:
            center;
        }

        .tots-hero-copy {
          width:
            100%;

          max-width:
            780px;

          margin:
            28px auto
            0 !important;

          padding:
            0;

          color:
            var(--muted);

          font-size:
            clamp(
              15px,
              1.3vw,
              18px
            );

          line-height:
            1.7;

          text-align:
            center !important;
        }

        .tots-hero-copy strong {
          color:
            var(--charcoal);

          font-weight:
            600;
        }

        .tots-hero-actions {
          width:
            100%;

          margin:
            34px auto
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          flex-wrap:
            wrap;

          text-align:
            center;
        }

        .tots-hero-note {
          width:
            100%;

          margin:
            18px auto
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px 20px;

          flex-wrap:
            wrap;

          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1;

          text-align:
            center;
        }

        .tots-hero-note span {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          white-space:
            nowrap;
        }

        .tots-hero-note svg {
          flex-shrink:
            0;

          color:
            var(--tan-dark);
        }

        /* =====================================================
           TRUST
        ===================================================== */

        .trusted-section {
          padding:
            0 20px
            80px;
        }

        .trusted-card {
          width:
            min(
              1100px,
              100%
            );

          margin:
            0 auto;

          padding:
            25px;

          border:
            1px solid
            var(--border);

          border-radius:
            24px;

          background:
            rgba(
              255,
              255,
              255,
              .42
            );

          text-align:
            center;
        }

        .trusted-card > p {
          color:
            var(--muted);

          font-size:
            11px;

          font-weight:
            600;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .trusted-list {
          margin-top:
            18px;

          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            8px;
        }

        .trusted-list span {
          padding:
            9px 13px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .65
            );

          color:
            var(--charcoal-soft);

          font-size:
            11px;
        }

        /* =====================================================
           PAIN / CALM
        ===================================================== */

        .calm-section {
          padding:
            80px 20px;
        }

        .calm-card {
          width:
            min(
              1000px,
              100%
            );

          margin:
            0 auto;

          padding:
            70px 40px;

          border-radius:
            30px;

          background:
            var(--charcoal);

          color:
            white;

          text-align:
            center;
        }

        .calm-card .tots-eyebrow {
          color:
            rgba(
              255,
              255,
              255,
              .7
            );
        }

        .calm-card h2 {
          max-width:
            760px;

          margin:
            23px auto
            0;

          font-size:
            clamp(
              2.5rem,
              5vw,
              4.7rem
            );

          font-weight:
            500;
        }

        .calm-card > p {
          max-width:
            660px;

          margin:
            20px auto
            0;

          color:
            rgba(
              255,
              255,
              255,
              .66
            );

          font-size:
            15px;

          line-height:
            1.75;
        }

        .chaos-list {
          margin-top:
            30px;

          display:
            flex;

          flex-wrap:
            wrap;

          justify-content:
            center;

          gap:
            8px;
        }

        .chaos-list span {
          padding:
            9px 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          border-radius:
            999px;

          color:
            rgba(
              255,
              255,
              255,
              .64
            );

          font-size:
            11px;
        }

        .calm-line {
          margin-top:
            35px;

          color:
            #d5b389;

          font-size:
            20px;

          font-weight:
            500;
        }

        /* =====================================================
           TRANSFORMATION
        ===================================================== */

        .transform-grid {
          margin-top:
            55px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            16px;
        }

        .transform-card {
          height:
            100%;

          padding:
            32px;

          border:
            1px solid
            var(--border);

          border-radius:
            25px;

          background:
            rgba(
              255,
              255,
              255,
              .48
            );
        }

        .transform-card.good {
          border-color:
            rgba(
              198,
              157,
              105,
              .35
            );

          background:
            #fffaf3;
        }

        .transform-card > span {
          color:
            var(--muted);

          font-size:
            11px;

          font-weight:
            600;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .transform-card.good
        > span {
          color:
            var(--tan-dark);
        }

        .transform-card h3 {
          margin-top:
            12px;

          font-size:
            28px;

          font-weight:
            500;
        }

        .transform-list {
          margin-top:
            25px;

          display:
            grid;

          gap:
            8px;
        }

        .transform-row {
          min-height:
            48px;

          padding:
            11px 13px;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          border:
            1px solid
            var(--border);

          border-radius:
            13px;

          background:
            rgba(
              255,
              255,
              255,
              .7
            );

          color:
            var(--charcoal-soft);

          font-size:
            13px;
        }

        .transform-row svg {
          flex-shrink:
            0;

          color:
            var(--tan-dark);
        }

        .why-grid {
          margin-top:
            17px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            16px;
        }

        .why-card {
          min-height:
            260px;

          height:
            100%;

          padding:
            28px;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            var(--border);

          border-radius:
            24px;

          background:
            rgba(
              255,
              255,
              255,
              .45
            );
        }

        .why-icon,
        .feature-icon {
          width:
            45px;

          height:
            45px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              198,
              157,
              105,
              .25
            );

          border-radius:
            13px;

          background:
            var(--tan-soft);

          color:
            var(--tan-dark);
        }

        .why-card h3 {
          margin-top:
            auto;

          padding-top:
            45px;

          font-size:
            21px;

          font-weight:
            600;
        }

        .why-card p {
          margin-top:
            10px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.7;
        }

        /* =====================================================
           DEMO
        ===================================================== */

        .demo-section-head {
          text-align:
            center;
        }

        .demo-section-head
        .tots-eyebrow {
          justify-content:
            center;
        }

        .demo-section-head
        .section-title,
        .demo-section-head
        .section-copy {
          margin-left:
            auto !important;

          margin-right:
            auto !important;
        }

        .demo-shell {
          margin-top:
            55px;
        }

        .demo-browser {
          overflow:
            hidden;

          border:
            1px solid
            var(--border-strong);

          border-radius:
            25px;

          background:
            white;

          box-shadow:
            var(--shadow);
        }

        .demo-browser-top {
          height:
            45px;

          padding:
            0 15px;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          border-bottom:
            1px solid
            var(--border);

          background:
            #eeeae2;
        }

        .demo-dots {
          display:
            flex;

          gap:
            5px;
        }

        .demo-dots span {
          width:
            7px;

          height:
            7px;

          border-radius:
            50%;

          background:
            rgba(
              55,
              55,
              53,
              .2
            );
        }

        .demo-address {
          margin:
            0 auto;

          padding:
            6px 12px;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .7
            );

          color:
            var(--muted);

          font-size:
            9px;
        }

        .demo-live {
          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          color:
            var(--tan-dark);

          font-size:
            9px;

          text-transform:
            uppercase;
        }

        .demo-live span {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            var(--tan);
        }

        .demo-body {
          min-height:
            540px;

          display:
            grid;

          grid-template-columns:
            185px 1fr;
        }

        .demo-sidebar {
          padding:
            17px 12px;

          border-right:
            1px solid
            var(--border);

          background:
            #faf8f4;
        }

        .demo-sidebar-logo {
          padding:
            0 5px;
        }

        .demo-nav {
          margin-top:
            24px;

          display:
            grid;

          gap:
            4px;
        }

        .demo-nav button {
          width:
            100%;

          padding:
            10px 11px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border:
            0;

          border-radius:
            10px;

          background:
            transparent;

          color:
            #6f6c66;

          font-family:
            inherit;

          font-size:
            11px;

          cursor:
            pointer;

          text-align:
            left;
        }

        .demo-nav button.active {
          background:
            var(--tan-soft);

          color:
            var(--charcoal);
        }

        .demo-content {
          min-width:
            0;

          padding:
            28px;

          background:
            #f7f5ef;
        }

        .demo-page-head {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            15px;

          flex-wrap:
            wrap;
        }

        .demo-label {
          color:
            #99958c;

          font-size:
            8px;

          font-weight:
            600;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .demo-page-head h3 {
          margin-top:
            4px;

          color:
            #353532;

          font-size:
            27px;

          font-weight:
            600;
        }

        .demo-page-head p {
          margin-top:
            5px;

          color:
            #858179;

          font-size:
            11px;

          line-height:
            1.5;
        }

        .demo-spark {
          width:
            34px;

          height:
            34px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--charcoal);

          color:
            var(--tan);
        }

        .demo-stats {
          margin-top:
            18px;

          display:
            grid;

          gap:
            8px;
        }

        .demo-six {
          grid-template-columns:
            repeat(
              6,
              1fr
            );
        }

        .demo-four {
          grid-template-columns:
            repeat(
              4,
              1fr
            );
        }

        .demo-three {
          grid-template-columns:
            repeat(
              3,
              1fr
            );
        }

        .demo-stat {
          padding:
            12px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .08
            );

          border-radius:
            12px;

          background:
            white;
        }

        .demo-stat span {
          display:
            block;

          color:
            #97938b;

          font-size:
            8px;

          text-transform:
            uppercase;
        }

        .demo-stat strong {
          display:
            block;

          margin-top:
            6px;

          color:
            #393936;

          font-size:
            17px;
        }

        .demo-stat small {
          display:
            block;

          margin-top:
            3px;

          color:
            var(--tan-dark);

          font-size:
            8px;
        }

        .demo-grid {
          margin-top:
            12px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            10px;
        }

        .demo-panel {
          padding:
            17px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .08
            );

          border-radius:
            15px;

          background:
            white;
        }

        .demo-panel h4 {
          margin-top:
            4px;

          color:
            #393936;

          font-size:
            16px;

          letter-spacing:
            -.02em;
        }

        .demo-list {
          margin-top:
            12px;

          display:
            grid;

          gap:
            7px;
        }

        .demo-row {
          min-height:
            41px;

          padding:
            9px 11px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border-radius:
            10px;

          background:
            #f6f3ed;

          color:
            #68655f;

          font-size:
            11px;
        }

        .demo-number {
          width:
            20px;

          height:
            20px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--charcoal);

          color:
            white;

          font-size:
            8px;
        }

        .demo-muted {
          margin-top:
            10px !important;

          color:
            #817d75;

          font-size:
            11px;

          line-height:
            1.6;
        }

        .demo-clarity {
          margin-top:
            15px;

          padding:
            11px;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          border-radius:
            10px;

          background:
            var(--tan-soft);

          color:
            #805e38;

          font-size:
            10px;

          font-weight:
            600;
        }

        .demo-search {
          padding:
            8px 11px;

          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .1
            );

          border-radius:
            999px;

          background:
            white;

          color:
            #8d8981;

          font-size:
            10px;
        }

        .demo-margin {
          margin-top:
            18px;
        }

        .demo-contact {
          padding:
            11px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .08
            );

          border-radius:
            12px;

          background:
            white;
        }

        .demo-avatar {
          width:
            34px;

          height:
            34px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--tan-soft);

          color:
            #75532f;

          font-size:
            12px;

          font-weight:
            700;
        }

        .demo-grow {
          flex:
            1;

          min-width:
            0;
        }

        .demo-contact strong {
          display:
            block;

          color:
            #3d3d39;

          font-size:
            11px;
        }

        .demo-contact span {
          display:
            block;

          margin-top:
            2px;

          color:
            #8a867e;

          font-size:
            9px;
        }

        .demo-button {
          padding:
            8px 11px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          border:
            0;

          border-radius:
            999px;

          background:
            var(--charcoal);

          color:
            white;

          font-family:
            inherit;

          font-size:
            9px;

          cursor:
            pointer;
        }

        .demo-between {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            12px;
        }

        .demo-between strong {
          color:
            #41413e;

          font-size:
            12px;
        }

        .demo-badge {
          height:
            fit-content;

          padding:
            5px 8px;

          border-radius:
            999px;

          background:
            var(--tan-soft);

          color:
            #78542d;

          font-size:
            7px;

          text-transform:
            uppercase;
        }

        .demo-upload {
          min-height:
            185px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            7px;

          border:
            1px dashed
            rgba(
              55,
              55,
              53,
              .2
            );

          border-radius:
            15px;

          background:
            rgba(
              255,
              255,
              255,
              .55
            );

          color:
            #8e8a81;

          font-size:
            10px;
        }

        .demo-upload strong {
          color:
            #4b4b47;

          font-size:
            12px;
        }

        .demo-toggle {
          width:
            31px;

          height:
            18px;

          padding:
            2px;

          display:
            flex;

          align-items:
            center;

          border-radius:
            999px;

          background:
            #ddd9d0;
        }

        .demo-toggle span {
          width:
            14px;

          height:
            14px;

          border-radius:
            50%;

          background:
            white;
        }

        .demo-toggle.on {
          justify-content:
            flex-end;

          background:
            var(--tan);
        }

        .demo-tabs {
          margin-top:
            15px;

          display:
            flex;

          gap:
            5px;

          flex-wrap:
            wrap;
        }

        .demo-tabs span {
          padding:
            7px 10px;

          border-radius:
            999px;

          color:
            #938f87;

          font-size:
            8px;
        }

        .demo-tabs span.active {
          background:
            var(--charcoal);

          color:
            white;
        }

        .demo-finance-card {
          margin-top:
            17px;

          padding:
            20px;

          border-radius:
            16px;

          background:
            var(--charcoal);

          color:
            white;
        }

        .demo-finance-card h4 {
          margin-top:
            5px;

          color:
            white;

          font-size:
            18px;
        }

        .demo-finance-card
        .demo-stat {
          border-color:
            rgba(
              255,
              255,
              255,
              .08
            );

          background:
            rgba(
              255,
              255,
              255,
              .05
            );
        }

        .demo-finance-card
        .demo-stat strong {
          color:
            white;
        }

        .demo-finance-card
        .demo-stat span {
          color:
            rgba(
              255,
              255,
              255,
              .45
            );
        }

        .demo-label.light {
          color:
            rgba(
              255,
              255,
              255,
              .45
            );
        }

        .demo-kanban {
          margin-top:
            18px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            9px;
        }

        .demo-kanban-column {
          padding:
            11px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .08
            );

          border-radius:
            12px;

          background:
            rgba(
              255,
              255,
              255,
              .45
            );
        }

        .demo-task {
          margin-top:
            9px;

          padding:
            11px;

          border:
            1px solid
            rgba(
              55,
              55,
              53,
              .07
            );

          border-radius:
            10px;

          background:
            white;
        }

        .demo-task strong {
          display:
            block;

          color:
            #444440;

          font-size:
            10px;
        }

        .demo-task small {
          display:
            block;

          margin-top:
            4px;

          color:
            #99958c;

          font-size:
            8px;
        }

        .demo-field {
          margin-top:
            6px;

          padding:
            10px;

          border:
            1px solid
            var(--border);

          border-radius:
            9px;

          color:
            #77736c;

          font-size:
            10px;
        }

        .demo-mobile-tabs {
          margin-top:
            16px;

          display:
            flex;

          flex-wrap:
            wrap;

          justify-content:
            center;

          gap:
            6px;
        }

        .demo-mobile-tabs button {
          padding:
            7px 10px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            transparent;

          color:
            var(--muted);

          font-family:
            inherit;

          font-size:
            9px;

          cursor:
            pointer;
        }

        .demo-mobile-tabs
        button.active {
          border-color:
            rgba(
              198,
              157,
              105,
              .5
            );

          background:
            var(--tan-soft);

          color:
            #76532f;
        }

        .demo-cta {
          margin-top:
            30px;

          padding:
            30px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            30px;

          border:
            1px solid
            rgba(
              198,
              157,
              105,
              .28
            );

          border-radius:
            24px;

          background:
            #fffaf3;
        }

        .demo-cta > div
        > span {
          color:
            var(--tan-dark);

          font-size:
            10px;

          font-weight:
            600;

          text-transform:
            uppercase;
        }

        .demo-cta h3 {
          margin-top:
            6px;

          font-size:
            26px;

          font-weight:
            600;
        }

        .demo-cta p {
          max-width:
            650px;

          margin-top:
            9px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.65;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .feature-grid {
          margin-top:
            55px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            16px;
        }

        .feature-card {
          min-height:
            275px;

          height:
            100%;

          padding:
            28px;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            var(--border);

          border-radius:
            24px;

          background:
            rgba(
              255,
              255,
              255,
              .55
            );

          transition:
            transform .2s ease;
        }

        .feature-card:hover {
          transform:
            translateY(
              -3px
            );
        }

        .feature-card h3 {
          margin-top:
            auto;

          padding-top:
            48px;

          font-size:
            21px;

          font-weight:
            600;
        }

        .feature-card p {
          margin-top:
            10px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.7;
        }

        /* =====================================================
           CONNECTED
        ===================================================== */

        .connected-layout {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            80px;

          align-items:
            center;
        }

        .connection-grid {
          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            10px;
        }

        .connection-item {
          min-height:
            135px;

          padding:
            17px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            space-between;

          border:
            1px solid
            var(--border);

          border-radius:
            18px;

          background:
            rgba(
              255,
              255,
              255,
              .5
            );
        }

        .connection-item svg {
          color:
            var(--tan-dark);
        }

        .connection-item span {
          color:
            var(--charcoal-soft);

          font-size:
            11px;

          font-weight:
            600;
        }

        /* =====================================================
           CLARITY
        ===================================================== */

        .clarity-card {
          padding:
            55px;

          display:
            grid;

          grid-template-columns:
            .9fr 1.1fr;

          gap:
            60px;

          align-items:
            center;

          border:
            1px solid
            var(--border);

          border-radius:
            32px;

          background:
            var(--white);
        }

        .clarity-title {
          margin-top:
            20px !important;

          font-size:
            clamp(
              3rem,
              5vw,
              5.4rem
            );

          font-weight:
            500;
        }

        .clarity-title span {
          display:
            block;

          color:
            var(--tan-dark);
        }

        .clarity-copy {
          margin-top:
            22px !important;

          color:
            var(--muted);

          font-size:
            15px;

          line-height:
            1.75;
        }

        .clarity-points {
          margin-top:
            28px;

          display:
            grid;

          gap:
            11px;
        }

        .clarity-point {
          display:
            flex;

          gap:
            10px;

          color:
            var(--charcoal-soft);

          font-size:
            13px;

          line-height:
            1.6;
        }

        .clarity-check {
          width:
            24px;

          height:
            24px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            var(--tan-soft);

          color:
            var(--tan-dark);
        }

        .clarity-demo {
          padding:
            20px;

          border:
            1px solid
            var(--border);

          border-radius:
            23px;

          background:
            var(--cream);
        }

        .clarity-demo-head {
          padding-bottom:
            15px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border-bottom:
            1px solid
            var(--border);
        }

        .clarity-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          color:
            var(--tan-dark);

          font-size:
            11px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .clarity-ready {
          color:
            var(--muted);

          font-size:
            9px;
        }

        .clarity-message {
          width:
            fit-content;

          max-width:
            82%;

          margin:
            16px 0
            0 auto;

          padding:
            13px 15px;

          border:
            1px solid
            var(--border);

          border-radius:
            16px 16px
            4px 16px;

          background:
            white;

          color:
            var(--charcoal-soft);

          font-size:
            12px;

          line-height:
            1.55;
        }

        .clarity-response {
          max-width:
            95%;

          margin-top:
            14px;

          padding:
            16px;

          border:
            1px solid
            rgba(
              198,
              157,
              105,
              .25
            );

          border-radius:
            4px 16px
            16px 16px;

          background:
            #fff9ef;
        }

        .clarity-response
        > span {
          color:
            var(--tan-dark);

          font-size:
            9px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .clarity-response
        > p {
          margin-top:
            8px;

          color:
            var(--charcoal-soft);

          font-size:
            12px;

          line-height:
            1.65;
        }

        .priority-list {
          margin-top:
            12px;

          display:
            grid;

          gap:
            7px;
        }

        .priority {
          padding:
            10px;

          display:
            flex;

          gap:
            9px;

          border:
            1px solid
            var(--border);

          border-radius:
            11px;

          background:
            rgba(
              255,
              255,
              255,
              .68
            );
        }

        .priority > span {
          width:
            22px;

          height:
            22px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            var(--tan-soft);

          color:
            #7f5a31;

          font-size:
            8px;
        }

        .priority strong {
          display:
            block;

          color:
            #454541;

          font-size:
            10px;
        }

        .priority small {
          display:
            block;

          margin-top:
            2px;

          color:
            #938f86;

          font-size:
            8px;
        }

        /* =====================================================
           SECURITY
        ===================================================== */

        .security-grid {
          margin-top:
            55px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            16px;
        }

        .security-card {
          height:
            100%;

          padding:
            28px;

          border:
            1px solid
            var(--border);

          border-radius:
            23px;

          background:
            rgba(
              255,
              255,
              255,
              .5
            );
        }

        .security-card svg {
          color:
            var(--tan-dark);
        }

        .security-card h3 {
          margin-top:
            35px;

          font-size:
            20px;

          font-weight:
            600;
        }

        .security-card p {
          margin-top:
            10px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.7;
        }

        /* =====================================================
           PRICING
        ===================================================== */

        .trial-pill {
          margin-top:
            25px;

          padding:
            9px 13px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          border:
            1px solid
            rgba(
              198,
              157,
              105,
              .3
            );

          border-radius:
            999px;

          background:
            #fff9ef;

          color:
            var(--tan-dark);

          font-size:
            10px;

          font-weight:
            600;
        }

        .pricing-grid {
          margin-top:
            55px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            16px;
        }

        .price-card {
          min-height:
            580px;

          height:
            100%;

          padding:
            30px;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            var(--border);

          border-radius:
            27px;

          background:
            rgba(
              255,
              255,
              255,
              .5
            );
        }

        .price-card.featured {
          border-color:
            rgba(
              198,
              157,
              105,
              .45
            );

          background:
            #fffaf3;
        }

        .price-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;
        }

        .price-name {
          font-size:
            12px;

          font-weight:
            700;

          letter-spacing:
            .05em;

          text-transform:
            uppercase;
        }

        .price-badge {
          padding:
            6px 9px;

          border-radius:
            999px;

          background:
            var(--tan-soft);

          color:
            #77522b;

          font-size:
            8px;

          font-weight:
            600;
        }

        .price-figure {
          margin-top:
            35px;

          display:
            flex;

          align-items:
            flex-end;
        }

        .price-amount {
          font-family:
            'Manrope',
            sans-serif;

          font-size:
            58px;

          font-weight:
            600;

          letter-spacing:
            -.06em;
        }

        .price-period {
          margin:
            0 0 10px
            7px;

          color:
            var(--muted);

          font-size:
            11px;
        }

        .price-description {
          min-height:
            90px;

          margin-top:
            17px !important;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.7;
        }

        .price-features {
          margin-top:
            24px;

          padding-top:
            22px;

          display:
            grid;

          gap:
            11px;

          border-top:
            1px solid
            var(--border);
        }

        .price-feature {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          color:
            var(--charcoal-soft);

          font-size:
            12px;

          line-height:
            1.45;
        }

        .price-feature svg {
          flex-shrink:
            0;

          color:
            var(--tan-dark);
        }

        .price-action {
          margin-top:
            auto;

          padding-top:
            28px;
        }

        .price-action a {
          width:
            100%;
        }

        .price-note {
          margin-top:
            9px !important;

          color:
            var(--muted);

          text-align:
            center;

          font-size:
            9px;
        }

        /* =====================================================
           ABOUT
        ===================================================== */

        .about-layout {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            60px;

          align-items:
            center;
        }

        .about-card {
          padding:
            36px;

          border:
            1px solid
            var(--border);

          border-radius:
            28px;

          background:
            white;
        }

        .about-card p {
          color:
            var(--charcoal-soft);

          font-size:
            15px;

          line-height:
            1.8;
        }

        .about-card p + p {
          margin-top:
            17px;
        }

        /* =====================================================
           FAQ
        ===================================================== */

        .faq-layout {
          display:
            grid;

          grid-template-columns:
            .75fr 1fr;

          gap:
            80px;
        }

        .faq-item {
          border-bottom:
            1px solid
            var(--border);
        }

        .faq-button {
          width:
            100%;

          padding:
            22px 0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;

          border:
            0;

          background:
            transparent;

          color:
            var(--charcoal);

          font-family:
            inherit;

          font-size:
            14px;

          text-align:
            left;

          cursor:
            pointer;
        }

        .faq-answer {
          max-width:
            650px;

          padding-bottom:
            22px;

          overflow:
            hidden;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.75;
        }

        /* =====================================================
           FINAL CTA
        ===================================================== */

        .final-card {
          padding:
            80px 35px;

          border-radius:
            30px;

          background:
            var(--charcoal);

          color:
            white;

          text-align:
            center;
        }

        .final-icon {
          width:
            54px;

          height:
            54px;

          margin:
            0 auto;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            16px;

          background:
            rgba(
              255,
              255,
              255,
              .07
            );

          color:
            #d7b58a;
        }

        .final-card h2 {
          max-width:
            820px;

          margin:
            27px auto
            0;

          font-size:
            clamp(
              2.6rem,
              5vw,
              5rem
            );

          font-weight:
            500;
        }

        .final-card h2 span {
          color:
            #d6b184;
        }

        .final-card p {
          max-width:
            580px;

          margin:
            20px auto
            0;

          color:
            rgba(
              255,
              255,
              255,
              .64
            );

          font-size:
            14px;

          line-height:
            1.75;
        }

        .final-actions {
          margin-top:
            30px;

          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            9px;
        }

        .final-card
        .button-primary {
          border-color:
            white;

          background:
            white;

          color:
            var(--charcoal)
            !important;
        }

        .final-card
        .button-secondary {
          border-color:
            rgba(
              255,
              255,
              255,
              .17
            );

          background:
            rgba(
              255,
              255,
              255,
              .05
            );

          color:
            white;
        }

        .final-note {
          margin-top:
            16px !important;

          color:
            rgba(
              255,
              255,
              255,
              .4
            ) !important;

          font-size:
            9px !important;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .tots-footer {
          padding:
            60px 20px
            28px;

          border-top:
            1px solid
            var(--border);
        }

        .footer-grid {
          width:
            min(
              1180px,
              100%
            );

          margin:
            0 auto;

          display:
            grid;

          grid-template-columns:
            1.5fr
            repeat(
              3,
              1fr
            );

          gap:
            45px;

          padding-bottom:
            45px;
        }

        .footer-copy {
          max-width:
            320px;

          margin-top:
            15px !important;

          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1.7;
        }

        .footer-col h5 {
          margin:
            0;

          color:
            var(--muted);

          font-size:
            10px;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .footer-links {
          margin-top:
            15px;

          display:
            grid;

          gap:
            9px;
        }

        .footer-links a {
          color:
            var(--charcoal-soft);

          font-size:
            12px;

          text-decoration:
            none;
        }

        .footer-bottom {
          width:
            min(
              1180px,
              100%
            );

          margin:
            0 auto;

          padding-top:
            20px;

          display:
            flex;

          justify-content:
            space-between;

          gap:
            15px;

          border-top:
            1px solid
            var(--border);

          color:
            var(--muted);

          font-size:
            9px;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (
          max-width:
          1050px
        ) {

          .tots-nav {
            display:
              flex;

            justify-content:
              space-between;
          }

          .tots-nav-links {
            display:
              none;
          }

          .transform-grid,
          .connected-layout,
          .clarity-card,
          .about-layout,
          .faq-layout {
            grid-template-columns:
              1fr;
          }

          .clarity-card {
            gap:
              45px;
          }

          .connected-layout,
          .about-layout,
          .faq-layout {
            gap:
              45px;
          }

          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
          max-width:
          760px
        ) {

          .tots-container {
            width:
              calc(
                100% -
                30px
              );
          }

          .tots-section {
            padding:
              80px 0;
          }

          .tots-nav-wrap {
            padding:
              10px;
          }

          .tots-nav {
            height:
              60px;

            padding:
              0 8px
              0 12px;

            border-radius:
              16px;
          }

          .tots-nav-actions {
            display:
              none;
          }

          .tots-menu-button {
            display:
              flex;
          }

          .tots-logo-copy small {
            display:
              none;
          }

          .tots-hero {
            min-height:
              auto;

            padding:
              130px 18px
              70px;
          }

          .tots-hero::before {
            width:
              480px;

            height:
              480px;

            top:
              70px;
          }

          .tots-hero-inner {
            width:
              100%;

            max-width:
              100%;

            margin:
              0 auto;
          }

          .tots-hero-title {
            max-width:
              620px;

            margin-top:
              25px !important;

            font-size:
              clamp(
                3rem,
                12vw,
                4.5rem
              ) !important;

            line-height:
              .98 !important;
          }

          .tots-hero-copy {
            max-width:
              550px;

            margin-top:
              22px !important;

            font-size:
              15px;
          }

          .tots-hero-actions {
            width:
              100%;

            max-width:
              520px;

            margin-top:
              28px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .tots-hero-actions a {
            width:
              100%;
          }

          .tots-hero-note {
            max-width:
              520px;

            margin-top:
              18px;

            gap:
              10px 14px;

            font-size:
              10px;
          }

          .trusted-section {
            padding:
              0 15px
              55px;
          }

          .trusted-card {
            padding:
              20px 14px;
          }

          .calm-section {
            padding:
              55px 15px;
          }

          .calm-card {
            padding:
              48px 20px;

            border-radius:
              25px;
          }

          .calm-card h2 {
            font-size:
              clamp(
                2.2rem,
                10vw,
                3.4rem
              );
          }

          .transform-grid,
          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr;
          }

          .transform-card,
          .feature-card,
          .why-card,
          .security-card,
          .price-card {
            padding:
              23px;
          }

          .demo-body {
            grid-template-columns:
              57px 1fr;

            min-height:
              500px;
          }

          .demo-sidebar {
            padding:
              14px 8px;
          }

          .demo-sidebar-logo {
            padding:
              0;
          }

          .demo-nav button {
            padding:
              9px;

            justify-content:
              center;
          }

          .demo-nav button span {
            display:
              none;
          }

          .demo-content {
            padding:
              16px;
          }

          .demo-page-head h3 {
            font-size:
              21px;
          }

          .demo-six,
          .demo-four {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .demo-grid {
            grid-template-columns:
              1fr;
          }

          .demo-kanban {
            grid-template-columns:
              1fr;
          }

          .demo-cta {
            padding:
              22px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .demo-cta a {
            width:
              100%;
          }

          .connection-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .clarity-card {
            padding:
              30px 20px;

            border-radius:
              25px;
          }

          .clarity-title {
            font-size:
              clamp(
                2.7rem,
                12vw,
                4rem
              );
          }

          .price-card {
            min-height:
              auto;
          }

          .price-description {
            min-height:
              0;
          }

          .about-card {
            padding:
              25px;
          }

          .final-card {
            padding:
              55px 20px;
          }

          .final-actions {
            flex-direction:
              column;
          }

          .final-actions a {
            width:
              100%;
          }

          .footer-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (
          max-width:
          480px
        ) {

          .section-title {
            font-size:
              clamp(
                2.25rem,
                11vw,
                3.4rem
              );
          }

          .tots-hero {
            padding:
              115px 15px
              60px;
          }

          .tots-hero-pill {
            padding:
              8px 12px;

            font-size:
              9px;
          }

          .tots-hero-title {
            max-width:
              390px;

            font-size:
              clamp(
                2.75rem,
                12.5vw,
                3.65rem
              ) !important;
          }

          .tots-hero-copy {
            max-width:
              390px;

            font-size:
              14px;

            line-height:
              1.65;
          }

          .tots-hero-note {
            max-width:
              380px;

            gap:
              8px 12px;

            font-size:
              9px;
          }

          .tots-logo-copy strong {
            font-size:
              11px;
          }

          .trusted-list span {
            font-size:
              9px;

            padding:
              7px 9px;
          }

          .demo-browser {
            border-radius:
              18px;
          }

          .demo-browser-top {
            height:
              40px;
          }

          .demo-address {
            font-size:
              7px;
          }

          .demo-live {
            display:
              none;
          }

          .demo-content {
            padding:
              12px;
          }

          .demo-six,
          .demo-four,
          .demo-three {
            grid-template-columns:
              1fr 1fr;
          }

          .demo-stat {
            padding:
              9px;
          }

          .demo-stat strong {
            font-size:
              14px;
          }

          .footer-grid {
            grid-template-columns:
              1fr;
          }

          .footer-bottom {
            flex-direction:
              column;
          }

        }

      `}</style>

      {/* ======================================================
          NAV
      ====================================================== */}

      <header className="tots-nav-wrap">
        <div className="tots-nav">
          <a
            href="/"
            className="tots-brand"
            aria-label="TOTS-OS home"
          >
            <Logo />
          </a>

          <nav className="tots-nav-links">
            {NAV_ITEMS.map(
              (
                item
              ) => (
                <a
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="tots-nav-actions">
            <a
              href={SIGNUP_URL}
              className="button-secondary"
            >
              <LogIn
                size={14}
              />

              Log in
            </a>

            <a
              href={SIGNUP_URL}
              className="button-primary"
            >
              Start free

              <ArrowRight
                size={14}
              />
            </a>
          </div>

          <button
            type="button"
            className="tots-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              className="mobile-menu"
              initial={{
                y: -20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
            >
              <div className="mobile-menu-head">
                <Logo
                  size={35}
                />

                <button
                  type="button"
                  className="tots-menu-button"
                  style={{
                    display:
                      "flex",
                  }}
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-links">
                {NAV_ITEMS.map(
                  (
                    item
                  ) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                    >
                      {item.label}

                      <ArrowUpRight
                        size={15}
                      />
                    </a>
                  )
                )}
              </div>

              <div className="mobile-actions">
                <a
                  href={SIGNUP_URL}
                  className="button-primary"
                >
                  Start my free
                  trial
                </a>

                <a
                  href={SIGNUP_URL}
                  className="button-secondary"
                >
                  Log in
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="tots-hero">
        <div className="tots-hero-inner">
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.6,
            }}
            className="tots-hero-pill"
          >
            <Sparkles
              size={13}
            />

            One calmer place to
            run your business
          </motion.div>

          <motion.h1
            className="tots-hero-title"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.75,
              delay:
                0.06,
            }}
          >
            Your whole business.

            <span className="tots-hero-accent">
              Finally organised.
            </span>
          </motion.h1>

          <motion.p
            className="tots-hero-copy"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.75,
              delay:
                0.12,
            }}
          >
            TOTS-OS brings your{" "}
            <strong>
              clients, projects,
              tasks, finances,
              calendar, content
              and ideas
            </strong>{" "}
            into one connected
            workspace — so running
            your business feels
            less scattered and a
            lot more manageable.
          </motion.p>

          <motion.div
            className="tots-hero-actions"
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.75,
              delay:
                0.18,
            }}
          >
            <a
              href={SIGNUP_URL}
              className="button-primary button-large"
            >
              Start my free trial

              <ArrowRight
                size={16}
              />
            </a>

            <a
              href="#demo"
              className="button-secondary button-large"
            >
              <Play size={14} />

              Explore TOTS-OS
            </a>
          </motion.div>

          <motion.div
            className="tots-hero-note"
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                0.7,
              delay:
                0.24,
            }}
          >
            <span>
              <Check size={12} />
              14 days free
            </span>

            <span>
              <Check size={12} />
              No commitment
            </span>

            <span>
              <Check size={12} />
              Set up in minutes
            </span>
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          TRUSTED BY
      ====================================================== */}

      <section className="trusted-section">
        <Reveal>
          <div className="trusted-card">
            <p>
              Trusted by businesses
              including
            </p>

            <div className="trusted-list">
              {TRUSTED_BY.map(
                (
                  name
                ) => (
                  <span
                    key={name}
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ======================================================
          PAIN
      ====================================================== */}

      <section className="calm-section">
        <Reveal>
          <div className="calm-card">
            <Eyebrow>
              Sound familiar?
            </Eyebrow>

            <h2>
              Your business grew.
              <br />
              Your organisation
              didn&apos;t.
            </h2>

            <p>
              Client details in
              WhatsApp. Tasks in
              your head. Invoices
              somewhere else.
              Content sitting in
              Canva. Notes on your
              phone. Another tab
              every time you need
              to find something.
            </p>

            <div className="chaos-list">
              {[
                "WhatsApp",
                "Spreadsheets",
                "Notes",
                "Calendar",
                "Canva",
                "Invoices",
                "Random tabs",
                "Your head",
              ].map(
                (
                  item
                ) => (
                  <span
                    key={item}
                  >
                    {item}
                  </span>
                )
              )}
            </div>

            <div className="calm-line">
              TOTS-OS gives it
              all one calm home.
            </div>
          </div>
        </Reveal>
      </section>

      {/* ======================================================
          PRODUCT
      ====================================================== */}

      <section
        id="product"
        className="tots-section"
      >
        <div className="tots-container">
          <Reveal>
            <Eyebrow>
              One business.
              One place.
            </Eyebrow>

            <h2 className="section-title">
              Stop rebuilding the
              picture of your
              business{" "}
              <span className="gold-text">
                every day.
              </span>
            </h2>

            <p className="section-copy">
              Instead of
              remembering where
              everything lives,
              open one workspace
              and see your clients,
              work, money and
              priorities together.
            </p>
          </Reveal>

          <div className="transform-grid">
            <Reveal>
              <div className="transform-card">
                <span>
                  Before
                </span>

                <h3>
                  Everything has
                  its own hiding
                  place.
                </h3>

                <div className="transform-list">
                  {[
                    "Clients in messages and contacts",
                    "Tasks in notes or your head",
                    "Projects in spreadsheets",
                    "Money in another system",
                    "Content somewhere else again",
                    "No single view of the business",
                  ].map(
                    (
                      item
                    ) => (
                      <div
                        className="transform-row"
                        key={item}
                      >
                        <X size={14} />

                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal
              delay={0.08}
            >
              <div className="transform-card good">
                <span>
                  With TOTS-OS
                </span>

                <h3>
                  Everything works
                  together.
                </h3>

                <div className="transform-list">
                  {[
                    "Clients connected to their work",
                    "Projects connected to tasks",
                    "Invoices and finances visible",
                    "Calendar and deadlines together",
                    "Content alongside the rest",
                    "Clarity helping you prioritise",
                  ].map(
                    (
                      item
                    ) => (
                      <div
                        className="transform-row"
                        key={item}
                      >
                        <Check
                          size={14}
                        />

                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          <div className="why-grid">
            {[
              {
                icon:
                  Layers3,
                title:
                  "One workspace",
                text:
                  "Clients, projects, finances, content and notes stay together instead of living across completely separate systems.",
              },
              {
                icon:
                  Gauge,
                title:
                  "Clear priorities",
                text:
                  "See what is due, what is overdue and what needs your attention without searching through everything first.",
              },
              {
                icon:
                  Zap,
                title:
                  "Less admin",
                text:
                  "Spend less time finding information and updating multiple tools, and more time actually running your business.",
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
                    key={item.title}
                    delay={
                      index *
                      0.06
                    }
                  >
                    <div className="why-card">
                      <div className="why-icon">
                        <Icon
                          size={19}
                        />
                      </div>

                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {item.text}
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          DEMO
      ====================================================== */}

      <section
        className="tots-section soft"
      >
        <div className="tots-container">
          <Reveal>
            <div className="demo-section-head">
              <Eyebrow>
                See it yourself
              </Eyebrow>

              <h2 className="section-title">
                Have a look
                around.
              </h2>

              <p className="section-copy">
                Click through the
                workspace and see
                what running your
                business from one
                organised place can
                actually look like.
              </p>
            </div>
          </Reveal>

          <ProductDemo />
        </div>
      </section>

      {/* ======================================================
          FEATURES
      ====================================================== */}

      <section
        id="features"
        className="tots-section"
      >
        <div className="tots-container">
          <Reveal>
            <Eyebrow>
              Inside TOTS-OS
            </Eyebrow>

            <h2 className="section-title">
              Everything has a
              place.
            </h2>

            <p className="section-copy">
              The everyday tools
              you need to run a
              small business,
              brought together
              without making the
              system feel
              overwhelming.
            </p>
          </Reveal>

          <div className="feature-grid">
            {FEATURES.map(
              (
                feature,
                index
              ) => {
                const Icon =
                  feature.icon;

                return (
                  <Reveal
                    key={feature.id}
                    delay={
                      (index %
                        3) *
                      0.05
                    }
                  >
                    <div className="feature-card">
                      <div className="feature-icon">
                        <Icon
                          size={20}
                        />
                      </div>

                      <h3>
                        {feature.title}
                      </h3>

                      <p>
                        {feature.text}
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          CONNECTED
      ====================================================== */}

      <section className="tots-section soft">
        <div className="tots-container connected-layout">
          <Reveal>
            <Eyebrow>
              Connected by
              design
            </Eyebrow>

            <h2 className="section-title">
              Your business
              isn&apos;t six
              separate apps.
            </h2>

            <p className="section-copy">
              A contact becomes a
              client. A client gets
              a project. Projects
              create work. Work
              creates revenue.
              TOTS-OS keeps those
              relationships
              connected.
            </p>
          </Reveal>

          <Reveal
            delay={0.1}
          >
            <div className="connection-grid">
              {[
                {
                  icon:
                    Users,
                  label:
                    "Clients",
                },
                {
                  icon:
                    FolderKanban,
                  label:
                    "Projects",
                },
                {
                  icon:
                    CalendarDays,
                  label:
                    "Calendar",
                },
                {
                  icon:
                    WalletCards,
                  label:
                    "Finances",
                },
                {
                  icon:
                    NotebookPen,
                  label:
                    "Notes",
                },
                {
                  icon:
                    MessageSquareText,
                  label:
                    "Social",
                },
              ].map(
                (
                  item
                ) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      className="connection-item"
                      key={item.label}
                    >
                      <Icon
                        size={21}
                      />

                      <span>
                        {item.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================
          CLARITY
      ====================================================== */}

      <section
        id="clarity"
        className="tots-section"
      >
        <div className="tots-container">
          <div className="clarity-card">
            <Reveal>
              <Eyebrow>
                Meet Clarity
              </Eyebrow>

              <h2 className="clarity-title">
                Your business,
                with a little more
                <span>
                  clarity.
                </span>
              </h2>

              <p className="clarity-copy">
                Clarity is your
                built-in AI PA. It
                uses the context
                already inside
                TOTS-OS to help
                surface what needs
                your attention.
              </p>

              <div className="clarity-points">
                {[
                  "Ask what to prioritise today.",
                  "Surface overdue work and upcoming deadlines.",
                  "See which clients need your attention.",
                  "Catch outstanding invoices.",
                  "Turn business information into a clearer next step.",
                ].map(
                  (
                    item
                  ) => (
                    <div
                      className="clarity-point"
                      key={item}
                    >
                      <div className="clarity-check">
                        <Check
                          size={12}
                        />
                      </div>

                      {item}
                    </div>
                  )
                )}
              </div>
            </Reveal>

            <Reveal
              delay={0.1}
            >
              <div className="clarity-demo">
                <div className="clarity-demo-head">
                  <div className="clarity-brand">
                    <Sparkles
                      size={14}
                    />

                    Clarity
                  </div>

                  <span className="clarity-ready">
                    Ready
                  </span>
                </div>

                <div className="clarity-message">
                  What should I
                  focus on today?
                </div>

                <div className="clarity-response">
                  <span>
                    Clarity
                  </span>

                  <p>
                    I&apos;d focus
                    on these three
                    things first.
                    One invoice is
                    overdue and
                    your website
                    project has the
                    nearest
                    deadline.
                  </p>

                  <div className="priority-list">
                    <div className="priority">
                      <span>
                        1
                      </span>

                      <div>
                        <strong>
                          Finish
                          website
                          approval
                        </strong>

                        <small>
                          Client
                          project ·
                          due
                          tomorrow
                        </small>
                      </div>
                    </div>

                    <div className="priority">
                      <span>
                        2
                      </span>

                      <div>
                        <strong>
                          Chase
                          outstanding
                          invoice
                        </strong>

                        <small>
                          £860 ·
                          overdue
                        </small>
                      </div>
                    </div>

                    <div className="priority">
                      <span>
                        3
                      </span>

                      <div>
                        <strong>
                          Approve
                          scheduled
                          content
                        </strong>

                        <small>
                          3 posts
                          waiting
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="clarity-message">
                  Which client
                  needs the most
                  attention?
                </div>

                <div className="clarity-response">
                  <span>
                    Clarity
                  </span>

                  <p>
                    Halstead
                    &amp; Co has
                    an overdue
                    payment and
                    two open
                    project tasks.
                    I&apos;d start
                    there.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ======================================================
          SECURITY
      ====================================================== */}

      <section className="tots-section soft">
        <div className="tots-container">
          <Reveal>
            <Eyebrow>
              Built for real
              businesses
            </Eyebrow>

            <h2 className="section-title">
              Simple on the
              surface.
              <br />
              Solid underneath.
            </h2>
          </Reveal>

          <div className="security-grid">
            <Reveal>
              <div className="security-card">
                <LockKeyhole
                  size={22}
                />

                <h3>
                  Secure access
                </h3>

                <p>
                  Your workspace
                  sits behind
                  authenticated
                  account access,
                  rather than
                  public links or
                  shared
                  spreadsheets.
                </p>
              </div>
            </Reveal>

            <Reveal
              delay={0.05}
            >
              <div className="security-card">
                <ShieldCheck
                  size={22}
                />

                <h3>
                  Organised data
                </h3>

                <p>
                  Business
                  information is
                  structured around
                  accounts and
                  organisations to
                  keep everything
                  in the correct
                  workspace.
                </p>
              </div>
            </Reveal>

            <Reveal
              delay={0.1}
            >
              <div className="security-card">
                <RefreshCw
                  size={22}
                />

                <h3>
                  Always improving
                </h3>

                <p>
                  TOTS-OS evolves
                  around real small
                  business
                  workflows rather
                  than forcing every
                  company into one
                  rigid process.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ======================================================
          PRICING
      ====================================================== */}

      <section
        id="pricing"
        className="tots-section"
      >
        <div className="tots-container">
          <Reveal>
            <Eyebrow>
              Simple pricing
            </Eyebrow>

            <h2 className="section-title">
              Choose what fits
              your business.
            </h2>

            <p className="section-copy">
              You don&apos;t need
              to decide from this
              page. Create an
              account and use
              TOTS-OS free for 14
              days first.
            </p>

            <div className="trial-pill">
              <Check
                size={12}
              />

              14 days free · no
              commitment
            </div>
          </Reveal>

          <div className="pricing-grid">
            {PRICING.map(
              (
                plan,
                index
              ) => (
                <Reveal
                  key={plan.name}
                  delay={
                    index *
                    0.06
                  }
                >
                  <div
                    className={`price-card ${
                      plan.featured
                        ? "featured"
                        : ""
                    }`}
                  >
                    <div className="price-head">
                      <span className="price-name">
                        {plan.name}
                      </span>

                      {plan.badge && (
                        <span className="price-badge">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="price-figure">
                      <span className="price-amount">
                        £{plan.price}
                      </span>

                      <span className="price-period">
                        /month
                      </span>
                    </div>

                    <p className="price-description">
                      {plan.description}
                    </p>

                    <div className="price-features">
                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <div
                            className="price-feature"
                            key={feature}
                          >
                            <Check
                              size={13}
                            />

                            <span>
                              {feature}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="price-action">
                      <a
                        href={SIGNUP_URL}
                        className={
                          plan.featured
                            ? "button-primary"
                            : "button-secondary"
                        }
                      >
                        Start free

                        <ArrowRight
                          size={14}
                        />
                      </a>

                      <p className="price-note">
                        Try it free
                        for 14 days
                      </p>
                    </div>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"
        className="tots-section soft"
      >
        <div className="tots-container about-layout">
          <Reveal>
            <Eyebrow>
              Why we built it
            </Eyebrow>

            <h2 className="section-title">
              Built by business
              owners who wanted
              something simpler.
            </h2>

            <p className="section-copy">
              Running a business
              shouldn&apos;t mean
              stitching together a
              CRM, planner, finance
              app, social tool,
              calendar and notes
              system just to know
              what&apos;s going
              on.
            </p>
          </Reveal>

          <Reveal
            delay={0.08}
          >
            <div className="about-card">
              <p>
                We&apos;re Sam
                and Leigha, the
                team behind The
                Organised Types.
              </p>

              <p>
                We kept seeing the
                same thing:
                businesses had
                plenty of software,
                but the actual
                business was still
                scattered
                everywhere.
              </p>

              <p>
                So we created the
                system we wanted
                ourselves — one
                calm home for
                clients, work,
                money, ideas and
                everything in
                between.
              </p>

              <p>
                That became
                TOTS-OS.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================
          FAQ
      ====================================================== */}

      <section className="tots-section">
        <div className="tots-container faq-layout">
          <Reveal>
            <Eyebrow>
              Questions
            </Eyebrow>

            <h2 className="section-title">
              Things worth
              knowing.
            </h2>
          </Reveal>

          <div>
            {FAQS.map(
              (
                faq,
                index
              ) => {
                const open =
                  openFaq ===
                  index;

                return (
                  <div
                    className="faq-item"
                    key={faq.q}
                  >
                    <button
                      className="faq-button"
                      type="button"
                      onClick={() =>
                        setOpenFaq(
                          open
                            ? null
                            : index
                        )
                      }
                    >
                      <span>
                        {faq.q}
                      </span>

                      <motion.span
                        animate={{
                          rotate:
                            open
                              ? 180
                              : 0,
                        }}
                      >
                        <ChevronDown
                          size={17}
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
                          className="faq-answer"
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
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="tots-section">
        <div className="tots-container">
          <Reveal>
            <div className="final-card">
              <div className="final-icon">
                <Sparkles
                  size={23}
                />
              </div>

              <h2>
                Your business is
                complicated enough.
                <br />

                <span>
                  Running it
                  shouldn&apos;t
                  be.
                </span>
              </h2>

              <p>
                Start bringing your
                clients, projects,
                tasks, finances,
                content and ideas
                back into one calm,
                connected place.
              </p>

              <div className="final-actions">
                <a
                  href={SIGNUP_URL}
                  className="button-primary button-large"
                >
                  Start my free
                  trial

                  <ArrowRight
                    size={16}
                  />
                </a>

                <a
                  href="#demo"
                  className="button-secondary button-large"
                >
                  <Play
                    size={14}
                  />

                  Explore demo
                </a>
              </div>

              <p className="final-note">
                14 days free · no
                commitment · set up
                in minutes
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="tots-footer">
        <div className="footer-grid">
          <div>
            <Logo
              size={40}
            />

            <p className="footer-copy">
              One calmer,
              connected business
              operating system for
              small businesses.
            </p>
          </div>

          <div className="footer-col">
            <h5>
              Product
            </h5>

            <div className="footer-links">
              <a href="#features">
                Features
              </a>

              <a href="#demo">
                Demo
              </a>

              <a href="#clarity">
                Clarity
              </a>

              <a href="#pricing">
                Pricing
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h5>
              Account
            </h5>

            <div className="footer-links">
              <a href={SIGNUP_URL}>
                Log in
              </a>

              <a href={SIGNUP_URL}>
                Create account
              </a>

              <a href="/manage-subscription">
                Manage subscription
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h5>
              Legal
            </h5>

            <div className="footer-links">
              <a href="/docs/privacypolicy">
                Privacy Policy
              </a>

              <a href="/docs/termsconditions">
                Terms
              </a>

              <a href="/docs/cookies">
                Cookies
              </a>

              <a href="/docs/securitypolicy">
                Security
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 TOTS-OS
          </span>

          <span>
            The Organised Types
          </span>
        </div>
      </footer>
    </div>
  );
}