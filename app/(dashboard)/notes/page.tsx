"use client";

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Zap, Circle, BookOpen, X, Target, Search,
  Mic, MicOff, User, Folder, Loader2, Plus, CheckCircle2, 
  AlertCircle, ChevronRight, Settings, Filter, Layers, 
  Clock, Share2, MoreHorizontal, Maximize2, Archive,
  Hash, Shield, Cpu, Activity, Globe, Command // Added missing Hash import
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | CLARITY LEDGER ARCHITECTURE
 * VERSION: 4.2.0 (Build: 2026.05)
 * MAINTAINER: TOTS_DEV_UNIT
 */

// --- CONFIGURATION & THEMES ---

const POST_IT_PALETTE = [
  { bg: "#fef3c7", border: "#fde68a", accent: "#92400e", rotation: "-1.2deg" }, 
  { bg: "#e0f2fe", border: "#bae6fd", accent: "#075985", rotation: "0.8deg" },  
  { bg: "#ecfccb", border: "#d9f99d", accent: "#3f6212", rotation: "-0.5deg" }, 
  { bg: "#fce7f3", border: "#fbcfe8", accent: "#9d174d", rotation: "1.5deg" },  
  { bg: "#ede9fe", border: "#ddd6fe", accent: "#5b21b6", rotation: "-1deg" }
];

const SYSTEM_CATEGORIES = [
  { id: "note", label: "General Intelligence", color: "stone" },
  { id: "task", label: "Action Required", color: "blue" },
  { id: "brainstorm", label: "Creative Logic", color: "purple" },
  { id: "urgent", label: "Immediate Priority", color: "red" },
  { id: "archive", label: "Historical Data", color: "amber" }
];

// --- INTERFACE COMPONENTS ---

function SystemStatus() {
  return (
    <div className="flex items-center gap-6 px-8 py-3 bg-stone-900 rounded-full border border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Core_Online</span>
      </div>
      <div className="h-3 w-[1px] bg-white/10" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Lat: 22ms</span>
    </div>
  );
}

function LedgerHeader({ searchTerm, setSearchTerm }: { searchTerm: string, setSearchTerm: (v: string) => void }) {
  return (
    <header className="space-y-12 mb-16">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <Cpu size={14} className="text-[#A3B18A]" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Environment // Ledger_04</p>
          </div>
          <h1 className="text-9xl font-serif italic text-stone-900 tracking-tighter lowercase leading-[0.8]">
            Clarity <span className="text-stone-300">Hub</span>
          </h1>
        </div>
        <SystemStatus />
      </div>

      <div className="relative group max-w-3xl">
        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
          <Search className="text-stone-200 group-focus-within:text-stone-900 transition-colors" size={26} />
        </div>
        <input 
          type="text" 
          placeholder="Filter ledger strings..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-24 pr-12 py-9 bg-white/60 backdrop-blur-xl border border-stone-100 rounded-[3rem] outline-none shadow-sm font-serif italic text-2xl focus:bg-white focus:ring-8 ring-stone-900/[0.02] transition-all"
        />
      </div>
    </header>
  );
}

// --- PRIMARY APPLICATION LOGIC ---

