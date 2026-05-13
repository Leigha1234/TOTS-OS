"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Search, Loader2, Plus, Settings, 
  Hash, Lock, Zap, AlertCircle, Tag, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | THE VAULT (V7)
 * FOCUS: CLEAN CAPTURE + PHYSICAL POST-ITS
 */

const PAPER_THEMES = [
  { bg: "#FFF9E6", text: "#451a03", rotation: "-1.2deg" }, // Canary
  { bg: "#F1F8E9", text: "#14532d", rotation: "0.8deg" },  // Mint
  { bg: "#E3F2FD", text: "#0c4a6e", rotation: "-0.5deg" }, // Sky
  { bg: "#F5F3FF", text: "#4c1d95", rotation: "1.1deg" }   // Lavender
];

function VaultContent() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Capture States
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchNotes = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setNotes(data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchNotes(authUser.id);
      
      const channel = supabase.channel("vault_live")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes(authUser.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchNotes]);

  const handleSave = async () => {
    if (!content.trim() || isSyncing || !user) return;
    setIsSyncing(true);
    
    const theme = PAPER_THEMES[Math.floor(Math.random() * PAPER_THEMES.length)];

    try {
      await supabase.from("notes").insert([{
        content,
        user_id: user.id,
        color: isUrgent ? "#1C1917" : theme.bg, // Dark if urgent
        category: tag || "General",
        is_urgent: isUrgent,
        metadata: { rotation: theme.rotation }
      }]);
      setContent("");
      setTag("");
      setIsUrgent(false);
      toast.success("Pinned to Vault");
    } catch (e) {
      toast.error("Failed to sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredNotes = useMemo(() => 
    notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase())),
    [notes, search]
  );

  if (isLoading) return <div className="h-screen bg-[#FBFBFA] flex items-center justify-center font-serif italic text-stone-200 text-5xl">Opening Vault...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFA] font-sans text-stone-900 pb-40">
      
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto px-8 pt-20 pb-16 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 text-stone-300 mb-4">
            <Lock size={14} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Secure Ledger</p>
          </div>
          <h1 className="text-8xl font-serif italic tracking-tighter leading-none">Vault</h1>
        </div>
        
        <div className="relative group w-72">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-200" size={18} />
          <input 
            className="w-full bg-transparent border-b border-stone-100 py-3 pl-8 outline-none font-serif italic text-xl placeholder:text-stone-100 focus:border-stone-900 transition-all"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CAPTURE HUB */}
      <section className="max-w-6xl mx-auto px-8 mb-32">
        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-stone-50 space-y-10">
          <textarea 
            className="w-full min-h-[180px] text-4xl font-serif italic outline-none resize-none placeholder:text-stone-50 text-stone-900 leading-tight bg-transparent"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-stone-50">
            <div className="flex items-center gap-6">
              {/* TAG INPUT */}
              <div className="flex items-center bg-stone-50 rounded-full px-6 py-2 border border-stone-100">
                <Tag size={14} className="text-stone-300 mr-3" />
                <input 
                  className="bg-transparent text-[10px] font-black uppercase outline-none w-24 placeholder:text-stone-200"
                  placeholder="ADD TAG"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>

              {/* URGENT TOGGLE */}
              <button 
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${
                  isUrgent ? 'bg-red-50 border-red-100 text-red-600' : 'bg-stone-50 border-stone-100 text-stone-300'
                }`}
              >
                <Zap size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Mark Urgent</span>
              </button>
            </div>

            <button 
              onClick={handleSave}
              className="bg-stone-900 text-white px-12 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Pin Note
            </button>
          </div>
        </div>
      </section>

      {/* DISPLAY GRID */}
      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note) => (
            <motion.div 
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: note.metadata?.rotation || "0deg" 
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ scale: 1.05, rotate: "0deg", zIndex: 10 }}
              className={`p-10 min-h-[320px] flex flex-col shadow-post-it relative group transition-all duration-300 ${
                note.is_urgent ? 'text-white' : 'text-stone-800'
              }`}
              style={{ background: note.color || "#FFF9E6" }}
            >
              {/* TACTILE TAPE */}
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-28 h-8 bg-white/30 backdrop-blur-sm border border-white/20 rotate-[-1deg] z-20" />
              
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center opacity-30">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {note.category || 'General'}
                  </span>
                  {note.is_urgent && <AlertCircle size={14} className="text-red-400" />}
                </div>
                <p className="text-2xl font-serif italic leading-snug">{note.content}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-end">
                <div className="flex items-center gap-2 opacity-30">
                   <Clock size={10} />
                   <span className="text-[8px] font-black uppercase">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => supabase.from("notes").delete().eq("id", note.id).then(() => fetchNotes(user.id))}
                  className="h-10 w-10 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-black/10 group-hover:text-black/30 bg-black/5"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
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