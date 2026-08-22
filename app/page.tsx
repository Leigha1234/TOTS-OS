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

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// GLOBAL CONTENT
// ============================================================

const LOGO_SRC = "/icon.png";

const SIGNUP_URL =
  "https://tots-os.co.uk/login";

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
    title: "Know your clients",
    text:
      "Every contact, note and project connected — so client history never disappears into messages, spreadsheets or your head.",
  },
  {
    icon: FolderKanban,
    id: "02",
    title: "Keep work moving",
    text:
      "Turn clients into projects, projects into tasks and tasks into finished work without losing the bigger picture.",
  },
  {
    icon: CalendarDays,
    id: "03",
    title: "See what's coming",
    text:
      "Events, bookings and deadlines together in one place, so fewer things catch you by surprise.",
  },
  {
    icon: CircleDollarSign,
    id: "04",
    title: "Understand your finances",
    text:
      "Keep quotes, invoices and your financial position visible alongside the work generating the money.",
  },
  {
    icon: MessageSquareText,
    id: "05",
    title: "Plan your content",
    text:
      "Create, organise and publish content without running your marketing from another completely separate system.",
  },
  {
    icon: NotebookPen,
    id: "06",
    title: "Capture everything",
    text:
      "Keep notes, ideas and brain dumps somewhere they can actually become useful actions.",
  },
];

const PRICING: PricingPlan[] = [
  {
    name: "Standard",
    price: 29,
    tag: "start",
    description:
      "The essentials, organised. Everything a founder needs to bring the core of their business into one place.",
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
    tag: "grow",
    featured: true,
    badge: "Most popular",
    description:
      "Deeper workflows and sharper visibility for businesses that are growing beyond the basics.",
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
    tag: "scale",
    description:
      "Full power for businesses that need more capacity, automation and operational control.",
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
      "TOTS-OS is one connected workspace for running your business. It brings clients, projects, tasks, finances, planning, notes, content and business visibility into one system instead of scattering them across different apps.",
  },
  {
    q: "Who is TOTS-OS for?",
    a:
      "It is built for founders, freelancers, small businesses and growing teams who are tired of running their business from spreadsheets, messages, notes apps and too many browser tabs.",
  },
  {
    q: "What is Clarity?",
    a:
      "Clarity is the AI PA built into TOTS-OS. It uses the context inside your workspace to help surface overdue work, priorities, upcoming deadlines and areas that may need your attention.",
  },
  {
    q: "Is TOTS-OS web based?",
    a:
      "Yes. TOTS-OS runs in your browser, so you can access your workspace wherever you have access to your account.",
  },
  {
    q: "Can TOTS-OS help with social media?",
    a:
      "Yes. TOTS-OS includes social planning and publishing functionality so content can sit alongside the rest of the business instead of becoming another disconnected workflow.",
  },
  {
    q: "Can I try it before subscribing?",
    a:
      "Yes. Create your account and start with a 14-day free trial with no commitment.",
  },
];

// ============================================================
// DEMO DATA
// ============================================================

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
    label: "Finances",
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
    label: "Projects",
    icon: FolderKanban,
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
    status: "SENT",
    sent: 128,
    opens: 74,
    clicks: 19,
  },
  {
    name: "Autumn preview",
    list: "Newsletter",
    status: "DRAFT",
    sent: 0,
    opens: 0,
    clicks: 0,
  },
];

// ============================================================
// SMALL COMPONENTS
// ============================================================

