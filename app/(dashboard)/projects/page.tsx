"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Plus, Search, Folder, ChevronRight, Loader2, 
  Layers, Clock, Hash, Database, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ProjectDirectory() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    objective_summary: "",
    category: "Strategic",
    due_date: ""
  });

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function establishWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.from("projects").insert([form]).select().single();
      if (error) throw error;
      setProjects([data, ...projects]);
      setShowModal(false);
      setForm({ name: "", objective_summary: "", category: "Strategic", due_date: "" });
      toast.success("Workspace Established");
    } finally {
      setSaving(false);
    }
  }

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-12 pb-32 selection:bg-[#a9b897] selection:text-white">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#a9b897]">
              <div className="w-8 h-[1px] bg-[#a9b897]" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black">Strategic Assets</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic text-stone-800 tracking-tighter">Workspaces</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Locate node..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-[10px] font-bold uppercase tracking-widest w-full md:w-64"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="bg-stone-900 hover:bg-[#a9b897] p-5 rounded-2xl text-white transition-all shadow-xl">
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-stone-100 gap-4 opacity-50">
              <Loader2 className="animate-spin text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Synchronizing Archive...</p>
            </div>
          ) : filtered.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="group relative bg-white border border-stone-100 rounded-[2rem] p-6 flex items-center justify-between hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/5 transition-all duration-500">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-stone-50 text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500 flex items-center justify-center border border-stone-100">
                  <Folder size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic text-stone-800">{project.name}</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1 flex items-center gap-2">
                    <Clock size={10} /> {project.category} // {project.due_date || 'Continuous'}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-[#a9b897] group-hover:text-white transition-all">
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-stone-900/20">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl border border-stone-100">
              <h2 className="text-4xl font-serif italic text-stone-800 mb-8">Initialize Node</h2>
              <form onSubmit={establishWorkspace} className="space-y-5">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-serif italic outline-none focus:border-[#a9b897]" placeholder="Workspace Name" />
                <textarea value={form.objective_summary} onChange={(e) => setForm({ ...form, objective_summary: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-serif italic outline-none h-32 resize-none" placeholder="Strategic Intent..." />
                <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#a9b897] transition-all">
                  {saving ? "Establishing..." : "Commit to Archive"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}