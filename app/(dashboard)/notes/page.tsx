"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Suspense,
  useRef
} from "react";
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

  useEffect(() => {
    if (isOver) {
      console.log("OVER COLUMN:", id);
    }
  }, [isOver, id]);

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
  const orgIdRef = useRef<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const commentsByNoteId = useRef<Record<string, any[]>>({});
  const [activeComments, setActiveComments] = useState<Record<string, any[]>>({});
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const fetchProjects = useCallback(async (orgId?: string) => {
  try {
    if (!orgId) return;

    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("organisation_id", orgId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Projects fetch error:", error);
      return;
    }

    setProjectsList(data || []);
  } catch (e) {
    console.error("Error fetching projects:", e);
  }
}, []);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Input States
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("ALL");
  const [selectedColorFilter, setSelectedColorFilter] = useState("ALL");
  const [tagColor, setTagColor] = useState("#A9B897");
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});

  // Custom Metadata Fields
  const [project, setProject] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [isReminder, setIsReminder] = useState(false);
  const [status, setStatus] = useState("todo");
  const [visibility, setVisibility] = useState("private");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Voice Note State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Expanded note state for click-to-expand cards
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [lastViewed, setLastViewed] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, { userId: string; type: string }[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [notePresence, setNotePresence] = useState<Record<string, string[]>>({});
  const presenceChannelRef = useRef<any>(null);
  const [cursorPositions, setCursorPositions] = useState<Record<string, Record<string, { x: number; y: number }>>>({});
  const cursorChannelRef = useRef<any>(null);
  const [selectionPositions, setSelectionPositions] = useState<
    Record<string, Record<string, { start: number; end: number }>>
  >({});
  const selectionChannelRef = useRef<any>(null);
  const contentChannelRef = useRef<any>(null);
  const noteOpsChannelRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const initRef = useRef(false);
  const typingChannelRef = useRef<any>(null);
  const [noteOps, setNoteOps] = useState<Record<string, any[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tots-note-tag-colors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setTagColorMap(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read tag colors", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tots-note-tag-colors", JSON.stringify(tagColorMap));
    } catch (e) {
      console.warn("Failed to persist tag colors", e);
    }
  }, [tagColorMap]);

  // Strict per-user/org/shared/assigned note visibility guard
  const canViewNote = (note: any, userId: string) => {
  if (!note || !userId) return false;

  const assigned = Array.isArray(note.assigned_to)
    ? note.assigned_to
    : note.assigned_to
      ? [note.assigned_to]
      : [];

  switch (note.visibility) {
    case "private":
      return note.user_id === userId;

    case "shared":
      return note.user_id === userId || assigned.includes(userId);

     case "assigned":
  return assigned.includes(userId);

case "org":
  return true;

default:
  return note.user_id === userId;
  }
};

   

  const fetchNotes = useCallback(async (orgId: string, userId: string) => {
  try {
    const effectiveOrgId = orgId || orgIdRef.current;

    if (!userId || !effectiveOrgId) {
      console.warn("fetchNotes skipped", { userId, effectiveOrgId });
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("organisation_id", effectiveOrgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase notes fetch error:", error);
      toast.error("Failed to load notes from server.");
      return;
    }

    const safeNotes = (data || [])
      .filter((n: any) => n && n.id)
      .filter((n: any) => canViewNote(n, userId))
      .map((n: any) => n);

    setNotes(safeNotes);


    const noteIds = safeNotes.map((n: any) => n.id);

    if (noteIds.length) {
      const { data: commentData } = await supabase
        .from("note_comments")
        .select("*")
        .in("note_id", noteIds)
        .order("created_at", { ascending: true });


      if (commentData) {
        setComments(commentData);

        const map: Record<string, any[]> = {};

        commentData.forEach((c: any) => {
          if (!map[c.note_id]) map[c.note_id] = [];
          map[c.note_id].push(c);
        });

        commentsByNoteId.current = map;
      }
    }

  } catch (e) {
    console.error("Notes Fetch Error:", e);
    toast.error("Notes load failed.");
  } finally {
    setIsLoading(false);
  }
}, []);

     

     

     

  const fetchTeamMembers = useCallback(async (orgId?: string) => {
    try {
      if (!orgId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("organisation_id", orgId)
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

  const addComment = async (noteId: string, text: string, parentId?: string) => {
    if (!text.trim() || !user?.id) return;
    if (!orgIdRef.current) {
      toast.error("Missing organisation context");
      return;
    }

    const { data: inserted, error } = await supabase
      .from("note_comments")
      .insert([
        {
          note_id: noteId,
          user_id: user.id,
          content: text.replace(/@(\w+)/g, "$1"),
          parent_id: parentId || null,
          organisation_id: orgIdRef.current,
        }
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Comment insert failed:", error);
      toast.error(error.message || "Failed to add comment");
      return;
    }

    if (inserted) {
      setComments(prev => [...prev, inserted]);
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

    if (orgIdRef.current) {
  fetchNotes(orgIdRef.current, user.id);
}
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
    const init = async () => {
      if (initRef.current) return;
      initRef.current = true;

  const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      // Get orgId for multi-tenancy
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", authUser.id)
        .maybeSingle();
      const orgId = profile?.organisation_id;

      if (!orgId) {
        console.error("Missing organisation_id for user:", authUser.id);
        return;
      }

      orgIdRef.current = orgId;
      setOrganisationId(orgId);
      await fetchTeamMembers(orgId);
if (orgId) await fetchProjects(orgId);
if (orgId) await fetchNotes(orgId, authUser.id);
// HARD RESET OLD CHANNELS (prevents realtime duplicate subscribe errors)
if (channelRef.current) {
  supabase.removeChannel(channelRef.current);
  channelRef.current = null;
}

if (typingChannelRef.current) {
  supabase.removeChannel(typingChannelRef.current);
  typingChannelRef.current = null;
}

if (presenceChannelRef.current) {
  supabase.removeChannel(presenceChannelRef.current);
  presenceChannelRef.current = null;
}

if (cursorChannelRef.current) {
  supabase.removeChannel(cursorChannelRef.current);
  cursorChannelRef.current = null;
}

if (selectionChannelRef.current) {
  supabase.removeChannel(selectionChannelRef.current);
  selectionChannelRef.current = null;
}

if (contentChannelRef.current) {
  supabase.removeChannel(contentChannelRef.current);
  contentChannelRef.current = null;
}

if (noteOpsChannelRef.current) {
  supabase.removeChannel(noteOpsChannelRef.current);
  noteOpsChannelRef.current = null;
}
if (!orgId) return;
      const mainChannel = supabase.channel(`vault_desk_${orgId}`, {
        
        config: {
          presence: { key: authUser.id }
        }
      });
      mainChannel
        .on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'notes',
  filter: `organisation_id=eq.${orgId}`
}, () => {
  if (orgIdRef.current && user?.id) {
    fetchNotes(orgIdRef.current, user.id);
  }
})
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'note_comments'
        }, (payload: any) => {
          setComments(prev => {
            const updated = [...prev, payload.new];

            const map: Record<string, any[]> = {};
            updated.forEach((c: any) => {
              if (!map[c.note_id]) map[c.note_id] = [];
              map[c.note_id].push(c);
            });

            commentsByNoteId.current = map;
            return updated;
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'note_comments'
        }, (payload: any) => {
          setComments(prev => {
            const updated = prev.map(c => c.id === payload.new.id ? payload.new : c);

            const map: Record<string, any[]> = {};
            updated.forEach((c: any) => {
              if (!map[c.note_id]) map[c.note_id] = [];
              map[c.note_id].push(c);
            });

            commentsByNoteId.current = map;
            return updated;
          });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'note_comments'
        }, (payload: any) => {
          setComments(prev => {
            const updated = prev.filter(c => c.id !== payload.old.id);

            const map: Record<string, any[]> = {};
            updated.forEach((c: any) => {
              if (!map[c.note_id]) map[c.note_id] = [];
              map[c.note_id].push(c);
            });

            commentsByNoteId.current = map;
            return updated;
          });
        })
        .on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'note_comment_reactions'
}, () => {
  if (orgIdRef.current && user?.id) {
  fetchNotes(orgIdRef.current, user.id);
}
})
        .subscribe();

      channelRef.current = mainChannel;

      const typingChannel = supabase.channel("typing-comments");

      typingChannel
        .on("broadcast", { event: "typing:start" }, ({ payload }: any) => {
          setTypingUsers(prev => ({
            ...prev,
            [payload.noteId]: (prev[payload.noteId] || 0) + 1
          }));
        })
        .on("broadcast", { event: "typing:stop" }, ({ payload }: any) => {
          setTypingUsers(prev => ({
            ...prev,
            [payload.noteId]: Math.max((prev[payload.noteId] || 1) - 1, 0)
          }));
        })
        .subscribe();

      typingChannelRef.current = typingChannel;

      const presenceChannel = supabase.channel("note_presence");

      presenceChannel
        .on("broadcast", { event: "note:view:enter" }, ({ payload }: any) => {
          setNotePresence(prev => {
            const set = new Set(prev[payload.noteId] || []);
            set.add(payload.userId);

            return {
              ...prev,
              [payload.noteId]: Array.from(set)
            };
          });
        })
        .on("broadcast", { event: "note:view:leave" }, ({ payload }: any) => {
          setNotePresence(prev => {
            const set = new Set(prev[payload.noteId] || []);
            set.delete(payload.userId);

            return {
              ...prev,
              [payload.noteId]: Array.from(set)
            };
          });
        })
        .subscribe();

      presenceChannelRef.current = presenceChannel;

      const cursorChannel = supabase.channel("note_cursor");

      cursorChannel
        .on("broadcast", { event: "note:cursor" }, ({ payload }: any) => {
          setCursorPositions(prev => {
            const noteId = payload.noteId;
            const userId = payload.userId;

            const existing = prev[noteId] || {};

            return {
              ...prev,
              [noteId]: {
                ...existing,
                [userId]: {
                  x: payload.x,
                  y: payload.y
                }
              }
            };
          });
        })
        .subscribe();

      cursorChannelRef.current = cursorChannel;

      const selectionChannel = supabase.channel("note_selection");

      selectionChannel
        .on("broadcast", { event: "note:selection" }, ({ payload }: any) => {
          setSelectionPositions(prev => {
            const noteId = payload.noteId;
            const userId = payload.userId;

            const existing = prev[noteId] || {};

            return {
              ...prev,
              [noteId]: {
                ...existing,
                [userId]: {
                  start: payload.start,
                  end: payload.end
                }
              }
            };
          });
        })
        .subscribe();

      selectionChannelRef.current = selectionChannel;

      // Content channel for note content sync
      const contentChannel = supabase.channel("note_content");

      contentChannel
        .on("broadcast", { event: "note:content" }, ({ payload }: any) => {
          const { noteId, content } = payload;

          setNotes(prev =>
            prev.map(n =>
              n.id === noteId
                ? { ...n, content }
                : n
            )
          );
        })
        .subscribe();

      contentChannelRef.current = contentChannel;

      // Phase 6: Operation-based collaboration channel (CRDT-lite layer)
      const opsChannel = supabase.channel("note_ops");

      opsChannel
        .on("broadcast", { event: "note:op" }, ({ payload }: any) => {
          const { noteId, op } = payload;

          setNoteOps(prev => {
            const existing = prev[noteId] || [];
            return {
              ...prev,
              [noteId]: [...existing, op]
            };
          });
        })
        .subscribe();

      noteOpsChannelRef.current = opsChannel;
    };
    init();
    return () => {
      if (noteOpsChannelRef.current) supabase.removeChannel(noteOpsChannelRef.current);
if (contentChannelRef.current) supabase.removeChannel(contentChannelRef.current);
if (selectionChannelRef.current) supabase.removeChannel(selectionChannelRef.current);
if (cursorChannelRef.current) supabase.removeChannel(cursorChannelRef.current);
if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
if (channelRef.current) supabase.removeChannel(channelRef.current);
};
}, []);
  
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
    const theme =
  STICKY_THEMES[user.id.charCodeAt(0) % STICKY_THEMES.length];

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error (create note):", JSON.stringify(profileError));
      }

const orgId = orgIdRef.current;
const userId = user.id;

      if (!orgId || !userId) {
        console.error("Missing organisation_id or user_id during note creation:", user.id, profileData);
        toast.error("Your account is missing an organisation or user ID. Please refresh or contact support.");
        setIsSyncing(false);
        return;
      }

     const notePayload = {
  content,
  title: title || null,
  user_id: user.id,
  organisation_id: orgId,
  color: isUrgent ? "#4f4a46" : (selectedColor || theme.bg),
  category: tag || "General",
  project: project || null,
  assigned_to: assignedTo.length > 0 ? assignedTo : null,
  due_date: isReminder && reminderDateTime ? reminderDateTime : null,
  is_reminder: isReminder,
  status,
  type: status === "todo" ? "task" : "note",
  is_urgent: isUrgent,
  visibility,
};

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Unable to authenticate request. Please sign in again.");
      }

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(notePayload)
      });

      const responseBody = await response.json();

      if (!response.ok || responseBody.error) {
        console.error("Notes API create error:", responseBody);
        throw new Error(responseBody.error || "Note creation failed");
      }

      const insertedNote = responseBody.data;
      if (!insertedNote) {
        throw new Error("No note returned from API");
      }

      const normalizedNote = {
  ...insertedNote,
  user_id: insertedNote.user_id ?? user.id,
  organisation_id: insertedNote.organisation_id ?? orgId,
  visibility: insertedNote.visibility ?? visibility,
};

      if (tag.trim()) {
        setTagColorMap(prev => ({
          ...prev,
          [tag.trim().toLowerCase()]: tagColor,
        }));
      }

