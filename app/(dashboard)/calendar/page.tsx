"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  Activity, Settings, RefreshCw, Radio, Zap, 
  Shield, Database, Cpu, Bell, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V4.2
 * ARCHITECTURE: FLUID EXPANSION
 * Focus: Scaled-down typography & maximum grid breathing room.
 */

type DisplayType = 'OPERATION' | 'SIGNAL' | 'URGENT';

interface CalendarEvent {
  id: string;
  title?: string;
  subject?: string;
  created_at: string;
  scheduled_for?: string;
  description?: string;
  content?: string;
  status?: 'pending' | 'active' | 'archived';
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

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
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

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans p-4 md:p-8 overflow-hidden flex flex-col">
      
      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-serif italic text-stone-800">{viewMode === 'CREATE' ? 'New Entry' : 'Intelligence'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={16}/></button>
               </div>
               
               {viewMode === 'CREATE' ? (
                 <div className="space-y-4">
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Identifier..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:ring-1 ring-[#A3B18A]/30 transition-all outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-xl p-3 text-[10px] font-bold outline-none" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-xl p-3 text-[10px] font-bold outline-none" />
                    </div>
                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Append details..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs h-28 resize-none outline-none" />
                    <button onClick={async () => {
                      setIsSubmitting(true);
                      const { data: { user } } = await supabase.auth.getUser();
                      await supabase.from("tasks").insert([{ title: formTitle, description: formDescription, created_at: new Date(`${formDate}T${formTime}:00`).toISOString(), user_id: user?.id }]);
                      setIsSubmitting(false); setIsModalOpen(false); syncCalendar();
                    }} className="w-full bg-stone-900 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#A3B18A] transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={14} /> : "Establish Protocol"}
                    </button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-50 shadow-sm">
                        {selectedEvent?.displayType === 'SIGNAL' ? <Radio size={14} className="text-[#A3B18A]" /> : <Zap size={14} className="text-stone-400" />}
                      </div>
                      <p className="text-lg font-serif italic text-stone-800 leading-tight">{selectedEvent?.title || selectedEvent?.subject}</p>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed px-2 italic">"{selectedEvent?.description || "No specific intel found for this entry."}"</p>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER: Reduced Typography Scale --- */}
      <header className="flex flex-col lg:flex-row items-end justify-between gap-6 mb-8 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-[#A3B18A]" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#A3B18A]">Chronos Infrastructure</p>
          </div>
          <h1 className="text-6xl lg:text-8xl font-serif italic text-stone-800 tracking-tighter leading-none lowercase">
            {format(currentMonth, "MMMM")} <span className="text-stone-200">{format(currentMonth, "yyyy")}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-stone-100 shadow-sm self-start lg:self-end">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={20} className="text-stone-400"/></button>
          <div className="w-px h-6 bg-stone-100" />
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={20} className="text-stone-400"/></button>
        </div>
      </header>

      {/* --- MAIN INTERFACE: Full Expansion Grid --- */}
      <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* CALENDAR MATRIX (Span 10 for absolute dominance) */}
        <section className="lg:col-span-10 bg-white rounded-[3rem] border border-stone-100 shadow-2xl flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/20">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-4 text-center text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">{d}</div>
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
                  onClick={() => { setSelectedDay(day); setFormDate(format(day, "yyyy-MM-dd")); }}
                  className={`relative min-h-[120px] p-4 border-r border-b border-stone-50 transition-all cursor-pointer group
                    ${!isCurrent ? 'bg-stone-50/10 opacity-20' : 'bg-white hover:bg-[#FDFDFB]'}
                    ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black mb-3 transition-all
                    ${isToday ? 'bg-stone-900 text-[#A3B18A]' : 'text-stone-200 group-hover:text-stone-800'}`}>
                    {format(day, "d")}
                  </span>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 5).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                        className="px-2 py-1.5 rounded-lg bg-stone-50/50 border border-stone-100 text-[7px] font-black uppercase truncate text-stone-600 hover:border-[#A3B18A] hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"
                      >
                        <div className={`w-1 h-1 rounded-full ${e.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                        <span className="truncate tracking-tighter">{e.title || e.subject}</span>
                      </div>
                    ))}
                    {dayEvents.length > 5 && <p className="text-[6px] font-black text-[#A3B18A] ml-1">+{dayEvents.length - 5} ENTRIES</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* UTILITY SIDEBAR (Span 2 - Slimmer & cleaner) */}
        <aside className="lg:col-span-2 flex flex-col h-full gap-4">
          <div className="bg-white rounded-[3rem] border border-stone-100 shadow-2xl p-6 flex flex-col flex-1 min-h-0">
            
            <div className="mb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
              <h2 className="text-4xl font-serif italic tracking-tighter text-stone-800 leading-none lowercase">{format(selectedDay, "do MMM")}</h2>
            </div>

            <div className="flex gap-1 mb-6">
              {['ALL', 'OP', 'SIG'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f === 'OP' ? 'OPERATION' : f === 'SIG' ? 'SIGNAL' : 'ALL')} 
                  className={`flex-1 py-2 rounded-full text-[7px] font-black uppercase tracking-widest transition-all
                  ${(activeFilter === 'OPERATION' && f === 'OP') || (activeFilter === 'SIGNAL' && f === 'SIG') || (activeFilter === 'ALL' && f === 'ALL')
                    ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
              {getDayEvents(selectedDay).length === 0 ? (
                <div className="py-12 text-center opacity-10 flex flex-col items-center">
                  <Shield size={32} strokeWidth={1} className="mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Protocol Clear</p>
                </div>
              ) : (
                getDayEvents(selectedDay).map(e => (
                  <div key={e.id} onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                    className="p-4 rounded-[1.5rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] font-black uppercase text-[#A3B18A]">{e.displayType}</span>
                      <span className="text-[7px] font-bold text-stone-300">{format(parseISO(e.dateField), "HH:mm")}</span>
                    </div>
                    <p className="text-[10px] font-black text-stone-800 uppercase leading-tight truncate">{e.title || e.subject}</p>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => { setViewMode('CREATE'); setIsModalOpen(true); }}
              className="w-full bg-stone-900 text-[#A3B18A] py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-all duration-300" />
              <span className="text-[9px] font-black uppercase tracking-widest">Entry</span>
            </button>
          </div>

          <div className="bg-stone-900 rounded-3xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
               <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Sync Active</p>
             </div>
             <button onClick={syncCalendar} className="text-stone-500 hover:text-[#A3B18A] transition-colors"><RefreshCw size={12}/></button>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}