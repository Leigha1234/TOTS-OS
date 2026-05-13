"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  MapPin, Video, Users, Clock, Calendar as CalIcon,
  Link as LinkIcon, Radio, Zap, Shield, RefreshCw, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V8.0
 * NATIVE MACBOOK 13" OPTIMIZATION
 * Features: Full Event Metadata, Fluid Grid, Modal Protocol
 */

type DisplayType = 'OPERATION' | 'SIGNAL' | 'URGENT';

interface CalendarEvent {
  id: string;
  title?: string;
  subject?: string;
  created_at: string;
  scheduled_for?: string;
  description?: string;
  location?: string;
  meeting_link?: string;
  guests?: string;
  displayType: DisplayType;
  dateField: string;
}

export default function Calendar() {
  // --- STATE CORE ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  
  // --- UI STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');

  // --- FORM DATA ---
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formLocation, setFormLocation] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formGuests, setFormGuests] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- SYNC PROTOCOL ---
  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, campaignsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("campaigns").select("*").eq("user_id", user.id)
      ]);

      const combined = [
        ...(tasksRes.data || []).map(t => ({ ...t, displayType: 'OPERATION', dateField: t.created_at })),
        ...(campaignsRes.data || []).map(c => ({ ...c, displayType: 'SIGNAL', dateField: c.scheduled_for || c.created_at }))
      ] as CalendarEvent[];

      setEvents(combined);
    } catch (e) {
      console.error("Sync Error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { syncCalendar(); }, [syncCalendar]);

  // --- CALCULATIONS ---
  const daysGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayEvents = useCallback((date: Date) => {
    return events.filter(e => {
      const d = parseISO(e.dateField);
      return isValid(d) && isSameDay(d, date) && (activeFilter === 'ALL' || e.displayType === activeFilter);
    });
  }, [events, activeFilter]);

  // --- HANDLERS ---
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  const deployProtocol = async () => {
    if (!formTitle || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("tasks").insert([{
        title: formTitle,
        description: formDescription,
        location: formLocation,
        meeting_link: formLink,
        guests: formGuests,
        created_at: new Date(`${formDate}T${formTime}:00`).toISOString(),
        user_id: user.id
      }]);

      if (!error) {
        setFormTitle(""); setFormLocation(""); setFormLink(""); setFormGuests(""); setFormDescription("");
        setIsModalOpen(false);
        syncCalendar();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-[#F9F9F7] text-stone-900 font-sans p-6 lg:p-10 flex flex-col overflow-hidden">
      
      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/10 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-4xl overflow-hidden flex flex-col max-h-[90vh]">
               
               <div className="p-8 pb-4 flex justify-between items-center border-b border-stone-50">
                 <h2 className="text-2xl font-serif italic text-stone-800">
                   {viewMode === 'CREATE' ? 'New Entry' : 'Intelligence'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={18}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-5">
                 {viewMode === 'CREATE' ? (
                   <div className="space-y-4">
                      <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Identifier" className="w-full bg-stone-50 border-none rounded-xl p-4 text-sm outline-none ring-offset-0 focus:ring-1 ring-[#A3B18A]" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-stone-50 border-none rounded-xl p-4 text-xs font-bold outline-none" />
                        <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="bg-stone-50 border-none rounded-xl p-4 text-xs font-bold outline-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative flex items-center">
                          <MapPin size={14} className="absolute left-4 text-stone-300" />
                          <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Location" className="w-full bg-stone-50 border-none rounded-xl p-4 pl-10 text-xs outline-none" />
                        </div>
                        <div className="relative flex items-center">
                          <Video size={14} className="absolute left-4 text-stone-300" />
                          <input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Meeting Link" className="w-full bg-stone-50 border-none rounded-xl p-4 pl-10 text-xs outline-none" />
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <Users size={14} className="absolute left-4 text-stone-300" />
                        <input value={formGuests} onChange={e => setFormGuests(e.target.value)} placeholder="Personnel / Guests" className="w-full bg-stone-50 border-none rounded-xl p-4 pl-10 text-xs outline-none" />
                      </div>

                      <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Protocol details..." className="w-full bg-stone-50 border-none rounded-xl p-4 text-sm h-28 resize-none outline-none" />

                      <button onClick={deployProtocol} className="w-full bg-stone-900 text-white py-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Establish Protocol"}
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center">
                          {selectedEvent?.displayType === 'SIGNAL' ? <Radio size={24} className="text-[#A3B18A]" /> : <Zap size={24} className="text-stone-400" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#A3B18A]">{selectedEvent?.displayType}</p>
                          <p className="text-2xl font-serif italic text-stone-800">{selectedEvent?.title || selectedEvent?.subject}</p>
                        </div>
                      </div>
                      <div className="p-5 bg-stone-50 rounded-2xl space-y-3">
                        {selectedEvent?.location && <div className="flex items-center gap-3 text-xs"><MapPin size={14}/> {selectedEvent.location}</div>}
                        {selectedEvent?.meeting_link && <a href={selectedEvent.meeting_link} target="_blank" className="flex items-center gap-3 text-xs text-[#A3B18A] font-bold"><Video size={14}/> Join Interface</a>}
                      </div>
                      <p className="text-xs text-stone-400 italic leading-relaxed">"{selectedEvent?.description || "No specific intel provided."}"</p>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="flex items-end justify-between mb-8">
        <h1 className="text-[clamp(4rem,8vw,7rem)] font-serif italic text-stone-800 tracking-tighter leading-[0.8] lowercase">
          {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
        </h1>

        <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-stone-100 shadow-sm mb-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={20} className="text-stone-400"/></button>
          <div className="w-px h-6 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={20} className="text-stone-400"/></button>
        </div>
      </header>

      {/* --- GRID & SIDEBAR --- */}
      <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
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
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                        className="px-2 py-1 rounded-lg bg-stone-50 border border-stone-100 text-[7px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] transition-all"
                      >
                        {e.title || e.subject}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[6px] font-black text-[#A3B18A] ml-1">+{dayEvents.length - 3}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="lg:col-span-4 bg-white rounded-[3rem] border border-stone-100 shadow-3xl p-8 flex flex-col overflow-hidden">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
            <h2 className="text-5xl font-serif italic text-stone-800 leading-[0.8] lowercase">{format(selectedDay, "do MMM")}</h2>
          </div>

          <div className="flex gap-1 mb-6 p-1 bg-stone-50 rounded-full">
            {['ALL', 'OP', 'SIG'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f === 'OP' ? 'OPERATION' : f === 'SIG' ? 'SIGNAL' : 'ALL')} 
                className={`flex-1 py-3 rounded-full text-[8px] font-black uppercase tracking-widest transition-all
                ${(activeFilter === 'OPERATION' && f === 'OP') || (activeFilter === 'SIGNAL' && f === 'SIG') || (activeFilter === 'ALL' && f === 'ALL')
                  ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {getDayEvents(selectedDay).map(e => (
              <motion.div key={e.id} onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                className="p-5 rounded-3xl bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[7px] font-black text-[#A3B18A] uppercase">{e.displayType}</span>
                  <span className="text-[9px] font-bold text-stone-300 group-hover:text-stone-800">{format(parseISO(e.dateField), "HH:mm")}</span>
                </div>
                <p className="text-[11px] font-black text-stone-800 uppercase truncate">{e.title || e.subject}</p>
              </motion.div>
            ))}
            {getDayEvents(selectedDay).length === 0 && (
              <div className="py-20 text-center opacity-10">
                <Shield size={40} className="mx-auto mb-2" />
                <p className="text-[8px] font-black uppercase tracking-widest">Protocol Clear</p>
              </div>
            )}
          </div>

          <button onClick={() => handleDayClick(selectedDay)}
            className="w-full bg-stone-900 text-[#A3B18A] py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all group mt-6"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-all duration-300" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Establish Entry</span>
          </button>
        </aside>
      </div>

      <footer className="mt-6 flex justify-between items-center opacity-50 px-2">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">TOTS OS Infrastructure v8.0.2</p>
        <div className="flex gap-4">
          <RefreshCw size={14} onClick={syncCalendar} className={`cursor-pointer ${isLoading ? 'animate-spin' : ''}`} />
          <Settings size={14} className="cursor-pointer" />
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