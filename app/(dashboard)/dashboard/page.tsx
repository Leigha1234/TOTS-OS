"use client";


import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  ArrowRight, Briefcase, X, Loader2, Zap, FileText, 
  Share2, Mail, User as UserIcon, Clock, CheckSquare, 
  PoundSterling, Users, ShieldCheck, BarChart3, TrendingUp,
  AlertCircle, Settings, LogOut, ChevronRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ClarityFloatingButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-6 z-40 h-12 w-12 rounded-full bg-stone-900 text-white shadow-xl flex items-center justify-center hover:scale-105 transition"
      aria-label="Open Clarity"
    >
      <Sparkles size={18} />
    </button>
  );
}



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
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; status?: string }[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [clarityCommand, setClarityCommand] = useState<string>("");
  const [clarityResponse, setClarityResponse] = useState<string | null>(null);
  const [clarityStreaming, setClarityStreaming] = useState(false);
  const [clarityChatId, setClarityChatId] = useState<string | null>(null);
  const [clarityMessages, setClarityMessages] = useState<
    { id?: string; role: "user" | "assistant"; content: string; created_at?: string }[]
  >([]);
  const [clarityChats, setClarityChats] = useState<any[]>([]);
  const [clarityMemory, setClarityMemory] = useState<any[]>([]);
  const loadClarityChats = async () => {
    if (!organisationId) return;

    const { data, error } = await supabase
      .from("clarity_chats")
      .select("id, title, created_at")
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false });

    if (!error) {
      setClarityChats(data || []);
    }
  };

  const loadClarityMessages = async (chatId: string) => {
    if (!chatId) return;

    const { data, error } = await supabase
      .from("clarity_messages")
      .select("id, role, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!error) {
      setClarityMessages(data || []);
    }
  };

  const loadClarityMemory = async () => {
    if (!organisationId) return;

    const { data, error } = await supabase
      .from("clarity_memory")
      .select("id, memory, created_at")
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setClarityMemory(data || []);
  };

  const startNewClarityChat = async () => {
    if (!organisationId) return;

    const { data, error } = await supabase
      .from("clarity_chats")
      .insert({
        organisation_id: organisationId,
        title: "New Clarity Conversation"
      })
      .select()
      .single();

    if (!error && data) {
      setClarityChatId(data.id);
      localStorage.setItem("clarity_active_chat", data.id);
      setClarityMessages([]);
      setClarityResponse(null);
      loadClarityChats();
    }
  };
  const [showClarityWidget, setShowClarityWidget] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [taskInput, setTaskInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");
  // Phase 5: Kernel event stream (runtime feed)
  const [eventStream, setEventStream] = useState<any[]>([]);
  // Phase 7: Clarity proactive notifications
  const [clarityNotifications, setClarityNotifications] = useState<string[]>([]);

  // ===============================
  // EVENT SYSTEM (STANDARDISED MODEL)
  // ===============================
  const normaliseEvent = (e: any) => {
    const raw =
      e?.start_at ||
      e?.start_date ||
      e?.start_time ||
      e?.start ||
      e?.date ||
      e?.created_at ||
      e?.payload?.new?.start_at ||
      e?.payload?.new?.start_date;

    return {
      id: e?.id || e?.payload?.new?.id,
      title: e?.title || e?.payload?.new?.title || "Event",
      startAt: raw ? new Date(raw) : null,
      endAt: e?.end_at || e?.payload?.new?.end_at
        ? new Date(e?.end_at || e?.payload?.new?.end_at)
        : null,
    };
  };


  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Fetching: Centralised with Error Handling
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
        .select("full_name, organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setUserName(profile.full_name.toUpperCase());
      }

      const activeOrganisationId = organisationId || profile?.organisation_id;
      console.log("ORG CHECK", {
  settingsOrg: organisationId,
  profileOrg: profile?.organisation_id,
  activeOrg: activeOrganisationId
});

      // Guard for Missing OrgID - critical to prevent unauthorized 403s
      if (!activeOrganisationId || activeOrganisationId === "undefined") {
        console.warn("Dashboard: No valid organisationId found. Skipping data fetch.");
        setLoading(false);
        return;
      }

      // Fetch Business Data in Parallel for Performance
      const [projectsRes, invoicesRes, membersRes, notesRes, eventsRes, emailsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, status")
          .eq("organisation_id", activeOrganisationId)
          .limit(5),

        supabase
          .from("invoices")
          .select("amount, status")
          .eq("organisation_id", activeOrganisationId),

        supabase
          .from("profiles")
          .select("full_name, role")
          .eq("organisation_id", activeOrganisationId)
          .limit(4),

        supabase
          .from("notes")
          .select("id, content, completed, status, type")
          .eq("organisation_id", activeOrganisationId)
          .order("created_at", { ascending: false }),

        supabase
          .from("events")
          .select("*")
          .eq("organisation_id", activeOrganisationId)
          .limit(5),

        supabase
          .from("emails")
          .select("*")
          .eq("organisation_id", activeOrganisationId)
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      console.log("Dashboard Results", {
  projects: projectsRes.data,
  notes: notesRes.data,
  projectError: projectsRes.error,
  notesError: notesRes.error,
});

      // Logic calculations
      const invData = (invoicesRes.data as any[]) || [];
      const totalProfit = invData.reduce((acc, inv) => inv.status === 'paid' ? acc + (inv.amount || 0) : acc, 0);
      const pendingCount = invData.filter(inv => inv.status === 'pending').length;

      setStats({ 
        activeProjects: (projectsRes.data || []).length,
        currentProfit: totalProfit,
        invoicesDue: pendingCount,
        socialsPending: 0,
        emailsScheduled: 0
      });

      setTeamMembers((membersRes.data as any[]) || []);
      setNotes((notesRes.data as any[]) || []);
      const normaliseStatus = (n: any) => {
        if (n.completed) return "done";
        if (!n.status) return "todo";

        const s = String(n.status).toLowerCase().trim();

        if (["todo", "in_progress", "blocked", "done"].includes(s)) {
          return s;
        }

        return "todo";
      };

      setTodos(((notesRes.data as any[]) || [])
  .filter((n: any) => {
    const type = String(n.type || "").toLowerCase();
    return type === "task" || type === "todo";
  })
  .map((n: any) => ({
    id: n.id,
    text: n.content || n.title || "Untitled Task",
    completed: Boolean(n.completed),
    status: normaliseStatus(n),
  }))
);
        
      setEvents(((eventsRes.data as any[]) || []).map(normaliseEvent));
      setEmails((emailsRes.data as any[]) || []);
      setProjects((projectsRes.data as any[]) || []);

      // EXECUTIVE ANALYSIS LOGIC
      const emailLoad = (emailsRes.data || []).length;
      const eventLoad = (eventsRes.data || []).length;
      const taskLoad = (notesRes.data || []).filter((n: any) => n.type === "task" && !n.completed).length;

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

      const notifications: string[] = [];

      if (taskLoad > 5) {
        notifications.push("You have a growing task backlog requiring attention.");
      }

      if (emailLoad > 8) {
        notifications.push("Inbox pressure is increasing. Consider prioritising responses.");
      }

      if (eventLoad > 5) {
        notifications.push("Your calendar is becoming busy. Review upcoming commitments.");
      }

      if (risk === "low") {
        notifications.push("Business operations are stable. Good time for strategic planning.");
      }

      setClarityNotifications(notifications);

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

  // Phase 5: Kernel event stream runtime integration (live activity feed)
  useEffect(() => {
    if (!organisationId || !supabase) return;

    const channel = supabase.channel("dashboard_runtime_events");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        (payload) => {
          setEventStream((prev: any[]) => [
            { type: "note_event", payload, created_at: Date.now() },
            ...prev,
          ].slice(0, 50));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          setEventStream((prev: any[]) => [
            { type: "calendar_event", payload, created_at: Date.now() },
            ...prev,
          ].slice(0, 50));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        (payload) => {
          setEventStream((prev: any[]) => [
            { type: "email_event", payload, created_at: Date.now() },
            ...prev,
          ].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organisationId, supabase]);

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
    return "LOW";
  };
  // Utility Functions
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: newStatus, status: newStatus ? "done" : "todo" } : t
      )
    );

    const { error } = await supabase
      .from("notes")
      .update({
        completed: newStatus,
        status: newStatus ? "done" : "todo"
      })
      .eq("id", id);

    if (error) {
      console.error("Task update failed:", error);

      setTodos(prev =>
        prev.map(t =>
          t.id === id ? { ...t, completed: currentStatus, status: currentStatus ? "done" : "todo" } : t
        )
      );

      return;
    }

    await loadDashboardData();
  };

  // --- TASK CREATION ---
  const addTask = async () => {
    if (!taskInput.trim() || !organisationId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
     .from("notes")
      .insert([
        {
          title: taskInput,
          content: taskInput,
          completed: false,
          status: "todo",
          type: "task",
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
          text: data.title || data.content,
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
  const handleAskClarity = async () => {
    if (!clarityCommand.trim()) return;

    if (!clarityChatId) {
      await startNewClarityChat();
    }

    const query = clarityCommand;

    setClarityResponse("Clarity is analysing your business data...");
    setClarityStreaming(true);

    try {
      const { data, error } = await supabase.functions.invoke("clarity-chat", {
        body: {
          message: query,
          context: {
            tasks: todos.filter(t => !t.completed),
            projects,
            events,
            emails,
            notes,
            finance: stats.currentProfit,
            risk: riskLevel,
            aiActions,
            memory: clarityMemory,
          },
        },
      });

      if (error) throw error;

      if (data?.answer) {
        const answer = String(data.answer);

        setClarityResponse("");
        setClarityStreaming(true);

        let current = "";
        for (const character of answer) {
          current += character;
          setClarityResponse(current);
          await new Promise(resolve => setTimeout(resolve, 12));
        }

        setClarityStreaming(false);

        const newMessages: {
          id?: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        }[] = [
          ...clarityMessages,
          {
            role: "user",
            content: query,
          },
          {
            role: "assistant",
            content: answer,
          },
        ];

        setClarityMessages(newMessages);

        if (clarityChatId) {
          await supabase
            .from("clarity_messages")
            .insert([
              { chat_id: clarityChatId, role: "user", content: query },
              { chat_id: clarityChatId, role: "assistant", content: answer }
            ]);

          await supabase
            .from("clarity_memory")
            .insert({
              organisation_id: organisationId,
              memory: `User asked: ${query}. Clarity answered: ${answer}`
            });

          loadClarityMemory();
        }
      } else {
        setClarityResponse("Clarity could not generate a response.");
      }
    } catch (err) {
      console.error("CLARITY AI ERROR:", err);
      setClarityStreaming(false);
      setClarityResponse(
        `Clarity fallback summary:\n\nTasks requiring attention: ${todos.filter(t => !t.completed).length}\nActive projects: ${projects.length}\nUpcoming events: ${events.length}\nTracked revenue: £${stats.currentProfit.toLocaleString("en-GB")}`
      );
    }

    setClarityCommand("");
    setClarityStreaming(false);
  };
  useEffect(() => {
    if (!organisationId) return;

    loadClarityChats();
    loadClarityMemory();

    const savedChatId = localStorage.getItem("clarity_active_chat");

    if (savedChatId) {
      setClarityChatId(savedChatId);
      loadClarityMessages(savedChatId);
    }
  }, [organisationId]);

  const handleClarityBrief = () => {
    // Build formatted daily executive brief using current dashboard state
    const now = new Date();
    const dateStr = now.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
    const incompleteTasks = todos.filter(t => !t.completed);
    const incompleteTaskCount = incompleteTasks.length;
    const incompleteTaskList = incompleteTasks.slice(0, 5).map((t, i) => `  - ${t.text}`).join("\n");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = events
      .filter(e => e.startAt && e.startAt.toDateString() === now.toDateString())
      .map(e => {
        let time = "";
        if (e.startAt) {
          time = " @ " + e.startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return `  - ${e.title}${time}`;
      })
      .join("\n");
    const activeProjects = projects.map((p: any) => `  - ${p.name || p.title || "Project"}`).join("\n");
    const profit = stats.currentProfit;
    const aiSummaryText = aiSummary;
    const aiActionsText = aiActions.length
      ? aiActions.map((a: string) => `  - ${a}`).join("\n")
      : "  - None";
    const brief =
      `CLARITY DAILY EXECUTIVE BRIEF\n\n` +
      `Date: ${dateStr}\n\n` +
      `Risk Level: ${riskLevel.toUpperCase()}\n` +
      `AI Summary: ${aiSummaryText}\n\n` +
      `Incomplete Tasks: ${incompleteTaskCount}\n` +
      (incompleteTaskList ? `Tasks:\n${incompleteTaskList}\n\n` : "") +
      `Today's Events:\n${todayEvents || "  - None"}\n\n` +
      `Recent Emails: ${emails.length}\n\n` +
      `Active Projects:\n${activeProjects || "  - None"}\n\n` +
      `Current Profit: £${profit}\n\n` +
      `AI Priority Actions:\n${aiActionsText}\n`;
    setClarityResponse(brief);
    setShowBriefModal(true);
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
      {/* Floating Clarity Widget Button */}
      <ClarityFloatingButton
        open={showClarityWidget}
        onClick={() => setShowClarityWidget(v => !v)}
      />
      {/* Floating Clarity Widget Popup */}
      {showClarityWidget && (
        <div className="fixed top-24 right-6 z-50 w-80 max-w-[90vw] bg-white border border-stone-200 rounded-2xl shadow-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-stone-800">Clarity</h3>
            <button
              onClick={() => setShowClarityWidget(false)}
              className="p-1 rounded hover:bg-stone-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <button
            onClick={startNewClarityChat}
            className="px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest"
          >
            New Chat
          </button>

          {clarityChats.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1">
              {clarityChats.slice(0, 5).map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setClarityChatId(chat.id);
                    localStorage.setItem("clarity_active_chat", chat.id);
                    loadClarityMessages(chat.id);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[#faf9f6] text-[9px] font-bold uppercase"
                >
                  {chat.title}
                </button>
              ))}
            </div>
          )}

          <input
            value={clarityCommand}
            onChange={e => setClarityCommand(e.target.value)}
            placeholder="Ask Clarity anything about your business..."
            className="p-2 rounded-xl border bg-[#faf9f6] text-[10px] uppercase tracking-wide"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAskClarity}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Analyse <Sparkles size={12} />
            </button>
            <button
              onClick={handleClarityBrief}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-stone-700 text-[10px] font-black uppercase tracking-widest"
            >
              Daily Brief
            </button>
          </div>
          <button
            onClick={() => router.push('/clarity')}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-[#A3B18A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#7b9462] transition"
          >
            Open Full Clarity
          </button>
          <div className="mb-3 pb-3 border-b">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
              Clarity Memory
            </p>
            {clarityMemory.length > 0 ? (
              clarityMemory.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="mt-2 p-2 rounded-lg bg-[#faf9f6]">
                  <p className="text-[9px] font-bold">
                    {item.memory}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-stone-400 mt-2">
                No saved business memory yet.
              </p>
            )}
          </div>
          <div className="mb-3 pb-3 border-b">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
              Clarity Notifications
            </p>
            {clarityNotifications.length > 0 ? (
              clarityNotifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="mt-2 p-2 rounded-lg bg-[#faf9f6]">
                  <p className="text-[9px] font-bold">
                    {notification}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-stone-400 mt-2">
                No active notifications.
              </p>
            )}
          </div>
          {clarityMessages.length > 0 && (
            <div className="mt-2 p-3 rounded-xl border bg-[#faf9f6] text-[10px] font-medium whitespace-pre-line max-h-64 overflow-y-auto space-y-2">
              {clarityMessages.map((message: any, index: number) => (
                <div
                  key={message.id || index}
                  className={message.role === "user" ? "text-right" : "text-left"}
                >
                  <p className="text-[8px] uppercase tracking-widest text-stone-400 mb-1">
                    {message.role === "user" ? "You" : "Clarity"}
                  </p>
                  <div className="p-2 rounded-lg bg-white border">
                    {message.content}
                  </div>
                </div>
              ))}
              {clarityStreaming && (
                <span className="inline-block animate-pulse">▌</span>
              )}
            </div>
          )}
        </div>
      )}
      {/* Clarity Brief Modal */}
      {showBriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setShowBriefModal(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-stone-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Today's Clarity Brief</h2>
            <div className="whitespace-pre-wrap text-[11px] text-stone-800" style={{ wordBreak: 'break-word' }}>
              {clarityResponse}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-stone-200 pb-8 lg:pb-12 gap-6 lg:gap-8">
        <div className="space-y-5 w-full">
          <div className="flex items-center gap-4 text-[#A3B18A]">
            <UserIcon size={12} fill="currentColor" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">User: {userName}</p>
          </div>

          <div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif italic tracking-tighter break-words">
              Good {currentTime.getHours() < 12 ? "morning" : currentTime.getHours() < 18 ? "afternoon" : "evening"}, {userName}
            </h1>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-stone-400">
              Your business command centre is ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Business Health</p>
              <p className="text-3xl font-serif italic mt-2">
                {riskLevel === "low" ? "92%" : riskLevel === "medium" ? "74%" : "51%"}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">{riskLevel} operational risk</p>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Today's Tasks</p>
              <p className="text-3xl font-serif italic mt-2">{todos.filter(t => !t.completed).length}</p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">requiring attention</p>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Revenue</p>
              <p className="text-3xl font-serif italic mt-2">£{stats.currentProfit.toLocaleString()}</p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">current tracked profit</p>
            </div>
          </div>
        </div>
      </header>

     
      {/* CLARITY DAILY EXECUTIVE BRIEF */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
                Clarity Daily Brief
              </p>
              <h2 className="text-3xl font-serif italic mt-2">
                Today's Business Overview
              </h2>
            </div>

            <button
              onClick={handleClarityBrief}
              className="px-5 py-3 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Open Full Brief
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                AI Summary
              </p>
              <p className="text-sm font-medium mt-3 leading-relaxed">
                {aiSummary || "Clarity is analysing your business activity."}
              </p>
            </div>

            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Priority Actions
              </p>
              <div className="mt-3 space-y-2">
                {aiActions.length > 0 ? (
                  aiActions.slice(0, 3).map((action, index) => (
                    <p key={index} className="text-xs font-medium">
                      {index + 1}. {action}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-stone-400">No actions required.</p>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Today's Activity
              </p>
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium">
                  {events.length} scheduled events
                </p>
                <p className="text-xs font-medium">
                  {emails.length} recent emails
                </p>
                <p className="text-xs font-medium">
                  {todos.filter(t => !t.completed).length} tasks requiring attention
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
              Clarity Recommendation
            </p>
            <p className="text-sm font-medium mt-2">
              {aiActions[0] || "Your business operations are currently stable."}
            </p>
          </div>
        </div>
      </section>

      {/* Clarity Decision Engine */}

      {/* BUSINESS HEALTH INTELLIGENCE */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-10">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Business Health Intelligence
            </p>
            <h2 className="text-3xl font-serif italic mt-2">
              How your business is performing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border p-5 bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Operational Health
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {riskLevel === "low" ? "92%" : riskLevel === "medium" ? "74%" : "51%"}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                {riskLevel} risk level
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Project Delivery
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {stats.activeProjects}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                active projects
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Revenue Position
              </p>
              <p className="text-3xl font-serif italic mt-3">
                £{stats.currentProfit.toLocaleString("en-GB")}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                tracked paid revenue
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Team Activity
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {teamMembers.length}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                active members
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
              Clarity Health Insight
            </p>
            <p className="text-sm font-medium mt-2 leading-relaxed">
              {riskLevel === "high"
                ? "Operational pressure is increasing. Review workload distribution and prioritise critical activities."
                : riskLevel === "medium"
                ? "Business activity is healthy, but prioritisation will help maintain momentum."
                : "Operations are stable. This is a good opportunity to focus on growth and strategic improvements."}
            </p>
          </div>
        </div>
      </section>
      {/* CLARITY PRIORITY ACTION BOARD */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-10">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              CEO Action Board
            </p>
            <h2 className="text-3xl font-serif italic mt-2">
              What needs your attention
            </h2>
          </div>

          <div className="space-y-3">
            {aiActions.length > 0 ? (
              aiActions.slice(0, 5).map((action, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border bg-[#faf9f6]"
                >
                  <div className="h-8 w-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-black">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {action}
                    </p>
                    <p className="text-[10px] text-stone-400 uppercase mt-1">
                      Suggested by Clarity based on current business activity
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (action.toLowerCase().includes("task")) router.push("/notes");
                      else if (action.toLowerCase().includes("email")) router.push("/campaigns");
                      else if (action.toLowerCase().includes("project")) router.push("/projects");
                    }}
                    className="px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest"
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div className="p-5 rounded-2xl border bg-[#faf9f6]">
                <p className="text-xs uppercase text-stone-400">
                  No priority actions detected. Operations are currently stable.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Task Pressure
              </p>
              <p className="text-xl font-serif italic mt-2">
                {todos.filter(t => !t.completed).length} open
              </p>
            </div>

            <div className="p-4 rounded-2xl border">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Inbox Pressure
              </p>
              <p className="text-xl font-serif italic mt-2">
                {emails.length} emails
              </p>
            </div>

            <div className="p-4 rounded-2xl border">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Calendar Load
              </p>
              <p className="text-xl font-serif italic mt-2">
                {events.length} events
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE BUSINESS INSIGHTS */}
      <section className="bg-white border border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-10">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Live Business Insights
            </p>
            <h2 className="text-3xl font-serif italic mt-2">
              Real-time operational signals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Live Activity
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {eventStream.length}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                recent system events
              </p>
            </div>

            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Task Momentum
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {todos.filter(t => t.completed).length}/{todos.length}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                completed tasks
              </p>
            </div>

            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Pipeline Activity
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {projects.length}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                active opportunities
              </p>
            </div>

            <div className="p-5 rounded-2xl border bg-[#faf9f6]">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                AI Status
              </p>
              <p className="text-3xl font-serif italic mt-3">
                {riskLevel === "high" ? "Alert" : riskLevel === "medium" ? "Watch" : "Stable"}
              </p>
              <p className="text-[10px] uppercase text-stone-500 mt-2">
                Clarity monitoring
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
              Latest Clarity Signals
            </p>
            <div className="mt-3 space-y-2">
              {eventStream.length > 0 ? (
                eventStream.slice(0, 5).map((event: any, index: number) => (
                  <p key={index} className="text-xs font-medium">
                    {event.type.replace("_", " ")} detected
                  </p>
                ))
              ) : (
                <p className="text-xs font-medium">
                  Clarity is monitoring your business activity.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-12">

        {/* TASKS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <CheckSquare size={14} className="text-[#A3B18A]" /> To Do List
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="New task..."
              className="flex-1 p-2 rounded-xl border bg-[#faf9f6] text-[10px] uppercase"
            />
            <button
              onClick={addTask}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase"
            >
              Add
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {(["todo", "in_progress", "blocked", "done"] as const).map((status) => (
              <div key={status} className="space-y-2">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                  {status.replace("_", " ")}
                </p>

                {todos.filter(t => t.status === status).length > 0 ? (
                  todos
                    .filter(t => t.status === status)
                    .sort((a, b) => getTaskScore(b) - getTaskScore(a))
                    .slice(0, 6)
                    .map((todo) => (
                      <div key={todo.id} className="flex items-center gap-2 p-2 rounded-xl border bg-[#faf9f6]">
                        <button
                          type="button"
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          className={`w-4 h-4 rounded border flex items-center justify-center ${todo.completed ? "bg-[#A3B18A] border-[#A3B18A] text-white" : "border-stone-400"}`}
                        >
                          ✓
                        </button>

                        <span className="text-[10px] font-bold uppercase truncate">
                          {todo.text}
                        </span>

                        <span className={`ml-auto text-[8px] px-2 py-1 rounded-full border font-bold uppercase ${
                          getTaskPriorityLabel(todo) === "HIGH"
                            ? "bg-red-100 text-red-600 border-red-200"
                            : "bg-green-100 text-green-600 border-green-200"
                        }`}>
                          {getTaskPriorityLabel(todo)}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-[9px] text-stone-400 uppercase">None</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PROJECTS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <Briefcase size={14} className="text-[#A3B18A]" /> Projects
          </h2>
          <div className="space-y-3">
            <p className="text-[10px] uppercase text-stone-400">{stats.activeProjects} active projects</p>
            {projects.length > 0 ? projects.map((project:any) => (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="w-full text-left p-3 rounded-xl border bg-[#faf9f6] hover:bg-stone-100 transition"
              >
                <p className="text-[10px] font-bold uppercase truncate">
                  {project.name || project.title || 'Project'}
                </p>
                <p className="text-[10px] text-stone-400 uppercase">
                  {project.status || 'Active'}
                </p>
              </button>
            )) : (
              <p className="text-[10px] uppercase text-stone-400">No active projects</p>
            )}
          </div>
        </section>

        {/* EVENTS */}
        <section className="bg-white border border-stone-200 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] lg:col-span-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 flex items-center gap-2">
            <Clock size={14} className="text-[#A3B18A]" /> Today’s Events
          </h2>
          <div className="space-y-3">
            {(() => {
              const now = new Date();

              const isToday = (d: Date) =>
                d.toDateString() === now.toDateString();

              const isTomorrow = (d: Date) => {
                const t = new Date();
                t.setDate(now.getDate() + 1);
                return d.toDateString() === t.toDateString();
              };

              const allEvents = events;

              

              const startOfToday = new Date(now);
startOfToday.setHours(0, 0, 0, 0);

const endOfWeek = new Date(now);
endOfWeek.setDate(now.getDate() + 7);
endOfWeek.setHours(23, 59, 59, 999);

const sorted = [...allEvents].sort((a: any, b: any) => {
  const aTime = a.startAt?.getTime?.() ?? Infinity;
  const bTime = b.startAt?.getTime?.() ?? Infinity;
  return aTime - bTime;
});

const todayEvents = sorted.filter(
  e =>
    e.startAt &&
    e.startAt >= startOfToday &&
    e.startAt.toDateString() === now.toDateString()
);

const tomorrowEvents = sorted.filter(e => {
  const t = new Date(now);
  t.setDate(now.getDate() + 1);
  return e.startAt && e.startAt.toDateString() === t.toDateString();
});

const upcomingEvents = sorted.filter(e => {
  return (
    e.startAt &&
    e.startAt > new Date(now.setHours(23, 59, 59, 999)) &&
    e.startAt <= endOfWeek
  );
});

const unscheduledEvents = sorted.filter(e => !e.startAt);

              const renderEvent = (e: any, idx: number) => (
                <div key={idx} className="p-2 lg:p-3 rounded-xl border bg-[#faf9f6]">
                  <p className="text-[10px] font-bold uppercase truncate">
                    {e.title || "Event"}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {e.startAt ? e.startAt.toLocaleString() : "No date set"}
                  </p>
                </div>
              );

              return (
                <>
                  {todayEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">
                        Today
                      </p>
                      {todayEvents.slice(0, 3).map(renderEvent)}
                    </div>
                  )}

                  {tomorrowEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        Tomorrow
                      </p>
                      {tomorrowEvents.slice(0, 3).map(renderEvent)}
                    </div>
                  )}

                  {upcomingEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        Upcoming
                      </p>
                      {upcomingEvents.slice(0, 3).map(renderEvent)}
                    </div>
                  )}

                  {unscheduledEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        Unscheduled
                      </p>
                      {unscheduledEvents.slice(0, 3).map(renderEvent)}
                    </div>
                  )}

                  {todayEvents.length === 0 &&
                    tomorrowEvents.length === 0 &&
                    upcomingEvents.length === 0 &&
                    unscheduledEvents.length === 0 && (
                      <p className="text-[10px] uppercase text-stone-400">
                        No scheduled activity
                      </p>
                    )}
                </>
              );
            })()}
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
          <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
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
            <button
              onClick={() => router.push('/notes')}
              className="px-3 py-2 rounded-xl border text-[10px] font-black uppercase"
            >
              Edit Notes
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-h-[260px] overflow-y-auto pr-1">
            {notes.slice(0, 20).map((note: any) => (
              <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="p-3 lg:p-4 rounded-2xl border bg-[#faf9f6] min-w-0 hover:bg-stone-100 transition cursor-pointer"
              >
                <p className="text-[10px] font-bold uppercase truncate max-w-full">
                  {note.content || note.title || "Untitled Note"}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-stone-400 uppercase">
                    {note.status || "note"}
                  </p>
                </div>
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

    </div>
  );
}
export default function DashboardPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}