"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, X, Loader2, Folder, CheckSquare, BarChart3, 
  Layers, Users, Star, Tag, StickyNote, Check, 
  Trash2, Search, Activity, Sparkles, Info, Settings, 
  User, Calendar, MoreHorizontal, ChevronRight,
  ArrowUpRight, AlertCircle, Layout, ListTodo, ClipboardCheck, LayoutGrid
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

interface Goal {
  id: string;
  title: string;
  progress: number;
  deadline: string;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [loading, setLoading] = useState(true);

  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI States
  const [selectedProject, setSelectedProject] = useState<any>(null);
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

  // --- DATABASE ENGINE ---
  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const [projRes, noteRes, taskRes] = await Promise.all([
        supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false }),
        supabase.from("notes").select("*"),
        supabase.from("project_tasks").select("*")
      ]);

      if (projRes.error) throw projRes.error;
      
      const projectList = projRes.data || [];
      setProjects(projectList);
      setAllNotes(noteRes.data || []);
      setTasks(taskRes.data || []);
      
      // Auto-select first project if none selected
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
      toast.error("Database connection failed");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      if (!team) {
        setTeamId("local-dev-team");
        setLoading(false);
        return;
      }
      setTeamId(team);
      loadData(team);
    }
    init();
  }, [loadData]);

  // --- ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) {
        toast.error("A project name is required");
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

        toast.success("Project Created");
        setProjectName("");
        setShowCreateModal(false);
        await loadData(teamId); // Full refresh to update UI
    } catch (err: any) {
        console.error("Creation Error:", err);
        toast.error("Failed to save project to database");
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

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
    if (!error) {
        setTasks(tasks.filter(t => t.id !== taskId));
        toast.success("Task Removed");
    }
  };

  // --- MEMOIZED LOGIC ---
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

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`Project_${selectedProject?.name || 'Report'}.pdf`);
  };

  if (!isMounted) return null;
  if (loading) return (
    <div className="h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-stone-300" size={40} />
      <p className="font-serif italic text-stone-400 text-2xl">Syncing Project Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1C1917] p-8 lg:p-12 max-w-[1700px] mx-auto overflow-hidden">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-black text-sm shadow-xl">P</div>
            <span className="font-serif italic text-2xl font-bold tracking-tight">Ecosystem</span>
          </div>
          <h1 className="text-8xl font-serif italic tracking-tighter leading-none">Projects</h1>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Database: Connected</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-3 bg-stone-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl hover:bg-stone-800 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">New Project</span>
          </button>
          
          <button 
            onClick={downloadPDF} 
            className="flex items-center gap-3 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] text-stone-400 hover:text-stone-900 transition-all shadow-sm"
          >
            <Folder size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Export Report</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-16">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full xl:w-80 space-y-10">
          <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                <input 
                    placeholder="Search Projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-100 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:bg-white focus:ring-2 ring-stone-900/5 transition-all"
                />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.2em]">Active Ledger</span>
                <span className="text-[9px] font-black text-stone-300">{projects.length} Total</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {filteredProjects.map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full flex items-center justify-between px-6 py-5 rounded-[2rem] text-xs text-left transition-all group ${
                      selectedProject?.id === p.id 
                      ? "bg-white shadow-xl border border-stone-100 font-bold text-stone-900" 
                      : "text-stone-400 hover:bg-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${selectedProject?.id === p.id ? 'bg-stone-900' : 'bg-stone-200'}`} />
                        <span className="truncate">{p.name}</span>
                    </div>
                    <ChevronRight size={14} className={selectedProject?.id === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK DASHBOARD WIDGET */}
          <div className="p-10 bg-stone-900 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Global Status</span>
                </div>
                <h4 className="text-3xl font-serif italic">Operational</h4>
                <p className="text-xs text-stone-400 leading-relaxed font-serif italic">Ecosystem performing within normal parameters. Completed {stats.percent}% of current sprint tasks.</p>
             </div>
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 space-y-12" ref={printRef}>
          
          {/* TAB NAVIGATION */}
          <div className="flex flex-wrap gap-10 border-b border-stone-200 pb-2">
            {["Overview", "Tasks", "Board", "Workload", "Linked Notes"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
                  activeTab === tab.toLowerCase().replace(" ", "-") 
                  ? "text-stone-900" 
                  : "text-stone-300 hover:text-stone-500"
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(" ", "-") && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900" />
                )}
              </button>
            ))}
          </div>

          {/* VIEW: OVERVIEW */}
          {activeTab === "overview" && selectedProject && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 pt-4">
              
              <div className="xl:col-span-2 space-y-12">
                <div className="bg-white border border-stone-100 p-16 rounded-[4rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <LayoutGrid size={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <span className="px-5 py-2 bg-stone-50 rounded-full text-[10px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Live Workspace</span>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    
                    <h2 className="text-8xl font-serif italic text-stone-900 mb-8 tracking-tighter leading-none">{selectedProject.name}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 border-t border-stone-50 pt-16">
                      <div className="bg-stone-50 p-8 rounded-[2rem] space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Total Progress</span>
                        <div className="flex items-end gap-3">
                            <p className="text-5xl font-serif italic text-stone-900">{stats.percent}%</p>
                        </div>
                      </div>
                      <div className="bg-stone-50 p-8 rounded-[2rem] space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Active Ledger</span>
                        <p className="text-5xl font-serif italic text-stone-900">{projectTasks.length}</p>
                      </div>
                      <div className="bg-stone-50 p-8 rounded-[2rem] space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Vault Links</span>
                        <p className="text-5xl font-serif italic text-stone-900">{linkedNotes.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-serif italic">Task Completion</h4>
                            <span className="text-[10px] font-black uppercase text-stone-400">Monthly Target</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.percent}%` }} className="h-full bg-stone-900" />
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-stone-300">
                            <span>{stats.completed} Completed</span>
                            <span>{stats.total - stats.completed} Remaining</span>
                        </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-serif italic">Project Priority</h4>
                            <AlertCircle size={20} className="text-amber-500" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-stone-900 rounded-full" />
                            <div className="flex-1 h-2 bg-stone-900 rounded-full" />
                            <div className="flex-1 h-2 bg-stone-50 rounded-full" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Priority set to High Efficiency</p>
                    </div>
                </div>
              </div>

              {/* VAULT SIDEBAR */}
              <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-stone-400">
                        <StickyNote size={18} /> Vault Ledger
                    </h3>
                    <button onClick={() => window.location.href='/vault'} className="text-[9px] font-black text-stone-300 hover:text-stone-900 transition-colors">Go to Vault</button>
                </div>
                
                <div className="space-y-8">
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={note.id} 
                        className="p-10 rounded-[3rem] shadow-sm border border-black/5 relative overflow-hidden group hover:shadow-xl transition-all" 
                        style={{ backgroundColor: note.color }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 backdrop-blur-md border-x border-b border-white/20 z-10" />
                        <p className="text-2xl font-serif italic text-stone-900 leading-tight mt-6 mb-8">"{note.content}"</p>
                        <div className="flex items-center justify-between border-t border-black/5 pt-6">
                            <div className="flex items-center gap-2">
                                <Tag size={12} className="text-stone-400" />
                                <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                            </div>
                            {note.is_urgent && <AlertCircle size={14} className="text-red-500" />}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-24 border-2 border-dashed border-stone-200 rounded-[4rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                        <Tag size={20} className="text-stone-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] leading-relaxed">
                        No context found in Vault for<br/>"{selectedProject.name}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TASKS */}
          {activeTab === "tasks" && selectedProject && (
            <div className="bg-white border border-stone-100 p-16 rounded-[4.5rem] shadow-sm space-y-12">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-6xl font-serif italic tracking-tighter">Task Ledger</h2>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Operational Items for {selectedProject.name}</p>
                </div>
                <div className="flex gap-4">
                    <button className="p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 transition-all"><Settings size={18} /></button>
                </div>
              </div>

              <div className="divide-y divide-stone-50 border-t border-stone-50">
                {projectTasks.length > 0 ? (
                    projectTasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-8 px-8 hover:bg-stone-50 rounded-[2.5rem] transition-all group">
                          <div className="flex items-center gap-8">
                            <div 
                                onClick={() => deleteTask(t.id)}
                                className="w-8 h-8 rounded-full border-2 border-stone-100 flex items-center justify-center group-hover:border-stone-900 transition-all cursor-pointer"
                            >
                              <Check size={16} className="text-stone-900 opacity-0 group-hover:opacity-100" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-serif italic text-stone-800">{t.name}</p>
                                <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">{t.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-10">
                              <div className="flex items-center gap-3">
                                  <User size={14} className="text-stone-300" />
                                  <span className="text-[9px] font-bold text-stone-400 uppercase">Unassigned</span>
                              </div>
                              <span className="text-[9px] font-black uppercase text-stone-400 border border-stone-100 px-5 py-2 rounded-xl bg-white shadow-sm">{t.priority}</span>
                          </div>
                        </div>
                      ))
                ) : (
                    <div className="py-24 text-center">
                        <p className="text-xl font-serif italic text-stone-300">The ledger is empty. Start adding tasks below.</p>
                    </div>
                )}
              </div>

              <div className="pt-12 border-t border-stone-100">
                <div className="flex gap-6">
                    <input
                        placeholder="Draft a new task..."
                        value={newTaskName[selectedProject.id] || ""}
                        onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                        className="flex-1 p-10 bg-stone-50 border border-stone-100 rounded-[3rem] outline-none text-3xl font-serif italic focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-200"
                    />
                    <button 
                        onClick={() => handleAddTask(selectedProject.id)}
                        className="bg-stone-900 text-white px-12 rounded-[3rem] shadow-2xl hover:bg-stone-800 transition-all active:scale-95"
                    >
                        <Plus size={32} />
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: BOARD */}
          {activeTab === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 h-[700px]">
                {["Backlog", "In Progress", "Completed"].map((column) => (
                    <div key={column} className="bg-stone-100/50 rounded-[3.5rem] p-10 flex flex-col gap-6">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-stone-900">{column}</h3>
                            <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-black">
                                {projectTasks.filter(t => t.status === column).length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {projectTasks.filter(t => t.status === column).map(task => (
                                <div key={task.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4 hover:shadow-md transition-all">
                                    <p className="text-lg font-serif italic leading-tight">{task.name}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="w-6 h-6 rounded-full bg-stone-50 flex items-center justify-center"><User size={10} className="text-stone-300" /></div>
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-tighter">{task.priority}</span>
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

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowCreateModal(false)} 
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xl" 
            />
            <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.95 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: 100, opacity: 0, scale: 0.95 }} 
                className="bg-white w-full max-w-2xl rounded-[6rem] p-24 shadow-2xl relative z-10 space-y-16 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16">
                <button onClick={() => setShowCreateModal(false)} className="text-stone-200 hover:text-stone-900 transition-colors">
                  <X size={48}/>
                </button>
              </div>

              <div className="space-y-6">
                <span className="px-6 py-2 bg-stone-50 rounded-full text-[10px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Creation Protocol</span>
                <h3 className="text-7xl font-serif italic tracking-tighter leading-none">New Project</h3>
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-4">Project Title</label>
                  <input 
                    autoFocus 
                    placeholder="Enter Project Name..."
                    className="w-full text-5xl font-serif italic outline-none border-b-2 border-stone-50 pb-10 focus:border-stone-900 transition-all placeholder:text-stone-100"
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  />
                </div>

                <div className="p-10 bg-amber-50 rounded-[3rem] border border-amber-100/50 flex items-start gap-8">
                    <Info size={28} className="text-amber-500 mt-1 shrink-0" />
                    <p className="text-base font-serif italic text-amber-700 leading-relaxed">
                        Tip: If the project name matches a **category tag** in your Vault, all related notes will automatically appear in the project dashboard.
                    </p>
                </div>

                <button 
                    onClick={handleCreateProject} 
                    disabled={isSyncing || !projectName.trim()} 
                    className="w-full bg-stone-900 text-white py-12 rounded-full font-black uppercase text-[14px] tracking-[0.6em] shadow-2xl hover:bg-stone-800 transition-all active:scale-95 disabled:bg-stone-50 disabled:text-stone-200 flex items-center justify-center gap-6"
                >
                  {isSyncing ? <Loader2 size={24} className="animate-spin" /> : "Create Project"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D6D3D1; }

        input::placeholder { color: #E7E5E4; opacity: 1; }
      `}</style>
    </div>
  );
}