"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, X, Loader2, Folder, CheckSquare, BarChart3, 
  Layers, Users, Star, Tag, StickyNote, Check, 
  Trash2, Search, Activity, Sparkles, Info, Settings, 
  User, Calendar, MoreHorizontal, ChevronRight,
  ArrowUpRight, AlertCircle, Layout, ListTodo, ClipboardCheck,
  LayoutGrid, Filter, Download, Share2, Clock, Target
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
  due_date?: string;
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

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // --- DATA ENGINE ---
  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const [projRes, noteRes, taskRes] = await Promise.all([
        supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false }),
        supabase.from("notes").select("*"),
        supabase.from("project_tasks").select("*")
      ]);

      if (projRes.error) {
        console.warn("Database structure mismatch or missing table.");
        setProjects([]);
      } else {
        const projectList = projRes.data || [];
        setProjects(projectList);
        if (projectList.length > 0 && !selectedProject) {
          setSelectedProject(projectList[0]);
        }
      }
      
      setAllNotes(noteRes.data || []);
      setTasks(taskRes.data || []);
      
    } catch (err) {
      console.error("Critical System Sync Error:", err);
      toast.error("Database sync failed");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      if (!team) {
        setTeamId("internal-org-default");
        setLoading(false);
        return;
      }
      setTeamId(team);
      loadData(team);
    }
    init();
  }, [loadData]);

  // --- CORE ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) {
        toast.error("Name is required");
        return;
    }

    setIsSyncing(true);
    try {
        const { data, error } = await supabase
            .from("projects")
            .insert([{ 
                name: projectName.trim(), 
                team_id: teamId,
                status: "active",
                priority: "Medium"
            }])
            .select();

        if (error) throw error;

        toast.success("New Project Initialized");
        setProjectName("");
        setShowCreateModal(false);
        await loadData(teamId); 
    } catch (err: any) {
        console.error("Creation Error:", err);
        toast.error("Database Error: Ensure SQL schema is applied.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleAddTask = async (projectId: string) => {
    const name = newTaskName[projectId]?.trim();
    if (!name) return;
    
    try {
      const { data, error } = await supabase.from("project_tasks").insert([{
        project_id: projectId,
        name,
        status: "Backlog",
        priority: "Medium"
      }]).select();

      if (error) throw error;

      setTasks([...tasks, ...data]);
      setNewTaskName({ ...newTaskName, [projectId]: "" });
      toast.success("Task Added");
    } catch (err) {
      toast.error("Failed to add task");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    const { error } = await supabase.from("project_tasks").update({ status: newStatus }).eq("id", taskId);
    if (!error) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all tasks?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
        setProjects(projects.filter(p => p.id !== id));
        setSelectedProject(null);
        toast.success("Project removed");
    }
  };

  // --- LOGIC ---
  const linkedNotes = useMemo(() => {
    if (!selectedProject) return [];
    return allNotes.filter(note => 
      note.category?.toLowerCase() === selectedProject.name?.toLowerCase()
    );
  }, [allNotes, selectedProject]);

  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter(t => t.project_id === selectedProject.id);
  }, [tasks, selectedProject]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === "Completed").length;
    return {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [projectTasks]);

  const downloadReport = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`Project_Ledger_${selectedProject?.name}.pdf`);
  };

  if (!isMounted) return null;
  if (loading) return (
    <div className="h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-stone-300" size={48} />
      <p className="font-serif italic text-stone-400 text-3xl">Synchronizing Project Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1C1917] p-8 lg:p-12 max-w-[1800px] mx-auto overflow-hidden">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.2rem] bg-stone-900 text-white flex items-center justify-center font-black text-lg shadow-2xl">P</div>
            <span className="font-serif italic text-3xl font-bold tracking-tight">Project Environment</span>
          </div>
          <h1 className="text-9xl font-serif italic tracking-tighter leading-none">Projects</h1>
          <div className="flex items-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Database Connected</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-4 bg-stone-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl hover:bg-stone-800 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">New Project</span>
          </button>
          
          <button 
            onClick={downloadReport} 
            className="flex items-center gap-4 bg-white border border-stone-200 px-10 py-6 rounded-[2.5rem] text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm group"
          >
            <Download size={22} className="group-hover:bounce" />
            <span className="text-[11px] font-black uppercase tracking-widest">Export Report</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-20">
        
        {/* SIDEBAR */}
        <aside className="w-full xl:w-96 space-y-12">
          <div className="space-y-8">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                <input 
                    placeholder="Search ledger..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-100/50 border border-stone-200 rounded-[2rem] py-6 pl-16 pr-6 text-sm outline-none focus:bg-white focus:ring-4 ring-stone-900/5 transition-all font-serif italic"
                />
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] px-4">Project Ledger</span>
              <div className="max-h-[600px] overflow-y-auto pr-4 space-y-2 custom-scrollbar">
                {filteredProjects.map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full flex items-center justify-between px-8 py-7 rounded-[2.5rem] text-sm text-left transition-all group relative overflow-hidden ${
                      selectedProject?.id === p.id 
                      ? "bg-white shadow-2xl border border-stone-100 font-bold text-stone-900" 
                      : "text-stone-400 hover:bg-white/40"
                    }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedProject?.id === p.id ? 'bg-stone-900' : 'bg-stone-200'}`} />
                        <span className="truncate max-w-[180px]">{p.name}</span>
                    </div>
                    <ChevronRight size={16} className={`transition-all ${selectedProject?.id === p.id ? "opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-12 bg-stone-900 rounded-[4rem] text-white space-y-10 relative overflow-hidden shadow-2xl">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <Activity size={20} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">System Status</span>
                </div>
                <h4 className="text-4xl font-serif italic leading-tight">Environmental Integrity: Optimal</h4>
             </div>
             <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          </div>
        </aside>

        {/* WORKSPACE */}
        <div className="flex-1 space-y-16" ref={printRef}>
          
          {/* TABS */}
          <div className="flex flex-wrap gap-14 border-b border-stone-200 pb-1">
            {["Overview", "Tasks", "Board", "Vault Links"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`pb-6 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${
                  activeTab === tab.toLowerCase().replace(" ", "-") 
                  ? "text-stone-900" 
                  : "text-stone-300 hover:text-stone-600"
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(" ", "-") && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-stone-900 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* VIEW: OVERVIEW */}
          {activeTab === "overview" && selectedProject && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-20 pt-4">
              <div className="xl:col-span-2 space-y-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-stone-100 p-20 rounded-[5rem] shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                        <span className="px-6 py-2.5 bg-stone-50 rounded-full text-[11px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Live Workspace</span>
                        <button onClick={() => deleteProject(selectedProject.id)} className="p-4 rounded-full hover:bg-red-50 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                    </div>
                    <h2 className="text-[10rem] font-serif italic text-stone-900 mb-10 tracking-tighter leading-none">{selectedProject.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 border-t border-stone-50 pt-20">
                      <div className="bg-stone-50/50 p-10 rounded-[3rem] space-y-4 border border-stone-100/50">
                        <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] block">Completion Factor</span>
                        <p className="text-7xl font-serif italic text-stone-900">{stats.percent}%</p>
                      </div>
                      <div className="bg-stone-50/50 p-10 rounded-[3rem] space-y-4 border border-stone-100/50">
                        <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] block">Tasks Active</span>
                        <p className="text-7xl font-serif italic text-stone-900">{projectTasks.length}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* VAULT SIDEBAR */}
              <div className="space-y-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 text-stone-400">
                    <StickyNote size={20} /> Vault Resources
                </h3>
                <div className="space-y-10">
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={note.id} className="p-12 rounded-[3.5rem] shadow-sm border border-black/5 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" style={{ backgroundColor: note.color }}>
                        <p className="text-3xl font-serif italic text-stone-900 leading-tight mb-10">"{note.content}"</p>
                        <div className="flex items-center justify-between border-t border-black/5 pt-8">
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                            {note.is_urgent && <AlertCircle size={16} className="text-red-500 animate-pulse" />}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-24 border-4 border-dotted border-stone-200 rounded-[5rem] text-center bg-stone-50/30">
                      <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.4em]">No semantic links in Vault</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TASKS */}
          {activeTab === "tasks" && selectedProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-100 p-20 rounded-[5rem] shadow-sm space-y-16">
              <h2 className="text-7xl font-serif italic tracking-tighter px-4">Task Ledger</h2>
              <div className="divide-y divide-stone-100 border-t border-stone-100">
                {projectTasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center py-10 px-10 hover:bg-stone-50/80 rounded-[3rem] transition-all group">
                        <div className="flex items-center gap-10">
                            <button onClick={() => updateTaskStatus(t.id, t.status === 'Completed' ? 'In Progress' : 'Completed')} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${t.status === 'Completed' ? 'bg-stone-900' : 'border-stone-100'}`}>
                                <Check size={18} className={t.status === 'Completed' ? 'text-white' : 'opacity-0'} />
                            </button>
                            <p className={`text-3xl font-serif italic ${t.status === 'Completed' ? 'text-stone-300 line-through' : 'text-stone-800'}`}>{t.name}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-stone-400 border border-stone-200 px-6 py-3 rounded-2xl bg-white shadow-sm">{t.priority}</span>
                    </div>
                ))}
              </div>
              <div className="pt-16 border-t border-stone-100 flex gap-8">
                    <input
                        placeholder="Draft a new project task..."
                        value={newTaskName[selectedProject.id] || ""}
                        onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                        className="flex-1 p-12 bg-stone-50 border border-stone-100 rounded-[3.5rem] outline-none text-4xl font-serif italic focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-200 pl-16 shadow-inner"
                    />
                    <button onClick={() => handleAddTask(selectedProject.id)} className="bg-stone-900 text-white px-16 rounded-[3.5rem] shadow-2xl hover:bg-stone-800 transition-all"><ArrowUpRight size={40} /></button>
              </div>
            </motion.div>
          )}

          {/* VIEW: BOARD */}
          {activeTab === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4 h-[800px]">
                {["Backlog", "In Progress", "Completed"].map((column) => (
                    <div key={column} className="bg-stone-100/40 rounded-[4.5rem] p-12 flex flex-col gap-8 border border-stone-200/50">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-stone-900 px-6">{column}</h3>
                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {projectTasks.filter(t => t.status === column).map(task => (
                                <div key={task.id} className="bg-white p-10 rounded-[3rem] shadow-md border border-stone-100 space-y-6">
                                    <p className="text-2xl font-serif italic leading-tight text-stone-800">{task.name}</p>
                                    <div className="flex justify-between items-center pt-6 border-t border-stone-50">
                                        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100"><User size={12} className="text-stone-300" /></div>
                                        <span className="text-[8px] font-black uppercase text-stone-400 border border-stone-100 px-3 py-1 rounded-lg">{task.priority}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-stone-900/70 backdrop-blur-3xl" />
            <motion.div initial={{ y: 150, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 150, opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-3xl rounded-[7rem] p-24 shadow-2xl relative z-10 space-y-20 overflow-hidden">
              <div className="absolute top-0 right-0 p-20"><button onClick={() => setShowCreateModal(false)} className="text-stone-200 hover:text-stone-900 transition-all"><X size={60}/></button></div>
              <div className="space-y-8">
                <span className="text-[12px] font-black uppercase text-stone-400 tracking-[0.4em]">Protocol 01: Project Initialization</span>
                <h3 className="text-8xl font-serif italic tracking-tighter leading-none text-stone-900">New Project</h3>
              </div>
              <div className="space-y-16">
                <input 
                  autoFocus 
                  placeholder="Enter Project Name..."
                  className="w-full text-6xl font-serif italic outline-none border-b-4 border-stone-50 pb-12 focus:border-stone-900 transition-all placeholder:text-stone-100 bg-transparent"
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <button onClick={handleCreateProject} disabled={isSyncing || !projectName.trim()} className="w-full bg-stone-900 text-white py-14 rounded-full font-black uppercase text-[16px] tracking-[0.7em] shadow-2xl hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-8">
                  {isSyncing ? <Loader2 size={32} className="animate-spin" /> : "Initialize Project"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 20px; }
        input::placeholder { color: #E7E5E4; opacity: 1; }
      `}</style>
    </div>
  );
}