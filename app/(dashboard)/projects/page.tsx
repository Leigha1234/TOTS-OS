"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import Button from "@/components/Button";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -- Intelligence States --
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    customer_id: "",
  });

  const loadData = useCallback(async (team: string) => {
    const { data } = await supabase
      .from("projects")
      .select("*, customers(name)")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    setProjects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();

      if (!team) return;

      setTeamId(team);
      setRole(r);

      const { data: c } = await supabase
        .from("customers")
        .select("*")
        .eq("team_id", team);

      setCustomers(c || []);
      loadData(team);
    }
    init();
  }, [loadData]);

  const runClarityScan = () => {
    setIsScanActive(true);
    // Simulation of heuristic analysis
    setTimeout(() => {
      const clientCount = customers.length;
      const projectCount = projects.length;
      setInsight(
        `Architectural Analysis: ${projectCount} active nodes identified across ${clientCount} entities. System detects a high concentration in your newest sector. Consider re-allocating assets to stabilize the pipeline.`
      );
      setIsScanActive(false);
    }, 2200);
  };

  async function createProject() {
    if (!canCreate(role)) return alert("Permission Denied: Administrative clearance required.");
    if (!form.name || !form.customer_id || !teamId) return;

    const { error } = await supabase.from("projects").insert({
      ...form,
      team_id: teamId,
    });

    if (error) return alert(error.message);

    // Internal OS Log
    await supabase.from("activity").insert({
      team_id: teamId,
      action: `Architecture Deployed: ${form.name}`,
      entity: "project",
    });

    setForm({ name: "", customer_id: "" });
    loadData(teamId);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Architecture...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER: TITLE & INTELLIGENCE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Globe size={14} className="animate-pulse" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node Ecosystem</p>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Architecture</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isScanActive ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="animate-spin text-[#a9b897]" size={20} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Sparkles className="text-[#a9b897] group-hover:rotate-12 transition-transform" size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Heuristics..." : "Request Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* CLARITY INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#1c1c1c] text-stone-100 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#a9b897]/30"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-[#a9b897]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#a9b897]/20">
                <Zap className="text-[#a9b897]" size={32} />
              </div>
              <div>
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em] mb-2">Synthetic Insight</p>
                <p className="font-serif italic text-2xl text-stone-200 leading-snug max-w-3xl">{insight}</p>
              </div>
            </div>
            <button 
              onClick={() => setInsight(null)} 
              className="p-3 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"
            >
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* DEPLOYMENT FORM */}
        <aside className="lg:col-span-4">
          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10 sticky top-32">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">Deployment Hub</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initialize New Project Node</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Objective Designation</label>
                <input
                  placeholder="e.g. Project Overclock"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Associated Entity</label>
                <div className="relative">
                  <select
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none appearance-none transition-all cursor-pointer font-medium"
                  >
                    <option value="">Select Entity Node...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Plus size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300" />
                </div>
              </div>

              <Button
                onClick={createProject}
                disabled={!canCreate(role) || !form.name || !form.customer_id}
                className="w-full py-6 rounded-[2rem] flex justify-center items-center gap-4 group shadow-xl bg-stone-900 text-white"
              >
                {canCreate(role) ? (
                  <>
                    <FolderPlus size={20} className="group-hover:scale-110 transition-transform text-[#a9b897]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Commit Deployment</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} className="text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Clearance Inhibited</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* PROJECT GRID */}
        <main className="lg:col-span-8">
          {projects.length === 0 ? (
            <div className="h-[600px] border-2 border-dashed border-stone-200 rounded-[4rem] flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                <Briefcase size={32} className="text-stone-300" />
              </div>
              <p className="text-stone-400 font-serif italic text-2xl">No architecture nodes detected in current ecosystem.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {projects.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  key={p.id} 
                  className="bg-white border border-stone-100 p-12 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:border-[#a9b897]/20 transition-all group flex flex-col justify-between h-[360px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="bg-[#faf9f6] p-5 rounded-[1.5rem] text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all">
                        <Activity size={28} />
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Operational</span>
                      </div>
                    </div>
                    <h3 className="text-4xl font-serif italic text-stone-800 leading-tight group-hover:text-black transition-colors">{p.name}</h3>
                    <p className="text-[11px] text-[#a9b897] uppercase font-black mt-4 tracking-[0.3em]">
                      {p.customers?.name || "Independent Node"}
                    </p>
                  </div>

                  <div className="flex justify-end pt-10 border-t border-stone-50">
                    <a 
                      href={`/projects/${p.id}`} 
                      className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 group-hover:text-stone-900 transition-all"
                    >
                      Connect to Node <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}