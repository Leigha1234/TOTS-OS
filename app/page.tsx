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
            happening across your
            business.
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
          value="51%"
        />

        <DemoMetric
          label="Open tasks"
          value="29"
        />

        <DemoMetric
          label="Projects"
          value="2"
        />

        <DemoMetric
          label="Today"
          value="0"
        />

        <DemoMetric
          label="Invoices due"
          value="0"
        />

        <DemoMetric
          label="Revenue"
          value="£0"
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
              "Focus on the highest-impact open tasks",
              "Check upcoming meetings and deadlines",
              "Review active project delivery",
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
                "09:00",
                "Sam & Leigha work on Iona",
              ],
              [
                "MON",
                "13:00",
                "Leigha MTC",
              ],
              [
                "TUE",
                "09:00",
                "Leigha last day",
              ],
              [
                "TUE",
                "09:00",
                "Sam Hospital",
              ],
              [
                "WED",
                "09:00",
                "DP Leadership",
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
              £0
            </strong>
          </div>

          <div className="snapshot-divider" />

          <div className="snapshot-mini-grid">
            <div>
              <span>
                Team
              </span>
              <strong>
                1
              </strong>
            </div>

            <div>
              <span>
                Emails
              </span>
              <strong>
                0
              </strong>
            </div>

            <div>
              <span>
                Projects
              </span>
              <strong>
                2
              </strong>
            </div>

            <div>
              <span>
                Events
              </span>
              <strong>
                28
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
            "Upcoming events...",
            "ensure in progress on notes...",
            "set revenue targets for all...",
            "Referal programme and cards",
            "Inpost",
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
          View all 29 tasks
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
      name: "Iona",
      org: "MEGOOSH",
      type: "CLIENT",
    },
    {
      name: "Sam Hill",
      org:
        "THEORGANISEDTYPES",
      type:
        "STRATEGIC PARTNER",
    },
    {
      name:
        "Leigha Day-Clark",
      org:
        "THEORGANISEDTYPES",
      type:
        "STRATEGIC PARTNER",
    },
    {
      name: "Dave",
      org:
        "DP LEADERSHIP",
      type: "CLIENT",
    },
    {
      name: "Mike",
      org:
        "MORAY TRAINING CLUB",
      type: "CLIENT",
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
          value="2"
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
              TOTS OS Launch
            </strong>
            <small>
              Meet TOTS OS:
              Your all-in-one
              business toolkit
            </small>
          </div>

          <span>
            testing for
            leigha
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
              test
            </strong>
            <small>
              test
            </small>
          </div>

          <span>
            Sams tests
          </span>

          <b className="status-green">
            Sent
          </b>

          <span>
            <strong>
              100%
            </strong>{" "}
            open &nbsp;
            <strong>
              0%
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
              test
            </strong>
            <small>
              test
            </small>
          </div>

          <span>
            Sams tests
          </span>

          <b className="status-grey">
            Draft
          </b>

          <span className="muted-result">
            28 Aug 2026
            at 21:29
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
            "0 subscribers",
          ],
          [
            "Sams tests",
            "1 subscribers",
          ],
          [
            "testing for leigha",
            "1 subscribers",
          ],
        ].map(
          (
            item
          ) => (
            <div
              className="audience-card"
              key={
                item[0]
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
            Social account
            connections are
            temporarily
            unavailable.
          </p>

          <div className="coming-soon-box">
            <strong>
              Coming soon
            </strong>

            <span>
              Social connection
              links are being
              finalised and will
              return in an
              upcoming release.
            </span>
          </div>

          {[
            [
              "Instagram",
              "Not connected",
            ],
            [
              "TikTok",
              "Video",
            ],
            [
              "Facebook",
              "Not connected",
            ],
            [
              "LinkedIn",
              "Not connected",
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
  return (
    <div className="app-page finance-page">
      <div className="finance-title-card">
        <div>
          <div className="finance-title-kicker">
            <span className="finance-icon-square">
              £
            </span>

            <span className="green-label">
              Financial
              operations
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
          <button className="outline-mini-button">
            <RefreshCw
              size={12}
            />
            Refresh
          </button>

          <button className="sage-small-button dark-text">
            <Plus
              size={12}
            />
            New invoice
          </button>

          <button className="outline-mini-button">
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
              Financial
              control centre
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
              100/100
            </strong>
          </div>
        </div>

        <div className="finance-main-metrics">
          {[
            [
              "Net position",
              "£0.00",
            ],
            [
              "Outstanding",
              "£0.00",
            ],
            [
              "VAT owed",
              "£0.00",
            ],
            [
              "Tax exposure",
              "£0.00",
            ],
          ].map(
            (
              metric
            ) => (
              <div
                className="finance-white-metric"
                key={
                  metric[
                    0
                  ]
                }
              >
                <span>
                  {
                    metric[
                      0
                    ]
                  }
                </span>

                <strong>
                  {
                    metric[
                      1
                    ]
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
            £0.00
          </strong>
        </div>

        <div>
          <span>
            Operating costs
          </span>

          <strong>
            £0.00
          </strong>
        </div>

        <div>
          <span>
            Recurring MRR
          </span>

          <strong>
            £0.00
          </strong>
        </div>

        <div>
          <span>
            Monthly payroll
          </span>

          <strong>
            £0.00
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NOTES
============================================================ */

function DemoNotes() {
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
          3 tasks
        </strong>
      </div>

      <div className="kanban-real">
        <div className="kanban-column-real">
          <div className="kanban-column-head">
            <span>
              To do
            </span>

            <span>
              3
            </span>
          </div>

          <div className="sticky-card">
            <div className="sticky-tape" />

            <span className="sticky-tag">
              General
            </span>

            <h4>
              Counselling vine
              domain
            </h4>

            <div className="sticky-bottom">
              <div>
                <span>
                  Progress
                </span>

                <button>
                  To do
                </button>
              </div>

              <button className="clear-button">
                <Check
                  size={12}
                />
                Clear
              </button>
            </div>
          </div>

          <div className="sticky-card second">
            <div className="sticky-tape" />

            <span className="sticky-tag">
              General
            </span>

            <h4>
              check meta
              linking
            </h4>
          </div>
        </div>

        <div className="kanban-column-real empty">
          <div className="kanban-column-head">
            <span>
              In progress
            </span>

            <span>
              0
            </span>
          </div>

          <small>
            Empty
          </small>
        </div>

        <div className="kanban-column-real empty">
          <div className="kanban-column-head">
            <span>
              Done
            </span>

            <span>
              0
            </span>
          </div>

          <small>
            Empty
          </small>
        </div>
      </div>

      <button className="floating-add-button">
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
          <button className="outline-large-button">
            <Users
              size={14}
            />
            Clients
          </button>

          <button className="black-wide-button">
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
            2 active projects.
          </p>
        </div>
      </div>

      <div className="workspace-metric-grid">
        <DemoMetric
          label="Active projects"
          value="2"
        />

        <DemoMetric
          label="Active clients"
          value="0"
        />

        <DemoMetric
          label="Overdue"
          value="0"
        />

        <DemoMetric
          label="Project value"
          value="£0"
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
            2 active
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
            0 client projects ·
            3 internal
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

      <div className="project-row-real">
        <div className="project-folder">
          <Folder
            size={18}
          />
        </div>

        <div>
          <strong>
            Josh&apos;s website
          </strong>

          <span>
            Client work
          </span>
        </div>

        <ChevronRight
          size={15}
        />
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
          <button className="outline-mini-button">
            <RefreshCw
              size={12}
            />
            Refresh
          </button>

          <button className="black-wide-button">
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
            Your schedule is
            clear today. 8
            upcoming items are
            currently visible in
            your schedule. Your
            public booking page
            is active.
          </p>
        </div>
      </div>

      <div className="calendar-stat-grid">
        <DemoMetric
          label="Today"
          value="0"
        />

        <DemoMetric
          label="Upcoming"
          value="8"
        />

        <DemoMetric
          label="Booking days"
          value="4"
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

            <button className="sage-small-button">
              Open calendar
            </button>
          </div>

          <div className="nothing-scheduled">
            <Check
              size={24}
            />

            <strong>
              Nothing scheduled
            </strong>

            <span>
              Your calendar is
              clear today.
            </span>
          </div>
        </div>

        <div className="booking-card-real">
          <span className="green-label">
            Public booking
          </span>

          <h3>
            Book a meeting
          </h3>

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
              4 days per week
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
          <button className="outline-large-button">
            Sign out
          </button>

          <button className="outline-large-button">
            Manage subscription
          </button>

          <button className="black-wide-button">
            Save changes
          </button>
        </div>
      </div>

      <div className="settings-divider" />

      <div className="settings-profile-card">
        <div className="settings-company-logo">
          <Logo
            size={90}
            showWordmark={false}
          />
        </div>

        <div className="settings-form-area">
          <div className="settings-two-fields">
            <div>
              <label>
                Full name
              </label>

              <div className="settings-input" />
            </div>

            <div>
              <label>
                Email address
              </label>

              <div className="settings-input filled">
                theorganisedtypes@gmail.com
              </div>
            </div>
          </div>

          <div className="settings-summary-field">
            <label>
              Administrative
              summary
            </label>

            <div className="settings-textarea" />
          </div>

          <div className="company-logo-row">
            <label>
              Company logo
            </label>

            <div className="company-logo-controls">
              <Logo
                size={42}
                showWordmark={false}
              />

              <button>
                <Upload
                  size={12}
                />
                Change Logo
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
            Your workload needs
            attention. I&apos;d
            start with the
            highest-impact open
            work, then check your
            upcoming deadlines
            and active project
            delivery.
          </p>

          <div className="clarity-suggestion-list">
            <div>
              <span>
                1
              </span>

              <div>
                <strong>
                  Focus on
                  high-impact
                  open tasks
                </strong>

                <small>
                  29 open tasks
                  currently
                  visible
                </small>
              </div>
            </div>

            <div>
              <span>
                2
              </span>

              <div>
                <strong>
                  Check upcoming
                  meetings
                </strong>

                <small>
                  Upcoming
                  schedule
                  detected
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
                  2 projects
                  currently
                  active
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="clarity-user">
          Which area should I
          look at next?
        </div>

        <div className="clarity-answer small-answer">
          <div className="clarity-answer-title">
            <Sparkles
              size={13}
            />

            Clarity
          </div>

          <p>
            I&apos;d open
            Workspace next so
            you can review the
            active projects and
            delivery workload.
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
        <div className="product-demo-frame">
          <div className="product-demo-app">
            <DemoSidebar
              active={active}
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
   TOUR
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
        current
          .screen
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
                    "clarity" && (
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
                          collection
                          of tools.
                        </strong>

                        <span>
                          Clarity
                          can use
                          the
                          information
                          already
                          inside
                          your
                          workspace
                          to help
                          turn it
                          into
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

        /* =====================================================
           NOTES
        ===================================================== */

        .notes-page {
          position:
            relative;

          padding-top:
            70px;
        }

        .notes-header {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;
        }

        .notes-header > div:first-child > span {
          display:
            block;

          margin-top:
            12px;

          color:
            #9d9991;

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .5em;

          text-transform:
            uppercase;
        }

        .notes-search {
          width:
            200px;

          min-height:
            37px;

          padding:
            0 12px;

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
            12px;

          background:
            white;

          color:
            #c2bfb8;

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
            11px;

          display:
            flex;

          gap:
            7px;
        }

        .notes-filters span {
          min-height:
            20px;

          padding:
            0 8px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          border:
            1px solid
            #cfcac2;

          border-radius:
            4px;

          background:
            white;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .notes-task-heading {
          margin-top:
            34px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-end;
        }

        .notes-task-heading h3 {
          font-size:
            20px;
        }

        .notes-task-heading div span {
          display:
            block;

          margin-top:
            7px;

          color:
            #99958d;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .4em;

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

        .kanban-real {
          margin-top:
            25px;

          display:
            grid;

          grid-template-columns:
            1.1fr
            1fr
            1fr;

          gap:
            30px;
        }

        .kanban-column-head {
          display:
            flex;

          justify-content:
            space-between;

          color:
            #9d9991;

          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .sticky-card {
          min-height:
            255px;

          margin-top:
            10px;

          padding:
            20px;

          position:
            relative;

          display:
            flex;

          flex-direction:
            column;

          border-radius:
            2px;

          background:
            #555149;

          color:
            white;
        }

        .sticky-card.second {
          min-height:
            150px;
        }

        .sticky-tape {
          width:
            75px;

          height:
            18px;

          position:
            absolute;

          top:
            -8px;

          left:
            50%;

          transform:
            translateX(
              -50%
            );

          border-radius:
            2px;

          background:
            rgba(
              225,
              225,
              225,
              .75
            );

          box-shadow:
            0 3px 4px
            rgba(
              0,
              0,
              0,
              .14
            );
        }

        .sticky-tag {
          font-size:
            6px;

          font-weight:
            700;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .sticky-card h4 {
          margin-top:
            23px;

          font-family:
            Georgia,
            serif;

          font-size:
            12px;

          font-style:
            italic;

          font-weight:
            400;

          letter-spacing:
            -.02em;
        }

        .sticky-bottom {
          margin-top:
            auto;
        }

        .sticky-bottom > div {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;
        }

        .sticky-bottom > div > span {
          color:
            rgba(
              255,
              255,
              255,
              .5
            );

          font-size:
            5px;

          font-weight:
            700;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .sticky-bottom > div > button {
          min-width:
            80px;

          min-height:
            35px;

          border:
            0;

          border-radius:
            12px;

          background:
            white;

          color:
            #25231f;

          font-size:
            7px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .clear-button {
          min-height:
            27px;

          margin-top:
            14px;

          padding:
            0 10px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .22
            );

          border-radius:
            999px;

          background:
            transparent;

          color:
            white;

          font-size:
            6px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .kanban-column-real.empty small {
          display:
            block;

          margin-top:
            10px;

          color:
            #c2beb7;

          font-size:
            6px;

          text-transform:
            uppercase;
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

        .project-row-real {
          min-height:
            62px;

          margin-top:
            12px;

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

          border-radius:
            9px;

          background:
            #fbfaf8;

          color:
            #aaa69e;
        }

        .project-row-real > div:nth-child(2) {
          flex:
            1;
        }

        .project-row-real strong {
          font-family:
            'DM Sans',
            sans-serif;

          font-size:
            14px;

          font-style:
            italic;

          font-weight:
            400;
        }

        .project-row-real span {
          margin-left:
            8px;

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
        }

        .today-card-head h3,
        .booking-card-real h3 {
          margin-top:
            5px;

          font-size:
            19px;
        }

        .nothing-scheduled {
          min-height:
            115px;

          margin-top:
            17px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            12px;

          background:
            #fbfaf8;

          color:
            #77736c;
        }

        .nothing-scheduled svg {
          color:
            var(--sage);
        }

        .nothing-scheduled strong {
          margin-top:
            8px;

          font-size:
            8px;
        }

        .nothing-scheduled span {
          margin-top:
            3px;

          color:
            #aaa69e;

          font-size:
            6px;
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

        .settings-form-area label {
          display:
            block;

          color:
            #d0cdc7;

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

          border:
            1px solid
            var(--app-border);

          border-radius:
            11px;
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
           CLARITY
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
        }

        .feature-card h3 {
          margin-top:
            auto;

          padding-top:
            48px;

          font-size:
            21px;
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
           CLARITY MARKETING
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

        .clarity-response > span {
          color:
            var(--tan-dark);

          font-size:
            9px;

          font-weight:
            700;

          text-transform:
            uppercase;
        }

        .clarity-response > p {
          margin-top:
            8px;

          color:
            var(--charcoal-soft);

          font-size:
            12px;

          line-height:
            1.65;
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

          justify-content:
            space-between;
        }

        .price-name {
          font-size:
            12px;

          font-weight:
            700;

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

          gap:
            9px;

          color:
            var(--charcoal-soft);

          font-size:
            12px;
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
        }

        .faq-answer {
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
           FINAL
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

        .final-card .button-primary {
          border-color:
            white;

          background:
            white;

          color:
            var(--charcoal)
            !important;
        }

        .final-card .button-secondary {
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

          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .product-demo-frame {
            overflow-x:
              auto;
          }

          .product-demo-app {
            width:
              1050px;

            grid-template-columns:
              160px
              890px;
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

          .tots-hero-title {
            font-size:
              clamp(
                3rem,
                12vw,
                4.5rem
              ) !important;
          }

          .tots-hero-copy {
            font-size:
              15px;
          }

          .tots-hero-actions {
            width:
              100%;

            flex-direction:
              column;
          }

          .tots-hero-actions a,
          .tots-hero-actions button {
            width:
              100%;
          }

          .transform-grid,
          .why-grid,
          .feature-grid,
          .security-grid,
          .pricing-grid {
            grid-template-columns:
              1fr;
          }

          .demo-cta {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .demo-cta-actions {
            flex-direction:
              column;
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

          .final-actions {
            flex-direction:
              column;
          }

          .final-actions a,
          .final-actions button {
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

          .tour-topbar {
            height:
              58px;
          }

          .tour-layout {
            height:
              calc(
                100% -
                58px
              );

            display:
              flex;

            flex-direction:
              column;
          }

          .tour-preview {
            height:
              53%;

            flex-shrink:
              0;

            padding:
              10px;
          }

          .tour-guide {
            min-height:
              47%;

            padding:
              20px;

            overflow:
              auto;

            border-left:
              0;

            border-top:
              1px solid
              #e1ded7;
          }

          .tour-guide .tour-eyebrow {
            margin-top:
              18px;
          }

          .tour-guide h2 {
            font-size:
              25px;
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
                58px
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

          .tots-hero-title {
            font-size:
              clamp(
                2.75rem,
                12.5vw,
                3.65rem
              ) !important;
          }

          .trusted-list span {
            font-size:
              9px;
          }

          .footer-grid {
            grid-template-columns:
              1fr;
          }

          .footer-bottom {
            flex-direction:
              column;

            gap:
              10px;
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
          MOBILE
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
                opacity:
                  0,
                y:
                  -20,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
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
            className="tots-hero-pill"
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
          >
            TOTS-OS brings your{" "}
            <strong>
              clients, projects,
              tasks, finances,
              calendar, content
              and ideas
            </strong>{" "}
            into one connected
            workspace — so
            running your
            business feels less
            scattered and a lot
            more manageable.
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
              className="button-secondary button-large"
              onClick={() =>
                setTourOpen(
                  true
                )
              }
            >
              <Play
                size={
                  14
                }
              />

              Take the free tour
            </button>
          </motion.div>

          <motion.div
            className="tots-hero-note"
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
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
          TRUST
      ====================================================== */}

      <section className="trusted-section">
        <Reveal>
          <div className="trusted-card">
            <p>
              Trusted by
              businesses
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
          CALM
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
              Canva. Notes on
              your phone.
              Another tab every
              time you need to
              find something.
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
              and see your
              clients, work,
              money and
              priorities
              together.
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
                  Everything
                  works together.
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
                See the actual
                product
              </Eyebrow>

              <h2 className="section-title">
                Have a proper
                look around.
              </h2>

              <p className="section-copy">
                This interactive
                demo follows the
                actual TOTS-OS
                workspace, using
                the same layouts,
                navigation and
                visual language
                as the real
                product.
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
              client. A client
              gets a project.
              Projects create
              work. Work creates
              revenue. TOTS-OS
              keeps those
              relationships
              connected.
            </p>
          </Reveal>

          <Reveal>
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
                with a little
                more
                <span>
                  clarity.
                </span>
              </h2>

              <p className="clarity-copy">
                Clarity is your
                built-in AI PA.
                It uses the
                context already
                inside TOTS-OS
                to help surface
                what needs your
                attention.
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

                Take the guided
                tour
              </button>
            </Reveal>

            <Reveal>
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
                    Your workload
                    needs
                    attention.
                    Start with
                    high-impact
                    open tasks,
                    upcoming
                    deadlines and
                    active project
                    delivery.
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
                account access.
              </p>
            </div>

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
                organisations.
              </p>
            </div>

            <div className="security-card">
              <RefreshCw
                size={
                  22
                }
              />

              <h3>
                Always
                improving
              </h3>

              <p>
                TOTS-OS evolves
                around real small
                business
                workflows.
              </p>
            </div>
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
              Create an account
              and use TOTS-OS
              free for 14 days
              first.
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
                plan
              ) => (
                <div
                  className={`price-card ${
                    plan.featured
                      ? "featured"
                      : ""
                  }`}
                  key={
                    plan.name
                  }
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

                          {
                            feature
                          }
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
              something
              simpler.
            </h2>

            <p className="section-copy">
              Running a business
              shouldn&apos;t
              mean stitching
              together a CRM,
              planner, finance
              app, social tool,
              calendar and notes
              system.
            </p>
          </Reveal>

          <Reveal>
            <div className="about-card">
              <p>
                We&apos;re Sam
                and Leigha, the
                team behind The
                Organised Types.
              </p>

              <p>
                We kept seeing
                the same thing:
                businesses had
                plenty of
                software, but
                the actual
                business was
                still scattered
                everywhere.
              </p>

              <p>
                So we created
                one calm home
                for clients,
                work, money,
                ideas and
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
                      type="button"
                      className="faq-button"
                      onClick={() =>
                        setOpenFaq(
                          open
                            ? null
                            : index
                        )
                      }
                    >
                      {
                        faq.q
                      }

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

                    <AnimatePresence>
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
          FINAL
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
                complicated
                enough.
                <br />

                <span>
                  Running it
                  shouldn&apos;t
                  be.
                </span>
              </h2>

              <p>
                Start bringing
                your clients,
                projects, tasks,
                finances,
                content and ideas
                back into one
                calm, connected
                place.
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
                14 days free ·
                no commitment
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
              connected
              business
              operating
              system for small
              businesses.
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