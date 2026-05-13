"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Plus, X, Loader2, MapPin, 
  Video, Activity, Settings, RefreshCw, Radio, Zap, 
  ExternalLink, Shield, Bell, Search, Filter, Share2, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Info,
  Command, Eye, Lock, Globe, Database, Cpu, Calendar as CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid,
  addDays, subDays
} from "date-fns";

/**
 * TOTS OS | CALENDAR CORE V3.3
 * ARCHITECTURE: WIDE-FRAME INFRASTRUCTURE
 * Focus: Maximum whitespace, fluid sidebar, and robust event logic.
 */

// --- Types & Interfaces ---

type DisplayType = 'OPERATION' | 'SIGNAL' | 'SYSTEM' | 'URGENT';

interface CalendarEvent {
  id: string;
  title?: string;
  subject?: string;
  created_at: string;
  scheduled_for?: string;
  description?: string;
  content?: string;
  status?: 'pending' | 'active' | 'archived' | 'failed';
  priority?: 1 | 2 | 3;
  color?: string;
  location?: string;
  vc_link?: string;
  displayType: DisplayType;
  dateField: string;
  metadata?: {
    last_sync: string;
    origin: string;
    encrypted: boolean;
  };
}

interface LogEntry {
  id: string;
  message: string;
  type: 'status' | 'alert' | 'success';
  timestamp: string;
}

// --- Main Application ---

