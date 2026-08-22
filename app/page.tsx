"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  FileText,
  FolderKanban,
  Gauge,
  ImageIcon,
  Inbox,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Mail,
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

type TourStep = {
  key: string;
  eyebrow: string;
  title: string;
  text: string;
};

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
    group: "My business",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    group: "My business",
  },
  {
    key: "social",
    label: "Social",
    icon: MessageSquareText,
    group: "My business",
  },
  {
    key: "finance",
    label: "Finance",
    icon: CircleDollarSign,
    group: "My business",
  },
  {
    key: "notes",
    label: "Notes",
    icon: NotebookPen,
    group: "My business",
  },
  {
    key: "workspace",
    label: "Workspace",
    icon: BriefcaseBusiness,
    group: "Clients & projects",
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
    tag: "Client",
  },
  {
    name: "Leo Bennett",
    org: "Northfield Studio",
    tag: "Client",
  },
  {
    name: "Priya N.",
    org: "Marlow Fitness",
    tag: "Lead",
  },
  {
    name: "Tom R.",
    org: "Bright House",
    tag: "Client",
  },
];

const DEMO_CAMPAIGNS = [
  {
    name: "Summer launch",
    list: "Newsletter",
    status: "Sent",
    sent: 128,
    opens: 74,
    clicks: 19,
  },
  {
    name: "Client update",
    list: "Active clients",
    status: "Draft",
    sent: 0,
    opens: 0,
    clicks: 0,
  },
];

