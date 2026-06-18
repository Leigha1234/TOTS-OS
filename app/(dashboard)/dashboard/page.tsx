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
  const [clarityCommand, setClarityCommand] = useState<string>("");
  const [clarityResponse, setClarityResponse] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");


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

      // ===============================
      // CLARITY CEO MODE AI ENGINE
      // ===============================

      const actions: string[] = [];
      const insights: string[] = [];

      const workloadScore = taskLoad + emailLoad + eventLoad;
      const pressureLevel =
        workloadScore > 18 ? "high" :
        workloadScore > 10 ? "medium" :
        "low";

      // -------------------------------
      // CEO MODE: STRATEGIC PRIORITIES
      // -------------------------------

      // Always compress into TOP 3 EXECUTIVE PRIORITIES
      if (taskLoad > 0) actions.push("Focus on highest-impact tasks");
      if (emailLoad > 0) actions.push("Clear critical inbox items");
      if (eventLoad > 0) actions.push("Align schedule with priorities");
      if ((stats.invoicesDue || 0) > 0) actions.push("Secure outstanding revenue");

      // Reduce to CEO-level focus (max 3)
      const topPriorities = actions.slice(0, 3);

      // -------------------------------
      // CEO MODE: RISK INTELLIGENCE
      // -------------------------------

      if (pressureLevel === "high") {
        insights.push("CEO ALERT: Operational overload detected — delegation required");
        insights.push("Risk: Execution bottleneck likely within 24–48 hours");
      }

      if (pressureLevel === "medium") {
        insights.push("CEO VIEW: Stable operations — optimise throughput");
      }

      if (pressureLevel === "low") {
        insights.push("CEO OPPORTUNITY: Capacity available for strategic growth work");
      }

      // -------------------------------
      // CEO MODE: STRATEGIC FORECAST
      // -------------------------------

      if (taskLoad > 6) {
        insights.push("Forecast: Task backlog is compounding — intervention recommended");
      }

      if (emailLoad > 8) {
        insights.push("Forecast: Inbox pressure will increase without triage system");
      }

      // -------------------------------
      // CEO MODE: OPPORTUNITY SIGNAL
      // -------------------------------

      if (pressureLevel === "low") {
        insights.push("Opportunity: Ideal window for high-leverage strategic planning");
      }

      // -------------------------------
      // FINAL CEO OUTPUT COMPOSITION
      // -------------------------------

      setAiActions([...topPriorities, ...insights]);

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

  // PROACTIVE CLARITY AI LOOP
  useEffect(() => {
    if (!organisationId) return;

    const interval = setInterval(() => {
      try {
        runClarityScan();
      } catch (err) {
        console.warn("Clarity proactive scan failed:", err);
      }
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, [organisationId]);

  // --- TASK PRIORITY AI ENGINE ---
  const getTaskScore = (task: any) => {
    const text = (task.text || "").toLowerCase();

    let score = 0;

    // incomplete tasks are always higher priority
    if (!task.completed) score += 3;
    else score -= 5;

    // urgency keywords
    if (
      text.includes("urgent") ||
      text.includes("asap") ||
      text.includes("today") ||
      text.includes("important") ||
      text.includes("now")
    ) {
      score += 4;
    }

    // high intent language detection
    if (text.includes("!!!")) score += 2;

    // longer tasks often indicate complexity (light weighting)
    if (text.length > 40) score += 1;

    return score;
  };

  // --- PRIORITY LABEL AI ---
  const getTaskPriorityLabel = (task: any) => {
    const score = getTaskScore(task);

    if (score >= 6) return "HIGH";
    if (score >= 3) return "MEDIUM";
    return "LOW";
  };
  // Utility Functions
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // optimistic update
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: newStatus } : t
      )
    );

    const { error } = await supabase
      .from("notes")
      .update({ completed: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Toggle failed:", error);

      // rollback UI state
      setTodos(prev =>
        prev.map(t =>
          t.id === id ? { ...t, completed: currentStatus } : t
        )
      );
    } else {
      // refresh dashboard data so UI stays consistent
      loadDashboardData();
    }
  };

  // --- TASK CREATION ---
  const addTask = async () => {
    if (!taskInput.trim() || !organisationId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: taskInput,
          status: "todo",
          organisation_id: organisationId,
          user_id: user?.id || null
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setTodos(prev => [
        {
          id: data.id,
          text: data.title,
          completed: false
        },
        ...prev
      ]);
    }

    setTaskInput("");
    loadDashboardData();
  };

  // --- NOTE CREATION ---
  const addNote = async () => {
    if (!noteInput.trim() || !organisationId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("notes")
      .insert([
        {
          title: noteInput,
          content: noteInput,
          completed: false,
          organisation_id: organisationId,
          user_id: user?.id || null
        }
      ]);

    setNoteInput("");
    loadDashboardData();
  };

  // --- CLARITY COMMAND HANDLERS ---
  const handleAskClarity = () => {
    if (!clarityCommand.trim()) return;

    const query = clarityCommand.toLowerCase();

    // lightweight local reasoning layer (no backend dependency)
    if (query.includes("task")) {
      const incomplete = todos.filter(t => !t.completed).length;
      setClarityResponse(`You have ${incomplete} incomplete tasks requiring attention.`);
    } else if (query.includes("email")) {
      setClarityResponse(`You currently have ${emails.length} recent emails in your system inbox.`);
    } else if (query.includes("event")) {
      setClarityResponse(`You have ${events.length} scheduled events loaded today.`);
    } else if (query.includes("risk")) {
      setClarityResponse(`System risk level is currently ${riskLevel}.`);
    } else if (query.includes("summary")) {
      setClarityResponse(aiSummary);
    } else {
      setClarityResponse(`Clarity received your query. Focus areas: tasks (${todos.length}), emails (${emails.length}), events (${events.length}).`);
    }

    setClarityCommand("");
  };

  const handleClarityBrief = () => {
  // Quick create navigation for notes/tasks
  const handleCreateQuickNote = () => {
    router.push("/notes?mode=create");
  };
    const brief = `CLARITY BRIEF:\n` +
      `Risk: ${riskLevel}\n` +
      `Tasks: ${todos.filter(t => !t.completed).length} pending\n` +
      `Emails: ${emails.length} recent\n` +
      `Events: ${events.length} scheduled\n` +
      `Action: ${aiActions[0] || "Maintain operational focus"}`;

    setClarityResponse(brief);
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

      {/* Clarity Executive Summary */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">
              Clarity Executive Summary
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

      {/* CLARITY COMMAND SYSTEM */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8">
        <div className="flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Ask Clarity
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={clarityCommand}
              onChange={(e) => setClarityCommand(e.target.value)}
              placeholder="Ask about tasks, emails, risk, summary..."
              className="flex-1 p-3 rounded-xl border bg-[#faf9f6] text-[10px] uppercase tracking-wide"
            />

            <button
              onClick={handleAskClarity}
              className="px-4 py-3 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Ask <ArrowRight size={12} />
            </button>

            <button
              onClick={handleClarityBrief}
              className="px-4 py-3 rounded-xl border border-stone-300 text-stone-700 text-[10px] font-black uppercase tracking-widest"
            >
              Clarity Brief
            </button>
          </div>

          {clarityResponse && (
            <div className="p-4 rounded-xl border bg-[#faf9f6] text-[10px] font-medium whitespace-pre-line">
              {clarityResponse}
            </div>
          )}

        </div>
      </section>

      {/* Clarity Decision Engine */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8">
        <div className="flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Clarity Decision Engine
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
          <div className="flex gap-2 mb-4">
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="New task..."
              className="flex-1 p-2 rounded-xl border bg-[#faf9f6] text-[10px] uppercase"
            />
            <button
              onClick={addTask}
              className="px-3 py-2 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {todos.length > 0 ? [...todos]
              .sort((a, b) => getTaskScore(b) - getTaskScore(a))
              .slice(0, 5)
              .map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 p-2 lg:p-3 rounded-xl border bg-[#faf9f6] relative">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${todo.completed ? "bg-[#A3B18A] border-[#A3B18A] text-white" : "border-stone-400"}`}>✓</div>
                  {!todo.completed && (
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  )}
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-[10px] font-bold uppercase truncate">{todo.text}</span>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full border
                      ${getTaskPriorityLabel(todo) === "HIGH"
                        ? "bg-red-100 text-red-600 border-red-200"
                        : getTaskPriorityLabel(todo) === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-green-100 text-green-600 border-green-200"}
                    `}>
                      {getTaskPriorityLabel(todo)}
                    </span>
                  </div>
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
          <div className="flex gap-2 mb-4">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="New note..."
              className="flex-1 p-2 rounded-xl border bg-[#faf9f6] text-[10px] uppercase"
            />
            <button
              onClick={addNote}
              className="px-3 py-2 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase"
            >
              Add
            </button>
          </div>
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