"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  Clock, Trash2, Users, Plus, Database, 
  Calendar, Timer, Check, Activity, 
  Download, Briefcase, AlertCircle, Loader2,
  Filter, FileText, ChevronRight
} from "lucide-react";

interface TimesheetEntry {
  id: string;
  client: string;
  task: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  member_name: string;
}

export default function TimesheetsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- UI STATE ---
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("2026-W19");

  // --- DATA STATE ---
  const [timesheetList, setTimesheetList] = useState<TimesheetEntry[]>([]);
  const [formData, setFormData] = useState({
    client: "", task: "", member: "",
    mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0"
  });

  useEffect(() => {
    setIsMounted(true);
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimesheetList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const addEntry = async () => {
    if (!formData.client || !formData.task) return;
    
    const newEntry = {
      client: formData.client,
      task: formData.task,
      member_name: formData.member || "Unassigned",
      mon: parseFloat(formData.mon) || 0,
      tue: parseFloat(formData.tue) || 0,
      wed: parseFloat(formData.wed) || 0,
      thu: parseFloat(formData.thu) || 0,
      fri: parseFloat(formData.fri) || 0,
      sat: parseFloat(formData.sat) || 0,
      sun: parseFloat(formData.sun) || 0,
      week_identifier: selectedWeek
    };

    try {
      const { data, error } = await supabase
        .from('timesheets')
        .insert([newEntry])
        .select();

      if (error) throw error;
      
      setTimesheetList([data[0], ...timesheetList]);
      setFormData({ client: "", task: "", member: "", mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0" });
      notify("Log synchronized with database");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('timesheets').delete().eq('id', id);
      if (error) throw error;
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Entry purged");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-4 md:p-10 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-8">
        
        {/* --- HIGH-DENSITY ACTION HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-6 md:p-10 rounded-[3rem] border border-stone-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Timer size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Operations Node v6.1.5</p>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter leading-tight">Timesheets</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => document.getElementById('log-entry-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl hover:bg-[#a9b897] transition-all shadow-xl group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Activity</span>
            </button>
            <button className="flex items-center gap-3 bg-white border border-stone-200 px-6 py-4 rounded-2xl hover:bg-stone-50 transition-all shadow-sm">
              <Download size={18} className="text-stone-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Summary PDF</span>
            </button>
            
            <div className="h-10 w-[1px] bg-stone-100 mx-2 hidden xl:block" />

            <nav className="flex bg-stone-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
              {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Timesheets' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                  className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${
                    path === 'Timesheets' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {path}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Sync Error: {error}</p>
          </div>
        )}

        {/* --- LOG ENTRY INTERFACE --- */}
        <section id="log-entry-section" className="bg-white border border-stone-200 rounded-[3.5rem] p-8 md:p-12 shadow-sm space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-stone-50 pb-10">
            <div className="flex items-center gap-4">
              <Database size={24} className="text-[#a9b897]" />
              <h3 className="text-3xl font-serif italic tracking-tighter leading-none">Operational Log Entry</h3>
            </div>
            <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-100">
              <Calendar size={14} className="text-stone-300 ml-2" />
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-4"
              >
                <option value="2026-W19">Week 19 (May 11-17)</option>
                <option value="2026-W18">Week 18 (May 04-10)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end">
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Client Entity</label>
              <input 
                placeholder="Entity name..." 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Objective</label>
              <input 
                placeholder="Task description..." 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 text-center block">Hour Allocation (M - S)</label>
              <div className="grid grid-cols-7 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <input 
                    key={day}
                    value={(formData as any)[day]} 
                    onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-xl text-center font-mono font-bold text-xs outline-none focus:border-[#a9b897] focus:bg-white transition-all" 
                    placeholder={day[0].toUpperCase()} 
                  />
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button 
                onClick={addEntry}
                className="w-full h-[62px] bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#a9b897] transition-all shadow-xl active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* --- ENTRIES LEDGER --- */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center px-8 bg-stone-900 text-white py-8 rounded-[2.5rem] shadow-xl">
            <div className="space-y-1 text-center md:text-left mb-4 md:mb-0">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500">Live Operation Feed</h4>
              <p className="text-2xl font-serif italic tracking-tighter leading-none">Database Ledger</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Weekly Aggregate</p>
                <span className="text-3xl font-mono font-medium tracking-tighter text-[#a9b897]">
                   {timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0)}<span className="text-[10px] font-sans ml-1 text-white">HRS</span>
                </span>
              </div>
              <div className="h-10 w-[1px] bg-white/10 mx-2" />
              <button className="p-4 bg-white/5 rounded-xl text-stone-400 hover:text-white transition-colors"><Filter size={18} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-stone-300" size={40} /></div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white border border-stone-200 p-6 md:p-10 rounded-[3.5rem] flex flex-col xl:flex-row justify-between items-center gap-8 group hover:border-stone-900 transition-all shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-8 w-full xl:w-[35%]">
                      <div className="flex-shrink-0 w-16 h-16 bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-stone-300 group-hover:text-stone-900 group-hover:bg-stone-50 transition-all">
                        <Briefcase size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-1 truncate">{t.client}</p>
                        <h4 className="text-2xl md:text-3xl font-serif italic text-stone-800 tracking-tighter leading-tight truncate">{t.task}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 truncate leading-none">{t.member_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 xl:gap-12 w-full xl:w-auto justify-between border-t xl:border-none pt-8 xl:pt-0 border-stone-50">
                      {/* Responsive Grid - allows horizontal scroll on mobile */}
                      <div className="overflow-x-auto w-full md:w-auto no-scrollbar">
                        <div className="grid grid-cols-7 gap-2 md:gap-3 min-w-[320px]">
                          {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                              <span className="text-[8px] font-black uppercase text-stone-300 tracking-tighter leading-none">
                                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                              </span>
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-[11px] font-mono font-bold border transition-all ${Number(h) > 0 ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-100 text-stone-200'}`}>
                                {h}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-8 xl:border-l xl:border-stone-100 xl:pl-10 w-full md:w-auto justify-end">
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 leading-none">Total</p>
                          <span className="text-3xl md:text-4xl font-serif italic text-stone-900 leading-none">
                            {calculateTotal(t)}<span className="text-[10px] font-sans not-italic text-stone-400 ml-1.5 tracking-widest">HRS</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(t.id)}
                          className="p-4 rounded-2xl text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && (
                <div className="text-center py-32 bg-white border border-stone-200 rounded-[4rem] shadow-inner flex flex-col items-center gap-4">
                    <Clock size={48} className="text-stone-100" />
                    <div className="space-y-1">
                      <p className="text-xl font-serif italic text-stone-400">Ledger is currently vacant.</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Ready for activity synchronization</p>
                    </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- FOOTER ACTION --- */}
        <div className="flex justify-center pt-8">
            <button className="flex items-center gap-3 px-10 py-5 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:border-stone-900 transition-all shadow-sm">
                View Operational Archive <ChevronRight size={14} />
            </button>
        </div>
      </div>
    </div>
  );
}