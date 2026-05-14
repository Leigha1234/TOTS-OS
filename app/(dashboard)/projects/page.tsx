"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Check, List, Calendar, Users, 
  Clock, FileText, Layout, ChevronRight, 
  MoreHorizontal, X, ArrowRight, CalendarDays,
  UserPlus, StickyNote, ExternalLink, Settings
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // Modals & Inputs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDue, setProjectDue] = useState("");
  const [projectMembers, setProjectMembers] = useState("");
  
  const [newTaskName, setNewTaskName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

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
      toast.error("Sync error. Ensure 'project_notes' and 'project_tasks' tables exist.");
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

  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    const { error } = await supabase.from("projects").insert([{ 
      name: projectName.trim(), team_id: teamId, due_date: projectDue, members: projectMembers 
    }]);
    if (!error) {
      setShowCreateModal(false);
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
      toast.success("Task scheduled");
    }
  };

  const currentTasks = tasks.filter(t => t.project_id === selectedProject?.id);
  const currentNotes = notes.filter(n => n.project_id === selectedProject?.id);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-900 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-80 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-xl shadow-black/10">
              <Layout size={20} />
            </div>
            <h2 className="font-black text-lg tracking-tighter">TOTs OS</h2>
          </div>
          
          <button onClick={() => setShowCreateModal(true)} className="w-full bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl flex items-center justify-between transition-all group">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-600">New Project</span>
            <Plus size={18} className="text-slate-400 group-hover:text-black" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          {projects.map((p) => (
            <button key={p.id} onClick={() => setSelectedProject(p)} className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between ${selectedProject?.id === p.id ? "bg-white shadow-lg shadow-slate-200/50 border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>
              <div className="flex flex-col gap-1">
                <span className={`text-sm font-bold ${selectedProject?.id === p.id ? "text-black" : ""}`}>{p.name}</span>
                <span className="text-[10px] font-medium opacity-60 flex items-center gap-1"><Calendar size={10}/> {p.due_date || "No date"}</span>
              </div>
              {selectedProject?.id === p.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {selectedProject ? (
          <div className="max-w-6xl mx-auto p-12">
            
            {/* HEADER */}
            <header className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tighter">{selectedProject.name}</h1>
                <div className="flex gap-4">
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{selectedProject.members || "Assignee Needed"}</span>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    <CalendarDays size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{selectedProject.due_date || "No Deadline"}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => router.push('/notes')} className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10">
                <StickyNote size={16} /> New Note
              </button>
            </header>

            <div className="grid grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: TASKS & TIMELINE */}
              <div className="col-span-8 space-y-8">
                
                {/* TIMELINE INPUT */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule Task to Timeline</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="What needs to be done?" className="col-span-2 bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-black/5 font-bold" />
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-4 text-slate-300" size={16} />
                      <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Assign to..." className="w-full bg-slate-50 p-4 pl-12 rounded-xl outline-none text-sm font-bold" />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 text-slate-300" size={16} />
                      <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full bg-slate-50 p-4 pl-12 rounded-xl outline-none text-sm font-bold" />
                    </div>
                  </div>
                  <button onClick={handleAddTask} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all">Add to Project Timeline</button>
                </div>

                {/* TASK LIST / CALENDAR VIEW */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Active Timeline</h3>
                  <div className="space-y-3">
                    {currentTasks.map(t => (
                      <div key={t.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between group hover:border-black transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all"><Check size={20}/></div>
                          <div>
                            <p className="font-bold text-slate-900">{t.name}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Users size={12}/> {t.assigned_to || "Unassigned"}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> {t.due_date || "Immediate"}</span>
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal className="text-slate-200 group-hover:text-slate-400 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: NOTES & MEMBERS */}
              <div className="col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Project Notes</h3>
                    <button onClick={() => router.push('/notes')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black"><ExternalLink size={14}/></button>
                  </div>
                  <div className="space-y-4">
                    {currentNotes.length > 0 ? currentNotes.map(n => (
                      <div key={n.id} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                        <p className="font-black text-xs text-slate-900 mb-1">{n.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{n.content}</p>
                      </div>
                    )) : (
                      <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <FileText size={24} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Notes Linked</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/20">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Team Roles</h3>
                  <div className="space-y-4">
                    {selectedProject.members?.split(',').map((member, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold">{member.trim().charAt(0)}</div>
                        <span className="text-xs font-bold">{member.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Layout size={48} className="text-slate-100 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Select a Workspace</p>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative z-10 border border-slate-100">
              <h3 className="text-3xl font-black mb-10 tracking-tighter">Create Workspace</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Project Name</label>
                  <input autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none focus:ring-2 ring-black font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Deadline</label>
                    <input type="date" value={projectDue} onChange={e => setProjectDue(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Team (Comma separated)</label>
                    <input placeholder="Leigha, Dave" value={projectMembers} onChange={e => setProjectMembers(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
                <button onClick={handleCreateProject} disabled={!projectName.trim()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all disabled:opacity-20 shadow-xl shadow-black/10">Initialize Project</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}} />
    </div>
  );
}