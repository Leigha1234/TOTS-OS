"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { motion } from "framer-motion";
import { 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  Mail, 
  BarChart3, 
  Share2,
  Download,
  Loader2,
  TrendingUp,
  Activity,
  Target,
  AlertCircle
} from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        let teamId = null;
        if (user) {
          const { data: mem } = await supabase.from("team_members")
            .select("team_id")
            .eq("user_id", user.id)
            .maybeSingle();
          teamId = mem?.team_id;
        }

        if (!teamId) teamId = "team-123";

        const [inv, tks, ts, posts, emails] = await Promise.all([
          supabase.from("invoices").select("*").eq("team_id", teamId),
          supabase.from("tasks").select("*").eq("team_id", teamId),
          supabase.from("timesheets").select("*").eq("team_id", teamId),
          supabase.from("posts").select("*").eq("team_id", teamId),
          supabase.from("email_campaigns").select("*").eq("team_id", teamId)
        ]);

        const rev = inv.data?.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0) || 0;
        const hrs = ts.data?.reduce((s, t) => s + (t.hours || 0), 0) || 0;

        setInvoiceData(inv.data || []);

        const socialStats = posts.data?.reduce((acc, post) => ({
          likes: acc.likes + (post.likes || 0),
          comments: acc.comments + (post.comments || 0),
          shares: acc.shares + (post.shares || 0),
          totalPosts: acc.totalPosts + 1
        }), { likes: 0, comments: 0, shares: 0, totalPosts: 0 }) || { likes: 0, comments: 0, shares: 0, totalPosts: 0 };

        const emailStats = emails.data?.reduce((acc, camp) => ({
          sent: acc.sent + (camp.sent_count || 0),
          opens: acc.opens + (camp.open_count || 0),
          clicks: acc.clicks + (camp.click_count || 0),
          unsubs: acc.unsubs + (camp.unsubscribe_count || 0),
        }), { sent: 0, opens: 0, clicks: 0, unsubs: 0 }) || { sent: 0, opens: 0, clicks: 0, unsubs: 0 };

        const platformTrends = posts.data?.reduce((acc: any, post: any) => {
          const p = post.platform?.toLowerCase() || 'other';
          acc[p] = (acc[p] || 0) + (post.likes || 0) + (post.comments || 0);
          return acc;
        }, { instagram: 0, linkedin: 0, twitter: 0 });

        setData({
          revenue: rev,
          totalHours: hrs,
          overdueCount: inv.data?.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== "paid").length || 0,
          tasksDone: tks.data?.filter(t => t.status === "done").length || 0,
          social: socialStats,
          trends: platformTrends,
          email: emailStats
        });
      } catch (err) {
        console.error("Intelligence report failure:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const downloadFinanceReport = () => {
    if (!invoiceData.length) return;
    const headers = ["Invoice ID", "Amount", "Currency", "Status", "Due Date"];
    const rows = invoiceData.map(inv => [inv.id, inv.amount, inv.currency || "GBP", inv.status, inv.due_date || "N/A"]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "finance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center space-y-6">
        <Loader2 className="text-[var(--brand-primary)] animate-spin mx-auto" size={40} />
        <p className="text-[var(--brand-primary)] animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">Compiling Ledger Intelligence</p>
      </div>
    </div>
  );

  const openRate = data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) : "0.0";
  const clickRate = data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 lg:p-16 max-w-[1600px] mx-auto min-h-screen bg-[var(--bg)] text-[var(--text-main)] space-y-20">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[var(--brand-primary)]">
            <TrendingUp size={18} />
            <span className="text-[11px] font-black uppercase tracking-[0.6em]">System Ledger v2.0</span>
          </div>
          <h1 className="text-8xl md:text-9xl font-serif italic tracking-tighter leading-none">Intelligence</h1>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={downloadFinanceReport}
            className="bg-stone-900 text-white hover:bg-[#a9b897] transition-all px-10 py-5 rounded-full flex items-center gap-4 shadow-2xl active:scale-95"
          >
            <Download size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">Execute Data Export</span>
          </button>

          <div className="bg-white border border-[var(--border)] px-8 py-5 rounded-full flex items-center gap-4 shadow-sm">
            <ShieldCheck className="text-[#a9b897]" size={20} />
            <div className="pr-4 border-r border-stone-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Node Status</p>
              <p className="text-[10px] font-bold text-stone-900">ENCRYPTED</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
              <span className="text-[9px] font-mono text-[#a9b897]">STABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* REFACTORED 2x2 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {[
          { label: "Aggregate Revenue", val: `£${data.revenue.toLocaleString()}`, trend: "+12.5% Growth", icon: <Activity className="text-green-600" />, sub: "Net total across all paid directives" },
          { label: "Execution Index", val: `${data.tasksDone} Nodes`, trend: "High Priority", icon: <Target className="text-blue-600" />, sub: "Completed operational task units" },
          { label: "Labor Allocation", val: `${data.totalHours} Hours`, trend: "Billable", icon: <Zap className="text-purple-600" />, sub: "Resource time tracked on active projects" },
          { label: "Risk Exposure", val: data.overdueCount, trend: "Requires Action", icon: <AlertCircle className="text-red-500" />, sub: "Delinquent invoices past settlement date" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-12 md:p-16 rounded-[4rem] border border-stone-100 shadow-sm group hover:border-[#a9b897]/50 transition-all duration-500 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-12">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{stat.label}</p>
                  <p className="text-[10px] font-serif italic text-stone-300">{stat.sub}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-all">
                  {stat.icon}
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-serif italic text-stone-900 tracking-tighter leading-none">{stat.val}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-stone-100 bg-stone-50 text-[#a9b897]">
                    {stat.trend}
                  </span>
                  <ArrowUpRight size={18} className="text-stone-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#a9b897]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* LOWER TIER: ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-stone-900 text-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-20">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-[2rem] text-[#a9b897]"><Mail size={24} /></div>
              <div className="space-y-1">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Reach Analysis</h2>
                <p className="text-[10px] font-serif italic text-white/40">Inbound engagement metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { l: "Open Rate", v: `${openRate}%`, sub: "Avg: 22%" },
                { l: "CTR", v: `${clickRate}%`, sub: "Interaction" },
                { l: "Churn", v: data.email.unsubs, sub: "Opt-outs", c: "text-red-400" },
                { l: "Delivery", v: data.email.sent.toLocaleString(), sub: "Outbound" }
              ].map((m, i) => (
                <div key={i} className="space-y-4 border-l border-white/10 pl-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{m.l}</p>
                  <p className={`text-6xl font-serif italic leading-none ${m.c || 'text-white'}`}>{m.v}</p>
                  <p className="text-[10px] font-mono text-white/20">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <BarChart3 size={300} className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="bg-white border border-stone-100 p-16 rounded-[4rem] shadow-sm space-y-16">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-stone-50 rounded-[2rem] text-[#a9b897]"><Share2 size={24} /></div>
            <div className="space-y-1">
              <h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Platform Power</h2>
              <p className="text-[10px] font-serif italic text-stone-400">Social reach distribution</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {['instagram', 'linkedin', 'twitter'].map((platform) => {
              const score = data.trends?.[platform] || 0;
              const allScores = Object.values(data.trends || {}) as number[];
              const maxScore = Math.max(...allScores, 1);
              const percentage = Math.min((score / maxScore) * 100, 100);

              return (
                <div key={platform} className="group">
                  <div className="flex justify-between items-end mb-5">
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-stone-800">{platform}</span>
                    <span className="text-[10px] font-mono text-stone-400">{score.toLocaleString()} PTS</span>
                  </div>
                  <div className="h-2 w-full bg-stone-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-stone-900 group-hover:bg-[#a9b897] transition-colors" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}