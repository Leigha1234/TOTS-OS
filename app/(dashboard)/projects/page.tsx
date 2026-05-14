"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, Search, Check, List, 
  Calendar, Users, Clock, FolderPlus,
  ChevronRight, MoreHorizontal, X,
  AlertCircle, Layout, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- TYPES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: string;
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
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  // Modal & Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDue, setProjectDue] = useState("");
  const [projectMembers, setProjectMembers] = useState("");
  
  const [newTaskName, setNewTaskName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async (team: string) => {
    setLoading(true);
    try {
      const { data: projData, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("team_id", team)
        .order("created_at", { ascending: false });

      const { data: taskData, error: tError } = await supabase
        .from("project_tasks")
        .select("*");

      if (pError || tError) throw pError || tError;

      setProjects(projData || []);
      setTasks(taskData || []);
      
      if (projData?.length && !selectedProject) {
        setSelectedProject(projData[0]);
      }
    } catch (err: any) {
      console.error("Database Error:", err);
      toast.error("Table sync error. Make sure 'due_date' and 'members' columns exist.");
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
    try {
      const { error } = await supabase.from("projects").insert([{ 
        name: projectName.trim(), 
        team_id: teamId,
        due_date: projectDue,
        members: projectMembers
      }]);
      
      if (error) throw error;
      
      setProjectName("");
      setProjectDue("");
      setProjectMembers("");
      setShowCreateModal(false);
      loadData(teamId);
      toast.success("Project added successfully");
    } catch (err) {
      toast.error("Save failed. Verify your database columns.");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !selectedProject) return;
    try {
      const { data, error } = await supabase.from("project_tasks").insert([{
        project_id: selectedProject.id, 
        name: newTaskName.trim(), 
        status: "Backlog"
      }]).select();
      
      if (error) throw error;
      setTasks(prev => [...prev, ...(data || [])]);
      setNewTaskName("");
    } catch (err) {
      toast.error("Failed to add task");
    }
  };

  const filteredProjects = useMemo(() => 
    projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery]
  );

  const currentTasks = useMemo(() => 
    tasks.filter(t => t.project_id === selectedProject?.id),
    [tasks, selectedProject]
  );

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Layout size={18} />
            </div>
            <span className="font-black text-sm uppercase tracking-tighter">Projects</span>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <span>New Project</span>
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 py-2.5 pl-9 pr-4 text-xs rounded-xl outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-10 space-y-1 custom-scrollbar">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group ${
                selectedProject?.id === p.id 
                ? "bg-white shadow-md border border-slate-100" 
                : "hover:bg-white/50 text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className={`text-xs font-bold truncate ${selectedProject?.id === p.id ? "text-slate-900" : ""}`}>
                  {p.name}
                </span>
                {p.due_date && (
                  <span className="text-[10px] opacity-60 flex items-center gap-1">
                    <Clock size={10} /> {p.due_date}
                  </span>
                )}
              </div>
              <ChevronRight size={14} className={selectedProject?.id === p.id ? "text-slate-900" : "opacity-0 group-hover:opacity-100"} />
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedProject ? (
          <>
            <header className="p-10 border-b border-slate-50">
              <div className="max-w-4xl mx-auto flex justify-between items-end">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Active</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">{selectedProject.name}</h1>
                  <div className="flex gap-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <Calendar size={14} className="text-slate-300" />
                      <span>Due: {selectedProject.due_date || "Not set"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <Users size={14} className="text-slate-300" />
                      <span>Team: {selectedProject.members || "Personal"}</span>
                    </div>
                  </div>
                </div>
                <button className="p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                  <MoreHorizontal size={20} className="text-slate-400" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
              <div className="max-w-4xl mx-auto space-y-10">
                
                {/* NEW TASK INPUT */}
                <div className="relative group">
                  <input 
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    placeholder="Add a new task to this project..."
                    className="w-full bg-white border border-slate-200 py-5 px-8 rounded-2xl shadow-xl shadow-slate-200/20 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium text-slate-700"
                  />
                  <button 
                    onClick={handleAddTask} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>

                {/* TASKS LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Project Tasks</h3>
                    <span className="text-[10px] font-bold text-slate-400">{currentTasks.length} total</span>
                  </div>
                  
                  <div className="grid gap-3">
                    {currentTasks.length > 0 ? currentTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-5 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <button className="w-6 h-6 rounded-lg border-2 border-slate-100 group-hover:border-slate-900 transition-colors flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </button>
                          <span className="font-bold text-sm text-slate-600">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-white/50">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <List size={24} className="text-slate-200" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tasks yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="opacity-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Select a project to continue</p>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCreateModal(false)} 
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-12 shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-slate-900">New Project</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Workspace Details</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={24} className="text-slate-300" />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Project Name</label>
                  <input 
                    autoFocus 
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold text-slate-900" 
                    placeholder="e.g. Q4 e-tron Research" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Due Date</label>
                    <input 
                      type="date" 
                      value={projectDue} 
                      onChange={(e) => setProjectDue(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl outline-none focus:border-slate-900 transition-all font-bold text-slate-900" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Team Members</label>
                    <input 
                      placeholder="e.g. Leigha, Dave" 
                      value={projectMembers} 
                      onChange={(e) => setProjectMembers(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl outline-none focus:border-slate-900 transition-all font-bold text-slate-900" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                    onClick={() => setShowCreateModal(false)} 
                    className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject} 
                    disabled={!projectName.trim()} 
                    className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-20 shadow-xl shadow-slate-900/20"
                  >
                    Initialize Project
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #E2E8F0; }
      `}} />
    </div>
  );
}