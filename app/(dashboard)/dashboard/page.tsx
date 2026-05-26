"use client";


import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  ArrowRight, Briefcase, X, Loader2, Zap, FileText, 
  Share2, Mail, User as UserIcon, Clock, CheckSquare, 
  PoundSterling, Users, ShieldCheck, BarChart3, TrendingUp,
  AlertCircle, Settings, LogOut, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



/**
 * DashboardContent Component
 * * This component acts as the primary hub for the application.
 * It is designed to be highly resilient against auth-flicker
 * and handles data fetching with a strict singleton pattern.
 */
function DashboardContent() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organisationId } = useSettings();
  const supabase = getBrowserClient();
  
  // State Management
  const [userName, setUserName] = useState<string>("USER");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanActive, setIsScanActive] = useState<boolean>(false);
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [insight, setInsight] = useState<string | null>(null);

  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesDue: 0, 
    socialsPending: 0, 
    emailsScheduled: 0,
    currentProfit: 0,
  });

  const [teamMembers, setTeamMembers] = useState<{full_name: string, role: string}[]>([]);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Fetching: Centralized with Error Handling
  const loadDashboardData = useCallback(async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch Profile Data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setUserName(profile.full_name.toUpperCase());
      }

      // Guard for Missing OrgID - critical to prevent unauthorized 403s
      if (!organisationId || organisationId === "undefined") {
        console.warn("Dashboard: No valid organisationId found. Skipping data fetch.");
        setLoading(false);
        return; 
      }

      // Fetch Business Data in Parallel for Performance
      const [projectsRes, invoicesRes, membersRes, notesRes] = await Promise.all([
        supabase.from("projects").select("*", { count: 'exact', head: true }).eq("organisation_id", organisationId),
        supabase.from("invoices").select("amount, status").eq("organisation_id", organisationId),
        supabase.from("profiles").select("full_name, role").eq("organisation_id", organisationId).limit(4),
        supabase.from("notes").select("id, title, content, completed").eq("organisation_id", organisationId).limit(5)
      ]);

      // Logic calculations
      const invData = (invoicesRes.data as any[]) || [];
      const totalProfit = invData.reduce((acc, inv) => inv.status === 'paid' ? acc + (inv.amount || 0) : acc, 0);
      const pendingCount = invData.filter(inv => inv.status === 'pending').length;

      setStats({ 
        activeProjects: projectsRes.count || 0,
        currentProfit: totalProfit,
        invoicesDue: pendingCount,
        socialsPending: 0,
        emailsScheduled: 0
      });

      setTeamMembers((membersRes.data as any[]) || []);
      setTodos(((notesRes.data as any[]) || []).map((n: any) => ({
        id: n.id,
        text: n.title || n.content?.substring(0, 40) || "Priority Task",
        completed: n.completed || false
      })));

    } catch (err) {
      console.error("Dashboard Sync Critical Error:", err);
    } finally {
      setLoading(false);
    }
  }, [router, organisationId, supabase]);

  // Initial Load Trigger
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Utility Functions
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await supabase?.from("notes").update({ completed: !currentStatus }).eq("id", id);
  };

  const runClarityScan = async () => {
    if (!organisationId || !supabase) return;
    setIsScanActive(true);
    setShowScanModal(true);
    try {
      const { data, error: scanErr } = await supabase.functions.invoke('clarity-scan', {
        body: { organisation_id: organisationId, context: { stats, currentTasks: todos } }
      });
      if (scanErr) throw scanErr;
      setInsight(data.insight);
    } catch (err) {
      setInsight("Business Analysis: Revenue channels are healthy. Focus remains on project delivery.");
    } finally {
      setIsScanActive(false);
    }
    
  };

  // UI States
  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-black uppercase tracking-[0.5em] text-stone-300 text-[10px]">Syncing Business Intelligence</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[#A3B18A]">
            <UserIcon size={12} fill="currentColor" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">User: {userName}</p>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter">Dashboard</h1>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={runClarityScan}
          className="bg-stone-900 px-8 py-5 rounded-[2rem] shadow-xl flex items-center gap-4 text-white"
        >
          {isScanActive ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="text-[#A3B18A]" fill="currentColor" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Scan</span>
        </motion.button>
      </header>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Priorities Section */}
        <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] lg:col-span-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <CheckSquare size={14} className="text-[#A3B18A]" /> Active Priorities
          </h2>
          <div className="space-y-4">
            {todos.length > 0 ? todos.map((todo) => (
              <div 
                key={todo.id} 
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  todo.completed ? "bg-stone-50 opacity-60" : "bg-[#faf9f6] hover:border-[#A3B18A]"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${todo.completed ? "bg-[#A3B18A] border-[#A3B18A] text-white" : "border-stone-400"}`}>
                  ✓
                </div>
                <span className={`text-xs font-bold uppercase ${todo.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                  {todo.text}
                </span>
              </div>
            )) : <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">No tasks assigned.</p>}
          </div>
        </section>

        {/* Team/Sidebar Section */}
        <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] lg:col-span-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <Users size={14} className="text-[#A3B18A]" /> Team Status
          </h2>
          <div className="space-y-4">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex justify-between p-5 bg-[#faf9f6] rounded-2xl">
                <span className="text-xs font-bold text-stone-800">{member.full_name}</span>
                <span className="text-[8px] uppercase tracking-widest text-stone-400">{member.role}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Financial Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Projects", val: stats.activeProjects, icon: Briefcase },
          { label: "Pending", val: stats.invoicesDue, icon: FileText },
          { label: "Profit", val: stats.currentProfit, icon: PoundSterling },
          { label: "Analytics", val: "88%", icon: TrendingUp },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm flex flex-col gap-4">
            <item.icon className="text-[#A3B18A]" size={24} />
            <p className="text-[10px] font-black uppercase text-stone-400">{item.label}</p>
            <p className="text-3xl font-serif italic">{item.val}</p>
          </div>
        ))}
      </section>

      {/* Footer/Navigation Bar */}
      <footer className="border-t border-stone-200 pt-12 flex justify-between items-center text-stone-400">
        <p className="text-[10px] uppercase tracking-widest">© 2026 Enterprise OS</p>
        <button onClick={() => router.push('/settings')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-stone-900">
          Account Settings <Settings size={12} />
        </button>
      </footer>
    </div>
  );
}
export default function DashboardPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    async function checkInit() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Poll the DB for the profile. 
      // If organisation_id is null, it's still initializing via the SQL trigger.
      let retries = 0;
      while (retries < 10) { // Increased retries slightly for safety
        const { data: profile } = await supabase
          .from('profiles')
          .select('organisation_id')
          .eq('id', user.id)
          .single();

        if (profile?.organisation_id) {
          setIsInitializing(false);
          break;
        }
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        retries++;
      }
      setIsInitializing(false); // Stop waiting even if null after retries
    }
    checkInit();
  }, [supabase]);

  if (isInitializing) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#faf9f6]">
      <Loader2 className="animate-spin text-[#A3B18A]" size={32} />
      <p className="font-black uppercase tracking-[0.4em] text-[10px] text-stone-400">Initializing Workspace Nodes...</p>
    </div>
  );

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}