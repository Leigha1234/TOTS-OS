"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { 
  Zap, ShieldCheck, ArrowUpRight, Mail, 
  BarChart3, Share2, Download, Loader2, 
  TrendingUp, Activity, Target, AlertCircle, Hash
} from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let teamId = "team-123"; // Default fallback

        if (user) {
          const { data: mem } = await supabase.from("team_members")
            .select("team_id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (mem?.team_id) teamId = mem.team_id;
        }

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
          total: acc.total + 1
        }), { likes: 0, comments: 0, total: 0 }) || { likes: 0, comments: 0, total: 0 };

        const emailStats = emails.data?.reduce((acc, camp) => ({
          sent: acc.sent + (camp.sent_count || 0),
          opens: acc.opens + (camp.open_count || 0),
          clicks: acc.clicks + (camp.click_count || 0),
        }), { sent: 0, opens: 0, clicks: 0 }) || { sent: 0, opens: 0, clicks: 0 };

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
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-6">
        <Loader2 className="text-[#a9b897] animate-spin mx-auto" size={40} />
        <p className="text-[#a9b897] animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">Loading Reports...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-12 max-w-[1400px] mx-auto min-h-screen bg-stone-50 text-stone-900 space-y-12">
      
      {/* MINIMAL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-12">
        <div className="space-y-2">
     
          <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-none">Reports</h1>
        </div>
        
        <div className="flex gap-3">
          <button onClick={downloadFinanceReport} className="bg-stone-900 text-white hover:bg-[#a9b897] transition-all px-8 py-4 rounded-2xl flex items-center gap-3 active:scale-95">
            <Download size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Export reports</span>
          </button>
         
        </div>
      </div>

      {/* CORE KPI GRID (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "Aggregate Revenue", val: `£${data.revenue.toLocaleString()}`, trend: "Settled", icon: <Activity />, sub: "Net directive value" },
          { label: "Execution Index", val: `${data.tasksDone} Units`, trend: "Operational", icon: <Target />, sub: "Completed nodes" },
          { label: "Labor Allocation", val: `${data.totalHours} Hrs`, trend: "Resource", icon: <Zap />, sub: "Tracked temporal assets" },
          { label: "Risk Exposure", val: data.overdueCount, trend: data.overdueCount > 0 ? "Action Req" : "Optimal", icon: <AlertCircle />, sub: "Delinquent entries", critical: data.overdueCount > 0 }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group hover:border-[#a9b897] transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">{stat.label}</p>
                <p className="text-[10px] font-serif italic text-stone-300">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl transition-all ${stat.critical ? 'bg-red-50 text-red-400' : 'bg-stone-50 text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897]'}`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-6xl font-serif italic text-stone-900 tracking-tighter">{stat.val}</p>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${stat.critical ? 'border-red-100 text-red-400 bg-red-50' : 'border-stone-100 text-[#a9b897]'}`}>
                  {stat.trend}
                </span>
                <ArrowUpRight size={16} className="text-stone-200 group-hover:text-[#a9b897] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
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
              <div className="p-3 bg-white/10 rounded-xl text-[#a9b897]"><Mail size={20} /></div>
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Inbound Analytics</h2>
                <p className="text-[9px] font-serif italic text-white/30">Email campaign performance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { l: "Delivery", v: data.email.sent.toLocaleString() },
                { l: "Open Rate", v: `${data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) : 0}%` },
                { l: "Clicks", v: data.email.clicks.toLocaleString() },
                { l: "Conversion", v: `${data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) : 0}%` }
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
            <div className="p-3 bg-stone-50 rounded-xl text-[#a9b897]"><Share2 size={20} /></div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Platform Flow</h2>
              <p className="text-[9px] font-serif italic text-stone-400">Interaction weight</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {['instagram', 'linkedin', 'twitter'].map((platform) => {
              const score = data.trends?.[platform] || 0;
              const maxScore = Math.max(...Object.values(data.trends || {}).map(v => Number(v)), 1);
              const percentage = Math.min((score / maxScore) * 100, 100);

              return (
                <div key={platform} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-800">{platform}</span>
                    <span className="text-[9px] font-mono text-stone-300">{score} PTS</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-stone-900 group-hover:bg-[#a9b897] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}} />
    </div>
  );
}