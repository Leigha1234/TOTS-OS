"use client";

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Zap, Circle, BookOpen, X, Target, Search,
  Mic, MicOff, User, Folder, Loader2, Plus, CheckCircle2, 
  AlertCircle, ChevronRight, Settings, Filter, Layers, 
  Clock, Share2, MoreHorizontal, Maximize2, Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | POST-IT LEDGER & ACTION QUEUE V4.0
 * ARCHITECTURE: MONOLITHIC STUDIO VIEW
 * OPTIMIZED FOR: MACBOOK 13" | 2026 REVISION
 */

// --- CONSTANTS & TYPES ---

const POST_IT_PALETTE = [
  { bg: "#fef3c7", border: "#fde68a", accent: "#92400e", rotation: "-1.2deg" }, // Amber
  { bg: "#e0f2fe", border: "#bae6fd", accent: "#075985", rotation: "0.8deg" },  // Sky
  { bg: "#ecfccb", border: "#d9f99d", accent: "#3f6212", rotation: "-0.5deg" }, // Lime
  { bg: "#fce7f3", border: "#fbcfe8", accent: "#9d174d", rotation: "1.5deg" },  // Pink
  { bg: "#ede9fe", border: "#ddd6fe", accent: "#5b21b6", rotation: "-1deg" },   // Violet
  { bg: "#ffedd5", border: "#fed7aa", accent: "#9a3412", rotation: "0.6deg" }   // Orange
];

const CATEGORIES = [
  { id: "note", label: "General Intelligence", color: "stone" },
  { id: "task", label: "Action Required", color: "blue" },
  { id: "brainstorm", label: "Creative Logic", color: "purple" },
  { id: "urgent", label: "Immediate Priority", color: "red" }
];

// --- SUB-COMPONENTS ---

function LedgerHeader({ searchTerm, setSearchTerm }: { searchTerm: string, setSearchTerm: (v: string) => void }) {
  return (
    <header className="space-y-10 mb-16">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-400">System Environment</p>
          <h1 className="text-8xl font-serif italic text-stone-800 tracking-tighter lowercase">
            Clarity <span className="text-stone-300">Hub</span>
          </h1>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="h-12 w-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all cursor-pointer">
            <Settings size={18} />
          </div>
          <div className="h-12 w-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all cursor-pointer">
            <Share2 size={18} />
          </div>
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
          <Search className="text-stone-300 group-focus-within:text-stone-900 transition-colors" size={24} />
        </div>
        <input 
          type="text" 
          placeholder="Filter your thoughts..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-20 pr-10 py-7 bg-white/40 backdrop-blur-md border border-stone-100 rounded-[2.5rem] outline-none shadow-sm font-serif italic text-xl focus:bg-white focus:ring-4 ring-stone-900/5 transition-all"
        />
      </div>
    </header>
  );
}

// --- MAIN ENGINE ---

