"use client";

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Circle, Search, User, Folder, Loader2, Plus, 
  CheckCircle2, Settings, Layers, Clock, Share2, 
  Maximize2, Archive, Hash, Command, MoreHorizontal,
  ChevronRight, Filter, Download, Zap, Database, Globe, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | THE DESKTOP LEDGER MONOLITH
 * VERSION: 5.2.0 (Studio Extended)
 * ARCHITECTURE: TACTILE POST-IT GRID + PIPELINE ARCHIVE
 * TARGET: PRO-LEVEL WORKFLOW VISUALIZATION
 */

// --- CONFIGURATION & AESTHETICS ---

const POST_IT_THEMES = [
  { bg: "#FFF9E6", tape: "rgba(0,0,0,0.05)", text: "#451a03", rotation: "-1.5deg", secondary: "#fef3c7" },
  { bg: "#E3F2FD", tape: "rgba(0,0,0,0.05)", text: "#0c4a6e", rotation: "1.2deg", secondary: "#e0f2fe" },
  { bg: "#F1F8E9", tape: "rgba(0,0,0,0.05)", text: "#14532d", rotation: "-0.8deg", secondary: "#ecfccb" },
  { bg: "#FCE4EC", tape: "rgba(0,0,0,0.05)", text: "#831843", rotation: "2.1deg", secondary: "#fce7f3" },
  { bg: "#FFF0F0", tape: "rgba(0,0,0,0.05)", text: "#7f1d1d", rotation: "-2.2deg", secondary: "#fee2e2" },
  { bg: "#F5F3FF", tape: "rgba(0,0,0,0.05)", text: "#4c1d95", rotation: "0.5deg", secondary: "#ede9fe" }
];

const CATEGORIES = [
  { id: "note", label: "General Intelligence", color: "stone" },
  { id: "task", label: "Immediate Action", color: "blue" },
  { id: "brainstorm", label: "Creative Logic", color: "purple" },
  { id: "archive", label: "Historical Data", color: "amber" }
];

// --- SUB-COMPONENTS ---