setNotes(prev => [
  {
    ...normalizedNote,
    type: normalizedNote.type ?? (normalizedNote.status === "todo" ? "task" : "note"),
  },
  ...prev
]);

      if (normalizedNote.project) {
  setProjectsList(prev => {
    const exists = prev.some(
      p => p.name === normalizedNote.project
    );

    if (exists) return prev;

    return [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: normalizedNote.project
      }
    ];
  });
}

      setContent("");
      setTitle("");
      setTag("");
      setIsUrgent(false);
      setProject("");
      setAssignedTo([]);
      setReminderDateTime("");
      setIsReminder(false);
      setStatus("todo");
      setShowModal(false);
      setSelectedColor(null);
      
      const currentOrgId = orgIdRef.current ?? organisationId;
      if (currentOrgId) {
        await fetchNotes(currentOrgId, user.id);
      }
      toast.success("Note pinned to desk.");
     } catch (e) {
  console.error("Create note error:", e);

  const message =
    (e as any)?.message ||
    "Unexpected error creating note. Please try again.";

  toast.error(message);
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

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      const response = await fetch("/api/notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          id,
          organisation_id: orgIdRef.current,
          status: nextStatus,
          completed
        })
      });

      const responseBody = await response.json();

      if (!response.ok || responseBody.error) {
        console.error("Update note status error:", responseBody.error);
        toast.error(responseBody.error || "Update failed");
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
    } catch (err: any) {
      console.error("Update note status error:", err);
      toast.error(err?.message || "Update failed");
    }
  };

  const deleteNote = async (id: string) => {
    if (!id) {
      toast.error("Invalid note ID.");
      return;
    }

    // optimistic UI update
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      const response = await fetch("/api/notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          id,
          organisation_id: orgIdRef.current,
        })
      });

      const responseBody = await response.json();

      if (!response.ok || responseBody.error) {
        console.error("Delete note error:", responseBody.error);
        toast.error(responseBody.error || "Delete failed");
        
        // rollback on error
        if (orgIdRef.current && user?.id) {
          fetchNotes(orgIdRef.current, user.id);
        }
        return;
      }

      toast.success("Note cleared.");
    } catch (err: any) {
      console.error("Delete note error:", err);
      toast.error(err?.message || "Delete failed");

      // rollback on error
      if (orgIdRef.current && user?.id) {
        fetchNotes(orgIdRef.current, user.id);
      }
    }
  };

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((n: any) => {
      if (n?.category) tags.add(String(n.category));
    });
    return ["ALL", ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, [notes]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    notes.forEach((n: any) => {
      if (n?.color) colors.add(String(n.color));
    });
    return ["ALL", ...Array.from(colors)];
  }, [notes]);

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      n?.content?.toLowerCase?.().includes(q) ||
      n?.category?.toLowerCase?.().includes(q) ||
      n?.project?.toLowerCase?.().includes(q);

    const matchesTag =
      selectedTagFilter === "ALL" ||
      String(n?.category || "").toLowerCase() === selectedTagFilter.toLowerCase();

    const noteColor = String(n?.color || "").toLowerCase();
    const matchesColor =
      selectedColorFilter === "ALL" ||
      noteColor === selectedColorFilter.toLowerCase();

    return matchesSearch && matchesTag && matchesColor;
  });

 const taskNotes = filteredNotes.filter(
  (n) => ["todo", "in_progress", "done"].includes(n.status)
);

