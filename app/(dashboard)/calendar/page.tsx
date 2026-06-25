"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  MapPin, Video, Shield, RefreshCw, Settings, Tag, ChevronDown, Paperclip, Link, Users, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V11.0
 * MACBOOK 13" OPTIMIZED | COLOR-CODED TAG PROTOCOL
 */

interface CalendarEvent {
  id: string;
  title?: string;
  created_at?: string;
  description?: string;
  location?: string;
  meeting_link?: string;
  guests?: string;
  tags?: string;

  user_id: string;

  startAt?: Date | null;
  endAt?: Date | null;
  repeat?: string;
}

const TAG_PALETTE = [
  { bg: "bg-[#A3B18A]/15", text: "text-[#6B705C]" }, 
  { bg: "bg-stone-900", text: "text-[#A3B18A]" },   
  { bg: "bg-[#D6D6D2]", text: "text-stone-800" },   
  { bg: "bg-amber-100", text: "text-amber-700" },   
  { bg: "bg-blue-100", text: "text-blue-700" },     
  { bg: "bg-rose-100", text: "text-rose-700" },     
];

const getTagStyle = (tag: string) => {
  const index = tag.length % TAG_PALETTE.length;
  return TAG_PALETTE[index];
};

export default function Calendar() {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState("ALL");
  const [activeColorFilter, setActiveColorFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE' | 'EDIT'>('CREATE');

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formRepeat, setFormRepeat] = useState("none");
  const [formLocation, setFormLocation] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formGuests, setFormGuests] = useState("");
  const [formInternalTeam, setFormInternalTeam] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formTagColor, setFormTagColor] = useState("#A3B18A");
  const [formDescription, setFormDescription] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tots-calendar-tag-colors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setTagColorMap(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed reading calendar tag colors", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tots-calendar-tag-colors", JSON.stringify(tagColorMap));
    } catch (e) {
      console.warn("Failed persisting calendar tag colors", e);
    }
  }, [tagColorMap]);

  const normaliseEvent = useCallback((e: any): CalendarEvent => {
    const raw = e?.start_time || e?.start_at || e?.created_at;

    return {
      ...e,
      startAt: raw && isValid(new Date(raw)) ? new Date(raw) : null,
      endAt: (e?.end_time || e?.end_at) && isValid(new Date(e?.end_time || e?.end_at))
        ? new Date(e?.end_time || e?.end_at)
        : null,
    };
  }, []);

  const resolveTagStyle = useCallback((tag: string) => {
    const key = String(tag || "").trim().toLowerCase();
    const custom = tagColorMap[key];
    if (custom) {
      return { bg: "", text: "text-stone-800", customBg: custom };
    }
    const fallback = getTagStyle(tag || "");
    return { ...fallback, customBg: null as string | null };
  }, [tagColorMap]);

  const dedupeById = (items: any[]) => {
  const map = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    map.set(item.id, item);
  }
  return Array.from(map.values());
};

  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUser(user);
      setCurrentProfile(profile);

      // Fetch events
      const eventsPromise = supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id);

      // Fetch tasks created by the user
      const tasksOwnedPromise = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      // Fetch tasks assigned to the user (many-to-one fix)
      const tasksAssignedPromise = supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id);

      // Fetch notes created by the user
      const notesOwnedPromise = supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id);

      // Fetch notes assigned to the user (many-to-one fix)
      const notesAssignedPromise = supabase
        .from("notes")
        .select("*")
        .eq("assigned_to", user.id);

      const [eventsRes, tasksOwnedRes, tasksAssignedRes, notesOwnedRes, notesAssignedRes] = await Promise.all([
        eventsPromise,
        tasksOwnedPromise,
        tasksAssignedPromise,
        notesOwnedPromise,
        notesAssignedPromise,
      ]);

      const { data: data, error } = eventsRes;
      const { data: tasksOwned } = tasksOwnedRes;
      const { data: tasksAssigned } = tasksAssignedRes;
      const { data: notesOwned, error: notesOwnedError } = notesOwnedRes;
const { data: notesAssigned, error: notesAssignedError } = notesAssignedRes;

if (notesOwnedError) {
  console.warn("Notes owned fetch error:", notesOwnedError);
}

