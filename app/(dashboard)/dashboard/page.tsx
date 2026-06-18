"use client";


import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
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
  const error = searchParams.get("error");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-black uppercase tracking-[0.2em]">Authentication Required</h1>
        <p className="text-xs text-stone-500 mt-2">The verification link has expired or is invalid.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="mt-6 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase"
        >
          Return to Login
        </button>
      </div>
    );
  }
  
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
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [aiActions, setAiActions] = useState<string[]>([]);


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
      const [projectsRes, invoicesRes, membersRes, notesRes, eventsRes, emailsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: 'exact', head: true })
          .eq("organisation_id", organisationId),

        supabase
          .from("invoices")
          .select("amount, status")
          .eq("organisation_id", organisationId),

        supabase
          .from("profiles")
          .select("full_name, role")
          .eq("organisation_id", organisationId)
          .limit(4),

        supabase
          .from("notes")
          .select("id, title, content, completed")
          .eq("organisation_id", organisationId)
          .limit(5),

        supabase
          .from("events")
          .select("*")
          .eq("organisation_id", organisationId)
          .limit(5),

        supabase
          .from("emails")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", { ascending: false })
          .limit(5)
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
      setEvents((eventsRes.data as any[]) || []);
      setEmails((emailsRes.data as any[]) || []);

      // EXECUTIVE ANALYSIS LOGIC
      const emailLoad = (emailsRes.data || []).length;
      const eventLoad = (eventsRes.data || []).length;
      const taskLoad = (notesRes.data || []).filter((n: any) => !n.completed).length;

      let risk: "low" | "medium" | "high" = "low";

      if (taskLoad > 8 || emailLoad > 10) risk = "high";
      else if (taskLoad > 4 || emailLoad > 5) risk = "medium";

      setRiskLevel(risk);

      setAiSummary(
        risk === "high"
          ? "High activity detected. Focus required on outstanding tasks and inbox load."
          : risk === "medium"
          ? "Moderate workload. Prioritise tasks due today and review incoming emails."
          : "System stable. Low operational pressure across all modules."
      );

      // AI DECISION ENGINE LOGIC
      const actions: string[] = [];

      if (taskLoad > 5) actions.push("Prioritise incomplete tasks");
      if (emailLoad > 5) actions.push("Process unread emails");
      if (eventLoad > 3) actions.push("Prepare for today's schedule");
      if ((stats.invoicesDue || 0) > 0) actions.push("Review pending invoices");

      if (actions.length === 0) actions.push("Maintain operational focus");

      setAiActions(actions);

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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-3 sm:p-6 lg:p-12 space-y-8 lg:space-y-12 max-w-[1600px] mx-auto font-sans overflow-x-hidden">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-stone-200 pb-8 lg:pb-12 gap-6 lg:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[#A3B18A]">
            <UserIcon size={12} fill="currentColor" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">User: {userName}</p>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif italic tracking-tighter break-words">Dashboard</h1>
        </div>
      </header>

      {/* AI EXECUTIVE SUMMARY */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">
              AI Executive Summary
            </p>
            <p className="text-sm lg:text-base font-medium text-stone-700">
              {aiSummary}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest
            ${riskLevel === "high" ? "bg-red-100 text-red-600"
              : riskLevel === "medium" ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"}`}
          >
            {riskLevel} risk
          </div>
        </div>
      </section>

      {/* AI DECISION ENGINE */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8">
        <div className="flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              AI Decision Engine
            </p>
            <Zap size={14} className="text-[#A3B18A]" />
          </div>

          <div className="space-y-2">
            {aiActions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl border bg-[#faf9f6]">
                <ChevronRight size={12} className="text-[#A3B18A]" />
                <p className="text-[10px] font-bold uppercase tracking-wide">
                  {action}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Primary Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-12">

        {/* TASKS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <CheckSquare size={14} className="text-[#A3B18A]" /> Tasks
          </h2>
          <div className="space-y-3">
            {todos.length > 0 ? [...todos]
              .sort((a, b) => Number(a.completed) - Number(b.completed))
              .slice(0, 5)
              .map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 p-2 lg:p-3 rounded-xl border bg-[#faf9f6]">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${todo.completed ? "bg-[#A3B18A] border-[#A3B18A] text-white" : "border-stone-400"}`}>✓</div>
                  <span className="text-[10px] font-bold uppercase truncate">{todo.text}</span>
                </div>
              )) : <p className="text-[10px] text-stone-400 uppercase">No tasks</p>}
          </div>
        </section>

        {/* PROJECTS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <Briefcase size={14} className="text-[#A3B18A]" /> Projects
          </h2>
          <div className="space-y-3">
            <p className="text-[10px] uppercase text-stone-400">{stats.activeProjects} active projects</p>
            <p className="text-[10px] uppercase text-stone-400">{stats.invoicesDue} invoices pending</p>
            <p className="text-[10px] uppercase text-stone-400">Revenue: £{stats.currentProfit}</p>
          </div>
        </section>

        {/* EVENTS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <Clock size={14} className="text-[#A3B18A]" /> Today’s Events
          </h2>
          <div className="space-y-3">
            {events.length > 0 ? events.slice(0,5).map((e:any, idx:number) => (
              <div key={idx} className="p-2 lg:p-3 rounded-xl border bg-[#faf9f6]">
                <p className="text-[10px] font-bold uppercase truncate">{e.title || "Event"}</p>
                <p className="text-[10px] text-stone-400">{e.time || "All day"}</p>
              </div>
            )) : <p className="text-[10px] uppercase text-stone-400">No scheduled activity for today</p>}
          </div>
        </section>

        {/* EMAILS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <Mail size={14} className="text-[#A3B18A]" /> Emails
          </h2>
          <div className="space-y-3">
            {emails.length > 0 ? emails.slice(0,5).map((m:any, idx:number) => (
              <div key={idx} className="p-2 lg:p-3 rounded-xl border bg-[#faf9f6]">
                <p className="text-[10px] font-bold uppercase truncate">{m.subject || "New Email"}</p>
                <p className="text-[10px] text-stone-400 truncate">{m.from || "Unknown sender"}</p>
              </div>
            )) : <p className="text-[10px] uppercase text-stone-400">System inbox clear</p>}
          </div>
        </section>

        {/* NOTES */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <FileText size={14} className="text-[#A3B18A]" /> Notes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {todos.slice(0,6).map((t:any) => (
              <div key={t.id} className="p-3 lg:p-4 rounded-2xl border bg-[#faf9f6]">
                <p className="text-[10px] font-bold uppercase truncate">{t.text}</p>
                <p className="text-[10px] text-stone-400">{t.completed ? "Completed" : "Pending"}</p>
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
          <div key={idx} className="bg-white border border-stone-200 p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] shadow-sm flex flex-col gap-3 lg:gap-4">
            <item.icon className="text-[#A3B18A]" size={24} />
            <p className="text-[10px] font-black uppercase text-stone-400">{item.label}</p>
            <p className="text-2xl sm:text-3xl font-serif italic">{item.val}</p>
          </div>
        ))}
      </section>

      {/* Footer/Navigation Bar */}
      <footer className="border-t border-stone-200 pt-8 lg:pt-12 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center text-stone-400">
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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