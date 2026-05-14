"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, ChevronRight, Hash, Folder, Clock, Users, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

export default function ProjectIndex() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, [supabase]);

  const createProject = async () => {
    if (!newName) return;
    const { data, error } = await supabase.from("projects").insert([{ name: newName, health: 'Stable' }]).select();
    if (!error) {
      setProjects([data[0], ...projects]);
      setShowModal(false);
      setNewName("");
      toast.success("Project Ledger Initialized");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black font-sans selection:bg-[#A3B18A]">
      <main className="max-w-4xl mx-auto px-6 py-20">
        
        {/* HEADER */}
        <header className="flex justify-between items-end mb-16 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-5xl font-serif italic tracking-tighter">Workspaces</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Active Strategic Deployments</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all"
          >
            <Plus size={14} /> New Project
          </button>
        </header>

        {/* PROJECT LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-[9px] font-black uppercase tracking-widest text-slate-200">Syncing Ledgers...</div>
          ) : projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <motion.div 
                whileHover={{ x: 5 }}
                className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:border-black transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-black group-hover:bg-[#A3B18A]/10 transition-colors">
                    <Folder size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif italic">{p.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1">
                        <Clock size={8} /> {p.due_date || "No Deadline"}
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1">
                        <Users size={8} /> {p.members?.split(',').length || 1} Personnel
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${p.health === 'Stable' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {p.health}
                  </span>
                  <ArrowUpRight size={16} className="text-slate-200 group-hover:text-black transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && projects.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <Hash size={32} className="mx-auto text-slate-100 mb-4" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-200">No Projects Found</p>
          </div>
        )}
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border border-slate-100"
            >
              <h2 className="text-3xl font-serif italic mb-6">Initialize Workspace</h2>
              <input 
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-sm font-serif italic mb-6"
                placeholder="Project Name..."
              />
              <div className="flex flex-col gap-2">
                <button onClick={createProject} className="w-full bg-black text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">Create</button>
                <button onClick={() => setShowModal(false)} className="w-full py-4 text-[8px] font-black uppercase text-slate-300">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}} />
    </div>
  );
}