"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Search, User, X, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CRMDirectory() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role: "user",
    avatar_url: ""
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });
    
    if (!error && data) setProfiles(data);
    setLoading(false);
  }

  async function addProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .insert([form])
      .select()
      .single();

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setProfiles((prev) => [data, ...prev]);
    setForm({ name: "", role: "user", avatar_url: "" });
    setShowModal(false);
    setSaving(false);
  }

  const filtered = profiles.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#a9b897]">
              <div className="w-8 h-[1px] bg-[#a9b897]" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black">Infrastructure</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Directory</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-xs w-full md:w-64"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-stone-900 hover:bg-[#a9b897] p-5 rounded-2xl text-white transition-all shadow-xl active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* DIRECTORY LIST */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-stone-100 gap-4">
              <Loader2 className="animate-spin text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Fetching Data...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((profile) => (
              <Link 
                href={`/crm/${profile.id}`} 
                key={profile.id}
                className="group relative bg-white border border-stone-100 rounded-[2rem] p-6 flex items-center justify-between hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/10 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 text-stone-400 group-hover:bg-[#a9b897] group-hover:text-white transition-all duration-500 flex items-center justify-center shrink-0 border border-stone-100">
                    <User size={24} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-stone-800 group-hover:text-[#a9b897] transition-colors">{profile.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">UUID: {profile.id.slice(0, 8)}</span>
                      <div className="w-1 h-1 rounded-full bg-stone-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-2 py-0.5 rounded">
                        {profile.role || 'user'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">View Profile</span>
                  <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-[3rem]">
              <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">Zero Records Found</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SECTION */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative z-10 bg-white rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-12 w-full max-w-xl shadow-2xl border border-stone-100"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-serif italic">New Profile</h2>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-stone-50 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={addProfile} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Full Identity</label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all" 
                    placeholder="Enter name..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">System Role</label>
                  <select 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })} 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm outline-none appearance-none cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="client">Client Node</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full bg-stone-900 text-white py-6 rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#a9b897] disabled:opacity-40 transition-all mt-4"
                >
                  {saving ? "Ingesting..." : "Create Profile"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}