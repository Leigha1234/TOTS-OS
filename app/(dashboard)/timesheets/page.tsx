"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  Clock, Trash2, Plus, Database, 
  Calendar, Timer, Check, 
  Download, Briefcase, AlertCircle, Loader2,
  Filter, ChevronRight, Fingerprint
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
      member_name: formData.member || "Personal Log",
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
      notify("Activity Logged to Database");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('timesheets').delete().eq('id', id);
      if (error) throw error;
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Entry Purged");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Operations Node v6.1.5</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter">Timesheets</h1>
          </div>

          <nav className="flex items-center bg-[#c8d3b9] p-1.5 rounded-full shadow-inner">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Timesheets' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'Timesheets' ? "bg-white text-stone-900 shadow-lg scale-105" : "text-white hover:text-stone-800"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        {/* --- LOG ENTRY CARD (Dashboard Style Wide Card) --- */}
        <section className="bg-white border border-stone-100 rounded-[4rem] p-10 md:p-14 shadow-sm space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Activity Input</p>
                <h3 className="text-3xl md:text-4xl font-serif italic tracking-tighter">Log Operational Hours</h3>
            </div>
            <div className="flex items-center gap-3 bg-stone-50 p-2 px-5 rounded-full border border-stone-100">
              <Calendar size={14} className="text-[#a9b897]" />
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
              >
                <option value="2026-W19">Week 19 (May 11-17)</option>
                <option value="2026-W18">Week 18 (May 04-10)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end border-t border-stone-50 pt-10">
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Client / Entity</label>
              <input 
                placeholder="Enterprise name..." 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Task Objective</label>
              <input 
                placeholder="Operational task..." 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-5 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 text-center block">Allocation (Mon — Sun)</label>
              <div className="grid grid-cols-7 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <input 
                    key={day}
                    value={(formData as any)[day]} 
                    onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 p-5 rounded-xl text-center font-mono font-bold text-xs outline-none focus:border-[#a9b897] focus:bg-white transition-all" 
                    placeholder={day[0].toUpperCase()} 
                  />
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button 
                onClick={addEntry}
                className="w-full h-[68px] bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#a9b897] transition-all shadow-xl active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* --- ENTRIES LEDGER --- */}
        <section className="space-y-8">
          <div className="flex justify-between items-center px-10">
              <div className="flex items-center gap-4">
                <Database size={20} className="text-[#a9b897]" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Operational Database</h4>
              </div>
              <div className="flex items-center gap-4">
                 <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Aggregate:</p>
                 <span className="text-3xl font-mono font-medium tracking-tighter">
                   {timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0)}.00
                 </span>
              </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white border border-stone-100 p-8 md:p-12 rounded-[4rem] flex flex-col xl:flex-row justify-between items-center gap-10 group hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-10 w-full xl:w-[40%]">
                      <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-300 group-hover:text-[#a9b897] transition-all">
                        <Briefcase size={28} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">{t.client}</p>
                        <h4 className="text-3xl md:text-4xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897]" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{t.member_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12 w-full xl:w-auto justify-between border-t xl:border-none pt-10 xl:pt-0">
                      <div className="grid grid-cols-7 gap-3">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-3">
                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-tighter">
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                            </span>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-mono font-bold border transition-all ${Number(h) > 0 ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-200'}`}>
                              {h}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-10 xl:border-l xl:border-stone-50 xl:pl-12">
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Total</p>
                          <span className="text-4xl md:text-5xl font-serif italic text-stone-900 leading-none">
                            {calculateTotal(t)}<span className="text-[10px] font-sans not-italic text-stone-400 ml-2 tracking-widest">HRS</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(t.id)}
                          className="p-5 rounded-2xl text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && (
                <div className="text-center py-40 bg-white border border-dashed border-stone-200 rounded-[4rem] flex flex-col items-center gap-6">
                    <Clock size={48} className="text-stone-100" />
                    <p className="text-2xl font-serif italic text-stone-400">Database is currently vacant.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- FOOTER SUMMARY PDF --- */}
        <div className="flex justify-center pt-10">
            <button className="flex items-center gap-4 px-12 py-6 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:border-stone-900 transition-all shadow-sm group">
                <Download size={16} className="text-[#a9b897]" /> Generate Operational Summary <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
}