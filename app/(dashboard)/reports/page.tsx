"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import {
  Activity, AlertCircle, ArrowUpRight, BarChart3, Briefcase,
  Cpu, Download, Hash, Loader2, Mail, ShieldCheck, Share2,
  Target, TrendingUp, Users, Zap, ArrowRight, CalendarDays, FileText, RefreshCw, Sparkles, Wallet, CheckCircle2, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// ---------- Types ----------

interface Invoice {
  id: string;
  team_id: string;
  amount: number;
  currency?: string;
  status: string;
  due_date?: string | null;
  client_name?: string | null; // optional — degrades gracefully if absent
  created_at?: string | null;
}

interface Task {
  id: string;
  team_id: string;
  status: string;
  title?: string;
  assignee_id?: string | null; // optional
  created_at?: string | null;
  completed_at?: string | null;
}

interface Timesheet {
  id: string;
  team_id: string;
  user_id?: string | null; // optional
  mon?: number; tue?: number; wed?: number; thu?: number;
  fri?: number; sat?: number; sun?: number;
  week_start?: string | null;
}

interface Post {
  id: string;
  team_id: string;
  platform?: string;
  likes?: number;
  comments?: number;
  created_at?: string | null;
}

interface EmailCampaign {
  id: string;
  team_id: string;
  name?: string;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  created_at?: string | null;
}

interface TeamMember {
  id: string;
  user_id?: string;
  name?: string;
  role?: string;
}

type Tab = "overview" | "financial" | "productivity" | "marketing" | "team";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const PIE_COLORS = ["#0F3D32", "#5C9A80", "#A8BDA8", "#D2A887", "#8B9E91", "#C9D8CD"];

