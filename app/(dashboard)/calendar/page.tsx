"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, X, Loader2, MapPin, Clock, Video, Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval 
} from "date-fns";

const PRESET_COLORS = [
  { name: 'Sage', value: '#A3B18A' },
  { name: 'Rose', value: '#E07A5F' },
  { name: 'Amber', value: '#F2CC8F' },
  { name: 'Slate', value: '#3D405B' },
  { name: 'Terracotta', value: '#81171B' }
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [selectedDateString, setSelectedDateString] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState(PRESET_COLORS[0].value);
  const [vcLink, setVcLink] = useState("");
  const [notes, setNotes] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => { fetchEvents(); }, [currentMonth, supabase]);

  async function fetchEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id);
    setTasks(data || []);
  }

  const handleDayClick = (day: Date) => {
    if (isSameDay(day, selectedDay)) {
      setSelectedDateString(format(day, "yyyy-MM-dd"));
      setIsModalOpen(true);
    } else {
      setSelectedDay(day);
    }
  };

  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const combinedDate = new Date(`${selectedDateString}T${eventTime}:00`);
      
      const { error } = await supabase.from("tasks").insert([{
        title: newTitle,
        user_id: user.id,
        created_at: combinedDate.toISOString(),
        description: notes || "",
        status: "todo",
        priority: 1,
        color: eventColor,
        location: eventLocation || null,
        vc_link: vcLink || null
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewTitle("");
      setNotes("");
      setVcLink("");
      setEventLocation("");
      fetchEvents();
    } catch (err: any) {
      alert(`DB Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(start), end: endOfWeek(endOfMonth(start)) });
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
    return tasks.filter(t => isSameDay(new Date(t.created_at), selectedDay));
  }, [selectedDay, tasks]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 pb-32">
      
      {/* ADD ENTRY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full md:max-w-md bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-stone-100 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-serif italic text-stone-800">New Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100"><X size={18} /></button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 no-scrollbar">
                <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Event Name</label>
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="event title..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm italic focus:outline-none focus:border-stone-900 transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={selectedDateString} onChange={(e) => setSelectedDateString(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:outline-none" />
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:outline-none" />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input value={vcLink} onChange={(e) => setVcLink(e.target.value)} placeholder="Virtual Meeting Link" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 pl-10 text-[10px] focus:outline-none" />
                  </div>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Physical Location" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 pl-10 text-[10px] focus:outline-none" />
                  </div>
                </div>

                <div className="flex gap-2 py-1">
                  {PRESET_COLORS.map(c => (
                    <button key={c.name} onClick={() => setEventColor(c.value)} className={`w-6 h-6 rounded-full border-2 transition-all ${eventColor === c.value ? 'border-stone-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />
                  ))}
                </div>

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs h-20 resize-none focus:outline-none" />
              </div>

              <div className="pt-4 shrink-0">
                <button 
                  onClick={handleCreateEntry} 
                  disabled={isSubmitting || !newTitle} 
                  className="w-full bg-stone-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                  Establish Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8">
        
        {/* CALENDAR MAIN */}
        <div className="lg:col-span-9">
          <div className="flex justify-between items-center mb-8">
             <div>
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Chronos Protocol</p>
               <h1 className="text-4xl font-serif italic text-stone-800 lowercase">{format(currentMonth, "MMMM yyyy")}</h1>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-white border border-stone-100 rounded-2xl shadow-sm"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-white border border-stone-100 rounded-2xl shadow-sm"><ChevronRight size={20}/></button>
             </div>
          </div>
          
          <div className="bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden grid grid-cols-7">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-5 text-center text-[9px] font-black uppercase tracking-widest text-stone-300 border-b border-stone-50">{d}</div>
            ))}
            {calendarDays.map((day) => (
              <div 
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] p-3 border-r border-b border-stone-50 transition-all cursor-pointer relative group
                  ${!isSameMonth(day, currentMonth) ? 'bg-stone-50/30 opacity-20' : 'bg-white hover:bg-stone-50/50'}
                  ${isSameDay(day, selectedDay) ? 'bg-stone-50/80' : ''}
                `}
              >
                <span className={`text-[11px] font-bold ${isSameDay(day, new Date()) ? 'bg-stone-900 text-white px-1.5 py-0.5 rounded-md' : 'text-stone-800'}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-2 space-y-1">
                  {tasks.filter(t => isSameDay(new Date(t.created_at), day)).slice(0, 3).map((t, i) => (
                    <div key={i} className="text-[7px] font-black uppercase truncate p-1.5 rounded-lg border-l-2 bg-white shadow-sm" style={{ borderLeftColor: t.color || '#A3B18A' }}>
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - AGENDA */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm flex flex-col min-h-[500px]">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">{format(selectedDay, "EEEE")}</p>
                   <h2 className="text-3xl font-serif italic text-stone-800 leading-none">{format(selectedDay, "do MMM")}</h2>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="p-4 bg-stone-900 text-white rounded-2xl hover:scale-105 transition-transform"><Plus size={20}/></button>
             </div>

             <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] no-scrollbar">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <CalendarIcon size={24} className="mx-auto mb-2" />
                    <p className="text-[10px] font-serif italic">No operations listed.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((e, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#faf9f6] border border-stone-100">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white" style={{ color: e.color }}>Task</span>
                         <span className="text-[8px] font-bold text-stone-400">{format(new Date(e.created_at), "HH:mm")}</span>
                      </div>
                      <p className="text-[10px] font-bold text-stone-800 uppercase leading-tight">{e.title}</p>
                      {e.vc_link && <a href={e.vc_link} target="_blank" className="mt-2 flex items-center gap-1 text-[8px] text-blue-500 font-bold"><Video size={10}/> Join Call</a>}
                    </div>
                  ))
                )}
             </div>

             <div className="mt-8 pt-6 border-t border-stone-50">
                <div className="bg-stone-900 p-6 rounded-[2rem] text-white relative overflow-hidden">
                   <Landmark size={18} className="mb-2 opacity-50"/>
                   <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Intelligence</p>
                   <p className="text-sm font-serif italic">Operational node active.</p>
                </div>
             </div>
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