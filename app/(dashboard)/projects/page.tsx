"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, Check, Calendar, Users, FileText, Settings, X, 
  Save, Activity, Upload, Link, ExternalLink, Target, 
  Zap, Hash, Trash2, Shield, AlertCircle, Clock, 
  BarChart3, Layers, Filter, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- CORE INTERFACES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: 'Backlog' | 'Active' | 'Review' | 'Done';
  assigned_to?: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  due_date?: string;
  members?: string;
  category: string;
  objective_summary?: string;
  health: 'Stable' | 'At Risk' | 'Critical';
  notes?: string;
}

interface VaultItem {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  type: string;
}

export default function ProjectManagerWorkspace() {
  const [isMounted, setIsMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [taskForm, setTaskForm] = useState({ name: '', assignee: '', due: '', priority: 'Medium' as any });
  const [editProject, setEditProject] = useState<Partial<Project>>({});

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchData = useCallback(async (id: string) => {
    setIsSyncing(true);
    const [pRes, tRes, vRes] = await Promise.all([
      supabase.from("projects").select("*").eq("team_id", id).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("*"),
      supabase.from("vault_items").select("*")
    ]);
    setProjects(pRes.data || []);
    setTasks(tRes.data || []);
    setVaultItems(vRes.data || []);
    if (pRes.data?.length && !selectedProject) handleSelect(pRes.data[0]);
    setIsSyncing(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      setTeamId(id || "default_team");
      fetchData(id || "default_team");
    });
  }, [fetchData]);

  const handleSelect = (p: Project) => {
    setSelectedProject(p);
    setEditProject(p);
  };

  const handleAddTask = async () => {
    if (!taskForm.name || !selectedProject) return;
    const { data } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id,
      name: taskForm.name,
      assigned_to: taskForm.assignee,
      due_date: taskForm.due,
      priority: taskForm.priority,
      status: 'Backlog'
    }]).select();
    if (data) {
      setTasks(prev => [...prev, ...data]);
      setTaskForm({ name: '', assignee: '', due: '', priority: 'Medium' });
      toast.success("Objective added to timeline");
    }
  };

  const syncProject = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update(editProject).eq("id", selectedProject.id);
    if (!error) {
      toast.success("Project Ledger Synced");
      setShowSettings(false);
      fetchData(teamId!);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] pb-10 font-sans selection:bg-[#A3B18A] selection:text-white">
      
      {/* COMPACT PROJECT TAB BAR */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {projects.map(p => (
            <button 
              key={p.id} onClick={() => handleSelect(p)}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all border ${
                selectedProject?.id === p.id ? "bg-black text-white border-black" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button onClick={() => setShowCreateModal(true)} className="p-1 px-2 text-[#A3B18A] hover:bg-[#A3B18A]/10 rounded-md transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {isSyncing && <Activity size={12} className="animate-spin text-slate-300" />}
          <div className="h-6 w-[1px] bg-slate-200" />
          <button onClick={() => setShowSettings(true)} className="p-1.5 text-slate-400 hover:text-black transition-colors"><Settings size={14} /></button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        {selectedProject ? (
          <>
            {/* LEFT SIDE: EXECUTION PANEL */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* PROJECT OVERVIEW CARD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedProject.health === 'Stable' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {selectedProject.health || 'Stable'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Ref: {selectedProject.id.slice(0,6)}</span>
                    </div>
                    <h1 className="text-4xl font-serif italic tracking-tighter">{selectedProject.name}</h1>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-slate-300 uppercase">Target Delivery</p>
                    <p className="text-xs font-bold">{selectedProject.due_date || 'Open Ended'}</p>
                  </div>
                </div>
                <p className="text-sm font-serif text-slate-500 italic border-l-2 border-[#A3B18A]/20 pl-4 py-1">
                  {selectedProject.objective_summary || "Adjust project parameters to define strategic focus."}
                </p>
              </div>

              {/* TIMELINE SCHEDULER */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Target size={12} /> Schedule Objective
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-slate-50 rounded-md"><Filter size={12} className="text-slate-400"/></button>
                    <button className="p-1.5 hover:bg-slate-50 rounded-md"><BarChart3 size={12} className="text-slate-400"/></button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-6">
                  <input 
                    value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})}
                    placeholder="Input objective description..." 
                    className="col-span-12 md:col-span-5 bg-[#F9F9FB] p-2.5 rounded-xl text-xs outline-none focus:ring-1 ring-[#A3B18A]/30 transition-all border border-transparent" 
                  />
                  <select 
                    value={taskForm.assignee} onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="col-span-6 md:col-span-2 bg-[#F9F9FB] p-2.5 rounded-xl text-[9px] font-bold uppercase tracking-tighter outline-none"
                  >
                    <option value="">Assignee</option>
                    {selectedProject.members?.split(',').map((m, i) => <option key={i} value={m.trim()}>{m.trim()}</option>)}
                  </select>
                  <select 
                    value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                    className="col-span-6 md:col-span-2 bg-[#F9F9FB] p-2.5 rounded-xl text-[9px] font-bold uppercase tracking-tighter outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  <input 
                    type="date" value={taskForm.due} onChange={e => setTaskForm({...taskForm, due: e.target.value})}
                    className="col-span-8 md:col-span-2 bg-[#F9F9FB] p-2.5 rounded-xl text-[9px] font-bold outline-none" 
                  />
                  <button onClick={handleAddTask} className="col-span-4 md:col-span-1 bg-black text-white rounded-xl flex items-center justify-center hover:bg-[#A3B18A] transition-all">
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {tasks.filter(t => t.project_id === selectedProject.id).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-slate-50 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4">
                        <button className="w-4 h-4 rounded border border-slate-200 flex items-center justify-center hover:border-[#A3B18A] group-hover:bg-[#A3B18A]/5 transition-all">
                          <Check size={10} className="text-transparent group-hover:text-[#A3B18A]/40" />
                        </button>
                        <div>
                          <p className="text-xs font-medium text-slate-700">{t.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[7px] font-black uppercase px-1.5 rounded ${
                              t.priority === 'Urgent' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'
                            }`}>{t.priority}</span>
                            <span className="text-[8px] text-slate-300 font-bold tracking-tighter flex items-center gap-1">
                              <Clock size={8} /> {t.due_date || 'No Date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded-md">{t.assigned_to || 'Unassigned'}</span>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: MANAGEMENT UTILITIES */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* PERSONNEL LEDGER */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Users size={12} /> Personnel
                  </h3>
                  <span className="text-[9px] font-bold text-slate-300">{selectedProject.members?.split(',').length || 0} Members</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {selectedProject.members?.split(',').map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-[9px] font-black text-[#A3B18A]">
                          {m.trim().charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{m.trim()}</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 ring-4 ring-green-400/10" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowSettings(true)} className="w-full mt-4 py-2 border border-dashed border-slate-200 rounded-xl text-[8px] font-black uppercase text-slate-400 hover:border-black hover:text-black transition-all">
                  Manage Access
                </button>
              </div>

              {/* RESOURCE VAULT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Layers size={12} /> Asset Vault
                  </h3>
                  <label className="cursor-pointer hover:text-[#A3B18A] transition-colors">
                    <Upload size={14} />
                    <input type="file" className="hidden" />
                  </label>
                </div>
                <div className="space-y-1">
                  {vaultItems.filter(v => v.project_id === selectedProject.id).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-slate-300 group-hover:text-black" />
                        <span className="text-[10px] font-bold text-slate-500 truncate w-32">{v.file_name}</span>
                      </div>
                      <ExternalLink size={10} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                  {vaultItems.filter(v => v.project_id === selectedProject.id).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-xl">
                      <p className="text-[9px] font-black uppercase text-slate-200">No linked research</p>
                    </div>
                  )}
                </div>
              </div>

              {/* STRATEGIC SCRATCHPAD */}
              <div className="bg-[#1C1C1E] rounded-2xl p-5 shadow-xl shadow-black/5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Scratchpad</h3>
                  <Zap size={10} className="text-[#A3B18A]" />
                </div>
                <textarea 
                  value={editProject.notes || ""} 
                  onChange={e => setEditProject({...editProject, notes: e.target.value})}
                  className="w-full bg-transparent text-white/70 text-xs font-serif italic outline-none min-h-[120px] resize-none leading-relaxed" 
                  placeholder="Draft project notes or immediate pivot plans..." 
                />
                <button onClick={syncProject} className="w-full mt-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 transition-all">
                  Synchronize
                </button>
              </div>

            </div>
          </>
        ) : (
          <div className="col-span-12 h-[60vh] flex flex-col items-center justify-center opacity-10 space-y-4">
            <Hash size={40} />
            <p className="text-xs font-black uppercase tracking-[1em]">Select Workspace</p>
          </div>
        )}
      </main>

      {/* CREATE WORKSPACE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl p-10 shadow-2xl border border-slate-100">
              <h3 className="text-3xl font-serif italic mb-6">Initialize Project</h3>
              <input 
                autoFocus 
                className="w-full bg-[#F9F9FB] p-4 rounded-2xl outline-none text-sm font-serif italic mb-4" 
                placeholder="Workspace Name..." 
              />
              <button className="w-full bg-black text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">Create Workspace</button>
              <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-[8px] font-bold text-slate-400 uppercase">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS / CONFIG MODAL */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-xl rounded-3xl p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif italic">Project Config</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-black"><X size={20}/></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Title</label>
                  <input value={editProject.name} onChange={e => setEditProject({...editProject, name: e.target.value})} className="w-full bg-[#F9F9FB] p-3 rounded-xl outline-none text-sm font-serif italic" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Strategic Objective</label>
                  <textarea value={editProject.objective_summary || ""} onChange={e => setEditProject({...editProject, objective_summary: e.target.value})} className="w-full bg-[#F9F9FB] p-3 rounded-xl outline-none text-xs font-serif italic h-24 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Health Status</label>
                    <select value={editProject.health} onChange={e => setEditProject({...editProject, health: e.target.value as any})} className="w-full bg-[#F9F9FB] p-3 rounded-xl text-[9px] font-bold uppercase">
                      <option value="Stable">Stable</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Deadline</label>
                    <input type="date" value={editProject.due_date} onChange={e => setEditProject({...editProject, due_date: e.target.value})} className="w-full bg-[#F9F9FB] p-3 rounded-xl text-[9px] font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Personnel (Comma Separated)</label>
                  <input value={editProject.members} onChange={e => setEditProject({...editProject, members: e.target.value})} className="w-full bg-[#F9F9FB] p-3 rounded-xl outline-none text-[9px] font-bold" placeholder="Member A, Member B..." />
                </div>
                <button onClick={syncProject} className="w-full bg-black text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] flex items-center justify-center gap-2 mt-4 transition-all">
                  <Save size={14}/> Sync Project Ledger
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
      `}} />
    </div>
  );
}