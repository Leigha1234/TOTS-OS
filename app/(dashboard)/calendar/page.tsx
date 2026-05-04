"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Landmark, X, Loader2
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
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("tasks")
        .select("*, customers(name)")
        .eq("user_id", user.id)
        .order("priority", { ascending: false });
      if (!error) setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // UPDATED: Click handler for days
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("tasks").insert({
        title: newTitle,
        user_id: user?.id,
        created_at: selectedDay.toISOString(),
        status: "todo",
        priority: 1
      });
      if (!error) {
        setNewTitle("");
        setIsModalOpen(false);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
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

  const getTasksForDay = (day: Date) => tasks.filter(t => isSameDay(new Date(t.created_at), day));
  const selectedDayTasks = useMemo(() => getTasksForDay(selectedDay), [selectedDay, tasks]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 overflow-x-hidden">
      
      {/* MODAL: Google Calendar Style Pop-up */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/20 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-100"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-1 text-left">Create Event</p>
                  <h3 className="text-3xl font-serif italic text-stone-800">{format(selectedDay, "do MMMM")}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <div className="space-y-6">
                <input 
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEntry()}
                  placeholder="What's happening?"
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 ring-[#a9b897]/20 font-serif italic"
                />
                <button 
                  onClick={handleCreateEntry}
                  disabled={isSubmitting || !newTitle}
                  className="w-full bg-[#a9b897] text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-lg shadow-[#a9b897]/20"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Save Event
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8 items-start">
        
        {/* MAIN CALENDAR GRID */}
        <div className="lg:col-span-9 bg-white rounded-[3.5rem] border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-8 flex justify-between items-center border-b border-stone-50">
             <h1 className="text-5xl font-serif italic text-stone-800 tracking-tighter leading-none lowercase">
               {format(currentMonth, "MMMM")}
             </h1>
             <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-800 transition-colors"><ChevronLeft size={18}/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-800 transition-colors"><ChevronRight size={18}/></button>
             </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/30">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-4 text-center text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)} // Trigger Modal on Click
                  className={`min-h-[140px] p-4 border-r border-b border-stone-50 transition-all cursor-pointer relative
                    ${!isCurrentMonth ? 'opacity-20' : 'bg-white hover:bg-[#a9b897]/5'}
                    group
                  `}
                >
                  <span className={`text-xs font-bold transition-colors ${isToday ? 'bg-stone-900 text-white px-2 py-1 rounded-lg' : 'text-stone-800 group-hover:text-[#a9b897]'}`}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Task Previews */}
                  <div className="mt-2 space-y-1">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-[8px] font-black uppercase truncate bg-stone-50 border border-stone-100 p-1 rounded tracking-tighter text-stone-500">
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[7px] font-black text-stone-300 uppercase mt-1">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR DETAIL */}
        <aside className="lg:col-span-3 flex flex-col gap-6 h-full">
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm flex flex-col min-h-[400px]">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif italic text-stone-800 leading-none mb-2">{format(selectedDay, "do")}</h2>
              <h3 className="text-2xl font-serif italic text-stone-400">{format(selectedDay, "MMMM")}</h3>
              <div className="h-px bg-stone-100 w-12 mx-auto my-4" />
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Agenda</p>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto max-h-[400px]">
              {selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                   <CalendarIcon size={32} className="mb-2" />
                   <p className="text-stone-400 font-serif italic text-sm">No entries scheduled.</p>
                </div>
              ) : (
                selectedDayTasks.map(task => (
                  <div key={task.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-[#a9b897]/30 transition-colors">
                    <p className="text-[10px] font-bold text-stone-700 leading-tight uppercase tracking-tight">{task.title}</p>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-[7px] text-center uppercase tracking-widest text-stone-300 mt-6 font-bold">
              Click any date to add entry
            </p>
          </div>

          {/* FISCAL CARD */}
          <div className="bg-[#a9b897] p-8 rounded-[3rem] text-white relative overflow-hidden flex-shrink-0">
            <div className="relative z-10">
              <Landmark size={24} className="mb-4 opacity-50" />
              <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80 uppercase">Fiscal Deadline</p>
              <p className="text-3xl font-serif italic leading-none mb-4">May 31st</p>
              <p className="text-[10px] opacity-90 leading-relaxed font-medium">VAT Quarter Return sequence required in 52 days.</p>
            </div>
            <CalendarIcon size={120} className="absolute -right-6 -bottom-6 opacity-10" />
          </div>
        </aside>

      </div>
    </div>
  );
}