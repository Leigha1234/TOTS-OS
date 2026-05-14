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
  Zap, Settings, X, Save, Archive, Flag
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
  priority?: string;
}

interface Project {
  id: string;
  name: string;
  team_id: string;
  due_date?: string;
  members?: string;
  category?: string;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Create Modal State
  const [projectName, setProjectName] = useState("");
  const [projectDue, setProjectDue] = useState("");
  const [projectMembers, setProjectMembers] = useState("");
  const [projectCategory, setProjectCategory] = useState("Development");
  
  // Task Scheduler State
  const [newTaskName, setNewTaskName] = useState("");
  const [assignee, setAssignee] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  // Edit State
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const { data: projData } = await supabase.from("projects").select("*").eq("team_id", team).order("created_at", { ascending: false });
      const { data: taskData } = await supabase.from("project_tasks").select("*");

      setProjects(projData || []);
      setTasks(taskData || []);
      
      if (projData?.length && !selectedProject) {
        setSelectedProject(projData[0]);
        setEditDue(projData[0].due_date || "");
        setEditMembers(projData[0].members || "");
      }
    } catch (err) {
      toast.error("Sync interrupted.");
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
      name: projectName.trim(), 
      team_id: teamId, 
      due_date: projectDue, 
      members: projectMembers,
      category: projectCategory
    }]);
    if (!error) {
      setShowCreateModal(false);
      setProjectName(""); setProjectDue(""); setProjectMembers("");
      loadData(teamId);
      toast.success("Ledger Initialized");
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update({
      due_date: editDue,
      members: editMembers
    }).eq('id', selectedProject.id);

    if (!error) {
      toast.success("Parameters Updated");
      setShowSettings(false);
      if (teamId) loadData(teamId);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !selectedProject) return;
    const { data, error } = await supabase.from("project_tasks").insert([{
      project_id: selectedProject.id, 
      name: newTaskName.trim(), 
      assigned_to: assignee,
      due_date: taskDate,
      priority: priority,
      status: "Backlog"
    }]).select();
    
    if (!error) {
      setTasks(prev => [...prev, ...(data || [])]);
      setNewTaskName(""); setAssignee(""); setTaskDate("");
      toast.success("Task Scheduled");
    }
  };

  const currentTasks = useMemo(() => tasks.filter(t => t.project_id === selectedProject?.id), [tasks, selectedProject]);
  const memberList = useMemo(() => selectedProject?.members ? selectedProject.members.split(',').map(m => m.trim()) : [], [selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#A3B18A] selection:text-white">
      
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 bg-[#A3B18A] rounded-xl flex items-center justify-center text-white">
              <Layout size={18} />
            </div>
            <span className="font-black text-xs tracking-tighter uppercase">TOTS OS</span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {projects.map((p) => (
              <button 
                key={p.id} 
                onClick={() => { setSelectedProject(p); setEditDue(p.due_date || ""); setEditMembers(p.members || ""); }} 
                className={`px-5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                  selectedProject?.id === p.id 
                  ? "bg-[#A3B18A] border-[#A3B18A] text-white shadow-sm" 
                  : "bg-transparent border-transparent text-slate-400 hover:text-black"
                }`}
              >
                {p.name}
              </button>
            ))}
            <button onClick={() => setShowCreateModal(true)} className="p-2 rounded-full border border-dashed border-slate-200 text-slate-300 hover:border-[#A3B18A] hover:text-black transition-all">
              <Plus size={14} />
            </button>
          </div>

          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black">
              <Settings size={18} />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="max-w-[1400px] mx-auto p-8 lg:p-12">
        {selectedProject ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* HERO SECTION */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">{selectedProject.category || "General"} Workspace</span>
                </div>
                <h1 className="text-7xl lg:text-8xl font-serif italic tracking-tighter leading-none text-black">
                  {selectedProject.name}
                </h1>
                <div className="flex gap-3 pt-2">
                   <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                     <Users size={12} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-500">{selectedProject.members || "Solo Project"}</span>
                   </div>
                   <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                     <Calendar size={12} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-500">{selectedProject.due_date || "Continuous"}</span>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/notes')} 
                  className="bg-white border border-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <StickyNote size={14} /> Add Note
                </button>
                <button 
                  onClick={() => router.push('/vault')} 
                  className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#A3B18A] transition-all flex items-center gap-2 shadow-lg"
                >
                  <Archive size={14} /> View Vault
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              
              {/* LEFT: TIMELINE & SCHEDULER */}
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <div className="bg-[#F2F2F2]/40 p-10 rounded-[3rem] border border-slate-100 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Schedule Objective</h3>
                    <Zap size={14} className="text-[#A3B18A]" />
                  </div>
                  
                  <div className="space-y-4">
                    <input 
                      value={newTaskName} 
                      onChange={e => setNewTaskName(e.target.value)} 
                      placeholder="What needs to be done?" 
                      className="w-full bg-white p-6 rounded-2xl outline-none text-xl font-serif italic border border-slate-100 focus:border-[#A3B18A] transition-all" 
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative flex items-center">
                        <UserPlus className="absolute left-5 text-slate-300" size={16} />
                        <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-white p-5 pl-14 rounded-2xl outline-none font-bold text-xs border border-slate-100 appearance-none cursor-pointer">
                          <option value="">Assignee</option>
                          {memberList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="relative flex items-center">
                        <Flag className="absolute left-5 text-slate-300" size={16} />
                        <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white p-5 pl-14 rounded-2xl outline-none font-bold text-xs border border-slate-100 appearance-none cursor-pointer">
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                        </select>
                      </div>
                      <div className="relative flex items-center">
                        <Clock className="absolute left-5 text-slate-300" size={16} />
                        <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full bg-white p-5 pl-14 rounded-2xl outline-none font-bold text-xs border border-slate-100" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleAddTask} className="w-full bg-[#A3B18A] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#8e9d75] transition-all">
                    Add to Project Timeline
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 px-4">Active Timeline</h3>
                  <div className="space-y-3">
                    {currentTasks.map(t => (
                      <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-[#A3B18A] transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-[#F2F2F2] group-hover:text-[#A3B18A] transition-all">
                            <Check size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xl font-serif italic text-black leading-none">{t.name}</p>
                            <div className="flex gap-4">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={10}/> {t.assigned_to || "Open"}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Flag size={10}/> {t.priority || "Medium"}</span>
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal className="text-slate-200 group-hover:text-slate-400 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: COLLABORATORS */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-black p-8 rounded-[3rem] text-white space-y-6">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Collaborators</h3>
                  <div className="space-y-4">
                    {memberList.map((member, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-lg border border-slate-800 flex items-center justify-center text-[9px] font-black bg-slate-900">{member.charAt(0)}</div>
                           <span className="text-[11px] font-bold">{member}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-[#A3B18A]/40" />
                      </div>
                    ))}
                    {memberList.length === 0 && <p className="text-[10px] text-slate-500 italic">No members assigned.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[50vh] flex flex-col items-center justify-center space-y-4 opacity-20">
            <Layout size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select Workspace</p>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/5 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative z-10 border border-slate-100">
              <h3 className="text-4xl font-serif italic tracking-tighter mb-10 text-black text-center">New Workspace</h3>
              <div className="space-y-6">
                <input autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-serif italic text-2xl border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all" placeholder="Project name..." />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={projectDue} onChange={e => setProjectDue(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" />
                  <select value={projectCategory} onChange={e => setProjectCategory(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs">
                    <option value="Development">Development</option>
                    <option value="Creative">Creative</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>
                <textarea placeholder="Members (e.g. Leigha, David)" value={projectMembers} onChange={e => setProjectMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs h-24 resize-none" />
                <button onClick={handleCreateProject} disabled={!projectName.trim()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#A3B18A] transition-all disabled:opacity-20">Initialize Ledger</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/5 backdrop-blur-md" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative z-10 border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-3xl font-serif italic tracking-tighter text-black">Workspace Params</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300 hover:text-black"><X size={20}/></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Extend Deadline</label>
                    <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Sync Team</label>
                    <textarea rows={3} value={editMembers} onChange={e => setEditMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-bold text-xs resize-none" placeholder="David, Leigha, etc..." />
                </div>
                <button onClick={handleUpdateProject} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-2">
                    <Save size={14}/> Save Changes
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