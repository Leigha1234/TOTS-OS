"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import {
  Zap, ShieldCheck, ArrowUpRight, Mail,
  BarChart3, Share2, Download, Loader2,
  TrendingUp, Activity, Target, AlertCircle, Cpu
} from "lucide-react";

// ---------- Types ----------

type InvoiceStatus = "paid" | "unpaid" | "overdue" | "draft" | string;

interface Invoice {
  id: string;
  team_id: string;
  amount: number;
  currency?: string;
  status: InvoiceStatus;
  due_date?: string | null;
}

interface Task {
  id: string;
  team_id: string;
  status: string;
}

interface Timesheet {
  id: string;
  team_id: string;
  mon?: number; tue?: number; wed?: number; thu?: number;
  fri?: number; sat?: number; sun?: number;
}

interface Post {
  id: string;
  team_id: string;
  platform?: string;
  likes?: number;
  comments?: number;
}

interface EmailCampaign {
  id: string;
  team_id: string;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
}

interface ReportData {
  revenue: number;
  totalHours: number;
  overdueCount: number;
  tasksDone: number;
  social: { likes: number; comments: number; total: number };
  trends: { instagram: number; linkedin: number; twitter: number; [key: string]: number };
  email: { sent: number; opens: number; clicks: number };
}

const EMPTY_DATA: ReportData = {
  revenue: 0,
  totalHours: 0,
  overdueCount: 0,
  tasksDone: 0,
  social: { likes: 0, comments: 0, total: 0 },
  trends: { instagram: 0, linkedin: 0, twitter: 0 },
  email: { sent: 0, opens: 0, clicks: 0 },
};

