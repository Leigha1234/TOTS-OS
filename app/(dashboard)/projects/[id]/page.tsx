"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, Plus, Save, Clock, Target, FileText, 
  Upload, Users, Zap, Trash2, Check, Settings 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function ProjectDetailView() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskName, setTaskName] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const loadProject = async () => {
      const { data: p } = await supabase.from("projects").select("*").eq("id", id).single();
      const { data: t } = await supabase.from("project_tasks").select("*").eq("project_id", id);
      setProject(p);
      setTasks(t || []);
    };
    loadProject();
  }, [id, supabase]);

  const addTask = async () => {
    if (!taskName) return;
    const { data } = await supabase.from("project_tasks").insert([{ project_id: id, name: taskName, status: 'Active' }]).select();
    if (data) {
      setTasks([...tasks, data[0]]);
      setTaskName("");
      toast.success("Task Added");
    }
  };

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-black font-sans pb-20">
      
      {/* MINIMAL NAV */}
      <nav className="p-6 flex justify-between items-center border-b border-slate-100 bg-white sticky top-0 z-30">
        <Link href="/projects" className="flex items-center gap-2 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Back to Index</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-black uppercase px-3 py-1 bg-slate-50 rounded-full border border-slate-100">{project.health}</span>
          <Settings size={14} className="text-slate-300 hover:text-black cursor-pointer" />
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-12 gap-10">
        
        {/* LEFT: STRATEGIC HEAD & TIMELINE */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          
          <div className="space-y-4">
            <h1 className="text-6xl font-serif italic tracking-tighter">{project.name}</h1>
            <p className="text-sm font-serif italic text-slate-500 max-w-2xl border-l border-slate-200 pl-6">
              {project.objective_summary || "No strategic objective defined for this workspace."}
            </p>
          </div>

          {/* TASK ENGINE */}
          <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8 flex items-center gap-2">
              <Target size={14} /> Execution Timeline
            </h3>

            <div className="flex gap-2 mb-8">
              <input 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Define objective..."
                className="flex-1 bg-slate-50 p-4 rounded-xl text-xs font-serif italic outline-none focus:bg-white focus:ring-1 ring-slate-100 transition-all"
              />
              <button onClick={addTask} className="bg-black text-white px-8 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">Add Task</button>
            </div>

            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center group-hover:border-[#A3B18A] transition-colors">
                      <Check size={10} className="text-transparent group-hover:text-slate-200" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[8px] font-black uppercase text-slate-300">{t.status}</span>
                    <button className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: UTILITY STACK */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* SCRATCHPAD */}
          <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30">Scratchpad</h3>
              <Zap size={12} className="text-[#A3B18A]" />
            </div>
            <textarea 
              className="w-full bg-transparent text-white/70 text-sm font-serif italic outline-none min-h-[150px] resize-none leading-relaxed"
              placeholder="Draft notes, quick thoughts..."
              defaultValue={project.notes}
            />
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 transition-all">Synchronize Notes</button>
          </div>

          {/* VAULT */}
          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Vault Assets</h3>
              <Upload size={14} className="text-slate-300 hover:text-black cursor-pointer" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <FileText size={14} className="text-slate-300" />
                <span className="text-[9px] font-bold text-slate-500">Project_Requirements.pdf</span>
              </div>
            </div>
          </div>

          {/* PERSONNEL */}
          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] space-y-6">
            <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Personnel Ledger</h3>
            <div className="space-y-3">
              {project.members?.split(',').map((m: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-[#A3B18A]/10 flex items-center justify-center text-[9px] font-black text-[#A3B18A]">
                    {m.trim().charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{m.trim()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}} />
    </div>
  );
}