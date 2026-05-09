"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Zap, Circle, BookOpen, X, ChevronLeft, ChevronRight, Target, Play, Search,
  Mic, MicOff, User, Folder
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Note background options remain as aesthetic pastels, but can be themed if desired
const COLORS = ["#fef3c7", "#e0f2fe", "#ecfccb", "#fce7f3", "#ede9fe"];

function SystemNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    {
      title: "Welcome to TOTs OS",
      description: "A unified environment where notes become formal financial records instantly.",
      icon: <Zap className="text-yellow-400" />,
    },
    {
      title: "The Notes Ledger",
      description: "Type naturally. Add notes instantly to the Action Queue.",
      icon: <BookOpen className="text-blue-400" />,
    },
    {
      title: "Treasury Execution",
      description: "Entries with currency symbols (£) are auto-synced to your formal Treasury ledger.",
      icon: <Target className="text-[var(--brand-primary)]" />,
    },
    {
      title: "Action Queue",
      description: "Tasks with keywords like 'Remind' or 'Todo' end up here automatically.",
      icon: <Play className="text-stone-400" />,
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
    <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 z-50 bg-stone-900 text-[var(--brand-primary)] p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all flex items-center gap-3 group">
      <BookOpen size={20} />
      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Training Guide</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--card-bg)] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-[var(--border)]">
        <div className="h-1.5 w-full bg-stone-50 flex">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-[var(--brand-primary)]' : 'bg-transparent'}`} style={{ width: `${100 / STEPS.length}%` }} />
          ))}
        </div>
        <div className="p-12 space-y-8">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-[var(--bg-soft)] rounded-3xl">{STEPS[currentStep].icon}</div>
            <button onClick={finishTour}><X size={24} className="text-stone-300 hover:text-stone-900" /></button>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif italic text-[var(--text-main)] leading-tight">{STEPS[currentStep].title}</h2>
            <p className="text-[var(--text-muted)] text-lg font-serif italic leading-relaxed">{STEPS[currentStep].description}</p>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-[var(--border)]">
            <button onClick={finishTour} className="text-[10px] font-black uppercase text-stone-300 hover:text-stone-500">Skip Guide</button>
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="p-4 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-soft)] text-[var(--text-main)]">
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={() => currentStep === STEPS.length - 1 ? finishTour() : setCurrentStep(s => s + 1)} 
                className="bg-stone-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                {currentStep === STEPS.length - 1 ? "Initialize" : "Next"}
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
  const [teamId, setTeamId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState<"note" | "task" | "todo" | "event">("note");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [assignedMember, setAssignedMember] = useState<string>("");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const fetchPulse = useCallback(async (userId: string) => {
    const [{ data: nts }, { data: tsk }, { data: mem }, { data: proj }, { data: teamMembers }] = await Promise.all([
      supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("tasks").select("*, customers(name)").eq("user_id", userId).eq("status", "todo").order("priority", { ascending: false }),
      supabase.from("team_members").select("team_id").eq("user_id", userId).maybeSingle(),
      supabase.from("projects").select("*").eq("user_id", userId),
      supabase.from("team_members").select("*")
    ]);
    if (mem?.team_id) setTeamId(mem.team_id);
    setNotes(nts || []);
    setTasks(tsk || []);
    setProjects(proj || []);
    setMembers(teamMembers || []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchPulse(authUser.id);

      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const channel = supabase.channel("notes-channel")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${authUser.id}` }, () => fetchPulse(authUser.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${authUser.id}` }, () => fetchPulse(authUser.id))
        .subscribe();

      channelRef.current = channel;
    };

    init();
    
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setNewNote(prev => prev + " " + finalTranscript);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => { 
      if (channelRef.current) supabase.removeChannel(channelRef.current); 
    };
  }, [fetchPulse]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const detectIntent = (text: string) => {
    const t = text.toLowerCase();
    if (t.match(/invoice|bill|charge/)) return "invoice";
    if (t.match(/expense|spent|bought/)) return "expense";
    if (t.match(/task|todo|remind/)) return "task";
    return "note";
  };

  async function addNote() {
    if (!newNote.trim() || !user) return;
    
    const notePayload: any = {
      content: newNote, 
      user_id: user.id, 
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      category: selectedCategory,
    };
    
    if (selectedProject) notePayload.project_id = selectedProject;
    if (assignedMember) notePayload.assigned_to = assignedMember;
    
    const { error: noteError } = await supabase.from("notes").insert([notePayload]);
    if (noteError) return;

    const taskPayload: any = { 
      title: newNote, 
      user_id: user.id,
      status: "todo",
      priority: 2
    };

    if (selectedProject) taskPayload.project_id = selectedProject;
    if (assignedMember) taskPayload.assigned_to = assignedMember;

    await supabase.from("tasks").insert([taskPayload]);

    if (selectedCategory === "event") {
      await supabase.from("events").insert([{
        title: newNote,
        description: "Added via Notes",
        user_id: user.id,
        date: new Date().toISOString().split("T")[0]
      }]);
    }

    setNewNote("");
    setSelectedProject("");
    setAssignedMember("");
    toast.success("Note added to Action Queue & Ledgers");
    await fetchPulse(user.id);
  }

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    if (user) await fetchPulse(user.id);
  }

  const completeTask = async (id: string) => {
    await supabase.from("tasks").update({ status: 'done' }).eq("id", id);
    if (user) await fetchPulse(user.id);
  }

  const filteredNotes = notes.filter((note) =>
    note.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8 md:p-12">
      <SystemNavigator />
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <header className="space-y-6">
            <h1 className="text-6xl font-serif italic text-[var(--text-main)] tracking-tighter">Notes</h1>

            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[var(--brand-primary)] transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Find a note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] outline-none shadow-sm focus:ring-4 ring-[var(--brand-primary)]/5 transition-all font-serif italic text-lg text-[var(--text-main)]"
              />
            </div>
          </header>

          <div className="bg-[var(--card-bg)] p-8 rounded-[3rem] shadow-sm border border-[var(--border)] space-y-6 focus-within:border-[var(--brand-primary)] transition-all">
            <textarea 
              className="w-full min-h-[140px] text-xl outline-none resize-none bg-transparent font-serif italic text-[var(--text-main)] placeholder:text-stone-300" 
              placeholder="Type your note here..." 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            
            <div className="flex flex-wrap items-center gap-4 py-4 border-t border-[var(--border)] justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <button 
                  onClick={toggleSpeechRecognition}
                  type="button"
                  className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    isListening 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-stone-100'
                  }`}
                >
                  {isListening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                  <span>{isListening ? "Listening..." : "Speak Note"}</span>
                </button>

                <select 
                  className="bg-[var(--bg-soft)] text-[10px] font-black uppercase px-5 py-3 rounded-2xl outline-none border border-[var(--border)] transition-all text-[var(--text-muted)]" 
                  value={selectedCategory} 
                  onChange={(e: any) => setSelectedCategory(e.target.value)}
                >
                  <option value="note">Status: Note</option>
                  <option value="task">Status: Task</option>
                  <option value="todo">Status: To Do</option>
                  <option value="event">Status: Calendar Event</option>
                </select>

                <select 
                  className="bg-[var(--bg-soft)] text-[10px] font-black uppercase px-5 py-3 rounded-2xl outline-none border border-[var(--border)] transition-all text-[var(--text-muted)]" 
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Link Project (Optional)</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
                </select>

                <select 
                  className="bg-[var(--bg-soft)] text-[10px] font-black uppercase px-5 py-3 rounded-2xl outline-none border border-[var(--border)] transition-all text-[var(--text-muted)]" 
                  value={assignedMember} 
                  onChange={(e) => setAssignedMember(e.target.value)}
                >
                  <option value="">Assign Member (Optional)</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email || "Team Member"}</option>)}
                </select>
              </div>

              <button onClick={addNote} className="bg-[var(--brand-primary)] text-stone-900 px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-105 hover:-translate-y-1 transition-all">
                Add Note
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {filteredNotes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={note.id} 
                      className="p-10 rounded-[3rem] border border-[var(--border)] flex flex-col justify-between min-h-[260px] relative shadow-sm hover:shadow-md transition-shadow" 
                      style={{ background: note.color || "var(--card-bg)" }}
                    >
                      <div>
                        <p className="text-stone-800 leading-relaxed font-serif italic text-xl">{note.content}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          {note.category && (
                            <span className="text-[8px] font-black tracking-widest px-3 py-1 bg-white/60 border rounded-full uppercase">
                              Status: {note.category}
                            </span>
                          )}
                          {note.project_id && (
                            <span className="text-[8px] font-black tracking-widest px-3 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 rounded-full uppercase flex items-center gap-1">
                              <Folder size={10} /> Linked Project
                            </span>
                          )}
                          {note.assigned_to && (
                            <span className="text-[8px] font-black tracking-widest px-3 py-1 bg-stone-900 text-[var(--brand-primary)] border border-stone-800 rounded-full uppercase flex items-center gap-1">
                              <User size={10} /> Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-6">
                        <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-black/5">
                          <Zap size={12} className="text-stone-600" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">{detectIntent(note.content)}</span>
                        </div>
                        <button 
                          onClick={() => deleteNote(note.id)} 
                          className="p-3 text-stone-400 hover:text-red-500 hover:bg-white/50 rounded-2xl transition-all"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] rounded-3xl p-16 text-center border border-[var(--border)]">
                <p className="font-serif text-[var(--text-muted)] italic">No notes found matching this term.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="px-4">
            <h2 className="text-3xl font-serif italic text-[var(--text-main)]">Action Queue</h2>
            <p className="text-[var(--text-muted)] text-xs mt-1 uppercase tracking-widest font-bold">Priority Execution</p>
          </div>
          
          <div className="space-y-4">
            {tasks.map((task) => (
              <motion.div 
                initial={{ x: 20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                key={task.id} 
                className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border)] flex items-start gap-5 group shadow-sm hover:border-[var(--brand-primary)]/30 transition-all"
              >
                <button 
                  onClick={() => completeTask(task.id)} 
                  className="mt-1 text-stone-300 hover:text-[var(--brand-primary)] transition-all"
                >
                  <Circle size={28} strokeWidth={1.5} />
                </button>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[var(--text-main)] leading-tight group-hover:text-stone-900 transition-colors">{task.title}</p>
                  <span className="inline-block text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-[0.2em]">{task.customers?.name || 'Firm Internal'}</span>
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && (
               <div className="py-20 text-center space-y-4">
                 <div className="w-12 h-12 bg-[var(--bg-soft)] rounded-full flex items-center justify-center mx-auto text-stone-200">
                    <Target size={20} />
                 </div>
                 <p className="text-[var(--text-muted)] font-serif italic text-sm">Queue clear. Ready for capture.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] gap-4">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif italic text-[var(--text-muted)] text-sm">Synchronizing Clarity Ledger...</p>
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}