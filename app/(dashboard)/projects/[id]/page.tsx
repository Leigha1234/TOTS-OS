"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, Plus, Zap, Target, FileText, 
  Upload, Shield, Trash2, Check, LayoutGrid, Clock, Radio,
  Users, Settings, Calendar, Share2, Mail, X, MoreHorizontal,
  Cloud, Lock, Save, AlertCircle, Hash
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ProjectEngine() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Tasks"); // Tasks, assets, Project Settings
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: p } = await supabase.from("projects").select("*").eq("id", id).single();
      const { data: t } = await supabase.from("project_tasks").select("*").eq("project_id", id);
      setProject(p);
      setTasks(t || []);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  const addTask = async () => {
    if (!taskInput) return;
    const { data } = await supabase.from("project_tasks").insert([{ project_id: id, name: taskInput, status: 'Active' }]).select().single();
    if (data) {
      setTasks([...tasks, data]);
      setTaskInput("");
      toast.success("Objective Synchronized");
    }
  };

  const updateProject = async (updates: any) => {
    const { error } = await supabase.from("projects").update(updates).eq("id", id);
    if (!error) {
      setProject({ ...project, ...updates });
      toast.success("System Parameters Updated");
    }
  };

  if (loading || !project) return null;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 selection:bg-[#a9b897] selection:text-white">
      
      {/* TACTICAL HEADER */}
      <nav className="p-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Link href="/projects" className="flex items-center gap-3 group">
            <div className="p-2 bg-stone-50 rounded-lg group-hover:bg-stone-900 group-hover:text-white transition-all">
              <ChevronLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Project Overview</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {["Tasks", "assets", "Project Settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${project.health === 'Stable' ? 'bg-[#a9b897]' : 'bg-red-400'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 italic">Project Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: PRIMARY INTERFACE */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          <header className="space-y-4">
            <div className="flex items-center gap-4 text-[#a9b897]">
               <Hash size={16} />
               <p className="text-[11px] font-black uppercase tracking-[0.4em]">{project.category}</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-stone-800 leading-none">
              {project.name}
            </h1>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "Tasks" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                {/* TIMELINE VISUAL */}
                <div className="bg-white border border-stone-100 rounded-[3rem] p-10 shadow-sm space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Timeline</h3>
                    <div className="mt-8 flex items-center gap-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-stone-100 -z-10" />
                        {[project.start_date, "Active Deployment", project.due_date].map((point, i) => ( point && (
                           <div key={i} className="bg-white px-4 py-2 border border-stone-100 rounded-full flex items-center gap-2 shadow-sm">
                              <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-[#a9b897]' : 'bg-stone-200'}`} />
                              <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">{point || "TBD"}</span>
                           </div>
                        )))}
                    </div>
                  </div>

                  {/* TASK LIST */}
                  <div className="space-y-6 pt-10 border-t border-stone-50">
                    <div className="flex gap-3">
                      <input 
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        placeholder="Define next objective..."
                        className="flex-1 bg-stone-50 p-5 rounded-2xl text-xs font-serif italic outline-none focus:ring-1 ring-[#a9b897]/30 transition-all"
                      />
                      <button onClick={addTask} className="bg-stone-900 text-white px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">Add</button>
                    </div>
                    <div className="space-y-3">
                      {tasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-5 hover:bg-stone-50 rounded-2xl transition-all group border border-transparent hover:border-stone-100">
                          <div className="flex items-center gap-5">
                            <div className="w-6 h-6 rounded-lg border-2 border-stone-100 flex items-center justify-center group-hover:border-[#a9b897] transition-all cursor-pointer">
                              <Check size={12} className="text-transparent group-hover:text-[#a9b897]" />
                            </div>
                            <span className="text-sm font-bold text-stone-700">{t.name}</span>
                          </div>
                          <Trash2 size={14} className="text-stone-100 hover:text-red-400 cursor-pointer transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "assets" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* UPLOAD ZONE */}
                  <div className="border-2 border-dashed border-stone-200 rounded-[3rem] p-12 text-center bg-white hover:border-[#a9b897] transition-all cursor-pointer group">
                    <Cloud size={40} className="mx-auto text-stone-200 group-hover:text-[#a9b897] transition-all mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Add New Assets</p>
                    <p className="text-[9px] text-stone-300 mt-2 font-serif italic">PDF, PNG, MP4, .SQL</p>
                  </div>

                  {/* RECENT FILES */}
                  <div className="bg-white border border-stone-100 rounded-[3rem] p-8 space-y-4">
                     <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-300">Sync Assets</h3>
                     {[1,2].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <FileText size={16} className="text-[#a9b897]" />
                              <span className="text-[10px] font-bold text-stone-600">Schema_Protocol_v{i}.docs</span>
                           </div>
                           <MoreHorizontal size={14} className="text-stone-300" />
                        </div>
                     ))}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "Project Settings" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div className="bg-white border border-stone-100 rounded-[3rem] p-10 space-y-12 shadow-sm">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* PARAMETERS SECTION */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Administrative Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">Start Date</label>
                                    <input type="date" defaultValue={project.due_date} onChange={(e) => updateProject({ due_date: e.target.value })} className="w-full bg-stone-50 p-4 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-stone-200" />
                                </div>
                               
                            </div>
                        </div>

                        {/* STACKED AND CONTROLLED PERSONNEL ACCESS BOX */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Team Members</h3>
                            <div className="space-y-4">
                                <div className="space-y-2.5">
                                    <input 
                                      value={inviteEmail} 
                                      onChange={(e) => setInviteEmail(e.target.value)} 
                                      placeholder="Email address..." 
                                      className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none border border-stone-100 focus:bg-stone-50/40 focus:border-stone-200 transition-all text-stone-800" 
                                    />
                                    <button className="w-full bg-stone-900 text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm">
                                      Invite Member
                                    </button>
                                </div>
                                <div className="space-y-2 pt-2">
                                    {project.members?.split(',').map((m: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 border border-stone-50 rounded-xl bg-stone-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-[#a9b897]/20 flex items-center justify-center text-[8px] font-black text-[#a9b897]">{m.trim().charAt(0)}</div>
                                                <span className="text-[10px] font-bold text-stone-600">{m.trim()}</span>
                                            </div>
                                            <button className="text-[8px] font-black uppercase text-stone-300 hover:text-red-500 transition-colors">Revoke</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-stone-50">
                        <button className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-600 transition-colors">
                            <Trash2 size={14} /> Delete Project
                        </button>
                    </div>
                 </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: UTILITY & CARDS */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* THE VAULT (QUICK ACCESS) */}
          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <Shield size={180} className="absolute -right-12 -top-12 opacity-5 rotate-12" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Vault</h3>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                 <button onClick={() => setActiveTab("assets")} className="w-full py-3 bg-[#a9b897] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Access Vault</button>
              </div>
            </div>
          </div>

          {/* TEAM CARD */}
          <div className="bg-white border border-stone-100 p-8 rounded-[3rem] shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Invite Team Members</h3>
              <Share2 size={14} className="text-stone-300" />
            </div>
            <div className="flex -space-x-3">
                {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-300 ring-1 ring-stone-50">{i}</div>)}
                <button onClick={() => setActiveTab("Project Settings")} className="w-10 h-10 rounded-full border-4 border-white bg-stone-900 flex items-center justify-center text-white ring-1 ring-stone-900 hover:bg-[#a9b897] transition-all">
                    <Plus size={14} />
                </button>
            </div>
            <p className="text-[10px] font-serif italic text-stone-400 leading-relaxed">Collaborate with team members on this project.</p>
          </div>

        </aside>
      </main>

      {/* RE-CONSTRUCTED SANITIZED STRINGS FOR THE FONTS LAYER */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}