"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { useRouter } from "next/navigation";
import { 
  Plus, Check, Calendar, Users, FileText, Settings, X, 
  Save, Archive, ChevronRight, Activity, Upload, Link, 
  FolderPlus, ExternalLink, Target, Globe, Flag, 
  CalendarDays, UserPlus, Hash, Zap, MoreVertical, Search,
  Trash2, Mail, Shield, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- INTERFACES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: 'Backlog' | 'Active' | 'Done';
  assigned_to?: string;
  due_date?: string;
  priority: 'Low' | 'Med' | 'High';
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  due_date?: string;
  members?: string;
  category: string;
  objective_summary?: string;
  health: 'Live' | 'Slow' | 'Paused';
  notes?: string;
}

interface VaultItem {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  category: string;
}

export default function PowerWorkspace() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI Controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Med' | 'High'>('Med');

  // Settings State
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editHealth, setEditHealth] = useState<'Live' | 'Slow' | 'Paused'>('Live');
  const [editNotes, setEditNotes] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async (id: string) => {
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
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      setTeamId(id || "default_team");
      loadData(id || "default_team");
    });
  }, [loadData]);

  const handleProjectSelect = (p: Project) => {
    setSelectedProject(p);
    setEditName(p.name);
    setEditDue(p.due_date || "");
    setEditMembers(p.members || "");
    setEditObjective(p.objective_summary || "");
    setEditHealth(p.health || 'Live');
    setEditNotes(p.notes || "");
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update({
      name: editName, due_date: editDue, members: editMembers, 
      objective_summary: editObjective, health: editHealth, notes: editNotes
    }).eq("id", selectedProject.id);
    if (!error) { toast.success("Ledger Synchronized"); setShowSettings(false); loadData(teamId!); }
  };

  const handleAddTask = async () => {
    if (!taskName || !selectedProject) return;
    const { data } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id, name: taskName, assigned_to: taskAssignee,
      due_date: taskDueDate, priority: taskPriority, status: 'Backlog'
    }]).select();
    if (data) { setTasks(prev => [...prev, ...data]); setTaskName(""); toast.success("Task Logged"); }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#222] pb-20 font-sans selection:bg-[#A3B18A] selection:text-white">
      
      {/* 1. ULTRA-COMPACT NAV */}
      <div className="px-5 py-6 flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-white">
        {projects.map(p => (
          <button 
            key={p.id} onClick={() => handleProjectSelect(p)}
            className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border ${
              selectedProject?.id === p.id ? "bg-black text-white border-black" : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1 px-3 py-1 rounded-md bg-slate-50 border border-dashed border-slate-300 text-slate-500 hover:text-[#A3B18A] hover:border-[#A3B18A] text-[8.5px] font-black uppercase">
          <Plus size={10} /> Add
        </button>
      </div>

      <main className="max-w-[1500px] mx-auto px-5 py-8">
        {selectedProject ? (
          <div className="grid grid-cols-12 gap-6">
            
            {/* LEFT: WORKSPACE CORE */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* MINIMALIST HEADER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 border border-slate-100 rounded-2xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedProject.health === 'Live' ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
                    <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-slate-400">{selectedProject.health} Status</span>
                  </div>
                  <h1 className="text-4xl font-serif italic tracking-tighter text-black">{selectedProject.name}</h1>
                  <p className="text-xs font-serif text-slate-500 italic max-w-xl">{selectedProject.objective_summary || "Objective not defined."}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSettings(true)} className="px-3 py-1.5 rounded-lg border border-slate-100 text-[8px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Configure</button>
                  <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="px-3 py-1.5 rounded-lg border border-slate-100 text-[8px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Share</button>
                </div>
              </div>

              {/* TASK MANAGER (30% SMALLER TEXT) */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Timeline Objectives</h3>
                  <div className="flex gap-4">
                    <span className="text-[7.5px] font-bold text-slate-400">Total: {tasks.filter(t => t.project_id === selectedProject.id).length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 mb-6">
                  <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Task name..." className="col-span-6 lg:col-span-3 bg-[#F9F9F9] p-2.5 rounded-lg text-xs outline-none border border-transparent focus:border-black" />
                  <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="col-span-3 lg:col-span-1 bg-[#F9F9F9] p-2.5 rounded-lg text-[8px] font-bold uppercase tracking-widest outline-none">
                    <option value="">User</option>
                    {selectedProject.members?.split(',').map((m, i) => <option key={i} value={m.trim()}>{m.trim()}</option>)}
                  </select>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="col-span-3 lg:col-span-1 bg-[#F9F9F9] p-2.5 rounded-lg text-[8px] font-bold outline-none" />
                  <button onClick={handleAddTask} className="col-span-6 lg:col-span-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">Add</button>
                </div>

                <div className="space-y-1.5">
                  {tasks.filter(t => t.project_id === selectedProject.id).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-xl hover:border-slate-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-1 h-1 rounded-full ${t.priority === 'High' ? 'bg-red-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-serif italic text-slate-800">{t.name}</span>
                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 px-1.5 py-0.5 bg-slate-50 rounded">{t.status}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[8px] font-bold text-slate-400">{t.due_date}</span>
                        <span className="text-[8px] font-black uppercase text-black/40">{t.assigned_to?.slice(0,3)}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={10}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: UTILITY STACK */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              
              {/* SCRATCHPAD */}
              <div className="bg-[#111] text-white p-5 rounded-2xl shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[7.5px] font-black uppercase tracking-[0.3em] text-white/30">Scratchpad</h3>
                  <Zap size={10} className="text-[#A3B18A]" />
                </div>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full bg-transparent text-white/60 text-xs font-serif italic outline-none min-h-[100px] resize-none border-none leading-relaxed" placeholder="Quick thoughts..." />
                <button onClick={handleUpdateProject} className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[7px] font-black uppercase tracking-widest text-white/40">Auto-Save</button>
              </div>

              {/* ASSET VAULT */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[7.5px] font-black uppercase tracking-[0.3em] text-slate-300">Vault</h3>
                  <label className="cursor-pointer hover:text-[#A3B18A] transition-colors"><Upload size={12} /><input type="file" className="hidden" onChange={() => toast.info("Syncing File...")}/></label>
                </div>
                <div className="space-y-1">
                  {vaultItems.filter(v => v.project_id === selectedProject.id).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-md transition-all group">
                      <div className="flex items-center gap-2">
                        <FileText size={10} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-500 truncate w-24">{v.file_name}</span>
                      </div>
                      <ExternalLink size={8} className="text-slate-200 group-hover:text-black opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>

              {/* TEAM LEDGER */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
                <h3 className="text-[7.5px] font-black uppercase tracking-[0.3em] text-slate-300">Personnel</h3>
                <div className="space-y-2">
                  {selectedProject.members?.split(',').map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center text-[7px] font-black">{m.trim().charAt(0)}</div>
                        <span className="text-[9px] font-bold text-slate-600">{m.trim()}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowSettings(true)} className="w-full py-1.5 border border-dashed border-slate-200 rounded-lg text-[7px] font-black uppercase text-slate-400 hover:border-black hover:text-black">Add Team</button>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-[40vh] flex flex-col items-center justify-center opacity-20 gap-3">
            <Hash size={24} />
            <p className="text-[8px] font-black uppercase tracking-[0.4em]">Select Ledger</p>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl border border-slate-100">
              <h3 className="text-2xl font-serif italic mb-6">New Project</h3>
              <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F9F9F9] p-3 rounded-xl outline-none text-sm mb-4" placeholder="Name..." />
              <button onClick={async () => {
                const { error } = await supabase.from("projects").insert([{ name: formName, team_id: teamId, health: 'Live' }]);
                if (!error) { setShowCreateModal(false); loadData(teamId!); toast.success("Project Created"); }
              }} className="w-full bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A]">Initialize</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-lg rounded-2xl p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic">Ledger Parameters</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-black"><X size={18}/></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-[7px] font-black uppercase tracking-widest text-slate-400">Title</label><input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F9F9F9] p-3 rounded-xl outline-none text-sm font-serif italic" /></div>
                <div className="space-y-1"><label className="text-[7px] font-black uppercase tracking-widest text-slate-400">Objective</label><textarea value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full bg-[#F9F9F9] p-3 rounded-xl outline-none text-xs font-serif italic h-20 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[7px] font-black uppercase tracking-widest text-slate-400">Health</label><select value={editHealth} onChange={e => setEditHealth(e.target.value as any)} className="w-full bg-[#F9F9F9] p-3 rounded-xl text-[8px] font-bold uppercase tracking-widest"><option value="Live">Live</option><option value="Slow">Slow</option><option value="Paused">Paused</option></select></div>
                  <div className="space-y-1"><label className="text-[7px] font-black uppercase tracking-widest text-slate-400">Target Date</label><input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-full bg-[#F9F9F9] p-3 rounded-xl text-[8px] font-bold" /></div>
                </div>
                <div className="space-y-1"><label className="text-[7px] font-black uppercase tracking-widest text-slate-400">Personnel (CSV)</label><input value={editMembers} onChange={e => setEditMembers(e.target.value)} className="w-full bg-[#F9F9F9] p-3 rounded-xl outline-none text-[8px] font-bold" placeholder="Invite users..." /></div>
                <button onClick={handleUpdateProject} className="w-full bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] flex items-center justify-center gap-2 mt-4"><Save size={12}/> Synchronize</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}