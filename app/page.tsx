"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ContactRound,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Play,
  ShoppingBag,
  Sparkles,
  Target,
  X,
} from "lucide-react";

const APP_URL = "/login";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const nav = [
  ["Why TOTS-OS", "#why"],
  ["Product", "#product"],
  ["Clarity", "#clarity"],
  ["Pricing", "#pricing"],
  ["About", "#about"],
];

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    eyebrow: "Your whole business",
    title: "Know what needs your attention before the day gets away from you.",
    copy: "Revenue, tasks, projects, deadlines and priorities come together in one calm dashboard — so you can stop piecing the day together from five different places.",
  },
  {
    id: "clients",
    label: "Clients",
    icon: ContactRound,
    eyebrow: "Clients & CRM",
    title: "Every conversation, project and detail — connected to the right client.",
    copy: "Keep contacts, notes, activity, projects and history together so you always know what has happened, what is happening and what needs to happen next.",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
    eyebrow: "Projects & tasks",
    title: "Turn work into a clear plan instead of another list you have to remember.",
    copy: "Plan delivery, assign work, track deadlines and see what is at risk without building another spreadsheet or chasing updates across messages.",
  },
  {
    id: "money",
    label: "Money",
    icon: CircleDollarSign,
    eyebrow: "Finance",
    title: "See the money side of the business without losing the operational context.",
    copy: "Create quotes and invoices, record expenses and see what is paid, due and overdue alongside the clients and projects the money belongs to.",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: MessageSquareText,
    eyebrow: "Social & campaigns",
    title: "Plan marketing where the rest of your business already lives.",
    copy: "Organise content, campaigns and publishing without separating marketing from launches, client work, deadlines and everything else happening this week.",
  },
  {
    id: "planning",
    label: "Planning",
    icon: CalendarDays,
    eyebrow: "Calendar & notes",
    title: "Give plans, ideas and deadlines somewhere useful to live.",
    copy: "Keep events, bookings, notes, brain dumps and upcoming work visible — then turn them into action instead of letting them disappear into another app.",
  },
];

const customerStories = [
  {
    name: "Moray Training Club",
    type: "Fitness & community",
    text: "A growing local business with marketing, operations, projects and day-to-day admin all moving at once.",
    tags: ["Operations", "Marketing", "Projects"],
  },
  {
    name: "Megoosh",
    type: "Food & wellbeing",
    text: "A content-led business where planning, client information, digital work and delivery need to stay connected.",
    tags: ["Content", "Planning", "Clients"],
  },
  {
    name: "Lux Electrical Engineering",
    type: "Electrical services",
    text: "A service business using a clearer system for projects, client work and the operational details behind delivery.",
    tags: ["Projects", "Clients", "Admin"],
  },
];

const clarityPrompts = [
  "What should I focus on today?",
  "Who owes me money?",
  "Which projects are at risk?",
  "What is coming up this week?",
  "Which clients need a follow-up?",
];

const faqs = [
  {
    q: "What exactly is TOTS-OS?",
    a: "TOTS-OS is a connected workspace for running the everyday parts of a business — including clients, projects, tasks, finances, planning, notes, social content and business visibility.",
  },
  {
    q: "Who is it for?",
    a: "It is built for small businesses and growing teams that are tired of running the business across disconnected apps, spreadsheets, notes and mental to-do lists.",
  },
  {
    q: "Do I have to move everything over on day one?",
    a: "No. Start with the parts creating the most friction and build from there. The 60-second business check can help you work out where TOTS-OS is likely to make the biggest difference first.",
  },
  {
    q: "What is Clarity?",
    a: "Clarity is the AI assistant inside TOTS-OS. It works with information already in your workspace to surface priorities, overdue work, deadlines and useful next actions.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The trial is 14 days and does not require bank details. You can also explore the product experience from this page before creating an account.",
  },
];

