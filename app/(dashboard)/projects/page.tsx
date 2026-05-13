"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole } from "@/lib/permissions";
import { 
  Sparkles, Plus, X, Loader2, Folder, 
  CheckSquare, BarChart3, Layers, Users, 
  Star, Tag as TagIcon, StickyNote, Check, AlertCircle, 
  ArrowRight, Calendar, Trash2, Search, Zap, Globe,
  Clock, BarChart, MessageSquare, Info, Save, ChevronDown,
  MoreHorizontal, Eye, FileText, LayoutGrid, ListTodo,
  ClipboardCheck, ArrowUpRight, FolderKanban, Settings, User, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * TOTS OS | PROJECT ECOSYSTEM V10.0
 * INTEGRATED WITH THE VAULT LEDGER
 */

// --- TYPES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: "Backlog" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  assignee?: string;
}

interface Note {
  id: string;
  content: string;
  category: string;
  color: string;
  is_urgent: boolean;
  metadata?: { rotation: string };
}

interface Goal {
  id: number;
  title: string;
  progress: number;
  target: string;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("work"); 
  const [activeTab, setActiveTab] = useState("overview"); 

  // Core Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI & Interaction States
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});
  const [projectName, setProjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mocked Metrics for High-Fidelity UI
  const [goals] = useState<Goal[]>([
    { id: 1, title: "Optimize Node Latency", progress: 65, target: "Q3 2026" },
    { id: 2, title: "Scale Ecosystem Deployment", progress: 82, target: "Q4 2026" }
  ]);

  const workload = [
    { member: "Leigha", tasks: 4, cap: 70 },
    { member: "System Admin", tasks: 2, cap: 30 }
  ];

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
      const [projRes, noteRes] = await Promise.all([
        supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false }),
        supabase.from("notes").select("*")
      ]);

      if (projRes.error) throw projRes.error;
      
      setProjects(projRes.data || []);
      setAllNotes(noteRes.data || []);
      
      if (projRes.data?.length && !selectedProject) {
        setSelectedProject(projRes.data[0]);
      }
    } catch (err) {
      console.error("Data Load Error:", err);
      toast.error("Sync Failed");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      if (!team) {
        setTeamId("local-env");
        setLoading(false);
        return;
      }
      setTeamId(team);
      loadData(team);
    }
    init();
  }, [loadData]);

  // --- ACTIONS ---
  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight("Resources aligned. System throughput at 98%.");
      setIsScanActive(false);
      toast.success("Ecosystem scan complete.");
    }, 2000);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    setIsSyncing(true);
    const { data, error } = await supabase.from("projects").insert([{ 
      name: projectName, 
      team_id: teamId,
      status: "active"
    }]).select();

    if (!error) {
      toast.success("New Workspace Online");
      setProjectName("");
      setShowCreateModal(false);
      loadData(teamId);
    }
    setIsSyncing(false);
  };

  const handleAddTask = (projectId: string) => {
    const name = newTaskName[projectId]?.trim();
    if (!name) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      name,
      status: "Backlog",
      priority: "Medium"
    };
    setTasks([...tasks, newTask]);
    setNewTaskName({ ...newTaskName, [projectId]: "" });
    toast.success("Task appended to ledger.");
  };

  const linkedNotes = useMemo(() => {
    if (!selectedProject) return [];
    return allNotes.filter(note => 
      note.category?.toLowerCase() === selectedProject.name?.toLowerCase()
    );
  }, [allNotes, selectedProject]);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`${selectedProject?.name || 'Workspace'}_Export.pdf`);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;
  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-stone-200" size={48} />
      <p className="font-serif italic text-stone-400 text-2xl">Establishing Secure Connection...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 lg:p-12 max-w-[1700px] mx-auto overflow-hidden">
      
      {/* 1. MASTER HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-10 gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 90 }}
              className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-black text-sm shadow-2xl"
            >
              T
            </motion.div>
            <span className="font-serif italic text-2xl font-bold tracking-tight">TOTS Workspace</span>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Portfolios</h1>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em]">Status: Nominal</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={runClarityScan} 
            disabled={isScanActive}
            className="flex items-center gap-3 bg-white border border-stone-100 px-8 py-4 rounded-3xl shadow-sm hover:shadow-xl transition-all group"
          >
            {isScanActive ? <Loader2 className="animate-spin text-stone-400" size={18} /> : <Sparkles size={18} className="text-stone-400 group-hover:text-amber-400 transition-colors" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Scan Clarity</span>
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-3xl shadow-2xl hover:bg-stone-800 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">New Project</span>
          </button>
        </div>
      </header>

      {/* 2. MODE NAVIGATION */}
      <nav className="flex flex-wrap gap-4 pb-8 border-b border-stone-50 mb-12">
        {[
          { id: "work", label: "Operations", icon: <CheckSquare size={16} /> },
          { id: "strategy", label: "Strategy", icon: <BarChart3 size={16} /> },
          { id: "workflows", label: "Logic", icon: <Layers size={16} /> },
          { id: "company", label: "Entity", icon: <Users size={16} /> }
        ].map((mode) => (
          <button 
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-5 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              activeMode === mode.id 
              ? "bg-stone-900 text-white border-stone-900 shadow-xl" 
              : "bg-white text-stone-400 border-stone-100 hover:bg-stone-50"
            }`}
          >
            {mode.icon} <span>{mode.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex flex-col xl:flex-row gap-16">
        
        {/* 3. SIDEBAR: PROJECT EXPLORER */}
        <aside className="w-full xl:w-80 space-y-10">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                placeholder="Find Project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:bg-white focus:ring-2 ring-stone-900/5 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-stone-300 tracking-[0.2em] px-2 block">All Entities</span>
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {filteredProjects.map((p) => (
                  <motion.button 
                    key={p.id}
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl text-xs text-left transition-all ${
                      selectedProject?.id === p.id 
                      ? "bg-white shadow-lg border border-stone-100 font-bold text-stone-900" 
                      : "text-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <FolderKanban size={14} className={selectedProject?.id === p.id ? "text-stone-900" : "text-stone-200"} />
                        <span className="truncate">{p.name}</span>
                    </div>
                    {selectedProject?.id === p.id && <Zap size={12} className="text-amber-400 fill-amber-400" />}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="p-8 bg-stone-900 rounded-[3rem] text-white space-y-6">
            <div className="flex items-center gap-3">
                <Activity size={18} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Insight</span>
            </div>
            <p className="text-sm font-serif italic text-stone-400">{insight || "Awaiting scan results..."}</p>
          </div>
        </aside>

        {/* 4. MAIN WORKSPACE */}
        <div className="flex-1 space-y-12" ref={printRef}>
          
          {/* TABS */}
          <div className="flex flex-wrap gap-10 border-b border-stone-100 pb-2">
            {["Overview", "Task Ledger", "Board", "Workload", "Linked Vault", "OKRs"].map((tab) => (
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-4">
              
              <div className="xl:col-span-2 space-y-12">
                {/* PROJECT CARD */}
                <div className="bg-white border border-stone-100 p-16 rounded-[4rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                  
                  <div className="relative z-10">
                    <span className="px-5 py-2 bg-stone-50 rounded-full text-[10px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Project Profile</span>
                    <h2 className="text-8xl font-serif italic text-stone-900 mt-10 mb-6 tracking-tighter leading-none">{selectedProject.name}</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 border-t border-stone-50 pt-16">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Current Tasks</span>
                        <p className="text-4xl font-serif italic text-stone-900">{tasks.filter(t => t.project_id === selectedProject.id).length}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Team Nodes</span>
                        <p className="text-4xl font-serif italic text-stone-900">12</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Vault Links</span>
                        <p className="text-4xl font-serif italic text-stone-900">{linkedNotes.length}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Priority</span>
                        <p className="text-4xl font-serif italic text-amber-500">High</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROJECT GOALS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Target: {goal.target}</span>
                                <span className="text-lg font-serif italic">{goal.progress}%</span>
                            </div>
                            <h4 className="text-2xl font-serif italic">{goal.title}</h4>
                            <div className="w-full h-1 bg-stone-50 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goal.progress}%` }}
                                    className="h-full bg-stone-900"
                                />
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* LINKED VAULT SIDEBAR */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                    <StickyNote size={18} className="text-stone-300" />
                    Vault Ledger
                  </h3>
                  <button onClick={() => window.location.href='/vault'} className="text-[9px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors">Open Desk</button>
                </div>
                
                <div className="space-y-6">
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={note.id}
                        className="p-10 rounded-[3rem] shadow-sm border border-black/5 relative overflow-hidden group hover:shadow-xl transition-all"
                        style={{ backgroundColor: note.color || '#fff' }}
                      >
                        {/* THE PHYSICAL TAPE EFFECT */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/40 backdrop-blur-md border border-white/20 z-10" />
                        
                        <p className="text-2xl font-serif italic text-stone-900 leading-tight mb-6 mt-4">"{note.content}"</p>
                        
                        <div className="flex items-center justify-between border-t border-black/5 pt-6">
                            <div className="flex items-center gap-2">
                                <TagIcon size={12} className="text-stone-400" />
                                <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                            </div>
                            {note.is_urgent && <AlertCircle size={14} className="text-red-500" />}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-20 border-2 border-dashed border-stone-100 rounded-[4rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                        <TagIcon size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] leading-relaxed">
                        No Vault data found for<br/>"{selectedProject.name}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TASK LEDGER */}
          {activeTab === "task-ledger" && selectedProject && (
            <div className="bg-white border border-stone-100 p-16 rounded-[4rem] shadow-sm space-y-12">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-5xl font-serif italic tracking-tighter">Project Task Ledger</h2>
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Operational Checklist</p>
                </div>
                <button className="flex items-center gap-2 text-stone-300 hover:text-stone-900 transition-all">
                  <Settings size={16} />
                  <span className="text-[9px] font-black uppercase">Configure</span>
                </button>
              </div>

              <div className="divide-y divide-stone-50">
                {tasks.filter(t => t.project_id === selectedProject.id).map(t => (
                  <div key={t.id} className="flex justify-between items-center py-8 px-8 hover:bg-stone-50 rounded-[2rem] transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="w-6 h-6 rounded-full border-2 border-stone-100 flex items-center justify-center group-hover:border-stone-900 transition-colors cursor-pointer">
                        <Check size={12} className="text-stone-900 opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-2xl font-serif italic text-stone-800">{t.name}</p>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2">
                            <User size={12} className="text-stone-300" />
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Unassigned</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-stone-400 border border-stone-100 px-4 py-2 rounded-xl bg-white shadow-sm">{t.priority}</span>
                        <button className="text-stone-200 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-12 mt-12 border-t border-stone-50">
                <div className="flex gap-4">
                    <input
                        placeholder="Draft new task to ledger..."
                        value={newTaskName[selectedProject.id] || ""}
                        onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                        className="flex-1 p-8 bg-stone-50 border border-stone-100 rounded-[2.5rem] outline-none text-2xl font-serif italic placeholder:text-stone-200 focus:bg-white focus:border-stone-900 transition-all"
                    />
                    <button 
                        onClick={() => handleAddTask(selectedProject.id)}
                        className="bg-stone-900 text-white px-10 rounded-[2.5rem] shadow-xl hover:bg-stone-800 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WORKLOAD (MOCKED) */}
          {activeTab === "workload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                {workload.map(user => (
                    <div key={user.member} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-stone-900 rounded-[2rem] flex items-center justify-center text-white text-2xl font-black">
                                {user.member.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-4xl font-serif italic">{user.member}</h3>
                                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-1">Status: Operational</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span>Utilization</span>
                                <span>{user.cap}% Capacity</span>
                            </div>
                            <div className="w-full h-2 bg-stone-50 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${user.cap}%` }}
                                    className="h-full bg-stone-900"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-stone-50">
                            <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Allocated Items: {user.tasks}</span>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowCreateModal(false)} 
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 100, opacity: 0, scale: 0.95 }} 
              className="bg-white w-full max-w-2xl rounded-[5rem] p-20 shadow-2xl relative z-10 space-y-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12">
                <button onClick={() => setShowCreateModal(false)} className="text-stone-200 hover:text-stone-900 transition-colors">
                  <X size={40}/>
                </button>
              </div>

              <div className="space-y-4">
                <span className="px-5 py-2 bg-stone-50 rounded-full text-[10px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Initiation Protocol</span>
                <h3 className="text-6xl font-serif italic tracking-tighter lowercase leading-none">New Project</h3>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-2">Internal Title / Vault Tag</label>
                  <input 
                    autoFocus 
                    placeholder="Project Name..."
                    className="w-full text-5xl font-serif italic outline-none border-b-2 border-stone-50 pb-8 focus:border-stone-900 transition-all placeholder:text-stone-100"
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100/50 flex items-start gap-6">
                    <Info size={24} className="text-amber-500 mt-1" />
                    <p className="text-sm font-serif italic text-amber-700 leading-relaxed">
                        Naming this project will automatically sync any notes from your Vault that share this exact category tag.
                    </p>
                </div>

                <button 
                    onClick={handleCreateProject} 
                    disabled={isSyncing || !projectName.trim()} 
                    className="w-full bg-stone-900 text-white py-10 rounded-full font-black uppercase text-[12px] tracking-[0.5em] shadow-2xl hover:bg-stone-800 transition-all active:scale-95 disabled:bg-stone-100 disabled:text-stone-300 flex items-center justify-center gap-6"
                >
                  {isSyncing ? <Loader2 size={24} className="animate-spin" /> : "Initiate Workspace"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        :root {
          --bg: #F9F9F7;
          --card-bg: #FFFFFF;
          --border: #EFEFEF;
          --text-main: #1C1917;
          --text-muted: #A8A29E;
          --bg-soft: #F5F5F3;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EFEFEF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D6D3D1; }

        input::placeholder { color: #E7E5E4; }
      `}</style>
    </div>
  );
}