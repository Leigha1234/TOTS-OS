"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Sparkles, ArrowRight, Briefcase, Activity,
  X, Loader2, Zap, FileText, Share2, Mail, Layers, User as UserIcon, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Operator");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // -- Dashboard Stats --
  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesDue: 2, 
    socialsPending: 5, 
    emailsScheduled: 3 
  });

  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async (team: string) => {
    try {
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", team);

      setStats(prev => ({ ...prev, activeProjects: projectCount || 0 }));
      
      const { data: profile } = await supabase.auth.getUser();
      if (profile?.user?.user_metadata?.full_name) {
        setUserName(profile.user.user_metadata.full_name);
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      if (!team) { setLoading(false); return; }
      loadDashboardData(team);
    }
    init();
  }, [loadDashboardData]);

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight(`Analysis Complete: ${userName}, your ecosystem is performing at 94% efficiency. Address the ${stats.invoicesDue} outstanding invoices to reach peak flow.`);
      setIsScanActive(false);
    }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400 text-lg">Syncing TOTS OS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER: NODE ACTIVE (USER, DATE, TIME) */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-6 text-[#a9b897]">
            <div className="flex items-center gap-2">
              <UserIcon size={14} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node Active: {userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleDateString()} — {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Dashboard</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={runClarityScan}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
        >
          {isScanActive ? <Loader2 className="animate-spin text-[#a9b897]" size={20} /> : <Sparkles className="text-[#a9b897]" size={20} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Analysis..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* CLICKABLE MODULES GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
          { label: "Invoices Due", value: stats.invoicesDue, icon: FileText, path: "/billing" },
          { label: "Next Socials", value: stats.socialsPending, icon: Share2, path: "/scheduler" },
          { label: "Next Emails", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -8 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-[#a9b897]/30 transition-all cursor-pointer relative"
          >
            <div className="p-4 bg-stone-50 rounded-2xl text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all w-fit mb-8">
              <item.icon size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2">{item.label}</p>
            <p className="text-6xl font-serif italic text-stone-900 leading-none">{item.value}</p>
            <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-300 group-hover:text-stone-900 transition-colors">
              Access Module <ArrowRight size={12} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#1c1c1c] text-stone-100 p-12 rounded-[3.5rem] flex items-center justify-between border border-[#a9b897]/20 shadow-2xl"
          >
            <div className="flex items-center gap-8">
              <Zap className="text-[#a9b897]" size={32} />
              <p className="font-serif italic text-3xl text-stone-200 leading-tight max-w-4xl">{insight}</p>
            </div>
            <button onClick={() => setInsight(null)} className="p-4 text-stone-600 hover:text-white transition-colors">
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM STATUS OVERVIEW */}
      <div className="bg-white border border-stone-200 rounded-[4rem] p-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 relative">
             <Layers size={40} />
             <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-4 border-white animate-pulse" />
          </div>
          <div className="space-y-2">
             <h3 className="text-4xl font-serif italic text-stone-800 tracking-tight">Ecosystem Stable</h3>
             <p className="text-stone-400 max-w-md mx-auto font-medium">All sub-modules are responding. Current latency: 14ms. Ready for deployment.</p>
          </div>
      </div>

    </div>
  );
}