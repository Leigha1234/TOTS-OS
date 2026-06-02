"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Trash2, Search, Loader2, Plus, X, 
  CheckCircle2, Tag, AlertCircle, Calendar, User, Briefcase, Mic, MicOff, Bell, BellOff, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * TOTS OS | THE VAULT (V12.0)
 * DESIGN: EXPANDED FAT PARCHMENT CARDS WITH STABLE FOOTER ALIGNMENT
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

  // Custom Metadata Fields
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
      const { data, error, status, statusText } = await supabase
        .from("notes")
        .select("id, content, user_id, color, category, is_urgent, project, assigned_to, due_date, is_reminder, status, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase notes fetch error:", {
          error,
          status,
          statusText,
          userId,
        });
        throw new Error(error.message || `Notes fetch failed (${status})`);
      }
      setNotes(data || []);

      if (data) {
        const uniqueProjects = Array.from(
          new Set(data.map((n: any) => n.project).filter(Boolean))
        ) as string[];
        setProjectsList(uniqueProjects);
      }
    } catch (e) {
      console.error("Notes Fetch Error:", e);
      toast.error((e as any)?.message || "Could not load the notes.");
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
      if (error) {
        console.error("Team fetch error:", error);
        return;
      }

      if (data) setTeamMembers(data);
    } catch (e) {
      console.error("Error fetching team:", e);
    }
  }, []);

  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchNotes(authUser.id);
      await fetchTeamMembers();
      
      channel = supabase.channel("vault_desk")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes(authUser.id))
        .subscribe();
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchNotes, fetchTeamMembers]);
  
  // Speech Recognition Initializer
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
      toast.error("Voice framework unsupported on this web engine.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      toast.success("System mic open...");
    }
  };

  const handleCreate = async () => {
    if (!content.trim() || !user) return;
    setIsSyncing(true);
    const theme = STICKY_THEMES[notes.length % STICKY_THEMES.length];

    try {
      const { error, status: responseStatus, statusText } = await supabase.from("notes").insert([{
        content,
        user_id: user.id,
        color: isUrgent ? "#4f4a46" : theme.bg, 
        category: tag || "General",
        is_urgent: isUrgent,
        project: project || null,
        assigned_to: assignedTo || null,
        due_date: isReminder && reminderDateTime ? new Date(reminderDateTime).toISOString() : null,
        is_reminder: isReminder,
        status,
        metadata: { rotation: theme.rotation }
      }]);

      if (error) {
        console.error("Supabase note insert error:", {
          error,
          status: responseStatus,
          statusText,
          payload: {
            content,
            user_id: user.id,
            category: tag || "General",
            project,
            assigned_to: assignedTo,
            due_date: reminderDateTime,
            is_reminder: isReminder,
            status,
          }
        });
        throw new Error(error.message || `Insert failed (${responseStatus})`);
      }
      
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
      console.error("Create note error:", e);
      toast.error((e as any)?.message || "Failed to pin note.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateNoteStatus = async (id: string, nextStatus: string) => {
    if (!id || !nextStatus) {
      toast.error("Invalid note update.");
      return;
    }
    const { error, status, statusText } = await supabase
      .from("notes")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      console.error("Update note status error:", {
        error,
        status,
        statusText,
        noteId: id,
        nextStatus,
      });
      toast.error(error.message || `Update failed (${status})`);
      return;
    }

    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: nextStatus } : n));
    toast.success(`Note updated.`);
  };

  const deleteNote = async (id: string) => {
    if (!id) {
      toast.error("Invalid note ID.");
      return;
    }
    const { error, status, statusText } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete note error:", {
        error,
        status,
        statusText,
        noteId: id,
      });
      toast.error(error.message || `Delete failed (${status})`);
      return;
    }

    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success("Note cleared.");
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
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .shadow-sticky {
          box-shadow: 
            0px 4px 6px rgba(0, 0, 0, 0.01),
            0px 16px 32px rgba(79, 74, 70, 0.06),
            inset 0px -6px 12px rgba(0, 0, 0, 0.01);
        }
      `}</style>
      
      {/* HEADER */}
      <header className="max-w-[1400px] mx-auto p-12 flex justify-between items-end">
        <div>
          <h1 className="text-8xl font-serif italic tracking-tighter capitalize leading-none text-[#4f4a46]">Notes</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mt-4 ml-1">Your Digital Notepad</p>
        </div>
        <div className="relative group w-64">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
          <input 
            className="w-full bg-transparent border-b border-stone-200 py-2 pl-7 outline-none font-serif italic text-xl focus:border-stone-900 transition-all text-stone-800 placeholder:text-stone-300"
            placeholder="Search the desk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* THE DESK GRID - RESPONSIVE AUTO-FIT WITH LARGER BASE CARDS */}
      <main className="max-w-[1600px] mx-auto px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-start">
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
                // NOTE CONTAINER EXPANDED WIDER ("FATTER") TO ACCLAIM ALL METADATA DROPDOWNS
                className={`p-8 min-h-[460px] w-full min-w-[340px] md:max-w-[380px] flex flex-col justify-between shadow-sticky relative group transition-all duration-300 border border-black/[0.015] rounded-sm ${
                  note.is_urgent ? 'text-white' : 'text-stone-800'
                }`}
                style={{ background: note.color || "#FFF9E6" }}
              >
                {/* PARCHMENT TAPE ACCENT */}
                <div className="absolute top-[-9px] left-1/2 -translate-x-1/2 w-28 h-6 bg-white/45 backdrop-blur-sm border border-white/20 z-10 rounded-sm" />
                
                {/* UPPER CONTENT AREA */}
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                      {note.category || 'General'}
                    </span>
                    <div className="flex items-center gap-2">
                      {note.is_reminder && <Clock size={11} className={note.is_urgent ? "text-amber-300" : "text-stone-400 animate-pulse"} />}
                      {note.is_urgent && <AlertCircle size={13} className="text-red-400 animate-pulse" />}
                    </div>
                  </div>

                  <p className="text-3xl font-serif italic leading-snug tracking-tight mb-6 line-clamp-[6] break-words whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                {/* BOTTOM METADATA PINNED CONTAINER */}
                <div className="space-y-4 mt-auto">
                  {/* CONTEXT DATA HOOKS */}
                  {(note.project || assignedTeamMember || note.due_date) && (
                    <div className="space-y-2 pt-3 border-t border-black/[0.05] opacity-80">
                      {note.project && (
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                          <Briefcase size={11} className="opacity-40" /> 
                          <span className="truncate">Project: {note.project}</span>
                        </div>
                      )}
                      {assignedTeamMember && (
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                          <User size={11} className="opacity-40" /> 
                          <span className="truncate">Lead: {assignedTeamMember.name}</span>
                        </div>
                      )}
                      {note.due_date && (
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-amber-900/80">
                          <Calendar size={11} className="opacity-50" /> 
                          <span>Alert: {format(new Date(note.due_date), "MMM d, p")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTROL GRID LAYER */}
                  <div className="pt-3 border-t border-black/[0.05] space-y-3">
                    <div className="flex items-center justify-between bg-black/[0.03] px-3 py-2 rounded-xl">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Progress</span>
                      <select 
                        value={note.status || "todo"}
                        onChange={(e) => updateNoteStatus(note.id, e.target.value)}
                        className={`text-[9px] font-black uppercase bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none text-right pr-1 ${
                          note.is_urgent ? 'text-white font-bold' : 'text-stone-700'
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          note.is_urgent 
                            ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' 
                            : 'bg-white/60 border-black/[0.03] hover:bg-white text-stone-700 hover:text-green-700'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>Clear</span>
                      </button>

                      <button 
                        onClick={() => deleteNote(note.id)} 
                        className={`p-2 rounded-lg transition-colors ${
                          note.is_urgent ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-red-50 text-stone-400 hover:text-red-500'
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
                <h3 className="text-3xl font-serif italic lowercase text-[#4f4a46]">New Note</h3>
                <button onClick={() => setShowModal(false)} className="text-stone-300 hover:text-stone-900"><X size={20}/></button>
              </div>

              {/* RECORD & DICTATION CAPTURE BOX */}
              <div className="relative bg-stone-50 rounded-xl p-4">
                <textarea 
                  autoFocus
                  className="w-full min-h-[110px] bg-transparent text-xl font-serif italic outline-none resize-none placeholder:text-stone-200 text-stone-800 pr-10"
                  placeholder="Type notes or tap mic to dictate architecture..."
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

              {/* DYNAMIC DROPDOWN MATRIX OVERLAY */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100">
                  <Tag size={12} className="text-stone-400 mr-2" />
                  <input 
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 placeholder:text-stone-300"
                    placeholder="CATEGORY TAG"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>

                {/* PROJECT SELECTION DROP DOWN */}
                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100">
                  <Briefcase size={12} className="text-stone-400 mr-2" />
                  <select
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer appearance-none bg-[none]"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  >
                    <option value="">Assign Project...</option>
                    {projectsList.map((pName, idx) => (
                      <option key={idx} value={pName}>{pName}</option>
                    ))}
                    <option value="project">Project</option>
                  </select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100 col-span-2">
                  <User size={12} className="text-stone-400 mr-2" />
                  <select
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Assign Team Member...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TIMED REMINDER SCHEDULER */}
              <div className="space-y-2.5 border-t border-stone-100 pt-4">
                <div className="flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setIsReminder(!isReminder)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                      isReminder ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-stone-50 border-stone-100 text-stone-400'
                    }`}
                  >
                    {isReminder ? <Bell size={12} /> : <BellOff size={12} />} Set Reminder Alert
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

                {isReminder && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }} 
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
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Initial Note Placement:</span>
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