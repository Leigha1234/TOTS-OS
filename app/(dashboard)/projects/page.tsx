"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe,
  Calendar as CalendarIcon, Clock, CheckSquare, Layers, Users, BarChart3, MessageSquare, Info, Save, ChevronDown, MoreHorizontal, Search, Eye, FileText, Check, AlertCircle, Sparkle, Tag, Folder, PanelLeftClose, PanelLeft, LayoutGrid, ListTodo, ClipboardCheck, ArrowUpRight, FolderKanban, Star, Settings, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("work"); 
  const [activeTab, setActiveTab] = useState("list"); 

  // Application States
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Asana-style Flyout States
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  // Asana-style inline task state
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});

  // Form States
  const [form, setForm] = useState({
    name: "",
    customer_id: "",
  });

  // Intelligence States
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // OKRs and Goals Data
  const [goals] = useState([
    { id: 1, title: "Double ecosystem deployment speed", progress: 75, target: "Q3 2026" },
    { id: 2, title: "Achieve 99.9% uptime on all nodes", progress: 90, target: "Q4 2026" }
  ]);

  // Workload Data
  const [workload] = useState([
    { member: "Jane Doe", tasksAssigned: 5, capacity: 85, status: "Active" },
    { member: "John Smith", tasksAssigned: 3, capacity: 60, status: "Active" },
  ]);

  const loadData = useCallback(async (team: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(name)")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    }
    setProjects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();

      if (!team) {
        const mockTeam = "team-123";
        setTeamId(mockTeam);
        setRole(r || "admin");
        setCustomers([
          { id: "c1", name: "Apex Solutions", team_id: mockTeam }
        ]);
        setProjects([
          { id: "p1", name: "Project Zero", team_id: mockTeam, customers: { name: "Apex Solutions" } }
        ]);
        setTasks([
          { id: "t1", project_id: "p1", name: "Configure Node Network", status: "In Progress", priority: "High", dueDate: "2026-05-15", assignee: "Jane Doe", subtasks: ["Test Sockets", "Compile Data"], comments: ["Setup seems stable."] },
          { id: "t2", project_id: "p1", name: "Run diagnostic baseline", status: "Backlog", priority: "Medium", dueDate: "2026-05-20", assignee: "John Smith", subtasks: [], comments: [] },
          { id: "t3", project_id: "p1", name: "Update pipeline parameters", status: "Completed", priority: "Low", dueDate: "2026-05-01", assignee: "Jane Doe", subtasks: [], comments: [] }
        ]);
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
      loadData(team);
    }
    init();
  }, [loadData]);

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight(
        `Workspace Analysis: The current ecosystem operates at optimal throughput with ${projects.length} nodes active. OKRs show 75% progression towards quarterly targets.`
      );
      setIsScanActive(false);
    }, 2200);
  };

  async function createProject() {
    if (!canCreate(role)) {
      alert("Permission Denied: Administrative clearance required.");
      return;
    }
    if (!form.name || !form.customer_id || !teamId) return;

    const { error } = await supabase.from("projects").insert({
      name: form.name,
      customer_id: form.customer_id,
      team_id: teamId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setForm({ name: "", customer_id: "" });
    if (teamId) {
      loadData(teamId);
    }
  }

  // Asana-style inline task generator
  const handleAddTask = (projectId: string) => {
    const taskName = newTaskName[projectId]?.trim();
    if (!taskName) return;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      name: taskName,
      status: "Backlog",
      priority: "Medium",
      dueDate: new Date().toISOString().split("T")[0],
      assignee: "Unassigned",
      subtasks: [],
      comments: []
    };

    setTasks([...tasks, newTask]);
    setNewTaskName({ ...newTaskName, [projectId]: "" });
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task["status"]) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleUpdateTaskPriority = (taskId: string, newPriority: Task["priority"]) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const handleAddComment = () => {
    if (!selectedTask || !newComment.trim()) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setSelectedTask(prev => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null);
    setNewComment("");
  };

  const handleAddSubtask = () => {
    if (!selectedTask || !newSubtask.trim()) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSubtask]
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setSelectedTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks || []), newSubtask] } : null);
    setNewSubtask("");
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TOTS_Asana_Overview.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Ecosystem Engine...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1700px] mx-auto">
      
      {/* 1. TOP WORKSPACE HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 pb-8 gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-2xl bg-[#a9b897] text-white flex items-center justify-center font-black">T</div>
            <span className="font-serif italic text-xl tracking-tight leading-none font-bold">Workspace</span>
          </div>
          <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em]">Mode: {activeMode}</p>
          <h1 className="text-5xl font-serif italic tracking-tighter leading-none">Projects & Portfolios</h1>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={runClarityScan} 
            disabled={isScanActive}
            className="flex items-center gap-3 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer text-stone-600 hover:text-stone-900"
          >
            {isScanActive ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-[#a9b897]" />}
            <span className="text-[10px] font-black uppercase tracking-wider">Scan Space</span>
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-700 transition-all cursor-pointer"
          >
            <Folder size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Export PDF</span>
          </button>
        </div>
      </header>

      {/* 2. TOP HORIZONTAL NAVIGATION MODES */}
      <div className="flex flex-wrap gap-4 pb-6 border-b border-stone-200/50 mb-12">
        {[
          { id: "work", label: "Work", icon: <CheckSquare size={14} /> },
          { id: "strategy", label: "Strategy", icon: <BarChart3 size={14} /> },
          { id: "workflows", label: "Workflow", icon: <Layers size={14} /> },
          { id: "company", label: "Company", icon: <Users size={14} /> }
        ].map((mode) => (
          <button 
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-semibold tracking-wider transition-all shadow-sm ${
              activeMode === mode.id 
                ? "bg-stone-900 text-white shadow-xl" 
                : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-100/70 hover:text-stone-800"
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* 3. SIDE PANE: PROJECTS LIST */}
        <aside className="w-full lg:w-72 border-r border-stone-200 pr-8 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4 block">Projects</span>
            <div className="space-y-2">
              {projects.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl text-xs text-left font-medium text-stone-600 hover:bg-stone-100 transition-all ${selectedProject?.id === p.id ? "bg-stone-100 font-bold border-l-2 border-[#a9b897]" : ""}`}
                >
                  <span className="truncate">{p.name}</span>
                  <Star size={12} className="text-stone-400" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 4. MAIN WORKSPACE */}
        <div className="flex-1 space-y-10">
          {/* ASANA-STYLE SUB-TABS */}
          <div className="flex flex-wrap gap-4 border-b border-stone-100 pb-3">
            {["Overview", "List", "Board", "Timeline", "Workload", "OKRs"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-2 text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === tab.toLowerCase() 
                    ? "text-[#a9b897] border-b-2 border-[#a9b897]" 
                    : "text-stone-400 hover:text-stone-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW VIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] col-span-2">
                <h2 className="text-2xl font-serif italic text-stone-800 mb-4">Workspace Summary</h2>
                <p className="text-xs text-stone-500 leading-relaxed mb-6">
                  Project portfolio containing workspace performance and deployment nodes. 
                  Select a project below or switch to the List View to assign action items.
                </p>
                
                <div className="flex gap-4 border-t border-stone-50 pt-6 flex-wrap">
                  <div className="p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl w-52">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Total Projects</span>
                    <p className="text-2xl font-serif italic text-stone-800 mt-2">{projects.length}</p>
                  </div>
                  <div className="p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl w-52">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Tasks Active</span>
                    <p className="text-2xl font-serif italic text-stone-800 mt-2">{tasks.length}</p>
                  </div>
                </div>
              </div>

              {/* QUICK FORM */}
              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif italic text-stone-800 mb-6">Add Project</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-1 tracking-wider">Project Name</label>
                      <input
                        placeholder="e.g. Apollo Stream"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full mt-2 p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none focus:ring-4 ring-[#a9b897]/5 font-medium placeholder:text-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-1 tracking-wider">Customer / Node</label>
                      <select
                        value={form.customer_id}
                        onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                        className="w-full mt-2 p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none focus:ring-4 ring-[#a9b897]/5 font-medium cursor-pointer"
                      >
                        <option value="">Select Entity Node...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={createProject}
                  disabled={!form.name || !form.customer_id}
                  className="w-full mt-8 bg-stone-900 text-white py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-stone-700 transition-all disabled:opacity-30 cursor-pointer flex justify-center items-center gap-2"
                >
                  <FolderPlus size={14} /> Create Portfolio
                </button>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {activeTab === "list" && (
            <div ref={printRef} className="pt-4 space-y-8">
              {projects.map((p) => (
                <div key={p.id} className="bg-white border border-stone-200 p-8 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[#a9b897] font-black uppercase text-[9px] tracking-widest">{p.customers?.name || "Global Node"}</span>
                      <h2 className="text-xl font-serif italic text-stone-800">{p.name}</h2>
                    </div>
                    <button 
                      onClick={() => setSelectedProject(p)}
                      className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-100 text-stone-500 rounded-2xl transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      View Details <ArrowUpRight size={14} />
                    </button>
                  </div>
                  
                  {/* Task List Container */}
                  <div className="divide-y divide-stone-100 border-t border-stone-100">
                    {tasks.filter(t => t.project_id === p.id).map(t => (
                      <div 
                        key={t.id} 
                        className="flex justify-between items-center py-5 px-4 hover:bg-stone-50/50 rounded-2xl transition-all"
                      >
                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedTask(t)}>
                          <span className="w-5 h-5 rounded-md border-2 border-stone-300 flex items-center justify-center text-transparent hover:text-[#a9b897] hover:border-[#a9b897] transition-all">
                            <Check size={12} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-stone-800">{t.name}</p>
                            <span className="text-[10px] text-stone-400">Assignee: {t.assignee || "Unassigned"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Priority Selector */}
                          <select
                            value={t.priority}
                            onChange={(e) => handleUpdateTaskPriority(t.id, e.target.value as any)}
                            className="text-[9px] font-black uppercase tracking-wider text-[#a9b897] border border-stone-200/40 rounded-xl p-2 bg-stone-50 cursor-pointer"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>

                          {/* Status Selector */}
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as any)}
                            className="text-[9px] font-bold uppercase tracking-wider text-stone-500 border border-stone-200/40 rounded-xl p-2 bg-stone-50 cursor-pointer"
                          >
                            <option value="Backlog">Backlog</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Quick Task Adding Input */}
                    <div className="flex items-center gap-4 pt-6 mt-2 border-t border-stone-50">
                      <Plus size={14} className="text-stone-400" />
                      <input
                        type="text"
                        placeholder="Add a new task in this list..."
                        value={newTaskName[p.id] || ""}
                        onChange={(e) => setNewTaskName({ ...newTaskName, [p.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(p.id)}
                        className="flex-1 p-3 text-xs bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-[#a9b897]/5 font-medium placeholder:text-stone-300"
                      />
                      <button 
                        onClick={() => handleAddTask(p.id)}
                        className="px-4 py-3 bg-stone-900 text-white text-[9px] font-black tracking-widest rounded-xl uppercase hover:bg-stone-700 transition-all cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BOARD VIEW */}
          {activeTab === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              {["Backlog", "In Progress", "Completed"].map((statusGroup) => (
                <div key={statusGroup} className="bg-stone-50 border border-stone-200/60 p-8 rounded-[2.5rem] min-h-[550px] flex flex-col gap-6">
                  <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                    <h4 className="font-serif italic text-stone-800 text-lg">{statusGroup}</h4>
                    <span className="text-[10px] bg-white border border-stone-100 px-3 py-1 rounded-full text-stone-400 font-bold uppercase tracking-wider">
                      {tasks.filter(t => t.status === statusGroup).length}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {tasks.filter(t => t.status === statusGroup).length === 0 ? (
                      <p className="text-center text-stone-300 italic text-xs py-20">No tasks in this lane.</p>
                    ) : (
                      tasks.filter(t => t.status === statusGroup).map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTask(t)}
                          className="bg-white p-6 rounded-[2rem] border border-stone-200/60 space-y-4 hover:shadow-xl hover:border-[#a9b897]/30 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">ID: {t.id}</span>
                            <span className="text-[8px] font-black text-[#a9b897] uppercase tracking-widest">{t.priority}</span>
                          </div>
                          <p className="text-xs font-black text-stone-800 leading-tight">{t.name}</p>
                          <div className="flex justify-between items-center text-[9px] text-stone-400">
                            <span>Assignee: {t.assignee || "Open"}</span>
                            <span>{t.dueDate}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TIMELINE VIEW */}
          {activeTab === "timeline" && (
            <div className="bg-white border border-stone-200 p-12 rounded-3xl space-y-10 pt-8">
              <div>
                <h3 className="font-serif italic text-stone-800 text-xl leading-none">Stream Schedule</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Timeline dependencies</p>
              </div>
              <div className="space-y-8">
                {projects.map((p, index) => (
                  <div key={p.id} className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-50 pb-6 gap-6">
                    <div className="space-y-1">
                      <span className="text-[#a9b897] text-[8px] font-black tracking-wider uppercase">Stream {index + 1}</span>
                      <h4 className="text-sm font-bold text-stone-800">{p.name}</h4>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">{p.customers?.name || ""}</p>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                      <span className="text-[10px] font-mono text-stone-400">In Progress</span>
                      <div className="w-56 bg-stone-100 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "70%" }} viewport={{ once: true }} className="h-full bg-[#a9b897]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORKLOAD VIEW */}
          {activeTab === "workload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {workload.map((w, index) => (
                <div key={index} className="bg-white border border-stone-200 p-10 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#a9b897]/10 rounded-2xl flex items-center justify-center text-[#a9b897]">
                        <Users size={18} />
                      </div>
                      <div>
                        <h4 className="font-serif italic text-stone-800 text-md leading-none">{w.member}</h4>
                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider mt-1 block">Team Resource</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-wider border border-green-200/60">
                      {w.status}
                    </span>
                  </div>
                  <div className="space-y-3 pt-6 border-t border-stone-50">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Tasks Assigned</span>
                      <span className="font-bold text-stone-800">{w.tasksAssigned} Items</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Resource Bandwidth</span>
                      <span className="font-bold text-stone-800">{w.capacity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OKRs VIEW */}
          {activeTab === "okrs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {goals.map((g) => (
                <div key={g.id} className="bg-white border border-stone-200 p-10 rounded-[2.5rem] space-y-8">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-[#a9b897] uppercase tracking-[0.2em]">Target Metric</span>
                    <h3 className="text-lg font-serif italic text-stone-900 leading-tight">{g.title}</h3>
                  </div>
                  <div className="space-y-3 pt-6 border-t border-stone-50">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>Progression Index</span>
                      <span>{g.progress}% Complete</span>
                    </div>
                    <div className="w-full h-3 bg-stone-50 border border-stone-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${g.progress}%` }} viewport={{ once: true }} className="h-full bg-stone-900" />
                    </div>
                    <p className="text-[9px] font-bold text-stone-400 pt-2 tracking-widest uppercase">Target Period: {g.target}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. ASANA TASK DETAIL FLYOUT */}
      {selectedTask && (
        <div className="fixed inset-0 z-[200] bg-stone-950/40 backdrop-blur-sm p-6 overflow-y-auto flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl min-h-screen shadow-2xl p-12 border-l border-stone-200/50 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-8 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="w-5 h-5 rounded-md border-2 border-stone-300 flex items-center justify-center text-transparent hover:text-[#a9b897] hover:border-[#a9b897] cursor-pointer">
                    <Check size={12} />
                  </span>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">TASK-{selectedTask.id}</span>
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6 mt-8">
                <h2 className="text-3xl font-serif text-stone-800 tracking-tight">{selectedTask.name}</h2>
                <div className="flex gap-6 text-[10px] font-medium text-stone-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><User size={12}/> Assignee: {selectedTask.assignee || "Unassigned"}</span>
                  <span className="flex items-center gap-2"><Clock size={12}/> Due: {selectedTask.dueDate}</span>
                </div>

                {/* Subtask Module */}
                <div className="pt-6 border-t border-stone-50">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-4">Subtasks</span>
                  <div className="space-y-2">
                    {selectedTask.subtasks?.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200/40 rounded-xl text-xs font-medium text-stone-700">
                        <span className="w-4 h-4 rounded border border-stone-300"></span>
                        {sub}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <input 
                      value={newSubtask} 
                      onChange={(e) => setNewSubtask(e.target.value)} 
                      placeholder="Add subtask..."
                      className="flex-1 p-3 text-xs bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-[#a9b897]/5 font-medium placeholder:text-stone-300"
                    />
                    <button onClick={handleAddSubtask} className="bg-[#a9b897] text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:opacity-90">
                      Add
                    </button>
                  </div>
                </div>

                {/* Discussion Comments Module */}
                <div className="pt-6 border-t border-stone-50">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-4">Discussion Board</span>
                  <div className="space-y-4 mb-4">
                    {selectedTask.comments?.map((c, i) => (
                      <div key={i} className="p-4 bg-stone-50 border border-stone-200/20 rounded-2xl text-xs text-stone-600">
                        {c}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="text" 
                      placeholder="Write comment..." 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      className="flex-1 p-4 text-xs bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-[#a9b897]/5 font-medium placeholder:text-stone-300"
                    />
                    <button 
                      onClick={handleAddComment} 
                      className="bg-stone-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-stone-700 transition-all"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedTask(null)} 
              className="w-full bg-stone-100 border border-stone-200/60 mt-8 py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:bg-stone-200 transition-all"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}