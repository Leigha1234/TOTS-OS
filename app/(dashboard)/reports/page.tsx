"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: mem } = await supabase.from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mem?.team_id) {
          setLoading(false);
          return;
        }

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
        }, { instagram: 0, linkedin: 0, twitter: 0 }) || { instagram: 0, linkedin: 0, twitter: 0 };

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
      <div className="text-center space-y-4">
        <p className="text-[#a9b897] animate-pulse font-black uppercase text-xs tracking-widest">Scanning Intelligence Hub...</p>
        <p className="text-stone-500 font-serif italic text-sm">Aggregating Global Performance...</p>
      </div>
    </div>
  );

  if (!data) return <p className="p-6 text-gray-400">No active team node detected.</p>;

  const openRate = data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) : 0;
  const clickRate = data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) : 0;

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto min-h-screen bg-stone-50 text-stone-900">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-serif italic tracking-tight text-stone-800">Intelligence & Impact</h1>
          <p className="text-stone-500 text-sm mt-3 font-medium">Cross-platform performance metrics.</p>
        </div>
        <div className="hidden md:flex bg-white border border-stone-200 px-5 py-2.5 rounded-full items-center gap-3 shadow-sm">
           <div className="w-2.5 h-2.5 rounded-full bg-[#a9b897] animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Secure Link Active</span>
        </div>
      </div>

      {/* OPERATIONAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Revenue", val: `£${data.revenue.toLocaleString()}`, color: "text-green-500" },
          { label: "Efficiency", val: `${data.tasksDone} Done`, color: "text-blue-500" },
          { label: "Workload", val: `${data.totalHours}h`, color: "text-purple-500" },
          { label: "Critical", val: data.overdueCount, color: "text-red-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-stone-950 border border-stone-800 p-8 rounded-[2rem] space-y-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{stat.label}</span>
              <span className={`text-[8px] font-mono ${stat.color}`}>[ACTIVE]</span>
            </div>
            <p className="text-4xl font-serif italic text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* EMAIL CAMPAIGN INTELLIGENCE */}
      <div className="bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-12 shadow-2xl">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Email Intelligence</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Open Rate</p>
            <p className="text-5xl font-serif italic text-white">{openRate}%</p>
          </div>
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">CTR</p>
            <p className="text-5xl font-serif italic text-white">{clickRate}%</p>
          </div>
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Unsubs</p>
            <p className="text-5xl font-serif italic text-red-400">{data.email.unsubs}</p>
          </div>
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Total Sent</p>
            <p className="text-5xl font-serif italic text-white">{data.email.sent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ENGAGEMENT INDEX CARD */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-12 shadow-2xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Social Engagement Index</h2>
          <div className="grid grid-cols-3 gap-10">
            <div className="space-y-3">
              <p className="text-4xl font-serif italic text-white">{data.social.likes.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Likes</p>
            </div>
            <div className="space-y-3">
              <p className="text-4xl font-serif italic text-white">{data.social.comments.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Comments</p>
            </div>
            <div className="space-y-3">
              <p className="text-4xl font-serif italic text-white">{data.social.shares.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Shares</p>
            </div>
          </div>
        </div>

        {/* PLATFORM POWER (TRENDS) */}
        <div className="bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-8 shadow-2xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Platform Presence</h2>
          <div className="space-y-8">
            {['instagram', 'linkedin', 'twitter'].map((platform) => {
              const trends = data?.trends || {};
              const score = trends[platform] || 0;
              const allScores = Object.values(trends) as number[];
              const maxScore = allScores.length > 0 ? Math.max(...allScores) : 1;
              const percentage = Math.min((score / maxScore) * 100, 100);

              return (
                <div key={platform} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-white">{platform}</span>
                    <span className="text-[10px] font-mono text-stone-500">{score.toLocaleString()}</span>
                  </div>
                  <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#a9b897] transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
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