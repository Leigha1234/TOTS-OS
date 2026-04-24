"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Globe, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  Mail, 
  BarChart3, 
  Share2 
} from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: mem } = await supabase.from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mem?.team_id) return setLoading(false);

        const [inv, tks, ts, posts, emails] = await Promise.all([
          supabase.from("invoices").select("*").eq("team_id", mem.team_id),
          supabase.from("tasks").select("*").eq("team_id", mem.team_id),
          supabase.from("timesheets").select("*").eq("team_id", mem.team_id),
          supabase.from("posts").select("*").eq("team_id", mem.team_id),
          supabase.from("email_campaigns").select("*").eq("team_id", mem.team_id)
        ]);

        const rev = inv.data?.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0) || 0;
        const hrs = ts.data?.reduce((s, t) => s + (t.hours || 0), 0) || 0;

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
          payrollEst: hrs * 25,
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-6">
        <div className="flex justify-center"><Globe className="text-[#a9b897] animate-spin-slow" size={32} /></div>
        <div className="space-y-2">
          <p className="text-[#a9b897] animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">Syncing Global Nodes</p>
          <p className="text-stone-600 font-serif italic text-sm italic">Establishing secure data link...</p>
        </div>
      </div>
    </div>
  );

  if (!data) return <div className="p-12 text-stone-400 font-serif italic">No operational data detected.</div>;

  const openRate = data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) : "0.0";
  const clickRate = data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 lg:p-16 max-w-[1600px] mx-auto min-h-screen bg-stone-50 text-stone-900 space-y-16">
      
      {/* MINIMALIST HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Zap size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Operational OS</span>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter text-stone-900">Intelligence</h1>
        </div>
        <div className="bg-white border border-stone-200 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <ShieldCheck className="text-green-600" size={18} />
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-800">System Status</p>
            <p className="text-[9px] font-mono text-stone-400 uppercase">Link: [STABLE]</p>
          </div>
        </div>
      </div>

      {/* TOP TIER METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Aggregate Revenue", val: `£${data.revenue.toLocaleString()}`, trend: "+12.5%", color: "text-green-600" },
          { label: "Execution Index", val: `${data.tasksDone} Nodes`, trend: "Active", color: "text-blue-600" },
          { label: "Labor Allocation", val: `${data.totalHours}h`, trend: "Optimal", color: "text-purple-600" },
          { label: "Risk Exposure", val: data.overdueCount, trend: "Overdue", color: "text-red-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-stone-950 p-10 rounded-[2.5rem] border border-stone-800 shadow-2xl group hover:border-[#a9b897]/30 transition-colors">
            <div className="flex justify-between items-start mb-10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">{stat.label}</span>
              <ArrowUpRight size={14} className="text-stone-700 group-hover:text-white transition-colors" />
            </div>
            <p className="text-4xl font-serif italic text-white tracking-tight">{stat.val}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded border border-stone-800 ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* EMAIL INTELLIGENCE */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-16">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-2xl text-[#a9b897]"><Mail size={20} /></div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Communication Reach</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { l: "Open Rate", v: `${openRate}%`, sub: "Avg: 22.4%" },
                { l: "CTR", v: `${clickRate}%`, sub: "Total Clicks" },
                { l: "Churn", v: data.email.unsubs, sub: "Unsubscribes", c: "text-red-500" },
                { l: "Total Sent", v: data.email.sent.toLocaleString(), sub: "Outbound" }
              ].map((m, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">{m.l}</p>
                  <p className={`text-5xl font-serif italic ${m.c || 'text-white'}`}>{m.v}</p>
                  <p className="text-[10px] font-mono text-stone-700">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 p-12 opacity-10"><BarChart3 size={200} className="text-stone-500" /></div>
        </div>

        {/* SOCIAL INDEX */}
        <div className="bg-stone-950 border border-stone-800 p-12 rounded-[3.5rem] shadow-2xl space-y-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-stone-900 rounded-2xl text-[#a9b897]"><Share2 size={20} /></div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Platform Power</h2>
          </div>
          
          <div className="space-y-10">
            {['instagram', 'linkedin', 'twitter'].map((platform) => {
              const score = data.trends?.[platform] || 0;
              const allScores = Object.values(data.trends || {}) as number[];
              const maxScore = Math.max(...allScores, 1);
              const percentage = Math.min((score / maxScore) * 100, 100);

              return (
                <div key={platform} className="group">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-[#a9b897] transition-colors">{platform}</span>
                    <span className="text-[10px] font-mono text-stone-600">{score.toLocaleString()} PTS</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-stone-700 to-[#a9b897]" 
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