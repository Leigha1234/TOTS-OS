"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole } from "@/lib/permissions";
import { 
  Sparkles, ArrowRight, Briefcase, Activity,
  Plus, X, Loader2, Zap, Globe,
  FileText, Share2, Mail, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -- Dashboard Intelligence Metrics --
  const [stats, setStats] = useState({
    activeProjects: 0,
    invoicesDue: 0,
    socialsPending: 0,
    emailsScheduled: 0
  });

  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (team: string) => {
    try {
      // Fetching real project count
      const { count: projectCount, error: pError } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("team_id", team);

      if (pError) throw pError;

      // Note: For a real dashboard, you would fetch these from your 'invoices', 'posts', and 'campaigns' tables.
      // Mocking the non-existent tables for now to avoid 'table not found' errors.
      setStats({
        activeProjects: projectCount || 0,
        invoicesDue: 2, 
        socialsPending: 8, 
        emailsScheduled: 5 
      });
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();
      
      if (!team) {
        setLoading(false);
        return;
      }

      setTeamId(team);
      setRole(r);
      await loadDashboardData(team);
    }
    init();
  }, [loadDashboardData]);

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight(
        `Ecosystem Analysis: ${stats.activeProjects} active nodes are stable. However, system detects ${stats.invoicesDue} pending financial nodes. Recommend finalizing billing protocols to maintain liquidity.`
      );
      setIsScanActive(false);
    }, 2200);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg">Initializing TOTS OS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Activity size={14} className="animate-pulse" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Central Command</p>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Dashboard</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
        >
          {isScanActive ? <Loader2 className="animate-spin text-[#a9b897]" size={20} /> : <Sparkles className="text-[#a9b897]" size={20} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Scanning..." : "Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* NODE GRID - CLICKABLE METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Nodes", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
          { label: "Invoices Due", value: stats.invoicesDue, icon: FileText, path: "/billing" },
          { label: "Next Socials", value: stats.socialsPending, icon: Share2, path: "/scheduler" },
          { label: "Next Emails", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
        ].map((node) => (
          <motion.div
            key={node.label}
            whileHover={{ y: -5 }}
            onClick={() => router.push(node.path)}
            className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="p-4 bg-stone-50 rounded-2xl text-stone-400 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all w-fit mb-6">
              <node.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">{node.label}</p>
            <p className="text-5xl font-serif italic text-stone-900 leading-none">{node.value}</p>
            <ArrowRight size={16} className="absolute right-10 bottom-10 text-stone-200 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
          </motion.div>
        ))}
      </section>

      {/* INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#1c1c1c] text-stone-100 p-12 rounded-[3.5rem] flex items-center justify-between border border-[#a9b897]/30 shadow-2xl"
          >
            <div className="flex items-center gap-8">
              <Zap className="text-[#a9b897]" size={32} />
              <div className="space-y-1">
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.4em]">Synthetic Analysis</p>
                <p className="font-serif italic text-2xl text-stone-200 max-w-3xl leading-snug">{insight}</p>
              </div>
            </div>
            <button onClick={() => setInsight(null)} className="p-4 text-stone-500 hover:text-white transition-colors">
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 px-2">Rapid Access</h2>
          <div className="space-y-3">
            {["New Project", "New Invoice", "Schedule Content"].map((btn) => (
              <button 
                key={btn}
                className="w-full flex items-center justify-between p-6 bg-white border border-stone-200 rounded-2xl hover:border-[#a9b897] transition-all group"
              >
                <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900">{btn}</span>
                <Plus size={16} className="text-stone-300 group-hover:text-[#a9b897]" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white border border-stone-200 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px]">
             <div className="p-6 bg-stone-50 rounded-full text-stone-200">
                <Layers size={40} />
             </div>
             <div className="space-y-2">
                <h3 className="text-3xl font-serif italic text-stone-800">System Clear</h3>
                <p className="text-sm text-stone-400 max-w-sm mx-auto">All operational nodes are synced with the TOTS OS core. No immediate action required from administrative staff.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}