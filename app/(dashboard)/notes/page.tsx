"use client";

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Zap, Circle, BookOpen, X, ChevronLeft, ChevronRight, Target, Play, Search,
  Mic, MicOff, User, Folder, Loader2, Plus, Calendar, Hash, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS | POST-IT LEDGER INFRASTRUCTURE
 * VERSION: 3.5.0
 * OPTIMIZED FOR MACBOOK 13" | 2026 RELEASE
 */

// Post-it Palette: Classic high-visibility sticky note colors
const POST_IT_COLORS = [
  { bg: "#fef3c7", border: "#fde68a", text: "#92400e", rotate: "-1deg" }, // Yellow
  { bg: "#e0f2fe", border: "#bae6fd", text: "#075985", rotate: "1.5deg" }, // Blue
  { bg: "#ecfccb", border: "#d9f99d", text: "#3f6212", rotate: "-2deg" }, // Lime
  { bg: "#fce7f3", border: "#fbcfe8", text: "#9d174d", rotate: "1deg" },  // Pink
  { bg: "#ede9fe", border: "#ddd6fe", text: "#5b21b6", rotate: "-1.5deg" } // Purple
];

function SystemNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    {
      title: "Clarity Ledger",
      description: "A digital workspace designed to mimic physical thought-capture. Your notes are treated as live assets.",
      icon: <Zap className="text-yellow-400" />,
    },
    {
      title: "The Post-it Logic",
      description: "Visual cues help you distinguish between quick thoughts and project-critical intelligence.",
      icon: <BookOpen className="text-blue-400" />,
    },
    {
      title: "Bi-Directional Sync",
      description: "Adding a note here automatically populates your Action Queue. One entry, total coverage.",
      icon: <Target className="text-stone-900" />,
    }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("tots_tour_complete");
    if (!hasSeenTour) setTimeout(() => setIsOpen(true), 1500);
  }, []);

  const finishTour = () => {
    localStorage.setItem("tots_tour_complete", "true");
    setIsOpen(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 z-50 bg-stone-900 text-[#A3B18A] p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all flex items-center gap-3 group border border-stone-800">
      <BookOpen size={20} />
      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Protocol Guide</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-4xl overflow-hidden">
        <div className="h-2 w-full bg-stone-100 flex">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-full transition-all duration-700 ${i <= currentStep ? 'bg-[#A3B18A]' : 'bg-transparent'}`} style={{ width: `${100 / STEPS.length}%` }} />
          ))}
        </div>
        <div className="p-16 space-y-10">
          <div className="flex justify-between items-start">
            <div className="p-5 bg-stone-50 rounded-[2rem] border border-stone-100">{STEPS[currentStep].icon}</div>
            <button onClick={finishTour} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><X size={24} className="text-stone-300" /></button>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-serif italic text-stone-900 tracking-tight">{STEPS[currentStep].title}</h2>
            <p className="text-stone-500 text-xl font-serif italic leading-relaxed">{STEPS[currentStep].description}</p>
          </div>
          <div className="flex justify-between items-center pt-10 border-t border-stone-50">
            <button onClick={finishTour} className="text-[10px] font-black uppercase text-stone-300 hover:text-stone-600 transition-colors">Terminate Guide</button>
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="p-5 rounded-2xl border border-stone-100 hover:bg-stone-50 text-stone-900 transition-all">
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={() => currentStep === STEPS.length - 1 ? finishTour() : setCurrentStep(s => s + 1)} 
                className="bg-stone-900 text-[#A3B18A] px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
              >
                {currentStep === STEPS.length - 1 ? "Initialize" : "Advance"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NotesContent() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Input States
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
        supabase.from("tasks").select("*").eq("user_id", userId).eq("status", "todo").order("priority", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", userId)
      ]);

      setNotes(nts.data || []);
      setTasks(tsk.data || []);
      setProjects(proj.data || []);
    } catch (e) {
      console.warn("Schema out of sync. Checking table columns...");
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

      // Realtime System
      const channel = supabase.channel("realtime-ledger")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchPulse(authUser.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchPulse(authUser.id))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        setNewNote(prev => prev + " " + text);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [fetchPulse]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    isListening ? recognitionRef.current.stop() : (recognitionRef.current.start(), setIsListening(true));
  };

  const addNote = async () => {
    if (!newNote.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    // Choose random aesthetic rotation/color for the Post-it
    const colorConfig = POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)];

    try {
      // 1. Entry in Ledger
      await supabase.from("notes").insert([{
        content: newNote,
        user_id: user.id,
        color: colorConfig.bg,
        category: selectedCategory,
        project_id: selectedProject || null
      }]);

      // 2. Entry in Queue
      await supabase.from("tasks").insert([{
        title: newNote,
        user_id: user.id,
        status: "todo",
        priority: 2,
        project_id: selectedProject || null
      }]);

      setNewNote("");
      setSelectedProject("");
      toast.success("Intelligence captured.");
      fetchPulse(user.id);
    } catch (e) {
      toast.error("Protocol Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchPulse(user.id);
  };

  const completeTask = async (id: string) => {
    await supabase.from("tasks").update({ status: 'done' }).eq("id", id);
    fetchPulse(user.id);
  };

  const filteredNotes = useMemo(() => 
    notes.filter(n => n.content?.toLowerCase().includes(searchTerm.toLowerCase())),
    [notes, searchTerm]
  );

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-10 md:p-16 selection:bg-stone-900 selection:text-[#A3B18A]">
      <SystemNavigator />
      
      <div className="max-w-[1500px] mx-auto grid lg:grid-cols-12 gap-16">
        
        {/* LEFT SECTION: NOTE CAPTURE & POST-IT GRID */}
        <div className="lg:col-span-8 space-y-16">
          <header className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-1 bg-stone-900" />
              <h1 className="text-8xl font-serif italic text-stone-800 tracking-tighter lowercase">
                Clarity <span className="text-stone-300">Ledger</span>
              </h1>
            </div>

            <div className="relative group max-w-2xl">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-800 transition-colors" size={24} />
              <input 
                type="text" placeholder="Search entries..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-20 pr-10 py-7 bg-white/50 backdrop-blur-sm border border-stone-100 rounded-[2.5rem] outline-none shadow-sm font-serif italic text-xl focus:bg-white transition-all"
              />
            </div>
          </header>

          {/* INPUT COMPONENT */}
          <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-stone-50 space-y-8">
            <textarea 
              className="w-full min-h-[160px] text-2xl outline-none resize-none bg-transparent font-serif italic text-stone-800 placeholder:text-stone-200 leading-relaxed" 
              placeholder="Start typing or use voice capture..." value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            
            <div className="flex flex-wrap items-center gap-5 pt-8 border-t border-stone-50 justify-between">
              <div className="flex flex-wrap gap-3">
                <button onClick={toggleSpeech} className={`flex items-center gap-3 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all ${isListening ? 'bg-red-50 border-red-100 text-red-500 scale-105' : 'bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100'}`}>
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />} {isListening ? "Live Capture" : "Voice"}
                </button>

                <div className="h-12 w-px bg-stone-100 mx-2" />

                <div className="flex items-center bg-stone-50 rounded-3xl px-6 border border-stone-100">
                  <Hash size={14} className="text-stone-300 mr-3" />
                  <select className="bg-transparent text-[10px] font-black uppercase outline-none text-stone-500 py-4 cursor-pointer" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="note">Status: General</option>
                    <option value="task">Status: Action Required</option>
                    <option value="event">Status: Calendar Event</option>
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-3xl px-6 border border-stone-100">
                  <Folder size={14} className="text-stone-300 mr-3" />
                  <select className="bg-transparent text-[10px] font-black uppercase outline-none text-stone-500 py-4 cursor-pointer" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                    <option value="">Link Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={addNote} disabled={isSubmitting} className="bg-stone-900 text-[#A3B18A] px-14 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:-translate-y-2 active:translate-y-0 transition-all flex items-center gap-4">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Establish Entry
              </button>
            </div>
          </div>

          {/* POST-IT GRID */}
          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-12 pt-10">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => {
                const rotation = (index % 3 === 0) ? "-1.5deg" : (index % 2 === 0) ? "1.2deg" : "-0.8deg";
                return (
                  <motion.div 
                    layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={note.id} 
                    className="p-12 min-h-[320px] flex flex-col justify-between shadow-post-it relative group hover:z-10 transition-transform duration-300" 
                    style={{ 
                      background: note.color || "#fef3c7", 
                      transform: `rotate(${rotation})`,
                      boxShadow: '10px 10px 30px rgba(0,0,0,0.03), inset 0px -5px 15px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* The Sticky Tape Aesthetic */}
                    <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-sm border border-white/20 rotate-[-1deg]" />
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 italic">Ref: {note.id.slice(0, 8)}</span>
                        <Zap size={14} className="opacity-20" />
                      </div>
                      <p className="text-stone-800 leading-relaxed font-serif italic text-2xl pr-4">{note.content}</p>
                    </div>

                    <div className="flex justify-between items-end mt-12">
                      <div className="space-y-2">
                        {note.category && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-stone-600">{note.category}</span>
                          </div>
                        )}
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Captured {new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteNote(note.id)} className="p-4 bg-black/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SECTION: ACTION QUEUE (TREASURY & TASKS) */}
        <aside className="lg:col-span-4 space-y-12">
          <div className="bg-stone-900 rounded-[4rem] p-10 text-[#A3B18A] shadow-4xl sticky top-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-4xl font-serif italic leading-none">Action Queue</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 mt-2">Priority Pipeline</p>
              </div>
              <div className="p-4 bg-white/5 rounded-full border border-white/10">
                <Target size={24} />
              </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
              {tasks.length > 0 ? tasks.map((task) => (
                <motion.div 
                  initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  key={task.id} 
                  className="bg-white/5 p-7 rounded-[2.5rem] border border-white/10 flex items-start gap-6 hover:bg-white/10 transition-all group"
                >
                  <button onClick={() => completeTask(task.id)} className="mt-1 text-white/20 hover:text-[#A3B18A] transition-colors">
                    <Circle size={28} strokeWidth={1} />
                  </button>
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-bold text-white leading-tight group-hover:translate-x-1 transition-transform">{task.title}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-[#A3B18A]/20 text-[#A3B18A] rounded-full">Task</span>
                      <span className="text-[8px] font-medium text-white/30 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="py-24 text-center space-y-6 opacity-20">
                  <CheckCircle2 size={48} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">System Clear</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-10 border-t border-white/10 flex justify-between items-center">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-900 bg-stone-800 flex items-center justify-center text-[10px] font-black">
                    {i === 3 ? <Plus size={12} /> : <User size={12} />}
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Syncing Live...</p>
            </div>
          </div>

          <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 text-stone-400">
              <AlertCircle size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest">Protocol Status</p>
            </div>
            <p className="text-sm font-serif italic text-stone-500 leading-relaxed">
              Entries are automatically audited. Any entry containing currency symbols will trigger Treasury Analysis.
            </p>
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
            15px 15px 35px rgba(0,0,0,0.03);
        }

        .shadow-4xl {
          box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25);
        }

        textarea::placeholder {
          opacity: 0.3;
        }

        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d1d5db'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='C19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right center;
          background-size: 12px;
          padding-right: 20px;
        }
      `}</style>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] gap-6">
        <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <p className="font-serif italic text-stone-400 text-lg">Aligning Ledger Assets...</p>
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}