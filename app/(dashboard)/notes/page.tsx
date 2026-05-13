"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Search, User, Folder, Loader2, Plus, 
  Settings, Clock, Share2, Maximize2, Archive, Hash, 
  ChevronRight, Filter, Download, Zap, Database, Globe,
  Shield, Lock, MoreVertical, Layers, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | THE VAULT
 * VERSION: 6.0.0
 * ARCHITECTURE: MINIMALIST TACTILE LEDGER
 */

const VAULT_THEMES = [
  { bg: "#FFF9E6", tape: "rgba(0,0,0,0.04)", text: "#451a03", rotation: "-1.2deg" },
  { bg: "#F1F8E9", tape: "rgba(0,0,0,0.04)", text: "#14532d", rotation: "0.8deg" },
  { bg: "#E3F2FD", tape: "rgba(0,0,0,0.04)", text: "#0c4a6e", rotation: "-0.5deg" },
  { bg: "#F5F3FF", tape: "rgba(0,0,0,0.04)", text: "#4c1d95", rotation: "1.5deg" }
];

const VAULT_CATEGORIES = [
  { id: "intel", label: "Intelligence" },
  { id: "strat", label: "Strategy" },
  { id: "creative", label: "Creative" },
  { id: "personal", label: "Personal" }
];

function VaultContent() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interface States
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("intel");
  const [project, setProject] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchVault = useCallback(async (userId: string) => {
    try {
      const [nts, proj] = await Promise.all([
        supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", userId)
      ]);
      setEntries(nts.data || []);
      setProjects(proj.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchVault(authUser.id);
      
      const channel = supabase.channel("vault_live")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchVault(authUser.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchVault]);

  const handleCommit = async () => {
    if (!content.trim() || isSyncing || !user) return;
    setIsSyncing(true);
    const theme = VAULT_THEMES[Math.floor(Math.random() * VAULT_THEMES.length)];

    try {
      await supabase.from("notes").insert([{
        content,
        user_id: user.id,
        color: theme.bg,
        category,
        project_id: project || null
      }]);
      setContent("");
      toast.success("Entry encrypted and vaulted.");
    } catch (e) {
      toast.error("Sync interrupted.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredEntries = useMemo(() => 
    entries.filter(e => e.content.toLowerCase().includes(search.toLowerCase())),
    [entries, search]
  );

  if (isLoading) return <div className="h-screen bg-[#FBFBFA] flex items-center justify-center font-serif italic text-stone-200 text-5xl">Opening Vault...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFA] font-sans text-stone-900 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto grid lg:grid-cols-12 min-h-screen">
        
        {/* LEFT COLUMN: THE LEDGER INDEX */}
        <aside className="lg:col-span-3 border-r border-stone-100 p-12 lg:p-16 space-y-20 bg-white/50 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-300">
               <Shield size={14} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Vault // Ledger_04</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">The <span className="text-stone-200">Vault</span></h1>
          </div>

          <div className="space-y-12">
            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-200 group-focus-within:text-stone-900 transition-colors" size={18} />
              <input 
                className="w-full bg-transparent border-b border-stone-100 py-4 pl-8 outline-none font-serif italic text-xl placeholder:text-stone-100 focus:border-stone-900 transition-all"
                placeholder="Search strings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <nav className="space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Directories</p>
              {VAULT_CATEGORIES.map(cat => (
                <div key={cat.id} className="flex justify-between items-center group cursor-pointer">
                  <span className="font-serif italic text-2xl text-stone-400 group-hover:text-stone-900 transition-colors">{cat.label}</span>
                  <div className="h-6 w-10 rounded-full bg-stone-50 flex items-center justify-center text-[10px] font-bold group-hover:bg-stone-900 group-hover:text-white transition-all">
                    {entries.filter(e => e.category === cat.id).length}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="pt-20 border-t border-stone-50">
             <div className="flex items-center gap-4 text-stone-400">
                <Database size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encryption Active</span>
             </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: THE WORKSPACE */}
        <main className="lg:col-span-9 p-12 lg:p-24 space-y-24">
          
          <header className="flex justify-between items-start">
             <div className="flex items-center gap-8 bg-white border border-stone-100 px-8 py-4 rounded-full shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">System Stable // {entries.length} Nodes</span>
             </div>
             <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-all cursor-pointer"><Settings size={16}/></div>
                <div className="h-12 w-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-all cursor-pointer"><Share2 size={16}/></div>
             </div>
          </header>

          {/* CAPTURE HUB */}
          <section className="relative max-w-4xl">
             <div className="bg-white rounded-[4rem] p-16 shadow-xl border border-stone-50 space-y-12">
                <textarea 
                  className="w-full min-h-[220px] text-4xl font-serif italic outline-none resize-none placeholder:text-stone-50 text-stone-900 leading-tight"
                  placeholder="Record an entry..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-8 pt-10 border-t border-stone-50">
                  <div className="flex gap-4">
                    <select 
                      className="bg-stone-50 border border-stone-100 rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-stone-100 transition-colors"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {VAULT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <select 
                      className="bg-stone-50 border border-stone-100 rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-stone-100 transition-colors"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                    >
                      <option value="">Link Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={handleCommit}
                    className="bg-stone-900 text-white px-14 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                  >
                    {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Establish Entry
                  </button>
                </div>
             </div>
          </section>

          {/* THE TACTILE GRID */}
          <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-16">
             <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, idx) => {
                  const theme = VAULT_THEMES[idx % VAULT_THEMES.length];
                  return (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: theme.rotation }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.05, rotate: "0deg", zIndex: 10 }}
                      className="p-12 min-h-[360px] flex flex-col shadow-post-it relative group transition-all duration-300"
                      style={{ background: entry.color || theme.bg }}
                    >
                      {/* TAPE OVERLAY */}
                      <div className="absolute top-[-18px] left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-sm border border-white/20 rotate-[-2deg] z-20 shadow-sm" />
                      
                      <div className="flex-1 space-y-8">
                        <div className="flex justify-between items-center opacity-10">
                          <Hash size={12} />
                          <span className="text-[8px] font-mono tracking-tighter">NODE_{entry.id.slice(0,6)}</span>
                        </div>
                        <p className="text-3xl font-serif italic leading-[1.3] text-stone-800">{entry.content}</p>
                      </div>

                      <div className="mt-12 pt-8 border-t border-black/5 flex justify-between items-end">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase opacity-20">{new Date(entry.created_at).toLocaleDateString('en-GB')}</p>
                           <div className="px-3 py-1 bg-black/5 rounded text-[8px] font-black uppercase tracking-tighter inline-block">{entry.category}</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => supabase.from("notes").delete().eq("id", entry.id).then(() => fetchVault(user.id))}
                            className="h-12 w-12 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-black/10 group-hover:text-black/30 shadow-inner bg-black/5"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
             </AnimatePresence>
          </section>
        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .shadow-post-it {
          box-shadow: 
            5px 5px 15px rgba(0,0,0,0.02),
            12px 12px 35px rgba(0,0,0,0.04),
            inset 0px -10px 25px rgba(0,0,0,0.01);
        }
      `}</style>
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<div />}>
      <VaultContent />
    </Suspense>
  );
}