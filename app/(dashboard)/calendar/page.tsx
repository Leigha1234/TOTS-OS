"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, X, Loader2, MapPin, Clock, Video, Landmark, ExternalLink, Mail, Radio, Zap, Shield, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval 
} from "date-fns";

const PRESET_COLOURS = [
  { name: 'Sage', value: '#A3B18A' },
  { name: 'Rose', value: '#E07A5F' },
  { name: 'Amber', value: '#F2CC8F' },
  { name: 'Slate', value: '#3D405B' },
  { name: 'Terracotta', value: '#81171B' }
];

export default function ChronosProtocolPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [selectedDateString, setSelectedDateString] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("12:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColour, setEventColour] = useState(PRESET_COLOURS[0].value);
  const [vcLink, setVcLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => { fetchAllData(); }, [currentMonth, supabase]);

  async function fetchAllData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [tasksRes, campaignsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("campaigns").select("*").eq("user_id", user.id)
    ]);

    setTasks(tasksRes.data || []);
    setCampaigns(campaignsRes.data || []);
  }

  const getEventsForDay = (day: Date) => {
    const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day)).map(t => ({
        ...t,
        displayType: 'OPERATION',
        dateField: t.created_at
    }));

    const dayCampaigns = campaigns.filter(c => c.scheduled_for && isSameDay(new Date(c.scheduled_for), day)).map(c => ({
        ...c,
        displayType: 'SIGNAL',
        colour: '#8b5cf6', 
        dateField: c.scheduled_for
    }));

    return [...dayTasks, ...dayCampaigns].sort((a, b) => 
        new Date(a.dateField).getTime() - new Date(b.dateField).getTime()
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSelectedDateString(format(day, "yyyy-MM-dd"));
    setViewMode("create");
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTask(item);
    setViewMode("view");
    setIsModalOpen(true);
  };

  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth Required");

      const combinedDate = new Date(`${selectedDateString}T${eventTime}:00`);
      const { error } = await supabase.from("tasks").insert([{
        title: newTitle, user_id: user.id, created_at: combinedDate.toISOString(),
        description: notes, status: "todo", priority: 1, color: eventColour,
        location: eventLocation, vc_link: vcLink
      }]);

      if (error) throw error;
      setIsModalOpen(false);
      setNewTitle(""); setNotes(""); setVcLink(""); setEventLocation("");
      fetchAllData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(start), end: endOfWeek(endOfMonth(start)) });
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => getEventsForDay(selectedDay), [selectedDay, tasks, campaigns]);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 pb-32">
      
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full md:max-w-md bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-stone-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h3 className="text-3xl font-serif italic text-stone-800">
                    {viewMode === "create" ? "Establish Entry" : "Operation Briefing"}
                    </h3>
                    <p className="text-[8px] font-black uppercase text-[#a9b897] tracking-widest mt-1">Protocol Synchronisation</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100"><X size={18} /></button>
              </div>

              <div className="overflow-y-auto pr-1 no-scrollbar flex-1 space-y-6">
                {viewMode === "create" ? (
                  <>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1 tracking-widest">Operation Identifier</label>
                        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Entry Designation..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:outline-none focus:border-[#a9b897] transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Timeline</label>
                        <input type="date" value={selectedDateString} onChange={(e) => setSelectedDateString(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Dispatch Time</label>
                        <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs focus:outline-none" />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="relative"><Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={vcLink} onChange={(e) => setVcLink(e.target.value)} placeholder="Transmission Link (Visual Comms)" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-[10px] focus:outline-none" /></div>
                      <div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Physical Node Location" className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-[10px] focus:outline-none" /></div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Visual Protocol Colour</label>
                        <div className="flex gap-2 py-1">
                        {PRESET_COLOURS.map(c => (<button key={c.name} onClick={() => setEventColour(c.value)} className={`w-6 h-6 rounded-full border-2 transition-all ${eventColour === c.value ? 'border-stone-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Strategic Intent</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Operational Intelligence..." className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs h-28 resize-none focus:outline-none" />
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897]">{selectedTask?.displayType} ACTIVE</span>
                      <h4 className="text-3xl font-serif italic text-stone-800 leading-tight mt-1">{selectedTask?.title || selectedTask?.subject}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <Clock size={14} className="text-[#a9b897]"/> 
                        <span className="text-[10px] font-bold uppercase tracking-widest">{format(new Date(selectedTask?.dateField), "HH:mm")}</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <CalendarIcon size={14} className="text-[#a9b897]"/> 
                        <span className="text-[10px] font-bold uppercase tracking-widest">{format(new Date(selectedTask?.dateField), "MMM do")}</span>
                      </div>
                    </div>
                    {selectedTask?.displayType === 'SIGNAL' && (
                        <div className="flex items-center gap-4 p-5 bg-purple-50 text-purple-700 rounded-[2rem] border border-purple-100">
                            <Radio size={18} className="animate-pulse"/> <span className="text-[10px] font-black uppercase tracking-widest">Scheduled Signal Dispatch</span>
                        </div>
                    )}
                    {selectedTask?.vc_link && (
                      <a href={selectedTask.vc_link} target="_blank" className="flex items-center justify-between p-5 bg-stone-900 text-white rounded-[2rem] group transition-all hover:bg-[#a9b897]">
                        <div className="flex items-center gap-3"><Video size={18}/><span className="text-xs font-bold uppercase tracking-widest">Initialise Link</span></div>
                        <ExternalLink size={16} className="opacity-50 group-hover:opacity-100"/>
                      </a>
                    )}
                    {selectedTask?.location && <div className="flex items-center gap-4 text-stone-600 px-2"><MapPin size={18} className="text-[#a9b897]"/> <span className="text-[10px] font-black uppercase tracking-widest">{selectedTask.location}</span></div>}
                    <div className="p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100 min-h-[120px]">
                      <p className="text-[8px] font-black uppercase text-stone-300 mb-3 tracking-widest">Intelligence Content</p>
                      <p className="text-xs text-stone-600 leading-relaxed italic">{selectedTask?.description || selectedTask?.content || "No strategic context currently attached."}</p>
                    </div>
                  </div>
                )}
              </div>

              {viewMode === "create" && (
                <div className="pt-8 shrink-0">
                  <button onClick={handleCreateEntry} disabled={isSubmitting || !newTitle} className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:bg-[#a9b897] transition-all shadow-xl disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Establish Entry
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-12">
        
        {/* CHRONOS PROTOCOL MAIN INTERFACE */}
        <div className="lg:col-span-9">
          <div className="flex justify-between items-center mb-10 px-4">
             <div>
               <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-[1px] bg-[#a9b897]" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Chronos Infrastructure</p>
               </div>
               <h1 className="text-5xl md:text-8xl font-serif italic text-stone-800 lowercase tracking-tighter leading-[0.8]">
                 {format(currentMonth, "MMMM")} <span className="text-stone-300">{format(currentMonth, "yyyy")}</span>
               </h1>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm hover:border-[#a9b897] transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm hover:border-[#a9b897] transition-colors"><ChevronRight size={20}/></button>
             </div>
          </div>
          
          <div className="bg-white rounded-[4rem] border border-stone-100 shadow-sm overflow-hidden grid grid-cols-7 p-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">{d}</div>
            ))}
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[150px] p-4 border border-stone-50 rounded-[2.5rem] transition-all cursor-pointer relative group
                    ${!isSameMonth(day, currentMonth) ? 'bg-stone-50/10 opacity-20' : 'bg-white hover:bg-stone-50/50'}
                    ${isSameDay(day, selectedDay) ? 'bg-stone-50/80' : ''}
                  `}
                >
                  <span className={`text-xs font-black transition-all ${isSameDay(day, new Date()) ? 'bg-stone-900 text-white px-2 py-1 rounded-lg' : 'text-stone-400 group-hover:text-stone-900'}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-3 space-y-1.5 relative z-10">
                    {dayEvents.slice(0, 3).map((item, i) => (
                      <div 
                        key={item.id || i} 
                        onClick={(e) => handleEventClick(e, item)}
                        className="text-[8px] font-black uppercase truncate p-2 rounded-xl border-l-2 bg-white shadow-sm hover:translate-x-1 transition-all hover:border-[#a9b897] pointer-events-auto flex items-center gap-2" 
                        style={{ borderLeftColor: item.colour || '#A3B18A' }}
                      >
                        {item.displayType === 'SIGNAL' ? <Mail size={10} className="shrink-0 text-purple-400"/> : <Zap size={10} className="shrink-0 text-stone-300"/>}
                        <span className="truncate">{item.title || item.subject}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[7px] font-black text-[#a9b897] pl-1 tracking-widest">+{dayEvents.length - 3} ENTRIES</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR: PROTOCOL STATUS & AGENDA */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-xl flex flex-col min-h-[600px] sticky top-10">
             
             {/* NEW: Signal Health Indicator */}
             <div className="flex items-center justify-between mb-8 p-4 bg-stone-50 rounded-[2rem] border border-stone-100">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Activity size={18} className="text-[#a9b897]" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#a9b897] rounded-full animate-ping" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Signal Health</p>
                        <p className="text-[10px] font-black uppercase text-stone-800">Optimised</p>
                    </div>
                </div>
                <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i < 5 ? 'bg-[#a9b897]' : 'bg-stone-200'}`} />)}
                </div>
             </div>

             <div className="flex justify-between items-start mb-10 shrink-0">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">{format(selectedDay, "EEEE")}</p>
                   <h2 className="text-4xl font-serif italic text-stone-800 tracking-tighter leading-none">{format(selectedDay, "do MMM")}</h2>
                </div>
                <button onClick={() => { setViewMode("create"); setIsModalOpen(true); }} className="p-5 bg-stone-900 text-white rounded-[1.5rem] shadow-xl hover:bg-[#a9b897] transition-all active:scale-95"><Plus size={24}/></button>
             </div>

             <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] no-scrollbar pr-1">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-20 text-center">
                    <Shield className="mx-auto mb-4 text-stone-100" size={40}/>
                    <p className="text-[10px] font-serif italic text-stone-400">Protocol Clear. Zero entries.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((e, i) => (
                    <div key={e.id || i} onClick={(ev) => handleEventClick(ev, e)} className="p-5 rounded-[2rem] bg-stone-50 border border-stone-100 cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-[#a9b897]/5 transition-all group">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white shadow-sm flex items-center gap-2" style={{ color: e.colour }}>
                            {e.displayType === 'SIGNAL' ? <Radio size={10} className="animate-pulse"/> : <Zap size={10}/>} {e.displayType}
                         </span>
                         <span className="text-[9px] font-bold text-stone-400">{format(new Date(e.dateField), "HH:mm")}</span>
                      </div>
                      <p className="text-[11px] font-black text-stone-800 uppercase leading-tight group-hover:text-[#a9b897] transition-colors">{e.title || e.subject}</p>
                    </div>
                  ))
                )}
             </div>

             <div className="mt-10 pt-8 border-t border-stone-50">
                <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Landmark size={80} />
                   </div>
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-500 mb-1">Infrastructure Status</p>
                   <p className="text-lg font-serif italic text-[#a9b897]">Protocol v.2.4.0 Synced</p>
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