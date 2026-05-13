"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Search, Loader2, Plus, X, 
  CheckCircle2, Tag, Clock, AlertCircle, StickyNote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | THE VAULT V8
 * DESIGN: PHYSICAL STICKY NOTE DESK
 */

const STICKY_THEMES = [
  { bg: "#FFF9E6", text: "#451a03", rotation: "-1.5deg" },
  { bg: "#F1F8E9", text: "#14532d", rotation: "1.2deg" },
  { bg: "#E3F2FD", text: "#0c4a6e", rotation: "-0.8deg" },
  { bg: "#F5F3FF", text: "#4c1d95", rotation: "2deg" },
  { bg: "#FFF0F0", text: "#7f1d1d", rotation: "-2deg" }
];

function VaultContent() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Input States
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchNotes = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (e) {
      console.error("Vault Fetch Error:", e);
      toast.error("Could not load the vault.");
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
      
      // Real-time subscription to keep the desk updated
      const channel = supabase.channel("vault_desk")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes(authUser.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!content.trim() || !user) return;
    setIsSyncing(true);
    
    const theme = STICKY_THEMES[Math.floor(Math.random() * STICKY_THEMES.length)];

    try {
      const { error } = await supabase.from("notes").insert([{
        content,
        user_id: user.id,
        color: isUrgent ? "#1C1917" : theme.bg,
        category: tag || "General",
        is_urgent: isUrgent,
        metadata: { rotation: theme.rotation }
      }]);

      if (error) throw error;
      
      setContent("");
      setTag("");
      setIsUrgent(false);
      setShowModal(false);
      toast.success("Note pinned to desk.");
      fetchNotes(user.id);
    } catch (e) {
      toast.error("Failed to pin note.");
    } finally {
      setIsSyncing(false);
    }
  };

  const completeNote = async (id: string) => {
    // We'll delete for 'completion' in this version, or you can update a status column
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Task cleared.");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.content?.toLowerCase().includes(search.toLowerCase()) || 
    n.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-screen bg-[#F5F5F3] flex items-center justify-center font-serif italic text-stone-300 text-4xl">Loading Desk...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans text-stone-900 pb-40 relative">
      
      {/* PERSISTENT NAV */}
      <header className="max-w-[1400px] mx-auto p-12 flex justify-between items-end">
        <div>
          <h1 className="text-8xl font-serif italic tracking-tighter lowercase leading-none">Vault</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mt-4 ml-1">Physical Desktop Ledger</p>
        </div>
        <div className="relative group w-64">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-200" size={18} />
          <input 
            className="w-full bg-transparent border-b border-stone-200 py-2 pl-8 outline-none font-serif italic text-xl focus:border-stone-900 transition-all"
            placeholder="Search the desk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* THE DESK GRID */}
      <main className="max-w-[1600px] mx-auto px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note) => (
            <motion.div 
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: note.metadata?.rotation || "0deg" }}
              exit={{ opacity: 0, scale: 0.5, rotate: "10deg" }}
              whileHover={{ scale: 1.05, rotate: "0deg", zIndex: 50 }}
              className={`p-10 min-h-[300px] flex flex-col shadow-sticky relative group transition-all duration-300 ${
                note.is_urgent ? 'text-white' : 'text-stone-800'
              }`}
              style={{ background: note.color || "#FFF9E6" }}
            >
              {/* VISUAL TAPE */}
              <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-32 h-8 bg-white/20 backdrop-blur-sm border border-white/10 z-20" />
              
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">
                    {note.category || 'General'}
                  </span>
                  {note.is_urgent && <AlertCircle size={14} className="text-red-400" />}
                </div>
                <p className="text-2xl font-serif italic leading-tight">{note.content}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center">
                <button 
                  onClick={() => completeNote(note.id)}
                  className="flex items-center gap-2 group/btn"
                >
                  <CheckCircle2 size={24} className="text-black/10 group-hover/btn:text-green-500 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-40 transition-opacity">Complete</span>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => completeNote(note.id)} className="h-10 w-10 rounded-full hover:bg-black/5 flex items-center justify-center opacity-20 hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-12 right-12 h-20 w-20 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100]"
      >
        <Plus size={32} />
      </button>

      {/* NEW NOTE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative z-10 space-y-10"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-serif italic lowercase">New Entry</h3>
                <button onClick={() => setShowModal(false)} className="text-stone-300 hover:text-stone-900"><X size={24}/></button>
              </div>

              <textarea 
                autoFocus
                className="w-full min-h-[150px] text-3xl font-serif italic outline-none resize-none placeholder:text-stone-100"
                placeholder="Write it down..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center gap-4 pt-8 border-t border-stone-50">
                <div className="flex items-center bg-stone-50 rounded-full px-6 py-2 border border-stone-100 flex-1">
                  <Tag size={14} className="text-stone-300 mr-3" />
                  <input 
                    className="bg-transparent text-[10px] font-black uppercase outline-none w-full"
                    placeholder="TAG (E.G. PROJECT)"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isUrgent ? 'bg-red-50 border-red-100 text-red-600' : 'bg-stone-50 border-stone-100 text-stone-300'
                  }`}
                >
                  Urgent
                </button>
              </div>

              <button 
                onClick={handleCreate}
                disabled={isSyncing}
                className="w-full bg-stone-900 text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.5em] shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-4"
              >
                {isSyncing ? <Loader2 size={18} className="animate-spin" /> : "Pin to Desk"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .shadow-sticky {
          box-shadow: 
            2px 2px 10px rgba(0,0,0,0.02),
            10px 10px 25px rgba(0,0,0,0.05),
            inset 0px -8px 20px rgba(0,0,0,0.01);
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