const regularNotes = filteredNotes.filter(
  (n) => !["todo", "in_progress", "done"].includes(n.status)
);

  // DND-KIT SENSORS/HANDLERS
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const allowedStatuses = ["todo", "in_progress", "done"];

    if (!taskId || !newStatus || !allowedStatuses.includes(newStatus)) {
      toast.error("Invalid drag operation");
      return;
    }

    // optimistic UI update
    setNotes(prev =>
      prev.map(n =>
        n.id === taskId
          ? { ...n, status: newStatus, completed: newStatus === "done" }
          : n
      )
    );

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      const response = await fetch("/api/notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          id: taskId,
          organisation_id: orgIdRef.current,
          status: newStatus,
          completed: newStatus === "done",
        })
      });

      const responseBody = await response.json();

      console.log("DRAG UPDATE RESULT:", { data: responseBody.data, error: responseBody.error });

      if (!response.ok || responseBody.error) {
        console.error("Drag update failed:", responseBody.error);
        toast.error(responseBody.error || "Failed to update task");

        // rollback on failure
        if (orgIdRef.current && user?.id) {
          fetchNotes(orgIdRef.current, user.id);
        }
        return;
      }

      const updatedNote = responseBody.data;
      if (!updatedNote) {
        console.error("Drag update returned no rows (possible RLS issue)");
        toast.error("Update blocked by server rules");

        if (orgIdRef.current && user?.id) {
          fetchNotes(orgIdRef.current, user.id);
        }
        return;
      }

      // Sync UI with API response
      setNotes(prev =>
        prev.map(n =>
          n.id === taskId
            ? { ...n, ...updatedNote }
            : n
        )
      );

      toast.success("Task moved");
    } catch (err: any) {
      console.error("Unexpected drag error:", err);
      toast.error(err?.message || "Unexpected error");

      if (orgIdRef.current && user?.id) {
        fetchNotes(orgIdRef.current, user.id);
      }
    }
  };

  const saveNoteEdits = async (noteId: string, updates: { content: string; project?: string | null }) => {
    if (!noteId || !orgIdRef.current || !user?.id) {
      toast.error("Unable to save note");
      return false;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      const response = await fetch("/api/notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          id: noteId,
          organisation_id: orgIdRef.current,
          content: updates.content,
          project: updates.project ?? null,
        }),
      });

      const body = await response.json();
      if (!response.ok || body.error) {
        throw new Error(body.error || "Failed to save note changes");
      }

      if (body.data) {
        setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, ...body.data } : n)));
      }

      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to save note");
      return false;
    }
  };



  const renderNoteCard = (note: any) => {
  const assignedIds = Array.isArray(note.assigned_to)
    ? note.assigned_to
    : note.assigned_to
      ? [note.assigned_to]
      : [];

  const assignedTeamMembers = teamMembers.filter(m =>
    assignedIds.includes(m.id)
  );
  const assignedLead = assignedTeamMembers[0] || null;
    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
        exit={{ opacity: 0, scale: 0.5, rotate: "10deg" }}
        whileHover={{ scale: 1.02, rotate: "0deg", zIndex: 50 }}
        className={`p-3 lg:p-5 min-h-[260px] lg:min-h-[320px] w-full min-w-0 md:max-w-[380px] flex flex-col justify-between shadow-sticky relative group transition-all duration-300 border border-black/[0.015] rounded-sm ${note.is_urgent ? 'text-white' : 'text-stone-800'}`}
        style={{
  background:
    note.color && note.color !== "undefined"
      ? note.color
      : "#FFF9E6"
}}
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
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${tagColorMap[String(note.category || "").toLowerCase()] || "#00000010"}`,
                color: note.is_urgent ? "#fff" : "#374151",
              }}
            >
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

          {note.title && (
  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
    {note.title}
  </p>
)}

<p className="text-base lg:text-xl font-serif italic leading-snug tracking-tight mb-4 lg:mb-6 line-clamp-4 break-words whitespace-pre-wrap">
  {note.content}
</p>
        </div>

        {/* BOTTOM METADATA PINNED CONTAINER */}
        <div className="space-y-4 mt-auto">
          {/* CONTEXT DATA HOOKS */}
          {(note.project || assignedLead || note.due_date) && (
            <div className="space-y-2 pt-3 border-t border-black/[0.05] opacity-80">
              {note.project && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                  <Briefcase size={11} className="opacity-40" />
                  <span className="truncate">Project: {note.project}</span>
                </div>
              )}
              {assignedLead && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                  <User size={11} className="opacity-40" />
                  <span className="truncate">Lead: {assignedLead.name}</span>
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
  value={note.status}
  onChange={(e) => updateNoteStatus(note.id, e.target.value)}
  onClick={(e) => e.stopPropagation()}
  onPointerDown={(e) => e.stopPropagation()}
  className={`text-[9px] font-black uppercase bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none text-right pr-1 ${
    note.is_urgent ? 'text-white font-bold' : 'text-stone-700'
  }`}
>
                {["todo", "in_progress", "done"].includes(note.status) ? (
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

            <div className="flex items-center gap-2">
              {/* CLEAR / COMPLETE ACTION */}
              
                <button
  onClick={(e) => {
    e.stopPropagation();
    deleteNote(note.id);
  }}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shadow-sm ${note.is_urgent
                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    : 'bg-white/70 border-black/[0.05] hover:bg-white text-stone-700 hover:text-green-700'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Clear</span>
              </button>

              {/* DELETE ICON BUTTON */}
              <button
  onClick={(e) => {
    e.stopPropagation();
    deleteNote(note.id);
  }}
  className={`flex items-center justify-center h-8 w-8 rounded-full transition-all border border-transparent
    hover:scale-105 active:scale-95 ${
                  note.is_urgent
                    ? 'hover:bg-white/10 text-white/60 hover:text-white'
                    : 'hover:bg-red-50 text-stone-400 hover:text-red-600'
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

  // Prevent UI from rendering notes when organisation is missing (fix “notes showing for everyone” root symptom)
  if (!organisationId && !orgIdRef.current) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400 font-serif italic">
        Missing organisation context. Please refresh or log in again.
      </div>
    );
  }

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
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-wider text-stone-500"
            >
              {availableTags.map((tagValue: string) => (
                <option key={tagValue} value={tagValue}>
                  Tag: {tagValue}
                </option>
              ))}
            </select>

            <select
              value={selectedColorFilter}
              onChange={(e) => setSelectedColorFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-wider text-stone-500"
            >
              <option value="ALL">Color: ALL</option>
              {availableColors.filter((c: string) => c !== "ALL").map((colorValue: string) => (
                <option key={colorValue} value={colorValue}>
                  {colorValue}
                </option>
              ))}
            </select>
          </div>
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
                  (t: any) => t.status === statusKey
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
              projectsList={projectsList}
              commentsByNoteId={commentsByNoteId.current}
              reactions={reactions}
              addComment={addComment}
              addReaction={addReaction}
              onSaveNoteEdits={saveNoteEdits}
              setExpandedNote={setExpandedNote}
              user={user}
              typingChannel={typingChannelRef.current}
              typingUsers={typingUsers}
              notePresence={notePresence}
              presenceChannel={presenceChannelRef.current}
              cursorPositions={cursorPositions}
              cursorChannel={cursorChannelRef.current}
              selectionPositions={selectionPositions}
              selectionChannel={selectionChannelRef.current}
              contentChannel={contentChannelRef.current}
              noteOpsChannel={noteOpsChannelRef.current}
              noteOps={noteOps}
            />
          </div>
        </section>

      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 h-16 w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 z-[100] border border-white/10 backdrop-blur-md"
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
                <input
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Optional title..."
  className="w-full mb-3 bg-transparent text-sm font-black uppercase tracking-widest text-stone-500 outline-none placeholder:text-stone-300"
/>
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

                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100">
                  <Tag size={12} className="text-stone-400 mr-2" />
                  <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 mr-2">Tag Color</label>
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="h-7 w-10 rounded border border-stone-200 bg-transparent p-0"
                  />
                </div>

                {/* PROJECT SELECTION DROP DOWN */}
                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100">
                  <Briefcase size={12} className="text-stone-400 mr-2" />
                  <select
  className="bg-transparent..."
  value={project}
  onChange={(e) => setProject(e.target.value)}
>
  <option value="">No project</option>

  {projectsList.map((projectItem) => (
    <option key={projectItem.id} value={projectItem.name}>
      {projectItem.name}
    </option>
  ))}
</select>
                </div>

                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100 col-span-2">
                  <User size={12} className="text-stone-400 mr-2" />
                  <select
                    multiple
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer"
                    value={assignedTo}
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

                <div className="flex items-center bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100 col-span-2">
                  <Tag size={12} className="text-stone-400 mr-2" />
                  <select
                    className="bg-transparent text-[9px] font-black uppercase outline-none w-full text-stone-700 cursor-pointer"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="private">Private</option>
                    <option value="org">Organisation</option>
                    <option value="shared">Shared</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </div>
              </div>

              {/* STICKY NOTE COLOR SELECTOR */}
<div className="flex flex-wrap gap-2 pt-2 pb-1">
  <button
    type="button"
    onClick={() => setSelectedColor(null)}
    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
      selectedColor === null
        ? "bg-stone-900 text-white border-stone-900"
        : "bg-stone-50 text-stone-500 border-stone-200"
    }`}
  >
    Auto
  </button>

  {STICKY_THEMES.map((theme) => (
    <button
      key={theme.bg}
      type="button"
      onClick={() => setSelectedColor(theme.bg)}
      className={`w-6 h-6 rounded-full border transition-all ${
        selectedColor === theme.bg
          ? "border-stone-900 scale-110"
          : "border-stone-200"
      }`}
      style={{ backgroundColor: theme.bg }}
    />
  ))}
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
  projectsList,
  commentsByNoteId,
  reactions,
  addComment,
  addReaction,
  onSaveNoteEdits,
  setExpandedNote,
  user,
  typingChannel,
  typingUsers,
  notePresence,
  presenceChannel,
  cursorPositions,
  cursorChannel,
  selectionPositions,
  selectionChannel,
  contentChannel,
  noteOps,
  noteOpsChannel,
}: any) => {

  if (!note) return null;

  const [draftContent, setDraftContent] = useState(note?.content || "");
  const [projectValue, setProjectValue] = useState(note?.project || "");
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [subTaskInput, setSubTaskInput] = useState("");
  const [blocks, setBlocks] = useState(
    (note?.content || "").split("\n").map((text: string, idx: number) => ({
      id: `${note?.id}-block-${idx}`,
      text
    }))
  );

  useEffect(() => {
    const lines = (note.content || "").split("\n");

    setDraftContent(note.content);
    setProjectValue(note.project || "");

    setBlocks(
      lines.map((text: string, idx: number) => ({
        id: `${note.id}-block-${idx}`,
        text
      }))
    );
  }, [note?.id, note?.content]);

  const parsedSubTasks = useMemo(() => {
    return (draftContent || "")
      .split("\n")
      .map((line: string) => {
        const trimmed = line.trim();
        const done = /^-\s\[[xX]\]\s+/.test(trimmed);
        const todo = /^-\s\[\s\]\s+/.test(trimmed);
        if (!done && !todo) return null;
        return {
          raw: line,
          text: trimmed.replace(/^-\s\[[xX\s]\]\s+/, ""),
          done,
        };
      })
      .filter(Boolean) as Array<{ raw: string; text: string; done: boolean }>;
  }, [draftContent]);

  const toggleSubTask = (targetRaw: string) => {
    const lines = (draftContent || "").split("\n");
    const updated = lines.map((line: string) => {
      if (line !== targetRaw) return line;
      if (/^-\s\[[xX]\]\s+/.test(line.trim())) {
        return line.replace(/^-\s\[[xX]\]\s+/, "- [ ] ");
      }
      return line.replace(/^-\s\[\s\]\s+/, "- [x] ");
    });
    setDraftContent(updated.join("\n"));
  };

  const addSubTaskLine = () => {
    const value = subTaskInput.trim();
    if (!value) return;
    const next = `${draftContent?.trim() ? `${draftContent}\n` : ""}- [ ] ${value}`;
    setDraftContent(next);
    setSubTaskInput("");
  };

  const presentIds = notePresence?.[note.id] || [];
  const presentMembers = teamMembers?.filter((m: any) => presentIds.includes(m.id)) || [];

  const noteComments = (commentsByNoteId?.[note.id] || []);

  const opsFeed = (noteOps?.[note.id] || []).slice(-20).map((op: any, idx: number) => ({
    id: `op-${idx}`,
    content: `${op.type} (${op.blockId || op.index})`,
    created_at: op.timestamp || Date.now()
  }));

  const activityFeed = [
    {
      id: "created",
      content: "Task created",
      created_at: note.created_at || Date.now()
    },
    ...opsFeed,
    ...noteComments.map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at || Date.now()
    }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => {
    if (!presenceChannel || !user?.id || !note?.id) return;

    const interval = setInterval(() => {
      presenceChannel.send({
        type: "broadcast",
        event: "note:view:heartbeat",
        payload: {
          noteId: note.id,
          userId: user.id
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [note?.id]);

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
      onClick={() => setExpandedNote(null)}
    >
      <motion.div
        onClick={(e: any) => e.stopPropagation()}
        className="relative w-full max-w-2xl p-6 lg:p-10 rounded-2xl shadow-2xl bg-white overflow-y-auto max-h-[90vh]"
      >
        <div className="absolute inset-0 pointer-events-none">
          {(cursorPositions?.[note.id] || {}) &&
            Object.entries(cursorPositions[note.id] || {}).map(([userId, pos]: any) => (
              <div
                key={userId}
                className="absolute w-2 h-2 rounded-full bg-blue-500 opacity-70"
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`
                }}
              />
            ))}
        </div>
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

        <div className="space-y-3">
          {blocks.map((block: any, idx: number) => (
            <textarea
              key={block.id}
              value={block.text}
              onChange={(e) => {
                const newBlocks = [...blocks];
                newBlocks[idx] = {
                  ...newBlocks[idx],
                  text: e.target.value
                };

                setBlocks(newBlocks);

                const joined = newBlocks.map(b => b.text).join("\n");
                setDraftContent(joined);

                // broadcast full content (backwards compatible)
                contentChannel?.send({
                  type: "broadcast",
                  event: "note:content",
                  payload: {
                    noteId: note.id,
                    content: joined
                  }
                });

                // Phase 7: block-ID based op system (upgrade from index-based)
                noteOpsChannel?.send({
                  type: "broadcast",
                  event: "note:op",
                  payload: {
                    noteId: note.id,
                    op: {
                      type: "update_block_v2",
                      blockId: block.id,
                      index: idx,
                      value: e.target.value,
                      timestamp: Date.now(),
                      userId: user?.id
                    }
                  }
                });
              }}
              className="w-full min-h-[80px] text-2xl lg:text-3xl font-serif italic whitespace-pre-wrap outline-none bg-transparent border-b border-stone-100"
            />
          ))}
        </div>

        <div className="mt-6 space-y-2 text-[10px] uppercase font-black text-stone-500">
          <div className="flex items-center gap-2">
            <span>Project:</span>
            <select
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-[10px] font-black uppercase text-stone-600"
            >
              <option value="">No project</option>
              {(projectsList || []).map((projectItem: any) => (
                <option key={projectItem.id} value={projectItem.name}>
                  {projectItem.name}
                </option>
              ))}
            </select>
          </div>
          {projectValue && <p>Current: {projectValue}</p>}
          {note.due_date && <p>Due: {format(new Date(note.due_date), "MMM d, p")}</p>}
        </div>

        <div className="mt-4 border-t pt-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-stone-400">Sub Tasks</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {parsedSubTasks.map((sub: { raw: string; text: string; done: boolean }, idx: number) => (
              <button
                key={`${sub.raw}-${idx}`}
                onClick={() => toggleSubTask(sub.raw)}
                className="w-full text-left text-[11px] px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 text-stone-700"
              >
                {sub.done ? "[x]" : "[ ]"} {sub.text}
              </button>
            ))}
            {parsedSubTasks.length === 0 && (
              <p className="text-[10px] text-stone-400">No subtasks yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={subTaskInput}
              onChange={(e) => setSubTaskInput(e.target.value)}
              placeholder="Add sub task..."
              className="flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={addSubTaskLine}
              className="px-3 py-2 bg-stone-900 text-white text-xs rounded-full font-black uppercase tracking-wider"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={async () => {
              setIsSavingEdits(true);
              const ok = await onSaveNoteEdits(note.id, {
                content: draftContent,
                project: projectValue || null,
              });
              setIsSavingEdits(false);
              if (ok) {
                toast.success("Note updated");
              }
            }}
            className="w-full bg-stone-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all"
          >
            {isSavingEdits ? "Saving..." : "Save Note Changes"}
          </button>
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
          {notePresence?.[note.id]?.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex -space-x-2">
                  {presentMembers.slice(0, 5).map((m: any) => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-stone-200 border border-white flex items-center justify-center text-[9px] font-black uppercase text-stone-600"
                      title={m.name}
                    >
                      {m.name?.[0] || "U"}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[10px] font-black uppercase text-green-600">
                {presentMembers.length} viewing now
              </div>
            </div>
          )}

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
                  {c.content && c.content.includes("@") && (
                    <p className="text-[10px] text-stone-400 mt-1">
                      Mentions active
                    </p>
                  )}
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

          <CommentBox
            noteId={note.id}
            addComment={addComment}
            typingChannel={typingChannel}
            user={user}
            typingUsers={typingUsers}
          />
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
const CommentBox = ({ noteId, addComment, typingChannel, user, typingUsers }: any) => {
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1 mt-2">
      {/* global typing state */}
      {(typingUsers?.[noteId] || 0) > 0 && (
        <p className="text-[10px] text-stone-400 mb-1">Someone is typing...</p>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            typingChannel?.send({
              type: "broadcast",
              event: "typing:start",
              payload: {
                noteId,
                userId: user?.id
              }
            });

            // auto stop after inactivity window
            setTimeout(() => {
              typingChannel?.send({
                type: "broadcast",
                event: "typing:stop",
                payload: {
                  noteId,
                  userId: user?.id
                }
              });
            }, 1200);

            if (typingChannel && user?.id) {
              typingChannel.send({
                type: "broadcast",
                event: "note:cursor",
                payload: {
                  noteId,
                  userId: user.id,
                  x: 0,
                  y: 0
                }
              });
            }
          }}
          onBlur={() => {
            typingChannel?.send({
              type: "broadcast",
              event: "typing:stop",
              payload: {
                noteId,
                userId: user?.id
              }
            });
          }}
          placeholder="Write a comment..."
          className="flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={() => {
            addComment(noteId, text, replyTo || undefined);
            setReplyTo(null);
            setText("");
          }}
          className="px-3 py-2 bg-stone-900 text-white text-xs rounded-full font-black uppercase tracking-wider hover:bg-stone-800 active:scale-95 transition-all shadow-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};