"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import Button from "@/app/components/Button";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe, CheckCircle2, Circle, Eye
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

  // -- Asana-style Views --
  const [activeTab, setActiveTab] = useState("board"); // "board" or "list"
  
  const [form, setForm] = useState({
    name: "",
    customer_id: "",
    status: "To Do", // Added Asana-style workflow state
  });

  const loadData = useCallback(async (teamIdString: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, customers(name)")
        .eq("team_id", teamIdString)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error("Failed to load projects:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const team = await getUserTeam();
        const r = await getUserRole();

        if (!team) {
          setLoading(false);
          return;
        }

        setTeamId(team);
        setRole(r);

        const { data: c } = await supabase
          .from("customers")
          .select("*")
          .eq("team_id", team);

        setCustomers(c || []);
        await loadData(team);
      } catch (err) {
        console.error("Initialization error", err);
        setLoading(false);
      }
    }
    init();
  }, [loadData]);

  const runClarityScan = () => {
    setIsScanActive(true);
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
      name: form.name,
      customer_id: form.customer_id,
      status: form.status,
      team_id: teamId,
    });

    if (error) return alert(error.message);

    await supabase.from("activity").insert({
      team_id: teamId,
      action: `Architecture Deployed: ${form.name}`,
      entity: "project",
    });

    setForm({ name: "", customer_id: "", status: "To Do" });
    loadData(teamId);
  }

  // Update a project's Asana-like state
  async function updateProjectStatus(projectId: string, newStatus: string) {
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", projectId);

    if (error) return alert(error.message);
    if (teamId) loadData(teamId);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Architecture ecosystem...</p>
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
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em]] mb-2">Synthetic Insight</p>
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

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Initial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none appearance-none transition-all cursor-pointer font-medium"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
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

        {/* ASANA-STYLE WORKSPACE */}
        <main className="lg:col-span-8 space-y-8">
          {/* VIEW SWITCHER */}
          <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab("board")} 
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === "board" ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900 bg-transparent"
              }`}
            >
              Kanban View
            </button>
            <button 
              onClick={() => setActiveTab("list")} 
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === "list" ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900 bg-transparent"
              }`}
            >
              List View
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="h-[600px] border-2 border-dashed border-stone-200 rounded-[4rem] flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                <Briefcase size={32} className="text-stone-300" />
              </div>
              <p className="text-stone-400 font-serif italic text-2xl">No architecture nodes detected in current ecosystem.</p>
            </div>
          ) : activeTab === "board" ? (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {["To Do", "In Progress", "Done"].map(statusGroup => (
                <div key={statusGroup} className="bg-stone-50/50 border border-stone-100 p-6 rounded-[2.5rem] min-h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-400">{statusGroup}</h4>
                     <span className="px-3 py-1 bg-white border rounded-full text-[9px] font-bold text-stone-500">
                       {projects.filter(p => p.status === statusGroup).length}
                     </span>
                  </div>
                  
                  <div className="space-y-4 flex-1 flex flex-col">
                    {projects.filter(p => p.status === statusGroup).map(p => (
                      <div 
                        key={p.id} 
                        className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-[200px]"
                      >
                         <div>
                           <span className="text-[8px] tracking-[0.2em] uppercase font-black text-[#a9b897] mb-2 block">
                             {p.customers?.name || "Independent Node"}
                           </span>
                           <h5 className="font-serif italic text-xl text-stone-800 leading-tight">{p.name}</h5>
                         </div>

                         <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                            <select 
                              value={p.status} 
                              onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                              className="text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 border p-1 rounded cursor-pointer outline-none"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                            
                            <a 
                              href={`/projects/${p.id}`} 
                              className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 flex items-center gap-2"
                            >
                               <Eye size={14}/> Open
                            </a>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white border border-stone-100 rounded-[3rem] p-6 shadow-sm divide-y divide-stone-100">
               {projects.map(p => (
                 <div key={p.id} className="py-8 flex justify-between items-center group gap-8">
                   <div className="flex gap-6 items-center">
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all">
                        <Activity size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-serif italic text-stone-900">{p.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">{p.customers?.name || "Independent Node"}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-6">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${
                       p.status === 'Done' ? 'bg-green-50 text-green-600 border border-green-100' :
                       p.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                       'bg-stone-50 text-stone-600 border border-stone-100'
                     }`}>
                       {p.status}
                     </span>
                     
                     <a 
                       href={`/projects/${p.id}`} 
                       className="px-6 py-3 border border-stone-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2"
                     >
                       Connect <ArrowRight size={12}/>
                     </a>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}