function StudioHeader({ searchTerm, setSearchTerm }: { searchTerm: string, setSearchTerm: (v: string) => void }) {
  return (
    <header className="space-y-16 mb-24 relative">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">TOTS_STUDIO // DESKTOP_V5</p>
          </div>
          <h1 className="text-9xl font-serif italic text-stone-900 tracking-tighter lowercase leading-[0.8]">
            Clarity <span className="text-stone-300">Hub</span>
          </h1>
        </div>
        <div className="flex gap-4 pt-4">
          <div className="h-14 w-14 rounded-full border border-stone-200 flex items-center justify-center text-stone-300 hover:text-stone-900 hover:border-stone-900 transition-all cursor-pointer group">
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </div>
          <div className="h-14 w-14 rounded-full border border-stone-200 flex items-center justify-center text-stone-300 hover:text-stone-900 hover:border-stone-900 transition-all cursor-pointer">
            <Share2 size={20} />
          </div>
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
          <Search className="text-stone-200 group-focus-within:text-stone-900 transition-colors" size={26} />
        </div>
        <input 
          type="text" 
          placeholder="Filter desktop strings..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-24 pr-12 py-9 bg-white/60 backdrop-blur-xl border border-stone-100 rounded-[3rem] outline-none shadow-sm font-serif italic text-2xl focus:bg-white focus:ring-8 ring-stone-900/[0.02] transition-all"
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

  // Form & Interface States
  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("note");
  const [selectedProject, setSelectedProject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  
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

      const channel = supabase.channel("ledger-v5-realtime")
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
    
    const theme = POST_IT_THEMES[Math.floor(Math.random() * POST_IT_THEMES.length)];

    try {
      const { error: noteErr } = await supabase.from("notes").insert([{
        content: newNote,
        user_id: user.id,
        color: theme.bg,
        category: selectedCategory,
        project_id: selectedProject || null,
        metadata: { client_version: "5.2.0", source: "studio_extended" }
      }]);

      if (noteErr) throw noteErr;

      // Duplicate to Action Queue for immediate visibility
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
      toast.error("Internal Protocol Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Entry Discarded.");
    }
  };

  const filteredNotes = useMemo(() => 
    notes.filter(n => (n.content || "").toLowerCase().includes(searchTerm.toLowerCase())),
    [notes, searchTerm]
  );

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] gap-12">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 border-8 border-stone-100 rounded-full" />
        <div className="absolute inset-0 border-8 border-stone-800 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="font-serif italic text-stone-300 text-4xl tracking-tighter">Calibrating Hub...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-10 md:p-20 font-sans selection:bg-stone-900 selection:text-white">
      <div className="max-w-[1850px] mx-auto grid lg:grid-cols-12 gap-20">
        
        {/* LEFT COLUMN: THE CAPTURE ENGINE & TACTILE GRID */}
        <div className="lg:col-span-8 space-y-24">
          <StudioHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* THE CAPTURE HUB */}
          <section className="bg-white p-14 rounded-[4.5rem] shadow-2xl border border-stone-50 space-y-12 relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 p-24 opacity-[0.02] rotate-12">
              <Command size={400} />
            </div>
            
            <textarea 
              className="w-full min-h-[260px] text-4xl outline-none resize-none bg-transparent font-serif italic text-stone-900 placeholder:text-stone-100 leading-[1.4] relative z-10" 
              placeholder="Record a thought..." 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            
            <div className="flex flex-wrap items-center gap-10 pt-12 border-t border-stone-50 justify-between relative z-10">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center bg-stone-50 rounded-[2.5rem] px-10 border border-stone-100 transition-all focus-within:bg-stone-100 group/sel shadow-inner">
                  <Hash size={16} className="text-stone-300 mr-5" />
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase outline-none text-stone-500 py-6 cursor-pointer appearance-none min-w-[170px]" 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-[2.5rem] px-10 border border-stone-100 transition-all focus-within:bg-stone-100 group/sel shadow-inner">
                  <Folder size={16} className="text-stone-300 mr-5" />
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase outline-none text-stone-500 py-6 cursor-pointer appearance-none min-w-[170px]" 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={addNote} 
                disabled={isSubmitting} 
                className="bg-stone-900 text-white px-20 py-7 rounded-[3rem] font-black uppercase text-[11px] tracking-[0.6em] shadow-3xl hover:-translate-y-2 hover:shadow-stone-900/40 active:translate-y-0 transition-all flex items-center gap-6"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} Pin Note
              </button>
            </div>
          </section>

          {/* THE TACTILE POST-IT GRID */}
          <section className="grid md:grid-cols-2 gap-16 pt-10">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, idx) => {
                const theme = POST_IT_THEMES[idx % POST_IT_THEMES.length];
                return (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, y: 50, rotate: "0deg" }} 
                    animate={{ opacity: 1, y: 0, rotate: theme.rotation }} 
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.03, rotate: "0deg", zIndex: 50 }}
                    key={note.id} 
                    className="p-16 min-h-[420px] flex flex-col justify-between shadow-post-it relative group transition-all duration-500 cursor-default overflow-hidden"
                    style={{ background: note.color || theme.bg }}
                  >
                    {/* PHYSICAL TAPE ELEMENT */}
                    <div className="absolute top-[-22px] left-1/2 -translate-x-1/2 w-44 h-14 bg-white/40 backdrop-blur-md border border-white/30 rotate-[-1.5deg] shadow-sm z-20" />
                    
                    <div className="space-y-10 pr-4 relative z-10">
                      <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-black/10" />
                            <div className="h-2 w-2 rounded-full bg-black/10" />
                         </div>
                         <Maximize2 size={16} className="text-black/20 cursor-pointer hover:text-black/60" />
                      </div>
                      <p className="text-stone-900 font-serif italic text-4xl leading-[1.3] tracking-tight">{note.content}</p>
                    </div>

                    <div className="flex justify-between items-end mt-20 pt-10 border-t border-black/5 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 px-5 py-2.5 bg-black/5 rounded-full w-fit">
                          <Clock size={14} className="opacity-30" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">
                            {new Date(note.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 ml-1">
                           <Hash size={10} className="text-black/10" />
                           <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em]">{note.category || 'general'}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 translate-y-3">
                        <button className="p-5 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/10 text-stone-600">
                          <Archive size={20} />
                        </button>
                        <button 
                          onClick={() => deleteNote(note.id)} 
                          className="p-5 bg-black/5 hover:bg-red-600 hover:text-white rounded-3xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-60 text-center space-y-10 opacity-10">
                <BookOpen size={100} className="mx-auto" />
                <p className="text-3xl font-serif italic">Desktop is clear.</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: ACTION PIPELINE & SYSTEM LOGS */}
        <aside className="lg:col-span-4 space-y-14">
          <div className="bg-stone-900 rounded-[5rem] p-16 text-[#A3B18A] shadow-4xl sticky top-14 min-h-[90vh] flex flex-col border border-white/5 overflow-hidden">
            
            <div className="mb-20">
              <h2 className="text-6xl font-serif italic leading-none text-white">Action <span className="text-stone-500">Queue</span></h2>
              <div className="h-[1px] w-full bg-white/5 mt-12" />
            </div>

            {/* THE PIPELINE */}
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-20 pr-4">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    key={task.id} 
                    className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 flex items-start gap-10 hover:bg-white/10 transition-all group relative overflow-hidden"
                  >
                    <button 
                      onClick={() => supabase.from('tasks').update({status:'done'}).eq('id',task.id).then(()=>fetchPulse(user.id))} 
                      className="mt-1 text-white/10 hover:text-white transition-all transform hover:scale-125"
                    >
                      <Circle size={32} strokeWidth={1} />
                    </button>
                    <div className="space-y-4 flex-1">
                      <p className="text-lg font-bold text-white leading-tight group-hover:text-stone-200 transition-colors">{task.title}</p>
                      <div className="flex items-center gap-6">
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]/40">Node_ID_{task.id.slice(0, 4)}</span>
                         <div className="h-1 w-1 rounded-full bg-white/20" />
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600">Priority_02</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="text-center py-48 opacity-10 space-y-12 text-white">
                  <CheckCircle2 size={100} className="mx-auto" strokeWidth={1} />
                  <p className="text-[16px] font-black uppercase tracking-[1em]">Clear</p>
                </div>
              )}
            </div>

            {/* SYSTEM TERMINAL MINI */}
            <div className="mt-auto space-y-10">
               <div className="p-10 bg-black/40 rounded-[3rem] border border-white/5 font-mono text-[10px] leading-loose text-white/20 selection:bg-white selection:text-stone-900">
                  <div className="flex justify-between mb-6 border-b border-white/5 pb-4">
                     <span className="text-[#A3B18A] uppercase tracking-widest font-black">Sync_Module</span>
                     <span className="opacity-40">v5.2.0</span>
                  </div>
                  <div className="space-y-2">
                    <p className="flex gap-4"><span className="text-[#A3B18A]">[OK]</span> Desktop Hub Handshake Active</p>
                    <p className="flex gap-4"><span className="text-[#A3B18A]">[OK]</span> Realtime_Subscription listening</p>
                    <p className="flex gap-4"><span className="text-[#A3B18A]">[OK]</span> Reconciled {notes.length} ledger nodes</p>
                  </div>
               </div>

               <div className="flex justify-between items-center px-6">
                  <div className="flex -space-x-5">
                    {[1, 2].map(i => (
                      <div key={i} className="w-16 h-16 rounded-full border-4 border-stone-900 bg-stone-800 flex items-center justify-center shadow-2xl">
                        <User size={18} className="text-white/20" />
                      </div>
                    ))}
                    <div className="w-16 h-16 rounded-full border-4 border-stone-900 bg-[#A3B18A] flex items-center justify-center text-stone-900 shadow-2xl">
                      <Plus size={20} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Queue_Count</p>
                    <p className="text-4xl font-serif italic text-white leading-none">{tasks.length}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* LOWER STUDIO TOOLS */}
          <div className="p-12 bg-white rounded-[4rem] border border-stone-100 shadow-xl space-y-12 relative overflow-hidden">
             <div className="flex items-center gap-6 text-stone-900">
                <div className="p-4 bg-stone-50 rounded-2xl"><Zap size={24} className="text-[#A3B18A]" /></div>
                <div>
                  <h3 className="text-xl font-serif italic leading-none">Studio Protocol</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mt-2">v5 Revision</p>
                </div>
             </div>
             <p className="text-base font-serif italic text-stone-500 leading-relaxed pr-6">
                All pinned notes are indexed for global search and synced across your TOTS environment instantly. 
             </p>
             <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center gap-3 p-6 bg-stone-50 rounded-3xl border border-stone-100 hover:bg-stone-100 transition-all group">
                   <Download size={18} className="text-stone-400 group-hover:text-stone-900" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Export</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-6 bg-stone-50 rounded-3xl border border-stone-100 hover:bg-stone-100 transition-all group">
                   <Globe size={18} className="text-stone-400 group-hover:text-stone-900" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Public</span>
                </button>
             </div>
          </div>
        </aside>

      </div>

      {/* CUSTOM STYLE DEFINITIONS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&display=swap');
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .shadow-post-it {
          box-shadow: 
            5px 5px 15px rgba(0,0,0,0.03),
            15px 15px 45px rgba(0,0,0,0.05),
            inset 0px -15px 35px rgba(0,0,0,0.02);
        }

        .shadow-3xl { box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.2); }
        .shadow-4xl { box-shadow: 0 60px 100px -30px rgba(0, 0, 0, 0.5); }

        textarea::placeholder { opacity: 0.1; }
        .font-serif { font-family: 'Instrument Serif', serif; }

        /* Specific Post-it Transitions */
        .group:hover .shadow-post-it {
           box-shadow: 
            0 40px 80px -20px rgba(0,0,0,0.1),
            inset 0px -15px 35px rgba(0,0,0,0.02);
        }
      `}</style>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-serif italic text-stone-200 text-6xl">
        Booting...
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}