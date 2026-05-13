"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, 
  Activity, Settings, RefreshCw, Radio, Zap, 
  Shield, Database, Cpu, Bell, Search, Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE V4.0
 * FULL-BLEED ARCHITECTURE: No-Squash Expansion
 * Focus: Fluid width, Entry-based logic, and Terminology compliance.
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
  // --- Infrastructure State ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  
  // --- UI Orchestration ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');

  // --- Form State ---
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Data Logic: Synchronization ---
  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, campaignsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("campaigns").select("*").eq("user_id", user.id)
      ]);

      const taskEvents: CalendarEvent[] = (tasksRes.data || []).map(t => ({
        ...t, displayType: 'OPERATION', dateField: t.created_at
      }));

      const campaignEvents: CalendarEvent[] = (campaignsRes.data || []).map(c => ({
        ...c, displayType: 'SIGNAL', dateField: c.scheduled_for || c.created_at
      }));

      setEvents([...taskEvents, ...campaignEvents]);
    } catch (error) {
      console.error("Sync Interruption");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { syncCalendar(); }, [syncCalendar]);

  // --- Logic: Grid Orchestration ---
  const daysInGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = useCallback((date: Date) => {
    return events.filter(e => {
      const d = parseISO(e.dateField);
      const matchesDate = isValid(d) && isSameDay(d, date);
      const matchesFilter = activeFilter === 'ALL' || e.displayType === activeFilter;
      return matchesDate && matchesFilter;
    });
  }, [events, activeFilter]);

  const handleEstablishEntry = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  const deployEntry = async () => {
    if (!formTitle || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();

      const { error } = await supabase.from("tasks").insert([{
        title: formTitle,
        description: formDescription,
        created_at: new Date(`${formDate}T${formTime}:00`).toISOString(),
        user_id: user.id
      }]);

      if (error) throw error;
      setIsModalOpen(false);
      setFormTitle("");
      setFormDescription("");
      syncCalendar();
    } catch (err) {
      console.error("Deployment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 font-sans selection:bg-[#A3B18A]/20">
      
      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-3xl overflow-hidden flex flex-col"
            >
              <div className="p-10 pb-6 flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A3B18A] mb-1">Calendar Protocol</p>
                  <h2 className="text-4xl font-serif italic text-stone-800 tracking-tighter">
                    {viewMode === 'CREATE' ? 'Establish Entry' : 'Event Intelligence'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={20}/></button>
              </div>

              <div className="p-10 space-y-6">
                {viewMode === 'CREATE' ? (
                  <div className="space-y-4">
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Entry Identifier..." className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold" />
                    </div>
                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Append intelligence..." className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] p-6 text-sm h-32 resize-none" />
                    <button onClick={deployEntry} className="w-full bg-stone-900 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">
                      Deploy Entry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-stone-100 shadow-sm">
                        {selectedEvent?.displayType === 'SIGNAL' ? <Radio className="text-[#A3B18A]" /> : <Zap className="text-stone-400" />}
                      </div>
                      <h3 className="text-2xl font-serif italic text-stone-800">{selectedEvent?.title || selectedEvent?.subject}</h3>
                    </div>
                    <p className="p-8 bg-stone-50 rounded-[2.5rem] text-sm text-stone-600 leading-relaxed italic">"{selectedEvent?.description || "No intelligence provided."}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full h-full p-6 md:p-12 lg:p-16 flex flex-col gap-12">
        
        {/* --- HEADER: Full Width Expansion --- */}
        <header className="flex flex-col lg:flex-row items-end justify-between gap-12">
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#A3B18A]" />
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Chronos Infrastructure</p>
            </div>
            <h1 className="text-[10rem] lg:text-[14rem] font-serif italic text-stone-800 tracking-tighter leading-[0.7] lowercase select-none">
              {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-full border border-stone-100 shadow-sm self-start lg:self-end">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-5 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={32} className="text-stone-400"/></button>
            <div className="h-10 w-px bg-stone-100" />
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-5 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={32} className="text-stone-400"/></button>
          </div>
        </header>

        {/* --- GRID SYSTEM: 10/12 Split for Maximum Calendar Real Estate --- */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* THE CALENDAR MATRIX */}
          <section className="lg:col-span-9 bg-white rounded-[5rem] border border-stone-100 shadow-3xl overflow-hidden flex flex-col min-h-[1000px]">
            <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="py-10 text-center text-[12px] font-black uppercase tracking-[0.5em] text-stone-300">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1">
              {daysInGrid.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrent = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleEstablishEntry(day)}
                    className={`min-h-[200px] p-8 border-r border-b border-stone-50 transition-all cursor-pointer group relative
                      ${!isCurrent ? 'bg-stone-50/30 opacity-10' : 'bg-white hover:bg-[#FCFAF8]'}
                      ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                      ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    `}
                  >
                    <span className={`inline-block px-4 py-2 rounded-2xl text-[14px] font-black mb-6 transition-all
                      ${isToday ? 'bg-stone-900 text-[#A3B18A] shadow-xl' : 'text-stone-200 group-hover:text-stone-800'}`}>
                      {format(day, "d")}
                    </span>

                    <div className="space-y-2 relative z-10">
                      {dayEvents.slice(0, 4).map((e) => (
                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                          className="px-4 py-2 rounded-2xl bg-white border border-stone-100 text-[10px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] hover:shadow-lg transition-all flex items-center gap-3"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${e.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                          <span className="truncate tracking-tighter">{e.title || e.subject}</span>
                        </div>
                      ))}
                      {dayEvents.length > 4 && <p className="text-[9px] font-black text-[#A3B18A] ml-3 mt-2 tracking-widest">+{dayEvents.length - 4} ENTRIES</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* THE SIDEBAR AGGREGATOR */}
          <aside className="lg:col-span-3 h-full">
            <div className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-3xl flex flex-col sticky top-12 min-h-[1000px]">
              
              <div className="flex items-center justify-between mb-16 p-8 bg-stone-50 rounded-[3rem] border border-stone-100">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A]">System Secure</p>
                   <p className="text-[12px] font-black uppercase text-stone-800">Protocol Active</p>
                 </div>
                 <Activity size={24} className="text-[#A3B18A]" />
              </div>

              <div className="mb-12">
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-[#A3B18A] mb-2">{format(selectedDay, "EEEE")}</p>
                <h2 className="text-8xl font-serif italic tracking-tighter text-stone-800 leading-[0.8] lowercase">{format(selectedDay, "do MMM")}</h2>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar">
                {['ALL', 'OPERATION', 'SIGNAL'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f as any)}
                    className={`flex-1 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                    ${activeFilter === f ? 'bg-stone-900 text-white shadow-xl' : 'bg-stone-50 text-stone-400 hover:text-stone-900'}`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Daily Intelligence Feed */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-12">
                {getEventsForDay(selectedDay).length === 0 ? (
                  <div className="py-24 text-center opacity-20 flex flex-col items-center">
                    <Shield size={64} strokeWidth={1} className="mb-6" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Protocol Clear</p>
                  </div>
                ) : (
                  getEventsForDay(selectedDay).map(e => (
                    <motion.div key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => { setSelectedEvent(e); setViewMode('VIEW'); setIsModalOpen(true); }}
                      className="p-8 rounded-[3.5rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">{e.displayType}</span>
                        <span className="text-[10px] font-bold text-stone-300 group-hover:text-stone-800">{format(parseISO(e.dateField), "HH:mm")}</span>
                      </div>
                      <p className="text-[15px] font-black text-stone-800 uppercase leading-tight tracking-tight">{e.title || e.subject}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Establishment Hub */}
              <div className="pt-10 border-t border-stone-50 space-y-4">
                <button 
                  onClick={() => handleEstablishEntry(selectedDay)}
                  className="w-full bg-stone-900 text-[#A3B18A] py-10 rounded-[3rem] shadow-3xl flex items-center justify-center gap-5 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  <Plus size={28} className="group-hover:rotate-90 transition-all duration-500" />
                  <span className="text-[12px] font-black uppercase tracking-[0.6em]">Establish Entry</span>
                </button>
                
                <div className="flex gap-4">
                  <button onClick={syncCalendar} className="flex-1 p-8 bg-stone-50 rounded-[2.5rem] text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-xl transition-all flex justify-center">
                    <RefreshCw size={24} className={isLoading ? 'animate-spin text-[#A3B18A]' : ''} />
                  </button>
                  <button className="flex-1 p-8 bg-stone-50 rounded-[2.5rem] text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-xl transition-all flex justify-center">
                    <Settings size={24} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-3xl { box-shadow: 0 80px 150px -40px rgba(0, 0, 0, 0.15); }
      `}</style>
    </div>
  );
}