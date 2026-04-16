"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Zap, Plus, Landmark 
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

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  async function fetchEvents() {
    setLoading(true);
    
    // Using getSession to prevent the "Lock Stolen" ReferenceError in dev environments
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*, customers(name)")
      .eq("user_id", user.id)
      .order("priority", { ascending: false });

    if (!error) {
      setTasks(data || []);
    }
    setLoading(false);
  }

  // --- Calendar Math ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = useMemo(() => 
    eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(new Date(task.created_at), day));
  };

  const selectedDayTasks = useMemo(() => getTasksForDay(selectedDay), [selectedDay, tasks]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 text-stone-900">
      
      {/* HEADER: NAVIGATION */}
      <header className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Temporal Ledger</p>
          <div className="flex items-center gap-6">
            <h1 className="text-7xl font-serif italic text-stone-800 tracking-tighter">
              {format(currentMonth, "MMMM")}
            </h1>
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                className="p-3 bg-white rounded-full border border-stone-100 hover:bg-stone-50 transition shadow-sm active:scale-95"
              >
                <ChevronLeft size={20} className="text-stone-400" />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                className="p-3 bg-white rounded-full border border-stone-100 hover:bg-stone-50 transition shadow-sm active:scale-95"
              >
                <ChevronRight size={20} className="text-stone-400" />
              </button>
            </div>
          </div>
        </div>

        {/* CLARITY INSIGHT PANEL */}
        <div className="bg-[#1c1c1c] text-white p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl border border-stone-800 min-w-[320px] md:min-w-[400px]">
          <div className="p-4 bg-stone-800 rounded-3xl text-[#a9b897]">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Upcoming Volatility</p>
            <p className="text-lg font-serif italic text-stone-200">
              {loading ? "Syncing..." : `${tasks.length} active transmissions this month.`}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8">
        
        {/* MAIN CALENDAR GRID */}
        <div className="lg:col-span-9 bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-stone-300">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDay);

              return (
                <div 
                  key={day.toString()} 
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[140px] p-4 border-r border-b border-stone-50 transition-all cursor-pointer group relative
                    ${!isCurrentMonth ? 'bg-stone-50/30' : 'bg-white'}
                    ${isSelected ? 'bg-stone-50/80' : 'hover:bg-stone-50/50'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold transition-all ${
                      isToday 
                        ? 'bg-stone-900 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-lg' 
                        : isCurrentMonth ? 'text-stone-800' : 'text-stone-200'
                    }`}>
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] shadow-[0_0_8px_#a9b897]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task, idx) => (
                      <div key={task.id} className="bg-stone-100 px-2 py-1 rounded-md text-[9px] font-black uppercase text-stone-500 truncate tracking-tighter border border-transparent group-hover:border-stone-200">
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[8px] text-stone-300 font-black uppercase pl-1">
                        + {dayTasks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR: DAY DETAIL */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <h3 className="text-2xl font-serif italic text-stone-800 mb-1">
              {format(selectedDay, "do MMMM")}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-4 mb-6">Agenda Node</p>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {selectedDayTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="py-12 text-center"
                  >
                    <Clock size={24} className="mx-auto text-stone-200 mb-2" />
                    <p className="text-xs text-stone-300 italic font-serif">No transmissions scheduled.</p>
                  </motion.div>
                ) : (
                  selectedDayTasks.map((task) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task.id} 
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-100 group hover:border-[#a9b897] transition-colors"
                    >
                      <p className="text-xs font-bold text-stone-800 leading-snug">{task.title}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[8px] font-black bg-white px-2 py-1 rounded-lg text-stone-400 uppercase tracking-tighter">
                          {task.customers?.name || "General"}
                        </span>
                        {task.priority >= 3 && <Zap size={10} className="text-amber-500" fill="currentColor" />}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <button className="w-full mt-8 bg-stone-900 text-[#a9b897] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
              <Plus size={14} /> New Entry
            </button>
          </div>

          {/* FISCAL DEADLINES BOX */}
          <div className="bg-[#a9b897] p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
               <Landmark size={32} className="mb-4 opacity-50" />
               <p className="text-[10px] font-black uppercase tracking-widest mb-2">Next Tax Point</p>
               <p className="text-3xl font-serif italic leading-tight">May 31st</p>
               <p className="text-xs mt-2 opacity-80 font-medium">VAT Quarter Return due in 52 days.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
              <CalendarIcon size={120} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}