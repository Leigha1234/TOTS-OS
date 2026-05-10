"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, X, Loader2, MapPin, Clock, Video, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval 
} from "date-fns";

const PRESET_COLORS = [
  { name: 'Brand', value: '#A3B18A' }, // Soft sage from your screenshot
  { name: 'Social', value: '#ec4899' },
  { name: 'Finance', value: '#eab308' },
  { name: 'Strategy', value: '#8b5cf6' },
  { name: 'Urgent', value: '#f43f5e' }
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
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
      if (!user) throw new Error("Auth required");

      const combinedDate = new Date(`${selectedDateString}T${eventTime}:00`);
      
      const payload = {
        title: newTitle,
        user_id: user.id,
        created_at: combinedDate.toISOString(),
        description: notes || "",
        status: "todo", // Ensure default is provided
        priority: 1,    // Ensure default is provided
        color: eventColor,
        location: eventLocation || null,
        vc_link: vcLink || null
      };

      const { error } = await supabase.from("tasks").insert([payload]);

      if (error) {
        console.error("Supabase Error Details:", error);
        alert(`DB Error: ${error.message}`);
        return;
      }

      setIsModalOpen(false);
      setNewTitle("");
      setNotes("");
      setVcLink("");
      setEventLocation("");
      fetchEvents();
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(start), end: endOfWeek(endOfMonth(start)) });
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 pb-32">
      
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full md:max-w-md bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl border border-stone-100 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-serif italic text-stone-800">New Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={18} /></button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 no-scrollbar">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="event" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm italic focus:outline-none focus:border-stone-900 transition-all" />
                
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={selectedDateString} onChange={(e) => setSelectedDateString(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:outline-none" />
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs focus:outline-none" />
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input value={vcLink} onChange={(e) => setVcLink(e.target.value)} placeholder="Virtual Meeting Link" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 pl-10 text-xs focus:outline-none" />
                  </div>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Physical Location" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 pl-10 text-xs focus:outline-none" />
                  </div>
                </div>

                <div className="flex gap-2 py-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c.name} onClick={() => setEventColor(c.value)} className={`w-6 h-6 rounded-full border-2 transition-all ${eventColor === c.value ? 'border-stone-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />
                  ))}
                </div>

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal objectives..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs h-20 resize-none focus:outline-none" />
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

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-serif italic text-stone-800">{format(currentMonth, "MMMM yyyy")}</h1>
           <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white border border-stone-100 rounded-lg shadow-sm"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white border border-stone-100 rounded-lg shadow-sm"><ChevronRight size={20}/></button>
           </div>
        </div>
        
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-300 border-b border-stone-50">{d}</div>
          ))}
          {calendarDays.map((day) => (
            <div 
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`min-h-[100px] p-2 border-r border-b border-stone-50 transition-all cursor-pointer relative
                ${!isSameMonth(day, currentMonth) ? 'opacity-20' : 'bg-white hover:bg-stone-50/50'}
                ${isSameDay(day, selectedDay) ? 'bg-stone-50' : ''}
              `}
            >
              <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? 'bg-stone-900 text-white px-1.5 py-0.5 rounded' : 'text-stone-800'}`}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {tasks.filter(t => isSameDay(new Date(t.created_at), day)).slice(0, 2).map((t, i) => (
                  <div key={i} className="text-[7px] font-black uppercase truncate p-1 rounded border-l-2 bg-stone-50" style={{ borderLeftColor: t.color }}>{t.title}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}