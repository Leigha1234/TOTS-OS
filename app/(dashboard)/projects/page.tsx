"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, X, Loader2, Search, Trash2, Activity, 
  Check, ArrowUpRight, User, Target, Sparkles, 
  Filter, MoreHorizontal, Zap, Terminal, Hash, 
  Layers, Command, ArrowRight, Box
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- TYPES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: "Backlog" | "In Progress" | "Completed" | "On Hold";
  priority: "Low" | "Medium" | "High";
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const { data: projData, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("team_id", team)
        .order("created_at", { ascending: false });

      const { data: taskData, error: tError } = await supabase
        .from("project_tasks")
        .select("*");

      if (pError || tError) throw pError || tError;

      setProjects(projData || []);
      setTasks(taskData || []);
      if (projData?.length && !selectedProject) setSelectedProject(projData[0]);
    } catch (err: any) {
      console.error("Sync Error:", err);
      toast.error("Handshake Failed: Registry unreachable.");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(team => {
      const t = team || "internal-org-default";
      setTeamId(t);
      loadData(t);
    });
  }, [loadData]);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    try {
      const { data, error } = await supabase.from("projects").insert([{ 
        name: projectName.trim(), 
        team_id: teamId,
        status: "Active"
      }]).select();
      if (error) throw error;
      setProjectName("");
      setShowCreateModal(false);
      loadData(teamId);
      toast.success("Node Initialized");
    } catch (err) {
      toast.error("Initialization Failed");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !selectedProject) return;
    try {
      const { data, error } = await supabase.from("project_tasks").insert([{
        project_id: selectedProject.id, 
        name: newTaskName.trim(), 
        status: "Backlog", 
        priority: "Medium"
      }]).select();
      if (error) throw error;
      setTasks(prev => [...prev, ...(data || [])]);
      setNewTaskName("");
    } catch (err) {
      toast.error("Task Injection Failed");
    }
  };

  const currentTasks = useMemo(() => 
    tasks.filter(t => t.project_id === selectedProject?.id),
    [tasks, selectedProject]
  );

  const completionRate = useMemo(() => {
    if (!currentTasks.length) return 0;
    const done = currentTasks.filter(t => t.status === "Completed").length;
    return Math.round((done / currentTasks.length) * 100);
  }, [currentTasks]);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-white text-stone-900 font-sans overflow-hidden">
      
      {/* MONOLITH SIDEBAR */}
      <aside className="w-[500px] border-r-[1px] border-stone-100 flex flex-col bg-white z-10">
        <div className="p-12 space-y-16">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-900 flex items-center justify-center text-white rounded-2xl rotate-3">
                <Terminal size={22} />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Environment</p>
                <p className="text-xs font-bold text-stone-900">TOTs OS v4.2</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="group p-4 bg-stone-50 hover:bg-stone-900 hover:text-white rounded-2xl transition-all duration-300"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-baseline gap-2">
              <h1 className="text-8xl font-serif italic tracking-tighter leading-none">Index</h1>
              <span className="text-emerald-500 font-black text-xl">.</span>
            </div>
            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={18} />
              <input 
                placeholder="Search Registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b border-stone-100 py-6 pl-8 text-sm outline-none focus:border-stone-900 transition-all placeholder:text-stone-200"
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-12 space-y-4 custom-scrollbar pb-10">
          {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full group text-left transition-all relative ${
                selectedProject?.id === p.id ? "opacity-100" : "opacity-30 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between py-6">
                <div className="space-y-1">
                  <p className="text-4xl font-serif italic tracking-tight">{p.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Node Cluster: {p.id.slice(0,8)}</p>
                </div>
                {selectedProject?.id === p.id && (
                  <motion.div layoutId="arrow" className="text-emerald-500">
                    <ArrowRight size={24} />
                  </motion.div>
                )}
              </div>
              <div className="h-px bg-stone-100 w-full" />
            </button>
          ))}
        </nav>

        <div className="p-12 border-t border-stone-50 space-y-8 bg-stone-50/30">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Velocity</p>
              <p className="text-5xl font-serif italic leading-none">{completionRate}%</p>
            </div>
            <Activity className="text-emerald-400" size={32} />
          </div>
        </div>
      </aside>

      {/* THE ACTION STREAM */}
      <main className="flex-1 bg-[#F9F8F6] overflow-y-auto relative p-12 lg:p-24">
        <AnimatePresence mode="wait">
          {selectedProject ? (
            <motion.div 
              key={selectedProject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-24"
            >
              {/* HEADER AREA */}
              <header className="flex justify-between items-end border-b border-stone-200/50 pb-16">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Live Environment</span>
                  </div>
                  <h2 className="text-[9vw] font-serif italic tracking-tighter leading-none text-stone-900">
                    {selectedProject.name}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-6 pb-2">
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-[#F9F8F6] bg-stone-200 flex items-center justify-center text-stone-400">
                        <User size={18} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">3 Nodes Connected</p>
                </div>
              </header>

              {/* TASK LIST */}
              <div className="grid grid-cols-12 gap-20">
                <section className="col-span-12 lg:col-span-8 space-y-12">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Task Stream</h3>
                    <Filter size={16} className="text-stone-300" />
                  </div>

                  <div className="space-y-4">
                    {currentTasks.length > 0 ? currentTasks.map(task => (
                      <motion.div 
                        key={task.id}
                        whileHover={{ scale: 1.01 }}
                        className="group flex items-center justify-between p-10 bg-white border border-stone-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500"
                      >
                        <div className="flex items-center gap-8">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.status === "Completed" ? "bg-stone-900 border-stone-900" : "border-stone-100 group-hover:border-stone-900"
                          }`}>
                            {task.status === "Completed" && <Check size={14} className="text-white" />}
                          </div>
                          <span className={`text-4xl font-serif italic leading-none ${
                            task.status === "Completed" ? "text-stone-300 line-through" : "text-stone-800"
                          }`}>
                            {task.name}
                          </span>
                        </div>
                        <ArrowUpRight size={24} className="text-stone-100 group-hover:text-stone-900 transition-colors" />
                      </motion.div>
                    )) : (
                      <div className="py-24 text-center border-2 border-dashed border-stone-200 rounded-[3rem]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">No active objectives detected</p>
                      </div>
                    )}
                  </div>

                  {/* INPUT AREA */}
                  <div className="pt-12 relative group">
                    <input 
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      placeholder="Append to stream..."
                      className="w-full bg-stone-100 border-none py-10 px-10 rounded-[2.5rem] text-4xl font-serif italic outline-none focus:bg-white focus:shadow-2xl transition-all duration-500 placeholder:text-stone-300"
                    />
                    <button 
                      onClick={handleAddTask}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center opacity-0 group-focus-within:opacity-100 transition-all duration-500"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </section>

                {/* SIDEBAR METRICS */}
                <aside className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="bg-stone-900 text-white p-12 rounded-[3rem] space-y-12 relative overflow-hidden group">
                    <Zap size={140} className="absolute -bottom-10 -right-10 text-stone-800 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    <div className="space-y-4 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">System Intel</span>
                      <h4 className="text-4xl font-serif italic leading-tight">Infrastructure running at 100% capacity.</h4>
                    </div>
                    <button className="relative z-10 w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">
                      Sync Core
                    </button>
                  </div>

                  <div className="bg-white border border-stone-100 p-12 rounded-[3rem] space-y-8 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Vault Data</span>
                      <Layers size={16} className="text-stone-200" />
                    </div>
                    <p className="text-2xl font-serif italic text-stone-600 leading-snug">
                      Your historical research has been successfully indexed for this environment.
                    </p>
                  </div>
                </aside>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-200">
              <Box size={80} className="mb-8 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em]">Select Node to Begin</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3.5rem] p-20 shadow-2xl relative z-10 space-y-12"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">New Cluster</span>
                <h3 className="text-7xl font-serif italic tracking-tighter leading-none">Initialize</h3>
              </div>
              <div className="space-y-8">
                <input 
                  autoFocus
                  placeholder="Node Designation..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  className="w-full bg-transparent border-b-2 border-stone-100 py-6 text-5xl font-serif italic outline-none focus:border-stone-900 transition-all text-stone-900"
                />
                <button 
                  onClick={handleCreateProject}
                  disabled={!projectName.trim()}
                  className="w-full bg-stone-900 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-500 transition-all disabled:opacity-10"
                >
                  Create Node
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
      `}} />
    </div>
  );
}