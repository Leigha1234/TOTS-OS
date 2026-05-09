"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Landmark, X, Loader2, MapPin, Clock, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval 
} from "date-fns";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // System Data States
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projectDeadlines, setProjectDeadlines] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedDateString, setSelectedDateString] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState("#a9b897");
  const [vcLink, setVcLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchSystemData();
  }, [currentMonth, supabase]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id);
      setTasks(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSystemData() {
    try {
      const [inv, proj, soc, hol] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("projects").select("*"),
        supabase.from("social_posts").select("*"),
        supabase.from("holidays").select("*"),
      ]);
      setInvoices(inv.data || []);
      setProjectDeadlines(proj.data || []);
      setSocials(soc.data || []);
      setHolidays(hol.data || []);
    } catch (e) {
      console.error("Contextual data sync failed", e);
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSelectedDateString(format(day, "yyyy-MM-dd"));
  };

  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const combinedDate = new Date(`${selectedDateString}T${eventTime}:00`);
      const { error } = await supabase.from("tasks").insert([{
        title: newTitle, user_id: user.id, created_at: combinedDate.toISOString(),
        description: notes, status: "todo", priority: 1, color: eventColor,
        location: eventLocation, vc_link: vcLink
      }]);
      if (!error) {
        setIsModalOpen(false);
        setNewTitle("");
        fetchEvents();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const { monthStart, calendarDays } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    return {
      monthStart: start,
      calendarDays: eachDayOfInterval({ 
        start: startOfWeek(start), 
        end: endOfWeek(endOfMonth(start)) 
      })
    };
  }, [currentMonth]);

  const getCombinedEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return [
      ...tasks.filter(t => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr).map(t => ({ ...t, type: "Task" })),
      ...invoices.filter(i => i.due_date && format(new Date(i.due_date), "yyyy-MM-dd") === dayStr).map(i => ({ ...i, title: `Invoice: ${i.amount}`, type: "Invoice", color: "#eab308" })),
      ...projectDeadlines.filter(p => p.deadline && format(new Date(p.deadline), "yyyy-MM-dd") === dayStr).map(p => ({ ...p, title: `Deadline: ${p.name}`, type: "Project", color: "#3b82f6" })),
      ...socials.filter(s => s.scheduled_for && format(new Date(s.scheduled_for), "yyyy-MM-dd") === dayStr).map(s => ({ ...s, title: `Post: ${s.platform}`, type: "Social", color: "#ec4899" })),
      ...holidays.filter(h => h.date && format(new Date(h.date), "yyyy-MM-dd") === dayStr).map(h => ({ ...h, title: h.name, type: "Holiday", color: "#10b981" }))
    ];
  };
  
  const selectedDayEvents = useMemo(() => getCombinedEventsForDay(selectedDay), [selectedDay, tasks, invoices, projectDeadlines, socials, holidays]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-3 md:p-10 text-stone-900 pb-32">
      
      {/* MODAL: Fixed Framer Motion Syntax */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-end md:items-center justify-center z-[100]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full md:max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-serif italic text-stone-800">New Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full transition-colors hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Event Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Node Activity..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm focus:outline-none ring-2 ring-transparent focus:ring-[#a9b897]/20 transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Schedule Date</label>
                    <input type="date" value={selectedDateString} onChange={(e) => setSelectedDateString(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Time</label>
                    <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Additional Intelligence</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Strategic notes..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm h-24 resize-none focus:outline-none" />
                </div>

                <button 
                  onClick={handleCreateEntry} 
                  disabled={isSubmitting || !newTitle} 
                  className="w-full bg-stone-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 
                  Provision Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* CALENDAR BLOCK */}
        <div className="lg:col-span-9 bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-10 flex justify-between items-center bg-white border-b border-stone-50">
             <div className="space-y-1">
               <p className="hidden md:block text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Chronos Module</p>
               <h1 className="text-3xl md:text-5xl font-serif italic text-stone-800 lowercase capitalize leading-none">
                 {format(currentMonth, "MMMM")}
               </h1>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors"><ChevronRight size={20}/></button>
             </div>
          </div>
          
          <div className="grid grid-cols-7 bg-stone-50/30 border-b border-stone-50">
            {["S", "M", "T", "W", "T", "F", "S"].map(d => (
              <div key={d} className="py-4 text-center text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-300">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayEvents = getCombinedEventsForDay(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[90px] md:min-h-[140px] p-2 md:p-5 border-r border-b border-stone-50 transition-all cursor-pointer relative
                    ${!isCurrentMonth ? 'opacity-10 pointer-events-none' : 'bg-white hover:bg-stone-50/50'}
                    ${isSelected && isCurrentMonth ? 'bg-[#fcfaf7]' : ''}
                  `}
                >
                  <span className={`text-[10px] md:text-xs font-bold transition-all ${isToday ? 'bg-stone-900 text-white px-2 py-0.5 rounded-md' : 'text-stone-800'}`}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Desktop List vs Mobile Dots */}
                  <div className="mt-2">
                    <div className="hidden md:flex flex-col gap-1">
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div key={i} className="text-[7px] font-black uppercase truncate p-1.5 rounded-lg border leading-none" style={{ backgroundColor: `${e.color}10`, borderColor: `${e.color}40`, color: '#444' }}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <p className="text-[7px] font-black text-stone-300 uppercase pl-1">+{dayEvents.length - 2} More</p>}
                    </div>
                    <div className="flex md:hidden gap-1 flex-wrap mt-2">
                      {dayEvents.slice(0, 4).map((e, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR AGENDA */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] md:rounded-[3rem] border border-stone-100 shadow-sm flex flex-col min-h-[450px]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-1">{format(selectedDay, "EEEE")}</p>
                <h2 className="text-3xl font-serif italic text-stone-800 leading-none">{format(selectedDay, "do MMM")}</h2>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(true)} 
                className="p-4 bg-stone-900 text-white rounded-2xl shadow-xl hover:bg-stone-800 transition-all"
              >
                <Plus size={20} />
              </motion.button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center space-y-2 opacity-30">
                  <CalendarIcon size={24} className="mx-auto text-stone-400" />
                  <p className="text-xs font-serif italic text-stone-500">Zero operations scheduled.</p>
                </div>
              ) : (
                selectedDayEvents.map((e, i) => (
                  <div key={i} className="p-5 rounded-[1.5rem] border bg-[#faf9f6] transition-all hover:border-stone-300" style={{ borderLeftWidth: '4px', borderLeftColor: e.color }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[7px] font-black uppercase tracking-widest text-stone-400">{e.type}</span>
                      {e.created_at && <span className="text-[7px] text-stone-400 font-bold">{format(new Date(e.created_at), "HH:mm")}</span>}
                    </div>
                    <p className="text-[10px] font-bold text-stone-800 leading-tight uppercase tracking-tight">{e.title}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-50">
              <p className="text-[7px] text-center uppercase tracking-[0.3em] text-stone-300 font-black">
                Select date to update node agenda
              </p>
            </div>
          </div>

          {/* FISCAL CARD: Hidden on small mobile to reduce clutter */}
          <div className="hidden sm:block bg-[#a9b897] p-8 rounded-[3rem] text-white relative overflow-hidden group shadow-lg shadow-[#a9b897]/20">
            <div className="relative z-10">
              <Landmark size={24} className="mb-4 opacity-50 group-hover:scale-110 transition-transform" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 opacity-80">Financial Sentinel</p>
              <p className="text-2xl font-serif italic leading-none mb-2">VAT Cycle End</p>
              <p className="text-[10px] font-medium opacity-90 leading-relaxed">System tracking 52 days until next tax sequence.</p>
            </div>
            <CalendarIcon size={120} className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </aside>
      </div>
    </div>
  );
}