function NotesContent() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interface States
  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("note");
  const [selectedProject, setSelectedProject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const fetchPulse = useCallback(async (userId: string) => {
    try {
      const [nts, tsk, proj] = await Promise.all([
        supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").eq("user_id", userId).eq("status", "todo").order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", userId)
      ]);

      setNotes(nts.data || []);
      setTasks(tsk.data || []);
      setProjects(proj.data || []);
    } catch (e) {
      console.error("Ledger Sync Failure", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchPulse(authUser.id);

      const channel = supabase.channel("ledger-v4-realtime")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchPulse(authUser.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchPulse(authUser.id))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchPulse]);

  const addNote = async () => {
    if (!newNote.trim() || isSubmitting || !user) return;
    setIsSubmitting(true);
    const style = POST_IT_PALETTE[Math.floor(Math.random() * POST_IT_PALETTE.length)];

    try {
      const { error: noteErr } = await supabase.from("notes").insert([{
        content: newNote,
        user_id: user.id,
        color: style.bg,
        category: selectedCategory,
        project_id: selectedProject || null,
        metadata: { source: "web_v4", client: "tots_os" }
      }]);

      if (noteErr) throw noteErr;

      await supabase.from("tasks").insert([{
        title: newNote,
        user_id: user.id,
        status: "todo",
        priority: 2
      }]);

      setNewNote("");
      toast.success("Intelligence Logged Successfully.");
      fetchPulse(user.id);
    } catch (e) {
      toast.error("Internal Logic Error: Check Database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchPulse(user.id);
  };

  const filteredNotes = useMemo(() => 
    notes.filter(n => (n.content || "").toLowerCase().includes(searchTerm.toLowerCase())),
    [notes, searchTerm]
  );

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] gap-10">
      <div className="w-32 h-1 bg-stone-200 overflow-hidden rounded-full">
        <motion.div 
          className="h-full bg-stone-900" 
          animate={{ x: [-100, 100] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} 
        />
      </div>
      <p className="font-serif italic text-stone-400 text-3xl">Calibrating Ledger Views...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-10 md:p-20 font-sans selection:bg-stone-900 selection:text-[#A3B18A]">
      <div className="max-w-[1800px] mx-auto grid lg:grid-cols-12 gap-16">
        
        {/* SECTION 01: CAPTURE & STICKY GRID */}
        <div className="lg:col-span-8 space-y-20">
          <LedgerHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* THE CAPTURE DOCK */}
          <section className="bg-white p-14 rounded-[4.5rem] shadow-3xl border border-stone-50 space-y-12 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] rotate-12">
              <Command size={280} />
            </div>
            
            <textarea 
              className="w-full min-h-[280px] text-4xl outline-none resize-none bg-transparent font-serif italic text-stone-900 placeholder:text-stone-200 leading-[1.4] relative z-10" 
              placeholder="What's the play?" 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            
            <div className="flex flex-wrap items-center gap-8 pt-12 border-t border-stone-50 justify-between relative z-10">
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center bg-stone-50 rounded-[2.5rem] px-10 border border-stone-100 transition-colors focus-within:bg-stone-100">
                  <Hash size={16} className="text-stone-300 mr-5" />
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase outline-none text-stone-500 py-6 cursor-pointer appearance-none min-w-[160px]" 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {SYSTEM_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-[2.5rem] px-10 border border-stone-100 transition-colors focus-within:bg-stone-100">
                  <Folder size={16} className="text-stone-300 mr-5" />
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase outline-none text-stone-500 py-6 cursor-pointer appearance-none min-w-[160px]" 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="">No Project Link</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={addNote} 
                disabled={isSubmitting} 
                className="bg-stone-900 text-[#A3B18A] px-20 py-7 rounded-[3rem] font-black uppercase text-[11px] tracking-[0.5em] shadow-4xl hover:-translate-y-2 hover:shadow-stone-900/40 active:translate-y-0 transition-all flex items-center gap-6"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} Establish Entry
              </button>
            </div>
          </section>

          {/* THE STICKY LEDGER MAPPING */}
          <section className="grid md:grid-cols-2 gap-16 pt-10">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, idx) => {
                const rotation = (idx % 3 === 0) ? "-1.8deg" : (idx % 2 === 0) ? "1.4deg" : "-1.1deg";
                return (
                  <motion.div 
                    layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                    key={note.id} 
                    className="p-16 min-h-[420px] flex flex-col justify-between shadow-post-it relative group hover:z-30 transition-all duration-700"
                    style={{ 
                      background: note.color || "#fef3c7", 
                      transform: `rotate(${rotation})`,
                    }}
                  >
                    {/* The Tape Aesthetic */}
                    <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-40 h-12 bg-white/40 backdrop-blur-md border border-white/30 rotate-[-1.5deg] shadow-sm" />
                    
                    <div className="space-y-10">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic font-mono">TOTS_{note.id.slice(0, 6)}</span>
                        </div>
                        <div className="flex gap-4 opacity-0 group-hover:opacity-30 transition-opacity">
                            <Maximize2 size={18} className="cursor-pointer" />
                            <MoreHorizontal size={18} className="cursor-pointer" />
                        </div>
                      </div>
                      <p className="text-stone-900 font-serif italic text-4xl pr-8 leading-[1.25] tracking-tight">{note.content}</p>
                    </div>

                    <div className="flex justify-between items-end mt-20 pt-10 border-t border-black/10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 px-5 py-2.5 bg-black/5 rounded-full w-fit">
                          <Clock size={14} className="opacity-40" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">
                            {new Date(note.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <Shield size={10} className="text-black/20" />
                           <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">{note.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 translate-y-3">
                        <button className="p-5 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/10">
                          <Archive size={20} className="text-stone-600" />
                        </button>
                        <button 
                          onClick={() => deleteNote(note.id)} 
                          className="p-5 bg-black/5 hover:bg-red-600 hover:text-white rounded-3xl transition-all opacity-0 group-hover:opacity-100 shadow-xl shadow-transparent hover:shadow-red-500/20"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </section>
        </div>

        {/* SECTION 02: SYSTEM PIPELINE & TERMINAL */}
        <aside className="lg:col-span-4 space-y-12">
          <div className="bg-stone-900 rounded-[5rem] p-14 text-[#A3B18A] shadow-5xl sticky top-14 min-h-[88vh] flex flex-col border border-white/5">
            <div className="mb-16 flex justify-between items-center">
              <div className="space-y-5">
                <h2 className="text-6xl font-serif italic leading-none text-white">Action <span className="text-[#A3B18A]">Queue</span></h2>
                <div className="flex items-center gap-4">
                  <Activity size={14} className="animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">System_Health // Stable</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                <Target size={36} />
              </div>
            </div>

            {/* QUEUE ENGINE */}
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-14 pr-3">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div 
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                    key={task.id} 
                    className="bg-white/5 p-10 rounded-[3.5rem] border border-white/10 flex items-start gap-8 hover:bg-white/10 transition-all group relative overflow-hidden"
                  >
                    <button 
                      onClick={() => supabase.from('tasks').update({status:'done'}).eq('id',task.id).then(()=>fetchPulse(user.id))} 
                      className="mt-1 text-white/10 hover:text-[#A3B18A] transition-all transform hover:scale-125"
                    >
                      <Circle size={32} strokeWidth={1} />
                    </button>
                    <div className="space-y-4 flex-1">
                      <p className="text-base font-bold text-white/90 leading-relaxed group-hover:text-white transition-colors">{task.title}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]/60">Priority_0{task.priority || 2}</span>
                        </div>
                        <Globe size={10} className="opacity-20" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="text-center py-40 opacity-10 space-y-10">
                  <CheckCircle2 size={80} className="mx-auto" />
                  <p className="text-[14px] font-black uppercase tracking-[0.8em]">Queue_Clear</p>
                </div>
              )}
            </div>

            {/* TERMINAL UI */}
            <div className="mt-auto space-y-8">
               <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 font-mono text-[9px] leading-loose text-white/30">
                  <div className="flex justify-between mb-4 border-b border-white/5 pb-2">
                     <span className="text-[#A3B18A]/40 uppercase tracking-widest">System_Logs</span>
                     <span>v4.2.0</span>
                  </div>
                  <p className="flex gap-3"><span className="text-[#A3B18A]">[OK]</span> DB_Handshake established...</p>
                  <p className="flex gap-3"><span className="text-[#A3B18A]">[OK]</span> Realtime_Channel listening on :public</p>
                  <p className="flex gap-3"><span className="text-[#A3B18A]">[OK]</span> Asset_Ledger synced ({notes.length} nodes)</p>
               </div>

               <div className="flex justify-between items-center px-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-stone-900 bg-stone-800 flex items-center justify-center shadow-2xl">
                        <User size={16} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Sync_Frequency</p>
                    <p className="text-2xl font-serif italic text-white">Live</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-12 bg-white rounded-[4rem] border border-stone-100 shadow-sm space-y-10 relative overflow-hidden">
             <div className="flex items-center gap-5 text-stone-900">
                <AlertCircle size={24} className="text-[#A3B18A]" />
                <h3 className="text-xl font-serif italic">Ledger Protocol</h3>
             </div>
             <p className="text-base font-serif italic text-stone-500 leading-relaxed">
                Entries are globally unique and indexed for search speed. The Action Queue mirrors the Ledger for zero-lag productivity.
             </p>
             <div className="h-[1px] w-full bg-stone-50" />
             <button className="w-full py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all">
                Export Data Repository
             </button>
          </div>
        </aside>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&display=swap');
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .shadow-post-it {
          box-shadow: 
            8px 8px 25px rgba(0,0,0,0.02),
            20px 20px 60px rgba(0,0,0,0.05),
            inset 0px -15px 40px rgba(0,0,0,0.03);
        }

        .shadow-4xl { box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.3); }
        .shadow-5xl { box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.5); }

        textarea::placeholder { opacity: 0.15; }
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}</style>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif italic text-stone-300 text-5xl">Initializing Hub...</div>}>
      <NotesContent />
    </Suspense>
  );
}