if (notesAssignedError) {
  console.warn("Notes assigned fetch error:", notesAssignedError);
}

      const safeNotesOwned = notesOwned || [];
      const safeNotesAssigned = notesAssigned || [];

      if (error) {
        console.error("SYNC CALENDAR ERROR:", error);
        setError(error.message || "Failed to sync calendar");
        setIsLoading(false);
        return;
      }

      const taskMap = new Map();

[...(tasksOwned || []), ...(tasksAssigned || [])]
  .filter(Boolean)
  .forEach((t: any) => {
    taskMap.set(t.id, t);
  });

const taskRows = Array.from(taskMap.values());

      const normalisedTasks = taskRows
        // filter out nulls and duplicates by task id
        .filter(Boolean)
        .map((t: any) => {
          const startRaw =
  t?.due_date ||
  t?.start_time ||
  t?.created_at ||
  null;
          return {
            ...t,
            id: `task-${t.id}`,
            title: t.title || t.name || "Task",
            description: t.description || t.content || "",
            tags: t.tags || "",
            user_id: t.user_id || t.assigned_to || user.id,
            startAt: startRaw && isValid(new Date(startRaw)) ? new Date(startRaw) : null,
            endAt: null,
          } as CalendarEvent;
        });

      // Normalise notes (show notes that have dates like due_date or created_at)
      const noteMap = new Map();

      [...(safeNotesOwned || []), ...(safeNotesAssigned || [])]
        .filter(Boolean)
        .forEach((n: any) => {
          noteMap.set(n.id, n);
        });

      const noteRows = Array.from(noteMap.values());
      const normalisedNotes = noteRows
        .filter(Boolean)
        .map((n: any) => {
          const startRaw =
  n?.due_date ||
  n?.start_time ||
  n?.created_at ||
  null;
          const title = (n.content && String(n.content).slice(0, 80)) || n.title || n.category || "Note";
          return {
            ...n,
            id: `note-${n.id}`,
            title,
            description: n.content || n.description || "",
            tags: n.tags || n.category || "",
            user_id: n.user_id || n.assigned_to || user.id,
            startAt: startRaw && isValid(new Date(startRaw)) ? new Date(startRaw) : null,
            endAt: null,
          } as CalendarEvent;
        });

      const normalisedEvents = (data || []).map(normaliseEvent);

      // Combine, preferring real events over task placeholders if ids clash
      // Combine events, tasks and notes. Real events first so they take precedence.
      const combinedRaw = [
  ...normalisedEvents,
  ...normalisedTasks,
  ...normalisedNotes
];

// 1. dedupe within each type + across merged dataset
const combined = dedupeById(combinedRaw);

// 2. final sort (optional but recommended)
combined.sort((a, b) => {
  const aTime = a.startAt?.getTime?.() ?? 0;
  const bTime = b.startAt?.getTime?.() ?? 0;
  return aTime - bTime;
});