const currencyFmt = (value: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const body = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FullReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [emails, setEmails] = useState<EmailCampaign[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setUnauthenticated(false);

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
          if (!cancelled) { setUnauthenticated(true); setLoading(false); }
          return;
        }

        const { data: mem, error: memError } = await supabase
          .from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
        if (memError) throw memError;

        if (!mem?.team_id) {
          if (!cancelled) { setError("No team is associated with this account yet."); setLoading(false); }
          return;
        }

        const teamId = mem.team_id;

        const [inv, tks, ts, pst, eml, tm] = await Promise.all([
          supabase.from("invoices").select("*").eq("team_id", teamId).limit(1000),
          supabase.from("tasks").select("*").eq("team_id", teamId).limit(1000),
          supabase.from("timesheets").select("*").eq("team_id", teamId).limit(1000),
          supabase.from("posts").select("*").eq("team_id", teamId).limit(500),
          supabase.from("email_campaigns").select("*").eq("team_id", teamId).limit(500),
          supabase.from("team_members").select("*").eq("team_id", teamId),
        ]);

        for (const r of [inv, tks, ts, pst, eml, tm]) if (r.error) throw r.error;

        if (!cancelled) {
          setInvoices((inv.data ?? []) as Invoice[]);
          setTasks((tks.data ?? []) as Task[]);
          setTimesheets((ts.data ?? []) as Timesheet[]);
          setPosts((pst.data ?? []) as Post[]);
          setEmails((eml.data ?? []) as EmailCampaign[]);
          setMembers((tm.data ?? []) as TeamMember[]);
        }
      } catch (err) {
        console.error("Reports load failure:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, refreshKey]);

  // ---------- FINANCIAL ----------
  const financial = useMemo(() => {
    const currency = invoices[0]?.currency || "GBP";
    const paid = invoices.filter((i) => i.status === "paid");
    const unpaid = invoices.filter((i) => i.status !== "paid");
    const paidRevenue = paid.reduce((s, i) => s + Number(i.amount || 0), 0);
    const outstanding = unpaid.reduce((s, i) => s + Number(i.amount || 0), 0);

    // Monthly revenue (paid invoices, by created_at or due_date)
    const monthly = new Map<string, number>();
    paid.forEach((i) => {
      const dateStr = i.created_at || i.due_date;
      if (!dateStr) return;
      const key = monthKey(dateStr);
      monthly.set(key, (monthly.get(key) || 0) + Number(i.amount || 0));
    });
    const monthlyRevenue = Array.from(monthly.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-12)
      .map(([key, revenue]) => ({ month: monthLabel(key + "-01"), revenue }));

    // Status breakdown
    const statusMap = new Map<string, number>();
    invoices.forEach((i) => statusMap.set(i.status, (statusMap.get(i.status) || 0) + 1));
    const statusBreakdown = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    // AR aging
    const now = new Date();
    const buckets = { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    unpaid.forEach((i) => {
      if (!i.due_date) return;
      const days = Math.floor((now.getTime() - new Date(i.due_date).getTime()) / 86400000);
      const amt = Number(i.amount || 0);
      if (days <= 0) buckets.Current += amt;
      else if (days <= 30) buckets["1-30"] += amt;
      else if (days <= 60) buckets["31-60"] += amt;
      else if (days <= 90) buckets["61-90"] += amt;
      else buckets["90+"] += amt;
    });
    const aging = Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));

    // Top clients (only meaningful if client_name is tracked)
    const hasClientField = invoices.some((i) => i.client_name);
    const clientMap = new Map<string, number>();
    paid.forEach((i) => {
      const key = i.client_name || "Unknown";
      clientMap.set(key, (clientMap.get(key) || 0) + Number(i.amount || 0));
    });
    const topClients = Array.from(clientMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    return { currency, paidRevenue, outstanding, overdueCount: unpaid.filter((i) => {
      if (!i.due_date) return false;
      return new Date(i.due_date) < now;
    }).length, monthlyRevenue, statusBreakdown, aging, hasClientField, topClients };
  }, [invoices]);

  // ---------- PRODUCTIVITY ----------
  const productivity = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done");
    const statusMap = new Map<string, number>();
    tasks.forEach((t) => statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1));
    const statusBreakdown = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    const completionByMonth = new Map<string, number>();
    done.forEach((t) => {
      const dateStr = t.completed_at || t.created_at;
      if (!dateStr) return;
      const key = monthKey(dateStr);
      completionByMonth.set(key, (completionByMonth.get(key) || 0) + 1);
    });
    const monthlyCompletion = Array.from(completionByMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-12)
      .map(([key, count]) => ({ month: monthLabel(key + "-01"), completed: count }));

    const totalHours = timesheets.reduce(
      (s, t) => s + WEEKDAYS.reduce((ws, d) => ws + Number(t[d] || 0), 0), 0
    );

    const hoursByWeek = new Map<string, number>();
    timesheets.forEach((t) => {
      if (!t.week_start) return;
      const hrs = WEEKDAYS.reduce((s, d) => s + Number(t[d] || 0), 0);
      hoursByWeek.set(t.week_start, (hoursByWeek.get(t.week_start) || 0) + hrs);
    });
    const weeklyHours = Array.from(hoursByWeek.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-12)
      .map(([week, hours]) => ({ week: monthLabel(week), hours }));

    const hasAssigneeField = tasks.some((t) => t.assignee_id);
    const tasksByAssignee = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.assignee_id) return;
      tasksByAssignee.set(t.assignee_id, (tasksByAssignee.get(t.assignee_id) || 0) + 1);
    });

    return {
      totalTasks: tasks.length,
      doneCount: done.length,
      openCount: tasks.length - done.length,
      statusBreakdown, monthlyCompletion, totalHours, weeklyHours,
      hasAssigneeField, tasksByAssignee,
    };
  }, [tasks, timesheets]);

  // ---------- MARKETING ----------
  const marketing = useMemo(() => {
    const platformMap = new Map<string, number>();
    posts.forEach((p) => {
      const key = p.platform?.toLowerCase() || "other";
      const score = Number(p.likes || 0) + Number(p.comments || 0);
      platformMap.set(key, (platformMap.get(key) || 0) + score);
    });
    const platformBreakdown = Array.from(platformMap.entries()).map(([name, value]) => ({ name, value }));

    const emailTotals = emails.reduce(
      (acc, c) => ({
        sent: acc.sent + Number(c.sent_count || 0),
        opens: acc.opens + Number(c.open_count || 0),
        clicks: acc.clicks + Number(c.click_count || 0),
      }),
      { sent: 0, opens: 0, clicks: 0 }
    );
    const funnel = [
      { stage: "Sent", value: emailTotals.sent },
      { stage: "Opened", value: emailTotals.opens },
      { stage: "Clicked", value: emailTotals.clicks },
    ];

    const topPosts = [...posts]
      .map((p) => ({ ...p, score: Number(p.likes || 0) + Number(p.comments || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const campaignRows = [...emails].sort(
      (a, b) => Number(b.sent_count || 0) - Number(a.sent_count || 0)
    ).slice(0, 8);

    return { platformBreakdown, emailTotals, funnel, topPosts, campaignRows, totalPosts: posts.length };
  }, [posts, emails]);

  // ---------- TEAM ----------
  const team = useMemo(() => {
    const hasUserIdOnTimesheets = timesheets.some((t) => t.user_id);
    const hoursByUser = new Map<string, number>();
    timesheets.forEach((t) => {
      if (!t.user_id) return;
      const hrs = WEEKDAYS.reduce((s, d) => s + Number(t[d] || 0), 0);
      hoursByUser.set(t.user_id, (hoursByUser.get(t.user_id) || 0) + hrs);
    });

    const rows = members.map((m) => ({
      id: m.id,
      name: m.name || "Unnamed",
      role: m.role || "Member",
      hours: m.user_id ? hoursByUser.get(m.user_id) || 0 : null,
      tasks: m.user_id ? productivity.tasksByAssignee.get(m.user_id) || 0 : null,
    }));

    return { rows, hasUserIdOnTimesheets, hasAssigneeField: productivity.hasAssigneeField };
  }, [members, timesheets, productivity.tasksByAssignee, productivity.hasAssigneeField]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-6">
          <Loader2 className="text-[#0F3D32] animate-spin mx-auto" size={40} />
          <p className="text-[#0F3D32] animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">Loading Reports...</p>
        </div>
        <FontImport />
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <ShieldCheck className="text-[#829087] mx-auto" size={40} />
          <p className="font-serif italic text-2xl text-[#183C31]">Sign in required</p>
          <p className="text-[11px] text-[#65756C] uppercase tracking-widest">Please sign in to view your team&apos;s reports.</p>
        </div>
        <FontImport />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={16} />, description: "At a glance" },
    { id: "financial", label: "Financial", icon: <Wallet size={16} />, description: "Cash flow & invoices" },
    { id: "productivity", label: "Productivity", icon: <Target size={16} />, description: "Tasks & time" },
    { id: "marketing", label: "Marketing", icon: <Share2 size={16} />, description: "Campaign performance" },
    { id: "team", label: "Team", icon: <Users size={16} />, description: "People & workload" },
  ];

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#1E2A27] pb-20">
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10 space-y-8">
        <header className="relative overflow-hidden rounded-[30px] bg-[#0F3D32] px-7 py-8 text-[#F7EFE6] shadow-[0_20px_55px_-28px_rgba(15,61,50,0.55)] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-40 h-[420px] w-[420px] rounded-full border border-[#A8BDA8]/20" />
          <div className="pointer-events-none absolute -right-10 -top-28 h-[340px] w-[340px] rounded-full border border-[#A8BDA8]/20" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9D8CD]"><Sparkles size={13} /> ORBI. / Business intelligence</div>
              <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">Your business, <em className="font-normal">in focus.</em></h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#D8E4DC]">One place to understand your finances, productivity, marketing and team performance. All insights below come from your workspace data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setRefreshKey((v) => v + 1)} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"><RefreshCw size={15} /> Refresh</button>
              <button type="button" onClick={() => {
                const rows: (string | number)[][] = [
                  ["Paid revenue", financial.paidRevenue], ["Outstanding", financial.outstanding],
                  ["Overdue invoices", financial.overdueCount], ["Tasks completed", productivity.doneCount],
                  ["Open tasks", productivity.openCount], ["Hours logged", productivity.totalHours],
                  ["Emails sent", marketing.emailTotals.sent], ["Social posts", marketing.totalPosts],
                ];
                downloadCsv("orbi_business_snapshot.csv", ["Metric", "Value"], rows);
              }} className="inline-flex items-center gap-2 rounded-xl bg-[#F7EFE6] px-4 py-3 text-xs font-bold text-[#0F3D32] transition hover:bg-white"><Download size={15} /> Export snapshot</button>
            </div>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-[11px] text-[#D8E4DC]">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-[#B8D6C4]" /> Live workspace reports</span>
            <span>{invoices.length.toLocaleString()} invoices</span><span>{tasks.length.toLocaleString()} tasks</span><span>{members.length.toLocaleString()} team members</span>
          </div>
        </header>

        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><AlertCircle size={19} className="shrink-0" />{error}</div>}

        <nav aria-label="Report categories" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
              className={`group flex min-h-[88px] items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition-all duration-200 ${tab === t.id ? "border-[#0F3D32] bg-[#0F3D32] text-white shadow-lg shadow-emerald-950/10" : "border-[#E5E8E3] bg-white text-[#1E2A27] hover:-translate-y-0.5 hover:border-[#9AB6A6] hover:shadow-md"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tab === t.id ? "bg-white/15" : "bg-[#E5EDE6] text-[#0F3D32]"}`}>{t.icon}</span>
              <span className="min-w-0"><span className="block text-sm font-bold">{t.label}</span><span className={`mt-1 block text-[10px] ${tab === t.id ? "text-[#D5E4D9]" : "text-[#64746C]"}`}>{t.description}</span></span>
              <ChevronRight size={14} className="ml-auto hidden shrink-0 opacity-50 sm:block" />
            </button>
          ))}
        </nav>

        <section aria-label={`${tab} report`} className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#56786A]">Performance insights</p><h2 className="font-serif text-3xl text-[#183C31] sm:text-4xl">{TABS.find((t) => t.id === tab)?.label} <em className="font-normal">report</em></h2></div>
            <p className="max-w-sm text-right text-xs leading-relaxed text-[#65756C]">Figures reflect available records in your workspace; some datasets may be limited to the most recent 500–1,000 records.</p>
          </div>
          {tab === "overview" && <OverviewTab financial={financial} productivity={productivity} marketing={marketing} />}
          {tab === "financial" && <FinancialTab financial={financial} invoices={invoices} />}
          {tab === "productivity" && <ProductivityTab productivity={productivity} />}
          {tab === "marketing" && <MarketingTab marketing={marketing} />}
          {tab === "team" && <TeamTab team={team} />}
        </section>

        <div className="rounded-[24px] border border-[#E4E8E1] bg-white px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#56786A]">Keep moving</p><h3 className="mt-1 font-serif text-2xl text-[#183C31]">Turn insights into action.</h3><p className="mt-1 text-xs text-[#64746C]">Jump straight to the tools behind your reports.</p></div>
            <div className="flex flex-wrap gap-2">
              <Link href="/payments" className="inline-flex items-center gap-2 rounded-xl bg-[#E5EDE6] px-4 py-3 text-xs font-bold text-[#0F3D32] hover:bg-[#D5E5D8]"><Wallet size={15} /> Finances <ArrowUpRight size={14} /></Link>
              <Link href="/notes" className="inline-flex items-center gap-2 rounded-xl bg-[#E5EDE6] px-4 py-3 text-xs font-bold text-[#0F3D32] hover:bg-[#D5E5D8]"><FileText size={15} /> Tasks & notes <ArrowUpRight size={14} /></Link>
              <Link href="/settings/team" className="inline-flex items-center gap-2 rounded-xl bg-[#0F3D32] px-4 py-3 text-xs font-bold text-white hover:bg-[#155443]"><Users size={15} /> Manage team <ArrowUpRight size={14} /></Link>
            </div>
          </div>
        </div>
      </div>
      <FontImport />
    </main>
  );
}

