"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Check, List, Calendar, Users, 
  Clock, FileText, Layout, ChevronRight, 
  MoreHorizontal, X, ArrowRight, CalendarDays,
  UserPlus, StickyNote, ExternalLink, Settings,
  Activity, Zap, ArrowUpRight
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
}

interface Note {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  due_date?: string;
  members?: string;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Selection State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDue, setProjectDue] = useState("");
  const [projectMembers, setProjectMembers] = useState("");
  
  // Task State
  const [newTaskName, setNewTaskName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [taskDate, setTaskDate] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA SYNC ---
  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const { data: projData } = await supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false });
      const { data: taskData } = await supabase.from("project_tasks").select("*");
      const { data: noteData } = await supabase.from("project_notes").select("*");

      setProjects(projData || []);
      setTasks(taskData || []);
      setNotes(noteData || []);
      
      if (projData?.length && !selectedProject) setSelectedProject(projData[0]);
    } catch (err) {
      toast.error("Database connection failed.");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(team => {
      const t = team || "default-team";
      setTeamId(t);
      loadData(t);
    });
  }, [loadData]);

  // --- ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    const { error } = await supabase.from("projects").insert([{ 
      name: projectName.trim(), 
      team_id: teamId, 
      due_date: projectDue, 
      members: projectMembers 
    }]);
    if (!error) {
      setShowCreateModal(false);
      setProjectName("");
      loadData(teamId);
      toast.success("Project Initialized");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !selectedProject) return;
    const { data, error } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id, 
      name: newTaskName.trim(), 
      assigned_to: assignee,
      due_date: taskDate,
      status: "Backlog"
    }]).select();
    
    if (!error) {
      setTasks(prev => [...prev, ...(data || [])]);
      setNewTaskName(""); setAssignee(""); setTaskDate("");
      toast.success("Added to Timeline");
    }
  };

  const currentTasks = useMemo(() => tasks.filter(t => t.project_id === selectedProject?.id), [tasks, selectedProject]);
  const currentNotes = useMemo(() => notes.filter(n => n.project_id === selectedProject?.id), [notes, selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-slate-900 font-sans selection:bg-[#D6FF8D] selection:text-black">
      
      {/* TOP HEADER: PROJECT SELECTION */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between gap-12">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-[#D6FF8D] rounded-xl flex items-center justify-center text-black shadow-lg">
              <Layout size={20} />
            </div>
            <span className="font-black text-sm tracking-tighter">TOTS OS</span>
          </div>

          {/* HORIZONTAL LEDGER */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 no-scrollbar px-4">
            {projects.map((p) => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProject(p)} 
                className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-3 border ${
                  selectedProject?.id === p.id 
                  ? "bg-[#D6FF8D] border-[#D6FF8D] text-black shadow-md" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-[#D6FF8D] hover:text-black"
                }`}
              >
                {p.name}
                {p.due_date && <span className="text-[10px] opacity-40">{p.due_date}</span>}
              </button>
            ))}
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-4 py-2.5 rounded-full border border-dashed border-slate-200 text-slate-300 hover:border-[#D6FF8D] hover:text-black transition-all flex items-center gap-2"
            >
              <Plus size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">New</span>
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             <button onClick={() => router.push('/notes')} className="p-3 bg-slate-50 hover:bg-[#D6FF8D] rounded-full transition-all text-slate-400 hover:text-black">
               <StickyNote size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-12">
        {selectedProject ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* PROJECT HERO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-slate-100 pb-16">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D6FF8D]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Active Environment</span>
                </div>
                <h1 className="text-[6rem] lg:text-[8rem] font-serif italic tracking-tighter leading-[0.8] text-black">
                  {selectedProject.name}
                </h1>
                <div className="flex flex-wrap gap-4 pt-4">
                   <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                     <Users size={16} className="text-[#D6FF8D]" />
                     <span className="text-xs font-bold text-slate-600">{selectedProject.members || "Solo Project"}</span>
                   </div>
                   <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                     <Calendar size={16} className="text-[#D6FF8D]" />
                     <span className="text-xs font-bold text-slate-600">{selectedProject.due_date || "Continuous"}</span>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/notes')} 
                  className="bg-[#D6FF8D] text-black px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <StickyNote size={18} /> New Note
                </button>
              </div>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-12 gap-8 lg:gap-12">
              
              {/* SCHEDULER */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">Schedule to Timeline</h3>
                    <div className="p-2 bg-[#D6FF8D] rounded-lg"><Zap size={14} className="text-black" /></div>
                  </div>
                  
                  <div className="space-y-6">
                    <input 
                      value={newTaskName} 
                      onChange={e => setNewTaskName(e.target.value)} 
                      placeholder="Objective description..." 
                      className="w-full bg-slate-50 p-6 rounded-3xl outline-none text-2xl font-serif italic border border-transparent focus:border-[#D6FF8D] transition-all" 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <UserPlus className="absolute left-6 top-6 text-slate-300" size={18} />
                        <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Assignee..." className="w-full bg-slate-50 p-6 pl-16 rounded-3xl outline-none font-bold text-sm" />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-6 top-6 text-slate-300" size={18} />
                        <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full bg-slate-50 p-6 pl-16 rounded-3xl outline-none font-bold text-sm" />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleAddTask} 
                    className="w-full bg-[#D6FF8D] text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:shadow-xl transition-all"
                  >
                    Add to Project Timeline
                  </button>
                </div>

                {/* TIMELINE LIST */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Active Objectives</h3>
                    <span className="text-[10px] font-bold text-slate-400">{currentTasks.length} Scheduled</span>
                  </div>
                  <div className="space-y-4">
                    {currentTasks.map(t => (
                      <motion.div 
                        layoutId={t.id} 
                        key={t.id} 
                        className="bg-white p-8 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-[#D6FF8D] transition-all"
                      >
                        <div className="flex items-center gap-8">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:bg-[#D6FF8D] group-hover:text-black transition-all">
                            <Check size={24} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-3xl font-serif italic text-black leading-none">{t.name}</p>
                            <div className="flex gap-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> {t.assigned_to || "Open"}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><CalendarDays size={12}/> {t.due_date || "Now"}</span>
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal className="text-slate-200 group-hover:text-slate-400 cursor-pointer" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIDEBAR MODULES */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                
                {/* VAULT LINKS */}
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm h-fit">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">Vault Resources</h3>
                    <FileText size={18} className="text-[#D6FF8D]" />
                  </div>
                  <div className="space-y-6">
                    {currentNotes.length > 0 ? currentNotes.map(n => (
                      <div key={n.id} className="p-6 bg-slate-50 rounded-[2.5rem] hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-[#D6FF8D]/30 group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-xs text-black">{n.title}</p>
                          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[#D6FF8D]" />
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed">{n.content}</p>
                      </div>
                    )) : (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                        <FileText size={40} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No linked research</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAM STATUS */}
                <div className="bg-black p-10 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                       <Users size={16} className="text-[#D6FF8D]" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Collaborators</span>
                    </div>
                    <div className="space-y-4">
                      {selectedProject.members?.split(',').map((member, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-black bg-slate-900">{member.trim().charAt(0)}</div>
                             <span className="text-xs font-bold">{member.trim()}</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D6FF8D] animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#D6FF8D]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
            <Layout size={80} className="text-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Select Project Ledger</p>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl relative z-10 border border-slate-50">
              <div className="space-y-4 mb-12">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D6FF8D]">System Initialization</span>
                <h3 className="text-6xl font-serif italic tracking-tighter leading-none text-black">New Ledger</h3>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Ledger Title</label>
                  <input autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl outline-none font-serif italic text-3xl focus:ring-4 ring-[#D6FF8D]/20 transition-all" placeholder="Project name..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Hard Deadline</label>
                    <input type="date" value={projectDue} onChange={e => setProjectDue(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Team List</label>
                    <input placeholder="Leigha, Dave..." value={projectMembers} onChange={e => setProjectMembers(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl outline-none font-bold" />
                  </div>
                </div>
                <button onClick={handleCreateProject} disabled={!projectName.trim()} className="w-full bg-[#D6FF8D] text-black py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20">Initialize Workspace</button>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}} />
    </div>
  );
}