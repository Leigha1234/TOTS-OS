"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, X, Loader2, ChevronRight, Download, Search, 
  Trash2, Activity, StickyNote, AlertCircle, Check, 
  ArrowUpRight, User, Folder, Calendar, Target,
  Sparkles, Filter, MoreHorizontal, LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  const [activeTab, setActiveTab] = useState("overview"); 
  const [loading, setLoading] = useState(true);

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      // Defensive Fetching
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
      
    } catch (err) {
      console.error("System Sync Error:", err);
      toast.error("Database mismatch detected. Run SQL fix.");
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
            status: "active",
            priority: "Medium"
        }]).select();
        if (error) throw error;
        toast.success("Project Initialized");
        setProjectName("");
        setShowCreateModal(false);
        await loadData(teamId); 
    } catch (err) {
        toast.error("Schema Mismatch: Status/Priority columns missing.");
    } finally { setIsSyncing(false); }
  };

  const handleAddTask = async (projectId: string) => {
    const name = newTaskName[projectId]?.trim();
    if (!name) return;
    const { data, error } = await supabase.from("project_tasks").insert([{
      project_id: projectId, name, status: "Backlog", priority: "Medium"
    }]).select();
    if (!error && data) {
      setTasks([...tasks, ...data]);
      setNewTaskName({ ...newTaskName, [projectId]: "" });
      toast.success("Task Logged");
    }
  };

  const stats = useMemo(() => {
    const projectTasks = tasks.filter(t => t.project_id === selectedProject?.id);
    const completed = projectTasks.filter(t => t.status === "Completed").length;
    return {
        total: projectTasks.length,
        percent: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
    };
  }, [tasks, selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1C1917] p-8 lg:p-20 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-stone-200 pb-20 mb-20 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
               <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Environment V3.1</span>
          </div>
          <h1 className="text-[12rem] font-serif italic tracking-tighter leading-[0.8] text-stone-900">
            Projects
          </h1>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Database Live</span>
            </div>
            <span className="text-stone-300 font-serif italic text-xl">System Integrity: 100%</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-6 bg-stone-900 text-white px-12 py-7 rounded-full shadow-2xl hover:bg-stone-800 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">New Environment</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-24">
        
        {/* THE LEDGER (SIDEBAR) */}
        <aside className="col-span-12 lg:col-span-3 space-y-16">
          <div className="space-y-10">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={18} />
                <input 
                    placeholder="Search ledger..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-full py-6 pl-16 pr-6 text-sm outline-none focus:bg-white focus:ring-4 ring-stone-900/5 transition-all font-serif italic text-lg"
                />
            </div>

            <div className="space-y-4">
              <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.4em] px-6">Active Projects</p>
              <nav className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full group flex items-center justify-between px-8 py-7 rounded-[2rem] transition-all relative overflow-hidden ${
                      selectedProject?.id === p.id ? "bg-white shadow-xl border border-stone-100" : "hover:bg-stone-50 text-stone-400"
                    }`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedProject?.id === p.id ? 'bg-stone-900 scale-150' : 'bg-stone-200'}`} />
                        <span className={`text-lg font-serif italic transition-colors ${selectedProject?.id === p.id ? 'text-stone-900' : 'group-hover:text-stone-600'}`}>
                          {p.name}
                        </span>
                    </div>
                    {selectedProject?.id === p.id && <ChevronRight size={14} className="text-stone-900" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* SYSTEM CARD */}
          <div className="p-10 bg-[#1C1917] rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                   <Activity size={16} className="text-stone-500" />
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">System Status</span>
                </div>
                <h4 className="text-3xl font-serif italic leading-tight text-stone-200">Environmental factors are optimal for growth.</h4>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-stone-700/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </div>
        </aside>

        {/* ACTIVE WORKSPACE */}
        <main className="col-span-12 lg:col-span-9 space-y-16" ref={printRef}>
          
          {/* NAVIGATION TABS */}
          <div className="flex gap-16 border-b border-stone-100">
            {["Overview", "Tasks", "Board", "Vault Links"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`pb-8 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${
                  activeTab === tab.toLowerCase().replace(" ", "-") ? "text-stone-900" : "text-stone-300 hover:text-stone-500"
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(" ", "-") && (
                  <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900" />
                )}
              </button>
            ))}
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && selectedProject && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-16">
              <div className="col-span-12 lg:col-span-8 bg-white border border-stone-100 rounded-[4rem] p-16 lg:p-24 shadow-sm relative group overflow-hidden">
                <div className="flex justify-between items-start mb-20 relative z-10">
                   <div className="px-5 py-2 rounded-full border border-stone-100 bg-stone-50 text-[9px] font-black uppercase tracking-widest text-stone-400">
                     Project Focus
                   </div>
                   <button 
                    onClick={() => supabase.from("projects").delete().eq("id", selectedProject.id).then(() => window.location.reload())}
                    className="p-4 rounded-full text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>

                <h2 className="text-[10rem] font-serif italic tracking-tighter leading-none text-stone-900 mb-16">
                  {selectedProject.name}
                </h2>

                <div className="grid grid-cols-2 gap-10 pt-16 border-t border-stone-50">
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Efficiency</p>
                      <p className="text-7xl font-serif italic text-stone-900">{stats.percent}%</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Metric</p>
                      <p className="text-7xl font-serif italic text-stone-900">{stats.total} <span className="text-3xl text-stone-300">Tasks</span></p>
                   </div>
                </div>
              </div>

              {/* VAULT RESOURCES SIDEBAR */}
              <div className="col-span-12 lg:col-span-4 space-y-10">
                <div className="flex items-center gap-4 px-2">
                   <StickyNote size={16} className="text-stone-300" />
                   <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Vault Cache</span>
                </div>
                {allNotes.filter(n => n.category?.toLowerCase() === selectedProject.name.toLowerCase()).length > 0 ? (
                  allNotes.filter(n => n.category?.toLowerCase() === selectedProject.name.toLowerCase()).map((note) => (
                    <div key={note.id} className="p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8 group transition-all hover:shadow-xl" style={{ backgroundColor: note.color + '10' }}>
                       <p className="text-2xl font-serif italic leading-snug text-stone-800">"{note.content}"</p>
                       <div className="flex items-center justify-between pt-6 border-t border-stone-100/50">
                         <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{note.category}</span>
                         {note.is_urgent && <AlertCircle size={14} className="text-red-400" />}
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 border-2 border-dashed border-stone-100 rounded-[3rem] text-center bg-stone-50/30">
                     <p className="text-[9px] font-black uppercase text-stone-200 tracking-widest">No Semantic Links Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: TASKS */}
          {activeTab === "tasks" && selectedProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-100 rounded-[4rem] p-10 lg:p-20 shadow-sm space-y-12">
               <div className="divide-y divide-stone-50">
                 {tasks.filter(t => t.project_id === selectedProject.id).map(task => (
                   <div key={task.id} className="group flex items-center justify-between py-10 px-6 hover:bg-stone-50 transition-all rounded-[2rem]">
                      <div className="flex items-center gap-8">
                        <button 
                          onClick={() => supabase.from("project_tasks").update({ status: task.status === 'Completed' ? 'In Progress' : 'Completed' }).eq("id", task.id).then(() => loadData(teamId!))}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-stone-900 border-stone-900' : 'border-stone-100'}`}
                        >
                           {task.status === 'Completed' && <Check size={16} className="text-white" />}
                        </button>
                        <span className={`text-3xl font-serif italic transition-all ${task.status === 'Completed' ? 'text-stone-300 line-through' : 'text-stone-800'}`}>
                          {task.name}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-4">
                        <span className="text-[8px] font-black uppercase tracking-widest px-4 py-2 bg-white border border-stone-100 rounded-full text-stone-400">
                          {task.priority}
                        </span>
                      </div>
                   </div>
                 ))}
               </div>

               {/* ADD TASK BAR */}
               <div className="pt-10 flex gap-4">
                  <input 
                    placeholder="Capture new task objective..."
                    value={newTaskName[selectedProject.id] || ""}
                    onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                    className="flex-1 bg-stone-50 border border-stone-100 rounded-full p-10 text-3xl font-serif italic outline-none focus:bg-white focus:ring-4 ring-stone-900/5 transition-all"
                  />
                  <button onClick={() => handleAddTask(selectedProject.id)} className="bg-stone-900 text-white px-10 rounded-full shadow-xl hover:scale-105 transition-all active:scale-95">
                    <ArrowUpRight size={24} />
                  </button>
               </div>
            </motion.div>
          )}

          {/* TAB: BOARD */}
          {activeTab === "board" && selectedProject && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {["Backlog", "In Progress", "Completed"].map(col => (
                 <div key={col} className="bg-stone-50/50 border border-stone-100 rounded-[3rem] p-10 space-y-8 min-h-[600px]">
                    <div className="flex items-center justify-between px-4">
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-900">{col}</span>
                       <span className="text-[10px] text-stone-300 font-mono">/0{tasks.filter(t => t.project_id === selectedProject.id && t.status === col).length}</span>
                    </div>
                    <div className="space-y-4">
                      {tasks.filter(t => t.project_id === selectedProject.id && t.status === col).map(task => (
                        <motion.div layoutId={task.id} key={task.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 space-y-6">
                           <p className="text-xl font-serif italic leading-tight text-stone-800">{task.name}</p>
                           <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                              <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300">
                                <User size={12} />
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{task.priority}</span>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </main>
      </div>

    {/* INITIALIZATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-stone-950/40 backdrop-blur-2xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white w-full max-w-2xl rounded-[4rem] p-16 lg:p-24 shadow-2xl relative z-10 space-y-16"
            >
              <div className="space-y-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Protocol Initialization</span>
                <h3 className="text-8xl font-serif italic tracking-tighter text-stone-900">New Project</h3>
              </div>
              
              <div className="space-y-12">
                <input 
                  autoFocus
                  placeholder="Draft project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  className="w-full text-5xl font-serif italic text-center outline-none border-b-2 border-stone-100 pb-8 focus:border-stone-900 transition-all placeholder:text-stone-100 bg-transparent text-stone-900"
                />
                <button 
                  onClick={handleCreateProject}
                  disabled={isSyncing || !projectName.trim()}
                  className="w-full bg-stone-900 text-white py-10 rounded-full font-black uppercase tracking-[0.4em] text-xs shadow-xl hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center"
                >
                  {isSyncing ? <Loader2 className="animate-spin" size={18} /> : "Authorize Environment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Style Replacement */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
      `}} />
    </div>
  );
}