// ---------- Shared bits ----------

function FontImport() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `,
    }} />
  );
}

function Card({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-[#E5E8E3] bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,61,50,0.22)] sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div><h3 className="font-serif text-2xl leading-tight tracking-tight text-[#183C31]">{title}</h3>{sub && <p className="mt-1 text-xs leading-relaxed text-[#65756C]">{sub}</p>}</div>
        {action && <div className="shrink-0 rounded-lg bg-[#E5EDE6] p-2 text-[#0F3D32]">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-[#D8E3DA] bg-[#FAFBF8] px-4 py-10 text-center text-xs leading-relaxed text-[#64746C]">{children}</div>;
}

function KPI({ label, value, icon, critical }: { label: string; value: string | number; icon: React.ReactNode; critical?: boolean }) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[22px] border border-[#E5E8E3] bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,61,50,0.18)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <div className={`absolute bottom-0 left-0 h-1 w-full ${critical ? "bg-[#BD786A]" : "bg-[#9EBDAA]"}`} />
      <div className="mb-5 flex items-start justify-between gap-3"><p className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.15em] text-[#65756C]">{label}</p><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${critical ? "bg-[#FFF0EC] text-[#B04E3C]" : "bg-[#E5EDE6] text-[#0F3D32]"}`}>{icon}</span></div>
      <p className="break-words font-serif text-3xl leading-none tracking-tight text-[#183C31] sm:text-4xl">{value}</p>
    </div>
  );
}

