"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe, Trash2,
  Calendar as CalendarIcon, Clock, CheckSquare, Layers, Users, BarChart3, MessageSquare, Info, Save, ChevronDown, MoreHorizontal, Search, Eye, FileText, Check, AlertCircle, Sparkle, Tag, Folder, PanelLeftClose, PanelLeft, LayoutGrid, ListTodo, ClipboardCheck, ArrowUpRight, FolderKanban, Star, Settings, User, StickyNote
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
  status: "Backlog" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  assignee?: string;
  subtasks?: string[];
  comments?: string[];
}

interface Note {
  id: string;
  content: string;
  category: string;
  color: string;
  is_urgent: boolean;
  metadata?: { rotation: string };
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("work"); 
  const [activeTab, setActiveTab] = useState("overview"); 

  // Core Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI Interaction States
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectName, setProjectName] = useState("");

  // Intelligence States
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // High-Fidelity Mock Data
  const [goals] = useState([
    { id: 1, title: "Double ecosystem deployment speed", progress: 75, target: "Q3 2026" },
    { id: 2, title: "Achieve 99.9% uptime on all nodes", progress: 90, target: "Q4 2026" }
  ]);

  const [workload] = useState([
    { member: "Jane Doe", tasksAssigned: 5, capacity: 85, status: "Active" },
    { member: "John Smith", tasksAssigned: 3, capacity: 60, status: "Active" },
  ]);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // --- DATA ENGINE ---
  const loadData = useCallback(async (team: string) => {
    const [projRes, noteRes] = await Promise.all([
      supabase.from("projects").select("*, customers(name)").eq("team_id", team).order("created_at", { ascending: false }),
      supabase.from("notes").select("*")
    ]);

    if (!projRes.error) setProjects(projRes.data || []);
    if (!noteRes.error) setAllNotes(noteRes.data || []);
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();

      if (!team) {
        setTeamId("team-123");
        setRole("admin");
        setCustomers([{ id: "c1", name: "Apex Solutions" }]);
        setProjects([
          { id: "p1", name: "Project Zero", customers: { name: "Apex Solutions" }, created_at: new Date().toISOString() },
          { id: "p2", name: "Atlas Stream", customers: { name: "Apex Solutions" }, created_at: new Date().toISOString() }
        ]);
        setTasks([
          { id: "t1", project_id: "p1", name: "Configure Node Network", status: "In Progress", priority: "High", dueDate: "2026-05-15", assignee: "Jane Doe" },
          { id: "t2", project_id: "p1", name: "Run diagnostic baseline", status: "Backlog", priority: "Medium", dueDate: "2026-05-20", assignee: "John Smith" }
        ]);
        setLoading(false);
        return;
      }
      setTeamId(team);
      setRole(r);
      loadData(team);
    }
    init();
  }, [loadData]);

  // --- LOGIC ---
  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight("Optimal throughput detected across all project nodes.");
      setIsScanActive(false);
      toast.success("Intelligence scan complete.");
    }, 2200);
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
      toast.success("Project workspace initialized.");
      setProjectName("");
      setShowCreateModal(false);
      loadData(teamId);
    }
    setIsSyncing(false);
  };

  const handleAddTask = (projectId: string) => {
    const taskName = newTaskName[projectId]?.trim();
    if (!taskName) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      name: taskName,
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
    pdf.save(`workspace_export.pdf`);
  };

  if (!isMounted) return null;
  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
      <p className="font-serif italic text-[var(--text-muted)] text-lg">Initializing Ecosystem...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 lg:p-12 max-w-[1700px] mx-auto overflow-hidden">
      
      {/* 1. MASTER HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--border)] pb-8 gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-black">T</div>
            <span className="font-serif italic text-xl font-bold">Workspace</span>
          </div>
          <p className="text-[var(--brand-primary)] font-black uppercase text-[9px] tracking-[0.3em]">Operational Portfolio / {activeMode}</p>
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Projects</h1>
        </div>

        <div className="flex gap-3">
          <button onClick={runClarityScan} disabled={isScanActive} className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border)] px-6 py-4 rounded-2xl shadow-sm hover:shadow-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] group">
            {isScanActive ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-[var(--brand-primary)] group-hover:scale-125 transition-transform" />}
            <span className="text-[10px] font-black uppercase tracking-wider">Scan Space</span>
          </button>
          
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-700 transition-all active:scale-95">
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">New Project</span>
          </button>

          <button onClick={downloadPDF} className="flex items-center gap-3 bg-white border border-stone-100 px-6 py-4 rounded-2xl text-stone-400 hover:text-stone-900 transition-all">
            <Folder size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Export PDF</span>
          </button>
        </div>
      </header>

      {/* 2. MODE NAVIGATION */}
      <div className="flex flex-wrap gap-4 pb-6 border-b border-[var(--border)] mb-12">
        {[
          { id: "work", label: "Operations", icon: <CheckSquare size={14} /> },
          { id: "strategy", label: "Strategy", icon: <BarChart3 size={14} /> },
          { id: "workflows", label: "Workflows", icon: <Layers size={14} /> },
          { id: "company", label: "Company", icon: <Users size={14} /> }
        ].map((mode) => (
          <button 
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeMode === mode.id ? "bg-stone-900 text-white" : "bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-soft)]"
            }`}
          >
            {mode.icon} <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* 3. SIDEBAR: PROJECT EXPLORER */}
        <aside className="w-full lg:w-72 border-r border-[var(--border)] pr-8 space-y-8">
          <div>
            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] mb-4 block">Active Projects</span>
            <div className="space-y-2">
              {projects.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs text-left transition-all ${selectedProject?.id === p.id ? "bg-stone-100 font-bold border-l-4 border-stone-900" : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)]"}`}
                >
                  <span className="truncate">{p.name}</span>
                  <Star size={12} className={selectedProject?.id === p.id ? "text-stone-900" : "opacity-0"} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-stone-50 rounded-3xl space-y-4">
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-stone-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">System Insight</span>
             </div>
             <p className="text-xs font-serif italic leading-relaxed text-stone-500">{insight || "No active scan data."}</p>
          </div>
        </aside>

        {/* 4. DYNAMIC WORKSPACE CONTENT */}
        <div className="flex-1 space-y-10" ref={printRef}>
          <div className="flex flex-wrap gap-8 border-b border-[var(--border)] pb-3">
            {["Overview", "Task Ledger", "Board", "Workload", "OKRs", "Linked Vault"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab.toLowerCase().replace(" ", "-") ? "text-black border-b-2 border-black" : "text-[var(--text-muted)] hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && selectedProject && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-4">
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white border border-stone-100 p-12 rounded-[3.5rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FolderKanban size={120} />
                    </div>
                    <span className="px-4 py-1.5 bg-stone-50 rounded-full text-[9px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Project Profile</span>
                    <h2 className="text-7xl font-serif italic text-stone-900 mt-8 mb-4 tracking-tighter">{selectedProject.name}</h2>
                    <div className="flex gap-4 border-t border-stone-50 pt-10 mt-10">
                        <div className="p-6 bg-stone-50 rounded-[2rem] flex-1">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Target Status</span>
                            <p className="text-3xl font-serif italic text-stone-900 mt-2">Nominal</p>
                        </div>
                        <div className="p-6 bg-stone-50 rounded-[2rem] flex-1">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Active Tasks</span>
                            <p className="text-3xl font-serif italic text-stone-900 mt-2">{tasks.filter(t => t.project_id === selectedProject.id).length}</p>
                        </div>
                    </div>
                </div>

                {/* WORKFLOW SUMMARY CARD */}
                <div className="bg-stone-900 p-12 rounded-[3.5rem] text-white space-y-6">
                    <h3 className="text-2xl font-serif italic">Operational Metrics</h3>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Resources Allocated: 65% Capacity</p>
                </div>
              </div>

              {/* LINKED VAULT PREVIEW */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-stone-400">
                        <StickyNote size={16} /> Linked Ledger
                    </h3>
                    <span className="text-[9px] font-black uppercase text-stone-300">Vault 1.0</span>
                </div>
                <div className="space-y-4">
                    {linkedNotes.length > 0 ? (
                        linkedNotes.map((note) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={note.id} className="p-8 rounded-[2.5rem] shadow-sm border border-black/5 relative overflow-hidden group" style={{ backgroundColor: note.color }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/20 backdrop-blur-md" />
                                <p className="text-xl font-serif italic text-stone-800 leading-tight mb-4">{note.content}</p>
                                <div className="flex items-center gap-2">
                                    <Tag size={10} className="text-stone-400" />
                                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-16 border-2 border-dashed border-stone-100 rounded-[3rem] text-center">
                            <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">No shared context in Vault for<br/>"{selectedProject.name}"</p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TASK LEDGER */}
          {activeTab === "task-ledger" && selectedProject && (
            <div className="bg-white border border-stone-100 p-12 rounded-[3.5rem] shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-serif italic">Task Ledger</h2>
                    <span className="text-[9px] font-black uppercase text-stone-400 border border-stone-100 px-4 py-2 rounded-full">Archive All</span>
                </div>
                <div className="divide-y divide-stone-50 border-t border-stone-50">
                    {tasks.filter(t => t.project_id === selectedProject.id).map(t => (
                        <div key={t.id} className="flex justify-between items-center py-6 px-4 hover:bg-stone-50 rounded-2xl transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-stone-900 transition-all">
                                    <Check size={12} className="text-stone-900 opacity-0 group-hover:opacity-100" />
                                </div>
                                <p className="text-lg font-serif italic text-stone-800">{t.name}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-[9px] font-black uppercase text-stone-400 border border-stone-100 px-3 py-1 rounded-lg">{t.priority}</span>
                                <Trash2 size={14} className="text-stone-200 hover:text-red-400 cursor-pointer transition-all" />
                            </div>
                        </div>
                    ))}
                    <div className="pt-8 mt-4">
                        <input
                            placeholder="Draft new task to ledger..."
                            value={newTaskName[selectedProject.id] || ""}
                            onChange={(e) => setNewTaskName({ ...newTaskName, [selectedProject.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProject.id)}
                            className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none text-xl font-serif italic placeholder:text-stone-200 focus:bg-white focus:border-stone-900 transition-all"
                        />
                    </div>
                </div>
            </div>
          )}

          {/* TAB: OKRs */}
          {activeTab === "okrs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {goals.map(goal => (
                    <div key={goal.id} className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Q3 Target: {goal.target}</span>
                            <span className="text-2xl font-serif italic">{goal.progress}%</span>
                        </div>
                        <h4 className="text-3xl font-serif italic leading-tight">{goal.title}</h4>
                        <div className="w-full h-1.5 bg-stone-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} className="h-full bg-stone-900" />
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* TAB: WORKLOAD */}
          {activeTab === "workload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {workload.map(user => (
                    <div key={user.member} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm flex items-center gap-8">
                        <div className="w-20 h-20 bg-stone-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black">{user.member.charAt(0)}</div>
                        <div className="flex-1 space-y-2">
                            <h3 className="text-3xl font-serif italic">{user.member}</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-stone-400">Utilization</span>
                                <span className="text-[10px] font-black text-stone-900">{user.capacity}%</span>
                            </div>
                            <div className="w-full h-1 bg-stone-50 rounded-full overflow-hidden">
                                <div className="h-full bg-stone-900" style={{ width: `${user.capacity}%` }} />
                            </div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[4rem] p-16 shadow-2xl relative z-10 space-y-12">
              <div className="flex justify-between items-center">
                <h3 className="text-5xl font-serif italic tracking-tighter lowercase">Launch Project</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-stone-300 hover:text-stone-900 transition-colors"><X size={32}/></button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-2">Internal Title / Vault Tag</label>
                <input 
                  autoFocus placeholder="Project Name..."
                  className="w-full text-4xl font-serif italic outline-none border-b-2 border-stone-50 pb-6 focus:border-stone-900 transition-all placeholder:text-stone-100"
                  value={projectName} onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>

              <button onClick={handleCreateProject} disabled={isSyncing} className="w-full bg-stone-900 text-white py-8 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 transition-all hover:bg-stone-800">
                {isSyncing ? <Loader2 size={20} className="animate-spin" /> : "Initiate Workspace"}
              </button>
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
          --brand-primary: #1C1917;
          --bg-soft: #F5F5F3;
        }
      `}</style>
    </div>
  );
}