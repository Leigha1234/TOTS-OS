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
  Folder,
  FolderKanban,
  Gauge,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  Link2,
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
  Upload,
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
  screen: DemoKey | "clarity";
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
   DEMO NAV
============================================================ */

const DEMO_NAV: {
  key: DemoKey;
  label: string;
  icon: LucideIcon;
  group?: string;
}[] = [
  {
    key: "home",
    label: "Home",
    icon: LayoutDashboard,
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
  },
  {
    key: "social",
    label: "Social",
    icon: MessageSquareText,
  },
  {
    key: "finance",
    label: "Finance",
    icon: CircleDollarSign,
  },
  {
    key: "notes",
    label: "Notes",
    icon: NotebookPen,
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
];

/* ============================================================
   TOUR
============================================================ */

const TOUR_STEPS: TourStep[] = [
  {
    key: "home",
    screen: "home",
    eyebrow: "01 · Home",
    title:
      "Start with the whole business in view.",
    text:
      "The home dashboard brings together business health, tasks, projects, your schedule, invoices, revenue and the areas that need your attention.",
  },
  {
    key: "contacts",
    screen: "contacts",
    eyebrow: "02 · Contacts",
    title:
      "Every business relationship in one place.",
    text:
      "Keep clients, partners and contacts organised without searching through messages, email threads and notes.",
  },
  {
    key: "campaigns",
    screen: "campaigns",
    eyebrow: "03 · Campaigns",
    title:
      "Email marketing lives inside the business too.",
    text:
      "Create campaigns, organise audiences and keep track of what has been sent, queued and drafted.",
  },
  {
    key: "social",
    screen: "social",
    eyebrow: "04 · Social Studio",
    title:
      "Create content without leaving your workspace.",
    text:
      "Upload content, draft captions, generate ideas and organise your social workflow alongside everything else happening in the business.",
  },
  {
    key: "finance",
    screen: "finance",
    eyebrow: "05 · Finance",
    title:
      "See the financial position without rebuilding it.",
    text:
      "Invoices, quotes, expenses, VAT, tax, payroll and your wider financial position are brought together in the Finance control centre.",
  },
  {
    key: "notes",
    screen: "notes",
    eyebrow: "06 · Notes & tasks",
    title:
      "Your digital notepad, without the chaos.",
    text:
      "Use notes and task boards for the small things that usually end up forgotten in a notebook, phone note or your head.",
  },
  {
    key: "workspace",
    screen: "workspace",
    eyebrow: "07 · Workspace",
    title:
      "Connect clients to the work you're delivering.",
    text:
      "Workspace gives you a commercial view of clients and projects, including active work, overdue items and project value.",
  },
  {
    key: "calendar",
    screen: "calendar",
    eyebrow: "08 · Calendar",
    title:
      "Bookings, availability and schedule together.",
    text:
      "Manage events, upcoming commitments, availability and your public booking page from the same business system.",
  },
  {
    key: "settings",
    screen: "settings",
    eyebrow: "09 · Settings",
    title:
      "Your own branded workspace.",
    text:
      "Manage your profile, organisation, company branding, subscription and account settings from one place.",
  },
  {
    key: "clarity",
    screen: "clarity",
    eyebrow: "10 · Clarity AI",
    title:
      "Then ask your business what needs attention.",
    text:
      "Clarity uses the context already inside TOTS-OS to surface priorities, overdue work, financial signals and the next things worth focusing on.",
  },
];

/* ============================================================
   SHARED COMPONENTS
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
          <strong>
            TOTS-OS
          </strong>

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

function DemoMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="app-metric">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

function DemoSidebar({
  active,
  interactive = true,
  onChange,
}: {
  active: DemoKey;
  interactive?: boolean;
  onChange?: (
    key: DemoKey
  ) => void;
}) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-logo">
        <Logo
          size={42}
          showWordmark={false}
        />
      </div>

      <div className="app-sidebar-nav">
        {DEMO_NAV.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            const previous =
              DEMO_NAV[
                index - 1
              ];

            const showGroup =
              item.group &&
              item.group !==
                previous?.group;

            return (
              <div
                key={
                  item.key
                }
              >
                {showGroup && (
                  <div className="app-nav-group">
                    {
                      item.group
                    }
                  </div>
                )}

                <button
                  type="button"
                  className={`app-nav-item ${
                    active ===
                    item.key
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      interactive &&
                      onChange
                    ) {
                      onChange(
                        item.key
                      );
                    }
                  }}
                >
                  <Icon
                    size={15}
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

      <div className="app-sidebar-bottom">
        <button
          type="button"
          className={`app-nav-item ${
            active ===
            "settings"
              ? "active"
              : ""
          }`}
          onClick={() => {
            if (
              interactive &&
              onChange
            ) {
              onChange(
                "settings"
              );
            }
          }}
        >
          <SettingsIcon
            size={15}
          />

          <span>
            Settings
          </span>
        </button>

        <button
          type="button"
          className="app-nav-item logout"
        >
          <LogIn
            size={15}
          />

          <span>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   HOME
============================================================ */

function DemoHome() {
  return (
    <div className="app-page home-page">
      <div className="home-header">
        <div>
          <div className="app-kicker">
            <span />
            Saturday, 22 August 2026
          </div>

          <h2>
            Good afternoon.
          </h2>

          <p>
            Here&apos;s everything
            happening across
            North &amp; Pine Studio.
          </p>
        </div>

        <div className="home-clarity-alert">
          <div className="home-clarity-icon">
            <Sparkles
              size={13}
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

      <div className="home-metrics">
        <DemoMetric
          label="Health"
          value="78%"
        />

        <DemoMetric
          label="Open tasks"
          value="14"
        />

        <DemoMetric
          label="Projects"
          value="3"
        />

        <DemoMetric
          label="Today"
          value="2"
        />

        <DemoMetric
          label="Invoices due"
          value="2"
        />

        <DemoMetric
          label="Revenue"
          value="£12,480"
        />
      </div>

      <div className="home-dashboard-grid">
        <div className="focus-panel">
          <div className="focus-title-row">
            <div>
              <span className="green-label">
                Focus
              </span>

              <h3>
                Today&apos;s
                priorities
              </h3>
            </div>

            <span className="high-risk">
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

          <div className="priority-list-real">
            {[
              "Send proposal to Bennett Interiors",
              "Check outstanding invoices",
              "Review Website Refresh project delivery",
            ].map(
              (
                item,
                index
              ) => (
                <div
                  className="priority-real"
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
            className="sage-pill-button"
          >
            View Clarity brief

            <ArrowRight
              size={12}
            />
          </button>
        </div>

        <div className="coming-panel">
          <div className="coming-heading">
            <h3>
              <CalendarDays
                size={15}
              />

              Coming up
            </h3>

            <span>
              Calendar
            </span>
          </div>

          <div className="coming-events">
            {[
              [
                "MON",
                "10:00",
                "Call with Amelia Hart",
              ],
              [
                "MON",
                "14:00",
                "Design review with Maya Collins",
              ],
              [
                "TUE",
                "09:30",
                "Reed Wellness kickoff",
              ],
              [
                "WED",
                "11:00",
                "James Property Group review",
              ],
              [
                "THU",
                "16:00",
                "Strategy session",
              ],
            ].map(
              (
                event
              ) => (
                <div
                  className="coming-event"
                  key={
                    event.join(
                      "-"
                    )
                  }
                >
                  <div className="coming-date">
                    <strong>
                      {
                        event[
                          0
                        ]
                      }
                    </strong>

                    <small>
                      {
                        event[
                          1
                        ]
                      }
                    </small>
                  </div>

                  <span>
                    {
                      event[
                        2
                      ]
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="snapshot-panel">
          <span className="green-label">
            Snapshot
          </span>

          <h3>
            Business now
          </h3>

          <div className="snapshot-revenue">
            <span>
              Paid revenue
            </span>

            <strong>
              £12,480
            </strong>
          </div>

          <div className="snapshot-divider" />

          <div className="snapshot-mini-grid">
            <div>
              <span>
                Team
              </span>

              <strong>
                3
              </strong>
            </div>

            <div>
              <span>
                Emails
              </span>

              <strong>
                8
              </strong>
            </div>

            <div>
              <span>
                Projects
              </span>

              <strong>
                3
              </strong>
            </div>

            <div>
              <span>
                Events
              </span>

              <strong>
                12
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="work-queue">
        <div className="work-queue-title">
          <div>
            <span className="green-label">
              Work queue
            </span>

            <h3>
              Priority tasks
            </h3>
          </div>

          <div className="add-task-demo">
            <span>
              Add task...
            </span>

            <button>
              <Plus
                size={13}
              />
            </button>
          </div>
        </div>

        <div className="task-chip-grid">
          {[
            "Send James Property invoice",
            "Draft newsletter campaign",
            "Upload Reed Wellness moodboard",
            "Schedule Maya Collins meeting",
            "Review project tasks",
          ].map(
            (
              task,
              index
            ) => (
              <div
                className="task-demo-chip"
                key={
                  task
                }
              >
                <i />

                <strong>
                  {
                    task
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
          className="sage-pill-button"
        >
          View all 14 tasks

          <ArrowRight
            size={12}
          />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CONTACTS
============================================================ */

function DemoContacts() {
  const contacts = [
    {
      name: "Amelia Hart",
      org: "HART & CO",
      type: "CLIENT",
    },
    {
      name: "Noah Bennett",
      org: "BENNETT INTERIORS",
      type: "CLIENT",
    },
    {
      name: "Sophie Reed",
      org: "REED WELLNESS",
      type: "CLIENT",
    },
    {
      name: "Oliver James",
      org: "JAMES PROPERTY GROUP",
      type: "CLIENT",
    },
    {
      name: "Maya Collins",
      org: "COLLINS CREATIVE",
      type: "PARTNER",
    },
  ];

  return (
    <div className="app-page contacts-page">
      <div className="contacts-top">
        <h2>
          Contacts
        </h2>

        <div className="contacts-actions">
          <div className="contact-search">
            <Search
              size={14}
            />

            Search ...
          </div>

          <button className="square-black-button">
            <Plus
              size={20}
            />
          </button>
        </div>
      </div>

      <div className="contact-list-real">
        {contacts.map(
          (
            contact
          ) => (
            <div
              className="contact-row-real"
              key={
                contact.name
              }
            >
              <div className="contact-signal">
                <span>
                  (•)
                </span>
              </div>

              <div className="contact-main">
                <strong>
                  {
                    contact.name
                  }
                </strong>

                <div>
                  <span>
                    {
                      contact.org
                    }
                  </span>

                  <b>
                    {
                      contact.type
                    }
                  </b>
                </div>
              </div>

              <div className="contact-next">
                <ChevronRight
                  size={16}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CAMPAIGNS
============================================================ */

function DemoCampaigns() {
  return (
    <div className="app-page campaign-page">
      <div className="campaign-header-real">
        <div>
          <span className="green-label">
            Marketing
          </span>

          <h2>
            Email Campaigns
          </h2>

          <p>
            Create, schedule and
            track email campaigns
            from one place.
          </p>
        </div>

        <button className="black-wide-button">
          <Plus
            size={14}
          />

          Create campaign
        </button>
      </div>

      <div className="campaign-toolbar">
        <span className="sage-tab">
          Campaigns
        </span>

        <button className="sage-small-button">
          <RefreshCw
            size={12}
          />

          Refresh
        </button>
      </div>

      <div className="campaign-metric-grid">
        <DemoMetric
          label="Campaigns"
          value="3"
        />

        <DemoMetric
          label="Sent"
          value="1"
        />

        <DemoMetric
          label="Audiences"
          value="4"
        />

        <DemoMetric
          label="Subscribers"
          value="185"
        />
      </div>

      <div className="campaign-table">
        <div className="campaign-table-head">
          <span>
            Campaign
          </span>

          <span>
            Audience
          </span>

          <span>
            Status
          </span>

          <span>
            Results
          </span>

          <span />
        </div>

        <div className="campaign-table-row">
          <div>
            <strong>
              Studio Launch
            </strong>

            <small>
              Introducing the new
              North &amp; Pine Studio
              collection
            </small>
          </div>

          <span>
            Clients &amp; Partners
          </span>

          <b className="status-blue">
            Queued
          </b>

          <span className="muted-result">
            22 Aug 2026
            at 12:45
          </span>

          <ChevronRight
            size={14}
          />
        </div>

        <div className="campaign-table-row">
          <div>
            <strong>
              August Updates
            </strong>

            <small>
              Monthly news,
              projects and
              studio updates
            </small>
          </div>

          <span>
            Newsletter
          </span>

          <b className="status-green">
            Sent
          </b>

          <span>
            <strong>
              48%
            </strong>{" "}
            open &nbsp;

            <strong>
              12%
            </strong>{" "}
            click
          </span>

          <ChevronRight
            size={14}
          />
        </div>

        <div className="campaign-table-row">
          <div>
            <strong>
              Autumn Offers
            </strong>

            <small>
              Early autumn
              campaign draft
            </small>
          </div>

          <span>
            Prospects
          </span>

          <b className="status-grey">
            Draft
          </b>

          <span className="muted-result">
            28 Aug 2026
            at 09:30
          </span>

          <ChevronRight
            size={14}
          />
        </div>
      </div>

      <div className="audience-heading">
        <div>
          <span className="green-label">
            Audiences
          </span>

          <p>
            Your subscriber
            lists
          </p>
        </div>

        <button className="outline-mini-button">
          <Plus
            size={12}
          />

          New list
        </button>
      </div>

      <div className="audience-grid">
        {[
          [
            "Newsletter",
            "108 subscribers",
          ],
          [
            "Clients & Partners",
            "51 subscribers",
          ],
          [
            "Prospects",
            "26 subscribers",
          ],
        ].map(
          (
            item
          ) => (
            <div
              className="audience-card"
              key={
                item[
                  0
                ]
              }
            >
              <span className="hash-icon">
                #
              </span>

              <div>
                <strong>
                  {
                    item[
                      0
                    ]
                  }
                </strong>

                <small>
                  {
                    item[
                      1
                    ]
                  }
                </small>
              </div>

              <ChevronRight
                size={14}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SOCIAL
============================================================ */

function DemoSocial() {
  return (
    <div className="app-page social-page">
      <div className="social-topbar">
        <div className="social-brand-real">
          <div className="social-brand-icon">
            <Layers3
              size={18}
            />
          </div>

          <div>
            <span className="green-label">
              TOTS-OS
            </span>

            <h2>
              Social Studio
            </h2>
          </div>
        </div>

        <div className="social-mode-tabs">
          <button className="active">
            Create
          </button>

          <button>
            <Sparkles
              size={12}
            />

            Ideas
          </button>

          <button>
            Planner
          </button>
        </div>

        <div className="social-ready">
          <span />

          Ready
        </div>
      </div>

      <div className="social-divider" />

      <div className="social-heading-real">
        <div>
          <span className="green-label">
            Create content
          </span>

          <h3>
            What are we
            posting?
          </h3>

          <p>
            Write something
            yourself or let
            TOTS-OS create the
            starting point from
            what Clarity already
            knows about your
            business.
          </p>
        </div>

        <button className="sage-ideas-button">
          <Sparkles
            size={13}
          />

          Give me ideas
        </button>
      </div>

      <div className="social-create-grid">
        <div className="social-upload-card">
          <span className="upload-card-label">
            <ImageIcon
              size={12}
            />

            Photo or video
          </span>

          <div className="upload-dropzone">
            <div className="upload-icon">
              <Upload
                size={18}
              />
            </div>

            <strong>
              Add your content
            </strong>

            <span>
              Upload an image
              or video
            </span>
          </div>

          <div className="caption-label">
            <span>
              Caption
            </span>

            <span>
              0 characters
            </span>
          </div>

          <div className="caption-box">
            What do you want
            to say?
          </div>
        </div>

        <div className="social-destination-card">
          <h4>
            Where should it
            go?
          </h4>

          <p>
            Choose where your
            content will be
            published.
          </p>

          <div className="coming-soon-box">
            <strong>
              Social Studio
            </strong>

            <span>
              Keep your content
              planning alongside
              the rest of your
              business.
            </span>
          </div>

          {[
            [
              "Instagram",
              "@northandpinestudio",
            ],
            [
              "TikTok",
              "@northandpine",
            ],
            [
              "Facebook",
              "North & Pine Studio",
            ],
            [
              "LinkedIn",
              "North & Pine Studio",
            ],
          ].map(
            (
              platform
            ) => (
              <div
                className="platform-row"
                key={
                  platform[
                    0
                  ]
                }
              >
                <div>
                  <strong>
                    {
                      platform[
                        0
                      ]
                    }
                  </strong>

                  <small>
                    {
                      platform[
                        1
                      ]
                    }
                  </small>
                </div>

                <span className="platform-radio" />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   FINANCE
============================================================ */

function DemoFinance() {
  const financeMetrics = [
    {
      label: "Net position",
      value: "£18,640",
    },
    {
      label: "Outstanding",
      value: "£4,250",
    },
    {
      label: "VAT owed",
      value: "£1,486",
    },
    {
      label: "Tax exposure",
      value: "£3,720",
    },
  ];

  return (
    <div className="app-page finance-page">
      <div className="finance-title-card">
        <div>
          <div className="finance-title-kicker">
            <span className="finance-icon-square">
              £
            </span>

            <span className="green-label">
              Financial operations
            </span>
          </div>

          <h2>
            Finance
          </h2>

          <p>
            Manage money coming
            in, money going out,
            invoices, expenses,
            tax, payroll and
            financial performance
            from one place.
          </p>
        </div>

        <div className="finance-title-actions">
          <button
            type="button"
            className="outline-mini-button"
          >
            <RefreshCw
              size={12}
            />

            Refresh
          </button>

          <button
            type="button"
            className="sage-small-button dark-text"
          >
            <Plus
              size={12}
            />

            New invoice
          </button>

          <button
            type="button"
            className="outline-mini-button"
          >
            <Plus
              size={12}
            />

            New quote
          </button>
        </div>
      </div>

      <div className="finance-nav-tabs">
        <span className="active">
          Overview
        </span>

        <span>
          Invoices & quotes
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

        <span>
          Timesheets
        </span>
      </div>

      <div className="finance-control-centre">
        <div className="finance-control-head">
          <div>
            <span className="green-label">
              Financial control centre
            </span>

            <h3>
              Business position
              at a glance
            </h3>

            <p>
              Revenue, costs,
              cash exposure,
              liabilities and
              operational finance
              signals across the
              business.
            </p>
          </div>

          <div className="finance-health">
            <span>
              Finance health
            </span>

            <strong>
              86/100
            </strong>
          </div>
        </div>

        <div className="finance-main-metrics">
          {financeMetrics.map(
            (
              metric
            ) => (
              <div
                className="finance-white-metric"
                key={
                  metric.label
                }
              >
                <span>
                  {
                    metric.label
                  }
                </span>

                <strong>
                  {
                    metric.value
                  }
                </strong>
              </div>
            )
          )}
        </div>
      </div>

      <div className="finance-lower-grid">
        <div className="finance-dark-small">
          <span>
            Paid revenue
          </span>

          <strong>
            £27,840
          </strong>
        </div>

        <div>
          <span>
            Operating costs
          </span>

          <strong>
            £9,200
          </strong>
        </div>

        <div>
          <span>
            Recurring MRR
          </span>

          <strong>
            £3,450
          </strong>
        </div>

        <div>
          <span>
            Monthly payroll
          </span>

          <strong>
            £4,880
          </strong>
        </div>
      </div>

      <div className="finance-demo-extra">
        <div className="finance-demo-panel">
          <div className="finance-demo-panel-head">
            <div>
              <span className="green-label">
                Receivables
              </span>

              <h3>
                Latest invoices
              </h3>
            </div>

            <span className="finance-panel-link">
              View all
            </span>
          </div>

          <div className="finance-invoice-list">
            {[
              {
                client:
                  "Hart & Co",
                ref:
                  "INV-1042",
                value:
                  "£2,400",
                state:
                  "Due",
              },
              {
                client:
                  "Reed Wellness",
                ref:
                  "INV-1041",
                value:
                  "£1,250",
                state:
                  "Paid",
              },
              {
                client:
                  "James Property Group",
                ref:
                  "INV-1039",
                value:
                  "£1,850",
                state:
                  "Due",
              },
            ].map(
              (
                invoice
              ) => (
                <div
                  className="finance-invoice-row"
                  key={
                    invoice.ref
                  }
                >
                  <div>
                    <strong>
                      {
                        invoice.client
                      }
                    </strong>

                    <small>
                      {
                        invoice.ref
                      }
                    </small>
                  </div>

                  <span>
                    {
                      invoice.value
                    }
                  </span>

                  <b
                    className={
                      invoice.state ===
                      "Paid"
                        ? "invoice-paid"
                        : "invoice-due"
                    }
                  >
                    {
                      invoice.state
                    }
                  </b>
                </div>
              )
            )}
          </div>
        </div>

        <div className="finance-demo-panel">
          <div className="finance-demo-panel-head">
            <div>
              <span className="green-label">
                Spend
              </span>

              <h3>
                Recent expenses
              </h3>
            </div>
          </div>

          <div className="finance-expense-list">
            {[
              [
                "Adobe",
                "Software",
                "£54.99",
              ],
              [
                "Studio Rent",
                "Premises",
                "£820.00",
              ],
              [
                "Meta",
                "Marketing",
                "£186.40",
              ],
              [
                "Google Workspace",
                "Software",
                "£19.20",
              ],
            ].map(
              (
                expense
              ) => (
                <div
                  className="finance-expense-row"
                  key={
                    expense[
                      0
                    ]
                  }
                >
                  <div>
                    <strong>
                      {
                        expense[
                          0
                        ]
                      }
                    </strong>

                    <small>
                      {
                        expense[
                          1
                        ]
                      }
                    </small>
                  </div>

                  <span>
                    {
                      expense[
                        2
                      ]
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NOTES
============================================================ */

function DemoNotes() {
  const taskColumns = [
    {
      title:
        "To do",
      count:
        3,
      cards: [
        {
          title:
            "Send Hart & Co proposal",
          tag:
            "Client",
          meta:
            "Due Monday",
          tone:
            "yellow",
        },
        {
          title:
            "Create September content plan",
          tag:
            "Marketing",
          meta:
            "Due 28 Aug",
          tone:
            "pink",
        },
        {
          title:
            "Review website feedback",
          tag:
            "Project",
          meta:
            "Due Friday",
          tone:
            "blue",
        },
      ],
    },
    {
      title:
        "In progress",
      count:
        2,
      cards: [
        {
          title:
            "Reed Wellness brand concepts",
          tag:
            "Design",
          meta:
            "Started today",
          tone:
            "green",
        },
        {
          title:
            "Update service pricing",
          tag:
            "Finance",
          meta:
            "60% complete",
          tone:
            "cream",
        },
      ],
    },
    {
      title:
        "Done",
      count:
        2,
      cards: [
        {
          title:
            "Send James Property invoice",
          tag:
            "Finance",
          meta:
            "Completed",
          tone:
            "grey",
        },
        {
          title:
            "Book client review call",
          tag:
            "Client",
          meta:
            "Completed",
          tone:
            "lavender",
        },
      ],
    },
  ];

  return (
    <div className="app-page notes-page">
      <div className="notes-header">
        <div>
          <h2>
            Notes
          </h2>

          <span>
            Your digital
            notepad
          </span>
        </div>

        <div className="notes-search">
          <Search
            size={13}
          />

          Search the desk...
        </div>
      </div>

      <div className="notes-filters">
        <span>
          Tag: All

          <ChevronDown
            size={12}
          />
        </span>

        <span>
          Color: All

          <ChevronDown
            size={12}
          />
        </span>
      </div>

      <div className="notes-task-heading">
        <div>
          <h3>
            Tasks
          </h3>

          <span>
            Action items
          </span>
        </div>

        <strong>
          7 tasks
        </strong>
      </div>

      <div className="notes-board">
        {taskColumns.map(
          (
            column
          ) => (
            <div
              className="notes-column"
              key={
                column.title
              }
            >
              <div className="notes-column-head">
                <div>
                  <span className="notes-column-dot" />

                  <strong>
                    {
                      column.title
                    }
                  </strong>
                </div>

                <span className="notes-column-count">
                  {
                    column.count
                  }
                </span>
              </div>

              <div className="notes-column-stack">
                {column.cards.map(
                  (
                    card,
                    index
                  ) => (
                    <div
                      className={`desk-note desk-note-${card.tone} ${
                        index %
                          2 ===
                        0
                          ? "tilt-left"
                          : "tilt-right"
                      }`}
                      key={
                        card.title
                      }
                    >
                      <span className="desk-note-tape" />

                      <div className="desk-note-top">
                        <span className="desk-note-tag">
                          {
                            card.tag
                          }
                        </span>

                        <button
                          type="button"
                          aria-label="Note options"
                        >
                          ···
                        </button>
                      </div>

                      <h4>
                        {
                          card.title
                        }
                      </h4>

                      <div className="desk-note-lines">
                        <span />
                        <span />
                      </div>

                      <div className="desk-note-footer">
                        <small>
                          {
                            card.meta
                          }
                        </small>

                        <span className="desk-note-check">
                          <Check
                            size={9}
                          />
                        </span>
                      </div>
                    </div>
                  )
                )}

                {column.title !==
                  "Done" && (
                  <button
                    type="button"
                    className="notes-add-card"
                  >
                    <Plus
                      size={12}
                    />

                    Add task
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <div className="notes-bottom-row">
        <div className="notes-quick-card">
          <NotebookPen
            size={14}
          />

          <div>
            <span>
              Quick note
            </span>

            <strong>
              Capture something
              before you forget.
            </strong>
          </div>
        </div>

        <div className="notes-quick-card">
          <Sparkles
            size={14}
          />

          <div>
            <span>
              Brain dump
            </span>

            <strong>
              Get the messy ideas
              out of your head.
            </strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="floating-add-button"
      >
        <Plus
          size={23}
        />
      </button>
    </div>
  );
}

/* ============================================================
   WORKSPACE
============================================================ */

function DemoWorkspace() {
  const projects = [
    {
      name:
        "Hart & Co Website Refresh",
      client:
        "Hart & Co",
      category:
        "Website",
      due:
        "28 Aug",
      budget:
        "£4,800",
    },
    {
      name:
        "Reed Wellness Rebrand",
      client:
        "Reed Wellness",
      category:
        "Branding",
      due:
        "12 Sep",
      budget:
        "£6,500",
    },
    {
      name:
        "James Property Campaign",
      client:
        "James Property Group",
      category:
        "Marketing",
      due:
        "18 Sep",
      budget:
        "£3,200",
    },
  ];

  return (
    <div className="app-page workspace-page">
      <div className="workspace-heading">
        <div>
          <span className="green-label">
            <BriefcaseBusiness
              size={12}
            />

            Commercial workspace
          </span>

          <h2>
            Clients & Projects
          </h2>

          <p>
            Manage the people you
            work with and
            everything you are
            delivering for them.
          </p>
        </div>

        <div className="workspace-heading-actions">
          <button
            type="button"
            className="outline-large-button"
          >
            <Users
              size={14}
            />

            Clients
          </button>

          <button
            type="button"
            className="black-wide-button"
          >
            <Plus
              size={14}
            />

            New project
          </button>
        </div>
      </div>

      <div className="summary-wide-card">
        <div className="summary-spark">
          <Sparkles
            size={17}
          />
        </div>

        <div>
          <span className="green-label">
            TOTS summary
          </span>

          <p>
            You currently have
            3 active projects
            across 3 clients,
            with one deadline
            coming up this week.
          </p>
        </div>
      </div>

      <div className="workspace-metric-grid">
        <DemoMetric
          label="Active projects"
          value="3"
        />

        <DemoMetric
          label="Active clients"
          value="3"
        />

        <DemoMetric
          label="Overdue"
          value="1"
        />

        <DemoMetric
          label="Project value"
          value="£14.5k"
        />
      </div>

      <div className="workspace-choice-grid">
        <div className="workspace-choice">
          <div className="choice-icon">
            <Users
              size={18}
            />
          </div>

          <h3>
            Clients
          </h3>

          <p>
            Open a client
            workspace to see
            their projects,
            money, tasks, emails
            and history.
          </p>

          <span className="choice-link">
            Open clients

            <ChevronRight
              size={12}
            />
          </span>
        </div>

        <div className="workspace-choice active-choice">
          <div className="choice-icon active">
            <BriefcaseBusiness
              size={18}
            />
          </div>

          <span className="you-are-here">
            You are here
          </span>

          <h3>
            Projects
          </h3>

          <p>
            Track delivery,
            tasks, deadlines,
            team members,
            budgets and
            commercial
            activity.
          </p>

          <span className="choice-link">
            3 active
          </span>
        </div>
      </div>

      <div className="workspace-project-heading">
        <div>
          <span className="green-label">
            Your work
          </span>

          <h3>
            Projects
          </h3>

          <p>
            3 client projects ·
            1 internal
          </p>
        </div>

        <div className="project-search">
          <Search
            size={13}
          />

          Search project or
          client...
        </div>
      </div>

      <div className="project-demo-list">
        {projects.map(
          (
            project
          ) => (
            <div
              className="project-row-real"
              key={
                project.name
              }
            >
              <div className="project-folder">
                <Folder
                  size={18}
                />
              </div>

              <div className="project-row-copy">
                <div>
                  <strong>
                    {
                      project.name
                    }
                  </strong>

                  <span>
                    {
                      project.category
                    }
                  </span>
                </div>

                <small>
                  {
                    project.client
                  }
                </small>
              </div>

              <div className="project-row-meta">
                <small>
                  Due{" "}
                  {
                    project.due
                  }
                </small>

                <strong>
                  {
                    project.budget
                  }
                </strong>
              </div>

              <ChevronRight
                size={15}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CALENDAR
============================================================ */

function DemoCalendar() {
  return (
    <div className="app-page calendar-page">
      <div className="calendar-heading-real">
        <div>
          <span className="green-label">
            Your time
          </span>

          <h2>
            Bookings &
            Schedule
          </h2>

          <p>
            Manage your
            schedule, availability
            and the way customers
            book time with your
            business.
          </p>
        </div>

        <div className="calendar-heading-buttons">
          <button
            type="button"
            className="outline-mini-button"
          >
            <RefreshCw
              size={12}
            />

            Refresh
          </button>

          <button
            type="button"
            className="black-wide-button"
          >
            <Plus
              size={14}
            />

            Add event
          </button>
        </div>
      </div>

      <div className="calendar-tabs-real">
        <span className="active">
          <Sparkles
            size={12}
          />

          Overview
        </span>

        <span>
          <CalendarDays
            size={12}
          />

          Calendar
        </span>

        <span>
          <Link2
            size={12}
          />

          Booking page
        </span>

        <span>
          Availability
        </span>
      </div>

      <div className="summary-wide-card calendar-summary">
        <div className="summary-spark">
          <Sparkles
            size={17}
          />
        </div>

        <div>
          <span className="green-label">
            TOTS schedule
            summary
          </span>

          <p>
            You have 2 events
            today and 8 upcoming
            items currently
            visible. Your public
            booking page is
            active.
          </p>
        </div>
      </div>

      <div className="calendar-stat-grid">
        <DemoMetric
          label="Today"
          value="2"
        />

        <DemoMetric
          label="Upcoming"
          value="8"
        />

        <DemoMetric
          label="Booking days"
          value="5"
        />

        <DemoMetric
          label="Booking page"
          value="Live"
        />
      </div>

      <div className="calendar-lower-grid">
        <div className="today-card-real">
          <div className="today-card-head">
            <div>
              <span className="green-label">
                Today
              </span>

              <h3>
                Saturday 22
                August
              </h3>
            </div>

            <button
              type="button"
              className="sage-small-button"
            >
              Open calendar
            </button>
          </div>

          <div className="demo-event-list">
            <div className="demo-event-row event-sage">
              <div className="demo-event-time">
                10:00
              </div>

              <div>
                <strong>
                  Client review
                  with Amelia
                </strong>

                <small>
                  Hart & Co
                </small>
              </div>
            </div>

            <div className="demo-event-row event-amber">
              <div className="demo-event-time">
                14:30
              </div>

              <div>
                <strong>
                  Project planning
                </strong>

                <small>
                  Reed Wellness
                  Rebrand
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-card-real">
          <div className="booking-demo-heading">
            <div>
              <span className="green-label">
                Public booking
              </span>

              <h3>
                Discovery Call
              </h3>
            </div>

            <span className="booking-live-dot" />
          </div>

          <div className="booking-line">
            <span>
              Length
            </span>

            <strong>
              30 minutes
            </strong>
          </div>

          <div className="booking-line">
            <span>
              Availability
            </span>

            <strong>
              5 days per week
            </strong>
          </div>

          <div className="booking-line">
            <span>
              Notice
            </span>

            <strong>
              4 hours
            </strong>
          </div>

          <div className="booking-line">
            <span>
              Status
            </span>

            <strong>
              Accepting bookings
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS
============================================================ */

function DemoSettings() {
  return (
    <div className="app-page settings-page">
      <div className="settings-heading">
        <div>
          <h2>
            Settings
          </h2>

          <p>
            Manage your profile,
            organisation,
            branding, social
            media integrations
            and account security
            from one place.
          </p>
        </div>

        <div className="settings-top-actions">
          <button
            type="button"
            className="outline-large-button"
          >
            Sign out
          </button>

          <button
            type="button"
            className="outline-large-button"
          >
            Manage subscription
          </button>

          <button
            type="button"
            className="black-wide-button"
          >
            Save changes
          </button>
        </div>
      </div>

      <div className="settings-divider" />

      <div className="settings-profile-card">
        <div className="settings-company-logo">
          <div className="dummy-brand-mark">
            NP
          </div>
        </div>

        <div className="settings-form-area">
          <div className="settings-two-fields">
            <div>
              <label>
                Full name
              </label>

              <div className="settings-input filled">
                Alex Morgan
              </div>
            </div>

            <div>
              <label>
                Email address
              </label>

              <div className="settings-input filled">
                alex@northandpine.co.uk
              </div>
            </div>
          </div>

          <div className="settings-summary-field">
            <label>
              Administrative
              summary
            </label>

            <div className="settings-textarea filled-textarea">
              North &amp; Pine Studio
              is a small creative
              studio specialising in
              brand, web and content
              projects for growing
              businesses.
            </div>
          </div>

          <div className="company-logo-row">
            <label>
              Company logo
            </label>

            <div className="company-logo-controls">
              <div className="dummy-brand-mark small">
                NP
              </div>

              <button
                type="button"
              >
                <Upload
                  size={12}
                />

                Change logo
              </button>

              <span>
                Uploaded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CLARITY
============================================================ */

function DemoClarity() {
  return (
    <div className="app-page clarity-tour-screen">
      <div className="clarity-tour-head">
        <div>
          <span className="green-label">
            Clarity AI
          </span>

          <h2>
            What needs my
            attention?
          </h2>

          <p>
            Clarity looks across
            your TOTS-OS
            workspace to help
            identify what matters
            next.
          </p>
        </div>

        <div className="clarity-floating-demo">
          <Sparkles
            size={20}
          />
        </div>
      </div>

      <div className="clarity-chat-tour">
        <div className="clarity-user">
          What should I focus
          on today?
        </div>

        <div className="clarity-answer">
          <div className="clarity-answer-title">
            <Sparkles
              size={13}
            />

            Clarity
          </div>

          <p>
            Your workload is
            manageable, but there
            are three areas worth
            prioritising today:
            client delivery,
            outstanding invoices
            and this week&apos;s
            deadlines.
          </p>

          <div className="clarity-suggestion-list">
            <div>
              <span>
                1
              </span>

              <div>
                <strong>
                  Send the Hart
                  & Co proposal
                </strong>

                <small>
                  High-priority
                  client task
                </small>
              </div>
            </div>

            <div>
              <span>
                2
              </span>

              <div>
                <strong>
                  Follow up
                  outstanding
                  invoices
                </strong>

                <small>
                  £4,250 currently
                  outstanding
                </small>
              </div>
            </div>

            <div>
              <span>
                3
              </span>

              <div>
                <strong>
                  Review active
                  project delivery
                </strong>

                <small>
                  3 projects
                  currently active
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="clarity-user">
          Which client needs me
          most?
        </div>

        <div className="clarity-answer small-answer">
          <div className="clarity-answer-title">
            <Sparkles
              size={13}
            />

            Clarity
          </div>

          <p>
            Hart &amp; Co is the
            priority. Their website
            project has the closest
            deadline and the proposal
            task is still open.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIEWS
============================================================ */

const DEMO_VIEWS: Record<
  DemoKey,
  () => ReactNode
> = {
  home:
    DemoHome,

  contacts:
    DemoContacts,

  campaigns:
    DemoCampaigns,

  social:
    DemoSocial,

  finance:
    DemoFinance,

  notes:
    DemoNotes,

  workspace:
    DemoWorkspace,

  calendar:
    DemoCalendar,

  settings:
    DemoSettings,
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
    DEMO_VIEWS[
      active
    ];

  return (
    <Reveal>
      <div
        className="demo-shell"
        id="demo"
      >
        <div className="product-demo-frame">
          <div className="product-demo-app">
            <DemoSidebar
              active={
                active
              }
              onChange={
                setActive
              }
            />

            <main className="product-demo-content">
              <div className="clarity-orb-global">
                <Sparkles
                  size={16}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    active
                  }
                  initial={{
                    opacity:
                      0,

                    y:
                      4,
                  }}
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
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
          {DEMO_NAV.map(
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
            Settings
          </button>
        </div>

        <div className="demo-cta">
          <div>
            <span>
              Want us to show
              you around?
            </span>

            <h3>
              Take the guided
              TOTS-OS tour.
            </h3>

            <p>
              See how the
              dashboard, CRM,
              campaigns, social,
              finance, projects,
              planning and
              Clarity all fit
              together before
              creating an
              account.
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
                size={14}
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
                size={15}
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

  function resetAndClose() {
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
          top:
            0,

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
          previous
        ) =>
          previous +
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
          previous
        ) =>
          previous -
          1
      );
    }
  }

  let TourScreen:
    | (() => ReactNode)
    | null =
    null;

  if (
    current?.screen !==
    "clarity"
  ) {
    TourScreen =
      DEMO_VIEWS[
        current.screen
      ];
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

              y:
                20,
            }}
            animate={{
              opacity:
                1,

              scale:
                1,

              y:
                0,
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
                  Guided tour
                </span>
              </div>

              <button
                type="button"
                className="tour-close"
                onClick={
                  resetAndClose
                }
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>

            {!finished ? (
              <div className="tour-layout">
                <div className="tour-preview">
                  <div className="tour-app-shell">
                    {current.screen !==
                    "clarity" ? (
                      <>
                        <DemoSidebar
                          active={
                            current.screen as DemoKey
                          }
                          interactive={
                            false
                          }
                        />

                        <main className="tour-app-content">
                          <div className="clarity-orb-global">
                            <Sparkles
                              size={
                                15
                              }
                            />
                          </div>

                          {TourScreen && (
                            <TourScreen />
                          )}
                        </main>
                      </>
                    ) : (
                      <>
                        <DemoSidebar
                          active="home"
                          interactive={
                            false
                          }
                        />

                        <main className="tour-app-content">
                          <DemoClarity />
                        </main>
                      </>
                    )}
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

                  {current.screen ===
                    "notes" && (
                    <div className="tour-callout">
                      <NotebookPen
                        size={
                          16
                        }
                      />

                      <div>
                        <strong>
                          Notes that actually
                          feel like notes.
                        </strong>

                        <span>
                          Colour-coded sticky
                          cards make the board
                          visual, quick to scan
                          and much closer to a
                          real desk than a
                          boring task table.
                        </span>
                      </div>
                    </div>
                  )}

                  {current.screen ===
                    "clarity" && (
                    <div className="tour-callout">
                      <Sparkles
                        size={
                          16
                        }
                      />

                      <div>
                        <strong>
                          This is where TOTS-OS
                          becomes more than
                          another collection
                          of tools.
                        </strong>

                        <span>
                          Clarity can use the
                          information already
                          inside your workspace
                          to help turn it into
                          action.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="tour-controls">
                    <button
                      type="button"
                      className="tour-back"
                      disabled={
                        step ===
                        0
                      }
                      onClick={
                        previous
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

                  <span className="tour-count">
                    {step +
                      1}{" "}
                    of{" "}
                    {
                      TOUR_STEPS.length
                    }
                  </span>
                </aside>
              </div>
            ) : (
              <div className="tour-finish">
                <div className="tour-finish-icon">
                  <Sparkles
                    size={
                      25
                    }
                  />
                </div>

                <span className="tour-eyebrow">
                  Tour complete
                </span>

                <h2>
                  Ready to make
                  TOTS-OS your
                  workspace?
                </h2>

                <p>
                  Start your
                  14-day free
                  trial and turn
                  what you&apos;ve
                  just explored
                  into your own
                  organised
                  business
                  system.
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
                        15
                      }
                    />
                  </a>

                  <button
                    type="button"
                    onClick={
                      resetAndClose
                    }
                    className="button-secondary button-large"
                  >
                    Maybe later
                  </button>
                </div>

                <span className="tour-finish-note">
                  14 days free ·
                  no commitment
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
    >(
      0
    );

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

          --sage: #aabd96;
          --sage-dark: #82996e;
          --sage-light: #eff3e9;

          --app-bg: #fbfaf7;
          --app-white: #ffffff;
          --app-border: #e4e2dc;
          --app-text: #25231f;
          --app-muted: #96928a;

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

          min-height:
            100vh;

          overflow-x:
            hidden;

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
          margin:
            0;
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

        .tots-root button {
          font-family:
            inherit;
        }

        .tots-root a {
          color:
            inherit;
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

        .button-secondary:hover {
          transform:
            translateY(
              -2px
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

          text-align:
            center;
        }

        .tots-hero-pill {
          display:
            inline-flex;

          align-items:
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
        }

        .tots-hero-accent {
          display:
            block;

          margin-top:
            4px;

          color:
            var(--tan-dark);
        }

        .tots-hero-copy {
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
        }

        .tots-hero-copy strong {
          color:
            var(--charcoal);

          font-weight:
            600;
        }

        .tots-hero-actions {
          margin-top:
            34px;

          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            10px;
        }

        .tots-hero-note {
          margin-top:
            18px;

          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            9px 20px;

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

          gap:
            6px;
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

          justify-content:
            center;

          flex-wrap:
            wrap;

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

        .transform-card.good > span {
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
           REAL APP FRAME
        ===================================================== */

        .demo-section-head {
          text-align:
            center;
        }

        .demo-section-head .tots-eyebrow {
          justify-content:
            center;
        }

        .demo-section-head .section-title,
        .demo-section-head .section-copy {
          margin-left:
            auto !important;

          margin-right:
            auto !important;
        }

        .demo-shell {
          margin-top:
            55px;
        }

        .product-demo-frame {
          overflow:
            hidden;

          border:
            1px solid
            #dedcd5;

          border-radius:
            25px;

          background:
            white;

          box-shadow:
            0 35px 90px
            rgba(
              42,
              40,
              36,
              .12
            );
        }

        .product-demo-app {
          height:
            715px;

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

        .product-demo-content,
        .tour-app-content {
          min-width:
            0;

          position:
            relative;

          overflow:
            auto;

          background:
            var(--app-bg);
        }

        .clarity-orb-global {
          width:
            38px;

          height:
            38px;

          position:
            absolute;

          top:
            18px;

          right:
            20px;

          z-index:
            15;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #1f1e1b;

          color:
            white;

          box-shadow:
            0 14px 30px
            rgba(
              0,
              0,
              0,
              .12
            );
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .app-sidebar {
          min-width:
            0;

          height:
            100%;

          display:
            flex;

          flex-direction:
            column;

          border-right:
            1px solid
            #deddd8;

          background:
            #fff;
        }

        .app-sidebar-logo {
          height:
            77px;

          padding:
            10px 14px;

          display:
            flex;

          align-items:
            center;
        }

        .app-sidebar-nav {
          padding:
            5px 8px;
        }

        .app-nav-group {
          margin:
            15px 8px
            8px;

          color:
            #9f9b94;

          font-size:
            7px;

          font-weight:
            600;

          letter-spacing:
            .17em;

          text-transform:
            uppercase;
        }

        .app-nav-item {
          width:
            100%;

          min-height:
            33px;

          padding:
            0 9px;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          border:
            0;

          border-radius:
            8px;

          background:
            transparent;

          color:
            #595650;

          font-size:
            9px;

          text-align:
            left;

          cursor:
            pointer;
        }

        .app-nav-item.active {
          background:
            var(--sage);

          color:
            white;
        }

        .app-nav-item.active svg {
          color:
            white;
        }

        .app-sidebar-bottom {
          margin-top:
            auto;

          padding:
            10px 8px;

          border-top:
            1px solid
            #e5e3dd;
        }

        .app-nav-item.logout {
          margin-top:
            2px;
        }

        /* =====================================================
           APP COMMON
        ===================================================== */

        .app-page {
          min-width:
            780px;

          padding:
            48px 55px
            55px;

          color:
            var(--app-text);
        }

        .app-page h2,
        .app-page h3 {
          font-family:
            'DM Sans',
            sans-serif;

          font-style:
            italic;

          font-weight:
            400;

          letter-spacing:
            -.045em;
        }

        .app-page h2 {
          font-size:
            20px;
        }

        .app-page h3 {
          font-size:
            18px;
        }

        .app-page p {
          color:
            #8f8b84;

          font-size:
            8px;

          line-height:
            1.6;
        }

        .green-label {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .19em;

          text-transform:
            uppercase;
        }

        .app-kicker {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          color:
            #959189;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .18em;

          text-transform:
            uppercase;
        }

        .app-kicker span {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            var(--sage);
        }

        .app-metric {
          min-height:
            66px;

          padding:
            12px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            12px;

          background:
            white;
        }

        .app-metric > span {
          display:
            block;

          color:
            #96928b;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .app-metric > strong {
          display:
            block;

          margin-top:
            8px;

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

        /* =====================================================
           HOME
        ===================================================== */

        .home-header {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            25px;
        }

        .home-header h2 {
          margin-top:
            7px;
        }

        .home-header p {
          margin-top:
            5px;
        }

        .home-clarity-alert {
          min-width:
            205px;

          padding:
            10px 12px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            12px;

          background:
            white;
        }

        .home-clarity-icon {
          width:
            27px;

          height:
            27px;

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

        .home-clarity-alert span {
          display:
            block;

          color:
            #99958d;

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .16em;

          text-transform:
            uppercase;
        }

        .home-clarity-alert strong {
          display:
            block;

          margin-top:
            2px;

          font-size:
            7px;
        }

        .home-metrics {
          margin-top:
            17px;

          display:
            grid;

          grid-template-columns:
            repeat(
              6,
              1fr
            );

          gap:
            7px;
        }

        .home-dashboard-grid {
          margin-top:
            13px;

          display:
            grid;

          grid-template-columns:
            1.4fr
            1.1fr
            .82fr;

          gap:
            10px;
        }

        .focus-panel,
        .coming-panel {
          min-height:
            280px;

          padding:
            15px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .focus-title-row {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .focus-title-row h3,
        .snapshot-panel h3 {
          margin-top:
            5px;
        }

        .high-risk {
          height:
            fit-content;

          padding:
            6px 9px;

          border-radius:
            999px;

          background:
            #fff0ee;

          color:
            #ff4c48;

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .focus-panel > p {
          margin-top:
            12px;
        }

        .priority-list-real {
          margin-top:
            13px;

          display:
            grid;

          gap:
            6px;
        }

        .priority-real {
          min-height:
            33px;

          padding:
            7px 9px;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          border-radius:
            8px;

          background:
            #f7f6f2;

          color:
            #4c4943;

          font-size:
            7px;

          font-weight:
            500;
        }

        .priority-real > span {
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

          border-radius:
            50%;

          background:
            #22211f;

          color:
            white;

          font-size:
            6px;
        }

        .sage-pill-button {
          min-height:
            30px;

          margin-top:
            12px;

          padding:
            0 13px;

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
            var(--sage);

          color:
            white;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .coming-heading {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .coming-heading h3 {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .coming-heading h3 svg {
          color:
            var(--sage);
        }

        .coming-heading > span {
          padding:
            7px 12px;

          border-radius:
            999px;

          background:
            var(--sage);

          color:
            white;

          font-size:
            6px;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .coming-events {
          margin-top:
            11px;

          display:
            grid;

          gap:
            6px;
        }

        .coming-event {
          min-height:
            37px;

          display:
            grid;

          grid-template-columns:
            50px 1fr;

          align-items:
            center;

          border-radius:
            9px;

          background:
            #f7f6f2;
        }

        .coming-date {
          min-height:
            28px;

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
            #dedbd4;
        }

        .coming-date strong {
          color:
            var(--sage-dark);

          font-size:
            5px;
        }

        .coming-date small {
          margin-top:
            2px;

          font-size:
            5px;
        }

        .coming-event > span {
          padding:
            0 9px;

          overflow:
            hidden;

          font-size:
            7px;

          font-weight:
            600;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .snapshot-panel {
          min-height:
            280px;

          padding:
            15px;

          border-radius:
            17px;

          background:
            #211f1c;

          color:
            white;
        }

        .snapshot-panel .green-label {
          color:
            var(--sage);
        }

        .snapshot-panel h3 {
          color:
            white;
        }

        .snapshot-revenue {
          margin-top:
            18px;
        }

        .snapshot-revenue span,
        .snapshot-mini-grid span {
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
            5px;

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

        .snapshot-divider {
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

        .snapshot-mini-grid {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            16px;
        }

        .snapshot-mini-grid strong {
          display:
            block;

          margin-top:
            6px;

          font-size:
            13px;
        }

        .work-queue {
          margin-top:
            13px;

          padding:
            15px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .work-queue-title {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .work-queue-title h3 {
          margin-top:
            4px;
        }

        .add-task-demo {
          display:
            flex;

          gap:
            6px;
        }

        .add-task-demo > span {
          width:
            135px;

          min-height:
            31px;

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
            999px;

          color:
            #a8a49c;

          font-size:
            7px;
        }

        .add-task-demo button {
          width:
            31px;

          border:
            0;

          border-radius:
            8px;

          background:
            #aaa8a3;

          color:
            white;
        }

        .task-chip-grid {
          margin-top:
            9px;

          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              1fr
            );

          gap:
            6px;
        }

        .task-demo-chip {
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

        .task-demo-chip i {
          width:
            13px;

          height:
            13px;

          flex-shrink:
            0;

          border:
            1px solid
            #d2cfc7;

          border-radius:
            3px;

          background:
            white;
        }

        .task-demo-chip strong {
          min-width:
            0;

          overflow:
            hidden;

          font-size:
            6px;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .task-demo-chip small {
          margin-left:
            auto;

          color:
            #ff4f4b;

          font-size:
            5px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        /* =====================================================
           CONTACTS
        ===================================================== */

        .contacts-page {
          padding-top:
            82px;
        }

        .contacts-top {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .contacts-actions {
          display:
            flex;

          gap:
            8px;
        }

        .contact-search {
          width:
            210px;

          min-height:
            38px;

          padding:
            0 13px;

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
            12px;

          background:
            white;

          color:
            #a29e96;

          font-size:
            7px;
        }

        .square-black-button {
          width:
            48px;

          height:
            48px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            0;

          border-radius:
            13px;

          background:
            #211f1c;

          color:
            white;
        }

        .contact-list-real {
          margin-top:
            34px;

          display:
            grid;

          gap:
            10px;
        }

        .contact-row-real {
          min-height:
            77px;

          padding:
            13px 17px;

          display:
            flex;

          align-items:
            center;

          gap:
            15px;

          border:
            1px solid
            #efede8;

          border-radius:
            18px;

          background:
            white;
        }

        .contact-signal {
          width:
            43px;

          height:
            43px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            #f0eee9;

          border-radius:
            12px;

          background:
            #fbfaf8;

          color:
            #a8a49c;
        }

        .contact-main {
          flex:
            1;
        }

        .contact-main > strong {
          display:
            block;

          font-size:
            16px;

          font-weight:
            500;
        }

        .contact-main > div {
          margin-top:
            6px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;
        }

        .contact-main span {
          color:
            #a09c94;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .1em;
        }

        .contact-main b {
          padding:
            3px 8px;

          border-radius:
            999px;

          background:
            #f0f4ea;

          color:
            var(--sage-dark);

          font-size:
            5px;

          font-style:
            italic;

          letter-spacing:
            .08em;
        }

        .contact-next {
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
            #fbfaf8;

          color:
            #d3d0c9;
        }

        /* =====================================================
           CAMPAIGNS
        ===================================================== */

        .campaign-header-real,
        .workspace-heading,
        .calendar-heading-real,
        .settings-heading {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            25px;
        }

        .campaign-header-real h2,
        .workspace-heading h2,
        .calendar-heading-real h2 {
          margin-top:
            7px;
        }

        .campaign-header-real p,
        .workspace-heading p,
        .calendar-heading-real p {
          margin-top:
            8px;
        }

        .black-wide-button,
        .outline-large-button,
        .outline-mini-button,
        .sage-small-button,
        .sage-ideas-button {
          min-height:
            35px;

          padding:
            0 15px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            7px;

          border-radius:
            9px;

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .black-wide-button {
          border:
            0;

          background:
            #211f1c;

          color:
            white;
        }

        .outline-large-button,
        .outline-mini-button {
          border:
            1px solid
            var(--app-border);

          background:
            white;

          color:
            #44413c;
        }

        .sage-small-button,
        .sage-ideas-button {
          border:
            0;

          background:
            var(--sage);

          color:
            white;
        }

        .dark-text {
          color:
            #2c2a26;
        }

        .campaign-toolbar {
          margin-top:
            26px;

          padding-bottom:
            5px;

          display:
            flex;

          justify-content:
            space-between;

          border-bottom:
            1px solid
            #e4e2dd;
        }

        .sage-tab {
          padding:
            9px 15px;

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
            .1em;

          text-transform:
            uppercase;
        }

        .campaign-metric-grid,
        .workspace-metric-grid,
        .calendar-stat-grid {
          margin-top:
            16px;

          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap:
            10px;
        }

        .campaign-table {
          margin-top:
            22px;

          overflow:
            hidden;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .campaign-table-head,
        .campaign-table-row {
          display:
            grid;

          grid-template-columns:
            1.7fr
            .9fr
            .8fr
            .85fr
            20px;

          align-items:
            center;

          gap:
            12px;
        }

        .campaign-table-head {
          padding:
            12px 15px;

          border-bottom:
            1px solid
            #eeece7;

          color:
            #9e9a92;

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .campaign-table-row {
          min-height:
            57px;

          padding:
            9px 15px;

          border-bottom:
            1px solid
            #efede8;

          color:
            #5d5953;

          font-size:
            7px;
        }

        .campaign-table-row:last-child {
          border-bottom:
            0;
        }

        .campaign-table-row > div strong,
        .campaign-table-row > div small {
          display:
            block;
        }

        .campaign-table-row > div strong {
          color:
            #24221e;

          font-size:
            8px;
        }

        .campaign-table-row > div small {
          margin-top:
            3px;

          color:
            #aaa69e;

          font-size:
            6px;
        }

        .status-blue,
        .status-green,
        .status-grey {
          width:
            fit-content;

          padding:
            4px 8px;

          border-radius:
            999px;

          font-size:
            5px;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .status-blue {
          background:
            #eef4ff;

          color:
            #376dd2;
        }

        .status-green {
          background:
            #edf9f3;

          color:
            #338a63;
        }

        .status-grey {
          background:
            #f1f1ef;

          color:
            #77746e;
        }

        .muted-result {
          color:
            #aaa69e;
        }

        .audience-heading {
          margin-top:
            24px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;
        }

        .audience-heading p {
          margin-top:
            3px;
        }

        .outline-mini-button {
          min-height:
            29px;

          padding:
            0 12px;

          font-size:
            6px;
        }

        .audience-grid {
          margin-top:
            11px;

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

        .audience-card {
          min-height:
            62px;

          padding:
            11px;

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

        .hash-icon {
          width:
            29px;

          height:
            29px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            9px;

          background:
            var(--sage-light);

          color:
            var(--sage-dark);

          font-size:
            16px;
        }

        .audience-card > div {
          flex:
            1;
        }

        .audience-card strong,
        .audience-card small {
          display:
            block;
        }

        .audience-card strong {
          font-size:
            8px;
        }

        .audience-card small {
          margin-top:
            3px;

          color:
            #aaa69e;

          font-size:
            6px;
        }

        /* =====================================================
           SOCIAL
        ===================================================== */

        .social-topbar {
          display:
            grid;

          grid-template-columns:
            1fr auto 1fr;

          align-items:
            center;

          gap:
            20px;
        }

        .social-brand-real {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;
        }

        .social-brand-icon {
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
            9px;

          background:
            #211f1c;

          color:
            var(--sage);
        }

        .social-brand-real h2 {
          margin-top:
            3px;
        }

        .social-mode-tabs {
          padding:
            4px;

          display:
            flex;

          gap:
            4px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            10px;

          background:
            white;
        }

        .social-mode-tabs button {
          min-height:
            29px;

          padding:
            0 13px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          border:
            0;

          border-radius:
            7px;

          background:
            var(--sage);

          color:
            white;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .social-mode-tabs button.active {
          background:
            #211f1c;
        }

        .social-ready {
          justify-self:
            end;

          padding:
            7px 13px;

          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            999px;

          background:
            white;

          color:
            #99958d;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .social-ready span {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            var(--sage);
        }

        .social-divider {
          height:
            1px;

          margin:
            18px 0
            25px;

          background:
            #e8e6e0;
        }

        .social-heading-real {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap:
            20px;
        }

        .social-heading-real h3 {
          margin-top:
            7px;

          font-size:
            20px;
        }

        .social-heading-real p {
          max-width:
            450px;

          margin-top:
            9px;
        }

        .social-create-grid {
          margin-top:
            18px;

          display:
            grid;

          grid-template-columns:
            1.55fr
            .95fr;

          gap:
            13px;
        }

        .social-upload-card,
        .social-destination-card {
          padding:
            18px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .upload-card-label {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          color:
            #96928a;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .upload-dropzone {
          min-height:
            230px;

          margin-top:
            11px;

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
            #ddd9d1;

          border-radius:
            14px;

          background:
            #fcfbf9;
        }

        .upload-icon {
          width:
            39px;

          height:
            39px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            #eeeae3;

          border-radius:
            10px;

          background:
            white;

          color:
            var(--sage-dark);
        }

        .upload-dropzone strong {
          font-size:
            9px;
        }

        .upload-dropzone span {
          color:
            #aaa69e;

          font-size:
            7px;
        }

        .caption-label {
          margin-top:
            15px;

          display:
            flex;

          justify-content:
            space-between;

          color:
            #9b978f;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .caption-box {
          min-height:
            90px;

          margin-top:
            7px;

          padding:
            12px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            10px;

          color:
            #a8a49c;

          font-size:
            7px;
        }

        .social-destination-card h4 {
          font-size:
            10px;

          letter-spacing:
            -.02em;
        }

        .social-destination-card > p {
          margin-top:
            5px;
        }

        .coming-soon-box {
          margin-top:
            13px;

          padding:
            13px;

          border:
            1px dashed
            #e1ded7;

          border-radius:
            10px;

          background:
            #fbfaf7;

          text-align:
            center;
        }

        .coming-soon-box strong,
        .coming-soon-box span {
          display:
            block;
        }

        .coming-soon-box strong {
          color:
            var(--sage-dark);

          font-size:
            6px;

          letter-spacing:
            .16em;

          text-transform:
            uppercase;
        }

        .coming-soon-box span {
          margin-top:
            7px;

          color:
            #99958d;

          font-size:
            6px;

          line-height:
            1.5;
        }

        .platform-row {
          min-height:
            53px;

          margin-top:
            8px;

          padding:
            10px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border-radius:
            10px;

          background:
            #fbfaf8;
        }

        .platform-row strong,
        .platform-row small {
          display:
            block;
        }

        .platform-row strong {
          font-size:
            8px;
        }

        .platform-row small {
          margin-top:
            3px;

          color:
            #aaa69e;

          font-size:
            6px;
        }

        .platform-radio {
          width:
            18px;

          height:
            18px;

          border:
            1px solid
            #e5e2dc;

          border-radius:
            50%;
        }

        /* =====================================================
           FINANCE
        ===================================================== */

        .finance-page {
          padding-top:
            58px;
        }

        .finance-title-card {
          padding:
            18px 20px;

          display:
            flex;

          justify-content:
            space-between;

          gap:
            25px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;

          box-shadow:
            0 6px 0
            rgba(
              0,
              0,
              0,
              .02
            );
        }

        .finance-title-kicker {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;
        }

        .finance-icon-square {
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
            9px;

          background:
            #211f1c;

          color:
            var(--sage);

          font-size:
            9px;
        }

        .finance-title-card h2 {
          margin-top:
            7px;
        }

        .finance-title-card p {
          max-width:
            540px;

          margin-top:
            8px;
        }

        .finance-title-actions {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          flex-wrap:
            wrap;
        }

        .finance-nav-tabs {
          margin-top:
            17px;

          padding:
            4px;

          display:
            flex;

          gap:
            3px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            11px;

          background:
            white;
        }

        .finance-nav-tabs span {
          padding:
            9px 13px;

          border-radius:
            8px;

          color:
            #96928a;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .finance-nav-tabs span.active {
          background:
            #211f1c;

          color:
            white;
        }

        .finance-control-centre {
          margin-top:
            17px;

          padding:
            23px;

          border-radius:
            22px;

          background:
            #211f1c;

          color:
            white;
        }

        .finance-control-head {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .finance-control-centre .green-label {
          color:
            var(--sage);
        }

        .finance-control-head h3 {
          margin-top:
            8px;

          color:
            white;

          font-size:
            20px;
        }

        .finance-control-head p {
          margin-top:
            8px;

          color:
            rgba(
              255,
              255,
              255,
              .5
            );
        }

        .finance-health {
          text-align:
            right;
        }

        .finance-health span {
          display:
            block;

          color:
            rgba(
              255,
              255,
              255,
              .4
            );

          font-size:
            5px;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .finance-health strong {
          display:
            block;

          margin-top:
            5px;

          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            16px;

          font-style:
            italic;
        }

        .finance-main-metrics {
          margin-top:
            22px;

          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap:
            10px;
        }

        .finance-white-metric {
          min-height:
            105px;

          padding:
            16px;

          border-radius:
            18px;

          background:
            white;

          color:
            #211f1c;
        }

        .finance-white-metric span {
          display:
            block;

          color:
            #99958d;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .16em;

          text-transform:
            uppercase;
        }

        .finance-white-metric strong {
          display:
            block;

          margin-top:
            34px;

          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            19px;

          font-style:
            italic;

          font-weight:
            500;
        }

        .finance-lower-grid {
          margin-top:
            14px;

          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap:
            10px;
        }

        .finance-lower-grid > div {
          min-height:
            130px;

          padding:
            17px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .finance-lower-grid > div span {
          display:
            block;

          color:
            #aaa69e;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .finance-lower-grid > div strong {
          display:
            block;

          margin-top:
            52px;

          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            17px;

          font-style:
            italic;
        }

        .finance-lower-grid .finance-dark-small {
          border:
            0;

          background:
            #211f1c;

          color:
            white;
        }

        .finance-dark-small span {
          color:
            rgba(
              255,
              255,
              255,
              .45
            ) !important;
        }

        .finance-demo-extra {
          margin-top:
            14px;

          display:
            grid;

          grid-template-columns:
            1.25fr
            .9fr;

          gap:
            10px;
        }

        .finance-demo-panel {
          padding:
            16px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            17px;

          background:
            white;
        }

        .finance-demo-panel-head {
          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap:
            15px;
        }

        .finance-demo-panel-head h3 {
          margin-top:
            4px;

          font-size:
            14px;
        }

        .finance-panel-link {
          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .finance-invoice-list,
        .finance-expense-list {
          margin-top:
            12px;

          display:
            grid;
        }

        .finance-invoice-row {
          min-height:
            42px;

          display:
            grid;

          grid-template-columns:
            1fr 70px
            48px;

          align-items:
            center;

          gap:
            9px;

          border-bottom:
            1px solid
            #efede8;

          font-size:
            7px;
        }

        .finance-invoice-row:last-child,
        .finance-expense-row:last-child {
          border-bottom:
            0;
        }

        .finance-invoice-row strong,
        .finance-invoice-row small,
        .finance-expense-row strong,
        .finance-expense-row small {
          display:
            block;
        }

        .finance-invoice-row strong,
        .finance-expense-row strong {
          font-size:
            7px;
        }

        .finance-invoice-row small,
        .finance-expense-row small {
          margin-top:
            2px;

          color:
            #aaa69e;

          font-size:
            5px;
        }

        .invoice-paid,
        .invoice-due {
          width:
            fit-content;

          padding:
            4px 7px;

          border-radius:
            999px;

          font-size:
            5px;

          text-transform:
            uppercase;
        }

        .invoice-paid {
          background:
            #edf7ed;

          color:
            #4b8153;
        }

        .invoice-due {
          background:
            #fff3df;

          color:
            #a66f20;
        }

        .finance-expense-row {
          min-height:
            42px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          border-bottom:
            1px solid
            #efede8;

          font-size:
            7px;
        }

        /* =====================================================
           NOTES — STICKY DESK STYLE
        ===================================================== */

        .notes-page {
          position:
            relative;

          padding-top:
            62px;

          padding-bottom:
            90px;

          background:
            #f7f4ee;
        }

        .notes-header {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap:
            20px;
        }

        .notes-header h2 {
          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            30px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .notes-header > div:first-child > span {
          display:
            block;

          margin-top:
            8px;

          color:
            #9d9991;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .45em;

          text-transform:
            uppercase;
        }

        .notes-search {
          width:
            220px;

          min-height:
            39px;

          padding:
            0 13px;

          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          border:
            1px solid
            #d9d4cb;

          border-radius:
            9px;

          background:
            rgba(
              255,
              255,
              255,
              .78
            );

          box-shadow:
            0 3px 8px
            rgba(
              66,
              58,
              47,
              .04
            );

          color:
            #a8a39b;

          font-family:
            Georgia,
            serif;

          font-size:
            7px;

          font-style:
            italic;
        }

        .notes-filters {
          margin-top:
            13px;

          display:
            flex;

          gap:
            7px;
        }

        .notes-filters span {
          min-height:
            25px;

          padding:
            0 9px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          border:
            1px solid
            #d3cec5;

          border-radius:
            5px;

          background:
            rgba(
              255,
              255,
              255,
              .75
            );

          color:
            #69645d;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .notes-task-heading {
          margin-top:
            29px;

          padding-bottom:
            11px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          border-bottom:
            1px solid
            #dcd7cf;
        }

        .notes-task-heading h3 {
          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            21px;

          font-style:
            italic;
        }

        .notes-task-heading div span {
          display:
            block;

          margin-top:
            5px;

          color:
            #99958d;

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .35em;

          text-transform:
            uppercase;
        }

        .notes-task-heading > strong {
          color:
            #a8a49c;

          font-size:
            6px;

          text-transform:
            uppercase;
        }

        .notes-board {
          margin-top:
            17px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );

          gap:
            17px;
        }

        .notes-column {
          min-height:
            445px;

          padding:
            11px;

          position:
            relative;

          border:
            1px solid
            rgba(
              89,
              82,
              73,
              .08
            );

          border-radius:
            10px;

          background:
            rgba(
              255,
              255,
              255,
              .27
            );
        }

        .notes-column::before {
          content:
            "";

          position:
            absolute;

          inset:
            0;

          z-index:
            0;

          border-radius:
            inherit;

          opacity:
            .25;

          pointer-events:
            none;

          background-image:
            linear-gradient(
              rgba(
                67,
                61,
                54,
                .035
              )
              1px,
              transparent
              1px
            );

          background-size:
            100%
            22px;
        }

        .notes-column-head,
        .notes-column-stack {
          position:
            relative;

          z-index:
            1;
        }

        .notes-column-head {
          min-height:
            29px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .notes-column-head > div {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .notes-column-head strong {
          color:
            #625d56;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .notes-column-dot {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            #aaa69e;
        }

        .notes-column-count {
          min-width:
            19px;

          height:
            19px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .82
            );

          color:
            #8b867e;

          font-size:
            6px;
        }

        .notes-column-stack {
          margin-top:
            8px;

          display:
            grid;

          gap:
            13px;
        }

        .desk-note {
          min-height:
            115px;

          padding:
            16px
            14px
            12px;

          position:
            relative;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            rgba(
              75,
              68,
              60,
              .10
            );

          border-radius:
            2px;

          box-shadow:
            0 9px 18px
            rgba(
              58,
              50,
              41,
              .10
            );

          color:
            #3f3a34;

          transition:
            transform
            .18s ease;
        }

        .desk-note:hover {
          transform:
            rotate(
              0deg
            )
            translateY(
              -2px
            );
        }

        .desk-note-yellow {
          background:
            #f4e7a5;
        }

        .desk-note-pink {
          background:
            #efced3;
        }

        .desk-note-blue {
          background:
            #cedde2;
        }

        .desk-note-green {
          background:
            #ccd9bc;
        }

        .desk-note-cream {
          background:
            #e9dfc5;
        }

        .desk-note-grey {
          background:
            #d7d5cf;
        }

        .desk-note-lavender {
          background:
            #d9d1df;
        }

        .tilt-left {
          transform:
            rotate(
              -1deg
            );
        }

        .tilt-right {
          transform:
            rotate(
              1deg
            );
        }

        .desk-note-tape {
          width:
            48px;

          height:
            13px;

          position:
            absolute;

          top:
            -7px;

          left:
            50%;

          transform:
            translateX(
              -50%
            )
            rotate(
              -.5deg
            );

          border-radius:
            1px;

          background:
            rgba(
              245,
              239,
              222,
              .78
            );

          box-shadow:
            0 2px 4px
            rgba(
              50,
              44,
              38,
              .12
            );
        }

        .desk-note-top {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8px;
        }

        .desk-note-tag {
          color:
            rgba(
              63,
              58,
              52,
              .55
            );

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .desk-note-top button {
          padding:
            0;

          border:
            0;

          background:
            transparent;

          color:
            rgba(
              63,
              58,
              52,
              .45
            );

          font-size:
            10px;
        }

        .desk-note h4 {
          max-width:
            180px;

          margin-top:
            15px;

          font-family:
            Georgia,
            'Times New Roman',
            serif;

          font-size:
            11px;

          font-style:
            italic;

          font-weight:
            400;

          letter-spacing:
            -.015em;

          line-height:
            1.25;
        }

        .desk-note-lines {
          margin-top:
            13px;

          display:
            grid;

          gap:
            5px;
        }

        .desk-note-lines span {
          height:
            1px;

          display:
            block;

          background:
            rgba(
              70,
              62,
              55,
              .10
            );
        }

        .desk-note-lines span:last-child {
          width:
            68%;
        }

        .desk-note-footer {
          margin-top:
            auto;

          padding-top:
            11px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            9px;
        }

        .desk-note-footer small {
          color:
            rgba(
              63,
              58,
              52,
              .5
            );

          font-size:
            5px;

          font-weight:
            600;
        }

        .desk-note-check {
          width:
            19px;

          height:
            19px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              63,
              58,
              52,
              .12
            );

          border-radius:
            50%;

          background:
            rgba(
              255,
              255,
              255,
              .35
            );
        }

        .notes-add-card {
          min-height:
            32px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          border:
            1px dashed
            #cfc9c0;

          border-radius:
            6px;

          background:
            rgba(
              255,
              255,
              255,
              .25
            );

          color:
            #918b82;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .notes-bottom-row {
          margin-top:
            17px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            10px;
        }

        .notes-quick-card {
          min-height:
            63px;

          padding:
            12px;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          border:
            1px solid
            #ddd8d0;

          border-radius:
            10px;

          background:
            rgba(
              255,
              255,
              255,
              .6
            );

          color:
            #746e66;
        }

        .notes-quick-card > svg {
          color:
            var(--sage-dark);
        }

        .notes-quick-card span,
        .notes-quick-card strong {
          display:
            block;
        }

        .notes-quick-card span {
          color:
            #aaa49b;

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .notes-quick-card strong {
          margin-top:
            4px;

          font-family:
            Georgia,
            serif;

          font-size:
            8px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .floating-add-button {
          width:
            55px;

          height:
            55px;

          position:
            absolute;

          right:
            25px;

          bottom:
            25px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            0;

          border-radius:
            50%;

          background:
            #211f1c;

          color:
            white;

          box-shadow:
            0 15px 30px
            rgba(
              0,
              0,
              0,
              .16
            );
        }

        /* =====================================================
           WORKSPACE
        ===================================================== */

        .workspace-heading {
          margin-top:
            12px;
        }

        .workspace-heading .green-label {
          display:
            flex;
        }

        .workspace-heading-actions,
        .calendar-heading-buttons {
          display:
            flex;

          gap:
            8px;
        }

        .summary-wide-card {
          min-height:
            86px;

          margin-top:
            30px;

          padding:
            19px 22px;

          display:
            flex;

          align-items:
            center;

          gap:
            13px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .summary-spark {
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

          flex-shrink:
            0;

          border-radius:
            10px;

          background:
            #f3f6ee;

          color:
            var(--sage-dark);
        }

        .summary-wide-card p {
          margin-top:
            8px;

          color:
            #4f4c46;

          font-size:
            11px;
        }

        .workspace-choice-grid {
          margin-top:
            20px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            10px;
        }

        .workspace-choice {
          min-height:
            190px;

          padding:
            18px;

          position:
            relative;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .active-choice {
          border-color:
            #ced8c4;

          background:
            #fafbf7;
        }

        .choice-icon {
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
            #fbfaf8;

          color:
            #6f6a64;
        }

        .choice-icon.active {
          background:
            var(--sage);

          color:
            white;
        }

        .you-are-here {
          position:
            absolute;

          top:
            18px;

          right:
            18px;

          padding:
            5px 9px;

          border-radius:
            999px;

          background:
            white;

          color:
            var(--sage-dark);

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .workspace-choice h3 {
          margin-top:
            30px;
        }

        .workspace-choice p {
          max-width:
            300px;

          margin-top:
            8px;
        }

        .choice-link {
          margin-top:
            20px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .workspace-project-heading {
          margin-top:
            28px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;
        }

        .workspace-project-heading h3 {
          margin-top:
            5px;

          font-size:
            20px;
        }

        .workspace-project-heading p {
          margin-top:
            3px;
        }

        .project-search {
          width:
            220px;

          min-height:
            37px;

          padding:
            0 12px;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            11px;

          background:
            white;

          color:
            #aaa69e;

          font-size:
            7px;
        }

        .project-demo-list {
          margin-top:
            12px;

          display:
            grid;

          gap:
            7px;
        }

        .project-row-real {
          min-height:
            62px;

          padding:
            11px 15px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            14px;

          background:
            white;
        }

        .project-folder {
          width:
            35px;

          height:
            35px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            9px;

          background:
            #fbfaf8;

          color:
            #aaa69e;
        }

        .project-row-copy {
          min-width:
            0;

          flex:
            1;
        }

        .project-row-copy > div {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .project-row-real strong {
          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            11px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .project-row-copy > div > span {
          padding:
            4px 7px;

          border-radius:
            999px;

          background:
            #f0efec;

          color:
            #77736d;

          font-size:
            5px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .project-row-copy > small {
          display:
            block;

          margin-top:
            4px;

          color:
            var(--sage-dark);

          font-size:
            6px;

          font-weight:
            600;
        }

        .project-row-meta {
          min-width:
            78px;

          text-align:
            right;
        }

        .project-row-meta small,
        .project-row-meta strong {
          display:
            block;
        }

        .project-row-meta small {
          color:
            #aaa69e;

          font-size:
            5px;
        }

        .project-row-meta strong {
          margin-top:
            3px;

          font-size:
            8px;
        }

        /* =====================================================
           CALENDAR
        ===================================================== */

        .calendar-heading-real {
          margin-top:
            13px;
        }

        .calendar-tabs-real {
          margin-top:
            18px;

          padding:
            4px;

          display:
            flex;

          gap:
            4px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            10px;

          background:
            white;
        }

        .calendar-tabs-real span {
          min-height:
            31px;

          padding:
            0 13px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          border-radius:
            7px;

          color:
            #98948d;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .calendar-tabs-real span.active {
          background:
            #211f1c;

          color:
            white;
        }

        .calendar-summary {
          margin-top:
            20px;
        }

        .calendar-stat-grid {
          margin-top:
            15px;
        }

        .calendar-lower-grid {
          margin-top:
            17px;

          display:
            grid;

          grid-template-columns:
            1.3fr
            .9fr;

          gap:
            12px;
        }

        .today-card-real,
        .booking-card-real {
          min-height:
            220px;

          padding:
            18px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            18px;

          background:
            white;
        }

        .today-card-head {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            15px;
        }

        .today-card-head h3,
        .booking-card-real h3 {
          margin-top:
            5px;

          font-size:
            19px;
        }

        .demo-event-list {
          margin-top:
            17px;

          display:
            grid;

          gap:
            8px;
        }

        .demo-event-row {
          min-height:
            58px;

          padding:
            10px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          border-radius:
            12px;
        }

        .event-sage {
          background:
            #eef3e8;

          border-left:
            3px solid
            #9caf87;
        }

        .event-amber {
          background:
            #fff3df;

          border-left:
            3px solid
            #d4a859;
        }

        .demo-event-time {
          width:
            43px;

          flex-shrink:
            0;

          color:
            #77736c;

          font-size:
            7px;

          font-weight:
            700;
        }

        .demo-event-row strong,
        .demo-event-row small {
          display:
            block;
        }

        .demo-event-row strong {
          font-size:
            8px;
        }

        .demo-event-row small {
          margin-top:
            3px;

          color:
            #99958d;

          font-size:
            6px;
        }

        .booking-demo-heading {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .booking-live-dot {
          width:
            8px;

          height:
            8px;

          border-radius:
            50%;

          background:
            var(--sage);
        }

        .booking-line {
          min-height:
            40px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            12px;

          border-bottom:
            1px solid
            #eceae5;
        }

        .booking-line span {
          color:
            #aaa69e;

          font-size:
            7px;
        }

        .booking-line strong {
          font-size:
            7px;

          text-align:
            right;
        }

        /* =====================================================
           SETTINGS
        ===================================================== */

        .settings-page {
          padding-top:
            85px;
        }

        .settings-heading h2 {
          font-size:
            20px;
        }

        .settings-heading p {
          max-width:
            490px;

          margin-top:
            10px;

          font-size:
            9px;
        }

        .settings-top-actions {
          display:
            grid;

          grid-template-columns:
            1fr 1.5fr;

          gap:
            8px;
        }

        .settings-top-actions
        .black-wide-button {
          grid-column:
            1 / -1;
        }

        .settings-divider {
          height:
            1px;

          margin:
            26px 0
            30px;

          background:
            #e5e3dd;
        }

        .settings-profile-card {
          min-height:
            420px;

          padding:
            25px;

          display:
            grid;

          grid-template-columns:
            125px 1fr;

          gap:
            35px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            30px;

          background:
            white;
        }

        .settings-company-logo {
          width:
            115px;

          height:
            115px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            28px;

          background:
            #f7f5ef;
        }

        .dummy-brand-mark {
          width:
            78px;

          height:
            78px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            23px;

          background:
            #25231f;

          color:
            #d7c39e;

          font-family:
            Georgia,
            serif;

          font-size:
            23px;

          font-style:
            italic;
        }

        .dummy-brand-mark.small {
          width:
            42px;

          height:
            42px;

          border-radius:
            12px;

          font-size:
            13px;
        }

        .settings-form-area label {
          display:
            block;

          color:
            #a9a59d;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .settings-two-fields {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            15px;
        }

        .settings-input {
          min-height:
            36px;

          margin-top:
            5px;

          padding:
            0 10px;

          display:
            flex;

          align-items:
            center;

          border:
            1px solid
            var(--app-border);

          border-radius:
            10px;

          font-size:
            7px;
        }

        .settings-input.filled {
          color:
            #77736c;
        }

        .settings-summary-field {
          margin-top:
            24px;
        }

        .settings-textarea {
          min-height:
            130px;

          margin-top:
            5px;

          padding:
            12px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            11px;
        }

        .filled-textarea {
          color:
            #77736c;

          font-size:
            7px;

          line-height:
            1.7;
        }

        .company-logo-row {
          margin-top:
            30px;
        }

        .company-logo-controls {
          margin-top:
            7px;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;
        }

        .company-logo-controls button {
          min-height:
            30px;

          padding:
            0 10px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            8px;

          background:
            white;

          font-size:
            7px;
        }

        .company-logo-controls > span {
          padding:
            7px 10px;

          border:
            1px solid
            #b8e6d0;

          border-radius:
            8px;

          background:
            #eafaf2;

          color:
            #31966e;

          font-size:
            7px;
        }

        /* =====================================================
           CLARITY TOUR SCREEN
        ===================================================== */

        .clarity-tour-screen {
          padding-top:
            75px;
        }

        .clarity-tour-head {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            30px;
        }

        .clarity-tour-head h2 {
          margin-top:
            8px;

          font-size:
            24px;
        }

        .clarity-tour-head p {
          max-width:
            470px;

          margin-top:
            9px;
        }

        .clarity-floating-demo {
          width:
            48px;

          height:
            48px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #211f1c;

          color:
            white;
        }

        .clarity-chat-tour {
          max-width:
            700px;

          margin:
            34px auto
            0;
        }

        .clarity-user {
          width:
            fit-content;

          max-width:
            70%;

          margin-left:
            auto;

          padding:
            12px 14px;

          border:
            1px solid
            var(--app-border);

          border-radius:
            15px 15px
            4px 15px;

          background:
            white;

          color:
            #5b5751;

          font-size:
            9px;
        }

        .clarity-answer {
          max-width:
            90%;

          margin-top:
            10px;

          padding:
            16px;

          border:
            1px solid
            #dbe4d1;

          border-radius:
            4px 15px
            15px 15px;

          background:
            #f3f6ee;
        }

        .clarity-answer-title {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          color:
            var(--sage-dark);

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .clarity-answer > p {
          margin-top:
            8px;

          color:
            #5d5953;

          font-size:
            9px;
        }

        .clarity-suggestion-list {
          margin-top:
            12px;

          display:
            grid;

          gap:
            7px;
        }

        .clarity-suggestion-list > div {
          min-height:
            47px;

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
            #e0e6da;

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

        .clarity-suggestion-list > div > span {
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

        .clarity-suggestion-list strong,
        .clarity-suggestion-list small {
          display:
            block;
        }

        .clarity-suggestion-list strong {
          font-size:
            8px;
        }

        .clarity-suggestion-list small {
          margin-top:
            3px;

          color:
            #99958d;

          font-size:
            6px;
        }

        .small-answer {
          max-width:
            75%;
        }

        /* =====================================================
           DEMO CTA
        ===================================================== */

        .demo-mobile-tabs {
          margin-top:
            16px;

          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

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
        }

        .demo-mobile-tabs button.active {
          background:
            var(--sage-light);

          color:
            var(--sage-dark);
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

          gap:
            8px;

          flex-shrink:
            0;
        }

        /* =====================================================
           TOUR
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
              25,
              24,
              22,
              .72
            );

          backdrop-filter:
            blur(
              14px
            );
        }

        .tour-window {
          width:
            min(
              1420px,
              100%
            );

          height:
            min(
              870px,
              calc(
                100vh -
                40px
              )
            );

          overflow:
            hidden;

          border-radius:
            28px;

          background:
            #f7f5ef;

          box-shadow:
            0 45px 120px
            rgba(
              0,
              0,
              0,
              .32
            );
        }

        .tour-topbar {
          height:
            68px;

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
            #e1dfd8;

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
            7px;

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
            #4d4943;
        }

        .tour-layout {
          height:
            calc(
              100% -
              68px
            );

          display:
            grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            350px;
        }

        .tour-preview {
          padding:
            20px;

          overflow:
            auto;

          background:
            #ebe9e3;
        }

        .tour-app-shell {
          width:
            1080px;

          min-height:
            680px;

          display:
            grid;

          grid-template-columns:
            155px
            925px;

          overflow:
            hidden;

          border:
            1px solid
            #dcd9d2;

          border-radius:
            18px;

          background:
            var(--app-bg);
        }

        .tour-app-shell
        .app-sidebar {
          min-height:
            680px;
        }

        .tour-app-content
        .app-page {
          transform-origin:
            top left;
        }

        .tour-guide {
          padding:
            32px;

          display:
            flex;

          flex-direction:
            column;

          border-left:
            1px solid
            #e1ded7;

          background:
            white;
        }

        .tour-progress {
          display:
            grid;

          grid-template-columns:
            repeat(
              10,
              1fr
            );

          gap:
            4px;
        }

        .tour-progress span {
          height:
            3px;

          border-radius:
            999px;

          background:
            #ebe8e1;
        }

        .tour-progress span.active {
          background:
            var(--sage);
        }

        .tour-eyebrow {
          margin-top:
            32px;

          color:
            var(--sage-dark);

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .tour-guide h2,
        .tour-finish h2 {
          margin-top:
            13px;

          color:
            #25231f;

          font-size:
            32px;

          font-weight:
            500;

          line-height:
            1.08;
        }

        .tour-guide > p,
        .tour-finish > p {
          margin-top:
            16px;

          color:
            #7b776f;

          font-size:
            13px;

          line-height:
            1.75;
        }

        .tour-callout {
          margin-top:
            22px;

          padding:
            14px;

          display:
            flex;

          gap:
            10px;

          border:
            1px solid
            #dbe3d2;

          border-radius:
            14px;

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
            10px;
        }

        .tour-callout span {
          margin-top:
            5px;

          font-size:
            9px;

          line-height:
            1.5;
        }

        .tour-controls {
          margin-top:
            auto;

          display:
            flex;

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
            10px;

          font-weight:
            600;
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
            .3;
        }

        .tour-next {
          margin-left:
            auto;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          border:
            0;

          background:
            #25231f;

          color:
            white;
        }

        .tour-count {
          margin-top:
            14px;

          color:
            #aaa69e;

          font-size:
            8px;

          text-align:
            right;
        }

        .tour-finish {
          height:
            calc(
              100% -
              68px
            );

          padding:
            50px 25px;

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
              circle,
              #f1f5eb,
              #f8f6f1
              58%,
              #f1eee7
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
            #25231f;

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
              2.8rem,
              5vw,
              4.8rem
            );
        }

        .tour-finish > p {
          max-width:
            550px;
        }

        .tour-finish-actions {
          margin-top:
            28px;

          display:
            flex;

          gap:
            8px;

          flex-wrap:
            wrap;

          justify-content:
            center;
        }

        .tour-finish-note {
          margin-top:
            16px;

          color:
            #9d9991;

          font-size:
            8px;
        }

        /* =====================================================
           FINAL LANDING PAGE POLISH
           Completes the public-facing styles used by the JSX.
        ===================================================== */

        .mobile-menu-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .mobile-menu-top > button {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: rgba(255,255,255,.8);
          color: var(--charcoal);
          cursor: pointer;
        }

        .mobile-menu-links {
          margin-top: 24px;
          display: grid;
          border-top: 1px solid var(--border);
        }

        .mobile-menu-links a {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          color: var(--charcoal-soft);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .mobile-menu-actions {
          margin-top: 22px;
          display: grid;
          gap: 9px;
        }

        /* ---------------- HERO ---------------- */

        .hero {
          position: relative;
          padding: 156px 0 92px;
          overflow: hidden;
        }

        .hero::before {
          content: "";
          position: absolute;
          width: 720px;
          height: 720px;
          top: -220px;
          left: -170px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(198,157,105,.18), rgba(198,157,105,.06) 43%, transparent 72%);
          filter: blur(20px);
          pointer-events: none;
        }

        .hero::after {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          right: -220px;
          bottom: -260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(170,189,150,.16), transparent 70%);
          pointer-events: none;
        }

        .hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, .92fr) minmax(460px, 1.08fr);
          gap: 72px;
          align-items: center;
        }

        .hero-copy {
          max-width: 620px;
        }

        .hero-title {
          max-width: 720px;
          margin-top: 24px !important;
          font-size: clamp(4rem, 6.6vw, 7.2rem);
          font-weight: 500;
          letter-spacing: -.07em !important;
          line-height: .92 !important;
        }

        .hero-description {
          max-width: 620px;
          margin-top: 27px !important;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.75;
        }

        .hero-actions {
          margin-top: 32px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .hero-proof {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 20px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 500;
        }

        .hero-proof > div {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .hero-proof svg {
          color: var(--sage-dark);
        }

        .hero-visual {
          min-height: 520px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-visual-glow {
          position: absolute;
          inset: 8% 3%;
          border-radius: 42%;
          background: radial-gradient(circle at 50% 50%, rgba(198,157,105,.24), rgba(170,189,150,.12) 42%, transparent 70%);
          filter: blur(28px);
        }

        .hero-window {
          width: min(100%, 620px);
          position: relative;
          z-index: 2;
          overflow: hidden;
          border: 1px solid rgba(55,55,53,.12);
          border-radius: 25px;
          background: #fff;
          box-shadow: 0 35px 90px rgba(47,43,36,.16), 0 4px 12px rgba(47,43,36,.05);
          transform: rotate(1.1deg);
        }

        .hero-window-top {
          height: 46px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ece9e2;
          background: #faf9f6;
          color: #98938b;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .window-dots {
          display: flex;
          gap: 5px;
        }

        .window-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d7d2c8;
        }

        .hero-window-content {
          min-height: 385px;
          display: grid;
          grid-template-columns: 72px 1fr;
          background: var(--app-bg);
        }

        .hero-mini-sidebar {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          border-right: 1px solid #e7e4de;
          background: white;
        }

        .hero-mini-sidebar > div {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #aaa59c;
        }

        .hero-mini-sidebar > div.active {
          background: var(--sage);
          color: white;
        }

        .hero-mini-main {
          padding: 28px 26px;
        }

        .hero-mini-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .hero-mini-heading span,
        .hero-mini-heading strong {
          display: block;
        }

        .hero-mini-heading span {
          color: #a19c93;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .hero-mini-heading strong {
          margin-top: 4px;
          font-size: 16px;
          font-weight: 600;
        }

        .hero-mini-clarity {
          padding: 8px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          background: var(--sage-light);
          color: var(--sage-dark);
          font-size: 8px;
          font-weight: 700;
        }

        .hero-mini-metrics {
          margin-top: 25px;
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 9px;
        }

        .hero-mini-metrics > div {
          min-height: 76px;
          padding: 13px;
          border: 1px solid #e8e5df;
          border-radius: 13px;
          background: white;
        }

        .hero-mini-metrics span,
        .hero-mini-metrics strong {
          display: block;
        }

        .hero-mini-metrics span {
          color: #9e9990;
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .hero-mini-metrics strong {
          margin-top: 12px;
          font-size: 19px;
          font-weight: 500;
        }

        .hero-mini-panels {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 10px;
        }

        .hero-mini-focus,
        .hero-mini-schedule {
          min-height: 145px;
          padding: 15px;
          border: 1px solid #e8e5df;
          border-radius: 14px;
          background: white;
        }

        .hero-mini-focus > span,
        .hero-mini-schedule > span {
          color: var(--sage-dark);
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .hero-mini-focus > strong {
          display: block;
          margin-top: 5px;
          font-size: 11px;
        }

        .hero-mini-focus > div,
        .hero-mini-schedule > div {
          height: 18px;
          margin-top: 8px;
          border-radius: 6px;
          background: #f3f1ec;
        }

        .hero-mini-schedule > div:nth-of-type(2) {
          width: 80%;
        }

        .hero-mini-schedule > div:nth-of-type(3) {
          width: 62%;
        }

        .hero-floating-card {
          position: absolute;
          z-index: 4;
          padding: 14px 16px;
          border: 1px solid rgba(55,55,53,.1);
          border-radius: 16px;
          background: rgba(255,255,255,.94);
          box-shadow: 0 18px 45px rgba(47,43,36,.13);
          backdrop-filter: blur(12px);
        }

        .hero-floating-card span,
        .hero-floating-card strong {
          display: block;
        }

        .hero-floating-card span {
          color: var(--sage-dark);
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .hero-floating-card span svg {
          margin-right: 5px;
          vertical-align: -2px;
        }

        .hero-floating-card strong {
          margin-top: 6px;
          color: var(--charcoal);
          font-size: 12px;
          line-height: 1.35;
        }

        .hero-floating-one {
          left: -12px;
          bottom: 58px;
          width: 180px;
          transform: rotate(-2deg);
        }

        .hero-floating-two {
          right: -10px;
          top: 65px;
          min-width: 126px;
          transform: rotate(2deg);
        }

        .hero-floating-two strong {
          font-size: 24px;
          font-weight: 500;
        }

        .trusted-block {
          margin-top: 72px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .trusted-label {
          display: block;
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .trusted-row {
          margin-top: 17px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px 25px;
        }

        .trusted-row span {
          color: #8b877f;
          font-size: 11px;
          font-weight: 600;
        }

        /* ---------------- PRODUCT STATEMENT ---------------- */

        .product-statement {
          margin-top: 52px;
          padding: 30px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: stretch;
          gap: 28px;
          border: 1px solid var(--border);
          border-radius: 26px;
          background: rgba(255,255,255,.58);
        }

        .product-statement > div {
          min-height: 180px;
          padding: 27px;
          border-radius: 20px;
          background: #f0ede6;
        }

        .product-statement > svg {
          align-self: center;
          color: var(--tan-dark);
        }

        .product-statement span {
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .product-statement p {
          margin-top: 16px;
          color: var(--charcoal-soft);
          font-size: 17px;
          line-height: 1.7;
        }

        .product-statement-final {
          border: 1px solid rgba(170,189,150,.4);
          background: #f7faf2 !important;
        }

        .product-statement-final strong {
          display: block;
          margin-top: 16px;
          font-family: 'Manrope', sans-serif;
          font-size: 34px;
          letter-spacing: -.045em;
        }

        /* ---------------- FEATURES ---------------- */

        .feature-grid {
          margin-top: 54px;
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 16px;
        }

        .feature-card {
          min-height: 295px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 24px;
          background: rgba(255,255,255,.58);
          box-shadow: 0 12px 30px rgba(55,55,53,.025);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(198,157,105,.28);
          box-shadow: 0 22px 50px rgba(55,55,53,.075);
        }

        .feature-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .feature-number {
          color: #b1ada5;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .15em;
        }

        .feature-card h3 {
          margin-top: auto !important;
          padding-top: 52px;
          font-size: 24px;
          font-weight: 600;
        }

        .feature-card p {
          margin-top: 11px !important;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        /* ---------------- CLARITY ---------------- */

        .clarity-grid {
          display: grid;
          grid-template-columns: .88fr 1.12fr;
          gap: 72px;
          align-items: center;
        }

        .clarity-points {
          margin-top: 30px;
          display: grid;
          gap: 10px;
        }

        .clarity-points > div {
          min-height: 44px;
          padding: 10px 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(255,255,255,.55);
          color: var(--charcoal-soft);
          font-size: 12px;
        }

        .clarity-points svg {
          color: var(--sage-dark);
        }

        .clarity-showcase {
          padding: 24px;
          border: 1px solid var(--border);
          border-radius: 26px;
          background: #fffefd;
          box-shadow: var(--shadow);
        }

        .clarity-showcase-top {
          padding-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-bottom: 1px solid var(--border);
        }

        .clarity-showcase-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #25231f;
          color: var(--sage);
        }

        .clarity-showcase-top span,
        .clarity-showcase-top strong {
          display: block;
        }

        .clarity-showcase-top span {
          color: var(--sage-dark);
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .clarity-showcase-top strong {
          margin-top: 3px;
          font-size: 13px;
        }

        .clarity-showcase-user {
          width: fit-content;
          max-width: 78%;
          margin: 22px 0 0 auto;
          padding: 13px 15px;
          border: 1px solid var(--border);
          border-radius: 16px 16px 4px 16px;
          background: var(--cream);
          color: var(--charcoal-soft);
          font-size: 12px;
        }

        .clarity-showcase-answer {
          max-width: 94%;
          margin-top: 12px;
          padding: 18px;
          border: 1px solid #dbe4d1;
          border-radius: 4px 18px 18px 18px;
          background: var(--sage-light);
        }

        .clarity-showcase-answer > span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--sage-dark);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .clarity-showcase-answer > p {
          margin-top: 9px !important;
          color: var(--charcoal-soft);
          font-size: 12px;
          line-height: 1.65;
        }

        .clarity-showcase-item {
          min-height: 58px;
          margin-top: 9px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(130,153,110,.16);
          border-radius: 12px;
          background: rgba(255,255,255,.72);
        }

        .clarity-showcase-item > b {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--sage);
          color: white;
          font-size: 8px;
        }

        .clarity-showcase-item strong,
        .clarity-showcase-item small {
          display: block;
        }

        .clarity-showcase-item strong {
          font-size: 10px;
        }

        .clarity-showcase-item small {
          margin-top: 3px;
          color: #8f8a82;
          font-size: 8px;
        }

        /* ---------------- PRICING ---------------- */

        .pricing-grid {
          margin-top: 54px;
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 16px;
          align-items: stretch;
        }

        .pricing-grid > div {
          height: 100%;
        }

        .pricing-card {
          min-height: 600px;
          height: 100%;
          padding: 29px;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 27px;
          background: rgba(255,255,255,.7);
          box-shadow: 0 14px 34px rgba(55,55,53,.035);
        }

        .pricing-card.featured {
          border-color: rgba(198,157,105,.42);
          background: #fffaf3;
          box-shadow: 0 24px 55px rgba(167,125,77,.10);
          transform: translateY(-9px);
        }

        .pricing-badge {
          width: fit-content;
          margin: -8px 0 19px auto;
          padding: 7px 10px;
          border-radius: 999px;
          background: var(--tan-soft);
          color: #75532f;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .pricing-name {
          color: var(--charcoal-soft);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .pricing-price {
          margin-top: 27px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }

        .pricing-price > span {
          margin-bottom: 17px;
          font-size: 18px;
          font-weight: 600;
        }

        .pricing-price strong {
          font-family: 'Manrope', sans-serif;
          font-size: 62px;
          font-weight: 600;
          letter-spacing: -.07em;
          line-height: .9;
        }

        .pricing-price small {
          margin: 0 0 7px 5px;
          color: var(--muted);
          font-size: 10px;
        }

        .pricing-description {
          min-height: 90px;
          margin-top: 22px !important;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .pricing-divider {
          height: 1px;
          margin: 23px 0;
          background: var(--border);
        }

        .pricing-features {
          display: grid;
          gap: 12px;
        }

        .pricing-features > div {
          display: flex;
          gap: 9px;
          color: var(--charcoal-soft);
          font-size: 12px;
          line-height: 1.5;
        }

        .pricing-features svg {
          margin-top: 2px;
          flex: 0 0 auto;
          color: var(--tan-dark);
        }

        .pricing-button {
          width: 100%;
          margin-top: auto;
        }

        /* ---------------- ABOUT ---------------- */

        .about-layout {
          display: grid;
          grid-template-columns: .84fr 1.16fr;
          gap: 66px;
          align-items: start;
        }

        .about-layout .section-title {
          font-size: clamp(2.7rem,4.3vw,4.8rem);
        }

        .about-story-kicker {
          width: fit-content;
          margin-top: 25px;
          padding: 10px 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(170,189,150,.38);
          border-radius: 999px;
          background: var(--sage-light);
          color: var(--sage-dark);
          font-size: 10px;
          font-weight: 700;
        }

        .about-founders {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 14px;
        }

        .about-us-card {
          grid-column: 1 / -1;
          padding: 27px;
          border: 1px solid var(--border);
          border-radius: 24px;
          background: #262421;
          color: white;
        }

        .about-us-card .green-label {
          color: var(--sage);
        }

        .about-us-card h3 {
          max-width: 650px;
          margin-top: 10px !important;
          color: white;
          font-size: 28px;
          font-weight: 500;
        }

        .about-us-card p {
          margin-top: 15px !important;
          color: rgba(255,255,255,.64);
          font-size: 13px;
          line-height: 1.75;
        }

        .about-founder-card {
          min-height: 310px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 22px;
          background: rgba(255,255,255,.7);
        }

        .about-founder-card.featured {
          border-color: rgba(198,157,105,.32);
          background: #fffaf3;
        }

        .about-founder-head {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .about-founder-avatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 15px;
          background: var(--sage-light);
          color: var(--sage-dark);
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 700;
        }

        .about-founder-card.featured .about-founder-avatar {
          background: var(--tan-soft);
          color: var(--tan-dark);
        }

        .about-founder-head span {
          color: var(--muted);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .about-founder-head h3 {
          margin-top: 3px !important;
          font-size: 23px;
          font-weight: 600;
        }

        .about-founder-card > p {
          margin-top: 20px !important;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.75;
        }

        .about-founder-note {
          margin-top: auto;
          padding-top: 22px;
          color: var(--charcoal-soft);
          font-family: Georgia, serif;
          font-size: 12px;
          font-style: italic;
          line-height: 1.6;
        }

        /* ---------------- FAQ ---------------- */

        .faq-list {
          max-width: 850px;
          margin: 48px auto 0;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 24px;
          background: rgba(255,255,255,.62);
        }

        .faq-item + .faq-item {
          border-top: 1px solid var(--border);
        }

        .faq-question {
          width: 100%;
          min-height: 76px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border: 0;
          background: transparent;
          color: var(--charcoal);
          text-align: left;
          cursor: pointer;
        }

        .faq-question > span {
          font-size: 15px;
          font-weight: 600;
        }

        .faq-question svg {
          flex: 0 0 auto;
          color: var(--muted);
          transition: transform .2s ease;
        }

        .faq-item.open .faq-question svg {
          transform: rotate(180deg);
        }

        .faq-answer {
          overflow: hidden;
        }

        .faq-answer p {
          padding: 0 24px 24px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.75;
        }

        /* ---------------- FINAL CTA ---------------- */

        .final-cta-section {
          padding: 20px 0 110px;
        }

        .final-cta {
          min-height: 500px;
          padding: 70px 34px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 32px;
          background: #25231f;
          color: white;
          text-align: center;
        }

        .final-cta-glow {
          width: 560px;
          height: 560px;
          position: absolute;
          top: -370px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(198,157,105,.25);
          filter: blur(70px);
          pointer-events: none;
        }

        .final-cta .tots-eyebrow {
          position: relative;
          color: rgba(255,255,255,.65);
        }

        .final-cta h2 {
          max-width: 830px;
          margin-top: 22px !important;
          position: relative;
          color: white;
          font-size: clamp(3rem,5.5vw,5.8rem);
          font-weight: 500;
        }

        .final-cta h2 span {
          color: #d6b286;
        }

        .final-cta > p {
          max-width: 610px;
          margin-top: 20px !important;
          position: relative;
          color: rgba(255,255,255,.62);
          font-size: 14px;
          line-height: 1.75;
        }

        .final-cta-actions {
          margin-top: 28px;
          position: relative;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
        }

        .final-cta .button-primary {
          border-color: white;
          background: white;
          color: var(--charcoal) !important;
        }

        .final-cta .button-secondary {
          border-color: rgba(255,255,255,.16);
          background: rgba(255,255,255,.06);
          color: white;
        }

        /* ---------------- FOOTER ---------------- */

        .tots-footer {
          padding: 0 0 28px;
        }

        .footer-top {
          min-height: 92px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 24px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .footer-links a {
          padding: 8px 10px;
          color: var(--muted);
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
        }

        .footer-top > .button-primary {
          justify-self: end;
        }

        .footer-bottom {
          padding-top: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: var(--muted);
          font-size: 9px;
        }

        /* ---------------- DEMO/TABLET POLISH ---------------- */

        .product-demo-frame,
        .tour-app-shell {
          background: var(--app-bg);
        }

        .app-page {
          min-width: 0;
        }

        .product-demo-content,
        .tour-app-content {
          scrollbar-width: thin;
          scrollbar-color: #d8d3ca transparent;
        }

        .product-demo-content::-webkit-scrollbar,
        .tour-app-content::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .product-demo-content::-webkit-scrollbar-thumb,
        .tour-app-content::-webkit-scrollbar-thumb {
          background: #d8d3ca;
          border-radius: 999px;
        }

        .notes-board {
          align-items: start;
        }

        @media (max-width: 1080px) {
          .hero-grid { gap: 46px; }
          .hero-visual { min-height: 480px; }
          .product-statement { grid-template-columns: 1fr; }
          .product-statement > svg { transform: rotate(90deg); justify-self: center; }
          .about-layout { grid-template-columns: 1fr; gap: 42px; }
          .clarity-grid { grid-template-columns: 1fr; gap: 45px; }
          .footer-top { grid-template-columns: 1fr auto; }
          .footer-links { grid-column: 1 / -1; grid-row: 2; justify-content: flex-start; padding-bottom: 18px; }
        }

        @media (max-width: 860px) {
          .hero-grid { gap: 28px; }
          .hero-visual { min-height: 430px; }
          .hero-window { max-width: 560px; }
          .hero-floating-one { left: 5px; bottom: 34px; }
          .hero-floating-two { right: 5px; top: 34px; }
          .feature-grid { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card.featured { transform: none; }
          .about-founders { grid-template-columns: 1fr; }
          .about-us-card { grid-column: auto; }
          .notes-board { grid-template-columns: repeat(3,minmax(230px,1fr)); overflow-x: auto; padding-bottom: 8px; }
          .notes-column { min-width: 230px; }
        }

        @media (max-width: 640px) {
          .hero { padding: 118px 0 72px; }
          .hero-title { font-size: clamp(3.1rem,14vw,4.8rem); }
          .hero-description { font-size: 15px; }
          .hero-visual { min-height: 370px; margin-top: 8px; }
          .hero-window { transform: none; border-radius: 18px; }
          .hero-window-content { min-height: 310px; grid-template-columns: 54px 1fr; }
          .hero-mini-sidebar { padding: 12px 8px; }
          .hero-mini-sidebar > div { width: 32px; height: 32px; }
          .hero-mini-main { padding: 18px 14px; }
          .hero-mini-metrics { gap: 5px; }
          .hero-mini-metrics > div { min-height: 65px; padding: 9px; }
          .hero-mini-metrics strong { font-size: 15px; }
          .hero-mini-panels { grid-template-columns: 1fr; }
          .hero-mini-schedule { display: none; }
          .hero-floating-card { display: none; }
          .trusted-block { margin-top: 48px; }
          .product-statement { padding: 16px; gap: 14px; }
          .product-statement > div { min-height: 0; padding: 22px; }
          .product-statement p { font-size: 15px; }
          .clarity-showcase { padding: 16px; }
          .pricing-card { min-height: auto; padding: 24px; }
          .pricing-description { min-height: 0; }
          .about-us-card, .about-founder-card { padding: 22px; }
          .faq-question { min-height: 68px; padding: 0 18px; }
          .faq-answer p { padding: 0 18px 20px; }
          .final-cta-section { padding-bottom: 72px; }
          .final-cta { min-height: 440px; padding: 56px 20px; border-radius: 24px; }
          .final-cta-actions { width: 100%; flex-direction: column; }
          .final-cta-actions .button-primary, .final-cta-actions .button-secondary { width: 100%; }
          .footer-top { grid-template-columns: 1fr; padding: 24px 0; }
          .footer-top > .button-primary { justify-self: stretch; width: 100%; }
          .footer-links { grid-column: auto; grid-row: auto; justify-content: flex-start; padding-bottom: 0; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }

                    /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (
          max-width:
          1080px
        ) {
          .tots-nav {
            grid-template-columns:
              1fr
              auto;
          }

          .tots-nav-links {
            display:
              none;
          }

          .tots-nav-actions {
            display:
              none;
          }

          .tots-menu-button {
            display:
              inline-flex;

            justify-self:
              end;
          }

          .hero-grid {
            grid-template-columns:
              1fr;
          }

          .hero-copy {
            max-width:
              780px;
          }

          .feature-grid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .pricing-grid {
            grid-template-columns:
              1fr;
          }

          .pricing-card.featured {
            transform:
              none;
          }

          .about-grid {
            grid-template-columns:
              1fr;
          }

          .clarity-grid {
            grid-template-columns:
              1fr;
          }

          .tour-layout {
            grid-template-columns:
              minmax(
                0,
                1fr
              )
              320px;
          }

          .tour-preview {
            padding:
              18px;
          }

          .tour-guide {
            padding:
              30px 24px;
          }
        }

        @media (
          max-width:
          860px
        ) {
          .tots-section {
            padding:
              82px 0;
          }

          .tots-container {
            width:
              min(
                100% - 28px,
                1180px
              );
          }

          .hero {
            padding-top:
              130px;
          }

          .hero-title {
            font-size:
              clamp(
                3.3rem,
                12vw,
                6rem
              );
          }

          .feature-grid {
            grid-template-columns:
              1fr;
          }

          .demo-shell {
            border-radius:
              24px;
          }

          .product-demo-frame {
            padding:
              10px;
          }

          .product-demo-app {
            min-height:
              600px;
          }

          .app-sidebar {
            display:
              none;
          }

          .product-demo-content {
            width:
              100%;
          }

          .demo-mobile-tabs {
            display:
              flex;
          }

          .demo-cta {
            grid-template-columns:
              1fr;

            gap:
              24px;
          }

          .demo-cta-actions {
            justify-content:
              flex-start;
          }

          .tour-window {
            width:
              calc(
                100% - 20px
              );

            height:
              calc(
                100vh - 20px
              );

            max-height:
              none;

            border-radius:
              22px;
          }

          .tour-layout {
            grid-template-columns:
              1fr;

            overflow-y:
              auto;
          }

          .tour-preview {
            min-height:
              470px;

            border-right:
              0;

            border-bottom:
              1px solid
              var(--border);
          }

          .tour-app-shell {
            min-height:
              430px;
          }

          .tour-app-shell
          .app-sidebar {
            display:
              none;
          }

          .tour-guide {
            min-height:
              auto;
          }

          .home-dashboard-grid {
            grid-template-columns:
              1fr;
          }

          .home-metrics,
          .campaign-metric-grid,
          .workspace-metric-grid,
          .calendar-stat-grid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .finance-main-metrics {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .finance-lower-grid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .social-create-grid,
          .workspace-choice-grid,
          .calendar-lower-grid {
            grid-template-columns:
              1fr;
          }

          .kanban-real {
            grid-template-columns:
              1fr;
          }

          .settings-profile-card {
            grid-template-columns:
              1fr;
          }

          .settings-company-logo {
            border-right:
              0;

            border-bottom:
              1px solid
              var(--app-border);
          }
        }

        @media (
          max-width:
          640px
        ) {
          .tots-nav-wrap {
            padding:
              10px;
          }

          .tots-nav {
            height:
              60px;

            padding:
              0 10px
              0 13px;

            border-radius:
              16px;
          }

          .tots-logo-copy small {
            display:
              none;
          }

          .hero {
            padding-top:
              112px;
          }

          .hero-actions {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .hero-actions
          .button-primary,
          .hero-actions
          .button-secondary {
            width:
              100%;
          }

          .trusted-row {
            gap:
              18px;
          }

          .section-title {
            font-size:
              clamp(
                2.4rem,
                12vw,
                4rem
              );
          }

          .home-header,
          .campaign-header-real,
          .social-heading-real,
          .finance-title-card,
          .workspace-heading,
          .calendar-heading-real,
          .settings-heading {
            flex-direction:
              column;

            align-items:
              flex-start;

            gap:
              18px;
          }

          .home-metrics,
          .campaign-metric-grid,
          .workspace-metric-grid,
          .calendar-stat-grid,
          .finance-main-metrics,
          .finance-lower-grid {
            grid-template-columns:
              1fr;
          }

          .contacts-top {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .contacts-actions {
            width:
              100%;
          }

          .contact-search {
            flex:
              1;
          }

          .campaign-table {
            overflow-x:
              auto;
          }

          .campaign-table-head,
          .campaign-table-row {
            min-width:
              650px;
          }

          .audience-grid {
            grid-template-columns:
              1fr;
          }

          .finance-title-actions,
          .workspace-heading-actions,
          .calendar-heading-buttons,
          .settings-top-actions {
            width:
              100%;

            flex-wrap:
              wrap;
          }

          .finance-nav-tabs,
          .calendar-tabs-real {
            overflow-x:
              auto;

            white-space:
              nowrap;
          }

          .settings-two-fields {
            grid-template-columns:
              1fr;
          }

          .demo-cta {
            padding:
              28px 22px;
          }

          .demo-cta-actions {
            width:
              100%;

            flex-direction:
              column;
          }

          .demo-cta-actions
          .button-primary,
          .demo-cta-actions
          .button-secondary {
            width:
              100%;
          }

          .tour-topbar {
            padding:
              12px 14px;
          }

          .tour-brand
          .tots-logo-copy {
            display:
              none;
          }

          .tour-preview {
            min-height:
              390px;

            padding:
              10px;
          }

          .tour-app-shell {
            min-height:
              370px;

            border-radius:
              14px;
          }

          .tour-guide {
            padding:
              28px 20px;
          }

          .tour-guide h2 {
            font-size:
              2rem;
          }

          .tour-controls {
            flex-direction:
              column-reverse;
          }

          .tour-controls button {
            width:
              100%;
          }

          .tour-finish {
            padding:
              30px 20px;
          }

          .tour-finish h2 {
            font-size:
              clamp(
                2.4rem,
                12vw,
                3.8rem
              );
          }

          .tour-finish-actions {
            width:
              100%;

            flex-direction:
              column;
          }

          .tour-finish-actions
          .button-primary,
          .tour-finish-actions
          .button-secondary {
            width:
              100%;
          }

          .app-page {
            padding:
              22px 18px;
          }

          .notes-header {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .notes-search {
            width:
              100%;
          }

          .notes-filters {
            overflow-x:
              auto;
          }

          .contact-row-real {
            grid-template-columns:
              auto
              minmax(
                0,
                1fr
              )
              auto;
          }

          .coming-event {
            grid-template-columns:
              58px
              1fr;
          }

          .clarity-chat-tour {
            padding:
              18px;
          }
        }

      `}</style>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <header className="tots-nav-wrap">
        <nav className="tots-nav">
          <a
            href="#top"
            className="tots-brand"
          >
            <Logo />
          </a>

          <div className="tots-nav-links">
            {NAV_ITEMS.map(
              (
                item
              ) => (
                <a
                  key={
                    item.label
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
          </div>

          <div className="tots-nav-actions">
            <a
              href={
                SIGNUP_URL
              }
              className="button-secondary"
            >
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
                size={14}
              />
            </a>
          </div>

          <button
            type="button"
            className="tots-menu-button"
            aria-label="Open menu"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
          >
            <Menu
              size={19}
            />
          </button>
        </nav>
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
              exit={{
                y:
                  -20,
                opacity:
                  0,
              }}
            >
              <div className="mobile-menu-top">
                <Logo />

                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <div className="mobile-menu-links">
                {NAV_ITEMS.map(
                  (
                    item
                  ) => (
                    <a
                      key={
                        item.label
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
                        size={16}
                      />
                    </a>
                  )
                )}
              </div>

              <div className="mobile-menu-actions">
                <a
                  href={
                    SIGNUP_URL
                  }
                  className="button-secondary"
                >
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
                    size={14}
                  />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          HERO
      ====================================================== */}

      <main id="top">
        <section className="hero">
          <div className="tots-container">
            <div className="hero-grid">
              <Reveal>
                <div className="hero-copy">
                  <Eyebrow>
                    Your business.
                    Finally
                    organised.
                  </Eyebrow>

                  <h1 className="hero-title">
                    One place
                    to run{" "}
                    <span className="gold-text">
                      everything.
                    </span>
                  </h1>

                  <p className="hero-description">
                    TOTS-OS brings
                    your clients,
                    projects,
                    finances,
                    calendar,
                    content,
                    notes and
                    everyday
                    business
                    admin into one
                    calm,
                    connected
                    workspace.
                  </p>

                  <div className="hero-actions">
                    <a
                      href={
                        SIGNUP_URL
                      }
                      className="button-primary button-large"
                    >
                      Start
                      14-day free
                      trial

                      <ArrowRight
                        size={15}
                      />
                    </a>

                    <button
                      type="button"
                      className="button-secondary button-large"
                      onClick={() =>
                        setTourOpen(
                          true
                        )
                      }
                    >
                      <Play
                        size={14}
                      />

                      Take the
                      tour
                    </button>
                  </div>

                  <div className="hero-proof">
                    <div>
                      <Check
                        size={13}
                      />
                      14 days free
                    </div>

                    <div>
                      <Check
                        size={13}
                      />
                      No
                      commitment
                    </div>

                    <div>
                      <Check
                        size={13}
                      />
                      Set up in
                      minutes
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal
                delay={
                  0.12
                }
              >
                <div className="hero-visual">
                  <div className="hero-visual-glow" />

                  <div className="hero-window">
                    <div className="hero-window-top">
                      <div className="window-dots">
                        <span />
                        <span />
                        <span />
                      </div>

                      <span>
                        TOTS-OS
                      </span>
                    </div>

                    <div className="hero-window-content">
                      <div className="hero-mini-sidebar">
                        <Logo
                          size={34}
                          showWordmark={
                            false
                          }
                        />

                        {[
                          LayoutDashboard,
                          Users,
                          FolderKanban,
                          CircleDollarSign,
                          CalendarDays,
                          NotebookPen,
                        ].map(
                          (
                            Icon,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className={
                                index ===
                                0
                                  ? "active"
                                  : ""
                              }
                            >
                              <Icon
                                size={14}
                              />
                            </div>
                          )
                        )}
                      </div>

                      <div className="hero-mini-main">
                        <div className="hero-mini-heading">
                          <div>
                            <span>
                              Good
                              morning.
                            </span>

                            <strong>
                              Here&apos;s
                              your
                              business
                              today.
                            </strong>
                          </div>

                          <div className="hero-mini-clarity">
                            <Sparkles
                              size={12}
                            />
                            Clarity
                          </div>
                        </div>

                        <div className="hero-mini-metrics">
                          <div>
                            <span>
                              Revenue
                            </span>
                            <strong>
                              £18.4k
                            </strong>
                          </div>

                          <div>
                            <span>
                              Tasks
                            </span>
                            <strong>
                              12
                            </strong>
                          </div>

                          <div>
                            <span>
                              Projects
                            </span>
                            <strong>
                              6
                            </strong>
                          </div>
                        </div>

                        <div className="hero-mini-panels">
                          <div className="hero-mini-focus">
                            <span>
                              Focus
                            </span>

                            <strong>
                              Today&apos;s
                              priorities
                            </strong>

                            <div />

                            <div />

                            <div />
                          </div>

                          <div className="hero-mini-schedule">
                            <span>
                              Coming up
                            </span>

                            <div />

                            <div />

                            <div />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hero-floating-card hero-floating-one">
                    <span>
                      <Sparkles
                        size={12}
                      />
                      Clarity
                    </span>

                    <strong>
                      3 things
                      need your
                      attention
                    </strong>
                  </div>

                  <div className="hero-floating-card hero-floating-two">
                    <span>
                      Business
                      health
                    </span>

                    <strong>
                      82%
                    </strong>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal
              delay={
                0.18
              }
            >
              <div className="trusted-block">
                <span className="trusted-label">
                  Built for
                  businesses
                  like
                </span>

                <div className="trusted-row">
                  {TRUSTED_BY.map(
                    (
                      company
                    ) => (
                      <span
                        key={
                          company
                        }
                      >
                        {
                          company
                        }
                      </span>
                    )
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================================================
            PRODUCT
        ==================================================== */}

        <section
          className="tots-section soft"
          id="product"
        >
          <div className="tots-container">
            <Reveal>
              <Eyebrow>
                One operating
                system
              </Eyebrow>

              <h2 className="section-title">
                Your business
                doesn&apos;t
                need{" "}
                <span className="gold-text">
                  more tabs.
                </span>
              </h2>

              <p className="section-copy">
                It needs one
                place where the
                important things
                connect. TOTS-OS
                gives you a
                clearer view of
                the work, people,
                money and plans
                behind your
                business.
              </p>
            </Reveal>

            <Reveal
              delay={
                0.1
              }
            >
              <div className="product-statement">
                <div>
                  <span>
                    Instead of
                  this
                  </span>

                  <p>
                    CRM.
                    Spreadsheet.
                    Notes app.
                    Calendar.
                    Project tool.
                    Finance
                    tracker.
                    Content
                    planner.
                  </p>
                </div>

                <ArrowRight
                  size={24}
                />

                <div className="product-statement-final">
                  <span>
                    Use this
                  </span>

                  <strong>
                    TOTS-OS
                  </strong>

                  <p>
                    One connected
                    workspace for
                    the everyday
                    running of
                    your
                    business.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================================================
            FEATURES
        ==================================================== */}

        <section
          className="tots-section"
          id="features"
        >
          <div className="tots-container">
            <Reveal>
              <Eyebrow>
                What&apos;s
                inside
              </Eyebrow>

              <h2 className="section-title">
                Everything has a{" "}
                <span className="gold-text">
                  place.
                </span>
              </h2>

              <p className="section-copy">
                The tools you
                use every day
                shouldn&apos;t
                feel like
                separate parts
                of your
                business.
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
                        index *
                        0.04
                      }
                    >
                      <div className="feature-card">
                        <div className="feature-card-top">
                          <span className="feature-number">
                            {
                              feature.id
                            }
                          </span>

                          <div className="feature-icon">
                            <Icon
                              size={19}
                            />
                          </div>
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

        {/* ====================================================
            DEMO
        ==================================================== */}

        <section className="tots-section soft">
          <div className="tots-container">
            <Reveal>
              <Eyebrow>
                Explore TOTS-OS
              </Eyebrow>

              <h2 className="section-title">
                Don&apos;t just
                read about it.{" "}
                <span className="gold-text">
                  Click around.
                </span>
              </h2>

              <p className="section-copy">
                Explore the demo
                workspace or take
                the guided tour
                to see how the
                different parts
                of TOTS-OS work
                together.
              </p>
            </Reveal>

            <div
              style={{
                marginTop:
                  46,
              }}
            >
              <ProductDemo
                onStartTour={() =>
                  setTourOpen(
                    true
                  )
                }
              />
            </div>
          </div>
        </section>

        {/* ====================================================
            CLARITY
        ==================================================== */}

        <section
          className="tots-section"
          id="clarity"
        >
          <div className="tots-container">
            <div className="clarity-grid">
              <Reveal>
                <div>
                  <Eyebrow>
                    Meet Clarity
                  </Eyebrow>

                  <h2 className="section-title">
                    An AI PA
                    that already
                    knows{" "}
                    <span className="gold-text">
                      the
                      business.
                    </span>
                  </h2>

                  <p className="section-copy">
                    Clarity works
                    with the
                    information
                    already
                    inside your
                    TOTS-OS
                    workspace to
                    help you see
                    priorities,
                    overdue work,
                    deadlines and
                    what deserves
                    attention
                    next.
                  </p>

                  <div className="clarity-points">
                    {[
                      "Surface priorities from your workspace",
                      "Spot overdue work and upcoming deadlines",
                      "Turn business information into next actions",
                      "Reduce the time spent figuring out what to do next",
                    ].map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item
                          }
                        >
                          <Check
                            size={14}
                          />

                          <span>
                            {
                              item
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </Reveal>

              <Reveal
                delay={
                  0.12
                }
              >
                <div className="clarity-showcase">
                  <div className="clarity-showcase-top">
                    <div className="clarity-showcase-icon">
                      <Sparkles
                        size={18}
                      />
                    </div>

                    <div>
                      <span>
                        Clarity AI
                      </span>

                      <strong>
                        Business
                        assistant
                      </strong>
                    </div>
                  </div>

                  <div className="clarity-showcase-user">
                    What should
                    I focus on
                    today?
                  </div>

                  <div className="clarity-showcase-answer">
                    <span>
                      <Sparkles
                        size={12}
                      />
                      Clarity
                    </span>

                    <p>
                      You have
                      three
                      priorities
                      worth
                      focusing on
                      first.
                    </p>

                    <div className="clarity-showcase-item">
                      <b>
                        1
                      </b>

                      <div>
                        <strong>
                          Send the
                          Acorn
                          Studio
                          invoice
                        </strong>

                        <small>
                          £1,850
                          due this
                          week
                        </small>
                      </div>
                    </div>

                    <div className="clarity-showcase-item">
                      <b>
                        2
                      </b>

                      <div>
                        <strong>
                          Review
                          the
                          Northstar
                          project
                        </strong>

                        <small>
                          Two
                          delivery
                          tasks are
                          due
                          tomorrow
                        </small>
                      </div>
                    </div>

                    <div className="clarity-showcase-item">
                      <b>
                        3
                      </b>

                      <div>
                        <strong>
                          Prepare
                          for your
                          2:00 PM
                          client
                          call
                        </strong>

                        <small>
                          Client
                          notes
                          are
                          already
                          saved in
                          TOTS-OS
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====================================================
            PRICING
        ==================================================== */}

        <section
          className="tots-section soft"
          id="pricing"
        >
          <div className="tots-container">
            <Reveal>
              <Eyebrow>
                Simple pricing
              </Eyebrow>

              <h2 className="section-title">
                Pick the
                workspace that{" "}
                <span className="gold-text">
                  fits.
                </span>
              </h2>

              <p className="section-copy">
                Start with a
                14-day free
                trial, explore
                the system and
                choose the plan
                that makes sense
                for the way your
                business works.
              </p>
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
                      className={`pricing-card ${
                        plan.featured
                          ? "featured"
                          : ""
                      }`}
                    >
                      {plan.badge && (
                        <span className="pricing-badge">
                          {
                            plan.badge
                          }
                        </span>
                      )}

                      <span className="pricing-name">
                        {
                          plan.name
                        }
                      </span>

                      <div className="pricing-price">
                        <span>
                          £
                        </span>

                        <strong>
                          {
                            plan.price
                          }
                        </strong>

                        <small>
                          / month
                        </small>
                      </div>

                      <p className="pricing-description">
                        {
                          plan.description
                        }
                      </p>

                      <div className="pricing-divider" />

                      <div className="pricing-features">
                        {plan.features.map(
                          (
                            feature
                          ) => (
                            <div
                              key={
                                feature
                              }
                            >
                              <Check
                                size={13}
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

                      <a
                        href={
                          SIGNUP_URL
                        }
                        className={
                          plan.featured
                            ? "button-primary button-large pricing-button"
                            : "button-secondary button-large pricing-button"
                        }
                      >
                        Start
                        free

                        <ArrowRight
                          size={14}
                        />
                      </a>
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
            <div>
              <Eyebrow>
                The people behind it
              </Eyebrow>

              <h2 className="section-title">
                Built by a mum and
                daughter who were
                tired of business
                feeling so messy.
              </h2>

              <p className="section-copy">
                We&apos;re Sam and Leigha —
                a mum-and-daughter team,
                two very different brains,
                and the people behind The
                Organised Types and TOTS-OS.
              </p>

              <p className="section-copy">
                We didn&apos;t build this from
                a boardroom because we thought
                the world needed another piece
                of software. We built it because
                we were living the problem
                ourselves: too many tabs, too
                many systems and far too much
                business information living in
                our heads.
              </p>

              <div className="about-story-kicker">
                <Sparkles
                  size={13}
                />

                Built from real small-business chaos
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-founders">
              <div className="about-us-card">
                <span className="green-label">
                  Our story
                </span>

                <h3>
                  One of us organises it.
                  The other asks why it
                  still takes five apps.
                </h3>

                <p>
                  That back-and-forth is a
                  pretty good summary of how
                  TOTS-OS came to life. We kept
                  looking at the everyday way
                  small businesses actually work
                  and asking: can this be calmer,
                  clearer and all in one place?
                </p>

                <p>
                  TOTS-OS is our answer — a
                  system made to feel useful,
                  human and genuinely nice to
                  open every day.
                </p>
              </div>

              <div className="about-founder-card featured">
                <div className="about-founder-head">
                  <div className="about-founder-avatar">
                    S
                  </div>

                  <div>
                    <span>
                      Mum · Co-founder
                    </span>

                    <h3>
                      Sam
                    </h3>
                  </div>
                </div>

                <p>
                  Sam brings the business,
                  organisation and big-picture
                  thinking. She&apos;s the one
                  asking how a process should
                  actually work for a real
                  business owner — not just how
                  it looks on a screen.
                </p>

                <div className="about-founder-note">
                  The practical voice in the room:
                  “That&apos;s great, but will someone
                  actually use it?”
                </div>
              </div>

              <div className="about-founder-card">
                <div className="about-founder-head">
                  <div className="about-founder-avatar">
                    L
                  </div>

                  <div>
                    <span>
                      Daughter · Co-founder
                    </span>

                    <h3>
                      Leigha
                    </h3>
                  </div>
                </div>

                <p>
                  Leigha brings the technology,
                  design and constant “we could
                  make this better” energy. She
                  turns the ideas into the product
                  — from how TOTS-OS feels to how
                  all the moving parts connect.
                </p>

                <div className="about-founder-note">
                  Usually the one saying:
                  “Give me five minutes, I&apos;ll build it.”
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

        {/* ====================================================
            FAQ
        ==================================================== */}

        <section className="tots-section soft">
          <div className="tots-container">
            <Reveal>
              <Eyebrow>
                Questions
              </Eyebrow>

              <h2 className="section-title">
                The things
                you&apos;ll
                probably{" "}
                <span className="gold-text">
                  ask.
                </span>
              </h2>
            </Reveal>

            <div className="faq-list">
              {FAQS.map(
                (
                  faq,
                  index
                ) => {
                  const isOpen =
                    openFaq ===
                    index;

                  return (
                    <div
                      className={`faq-item ${
                        isOpen
                          ? "open"
                          : ""
                      }`}
                      key={
                        faq.q
                      }
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() =>
                          setOpenFaq(
                            isOpen
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

                        <ChevronDown
                          size={17}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
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
                            <p>
                              {
                                faq.a
                              }
                            </p>
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

        {/* ====================================================
            FINAL CTA
        ==================================================== */}

        <section className="final-cta-section">
          <div className="tots-container">
            <Reveal>
              <div className="final-cta">
                <div className="final-cta-glow" />

                <Eyebrow>
                  Ready when you
                  are
                </Eyebrow>

                <h2>
                  Run the
                  business.
                  <br />
                  Not{" "}
                  <span>
                    the chaos.
                  </span>
                </h2>

                <p>
                  Put your
                  clients,
                  projects,
                  finances,
                  planning,
                  notes and
                  everyday
                  business admin
                  into one
                  organised
                  workspace.
                </p>

                <div className="final-cta-actions">
                  <a
                    href={
                      SIGNUP_URL
                    }
                    className="button-primary button-large"
                  >
                    Start
                    14-day free
                    trial

                    <ArrowRight
                      size={15}
                    />
                  </a>

                  <button
                    type="button"
                    className="button-secondary button-large"
                    onClick={() =>
                      setTourOpen(
                        true
                      )
                    }
                  >
                    <Play
                      size={14}
                    />

                    Take the
                    tour
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="tots-footer">
        <div className="tots-container">
          <div className="footer-top">
            <Logo />

            <div className="footer-links">
              <a href="#product">
                Product
              </a>

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

              <a href="#about">
                About
              </a>
            </div>

            <a
              href={
                SIGNUP_URL
              }
              className="button-primary"
            >
              Start free

              <ArrowRight
                size={14}
              />
            </a>
          </div>

          <div className="footer-bottom">
            <span>
              © 2026 The
              Organised Types.
              All rights
              reserved.
            </span>

            <span>
              TOTS-OS · Your
              business,
              organised.
            </span>
          </div>
        </div>
      </footer>

      {/* ======================================================
          GUIDED TOUR
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