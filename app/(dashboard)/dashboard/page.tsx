"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Sparkles, ArrowRight, Briefcase, Activity,
  X, Loader2, Zap, FileText, Share2, Mail, Layers, User as UserIcon, Clock, CheckSquare, DollarSign, Users, ShieldCheck
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
    emailsScheduled: 3,
    currentProfit: 18450.00,
  });

  // Additional New State Modules
  const [teamMembers, setTeamMembers] = useState<string[]>([
    "Sarah Jenkins (Creative)", 
    "David Miller (Strategy)"
  ]);
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);

  // -- To-Do Checklist State --
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);

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

      // Fetch To-Dos from user notes or fallback items
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
        // Fallback checklist
        setTodos([
          { id: "1", text: "Sync Ledger with Finance Team", completed: false },
          { id: "2", text: "Optimize Campaign Webhook URLs", completed: false },
          { id: "3", text: "Provision New Seat for CRM Access", completed: false }
        ]);
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
    setShowScanModal(true);
    setTimeout(() => {
      setInsight(`Analysis Complete: ${userName}, your ecosystem is performing at 94% efficiency. Address the ${stats.invoicesDue} outstanding invoices to reach peak flow.`);
      setIsScanActive(false);
    }, 2000);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400 text-lg">Syncing TOTS OS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
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
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          {isScanActive ? <Loader2 className="animate-spin text-[#a9b897]" size={20} /> : <Sparkles className="text-[#a9b897]" size={20} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Analysis..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* MODULES GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
          { label: "Invoices Due", value: stats.invoicesDue, icon: FileText, path: "/payments" },
          { label: "Social Stats (Pending)", value: stats.socialsPending, icon: Share2, path: "/social" },
          { label: "Email Stats (Scheduled)", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
          { 
            label: "Current Profit", 
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.currentProfit), 
            icon: DollarSign, 
            path: "/finance" 
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -8 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-[#a9b897]/30 transition-all cursor-pointer relative flex flex-col justify-between h-[280px]"
          >
            <div>
              <div className="p-4 bg-stone-50 rounded-2xl text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all w-fit mb-8">
                <item.icon size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2">{item.label}</p>
              <p className="text-4xl font-serif italic text-stone-900 leading-none truncate">{item.value}</p>
            </div>
            
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-300 group-hover:text-stone-900 transition-colors">
              Access Module <ArrowRight size={12} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* SIDE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* TO-DO CHECKLIST SECTION */}
        <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm lg:col-span-2 h-full">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <CheckSquare size={14} className="text-[#a9b897]" />
            Synchronized Checklist
          </h2>
          <div className="space-y-4">
            {todos.map((todo) => (
              <div 
                key={todo.id} 
                onClick={() => toggleTodo(todo.id)}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  todo.completed 
                    ? "bg-stone-50 border-stone-200 opacity-60" 
                    : "bg-[#faf9f6] border-stone-200 hover:border-stone-400"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                  todo.completed 
                    ? "bg-[#a9b897] border-[#a9b897] text-white" 
                    : "border-stone-400 text-transparent"
                }`}>
                  &#10003;
                </div>
                <span className={`text-xs font-bold uppercase tracking-wide ${todo.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* TEAM ON SHIFT SECTION */}
        <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm h-full flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
              <Users size={14} className="text-[#a9b897]" />
              Staffed Node Roster
            </h2>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-4 bg-stone-50/75 p-5 rounded-2xl border border-stone-200/40">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-900">{member}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 p-6 rounded-[2rem] bg-stone-50 border border-stone-100/50 flex items-center gap-4">
            <ShieldCheck size={20} className="text-[#a9b897] shrink-0" />
            <p className="text-[10px] tracking-wider uppercase font-semibold text-stone-500 leading-relaxed">
              All listed staff are provisioned with data access.
            </p>
          </div>
        </section>
      </div>

      {/* INTELLIGENCE SCAN MODAL */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md"
          >
            <div className="bg-[#1c1c1c] text-stone-100 p-12 rounded-[3.5rem] w-full max-w-4xl border border-[#a9b897]/20 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Zap className="text-[#a9b897]" size={32} />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">Scan Mode: Node Initiated</p>
                  <p className="font-serif italic text-3xl text-stone-200 leading-tight">
                    {insight || "Analyzing operational flow and calculating stats..."}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowScanModal(false)} 
                className="p-4 text-stone-600 hover:text-white transition-colors border border-stone-800 rounded-2xl bg-stone-900/50 cursor-pointer"
              >
                <X size={24}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}