function Logo({
  size = 34,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className="tots-logo-unit">
      <img
        src={LOGO_SRC}
        alt="TOTS-OS"
        width={size}
        height={size}
        className="tots-logo-mark"
        style={{
          width: size,
          height: size,
        }}
      />

      {showWordmark && (
        <span className="tots-logo-word">
          <span className="tots-logo-name">
            TOTS-OS
          </span>

          <span className="tots-logo-sub">
            business operating system
          </span>
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
      <span className="tots-eyebrow-dot" />
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
              y: 30,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.14,
      }}
      transition={{
        duration: 0.8,
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
    <div className="tots-demo-stat">
      <p className="tots-demo-label">
        {label}
      </p>

      <p className="tots-demo-value">
        {value}
      </p>

      {note && (
        <p className="tots-demo-note">
          {note}
        </p>
      )}
    </div>
  );
}

function DemoPanel({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
}) {
  return (
    <div className="tots-demo-panel">
      <p className="tots-demo-label">
        {eyebrow}
      </p>

      {title && (
        <p className="tots-demo-panel-title">
          {title}
        </p>
      )}

      {children}
    </div>
  );
}

// ============================================================
// DEMO VIEWS
// ============================================================

function DemoHome() {
  return (
    <>
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            wed · 19 aug
          </p>

          <h3 className="tots-demo-serif">
            Good afternoon.
          </h3>

          <p className="tots-demo-dim">
            Here&apos;s everything
            happening across your
            business.
          </p>
        </div>

        <div className="tots-demo-ai">
          <Sparkles size={14} />
        </div>
      </div>

      <div className="tots-demo-stats tots-demo-stats-6">
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
          note="+11.4%"
        />
      </div>

      <div className="tots-demo-grid-2">
        <DemoPanel
          eyebrow="focus"
          title="Today's priorities"
        >
          <div className="tots-demo-list">
            {[
              "Send the Halstead proposal",
              "Review Q3 campaign performance",
              "Approve this week's content",
            ].map(
              (
                item,
                index
              ) => (
                <div
                  className="tots-demo-row"
                  key={
                    item
                  }
                >
                  <span className="tots-demo-num">
                    {index +
                      1}
                  </span>

                  {item}
                </div>
              )
            )}
          </div>
        </DemoPanel>

        <DemoPanel
          eyebrow="clarity"
          title="What needs attention"
        >
          <p className="tots-demo-dim demo-copy">
            One invoice is overdue, and
            your website project has three
            tasks due this week.
          </p>

          <div className="tots-demo-ai-response">
            <Sparkles size={14} />

            <span>
              Ask Clarity what to
              prioritise.
            </span>
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
        <h3 className="tots-demo-serif">
          Contacts
        </h3>

        <div className="tots-demo-searchbar">
          <Search size={13} />
          Search...
        </div>
      </div>

      <div className="tots-demo-list demo-top">
        {DEMO_CONTACTS.map(
          (
            contact
          ) => (
            <div
              key={
                contact.name
              }
              className="tots-demo-contact-row"
            >
              <span className="tots-demo-avatar">
                {contact.name.charAt(
                  0
                )}
              </span>

              <div className="demo-flex">
                <p className="tots-demo-contact-name">
                  {
                    contact.name
                  }
                </p>

                <p className="tots-demo-dim">
                  {
                    contact.org
                  }{" "}
                  ·{" "}
                  {
                    contact.tag
                  }
                </p>
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
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">
          Campaigns
        </h3>

        <span className="tots-demo-pill-btn">
          <Plus size={13} />
          New campaign
        </span>
      </div>

      <div className="tots-demo-grid-2">
        {DEMO_CAMPAIGNS.map(
          (
            campaign
          ) => (
            <div
              key={
                campaign.name
              }
              className="tots-demo-panel"
            >
              <div className="tots-demo-between">
                <div>
                  <p className="tots-demo-contact-name">
                    {
                      campaign.name
                    }
                  </p>

                  <p className="tots-demo-dim">
                    {
                      campaign.list
                    }
                  </p>
                </div>

                <span className="tots-demo-pill">
                  {
                    campaign.status
                  }
                </span>
              </div>

              <div className="tots-demo-stats tots-demo-stats-3">
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
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            create content
          </p>

          <h3 className="tots-demo-serif">
            What are we posting?
          </h3>
        </div>

        <span className="tots-demo-pill-btn">
          <Sparkles size={13} />
          Give me ideas
        </span>
      </div>

      <div className="tots-demo-grid-2">
        <div className="tots-demo-upload">
          <ImageIcon size={22} />

          <p className="tots-demo-contact-name demo-upload-title">
            Add your content
          </p>

          <p className="tots-demo-dim">
            Upload an image or video
          </p>
        </div>

        <DemoPanel
          eyebrow="publishing"
          title="Connected platforms"
        >
          <div className="tots-demo-list">
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
                  key={
                    platform
                  }
                  className="tots-demo-row"
                >
                  <span className="demo-flex">
                    {
                      platform
                    }
                  </span>

                  <span
                    className={`tots-demo-toggle ${
                      index <
                      2
                        ? "is-on"
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
      <div className="tots-demo-mainhead">
        <h3 className="tots-demo-serif">
          Finances
        </h3>

        <span className="tots-demo-pill-btn">
          <RefreshCw size={12} />
          Refresh
        </span>
      </div>

      <div className="tots-demo-tabs">
        {[
          "Overview",
          "Sales",
          "Expenses",
          "Tax & VAT",
          "Payroll",
        ].map(
          (
            tab,
            index
          ) => (
            <span
              key={tab}
              className={`tots-demo-tab ${
                index ===
                0
                  ? "is-active"
                  : ""
              }`}
            >
              {tab}
            </span>
          )
        )}
      </div>

      <div className="tots-demo-panel tots-demo-panel-dark demo-top">
        <p className="tots-demo-label label-light">
          financial control centre
        </p>

        <p className="tots-demo-serif serif-light">
          Business position at a glance
        </p>

        <div className="tots-demo-stats tots-demo-stats-4">
          <DemoStat
            label="Net position"
            value="£4,120"
          />

          <DemoStat
            label="Outstanding"
            value="£1,860"
          />

          <DemoStat
            label="VAT owed"
            value="£640"
          />

          <DemoStat
            label="Tax exposure"
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
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            notes & tasks
          </p>

          <h3 className="tots-demo-serif">
            Keep everything visible.
          </h3>
        </div>
      </div>

      <div className="tots-demo-kanban">
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
              key={
                column.name
              }
              className="tots-demo-kanban-col"
            >
              <p className="tots-demo-label">
                {
                  column.name
                }
              </p>

              {column.tasks.map(
                (
                  task
                ) => (
                  <div
                    key={
                      task
                    }
                    className="tots-demo-card"
                  >
                    <p className="tots-demo-contact-name">
                      {
                        task
                      }
                    </p>

                    <p className="tots-demo-dim demo-small-top">
                      TOTS-OS
                    </p>
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
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            commercial workspace
          </p>

          <h3 className="tots-demo-serif">
            Clients & Projects
          </h3>
        </div>

        <span className="tots-demo-pill-btn">
          <Plus size={13} />
          New project
        </span>
      </div>

      <div className="tots-demo-stats tots-demo-stats-4">
        <DemoStat
          label="Active projects"
          value="4"
        />

        <DemoStat
          label="Active clients"
          value="6"
        />

        <DemoStat
          label="Overdue"
          value="1"
        />

        <DemoStat
          label="Project value"
          value="£6,400"
        />
      </div>

      <div className="tots-demo-list">
        {[
          "Website redesign",
          "Autumn campaign",
          "Brand refresh",
        ].map(
          (
            project
          ) => (
            <div
              className="tots-demo-row"
              key={
                project
              }
            >
              <FolderKanban
                size={14}
              />

              <span className="demo-flex">
                {
                  project
                }
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
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            your time
          </p>

          <h3 className="tots-demo-serif">
            Bookings & Schedule
          </h3>
        </div>

        <span className="tots-demo-pill-btn">
          <Plus size={13} />
          Add event
        </span>
      </div>

      <div className="tots-demo-stats tots-demo-stats-4">
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
      <div className="tots-demo-mainhead">
        <div>
          <p className="tots-demo-label">
            administrative centre
          </p>

          <h3 className="tots-demo-serif">
            Settings
          </h3>
        </div>
      </div>

      <DemoPanel
        eyebrow="business"
        title="Workspace settings"
      >
        <div className="tots-demo-grid-2">
          <div>
            <p className="tots-demo-label">
              Business name
            </p>

            <div className="tots-demo-field">
              Your Business
            </div>
          </div>

          <div>
            <p className="tots-demo-label">
              Email
            </p>

            <div className="tots-demo-field">
              hello@yourbusiness.com
            </div>
          </div>
        </div>
      </DemoPanel>
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

// ============================================================
// PRODUCT DEMO
// ============================================================

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
        className="tots-window-wrap"
        id="demo"
      >
        <div className="tots-demo-heading">
          <span className="tots-status-dot" />

          CLICK AROUND TOTS-OS
        </div>

        <div className="tots-window-glow" />

        <div className="tots-window">
          <div className="tots-window-bar">
            <div className="tots-window-dots">
              <span />
              <span />
              <span />
            </div>

            <div className="tots-window-url">
              <LockKeyhole
                size={9}
              />

              tots-os.co.uk
            </div>

            <div className="tots-window-status">
              <span className="tots-status-dot" />
              demo
            </div>
          </div>

          <div className="tots-window-body">
            <aside className="tots-window-side">
              <div className="tots-window-side-brand">
                <Logo
                  size={28}
                  showWordmark={
                    false
                  }
                />

                <span className="tots-window-side-label">
                  workspace
                </span>
              </div>

              <div className="tots-window-nav">
                {DEMO_NAV.map(
                  (
                    item,
                    index
                  ) => {
                    const Icon =
                      item.icon;

                    const showGroup =
                      item.group &&
                      DEMO_NAV[
                        index -
                          1
                      ]?.group !==
                        item.group;

                    return (
                      <div
                        key={
                          item.key
                        }
                      >
                        {showGroup && (
                          <p className="tots-window-navgroup">
                            {
                              item.group
                            }
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setActive(
                              item.key
                            )
                          }
                          className={`tots-window-navitem ${
                            active ===
                            item.key
                              ? "is-active"
                              : ""
                          }`}
                        >
                          <Icon
                            size={
                              15
                            }
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
            </aside>

            <div className="tots-window-main">
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    active
                  }
                  initial={{
                    opacity:
                      0,
                    y: 8,
                  }}
                  animate={{
                    opacity:
                      1,
                    y: 0,
                  }}
                  exit={{
                    opacity:
                      0,
                    y: -5,
                  }}
                  transition={{
                    duration:
                      0.25,
                  }}
                >
                  <ActiveView />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="tots-demo-instruction">
          Explore the workspace yourself.
        </p>

        <div className="tots-window-nav-hint">
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
                className={`tots-window-hint-chip ${
                  active ===
                  item.key
                    ? "is-active"
                    : ""
                }`}
              >
                {
                  item.label
                }
              </button>
            )
          )}
        </div>

        <div className="tots-demo-conversion">
          <div>
            <span className="tots-demo-conversion-kicker">
              Like what you see?
            </span>

            <h3>
              Now put your actual
              business inside it.
            </h3>

            <p>
              Create your account,
              add your clients and
              start bringing your
              business into one
              connected workspace.
            </p>
          </div>

          <a
            href={
              SIGNUP_URL
            }
            className="tots-btn-solid tots-btn-large"
          >
            Create my free
            workspace

            <ArrowRight
              size={15}
            />
          </a>
        </div>
      </div>
    </Reveal>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function TotsOSLanding() {
  const reduceMotion =
    useReducedMotion();

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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:ital,wght@0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #08080a;
        }

        .tots-root {
          --bg: #08080a;
          --bg1: #0e0e10;
          --bg2: #131315;

          --ink: #f3f4ee;
          --ink-dim: rgba(243,244,238,0.55);
          --ink-faint: rgba(243,244,238,0.30);
          --ink-ghost: rgba(243,244,238,0.10);

          --accent: #d7e0a8;
          --accent-gold: #cbab6e;
          --accent-soft: rgba(215,224,168,0.12);
          --accent-deep: #78854e;

          --line: rgba(243,244,238,0.10);
          --line-light: rgba(243,244,238,0.06);

          --serif:
            'Fraunces',
            Georgia,
            serif;

          min-height:
            100vh;

          position:
            relative;

          overflow-x:
            hidden;

          background:
            radial-gradient(
              ellipse 60% 30%
              at 50% 0%,
              rgba(215,224,168,0.08),
              transparent 70%
            ),
            #08080a;

          color:
            var(--ink);

          font-family:
            'Inter',
            system-ui,
            sans-serif;
        }

        .tots-root * {
          box-sizing:
            border-box;
        }

        .tots-root h1,
        .tots-root h2,
        .tots-root h3 {
          margin:
            0;

          font-family:
            'Space Grotesk',
            sans-serif;

          letter-spacing:
            -0.045em;
        }

        .tots-root p {
          margin:
            0;
        }

        .tots-root ::selection {
          background:
            var(--accent);

          color:
            #08080a;
        }

        /* =====================================================
           BACKGROUND
        ===================================================== */

        .tots-bg-grid {
          position:
            fixed;

          inset:
            0;

          pointer-events:
            none;

          z-index:
            0;

          opacity:
            0.24;

          background-image:
            linear-gradient(
              rgba(243,244,238,0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(243,244,238,0.04) 1px,
              transparent 1px
            );

          background-size:
            64px 64px;

          mask-image:
            radial-gradient(
              ellipse 70% 55%
              at 50% 0%,
              black 10%,
              transparent 78%
            );
        }

        /* =====================================================
           GLOBAL
        ===================================================== */

        .tots-wrap {
          width:
            100%;

          max-width:
            1400px;

          margin:
            0 auto;
        }

        .tots-wrap-narrow {
          width:
            100%;

          max-width:
            1120px;

          margin:
            0 auto;
        }

        .tots-section {
          position:
            relative;

          z-index:
            5;

          padding:
            90px 20px;
        }

        .tots-section-bordered {
          border-top:
            1px solid var(--line);

          border-bottom:
            1px solid var(--line);

          background:
            rgba(
              255,
              255,
              255,
              0.008
            );
        }

        @media (
          min-width:
          1024px
        ) {

          .tots-section {
            padding:
              130px 24px;
          }

        }

        .tots-eyebrow {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            8px 14px;

          border:
            1px solid
            var(--line);

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.02
            );

          color:
            var(--ink-dim);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          letter-spacing:
            0.17em;

          text-transform:
            uppercase;
        }

        .tots-eyebrow-dot {
          width:
            6px;

          height:
            6px;

          border-radius:
            999px;

          background:
            var(--accent);

          box-shadow:
            0 0 12px
            rgba(
              215,
              224,
              168,
              0.75
            );
        }

        .tots-section-heading {
          max-width:
            900px;

          margin-top:
            26px;

          font-size:
            clamp(
              2.5rem,
              5.5vw,
              5.6rem
            );

          line-height:
            0.98;

          font-weight:
            500;
        }

        .tots-section-copy {
          max-width:
            600px;

          margin-top:
            24px;

          color:
            var(--ink-dim);

          font-size:
            14.5px;

          line-height:
            1.8;
        }

        .tots-serif {
          font-family:
            var(--serif);

          font-style:
            italic;
        }

        .tots-accent {
          color:
            var(--accent);
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .tots-logo-unit {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            10px;
        }

        .tots-logo-mark {
          display:
            block;

          object-fit:
            contain;

          border-radius:
            9px;
        }

        .tots-logo-word {
          display:
            flex;

          flex-direction:
            column;

          line-height:
            1.2;
        }

        .tots-logo-name {
          color:
            var(--ink);

          font-size:
            12px;

          font-weight:
            600;

          letter-spacing:
            0.14em;
        }

        .tots-logo-sub {
          margin-top:
            2px;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          letter-spacing:
            0.15em;

          text-transform:
            uppercase;
        }

        /* =====================================================
           BUTTONS
        ===================================================== */

        .tots-btn-solid,
        .tots-btn-ghost {
          min-height:
            42px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          padding:
            0 18px;

          border-radius:
            999px;

          text-decoration:
            none;

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          font-weight:
            600;

          letter-spacing:
            0.11em;

          text-transform:
            uppercase;

          transition:
            transform 0.2s ease,
            filter 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
        }

        .tots-btn-solid {
          border:
            none;

          color:
            #08080a;

          background:
            linear-gradient(
              135deg,
              var(--accent),
              var(--accent-gold)
            );

          box-shadow:
            0 8px 30px
            rgba(
              215,
              224,
              168,
              0.08
            );
        }

        .tots-btn-solid:hover {
          transform:
            translateY(-2px);

          filter:
            brightness(1.06);
        }

        .tots-btn-ghost {
          color:
            var(--ink-dim);

          border:
            1px solid
            var(--line);

          background:
            rgba(
              255,
              255,
              255,
              0.015
            );
        }

        .tots-btn-ghost:hover {
          color:
            var(--ink);

          border-color:
            rgba(
              243,
              244,
              238,
              0.25
            );

          transform:
            translateY(-2px);
        }

        .tots-btn-large {
          min-height:
            56px;

          padding:
            0 28px;

          font-size:
            10px;
        }

        /* =====================================================
           NAV
        ===================================================== */

        .tots-nav-shell {
          position:
            fixed;

          top:
            0;

          left:
            0;

          right:
            0;

          z-index:
            50;

          padding:
            16px 16px 0;
        }

        .tots-nav {
          max-width:
            1400px;

          height:
            64px;

          margin:
            0 auto;

          padding:
            0 10px
            0 16px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border:
            1px solid
            var(--line);

          border-radius:
            18px;

          background:
            rgba(
              8,
              8,
              10,
              0.82
            );

          backdrop-filter:
            blur(22px);

          -webkit-backdrop-filter:
            blur(22px);
        }

        .tots-brand {
          display:
            flex;

          align-items:
            center;

          color:
            inherit;

          text-decoration:
            none;
        }

        .tots-nav-links {
          display:
            none;

          align-items:
            center;
        }

        .tots-nav-link {
          padding:
            9px 14px;

          border-radius:
            999px;

          text-decoration:
            none;

          color:
            var(--ink-dim);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          letter-spacing:
            0.11em;

          text-transform:
            uppercase;

          transition:
            0.2s ease;
        }

        .tots-nav-link:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.04
            );

          color:
            var(--ink);
        }

        .tots-nav-actions {
          display:
            none;

          gap:
            8px;
        }

        .tots-menu-btn {
          width:
            40px;

          height:
            40px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            var(--line);

          border-radius:
            999px;

          background:
            transparent;

          color:
            var(--ink);

          cursor:
            pointer;
        }

        @media (
          min-width:
          650px
        ) {

          .tots-nav-actions {
            display:
              flex;
          }

          .tots-menu-btn {
            display:
              none;
          }

        }

        @media (
          min-width:
          1050px
        ) {

          .tots-nav-links {
            display:
              flex;
          }

        }

        /* =====================================================
           MOBILE MENU
        ===================================================== */

        .tots-mobile-menu {
          position:
            fixed;

          inset:
            0;

          z-index:
            100;

          padding:
            16px;

          background:
            rgba(
              4,
              4,
              5,
              0.94
            );

          backdrop-filter:
            blur(30px);
        }

        .tots-mobile-panel {
          max-height:
            calc(
              100vh -
              32px
            );

          overflow-y:
            auto;

          border:
            1px solid
            var(--line);

          border-radius:
            24px;

          background:
            var(--bg1);

          padding:
            20px;
        }

        .tots-mobile-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;
        }

        .tots-mobile-links {
          margin-top:
            24px;

          display:
            grid;

          gap:
            4px;
        }

        .tots-mobile-link {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding:
            15px 14px;

          border-radius:
            14px;

          color:
            var(--ink-dim);

          text-decoration:
            none;

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            11px;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .tots-mobile-link:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.04
            );

          color:
            var(--ink);
        }

        .tots-mobile-actions {
          margin-top:
            22px;

          display:
            grid;

          grid-template-columns:
            1fr;

          gap:
            8px;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .tots-hero {
          position:
            relative;

          z-index:
            5;

          padding:
            150px 20px
            70px;
        }

        .tots-hero-inner {
          max-width:
            1400px;

          margin:
            0 auto;

          text-align:
            center;
        }

        .tots-hero-kicker {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            9px 14px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.18
            );

          border-radius:
            999px;

          background:
            rgba(
              215,
              224,
              168,
              0.04
            );

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          letter-spacing:
            0.15em;

          text-transform:
            uppercase;
        }

        .tots-hero h1 {
          max-width:
            1180px;

          margin:
            28px auto 0;

          font-size:
            clamp(
              3rem,
              7.2vw,
              7.2rem
            );

          font-weight:
            600;

          line-height:
            0.94;
        }

        .tots-hero-line2 {
          display:
            block;

          margin-top:
            7px;

          font-family:
            var(--serif);

          font-weight:
            500;

          font-style:
            italic;

          background:
            linear-gradient(
              90deg,
              #fff,
              var(--accent)
              65%,
              var(--accent-gold)
            );

          background-clip:
            text;

          -webkit-background-clip:
            text;

          color:
            transparent;
        }

        .tots-hero-lede {
          width:
            100%;

          max-width:
            790px;

          margin:
            30px auto 0;

          color:
            rgba(
              243,
              244,
              238,
              0.65
            );

          font-size:
            clamp(
              1rem,
              1.4vw,
              1.16rem
            );

          line-height:
            1.75;
        }

        .tots-hero-lede strong {
          color:
            var(--ink);

          font-weight:
            500;
        }

        .tots-hero-ctas {
          margin-top:
            38px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            12px;
        }

        @media (
          min-width:
          600px
        ) {

          .tots-hero-ctas {
            flex-direction:
              row;
          }

        }

        .tots-trial-note {
          margin-top:
            18px;

          display:
            flex;

          flex-wrap:
            wrap;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px 18px;

          color:
            rgba(
              243,
              244,
              238,
              0.52
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8.5px;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .tots-trial-note span {
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

        .tots-trusted {
          position:
            relative;

          z-index:
            5;

          padding:
            25px 20px
            65px;
        }

        .tots-trusted-inner {
          max-width:
            1180px;

          margin:
            0 auto;

          padding:
            28px 24px;

          border:
            1px solid
            var(--line);

          border-radius:
            22px;

          background:
            rgba(
              255,
              255,
              255,
              0.015
            );
        }

        .tots-trusted-label {
          text-align:
            center;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.16em;

          text-transform:
            uppercase;
        }

        .tots-trusted-grid {
          margin-top:
            20px;

          display:
            flex;

          flex-wrap:
            wrap;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;
        }

        .tots-trusted-name {
          padding:
            10px 14px;

          border:
            1px solid
            rgba(
              243,
              244,
              238,
              0.075
            );

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );

          color:
            rgba(
              243,
              244,
              238,
              0.72
            );

          font-size:
            11px;

          font-weight:
            500;
        }

        /* =====================================================
           PAIN
        ===================================================== */

        .tots-pain {
          position:
            relative;

          z-index:
            5;

          padding:
            90px 20px;
        }

        .tots-pain-card {
          max-width:
            1100px;

          margin:
            0 auto;

          padding:
            46px 28px;

          border:
            1px solid
            var(--line);

          border-radius:
            28px;

          background:
            linear-gradient(
              135deg,
              rgba(
                255,
                255,
                255,
                0.025
              ),
              rgba(
                215,
                224,
                168,
                0.025
              )
            );

          text-align:
            center;
        }

        .tots-pain-card h2 {
          max-width:
            850px;

          margin:
            24px auto 0;

          font-size:
            clamp(
              2rem,
              5vw,
              4.5rem
            );

          line-height:
            1;

          font-weight:
            500;
        }

        .tots-pain-card p {
          max-width:
            670px;

          margin:
            20px auto 0;

          color:
            var(--ink-dim);

          font-size:
            13.5px;

          line-height:
            1.75;
        }

        .tots-pain-chips {
          margin-top:
            32px;

          display:
            flex;

          flex-wrap:
            wrap;

          justify-content:
            center;

          gap:
            8px;
        }

        .tots-pain-chip {
          padding:
            9px 13px;

          border:
            1px solid
            var(--line);

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.02
            );

          color:
            rgba(
              243,
              244,
              238,
              0.62
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .tots-pain-bottom {
          margin-top:
            30px;

          color:
            var(--accent);

          font-family:
            var(--serif);

          font-size:
            clamp(
              1.4rem,
              3vw,
              2.1rem
            );

          font-style:
            italic;
        }

        /* =====================================================
           BEFORE / AFTER
        ===================================================== */

        .tots-transform-grid {
          margin-top:
            55px;

          display:
            grid;

          gap:
            14px;
        }

        @media (
          min-width:
          850px
        ) {

          .tots-transform-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        .tots-transform-card {
          padding:
            30px;

          border:
            1px solid
            var(--line);

          border-radius:
            24px;

          background:
            rgba(
              255,
              255,
              255,
              0.015
            );
        }

        .tots-transform-card.good {
          border-color:
            rgba(
              215,
              224,
              168,
              0.25
            );

          background:
            rgba(
              215,
              224,
              168,
              0.035
            );
        }

        .tots-transform-label {
          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;
        }

        .tots-transform-card.good
        .tots-transform-label {
          color:
            var(--accent);
        }

        .tots-transform-card h3 {
          margin-top:
            14px;

          font-size:
            clamp(
              1.6rem,
              3vw,
              2.4rem
            );

          font-weight:
            500;
        }

        .tots-transform-list {
          margin-top:
            25px;

          display:
            grid;

          gap:
            9px;
        }

        .tots-transform-row {
          min-height:
            46px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          padding:
            10px 13px;

          border:
            1px solid
            var(--line-light);

          border-radius:
            12px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );

          color:
            var(--ink-dim);

          font-size:
            12px;
        }

        .tots-transform-row svg {
          flex-shrink:
            0;

          color:
            var(--accent);
        }

        /* =====================================================
           WHY
        ===================================================== */

        .tots-why-grid {
          margin-top:
            55px;

          display:
            grid;

          gap:
            12px;
        }

        @media (
          min-width:
          900px
        ) {

          .tots-why-grid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-why-card {
          min-height:
            330px;

          padding:
            28px;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            var(--line);

          border-radius:
            24px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );

          transition:
            0.25s ease;
        }

        .tots-why-card:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(
              215,
              224,
              168,
              0.25
            );
        }

        .tots-why-icon {
          width:
            44px;

          height:
            44px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            var(--line);

          border-radius:
            13px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );

          color:
            var(--accent);
        }

        .tots-why-card h3 {
          margin-top:
            auto;

          padding-top:
            80px;

          font-size:
            23px;

          font-weight:
            500;
        }

        .tots-why-card p {
          max-width:
            350px;

          margin-top:
            12px;

          color:
            var(--ink-dim);

          font-size:
            13px;

          line-height:
            1.75;
        }

        /* =====================================================
           DEMO
        ===================================================== */

        .tots-demo-section {
          position:
            relative;

          z-index:
            5;

          padding:
            90px 20px
            120px;
        }

        .tots-demo-section-head {
          max-width:
            900px;

          margin:
            0 auto;

          text-align:
            center;
        }

        .tots-demo-section-head
        .tots-section-copy {
          margin-left:
            auto;

          margin-right:
            auto;
        }

        .tots-window-wrap {
          position:
            relative;

          max-width:
            1180px;

          margin:
            55px auto 0;

          text-align:
            left;
        }

        .tots-demo-heading {
          margin-bottom:
            14px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.15em;
        }

        .tots-window-glow {
          position:
            absolute;

          inset:
            -50px;

          background:
            radial-gradient(
              ellipse,
              rgba(
                215,
                224,
                168,
                0.09
              ),
              transparent
              68%
            );

          filter:
            blur(45px);

          pointer-events:
            none;
        }

        .tots-window {
          position:
            relative;

          overflow:
            hidden;

          border:
            1px solid
            var(--line);

          border-radius:
            22px;

          background:
            #f7f6f1;

          box-shadow:
            0 50px 150px
            rgba(
              0,
              0,
              0,
              0.55
            );
        }

        .tots-window-bar {
          height:
            42px;

          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          padding:
            0 14px;

          background:
            #ebe9e0;

          border-bottom:
            1px solid
            rgba(
              20,
              20,
              18,
              0.08
            );
        }

        .tots-window-dots {
          display:
            flex;

          gap:
            5px;
        }

        .tots-window-dots span {
          width:
            7px;

          height:
            7px;

          border-radius:
            999px;

          background:
            rgba(
              20,
              20,
              18,
              0.18
            );
        }

        .tots-window-url {
          margin:
            0 auto;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          padding:
            5px 12px;

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.65
            );

          color:
            rgba(
              20,
              20,
              18,
              0.48
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;
        }

        .tots-window-status {
          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          color:
            var(--accent-deep);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          text-transform:
            uppercase;
        }

        .tots-status-dot {
          display:
            inline-block;

          width:
            6px;

          height:
            6px;

          flex-shrink:
            0;

          border-radius:
            999px;

          background:
            var(--accent);

          box-shadow:
            0 0 10px
            rgba(
              215,
              224,
              168,
              0.75
            );
        }

        .tots-window-body {
          display:
            grid;

          grid-template-columns:
            60px 1fr;

          min-height:
            520px;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-window-body {
            grid-template-columns:
              190px 1fr;
          }

        }

        .tots-window-side {
          padding:
            15px 10px;

          border-right:
            1px solid
            rgba(
              20,
              20,
              18,
              0.07
            );

          background:
            #fbfaf6;
        }

        .tots-window-side-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          padding-left:
            4px;
        }

        .tots-window-side-label {
          display:
            none;

          color:
            rgba(
              20,
              20,
              18,
              0.35
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-window-side-label {
            display:
              inline;
          }

        }

        .tots-window-nav {
          margin-top:
            24px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            2px;
        }

        .tots-window-navgroup {
          display:
            none;

          margin:
            14px 0
            5px 9px;

          color:
            rgba(
              20,
              20,
              18,
              0.28
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-window-navgroup {
            display:
              block;
          }

        }

        .tots-window-navitem {
          width:
            100%;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            9px 10px;

          border:
            none;

          border-radius:
            10px;

          background:
            transparent;

          color:
            rgba(
              20,
              20,
              18,
              0.55
            );

          cursor:
            pointer;

          text-align:
            left;
        }

        .tots-window-navitem:hover {
          background:
            rgba(
              20,
              20,
              18,
              0.04
            );
        }

        .tots-window-navitem.is-active {
          background:
            var(--accent);

          color:
            #11110e;
        }

        .tots-window-navitem span {
          display:
            none;

          font-size:
            10px;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-window-navitem span {
            display:
              inline;
          }

        }

        .tots-window-main {
          min-width:
            0;

          padding:
            18px;

          color:
            #16160f;
        }

        @media (
          min-width:
          650px
        ) {

          .tots-window-main {
            padding:
              28px;
          }

        }

        .tots-demo-instruction {
          margin-top:
            18px;

          text-align:
            center;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.1em;

          text-transform:
            uppercase;
        }

        .tots-window-nav-hint {
          margin-top:
            14px;

          display:
            flex;

          flex-wrap:
            wrap;

          justify-content:
            center;

          gap:
            6px;
        }

        .tots-window-hint-chip {
          padding:
            7px 10px;

          border:
            1px solid
            var(--line);

          border-radius:
            999px;

          background:
            transparent;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }

        .tots-window-hint-chip.is-active {
          border-color:
            rgba(
              215,
              224,
              168,
              0.4
            );

          color:
            var(--accent);
        }

        .tots-demo-conversion {
          position:
            relative;

          margin-top:
            34px;

          padding:
            28px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            flex-start;

          gap:
            22px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.22
            );

          border-radius:
            22px;

          background:
            linear-gradient(
              135deg,
              rgba(
                215,
                224,
                168,
                0.07
              ),
              rgba(
                255,
                255,
                255,
                0.018
              )
            );
        }

        .tots-demo-conversion-kicker {
          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;
        }

        .tots-demo-conversion h3 {
          margin-top:
            7px;

          font-size:
            clamp(
              1.5rem,
              3vw,
              2.4rem
            );

          font-weight:
            500;
        }

        .tots-demo-conversion p {
          max-width:
            600px;

          margin-top:
            9px;

          color:
            var(--ink-dim);

          font-size:
            12.5px;

          line-height:
            1.7;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-demo-conversion {
            flex-direction:
              row;

            align-items:
              center;

            justify-content:
              space-between;
          }

          .tots-demo-conversion
          .tots-btn-solid {
            flex-shrink:
              0;
          }

        }

        /* =====================================================
           DEMO INTERNAL
        ===================================================== */

        .tots-demo-mainhead,
        .tots-demo-between {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            12px;

          flex-wrap:
            wrap;
        }

        .tots-demo-serif {
          margin-top:
            4px;

          font-family:
            var(--serif)
            !important;

          font-size:
            25px;

          font-weight:
            500;

          font-style:
            italic;

          letter-spacing:
            -0.01em
            !important;

          color:
            #16160f;
        }

        .tots-demo-label {
          color:
            rgba(
              20,
              20,
              18,
              0.38
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .tots-demo-dim {
          color:
            rgba(
              20,
              20,
              18,
              0.50
            );

          font-size:
            11px;

          line-height:
            1.55;
        }

        .tots-demo-ai {
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

          border-radius:
            999px;

          background:
            #16160f;

          color:
            var(--accent);
        }

        .tots-demo-stats {
          display:
            grid;

          gap:
            8px;

          margin-top:
            18px;
        }

        .tots-demo-stats-6,
        .tots-demo-stats-4 {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .tots-demo-stats-3 {
          grid-template-columns:
            repeat(
              3,
              1fr
            );
        }

        @media (
          min-width:
          650px
        ) {

          .tots-demo-stats-6 {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

          .tots-demo-stats-4 {
            grid-template-columns:
              repeat(
                4,
                1fr
              );
          }

        }

        @media (
          min-width:
          1000px
        ) {

          .tots-demo-stats-6 {
            grid-template-columns:
              repeat(
                6,
                1fr
              );
          }

        }

        .tots-demo-stat {
          min-width:
            0;

          padding:
            11px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.08
            );

          border-radius:
            11px;

          background:
            rgba(
              255,
              255,
              255,
              0.55
            );
        }

        .tots-demo-value {
          margin-top:
            7px;

          font-family:
            'Space Grotesk',
            sans-serif;

          font-size:
            17px;

          font-weight:
            500;
        }

        .tots-demo-note {
          margin-top:
            3px;

          color:
            var(--accent-deep);

          font-size:
            8px;
        }

        .tots-demo-grid-2 {
          margin-top:
            14px;

          display:
            grid;

          gap:
            10px;
        }

        @media (
          min-width:
          900px
        ) {

          .tots-demo-grid-2 {
            grid-template-columns:
              1fr 1fr;
          }

        }

        .tots-demo-panel {
          padding:
            17px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.08
            );

          border-radius:
            15px;

          background:
            rgba(
              255,
              255,
              255,
              0.55
            );
        }

        .tots-demo-panel-title {
          margin-top:
            3px;

          font-family:
            var(--serif);

          font-size:
            15px;

          font-style:
            italic;
        }

        .tots-demo-panel-dark {
          background:
            #16160f;

          color:
            #f3f4ee;
        }

        .label-light {
          color:
            rgba(
              243,
              244,
              238,
              0.4
            );
        }

        .serif-light {
          color:
            #f3f4ee;
        }

        .tots-demo-panel-dark
        .tots-demo-stat {
          border-color:
            rgba(
              255,
              255,
              255,
              0.07
            );

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
        }

        .tots-demo-panel-dark
        .tots-demo-label {
          color:
            rgba(
              243,
              244,
              238,
              0.35
            );
        }

        .tots-demo-panel-dark
        .tots-demo-value {
          color:
            #f3f4ee;
        }

        .tots-demo-list {
          margin-top:
            12px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            7px;
        }

        .tots-demo-row {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            9px 11px;

          border-radius:
            10px;

          background:
            rgba(
              20,
              20,
              18,
              0.035
            );

          color:
            rgba(
              20,
              20,
              18,
              0.72
            );

          font-size:
            11px;
        }

        .tots-demo-num {
          width:
            18px;

          height:
            18px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            999px;

          background:
            #16160f;

          color:
            var(--accent);

          font-size:
            8px;
        }

        .tots-demo-ai-response {
          margin-top:
            15px;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            11px;

          border:
            1px solid
            rgba(
              124,
              138,
              82,
              0.18
            );

          border-radius:
            11px;

          background:
            rgba(
              215,
              224,
              168,
              0.18
            );

          color:
            #5f693e;

          font-size:
            10px;

          font-weight:
            600;
        }

        .tots-demo-pill-btn {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          padding:
            8px 12px;

          border-radius:
            999px;

          background:
            #16160f;

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          text-transform:
            uppercase;
        }

        .tots-demo-pill {
          padding:
            5px 8px;

          border-radius:
            999px;

          background:
            rgba(
              20,
              20,
              18,
              0.06
            );

          color:
            rgba(
              20,
              20,
              18,
              0.5
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;
        }

        .tots-demo-searchbar {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          padding:
            8px 12px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.1
            );

          border-radius:
            999px;

          color:
            rgba(
              20,
              20,
              18,
              0.4
            );

          font-size:
            10px;
        }

        .tots-demo-contact-row {
          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          padding:
            11px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.07
            );

          border-radius:
            11px;

          background:
            rgba(
              255,
              255,
              255,
              0.5
            );
        }

        .tots-demo-avatar {
          width:
            32px;

          height:
            32px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            999px;

          background:
            var(--accent);

          font-weight:
            700;
        }

        .tots-demo-contact-name {
          color:
            #16160f;

          font-size:
            12px;

          font-weight:
            600;
        }

        .tots-demo-upload {
          min-height:
            170px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          padding:
            30px;

          border:
            1px dashed
            rgba(
              20,
              20,
              18,
              0.17
            );

          border-radius:
            15px;

          color:
            rgba(
              20,
              20,
              18,
              0.4
            );
        }

        .demo-upload-title {
          margin-top:
            10px;
        }

        .tots-demo-toggle {
          width:
            31px;

          height:
            18px;

          display:
            flex;

          align-items:
            center;

          padding:
            2px;

          border-radius:
            999px;

          background:
            rgba(
              20,
              20,
              18,
              0.12
            );
        }

        .tots-demo-toggle span {
          width:
            14px;

          height:
            14px;

          border-radius:
            999px;

          background:
            white;
        }

        .tots-demo-toggle.is-on {
          justify-content:
            flex-end;

          background:
            var(--accent-deep);
        }

        .tots-demo-tabs {
          margin-top:
            16px;

          display:
            flex;

          gap:
            4px;

          flex-wrap:
            wrap;
        }

        .tots-demo-tab {
          padding:
            7px 10px;

          border-radius:
            999px;

          color:
            rgba(
              20,
              20,
              18,
              0.42
            );

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          text-transform:
            uppercase;
        }

        .tots-demo-tab.is-active {
          background:
            #16160f;

          color:
            var(--accent);
        }

        .tots-demo-kanban {
          margin-top:
            16px;

          display:
            grid;

          gap:
            9px;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-demo-kanban {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-demo-kanban-col {
          padding:
            11px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.08
            );

          border-radius:
            12px;

          background:
            rgba(
              20,
              20,
              18,
              0.02
            );
        }

        .tots-demo-card {
          margin-top:
            9px;

          padding:
            11px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.07
            );

          border-radius:
            10px;

          background:
            white;
        }

        .tots-demo-field {
          margin-top:
            6px;

          min-height:
            36px;

          padding:
            10px;

          border:
            1px solid
            rgba(
              20,
              20,
              18,
              0.1
            );

          border-radius:
            9px;

          color:
            rgba(
              20,
              20,
              18,
              0.55
            );

          font-size:
            10px;
        }

        .demo-top {
          margin-top:
            18px;
        }

        .demo-small-top {
          margin-top:
            5px;
        }

        .demo-copy {
          margin-top:
            12px;
        }

        .demo-flex {
          flex:
            1;

          min-width:
            0;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .tots-feat-grid {
          margin-top:
            60px;

          display:
            grid;

          gap:
            1px;

          overflow:
            hidden;

          border:
            1px solid
            var(--line);

          border-radius:
            26px;

          background:
            var(--line);
        }

        @media (
          min-width:
          700px
        ) {

          .tots-feat-grid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

        }

        @media (
          min-width:
          1024px
        ) {

          .tots-feat-grid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-feat-card {
          min-height:
            290px;

          padding:
            30px;

          background:
            #08080a;

          transition:
            0.2s ease;
        }

        .tots-feat-card:hover {
          background:
            #101012;
        }

        .tots-feat-icon {
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
            var(--line);

          border-radius:
            13px;

          color:
            var(--accent);
        }

        .tots-feat-card h3 {
          margin-top:
            42px;

          font-size:
            21px;

          font-weight:
            500;
        }

        .tots-feat-card p {
          max-width:
            340px;

          margin-top:
            12px;

          color:
            var(--ink-dim);

          font-size:
            12.5px;

          line-height:
            1.75;
        }

        /* =====================================================
           CONNECTED
        ===================================================== */

        .tots-connected-grid {
          display:
            grid;

          gap:
            60px;

          align-items:
            center;
        }

        @media (
          min-width:
          1000px
        ) {

          .tots-connected-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        .tots-connection-board {
          display:
            grid;

          gap:
            10px;

          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        @media (
          min-width:
          600px
        ) {

          .tots-connection-board {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-connection-item {
          min-height:
            130px;

          padding:
            18px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            space-between;

          border:
            1px solid
            var(--line);

          border-radius:
            18px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );
        }

        .tots-connection-item svg {
          color:
            var(--accent);
        }

        .tots-connection-item span {
          color:
            var(--ink-dim);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          text-transform:
            uppercase;
        }

        /* =====================================================
           CLARITY
        ===================================================== */

        .tots-clarity-section {
          position:
            relative;

          z-index:
            5;

          padding:
            100px 20px;
        }

        @media (
          min-width:
          1024px
        ) {

          .tots-clarity-section {
            padding:
              140px 24px;
          }

        }

        .tots-clarity-shell {
          position:
            relative;

          overflow:
            hidden;

          padding:
            35px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.20
            );

          border-radius:
            32px;

          background:
            linear-gradient(
              135deg,
              rgba(
                215,
                224,
                168,
                0.05
              ),
              rgba(
                255,
                255,
                255,
                0.012
              )
            );
        }

        @media (
          min-width:
          900px
        ) {

          .tots-clarity-shell {
            padding:
              60px;
          }

        }

        .tots-clarity-glow {
          position:
            absolute;

          width:
            600px;

          height:
            600px;

          top:
            -350px;

          right:
            -100px;

          border-radius:
            999px;

          background:
            rgba(
              215,
              224,
              168,
              0.1
            );

          filter:
            blur(100px);

          pointer-events:
            none;
        }

        .tots-clarity-grid {
          position:
            relative;

          display:
            grid;

          gap:
            50px;

          align-items:
            center;
        }

        @media (
          min-width:
          1000px
        ) {

          .tots-clarity-grid {
            grid-template-columns:
              0.9fr
              1.1fr;
          }

        }

        .tots-clarity-title {
          margin-top:
            25px;

          font-size:
            clamp(
              3rem,
              6vw,
              6rem
            );

          line-height:
            0.92;

          font-weight:
            500;
        }

        .tots-clarity-title span {
          display:
            block;

          color:
            var(--accent);

          font-family:
            var(--serif);

          font-style:
            italic;
        }

        .tots-clarity-copy {
          max-width:
            560px;

          margin-top:
            26px;

          color:
            var(--ink-dim);

          font-size:
            14px;

          line-height:
            1.8;
        }

        .tots-clarity-points {
          margin-top:
            30px;

          display:
            grid;

          gap:
            12px;
        }

        .tots-clarity-point {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            12px;

          color:
            rgba(
              243,
              244,
              238,
              0.72
            );

          font-size:
            13px;

          line-height:
            1.6;
        }

        .tots-clarity-check {
          width:
            26px;

          height:
            26px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.25
            );

          border-radius:
            999px;

          background:
            rgba(
              215,
              224,
              168,
              0.08
            );

          color:
            var(--accent);
        }

        .tots-clarity-demo {
          padding:
            20px;

          border:
            1px solid
            var(--line);

          border-radius:
            26px;

          background:
            #0b0b0d;

          box-shadow:
            0 40px
            100px
            rgba(
              0,
              0,
              0,
              0.35
            );
        }

        .tots-clarity-demo-head {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            12px;

          padding-bottom:
            16px;

          border-bottom:
            1px solid
            var(--line);
        }

        .tots-clarity-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            9px;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .tots-clarity-online {
          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;
        }

        .tots-clarity-message {
          margin-top:
            18px;

          margin-left:
            auto;

          max-width:
            85%;

          padding:
            14px 16px;

          border:
            1px solid
            var(--line);

          border-radius:
            17px 17px
            5px 17px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );

          color:
            rgba(
              243,
              244,
              238,
              0.72
            );

          font-size:
            12px;

          line-height:
            1.65;
        }

        .tots-clarity-response {
          margin-top:
            16px;

          max-width:
            94%;

          padding:
            18px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.17
            );

          border-radius:
            5px 17px
            17px 17px;

          background:
            rgba(
              215,
              224,
              168,
              0.05
            );
        }

        .tots-clarity-response-label {
          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .tots-clarity-response p {
          margin-top:
            10px;

          color:
            rgba(
              243,
              244,
              238,
              0.79
            );

          font-size:
            12px;

          line-height:
            1.75;
        }

        .tots-priority-list {
          margin-top:
            14px;

          display:
            grid;

          gap:
            8px;
        }

        .tots-priority {
          padding:
            11px;

          display:
            flex;

          gap:
            10px;

          border:
            1px solid
            var(--line-light);

          border-radius:
            12px;

          background:
            rgba(
              255,
              255,
              255,
              0.02
            );
        }

        .tots-priority-number {
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
            999px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;
        }

        .tots-priority strong {
          display:
            block;

          color:
            rgba(
              243,
              244,
              238,
              0.83
            );

          font-size:
            11px;

          font-weight:
            500;
        }

        .tots-priority small {
          display:
            block;

          margin-top:
            3px;

          color:
            var(--ink-faint);

          font-size:
            9px;

          line-height:
            1.5;
        }

        /* =====================================================
           SECURITY
        ===================================================== */

        .tots-security-grid {
          display:
            grid;

          gap:
            12px;

          margin-top:
            55px;
        }

        @media (
          min-width:
          800px
        ) {

          .tots-security-grid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-security-card {
          padding:
            26px;

          border:
            1px solid
            var(--line);

          border-radius:
            22px;

          background:
            rgba(
              255,
              255,
              255,
              0.015
            );
        }

        .tots-security-card svg {
          color:
            var(--accent);
        }

        .tots-security-card h3 {
          margin-top:
            28px;

          font-size:
            18px;

          font-weight:
            500;
        }

        .tots-security-card p {
          margin-top:
            10px;

          color:
            var(--ink-dim);

          font-size:
            12px;

          line-height:
            1.7;
        }

        /* =====================================================
           PRICING
        ===================================================== */

        .tots-pricing-trial {
          margin-top:
            26px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            10px 15px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.22
            );

          border-radius:
            999px;

          background:
            rgba(
              215,
              224,
              168,
              0.055
            );

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.1em;

          text-transform:
            uppercase;
        }

        .tots-price-grid {
          margin-top:
            60px;

          display:
            grid;

          gap:
            12px;
        }

        @media (
          min-width:
          950px
        ) {

          .tots-price-grid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-price-card {
          min-height:
            570px;

          display:
            flex;

          flex-direction:
            column;

          padding:
            30px;

          border:
            1px solid
            var(--line);

          border-radius:
            27px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );
        }

        .tots-price-card.featured {
          border-color:
            rgba(
              215,
              224,
              168,
              0.35
            );

          background:
            rgba(
              215,
              224,
              168,
              0.045
            );
        }

        .tots-price-head {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            12px;
        }

        .tots-price-name {
          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            11px;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .tots-price-badge {
          padding:
            5px 9px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.25
            );

          border-radius:
            999px;

          color:
            var(--accent);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          text-transform:
            uppercase;
        }

        .tots-price-figure {
          margin-top:
            40px;

          display:
            flex;

          align-items:
            flex-end;
        }

        .tots-price-amount {
          font-family:
            'Space Grotesk',
            sans-serif;

          font-size:
            58px;

          font-weight:
            600;

          letter-spacing:
            -0.05em;
        }

        .tots-price-period {
          margin:
            0 0 9px
            7px;

          color:
            var(--ink-faint);

          font-size:
            11px;
        }

        .tots-price-desc {
          min-height:
            82px;

          margin-top:
            20px;

          color:
            var(--ink-dim);

          font-size:
            13px;

          line-height:
            1.7;
        }

        .tots-price-features {
          margin-top:
            26px;

          padding-top:
            24px;

          border-top:
            1px solid
            var(--line);

          display:
            grid;

          gap:
            12px;
        }

        .tots-price-feature {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          color:
            rgba(
              243,
              244,
              238,
              0.6
            );

          font-size:
            12px;

          line-height:
            1.5;
        }

        .tots-price-button {
          margin-top:
            auto;

          padding-top:
            30px;
        }

        .tots-price-button a {
          width:
            100%;
        }

        .tots-price-trial-copy {
          margin-top:
            10px;

          color:
            var(--ink-faint);

          text-align:
            center;

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            7px;

          letter-spacing:
            0.07em;

          text-transform:
            uppercase;
        }

        /* =====================================================
           ABOUT
        ===================================================== */

        .tots-about {
          display:
            grid;

          gap:
            40px;

          align-items:
            center;
        }

        @media (
          min-width:
          950px
        ) {

          .tots-about {
            grid-template-columns:
              1fr 1fr;
          }

        }

        .tots-about-card {
          padding:
            34px;

          border:
            1px solid
            var(--line);

          border-radius:
            28px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );
        }

        .tots-about-card p {
          color:
            var(--ink-dim);

          font-size:
            14px;

          line-height:
            1.85;
        }

        .tots-about-card p + p {
          margin-top:
            18px;
        }

        /* =====================================================
           FAQ
        ===================================================== */

        .tots-faq-layout {
          display:
            grid;

          gap:
            60px;
        }

        @media (
          min-width:
          950px
        ) {

          .tots-faq-layout {
            grid-template-columns:
              0.7fr 1fr;
          }

        }

        .tots-faq-item {
          border-bottom:
            1px solid
            var(--line);
        }

        .tots-faq-btn {
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
            none;

          background:
            transparent;

          color:
            rgba(
              243,
              244,
              238,
              0.8
            );

          text-align:
            left;

          cursor:
            pointer;

          font-size:
            14px;
        }

        .tots-faq-answer {
          max-width:
            650px;

          padding-bottom:
            24px;

          color:
            var(--ink-dim);

          font-size:
            13px;

          line-height:
            1.75;
        }

        /* =====================================================
           FINAL CTA
        ===================================================== */

        .tots-final-card {
          position:
            relative;

          overflow:
            hidden;

          padding:
            55px 25px;

          border:
            1px solid
            rgba(
              215,
              224,
              168,
              0.2
            );

          border-radius:
            32px;

          background:
            linear-gradient(
              135deg,
              rgba(
                215,
                224,
                168,
                0.07
              ),
              rgba(
                255,
                255,
                255,
                0.015
              )
            );

          text-align:
            center;
        }

        @media (
          min-width:
          900px
        ) {

          .tots-final-card {
            padding:
              80px 40px;
          }

        }

        .tots-final-icon {
          width:
            55px;

          height:
            55px;

          margin:
            0 auto;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            var(--line);

          border-radius:
            17px;

          color:
            var(--accent);

          background:
            rgba(
              255,
              255,
              255,
              0.02
            );
        }

        .tots-final-card h2 {
          max-width:
            820px;

          margin:
            28px auto 0;

          font-size:
            clamp(
              2.5rem,
              5vw,
              5rem
            );

          line-height:
            0.98;

          font-weight:
            500;
        }

        .tots-final-card p {
          max-width:
            580px;

          margin:
            22px auto 0;

          color:
            var(--ink-dim);

          font-size:
            14px;

          line-height:
            1.75;
        }

        .tots-final-actions {
          margin-top:
            32px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;
        }

        @media (
          min-width:
          600px
        ) {

          .tots-final-actions {
            flex-direction:
              row;
          }

        }

        .tots-final-trial {
          margin-top:
            18px;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.09em;

          text-transform:
            uppercase;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .tots-footer {
          position:
            relative;

          z-index:
            5;

          padding:
            50px 20px
            24px;

          border-top:
            1px solid
            var(--line);
        }

        .tots-footer-grid {
          display:
            grid;

          gap:
            40px;

          padding-bottom:
            45px;
        }

        @media (
          min-width:
          760px
        ) {

          .tots-footer-grid {
            grid-template-columns:
              1.5fr
              repeat(
                3,
                1fr
              );
          }

        }

        .tots-footer-copy {
          max-width:
            330px;

          margin-top:
            18px;

          color:
            var(--ink-faint);

          font-size:
            11px;

          line-height:
            1.7;
        }

        .tots-footer h5 {
          margin:
            0;

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;
        }

        .tots-footer-links {
          margin-top:
            16px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            10px;
        }

        .tots-footer-links a {
          color:
            var(--ink-dim);

          font-size:
            12px;

          text-decoration:
            none;
        }

        .tots-footer-links a:hover {
          color:
            var(--ink);
        }

        .tots-footer-bottom {
          padding-top:
            20px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            10px;

          border-top:
            1px solid
            var(--line);

          color:
            var(--ink-faint);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:
            8px;

          letter-spacing:
            0.08em;
        }

        @media (
          min-width:
          650px
        ) {

          .tots-footer-bottom {
            flex-direction:
              row;

            align-items:
              center;

            justify-content:
              space-between;
          }

        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
          max-width:
          649px
        ) {

          .tots-nav-shell {
            padding:
              10px
              10px
              0;
          }

          .tots-nav {
            height:
              58px;

            padding:
              0 8px
              0 12px;

            border-radius:
              15px;
          }

          .tots-logo-sub {
            display:
              none;
          }

          .tots-hero {
            padding:
              118px
              16px
              45px;
          }

          .tots-hero h1 {
            font-size:
              clamp(
                2.7rem,
                13vw,
                4.2rem
              );
          }

          .tots-hero-lede {
            margin-top:
              22px;

            font-size:
              14px;

            line-height:
              1.65;
          }

          .tots-hero-ctas {
            width:
              100%;

            margin-top:
              28px;
          }

          .tots-hero-ctas a {
            width:
              100%;
          }

          .tots-trial-note {
            gap:
              8px 12px;

            font-size:
              7.5px;
          }

          .tots-trusted {
            padding:
              14px 16px
              45px;
          }

          .tots-trusted-inner {
            padding:
              20px 14px;
          }

          .tots-trusted-name {
            padding:
              8px 10px;

            font-size:
              9px;
          }

          .tots-pain {
            padding:
              55px 16px;
          }

          .tots-pain-card {
            padding:
              32px 18px;
          }

          .tots-section {
            padding:
              75px 16px;
          }

          .tots-section-heading {
            font-size:
              clamp(
                2.2rem,
                11vw,
                3.6rem
              );
          }

          .tots-demo-section {
            padding:
              65px 16px
              85px;
          }

          .tots-window-wrap {
            margin-top:
              42px;
          }

          .tots-window-body {
            min-height:
              470px;
          }

          .tots-window-main {
            padding:
              14px;
          }

          .tots-demo-serif {
            font-size:
              20px;
          }

          .tots-demo-conversion {
            padding:
              22px 18px;
          }

          .tots-demo-conversion
          .tots-btn-solid {
            width:
              100%;
          }

          .tots-clarity-section {
            padding:
              75px 16px;
          }

          .tots-clarity-shell {
            padding:
              26px 18px;

            border-radius:
              24px;
          }

          .tots-price-card {
            min-height:
              auto;
          }

          .tots-final-actions a {
            width:
              100%;
          }

        }
      `}</style>

      <div className="tots-bg-grid" />

      {/* ======================================================
          NAV
      ====================================================== */}

      <div className="tots-nav-shell">
        <div className="tots-nav">
          <a
            href="/"
            className="tots-brand"
            aria-label="TOTS-OS home"
          >
            <Logo size={38} />
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
              href={
                SIGNUP_URL
              }
              className="tots-btn-ghost"
            >
              <LogIn size={13} />
              Log in
            </a>

            <a
              href={
                SIGNUP_URL
              }
              className="tots-btn-solid"
            >
              Create free
              workspace

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
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

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
                y: -20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              className="tots-mobile-panel"
            >
              <div className="tots-mobile-head">
                <Logo
                  size={34}
                />

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

              <div className="tots-mobile-links">
                {NAV_ITEMS.map(
                  (
                    item
                  ) => (
                    <a
                      href={
                        item.href
                      }
                      key={
                        item.href
                      }
                      className="tots-mobile-link"
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
                          13
                        }
                      />
                    </a>
                  )
                )}
              </div>

              <div className="tots-mobile-actions">
                <a
                  href={
                    SIGNUP_URL
                  }
                  className="tots-btn-solid"
                >
                  Create my free
                  workspace
                </a>

                <a
                  href={
                    SIGNUP_URL
                  }
                  className="tots-btn-ghost"
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
          <div className="tots-hero-kicker">
            <Sparkles
              size={12}
            />

            Built for small
            businesses
          </div>

          <h1>
            Your whole business.
            <span className="tots-hero-line2">
              Finally in one place.
            </span>
          </h1>

          <p className="tots-hero-lede">
            Stop running your
            business from
            spreadsheets,
            WhatsApp, notes,
            calendars and endless
            tabs. TOTS-OS brings
            your{" "}
            <strong>
              clients, projects,
              tasks, finances,
              content, calendar
              and AI assistant
            </strong>{" "}
            into one connected
            workspace.
          </p>

          <div className="tots-hero-ctas">
            <a
              href={
                SIGNUP_URL
              }
              className="tots-btn-solid tots-btn-large"
            >
              Create my free
              workspace

              <ArrowRight
                size={15}
              />
            </a>

            <a
              href="#demo"
              className="tots-btn-ghost tots-btn-large"
            >
              <Play size={13} />
              See it in action
            </a>
          </div>

          <div className="tots-trial-note">
            <span>
              <Check
                size={11}
                color="var(--accent)"
              />
              14 days free
            </span>

            <span>
              <Check
                size={11}
                color="var(--accent)"
              />
              No commitment
            </span>

            <span>
              <Check
                size={11}
                color="var(--accent)"
              />
              Set up in minutes
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================
          TRUST
      ====================================================== */}

      <section className="tots-trusted">
        <Reveal>
          <div className="tots-trusted-inner">
            <p className="tots-trusted-label">
              Trusted by businesses
              including
            </p>

            <div className="tots-trusted-grid">
              {TRUSTED_BY.map(
                (
                  name
                ) => (
                  <span
                    key={
                      name
                    }
                    className="tots-trusted-name"
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

      <section className="tots-pain">
        <Reveal>
          <div className="tots-pain-card">
            <Eyebrow>
              Sound familiar?
            </Eyebrow>

            <h2>
              Your business grew.
              <br />
              Your systems
              didn&apos;t.
            </h2>

            <p>
              Client details in
              WhatsApp. Tasks in
              your head. Invoices
              somewhere else.
              Content sitting in
              Canva. Notes on your
              phone. Five tabs open
              just to work out what
              you&apos;re meant to
              do today.
            </p>

            <div className="tots-pain-chips">
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
                    className="tots-pain-chip"
                  >
                    {
                      item
                    }
                  </span>
                )
              )}
            </div>

            <div className="tots-pain-bottom">
              TOTS-OS gives it
              all one home.
            </div>
          </div>
        </Reveal>
      </section>

      {/* ======================================================
          TRANSFORMATION
      ====================================================== */}

      <section
        id="product"
        className="tots-section"
      >
        <div className="tots-wrap">
          <Reveal>
            <Eyebrow>
              One business.
              One system.
            </Eyebrow>

            <h2 className="tots-section-heading">
              Stop stitching your
              business together{" "}
              <span className="tots-serif tots-accent">
                every single day.
              </span>
            </h2>

            <p className="tots-section-copy">
              Instead of remembering
              where everything lives,
              open one workspace and
              see what is happening
              across the business.
            </p>
          </Reveal>

          <div className="tots-transform-grid">
            <Reveal>
              <div className="tots-transform-card">
                <p className="tots-transform-label">
                  Without TOTS-OS
                </p>

                <h3>
                  Everything has
                  its own hiding
                  place.
                </h3>

                <div className="tots-transform-list">
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
                        className="tots-transform-row"
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
              <div className="tots-transform-card good">
                <p className="tots-transform-label">
                  With TOTS-OS
                </p>

                <h3>
                  One connected
                  view of your
                  business.
                </h3>

                <div className="tots-transform-list">
                  {[
                    "Clients connected to their work",
                    "Projects connected to tasks",
                    "Invoices and finances visible",
                    "Calendar and deadlines together",
                    "Content alongside the rest",
                    "Clarity AI helping you prioritise",
                  ].map(
                    (
                      item
                    ) => (
                      <div
                        className="tots-transform-row"
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

          <div className="tots-why-grid">
            {[
              {
                icon:
                  Layers3,
                title:
                  "One workspace",
                text:
                  "Clients, projects, money, notes and context stay together instead of living across separate systems.",
              },
              {
                icon:
                  Gauge,
                title:
                  "Know what matters",
                text:
                  "See what is overdue, what is coming up and what deserves your attention without searching for it.",
              },
              {
                icon:
                  Zap,
                title:
                  "Less admin",
                text:
                  "Spend less time updating systems and hunting for information, and more time actually running the business.",
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
                    <div className="tots-why-card">
                      <div className="tots-why-icon">
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

      <section className="tots-demo-section">
        <div className="tots-wrap">
          <Reveal>
            <div className="tots-demo-section-head">
              <Eyebrow>
                Don&apos;t take
                our word for it
              </Eyebrow>

              <h2 className="tots-section-heading">
                Have a look
                around.
              </h2>

              <p className="tots-section-copy">
                Click through the
                workspace and see
                what running the
                business from one
                place can actually
                look like.
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
        className="tots-section tots-section-bordered"
      >
        <div className="tots-wrap">
          <Reveal>
            <div className="tots-wrap-narrow">
              <Eyebrow>
                What you get
              </Eyebrow>

              <h2 className="tots-section-heading">
                Everything has a
                place.
              </h2>

              <p className="tots-section-copy">
                The everyday tools
                a small business
                needs, working as
                one system rather
                than another stack
                of subscriptions.
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
                      0.05
                    }
                  >
                    <div className="tots-feat-card">
                      <div className="tots-feat-icon">
                        <Icon
                          size={
                            19
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

      <section className="tots-section">
        <div className="tots-wrap tots-connected-grid">
          <Reveal>
            <Eyebrow>
              Connected by
              design
            </Eyebrow>

            <h2 className="tots-section-heading">
              Your business
              isn&apos;t six
              separate apps.
            </h2>

            <p className="tots-section-copy">
              A contact becomes a
              client. A client gets
              a project. Projects
              create work. Work
              creates revenue.
              TOTS-OS is designed
              around those
              relationships.
            </p>
          </Reveal>

          <Reveal
            delay={
              0.1
            }
          >
            <div className="tots-connection-board">
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
                      className="tots-connection-item"
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
        className="tots-clarity-section"
      >
        <div className="tots-wrap">
          <div className="tots-clarity-shell">
            <div className="tots-clarity-glow" />

            <div className="tots-clarity-grid">
              <Reveal>
                <Eyebrow>
                  More than storage
                </Eyebrow>

                <h2 className="tots-clarity-title">
                  TOTS-OS
                  doesn&apos;t just
                  store your
                  business.
                  <span>
                    It understands
                    it.
                  </span>
                </h2>

                <p className="tots-clarity-copy">
                  Meet Clarity,
                  your built-in AI
                  PA. It uses the
                  context already
                  inside your
                  workspace to help
                  show you what
                  deserves your
                  attention.
                </p>

                <div className="tots-clarity-points">
                  {[
                    "Ask what to prioritise today.",
                    "Surface overdue tasks and looming deadlines.",
                    "See what is happening across every client.",
                    "Catch outstanding invoices before they disappear from view.",
                    "Turn business information into a clearer next move.",
                  ].map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item
                        }
                        className="tots-clarity-point"
                      >
                        <span className="tots-clarity-check">
                          <Check
                            size={
                              12
                            }
                          />
                        </span>

                        <span>
                          {
                            item
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Reveal>

              <Reveal
                delay={
                  0.12
                }
              >
                <div className="tots-clarity-demo">
                  <div className="tots-clarity-demo-head">
                    <div className="tots-clarity-brand">
                      <Sparkles
                        size={
                          14
                        }
                      />

                      Clarity
                    </div>

                    <div className="tots-clarity-online">
                      <span className="tots-status-dot" />
                      ready
                    </div>
                  </div>

                  <div className="tots-clarity-message">
                    What should I
                    focus on today?
                  </div>

                  <div className="tots-clarity-response">
                    <div className="tots-clarity-response-label">
                      Clarity
                    </div>

                    <p>
                      Three things
                      I&apos;d
                      prioritise:
                      the website
                      project has
                      the nearest
                      deadline, and
                      one invoice
                      is already
                      overdue.
                    </p>

                    <div className="tots-priority-list">
                      <div className="tots-priority">
                        <span className="tots-priority-number">
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

                      <div className="tots-priority">
                        <span className="tots-priority-number">
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
                            currently
                            overdue
                          </small>
                        </div>
                      </div>

                      <div className="tots-priority">
                        <span className="tots-priority-number">
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
                            for review
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="tots-clarity-message">
                    Which client
                    needs the most
                    attention?
                  </div>

                  <div className="tots-clarity-response">
                    <div className="tots-clarity-response-label">
                      Clarity
                    </div>

                    <p>
                      Halstead
                      &amp; Co has
                      an overdue
                      payment and
                      two open
                      project
                      tasks. Start
                      there.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          SECURITY
      ====================================================== */}

      <section className="tots-section tots-section-bordered">
        <div className="tots-wrap">
          <Reveal>
            <Eyebrow>
              Built for real
              businesses
            </Eyebrow>

            <h2 className="tots-section-heading">
              Simple on the
              surface. Solid
              underneath.
            </h2>
          </Reveal>

          <div className="tots-security-grid">
            <Reveal>
              <div className="tots-security-card">
                <LockKeyhole
                  size={21}
                />

                <h3>
                  Secure account
                  access
                </h3>

                <p>
                  Your workspace
                  lives behind
                  authenticated
                  accounts — not
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
              <div className="tots-security-card">
                <ShieldCheck
                  size={21}
                />

                <h3>
                  Organised
                  permissions
                </h3>

                <p>
                  Data is
                  structured around
                  accounts and
                  organisations,
                  helping keep
                  information in
                  the correct
                  workspace.
                </p>
              </div>
            </Reveal>

            <Reveal
              delay={
                0.1
              }
            >
              <div className="tots-security-card">
                <RefreshCw
                  size={21}
                />

                <h3>
                  Built to keep
                  improving
                </h3>

                <p>
                  TOTS-OS is
                  developed around
                  real small
                  business
                  workflows rather
                  than forcing every
                  company into the
                  same generic
                  template.
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
        <div className="tots-wrap">
          <Reveal>
            <Eyebrow>
              Try it first
            </Eyebrow>

            <h2 className="tots-section-heading">
              Don&apos;t decide
              from this page.
              <br />
              <span className="tots-serif tots-accent">
                Try TOTS-OS
                yourself.
              </span>
            </h2>

            <p className="tots-section-copy">
              Create your account,
              bring your business
              into TOTS-OS and use
              it free for 14 days.
              Then decide whether
              it deserves a
              permanent place in
              your business.
            </p>

            <div className="tots-pricing-trial">
              <Check
                size={12}
              />

              14 days free · no
              commitment
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
                    0.06
                  }
                >
                  <div
                    className={`tots-price-card ${
                      plan.featured
                        ? "featured"
                        : ""
                    }`}
                  >
                    <div className="tots-price-head">
                      <div className="tots-price-name">
                        {
                          plan.name
                        }
                      </div>

                      {plan.badge && (
                        <span className="tots-price-badge">
                          {
                            plan.badge
                          }
                        </span>
                      )}
                    </div>

                    <div className="tots-price-figure">
                      <span className="tots-price-amount">
                        £
                        {
                          plan.price
                        }
                      </span>

                      <span className="tots-price-period">
                        /
                        month
                      </span>
                    </div>

                    <p className="tots-price-desc">
                      {
                        plan.description
                      }
                    </p>

                    <div className="tots-price-features">
                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <div
                            className="tots-price-feature"
                            key={
                              feature
                            }
                          >
                            <Check
                              size={
                                13
                              }
                              color="var(--accent)"
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

                    <div className="tots-price-button">
                      <a
                        href={
                          SIGNUP_URL
                        }
                        className={
                          plan.featured
                            ? "tots-btn-solid"
                            : "tots-btn-ghost"
                        }
                      >
                        Create free
                        workspace

                        <ArrowRight
                          size={
                            13
                          }
                        />
                      </a>

                      <p className="tots-price-trial-copy">
                        Try it free
                        for 14 days
                        first
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
        className="tots-section tots-section-bordered"
      >
        <div className="tots-wrap tots-about">
          <Reveal>
            <Eyebrow>
              Why we built it
            </Eyebrow>

            <h2 className="tots-section-heading">
              Built by business
              owners who were
              tired of the chaos
              too.
            </h2>

            <p className="tots-section-copy">
              Running a business
              shouldn&apos;t mean
              stitching together a
              CRM, planner, finance
              app, social tool and
              notes system just to
              understand
              what&apos;s going on.
            </p>
          </Reveal>

          <Reveal
            delay={
              0.1
            }
          >
            <div className="tots-about-card">
              <p>
                We&apos;re Sam
                and Leigha, the
                team behind The
                Organised Types.
              </p>

              <p>
                We kept seeing the
                same problem:
                businesses had
                plenty of software,
                but their actual
                business was still
                scattered
                everywhere.
              </p>

              <p>
                So we built the
                system we wanted
                to exist — one
                home for clients,
                work, money, ideas
                and everything in
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
        <div className="tots-wrap tots-faq-layout">
          <Reveal>
            <Eyebrow>
              Questions
            </Eyebrow>

            <h2 className="tots-section-heading">
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
                    className="tots-faq-item"
                    key={
                      faq.q
                    }
                  >
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
                          className="tots-faq-answer"
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
        <div className="tots-wrap">
          <Reveal>
            <div className="tots-final-card">
              <div className="tots-final-icon">
                <Sparkles
                  size={22}
                />
              </div>

              <h2>
                Your business is
                already complicated
                enough.
                <br />

                <span className="tots-serif tots-accent">
                  Running it
                  shouldn&apos;t
                  be.
                </span>
              </h2>

              <p>
                Create your account
                today and start
                putting your
                clients, projects,
                tasks, finances,
                content and ideas
                back in one place.
              </p>

              <div className="tots-final-actions">
                <a
                  href={
                    SIGNUP_URL
                  }
                  className="tots-btn-solid tots-btn-large"
                >
                  Create my free
                  workspace

                  <ArrowRight
                    size={
                      15
                    }
                  />
                </a>

                <a
                  href="#demo"
                  className="tots-btn-ghost tots-btn-large"
                >
                  <Play
                    size={
                      13
                    }
                  />

                  Explore demo
                </a>
              </div>

              <div className="tots-final-trial">
                14 days free · no
                commitment · set up
                today
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="tots-footer">
        <div className="tots-wrap">
          <div className="tots-footer-grid">
            <div>
              <Logo
                size={38}
              />

              <p className="tots-footer-copy">
                One connected
                business operating
                system for the
                people building
                small businesses.
              </p>
            </div>

            <div>
              <h5>
                Product
              </h5>

              <div className="tots-footer-links">
                <a href="#features">
                  Modules
                </a>

                <a href="#demo">
                  Demo
                </a>

                <a href="#clarity">
                  Clarity AI
                </a>

                <a href="#pricing">
                  Pricing
                </a>
              </div>
            </div>

            <div>
              <h5>
                Account
              </h5>

              <div className="tots-footer-links">
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

            <div>
              <h5>
                Legal
              </h5>

              <div className="tots-footer-links">
                <a href="/docs/privacypolicy">
                  Privacy Policy
                </a>

                <a href="/docs/termsconditions">
                  Terms of Service
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

          <div className="tots-footer-bottom">
            <span>
              © 2026 TOTS-OS
            </span>

            <span>
              The Organised Types ·
              Business Operating
              System
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}