setEvents(combined);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Sync error:", err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncCalendar();
  }, []);



  const allTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(e => {
      if (e.tags) e.tags.split(',').forEach(t => tags.add(t.trim().toUpperCase()));
    });
    return ["ALL", ...Array.from(tags)];
  }, [events]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    events.forEach(e => {
      const firstTag = e.tags?.split(",")?.[0]?.trim()?.toLowerCase();
      if (firstTag && tagColorMap[firstTag]) {
        colors.add(tagColorMap[firstTag].toUpperCase());
      }
    });
    return ["ALL", ...Array.from(colors)];
  }, [events, tagColorMap]);

  const daysGrid = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  }), [currentMonth]);

  const getDayEvents = useCallback((date: Date) => {
  return events.filter(e => {
    const start = e.startAt;

    if (!(start instanceof Date) || isNaN(start.getTime())) return false;

    // IMPORTANT: treat single-day events as same-day range
    const end =
      e.endAt && isValid(e.endAt)
        ? e.endAt
        : start;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Google Calendar-style overlap check
    const matchesDate =
      start <= dayEnd &&
      end >= dayStart;

    const matchesTag =
      activeTagFilter === "ALL" ||
      (e.tags && e.tags.toUpperCase().includes(activeTagFilter));

    const firstTag = e.tags?.split(",")?.[0]?.trim()?.toLowerCase();
    const mappedColor = firstTag ? (tagColorMap[firstTag] || "") : "";
    const matchesColor =
      activeColorFilter === "ALL" ||
      mappedColor.toUpperCase() === activeColorFilter.toUpperCase();

    return matchesDate && matchesTag && matchesColor;
  });
}, [events, activeTagFilter, activeColorFilter, tagColorMap]);
  const eventSpans = useMemo(() => {
    return events
      .filter(e => e.startAt && isValid(e.startAt))
      .map(e => {
        const start = e.startAt!;
        const end = e.endAt && isValid(e.endAt) ? e.endAt : start;

       const startIndex = daysGrid.findIndex(d => isSameDay(d, start) || d >= start);
const endIndex = [...daysGrid]
  .map((d, i) => ({ d, i }))
  .filter(x => x.d >= start && x.d <= end)
  .at(-1)?.i ?? startIndex;

        return {
          ...e,
          startIndex,
          endIndex: endIndex === -1 ? startIndex : endIndex,
        };
      })
      .filter(e => e.startIndex !== -1);
  }, [events, daysGrid]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setFormTitle("");
    setFormDescription("");
    setFormTags("");
    setFormLocation("");
    setFormLink("");
    setFormGuests("");
    setFormInternalTeam("");
    setAttachedFileName(null);
    setViewMode('CREATE');
    setIsModalOpen(true);
    setFormEndDate("");
setFormEndTime("");
setFormRepeat("none");
    setFormTagColor("#A3B18A");
  };

  const startEditEntry = () => {
    if (!selectedEvent) return;

    setFormTitle(selectedEvent.title || "");
    setFormDescription(selectedEvent.description || "");
    setFormLocation(selectedEvent.location || "");
    setFormLink(selectedEvent.meeting_link || "");
    setFormGuests(selectedEvent.guests || "");
    setFormTags(selectedEvent.tags || "");
    setFormDate(selectedEvent.startAt ? format(selectedEvent.startAt, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setFormTime(selectedEvent.startAt ? format(selectedEvent.startAt, "HH:mm") : "09:00");
    setFormEndDate(selectedEvent.endAt ? format(selectedEvent.endAt, "yyyy-MM-dd") : "");
    setFormEndTime(selectedEvent.endAt ? format(selectedEvent.endAt, "HH:mm") : "");
    setViewMode("EDIT");

    const firstTag = selectedEvent.tags?.split(",")?.[0]?.trim()?.toLowerCase();
    setFormTagColor(firstTag && tagColorMap[firstTag] ? tagColorMap[firstTag] : "#A3B18A");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const deleteEvent = async (eventId: string) => {
  if (!confirm("Delete this item?")) return;

  setIsDeleting(true);

  setEvents(prev => prev.filter(e => e.id !== eventId));
  setSelectedEvent(null);
  setIsModalOpen(false);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      await syncCalendar();
      return;
    }

    // TASKS
    if (String(eventId).startsWith("task-")) {
      const taskId = String(eventId).replace("task-", "");

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("DELETE FAILED (tasks):", error);
        setError(error.message || "Failed to delete task");
        await syncCalendar();
      }

    // NOTES
    } else if (String(eventId).startsWith("note-")) {
      const noteId = String(eventId).replace("note-", "");

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (error) {
        console.error("DELETE FAILED (notes):", error);
        setError(error.message || "Failed to delete note");
        await syncCalendar();
      }

    // EVENTS (real UUIDs only)
    } else {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) {
        console.error("DELETE FAILED (events):", error);
        setError(error.message || "Failed to delete event");
        await syncCalendar();
      }
    }
  } catch (err) {
    console.error("Delete error:", err);
    await syncCalendar();
  } finally {
    setIsDeleting(false);
  }
};
  const saveEntry = async () => {
    if (!formTitle || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // New user/auth logic
      const authResult = currentUser
        ? { data: { user: currentUser } }
        : await supabase.auth.getUser();

      const authUser = authResult?.data?.user;

      if (!authUser) {
        setError("No authenticated user.");
        setIsSubmitting(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
      }

      const startISO = new Date(`${formDate}T${formTime}:00`).toISOString();

      const endISO =
        formEndDate && formEndTime
          ? new Date(`${formEndDate}T${formEndTime}:00`).toISOString()
          : null;

      const combinedDescription =
        `${formDescription}
        ${formInternalTeam ? `\n\n[Internal Team: ${formInternalTeam}]` : ""}
        ${attachedFileName ? `\n[Attachment: ${attachedFileName}]` : ""}`;

      const enteredTags = (formTags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (enteredTags.length > 0) {
        setTagColorMap(prev => {
          const next = { ...prev };
          enteredTags.forEach((t) => {
            next[t.toLowerCase()] = formTagColor;
          });
          return next;
        });
      }

      // Use cached user/profile when available to avoid extra network calls
      // Resolve user for the eventual insert (do not await before showing temp event)
      const resolvedUser = authUser;
      const orgId = currentProfile?.organisation_id ?? profile?.organisation_id ?? null;

      if (viewMode === "EDIT" && selectedEvent) {
        if (String(selectedEvent.id).startsWith("task-")) {
          const taskId = String(selectedEvent.id).replace("task-", "");
          const { error: taskError } = await supabase
            .from("tasks")
            .update({
              title: formTitle,
              description: formDescription,
              due_date: startISO,
              tags: formTags,
            })
            .eq("id", taskId);

          if (taskError) {
            throw taskError;
          }
        } else if (String(selectedEvent.id).startsWith("note-")) {
          const noteId = String(selectedEvent.id).replace("note-", "");
          if (!orgId) {
            throw new Error("Missing organisation context");
          }

          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !sessionData?.session?.access_token) {
            throw new Error("Unable to authenticate note update");
          }

          const response = await fetch("/api/notes", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              id: noteId,
              organisation_id: orgId,
              content: formDescription || formTitle,
              due_date: startISO,
              category: formTags || undefined,
            }),
          });

          const body = await response.json();
          if (!response.ok || body.error) {
            throw new Error(body.error || "Failed to update note");
          }
        } else {
          const { error: eventUpdateError } = await supabase
            .from("events")
            .update({
              title: formTitle,
              description: combinedDescription,
              location: formLocation,
              meeting_link: formLink,
              guests: formGuests,
              tags: formTags,
              start_time: startISO,
              end_time: endISO,
              repeat: formRepeat,
            })
            .eq("id", selectedEvent.id)
            .eq("user_id", authUser.id);

          if (eventUpdateError) {
            throw eventUpdateError;
          }
        }

        await syncCalendar();
        setIsModalOpen(false);
        setViewMode("VIEW");
        return;
      }

      // Create a temporary optimistic event and show it immediately
      const tempId = `temp-${Date.now()}`;
      const tempEvent: CalendarEvent = {
        id: tempId,
        title: formTitle,
        description: combinedDescription,
        location: formLocation,
        meeting_link: formLink,
        guests: formGuests,
        tags: formTags,
        user_id: authUser.id,
        startAt: startISO ? new Date(startISO) : null,
        endAt: endISO ? new Date(endISO) : null,
        repeat: formRepeat,
      };

      setEvents(prev => [tempEvent, ...prev]);
      // close modal immediately for snappy UX
      setIsModalOpen(false);

      // Perform the insert in background; replace temp item on success or rollback on failure
      try {
        const { data: insertedEvent, error: insertError } = await supabase
          .from("events")
          .insert([
            {
              title: formTitle,
              description: combinedDescription,
              location: formLocation,
              meeting_link: formLink,
              guests: formGuests,
              tags: formTags,
              start_time: startISO,
              end_time: endISO,
              repeat: formRepeat,
              user_id: resolvedUser?.id || null,
              organisation_id: orgId,
              source: "calendar"
            }
          ])
          .select("*")
          .maybeSingle();

        if (insertError) {
          console.error("EVENT SAVE FAILED:", insertError);
          setError(insertError.message || "Failed to save event");
          // rollback optimistic
          setEvents(prev => prev.filter(e => e.id !== tempId));
        } else if (insertedEvent) {
          const newEvent = normaliseEvent(insertedEvent);
          setEvents(prev => prev.map(e => e.id === tempId ? newEvent : e));
        }
      } catch (err) {
        console.error("Save error:", err);
        setEvents(prev => prev.filter(e => e.id !== tempId));
      } finally {
        setFormTitle("");
        setFormDescription("");
        setFormTags("");
        setFormGuests("");
        setFormInternalTeam("");
        setFormEndDate("");
        setFormEndTime("");
        setFormRepeat("none");
        setAttachedFileName(null);
      }

    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans p-3 sm:p-4 lg:p-10 flex flex-col relative overflow-x-hidden">
      {error && (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black z-[2000]">
    {error}
  </div>
)}
      {/* SETTINGS OVERLAY */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed right-6 top-6 bottom-6 w-80 bg-white shadow-4xl z-[1001] rounded-[3rem] p-10 border border-stone-100 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-serif italic">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-stone-50 rounded-full"><X size={16}/></button>
            </div>
            <div className="pt-6 border-t border-stone-50 mt-auto">
  <p className="text-[9px] text-stone-300 uppercase tracking-widest">
    Event actions are available in event view
  </p>
</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/5 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-4xl overflow-hidden flex flex-col">
               <div className="p-8 pb-4 flex justify-between items-center">
                 <h2 className="text-2xl font-serif italic">{viewMode === 'CREATE' ? 'New Entry' : viewMode === 'EDIT' ? 'Edit Entry' : 'Event Name'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full"><X size={18}/></button>
               </div>
               <div className="p-4 lg:p-8 pt-2 space-y-4 overflow-y-auto max-h-[75vh] no-scrollbar">
                 {viewMode === 'CREATE' || viewMode === 'EDIT' ? (
                   <>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Title" className="w-full bg-stone-50 rounded-xl p-4 text-sm outline-none border-none ring-1 ring-stone-100" />
                    <div className="flex gap-2">
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none ring-1 ring-stone-100" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none ring-1 ring-stone-100" />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={e => setFormEndDate(e.target.value)}
                        className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none ring-1 ring-stone-100"
                      />

                      <input
                        type="time"
                        value={formEndTime}
                        onChange={e => setFormEndTime(e.target.value)}
                        className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none ring-1 ring-stone-100"
                      />
                    </div>

                    <select
                      value={formRepeat}
                      onChange={e => setFormRepeat(e.target.value)}
                      className="w-full bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none ring-1 ring-stone-100"
                    >
                      <option value="none">No Repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    
                    <div className="relative">
                      <Link size={14} className="absolute left-4 top-4 text-stone-300" />
                      <input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Virtual Meeting Link (Zoom, Teams...)" className="w-full bg-stone-50 rounded-xl p-4 pl-10 text-xs outline-none border-none ring-1 ring-stone-100" />
                    </div>

                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-4 text-stone-300" />
                      <input value={formGuests} onChange={e => setFormGuests(e.target.value)} placeholder="External Invitees (comma separated emails)" className="w-full bg-stone-50 rounded-xl p-4 pl-10 text-xs outline-none border-none ring-1 ring-stone-100" />
                    </div>

                    <div className="relative">
                      <Users size={14} className="absolute left-4 top-4 text-stone-300" />
                      <input value={formInternalTeam} onChange={e => setFormInternalTeam(e.target.value)} placeholder="Internal Team Members (@alex, @sam...)" className="w-full bg-stone-50 rounded-xl p-4 pl-10 text-xs outline-none border-none ring-1 ring-stone-100" />
                    </div>

                    <div className="relative">
                      <Tag size={14} className="absolute left-4 top-4 text-stone-300" />
                      <input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="Tags (Urgent, Uni, Work...)" className="w-full bg-stone-50 rounded-xl p-4 pl-10 text-xs outline-none border-none ring-1 ring-stone-100" />
                    </div>

                    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4 ring-1 ring-stone-100">
                      <Tag size={14} className="text-stone-300" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Tag Color</span>
                      <input
                        type="color"
                        value={formTagColor}
                        onChange={(e) => setFormTagColor(e.target.value)}
                        className="h-8 w-12 rounded border border-stone-200"
                      />
                    </div>
                    
                    <div className="w-full">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-stone-50 hover:bg-stone-100 text-stone-500 rounded-xl p-4 text-xs font-bold transition-all border border-dashed border-stone-200 flex items-center justify-center gap-2">
                        <Paperclip size={14} />
                        {attachedFileName ? `Attached: ${attachedFileName}` : "Add Attachment"}
                      </button>
                    </div>

                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Notes..." className="w-full bg-stone-50 rounded-xl p-4 text-xs h-24 outline-none border-none resize-none ring-1 ring-stone-100" />
                    <button onClick={saveEntry} className="w-full bg-stone-900 text-[#A3B18A] py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : viewMode === 'EDIT' ? "Save Changes" : "Add"}
                    </button>
                   </>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent?.tags?.split(',').map(t => {
                          const style = resolveTagStyle(t);
                          return <span key={t} className={`px-2 py-1 ${style.bg} ${style.text} text-[8px] font-black rounded-md uppercase`} style={style.customBg ? { backgroundColor: style.customBg } : undefined}>{t.trim()}</span>
                        
                        })}
                      </div>
                      <h3 className="text-3xl font-serif italic">{selectedEvent?.title}</h3>
                      <p className="text-xs text-stone-400 italic whitespace-pre-wrap">"{selectedEvent?.description || "No description provided."}"</p>
                      {selectedEvent?.meeting_link && (
                        <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                          <Video size={14} /> Join Meeting Route
                        </a>
                        
                      )}
                      <button
                        onClick={startEditEntry}
                        className="w-full mt-4 bg-stone-900 text-[#A3B18A] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all"
                      >
                        Edit Entry
                      </button>
                      <button
  onClick={() => selectedEvent && deleteEvent(selectedEvent.id)}
  disabled={isDeleting}
  className={`w-full mt-6 bg-red-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}
>
  {isDeleting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Delete Event"}
</button>

                   </div>
                   
                   
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6 lg:mb-8">
        <h1 className="text-[clamp(2.5rem,12vw,7.5rem)] font-serif italic text-stone-800 leading-[0.8] tracking-tighter capitalize">
          {format(currentMonth, "MMMM")} <span className="text-stone-300 ml-2">{format(currentMonth, "yyyy")}</span>
        </h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-stone-100 shadow-sm mb-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={20} className="text-stone-400"/></button>
          <div className="w-px h-6 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={20} className="text-stone-400"/></button>
        </div>
      </header>

      {/* CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
        <section className="lg:col-span-8 bg-white rounded-[3rem] border border-stone-100 shadow-3xl flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-4 text-center text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">{d}</div>
            ))}
          </div>
          <div className="relative grid grid-cols-7 flex-1 overflow-y-auto no-scrollbar">
            {/* MULTI-DAY EVENT BARS */}
<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
  {eventSpans.map((e) => {
    if (e.startIndex === -1 || e.endIndex === -1) return null;

    const startCol = (e.startIndex % 7) + 1;
    const endCol = (e.endIndex % 7) + 1;

    const startRow = Math.floor(e.startIndex / 7) + 1;

    const spanCols =
      e.startIndex === e.endIndex
        ? 1
        : Math.min(7 - (startCol - 1), e.endIndex - e.startIndex + 1);

    const style = resolveTagStyle(e.tags?.split(",")[0] || "");

    return (
      <div
        key={`span-${e.id}`}
          className={`absolute h-4 rounded-md ${style.bg} opacity-80`}
        style={{
        ...(style.customBg ? { backgroundColor: style.customBg } : {}),
  gridColumnStart: startCol,
  gridColumnEnd: `span ${spanCols}`,
  gridRowStart: startRow,
}}
      />
    );
  })}
</div>
            {daysGrid.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} onClick={() => handleDayClick(day)}
                  className={`relative min-h-[72px] lg:min-h-[100px] p-2 lg:p-4 border-r border-b border-stone-50 transition-all cursor-pointer group
                    ${!isSameMonth(day, currentMonth) ? 'opacity-10' : 'bg-white hover:bg-[#FDFDFB]'}
                    ${isSameDay(day, selectedDay) ? 'bg-[#A3B18A]/5' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black mb-2
                    ${isToday ? 'bg-stone-900 text-[#A3B18A]' : 'text-stone-200 group-hover:text-stone-800'}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-1">
                    {dayEvents.map(e => {
                      const primaryTag = e.tags?.split(',')[0] || '';
                      const style = primaryTag ? resolveTagStyle(primaryTag) : { bg: 'bg-stone-50', text: 'text-stone-500', customBg: null };
                      return (
                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                          className={`px-2 py-1 rounded-lg border border-stone-100 text-[7px] font-black uppercase truncate transition-all ${style.bg} ${style.text}`}
                          style={style.customBg ? { backgroundColor: style.customBg } : undefined}
                        >
                          {e.title}
                        </div>

                        
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SIDEBAR (FIXED: Added capitalize filter rule variant to header layout) */}
        <aside className="lg:col-span-4 bg-white rounded-[3rem] border border-stone-100 shadow-3xl p-8 flex flex-col overflow-hidden relative">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
            <h2 className="text-3xl lg:text-5xl font-serif italic text-stone-800 leading-[0.8] capitalize">{format(selectedDay, "do MMM")}</h2>
          </div>

          <div className="relative mb-2 z-[100]">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className="w-full p-4 bg-stone-50 rounded-2xl flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-all shadow-inner"
            >
              <div className="flex items-center gap-3">
                <Tag size={14} className={activeTagFilter !== 'ALL' ? 'text-[#A3B18A]' : ''} />
                Filter: {activeTagFilter}
              </div>
              <ChevronDown size={14} className={isFilterOpen ? 'rotate-180' : ''} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-4xl border border-stone-100 overflow-hidden"
                >
                  {allTags.map(tag => (
                    <div key={tag} onClick={() => { setActiveTagFilter(tag); setIsFilterOpen(false); }}
                      className={`p-4 text-[8px] font-black uppercase tracking-widest hover:bg-stone-50 cursor-pointer transition-all border-b border-stone-50 last:border-0 ${tag === activeTagFilter ? 'text-[#A3B18A]' : 'text-stone-400'}`}
                    >
                      {tag}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-6">
            <select
              value={activeColorFilter}
              onChange={(e) => setActiveColorFilter(e.target.value)}
              className="w-full p-4 bg-stone-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-500 border border-stone-100"
            >
              <option value="ALL">COLOR: ALL</option>
              {allColors.filter(c => c !== "ALL").map((colorValue) => (
                <option key={colorValue} value={colorValue}>
                  {colorValue}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {getDayEvents(selectedDay).map(e => (
              <div key={e.id} onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                className="p-5 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-1">
                    {e.tags?.split(',').map(t => {
                      const style = resolveTagStyle(t);
                      return <span key={t} className={`text-[7px] font-black ${style.text} uppercase`}>{t.trim()}</span>
                    })}
                  </div>
                  <span className="text-[9px] font-bold text-stone-300">{e.startAt && isValid(e.startAt) ? format(e.startAt, "HH:mm") : ""}</span>
                </div>
                <p className="text-[11px] font-black text-stone-800 uppercase truncate group-hover:text-[#A3B18A] transition-colors">{e.title}</p>
              </div>
            ))}
            {getDayEvents(selectedDay).length === 0 && (
              <div className="py-20 text-center opacity-10">
                <Shield size={40} className="mx-auto mb-2" />
                <p className="text-[8px] font-black uppercase tracking-widest">Calendar Clear</p>
              </div>
            )}
          </div>

          <button onClick={() => handleDayClick(selectedDay)}
            className="w-full bg-stone-900 text-[#A3B18A] py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 mt-6 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">New Entry</span>
          </button>
        </aside>
      </div>

      <footer className="mt-4 lg:mt-6 flex flex-col gap-2 lg:flex-row justify-between items-center opacity-50 px-2">
        <div className="flex gap-4 text-stone-300">
          <RefreshCw size={14} onClick={syncCalendar} className={`cursor-pointer ${isLoading ? 'animate-spin' : ''}`} />
          <Settings size={14} onClick={() => setIsSettingsOpen(true)} className="cursor-pointer hover:text-stone-800 transition-all" />
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-3xl { box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.08); }
        .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.15); }
      `}</style>
    </div>
  );
}