"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Trash2, Search, Loader2, Plus, X, 
  CheckCircle2, Tag, AlertCircle, Calendar, User, Briefcase, Mic, MicOff, Bell, BellOff, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * TOTS OS | THE VAULT (V10.0)
 * DESIGN: EXPANDED PHYSICAL STICKY NOTE DESK WITH EMBEDDED CONTEXT HOOKS
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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Input States
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");

  // Extended Fields
  const [project, setProject] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [isReminder, setIsReminder] = useState(false);
  const [status, setStatus] = useState("todo");

  // Voice Note State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fetchNotes = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);

      // Pull unique project names from current notes to keep select lists populated
      if (data) {
        const uniqueProjects = Array.from(
          new Set(data.map((n: any) => n.project).filter(Boolean))
        ) as string[];
        setProjectsList(uniqueProjects);
      }
    } catch (e) {
      console.error("Notes Fetch Error:", e);
      toast.error("Could not load the notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .order("name", { ascending: true });
      if (!error && data) setTeamMembers(data);
    } catch (e) {
      console.error("Error fetching team:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchNotes(authUser.id);
      await fetchTeamMembers();
      
      const channel = supabase.channel("vault_desk")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes(authUser.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [fetchNotes, fetchTeamMembers]);

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setContent((prev) => prev + (prev ? " " : "") + transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast.error("Voice capture ran into an issue.");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      toast.success("Listening... Speak clearly.");
    }
  };

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
        project: project || null,
        assigned_to: assignedTo || null,
        due_date: isReminder && reminderDateTime ? new Date(reminderDateTime).toISOString() : null,
        is_reminder: isReminder,
        status: status,
        metadata: { rotation: theme.rotation }
      }]);

      if (error) throw error;
      
      setContent("");
      setTag("");
      setIsUrgent(false);
      setProject("");
      setAssignedTo("");
      setReminderDateTime("");
      setIsReminder(false);
      setStatus("todo");
      setShowModal(false);
      
      toast.success("Note pinned to desk.");
      fetchNotes(user.id);
    } catch (e) {
      toast.error("Failed to pin note.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateNoteStatus = async (id: string, nextStatus: string) => {
    const { error } = await supabase.from("notes").update({ status: nextStatus }).eq("id", id);
    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, status: nextStatus } : n));
      toast.success(`Moved to ${nextStatus.replace('_', ' ').toUpperCase()}`);
    }
  };

  const completeNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Note cleared.");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.content?.toLowerCase().includes(search.toLowerCase()) || 
    n.category?.toLowerCase().includes(search.toLowerCase()) ||
    n.project?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-screen bg-[#F5F5F3] flex items-center justify-center font-serif italic text-stone-300 text-4xl">Loading Desk...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans text-stone-900 pb-40 relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght=1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .shadow-sticky {
          box-shadow: 
            3px 3px 12px rgba(0,0,0,0.02),
            8px 20px 35px rgba(0,0,0,0.06),
            inset 0px -5px 12px rgba(0,0,0,0.02);
        }
      `}</style>
      
      {/* HEADER */}
      <header className="max-w-[1400px] mx-auto p-12 flex justify-between items-end">
        <div>
          <h1 className="text-8xl font-serif italic tracking-tighter capitalize leading-none">Notes</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mt-4 ml-1">Your Digital Notepad</p>
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
          {filteredNotes.map((note) => {
            const assignedTeamMember = teamMembers.find(m => m.id === note.assigned_to);
            return (
              <motion.div 
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: note.metadata?.rotation || "0deg" }}
                exit={{ opacity: 0, scale: 0.5, rotate: "10deg" }}
                whileHover={{ scale: 1.02, rotate: "0deg", zIndex: 50 }}
                // HEIGHT AND BOX SIZE INCREASED HERE FOR CLEAN SPACING
                className={`p-7 min-h-[420px] w-full flex flex-col shadow-sticky relative group transition-all duration-300 rounded-sm ${
                  note.is_urgent ? 'text-white' : 'text-stone-800'
                }`}
                style={{ background: note.color || "#FFF9E6" }}
              >
                {/* STICKY TAPE */}
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-24 h-6 bg-white/40 backdrop-blur-sm border border-white/10 z-10" />
                
                {/* NOTE HEADER METADATA */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                    {note.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {note.is_reminder && <Clock size={12} className={note.is_urgent ? "text-amber-300 animate-pulse" : "text-stone-500 animate-pulse"} />}
                    {note.is_urgent && <AlertCircle size={14} className="text-red-400 animate-pulse" />}
                  </div>
                </div>

                {/* CENTRAL CONTENT */}
                <div className="flex-1 space-y-4">
                  <p className="text-3xl font-serif italic leading-snug pr-2 break-words">{note.content}</p>

                  {/* CONTEXT CHIPS */}
                  <div className="space-y-1.5 pt-3 border-t border-black/[0.04]">
                    {note.project && (
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-50 flex items-center gap-1.5">
                        <Briefcase size={11} /> {note.project}
                      </p>
                    )}
                    {assignedTeamMember && (
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-50 flex items-center gap-1.5">
                        <User size={11} /> {assignedTeamMember.name}
                      </p>
                    )}
                    {note.due_date && (
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-70 flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                        <Calendar size={11} /> {format(new Date(note.due_date), "MMM d, p")}
                      </p>
                    )}
                  </div>
                </div>

                {/* RELIABLE COMPACT FOOTER - FIXED INNER ALIGNMENT */}
                <div className="mt-6 pt-4 border-t border-black/[0.06] space-y-4">
                  <div className="flex items-center justify-between bg-black/[0.03] px-3 py-2 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-40">Pipeline</span>
                    <select 
                      value={note.status || "todo"}
                      onChange={(e) => updateNoteStatus(note.id, e.target.value)}
                      className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer text-stone-700 border-none p-0 focus:ring-0 appearance-none pr-2"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button 
                      onClick={() => completeNote(note.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-black/[0.04] hover:bg-black/[0.08] rounded-xl text-stone-500 hover:text-green-700 transition-all group/btn"
                    >
                      <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Complete</span>
                    </button>

                    <button 
                      onClick={() => completeNote(note.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-12 right-12 h-20 w-20 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100]"
      >
        <Plus size={32} />
      </button>

      {/* NEW NOTE DIALOG POPUP */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if(!isListening) setShowModal(false); }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative z-10 space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-serif italic lowercase">New Desk Entry</h3>
                <button onClick={() => setShowModal(false)} className="text-stone-300 hover:text-stone-900"><X size={20}/></button>
              </div>

              {/* RECORD & DICTATION CAPTURE BOX */}
              <div className="relative bg-stone-50 rounded-xl p-4">
                <textarea 
                  autoFocus
                  className="w-full min-h-[100px] bg-transparent text-xl font-serif italic outline-none resize-none placeholder:text-stone-200 text-stone-800 pr-10"
                  placeholder="Type notes or tap the mic to speak..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-sm transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </div>

              {/* INPUT FIELDS MATRIX WITH PROJECT DROPDOWN ACCORD */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                  <Tag size={12} className="text-stone-400 mr-2" />
                  <input 
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 placeholder:text-stone-300"
                    placeholder="CATEGORY TAG"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>

                {/* REPLACED WITH VALID SELECT DROP DOWN INTERFACE */}
                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                  <Briefcase size={12} className="text-stone-400 mr-2" />
                  <select
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer appearance-none"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  >
                    <option value="">Assign Project...</option>
                    {projectsList.map((pName, idx) => (
                      <option key={idx} value={pName}>{pName}</option>
                    ))}
                    <option value="Internal Development">Internal Development</option>
                    <option value="Client System Management">Client System Management</option>
                    <option value="Infrastructure Audit">Infrastructure Audit</option>
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2 border border-stone-100 col-span-2">
                  <User size={12} className="text-stone-400 mr-2" />
                  <select
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Assign Team Resource...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SCHEDULER EXPANSION BLOCK FOR TIME REMINDERS */}
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <div className="flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setIsReminder(!isReminder)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                      isReminder ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-stone-50 border-stone-100 text-stone-400'
                    }`}
                  >
                    {isReminder ? <Bell size={12} /> : <BellOff size={12} />} Schedule Notification
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsUrgent(!isUrgent)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                      isUrgent ? 'bg-red-50 border-red-100 text-red-600' : 'bg-stone-50 border-stone-100 text-stone-400'
                    }`}
                  >
                    Urgent
                  </button>
                </div>

                {/* Precise Datetime Picker Field */}
                {isReminder && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center bg-amber-50/50 rounded-lg px-3 py-2 border border-amber-100/50"
                  >
                    <Calendar size={12} className="text-amber-600 mr-2" />
                    <input 
                      type="datetime-local"
                      required
                      className="bg-transparent text-[10px] font-black uppercase outline-none w-full text-stone-700"
                      value={reminderDateTime}
                      onChange={(e) => setReminderDateTime(e.target.value)}
                    />
                  </motion.div>
                )}
              </div>

              {/* PIPELINE DISPATCH OVERVIEW */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Initial Pipeline Placement:</span>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="bg-stone-50 text-[9px] font-black uppercase tracking-wider p-2 rounded-lg border border-stone-100 text-stone-700 outline-none cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <button 
                onClick={handleCreate}
                disabled={isSyncing}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-4"
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : "Pin to Desk"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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