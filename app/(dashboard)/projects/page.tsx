"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, X, Loader2, ChevronRight, Search, 
  Trash2, Activity, StickyNote, AlertCircle, Check, 
  ArrowUpRight, User, Folder, Calendar, Target,
  Sparkles, Filter, MoreHorizontal, LayoutGrid,
  Zap, Globe, Terminal, Hash, Layers, Command,
  ArrowRight, MousePointer2, ExternalLink
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
  assignee_name?: string;
}

interface Note {
  id: string;
  content: string;
  category: string;
  color: string;
  is_urgent: boolean;
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream"); 
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA FLOW ---
  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      // Fetch with explicit error handling to debug those 400 errors
      const [projRes, noteRes, taskRes] = await Promise.all([
        supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false }),
        supabase.from("notes").select("*"),
        supabase.from("project_tasks").select("*")
      ]);

      if (projRes.error) throw projRes.error;
      
      const projectList = projRes.data || [];
      setProjects(projectList);
      
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
      
      setAllNotes(noteRes.data || []);
      setTasks(taskRes.data || []);
      
    } catch (err: any) {
      console.error("Critical Sync Failure:", err);
      toast.error(`Sync Error: ${err.message || "Unauthorized"}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      const currentTeam = team || "internal-org-default";
      setTeamId(currentTeam);
      loadData(currentTeam);
    }
    init();
  }, [loadData]);

  // --- ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from("projects").insert([{ 
        name: projectName.trim(), 
        team_id: teamId,
        status: "Active",
        priority: "Medium"
      }]).select();
      
      if (error) throw error;
      toast.success("Node Initialized");
      setProjectName("");
      setShowCreateModal(false);
      await loadData(teamId); 
    } catch (err) {
      toast.error("Handshake failed. Check table schema.");
    } finally { setIsSyncing(false); }
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
      if (data) {
        setTasks(prev => [...prev, ...data]);
        setNewTaskName("");
        toast.success("Objective Cached");
      }
    } catch (err) {
      toast.error("Failed to write to task stream.");
    }
  };

  const toggleTask = async (task: Task) => {
    const nextStatus = task.status === "Completed" ? "In Progress" : "Completed";
    const { error } = await supabase.from("project_tasks").update({ status: nextStatus }).eq("id", task.id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    }
  };

  const stats = useMemo(() => {
    const projectTasks = tasks.filter(t => t.project_id === selectedProject?.id);
    const completed = projectTasks.filter(t => t.status === "Completed").length;
    return {
      total: projectTasks.length,
      percent: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
      backlog: projectTasks.filter(t => t.status === "Backlog").length
    };
  }, [tasks, selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#0F0F0F] text-stone-200 overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* LEFT PANEL: THE INDEX */}
      <aside className="w-[450px] border-r border-stone-800 flex flex-col bg-[#0F0F0F] relative z-20">
        <div className="p-10 space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black rotate-3">
                <Terminal size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-500">System v4.0</span>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-3 border border-stone-800 rounded-full hover:bg-stone-800 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <h1 className="text-7xl font-serif italic tracking-tighter text-white">Registry</h1>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-emerald-500 transition-colors" size={14} />
              <input 
                placeholder="Query nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 space-y-2 custom-scrollbar pb-10">
          {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full group text-left p-6 rounded-[2rem] transition-all relative overflow-hidden ${
                selectedProject?.id === p.id 
                ? "bg-white text-black" 
                : "hover:bg-stone-900 text-stone-500 hover:text-stone-300"
              }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <p className="text-2xl font-serif italic leading-none">{p.name}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${selectedProject?.id === p.id ? 'text-stone-400' : 'text-stone-700'}`}>
                    ID: {p.id.split('-')[0]}
                  </p>
                </div>
                {selectedProject?.id === p.id && <ArrowUpRight size={18} />}
              </div>
              {selectedProject?.id === p.id && (
                <motion.div 
                  layoutId="active-bg" 
                  className="absolute inset-0 bg-white"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-stone-800 bg-stone-900/20">
          <div className="flex items-center gap-4 text-stone-500">
            <Activity size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Network Latency: 12ms</span>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL: THE WORKSPACE */}
      <main className="flex-1 bg-[#141414] overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {selectedProject ? (
            <motion.div 
              key={selectedProject.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-full p-12 lg:p-24 space-y-20"
            >
              {/* TOP NAV / ACTIONS */}
              <div className="flex justify-between items-center border-b border-stone-800 pb-12">
                <div className="flex gap-10">
                  {["Stream", "Analytics", "Archive"].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                      className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                        activeTab === tab.toLowerCase() ? "text-emerald-400" : "text-stone-600 hover:text-stone-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-colors">
                    <Layers size={14} /> Export Node
                  </button>
                  <button 
                    onClick={async () => {
                      if(confirm("Terminate this environment?")) {
                        await supabase.from("projects").delete().eq("id", selectedProject.id);
                        window.location.reload();
                      }
                    }}
                    className="p-2 text-stone-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* HERO METRICS */}
              <div className="grid grid-cols-12 gap-12">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <h2 className="text-[12vw] lg:text-[10rem] font-serif italic tracking-tighter leading-[0.8] text-white">
                    {selectedProject.name}
                  </h2>
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-[#141414] bg-stone-800 flex items-center justify-center">
                          <User size={14} className="text-stone-500" />
                        </div>
                      ))}
                    </div>
                    <div className="h-px w-20 bg-stone-800" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Active Contributors</span>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-6">
                  <div className="bg-stone-900/50 border border-stone-800 p-8 rounded-[2rem] space-y-4">
                    <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest">Efficiency</p>
                    <p className="text-6xl font-serif italic text-emerald-500">{stats.percent}%</p>
                  </div>
                  <div className="bg-stone-900/50 border border-stone-800 p-8 rounded-[2rem] space-y-4">
                    <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest">Backlog</p>
                    <p className="text-6xl font-serif italic text-white">{stats.backlog}</p>
                  </div>
                </div>
              </div>

              {/* TAB CONTENT: STREAM */}
              {activeTab === "stream" && (
                <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-12 lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">Objective Stream</span>
                      <Filter size={14} className="text-stone-700" />
                    </div>
                    
                    <div className="space-y-2">
                      {tasks.filter(t => t.project_id === selectedProject.id).map(task => (
                        <motion.div 
                          layout
                          key={task.id}
                          className="group flex items-center justify-between p-8 bg-stone-900/30 border border-stone-800/50 rounded-3xl hover:bg-stone-800/40 hover:border-stone-700 transition-all"
                        >
                          <div className="flex items-center gap-8">
                            <button 
                              onClick={() => toggleTask(task)}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                                task.status === "Completed" ? "bg-emerald-500 border-emerald-500" : "border-stone-700"
                              }`}
                            >
                              {task.status === "Completed" && <Check size={12} className="text-black" />}
                            </button>
                            <span className={`text-3xl font-serif italic transition-all ${
                              task.status === "Completed" ? "text-stone-600 line-through opacity-50" : "text-stone-200"
                            }`}>
                              {task.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                            <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-stone-800 rounded-full text-stone-500">
                              {task.priority}
                            </span>
                            <MoreHorizontal size={14} className="text-stone-600" />
                          </div>
                        </motion.div>
                      ))}

                      <div className="pt-8 relative">
                        <input 
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                          placeholder="Inject new objective into stream..."
                          className="w-full bg-transparent border-b border-stone-800 py-6 text-3xl font-serif italic outline-none focus:border-emerald-500 transition-all placeholder:text-stone-800"
                        />
                        <button 
                          onClick={handleAddTask}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-500 hover:scale-125 transition-all"
                        >
                          <ArrowUpRight size={32} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SIDEBAR INTEL */}
                  <div className="col-span-12 lg:col-span-5 space-y-8">
                    <div className="bg-emerald-500 p-12 rounded-[3rem] text-black space-y-12 relative overflow-hidden group">
                      <Zap size={150} className="absolute -bottom-10 -right-10 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
                      <div className="space-y-4 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Recommendation</span>
                        <h3 className="text-4xl font-serif italic leading-tight">Focus on core infrastructure. Backlog is reaching critical mass.</h3>
                      </div>
                      <button className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all relative z-10">
                        Execute Sprint
                      </button>
                    </div>

                    <div className="border border-stone-800 rounded-[3rem] p-12 space-y-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">Vault Fragments</span>
                        <StickyNote size={14} className="text-stone-700" />
                      </div>
                      <div className="space-y-4">
                        {allNotes.filter(n => n.category?.toLowerCase() === selectedProject.name.toLowerCase()).length > 0 ? (
                          allNotes.filter(n => n.category?.toLowerCase() === selectedProject.name.toLowerCase()).map(note => (
                            <div key={note.id} className="p-6 bg-stone-900/30 border border-stone-800 rounded-2xl">
                              <p className="text-lg font-serif italic text-stone-400">"{note.content}"</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center border-2 border-dashed border-stone-900 rounded-3xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-700">No fragments found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-stone-900 rounded-3xl flex items-center justify-center animate-pulse">
                <Box size={30} className="text-stone-700" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-700">Select a Registry Node</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* INITIALIZATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 w-full max-w-xl rounded-[3rem] p-16 shadow-2xl relative z-10 space-y-12 border border-stone-800"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">System Initialization</span>
                <h3 className="text-6xl font-serif italic text-white leading-none">New Node</h3>
              </div>
              
              <div className="space-y-8">
                <input 
                  autoFocus
                  placeholder="Enter node designation..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  className="w-full bg-transparent border-b border-stone-800 py-6 text-4xl font-serif italic outline-none focus:border-emerald-500 transition-all text-white"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={handleCreateProject}
                    disabled={isSyncing || !projectName.trim()}
                    className="flex-1 bg-white text-black py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-500 transition-all disabled:opacity-20 flex items-center justify-center"
                  >
                    {isSyncing ? <Loader2 className="animate-spin" /> : "Initialize Environment"}
                  </button>
                  <button onClick={() => setShowCreateModal(false)} className="px-8 border border-stone-800 rounded-2xl hover:bg-stone-800 transition-colors">
                    <X size={20} />
                  </button>
                </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
      `}} />
    </div>
  );
}

// Sub-component for icons
function Box({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}