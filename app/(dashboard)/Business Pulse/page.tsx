"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Sparkles, ArrowRight, Briefcase, 
  X, Loader2, Zap, FileText, Share2, Mail, User as UserIcon, Clock, CheckSquare, PoundSterling, Users, ShieldCheck, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("OPERATOR");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesDue: 2, 
    socialsPending: 5, 
    emailsScheduled: 3,
    currentProfit: 18450.00,
  });

  const [teamMembers] = useState<string[]>([
    "Sarah Jenkins (Creative Asset)", 
    "David Miller (Strategy Node)"
  ]);
  
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);

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

      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", team);

      setStats(prev => ({ ...prev, activeProjects: projectCount || 0 }));

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("team_id", team)
        .limit(5);

      if (notesData && notesData.length > 0) {
        setTodos(notesData.map((n: any) => ({
          id: n.id,
          text: n.title || n.content?.substring(0, 40) || "Untitled Protocol",
          completed: false
        })));
      } else {
        setTodos([
          { id: "1", text: "Synchronize Ledger with Finance Node", completed: false },
          { id: "2", text: "Optimize Campaign Webhook Protocols", completed: false },
          { id: "3", text: "Provision New Seat for CRM Infrastructure", completed: false }
        ]);
      }
    } catch (err) {
      console.error("Operational Pulse Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      if (!team) { setLoading(false); return; }
      loadDashboardData(team);
    }
    init();
  }, [loadDashboardData]);

  const runClarityScan = async () => {
    setIsScanActive(true);
    setShowScanModal(true);
    setInsight(null); 
    try {
      const team = await getUserTeam();
      if (!team) throw new Error("No active team session found.");
      const { data, error } = await supabase.functions.invoke('clarity-scan', {
        body: { team_id: team, project_id: null }
      });
      if (error) throw new Error(error.message || "Intelligence Engine Offline");
      setInsight(data.insight);
    } catch (err: any) {
      setInsight(`Scan Interrupted: ${err.message}`);
    } finally {
      setIsScanActive(false);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6 p-6">
      <Loader2 className="animate-spin text-[#a9b897]" size={40} />
      <div className="text-center space-y-2">
        <p className="font-black uppercase tracking-[0.5em] text-[#a9b897] text-[10px]">Syncing TOTS Infrastructure</p>
        <p className="font-serif italic text-stone-400 text-sm">Mapping operational nodes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-16 space-y-12 md:space-y-20 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 md:pb-16 gap-8">
        <div className="space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#a9b897]">
            <div className="flex items-center gap-2">
              <UserIcon size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Active Entity: {userName}</p>
            </div>
            <div className="flex items-center gap-2 border-l border-stone-200 pl-6">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">Operational Pulse</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runClarityScan}
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-stone-900 border border-stone-800 px-10 py-6 rounded-full shadow-2xl hover:bg-stone-800 transition-all cursor-pointer group"
        >
          {isScanActive ? <Loader2 className="animate-spin text-[#a9b897]" size={18} /> : <Zap className="text-[#a9b897] group-hover:fill-[#a9b897]" size={18} />}
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            {isScanActive ? "Running Analysis..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* MODULES GRID (Operational Nodes) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
        {[
          { label: "Active Deployments", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
          { label: "Revenue Nodes Pending", value: stats.invoicesDue, icon: FileText, path: "/payments" },
          { label: "Social Signal Reach", value: stats.socialsPending, icon: Share2, path: "/social" },
          { label: "Outbound Intelligence", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
          { 
            label: "Net Yield Indicator", 
            value: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(stats.currentProfit), 
            icon: PoundSterling, 
            path: "/payments" 
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -8 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-100 p-8 md:p-12 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer relative flex flex-col justify-between min-h-[300px] hover:border-[#a9b897]/40"
          >
            <div>
              <div className="p-4 bg-stone-50 rounded-2xl text-stone-300 group-hover:text-white group-hover:bg-stone-900 transition-all w-fit mb-8">
                <item.icon size={22} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-2">{item.label}</p>
              <p className="text-4xl md:text-5xl font-serif italic text-stone-900 tracking-tight leading-none truncate">{item.value}</p>
            </div>
            
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 group-hover:text-[#a9b897] transition-colors mt-6">
              Access Workspace <ArrowRight size={12} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* BOTTOM SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16 items-start">
        {/* SYNCED CHECKLIST */}
        <section className="bg-white border border-stone-100 p-8 md:p-16 rounded-[4rem] shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 flex items-center gap-3">
              <Activity size={16} className="text-[#a9b897]" />
              Strategic Priority Sync
            </h2>
            <span className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">Protocol: Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {todos.map((todo) => (
              <div 
                key={todo.id} 
                onClick={() => toggleTodo(todo.id)}
                className={`flex items-center gap-6 p-6 md:p-8 rounded-3xl border transition-all cursor-pointer group ${
                  todo.completed 
                    ? "bg-stone-50 border-stone-100 opacity-60" 
                    : "bg-[#faf9f6] border-stone-100 hover:border-[#a9b897] hover:bg-white"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                  todo.completed 
                    ? "bg-stone-900 border-stone-900 text-[#a9b897]" 
                    : "border-stone-200 text-transparent group-hover:border-[#a9b897]"
                }`}>
                  <span className="text-[12px] font-bold">&#10003;</span>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-widest truncate ${todo.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ROSTER */}
        <section className="bg-stone-900 text-white p-8 md:p-16 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[500px]">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-500 mb-12 flex items-center gap-3">
              <Users size={16} className="text-[#a9b897]" />
              Tactical Asset Roster
            </h2>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-5 bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-[#a9b897]/30 transition-all group">
                  <div className="h-2 w-2 rounded-full bg-[#a9b897] group-hover:animate-ping shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-200">{member}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 p-8 rounded-3xl bg-white/5 border border-white/5 flex items-start gap-5">
            <ShieldCheck size={20} className="text-[#a9b897] shrink-0" />
            <div className="space-y-1">
              <p className="text-[9px] tracking-[0.2em] uppercase font-black text-stone-400">Node Permissions</p>
              <p className="text-[10px] font-serif italic text-stone-500 leading-relaxed">
                All tactical assets provisioned with secure infrastructure access.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* SCAN MODAL */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-xl"
          >
            <div className="bg-stone-900 text-stone-100 p-12 md:p-20 rounded-[5rem] w-full max-w-5xl border border-white/5 shadow-2xl relative overflow-hidden">
              <button 
                onClick={() => setShowScanModal(false)} 
                className="absolute top-12 right-12 p-4 text-stone-500 hover:text-white transition-colors"
              >
                <X size={24}/>
              </button>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 relative z-10">
                <div className="p-8 bg-[#a9b897]/10 rounded-[3rem] border border-[#a9b897]/20">
                  <Zap className="text-[#a9b897]" size={40} fill="currentColor" />
                </div>
                <div className="text-center md:text-left space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Intelligence Scan Initiated</p>
                  <p className="font-serif italic text-3xl md:text-5xl text-white leading-tight tracking-tighter">
                    {insight || "Analyzing tactical flow and operational nodes..."}
                  </p>
                </div>
              </div>
              
              {/* Decorative BG element */}
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#a9b897]/5 rounded-full blur-[100px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}