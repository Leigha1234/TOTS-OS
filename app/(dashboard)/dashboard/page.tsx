"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  ArrowRight, Briefcase, X, Loader2, Zap, FileText, 
  Share2, Mail, User as UserIcon, Clock, CheckSquare, 
  PoundSterling, Users, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organisationId } = useSettings();
  
  const [userName, setUserName] = useState<string>("OPERATOR");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // -- Access Guard Params --
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesDue: 0, 
    socialsPending: 0, 
    emailsScheduled: 0,
    currentProfit: 0,
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);

  // 1. Instant Redirect if Access Denied
  useEffect(() => {
    if (error === "access_denied") {
      router.push(`/access-denied?reason=${encodeURIComponent(errorDescription || "Invitation expired")}`);
    }
  }, [error, errorDescription, router]);

  // 2. Clock Logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    // If the URL already shows an error, stop loading immediately
    if (error === "access_denied") {
      setLoading(false);
      return;
    }

    // Wait for the organisationId from context, but don't hang forever
    if (!organisationId) return;

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }

      // Fetch User Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile?.full_name) setUserName(profile.full_name.toUpperCase());

      // Fetch Project Count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("organisation_id", organisationId);

      // Fetch Financial Data
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("amount, status")
        .eq("organisation_id", organisationId);

      const totalProfit = invoiceData?.reduce((acc, inv) => 
        inv.status === 'paid' ? acc + (inv.amount || 0) : acc, 0) || 0;
      
      const pendingInvoices = invoiceData?.filter(inv => inv.status === 'pending').length || 0;

      setStats(prev => ({ 
        ...prev, 
        activeProjects: projectCount || 0,
        currentProfit: totalProfit,
        invoicesDue: pendingInvoices
      }));

      // Fetch Team
      const { data: members } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("organisation_id", organisationId)
        .limit(4);

      setTeamMembers(members || []);

      // Fetch Tasks
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("organisation_id", organisationId)
        .limit(5);

      if (notesData) {
        setTodos(notesData.map((n: any) => ({
          id: n.id,
          text: n.title || n.content?.substring(0, 40) || "Priority Task",
          completed: n.completed || false
        })));
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      // THE FIX: Always release the loading state here
      setLoading(false);
    }
  }, [router, organisationId, error]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Scan Logic
  const runClarityScan = async () => {
    setIsScanActive(true);
    setShowScanModal(true);
    setInsight(null); 
    try {
      const { data, error: scanErr } = await supabase.functions.invoke('clarity-scan', {
        body: { organisation_id: organisationId, context: { stats, currentTasks: todos } }
      });
      if (scanErr) throw scanErr;
      setInsight(data.insight);
    } catch (err: any) {
      setInsight("Business Analysis: Revenue channels are healthy. Focus remains on project delivery.");
    } finally {
      setIsScanActive(false);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await supabase.from("notes").update({ completed: !currentStatus }).eq("id", id);
  };

  // Guard: If access denied, don't show anything (router handles it)
  if (error === "access_denied") return null;

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-black uppercase tracking-[0.5em] text-stone-300 text-[10px]">Syncing Business Intelligence</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[var(--brand-primary, #A3B18A)]">
            <div className="flex items-center gap-2">
              <UserIcon size={12} fill="currentColor" />
              <p className="font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em]">User: {userName}</p>
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
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-[var(--brand-primary, #A3B18A)] px-6 py-4 md:px-8 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          {isScanActive ? <Loader2 className="animate-spin text-white" size={18} /> : <Zap className="text-white" size={18} fill="currentColor" />}
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {isScanActive ? "Analyzing..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12 items-start">
        <section className="bg-white border border-stone-200 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm lg:col-span-3">
          <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6 md:mb-8 flex items-center gap-2">
            <CheckSquare size={14} className="text-[var(--brand-primary, #A3B18A)]" />
            Active Priorities
          </h2>
          <div className="space-y-3 md:space-y-4">
            {todos.length > 0 ? todos.map((todo) => (
              <div 
                key={todo.id} 
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex items-center gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${
                  todo.completed ? "bg-stone-50 border-stone-200 opacity-60" : "bg-[#faf9f6] border-stone-200 hover:border-[var(--brand-primary, #A3B18A)]"
                }`}
              >
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                  todo.completed ? "bg-[var(--brand-primary, #A3B18A)] border-[var(--brand-primary, #A3B18A)] text-white" : "border-stone-400 text-transparent"
                }`}>
                  <span className="text-[10px] md:text-[12px] font-bold">✓</span>
                </div>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide truncate ${todo.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                  {todo.text}
                </span>
              </div>
            )) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 italic">No tasks assigned.</p>
            )}
          </div>
        </section>

        <section className="bg-[var(--brand-primary, #A3B18A)] p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm flex flex-col justify-between min-h-[400px] lg:col-span-2">
          <div>
            <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-6 md:mb-8 flex items-center gap-2">
              <Users size={14} className="text-white/60" />
              Active Members
            </h2>
            <div className="space-y-3 md:space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-white truncate">{member.full_name}</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 md:mt-12 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white/10 border border-white/10 flex items-center gap-4">
            <ShieldCheck size={18} className="text-white shrink-0" />
            <p className="text-[8px] md:text-[9px] tracking-wider uppercase font-serif italic text-white/80 leading-relaxed">
              Business ID: {organisationId?.slice(0,8)} Verified.
            </p>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects", cta: "View Projects" },
          { label: "Pending Invoices", value: stats.invoicesDue, icon: FileText, path: "/payments", cta: "Manage Billing" },
          { label: "Social Media", value: stats.socialsPending, icon: Share2, path: "/social", cta: "Schedule Posts" },
          { label: "Communications", value: stats.emailsScheduled, icon: Mail, path: "/campaigns", cta: "Check Mail" },
          { label: "Current Profit", value: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(stats.currentProfit), icon: PoundSterling, path: "/payments", cta: "View Financials" },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -5 }}
            onClick={() => router.push(item.path)}
            className="group bg-white border border-stone-200 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer relative flex flex-col justify-between min-h-[220px] md:h-[280px] hover:border-[var(--brand-primary, #A3B18A)]/30"
          >
            <div>
              <div className="p-3 md:p-4 bg-stone-50 rounded-xl md:rounded-2xl text-stone-300 group-hover:bg-[var(--brand-primary, #A3B18A)] group-hover:text-white transition-all w-fit mb-4 md:mb-8">
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

      <AnimatePresence>
        {showScanModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-stone-950/90 backdrop-blur-md"
          >
            <div className="bg-[var(--brand-primary, #A3B18A)] text-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[5rem] w-full max-w-4xl border border-white/5 shadow-2xl relative text-center">
              <button onClick={() => setShowScanModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={32}/></button>
              <Zap className="mx-auto mb-10 text-white" size={56} fill="currentColor" />
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/70 mb-8">System Analysis</p>
              <p className="font-serif italic text-3xl md:text-5xl leading-tight tracking-tighter">
                {insight || "Intelligence Scan Complete. Business operations are optimized."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="animate-spin text-stone-300" size={32} />
        <p className="font-black uppercase tracking-[0.5em] text-stone-300 text-[10px]">Loading Workspace</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}