const pricingRows = [
  ["Business dashboard", "Included", "Included", "Included"],
  ["CRM & contacts", "Included", "Included", "Included"],
  ["Projects & tasks", "Included", "Included", "Included"],
  ["Calendar, notes & planning", "Included", "Included", "Included"],
  ["Finance", "Core tools", "Advanced", "Advanced"],
  ["Social planning & publishing", "—", "Included", "Included"],
  ["Campaign tools", "—", "Included", "Included"],
  ["Team workflows", "Core", "Expanded", "Advanced"],
  ["Business insights & KPIs", "Core", "Expanded", "Advanced"],
  ["Clarity AI", "Included", "Expanded", "Highest access"],
  ["Automation", "Core", "Expanded", "Advanced"],
  ["Support", "Standard", "Standard", "Priority"],
];

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={classNames("mx-auto w-full max-w-[1240px] px-5 sm:px-7 lg:px-10", className)}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-[#a9b897]" />
      {children}
    </div>
  );
}

function PrimaryButton({ href = APP_URL, children }: { href?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4f4a46] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3f3a37] hover:shadow-lg"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function MiniDashboard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#f8f6f3] p-3 shadow-[0_30px_80px_rgba(54,48,44,0.18)] sm:p-4">
      <div className="overflow-hidden rounded-[22px] border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4f4a46] text-xs font-bold text-white">T</div>
            <div>
              <p className="text-xs font-semibold text-stone-900">TOTS-OS</p>
              <p className="text-[10px] text-stone-400">North & Pine Studio</p>
            </div>
          </div>
          <div className="rounded-full bg-[#eef2ea] px-3 py-1.5 text-[10px] font-semibold text-[#596451]">Business health 82%</div>
        </div>

        <div className="grid min-h-[430px] grid-cols-1 lg:grid-cols-[142px_1fr]">
          <aside className="hidden border-r border-stone-100 bg-[#fbfaf8] p-3 lg:block">
            {["Home", "Clients", "Projects", "Finance", "Social", "Calendar", "Notes"].map((item, i) => (
              <div key={item} className={classNames("mb-1 rounded-lg px-3 py-2 text-[11px] font-medium", i === 0 ? "bg-[#efe6e1] text-stone-900" : "text-stone-500")}>{item}</div>
            ))}
          </aside>

          <div className="p-4 sm:p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Saturday, 5 September</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-stone-900">Good afternoon.</h3>
                <p className="mt-1 text-xs text-stone-500">Here&apos;s what needs your attention today.</p>
              </div>
              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#dfe6d9] bg-[#f4f7f1] px-3 py-1.5 text-[10px] font-medium text-[#596451]">
                <Sparkles className="h-3 w-3" /> Clarity found 3 priorities
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["Revenue", "£12,480"],
                ["Open tasks", "14"],
                ["Projects", "3"],
                ["Invoices due", "2"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-stone-100 bg-[#fbfaf8] p-3.5">
                  <p className="text-[10px] text-stone-400">{label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-stone-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1.08fr_.92fr]">
              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Focus</p>
                    <p className="text-sm font-semibold text-stone-800">Today&apos;s priorities</p>
                  </div>
                  <Target className="h-4 w-4 text-stone-400" />
                </div>
                {[
                  "Send James Property invoice",
                  "Review website refresh delivery",
                  "Prepare for 2:00 PM client call",
                ].map((task, i) => (
                  <div key={task} className="flex items-center gap-3 border-t border-stone-100 py-2.5 first:border-t-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#efe6e1] text-[10px] font-semibold text-stone-600">{i + 1}</div>
                    <p className="text-[11px] font-medium text-stone-700">{task}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-stone-100 bg-[#4f4a46] p-4 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10"><Sparkles className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Clarity</p>
                    <p className="text-sm font-semibold">Your business brief</p>
                  </div>
                </div>
                <p className="mt-4 text-[11px] leading-5 text-white/70">Cash flow looks healthy, but two invoices are due and one client project has delivery tasks tomorrow.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold">Open brief <ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPanel({ active }: { active: (typeof tabs)[number] }) {
  const Icon = active.icon;
  return (
    <motion.div
      key={active.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-8 rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(70,62,56,0.08)] md:grid-cols-[.85fr_1.15fr] md:p-8 lg:p-10"
    >
      <div className="flex flex-col justify-center">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe6e1] text-[#4f4a46]"><Icon className="h-5 w-5" /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8474]">{active.eyebrow}</p>
        <h3 className="mt-3 max-w-md text-2xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-3xl">{active.title}</h3>
        <p className="mt-4 max-w-md text-sm leading-7 text-stone-600">{active.copy}</p>
        <Link href="#demo" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900">Explore the workspace <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="rounded-[24px] border border-stone-200 bg-[#f8f6f3] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">{active.label}</p>
            <p className="mt-1 text-sm font-semibold text-stone-800">Live workspace preview</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-[#a9b897]" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {active.id === "money" ? (
            <>
              <StatCard label="Paid this month" value="£12,480" />
              <StatCard label="Outstanding" value="£3,240" />
              <WideRow title="INV-1048 · James Property" meta="£1,250 · Due today" badge="Due" />
              <WideRow title="INV-1046 · Bennett Interiors" meta="£1,990 · 4 days overdue" badge="Overdue" />
            </>
          ) : active.id === "clients" ? (
            <>
              <StatCard label="Active clients" value="24" />
              <StatCard label="Follow-ups" value="5" />
              <WideRow title="Maya Collins" meta="Brand project · Last contact yesterday" badge="Active" />
              <WideRow title="James Property Group" meta="Website support · Invoice due" badge="Follow up" />
            </>
          ) : active.id === "projects" ? (
            <>
              <StatCard label="Active projects" value="6" />
              <StatCard label="Due this week" value="4" />
              <WideRow title="Website Refresh" meta="8/12 tasks complete · Due Friday" badge="At risk" />
              <WideRow title="Autumn Campaign" meta="5/6 tasks complete · Due Tuesday" badge="On track" />
            </>
          ) : active.id === "marketing" ? (
            <>
              <StatCard label="Posts planned" value="18" />
              <StatCard label="Campaigns" value="3" />
              <WideRow title="September launch reel" meta="Instagram · Today 18:30" badge="Scheduled" />
              <WideRow title="Client story carousel" meta="Instagram + LinkedIn · Tuesday" badge="Draft" />
            </>
          ) : active.id === "planning" ? (
            <>
              <StatCard label="Events this week" value="12" />
              <StatCard label="Notes to action" value="7" />
              <WideRow title="10:00 · Amelia Hart" meta="Discovery call · Client notes attached" badge="Today" />
              <WideRow title="14:00 · Design review" meta="Maya Collins · Project linked" badge="Today" />
            </>
          ) : (
            <>
              <StatCard label="Business health" value="82%" />
              <StatCard label="Open tasks" value="14" />
              <WideRow title="Send outstanding invoice" meta="James Property · £1,250" badge="Priority" />
              <WideRow title="Review project delivery" meta="Website Refresh · 2 tasks due" badge="Today" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-[10px] text-stone-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-stone-900">{value}</p>
    </div>
  );
}

function WideRow({ title, meta, badge }: { title: string; meta: string; badge: string }) {
  return (
    <div className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-stone-800">{title}</p>
        <p className="mt-1 truncate text-[10px] text-stone-400">{meta}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#f2eee9] px-2.5 py-1 text-[9px] font-semibold text-stone-600">{badge}</span>
    </div>
  );
}

export default function Page() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaq, setOpenFaq] = useState(0);
  const active = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf8f5] text-stone-900 selection:bg-[#dfe7d8]">
      {META_PIXEL_ID ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        </>
      ) : null}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/70 bg-[#faf8f5]/90 backdrop-blur-xl">
        <Shell className="flex h-[72px] items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f4a46] text-sm font-bold text-white">T</div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-[-0.03em]">TOTS-OS</div>
              <div className="text-[9px] uppercase tracking-[0.17em] text-stone-400">by The Organised Types</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="text-xs font-medium text-stone-600 transition hover:text-stone-950">{label}</Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="px-4 py-2 text-xs font-semibold text-stone-700">Log in</Link>
            <Link href={APP_URL} className="rounded-full bg-[#4f4a46] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3f3a37]">Start free trial</Link>
          </div>

          <button onClick={() => setMenuOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white lg:hidden" aria-label="Toggle navigation">
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </Shell>

        {menuOpen ? (
          <div className="border-t border-stone-200 bg-[#faf8f5] lg:hidden">
            <Shell className="py-5">
              <div className="grid gap-1">
                {nav.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-white">{label}</Link>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                <Link href="/login" className="rounded-full border border-stone-300 bg-white px-4 py-3 text-center text-xs font-semibold">Log in</Link>
                <Link href={APP_URL} className="rounded-full bg-[#4f4a46] px-4 py-3 text-center text-xs font-semibold text-white">Start free</Link>
              </div>
            </Shell>
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#e8eee3] opacity-60 blur-3xl" />
        <Shell className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <SectionLabel>Your business. Finally organised.</SectionLabel>
              <h1 className="text-balance text-[48px] font-semibold leading-[0.98] tracking-[-0.065em] text-[#332f2c] sm:text-[66px] lg:text-[82px]">
                Your business is already complicated.
                <span className="block text-[#7d8976]">Your software shouldn&apos;t be.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
                Clients. Projects. Money. Content. Calendar. Tasks. TOTS-OS brings the everyday running of your business into one connected workspace — so you can stop managing the systems and get back to running the business.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <PrimaryButton>Start 14 days free</PrimaryButton>
                <SecondaryButton href="#demo"><Play className="h-4 w-4" /> Explore the demo</SecondaryButton>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-stone-500">
                {["No bank details", "No commitment", "Set up in your own time"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#7d8976]" />{item}</span>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mx-auto mt-14 max-w-5xl">
            <MiniDashboard />
          </motion.div>
        </Shell>
      </section>

      <section className="border-y border-stone-200 bg-white py-5">
        <Shell>
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Built with real businesses in mind</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-stone-500 lg:justify-end">
              {["WhyKnot Wardrobe", "Moray Training Club", "Megoosh", "Lux Electrical", "TESTme Health", "DP Leadership"].map((name) => <span key={name}>{name}</span>)}
            </div>
          </div>
        </Shell>
      </section>

      <section id="why" className="py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>The actual problem</SectionLabel>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl lg:text-6xl">You&apos;re not disorganised.<br />Your business is scattered.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-600">Most small businesses do not need another app. They need the important parts of the business to stop living in completely separate places.</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Instead of this</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {["CRM", "Spreadsheet", "Notes app", "Calendar", "Project tool", "Finance tracker", "Content planner", "WhatsApp", "Your brain"].map((item) => (
                  <span key={item} className="rounded-full border border-stone-200 bg-[#faf8f5] px-3.5 py-2 text-xs font-medium text-stone-600">{item}</span>
                ))}
              </div>
              <p className="mt-7 text-sm leading-6 text-stone-500">Nine places to check. Nine places to update. Nine chances for something important to get missed.</p>
            </div>

            <div className="flex items-center justify-center py-1 md:px-1 md:py-0"><ArrowRight className="h-5 w-5 rotate-90 text-stone-300 md:rotate-0" /></div>

            <div className="rounded-[28px] bg-[#4f4a46] p-6 text-white shadow-xl sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Use this</p>
              <div className="mt-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#4f4a46]">T</div><div><p className="font-semibold">TOTS-OS</p><p className="text-xs text-white/55">One connected workspace</p></div></div>
              <p className="mt-7 text-lg font-medium leading-7">One login. One workspace. One clearer view of the business.</p>
              <p className="mt-3 text-sm leading-6 text-white/60">The work, people, money, plans and information behind your business — connected instead of scattered.</p>
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-4 rounded-[24px] border border-[#dfe6d9] bg-[#f2f6ef] p-5 sm:flex-row sm:px-7">
            <div>
              <p className="text-sm font-semibold text-stone-800">Not sure what is creating the most unnecessary work?</p>
              <p className="mt-1 text-xs text-stone-500">Take the 60-second business check. No email required.</p>
            </div>
            <Link href="/find-your-setup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-stone-800 shadow-sm">Find my setup <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </Shell>
      </section>

      <section id="product" className="border-y border-stone-200 bg-[#f3f0ec] py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="max-w-3xl">
            <SectionLabel>Inside TOTS-OS</SectionLabel>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl lg:text-6xl">Open it and run the business.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">You should not have to build your own operating system out of templates, integrations and workarounds. TOTS-OS is already structured around the way a real small business works.</p>
          </div>

          <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={classNames("inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition", selected ? "bg-[#4f4a46] text-white shadow-sm" : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300")}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4"><ProductPanel active={active} /></div>
        </Shell>
      </section>

      <section id="demo" className="py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionLabel>Try it before you sign up</SectionLabel>
              <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl">Don&apos;t just read about it. See how it feels.</h2>
              <p className="mt-5 text-base leading-7 text-stone-600">Explore a realistic TOTS-OS workspace and see how the dashboard, CRM, finance, projects, planning, social and Clarity fit together before creating an account.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start xl:flex-row">
                <SecondaryButton href="#product"><Play className="h-4 w-4" /> Explore product</SecondaryButton>
                <PrimaryButton>Start free</PrimaryButton>
              </div>
            </div>
            <MiniDashboard />
          </div>
        </Shell>
      </section>

      <section id="clarity" className="relative overflow-hidden bg-[#332f2c] py-24 text-white sm:py-28 lg:py-36">
        <div className="pointer-events-none absolute -right-24 top-0 h-[500px] w-[500px] rounded-full bg-[#78836f]/20 blur-3xl" />
        <Shell className="relative">
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65"><Sparkles className="h-3.5 w-3.5" /> Meet Clarity</div>
              <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">An AI PA that already knows what&apos;s happening.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/60">Because Clarity sits inside TOTS-OS, it can work with the information already in your workspace — helping you understand priorities instead of making you explain the business from scratch every time.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {clarityPrompts.map((prompt) => <span key={prompt} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/65">“{prompt}”</span>)}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur sm:p-6">
              <div className="rounded-[22px] bg-[#faf8f5] p-5 text-stone-900 sm:p-6">
                <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4f4a46] text-white"><Sparkles className="h-4 w-4" /></div>
                  <div><p className="text-sm font-semibold">Clarity</p><p className="text-[10px] text-stone-400">Business assistant</p></div>
                </div>
                <div className="ml-auto mt-5 max-w-[82%] rounded-2xl rounded-tr-md bg-[#efe6e1] px-4 py-3 text-xs font-medium text-stone-700">What should I focus on today?</div>
                <div className="mt-4 rounded-2xl rounded-tl-md border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold text-stone-800">You have three priorities worth focusing on first.</p>
                  <div className="mt-3 space-y-2.5">
                    {[
                      ["Send the Acorn Studio invoice", "£1,850 due this week"],
                      ["Review the Northstar project", "Two delivery tasks are due tomorrow"],
                      ["Prepare for your 2:00 PM client call", "Client notes are already saved in TOTS-OS"],
                    ].map(([title, meta], i) => (
                      <div key={title} className="flex gap-3 rounded-xl bg-[#faf8f5] p-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#dfe7d8] text-[10px] font-bold text-[#596451]">{i + 1}</div>
                        <div><p className="text-[11px] font-semibold text-stone-700">{title}</p><p className="mt-0.5 text-[10px] text-stone-400">{meta}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section className="py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Real businesses</SectionLabel>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl">Built around work that actually happens.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-600">TOTS-OS has been shaped around real businesses with real clients, deadlines, projects, admin and moving parts — not an imaginary perfect workflow.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {customerStories.map((story) => (
              <article key={story.name} className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(68,60,54,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">{story.type}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-stone-900">{story.name}</h3>
                <p className="mt-4 text-sm leading-6 text-stone-600">{story.text}</p>
                <div className="mt-6 flex flex-wrap gap-2">{story.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f3f0ec] px-3 py-1.5 text-[10px] font-semibold text-stone-500">{tag}</span>)}</div>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-stone-400">As you collect approved customer quotes and measurable results, replace these context cards with direct testimonials. That will make this section substantially stronger.</p>
        </Shell>
      </section>

      <section id="shop" className="border-y border-stone-200 bg-[#f3f0ec] py-24 sm:py-28">
        <Shell>
          <div className="grid gap-8 overflow-hidden rounded-[34px] bg-[#4f4a46] p-7 text-white sm:p-10 lg:grid-cols-[1fr_.9fr] lg:p-12">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Also from TOTS</div>
              <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">TOTS Commerce</h2>
              <p className="mt-4 max-w-xl text-lg font-medium text-white/90">Your shop. Your brand. One backend.</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">If selling is part of your business, TOTS Commerce gives you a branded storefront plus products, orders, stock, payments, discounts and fulfilment — without creating another disconnected backend to manage.</p>
              <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-0.05em]">£39</span><span className="pb-1 text-sm text-white/50">/ month</span></div>
              <Link href={APP_URL} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-[#4f4a46]">Explore Commerce <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Commerce backend</p><p className="mt-1 text-sm font-semibold">Your store, connected.</p></div><ShoppingBag className="h-5 w-5 text-white/50" /></div>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-white p-4 text-stone-900"><p className="text-[10px] text-stone-400">Orders today</p><p className="mt-1 text-xl font-semibold">18</p></div>
                <div className="rounded-2xl bg-white p-4 text-stone-900"><p className="text-[10px] text-stone-400">Revenue</p><p className="mt-1 text-xl font-semibold">£842</p></div>
                {[["Linen Daily Planner", "12 in stock"], ["90-Day Organiser", "Low stock · 4 left"], ["Brand Strategy Session", "Service · Available"]].map(([name, meta]) => (
                  <div key={name} className="col-span-2 flex items-center gap-3 rounded-2xl bg-white p-3 text-stone-900"><div className="h-10 w-10 rounded-xl bg-[#efe6e1]" /><div><p className="text-[11px] font-semibold">{name}</p><p className="text-[10px] text-stone-400">{meta}</p></div></div>
                ))}
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section id="pricing" className="py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Simple pricing</SectionLabel>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl">Start with the workspace that fits now.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-600">Every plan starts with 14 days free and no bank details. Explore the system first. Pay only if it earns a place in your business.</p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              { name: "Standard", price: "29", desc: "For getting the everyday running of the business into one organised workspace.", accent: false, bullets: ["Dashboard, CRM & projects", "Calendar, notes & planning", "Core finance tools", "Clarity AI access"] },
              { name: "Professional", price: "59", desc: "For growing businesses that also want marketing, stronger workflows and deeper visibility.", accent: true, bullets: ["Everything in Standard", "Advanced finance", "Social planning & publishing", "Campaigns, KPIs & expanded Clarity"] },
              { name: "Elite", price: "99", desc: "For businesses that need more team capacity, automation, usage and operational control.", accent: false, bullets: ["Everything in Professional", "Advanced team access", "Advanced automation", "Highest Clarity access + priority support"] },
            ].map((plan) => (
              <div key={plan.name} className={classNames("relative rounded-[28px] border p-6 sm:p-7", plan.accent ? "border-[#4f4a46] bg-[#4f4a46] text-white shadow-2xl" : "border-stone-200 bg-white")}>
                {plan.accent ? <div className="absolute -top-3 left-6 rounded-full bg-[#dfe7d8] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#596451]">Most popular</div> : null}
                <p className={classNames("text-xs font-semibold uppercase tracking-[0.16em]", plan.accent ? "text-white/50" : "text-stone-400")}>{plan.name}</p>
                <div className="mt-4 flex items-end gap-1"><span className="text-5xl font-semibold tracking-[-0.06em]">£{plan.price}</span><span className={classNames("pb-1 text-sm", plan.accent ? "text-white/45" : "text-stone-400")}>/month</span></div>
                <p className={classNames("mt-5 min-h-[72px] text-sm leading-6", plan.accent ? "text-white/65" : "text-stone-600")}>{plan.desc}</p>
                <div className="mt-6 space-y-3">{plan.bullets.map((item) => <div key={item} className="flex items-start gap-2.5 text-xs"><Check className={classNames("mt-0.5 h-3.5 w-3.5 shrink-0", plan.accent ? "text-[#dfe7d8]" : "text-[#7d8976]")} /><span className={plan.accent ? "text-white/80" : "text-stone-600"}>{item}</span></div>)}</div>
                <Link href={APP_URL} className={classNames("mt-7 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-semibold transition", plan.accent ? "bg-white text-[#4f4a46]" : "bg-[#4f4a46] text-white")}>Start 14 days free <ArrowRight className="h-3.5 w-3.5" /></Link>
                <p className={classNames("mt-3 text-center text-[10px]", plan.accent ? "text-white/40" : "text-stone-400")}>No bank details required</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-[28px] border border-stone-200 bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead><tr className="border-b border-stone-200 bg-[#fbfaf8]"><th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Compare plans</th>{["Standard", "Professional", "Elite"].map((name) => <th key={name} className="px-5 py-4 text-xs font-semibold text-stone-800">{name}</th>)}</tr></thead>
              <tbody>{pricingRows.map((row) => <tr key={row[0]} className="border-b border-stone-100 last:border-b-0"><td className="px-5 py-3.5 text-xs font-medium text-stone-600">{row[0]}</td>{row.slice(1).map((cell, i) => <td key={`${row[0]}-${i}`} className="px-5 py-3.5 text-xs text-stone-500">{cell === "Included" ? <span className="inline-flex items-center gap-1.5 font-medium text-stone-700"><Check className="h-3.5 w-3.5 text-[#7d8976]" /> Included</span> : cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-[10px] text-stone-400">Adjust any plan limits or feature availability above to match the exact rules in your billing system before publishing.</p>
        </Shell>
      </section>

      <section id="about" className="border-y border-stone-200 bg-[#efe6e1] py-24 sm:py-28 lg:py-36">
        <Shell>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <SectionLabel>The people behind it</SectionLabel>
              <h2 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl">Built by a mum and daughter who were tired of business feeling so messy.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-stone-600">We&apos;re Sam and Leigha — two very different brains behind The Organised Types and TOTS-OS. We did not start with “let&apos;s build another piece of software.” We started with the problem we kept seeing and living: too many tabs, too many systems and too much important information held together by memory.</p>
              <blockquote className="mt-7 border-l-2 border-[#7d8976] pl-5 text-xl font-medium leading-8 tracking-[-0.03em] text-stone-800">“One of us organises it. The other asks why it still takes five apps.”</blockquote>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-sm"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dfe7d8] text-lg font-bold text-[#596451]">S</div><p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Mum · Co-founder</p><h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Sam</h3><p className="mt-3 text-sm leading-6 text-stone-600">Business, organisation and big-picture thinking. The practical voice asking whether a process actually works for a real business owner.</p></div>
              <div className="rounded-[28px] bg-[#4f4a46] p-6 text-white shadow-sm"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-bold">L</div><p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Daughter · Co-founder</p><h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Leigha</h3><p className="mt-3 text-sm leading-6 text-white/60">Technology, product and design. Turning the “surely this could work better” conversations into the actual system.</p></div>
            </div>
          </div>
        </Shell>
      </section>

      <section className="py-24 sm:py-28">
        <Shell>
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div><SectionLabel>Questions</SectionLabel><h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#332f2c] sm:text-5xl">The things you&apos;ll probably ask.</h2></div>
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return <button key={faq.q} onClick={() => setOpenFaq(open ? -1 : i)} className="w-full py-5 text-left"><div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold text-stone-800">{faq.q}</span><ChevronDown className={classNames("h-4 w-4 shrink-0 text-stone-400 transition", open && "rotate-180")} /></div>{open ? <p className="max-w-2xl pt-3 text-sm leading-6 text-stone-600">{faq.a}</p> : null}</button>;
              })}
            </div>
          </div>
        </Shell>
      </section>

      <section className="pb-8">
        <Shell>
          <div className="overflow-hidden rounded-[34px] bg-[#332f2c] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Ready when you are</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">Run the business.<br /><span className="text-[#b8c3af]">Not the chaos.</span></h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/60">Put your clients, projects, money, planning, notes and everyday business admin into one organised workspace.</p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"><Link href={APP_URL} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#332f2c]">Start 14 days free <ArrowRight className="h-4 w-4" /></Link><Link href="/find-your-setup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white">Take the 60-second check</Link></div>
            <p className="mt-5 text-[10px] text-white/35">No bank details required · No commitment</p>
          </div>
        </Shell>
      </section>

      <footer className="py-10">
        <Shell className="flex flex-col justify-between gap-6 border-t border-stone-200 pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4f4a46] text-xs font-bold text-white">T</div><div><p className="text-xs font-bold">TOTS-OS</p><p className="text-[9px] text-stone-400">Your business, organised.</p></div></div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-stone-500"><Link href="#product">Product</Link><Link href="#clarity">Clarity</Link><Link href="#pricing">Pricing</Link><Link href="/find-your-setup">Business check</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <p className="text-[10px] text-stone-400">© 2026 The Organised Types.</p>
        </Shell>
      </footer>
    </main>
  );
}