const TOUR_STEPS: TourStep[] = [
  {
    key: "dashboard",
    eyebrow: "01 · Your dashboard",
    title: "Start every day knowing what matters.",
    text:
      "Your home dashboard brings together business health, open work, projects, revenue, your calendar and the things that need your attention.",
  },
  {
    key: "clients",
    eyebrow: "02 · Clients",
    title: "Keep the whole client relationship connected.",
    text:
      "Instead of searching through emails, notes and messages, TOTS-OS keeps your contacts, clients and the work connected to them in one place.",
  },
  {
    key: "projects",
    eyebrow: "03 · Projects",
    title: "See the work, not just another to-do list.",
    text:
      "Projects bring tasks, deadlines, client information, files, notes and financial context together so you can see how delivery is actually progressing.",
  },
  {
    key: "finance",
    eyebrow: "04 · Finance",
    title: "Know where the money stands.",
    text:
      "Invoices, quotes, expenses and your wider financial position sit alongside the work that created them.",
  },
  {
    key: "clarity",
    eyebrow: "05 · Meet Clarity",
    title: "Ask your business what needs your attention.",
    text:
      "Clarity is the AI PA inside TOTS-OS. It can use the information already in your workspace to help surface priorities, overdue work, upcoming deadlines and important client actions.",
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

function DemoNav({
  active,
  setActive,
}: {
  active: DemoKey;
  setActive: (
    key: DemoKey
  ) => void;
}) {
  let previousGroup =
    "__start__";

  return (
    <aside className="real-demo-sidebar">
      <div className="real-demo-logo">
        <Logo
          size={47}
          showWordmark={false}
        />
      </div>

      <div className="real-demo-nav">
        {DEMO_NAV.map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            const showGroup =
              item.group &&
              item.group !==
                previousGroup;

            previousGroup =
              item.group;

            return (
              <div
                key={
                  item.key
                }
              >
                {showGroup && (
                  <div className="real-demo-group">
                    {
                      item.group
                    }
                  </div>
                )}

                <button
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
                    size={16}
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </button>
              </div>
            );
          }
        )}
      </div>

      <div className="real-demo-sidebar-bottom">
        <button
          type="button"
          onClick={() =>
            setActive(
              "settings"
            )
          }
          className={
            active ===
            "settings"
              ? "active"
              : ""
          }
        >
          <SettingsIcon
            size={16}
          />
          Settings
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   HOME DEMO — MATCHES REAL TOTS-OS
============================================================ */

function DemoHome() {
  return (
    <div className="real-home">
      <div className="real-home-top">
        <div>
          <div className="real-date">
            <span />
            Saturday, 22 August 2026
          </div>

          <h3>
            Good morning.
          </h3>

          <p>
            Here&apos;s everything
            happening across your
            business.
          </p>
        </div>

        <div className="clarity-alert">
          <div className="clarity-alert-icon">
            <Sparkles
              size={14}
            />
          </div>

          <div>
            <span>
              Clarity says
            </span>

            <strong>
              Your workload needs
              attention
            </strong>
          </div>
        </div>
      </div>

      <div className="real-kpis">
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
          label="Invoices due"
          value="2"
        />

        <DemoStat
          label="Revenue"
          value="£8,240"
        />
      </div>

      <div className="home-main-grid">
        <div className="focus-card">
          <div className="focus-top">
            <div>
              <span className="real-card-kicker">
                Focus
              </span>

              <h4>
                Today&apos;s
                priorities
              </h4>
            </div>

            <span className="risk-pill">
              High risk
            </span>
          </div>

          <p>
            Activity is elevated.
            Focus on delivery,
            overdue work and
            anything affecting
            cash flow first.
          </p>

          <div className="priority-rows">
            {[
              "Focus on the highest-impact open tasks",
              "Check upcoming meetings and deadlines",
              "Review active project delivery",
            ].map(
              (
                item,
                index
              ) => (
                <div
                  className="priority-row"
                  key={
                    item
                  }
                >
                  <span>
                    {
                      index +
                      1
                    }
                  </span>

                  {
                    item
                  }
                </div>
              )
            )}
          </div>

          <button
            type="button"
            className="sage-action"
          >
            View Clarity brief
            <ArrowRight
              size={13}
            />
          </button>
        </div>

        <div className="coming-card">
          <div className="coming-head">
            <h4>
              <CalendarDays
                size={16}
              />
              Coming up
            </h4>

            <span>
              Calendar
            </span>
          </div>

          <div className="event-list">
            {[
              {
                day:
                  "MON",
                time:
                  "09:00",
                title:
                  "Client strategy call",
              },
              {
                day:
                  "MON",
                time:
                  "13:00",
                title:
                  "Content planning",
              },
              {
                day:
                  "TUE",
                time:
                  "10:30",
                title:
                  "Website approval",
              },
              {
                day:
                  "WED",
                time:
                  "09:00",
                title:
                  "Project delivery review",
              },
            ].map(
              (
                event
              ) => (
                <div
                  className="event-row"
                  key={`${event.day}-${event.time}-${event.title}`}
                >
                  <div className="event-date">
                    <strong>
                      {
                        event.day
                      }
                    </strong>

                    <span>
                      {
                        event.time
                      }
                    </span>
                  </div>

                  <div className="event-title">
                    {
                      event.title
                    }
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="snapshot-card">
          <span className="snapshot-kicker">
            Snapshot
          </span>

          <h4>
            Business now
          </h4>

          <div className="snapshot-revenue">
            <span>
              Paid revenue
            </span>

            <strong>
              £8,240
            </strong>
          </div>

          <div className="snapshot-line" />

          <div className="snapshot-grid">
            <div>
              <span>
                Team
              </span>

              <strong>
                2
              </strong>
            </div>

            <div>
              <span>
                Emails
              </span>

              <strong>
                16
              </strong>
            </div>

            <div>
              <span>
                Projects
              </span>

              <strong>
                4
              </strong>
            </div>

            <div>
              <span>
                Events
              </span>

              <strong>
                9
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="work-queue-card">
        <div className="work-queue-head">
          <div>
            <span className="real-card-kicker">
              Work queue
            </span>

            <h4>
              Priority tasks
            </h4>
          </div>

          <div className="quick-task">
            <span>
              Add task...
            </span>

            <button
              type="button"
            >
              <Plus
                size={13}
              />
            </button>
          </div>
        </div>

        <div className="task-strip">
          {[
            "Approve client proposal",
            "Review website changes",
            "Prepare campaign content",
            "Send invoice reminder",
            "Schedule launch post",
          ].map(
            (
              item,
              index
            ) => (
              <div
                className="task-chip"
                key={
                  item
                }
              >
                <span className="task-check" />

                <strong>
                  {
                    item
                  }
                </strong>

                {index ===
                  0 && (
                  <small>
                    High
                  </small>
                )}
              </div>
            )
          )}
        </div>

        <button
          type="button"
          className="sage-action"
        >
          View all 12 tasks
          <ArrowRight
            size={13}
          />
        </button>
      </div>

      <div className="bottom-dashboard-grid">
        <div className="mini-dashboard-card">
          <div className="mini-dashboard-title">
            <h4>
              <BriefcaseBusiness
                size={17}
              />
              Projects
            </h4>

            <button
              type="button"
            >
              View all
            </button>
          </div>

          <div className="mini-project">
            <div>
              <strong>
                Website
                redesign
              </strong>

              <span>
                7 open tasks
              </span>
            </div>

            <span className="mini-progress">
              68%
            </span>
          </div>

          <div className="mini-project">
            <div>
              <strong>
                Launch
                campaign
              </strong>

              <span>
                4 open tasks
              </span>
            </div>

            <span className="mini-progress">
              42%
            </span>
          </div>
        </div>

        <div className="mini-dashboard-card">
          <div className="mini-dashboard-title">
            <h4>
              <FileText
                size={17}
              />
              Notes
            </h4>

            <button
              type="button"
            >
              View all
            </button>
          </div>

          <div className="note-preview">
            <strong>
              Launch ideas
            </strong>

            <span>
              Content, offers
              and post-launch
              notes...
            </span>
          </div>

          <div className="note-preview">
            <strong>
              Client
              feedback
            </strong>

            <span>
              Website changes
              requested...
            </span>
          </div>
        </div>

        <div className="mini-dashboard-card">
          <div className="mini-dashboard-title">
            <h4>
              <Mail
                size={17}
              />
              Recent emails
            </h4>

            <span className="email-count">
              3
            </span>
          </div>

          <div className="email-preview">
            <div className="email-avatar">
              A
            </div>

            <div>
              <strong>
                Ava
              </strong>

              <span>
                Website
                approval
              </span>
            </div>
          </div>

          <div className="email-preview">
            <div className="email-avatar">
              M
            </div>

            <div>
              <strong>
                Mia
              </strong>

              <span>
                Project
                update
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OTHER DEMO VIEWS
============================================================ */

function DemoContacts() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            My business
          </span>

          <h3>
            Contacts
          </h3>

          <p>
            Keep every client,
            lead and relationship
            organised.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New contact
        </button>
      </div>

      <div className="inside-toolbar">
        <div className="inside-search">
          <Search
            size={14}
          />

          Search contacts
        </div>

        <div className="inside-filter">
          All contacts
          <ChevronDown
            size={13}
          />
        </div>
      </div>

      <div className="contact-table">
        <div className="contact-table-head">
          <span>
            Contact
          </span>

          <span>
            Business
          </span>

          <span>
            Type
          </span>

          <span>
            Status
          </span>
        </div>

        {DEMO_CONTACTS.map(
          (
            contact
          ) => (
            <div
              className="contact-table-row"
              key={
                contact.name
              }
            >
              <div className="contact-person">
                <div className="demo-avatar">
                  {contact.name.charAt(
                    0
                  )}
                </div>

                <strong>
                  {
                    contact.name
                  }
                </strong>
              </div>

              <span>
                {
                  contact.org
                }
              </span>

              <span className="sage-tag">
                {
                  contact.tag
                }
              </span>

              <span className="status-dot">
                <i />
                Active
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DemoCampaigns() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Marketing
          </span>

          <h3>
            Campaigns
          </h3>

          <p>
            Plan, build and keep
            track of your email
            campaigns.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New campaign
        </button>
      </div>

      <div className="campaign-grid">
        {DEMO_CAMPAIGNS.map(
          (
            campaign
          ) => (
            <div
              className="campaign-card"
              key={
                campaign.name
              }
            >
              <div className="campaign-top">
                <div>
                  <span className="real-card-kicker">
                    {
                      campaign.status
                    }
                  </span>

                  <h4>
                    {
                      campaign.name
                    }
                  </h4>
                </div>

                <span className="sage-tag">
                  {
                    campaign.list
                  }
                </span>
              </div>

              <div className="campaign-metrics">
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
    </div>
  );
}

function DemoSocial() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Content
          </span>

          <h3>
            Social
          </h3>

          <p>
            Plan content alongside
            everything else in the
            business.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New post
        </button>
      </div>

      <div className="social-layout">
        <div className="social-composer">
          <span className="real-card-kicker">
            Create
          </span>

          <h4>
            New social post
          </h4>

          <div className="social-dropzone">
            <ImageIcon
              size={24}
            />

            <strong>
              Add your
              content
            </strong>

            <span>
              Image or video
            </span>
          </div>
        </div>

        <div className="social-calendar">
          <span className="real-card-kicker">
            Upcoming
          </span>

          <h4>
            Scheduled content
          </h4>

          {[
            "Launch behind the scenes",
            "Client spotlight",
            "Feature walkthrough",
          ].map(
            (
              post,
              index
            ) => (
              <div
                className="scheduled-post"
                key={
                  post
                }
              >
                <span>
                  {index +
                    1}
                </span>

                <div>
                  <strong>
                    {
                      post
                    }
                  </strong>

                  <small>
                    {
                      index ===
                      0
                        ? "Today · 18:00"
                        : "This week"
                    }
                  </small>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function DemoFinance() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Money
          </span>

          <h3>
            Finance
          </h3>

          <p>
            See sales, expenses,
            invoices and cash
            position together.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New invoice
        </button>
      </div>

      <div className="finance-tabs">
        <span className="active">
          Overview
        </span>

        <span>
          Sales
        </span>

        <span>
          Expenses
        </span>

        <span>
          Tax & VAT
        </span>

        <span>
          Payroll
        </span>
      </div>

      <div className="finance-overview">
        <div className="finance-dark">
          <span className="snapshot-kicker">
            Financial
            overview
          </span>

          <h4>
            Your position
          </h4>

          <strong className="finance-big">
            £8,240
          </strong>

          <span className="finance-small">
            paid revenue this
            period
          </span>
        </div>

        <div className="finance-metric-card">
          <span>
            Outstanding
          </span>

          <strong>
            £1,860
          </strong>

          <small>
            2 invoices
          </small>
        </div>

        <div className="finance-metric-card">
          <span>
            Expenses
          </span>

          <strong>
            £1,240
          </strong>

          <small>
            this period
          </small>
        </div>

        <div className="finance-metric-card">
          <span>
            Tax estimate
          </span>

          <strong>
            £1,050
          </strong>

          <small>
            current
            projection
          </small>
        </div>
      </div>
    </div>
  );
}

function DemoNotes() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Organisation
          </span>

          <h3>
            Notes
          </h3>

          <p>
            Keep useful business
            information somewhere
            it can actually be
            found again.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New note
        </button>
      </div>

      <div className="notes-grid">
        {[
          {
            title:
              "Launch ideas",
            text:
              "Content concepts, offers, launch messaging and campaign ideas.",
          },
          {
            title:
              "Client feedback",
            text:
              "Requested website changes and notes from the latest review.",
          },
          {
            title:
              "Brain dump",
            text:
              "Ideas to revisit, feature thoughts and things to organise later.",
          },
        ].map(
          (
            note
          ) => (
            <div
              className="note-card"
              key={
                note.title
              }
            >
              <NotebookPen
                size={18}
              />

              <h4>
                {
                  note.title
                }
              </h4>

              <p>
                {
                  note.text
                }
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DemoWorkspace() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Clients &
            projects
          </span>

          <h3>
            Workspace
          </h3>

          <p>
            See client work,
            deadlines and project
            progress in one place.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          New project
        </button>
      </div>

      <div className="workspace-stats">
        <DemoStat
          label="Active projects"
          value="4"
        />

        <DemoStat
          label="Open tasks"
          value="12"
        />

        <DemoStat
          label="Due this week"
          value="5"
        />

        <DemoStat
          label="Project value"
          value="£6,400"
        />
      </div>

      <div className="project-list">
        {[
          {
            title:
              "Website redesign",
            client:
              "Halstead & Co",
            progress:
              68,
          },
          {
            title:
              "Launch campaign",
            client:
              "Northfield Studio",
            progress:
              42,
          },
          {
            title:
              "Brand refresh",
            client:
              "Marlow Fitness",
            progress:
              86,
          },
        ].map(
          (
            project
          ) => (
            <div
              className="project-row"
              key={
                project.title
              }
            >
              <div className="project-icon">
                <BriefcaseBusiness
                  size={17}
                />
              </div>

              <div className="project-copy">
                <strong>
                  {
                    project.title
                  }
                </strong>

                <span>
                  {
                    project.client
                  }
                </span>
              </div>

              <div className="project-progress-wrap">
                <div className="project-progress-bar">
                  <span
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>

                <small>
                  {
                    project.progress
                  }
                  %
                </small>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DemoCalendar() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Planning
          </span>

          <h3>
            Calendar
          </h3>

          <p>
            Meetings, deadlines,
            bookings and project
            events together.
          </p>
        </div>

        <button
          type="button"
          className="inside-primary"
        >
          <Plus
            size={14}
          />
          Add event
        </button>
      </div>

      <div className="calendar-demo">
        <div className="calendar-days">
          {[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
          ].map(
            (
              day,
              index
            ) => (
              <div
                className="calendar-day"
                key={
                  day
                }
              >
                <span>
                  {
                    day
                  }
                </span>

                <strong>
                  {
                    24 +
                    index
                  }
                </strong>
              </div>
            )
          )}
        </div>

        <div className="calendar-events">
          <div className="calendar-event sage">
            09:00 · Client
            strategy call
          </div>

          <div className="calendar-event">
            11:30 · Project
            review
          </div>

          <div className="calendar-event dark">
            14:00 · Content
            planning
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoSettings() {
  return (
    <div className="inside-page">
      <div className="inside-page-head">
        <div>
          <span className="real-date">
            <span />
            Workspace
          </span>

          <h3>
            Settings
          </h3>

          <p>
            Manage your business
            and workspace setup.
          </p>
        </div>
      </div>

      <div className="settings-card">
        <span className="real-card-kicker">
          Business
        </span>

        <h4>
          Workspace settings
        </h4>

        <div className="settings-fields">
          <div>
            <label>
              Business name
            </label>

            <div className="setting-field">
              Your Business
            </div>
          </div>

          <div>
            <label>
              Email
            </label>

            <div className="setting-field">
              hello@yourbusiness.com
            </div>
          </div>
        </div>
      </div>
    </div>
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

function ProductDemo({
  onStartTour,
}: {
  onStartTour: () => void;
}) {
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
        <div className="real-demo-frame">
          <div className="real-demo-app">
            <DemoNav
              active={active}
              setActive={
                setActive
              }
            />

            <main className="real-demo-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{
                    opacity:
                      0,
                    y: 4,
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
                      0.18,
                  }}
                >
                  <ActiveView />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        <div className="demo-mobile-tabs">
          {DEMO_NAV.filter(
            (
              item
            ) =>
              item.key !==
              "settings"
          ).map(
            (
              item
            ) => (
              <button
                key={
                  item.key
                }
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
                {
                  item.label
                }
              </button>
            )
          )}
        </div>

        <div className="demo-cta">
          <div>
            <span>
              Want the guided
              version?
            </span>

            <h3>
              Take the free
              TOTS-OS tour.
            </h3>

            <p>
              We&apos;ll walk you
              through the
              dashboard, clients,
              projects, finances
              and Clarity AI
              before you decide
              whether to sign up.
            </p>
          </div>

          <div className="demo-cta-actions">
            <button
              type="button"
              onClick={
                onStartTour
              }
              className="button-primary button-large"
            >
              <Play
                size={15}
              />

              Take free tour
            </button>

            <a
              href={
                SIGNUP_URL
              }
              className="button-secondary button-large"
            >
              Start free

              <ArrowRight
                size={16}
              />
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
   GUIDED TOUR
============================================================ */

function GuidedTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [
    step,
    setStep,
  ] =
    useState(
      0
    );

  const [
    finished,
    setFinished,
  ] =
    useState(
      false
    );

  const current =
    TOUR_STEPS[
      step
    ];

  const tourActiveKey: DemoKey =
    step === 0
      ? "home"
      : step === 1
      ? "contacts"
      : step === 2
      ? "workspace"
      : step === 3
      ? "finance"
      : "home";

  const TourView =
    DEMO_VIEWS[
      tourActiveKey
    ];

  function closeTour() {
    setStep(
      0
    );

    setFinished(
      false
    );

    onClose();

    setTimeout(
      () => {
        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      },
      100
    );
  }

  function next() {
    if (
      step <
      TOUR_STEPS.length -
        1
    ) {
      setStep(
        (
          old
        ) =>
          old +
          1
      );
    } else {
      setFinished(
        true
      );
    }
  }

  function previous() {
    if (
      step >
      0
    ) {
      setStep(
        (
          old
        ) =>
          old -
          1
      );
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tour-overlay"
          initial={{
            opacity:
              0,
          }}
          animate={{
            opacity:
              1,
          }}
          exit={{
            opacity:
              0,
          }}
        >
          <motion.div
            className="tour-window"
            initial={{
              opacity:
                0,
              scale:
                0.97,
              y: 20,
            }}
            animate={{
              opacity:
                1,
              scale:
                1,
              y: 0,
            }}
            exit={{
              opacity:
                0,
              scale:
                0.98,
            }}
          >
            <div className="tour-topbar">
              <div className="tour-brand">
                <Logo
                  size={
                    34
                  }
                />

                <span className="tour-free-pill">
                  Free tour
                </span>
              </div>

              <button
                type="button"
                className="tour-close"
                onClick={
                  closeTour
                }
                aria-label="Close tour"
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>

            {!finished ? (
              <>
                <div className="tour-layout">
                  <div className="tour-product">
                    <div className="tour-mini-app">
                      <DemoNav
                        active={
                          tourActiveKey
                        }
                        setActive={() =>
                          undefined
                        }
                      />

                      <div className="tour-demo-content">
                        {step ===
                        4 ? (
                          <div className="tour-clarity-screen">
                            <div className="tour-clarity-head">
                              <div>
                                <span className="real-date">
                                  <span />
                                  Clarity AI
                                </span>

                                <h3>
                                  Good
                                  morning.
                                </h3>

                                <p>
                                  Ask
                                  Clarity
                                  what
                                  needs
                                  your
                                  attention.
                                </p>
                              </div>

                              <div className="clarity-orb">
                                <Sparkles
                                  size={
                                    22
                                  }
                                />
                              </div>
                            </div>

                            <div className="tour-chat">
                              <div className="tour-user-message">
                                What
                                should
                                I focus
                                on
                                today?
                              </div>

                              <div className="tour-ai-message">
                                <div className="tour-ai-label">
                                  <Sparkles
                                    size={
                                      13
                                    }
                                  />
                                  Clarity
                                </div>

                                <p>
                                  I&apos;d
                                  focus
                                  on
                                  these
                                  three
                                  things
                                  first.
                                  Your
                                  website
                                  project
                                  has
                                  the
                                  nearest
                                  deadline
                                  and one
                                  invoice
                                  is now
                                  overdue.
                                </p>

                                <div className="tour-ai-priority">
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
                                      Due
                                      tomorrow
                                    </small>
                                  </div>
                                </div>

                                <div className="tour-ai-priority">
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
                                      £860
                                      overdue
                                    </small>
                                  </div>
                                </div>

                                <div className="tour-ai-priority">
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
                                      3
                                      posts
                                      waiting
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <TourView />
                        )}
                      </div>
                    </div>
                  </div>

                  <aside className="tour-guide">
                    <div className="tour-progress">
                      {TOUR_STEPS.map(
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className={
                              index <=
                              step
                                ? "active"
                                : ""
                            }
                          />
                        )
                      )}
                    </div>

                    <span className="tour-eyebrow">
                      {
                        current.eyebrow
                      }
                    </span>

                    <h2>
                      {
                        current.title
                      }
                    </h2>

                    <p>
                      {
                        current.text
                      }
                    </p>

                    {step ===
                      4 && (
                      <div className="tour-callout">
                        <Sparkles
                          size={
                            16
                          }
                        />

                        <div>
                          <strong>
                            This is
                            where
                            TOTS-OS
                            becomes
                            more than
                            another
                            dashboard.
                          </strong>

                          <span>
                            Clarity
                            can work
                            with the
                            context
                            already
                            inside
                            your
                            business
                            workspace.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="tour-controls">
                      <button
                        type="button"
                        className="tour-back"
                        onClick={
                          previous
                        }
                        disabled={
                          step ===
                          0
                        }
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        className="tour-next"
                        onClick={
                          next
                        }
                      >
                        {step ===
                        TOUR_STEPS.length -
                          1
                          ? "Finish tour"
                          : "Next"}

                        <ArrowRight
                          size={
                            14
                          }
                        />
                      </button>
                    </div>

                    <span className="tour-step-count">
                      {step +
                        1}{" "}
                      of{" "}
                      {
                        TOUR_STEPS.length
                      }
                    </span>
                  </aside>
                </div>
              </>
            ) : (
              <div className="tour-finish">
                <div className="tour-finish-icon">
                  <Sparkles
                    size={
                      24
                    }
                  />
                </div>

                <span className="tour-eyebrow">
                  Tour complete
                </span>

                <h2>
                  Ready to put
                  your business
                  inside
                  TOTS-OS?
                </h2>

                <p>
                  Start your
                  14-day free
                  trial and turn
                  the demo you
                  just explored
                  into your own
                  connected
                  business
                  workspace.
                </p>

                <div className="tour-finish-actions">
                  <a
                    href={
                      SIGNUP_URL
                    }
                    className="button-primary button-large"
                  >
                    Start my
                    free trial

                    <ArrowRight
                      size={
                        16
                      }
                    />
                  </a>

                  <button
                    type="button"
                    onClick={
                      closeTour
                    }
                    className="button-secondary button-large"
                  >
                    Maybe later
                  </button>
                </div>

                <span className="tour-finish-note">
                  14 days free ·
                  no commitment ·
                  no card required
                  to explore
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

  const [
    tourOpen,
    setTourOpen,
  ] =
    useState(
      false
    );

  return (
    <div className="tots-root">
      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap');

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

          --sage: #aebf98;
          --sage-dark: #899d73;
          --sage-light: #edf1e7;

          --app-bg: #fbfaf7;
          --app-border: #e5e3dc;
          --app-text: #22211f;

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
          background: var(--cream);
          color: var(--charcoal);

          font-family:
            'DM Sans',
            sans-serif;
        }

        .tots-root * {
          box-sizing: border-box;
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

          line-height: 1.05;
        }

        .tots-root a {
          color: inherit;
        }

        .tots-root button,
        .tots-root a {
          -webkit-tap-highlight-color:
            transparent;
        }

        .tots-root button {
          font-family: inherit;
        }

        .tots-root ::selection {
          background:
            var(--tan);

          color: white;
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

          gap: 9px;

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
          width: 7px;
          height: 7px;

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

          cursor:
            pointer;

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
        }

        button.button-secondary {
          cursor:
            pointer;
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

          top: 0;
          left: 0;
          right: 0;

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
        }

        .tots-hero-pill svg {
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
        }

        .tots-hero-actions button {
          font-family:
            inherit;
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
           CALM
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
           DEMO SECTION
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

        .real-demo-frame {
          overflow:
            hidden;

          border:
            1px solid
            #dedcd5;

          border-radius:
            26px;

          background:
            #ffffff;

          box-shadow:
            0 35px 80px
            rgba(
              40,
              39,
              35,
              .11
            );
        }

        .real-demo-app {
          height:
            710px;

          display:
            grid;

          grid-template-columns:
            165px
            minmax(
              0,
              1fr
            );

          background:
            var(--app-bg);
        }

        /* =====================================================
           DEMO SIDEBAR
        ===================================================== */

        .real-demo-sidebar {
          height:
            100%;

          position:
            relative;

          display:
            flex;

          flex-direction:
            column;

          border-right:
            1px solid
            var(--app-border);

          background:
            #fff;
        }

        .real-demo-logo {
          height:
            82px;

          padding:
            14px;

          display:
            flex;

          align-items:
            center;

          border-bottom:
            1px solid
            transparent;
        }

        .real-demo-nav {
          padding:
            8px 8px
            80px;
        }

        .real-demo-group {
          margin:
            18px 8px
            8px;

          color:
            #aaa79f;

          font-size:
            7px;

          font-weight:
            600;

          letter-spacing:
            .18em;

          text-transform:
            uppercase;
        }

        .real-demo-nav button,
        .real-demo-sidebar-bottom button {
          width:
            100%;

          min-height:
            35px;

          padding:
            0 9px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border:
            0;

          border-radius:
            9px;

          background:
            transparent;

          color:
            #5f5c56;

          font-size:
            9px;

          text-align:
            left;

          cursor:
            pointer;

          transition:
            .18s ease;
        }

        .real-demo-nav button svg,
        .real-demo-sidebar-bottom button svg {
          color:
            #6c6961;
        }

        .real-demo-nav button:hover {
          background:
            #f4f3ee;
        }

        .real-demo-nav button.active,
        .real-demo-sidebar-bottom button.active {
          background:
            var(--sage);

          color:
            white;
        }

        .real-demo-nav button.active svg,
        .real-demo-sidebar-bottom button.active svg {
          color:
            white;
        }

        .real-demo-sidebar-bottom {
          margin-top:
            auto;

          padding:
            10px 8px
            14px;

          border-top:
            1px solid
            var(--app-border);

          background:
            white;
        }

        /* =====================================================
           DEMO CONTENT
        ===================================================== */

        .real-demo-content {
          min-width:
            0;

          overflow:
            auto;

          padding:
            40px 50px
            50px;

          background:
            var(--app-bg);
        }

        .real-home {
          width:
            100%;
        }

        .real-home-top {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .real-date {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          color:
            #9b978e;

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .18em;

          text-transform:
            uppercase;
        }

        .real-date > span {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            var(--sage);
        }

        .real-home-top h3,
        .inside-page-head h3,
        .tour-clarity-head h3 {
          margin-top:
            7px !important;

          font-family:
            'DM Sans',
            sans-serif !important;

          color:
            var(--app-text);

          font-size:
            22px;

          font-style:
            italic;

          font-weight:
            400;

          letter-spacing:
            -.04em;

          line-height:
            1;
        }

        .real-home-top > div:first-child > p,
        .inside-page-head > div > p,
        .tour-clarity-head p {
          margin-top:
            7px !important;

          color:
            #aaa79f;

          font-size:
            8px;

          line-height:
            1.45;
        }

        .clarity-alert {
          min-width:
            205px;

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
            var(--app-border);

          border-radius:
            13px;

          background:
            white;
        }

        .clarity-alert-icon {
          width:
            28px;

          height:
            28px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            8px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);
        }

        .clarity-alert span {
          display:
            block;

          color:
            #9f9b93;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .16em;

          text-transform:
            uppercase;
        }

        .clarity-alert strong {
          display:
            block;

          margin-top:
            3px;

          color:
            #4e4b46;

          font-size:
            8px;

          font-weight:
            600;
        }

        /* =====================================================
           REAL KPI CARDS
        ===================================================== */

        .real-kpis,
        .workspace-stats {
          margin-top:
            18px;

          display:
            grid;

          grid-template-columns:
            repeat(
              6,
              1fr
            );

          gap:
            8px;
        }

        .workspace-stats {
          grid-template-columns:
            repeat(
              4,
              1fr
            );
        }

        .demo-stat {
          min-width:
            0;

          min-height:
            67px;

          padding:
            13px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            12px;

          background:
            white;
        }

        .demo-stat > span {
          display:
            block;

          overflow:
            hidden;

          color:
            #96928a;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }

        .demo-stat > strong {
          display:
            block;

          margin-top:
            8px;

          color:
            #24231f;

          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            17px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .demo-stat small {
          color:
            var(--sage-dark);

          font-size:
            7px;
        }

        /* =====================================================
           MAIN HOME GRID
        ===================================================== */

        .home-main-grid {
          margin-top:
            14px;

          display:
            grid;

          grid-template-columns:
            1.45fr
            1.15fr
            .85fr;

          gap:
            10px;
        }

        .focus-card,
        .coming-card {
          min-height:
            285px;

          padding:
            16px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .real-card-kicker,
        .snapshot-kicker {
          display:
            block;

          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .17em;

          text-transform:
            uppercase;
        }

        .focus-top {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .focus-card h4,
        .coming-card h4,
        .work-queue-card h4,
        .snapshot-card h4,
        .mini-dashboard-card h4,
        .inside-page h4 {
          margin-top:
            5px;

          font-family:
            'DM Sans',
            sans-serif;

          color:
            #24231f;

          font-size:
            18px;

          font-style:
            italic;

          font-weight:
            400;

          letter-spacing:
            -.04em;
        }

        .focus-card > p {
          max-width:
            90%;

          margin-top:
            11px !important;

          color:
            #aaa69f;

          font-size:
            8px;

          line-height:
            1.6;
        }

        .risk-pill {
          padding:
            7px 9px;

          border-radius:
            999px;

          background:
            #fff1ef;

          color:
            #ff4d48;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .11em;

          text-transform:
            uppercase;
        }

        .priority-rows {
          margin-top:
            15px;

          display:
            grid;

          gap:
            6px;
        }

        .priority-row {
          min-height:
            34px;

          padding:
            7px 9px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border-radius:
            9px;

          background:
            #f7f6f2;

          color:
            #4e4b46;

          font-size:
            8px;

          font-weight:
            500;
        }

        .priority-row > span {
          width:
            18px;

          height:
            18px;

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
            #22211f;

          color:
            white;

          font-size:
            6px;
        }

        .sage-action {
          margin-top:
            12px;

          min-height:
            31px;

          padding:
            0 13px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          border:
            0;

          border-radius:
            999px;

          background:
            var(--sage);

          color:
            white;

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }

        .coming-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .coming-head h4 {
          margin:
            0;

          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .coming-head h4 svg {
          color:
            var(--sage);
        }

        .coming-head > span {
          padding:
            8px 13px;

          border-radius:
            999px;

          background:
            var(--sage);

          color:
            white;

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .event-list {
          margin-top:
            13px;

          display:
            grid;

          gap:
            6px;
        }

        .event-row {
          min-height:
            39px;

          display:
            grid;

          grid-template-columns:
            48px 1fr;

          align-items:
            center;

          border-radius:
            10px;

          background:
            #f7f6f2;
        }

        .event-date {
          padding:
            0 8px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          border-right:
            1px solid
            #e6e3dc;
        }

        .event-date strong {
          color:
            var(--sage-dark);

          font-size:
            6px;
        }

        .event-date span {
          margin-top:
            2px;

          color:
            #79766f;

          font-size:
            6px;
        }

        .event-title {
          padding:
            0 10px;

          color:
            #4d4a44;

          font-size:
            8px;

          font-weight:
            600;
        }

        .snapshot-card {
          min-height:
            285px;

          padding:
            17px;

          border-radius:
            18px;

          background:
            #201f1c;

          color:
            white;
        }

        .snapshot-card .snapshot-kicker {
          color:
            var(--sage);
        }

        .snapshot-card h4 {
          color:
            white;
        }

        .snapshot-revenue {
          margin-top:
            18px;
        }

        .snapshot-revenue span,
        .snapshot-grid span {
          display:
            block;

          color:
            rgba(
              255,
              255,
              255,
              .45
            );

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .14em;

          text-transform:
            uppercase;
        }

        .snapshot-revenue strong {
          display:
            block;

          margin-top:
            7px;

          font-size:
            18px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .snapshot-line {
          height:
            1px;

          margin:
            13px 0;

          background:
            rgba(
              255,
              255,
              255,
              .12
            );
        }

        .snapshot-grid {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            17px 12px;
        }

        .snapshot-grid strong {
          display:
            block;

          margin-top:
            7px;

          font-size:
            14px;

          font-weight:
            600;
        }

        /* =====================================================
           WORK QUEUE
        ===================================================== */

        .work-queue-card {
          margin-top:
            14px;

          padding:
            15px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .work-queue-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;
        }

        .quick-task {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .quick-task > span {
          width:
            130px;

          min-height:
            31px;

          padding:
            0 12px;

          display:
            flex;

          align-items:
            center;

          border:
            1px solid
            var(--app-border);

          border-radius:
            999px;

          color:
            #a8a49c;

          font-size:
            7px;
        }

        .quick-task button {
          width:
            31px;

          height:
            31px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            0;

          border-radius:
            8px;

          background:
            #aaa9a4;

          color:
            white;
        }

        .task-strip {
          margin-top:
            10px;

          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              minmax(
                0,
                1fr
              )
            );

          gap:
            6px;
        }

        .task-chip {
          min-width:
            0;

          min-height:
            35px;

          padding:
            7px 8px;

          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            8px;

          background:
            #faf9f6;
        }

        .task-check {
          width:
            13px;

          height:
            13px;

          flex-shrink:
            0;

          border:
            1px solid
            #d7d4cc;

          border-radius:
            3px;

          background:
            white;
        }

        .task-chip strong {
          overflow:
            hidden;

          color:
            #5a5650;

          font-size:
            7px;

          font-weight:
            600;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .task-chip small {
          margin-left:
            auto;

          color:
            #ff4c48;

          font-size:
            5px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        /* =====================================================
           BOTTOM DASHBOARD
        ===================================================== */

        .bottom-dashboard-grid {
          margin-top:
            14px;

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

        .mini-dashboard-card {
          min-height:
            180px;

          padding:
            15px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .mini-dashboard-title {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .mini-dashboard-title h4 {
          margin:
            0;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;
        }

        .mini-dashboard-title h4 svg {
          color:
            var(--sage);
        }

        .mini-dashboard-title button {
          padding:
            7px 12px;

          border:
            0;

          border-radius:
            999px;

          background:
            var(--sage);

          color:
            white;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .mini-project,
        .note-preview,
        .email-preview {
          margin-top:
            10px;

          padding:
            9px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            9px;

          border-radius:
            9px;

          background:
            #f7f6f2;
        }

        .mini-project strong,
        .note-preview strong,
        .email-preview strong {
          display:
            block;

          color:
            #4d4943;

          font-size:
            8px;
        }

        .mini-project span,
        .note-preview span,
        .email-preview span {
          display:
            block;

          margin-top:
            2px;

          color:
            #a4a098;

          font-size:
            6px;
        }

        .mini-progress {
          color:
            var(--sage-dark)
            !important;

          font-size:
            8px !important;

          font-weight:
            700;
        }

        .email-count {
          color:
            #aaa69e;

          font-size:
            7px;
        }

        .email-preview {
          justify-content:
            flex-start;
        }

        .email-avatar {
          width:
            25px;

          height:
            25px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size:
            8px;

          font-weight:
            700;
        }

        /* =====================================================
           OTHER DEMO PAGES
        ===================================================== */

        .inside-page {
          width:
            100%;
        }

        .inside-page-head {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .inside-primary {
          min-height:
            34px;

          padding:
            0 13px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          border:
            0;

          border-radius:
            999px;

          background:
            #22211f;

          color:
            white;

          font-size:
            8px;

          font-weight:
            600;

          cursor:
            pointer;
        }

        .inside-toolbar {
          margin-top:
            25px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .inside-search,
        .inside-filter {
          min-height:
            35px;

          padding:
            0 12px;

          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            10px;

          background:
            white;

          color:
            #9a968e;

          font-size:
            8px;
        }

        .inside-search {
          width:
            min(
              300px,
              60%
            );
        }

        .contact-table {
          margin-top:
            14px;

          overflow:
            hidden;

          border:
            1px solid
            var(--app-border);

          border-radius:
            15px;

          background:
            white;
        }

        .contact-table-head,
        .contact-table-row {
          display:
            grid;

          grid-template-columns:
            1.4fr
            1fr
            .8fr
            .7fr;

          align-items:
            center;

          gap:
            15px;
        }

        .contact-table-head {
          padding:
            11px 14px;

          border-bottom:
            1px solid
            var(--app-border);

          color:
            #a29e96;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .contact-table-row {
          min-height:
            58px;

          padding:
            10px 14px;

          border-bottom:
            1px solid
            #efede8;

          color:
            #6e6a63;

          font-size:
            8px;
        }

        .contact-table-row:last-child {
          border-bottom:
            0;
        }

        .contact-person {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;
        }

        .demo-avatar {
          width:
            30px;

          height:
            30px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size:
            9px;

          font-weight:
            700;
        }

        .contact-person strong {
          color:
            #4e4a44;

          font-size:
            8px;
        }

        .sage-tag {
          width:
            fit-content;

          padding:
            6px 8px;

          border-radius:
            999px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            700;
        }

        .status-dot {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;
        }

        .status-dot i {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            var(--sage);
        }

        .campaign-grid,
        .notes-grid {
          margin-top:
            25px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            12px;
        }

        .campaign-card,
        .note-card,
        .settings-card,
        .social-composer,
        .social-calendar {
          padding:
            18px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            16px;

          background:
            white;
        }

        .campaign-top {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            12px;
        }

        .campaign-metrics {
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
            7px;
        }

        .social-layout {
          margin-top:
            25px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            12px;
        }

        .social-dropzone {
          min-height:
            220px;

          margin-top:
            15px;

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
            #d5d2ca;

          border-radius:
            13px;

          background:
            #faf9f6;

          color:
            #aaa69e;
        }

        .social-dropzone strong {
          color:
            #55514b;

          font-size:
            9px;
        }

        .social-dropzone span {
          font-size:
            7px;
        }

        .scheduled-post {
          margin-top:
            10px;

          padding:
            11px;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          border-radius:
            10px;

          background:
            #f7f6f2;
        }

        .scheduled-post > span {
          width:
            23px;

          height:
            23px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            var(--sage);

          color:
            white;

          font-size:
            7px;
        }

        .scheduled-post strong,
        .scheduled-post small {
          display:
            block;
        }

        .scheduled-post strong {
          color:
            #504c46;

          font-size:
            8px;
        }

        .scheduled-post small {
          margin-top:
            2px;

          color:
            #aaa69e;

          font-size:
            6px;
        }

        .finance-tabs {
          margin-top:
            20px;

          display:
            flex;

          gap:
            7px;

          flex-wrap:
            wrap;
        }

        .finance-tabs span {
          padding:
            8px 12px;

          border-radius:
            999px;

          color:
            #918d84;

          font-size:
            7px;
        }

        .finance-tabs span.active {
          background:
            #22211f;

          color:
            white;
        }

        .finance-overview {
          margin-top:
            18px;

          display:
            grid;

          grid-template-columns:
            1.4fr
            repeat(
              3,
              1fr
            );

          gap:
            10px;
        }

        .finance-dark,
        .finance-metric-card {
          min-height:
            180px;

          padding:
            17px;

          border-radius:
            16px;
        }

        .finance-dark {
          background:
            #22211f;

          color:
            white;
        }

        .finance-dark .snapshot-kicker {
          color:
            var(--sage);
        }

        .finance-dark h4 {
          color:
            white;
        }

        .finance-big {
          display:
            block;

          margin-top:
            30px;

          font-size:
            27px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .finance-small {
          display:
            block;

          margin-top:
            5px;

          color:
            rgba(
              255,
              255,
              255,
              .45
            );

          font-size:
            7px;
        }

        .finance-metric-card {
          border:
            1px solid
            var(--app-border);

          background:
            white;
        }

        .finance-metric-card > span {
          color:
            #9f9b92;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .finance-metric-card strong {
          display:
            block;

          margin-top:
            35px;

          font-size:
            21px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .finance-metric-card small {
          display:
            block;

          margin-top:
            5px;

          color:
            #aaa69e;

          font-size:
            7px;
        }

        .note-card {
          min-height:
            180px;
        }

        .note-card svg {
          color:
            var(--sage-dark);
        }

        .note-card p {
          margin-top:
            10px !important;

          color:
            #99958d;

          font-size:
            8px;

          line-height:
            1.65;
        }

        .project-list {
          margin-top:
            15px;

          overflow:
            hidden;

          border:
            1px solid
            var(--app-border);

          border-radius:
            15px;

          background:
            white;
        }

        .project-row {
          min-height:
            70px;

          padding:
            12px 14px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          border-bottom:
            1px solid
            #efede8;
        }

        .project-row:last-child {
          border-bottom:
            0;
        }

        .project-icon {
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
            10px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);
        }

        .project-copy {
          min-width:
            130px;
        }

        .project-copy strong,
        .project-copy span {
          display:
            block;
        }

        .project-copy strong {
          color:
            #4d4943;

          font-size:
            8px;
        }

        .project-copy span {
          margin-top:
            3px;

          color:
            #aaa69e;

          font-size:
            6px;
        }

        .project-progress-wrap {
          margin-left:
            auto;

          width:
            220px;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;
        }

        .project-progress-bar {
          height:
            5px;

          flex:
            1;

          overflow:
            hidden;

          border-radius:
            999px;

          background:
            #eceae4;
        }

        .project-progress-bar span {
          height:
            100%;

          display:
            block;

          border-radius:
            inherit;

          background:
            var(--sage);
        }

        .project-progress-wrap small {
          width:
            25px;

          color:
            #827e76;

          font-size:
            6px;
        }

        .calendar-demo {
          margin-top:
            25px;

          padding:
            18px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            16px;

          background:
            white;
        }

        .calendar-days {
          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              1fr
            );

          gap:
            7px;
        }

        .calendar-day {
          padding:
            11px;

          border-radius:
            10px;

          background:
            #f7f6f2;

          text-align:
            center;
        }

        .calendar-day span,
        .calendar-day strong {
          display:
            block;
        }

        .calendar-day span {
          color:
            #9e9a91;

          font-size:
            6px;

          text-transform:
            uppercase;
        }

        .calendar-day strong {
          margin-top:
            5px;

          color:
            #47433e;

          font-size:
            13px;
        }

        .calendar-events {
          margin-top:
            15px;

          display:
            grid;

          gap:
            8px;
        }

        .calendar-event {
          min-height:
            38px;

          padding:
            0 12px;

          display:
            flex;

          align-items:
            center;

          border-radius:
            9px;

          background:
            #f3f1eb;

          color:
            #625e57;

          font-size:
            8px;
        }

        .calendar-event.sage {
          background:
            var(--sage-light);

          color:
            #647653;
        }

        .calendar-event.dark {
          background:
            #22211f;

          color:
            white;
        }

        .settings-card {
          margin-top:
            25px;
        }

        .settings-fields {
          margin-top:
            18px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            10px;
        }

        .settings-fields label {
          display:
            block;

          color:
            #9e9a92;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .setting-field {
          margin-top:
            6px;

          min-height:
            38px;

          padding:
            0 11px;

          display:
            flex;

          align-items:
            center;

          border:
            1px solid
            var(--app-border);

          border-radius:
            9px;

          color:
            #6b675f;

          font-size:
            8px;
        }

        /* =====================================================
           MOBILE DEMO TABS
        ===================================================== */

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

          font-size:
            9px;

          cursor:
            pointer;
        }

        .demo-mobile-tabs button.active {
          border-color:
            rgba(
              142,
              163,
              119,
              .5
            );

          background:
            var(--sage-light);

          color:
            #6c7e5a;
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
              142,
              163,
              119,
              .28
            );

          border-radius:
            24px;

          background:
            #f8faf4;
        }

        .demo-cta > div:first-child > span {
          color:
            var(--sage-dark);

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
            640px;

          margin-top:
            9px;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.65;
        }

        .demo-cta-actions {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          flex-shrink:
            0;
        }

        /* =====================================================
           GUIDED TOUR
        ===================================================== */

        .tour-overlay {
          position:
            fixed;

          inset:
            0;

          z-index:
            1000;

          padding:
            20px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            rgba(
              24,
              24,
              22,
              .72
            );

          backdrop-filter:
            blur(
              15px
            );
        }

        .tour-window {
          width:
            min(
              1380px,
              100%
            );

          height:
            min(
              850px,
              calc(
                100vh -
                40px
              )
            );

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          border-radius:
            28px;

          background:
            #f7f5ef;

          box-shadow:
            0 40px 120px
            rgba(
              0,
              0,
              0,
              .3
            );
        }

        .tour-topbar {
          height:
            70px;

          padding:
            0 22px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border-bottom:
            1px solid
            #e3e0d8;

          background:
            #faf8f3;
        }

        .tour-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            12px;
        }

        .tour-free-pill {
          padding:
            6px 10px;

          border-radius:
            999px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size:
            8px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .tour-close {
          width:
            38px;

          height:
            38px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            #ddd9d1;

          border-radius:
            50%;

          background:
            white;

          color:
            #4a4741;

          cursor:
            pointer;
        }

        .tour-layout {
          height:
            calc(
              100% -
              70px
            );

          display:
            grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            360px;
        }

        .tour-product {
          min-width:
            0;

          overflow:
            auto;

          padding:
            22px;

          background:
            #eeece6;
        }

        .tour-mini-app {
          min-width:
            900px;

          min-height:
            650px;

          display:
            grid;

          grid-template-columns:
            145px
            1fr;

          overflow:
            hidden;

          border:
            1px solid
            #ddd9d1;

          border-radius:
            18px;

          background:
            var(--app-bg);
        }

        .tour-mini-app
        .real-demo-sidebar {
          min-height:
            650px;
        }

        .tour-demo-content {
          padding:
            32px 38px;

          background:
            var(--app-bg);
        }

        .tour-guide {
          padding:
            34px;

          display:
            flex;

          flex-direction:
            column;

          border-left:
            1px solid
            #e0ddd6;

          background:
            #fff;
        }

        .tour-progress {
          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              1fr
            );

          gap:
            5px;
        }

        .tour-progress span {
          height:
            3px;

          border-radius:
            999px;

          background:
            #ece9e2;
        }

        .tour-progress span.active {
          background:
            var(--sage);
        }

        .tour-eyebrow {
          display:
            block;

          margin-top:
            35px;

          color:
            var(--sage-dark);

          font-size:
            9px;

          font-weight:
            700;

          letter-spacing:
            .14em;

          text-transform:
            uppercase;
        }

        .tour-guide h2,
        .tour-finish h2 {
          margin-top:
            14px;

          color:
            #252421;

          font-size:
            34px;

          font-weight:
            500;

          line-height:
            1.08;
        }

        .tour-guide > p,
        .tour-finish > p {
          margin-top:
            17px;

          color:
            #7d7971;

          font-size:
            14px;

          line-height:
            1.75;
        }

        .tour-callout {
          margin-top:
            22px;

          padding:
            15px;

          display:
            flex;

          gap:
            10px;

          border:
            1px solid
            #dce4d2;

          border-radius:
            15px;

          background:
            var(--sage-light);

          color:
            #60724e;
        }

        .tour-callout strong,
        .tour-callout span {
          display:
            block;
        }

        .tour-callout strong {
          font-size:
            11px;
        }

        .tour-callout span {
          margin-top:
            5px;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .tour-controls {
          margin-top:
            auto;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .tour-back,
        .tour-next {
          min-height:
            43px;

          padding:
            0 17px;

          border-radius:
            999px;

          font-size:
            11px;

          font-weight:
            600;

          cursor:
            pointer;
        }

        .tour-back {
          border:
            1px solid
            #dfdcd5;

          background:
            white;

          color:
            #77736c;
        }

        .tour-back:disabled {
          opacity:
            .35;

          cursor:
            default;
        }

        .tour-next {
          margin-left:
            auto;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          border:
            1px solid
            #252421;

          background:
            #252421;

          color:
            white;
        }

        .tour-step-count {
          margin-top:
            15px;

          color:
            #a19d95;

          font-size:
            9px;

          text-align:
            right;
        }

        /* =====================================================
           TOUR CLARITY SCREEN
        ===================================================== */

        .tour-clarity-screen {
          padding:
            5px 0;
        }

        .tour-clarity-head {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .clarity-orb {
          width:
            46px;

          height:
            46px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            14px;

          background:
            #22211f;

          color:
            var(--sage);
        }

        .tour-chat {
          max-width:
            720px;

          margin:
            35px auto
            0;
        }

        .tour-user-message {
          width:
            fit-content;

          max-width:
            70%;

          margin-left:
            auto;

          padding:
            13px 15px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            15px 15px
            4px 15px;

          background:
            white;

          color:
            #5d5952;

          font-size:
            10px;
        }

        .tour-ai-message {
          max-width:
            88%;

          margin-top:
            12px;

          padding:
            16px;

          border:
            1px solid
            #dce4d2;

          border-radius:
            4px 15px
            15px 15px;

          background:
            #f3f6ee;
        }

        .tour-ai-label {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          color:
            var(--sage-dark);

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .tour-ai-message > p {
          margin-top:
            9px;

          color:
            #625e57;

          font-size:
            10px;

          line-height:
            1.65;
        }

        .tour-ai-priority {
          margin-top:
            8px;

          padding:
            9px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border:
            1px solid
            #e0e5d9;

          border-radius:
            9px;

          background:
            rgba(
              255,
              255,
              255,
              .72
            );
        }

        .tour-ai-priority > span {
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

          border-radius:
            50%;

          background:
            var(--sage);

          color:
            white;

          font-size:
            7px;
        }

        .tour-ai-priority strong,
        .tour-ai-priority small {
          display:
            block;
        }

        .tour-ai-priority strong {
          color:
            #514d47;

          font-size:
            8px;
        }

        .tour-ai-priority small {
          margin-top:
            2px;

          color:
            #99958d;

          font-size:
            6px;
        }

        /* =====================================================
           TOUR FINISH
        ===================================================== */

        .tour-finish {
          height:
            calc(
              100% -
              70px
            );

          padding:
            50px 30px;

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

          background:
            radial-gradient(
              circle at center,
              #f2f5ed,
              #f8f6f1
              55%,
              #f3f0e9
            );
        }

        .tour-finish-icon {
          width:
            58px;

          height:
            58px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            18px;

          background:
            #22211f;

          color:
            var(--sage);
        }

        .tour-finish .tour-eyebrow {
          margin-top:
            24px;
        }

        .tour-finish h2 {
          max-width:
            650px;

          font-size:
            clamp(
              2.7rem,
              5vw,
              4.7rem
            );

          text-align:
            center;
        }

        .tour-finish > p {
          max-width:
            560px;
        }

        .tour-finish-actions {
          margin-top:
            28px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;

          flex-wrap:
            wrap;
        }

        .tour-finish-note {
          margin-top:
            17px;

          color:
            #9c988f;

          font-size:
            9px;
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

          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .real-demo-app {
            grid-template-columns:
              125px
              minmax(
                0,
                1fr
              );

            height:
              660px;
          }

          .real-demo-content {
            padding:
              30px 25px;
          }

          .home-main-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .snapshot-card {
            grid-column:
              1 / -1;

            min-height:
              auto;
          }

          .snapshot-grid {
            grid-template-columns:
              repeat(
                4,
                1fr
              );
          }

          .task-strip {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

          .bottom-dashboard-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .finance-overview {
            grid-template-columns:
              1fr 1fr;
          }

          .tour-layout {
            grid-template-columns:
              minmax(
                0,
                1fr
              )
              320px;
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

          .tots-hero-title {
            max-width:
              620px;

            font-size:
              clamp(
                3rem,
                12vw,
                4.5rem
              ) !important;
          }

          .tots-hero-copy {
            max-width:
              550px;

            font-size:
              15px;
          }

          .tots-hero-actions {
            max-width:
              520px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .tots-hero-actions a,
          .tots-hero-actions button {
            width:
              100%;
          }

          .calm-card {
            padding:
              48px 20px;
          }

          .transform-grid,
          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr;
          }

          .real-demo-frame {
            overflow-x:
              auto;
          }

          .real-demo-app {
            width:
              920px;

            grid-template-columns:
              130px 790px;
          }

          .demo-cta {
            padding:
              22px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .demo-cta-actions {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .demo-cta-actions a,
          .demo-cta-actions button {
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

          .tour-overlay {
            padding:
              8px;
          }

          .tour-window {
            height:
              calc(
                100vh -
                16px
              );

            border-radius:
              20px;
          }

          .tour-layout {
            height:
              calc(
                100% -
                60px
              );

            display:
              flex;

            flex-direction:
              column;
          }

          .tour-topbar {
            height:
              60px;

            padding:
              0 14px;
          }

          .tour-product {
            height:
              52%;

            flex-shrink:
              0;

            padding:
              12px;
          }

          .tour-guide {
            min-height:
              48%;

            padding:
              20px;

            border-left:
              0;

            border-top:
              1px solid
              #e0ddd6;

            overflow:
              auto;
          }

          .tour-guide .tour-eyebrow {
            margin-top:
              18px;
          }

          .tour-guide h2 {
            font-size:
              26px;
          }

          .tour-guide > p {
            font-size:
              12px;
          }

          .tour-controls {
            margin-top:
              20px;
          }

          .tour-finish {
            height:
              calc(
                100% -
                60px
              );

            padding:
              30px 18px;
          }

          .tour-finish-actions {
            width:
              100%;

            flex-direction:
              column;
          }

          .tour-finish-actions a,
          .tour-finish-actions button {
            width:
              100%;
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
          }

          .trusted-list span {
            font-size:
              9px;

            padding:
              7px 9px;
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
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
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
              href={
                SIGNUP_URL
              }
              className="button-secondary"
            >
              <LogIn
                size={
                  14
                }
              />

              Log in
            </a>

            <a
              href={
                SIGNUP_URL
              }
              className="button-primary"
            >
              Start free

              <ArrowRight
                size={
                  14
                }
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
            <Menu
              size={
                18
              }
            />
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
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
          >
            <motion.div
              className="mobile-menu"
              initial={{
                y:
                  -20,
                opacity:
                  0,
              }}
              animate={{
                y:
                  0,
                opacity:
                  1,
              }}
            >
              <div className="mobile-menu-head">
                <Logo
                  size={
                    35
                  }
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
                  <X
                    size={
                      18
                    }
                  />
                </button>
              </div>

              <div className="mobile-links">
                {NAV_ITEMS.map(
                  (
                    item
                  ) => (
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
                    >
                      {
                        item.label
                      }

                      <ArrowUpRight
                        size={
                          15
                        }
                      />
                    </a>
                  )
                )}
              </div>

              <div className="mobile-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setMobileMenuOpen(
                      false
                    );

                    setTourOpen(
                      true
                    );
                  }}
                >
                  Take free tour
                </button>

                <a
                  href={
                    SIGNUP_URL
                  }
                  className="button-primary"
                >
                  Start my free
                  trial
                </a>

                <a
                  href={
                    SIGNUP_URL
                  }
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
              opacity:
                0,
              y:
                10,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            transition={{
              duration:
                0.6,
            }}
            className="tots-hero-pill"
          >
            <Sparkles
              size={
                13
              }
            />

            One calmer place to
            run your business
          </motion.div>

          <motion.h1
            className="tots-hero-title"
            initial={{
              opacity:
                0,
              y:
                20,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
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
              opacity:
                0,
              y:
                18,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
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
              opacity:
                0,
              y:
                16,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            transition={{
              duration:
                0.75,
              delay:
                0.18,
            }}
          >
            <a
              href={
                SIGNUP_URL
              }
              className="button-primary button-large"
            >
              Start my free trial

              <ArrowRight
                size={
                  16
                }
              />
            </a>

            <button
              type="button"
              onClick={() =>
                setTourOpen(
                  true
                )
              }
              className="button-secondary button-large"
            >
              <Play
                size={
                  14
                }
              />

              Take the free tour
            </button>

            <a
              href="#demo"
              className="button-secondary button-large"
            >
              Explore demo
            </a>
          </motion.div>

          <motion.div
            className="tots-hero-note"
            initial={{
              opacity:
                0,
              y:
                12,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            transition={{
              duration:
                0.7,
              delay:
                0.24,
            }}
          >
            <span>
              <Check
                size={
                  12
                }
              />
              14 days free
            </span>

            <span>
              <Check
                size={
                  12
                }
              />
              No commitment
            </span>

            <span>
              <Check
                size={
                  12
                }
              />
              Set up in minutes
            </span>
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          TRUSTED
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
                    key={
                      name
                    }
                  >
                    {
                      name
                    }
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
                    key={
                      item
                    }
                  >
                    {
                      item
                    }
                  </span>
                )
              )}
            </div>

            <div className="calm-line">
              TOTS-OS gives it all
              one calm home.
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
              One business. One
              place.
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
                        key={
                          item
                        }
                      >
                        <X
                          size={
                            14
                          }
                        />

                        {
                          item
                        }
                      </div>
                    )
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal
              delay={
                0.08
              }
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
                        key={
                          item
                        }
                      >
                        <Check
                          size={
                            14
                          }
                        />

                        {
                          item
                        }
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
                    key={
                      item.title
                    }
                    delay={
                      index *
                      0.06
                    }
                  >
                    <div className="why-card">
                      <div className="why-icon">
                        <Icon
                          size={
                            19
                          }
                        />
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

      {/* ======================================================
          DEMO
      ====================================================== */}

      <section className="tots-section soft">
        <div className="tots-container">
          <Reveal>
            <div className="demo-section-head">
              <Eyebrow>
                See the real
                workspace
              </Eyebrow>

              <h2 className="section-title">
                Have a proper
                look around.
              </h2>

              <p className="section-copy">
                This demo follows
                the same layout and
                design as the real
                TOTS-OS workspace.
                Click through the
                sidebar to explore
                the different
                areas.
              </p>
            </div>
          </Reveal>

          <ProductDemo
            onStartTour={() =>
              setTourOpen(
                true
              )
            }
          />
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
                    key={
                      feature.id
                    }
                    delay={
                      (index %
                        3) *
                      0.05
                    }
                  >
                    <div className="feature-card">
                      <div className="feature-icon">
                        <Icon
                          size={
                            20
                          }
                        />
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

      {/* ======================================================
          CONNECTED
      ====================================================== */}

      <section className="tots-section soft">
        <div className="tots-container connected-layout">
          <Reveal>
            <Eyebrow>
              Connected by design
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
            delay={
              0.1
            }
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
                      key={
                        item.label
                      }
                    >
                      <Icon
                        size={
                          21
                        }
                      />

                      <span>
                        {
                          item.label
                        }
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
                      key={
                        item
                      }
                    >
                      <div className="clarity-check">
                        <Check
                          size={
                            12
                          }
                        />
                      </div>

                      {
                        item
                      }
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setTourOpen(
                    true
                  )
                }
                className="button-primary"
                style={{
                  marginTop:
                    28,
                }}
              >
                <Sparkles
                  size={
                    14
                  }
                />

                Take the Clarity
                tour
              </button>
            </Reveal>

            <Reveal
              delay={
                0.1
              }
            >
              <div className="clarity-demo">
                <div className="clarity-demo-head">
                  <div className="clarity-brand">
                    <Sparkles
                      size={
                        14
                      }
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
                  size={
                    22
                  }
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
              delay={
                0.05
              }
            >
              <div className="security-card">
                <ShieldCheck
                  size={
                    22
                  }
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
              delay={
                0.1
              }
            >
              <div className="security-card">
                <RefreshCw
                  size={
                    22
                  }
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
                size={
                  12
                }
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
                  key={
                    plan.name
                  }
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
                        {
                          plan.name
                        }
                      </span>

                      {plan.badge && (
                        <span className="price-badge">
                          {
                            plan.badge
                          }
                        </span>
                      )}
                    </div>

                    <div className="price-figure">
                      <span className="price-amount">
                        £
                        {
                          plan.price
                        }
                      </span>

                      <span className="price-period">
                        /month
                      </span>
                    </div>

                    <p className="price-description">
                      {
                        plan.description
                      }
                    </p>

                    <div className="price-features">
                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <div
                            className="price-feature"
                            key={
                              feature
                            }
                          >
                            <Check
                              size={
                                13
                              }
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

                    <div className="price-action">
                      <a
                        href={
                          SIGNUP_URL
                        }
                        className={
                          plan.featured
                            ? "button-primary"
                            : "button-secondary"
                        }
                      >
                        Start free

                        <ArrowRight
                          size={
                            14
                          }
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
            delay={
              0.08
            }
          >
            <div className="about-card">
              <p>
                We&apos;re Sam and
                Leigha, the team
                behind The
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
                    key={
                      faq.q
                    }
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
                      >
                        <ChevronDown
                          size={
                            17
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
                          {
                            faq.a
                          }
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
                  size={
                    23
                  }
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
                  href={
                    SIGNUP_URL
                  }
                  className="button-primary button-large"
                >
                  Start my free
                  trial

                  <ArrowRight
                    size={
                      16
                    }
                  />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setTourOpen(
                      true
                    )
                  }
                  className="button-secondary button-large"
                >
                  <Play
                    size={
                      14
                    }
                  />

                  Take free tour
                </button>
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
              size={
                40
              }
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
              <a
                href={
                  SIGNUP_URL
                }
              >
                Log in
              </a>

              <a
                href={
                  SIGNUP_URL
                }
              >
                Create account
              </a>

              <a href="/manage-subscription">
                Manage
                subscription
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

      {/* ======================================================
          GUIDED FREE TOUR
      ====================================================== */}

      <GuidedTour
        open={
          tourOpen
        }
        onClose={() =>
          setTourOpen(
            false
          )
        }
      />
    </div>
  );
}