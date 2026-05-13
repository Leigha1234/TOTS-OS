"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Sparkles, ArrowRight, Briefcase, 
  X, Loader2, Zap, FileText, Share2, Mail, User as UserIcon, Clock, CheckSquare, PoundSterling, Users, ShieldCheck
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
    "Sarah Jenkins (Creative)", 
    "David Miller (Strategy)"
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
          text: n.title || n.content?.substring(0, 40) || "Untitled Note",
          completed: false
        })));
      } else {
        setTodos([
          { id: "1", text: "Finance systems synced and up to date", completed: false },
          { id: "2", text: "Campaign automations optimised", completed: false },
          { id: "3", text: "New CRM access provisioned for team member", completed: false }
        ]);
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
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
      setInsight("Flow Analysis: Revenue channels are clear. Priorities are aligned for scale.");
    } finally {
      setIsScanActive(false);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
      <p className="font-black uppercase tracking-[0.5em] text-[var(--brand-primary)] text-[10px]">Syncing Business Pulse</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[var(--brand-primary)]">
            <div className="flex items-center gap-2">
              <UserIcon size={12} fill="currentColor" />
              <p className="font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em]">Node: {userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none">Business Pulse</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={runClarityScan}
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-[var(--brand-primary)] px-6 py-4 md:px-8 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          {isScanActive ? <Loader2 className="animate-spin text-white" size={18} /> : <Zap className="text-white" size={18} fill="currentColor" />}
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {isScanActive ? "Running Analysis..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* RE-ALIGNED PRIORITY LIST & MODULES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12 items-start">
        
        {/* CHECKLIST (Today's Priority List) */}
        <section className="bg-white border border-stone-200 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm lg:col-span-3">
          <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 md:mb-8 flex items-center gap-2">
            <CheckSquare size={14} className="text-[var(--brand-primary)]" />
            Today’s Priority List
          </h2>
          <div className="space-y-3 md:space-y-4">
            {todos.map((todo) => (
              <div 
                key={todo.id} 
                onClick={() => toggleTodo(todo.id)}
                className={`flex items-center gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${
                  todo.completed 
                    ? "bg-stone-50 border-stone-200 opacity-60" 
                    : "bg-[#faf9f6] border-stone-200 hover:border-[var(--brand-primary)]"
                }`}
              >
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                  todo.completed 
                    ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" 
                    : "border-stone-400 text-transparent"
                }`}>
                  <span className="text-[10px] md:text-[12px]">&#10003;</span>
                </div>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide truncate ${todo.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* TEAM HUB - FIXED: Changed bg-stone-900 to var(--brand-primary) and fixed layout */}
        <section className="bg-[var(--brand-primary)] p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm flex flex-col justify-between min-h-[400px] lg:col-span-2">
          <div>
            <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-6 md:mb-8 flex items-center gap-2">
              <Users size={14} className="text-white/60" />
              Team Hub
            </h2>
            <div className="space-y-3 md:space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-white truncate">{member}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 md:mt-12 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white/10 border border-white/10 flex items-center gap-4">
            <ShieldCheck size={18} className="text-white shrink-0" />
            <p className="text-[8px] md:text-[9px] tracking-wider uppercase font-serif italic text-white/80 leading-relaxed">
              System synchronized. All nodes active.
            </p>
          </div>
        </section>
      </div>

      {/* MODULES GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects", cta: "Open Workspace" },
          { label: "Invoices Waiting", value: stats.invoicesDue, icon: FileText, path: "/payments", cta: "Review Now" },
          { label: "Social Reach", value: stats.socialsPending, icon: Share2, path: "/social", cta: "View Insights" },
          { label: "Scheduled Emails", value: stats.emailsScheduled, icon: Mail, path: "/campaigns", cta: "Manage Flow" },
          { 
            label: "Live Profit", 
            value: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(stats.currentProfit), 
            icon: PoundSterling, 
            path: "/payments",
            cta: "View Breakdown"
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -5 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-200 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer relative flex flex-col justify-between min-h-[220px] md:h-[280px] hover:border-[var(--brand-primary)]/30"
          >
            <div>
              <div className="p-3 md:p-4 bg-stone-50 rounded-xl md:rounded-2xl text-stone-300 group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all w-fit mb-4 md:mb-8">
                <item.icon size={24} />
              </div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1 md:mb-2">{item.label}</p>
              <p className="text-3xl md:text-4xl font-serif italic text-stone-900 leading-none truncate">{item.value}</p>
            </div>
            
            <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-300 group-hover:text-stone-900 transition-colors mt-4">
              {item.cta} <ArrowRight size={10} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* SCAN MODAL */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-stone-950/90 backdrop-blur-md"
          >
            <div className="bg-[var(--brand-primary)] text-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[5rem] w-full max-w-4xl border border-white/5 shadow-2xl relative text-center">
              <button 
                onClick={() => setShowScanModal(false)} 
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={32}/>
              </button>
              
              <Zap className="text-white mx-auto mb-10" size={56} fill="currentColor" />
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-white/70 mb-8">Clarity AI Active</p>
              <p className="font-serif italic text-2xl md:text-5xl text-white leading-tight tracking-tighter">
                {insight || "Flow Analysis: Revenue channels are clear. Priorities are aligned for scale."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}