"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Landmark, X, Loader2, MapPin, Clock, Users, Link as LinkIcon
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
  
  // States for data modules
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [projectDeadlines, setProjectDeadlines] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Extended Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  
  // States for date and time drop-down selection
  const [selectedDateString, setSelectedDateString] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("12:00");
  
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState("#a9b897");
  const [vcLink, setVcLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchSystemData();
  }, [currentMonth]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error("Fetch exception:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch contextual data for invoices, quotes, deadlines, social, emails, payroll and holidays.
  async function fetchSystemData() {
    try {
      // 1. Invoices
      const { data: invData } = await supabase.from("invoices").select("*");
      setInvoices(invData || []);

      // 2. Quotes
      const { data: quoteData } = await supabase.from("quotes").select("*");
      setQuotes(quoteData || []);

      // 3. Project Deadlines
      const { data: projData } = await supabase.from("projects").select("*");
      setProjectDeadlines(projData || []);

      // 4. Social Posts
      const { data: socData } = await supabase.from("social_posts").select("*");
      setSocials(socData || []);

      // 5. Campaigns / Emails
      const { data: emailData } = await supabase.from("campaigns").select("*");
      setEmails(emailData || []);

      // 6. Payroll
      const { data: payData } = await supabase.from("payroll").select("*");
      setPayroll(payData || []);

      // 7. Holidays
      const { data: holData } = await supabase.from("holidays").select("*");
      setHolidays(holData || []);
    } catch (e) {
      console.error("Failed to load business node contextual data", e);
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSelectedDateString(format(day, "yyyy-MM-dd"));
    setIsModalOpen(true);
  };

  async function handleCreateEntry() {
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      
      const combinedDate = new Date(`${selectedDateString}T${eventTime}:00`);

      const payload = {
        title: newTitle,
        user_id: user.id,
        created_at: combinedDate.toISOString(),
        description: notes || "",
        status: "todo",
        priority: 1,
        color: eventColor || "#a9b897",
        location: eventLocation || "",
        vc_link: vcLink || ""
      };

      const { error } = await supabase.from("tasks").insert([payload]);

      if (error) {
        console.error("Supabase Error Details:", error.message, error.details);
        alert(`Save Failed: ${error.message}`);
      } else {
        setNewTitle("");
        setEventTime("12:00");
        setEventLocation("");
        setEventColor("#a9b897");
        setVcLink("");
        setNotes("");
        setIsModalOpen(false);
        fetchEvents(); // Refresh items in calendar
      }
    } catch (err) {
      console.error("Submission Exception:", err);
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

  // Aggregate all events for a specific day
  const getCombinedEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    
    const taskEvents = tasks
      .filter(t => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr)
      .map(t => ({ id: t.id, title: t.title, type: "Task", color: t.color || "#a9b897", time: format(new Date(t.created_at), "HH:mm") }));
      
    const invoiceEvents = invoices
      .filter(i => i.due_date && format(new Date(i.due_date), "yyyy-MM-dd") === dayStr)
      .map(i => ({ id: `inv-${i.id}`, title: `Invoice Due: ${i.title || i.amount || ''}`, type: "Invoice", color: "#eab308", time: "" }));
      
    const quoteEvents = quotes
      .filter(q => q.due_date && format(new Date(q.due_date), "yyyy-MM-dd") === dayStr)
      .map(q => ({ id: `q-${q.id}`, title: `Quote Due: ${q.title || ''}`, type: "Quote", color: "#f97316", time: "" }));
      
    const deadlineEvents = projectDeadlines
      .filter(p => p.deadline && format(new Date(p.deadline), "yyyy-MM-dd") === dayStr)
      .map(p => ({ id: `proj-${p.id}`, title: `Deadline: ${p.name || ''}`, type: "Project", color: "#3b82f6", time: "" }));
      
    const socialEvents = socials
      .filter(s => s.scheduled_for && format(new Date(s.scheduled_for), "yyyy-MM-dd") === dayStr)
      .map(s => ({ id: `soc-${s.id}`, title: `Social Post: ${s.platform || ''}`, type: "Social", color: "#ec4899", time: format(new Date(s.scheduled_for), "HH:mm") }));
      
    const emailEvents = emails
      .filter(e => e.scheduled_for && format(new Date(e.scheduled_for), "yyyy-MM-dd") === dayStr)
      .map(e => ({ id: `email-${e.id}`, title: `Email Campaign: ${e.subject || ''}`, type: "Email", color: "#8b5cf6", time: format(new Date(e.scheduled_for), "HH:mm") }));

    const payEvents = payroll
      .filter(pay => pay.payment_date && format(new Date(pay.payment_date), "yyyy-MM-dd") === dayStr)
      .map(pay => ({ id: `pay-${pay.id}`, title: `Payroll Run: ${pay.description || ''}`, type: "Payroll", color: "#14b8a6", time: "" }));
      
    const holEvents = holidays
      .filter(h => h.date && format(new Date(h.date), "yyyy-MM-dd") === dayStr)
      .map(h => ({ id: `hol-${h.id}`, title: `Holiday: ${h.name || ''}`, type: "Holiday", color: "#10b981", time: "" }));

    return [
      ...taskEvents,
      ...invoiceEvents,
      ...quoteEvents,
      ...deadlineEvents,
      ...socialEvents,
      ...emailEvents,
      ...payEvents,
      ...holEvents
    ];
  };
  
  const selectedDayEvents = useMemo(() => getCombinedEventsForDay(selectedDay), [selectedDay, tasks, invoices, quotes, projectDeadlines, socials, emails, payroll, holidays]);

  // Helper function to capitalize Month name
  const getCapitalizedMonth = (date: Date) => {
    const regular = format(date, "MMMM");
    return regular.charAt(0).toUpperCase() + regular.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-10 text-stone-900 overflow-x-hidden">
      
      {/* MODAL */}
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
              className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-100 max-h-[85vh] overflow-y-auto"
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

              <div className="space-y-5">
                <div>
                  <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Title</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What's happening?"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 ring-[#a9b897]/20 font-serif italic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Date</label>
                    <input 
                      type="date"
                      value={selectedDateString}
                      onChange={(e) => setSelectedDateString(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 ring-[#a9b897]/20 text-stone-600 font-medium"
                    />
                  </div>
                  <div>
                     <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Time</label>
                     <input 
                       type="time"
                       value={eventTime}
                       onChange={(e) => setEventTime(e.target.value)}
                       className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 ring-[#a9b897]/20 text-stone-600 font-medium"
                     />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Category/Color</label>
                  <select 
                    value={eventColor}
                    onChange={(e) => setEventColor(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 ring-[#a9b897]/20 text-stone-600 font-medium"
                  >
                    <option value="#a9b897">Soft Sage</option>
                    <option value="#8fa07d">Sage Strong</option>
                    <option value="#eab308">Yellow Sun</option>
                    <option value="#3b82f6">Ocean Blue</option>
                    <option value="#ef4444">Alert Red</option>
                  </select>
                </div>

                <div>
                   <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Location</label>
                   <div className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
                     <MapPin size={14} className="text-stone-400" />
                     <input 
                       value={eventLocation}
                       onChange={(e) => setEventLocation(e.target.value)}
                       placeholder="e.g. Boardroom or Remote"
                       className="w-full bg-transparent text-xs focus:outline-none"
                     />
                   </div>
                </div>

                <div>
                   <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Video Call Link</label>
                   <div className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
                     <LinkIcon size={14} className="text-stone-400" />
                     <input 
                       value={vcLink}
                       onChange={(e) => setVcLink(e.target.value)}
                       placeholder="https://..."
                       className="w-full bg-transparent text-xs focus:outline-none"
                     />
                   </div>
                </div>

                <div>
                   <label className="text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1 ml-1 block">Internal & External Notes</label>
                   <textarea 
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Meeting brief or checklist items..."
                     className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs focus:outline-none h-20 resize-none font-serif italic"
                   />
                </div>

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
             <h1 className="text-5xl font-serif italic text-stone-800 tracking-tighter leading-none lowercase capitalize">
               {getCapitalizedMonth(currentMonth)}
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
              const dayEvents = getCombinedEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[140px] p-4 border-r border-b border-stone-50 transition-all cursor-pointer relative
                    ${!isCurrentMonth ? 'opacity-20' : 'bg-white hover:bg-[#a9b897]/5'}
                    group
                  `}
                >
                  <span className={`text-xs font-bold transition-colors ${isToday ? 'bg-stone-900 text-white px-2 py-1 rounded-lg' : 'text-stone-800 group-hover:text-[#a9b897]'}`}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Event Previews */}
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div 
                        key={e.id} 
                        className="text-[8px] font-black uppercase truncate border p-1 rounded tracking-tighter"
                        style={{
                          backgroundColor: `${e.color || '#a9b897'}20`, 
                          borderColor: e.color || '#a9b897',
                          color: '#444'
                        }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[7px] font-black text-stone-300 uppercase mt-1">+{dayEvents.length - 3} more</p>
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
              <h3 className="text-2xl font-serif italic text-stone-400">{getCapitalizedMonth(selectedDay)}</h3>
              <div className="h-px bg-stone-100 w-12 mx-auto my-4" />
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Agenda</p>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto max-h-[400px]">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                   <CalendarIcon size={32} className="mb-2" />
                   <p className="text-stone-400 font-serif italic text-sm">No entries scheduled.</p>
                </div>
              ) : (
                selectedDayEvents.map(e => (
                  <div 
                    key={e.id} 
                    className="p-4 rounded-2xl border transition-colors space-y-1"
                    style={{
                      backgroundColor: `${e.color || '#a9b897'}10`,
                      borderColor: e.color || '#a9b897'
                    }}
                  >
                    <p className="text-[10px] font-bold leading-tight uppercase tracking-tight text-stone-800">{e.title}</p>
                    <span className="text-[8px] font-mono bg-white/70 px-1.5 py-0.5 rounded border border-black/5 uppercase text-stone-500 tracking-wider mb-1 inline-block">{e.type}</span>
                    {e.time && <p className="text-[8px] text-stone-500 flex items-center gap-1"><Clock size={10}/> {e.time}</p>}
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
              <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">Fiscal Deadline</p>
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