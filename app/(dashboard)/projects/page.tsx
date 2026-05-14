"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { useRouter } from "next/navigation";
import { 
  Plus, Check, Calendar, Users, 
  FileText, Layout, Settings, X, 
  Save, Archive, ChevronRight, Activity, 
  Upload, Link, FolderPlus, ExternalLink, 
  Target, Globe, Flag, CalendarDays, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- TYPES ---
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
}

interface VaultItem {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  category: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI Controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Forms
  const [formName, setFormName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Edit Settings State
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editObjective, setEditObjective] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

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
      const first = pRes.data[0];
      setSelectedProject(first);
      setEditName(first.name);
      setEditDue(first.due_date || "");
      setEditMembers(first.members || "");
      setEditObjective(first.objective_summary || "");
    }
    setLoading(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      setTeamId(id || "default_team");
      loadData(id || "default_team");
    });
  }, [loadData]);

  // --- LOGIC FUNCTIONS ---
  const handleProjectSelect = (p: Project) => {
    setSelectedProject(p);
    setEditName(p.name);
    setEditDue(p.due_date || "");
    setEditMembers(p.members || "");
    setEditObjective(p.objective_summary || "");
  };

  const copyTeamLink = () => {
    if (!selectedProject) return;
    const url = `${window.location.origin}/join/${selectedProject.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Copied", { description: "Collaborators can now join this workspace." });
  };

  const handleVaultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploading(true);
    const safePath = `${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}/${Date.now()}-${file.name}`;

    const { error: storageError } = await supabase.storage.from("assets").upload(safePath, file);

    if (storageError) {
      toast.error("Upload Error", { description: storageError.message });
    } else {
      const { data, error: dbError } = await supabase.from("vault_items").insert([{
        project_id: selectedProject.id,
        file_name: file.name,
        file_path: safePath,
        category: "Project Asset"
      }]).select();

      if (!dbError && data) {
        setVaultItems(prev => [...prev, ...data]);
        toast.success("Synced to Vault", { description: `Stored in project folder: ${selectedProject.name}` });
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
      toast.success("Task Added to Pulse");
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update({
      name: editName,
      due_date: editDue,
      members: editMembers,
      objective_summary: editObjective
    }).eq("id", selectedProject.id);

    if (!error) {
      toast.success("Project Updated");
      setShowSettings(false);
      loadData(teamId!);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pb-32 font-sans selection:bg-[#A3B18A] selection:text-white">
      
      {/* 1. NAVIGATION LEDGER (TOP BAR REMOVED) */}
      <div className="px-8 lg:px-20 py-10 flex flex-wrap items-center gap-3">
        {projects.map(p => (
          <button 
            key={p.id}
            onClick={() => handleProjectSelect(p)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              selectedProject?.id === p.id 
                ? "bg-[#A3B18A] text-white border-[#A3B18A] shadow-lg shadow-[#A3B18A]/20" 
                : "text-slate-300 border-transparent hover:text-black"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-dashed border-slate-200 text-slate-400 hover:border-[#A3B18A] hover:text-[#A3B18A] transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={14} strokeWidth={3} /> New Project
        </button>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 lg:px-20">
        {selectedProject ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-24">
            
            {/* HERO SECTION */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-8 flex-1">
                <div className="flex items-center gap-6">
                  <span className="bg-[#F2F2F2] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">
                    {selectedProject.category || "Development"}
                  </span>
                  <button onClick={copyTeamLink} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-[#A3B18A] transition-all">
                    <Link size={14} /> Send Team Link
                  </button>
                  <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-all">
                    <Settings size={14} /> Settings
                  </button>
                </div>
                
                <h1 className="text-[9vw] lg:text-[7vw] font-serif italic tracking-tighter leading-[0.85] text-black">
                  {selectedProject.name}
                </h1>
                
                <p className="text-2xl font-serif text-slate-400 italic max-w-3xl">
                  {selectedProject.objective_summary || "Adjust project settings to define a workspace objective."}
                </p>
              </div>

              {/* VAULT UPLOAD (AUTO-SECTIONING) */}
              <div className="w-full lg:w-96 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Vault Intake</h3>
                  <Archive size={14} className="text-[#A3B18A]" />
                </div>
                <label className="group flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-slate-100 rounded-[3rem] bg-[#F2F2F2]/40 hover:bg-[#A3B18A]/5 hover:border-[#A3B18A] transition-all cursor-pointer relative overflow-hidden">
                  {isUploading ? (
                    <Activity className="animate-spin text-[#A3B18A]" size={30} />
                  ) : (
                    <>
                      <Upload className="text-slate-200 group-hover:text-[#A3B18A] mb-3" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync File to Project</p>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleVaultUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            {/* MAIN WORKSPACE GRID */}
            <div className="grid grid-cols-12 gap-16 lg:gap-24">
              
              {/* LEFT: SCHEDULER & TASKS */}
              <div className="col-span-12 lg:col-span-8 space-y-20">
                <div className="space-y-10">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 border-b border-slate-50 pb-6">Schedule Objective</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={taskName} onChange={e => setTaskName(e.target.value)}
                      placeholder="Input core objective..."
                      className="md:col-span-2 bg-[#F2F2F2] p-8 rounded-[2.5rem] text-3xl font-serif italic outline-none border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all"
                    />
                    <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="bg-[#F2F2F2] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none">
                      <option value="">Personnel</option>
                      {selectedProject.members?.split(',').map((m, i) => <option key={i} value={m.trim()}>{m.trim()}</option>)}
                    </select>
                    <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="bg-[#F2F2F2] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none" />
                  </div>
                  <button onClick={handleAddTask} className="w-full bg-black text-white py-7 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#A3B18A] transition-all">
                    Deploy to Pulse
                  </button>
                </div>

                {/* TASK PULSE DISPLAY */}
                <div className="relative overflow-x-auto no-scrollbar pb-8">
                  <div className="flex gap-6 min-w-[1000px]">
                    {tasks.filter(t => t.project_id === selectedProject.id).map((t) => (
                      <div key={t.id} className="w-80 shrink-0 bg-white border border-slate-100 p-10 rounded-[3.5rem] space-y-5 hover:shadow-2xl transition-all group">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black uppercase text-slate-300">{t.due_date || "Continuous"}</span>
                          <div className={`w-2 h-2 rounded-full ${t.priority === 'High' ? 'bg-red-400' : 'bg-[#A3B18A]'}`} />
                        </div>
                        <h4 className="text-2xl font-serif italic leading-tight">{t.name}</h4>
                        <div className="flex items-center gap-3 pt-4">
                          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-[10px] text-white font-bold">{t.assigned_to?.charAt(0) || '?'}</div>
                          <span className="text-[10px] font-bold text-slate-400">{t.assigned_to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: ASSET LIST & TEAM */}
              <div className="col-span-12 lg:col-span-4 space-y-16">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Vault Assets</h3>
                  <div className="space-y-3">
                    {vaultItems.filter(v => v.project_id === selectedProject.id).map(v => (
                      <div key={v.id} className="bg-[#F2F2F2] p-5 rounded-2xl flex items-center justify-between group hover:bg-black hover:text-white transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <FileText size={18} className="text-slate-300 group-hover:text-[#A3B18A]" />
                          <p className="text-[11px] font-bold truncate w-40">{v.file_name}</p>
                        </div>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black p-12 rounded-[4rem] text-white space-y-8 shadow-2xl shadow-black/20">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Active Personnel</h3>
                  <div className="space-y-6">
                    {selectedProject.members?.split(',').map((m, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <span className="text-[12px] font-bold">{m.trim()}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]/30 group-hover:bg-[#A3B18A] transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center opacity-10 gap-6">
            <Layout size={60} />
            <p className="text-[10px] font-black uppercase tracking-[1em]">Initialize Workspace</p>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-white/40 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[5rem] p-20 shadow-2xl border border-slate-50 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-12 right-12 text-slate-300 hover:text-black"><X size={32}/></button>
              <h3 className="text-6xl font-serif italic tracking-tighter mb-12">New Ledger</h3>
              <div className="space-y-8">
                <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F2F2F2] p-10 rounded-[3rem] outline-none font-serif italic text-4xl" placeholder="Project name..." />
                <button 
                  onClick={async () => {
                    const { error } = await supabase.from("projects").insert([{ name: formName, team_id: teamId }]);
                    if (!error) { setShowCreateModal(false); loadData(teamId!); toast.success("Workspace Initialized"); }
                  }}
                  className="w-full bg-black text-white py-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] hover:bg-[#A3B18A] transition-all"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-white/40 backdrop-blur-2xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[5rem] p-20 shadow-2xl border border-slate-50 relative">
              <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 text-slate-300 hover:text-black"><X size={32}/></button>
              <h3 className="text-5xl font-serif italic tracking-tighter mb-12">Project Params</h3>
              <div className="space-y-8">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F2F2F2] p-8 rounded-[2.5rem] outline-none font-serif italic text-3xl" />
                <textarea rows={3} value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full bg-[#F2F2F2] p-8 rounded-[2.5rem] outline-none font-serif italic text-xl resize-none" placeholder="Primary strategic objective..." />
                <div className="grid grid-cols-2 gap-6">
                  <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="bg-[#F2F2F2] p-6 rounded-[1.5rem] outline-none font-bold text-xs" />
                  <input value={editMembers} onChange={e => setEditMembers(e.target.value)} className="bg-[#F2F2F2] p-6 rounded-[1.5rem] outline-none font-bold text-xs" placeholder="Members (CSV)" />
                </div>
                <button onClick={handleUpdateProject} className="w-full bg-black text-white py-8 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-4">
                  <Save size={18} /> Sync Parameters
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