const currencyFmt = (value: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

// Escapes a CSV field: wraps in quotes and doubles any inner quotes if the
// value contains a comma, quote, or newline.
function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>(EMPTY_DATA);
  const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const clarityGlobalBrain = useMemo(() => {
    const revenue = data.revenue;
    const hours = data.totalHours;
    const tasks = data.tasksDone;
    const overdue = data.overdueCount;

    const emailSent = data.email.sent;
    const emailOpenRate = emailSent > 0 ? data.email.opens / emailSent : 0;

    const productivity = hours > 0 ? tasks / hours : 0;
    const revenuePerHour = hours > 0 ? revenue / hours : 0;

    const engagementScore = data.social.likes + data.social.comments;

    const financialHealth = Math.min(100, (revenuePerHour / 100) * 100);
    const operationalHealth = Math.min(100, productivity * 50);
    const engagementHealth = Math.min(100, emailOpenRate * 100);
    const workloadHealth = Math.max(0, 100 - overdue * 10);

    const hasAnyData = revenue > 0 || hours > 0 || tasks > 0 || emailSent > 0;

    const systemScore = hasAnyData
      ? Math.round((financialHealth + operationalHealth + engagementHealth + workloadHealth) / 4)
      : 0;

    const risks: string[] = [];
    if (overdue > 5) risks.push("System backlog increasing");
    if (hours > 0 && revenuePerHour < 50) risks.push("Revenue efficiency degradation");
    if (emailSent > 0 && emailOpenRate < 0.2) risks.push("Engagement decay detected");
    if (hours > 0 && productivity < 0.5) risks.push("Operational throughput weak");

    const systemState = !hasAnyData
      ? "no data"
      : systemScore > 75
      ? "optimal"
      : systemScore > 45
      ? "stable"
      : "critical";

    return {
      revenuePerHour,
      productivity,
      engagementScore,
      emailOpenRate,
      risks,
      systemScore,
      systemState,
      financialHealth,
      operationalHealth,
      engagementHealth,
      workloadHealth,
    };
  }, [data]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      setUnauthenticated(false);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (!cancelled) {
            setUnauthenticated(true);
            setLoading(false);
          }
          return;
        }

        const { data: mem, error: memError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memError) throw memError;

        if (!mem?.team_id) {
          if (!cancelled) {
            setError("No team is associated with this account yet.");
            setLoading(false);
          }
          return;
        }

        const teamId = mem.team_id;

        const [inv, tks, ts, posts, emails] = await Promise.all([
          supabase.from("invoices").select("*").eq("team_id", teamId),
          supabase.from("tasks").select("*").eq("team_id", teamId),
          supabase.from("timesheets").select("*").eq("team_id", teamId),
          supabase.from("posts").select("*").eq("team_id", teamId),
          supabase.from("email_campaigns").select("*").eq("team_id", teamId),
        ]);

        for (const result of [inv, tks, ts, posts, emails]) {
          if (result.error) throw result.error;
        }

        const invoices = (inv.data ?? []) as Invoice[];
        const tasks = (tks.data ?? []) as Task[];
        const timesheets = (ts.data ?? []) as Timesheet[];
        const postsData = (posts.data ?? []) as Post[];
        const emailCampaigns = (emails.data ?? []) as EmailCampaign[];

        const rev = invoices
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + Number(i.amount || 0), 0);

        const hrs = timesheets.reduce((s, t) => {
          return (
            s +
            Number(t.mon || 0) +
            Number(t.tue || 0) +
            Number(t.wed || 0) +
            Number(t.thu || 0) +
            Number(t.fri || 0) +
            Number(t.sat || 0) +
            Number(t.sun || 0)
          );
        }, 0);

        const socialStats = postsData.reduce(
          (acc, post) => ({
            likes: acc.likes + Number(post.likes || 0),
            comments: acc.comments + Number(post.comments || 0),
            total: acc.total + 1,
          }),
          { likes: 0, comments: 0, total: 0 }
        );

        const emailStats = emailCampaigns.reduce(
          (acc, camp) => ({
            sent: acc.sent + Number(camp.sent_count || 0),
            opens: acc.opens + Number(camp.open_count || 0),
            clicks: acc.clicks + Number(camp.click_count || 0),
          }),
          { sent: 0, opens: 0, clicks: 0 }
        );

        const platformTrends = postsData.reduce(
          (acc: ReportData["trends"], post) => {
            const p = post.platform?.toLowerCase() || "other";
            const value = Number(post.likes || 0) + Number(post.comments || 0);
            acc[p] = (acc[p] || 0) + value;
            return acc;
          },
          { instagram: 0, linkedin: 0, twitter: 0 }
        );

        const now = new Date();
        const overdueCount = invoices.filter(
          (i) => i.due_date && new Date(i.due_date) < now && i.status !== "paid"
        ).length;

        if (!cancelled) {
          setInvoiceData(invoices);
          setData({
            revenue: rev,
            totalHours: hrs,
            overdueCount,
            tasksDone: tasks.filter((t) => t.status === "done").length,
            social: socialStats,
            trends: platformTrends,
            email: emailStats,
          });
        }
      } catch (err) {
        console.error("Intelligence report failure:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reports.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const downloadFinanceReport = () => {
    if (!invoiceData.length) return;
    const headers = ["Invoice ID", "Amount", "Currency", "Status", "Due Date"];
    const rows = invoiceData.map((inv) => [
      inv.id,
      inv.amount,
      inv.currency || "GBP",
      inv.status,
      inv.due_date || "N/A",
    ]);
    // BOM prefix keeps Excel from mangling special characters on Windows.
    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csvBody], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "finance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-6">
          <Loader2 className="text-[#a9b897] animate-spin mx-auto" size={40} />
          <p className="text-[#a9b897] animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
            Loading Reports...
          </p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4 max-w-sm px-6">
          <ShieldCheck className="text-stone-300 mx-auto" size={40} />
          <p className="font-serif italic text-2xl text-stone-800">Sign in required</p>
          <p className="text-[11px] text-stone-400 uppercase tracking-widest">
            Please sign in to view your team&apos;s reports.
          </p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-[1400px] mx-auto min-h-screen bg-stone-50 text-stone-900 space-y-12">
      {/* MINIMAL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-12">
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-none">Reports</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadFinanceReport}
            disabled={!invoiceData.length}
            className="bg-stone-900 text-white hover:bg-[#a9b897] transition-all px-8 py-4 rounded-2xl flex items-center gap-3 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Download size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Export reports</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* CLARITY GLOBAL EXECUTIVE BRAIN OS */}
      <div className="bg-black text-white rounded-[2.5rem] p-6 mb-10 relative overflow-hidden border border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
            Clarity Global Executive Brain OS
          </h3>
          <Cpu size={14} className="text-[#a9b897]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
          <div>System Score: {clarityGlobalBrain.systemScore}</div>
          <div>State: {clarityGlobalBrain.systemState}</div>
          <div>Revenue/hr: {currencyFmt(clarityGlobalBrain.revenuePerHour)}</div>
          <div>Productivity: {clarityGlobalBrain.productivity.toFixed(2)}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-[9px] uppercase tracking-widest text-stone-400">
          <div>Finance: {clarityGlobalBrain.financialHealth.toFixed(0)}</div>
          <div>Ops: {clarityGlobalBrain.operationalHealth.toFixed(0)}</div>
          <div>Engagement: {clarityGlobalBrain.engagementHealth.toFixed(0)}</div>
          <div>Workload: {clarityGlobalBrain.workloadHealth.toFixed(0)}</div>
        </div>

        {clarityGlobalBrain.risks.length > 0 && (
          <div className="mt-4 text-[9px] uppercase tracking-widest text-red-300">
            {clarityGlobalBrain.risks.join(" • ")}
          </div>
        )}
      </div>

      {/* CORE KPI GRID (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            label: "Aggregate Revenue",
            val: currencyFmt(data.revenue),
            trend: "Settled",
            icon: <Activity />,
            sub: "Net directive value",
          },
          {
            label: "Execution Index",
            val: `${data.tasksDone} Units`,
            trend: "Operational",
            icon: <Target />,
            sub: "Completed nodes",
          },
          {
            label: "Labor Allocation",
            val: `${data.totalHours} Hrs`,
            trend: "Resource",
            icon: <Zap />,
            sub: "Tracked temporal assets",
          },
          {
            label: "Risk Exposure",
            val: data.overdueCount,
            trend: data.overdueCount > 0 ? "Action Req" : "Optimal",
            icon: <AlertCircle />,
            sub: "Delinquent entries",
            critical: data.overdueCount > 0,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group hover:border-[#a9b897] transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">{stat.label}</p>
                <p className="text-[10px] font-serif italic text-stone-300">{stat.sub}</p>
              </div>
              <div
                className={`p-3 rounded-xl transition-all ${
                  stat.critical
                    ? "bg-red-50 text-red-400"
                    : "bg-stone-50 text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897]"
                }`}
              >
                {stat.icon}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-6xl font-serif italic text-stone-900 tracking-tighter">{stat.val}</p>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                    stat.critical ? "border-red-100 text-red-400 bg-red-50" : "border-stone-100 text-[#a9b897]"
                  }`}
                >
                  {stat.trend}
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-stone-200 group-hover:text-[#a9b897] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILED ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* EMAIL METRICS (8-wide) */}
        <div className="lg:col-span-8 bg-stone-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-[#a9b897]">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Inbound Analytics</h2>
                <p className="text-[9px] font-serif italic text-white/30">Email campaign performance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { l: "Delivery", v: data.email.sent.toLocaleString() },
                {
                  l: "Open Rate",
                  v: data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) + "%" : "0%",
                },
                { l: "Clicks", v: data.email.clicks.toLocaleString() },
                {
                  l: "Conversion",
                  v: data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) + "%" : "0%",
                },
              ].map((m, i) => (
                <div key={i} className="border-l border-white/10 pl-6 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{m.l}</p>
                  <p className="text-4xl font-serif italic">{m.v}</p>
                </div>
              ))}
            </div>
          </div>
          <BarChart3 size={200} className="absolute -right-10 -bottom-10 opacity-[0.03]" />
        </div>

        {/* SOCIAL STACK (4-wide) */}
        <div className="lg:col-span-4 bg-white border border-stone-100 p-10 rounded-[3rem] space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-stone-50 rounded-xl text-[#a9b897]">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Platform Flow</h2>
              <p className="text-[9px] font-serif italic text-stone-400">Interaction weight</p>
            </div>
          </div>

          <div className="space-y-6">
            {(["instagram", "linkedin", "twitter"] as const).map((platform) => {
              const score = data.trends[platform] || 0;
              const maxScore = Math.max(...Object.values(data.trends).map((v) => Number(v)), 1);
              const percentage = Math.min((score / maxScore) * 100, 100);

              return (
                <div key={platform} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-800">
                      {platform}
                    </span>
                    <span className="text-[9px] font-mono text-stone-300">{score} PTS</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-stone-900 group-hover:bg-[#a9b897] transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
    </div>
  );
}

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
  .font-serif { font-family: 'Instrument Serif', serif; }
`;