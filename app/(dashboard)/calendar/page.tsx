"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, MapPin, 
  Video, Activity, Settings, RefreshCw, Radio, Zap, 
  ExternalLink, Shield, Bell, Search, Filter, Share2, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Info,
  Command, Eye, Lock, Globe, Database, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CALENDAR INFRASTRUCTURE
 * Refined Layout: 500-Line Temporal Management
 * Focus: Anti-Squash Proportions & Event Logic
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
  priority?: 1 | 2 | 3;
  color?: string;
  location?: string;
  vc_link?: string;
  displayType: DisplayType;
  dateField: string;
}

interface SystemNotification {
  id: string;
  message: string;
  type: 'info' | 'alert';
}

export default function CalendarPage() {
  // --- Core State ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  
  // --- UI State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE'>('CREATE');
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

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

  // --- Data Logic ---

  const addNotification = (message: string, type: 'info' | 'alert') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message, type }, ...prev].slice(0, 3));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

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
        ...t,
        displayType: 'OPERATION',
        dateField: t.created_at
      }));

      const campaignEvents: CalendarEvent[] = (campaignsRes.data || []).map(c => ({
        ...c,
        displayType: 'SIGNAL',
        dateField: c.scheduled_for || c.created_at
      }));

      setEvents([...taskEvents, ...campaignEvents]);
      addNotification("Calendar synced successfully", "info");
    } catch (error) {
      addNotification("Sync interruption", "alert");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    syncCalendar();
  }, [syncCalendar]);

  // --- Helpers ---

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

  const handleCreateNew = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  const handleViewEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setViewMode('VIEW');
    setIsModalOpen(true);
  };

  const commitEvent = async () => {
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
      addNotification("Failed to deploy event", "alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 selection:bg-[#A3B18A]/20">
      
      {/* --- NOTIFICATIONS --- */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-6 py-3 bg-white shadow-2xl rounded-full border border-stone-100 flex items-center gap-3"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${n.type === 'alert' ? 'bg-red-400' : 'bg-[#A3B18A]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- MODAL SYSTEM --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col"
            >
              <div className="p-10 pb-4 flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A3B18A] mb-1">Calendar Protocol</p>
                  <h2 className="text-4xl font-serif italic text-stone-800 tracking-tighter">
                    {viewMode === 'CREATE' ? 'Establish Event' : 'Event Detail'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-stone-50 rounded-full hover:bg-stone-100 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 space-y-6">
                {viewMode === 'CREATE' ? (
                  <div className="space-y-4">
                    <input 
                      value={formTitle} onChange={e => setFormTitle(e.target.value)}
                      placeholder="Event Title..."
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold" />
                    </div>
                    <textarea 
                      value={formDescription} onChange={e => setFormDescription(e.target.value)}
                      placeholder="Intelligence details..."
                      className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] p-6 text-sm h-32 resize-none"
                    />
                    <button 
                      onClick={commitEvent}
                      className="w-full bg-stone-900 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all"
                    >
                      Deploy Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-stone-100">
                        {selectedEvent?.displayType === 'SIGNAL' ? <Radio className="text-[#A3B18A]" /> : <Zap className="text-stone-400" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#A3B18A] tracking-widest">{selectedEvent?.displayType}</p>
                        <h3 className="text-2xl font-serif italic text-stone-800">{selectedEvent?.title || selectedEvent?.subject}</h3>
                      </div>
                    </div>
                    <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                       <p className="text-[11px] text-stone-600 leading-relaxed italic">
                         {selectedEvent?.description || selectedEvent?.content || "No intelligence provided for this entry."}
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto p-6 md:p-12 lg:p-16 grid lg:grid-cols-12 gap-12 h-full">
        
        {/* --- MAIN CALENDAR GRID --- */}
        <div className="lg:col-span-9 flex flex-col space-y-10">
          
          <header className="flex items-center justify-between px-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-0.5 bg-[#A3B18A]" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#A3B18A]">Calendar Core</p>
              </div>
              <h1 className="text-6xl md:text-[8rem] font-serif italic text-stone-800 tracking-tighter leading-[0.8] lowercase">
                {format(currentMonth, "MMMM")} <span className="text-stone-200">{format(currentMonth, "yyyy")}</span>
              </h1>
            </div>

            <div className="flex gap-2 bg-white p-2 rounded-full border border-stone-100 shadow-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-full transition-all"><ChevronLeft size={24} className="text-stone-400" /></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-full transition-all"><ChevronRight size={24} className="text-stone-400" /></button>
            </div>
          </header>

          <section className="bg-white rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-stone-300">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {daysInGrid.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrent = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => { setSelectedDay(day); handleCreateNew(day); }}
                    className={`min-h-[160px] p-6 border-r border-b border-stone-50 transition-all cursor-pointer group relative
                      ${!isCurrent ? 'opacity-10 bg-stone-50/50' : 'bg-white hover:bg-stone-50/30'}
                      ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                      ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[11px] font-black p-2 rounded-xl transition-all ${isToday ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-300 group-hover:text-stone-900'}`}>
                        {format(day, "d")}
                      </span>
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div 
                          key={event.id} onClick={(e) => { e.stopPropagation(); handleViewEvent(event); }}
                          className="px-3 py-1.5 rounded-full bg-white border border-stone-100 text-[8px] font-black uppercase truncate text-stone-600 hover:border-[#A3B18A] transition-all flex items-center gap-2 shadow-sm"
                        >
                          <div className={`w-1 h-1 rounded-full ${event.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                          <span className="truncate">{event.title || event.subject}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && <p className="text-[7px] font-black text-[#A3B18A] pl-2 tracking-widest mt-1">+{dayEvents.length - 3} EVENTS</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* --- SIDEBAR AGGREGATOR --- */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-2xl flex flex-col sticky top-12 h-[calc(100vh-100px)]">
            
            <div className="flex items-center justify-between mb-10 p-5 bg-stone-50 rounded-[2.5rem] border border-stone-100">
               <div className="flex items-center gap-3">
                 <Activity size={16} className="text-[#A3B18A]" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-stone-800 leading-none">System Secure</p>
               </div>
               <div className="flex gap-1">
                 {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-[#A3B18A] rounded-full" />)}
               </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3B18A] mb-1">{format(selectedDay, "EEEE")}</p>
              <h2 className="text-6xl font-serif italic tracking-tighter text-stone-800">{format(selectedDay, "do MMM")}</h2>
            </div>

            {/* Filter Hub */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
              {['ALL', 'OPERATION', 'SIGNAL'].map(f => (
                <button 
                  key={f} onClick={() => setActiveFilter(f as any)}
                  className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all
                    ${activeFilter === f ? 'bg-stone-900 text-[#A3B18A]' : 'bg-stone-50 text-stone-400 hover:text-stone-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-8">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="py-24 text-center opacity-20">
                  <Shield size={40} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Timeline Void</p>
                </div>
              ) : (
                getEventsForDay(selectedDay).map(event => (
                  <motion.div 
                    key={event.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleViewEvent(event)}
                    className="p-6 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A]">{event.displayType}</span>
                      <span className="text-[9px] font-bold text-stone-300">{format(parseISO(event.dateField), "HH:mm")}</span>
                    </div>
                    <p className="text-[12px] font-black text-stone-800 uppercase leading-tight tracking-tight">{event.title || event.subject}</p>
                  </motion.div>
                ))
              )}
            </div>

            <button 
              onClick={() => handleCreateNew(selectedDay)}
              className="w-full bg-stone-900 text-[#A3B18A] py-7 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Establish Event</span>
            </button>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.15); }
      `}</style>
    </div>
  );
}