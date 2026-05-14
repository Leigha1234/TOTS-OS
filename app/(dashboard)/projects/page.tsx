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
  Layers, Target, Trash2, Edit3
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

export default function EnhancedProjectsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // Modal/UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'grid' | 'settings'>('timeline');

  // New Project Form
  const [formName, setFormName] = useState("");
  const [formDue, setFormDue] = useState("");
  const [formMembers, setFormMembers] = useState("");
  const [formCategory, setFormCategory] = useState("Development");

  // Task Scheduler Form
  const [taskName, setTaskName] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Project Edit State (Scoped Settings)
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editObjective, setEditObjective] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA FLOW ---
  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    const { data: pData } = await supabase.from("projects").select("*").eq("team_id", id).order("created_at", { ascending: false });
    const { data: tData } = await supabase.from("project_tasks").select("*");
    
    setProjects(pData || []);
    setTasks(tData || []);

    if (pData?.length && !selectedProject) {
      handleProjectSelect(pData[0]);
    }
    setLoading(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(id => {
      const tId = id || "default";
      setTeamId(tId);
      loadData(tId);
    });
  }, [loadData]);

  const handleProjectSelect = (p: Project) => {
    setSelectedProject(p);
    setEditName(p.name);
    setEditDue(p.due_date || "");
    setEditMembers(p.members || "");
    setEditObjective(p.objective_summary || "");
  };

  const handleCreateProject = async () => {
    if (!formName || !teamId) return;
    const { error } = await supabase.from("projects").insert([{
      name: formName,
      team_id: teamId,
      due_date: formDue,
      members: formMembers,
      category: formCategory
    }]);
    if (!error) {
      toast.success("Workspace Ledger Initialized");
      setShowCreateModal(false);
      loadData(teamId);
    }
  };

  const handleUpdateProjectSettings = async () => {
    if (!selectedProject || !teamId) return;
    const { error } = await supabase.from("projects").update({
      name: editName,
      due_date: editDue,
      members: editMembers,
      objective_summary: editObjective
    }).eq('id', selectedProject.id);

    if (!error) {
      toast.success("Project Parameters Synced");
      setShowSettings(false);
      loadData(teamId);
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

    if (!error) {
      setTasks(prev => [...prev, ...data]);
      setTaskName(""); setTaskAssignee(""); setTaskDueDate("");
      toast.success("Objective Scheduled");
    }
  };

  const filteredTasks = useMemo(() => 
    tasks.filter(t => t.project_id === selectedProject?.id), 
  [tasks, selectedProject]);

  const projectMembersArray = useMemo(() => 
    selectedProject?.members ? selectedProject.members.split(',').map(m => m.trim()) : [],
  [selectedProject]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-[#A3B18A] selection:text-white">
      
      {/* GLOBAL TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl z-[100] px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#A3B18A] rounded-lg flex items-center justify-center text-white">
              <Layers size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">TOTS OS / ECOSYSTEM</span>
          </div>
          
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[600px]">
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => handleProjectSelect(p)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                  selectedProject?.id === p.id ? "bg-[#A3B18A] text-white" : "text-slate-400 hover:text-black"
                }`}
              >
                {p.name}
              </button>
            ))}
            <button onClick={() => setShowCreateModal(true)} className="w-7 h-7 rounded-full border border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-[#A3B18A] hover:text-[#A3B18A] transition-all">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/notes')} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-all flex items-center gap-2">
            <StickyNote size={14} /> Notes
          </button>
          <button onClick={() => router.push('/vault')} className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all flex items-center gap-2 shadow-lg shadow-black/5">
            <Archive size={14} /> The Vault
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="pt-32 pb-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
        {selectedProject ? (
          <div className="space-y-16">
            
            {/* HERO MODULE */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#F2F2F2] rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {selectedProject.category}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    Ref: {selectedProject.id.slice(0,8)}
                  </span>
                </div>
                
                <h1 className="text-8xl lg:text-9xl font-serif italic tracking-tighter text-black leading-[0.85]">
                  {selectedProject.name}
                </h1>
                
                <p className="text-xl font-serif text-slate-400 italic leading-relaxed">
                  {selectedProject.objective_summary || "No workspace objective defined. Adjust project settings to align focus."}
                </p>

                <div className="flex gap-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Target Date</p>
                    <p className="text-xs font-bold flex items-center gap-2"><Calendar size={12} className="text-[#A3B18A]"/> {selectedProject.due_date || "Open Ended"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Team Scale</p>
                    <p className="text-xs font-bold flex items-center gap-2"><Users size={12} className="text-[#A3B18A]"/> {projectMembersArray.length} Collaborators</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-end">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="group flex items-center gap-3 bg-[#F2F2F2] p-6 rounded-[2.5rem] hover:bg-[#A3B18A]/10 transition-all border border-transparent hover:border-[#A3B18A]/20"
                >
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black">Project Config</p>
                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-[#A3B18A]">Edit Workspace</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#A3B18A] shadow-sm transition-all">
                    <Settings size={20} />
                  </div>
                </button>
              </div>
            </div>

            {/* INTERACTIVE WORKSPACE GRID */}
            <div className="grid grid-cols-12 gap-12">
              
              {/* LEFT: SCHEDULER & TIMELINE */}
              <div className="col-span-12 lg:col-span-8 space-y-16">
                
                {/* ATOMIC SCHEDULER */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Schedule Objective</h2>
                    <Zap size={14} className="text-[#A3B18A]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="Input objective description..."
                      className="col-span-1 md:col-span-2 bg-[#F2F2F2] p-6 rounded-2xl text-2xl font-serif italic outline-none border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all"
                    />
                    <div className="relative">
                      <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select 
                        value={taskAssignee}
                        onChange={e => setTaskAssignee(e.target.value)}
                        className="w-full bg-[#F2F2F2] p-5 pl-14 rounded-2xl text-[11px] font-bold appearance-none outline-none border border-transparent focus:bg-white focus:border-[#A3B18A]"
                      >
                        <option value="">Assign Collaborator</option>
                        {projectMembersArray.map((m, i) => <option key={i} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <Flag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select 
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="w-full bg-[#F2F2F2] p-5 pl-14 rounded-2xl text-[11px] font-bold appearance-none outline-none border border-transparent focus:bg-white focus:border-[#A3B18A]"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                    <div className="relative col-span-1 md:col-span-2">
                      <CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="date"
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        className="w-full bg-[#F2F2F2] p-5 pl-14 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:bg-white focus:border-[#A3B18A]"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddTask}
                    className="w-full bg-black text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3"
                  >
                    Deploy to Timeline <ChevronRight size={14} />
                  </button>
                </div>

                {/* VISUAL TIMELINE COMPONENT */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Pulse Timeline</h2>
                      <Activity size={14} className="text-[#A3B18A]" />
                   </div>
                   
                   <div className="relative overflow-x-auto no-scrollbar pb-4">
                      <div className="flex gap-4 min-w-[1000px]">
                        {filteredTasks.length > 0 ? filteredTasks.map((t, idx) => (
                          <div key={t.id} className="w-[300px] shrink-0 space-y-4">
                            <div className="h-[2px] w-full bg-[#F2F2F2] relative">
                               <div className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-[#A3B18A]" />
                               {idx < filteredTasks.length -1 && <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-r from-[#A3B18A] to-[#F2F2F2]" />}
                            </div>
                            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] space-y-4 hover:shadow-xl hover:shadow-slate-100 transition-all group">
                               <div className="flex justify-between items-start">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                    t.priority === 'High' ? 'bg-red-50 text-red-400' : 'bg-slate-50 text-slate-400'
                                  }`}>
                                    {t.priority}
                                  </span>
                                  <Clock size={12} className="text-slate-200 group-hover:text-[#A3B18A]" />
                               </div>
                               <h4 className="text-lg font-serif italic text-black leading-tight">{t.name}</h4>
                               <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white uppercase">{t.assigned_to?.charAt(0) || '?'}</div>
                                    <span className="text-[9px] font-bold text-slate-400">{t.assigned_to || "Unassigned"}</span>
                                  </div>
                                  <span className="text-[9px] font-black text-slate-300">{t.due_date || "TBD"}</span>
                               </div>
                            </div>
                          </div>
                        )) : (
                          <div className="w-full py-20 border border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-200">
                             <Target size={32} />
                             <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Timeline Initialization</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT: COLLABORATORS & ASSETS */}
              <div className="col-span-12 lg:col-span-4 space-y-12">
                 <div className="bg-black p-10 rounded-[3.5rem] text-white space-y-8 shadow-2xl shadow-black/20">
                    <div className="flex justify-between items-center">
                       <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Active Team</h3>
                       <Users size={14} className="text-[#A3B18A]" />
                    </div>
                    
                    <div className="space-y-6">
                       {projectMembersArray.map((member, i) => (
                         <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black group-hover:border-[#A3B18A] transition-all">
                                 {member.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-[11px] font-bold text-white">{member}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Collaborator</p>
                               </div>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]/20 group-hover:bg-[#A3B18A] transition-all" />
                         </div>
                       ))}
                       {projectMembersArray.length === 0 && (
                         <p className="text-[10px] text-slate-500 italic py-4">No personnel registered to this workspace.</p>
                       )}
                    </div>

                    <button className="w-full py-4 border border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                       Invite To Workspace
                    </button>
                 </div>

                 <div className="bg-[#F2F2F2] p-10 rounded-[3.5rem] border border-slate-100 flex flex-col items-center text-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-[#A3B18A] shadow-sm">
                       <FileText size={24} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest">Workspace Assets</p>
                       <p className="text-[11px] font-serif italic text-slate-400">Linked research and vault documents will appear here automatically.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-8 animate-pulse">
             <div className="w-20 h-20 bg-[#F2F2F2] rounded-[2rem] flex items-center justify-center text-slate-200">
               <Layers size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Select Node to Synchronize</p>
          </div>
        )}
      </main>

      {/* MODAL: CREATE PROJECT */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-white/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[4rem] p-16 shadow-2xl relative z-10 border border-slate-50">
              <h3 className="text-5xl font-serif italic tracking-tighter mb-12 text-black">New Ledger</h3>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-4">Workspace Identity</label>
                    <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-3xl outline-none font-serif italic text-3xl border border-transparent focus:bg-white focus:border-[#A3B18A] transition-all" placeholder="Project name..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-4">Target Date</label>
                       <input type="date" value={formDue} onChange={e => setFormDue(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-[11px]" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-4">Category</label>
                       <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-[11px] appearance-none">
                          <option value="Development">Development</option>
                          <option value="Creative">Creative</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Internal">Internal</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-300 ml-4">Initial Personnel (Comma Separated)</label>
                    <textarea value={formMembers} onChange={e => setFormMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-3xl outline-none font-bold text-[11px] h-24 resize-none" placeholder="David, Leigha, etc..." />
                 </div>
                 <button onClick={handleCreateProject} disabled={!formName} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#A3B18A] transition-all disabled:opacity-20">Initialize Workspace</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PROJECT SETTINGS (SCOPED) */}
      <AnimatePresence>
        {showSettings && selectedProject && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-white/40 backdrop-blur-xl" />
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl relative z-10 border border-slate-50 overflow-hidden">
              <div className="flex justify-between items-start mb-12">
                <div>
                   <h3 className="text-4xl font-serif italic tracking-tighter text-black">Workspace Params</h3>
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Configuring {selectedProject.name}</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 bg-[#F2F2F2] hover:bg-black hover:text-white rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Workspace Title</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-serif italic text-2xl" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Core Objective (Summary)</label>
                    <textarea rows={3} value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full bg-[#F2F2F2] p-6 rounded-2xl outline-none font-serif italic text-lg resize-none" placeholder="What is the singular goal of this workspace?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Deadline Extension</label>
                      <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Team Scalability</label>
                      <input value={editMembers} onChange={e => setEditMembers(e.target.value)} className="w-full bg-[#F2F2F2] p-5 rounded-2xl outline-none font-bold text-xs" placeholder="Add more collaborators..." />
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                   <button onClick={handleUpdateProjectSettings} className="flex-1 bg-black text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3">
                      <Save size={16} /> Sync Parameters
                   </button>
                   <button className="px-8 bg-red-50 text-red-400 rounded-3xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={20} />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CORE STYLE INJECTION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: #A3B18A; color: white; }
      `}} />
    </div>
  );
}