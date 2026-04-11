"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import Button from "../../components/Button";
import { 
  Sparkles, Wand2, FolderPlus, ArrowRight, 
  Briefcase, Target, ShieldCheck, Activity,
  Users, Search, Plus, X, Loader2, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -- Clarity Intelligence States --
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    customer_id: "",
  });

  useEffect(() => {
    init();
  }, []);

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
    load(team);
  }

  async function load(team: string) {
    const { data } = await supabase
      .from("projects")
      .select("*, customers(name)")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    setProjects(data || []);
    setLoading(false);
  }

  const runClarityScan = () => {
    setIsScanActive(true);
    // Logic: Analyzes existing project count and customer nodes
    setTimeout(() => {
      const clientCount = customers.length;
      const projectCount = projects.length;
      setInsight(
        `Architectural Scan Complete: You are managing ${projectCount} active nodes across ${clientCount} entities. Clarity suggests auditing the oldest project for potential high-ticket expansion.`
      );
      setIsScanActive(false);
    }, 1800);
  };

  async function createProject() {
    if (!canCreate(role)) return alert("Access restricted: Administrative clearance required.");
    if (!form.name || !form.customer_id || !teamId) return;

    const { error } = await supabase.from("projects").insert({
      ...form,
      team_id: teamId,
    });

    if (error) return alert(error.message);

    // Update Internal OS Logs
    await supabase.from("activity").insert({
      team_id: teamId,
      action: `Deployed Project Architecture: ${form.name}`,
      entity: "project",
    });

    setForm({ name: "", customer_id: "" });
    load(teamId);
  }

  if (loading) return (
    <div className="p-20 bg-[#faf9f6] min-h-screen flex items-center justify-center font-serif italic text-stone-400">
      Synchronizing Project Nodes...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Briefcase size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Operations Management</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter">Architecture</h1>
        </div>

        <button 
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-3 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            {isScanActive ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="animate-spin text-[#a9b897]" size={18} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Sparkles className="text-[#a9b897] group-hover:scale-125 transition-transform" size={18} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-600">
            {isScanActive ? "Scanning Nodes..." : "Clarity Intelligence Scan"}
          </span>
        </button>
      </header>

      {/* CLARITY INTELLIGENCE FEEDBACK */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="bg-[#1c1c1c] text-stone-100 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-[#a9b897]/20"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-stone-800 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="text-[#a9b897]" size={28} />
              </div>
              <div>
                <p className="text-[#a9b897] font-black uppercase text-[8px] tracking-[0.3em] mb-1">Live Insight Synthesis</p>
                <p className="font-serif italic text-xl text-stone-200 leading-relaxed">{insight}</p>
              </div>
            </div>
            <button 
              onClick={() => setInsight(null)} 
              className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors"
            >
              <X size={20}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* SIDEBAR: DEPLOYMENT (4 Cols) */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm space-y-8 sticky top-32">
            <div className="space-y-1">
              <h3 className="text-xl font-serif italic text-stone-800">Deploy Node</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Project Architect</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Project Name</label>
                <input
                  placeholder="e.g. Identity Restoration"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/10 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Assign Entity</label>
                <div className="relative">
                  <select
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/10 outline-none appearance-none transition-all cursor-pointer font-medium"
                  >
                    <option value="">Select client node...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300">
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              <Button
                onClick={createProject}
                disabled={!canCreate(role) || !form.name || !form.customer_id}
                className="w-full py-5 rounded-2xl flex justify-center items-center gap-3 group shadow-xl"
              >
                {canCreate(role) ? (
                  <>
                    <FolderPlus size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Architecture</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clearance Required</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* MAIN: PROJECT GRID (8 Cols) */}
        <div className="lg:col-span-8">
          {projects.length === 0 ? (
            <div className="h-full border-2 border-dashed border-stone-200 rounded-[3rem] flex flex-col items-center justify-center p-20 text-center space-y-4">
              <Briefcase size={40} className="text-stone-200" />
              <p className="text-stone-400 font-serif italic text-xl">No project nodes currently deployed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  key={p.id} 
                  className="bg-white border border-stone-100 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-[#a9b897]/30 transition-all group flex flex-col justify-between h-72"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-[#faf9f6] p-4 rounded-2xl text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all">
                        <Activity size={24} />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Active</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-serif italic text-stone-800 leading-tight group-hover:text-black transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-[0.2em]">
                      {p.customers?.name || "Independent Node"}
                    </p>
                  </div>

                  <div className="flex justify-end pt-8 border-t border-stone-50">
                    <a 
                      href={`/projects/${p.id}`} 
                      className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-[#a9b897] transition-all"
                    >
                      Access Node <ArrowRight size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}