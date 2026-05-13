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

// --- CORE INTERFACES ---
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

interface ProjectMetadata {
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
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI Management States
  const [selectedProject, setSelectedProject] = useState<ProjectMetadata | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // --- DATABASE ENGINE ---
  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      // Attempt to fetch from core tables
      const [projRes, noteRes, taskRes] = await Promise.all([
        supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false }),
        supabase.from("notes").select("*"),
        supabase.from("project_tasks").select("*")
      ]);

      // If projects table is missing (PGRST204), handle gracefully
      if (projRes.error) {
        console.warn("Project fetch error:", projRes.error);
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
      console.error("System Sync Error:", err);
      toast.error("Network error during data sync");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      if (!team) {
        setTeamId("default-internal-team");
        setLoading(false);
        return;
      }
      setTeamId(team);
      loadData(team);
    }
    init();
  }, [loadData]);

  // --- CORE PROJECT ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) {
        toast.error("Please specify a project name");
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
        console.error("Database Error:", err);
        toast.error("Creation failed. Check if SQL schema is applied.");
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
      toast.success("Task updated");
    } catch (err) {
      toast.error("Task creation failed");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase.from("project_tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure? This will remove all project tasks.")) return;
    try {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error;
        setProjects(projects.filter(p => p.id !== id));
        setSelectedProject(null);
        toast.success("Project removed");
    } catch (err) {
        toast.error("Delete failed");
    }
  };

  // --- DATA COMPUTATION ---
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
    pdf.save(`Ledger_Report_${selectedProject?.name}.pdf`);
  };

  // --- RENDERERS ---
  if (!isMounted) return null;
  if (loading) return (
    <div className="h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-stone-300" size={48} />
      <p className="font-serif italic text-stone-400 text-3xl">Synchronizing Project Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1C1917] p-8 lg:p-12 max-w-[1800px] mx-auto overflow-hidden">
      
      {/* HEADER: MAIN NAVIGATION AND ACTIONS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.2rem] bg-stone-900 text-white flex items-center justify-center font-black text-lg shadow-2xl">P</div>
            <span className="font-serif italic text-3xl font-bold tracking-tight">Project Environment</span>
          </div>
          <div className="relative">
            <h1 className="text-9xl font-serif italic tracking-tighter leading-none">Projects</h1>
            <div className="absolute -top-4 -right-8">
                <span className="text-[10px] font-black uppercase text-stone-300 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">v3.1</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Real-time Sync Active</span>
            </div>
            <span className="text-stone-200">|</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{projects.length} Total Entries</span>
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
        
        {/* SIDEBAR: PROJECT SELECTION AND SEARCH */}
        <aside className="w-full xl:w-96 space-y-12">
          <div className="space-y-8">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />
                <input 
                    placeholder="Search ledger..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-100/50 border border-stone-200 rounded-[2rem] py-6 pl-16 pr-6 text-sm outline-none focus:bg-white focus:ring-4 ring-stone-900/5 transition-all font-serif italic"
                />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 mb-2">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Project Ledger</span>
                <Filter size={14} className="text-stone-200 hover:text-stone-400 cursor-pointer" />
              </div>
              
              <div className="max-h-[600px] overflow-y-auto pr-4 space-y-2 custom-scrollbar">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => (
                        <motion.button 
                          layout
                          key={p.id}
                          onClick={() => setSelectedProject(p)}
                          className={`w-full flex items-center justify-between px-8 py-7 rounded-[2.5rem] text-sm text-left transition-all group relative overflow-hidden ${
                            selectedProject?.id === p.id 
                            ? "bg-white shadow-2xl border border-stone-100 font-bold text-stone-900" 
                            : "text-stone-400 hover:bg-white/40"
                          }`}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                              <div className={`w-2.5 h-2.5 rounded-full transition-all ${selectedProject?.id === p.id ? 'bg-stone-900 scale-125' : 'bg-stone-200 group-hover:bg-stone-400'}`} />
                              <span className="truncate max-w-[180px]">{p.name}</span>
                          </div>
                          <ChevronRight size={16} className={`transition-all relative z-10 ${selectedProject?.id === p.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                          
                          {selectedProject?.id === p.id && (
                            <motion.div layoutId="nav-bg" className="absolute inset-0 bg-gradient-to-r from-stone-50/50 to-transparent" />
                          )}
                        </motion.button>
                      ))
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
                        <p className="text-[10px] font-black uppercase text-stone-200 tracking-widest leading-loose">No matches found<br/>in project ledger</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* SYSTEM WIDGET */}
          <div className="p-12 bg-stone-900 rounded-[4rem] text-white space-y-10 relative overflow-hidden shadow-2xl">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <Activity size={20} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Node Status</span>
                </div>
                <h4 className="text-4xl font-serif italic leading-tight">Environmental Integrity: High</h4>
                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-500">
                        <span>Sync Consistency</span>
                        <span>99.8%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 w-[99.8%]" />
                    </div>
                </div>
             </div>
             <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          </div>
        </aside>

        {/* MAIN WORKSPACE VIEWPORT */}
        <div className="flex-1 space-y-16" ref={printRef}>
          
          {/* TAB ARCHITECTURE */}
          <div className="flex flex-wrap gap-14 border-b border-stone-200 pb-1">
            {["Overview", "Tasks", "Board", "Timeline", "Workload", "Linked Notes"].map((tab) => (
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
                  <motion.div layoutId="tab-underline-main" className="absolute bottom-0 left-0 right-0 h-[3px] bg-stone-900 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* TAB RENDERER: OVERVIEW */}
          {activeTab === "overview" && selectedProject && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-20 pt-4">
              
              <div className="xl:col-span-2 space-y-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-stone-100 p-20 rounded-[5rem] shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 p-20 opacity-[0.02] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <Layout size={300} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-5">
                            <span className="px-6 py-2.5 bg-stone-50 rounded-full text-[11px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Project Viewport</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Live</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => deleteProject(selectedProject.id)} className="p-4 rounded-full hover:bg-red-50 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                            <button className="p-4 rounded-full hover:bg-stone-50 text-stone-200 hover:text-stone-900 transition-all"><MoreHorizontal size={20}/></button>
                        </div>
                    </div>
                    
                    <h2 className="text-[10rem] font-serif italic text-stone-900 mb-10 tracking-tighter leading-none">{selectedProject.name}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 border-t border-stone-50 pt-20">
                      <div className="bg-stone-50/50 p-10 rounded-[3rem] space-y-4 border border-stone-100/50">
                        <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] block">Completion Factor</span>
                        <div className="flex items-baseline gap-4">
                            <p className="text-7xl font-serif italic text-stone-900">{stats.percent}%</p>
                            <ArrowUpRight size={24} className="text-green-500" />
                        </div>
                      </div>
                      <div className="bg-stone-50/50 p-10 rounded-[3rem] space-y-4 border border-stone-100/50">
                        <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] block">Task Density</span>
                        <p className="text-7xl font-serif italic text-stone-900">{projectTasks.length}</p>
                      </div>
                      <div className="bg-stone-50/50 p-10 rounded-[3rem] space-y-4 border border-stone-100/50">
                        <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] block">Resource Links</span>
                        <p className="text-7xl font-serif italic text-stone-900">{linkedNotes.length}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* PROJECT INTELLIGENCE GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white p-16 rounded-[4.5rem] border border-stone-100 shadow-sm space-y-10 group">
                        <div className="flex justify-between items-center">
                            <h4 className="text-3xl font-serif italic">Progress Trajectory</h4>
                            <BarChart3 size={24} className="text-stone-200 group-hover:text-stone-900 transition-colors" />
                        </div>
                        <div className="space-y-6">
                            <div className="w-full h-3 bg-stone-50 rounded-full overflow-hidden p-0.5 border border-stone-100">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${stats.percent}%` }} 
                                    className="h-full bg-stone-900 rounded-full" 
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-black uppercase text-stone-400 tracking-widest">
                                <span>{stats.completed} Operations Finished</span>
                                <span>{stats.total - stats.completed} Pending</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-16 rounded-[4.5rem] border border-stone-100 shadow-sm space-y-10 group">
                        <div className="flex justify-between items-center">
                            <h4 className="text-3xl font-serif italic">Health Status</h4>
                            <Target size={24} className="text-stone-200 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(step => (
                                <div key={step} className={`h-2 flex-1 rounded-full transition-all duration-700 ${step <= 4 ? 'bg-stone-900' : 'bg-stone-50'}`} />
                            ))}
                        </div>
                        <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.3em] leading-relaxed">
                            System stability is optimal.<br/>No blockers detected.
                        </p>
                    </div>
                </div>
              </div>

              {/* CONTEXTUAL VAULT SIDEBAR */}
              <div className="space-y-12">
                <div className="flex items-center justify-between px-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 text-stone-400">
                        <StickyNote size={20} /> Vault Resources
                    </h3>
                    <button onClick={() => window.location.href='/vault'} className="text-[10px] font-black text-stone-300 hover:text-stone-900 transition-all group flex items-center gap-2">
                        Vault View <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
                
                <div className="space-y-10">
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={note.id} 
                        className="p-12 rounded-[3.5rem] shadow-sm border border-black/5 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" 
                        style={{ backgroundColor: note.color }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-md border-x border-b border-white/20 z-10 rounded-b-2xl shadow-sm" />
                        <p className="text-3xl font-serif italic text-stone-900 leading-tight mt-10 mb-10">"{note.content}"</p>
                        <div className="flex items-center justify-between border-t border-black/5 pt-8">
                            <div className="flex items-center gap-3">
                                <Tag size={14} className="text-stone-400" />
                                <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                            </div>
                            {note.is_urgent && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-red-500 uppercase">Urgent</span>
                                </div>
                            )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-24 border-4 border-dotted border-stone-200 rounded-[5rem] text-center space-y-8 bg-stone-50/30">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Tag size={28} className="text-stone-100" />
                      </div>
                      <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.4em] leading-loose">
                        No semantic links<br/>found in Vault for<br/>this project entry
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB RENDERER: TASKS */}
          {activeTab === "tasks" && selectedProject && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-white border border-stone-100 p-20 rounded-[5rem] shadow-sm space-y-16"
            >
              <div className="flex justify-between items-end px-4">
                <div className="space-y-4">
                    <h2 className="text-7xl font-serif italic tracking-tighter">Task Ledger</h2>
                    <div className="flex items-center gap-4">
                        <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Operations Flow for {selectedProject.name}</p>
                        <span className="w-2 h-2 rounded-full bg-stone-200" />
                        <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.4em]">{projectTasks.filter(t => t.status === "Completed").length} Done</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 hover:text-stone-900 transition-all border border-stone-100"><Filter size={20} /></button>
                    <button className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 hover:text-stone-900 transition-all border border-stone-100"><Settings size={20} /></button>
                </div>
              </div>

              <div className="divide-y divide-stone-100 border-t border-stone-100">
                {projectTasks.length > 0 ? (
                    projectTasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-10 px-10 hover:bg-stone-50/80 rounded-[3rem] transition-all group">
                          <div className="flex items-center gap-10">
                            <button 
                                onClick={() => updateTaskStatus(t.id, t.status === "Completed" ? "In Progress" : "Completed")}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${t.status === "Completed" ? 'bg-stone-900 border-stone-900' : 'border-stone-100 group-hover:border-stone-900'}`}
                            >
                              <Check size={18} className={`transition-opacity ${t.status === "Completed" ? 'text-white opacity-100' : 'text-stone-900 opacity-0 group-hover:opacity-100'}`} />
                            </button>
                            <div className="space-y-2">
                                <p className={`text-3xl font-serif italic transition-all ${t.status === "Completed" ? 'text-stone-300 line-through decoration-stone-200' : 'text-stone-800'}`}>{t.name}</p>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.status === "Completed" ? 'text-green-500' : 'text-stone-300'}`}>{t.status}</span>
                                    {t.due_date && (
                                        <>
                                            <span className="text-stone-100">|</span>
                                            <div className="flex items-center gap-2 text-stone-300">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t.due_date}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-14">
                              <div className="flex -space-x-4">
                                  {[1].map(i => (
                                      <div key={i} className="w-10 h-10 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center shadow-sm">
                                          <User size={14} className="text-stone-300" />
                                      </div>
                                  ))}
                              </div>
                              <span className="text-[10px] font-black uppercase text-stone-400 border border-stone-200 px-6 py-3 rounded-2xl bg-white shadow-sm tracking-widest">{t.priority}</span>
                          </div>
                        </div>
                      ))
                ) : (
                    <div className="py-40 text-center space-y-8">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                            <ListTodo size={32} className="text-stone-200" />
                        </div>
                        <p className="text-2xl font-serif italic text-stone-300">The task ledger is currently void. Add an operation below.</p>
                    </div>
                )}
              </div>

              <div className="pt-16 border-t border-stone-100">
                <div className="flex gap-8">
                    <div className="flex-1 relative group">
                        <Plus className="absolute left-10 top-1/2 -translate-y-1/2 text-stone-200 group-focus-within:text-stone-900 transition-colors" size={28} />
                        <input
                            placeholder="Draft a new project task..."
                            value={newTaskName[selectedProject.id] || ""}
                            onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                            className="w-full p-12 bg-stone-50 border border-stone-100 rounded-[3.5rem] outline-none text-4xl font-serif italic focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-200 pl-24 shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={() => handleAddTask(selectedProject.id)}
                        className="bg-stone-900 text-white px-16 rounded-[3.5rem] shadow-2xl hover:bg-stone-800 transition-all active:scale-95 hover:-translate-y-1"
                    >
                        <ArrowUpRight size={40} />
                    </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB RENDERER: BOARD */}
          {activeTab === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4 h-[800px]">
                {["Backlog", "In Progress", "Completed"].map((column) => (
                    <div key={column} className="bg-stone-100/40 rounded-[4.5rem] p-12 flex flex-col gap-8 border border-stone-200/50">
                        <div className="flex justify-between items-center px-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-stone-900">{column}</h3>
                                <div className={`w-2 h-2 rounded-full ${column === 'In Progress' ? 'bg-amber-400' : column === 'Completed' ? 'bg-green-500' : 'bg-stone-300'}`} />
                            </div>
                            <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-[10px] font-black shadow-sm">
                                {projectTasks.filter(t => t.status === column).length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar p-2">
                            {projectTasks.filter(t => t.status === column).map(task => (
                                <motion.div 
                                    layout
                                    key={task.id} 
                                    className="bg-white p-10 rounded-[3rem] shadow-md border border-stone-100 space-y-6 hover:shadow-xl hover:-rotate-1 transition-all cursor-grab active:cursor-grabbing"
                                >
                                    <p className="text-2xl font-serif italic leading-tight text-stone-800">{task.name}</p>
                                    <div className="flex justify-between items-center border-t border-stone-50 pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100"><User size={12} className="text-stone-300" /></div>
                                            <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Assignee</span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border ${task.priority === 'High' ? 'border-red-100 text-red-400 bg-red-50/30' : 'border-stone-100 text-stone-400'}`}>
                                            {task.priority}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <button className="w-full py-6 border-2 border-dashed border-stone-200 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 hover:border-stone-900 transition-all">
                            Add to {column}
                        </button>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM MODAL: CREATE PROJECT */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-8">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowCreateModal(false)} 
                className="absolute inset-0 bg-stone-900/70 backdrop-blur-3xl" 
            />
            <motion.div 
                initial={{ y: 150, opacity: 0, scale: 0.9 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: 150, opacity: 0, scale: 0.9 }} 
                className="bg-white w-full max-w-3xl rounded-[7rem] p-24 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 space-y-20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-20">
                <button onClick={() => setShowCreateModal(false)} className="text-stone-200 hover:text-stone-900 hover:rotate-90 transition-all duration-500">
                  <X size={60}/>
                </button>
              </div>

              <div className="space-y-8">
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-stone-50 rounded-full border border-stone-100">
                    <div className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
                    <span className="text-[12px] font-black uppercase text-stone-400 tracking-[0.4em]">Project Initialization Protocol</span>
                </div>
                <h3 className="text-8xl font-serif italic tracking-tighter leading-none text-stone-900">New Project</h3>
              </div>

              <div className="space-y-16">
                <div className="space-y-8">
                  <label className="text-[11px] font-black uppercase tracking-[0.6em] text-stone-300 ml-6">Project Title Definition</label>
                  <input 
                    autoFocus 
                    placeholder="Enter Project Identifier..."
                    className="w-full text-6xl font-serif italic outline-none border-b-4 border-stone-50 pb-12 focus:border-stone-900 transition-all placeholder:text-stone-100 bg-transparent"
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  />
                </div>

                <div className="p-14 bg-stone-50 rounded-[4rem] border border-stone-100 flex items-start gap-10">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        <Info size={28} className="text-stone-900" />
                    </div>
                    <div className="space-y-3">
                        <h5 className="text-xl font-black uppercase tracking-widest text-stone-900">Semantic Linker</h5>
                        <p className="text-lg font-serif italic text-stone-400 leading-relaxed">
                            Project names are synchronized with Vault categories. Matches will automatically port relevant research and notes into this workspace.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleCreateProject} 
                    disabled={isSyncing || !projectName.trim()} 
                    className="w-full bg-stone-900 text-white py-14 rounded-full font-black uppercase text-[16px] tracking-[0.7em] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:bg-stone-800 hover:scale-[1.02] transition-all active:scale-95 disabled:bg-stone-50 disabled:text-stone-200 disabled:shadow-none flex items-center justify-center gap-8 group"
                >
                  {isSyncing ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <>
                        Initialize Project
                        <ArrowUpRight size={28} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        
        body { background-color: #F9F9F7; }
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D6D3D1; }

        input::placeholder { color: #E7E5E4; opacity: 1; transition: color 0.3s; }
        input:focus::placeholder { color: #F5F5F4; }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        .group-hover\:bounce { animation: bounce 1s infinite; }
      `}</style>
    </div>
  );
}