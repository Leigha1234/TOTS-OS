"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Landmark, X, Loader2, MapPin, Clock, Link as LinkIcon,
  Video, Users, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval 
} from "date-fns";

/**
 * TOTS OS v4.5 - INTERACTIVE CHRONOS
 * Features: Click-to-Add, Virtual Links, Color Selection, Location Sync
 */

const PRESET_COLORS = [
  { name: 'Brand', value: 'var(--brand-primary)' },
  { name: 'Social', value: '#ec4899' },
  { name: 'Finance', value: '#eab308' },
  { name: 'Strategy', value: '#8b5cf6' },
  { name: 'Urgent', value: '#f43f5e' }
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // System Data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projectDeadlines, setProjectDeadlines] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedDateString, setSelectedDateString] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState(PRESET_COLORS[0].value);
  const [vcLink, setVcLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

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
    const [inv, proj, soc] = await Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("social_posts").select("*"),
    ]);
    setInvoices(inv.data || []);
    setProjectDeadlines(proj.data || []);
    setSocials(soc.data || []);
  }

  // LOGIC: Click once to select, Click again to open "Add Entry"
  const handleDayClick = (day: Date) => {
    if (isSameDay(day, selectedDay)) {
      setSelectedDateString(format(day, "yyyy-MM-dd"));
      setIsModalOpen(true);
    } else {
      setSelectedDay(day);
      setSelectedDateString(format(day, "yyyy-MM-dd"));
    }
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
        setVcLink("");
        setEventLocation("");
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
      ...tasks.filter(t => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr).map(t => ({ ...t, type: "Task", color: t.color || 'var(--brand-primary)' })),
      ...invoices.filter(i => i.due_date && format(new Date(i.due_date), "yyyy-MM-dd") === dayStr).map(i => ({ ...i, title: `Invoice: £${i.amount}`, type: "Invoice", color: "#eab308" })),
      ...projectDeadlines.filter(p => p.deadline && format(new Date(p.deadline), "yyyy-MM-dd") === dayStr).map(p => ({ ...p, title: `Deadline: ${p.name}`, type: "Project", color: "#3b82f6" })),
      ...socials.filter(s => s.scheduled_for && format(new Date(s.scheduled_for), "yyyy-MM-dd") === dayStr).map(s => ({ ...s, title: `Post: ${s.platform}`, type: "Social", color: "#ec4899" })),
    ];
  };
  
  const selectedDayEvents = useMemo(() => getCombinedEventsForDay(selectedDay), [selectedDay, tasks, invoices, projectDeadlines, socials]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 pb-32">
      
      {/* MODAL: PROVISION ENTRY */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-end md:items-center justify-center z-[200] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative w-full md:max-w-xl bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Node Provisioning</p>
                  <h3 className="text-3xl font-serif italic text-stone-800">New Entry</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Event Name</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Creative Strategy Sync" className="w-full bg-stone-50 border-b border-stone-200 py-4 px-2 text-lg focus:outline-none focus:border-stone-900 transition-all font-serif italic" />
                </div>
                
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Date</label>
                    <input type="date" value={selectedDateString} onChange={(e) => setSelectedDateString(e.target.value)} className="w-full bg-stone-50 rounded-2xl p-4 text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Time</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-stone-50 rounded-2xl p-4 pl-10 text-xs focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Virtual Link & Location */}
                <div className="space-y-4">
                  <div className="relative">
                    <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={vcLink} onChange={(e) => setVcLink(e.target.value)} placeholder="Virtual Meeting Link (Zoom/Meet)" className="w-full bg-stone-50 rounded-2xl p-4 pl-10 text-xs focus:outline-none" />
                  </div>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Physical Location / Office" className="w-full bg-stone-50 rounded-2xl p-4 pl-10 text-xs focus:outline-none" />
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1 flex items-center gap-2"><Palette size={12}/> Protocol Color</label>
                  <div className="flex gap-3">
                    {PRESET_COLORS.map(c => (
                      <button key={c.name} onClick={() => setEventColor(c.value)} className={`w-8 h-8 rounded-full border-2 transition-all ${eventColor === c.value ? 'border-stone-900 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Strategy Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal objectives..." className="w-full bg-stone-50 rounded-3xl p-6 text-sm h-28 resize-none focus:outline-none border border-transparent focus:border-stone-100" />
                </div>

                <button onClick={handleCreateEntry} disabled={isSubmitting || !newTitle} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                  Establish Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8">
        
        {/* MAIN CALENDAR */}
        <div className="lg:col-span-9 bg-white rounded-[3rem] md:rounded-[4rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 md:p-12 flex justify-between items-center border-b border-stone-50">
             <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)]">Chronos Node</p>
               <h1 className="text-4xl md:text-6xl font-serif italic text-stone-800 leading-none lowercase">
                 {format(currentMonth, "MMMM")} <span className="text-stone-200">{format(currentMonth, "yyyy")}</span>
               </h1>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 transition-colors shadow-sm"><ChevronLeft size={24}/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 transition-colors shadow-sm"><ChevronRight size={24}/></button>
             </div>
          </div>
          
          <div className="grid grid-cols-7 bg-stone-50/20 border-b border-stone-50">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
              <div key={d} className="py-4 text-center text-[9px] font-black uppercase tracking-widest text-stone-300">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day) => {
              const dayEvents = getCombinedEventsForDay(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[110px] md:min-h-[160px] p-4 md:p-6 border-r border-b border-stone-50 transition-all cursor-pointer relative group
                    ${!isCurrentMonth ? 'bg-stone-50/30' : 'bg-white hover:bg-stone-50/50'}
                    ${isSelected ? 'bg-[#fcfaf7]' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] md:text-sm font-bold transition-all ${isToday ? 'bg-stone-900 text-white px-2 py-1 rounded-lg' : 'text-stone-800 opacity-40 group-hover:opacity-100'}`}>
                      {format(day, "d")}
                    </span>
                    {isSelected && <Plus size={12} className="text-stone-300" />}
                  </div>
                  
                  <div className="mt-4 space-y-1.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div key={i} className="text-[8px] font-black uppercase truncate p-2 rounded-xl border-l-[3px] bg-white shadow-sm" style={{ borderLeftColor: e.color }}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[8px] font-black text-stone-300 uppercase pl-2">+{dayEvents.length - 3} Operations</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR AGENDA */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)] mb-2">{format(selectedDay, "EEEE")}</p>
                <h2 className="text-4xl font-serif italic text-stone-800 leading-none">{format(selectedDay, "do MMM")}</h2>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsModalOpen(true)} className="p-5 bg-stone-900 text-white rounded-[1.5rem] shadow-2xl hover:bg-stone-800 transition-all">
                <Plus size={24} />
              </motion.button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
              {selectedDayEvents.length === 0 ? (
                <div className="py-16 text-center opacity-30">
                  <CalendarIcon size={32} className="mx-auto text-stone-300 mb-4" />
                  <p className="text-sm font-serif italic text-stone-500">Node inactive today.</p>
                </div>
              ) : (
                selectedDayEvents.map((e, i) => (
                  <div key={i} className="p-6 rounded-[2rem] border bg-[#faf9f6] transition-all hover:bg-white hover:shadow-lg group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-stone-100 rounded-md" style={{ color: e.color }}>{e.type}</span>
                      {e.created_at && <span className="text-[9px] text-stone-400 font-bold">{format(new Date(e.created_at), "HH:mm")}</span>}
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-tight uppercase mb-3">{e.title}</p>
                    
                    {/* Event Metadata (Virtual Link / Location) */}
                    {(e.vc_link || e.location) && (
                      <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
                        {e.vc_link && <a href={e.vc_link} target="_blank" className="flex items-center gap-2 text-[9px] font-bold text-blue-500 hover:underline"><Video size={10}/> Join Link</a>}
                        {e.location && <div className="flex items-center gap-2 text-[9px] text-stone-400 font-medium"><MapPin size={10}/> {e.location}</div>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-10 pt-6 border-t border-stone-50 text-center">
              <p className="text-[8px] uppercase tracking-[0.4em] text-stone-300 font-black">Sync Frequency: Realtime</p>
            </div>
          </div>

          {/* FISCAL SENTINEL CARD */}
          <div className="bg-[var(--brand-primary)] p-10 rounded-[3.5rem] text-white relative overflow-hidden group shadow-2xl">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6"><Landmark size={20} /></div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">Fiscal Sentinel</p>
              <h3 className="text-3xl font-serif italic leading-none mb-4">VAT Cycle</h3>
              <p className="text-xs font-medium opacity-90 leading-relaxed max-w-[180px]">Automated tracking: 52 days remaining in current sequence.</p>
            </div>
            <CalendarIcon size={160} className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
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