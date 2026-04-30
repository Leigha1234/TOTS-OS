"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Zap, Plus, Landmark, X, Loader2
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
  
  // --- New Modal State ---
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
      console.error("Ledger Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- Create Entry Handler ---
  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("tasks").insert({
        title: newTitle,
        user_id: user?.id,
        created_at: selectedDay.toISOString(), // Set entry to selected day
        status: "todo",
        priority: 1
      });

      if (!error) {
        setNewTitle("");
        setIsModalOpen(false);
        fetchEvents(); // Refresh calendar
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

  const getTasksForDay = (day: Date) => 
    tasks.filter(t => isSameDay(new Date(t.created_at), day));

  const selectedDayTasks = useMemo(() => 
    getTasksForDay(selectedDay), 
  [selectedDay, tasks]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-6 md:p-12 text-stone-900 font-sans">
      
      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[3.5rem] p-10 shadow-2xl z-[70] border border-stone-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a9b897]">New Protocol</p>
                  <h3 className="text-3xl font-serif italic text-stone-800">{format(selectedDay, "MMMM do")}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-stone-50 rounded-full transition-colors">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Entry Description</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Identify the objective..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 ring-[#a9b897]/20 transition-all font-serif italic"
                  />
                </div>
                
                <button 
                  onClick={handleCreateEntry}
                  disabled={isSubmitting || !newTitle}
                  className="w-full bg-stone-900 text-[#a9b897] py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Initialize Entry
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Archive / 2026</p>
          <div className="flex items-center gap-8">
            <h1 className="text-8xl font-serif italic text-stone-800 tracking-tighter leading-none">
              {format(currentMonth, "MMMM")}
            </h1>
            <div className="flex gap-1">
              <NavButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} icon={<ChevronLeft size={20}/>} />
              <NavButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} icon={<ChevronRight size={20}/>} />
            </div>
          </div>
        </div>

        <div className="bg-[#1c1c1c] text-white p-7 rounded-[3rem] flex items-center gap-8 shadow-2xl min-w-[380px]">
          <div className="p-4 bg-stone-800 rounded-2xl text-[#a9b897]">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">System Velocity</p>
            <p className="text-xl font-serif italic text-stone-100">
              {loading ? "Re-indexing..." : `${tasks.length} active nodes this cycle.`}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-10">
        
        {/* CALENDAR ENGINE */}
        <div className="lg:col-span-9 bg-white rounded-[4rem] border border-stone-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[160px] p-5 border-r border-b border-stone-50 transition-all cursor-pointer group relative
                    ${!isCurrentMonth ? 'opacity-20 bg-stone-50/10' : 'bg-white hover:bg-stone-50/40'}
                    ${isSameDay(day, selectedDay) ? 'bg-stone-50/80' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-sm font-bold ${isToday ? 'bg-stone-900 text-white px-2 py-1 rounded-lg' : 'text-stone-800'}`}>
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897]" />}
                  </div>

                  <div className="space-y-1.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-[9px] font-black uppercase tracking-tighter text-stone-500 bg-stone-100/50 px-2 py-1 rounded-md truncate border border-transparent group-hover:border-stone-200">
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && <p className="text-[8px] font-black text-stone-300 uppercase pl-1">+ {dayTasks.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR DETAIL */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm sticky top-12">
            <h2 className="text-3xl font-serif italic text-stone-800 mb-1">{format(selectedDay, "do MMMM")}</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 border-b border-stone-50 pb-6 mb-8">Selected Node</p>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="wait">
                {selectedDayTasks.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center opacity-20 italic font-serif">
                    Quiet on the horizon.
                  </motion.div>
                ) : (
                  selectedDayTasks.map(task => (
                    <motion.div key={task.id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-5 bg-stone-50 rounded-[2rem] border border-stone-100 group hover:border-[#a9b897] transition-all">
                      <p className="text-xs font-bold text-stone-900 mb-3 leading-relaxed">{task.title}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 bg-white px-2 py-1 rounded-lg">{task.customers?.name || "Internal"}</span>
                        {task.priority >= 3 && <Zap size={10} className="text-amber-500" fill="currentColor" />}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* FIXED BUTTON: Now opens the modal */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-10 bg-stone-900 text-[#a9b897] py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Plus size={14} /> Create Entry
            </button>
          </div>

          <div className="bg-[#a9b897] p-10 rounded-[3.5rem] text-white relative overflow-hidden group shadow-xl">
            <div className="relative z-10">
              <Landmark size={32} className="mb-6 opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Fiscal Deadline</p>
              <p className="text-4xl font-serif italic leading-none mb-4">May 31st</p>
              <p className="text-xs opacity-80 leading-relaxed font-medium">VAT Quarter Return submission sequence required in 52 days.</p>
            </div>
            <CalendarIcon size={140} className="absolute -right-8 -bottom-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavButton({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="p-4 bg-white rounded-full border border-stone-100 hover:bg-stone-50 transition-all hover:shadow-md active:scale-90">
      <div className="text-stone-400">{icon}</div>
    </button>
  );
}