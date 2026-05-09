"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Sparkles, ArrowRight, Briefcase, 
  X, Loader2, Zap, FileText, Share2, Mail, User as UserIcon, Clock, CheckSquare, DollarSign, Users, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Operator");
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

      if (profile?.full_name) setUserName(profile.full_name);

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
          { id: "1", text: "Sync Ledger with Finance Team", completed: false },
          { id: "2", text: "Optimize Campaign Webhook URLs", completed: false },
          { id: "3", text: "Provision New Seat for CRM Access", completed: false }
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
      setInsight(`Scan Interrupted: ${err.message}`);
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
      <p className="font-serif italic text-stone-400 text-lg">Syncing TOTS OS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[var(--brand-primary)]">
            <div className="flex items-center gap-2">
              <UserIcon size={12} />
              <p className="font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em]">Node: {userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none">Dashboard</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={runClarityScan}
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-white border border-stone-200 px-6 py-4 md:px-8 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer focus-within:border-[var(--brand-primary)]"
        >
          {isScanActive ? <Loader2 className="animate-spin text-[var(--brand-primary)]" size={18} /> : <Sparkles className="text-[var(--brand-primary)]" size={18} />}
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Analysis..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* MODULES GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
          { label: "Invoices Due", value: stats.invoicesDue, icon: FileText, path: "/payments" },
          { label: "Social Stats", value: stats.socialsPending, icon: Share2, path: "/social" },
          { label: "Emails Scheduled", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
          { 
            label: "Current Profit", 
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.currentProfit), 
            icon: DollarSign, 
            path: "/payments" 
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -5 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-200 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer relative flex flex-col justify-between min-h-[220px] md:h-[280px] hover:border-[var(--brand-primary)]/30"
          >
            <div>
              <div className="p-3 md:p-4 bg-stone-50 rounded-xl md:rounded-2xl text-stone-300 group-hover:text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/5 transition-all w-fit mb-4 md:mb-8">
                <item.icon size={24} />
              </div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1 md:mb-2">{item.label}</p>
              <p className="text-3xl md:text-4xl font-serif italic text-stone-900 leading-none truncate">{item.value}</p>
            </div>
            
            <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-300 group-hover:text-stone-900 transition-colors mt-4">
              Access <ArrowRight size={10} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* BOTTOM SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
        {/* CHECKLIST */}
        <section className="bg-white border border-stone-200 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm lg:col-span-2">
          <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 md:mb-8 flex items-center gap-2">
            <CheckSquare size={14} className="text-[var(--brand-primary)]" />
            Synchronized Checklist
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
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide truncate ${todo.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ROSTER */}
        <section className="bg-white border border-stone-200 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 md:mb-8 flex items-center gap-2">
              <Users size={14} className="text-[var(--brand-primary)]" />
              Staff Node Roster
            </h2>
            <div className="space-y-3 md:space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-4 bg-stone-50/75 p-4 md:p-5 rounded-xl md:rounded-2xl border border-stone-200/40">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-stone-900 truncate">{member}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 md:mt-12 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-stone-50 border border-stone-100/50 flex items-center gap-4">
            <ShieldCheck size={18} className="text-[var(--brand-primary)] shrink-0" />
            <p className="text-[8px] md:text-[9px] tracking-wider uppercase font-semibold text-stone-500 leading-relaxed">
              Staff provisioned with data access.
            </p>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-stone-950/40 backdrop-blur-md"
          >
            <div className="bg-[#1c1c1c] text-stone-100 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-4xl border border-[var(--brand-primary)]/20 shadow-2xl relative">
              <button 
                onClick={() => setShowScanModal(false)} 
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-stone-600 hover:text-white transition-colors"
              >
                <X size={20}/>
              </button>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                <Zap className="text-[var(--brand-primary)] shrink-0" size={28} />
                <div className="text-center md:text-left">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-[var(--brand-primary)] mb-2">Scan Node Initiated</p>
                  <p className="font-serif italic text-xl md:text-3xl text-stone-200 leading-tight">
                    {insight || "Analyzing operational flow..."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}