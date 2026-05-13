"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  Activity, Settings, RefreshCw, Radio, Zap, 
  Shield, MapPin, Video, Users, Link as LinkIcon,
  Clock, Calendar as CalIcon, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V5.0
 * FULL-BLEED ARCHITECTURE & EXTENDED PROTOCOLS
 * Updates: Removed branding, expanded fields, enhanced day-click logic.
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');

  // Extended Form State
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

  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [tRes, cRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("campaigns").select("*").eq("user_id", user.id)
    ]);
    const combined = [
      ...(tRes.data || []).map(t => ({ ...t, displayType: 'OPERATION', dateField: t.created_at })),
      ...(cRes.data || []).map(c => ({ ...c, displayType: 'SIGNAL', dateField: c.scheduled_for || c.created_at }))
    ] as CalendarEvent[];
    setEvents(combined);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { syncCalendar(); }, [syncCalendar]);

  const daysGrid = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  }), [currentMonth]);

  const getDayEvents = (date: Date) => events.filter(e => {
    const d = parseISO(e.dateField);
    return isValid(d) && isSameDay(d, date) && (activeFilter === 'ALL' || e.displayType === activeFilter);
  });

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans p-4 md:p-10 flex flex-col overflow-hidden">
      
      {/* MODAL SYSTEM - EXPANDED FIELDS */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/10 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-10 pb-4 flex justify-between items-start">
                 <h2 className="text-3xl font-serif italic text-stone-800 tracking-tight">{viewMode === 'CREATE' ? 'Establish Entry' : 'Entry Protocol'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={18}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-10 pt-0 no-scrollbar space-y-6">
                 {viewMode === 'CREATE' ? (
                   <div className="space-y-5">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Entry Identifier</label>
                        <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Quarterly Strategic Sync" className="w-full bg-stone-50 border-none rounded-2xl p-5 text-xs outline-none focus:ring-1 ring-[#A3B18A]/20" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Protocol Date</label>
                          <div className="relative flex items-center">
                            <CalIcon size={12} className="absolute left-5 text-stone-300" />
                            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-stone-50 border-none rounded-2xl p-5 pl-12 text-[10px] font-bold outline-none" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Temporal Point</label>
                          <div className="relative flex items-center">
                            <Clock size={12} className="absolute left-5 text-stone-300" />
                            <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full bg-stone-50 border-none rounded-2xl p-5 pl-12 text-[10px] font-bold outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Physical Location</label>
                          <div className="relative flex items-center">
                            <MapPin size={12} className="absolute left-5 text-stone-300" />
                            <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Office / Site" className="w-full bg-stone-50 border-none rounded-2xl p-5 pl-12 text-[10px] outline-none" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Virtual Interface</label>
                          <div className="relative flex items-center">
                            <Video size={12} className="absolute left-5 text-stone-300" />
                            <input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Meet / Zoom Link" className="w-full bg-stone-50 border-none rounded-2xl p-5 pl-12 text-[10px] outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Invite Personnel</label>
                        <div className="relative flex items-center">
                          <Users size={12} className="absolute left-5 text-stone-300" />
                          <input value={formGuests} onChange={e => setFormGuests(e.target.value)} placeholder="emails, separated by commas..." className="w-full bg-stone-50 border-none rounded-2xl p-5 pl-12 text-[10px] outline-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-4 tracking-widest">Entry Context</label>
                        <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Notes, briefs, or objectives..." className="w-full bg-stone-50 border-none rounded-2xl p-6 text-xs h-32 resize-none outline-none" />
                      </div>

                      <button onClick={async () => {
                        setIsSubmitting(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        await supabase.from("tasks").insert([{ 
                          title: formTitle, 
                          description: formDescription, 
                          location: formLocation,
                          meeting_link: formLink,
                          guests: formGuests,
                          created_at: new Date(`${formDate}T${formTime}:00`).toISOString(), 
                          user_id: user?.id 
                        }]);
                        setIsSubmitting(false); setIsModalOpen(false); syncCalendar();
                      }} className="w-full bg-stone-900 text-white py-6 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#A3B18A] transition-all flex items-center justify-center gap-3 shadow-xl shadow-stone-200">
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14}/>} Deploy Entry
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                      <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-[2.5rem]">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          {selectedEvent?.displayType === 'SIGNAL' ? <Radio size={18} className="text-[#A3B18A]" /> : <Zap size={18} className="text-stone-400" />}
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A] mb-1">{selectedEvent?.displayType}</p>
                          <p className="text-2xl font-serif italic text-stone-800 leading-tight">{selectedEvent?.title || selectedEvent?.subject}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-5 bg-stone-50 rounded-2xl text-center">
                          <p className="text-[7px] font-black text-stone-300 uppercase mb-1 tracking-widest">Time</p>
                          <p className="text-[10px] font-bold">{format(parseISO(selectedEvent?.dateField || ""), "HH:mm")}</p>
                        </div>
                        <div className="p-5 bg-stone-50 rounded-2xl text-center">
                          <p className="text-[7px] font-black text-stone-300 uppercase mb-1 tracking-widest">Personnel</p>
                          <p className="text-[10px] font-bold truncate px-2">{selectedEvent?.guests ? 'Multi' : 'Solo'}</p>
                        </div>
                        <div className="p-5 bg-stone-50 rounded-2xl text-center">
                          <p className="text-[7px] font-black text-stone-300 uppercase mb-1 tracking-widest">Format</p>
                          <p className="text-[10px] font-bold">{selectedEvent?.meeting_link ? 'Remote' : 'Physical'}</p>
                        </div>
                      </div>

                      {selectedEvent?.meeting_link && (
                        <a href={selectedEvent.meeting_link} target="_blank" className="flex items-center justify-between p-6 bg-stone-900 text-[#A3B18A] rounded-2xl hover:scale-[1.01] transition-transform">
                          <div className="flex items-center gap-4">
                            <Video size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Join Interface</span>
                          </div>
                          <LinkIcon size={14} />
                        </a>
                      )}

                      <div className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100">
                        <p className="text-[7px] font-black text-stone-300 uppercase mb-4 tracking-[0.4em]">Decrypted Context</p>
                        <p className="text-xs text-stone-500 leading-relaxed italic">"{selectedEvent?.description || "No further intelligence found."}"</p>
                      </div>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER: Simple, Clean, No Branding --- */}
      <header className="flex flex-col lg:flex-row items-end justify-between gap-6 mb-10 px-4">
        <h1 className="text-8xl lg:text-[12rem] font-serif italic text-stone-800 tracking-tighter leading-[0.7] lowercase select-none">
          {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
        </h1>

        <div className="flex items-center gap-3 bg-white p-2.5 rounded-full border border-stone-100 shadow-sm self-start lg:self-end">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={24} className="text-stone-400"/></button>
          <div className="w-px h-8 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={24} className="text-stone-400"/></button>
        </div>
      </header>

      {/* --- MAIN INTERFACE: Expansion Grid --- */}
      <div className="grid lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* CALENDAR MATRIX */}
        <section className="lg:col-span-10 bg-white rounded-[4rem] border border-stone-100 shadow-3xl flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-6 text-center text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 overflow-y-auto no-scrollbar">
            {daysGrid.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const isCurrent = isSameMonth(day, currentMonth);

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`relative min-h-[160px] p-6 border-r border-b border-stone-50 transition-all cursor-pointer group
                    ${!isCurrent ? 'bg-stone-50/10 opacity-10' : 'bg-white hover:bg-[#FDFDFB]'}
                    ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <span className={`inline-block px-3 py-1.5 rounded-xl text-[11px] font-black mb-4 transition-all
                    ${isToday ? 'bg-stone-900 text-[#A3B18A] shadow-xl shadow-stone-200' : 'text-stone-200 group-hover:text-stone-800'}`}>
                    {format(day, "d")}
                  </span>

                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                        className="px-3 py-2 rounded-xl bg-white border border-stone-100 text-[8px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <div className={`w-1 h-1 rounded-full ${e.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                        <span className="truncate tracking-tighter">{e.title || e.subject}</span>
                      </div>
                    ))}
                    {dayEvents.length > 4 && <p className="text-[7px] font-black text-[#A3B18A] ml-2 mt-1">+{dayEvents.length - 4} ENTRIES</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* UTILITY SIDEBAR */}
        <aside className="lg:col-span-2 flex flex-col h-full">
          <div className="bg-white rounded-[4rem] border border-stone-100 shadow-3xl p-8 flex flex-col flex-1">
            
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
              <h2 className="text-5xl font-serif italic tracking-tighter text-stone-800 leading-[0.8] lowercase">{format(selectedDay, "do MMM")}</h2>
            </div>

            <div className="flex gap-1 mb-8">
              {['ALL', 'OP', 'SIG'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f === 'OP' ? 'OPERATION' : f === 'SIG' ? 'SIGNAL' : 'ALL')} 
                  className={`flex-1 py-3 rounded-full text-[8px] font-black uppercase tracking-widest transition-all
                  ${(activeFilter === 'OPERATION' && f === 'OP') || (activeFilter === 'SIGNAL' && f === 'SIG') || (activeFilter === 'ALL' && f === 'ALL')
                    ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:text-stone-900'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-6">
              {getDayEvents(selectedDay).length === 0 ? (
                <div className="py-20 text-center opacity-10 flex flex-col items-center">
                  <Shield size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Timeline Void</p>
                </div>
              ) : (
                getDayEvents(selectedDay).map(e => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                    className="p-5 rounded-[2rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[7px] font-black uppercase tracking-widest text-[#A3B18A]">{e.displayType}</span>
                      <span className="text-[8px] font-bold text-stone-300">{format(parseISO(e.dateField), "HH:mm")}</span>
                    </div>
                    <p className="text-[11px] font-black text-stone-800 uppercase leading-tight truncate">{e.title || e.subject}</p>
                  </motion.div>
                ))
              )}
            </div>

            <button onClick={() => handleDayClick(selectedDay)}
              className="w-full bg-stone-900 text-[#A3B18A] py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-all duration-300" />
              <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
            </button>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-3xl { box-shadow: 0 80px 150px -40px rgba(0, 0, 0, 0.12); }
      `}</style>
    </div>
  );
}