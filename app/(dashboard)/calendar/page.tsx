"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  MapPin, Video, Users, Clock, Calendar as CalIcon,
  Link as LinkIcon, Radio, Zap, Shield, Mail, Globe, RefreshCw, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V7.0
 * EXTENDED PROTOCOL: 400+ LINE ARCHITECTURE
 * Focus: Massive Sidebar, Bold Buttons, Micro-Typography Labels
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
  // --- INFRASTRUCTURE STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  
  // --- UI ORCHESTRATION ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');

  // --- EXTENDED FORM STATE ---
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

  // --- DATA SYNCHRONIZATION ---
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
        ...(tasksRes.data || []).map(t => ({ 
          ...t, 
          displayType: 'OPERATION', 
          dateField: t.created_at 
        })),
        ...(campaignsRes.data || []).map(c => ({ 
          ...c, 
          displayType: 'SIGNAL', 
          dateField: c.scheduled_for || c.created_at 
        }))
      ] as CalendarEvent[];

      setEvents(combined);
    } catch (e) {
      console.error("Protocol Error: Sync Failed");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { syncCalendar(); }, [syncCalendar]);

  // --- GRID CALCULATION ---
  const daysGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayEvents = useCallback((date: Date) => {
    return events.filter(e => {
      const d = parseISO(e.dateField);
      const isDateMatch = isValid(d) && isSameDay(d, date);
      const isFilterMatch = activeFilter === 'ALL' || e.displayType === activeFilter;
      return isDateMatch && isFilterMatch;
    });
  }, [events, activeFilter]);

  // --- ACTION HANDLERS ---
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
      if (!user) throw new Error("No Identity Found");

      const { error } = await supabase.from("tasks").insert([{
        title: formTitle,
        description: formDescription,
        location: formLocation,
        meeting_link: formLink,
        guests: formGuests,
        created_at: new Date(`${formDate}T${formTime}:00`).toISOString(),
        user_id: user.id
      }]);

      if (error) throw error;
      
      // Reset & Refresh
      setFormTitle("");
      setFormDescription("");
      setFormLocation("");
      setFormLink("");
      setFormGuests("");
      setIsModalOpen(false);
      syncCalendar();
    } catch (err) {
      console.error("Establishment Failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans p-6 md:p-12 lg:p-16 flex flex-col overflow-hidden">
      
      {/* MODAL SYSTEM: HIGH DETAIL CREATION */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/10 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-4xl overflow-hidden flex flex-col max-h-[90vh]">
               
               {/* Modal Header */}
               <div className="p-12 pb-6 flex justify-between items-start">
                 <div>
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#A3B18A] mb-2">Protocol Entry</p>
                   <h2 className="text-5xl font-serif italic text-stone-800 tracking-tighter">
                     {viewMode === 'CREATE' ? 'Establish Entry' : 'Entry Intelligence'}
                   </h2>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-5 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={24}/></button>
               </div>
               
               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto px-12 pb-12 no-scrollbar">
                 {viewMode === 'CREATE' ? (
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Primary Identifier</label>
                        <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Title..." className="w-full bg-stone-50 border-none rounded-[2rem] p-7 text-sm outline-none focus:ring-1 ring-[#A3B18A]/30 transition-all" />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Target Date</label>
                          <div className="relative flex items-center">
                            <CalIcon size={14} className="absolute left-6 text-stone-300" />
                            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-stone-50 border-none rounded-2xl p-6 pl-14 text-[11px] font-bold outline-none" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Temporal Point</label>
                          <div className="relative flex items-center">
                            <Clock size={14} className="absolute left-6 text-stone-300" />
                            <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full bg-stone-50 border-none rounded-2xl p-6 pl-14 text-[11px] font-bold outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Coordinate / Site</label>
                          <div className="relative flex items-center">
                            <MapPin size={14} className="absolute left-6 text-stone-300" />
                            <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Physical Location" className="w-full bg-stone-50 border-none rounded-2xl p-6 pl-14 text-[11px] outline-none" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Interface Link</label>
                          <div className="relative flex items-center">
                            <Video size={14} className="absolute left-6 text-stone-300" />
                            <input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Meeting URL" className="w-full bg-stone-50 border-none rounded-2xl p-6 pl-14 text-[11px] outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">Authorized Personnel</label>
                        <div className="relative flex items-center">
                          <Users size={14} className="absolute left-6 text-stone-300" />
                          <input value={formGuests} onChange={e => setFormGuests(e.target.value)} placeholder="Add emails, guests..." className="w-full bg-stone-50 border-none rounded-2xl p-6 pl-14 text-[11px] outline-none" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[8px] font-black uppercase text-stone-300 ml-5 tracking-[0.3em]">intelligence Context</label>
                        <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Enter detailed protocol notes..." className="w-full bg-stone-50 border-none rounded-[2.5rem] p-8 text-sm h-40 resize-none outline-none" />
                      </div>

                      <button onClick={deployProtocol} className="w-full bg-stone-900 text-white py-10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] hover:bg-[#A3B18A] transition-all shadow-2xl flex items-center justify-center gap-4">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={20}/>}
                        Establish Protocol
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-10">
                      <div className="p-10 bg-stone-50 rounded-[3.5rem] flex items-center gap-8 border border-stone-100">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                          {selectedEvent?.displayType === 'SIGNAL' ? <Radio size={28} className="text-[#A3B18A]" /> : <Zap size={28} className="text-stone-400" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A] mb-2">{selectedEvent?.displayType}</p>
                          <p className="text-4xl font-serif italic text-stone-800 leading-none">{selectedEvent?.title || selectedEvent?.subject}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {selectedEvent?.location && (
                          <div className="p-6 bg-stone-50 rounded-3xl flex items-center gap-4 border border-stone-50">
                            <MapPin size={18} className="text-stone-300" />
                            <span className="text-xs font-bold text-stone-600 truncate">{selectedEvent.location}</span>
                          </div>
                        )}
                        {selectedEvent?.meeting_link && (
                          <a href={selectedEvent.meeting_link} target="_blank" className="p-6 bg-stone-900 text-[#A3B18A] rounded-3xl flex items-center justify-between hover:scale-[1.02] transition-transform">
                            <div className="flex items-center gap-4">
                              <Video size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Interface</span>
                            </div>
                            <LinkIcon size={14} />
                          </a>
                        )}
                      </div>

                      <div className="p-10 bg-stone-50/50 rounded-[3rem] border border-stone-100">
                        <p className="text-[8px] font-black text-stone-300 uppercase mb-6 tracking-[0.4em]">Decrypted Intel</p>
                        <p className="text-sm text-stone-500 leading-relaxed italic">"{selectedEvent?.description || "No encrypted data found for this entry."}"</p>
                      </div>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER: FLUID TYPOGRAPHY --- */}
      <header className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16 px-6">
        <h1 className="text-[10rem] lg:text-[16rem] font-serif italic text-stone-800 tracking-tighter leading-[0.7] lowercase select-none">
          {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
        </h1>

        <div className="flex items-center gap-6 bg-white p-4 rounded-full border border-stone-100 shadow-sm self-start lg:self-end mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-6 hover:bg-stone-50 rounded-full transition-all active:scale-90"><ChevronLeft size={40} className="text-stone-400"/></button>
          <div className="w-px h-12 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-6 hover:bg-stone-50 rounded-full transition-all active:scale-90"><ChevronRight size={40} className="text-stone-400"/></button>
        </div>
      </header>

      {/* --- CORE GRID: 9/12 SPATIAL BALANCE --- */}
      <div className="grid lg:grid-cols-12 gap-12 flex-1 min-h-0">
        
        {/* CALENDAR MATRIX (Span 9) */}
        <section className="lg:col-span-9 bg-white rounded-[6rem] border border-stone-100 shadow-4xl flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-10 text-center text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 overflow-y-auto no-scrollbar">
            {daysGrid.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isToday = isSameDay(day, new Date());
              const isCurrent = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDay);

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`relative min-h-[180px] p-8 border-r border-b border-stone-50 transition-all cursor-pointer group
                    ${!isCurrent ? 'bg-stone-50/10 opacity-5' : 'bg-white hover:bg-[#FDFDFB]'}
                    ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <span className={`inline-block px-4 py-2 rounded-2xl text-[14px] font-black mb-6 transition-all
                    ${isToday ? 'bg-stone-900 text-[#A3B18A] shadow-2xl' : 'text-stone-200 group-hover:text-stone-800'}`}>
                    {format(day, "d")}
                  </span>

                  <div className="space-y-2">
                    {dayEvents.slice(0, 4).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                        className="px-4 py-2.5 rounded-2xl bg-white border border-stone-100 text-[9px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] hover:shadow-xl transition-all flex items-center gap-3"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${e.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                        <span className="truncate tracking-tighter">{e.title || e.subject}</span>
                      </div>
                    ))}
                    {dayEvents.length > 4 && (
                      <p className="text-[8px] font-black text-[#A3B18A] ml-4 mt-2 tracking-widest">+{dayEvents.length - 4} ENTRIES</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* UTILITY SIDEBAR (Span 3 - Enlarged) */}
        <aside className="lg:col-span-3 flex flex-col h-full gap-8">
          <div className="bg-white rounded-[6rem] border border-stone-100 shadow-4xl p-12 flex flex-col flex-1 overflow-hidden">
            
            <div className="mb-16">
              <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#A3B18A] mb-3">{format(selectedDay, "EEEE")}</p>
              <h2 className="text-8xl font-serif italic tracking-tighter text-stone-800 leading-[0.8] lowercase">
                {format(selectedDay, "do")} <br />
                <span className="text-stone-200">{format(selectedDay, "MMM")}</span>
              </h2>
            </div>

            {/* FILTER BAR: BIGGER BUTTONS */}
            <div className="flex gap-2 mb-12 p-2.5 bg-stone-50 rounded-full border border-stone-100/50 shadow-inner">
              {['ALL', 'OPERATION', 'SIGNAL'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f as any)} 
                  className={`flex-1 py-5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                  ${activeFilter === f ? 'bg-stone-900 text-white shadow-2xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}>
                  {f.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* FEED: DETAILED LIST */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-10">
              {getDayEvents(selectedDay).length === 0 ? (
                <div className="py-32 text-center opacity-10 flex flex-col items-center grayscale">
                  <Shield size={80} strokeWidth={1} className="mb-8" />
                  <p className="text-[12px] font-black uppercase tracking-[0.5em]">Clearance Level: Max</p>
                </div>
              ) : (
                getDayEvents(selectedDay).map(e => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                    className="p-10 rounded-[3.5rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-3xl transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A]">{e.displayType}</span>
                        <span className="text-[11px] font-bold text-stone-300 group-hover:text-stone-800 transition-colors">{format(parseISO(e.dateField), "HH:mm")}</span>
                      </div>
                      <p className="text-[15px] font-black text-stone-800 uppercase leading-tight tracking-tight group-hover:text-[#A3B18A] transition-colors">{e.title || e.subject}</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#A3B18A]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))
              )}
            </div>

            {/* PRIMARY ACTION: MASSIVE ESTABLISH BUTTON */}
            <button onClick={() => handleDayClick(selectedDay)}
              className="w-full bg-stone-900 text-[#A3B18A] py-12 rounded-[3.5rem] shadow-4xl flex items-center justify-center gap-8 hover:scale-[1.03] active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={32} className="group-hover:rotate-90 transition-all duration-500 relative z-10" />
              <span className="text-[14px] font-black uppercase tracking-[0.8em] relative z-10">Establish Entry</span>
            </button>
          </div>
        </aside>
      </div>

      {/* FOOTER UTILITIES */}
      <footer className="mt-12 flex justify-between items-center px-10">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#A3B18A] animate-pulse" />
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Protocol Active</p>
          </div>
          <div className="w-px h-4 bg-stone-200" />
          <p className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em]">TOTs OS Infrastructure v7.0.2</p>
        </div>
        
        <div className="flex gap-4">
          <button onClick={syncCalendar} className="p-5 bg-white border border-stone-100 rounded-full text-stone-300 hover:text-stone-900 hover:shadow-xl transition-all">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="p-5 bg-white border border-stone-100 rounded-full text-stone-300 hover:text-stone-900 hover:shadow-xl transition-all">
            <Settings size={18} />
          </button>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-4xl { box-shadow: 0 120px 200px -60px rgba(0, 0, 0, 0.15); }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          width: 100%;
          left: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}