"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe,
  Calendar as CalendarIcon, Clock, CheckSquare, Layers, Users, BarChart3, MessageSquare, Info, Save, ChevronDown, MoreHorizontal, Search, Eye, FileText, Check, AlertCircle, Sparkle, Tag, Folder, PanelLeftClose, PanelLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'board', 'timeline', 'workload', 'okrs'

  // States
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Expanded Sections state
  const [collapsed, setCollapsed] = useState(false);

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
          { id: "t1", project_id: "p1", name: "Configure Node Network", status: "In Progress", priority: "High" },
          { id: "t2", project_id: "p1", name: "Run diagnostic baseline", status: "Backlog", priority: "Medium" },
          { id: "t3", project_id: "p1", name: "Update pipeline parameters", status: "Completed", priority: "Low" }
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

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TOTS_Projects_Overview.pdf`);
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER: TITLE & INTELLIGENCE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Globe size={14} className="animate-pulse" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Integrated Workspaces</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Projects & Workspaces</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {isScanActive ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="animate-spin text-[#a9b897]" size={20} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Sparkles className="text-[#a9b897] group-hover:rotate-12 transition-transform" size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Analysis..." : "Request Workspace Scan"}
          </span>
        </motion.button>
      </header>

      {/* CLARITY INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#1c1c1c] text-stone-100 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#a9b897]/30"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-[#a9b897]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#a9b897]/20">
                <Zap className="text-[#a9b897]" size={32} />
              </div>
              <div>
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em] mb-2">Synthetic Insight</p>
                <p className="font-serif italic text-2xl text-stone-200 leading-snug max-w-3xl">{insight}</p>
              </div>
            </div>
            <button 
              onClick={() => setInsight(null)} 
              className="p-3 hover:bg-stone-800 rounded-full text-stone-500 transition-colors cursor-pointer"
            >
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-4 justify-between items-center">
        <div className="flex flex-wrap gap-3">
          {["list", "board", "timeline", "workload", "okrs"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
                activeTab === tab ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              {tab === "list" && "List View"}
              {tab === "board" && "Kanban Board"}
              {tab === "timeline" && "Timeline & Gantt"}
              {tab === "workload" && "Resource Workload"}
              {tab === "okrs" && "Objectives & OKRs"}
            </button>
          ))}
        </div>

        {activeTab === "list" && (
          <button
            onClick={downloadPDF}
            className="px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[10px] font-black tracking-widest uppercase text-stone-500 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
          >
            <Folder size={14} /> Export All
          </button>
        )}
      </div>

      {/* PAGE MODULES */}
      
      {/* 1. LIST VIEW */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-4">
          <aside className={`lg:col-span-4 transition-all duration-300 ${collapsed ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10 sticky top-32">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">Deployment Hub</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initialize New Workspace Stream</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Objective Designation</label>
                  <input
                    placeholder="e.g. Project Overclock"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Associated Entity</label>
                  <div className="relative">
                    <select
                      value={form.customer_id}
                      onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none appearance-none transition-all cursor-pointer font-medium"
                    >
                      <option value="">Select Entity Node...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Plus size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300" />
                  </div>
                </div>

                <button
                  onClick={createProject}
                  disabled={!canCreate(role) || !form.name || !form.customer_id}
                  className="w-full py-6 rounded-[2rem] flex justify-center items-center gap-4 group shadow-xl bg-stone-900 text-white disabled:opacity-50 cursor-pointer border-0 font-bold tracking-[0.3em]"
                >
                  {canCreate(role) ? (
                    <>
                      <FolderPlus size={20} className="group-hover:scale-110 transition-transform text-[#a9b897]" />
                      <span className="text-[10px] font-black tracking-[0.2em]">Commit Deployment</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} className="text-red-400" />
                      <span className="text-[10px] font-black tracking-[0.2em]">Clearance Inhibited</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between bg-white border border-stone-100 p-6 rounded-3xl shadow-sm">
              <div className="relative flex-1 max-w-lg">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Search and filter workspaces..." 
                  className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none focus:ring-4 ring-[#a9b897]/5"
                />
              </div>

              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-all flex items-center gap-2 text-xs font-semibold uppercase text-stone-500"
              >
                {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                {collapsed ? "Expand" : "Collapse"}
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="h-[500px] border-2 border-dashed border-stone-200 rounded-[4rem] flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                  <Briefcase size={32} className="text-stone-300" />
                </div>
                <p className="text-stone-400 font-serif italic text-2xl">No architecture nodes detected in current ecosystem.</p>
              </div>
            ) : (
              <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {projects.map((p) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    key={p.id} 
                    onClick={() => setSelectedProject(p)}
                    className="bg-white border border-stone-100 p-10 rounded-[3.2rem] shadow-sm hover:shadow-xl hover:border-[#a9b897]/20 transition-all cursor-pointer flex flex-col justify-between h-[340px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <div className="bg-[#faf9f6] p-5 rounded-[1.5rem] text-stone-400 group-hover:text-[#a9b897] transition-all">
                          <Activity size={24} />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[8px] font-black uppercase text-stone-500 tracking-[0.1em]">Operational</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-serif italic text-stone-800 leading-tight">{p.name}</h3>
                      <p className="text-[10px] text-[#a9b897] uppercase font-black mt-3 tracking-[0.2em]">
                        {p.customers?.name || "Independent Node"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-stone-50">
                      <span className="text-[9px] tracking-widest text-stone-400 uppercase font-bold">2 / 4 Steps Done</span>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 group">
                        Inspect <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* 2. BOARD (KANBAN) VIEW */}
      {activeTab === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4">
          {["Backlog", "In Progress", "Completed"].map((statusGroup) => (
            <div key={statusGroup} className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] min-h-[600px] flex flex-col gap-6">
              <div className="flex justify-between items-center pb-2 border-b border-stone-50">
                <h4 className="font-serif italic text-stone-800 text-lg">{statusGroup}</h4>
                <span className="text-[10px] bg-stone-50 border border-stone-100 px-3 py-1 rounded-full text-stone-400 font-bold uppercase tracking-wider">
                  {tasks.filter(t => t.status === statusGroup).length}
                </span>
              </div>
              
              <div className="space-y-4">
                {tasks.filter(t => t.status === statusGroup).length === 0 ? (
                  <p className="text-center text-stone-300 italic text-xs py-20">No tasks in this lane.</p>
                ) : (
                  tasks.filter(t => t.status === statusGroup).map(t => (
                    <div key={t.id} className="bg-stone-50/60 p-6 rounded-[2rem] border border-stone-200/40 space-y-4 hover:shadow-md transition-all">
                      <p className="text-sm font-black text-stone-800 leading-tight">{t.name}</p>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#a9b897] font-bold">
                        <span>{t.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. TIMELINE & GANTT VIEW */}
      {activeTab === "timeline" && (
        <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] space-y-12 pt-8">
          <div>
            <h3 className="font-serif italic text-stone-800 text-2xl leading-none">Project Gantt Forecast</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Timeline Dependencies</p>
          </div>

          <div className="space-y-8">
            {projects.map((p, index) => (
              <div key={p.id} className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-50 pb-6 gap-4 group">
                <div className="space-y-1">
                  <span className="text-[#a9b897] text-[9px] font-black tracking-[0.2em] uppercase">0{index + 1} / Stream</span>
                  <h4 className="text-lg font-bold text-stone-800">{p.name}</h4>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">{p.customers?.name || ""}</p>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono text-stone-800 font-bold">In-Progress</span>
                    <span className="text-[10px] text-stone-400">Phase 2 / 4</span>
                  </div>
                  <div className="w-48 bg-stone-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: true }}
                      className="bg-[#a9b897] h-full" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RESOURCE WORKLOAD VIEW */}
      {activeTab === "workload" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {workload.map((w, index) => (
            <div key={index} className="bg-white border border-stone-200 p-10 rounded-[3rem] space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#a9b897]/10 rounded-2xl flex items-center justify-center text-[#a9b897]">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-serif italic text-stone-800 text-lg leading-none">{w.member}</h4>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider mt-1 block">Team Resource</span>
                  </div>
                </div>
                <span className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-200/50">
                  {w.status}
                </span>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-50">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Tasks Assigned</span>
                  <span className="font-bold text-stone-800">{w.tasksAssigned} Items</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Capacity / Bandwidth</span>
                  <span className="font-bold text-stone-800">{w.capacity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. OBJECTIVES & OKRS VIEW */}
      {activeTab === "okrs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {goals.map((g) => (
            <div key={g.id} className="bg-white border border-stone-200 p-10 rounded-[3rem] space-y-8">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-[#a9b897] uppercase tracking-[0.2em]">Target / OKR</span>
                <h3 className="text-xl font-serif italic text-stone-900 leading-tight">{g.title}</h3>
              </div>
              
              <div className="space-y-3 pt-6 border-t border-stone-50">
                <div className="flex justify-between text-xs font-bold text-stone-800">
                  <span>Progression Index</span>
                  <span>{g.progress}% Complete</span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${g.progress}%` }}
                    viewport={{ once: true }}
                    className="h-full bg-stone-900" 
                  />
                </div>
                <p className="text-[10px] font-medium text-stone-400 pt-2 tracking-wide">Target Period: {g.target}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SELECTED PROJECT FLYOUT / MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-[120] bg-stone-950/40 backdrop-blur-sm p-8 md:p-12 overflow-y-auto flex items-center justify-center">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] p-16 shadow-2xl relative border border-stone-100 min-h-[550px] flex flex-col justify-between">
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-12 right-12 p-4 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2 block">
                {selectedProject.customers?.name || "Operational Node"}
              </span>
              <h2 className="text-5xl font-serif text-stone-800 tracking-tighter mb-4">
                {selectedProject.name}
              </h2>

              <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-stone-100">
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 w-72">
                  <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase block mb-1">Ecosystem Status</span>
                  <p className="text-xs font-bold text-stone-800">Active and Synchronized</p>
                </div>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 w-72">
                  <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase block mb-1">Active Tasks</span>
                  <p className="text-xs font-bold text-stone-800">{tasks.length} items to complete</p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase block mb-2">Task Breakdown</span>
                {tasks.map((task, idx) => (
                  <div key={task.id} className="flex justify-between items-center p-6 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-stone-400">0{idx + 1}</span>
                      <p className="text-xs font-bold text-stone-800">{task.name}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-stone-200/60 text-[#a9b897]">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-stone-100">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                Identifier: {selectedProject.id}
              </span>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="px-8 py-4 bg-stone-100 text-stone-600 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-stone-200 transition-all cursor-pointer"
                >
                  Close Panel
                </button>
                <a 
                  href={`/projects/${selectedProject.id}`}
                  className="no-underline px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-stone-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  Launch Stream <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}