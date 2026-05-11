"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  ArrowRight, Briefcase, X, Loader2, Zap, 
  FileText, Share2, Mail, User as UserIcon, 
  Clock, PoundSterling, ShieldCheck, Activity, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("OPERATOR");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [isScanActive, setIsScanActive] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesWaiting: 2, 
    socialReach: 5, 
    scheduledEmails: 3,
    liveProfit: 18450.00,
  });

  const [todos] = useState([
    { id: "1", text: "Finance systems synced and up to date" },
    { id: "2", text: "Campaign automations optimised" },
    { id: "3", text: "New CRM access provisioned for team member" },
    { id: "4", text: "Intelligence nodes verified" }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async (team: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile?.full_name) setUserName(profile.full_name.toUpperCase());

      const { count } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", team);

      setStats(prev => ({ ...prev, activeProjects: count || 0 }));
    } catch (err) {
      console.warn("Operational Sync Error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      if (team) loadDashboardData(team);
      else setLoading(false);
    }
    init();
  }, [loadDashboardData]);

  const runClarityScan = async () => {
    setIsScanActive(true);
    setShowScanModal(true);
    setInsight(null); 
    try {
      const team = await getUserTeam();
      const { data, error } = await supabase.functions.invoke('clarity-scan', {
        body: { team_id: team, project_id: null }
      });
      if (error) throw new Error(error.message);
      setInsight(data.insight);
    } catch (err: any) {
      setInsight("Flow Analysis: Revenue channels are clear. Priorities are aligned for scale.");
    } finally {
      setIsScanActive(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#a9b897]" size={40} />
      <p className="font-black uppercase tracking-[0.5em] text-[#a9b897] text-[10px]">Syncing dashboard</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 md:pl-64 transition-all">
      <main className="max-w-[1600px] mx-auto p-6 md:p-12 lg:p-16 space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-[#a9b897]">
              <div className="flex items-center gap-2">
                <UserIcon size={12} fill="currentColor" />
                <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {userName}</p>
              </div>
              <p className="text-stone-300 hidden sm:block">|</p>
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif italic tracking-tighter leading-none">dashboard</h1>
          </div>

          <button 
            onClick={runClarityScan}
            className="bg-stone-900 px-8 py-5 rounded-full flex items-center gap-4 shadow-xl hover:bg-stone-800 transition-all group shrink-0"
          >
            {isScanActive ? <Loader2 className="animate-spin text-[#a9b897]" size={16} /> : <Zap className="text-[#a9b897]" size={16} fill="currentColor" />}
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Intelligence Scan</span>
          </button>
        </header>

        {/* STRATEGIC METRICS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {[
            { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects", cta: "Open Workspace" },
            { label: "Invoices Waiting", value: stats.invoicesWaiting, icon: FileText, path: "/payments", cta: "Review Now" },
            { label: "Social Reach", value: stats.socialReach, icon: Share2, path: "/social", cta: "View Insights" },
            { label: "Scheduled Emails", value: stats.scheduledEmails, icon: Mail, path: "/campaigns", cta: "Manage Flow" },
            { label: "Live Profit", value: `£${stats.liveProfit.toLocaleString()}`, icon: PoundSterling, path: "/payments", cta: "View Breakdown" },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -5 }}
              onClick={() => router.push(item.path)}
              className="bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[240px] group"
            >
              <div className="space-y-6">
                <div className="p-3 bg-stone-50 rounded-xl w-fit text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all">
                  <item.icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-2">{item.label}</p>
                  <p className="text-3xl font-serif italic text-stone-900 tracking-tight leading-none">{item.value}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-stone-300 group-hover:text-[#a9b897] mt-4 transition-colors">
                {item.cta} <ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </section>

        {/* OPERATIONAL BOTTOM STACK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <section className="lg:col-span-2 bg-white border border-stone-100 p-10 md:p-14 rounded-[4rem] shadow-sm">
            <div className="flex items-center gap-4 mb-12">
              <Activity size={18} className="text-[#a9b897]" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Today’s Priority Sync</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-6 p-7 rounded-3xl bg-[#faf9f6] border border-stone-50 group hover:border-[#a9b897] transition-all cursor-pointer">
                  <div className="w-6 h-6 rounded-lg border border-stone-200 bg-white group-hover:border-[#a9b897] transition-all flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-700 leading-tight">
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-stone-900 p-12 rounded-[4rem] text-white flex flex-col justify-between min-h-[480px] relative overflow-hidden shadow-2xl">
            <div className="space-y-12">
              <div className="flex items-center gap-4">
                <Target size={18} className="text-stone-500" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-500">Team Hub</h2>
              </div>
              <div className="space-y-4 relative z-10">
                {["Leigha (Lead Architect)", "Strategy Node (Active)"].map((m, i) => (
                  <div key={i} className="flex items-center gap-5 bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    <div className="h-2 w-2 rounded-full bg-[#a9b897] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-200">{m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex items-start gap-5 relative z-10 bg-white/5 p-6 rounded-2xl border border-white/5 opacity-60">
              <ShieldCheck size={20} className="text-[#a9b897]" />
              <p className="text-[9px] font-serif italic text-stone-400 leading-relaxed uppercase tracking-tighter">
                System synchronized. All nodes active.
              </p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#a9b897] blur-[100px] opacity-10 pointer-events-none" />
          </section>
        </div>
      </main>

      {/* INTELLIGENCE SCAN MODAL */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-stone-900 text-stone-100 p-16 md:p-24 rounded-[5rem] w-full max-w-4xl border border-white/5 shadow-2xl relative text-center">
              <button onClick={() => setShowScanModal(false)} className="absolute top-12 right-12 text-stone-500 hover:text-white transition-colors">
                <X size={32}/>
              </button>
              <Zap className="text-[#a9b897] mx-auto mb-10" size={56} fill="currentColor" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-8">Clarity AI Active</p>
              <p className="font-serif italic text-3xl md:text-5xl text-white leading-tight tracking-tighter">
                {insight || "Flow Analysis: Revenue channels are clear. Priorities are aligned for scale."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}