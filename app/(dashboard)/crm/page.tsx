"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Search, User, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const MAILING_LIST_OPTIONS = [
  "General Newsletter",
  "Product Updates",
  "Enterprise Announcements",
  "Weekly Digest"
];

export default function CRMDirectory() {
  // Changed state to reflect 'profiles' table data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addToMailingList, setAddToMailingList] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    role: "user", // Default role per your DB schema
    avatar_url: ""
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    // POINTING TO 'profiles' TABLE
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });
    
    if (!error && data) {
      setProfiles(data);
    } else {
      console.error("Fetch error:", error);
    }
    setLoading(false);
  }

  async function addProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      name: form.name,
      role: form.role,
      avatar_url: form.avatar_url,
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert([payload])
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

  const filtered = profiles.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 pb-32 md:pb-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-10 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#a9b897] font-black">
              Neural Network
            </p>
            <h1 className="text-4xl md:text-6xl font-serif italic text-stone-800 tracking-tighter lowercase">Client Directory</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Search database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-3 md:py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-sm"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-stone-900 hover:bg-stone-800 p-4 md:p-5 rounded-2xl text-white transition-all shadow-xl"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* PROFILE LIST */}
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-stone-100 gap-4">
              <Loader2 className="animate-spin text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Synchronizing Nodes...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((profile) => (
              <div 
                key={profile.id}
                className="bg-white border border-stone-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-stone-50 text-stone-400 group-hover:bg-[#a9b897] group-hover:text-white transition-colors flex items-center justify-center shrink-0 border border-stone-100">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-stone-800">{profile.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-400 rounded text-[8px] font-black uppercase tracking-widest">
                        {profile.role || 'user'}
                      </span>
                      <span className="text-[10px] text-stone-300 font-mono">{profile.id.slice(0,8)}</span>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={`/crm/${profile.id}`}
                  className="p-4 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-stone-50 transition-all"
                >
                  <Check size={18} className="text-[#a9b897]" />
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-[3rem]">
              <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">Directory Empty</p>
              <p className="text-stone-500 text-sm mt-2 italic font-serif">Run a Data Migration to populate this module.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative z-10 bg-white rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 w-full max-w-xl shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif italic">New Directory Entry</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-50 rounded-full"><X size={20} /></button>
              </div>

              <form onSubmit={addProfile} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Identity Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#a9b897]/20" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Access Level</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-stone-800 disabled:opacity-40 shadow-xl transition-all">
                  {saving ? "Processing..." : "Commit Profile"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}