"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  MapPin, Video, Users, Clock, Calendar as CalIcon,
  Link as LinkIcon, Shield, RefreshCw, Settings, Tag, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V9.0
 * MACBOOK 13" OPTIMIZED | DYNAMIC TAG SYSTEM
 */

interface CalendarEvent {
  id: string;
  title?: string;
  created_at: string;
  description?: string;
  location?: string;
  meeting_link?: string;
  guests?: string;
  tags?: string; // Stored as comma-separated string
  user_id: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formLocation, setFormLocation] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formGuests, setFormGuests] = useState("");
  const [formTags, setFormTags] = useState(""); // Comma separated
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id);
    setEvents(data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { syncCalendar(); }, [syncCalendar]);

  // Extract all unique tags from events
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
      const d = parseISO(e.created_at);
      const matchesDate = isValid(d) && isSameDay(d, date);
      const matchesTag = activeTagFilter === "ALL" || 
        (e.tags && e.tags.toUpperCase().includes(activeTagFilter));
      return matchesDate && matchesTag;
    });
  }, [events, activeTagFilter]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  const saveEntry = async () => {
    if (!formTitle || isSubmitting) return;
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert([{
      title: formTitle, description: formDescription, location: formLocation,
      meeting_link: formLink, guests: formGuests, tags: formTags,
      created_at: new Date(`${formDate}T${formTime}:00`).toISOString(),
      user_id: user?.id
    }]);
    if (!error) {
      setFormTitle(""); setFormTags(""); setIsModalOpen(false); syncCalendar();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="h-screen bg-[#F9F9F7] text-stone-900 font-sans p-6 lg:p-10 flex flex-col overflow-hidden relative">
      
      {/* SETTINGS OVERLAY */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-4xl z-[1001] p-10 border-l border-stone-100"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-serif italic">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X size={20}/></button>
            </div>
            <div className="space-y-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
              <p className="hover:text-stone-900 cursor-pointer">Profile Configuration</p>
              <p className="hover:text-stone-900 cursor-pointer">Database Sync Status</p>
              <p className="hover:text-stone-900 cursor-pointer">System Preferences</p>
              <div className="pt-6 border-t border-stone-50">
                <button onClick={() => supabase.auth.signOut()} className="text-red-400">Terminate Session</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATION/VIEW MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/5 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-4xl overflow-hidden flex flex-col">
               <div className="p-8 pb-4 flex justify-between items-center">
                 <h2 className="text-2xl font-serif italic">{viewMode === 'CREATE' ? 'Establish Entry' : 'Entry Intel'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full"><X size={18}/></button>
               </div>
               
               <div className="p-8 pt-2 space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                 {viewMode === 'CREATE' ? (
                   <>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Title" className="w-full bg-stone-50 rounded-xl p-4 text-sm outline-none border-none ring-1 ring-stone-100" />
                    <div className="flex gap-2">
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="flex-1 bg-stone-50 rounded-xl p-4 text-xs font-bold outline-none border-none" />
                    </div>
                    <div className="relative">
                      <Tag size={14} className="absolute left-4 top-4 text-stone-300" />
                      <input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="Tags (Urgent, Uni, Work...)" className="w-full bg-stone-50 rounded-xl p-4 pl-10 text-xs outline-none border-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Location" className="bg-stone-50 rounded-xl p-4 text-xs outline-none border-none" />
                      <input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Meeting Link" className="bg-stone-50 rounded-xl p-4 text-xs outline-none border-none" />
                    </div>
                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Notes..." className="w-full bg-stone-50 rounded-xl p-4 text-xs h-24 outline-none border-none resize-none" />
                    <button onClick={saveEntry} className="w-full bg-stone-900 text-[#A3B18A] py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Establish Entry"}
                    </button>
                   </>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent?.tags?.split(',').map(t => (
                          <span key={t} className="px-2 py-1 bg-[#A3B18A]/10 text-[#A3B18A] text-[8px] font-black rounded-md uppercase">{t.trim()}</span>
                        ))}
                      </div>
                      <h3 className="text-3xl font-serif italic leading-none">{selectedEvent?.title}</h3>
                      <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-xs text-stone-500">
                        {selectedEvent?.location && <p className="flex items-center gap-2"><MapPin size={12}/> {selectedEvent.location}</p>}
                        {selectedEvent?.meeting_link && <a href={selectedEvent.meeting_link} target="_blank" className="flex items-center gap-2 text-[#A3B18A] font-bold"><Video size={12}/> Join Interface</a>}
                      </div>
                      <p className="text-xs text-stone-400 italic">"{selectedEvent?.description || "No description."}"</p>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="flex items-end justify-between mb-8">
        <h1 className="text-[clamp(4rem,8vw,7.5rem)] font-serif italic text-stone-800 leading-[0.8] lowercase tracking-tighter">
          {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
        </h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-stone-100 shadow-sm mb-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={20} className="text-stone-400"/></button>
          <div className="w-px h-6 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={20} className="text-stone-400"/></button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* CALENDAR SECTION */}
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
              const isCurrent = isSameMonth(day, currentMonth);

              return (
                <div key={day.toISOString()} onClick={() => handleDayClick(day)}
                  className={`relative min-h-[100px] p-4 border-r border-b border-stone-50 transition-all cursor-pointer group
                    ${!isCurrent ? 'bg-stone-50/10 opacity-10' : 'bg-white hover:bg-[#FDFDFB]'}
                    ${isSameDay(day, selectedDay) ? 'bg-[#A3B18A]/5' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black mb-2
                    ${isToday ? 'bg-stone-900 text-[#A3B18A]' : 'text-stone-200 group-hover:text-stone-800'}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                        className="px-2 py-1 rounded-lg bg-stone-50 border border-stone-100 text-[7px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] transition-all"
                      >
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SIDEBAR SECTION */}
        <aside className="lg:col-span-4 bg-white rounded-[3rem] border border-stone-100 shadow-3xl p-8 flex flex-col overflow-hidden relative">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
            <h2 className="text-5xl font-serif italic text-stone-800 leading-[0.8] lowercase">{format(selectedDay, "do MMM")}</h2>
          </div>

          {/* DYNAMIC TAG DROPDOWN */}
          <div className="relative mb-6 z-[100]">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className="w-full p-4 bg-stone-50 rounded-2xl flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-all"
            >
              <div className="flex items-center gap-3">
                <Tag size={14} className={activeTagFilter !== 'ALL' ? 'text-[#A3B18A]' : ''} />
                Filter: {activeTagFilter}
              </div>
              <ChevronDown size={14} className={isFilterOpen ? 'rotate-180 transition-all' : 'transition-all'} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-4xl border border-stone-100 overflow-hidden"
                >
                  {allTags.map(tag => (
                    <div key={tag} onClick={() => { setActiveTagFilter(tag); setIsFilterOpen(false); }}
                      className="p-4 text-[8px] font-black uppercase tracking-widest hover:bg-[#A3B18A] hover:text-white cursor-pointer transition-all border-b border-stone-50 last:border-0"
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
                className="p-5 rounded-3xl bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-1">
                    {e.tags?.split(',').slice(0, 1).map(t => (
                      <span key={t} className="text-[7px] font-black text-[#A3B18A] uppercase">{t.trim()}</span>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-stone-300">{format(parseISO(e.created_at), "HH:mm")}</span>
                </div>
                <p className="text-[11px] font-black text-stone-800 uppercase truncate">{e.title}</p>
              </div>
            ))}
            {getDayEvents(selectedDay).length === 0 && (
              <div className="py-20 text-center opacity-10 grayscale">
                <Shield size={40} className="mx-auto mb-2" />
                <p className="text-[8px] font-black uppercase tracking-widest">Protocol Clear</p>
              </div>
            )}
          </div>

          <button onClick={() => handleDayClick(selectedDay)}
            className="w-full bg-stone-900 text-[#A3B18A] py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 mt-6 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Establish Entry</span>
          </button>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="mt-6 flex justify-between items-center opacity-50 px-2">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">TOTS OS Infrastructure v9.0.1</p>
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