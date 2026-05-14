"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, Search, Check, List, 
  LayoutGrid, Settings, MoreVertical, 
  ChevronRight, Folder, Filter, 
  Clock, CheckCircle2, Circle
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
  created_at: string;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- DATA LOADING ---
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
      
      // Auto-select first project if none selected
      if (projData?.length && !selectedProject) {
        setSelectedProject(projData[0]);
      }
    } catch (err) {
      console.error("Database Error:", err);
      toast.error("Failed to sync with database.");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    getUserTeam().then(team => {
      const t = team || "internal-org-default";
      setTeamId(t);
      loadData(t);
    });
  }, [loadData]);

  // --- ACTIONS ---
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    try {
      const { error } = await supabase.from("projects").insert([{ 
        name: projectName.trim(), 
        team_id: teamId 
      }]);
      if (error) throw error;
      setProjectName("");
      setShowCreateModal(false);
      loadData(teamId);
      toast.success("Project created successfully");
    } catch (err) {
      toast.error("Could not create project");
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

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Completed" ? "Backlog" : "Completed";
    try {
      const { error } = await supabase
        .from("project_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // --- COMPUTED ---
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
    <div className="flex h-screen bg-[#FDFDFD] text-stone-900 font-sans">
      
      {/* SIDEBAR: PROJECT LIST */}
      <aside className="w-80 bg-white border-r border-stone-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-sm uppercase tracking-widest text-stone-400">Projects</h2>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-stone-900 text-white rounded-lg hover:scale-105 transition-all shadow-lg shadow-stone-900/10"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
            <input 
              placeholder="Filter list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-2 pl-9 pr-4 text-xs rounded-xl focus:ring-2 focus:ring-stone-900/5 outline-none transition-all"
            />
          </div>

          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
            {filteredProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                  selectedProject?.id === p.id 
                  ? "bg-stone-100 text-stone-900 border border-stone-200 shadow-sm" 
                  : "hover:bg-stone-50 text-stone-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Folder size={16} className={selectedProject?.id === p.id ? "text-stone-900" : "text-stone-300 group-hover:text-stone-400"} />
                  <span className="truncate font-semibold text-xs tracking-tight">{p.name}</span>
                </div>
                {selectedProject?.id === p.id && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN VIEW: TASK MANAGEMENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <>
            <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 px-10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Project View</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">{selectedProject.name}</h1>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors">
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-stone-50/30 p-10 lg:p-16 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-12">
                
                {/* NEW TASK INPUT */}
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors">
                    <Plus size={20} />
                  </div>
                  <input 
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    placeholder="Create a new task..."
                    className="w-full h-16 pl-14 pr-6 bg-white border border-stone-200 rounded-[1.25rem] shadow-xl shadow-stone-200/20 outline-none focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all font-medium text-stone-800"
                  />
                </div>

                {/* TASK LIST SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <List size={16} className="text-stone-400" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Current Tasks</h3>
                    </div>
                    <div className="flex items-center gap-2 text-stone-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold">{currentTasks.length} total</span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {currentTasks.length > 0 ? currentTasks.map(task => (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center justify-between p-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-900 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center gap-5">
                          <button 
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              task.status === "Completed" 
                              ? "bg-stone-900 border-stone-900" 
                              : "border-stone-200 group-hover:border-stone-400"
                            }`}
                          >
                            {task.status === "Completed" && <Check size={14} className="text-white" />}
                          </button>
                          <span className={`font-semibold tracking-tight ${
                            task.status === "Completed" ? "text-stone-300 line-through" : "text-stone-700"
                          }`}>
                            {task.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            {task.status}
                          </span>
                          <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-900 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-24 text-center border-2 border-dashed border-stone-200 rounded-[2.5rem] bg-white/50">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                          <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-stone-900 mb-1">All caught up</h4>
                        <p className="text-xs text-stone-400">Your task list for this project is empty.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-300 bg-stone-50/20">
            <LayoutGrid size={64} className="mb-6 opacity-10" />
            <p className="font-bold text-xs uppercase tracking-[0.3em] opacity-40">Select a project to view tasks</p>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl relative z-10 border border-stone-100"
            >
              <div className="mb-8">
                <h3 className="text-xl font-bold text-stone-900">New Project</h3>
                <p className="text-xs text-stone-400 font-medium">Define a new workspace environment.</p>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Project Name</label>
                  <input 
                    autoFocus
                    placeholder="e.g. Website Redesign"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    className="w-full bg-stone-50 border border-stone-200 p-4 rounded-xl outline-none focus:border-stone-900 transition-all font-semibold text-stone-900"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-stone-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="flex-1 py-4 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-all disabled:opacity-30 shadow-xl shadow-stone-900/20"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D6D3D1; }
      `}} />
    </div>
  );
}