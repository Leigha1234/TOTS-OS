"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { useRouter } from "next/navigation";
import { 
  Plus, Check, Calendar, Users, 
  Clock, FileText, Layout, 
  MoreHorizontal, CalendarDays,
  UserPlus, StickyNote, ArrowUpRight, 
  Zap, Settings, X, Save, Archive, 
  Flag, ChevronRight, Activity, 
  Upload, Copy, Trash2, Link, FolderPlus,
  Filter, Search, Info, ExternalLink, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- INTERFACES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  due_date?: string;
  members?: string;
  category: string;
  objective_summary?: string;
  created_at: string;
}

interface VaultItem {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  category: string;
  created_at: string;
}

export default function TotsWorkspace() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Project Form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Development");
  const [formDue, setFormDue] = useState("");

  // Task Scheduler Form
  const [taskName, setTaskName] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Scoped Settings State
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editObjective, setEditObjective] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA FETCHING ---
  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    const [projRes, taskRes, vaultRes] = await Promise.all([
      supabase.from("projects").select("*").eq("team_id", id).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("*"),
      supabase.from("vault_items").select("*")
    ]);

    setProjects(projRes.data || []);
    setTasks(taskRes.data || []);
    setVaultItems(vaultRes.data || []);

    if (projRes.data?.length && !selectedProject) {
      const initial = projRes.data[0];
      setSelectedProject(initial);
      syncSettingsState(initial);
    }
    setLoading(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      const tid = id || "default-team";
      setTeamId(tid);
      loadData(tid);
    });
  }, [loadData]);

  const syncSettingsState = (p: Project) => {
    setEditName(p.name);
    setEditDue(p.due_date || "");
    setEditMembers(p.members || "");
    setEditObjective(p.objective_summary || "");
  };

  const handleProjectSelect = (p: Project) => {
    setSelectedProject(p);
    syncSettingsState(p);
  };

  // --- ACTIONS ---
  const copyTeamLink = () => {
    const link = `${window.location.origin}/join/${selectedProject?.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Team Link Copied", { description: "Paste this to collaborators." });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploading(true);
    const sanitizedName = selectedProject.name.replace(/\s+/g, '-').toLowerCase();
    const filePath = `${sanitizedName}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload Failed", { description: uploadError.message });
    } else {
      const { data, error: dbError } = await supabase.from("vault_items").insert([{
        project_id: selectedProject.id,
        file_name: file.name,
        file_path: filePath,
        category: "Upload"
      }]).select();

      if (!dbError && data) {
        setVaultItems(prev => [...prev, ...data]);
        toast.success("Vault Synchronized", { description: `${file.name} is now stored.` });
      }
    }
    setIsUploading(false);
  };

  const handleCreateProject = async () => {
    if (!formName || !teamId) return;
    const { data, error } = await supabase.from("projects").insert([{
      name: formName,
      category: formCategory,
      due_date: formDue,
      team_id: teamId
    }]).select();

    if (!error && data) {
      setProjects(prev => [data[0], ...prev]);
      setSelectedProject(data[0]);
      setShowCreateModal(false);
      setFormName("");
      toast.success("Workspace Initialized");
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update({
      name: editName,
      due_date: editDue,
      members: editMembers,
      objective_summary: editObjective
    }).eq("id", selectedProject.id);

    if (!error) {
      toast.success("Parameters Updated");
      setShowSettings(false);
      if (teamId) loadData(teamId);
    }
  };

  const handleAddTask = async () => {
    if (!taskName || !selectedProject) return;
    const { data, error } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id,
      name: taskName,
      assigned_to: taskAssignee,
      due_date: taskDueDate,
      priority: taskPriority,
      status: 'Backlog'
    }]).select();

    if (!error && data) {
      setTasks(prev => [...prev, ...data]);
      setTaskName("");
      toast.success("Task Scheduled");
    }
  };

  // --- FILTERS ---
  const currentTasks = useMemo(() => 
    tasks.filter(t => t.project_id === selectedProject?.id), 
  [tasks, selectedProject]);

  const currentVault = useMemo(() => 
    vaultItems.filter(v => v.project_id === selectedProject?.id), 
  [vaultItems, selectedProject]);

  const memberList = useMemo(() => 
    selectedProject?.members ? selectedProject.members.split(',').map(m => m.trim()) : [],
  [selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-[#A3B18A] selection:text-white pb-24">
      
      {/* 1. PROJECT LEDGER (INLINE SELECTOR) */}
      <div className="sticky top-0 z-[50] bg-white/80 backdrop-blur-xl border-b border-slate-50 px-8 lg:px-20 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {projects.map(p => (
            <button 
              key={p.id}
              onClick={() => handleProjectSelect(p)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedProject?.id === p.id ? "bg-[#A3B18A] text-white shadow-lg shadow-[#A3B18A]/20" : "text-slate-300 hover:text-black"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-dashed border-slate-200 text-slate-400 hover:border-[#A3B18A] hover:text-[#A3B18A] transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Plus size={14} /> New Ledger
          </button>
        </div>

        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/vault')} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-all flex items-center gap-2">
             <Archive size={14} /> Global Vault
           </button>
           <button onClick={() => router.push('/notes')} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-all flex items-center gap-2">
             <StickyNote size={14} /> Notes
           </button>
        </div>
      </div>

      <main className="max-w-[1500px] mx-auto px-8 lg:px-20 mt-16 lg:mt-24">
        {selectedProject ? (
          <div className="space-y-24">
            
            {/* HERO MODULE */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#F2F2F2] rounded-md text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">
                    {selectedProject.category}
                  </span>
                  <button onClick={copyTeamLink} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-[#A3B18A] transition-all">
                    <Link size={14}/> Send Team Link
                  </button>
                </div>
                
                <h1 className="text-8xl lg:text-9xl font-serif italic tracking-tighter leading-[0.8] mb-4">
                  {selectedProject.name}
                </h1>
                
                <p className="text-xl font-serif text-slate-400 italic max-w-2xl">
                  {selectedProject.objective_summary || "Adjust project settings to define a workspace objective."}
                </p>

                <div className="flex gap-10 pt-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Project Deadline</p>
                    <p className="text-xs font-bold">{selectedProject.due_date || "Continuous"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Active Personnel</p>
                    <p className="text-xs font-bold">{memberList.length} Members</p>
                  </div>
                </div>
              </div>

              {/* ACTION: FILE INTAKE */}
              <div className="w-full lg:w-96 space-y-4">
                <div className="flex items-center justify-between px-4">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Vault Intake</p>
                   <FolderPlus size={14} className="text-[#A3B18A]" />
                </div>
                <label className="group relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-100 rounded-[3rem] bg-[#F2F2F2]/40 hover:bg-[#A3B18A]/5 hover:border-[#A3B18A] transition-all cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    {isUploading ? <Activity className="animate-spin text-[#A3B18A]" /> : <Upload className="text-slate-300 group-hover:text-[#A3B18A] mb-3" size={28} />}
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync File to Project Vault</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-12 gap-16 lg:gap-24">
              
              {/* LEFT: TIMELINE ENGINE */}
              <div className="col-span-12 lg:col-span-8 space-y-20">
                
                {/* SCHEDULER */}
                <div className="space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Task Pulse</h2>
                    <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-[#F2F2F2] rounded-xl transition-all text-slate-400 hover:text-black">
                      <Settings size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={taskName} onChange={e => setTaskName(e.target.value)}
                      placeholder="Input objective..."
                      className="col-span-1 md:col-span-2 bg-[#F2F2F2] p-8 rounded-[2.5rem] text-3xl font-serif italic outline-none border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all"
                    />
                    <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="bg-[#F2F2F2] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none cursor-pointer">
                      <option value="">Personnel</option>
                      {memberList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                    <div className="relative">
                      <CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="w-full bg-[#F2F2F2] p-5 pl-14 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none" />
                    </div>
                  </div>
                  <button onClick={handleAddTask} className="w-full bg-black text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3">
                    Schedule Objective <ChevronRight size={14} />
                  </button>
                </div>

                {/* HORIZONTAL TIMELINE */}
                <div className="space-y-8">
                   <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Visual Pulse</h3>
                   <div className="relative overflow-x-auto no-scrollbar pb-6">
                      <div className="flex gap-6 min-w-[1100px]">
                        {currentTasks.length > 0 ? currentTasks.map((t) => (
                          <div key={t.id} className="w-80 shrink-0 space-y-4">
                            <div className="h-[1px] w-full bg-slate-100 relative">
                               <div className="absolute -top-[3px] left-0 w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
                            </div>
                            <div className="bg-white border border-slate-50 p-8 rounded-[3rem] space-y-4 hover:shadow-2xl hover:shadow-slate-100 transition-all group">
                               <div className="flex justify-between">
                                  <span className="text-[8px] font-black uppercase text-slate-300">{t.due_date || "Continuous"}</span>
                                  <Flag size={12} className={t.priority === 'High' ? "text-red-400" : "text-slate-100"} />
                               </div>
                               <h4 className="text-2xl font-serif italic text-black leading-tight">{t.name}</h4>
                               <div className="flex items-center gap-3 pt-2">
                                  <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center text-[9px] text-white font-bold">{t.assigned_to?.charAt(0) || '?'}</div>
                                  <span className="text-[10px] font-bold text-slate-400">{t.assigned_to || "Open"}</span>
                               </div>
                            </div>
                          </div>
                        )) : (
                          <div className="w-full py-20 border border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 opacity-50">
                             <Target size={32} />
                             <p className="text-[10px] font-black uppercase tracking-widest">No Active Objectives</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT: ASSET VAULT & PERSONNEL */}
              <div className="col-span-12 lg:col-span-4 space-y-16">
                
                {/* PROJECT ASSETS */}
                <div className="space-y-8">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Project Assets</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {currentVault.map(v => (
                      <div key={v.id} className="bg-[#F2F2F2] p-5 rounded-2xl flex items-center justify-between group hover:bg-black hover:text-white transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-black">
                             <FileText size={18} />
                           </div>
                           <div>
                              <p className="text-[11px] font-bold truncate max-w-[150px]">{v.file_name}</p>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{v.category}</p>
                           </div>
                        </div>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    {currentVault.length === 0 && <p className="text-[10px] text-slate-300 italic px-4">No assets in this ledger.</p>}
                  </div>
                </div>

                {/* TEAM STATUS */}
                <div className="bg-black p-10 rounded-[3.5rem] text-white space-y-8">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Personnel</h3>
                  <div className="space-y-6">
                    {memberList.map((m, i) => (
                      <div key={i} className="flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black group-hover:border-[#A3B18A] transition-all">{m.charAt(0)}</div>
                            <span className="text-[11px] font-bold">{m}</span>
                         </div>
                         <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]/20 group-hover:bg-[#A3B18A]" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
             <Layout size={40} className="text-slate-100" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200">Synchronize Workspace</p>
          </div>
        )}
      </main>

      {/* MODAL: CREATE PROJECT */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-white/40 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xl rounded-[4rem] p-16 shadow-2xl border border-slate-50 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all"><X size={24}/></button>
              <h3 className="text-5xl font-serif italic tracking-tighter mb-12">New Ledger</h3>
              <div className="space-y-8">
                <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F2F2F2] p-8 rounded-[2.5rem] outline-none font-serif italic text-3xl" placeholder="Project name..." />
                <div className="grid grid-cols-2 gap-4">
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="bg-[#F2F2F2] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none">
                    <option value="Development">Development</option>
                    <option value="Creative">Creative</option>
                    <option value="Internal">Internal</option>
                  </select>
                  <input type="date" value={formDue} onChange={e => setFormDue(e.target.value)} className="bg-[#F2F2F2] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none" />
                </div>
                <button onClick={handleCreateProject} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-[#A3B18A] transition-all">Initialize Workspace</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SETTINGS (SCOPED) */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-white/40 backdrop-blur-xl">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl border border-slate-50">
              <div className="flex justify-between items-start mb-12">
                 <h3 className="text-4xl font-serif italic tracking-tighter">Workspace Params</h3>
                 <button onClick={() => setShowSettings(false)} className="p-3 bg-[#F2F2F2] rounded-2xl hover:bg-black hover:text-white transition-all"><X size={20}/></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Project Title</label>
                   <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-serif italic text-2xl" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Core Objective</label>
                   <textarea rows={3} value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-serif italic text-lg resize-none" placeholder="What is the goal?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Deadline</label>
                     <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Personnel (CSV)</label>
                     <input value={editMembers} onChange={e => setEditMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" placeholder="David, Leigha..." />
                  </div>
                </div>
                <button onClick={handleUpdateSettings} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3">
                   <Save size={16} /> Sync Parameters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}