"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable
} from "@dnd-kit/core";
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

// DND-KIT COLUMN DROPPABLE
const TaskColumn = ({ id, children }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 p-2 rounded-xl transition-all ${isOver ? "bg-stone-100" : ""}`}
    >
      {children}
    </div>
  );
};

// DND-KIT DRAGGABLE TASK
const DraggableTask = ({ task, children }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
};

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
  const [comments, setComments] = useState<any[]>([]);
  const [activeComments, setActiveComments] = useState<Record<string, any[]>>({});
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
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [isReminder, setIsReminder] = useState(false);
  const [status, setStatus] = useState("todo");

  // Voice Note State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Expanded note state for click-to-expand cards
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [lastViewed, setLastViewed] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, { userId: string; type: string }[]>>({});

  const fetchNotes = useCallback(async (_userId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user?.id) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.organisation_id) {
        console.error("Profile org fetch error:", profileError);
        toast.error("Unable to load organisation data.");
        setNotes([]);
        setIsLoading(false);
        return;
      }

      const orgId = profile.organisation_id;

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("organisation_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase notes fetch error:", error);
        toast.error("Failed to load notes from server.");
        throw error;
      }

      setNotes(
        (data || []).map((n: any) => ({
          ...n,
          type: n.type ?? (n.status === "todo" ? "task" : "note")
        }))
      );

      const uniqueProjects = Array.from(
        new Set(
          (data || [])
            .map((n: any) => n?.project)
            .filter((p: any) => typeof p === "string" && p.trim())
        )
      ) as string[];

      setProjectsList(uniqueProjects);

      // fetch all comments for organisation notes
      const noteIds = (data || []).map((n: any) => n.id).filter(Boolean);

      if (noteIds.length) {
        const { data: commentData } = await supabase
          .from("note_comments")
          .select("*")
          .in("note_id", noteIds)
          .order("created_at", { ascending: true });

        if (commentData) {
          setComments(commentData);
        }
      }
    } catch (e) {
      console.error("Notes Fetch Error:", e);
      toast.error("Notes load failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("name", { ascending: true });
      if (error) {
        console.error("Team fetch error:", error);
        return;
      }
      if (data) {
        setTeamMembers(
          data.map((u: any) => ({
            ...u,
            email: u.email || null
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching team:", e);
    }
  }, []);

  const resolveMentions = (text: string) => {
    const matches = text.match(/@(\w+)/g) || [];

    return matches
      .map(m => m.replace("@", "").toLowerCase())
      .map(name =>
        teamMembers.find(
          (u: any) => u.name?.toLowerCase() === name
        )
      )
      .filter(Boolean);
  };

  const addComment = async (noteId: string, text: string) => {
    if (!text.trim() || !user?.id) return;

    const { error } = await supabase
      .from("note_comments")
      .insert([
        {
          note_id: noteId,
          user_id: user.id,
          content: text.replace(/@(\w+)/g, "$1")
        }
      ]);

    if (error) {
      toast.error("Failed to add comment");
      return;
    }

    const mentionedUsers = resolveMentions(text);

    if (mentionedUsers.length > 0) {
      for (const u of mentionedUsers) {
        // 1. Persist notification (OS layer)
        await supabase.from("notifications").insert([
          {
            user_id: u.id,
            type: "mention",
            message: `${user?.email || "Someone"} mentioned you in a task`,
            note_id: noteId,
            read: false,
            created_at: new Date().toISOString()
          }
        ]);

        // 2. Email dispatch (Kernel layer bridge)
        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              to: u.email,
              subject: "You were mentioned in TOTS-OS",
              message: text,
              context: {
                noteId,
                from: user?.email
              }
            }
          });
        } catch (e) {
          console.error("Email dispatch failed:", e);
        }
      }

      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          type: "mention",
          message: `Mention sent to ${mentionedUsers.length} user(s)`,
          created_at: Date.now()
        }
      ]);
    }

    fetchNotes(user.id);
  };

  const addReaction = async (commentId: string, type: string = "like") => {
    if (!user?.id) return;

    try {
      setReactions(prev => {
        const existing = prev[commentId] || [];
        const already = existing.find(r => r.userId === user.id);

        if (already) return prev;

        return {
          ...prev,
          [commentId]: [...existing, { userId: user.id, type }]
        };
      });

      // Optional persistence layer (safe assume table exists)
      await supabase.from("note_comment_reactions").insert([
        {
          comment_id: commentId,
          user_id: user.id,
          type
        }
      ]);
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'note_comments' }, () => fetchNotes(authUser.id))
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
    if (!content.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }
    setIsSyncing(true);
    const theme = STICKY_THEMES[notes.length % STICKY_THEMES.length];

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.organisation_id) {
        console.error("Missing organisation_id for user:", user.id);
        toast.error("Unable to determine your organisation. Please contact support.");
        setIsSyncing(false);
        return;
      }

      const orgId = profileData.organisation_id;

      const { error, status: responseStatus, statusText } = await supabase
        .from("notes")
        .insert([
          {
            content,
            user_id: user.id,
            organisation_id: orgId,
            color: isUrgent ? "#4f4a46" : theme.bg,
            category: tag || "General",
            project: project || null,
            assigned_to: assignedTo.length ? assignedTo : null,
            due_date: isReminder && reminderDateTime ? reminderDateTime : null,
            is_reminder: isReminder,
            status,
            is_urgent: isUrgent,
            type: status === "todo" ? "task" : "note",
          },
        ]);

      if (!orgId) {
        console.error("Insert aborted: missing orgId");
        toast.error("Missing organisation context. Cannot create note.");
        setIsSyncing(false);
        return;
      }

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
      setAssignedTo([]);
      setReminderDateTime("");
      setIsReminder(false);
      setStatus("todo");
      setShowModal(false);
      
      toast.success("Note pinned to desk.");
      fetchNotes(user.id);
    } catch (e) {
      toast.error("Unexpected error creating note. Please try again.");
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
    const completed = nextStatus === "done";

    const { error, status, statusText } = await supabase
      .from("notes")
      .update({
  status: nextStatus,
  completed
})
      .eq("id", id)
      .select();

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

    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, status: nextStatus, completed: nextStatus === "done" }
          : n
      )
    );
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
      .eq("id", id)
      .select();

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

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n?.content?.toLowerCase?.().includes(q) ||
      n?.category?.toLowerCase?.().includes(q) ||
      n?.project?.toLowerCase?.().includes(q)
    );
  });

  const taskNotes = filteredNotes.filter(
    (n) => n.type === "task"
  );

  const regularNotes = filteredNotes.filter(
    (n) => n.type === "note"
  );

  // DND-KIT SENSORS/HANDLERS
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (!taskId || !newStatus) return;

    // update UI immediately
    setNotes(prev =>
      prev.map(n =>
        n.id === taskId
          ? { ...n, status: newStatus, completed: newStatus === "done" }
          : n
      )
    );

    // persist to Supabase
    const { error } = await supabase
      .from("notes")
      .update({ status: newStatus, completed: newStatus === "done" })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task status");
      console.error(error);
    } else {
      toast.success("Task moved");
    }
  };



  const renderNoteCard = (note: any) => {
    const assignedTeamMember = teamMembers.find(m => m.id === note.assigned_to);
    // Only return the normal card (non-expanded version)
    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
        exit={{ opacity: 0, scale: 0.5, rotate: "10deg" }}
        whileHover={{ scale: 1.02, rotate: "0deg", zIndex: 50 }}
        className={`p-3 lg:p-5 min-h-[260px] lg:min-h-[320px] w-full min-w-0 md:max-w-[380px] flex flex-col justify-between shadow-sticky relative group transition-all duration-300 border border-black/[0.015] rounded-sm ${note.is_urgent ? 'text-white' : 'text-stone-800'}`}
        style={{ background: note.color || '#FFF9E6' }}
        onClick={() => {
          setExpandedNote(note.id);
          setLastViewed(prev => ({
            ...prev,
            [note.id]: Date.now()
          }));
        }}
      >
        {/* PARCHMENT TAPE ACCENT */}
        <div className="absolute top-[-9px] left-1/2 -translate-x-1/2 w-28 h-6 bg-white/45 backdrop-blur-sm border border-white/20 z-10 rounded-sm" />

        {/* UPPER CONTENT AREA */}
        <div>
          <div className="flex justify-between items-center mb-5">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
              {note.category || 'General'}
            </span>
            {/* UNREAD INDICATOR */}
            {lastViewed[note.id] && note.updated_at && new Date(note.updated_at).getTime() > lastViewed[note.id] && (
              <span className="text-[9px] font-black uppercase text-red-500 animate-pulse">
                NEW
              </span>
            )}
            <div className="flex items-center gap-2">
              {note.is_reminder && <Clock size={11} className={note.is_urgent ? "text-amber-300" : "text-stone-400 animate-pulse"} />}
              {note.is_urgent && <AlertCircle size={13} className="text-red-400 animate-pulse" />}
            </div>
          </div>

          <p className="text-base lg:text-xl font-serif italic leading-snug tracking-tight mb-4 lg:mb-6 line-clamp-4 break-words whitespace-pre-wrap">
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
                value={note.status || (note.type === "task" ? "todo" : "active")}
                onChange={(e) => updateNoteStatus(note.id, e.target.value)}
                className={`text-[9px] font-black uppercase bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none text-right pr-1 ${
                  note.is_urgent ? 'text-white font-bold' : 'text-stone-700'
                }`}
              >
                {note.type === "task" ? (
                  <>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </>
                ) : (
                  <>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </>
                )}
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
  };

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
      <header className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-12 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end">
        <div>
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-serif italic tracking-tighter capitalize leading-none text-[#4f4a46]">Notes</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mt-4 ml-1">Your Digital Notepad</p>
        </div>
        <div className="relative group w-full lg:w-64">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
          <input 
            className="w-full bg-transparent border-b border-stone-200 py-2 pl-7 outline-none font-serif italic text-xl focus:border-stone-900 transition-all text-stone-800 placeholder:text-stone-300"
            placeholder="Search the desk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {notifications.length > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full animate-pulse">
            {notifications.length} alerts
          </div>
        )}
      </header>

      {/* THE DESK GRID - SPLIT INTO TASKS & NOTES */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 space-y-12">

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl lg:text-5xl font-serif italic text-[#4f4a46]">
                Tasks
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">
                Action Items
              </p>
            </div>
            <div className="text-[10px] font-black uppercase text-stone-400">
              {taskNotes.length} Tasks
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

              {(["todo", "in_progress", "done"] as const).map((statusKey) => {
                const columnTasks = taskNotes.filter(
                  (t: any) => (t.status || "todo") === statusKey
                );

                return (
                  <TaskColumn key={statusKey} id={statusKey}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        {statusKey.replace("_", " ")}
                      </p>
                      <span className="text-[9px] font-black uppercase text-stone-300">
                        {columnTasks.length}
                      </span>
                    </div>

                    {columnTasks.length > 0 ? (
                      columnTasks.map((note: any) => (
                        <DraggableTask key={note.id} task={note}>
                          <div className="transform hover:scale-[1.01] transition">
                            {renderNoteCard(note)}
                          </div>
                        </DraggableTask>
                      ))
                    ) : (
                      <p className="text-[9px] text-stone-300 uppercase">Empty</p>
                    )}
                  </TaskColumn>
                );
              })}

            </div>
          </DndContext>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl lg:text-5xl font-serif italic text-[#4f4a46]">
                Notes
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">
                Knowledge Base
              </p>
            </div>
            <div className="text-[10px] font-black uppercase text-stone-400">
              {regularNotes.length} Notes
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {regularNotes.map((note) => renderNoteCard(note))}
            </AnimatePresence>
            <NoteModal
              note={notes.find((n: any) => n.id === expandedNote)}
              teamMembers={teamMembers}
              comments={comments}
              reactions={reactions}
              addComment={addComment}
              addReaction={addReaction}
              setExpandedNote={setExpandedNote}
            />
          </div>
        </section>

      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 h-16 w-16 lg:h-20 lg:w-20 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100]"
      >
        <Plus size={24} />
      </button>

      {/* NEW NOTE DIALOG POPUP */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if(!isListening) setShowModal(false); }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-8 shadow-2xl relative z-10 space-y-5 max-h-[90vh] overflow-y-auto"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    multiple
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer"
                    value={assignedTo as any}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(o => o.value);
                      setAssignedTo(values);
                    }}
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
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Initial Note Placement:</span>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="bg-stone-50 text-[9px] font-black uppercase tracking-wider p-2 rounded-lg border border-stone-100 text-stone-700 outline-none cursor-pointer"
                >
                  <option value="todo">Task / To Do</option>
<option value="active">Note</option>
<option value="archived">Archived Note</option>
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

const NoteModal = ({
  note,
  teamMembers,
  comments,
  reactions,
  addComment,
  addReaction,
  setExpandedNote
}: any) => {
  if (!note) return null;

  const noteComments = comments.filter((c: any) => c.note_id === note.id);

  const activityFeed = [
    {
      id: "created",
      content: "Task created",
      created_at: note.created_at || Date.now()
    },
    ...noteComments.map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at || Date.now()
    }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
      onClick={() => setExpandedNote(null)}
    >
      <motion.div
        onClick={(e: any) => e.stopPropagation()}
        className="w-full max-w-2xl p-6 lg:p-10 rounded-2xl shadow-2xl bg-white overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black uppercase text-stone-400">
            {note.category}
          </span>
          <button
            onClick={() => setExpandedNote(null)}
            className="text-stone-400 hover:text-stone-900"
          >
            ✕
          </button>
        </div>

        <p className="text-2xl lg:text-4xl font-serif italic whitespace-pre-wrap">
          {note.content}
        </p>

        <div className="mt-6 space-y-2 text-[10px] uppercase font-black text-stone-500">
          {note.project && <p>Project: {note.project}</p>}
          {note.due_date && <p>Due: {format(new Date(note.due_date), "MMM d, p")}</p>}
        </div>

        <div className="mt-6 border-t pt-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-stone-400">Activity</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activityFeed.map((a: any) => (
              <div key={a.id} className="text-[11px] text-stone-600 flex justify-between">
                <span>{a.content}</span>
                <span className="text-[9px] text-stone-400">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t pt-4 space-y-3">
          <p className="text-[10px] font-black uppercase text-stone-400">Comments</p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {noteComments.map((c: any) => {
              const member = teamMembers.find((m: any) => m.id === c.user_id);
              return (
                <div key={c.id} className="text-sm bg-stone-50 p-2 rounded-lg">
                  <p className="text-[10px] font-black uppercase text-stone-500">
                    {member?.name || "You"}
                  </p>
                  <p className="text-stone-700">{c.content}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => addReaction(c.id, "like")}
                      className="text-[10px] font-black uppercase text-stone-400 hover:text-green-600"
                    >
                      👍 {reactions[c.id]?.length || 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <CommentBox noteId={note.id} addComment={addComment} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function VaultPage() {
  return (
    <Suspense fallback={<div />}>
      <VaultContent />
    </Suspense>
  );
}
// Standalone CommentBox component
const CommentBox = ({ noteId, addComment }: any) => {
  const [text, setText] = useState("");

  return (
    <div className="flex gap-2 mt-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none"
      />
      <button
        onClick={() => {
          addComment(noteId, text);
          setText("");
        }}
        className="px-3 py-2 bg-stone-900 text-white text-xs rounded-lg"
      >
        Send
      </button>
    </div>
  );
};