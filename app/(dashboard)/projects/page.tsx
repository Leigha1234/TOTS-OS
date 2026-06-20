"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, Search, Folder, ChevronRight, Loader2, 
  Layers, Clock, Hash, Database, ArrowUpRight,
  Users, Calendar, AlignLeft, Banknote, X
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
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    objective_summary: "",
    description: "",
    category: "Strategic",
    members: "",
    start_date: "",
    due_date: "",
    budget: "",
    health: "good"
  });

  useEffect(() => {
    if (organisationId) {
      loadProjects();
    }
  }, [organisationId]);

  useEffect(() => {
    const loadOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Org load error (profiles query failed):", error);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.warn("No profile found for user:", user.id);
        toast.error("User profile not found");
        setLoading(false);
        return;
      }

      if (!profile || !profile.organisation_id) {
        console.warn("No organisation_id found on profile");
        toast.error("No organisation assigned to account");
        setLoading(false);
        return;
      }

      setOrganisationId(profile.organisation_id);
      setLoading(false);
    };

    loadOrg();
  }, []);

  async function loadProjects() {
    try {
      if (!organisationId) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
console.log("AUTH USER:", user?.id);

      if (!user?.id) {
        toast.error("Not authenticated");
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("organisation_id", organisationId)
.eq("user_id", user.id);

      if (error) {
  console.error("Load projects error:", error);
  toast.error("Failed to load projects");
  return;
}
      setProjects(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function establishProject(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);

  try {
    if (!form.name?.trim()) {
      toast.error("Project name required");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      console.error("Auth error:", userError);
      toast.error("Not authenticated");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      toast.error("Failed to load profile");
      return;
    }

    if (!profile?.organisation_id) {
      console.error("Missing organisation_id");
      toast.error("No organisation linked to account");
      return;
    }

    const orgId = profile.organisation_id;

    const payload = {
      name: form.name.trim(),
      objective_summary: form.objective_summary || null,
      description: form.description || null,
      category: form.category,
      status: "live",
      priority: "Medium",
      health: "good",

      members: Array.isArray(form.members)
        ? form.members
        : typeof form.members === "string" && form.members.trim().length > 0
        ? form.members.split(",").map((m) => m.trim()).filter(Boolean)
        : [],

      start_date: form.start_date || null,
      due_date: form.due_date || null,

      budget:
        form.budget !== "" && !isNaN(Number(form.budget))
          ? Number(form.budget)
          : 0,

      organisation_id: orgId,
      user_id: user.id,
    };

    console.log("INSERT PAYLOAD:", payload);

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert(payload)
      .select("*");

    if (insertError) {
      console.error("Supabase insert error FULL:", insertError);
      console.error("Supabase insert error context:", {
        payload,
        organisationId: orgId,
        userId: user.id,
      });

      toast.error(insertError.message || "Failed to create project");
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Supabase insert returned no rows", {
        payload,
        response: data,
      });
      toast.error("Project created but no response row returned");
      return;
    }

    const inserted = data[0];
    setProjects((prev) => [inserted, ...prev]);
    setShowModal(false);

    setForm({
      name: "",
      objective_summary: "",
      description: "",
      category: "Strategic",
      members: "",
      start_date: "",
      due_date: "",
      budget: "",
      health: "good",
    });

    toast.success("Project Created");
  } catch (err: any) {
    console.error("Unexpected error:", err);
    toast.error(err?.message || "Unexpected error creating project");
  } finally {
    setSaving(false);
  }
}

  const filtered = projects.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-12 pb-32 selection:bg-[#a9b897] selection:text-white">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6">
            <div className="flex items-center gap-2 text-[#a9b897]">
              
            <h1 className="text-6xl md:text-8xl font-serif italic text-stone-800 tracking-tighter">Projects</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Locate project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-[10px] font-bold uppercase tracking-widest w-full md:w-64"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="bg-stone-900 hover:bg-[#a9b897] p-5 rounded-2xl text-white transition-all shadow-xl active:scale-95">
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-stone-100 gap-4 opacity-50">
              <Loader2 className="animate-spin text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300"> Sync Archive...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="group relative bg-white border border-stone-100 rounded-[2rem] p-6 flex items-center justify-between hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/5 transition-all duration-500">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500 flex items-center justify-center border border-stone-100">
                    <Folder size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-stone-800">{project.name}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1 flex items-center gap-2">
                      <Clock size={10} /> {project.category} // {project.due_date || 'Ongoing'}
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-[#a9b897] group-hover:text-white transition-all">
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-24 bg-white border border-dashed border-stone-200 rounded-[3rem]">
              <Database size={32} className="mx-auto text-stone-100 mb-4" />
              <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">No Active Projects</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-2xl shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <div className="flex justify-between items-start mb-10">
                <div>
                    <h2 className="text-4xl font-serif italic text-stone-800">New Project</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-stone-50 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={establishProject} className="space-y-6">
                {/* IDENTITY & CATEGORY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Project</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm font-serif italic outline-none focus:border-[#a9b897]" placeholder="Project Name" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Classification</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-[10px] font-bold uppercase tracking-widest outline-none appearance-none">
                            <option value="Strategic">Strategic</option>
                            <option value="Operational">Operational</option>
                            <option value="Creative">Creative</option>
                            <option value="Internal">Internal</option>
                        </select>
                    </div>
                </div>

                {/* PERSONNEL & BUDGET */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Personnel Allocation</label>
                        <div className="relative">
                            <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="Comma-separated names..." />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Resource Budget</label>
                        <div className="relative">
                            <Banknote size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="£ / Currency" />
                        </div>
                    </div>
                </div>

                {/* DATES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Start Date</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-[10px] font-bold outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Deadline</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-[10px] font-bold outline-none" />
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Objective (Brief)</label>
                    <input value={form.objective_summary} onChange={(e) => setForm({ ...form, objective_summary: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs font-serif italic outline-none focus:border-[#a9b897]" placeholder="One sentence intent..." />
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Description</label>
                    <div className="relative">
                        <AlignLeft size={14} className="absolute left-4 top-5 text-stone-300" />
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897] h-32 resize-none leading-relaxed" placeholder="Detailed scope and documentation requirements..." />
                    </div>
                </div>

                <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#a9b897] disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-3">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Project"}
                </button>
              </form>
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