export default function CalendarPage() {
  // Infrastructure State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DisplayType | 'ALL'>('ALL');
  
  // UI Orchestration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'VIEW' | 'CREATE' | 'EDIT'>('CREATE');
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // --- Logic: Data Synchronization ---

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    setSystemLogs(prev => [{ id, message, type, timestamp: new Date().toISOString() }, ...prev].slice(0, 5));
  }, []);

  const syncCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth unauthorized");

      const [tasksRes, campaignsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).order('created_at', { ascending: true }),
        supabase.from("campaigns").select("*").eq("user_id", user.id).order('scheduled_for', { ascending: true })
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (campaignsRes.error) throw campaignsRes.error;

      const taskEvents: CalendarEvent[] = (tasksRes.data || []).map(t => ({
        ...t,
        displayType: 'OPERATION',
        dateField: t.created_at,
        metadata: { last_sync: new Date().toISOString(), origin: 'DATABASE_TASKS', encrypted: true }
      }));

      const campaignEvents: CalendarEvent[] = (campaignsRes.data || []).map(c => ({
        ...c,
        displayType: 'SIGNAL',
        dateField: c.scheduled_for || c.created_at,
        metadata: { last_sync: new Date().toISOString(), origin: 'DATABASE_CAMPAIGNS', encrypted: false }
      }));

      setEvents([...taskEvents, ...campaignEvents]);
      addLog("Temporal sync finalized", "success");
    } catch (error: any) {
      addLog(error.message || "Sync failure", "alert");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addLog]);

  useEffect(() => {
    syncCalendar();
  }, [syncCalendar]);

  // --- Logic: Grid Management ---

  const daysInView = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesFilter = activeFilter === 'ALL' || e.displayType === activeFilter;
      const matchesSearch = searchQuery === "" || 
        (e.title || e.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [events, activeFilter, searchQuery]);

  const getEventsForDate = useCallback((date: Date) => {
    return filteredEvents.filter(e => {
      const eventDate = parseISO(e.dateField);
      return isValid(eventDate) && isSameDay(eventDate, date);
    });
  }, [filteredEvents]);

  const handleOpenCreate = (day: Date) => {
    setSelectedDay(day);
    setFormDate(format(day, "yyyy-MM-dd"));
    setViewMode('CREATE');
    setIsModalOpen(true);
  };

  const handleOpenEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setViewMode('VIEW');
    setIsModalOpen(true);
  };

  const deployEvent = async () => {
    if (!formTitle || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth error");

      const timestamp = new Date(`${formDate}T${formTime}:00`).toISOString();
      
      const { error } = await supabase.from("tasks").insert([{
        title: formTitle,
        description: formDescription,
        created_at: timestamp,
        user_id: user.id,
        status: 'pending'
      }]);

      if (error) throw error;
      
      addLog(`Event "${formTitle}" established`, "success");
      setIsModalOpen(false);
      setFormTitle("");
      setFormDescription("");
      syncCalendar();
    } catch (err: any) {
      addLog("Deployment failed", "alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Components: UI Elements ---

  const SidebarItem = ({ event }: { event: CalendarEvent }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => handleOpenEvent(event)}
      className="p-6 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A] flex items-center gap-2">
          {event.displayType === 'SIGNAL' ? <Radio size={10} /> : <Zap size={10} />}
          {event.displayType}
        </span>
        <span className="text-[9px] font-black text-stone-300 group-hover:text-stone-800 transition-colors">
          {format(parseISO(event.dateField), "HH:mm")}
        </span>
      </div>
      <p className="text-[13px] font-black text-stone-800 uppercase leading-tight tracking-tight">{event.title || event.subject}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-stone-900 selection:bg-[#A3B18A]/20 overflow-x-hidden font-sans">
      
      {/* --- LAYER: MODALS --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 pb-6 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-[#A3B18A] rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A3B18A]">Calendar Protocol</span>
                  </div>
                  <h2 className="text-5xl font-serif italic text-stone-800 tracking-tighter">
                    {viewMode === 'CREATE' ? 'Establish Entry' : 'Event Intelligence'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-stone-50 rounded-full hover:rotate-90 transition-all duration-300">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-8 no-scrollbar">
                {viewMode === 'CREATE' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Event Title</label>
                      <input 
                        value={formTitle} onChange={e => setFormTitle(e.target.value)}
                        placeholder="Define operation..."
                        className="w-full bg-stone-50 border border-stone-100 rounded-3xl p-6 text-sm focus:outline-none focus:ring-2 ring-[#A3B18A]/10 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Date</label>
                        <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Time</label>
                        <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold focus:outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Details</label>
                      <textarea 
                        value={formDescription} onChange={e => setFormDescription(e.target.value)}
                        placeholder="Append intelligence here..."
                        className="w-full bg-stone-50 border border-stone-100 rounded-[2.5rem] p-8 text-sm h-40 resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-6 p-8 bg-stone-50 rounded-[3rem] border border-stone-100">
                      <div className="w-20 h-20 bg-white rounded-[2rem] border border-stone-100 flex items-center justify-center shadow-sm">
                        {selectedEvent?.displayType === 'SIGNAL' ? <Radio className="text-[#A3B18A]" /> : <Zap className="text-stone-400" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">{selectedEvent?.displayType}</span>
                        <h3 className="text-3xl font-serif italic text-stone-800 leading-tight">{selectedEvent?.title || selectedEvent?.subject}</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { label: 'Timeline', val: format(parseISO(selectedEvent?.dateField || new Date().toISOString()), "do MMM") },
                        { label: 'Hour', val: format(parseISO(selectedEvent?.dateField || new Date().toISOString()), "HH:mm") },
                        { label: 'Status', val: selectedEvent?.status || 'Active' }
                      ].map((stat, i) => (
                        <div key={i} className="p-6 bg-white border border-stone-100 rounded-3xl">
                          <p className="text-[8px] font-black uppercase text-stone-300 mb-1 tracking-widest">{stat.label}</p>
                          <p className="text-[10px] font-black text-stone-800 uppercase">{stat.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-10 bg-stone-50 rounded-[3.5rem] border border-stone-100 min-h-[120px]">
                      <p className="text-[8px] font-black uppercase text-stone-400 mb-4 tracking-[0.4em]">Decrypted Intel</p>
                      <p className="text-sm text-stone-600 leading-relaxed italic">"{selectedEvent?.description || selectedEvent?.content || "System entry - no description."}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 pt-4 border-t border-stone-50 bg-stone-50/20">
                {viewMode === 'CREATE' ? (
                  <button 
                    onClick={deployEvent} disabled={isSubmitting || !formTitle}
                    className="w-full bg-stone-900 text-white py-7 rounded-3xl text-[10px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-3 hover:bg-[#A3B18A] transition-all disabled:opacity-30"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={16} />} Deploy Entry
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button className="flex-1 py-6 rounded-2xl bg-white border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">Archive Entry</button>
                    <button className="flex-1 py-6 rounded-2xl bg-stone-900 text-[#A3B18A] text-[9px] font-black uppercase tracking-widest transition-all">Modify Protocol</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1900px] mx-auto p-6 md:p-12 lg:p-16 grid lg:grid-cols-12 gap-16">
        
        {/* --- LAYER: MAIN CALENDAR MATRIX --- */}
        <div className="lg:col-span-9 flex flex-col space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 px-4">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-100 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">System Live</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-100 rounded-full">
                  <Database size={10} className="text-stone-300" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">{events.length} Entries</span>
                </div>
              </div>
              <h1 className="text-7xl md:text-[10rem] font-serif italic text-stone-800 tracking-tighter leading-[0.75] lowercase">
                {format(currentMonth, "MMMM")} <span className="text-stone-100">{format(currentMonth, "yyyy")}</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-full border border-stone-100 shadow-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-5 hover:bg-stone-50 rounded-full transition-all">
                <ChevronLeft size={28} className="text-stone-400" />
              </button>
              <div className="h-10 w-px bg-stone-100" />
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-5 hover:bg-stone-50 rounded-full transition-all">
                <ChevronRight size={28} className="text-stone-400" />
              </button>
            </div>
          </header>

          <section className="bg-white rounded-[5rem] border border-stone-100 shadow-3xl overflow-hidden flex flex-col min-h-[900px]">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="py-10 text-center text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">{d}</div>
              ))}
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-7 flex-1">
              {daysInView.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrent = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleOpenCreate(day)}
                    className={`min-h-[180px] p-8 border-r border-b border-stone-50 transition-all cursor-pointer group relative
                      ${!isCurrent ? 'opacity-10 grayscale bg-stone-50/50' : 'bg-white hover:bg-[#FBFAF8]'}
                      ${isSelected ? 'bg-[#A3B18A]/5' : ''}
                      ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <span className={`text-[13px] font-black w-10 h-10 flex items-center justify-center rounded-2xl transition-all
                        ${isToday ? 'bg-stone-900 text-[#A3B18A] shadow-2xl' : 'text-stone-300 group-hover:text-stone-800'}`}>
                        {format(day, "d")}
                      </span>
                    </div>

                    <div className="space-y-2 relative z-10">
                      {dayEvents.slice(0, 4).map((e, i) => (
                        <motion.div 
                          key={e.id || i}
                          onClick={(ev) => { ev.stopPropagation(); handleOpenEvent(e); }}
                          whileHover={{ x: 4 }}
                          className="px-4 py-2.5 rounded-2xl bg-white border border-stone-100 text-[9px] font-black uppercase truncate text-stone-500 hover:border-[#A3B18A] transition-all flex items-center gap-2 shadow-sm"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${e.displayType === 'SIGNAL' ? 'bg-[#A3B18A]' : 'bg-stone-300'}`} />
                          <span className="truncate tracking-tight">{e.title || e.subject}</span>
                        </motion.div>
                      ))}
                      {dayEvents.length > 4 && (
                        <p className="text-[8px] font-black text-[#A3B18A] pl-3 tracking-widest mt-2">+{dayEvents.length - 4} Entries</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-between px-10 py-6 bg-stone-900 rounded-[3rem] text-white">
            <div className="flex gap-12">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#A3B18A] rounded-full shadow-[0_0_10px_rgba(163,177,138,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Operations: {events.filter(e => e.displayType === 'OPERATION').length}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-stone-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest">Signal Feed: {events.filter(e => e.displayType === 'SIGNAL').length}</span>
              </div>
            </div>
            <p className="text-[9px] font-black text-stone-500 tracking-[0.5em] uppercase">Tots Protocol V3.3.1</p>
          </footer>
        </div>

        {/* --- LAYER: AGGREGATOR SIDEBAR --- */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-3xl flex flex-col sticky top-12 h-[calc(100vh-100px)]">
            
            <div className="mb-16 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-px bg-[#A3B18A]" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#A3B18A]">{format(selectedDay, "EEEE")}</p>
                </div>
                <h2 className="text-7xl font-serif italic text-stone-800 tracking-tighter lowercase leading-none">{format(selectedDay, "do MMM")}</h2>
              </div>
              <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center border border-stone-100">
                <Activity size={24} className="text-[#A3B18A]" />
              </div>
            </div>

            {/* Filter Hub */}
            <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar">
              {(['ALL', 'OPERATION', 'SIGNAL'] as const).map(f => (
                <button 
                  key={f} onClick={() => setActiveFilter(f)}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                    ${activeFilter === f ? 'bg-stone-900 text-[#A3B18A]' : 'bg-stone-50 text-stone-400 hover:text-stone-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Day Specific Entry List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-12 pr-2">
              {getEventsForDate(selectedDay).length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center opacity-20">
                  <Shield size={56} strokeWidth={1} className="mb-6 text-stone-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Timeline Void</p>
                </div>
              ) : (
                getEventsForDate(selectedDay).map((event) => (
                  <SidebarItem key={event.id} event={event} />
                ))
              )}
            </div>

            {/* Action Zone */}
            <div className="pt-10 space-y-4 border-t border-stone-50">
              <button 
                onClick={() => handleOpenCreate(selectedDay)}
                className="w-full bg-stone-900 text-[#A3B18A] py-8 rounded-[3rem] shadow-2xl flex items-center justify-center gap-5 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-all duration-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.6em]">Establish Entry</span>
              </button>
              
              <div className="flex gap-4">
                <button onClick={syncCalendar} className="flex-1 p-6 bg-stone-50 rounded-[2rem] text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-lg transition-all flex justify-center">
                  <RefreshCw size={22} className={isLoading ? 'animate-spin text-[#A3B18A]' : ''} />
                </button>
                <button className="flex-1 p-6 bg-stone-50 rounded-[2rem] text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-lg transition-all flex justify-center">
                  <Settings size={22} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-3xl { box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.12); }
      `}</style>
    </div>
  );
}