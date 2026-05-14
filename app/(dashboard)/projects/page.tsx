"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  ExternalLink, Target, Info, Globe
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
}

export default function TotsWorkspaceV5() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Core Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form States
  const [formName, setFormName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Scoped Edit States
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editObjective, setEditObjective] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA LOADING ---
  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    const [pRes, tRes, vRes] = await Promise.all([
      supabase.from("projects").select("*").eq("team_id", id).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("*"),
      supabase.from("vault_items").select("*")
    ]);

    setProjects(pRes.data || []);
    setTasks(tRes.data || []);
    setVaultItems(vRes.data || []);

    if (pRes.data?.length && !selectedProject) {
      handleProjectSelect(pRes.data[0]);
    }
    setLoading(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      const tid = id || "default_team";
      setTeamId(tid);
      loadData(tid);
    });
  }, [loadData]);

  const handleProjectSelect = (p: Project) => {
    setSelectedProject(p);
    setEditName(p.name);
    setEditDue(p.due_date || "");
    setEditMembers(p.members || "");
    setEditObjective(p.objective_summary || "");
  };

  // --- FUNCTIONAL ACTIONS ---
  const handleSendTeamLink = () => {
    if (!selectedProject) return;
    const shareUrl = `${window.location.origin}/project/${selectedProject.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Team Link Active", {
      description: "Clipboard synced. Personnel can now access this ledger.",
      icon: <Globe size={14} className="text-[#A3B18A]" />
    });
  };

  const handleVaultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploading(true);
    const folderName = selectedProject.name.replace(/\s+/g, '-').toLowerCase();
    const filePath = `vault/${folderName}/${Date.now()}-${file.name}`;

    const { error: storageError } = await supabase.storage
      .from("assets")
      .upload(filePath, file);

    if (storageError) {
      toast.error("Upload Interrupted", { description: storageError.message });
    } else {
      const { data, error: dbError } = await supabase.from("vault_items").insert([{
        project_id: selectedProject.id,
        file_name: file.name,
        file_path: filePath,
        category: "Workspace Asset"
      }]).select();

      if (!dbError && data) {
        setVaultItems(prev => [...prev, ...data]);
        toast.success("Vault Synchronized", { description: `Stored in /vault/${folderName}` });
      }
    }
    setIsUploading(false);
  };

  const handleAddTask = async () => {
    if (!taskName || !selectedProject) return;
    const { data, error } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id,
      name: taskName,
      assigned_to: taskAssignee,
      due_date: taskDueDate,
      priority: taskPriority
    }]).select();

    if (!error && data) {
      setTasks(prev => [...prev, ...data]);
      setTaskName("");
      toast.success("Objective Scheduled");
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
      toast.success("Parameters Locked");
      setShowSettings(false);
      if (teamId) loadData(teamId);
    }
  };

  // --- FILTERS ---
  const currentTasks = useMemo(() => 
    tasks.filter(t => t.project_id === selectedProject?.id), 
  [tasks, selectedProject]);

  const currentVault = useMemo(() => 
    vaultItems.filter(v => v.project_id === selectedProject?.id), 
  [vaultItems, selectedProject]);

  const memberArray = useMemo(() => 
    selectedProject?.members ? selectedProject.members.split(',').map(m => m.trim()) : [],
  [selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pb-32">
      
      {/* 1. ON-PAGE LEDGER NAVIGATION (No Top Bar) */}
      <div className="px-8 lg:px-20 py-12 flex flex-wrap items-center gap-3">
        {projects.map(p => (
          <button 
            key={p.id}
            onClick={() => handleProjectSelect(p)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              selectedProject?.id === p.id 
                ? "bg-[#A3B18A] text-white border-[#A3B18A] shadow-xl shadow-[#A3B18A]/20" 
                : "text-slate-300 border-transparent hover:text-black hover:border-slate-100"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-dashed border-slate-200 text-slate-400 hover:border-[#A3B18A] hover:text-[#A3B18A] transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={14} strokeWidth={3} /> New Workspace
        </button>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 lg:px-20">
        {selectedProject ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-24">
            
            {/* HERO MODULE */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-8 flex-1">
                <div className="flex items-center gap-6">
                  <span className="bg-[#F2F2F2] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">
                    {selectedProject.category || "General"}
                  </span>
                  <button onClick={handleSendTeamLink} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-[#A3B18A] transition-all">
                    <Link size={14} /> Send Team Link
                  </button>
                  <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-all">
                    <Settings size={14} /> Workspace Settings
                  </button>
                </div>
                
                <h1 className="text-[10vw] lg:text-[8vw] font-serif italic tracking-tighter leading-[0.8] text-black">
                  {selectedProject.name}
                </h1>
                
                <p className="text-2xl font-serif text-slate-400 italic max-w-3xl leading-snug">
                  {selectedProject.objective_summary || "Define project parameters in settings to establish a focus objective."}
                </p>

                <div className="flex gap-12 pt-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Target Deadline</p>
                    <p className="text-sm font-bold">{selectedProject.due_date || "Continuous Deployment"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Personnel Scale</p>
                    <p className="text-sm font-bold">{memberArray.length} Active Contributors</p>
                  </div>
                </div>
              </div>

              {/* VAULT INTAKE MODULE */}
              <div className="w-full lg:w-[400px] space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Vault Intake</h3>
                  <Archive size={14} className="text-[#A3B18A]" />
                </div>
                <label className="group relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-[#F2F2F2]/50 hover:bg-[#A3B18A]/5 hover:border-[#A3B18A] transition-all cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    {isUploading ? (
                      <Activity className="animate-spin text-[#A3B18A]" size={32} />
                    ) : (
                      <>
                        <Upload className="text-slate-300 group-hover:text-[#A3B18A] mb-4" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drop to Sync to Vault</p>
                        <p className="text-[8px] font-bold text-slate-300 mt-2">Mapped to: /vault/{selectedProject.name.toLowerCase()}</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={handleVaultUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            {/* WORKSPACE OPERATIONS */}
            <div className="grid grid-cols-12 gap-16 lg:gap-24">
              
              {/* LEFT: SCHEDULER & PULSE */}
              <div className="col-span-12 lg:col-span-8 space-y-24">
                
                {/* ATOMIC SCHEDULER */}
                <div className="space-y-10">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 border-b border-slate-50 pb-6">Schedule Objective</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input 
                      value={taskName} onChange={e => setTaskName(e.target.value)}
                      placeholder="Identify specific objective..."
                      className="md:col-span-2 bg-[#F2F2F2] p-10 rounded-[3rem] text-4xl font-serif italic outline-none border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all"
                    />
                    <div className="relative">
                       <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="w-full bg-[#F2F2F2] p-6 pl-16 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                         <option value="">Select Personnel</option>
                         {memberArray.map((m, i) => <option key={i} value={m}>{m}</option>)}
                       </select>
                    </div>
                    <div className="relative">
                       <CalendarDays className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="w-full bg-[#F2F2F2] p-6 pl-16 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none" />
                    </div>
                  </div>
                  <button onClick={handleAddTask} className="w-full bg-black text-white py-8 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-4">
                    Deploy to Timeline <ChevronRight size={16} />
                  </button>
                </div>

                {/* PULSE TIMELINE */}
                <div className="space-y-10">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Pulse Visualizer</h3>
                   <div className="relative overflow-x-auto no-scrollbar pb-10">
                      <div className="flex gap-8 min-w-[1200px]">
                        {currentTasks.length > 0 ? currentTasks.map((t) => (
                          <div key={t.id} className="w-80 shrink-0 space-y-6">
                            <div className="h-[2px] w-full bg-[#F2F2F2] relative">
                               <div className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-[#A3B18A]" />
                            </div>
                            <div className="bg-white border border-slate-50 p-10 rounded-[3.5rem] space-y-6 hover:shadow-2xl hover:shadow-slate-100 transition-all group">
                               <div className="flex justify-between items-start">
                                  <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{t.due_date || "Continuous"}</span>
                                  <Flag size={14} className={t.priority === 'High' ? "text-red-400" : "text-slate-100"} />
                               </div>
                               <h4 className="text-2xl font-serif italic text-black leading-tight">{t.name}</h4>
                               <div className="flex items-center gap-4 pt-4">
                                  <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-[10px] text-white font-bold">{t.assigned_to?.charAt(0) || '?'}</div>
                                  <div>
                                     <p className="text-[11px] font-bold text-black">{t.assigned_to || "Unassigned"}</p>
                                     <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Active Member</p>
                                  </div>
                               </div>
                            </div>
                          </div>
                        )) : (
                          <div className="w-full py-24 border border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center gap-6 text-slate-200">
                             <Target size={40} />
                             <p className="text-[11px] font-black uppercase tracking-[0.5em]">Awaiting Timeline Data</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT: ASSET INDEX & TEAM */}
              <div className="col-span-12 lg:col-span-4 space-y-20">
                
                {/* PROJECT VAULT INDEX */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Vault Assets</h3>
                  <div className="space-y-4">
                    {currentVault.map(v => (
                      <div key={v.id} className="bg-[#F2F2F2] p-6 rounded-[2rem] flex items-center justify-between group hover:bg-black hover:text-white transition-all cursor-pointer border border-transparent">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-black transition-colors">
                             <FileText size={20} />
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-[11px] font-bold truncate w-40">{v.file_name}</p>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{v.category}</p>
                           </div>
                        </div>
                        <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity pr-2" />
                      </div>
                    ))}
                    {currentVault.length === 0 && (
                      <div className="p-10 border border-dashed border-slate-100 rounded-[2.5rem] text-center">
                         <p className="text-[10px] text-slate-300 italic">No assets synced.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAM LEDGER */}
                <div className="bg-black p-12 rounded-[4rem] text-white space-y-10 shadow-2xl shadow-black/20">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Active Personnel</h3>
                  <div className="space-y-8">
                    {memberArray.map((m, i) => (
                      <div key={i} className="flex items-center justify-between group">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black group-hover:border-[#A3B18A] transition-all">{m.charAt(0)}</div>
                            <span className="text-[12px] font-bold">{m}</span>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-[#A3B18A]/20 group-hover:bg-[#A3B18A] transition-all" />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSendTeamLink} className="w-full py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Add Team Member
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-8 text-slate-100">
             <div className="animate-pulse flex flex-col items-center gap-6">
               <div className="w-24 h-24 bg-[#F2F2F2] rounded-[2.5rem] flex items-center justify-center">
                 <Zap size={40} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.8em]">Synchronize Workspace</p>
             </div>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-white/40 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[5rem] p-20 shadow-2xl border border-slate-50 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-12 right-12 text-slate-300 hover:text-black transition-all p-2"><X size={32}/></button>
              <h3 className="text-6xl font-serif italic tracking-tighter mb-16 text-black">New Ledger</h3>
              <div className="space-y-10">
                <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F2F2F2] p-10 rounded-[3rem] outline-none font-serif italic text-4xl" placeholder="Project name..." />
                <button 
                  onClick={async () => {
                    const { error } = await supabase.from("projects").insert([{ name: formName, team_id: teamId }]);
                    if (!error) { setShowCreateModal(false); if(teamId) loadData(teamId); toast.success("Workspace Initialized"); }
                  }}
                  className="w-full bg-black text-white py-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] hover:bg-[#A3B18A] transition-all"
                >
                  Create Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WORKSPACE SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-white/40 backdrop-blur-2xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[5rem] p-20 shadow-2xl border border-slate-50">
              <div className="flex justify-between items-start mb-16">
                 <div>
                   <h3 className="text-5xl font-serif italic tracking-tighter text-black">Workspace Params</h3>
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-3">Configuring: {selectedProject.name}</p>
                 </div>
                 <button onClick={() => setShowSettings(false)} className="p-4 bg-[#F2F2F2] rounded-[1.5rem] hover:bg-black hover:text-white transition-all"><X size={24}/></button>
              </div>
              <div className="space-y-10 max-h-[60vh] overflow-y-auto no-scrollbar pr-4">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-6">Workspace Title</label>
                   <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F2F2F2] p-8 rounded-[2.5rem] outline-none font-serif italic text-3xl" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-6">Strategic Objective</label>
                   <textarea rows={3} value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full bg-[#F2F2F2] p-8 rounded-[2.5rem] outline-none font-serif italic text-xl resize-none" placeholder="What is the primary mission?" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-6">Final Deadline</label>
                     <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-[1.5rem] outline-none font-bold text-xs uppercase" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-6">Personnel (CSV)</label>
                     <input value={editMembers} onChange={e => setEditMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-[1.5rem] outline-none font-bold text-xs" placeholder="Add collaborators..." />
                  </div>
                </div>
                <button onClick={handleUpdateSettings} className="w-full bg-black text-white py-8 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-4">
                   <Save size={20} /> Sync Ledger
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