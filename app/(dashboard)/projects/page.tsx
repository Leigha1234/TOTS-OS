"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
  const [activeTab, setActiveTab] = useState("overview"); 

  // Application States
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Flyout & Task Selection
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

  // Mock OKRs and Workload
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

  const loadData = useCallback(async (team: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(name)")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    if (!error) setProjects(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();

      if (!team) {
        // Mock data initialization
        setTeamId("team-123");
        setRole("admin");
        setCustomers([{ id: "c1", name: "Apex Solutions" }]);
        setProjects([
          { id: "p1", name: "Project Zero", customers: { name: "Apex Solutions" } },
          { id: "p2", name: "Atlas Stream", customers: { name: "Apex Solutions" } }
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

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight("Optimal throughput detected.");
      setIsScanActive(false);
    }, 2200);
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
  };

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 lg:p-12 max-w-[1700px] mx-auto">
      
      {/* Workspace Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--border)] pb-8 gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-black">T</div>
            <span className="font-serif italic text-xl font-bold">Workspace</span>
          </div>
          <p className="text-[var(--brand-primary)] font-black uppercase text-[9px] tracking-[0.3em]">Mode: {activeMode}</p>
          <h1 className="text-5xl font-serif italic tracking-tighter leading-none">Projects & Portfolios</h1>
        </div>

        <div className="flex gap-3">
          <button onClick={runClarityScan} disabled={isScanActive} className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border)] px-6 py-4 rounded-2xl shadow-sm hover:shadow-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
            {isScanActive ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-[var(--brand-primary)]" />}
            <span className="text-[10px] font-black uppercase tracking-wider">Scan Space</span>
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-700 transition-all">
            <Folder size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Export PDF</span>
          </button>
        </div>
      </header>

      {/* Mode Navigation */}
      <div className="flex flex-wrap gap-4 pb-6 border-b border-[var(--border)] mb-12">
        {[
          { id: "work", label: "Work", icon: <CheckSquare size={14} /> },
          { id: "strategy", label: "Strategy", icon: <BarChart3 size={14} /> },
          { id: "workflows", label: "Workflow", icon: <Layers size={14} /> },
          { id: "company", label: "Company", icon: <Users size={14} /> }
        ].map((mode) => (
          <button 
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-semibold transition-all ${
              activeMode === mode.id ? "bg-stone-900 text-white" : "bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-soft)]"
            }`}
          >
            {mode.icon} <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Project List Aside */}
        <aside className="w-full lg:w-72 border-r border-[var(--border)] pr-8">
          <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] mb-4 block">Projects</span>
          <div className="space-y-2">
            {projects.map((p) => (
              <button 
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs text-left text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-all ${selectedProject?.id === p.id ? "bg-[var(--bg-soft)] font-bold border-l-2 border-[var(--brand-primary)]" : ""}`}
              >
                <span className="truncate">{p.name}</span>
                <Star size={12} className="text-[var(--text-muted)]" />
              </button>
            ))}
          </div>
        </aside>

        {/* Dynamic Content */}
        <div className="flex-1 space-y-10">
          <div className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-3">
            {["Overview", "List", "Board", "Timeline", "Workload", "OKRs"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-2 text-xs font-bold uppercase transition-all ${
                  activeTab === tab.toLowerCase() ? "text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="bg-[var(--card-bg)] border border-[var(--border)] p-8 rounded-[2.5rem] col-span-2">
                <h2 className="text-2xl font-serif italic text-[var(--text-main)] mb-4">Workspace Summary</h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">Portfolio performance metrics.</p>
                <div className="flex gap-4 border-t border-[var(--border)] pt-6">
                  <div className="p-5 bg-[var(--bg-soft)] rounded-2xl w-40">
                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)]">Projects</span>
                    <p className="text-2xl font-serif italic text-[var(--text-main)] mt-2">{projects.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "list" && (
            <div ref={printRef} className="pt-4 space-y-8">
              {projects.map((p) => (
                <div key={p.id} className="bg-[var(--card-bg)] border border-[var(--border)] p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[var(--brand-primary)] font-black uppercase text-[9px] tracking-widest">{p.customers?.name || "Node"}</span>
                      <h2 className="text-xl font-serif italic text-[var(--text-main)]">{p.name}</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                    {tasks.filter(t => t.project_id === p.id).map(t => (
                      <div key={t.id} className="flex justify-between items-center py-5 px-4 hover:bg-[var(--bg-soft)] rounded-2xl transition-all">
                        <div className="flex items-center gap-4 cursor-pointer">
                          <Check size={12} className="text-[var(--text-muted)]" />
                          <p className="text-xs font-bold text-[var(--text-main)]">{t.name}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase text-[var(--brand-primary)]">{t.priority}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-4 pt-6 mt-2 border-t border-[var(--border)]">
                      <input
                        placeholder="Add task..."
                        value={newTaskName[p.id] || ""}
                        onChange={(e) => setNewTaskName({ ...newTaskName, [p.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(p.id)}
                        className="flex-1 p-3 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl outline-none text-[var(--text-main)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}