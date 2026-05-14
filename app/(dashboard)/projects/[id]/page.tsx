"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, Plus, Zap, Target, FileText, 
  Upload, Shield, Trash2, Check, LayoutGrid, Clock, Radio
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ProjectEngine() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("projects").select("*").eq("id", id).single();
      const { data: t } = await supabase.from("project_tasks").select("*").eq("project_id", id);
      setProject(p);
      setTasks(t || []);
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 selection:bg-[#a9b897] selection:text-white">
      
      {/* TACTICAL HEADER */}
      <nav className="p-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/projects" className="flex items-center gap-3 group">
          <div className="p-2 bg-stone-50 rounded-lg group-hover:bg-stone-900 group-hover:text-white transition-all">
            <ChevronLeft size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Archive Index</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-[#a9b897] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Live Workspace</span>
          </div>
          <div className="h-4 w-[1px] bg-stone-200" />
          <LayoutGrid size={16} className="text-stone-300 hover:text-black cursor-pointer transition-colors" />
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-12 gap-12">
        
        {/* PRIMARY EXECUTION (LEFT) */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          <header className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-stone-800 leading-none">
              {project.name}
            </h1>
            <p className="text-lg font-serif italic text-stone-500 max-w-2xl leading-relaxed">
              {project.objective_summary || "Defining strategic parameters for this operational node."}
            </p>
          </header>

          {/* TASK & TIMELINE ENGINE */}
          <section className="bg-white border border-stone-100 rounded-[3rem] p-10 shadow-sm space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Operational Timeline</h3>
                <p className="text-2xl font-serif italic mt-1 text-stone-800">Deployment Logic</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input 
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Next objective..."
                className="flex-1 bg-stone-50 p-5 rounded-2xl text-xs font-serif italic outline-none focus:ring-1 ring-[#a9b897]/30 transition-all"
              />
              <button onClick={addTask} className="bg-stone-900 text-white px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">
                Append
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map(t => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={t.id} className="flex items-center justify-between p-5 hover:bg-stone-50 rounded-2xl transition-all group border border-transparent hover:border-stone-100">
                  <div className="flex items-center gap-5">
                    <div className="w-6 h-6 rounded-lg border-2 border-stone-100 flex items-center justify-center group-hover:border-[#a9b897] transition-all">
                      <Check size={12} className="text-transparent group-hover:text-[#a9b897]" />
                    </div>
                    <span className="text-sm font-bold text-stone-700 tracking-tight">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[8px] font-black uppercase text-stone-300 tracking-widest italic">{t.status}</span>
                    <Trash2 size={14} className="text-stone-100 hover:text-red-400 cursor-pointer transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* UTILITY STACK (RIGHT) */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* THE VAULT */}
          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
            <Shield size={200} className="absolute -right-16 -top-16 opacity-5 rotate-12" />
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Asset Vault</h3>
                <Upload size={14} className="text-[#a9b897]" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                  <FileText size={16} className="text-[#a9b897]" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Manifesto.pdf</span>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK DOCS / NOTES */}
          <div className="bg-white border border-stone-100 p-10 rounded-[3rem] space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Live Documentation</h3>
              <Zap size={14} className="text-[#a9b897]" />
            </div>
            <textarea 
              className="w-full h-48 bg-stone-50 rounded-2xl p-5 text-sm font-serif italic outline-none resize-none placeholder-stone-200 leading-relaxed"
              placeholder="Operational notes..."
              defaultValue={project.notes}
            />
            <button className="w-full py-4 border border-stone-100 rounded-xl text-[8px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-900 hover:text-white transition-all">
              Update Signal
            </button>
          </div>

        </aside>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}} />
    </div>
  );
}