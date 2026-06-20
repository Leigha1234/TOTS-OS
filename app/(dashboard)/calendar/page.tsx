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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');
  
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
  const [formDescription, setFormDescription] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const normaliseEvent = (e: any): CalendarEvent => {
    const raw = e?.start_time || e?.start_at || e?.created_at;

    return {
      ...e,
      startAt: raw && isValid(new Date(raw)) ? new Date(raw) : null,
      endAt: (e?.end_time || e?.end_at) && isValid(new Date(e?.end_time || e?.end_at)) ? new Date(e?.end_time || e?.end_at) : null,
    };
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

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("SYNC CALENDAR ERROR:", error);
        setError(error.message || "Failed to sync calendar");
        setIsLoading(false);
        return;
      }

      setEvents((data || []).map(normaliseEvent));
      setIsLoading(false);
    } catch (err: any) {
      console.error("Sync error:", err);
      setIsLoading(false);
    }
  }, [normaliseEvent]);

  useEffect(() => {
    syncCalendar();
  }, [syncCalendar]);



  const allTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(e => {
      if (e.tags) e.tags.split(',').forEach(t => tags.add(t.trim().toUpperCase()));
    });
    return ["ALL", ...Array.from(tags)];
  }, [events]);

  const daysGrid = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  }), [currentMonth]);

  const getDayEvents = useCallback((date: Date) => {
    return events.filter(e => {
      const d = e.startAt;
      const matchesDate = d && isValid(d) && isSameDay(d, date);
      const matchesTag =
        activeTagFilter === "ALL" ||
        (e.tags && e.tags.toUpperCase().includes(activeTagFilter));

      return matchesDate && matchesTag;
    });
  }, [events, activeTagFilter]);

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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      if (!confirm("Delete this event?")) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: eventError } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (eventError) {
        console.error("DELETE FAILED (events):", eventError);
        setError(eventError.message || "Failed to delete event");
        return;
      }

      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      setIsModalOpen(false);

      await syncCalendar();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const saveEntry = async () => {
    if (!formTitle || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("No logged in user");
        setIsSubmitting(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
      }

      const startISO = new Date(
        `${formDate}T${formTime}:00`
      ).toISOString();

      const endISO =
        formEndDate && formEndTime
          ? new Date(`${formEndDate}T${formEndTime}:00`).toISOString()
          : null;

      const combinedDescription =
        `${formDescription}
        ${formInternalTeam ? `\n\n[Internal Team: ${formInternalTeam}]` : ""}
        ${attachedFileName ? `\n[Attachment: ${attachedFileName}]` : ""}`;

      const { error } = await supabase
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
            user_id: user.id,
            organisation_id: profile?.organisation_id || null,
            source: "calendar"
          }
        ]);

      if (error) {
        console.error("EVENT SAVE FAILED:", error);
        setError(error.message || "Failed to save event");
        setIsSubmitting(false);
        return;
      }

      setFormTitle("");
      setFormDescription("");
      setFormTags("");
      setFormGuests("");
      setFormInternalTeam("");
      setFormEndDate("");
      setFormEndTime("");
      setFormRepeat("none");
      setAttachedFileName(null);

      setIsModalOpen(false);

      await syncCalendar();

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
                 <h2 className="text-2xl font-serif italic">{viewMode === 'CREATE' ? 'New Entry' : 'Event Name'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full"><X size={18}/></button>
               </div>
               <div className="p-4 lg:p-8 pt-2 space-y-4 overflow-y-auto max-h-[75vh] no-scrollbar">
                 {viewMode === 'CREATE' ? (
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
                    
                    <div className="w-full">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-stone-50 hover:bg-stone-100 text-stone-500 rounded-xl p-4 text-xs font-bold transition-all border border-dashed border-stone-200 flex items-center justify-center gap-2">
                        <Paperclip size={14} />
                        {attachedFileName ? `Attached: ${attachedFileName}` : "Add Attachment"}
                      </button>
                    </div>

                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Notes..." className="w-full bg-stone-50 rounded-xl p-4 text-xs h-24 outline-none border-none resize-none ring-1 ring-stone-100" />
                    <button onClick={saveEntry} className="w-full bg-stone-900 text-[#A3B18A] py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Add"}
                    </button>
                   </>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent?.tags?.split(',').map(t => {
                          const style = getTagStyle(t);
                          return <span key={t} className={`px-2 py-1 ${style.bg} ${style.text} text-[8px] font-black rounded-md uppercase`}>{t.trim()}</span>
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
  onClick={() => selectedEvent && deleteEvent(selectedEvent.id)}
  className="w-full mt-6 bg-red-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
>
  Delete Event
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
          <div className="grid grid-cols-7 flex-1 overflow-y-auto no-scrollbar">
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
                    {dayEvents.slice(0, 3).map(e => {
                      const primaryTag = e.tags?.split(',')[0] || '';
                      const style = primaryTag ? getTagStyle(primaryTag) : { bg: 'bg-stone-50', text: 'text-stone-500' };
                      return (
                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                          className={`px-2 py-1 rounded-lg border border-stone-100 text-[7px] font-black uppercase truncate transition-all ${style.bg} ${style.text}`}
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

          <div className="relative mb-6 z-[100]">
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

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {getDayEvents(selectedDay).map(e => (
              <div key={e.id} onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                className="p-5 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-1">
                    {e.tags?.split(',').map(t => {
                      const style = getTagStyle(t);
                      return <span key={t} className={`text-[7px] font-black ${style.text} uppercase`}>{t.trim()}</span>
                    })}
                  </div>
                  <span className="text-[9px] font-bold text-stone-300">{e.startAt ? format(e.startAt, "HH:mm") : ""}</span>
                </div>
                <p className="text-[11px] font-black text-stone-800 uppercase truncate group-hover:text-[#A3B18A] transition-colors">{e.title}</p>
              </div>
            ))}
            {getDayEvents(selectedDay).length === 0 && (
              <div className="py-20 text-center opacity-10">
                <Shield size={40} className="mx-auto mb-2" />
                <p className="text-[8px] font-black uppercase tracking-widest">Protocol Clear</p>
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
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">TOTS OS Infrastructure v11.0</p>
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