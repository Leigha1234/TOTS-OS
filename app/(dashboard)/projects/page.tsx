"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  Plus, Search, Trash2, Activity, StickyNote, 
  Check, ArrowUpRight, User, Sparkles, 
  MoreHorizontal, Layers, Zap, Clock, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
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
      
      setProjects(projData || []);
      setTasks(taskData || []);
      if (projData?.length && !selectedProject) setSelectedProject(projData[0]);
    } catch (err) {
      toast.error("Protocol error: Database handshake failed.");
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

  if (!isMounted) return null;

  const currentTasks = tasks.filter(t => t.project_id === selectedProject?.id);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-900 font-sans selection:bg-stone-900 selection:text-white flex">
      
      {/* LEFT NAV: THE REPOSITORY */}
      <aside className="w-80 border-r border-stone-200 bg-white flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 p-2 rounded-lg text-white">
              <Layers size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Archive v3.5</span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
            <input 
              placeholder="Filter repository..."
              className="w-full bg-stone-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 ring-stone-200"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full text-left px-4 py-4 rounded-xl transition-all flex items-center justify-between group ${
                selectedProject?.id === p.id ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-50">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              {selectedProject?.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-stone-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition-all"
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto">
        {selectedProject ? (
          <div className="max-w-6xl mx-auto p-12 lg:p-20 space-y-20">
            
            {/* HERO SECTION */}
            <header className="space-y-8">
              <div className="flex items-center gap-4 text-stone-400">
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Current Environment</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              
              <div className="flex justify-between items-end">
                <h1 className="text-8xl lg:text-[9rem] font-serif italic tracking-tighter text-stone-900 leading-none">
                  {selectedProject.name}
                </h1>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    <Clock size={12} /> {selectedProject.status}
                  </div>
                </div>
              </div>
            </header>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-12 gap-8">
              
              {/* STATS BENTO */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-stone-900 text-white rounded-[2.5rem] p-10 space-y-12 overflow-hidden relative group">
                  <Activity size={40} className="text-stone-700 absolute -right-4 -top-4 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Sprint Progress</p>
                    <p className="text-6xl font-serif italic">84%</p>
                  </div>
                  <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} className="h-full bg-white" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 space-y-4">
                  <div className="flex items-center gap-2 text-stone-400 uppercase text-[9px] font-bold tracking-widest">
                    <Zap size={12} /> Live Insights
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed italic font-serif text-lg">
                    "Project efficiency is up by 12% since last login. Focus on high-priority backlogs."
                  </p>
                </div>
              </div>

              {/* TASK LEDGER */}
              <div className="col-span-12 lg:col-span-8 bg-white border border-stone-200 rounded-[3rem] p-12">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-serif italic">Active Tasks</h3>
                  <button className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {currentTasks.length > 0 ? currentTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-transparent hover:border-stone-100 hover:bg-white transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-6 h-6 rounded-full border-2 border-stone-200 group-hover:border-stone-900 transition-colors" />
                        <span className="text-xl font-serif italic text-stone-700">{task.name}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">{task.priority}</span>
                    </div>
                  )) : (
                    <div className="py-20 text-center space-y-4">
                      <Sparkles className="mx-auto text-stone-200" size={32} />
                      <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em]">Clear Horizon / No Tasks</p>
                    </div>
                  )}
                </div>

                <div className="mt-12 flex gap-4">
                  <input 
                    placeholder="Capture objective..."
                    className="flex-1 bg-stone-50 border-none rounded-2xl p-5 text-xl font-serif italic outline-none focus:ring-2 ring-stone-900/5 transition-all"
                  />
                  <button className="bg-stone-900 text-white px-8 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-stone-200" size={40} />
          </div>
        )}
      </main>

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
      `}} />
    </div>
  );
}