function NotesContent() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("note");
  const [selectedProject, setSelectedProject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Sync Logic
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
      console.error("Critical Sync Failure", e);
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

      const channel = supabase.channel("ledger-v4-sync")
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
    
    // Pick random aesthetic
    const style = POST_IT_PALETTE[Math.floor(Math.random() * POST_IT_PALETTE.length)];

    try {
      const { error: noteErr } = await supabase.from("notes").insert([{
        content: newNote,
        user_id: user.id,
        color: style.bg,
        category: selectedCategory,
        project_id: selectedProject || null
      }]);

      if (noteErr) throw noteErr;

      // Parallel insert for Action Queue
      await supabase.from("tasks").insert([{
        title: newNote,
        user_id: user.id,
        status: "todo"
      }]);

      setNewNote("");
      toast.success("Intelligence recorded in Ledgers.");
      fetchPulse(user.id);
    } catch (e) {
      toast.error("Database alignment error.");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] gap-8">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 border-4 border-stone-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="font-serif italic text-stone-400 text-2xl">Synchronizing Studio Assets...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-8 md:p-14 font-sans selection:bg-stone-900 selection:text-[#A3B18A]">
      <div className="max-w-[1700px] mx-auto grid lg:grid-cols-12 gap-14">
        
        {/* LEFT COLUMN: CAPTURE ENGINE & GRID */}
        <div className="lg:col-span-8 space-y-16">
          <LedgerHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* THE CAPTURE TERMINAL */}
          <section className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-50 space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Layers size={120} />
            </div>
            
            <textarea 
              className="w-full min-h-[220px] text-3xl outline-none resize-none bg-transparent font-serif italic text-stone-800 placeholder:text-stone-200 leading-relaxed relative z-10" 
              placeholder="Start an entry..." 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            
            <div className="flex flex-wrap items-center gap-6 pt-10 border-t border-stone-50 justify-between relative z-10">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center bg-stone-50 rounded-[2rem] px-8 border border-stone-100 group/select">
                  <Hash size={14} className="text-stone-300 mr-4" />
                  <select 
                    className="bg-transparent text-[10px] font-black uppercase outline-none text-stone-500 py-5 cursor-pointer appearance-none min-w-[140px]" 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-[2rem] px-8 border border-stone-100">
                  <Folder size={14} className="text-stone-300 mr-4" />
                  <select 
                    className="bg-transparent text-[10px] font-black uppercase outline-none text-stone-500 py-5 cursor-pointer appearance-none min-w-[140px]" 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="">Link Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={addNote} 
                disabled={isSubmitting} 
                className="bg-stone-900 text-[#A3B18A] px-16 py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl hover:-translate-y-2 hover:shadow-stone-900/20 active:translate-y-0 transition-all flex items-center gap-5"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Establish Entry
              </button>
            </div>
          </section>

          {/* THE STICKY LEDGER GRID */}
          <section className="grid md:grid-cols-2 gap-12 pt-10">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, idx) => {
                const rotation = (idx % 3 === 0) ? "-1.5deg" : (idx % 2 === 0) ? "1.2deg" : "-0.8deg";
                return (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={note.id} 
                    className="p-14 min-h-[380px] flex flex-col justify-between shadow-post-it relative group hover:z-20 transition-all duration-500"
                    style={{ 
                      background: note.color || "#fef3c7", 
                      transform: `rotate(${rotation})`,
                    }}
                  >
                    {/* Tape Aesthetic */}
                    <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-md border border-white/20 rotate-[-1deg]" />
                    
                    <div className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-black/10" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic">Ref_{note.id.slice(0, 5)}</span>
                        </div>
                        <Maximize2 size={16} className="opacity-0 group-hover:opacity-20 cursor-pointer transition-opacity" />
                      </div>
                      <p className="text-stone-800 font-serif italic text-3xl pr-6 leading-[1.3]">{note.content}</p>
                    </div>

                    <div className="flex justify-between items-end mt-16 pt-8 border-t border-black/5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/5 rounded-full w-fit">
                          <Clock size={12} className="opacity-40" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {note.category !== 'note' && (
                          <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">{note.category}</p>
                        )}
                      </div>
                      <div className="flex gap-2 translate-y-2">
                        <button className="p-4 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/10">
                          <Archive size={18} className="text-stone-600" />
                        </button>
                        <button 
                          onClick={() => deleteNote(note.id)} 
                          className="p-4 bg-black/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-40 text-center space-y-6 opacity-10">
                <BookOpen size={80} className="mx-auto" />
                <p className="text-2xl font-serif italic">The ledger is currently silent.</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: ACTION PIPELINE */}
        <aside className="lg:col-span-4 space-y-10">
          <div className="bg-stone-900 rounded-[4rem] p-12 text-[#A3B18A] shadow-4xl sticky top-12 min-h-[85vh] flex flex-col border border-stone-800">
            <div className="mb-14 flex justify-between items-center">
              <div className="space-y-4">
                <h2 className="text-5xl font-serif italic leading-none text-white">Action <span className="text-[#A3B18A]">Queue</span></h2>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Pulse Active</p>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10">
                <Target size={32} />
              </div>
            </div>

            {/* PIPELINE LIST */}
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-10 pr-2">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div 
                    initial={{ x: 30, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    key={task.id} 
                    className="bg-white/5 p-8 rounded-[3rem] border border-white/10 flex items-start gap-6 hover:bg-white/10 transition-all group relative overflow-hidden"
                  >
                    <button 
                      onClick={() => supabase.from('tasks').update({status:'done'}).eq('id',task.id).then(()=>fetchPulse(user.id))} 
                      className="mt-1 text-white/20 hover:text-[#A3B18A] transition-colors relative z-10"
                    >
                      <Circle size={28} strokeWidth={1.5} />
                    </button>
                    <div className="space-y-3 flex-1 relative z-10">
                      <p className="text-sm font-bold text-white leading-snug group-hover:translate-x-1 transition-transform">{task.title}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-[#A3B18A]/20 text-[#A3B18A] rounded-full border border-[#A3B18A]/10">
                          Priority 02
                        </span>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-20">Sync_v4.0</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="text-center py-32 opacity-10 space-y-6">
                  <CheckCircle2 size={60} className="mx-auto" />
                  <p className="text-[12px] font-black uppercase tracking-[0.6em]">Pipeline Clear</p>
                </div>
              )}
            </div>

            {/* FOOTER STATS */}
            <div className="pt-10 border-t border-white/10 mt-auto">
              <div className="flex justify-between items-center px-4">
                <div className="flex -space-x-3">
                  {[1, 2].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-stone-900 bg-stone-800 flex items-center justify-center text-[11px] font-black shadow-xl">
                      <User size={14} className="text-white/40" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-stone-900 bg-[#A3B18A] flex items-center justify-center text-[14px] font-black text-stone-900 shadow-xl">
                    <Plus size={16} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Active Nodes</p>
                  <p className="text-xl font-serif italic text-white">{tasks.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER HUB INFO */}
          <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4 text-stone-800">
               <AlertCircle size={22} className="text-[#A3B18A]" />
               <h3 className="text-lg font-serif italic">Operational Guard</h3>
            </div>
            <p className="text-sm font-serif italic text-stone-500 leading-relaxed">
              Every entry captured in the Clarity Ledger is automatically processed through the 
              System Logic engine. Items containing currency symbols (£) are flagged for Treasury Audit.
            </p>
            <button className="w-full py-4 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-all">
              View Audit Logs
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
            5px 5px 15px rgba(0,0,0,0.02),
            15px 15px 45px rgba(0,0,0,0.04),
            inset 0px -10px 30px rgba(0,0,0,0.02);
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }

        .shadow-4xl {
          box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.4);
        }

        textarea::placeholder {
          opacity: 0.2;
        }

        /* Handwritten-ish feel for notes */
        .font-serif {
          font-family: 'Instrument Serif', serif;
        }
      `}</style>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-serif italic opacity-20 text-4xl">
        Booting TOTS Ledger...
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}