// ---------- Overview ----------

function OverviewTab({ financial, productivity, marketing }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <KPI label="Paid Revenue" value={currencyFmt(financial.paidRevenue, financial.currency)} icon={<Activity size={16} />} />
        <KPI label="Outstanding" value={currencyFmt(financial.outstanding, financial.currency)} icon={<AlertCircle size={16} />} critical={financial.overdueCount > 0} />
        <KPI label="Tasks Done" value={productivity.doneCount} icon={<Target size={16} />} />
        <KPI label="Hours Logged" value={productivity.totalHours} icon={<Zap size={16} />} />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Revenue Trend" sub="Last 12 months, paid invoices">
          {financial.monthlyRevenue.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={financial.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => currencyFmt(v, financial.currency)} />
                <Line type="monotone" dataKey="revenue" stroke="#0F3D32" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No paid invoices with dates yet</EmptyNote>}
        </Card>
        <Card title="Email + Social Snapshot" sub="Engagement across channels">
          <div className="grid grid-cols-2 gap-6 text-center py-6">
            <div>
              <p className="text-3xl font-serif italic">{marketing.emailTotals.sent.toLocaleString()}</p>
              <p className="text-[9px] uppercase tracking-widest text-[#65756C] mt-2">Emails Sent</p>
            </div>
            <div>
              <p className="text-3xl font-serif italic">{marketing.totalPosts}</p>
              <p className="text-[9px] uppercase tracking-widest text-[#65756C] mt-2">Posts Published</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Financial ----------

function FinancialTab({ financial, invoices }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <KPI label="Paid Revenue" value={currencyFmt(financial.paidRevenue, financial.currency)} icon={<Activity size={16} />} />
        <KPI label="Outstanding (AR)" value={currencyFmt(financial.outstanding, financial.currency)} icon={<AlertCircle size={16} />} critical={financial.overdueCount > 0} />
        <KPI label="Overdue Invoices" value={financial.overdueCount} icon={<AlertCircle size={16} />} critical={financial.overdueCount > 0} />
        <KPI label="Total Invoices" value={invoices.length} icon={<Briefcase size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Monthly Revenue"
          action={
            <button onClick={() => downloadCsv("revenue_by_month.csv", ["Month", "Revenue"], financial.monthlyRevenue.map((r: any) => [r.month, r.revenue]))} className="text-[#829087] hover:text-[#0F3D32]">
              <Download size={16} />
            </button>
          }
        >
          {financial.monthlyRevenue.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={financial.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => currencyFmt(v, financial.currency)} />
                <Bar dataKey="revenue" fill="#0F3D32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No paid invoices with dates yet</EmptyNote>}
        </Card>

        <Card title="Invoice Status Breakdown">
          {financial.statusBreakdown.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={financial.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {financial.statusBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No invoices yet</EmptyNote>}
        </Card>
      </div>

      <Card title="Accounts Receivable Aging" sub="Outstanding balance by days overdue">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
          {financial.aging.map((b: any) => (
            <div key={b.bucket} className="p-4 bg-[#FAF9F6] rounded-2xl">
              <p className="text-[9px] uppercase tracking-widest text-[#65756C] mb-2">{b.bucket}</p>
              <p className="text-lg font-serif italic">{currencyFmt(b.amount, financial.currency)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Top Clients by Revenue" sub={!financial.hasClientField ? "Add a client_name column to invoices to enable this" : undefined}>
        {financial.hasClientField && financial.topClients.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={financial.topClients} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => currencyFmt(v, financial.currency)} />
              <Bar dataKey="revenue" fill="#0F3D32" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyNote>Not tracked yet — invoices have no client_name field</EmptyNote>}
      </Card>
    </div>
  );
}

// ---------- Productivity ----------

function ProductivityTab({ productivity }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <KPI label="Total Tasks" value={productivity.totalTasks} icon={<Target size={16} />} />
        <KPI label="Completed" value={productivity.doneCount} icon={<Target size={16} />} />
        <KPI label="Open" value={productivity.openCount} icon={<AlertCircle size={16} />} />
        <KPI label="Hours Logged" value={productivity.totalHours} icon={<Zap size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Task Status Breakdown">
          {productivity.statusBreakdown.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={productivity.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {productivity.statusBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No tasks yet</EmptyNote>}
        </Card>

        <Card title="Tasks Completed / Month">
          {productivity.monthlyCompletion.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={productivity.monthlyCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#5C9A80" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No completed tasks with dates yet</EmptyNote>}
        </Card>
      </div>

      <Card title="Weekly Hours Logged" sub={!productivity.weeklyHours.length ? "Requires week_start on timesheets" : undefined}>
        {productivity.weeklyHours.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productivity.weeklyHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#0F3D32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyNote>Not tracked yet — timesheets have no week_start field</EmptyNote>}
      </Card>
    </div>
  );
}

// ---------- Marketing ----------

function MarketingTab({ marketing }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <KPI label="Emails Sent" value={marketing.emailTotals.sent} icon={<Mail size={16} />} />
        <KPI label="Open Rate" value={marketing.emailTotals.sent ? `${((marketing.emailTotals.opens / marketing.emailTotals.sent) * 100).toFixed(1)}%` : "0%"} icon={<Mail size={16} />} />
        <KPI label="Click Rate" value={marketing.emailTotals.opens ? `${((marketing.emailTotals.clicks / marketing.emailTotals.opens) * 100).toFixed(1)}%` : "0%"} icon={<Mail size={16} />} />
        <KPI label="Posts Published" value={marketing.totalPosts} icon={<Share2 size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Engagement by Platform">
          {marketing.platformBreakdown.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marketing.platformBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F3D32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No posts yet</EmptyNote>}
        </Card>

        <Card title="Email Funnel">
          {marketing.emailTotals.sent ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marketing.funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="value" fill="#5C9A80" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyNote>No email campaigns yet</EmptyNote>}
        </Card>
      </div>

      <Card title="Top Performing Posts">
        {marketing.topPosts.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="text-[#65756C] uppercase tracking-widest text-[9px] border-b border-[#E5E8E3]">
                <th className="py-2">Platform</th><th>Likes</th><th>Comments</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {marketing.topPosts.map((p: any) => (
                <tr key={p.id} className="border-b border-[#EEF0EB]">
                  <td className="py-3 font-bold uppercase">{p.platform || "other"}</td>
                  <td>{p.likes || 0}</td>
                  <td>{p.comments || 0}</td>
                  <td className="font-serif italic">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : <EmptyNote>No posts yet</EmptyNote>}
      </Card>
    </div>
  );
}

// ---------- Team ----------

function TeamTab({ team }: any) {
  return (
    <div className="space-y-6">
      <Card title="Team Workload" sub="Hours and tasks per member">
        {!team.hasUserIdOnTimesheets && !team.hasAssigneeField && (
          <div className="mb-4">
            <EmptyNote>Add user_id to timesheets and assignee_id to tasks to see per-member breakdowns</EmptyNote>
          </div>
        )}
        <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs">
          <thead>
            <tr className="text-[#65756C] uppercase tracking-widest text-[9px] border-b border-[#E5E8E3]">
              <th className="py-2">Name</th><th>Role</th><th>Hours</th><th>Tasks Assigned</th>
            </tr>
          </thead>
          <tbody>
            {team.rows.map((r: any) => (
              <tr key={r.id} className="border-b border-[#EEF0EB]">
                <td className="py-3 font-bold">{r.name}</td>
                <td className="text-[#65756C] uppercase text-[10px] tracking-widest">{r.role}</td>
                <td>{r.hours === null ? "—" : r.hours}</td>
                <td>{r.tasks === null ? "—" : r.tasks}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </div>
  );
}