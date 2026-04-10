"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Share2,
  MessageSquare,
  Heart,
  BarChart3,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  Zap,
  Mail,
  MousePointerClick,
  UserMinus,
  Eye
} from "lucide-react";

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

        // Email Data Aggregation
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
        <Zap className="mx-auto text-[#a9b897] animate-pulse" size={32} />
        <p className="text-stone-500 font-serif italic">Generating Intelligence Report...</p>
      </div>
    </div>
  );

  if (!data) return <p className="p-6 text-gray-400">No active team node detected.</p>;

  // Calculate Rates
  const openRate = data.email.sent > 0 ? ((data.email.opens / data.email.sent) * 100).toFixed(1) : 0;
  const clickRate = data.email.opens > 0 ? ((data.email.clicks / data.email.opens) * 100).toFixed(1) : 0;

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto min-h-screen bg-stone-50 text-stone-900">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-serif italic tracking-tight text-stone-800">Intelligence & Impact</h1>
          <p className="text-stone-500 text-sm mt-3 font-medium">Cross-platform neural performance.</p>
        </div>
        <div className="hidden md:flex bg-white border border-stone-200 px-5 py-2.5 rounded-full items-center gap-3 shadow-sm">
           <div className="w-2.5 h-2.5 rounded-full bg-[#a9b897] animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Live Data Stream Active</span>
        </div>
      </div>

      {/* OPERATIONAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Revenue", val: `£${data.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
          { label: "Efficiency", val: `${data.tasksDone} Done`, icon: CheckCircle2, color: "text-blue-400" },
          { label: "Workload", val: `${data.totalHours}h`, icon: Clock, color: "text-purple-400" },
          { label: "Critical", val: data.overdueCount, icon: AlertCircle, color: "text-red-400" }
        ].map((stat, i) => (
          <div key={i} className="bg-stone-950 border border-stone-800 p-8 rounded-[2rem] space-y-5 shadow-2xl transition-all">
            <div className={`flex justify-between items-center ${stat.color}`}>
              <stat.icon size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{stat.label}</span>
            </div>
            <p className="text-4xl font-serif italic text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* NEW: EMAIL CAMPAIGN INTELLIGENCE */}
      <div className="bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-12 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Mail className="text-[#a9b897]" size={20} />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Email Intelligence</h2>
          </div>
          <span className="text-[9px] font-bold text-stone-600 uppercase">Aggregated Lifetime Stats</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-500">
              <Eye size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Open Rate</p>
            </div>
            <p className="text-5xl font-serif italic text-white">{openRate}%</p>
            <div className="h-1 w-12 bg-blue-500/50 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-500">
              <MousePointerClick size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">CTR</p>
            </div>
            <p className="text-5xl font-serif italic text-white">{clickRate}%</p>
            <div className="h-1 w-12 bg-green-500/50 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-500">
              <UserMinus size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Unsubscribes</p>
            </div>
            <p className="text-5xl font-serif italic text-red-400">{data.email.unsubs}</p>
            <div className="h-1 w-12 bg-red-500/50 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-500">
              <Zap size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Total Sent</p>
            </div>
            <p className="text-5xl font-serif italic text-white">{data.email.sent.toLocaleString()}</p>
            <div className="h-1 w-12 bg-[#a9b897]/50 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ENGAGEMENT INDEX CARD */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-12 shadow-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Engagement Index</h2>
            <BarChart3 size={18} className="text-stone-700" />
          </div>
          
          <div className="grid grid-cols-3 gap-10">
            <div className="space-y-3">
              <Heart size={22} className="text-pink-500 mb-3" />
              <p className="text-4xl font-serif italic text-white">{data.social.likes.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Total Likes</p>
            </div>
            <div className="space-y-3">
              <MessageSquare size={22} className="text-blue-500 mb-3" />
              <p className="text-4xl font-serif italic text-white">{data.social.comments.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Comments</p>
            </div>
            <div className="space-y-3">
              <Share2 size={22} className="text-green-500 mb-3" />
              <p className="text-4xl font-serif italic text-white">{data.social.shares.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Shares</p>
            </div>
          </div>
          
          <div className="pt-8 border-t border-stone-800 flex justify-between items-center">
            <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest">Post Volume: {data.social.totalPosts}</p>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#a9b897]" />
               <p className="text-[9px] text-[#a9b897] font-black uppercase tracking-widest">Growth: {data.social.totalPosts > 0 ? "Active" : "Stable"}</p>
            </div>
          </div>
        </div>

        {/* PLATFORM POWER (TRENDS) */}
        <div className="bg-stone-950 border border-stone-800 p-10 rounded-[3rem] space-y-8 shadow-2xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Platform Power</h2>
          <div className="space-y-8">
            {['instagram', 'linkedin', 'twitter'].map((platform) => {
              const trends = data?.trends || {};
              const score = trends[platform] || 0;
              const allScores = Object.values(trends) as number[];
              const maxScore = allScores.length > 0 ? Math.max(...allScores) : 1;
              const percentage = Math.min((score / maxScore) * 100, 100);
              
              const Icons: any = { 
                instagram: Instagram, 
                linkedin: Linkedin, 
                twitter: Twitter 
              };
              const Icon = Icons[platform] || Globe;

              return (
                <div key={platform} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-stone-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-white">{platform}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500">{score.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-[#a9b897] transition-all duration-1000 ease-out shadow-[0_0_12px_#a9b897cc]" 
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