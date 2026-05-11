"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  Clock, Trash2, Plus, Database, 
  Calendar, Timer, Check, 
  Download, Briefcase, AlertCircle, Loader2,
  ChevronRight, Fingerprint, Lock, Unlock, Zap, Send
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
  status?: 'draft' | 'approved';
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
  }, [selectedWeek]);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('week_identifier', selectedWeek)
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
    if (!formData.client || !formData.task) {
      notify("Incomplete Data Fields");
      return;
    }
    
    const newEntry = {
      client: formData.client,
      task: formData.task,
      member_name: formData.member || "Director Node",
      mon: parseFloat(formData.mon) || 0,
      tue: parseFloat(formData.tue) || 0,
      wed: parseFloat(formData.wed) || 0,
      thu: parseFloat(formData.thu) || 0,
      fri: parseFloat(formData.fri) || 0,
      sat: parseFloat(formData.sat) || 0,
      sun: parseFloat(formData.sun) || 0,
      week_identifier: selectedWeek,
      status: 'draft'
    };

    try {
      const { data, error } = await supabase
        .from('timesheets')
        .insert([newEntry])
        .select();

      if (error) throw error;
      
      setTimesheetList([data[0], ...timesheetList]);
      setFormData({ client: "", task: "", member: "", mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0" });
      notify("Database Entry Established");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('timesheets').delete().eq('id', id);
      if (error) throw error;
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Node Purged Successfully");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- FLOATING STATUS --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10">
            <Zap size={14} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-12">
        
        {/* --- HEADER --- */}
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

        {/* --- DYNAMIC LOG INPUT --- */}
        <section className="bg-white border border-stone-100 rounded-[4rem] p-10 md:p-14 shadow-sm space-y-12 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">Entry Directive</p>
                <h3 className="text-4xl font-serif italic tracking-tighter">Log Operational Hours</h3>
            </div>
            <div className="flex items-center gap-4 bg-stone-50 p-2 pl-6 rounded-2xl border border-stone-100 shadow-inner">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Target Period:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-[#a9b897] transition-all"
              >
                <option value="2026-W19">Week 19 (May 11-17)</option>
                <option value="2026-W18">Week 18 (May 04-10)</option>
                <option value="2026-W17">Week 17 (Apr 27-03)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end border-t border-stone-50 pt-10 relative z-10">
            <div className="xl:col-span-3 space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Client Entity</label>
              <input 
                placeholder="Enterprise name..." 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-3 space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Task Definition</label>
              <input 
                placeholder="Project task..." 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-5 space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 text-center block">Day Allocation (H)</label>
              <div className="grid grid-cols-7 gap-3">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <div key={day} className="space-y-2">
                    <input 
                      value={(formData as any)[day]} 
                      onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-100 p-5 rounded-xl text-center font-mono font-bold text-xs outline-none focus:border-[#a9b897] focus:bg-white transition-all shadow-sm" 
                      placeholder="0" 
                    />
                    <p className="text-[8px] font-black uppercase text-stone-300 text-center">{day[0]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button 
                onClick={addEntry}
                className="w-full h-[68px] bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#a9b897] transition-all shadow-2xl active:scale-95 group"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <Timer size={200} />
          </div>
        </section>

        {/* --- LEDGER LISTING --- */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-6">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897]">
                  <Database size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Aggregate Capacity</h4>
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Live Record Stream</p>
                </div>
              </div>
              <div className="flex items-center gap-8 bg-white border border-stone-100 px-10 py-5 rounded-[2rem] shadow-sm">
                 <div className="text-center">
                   <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Total Period Hours</p>
                   <span className="text-3xl font-mono font-bold tracking-tighter">
                     {timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0)}.00
                   </span>
                 </div>
                 <div className="w-[1px] h-10 bg-stone-50" />
                 <button onClick={() => notify("Approval Workflow Initiated")} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest bg-stone-50 hover:bg-stone-100 px-6 py-2.5 rounded-xl transition-all">
                   <Send size={12} className="text-[#a9b897]" /> Submit Week
                 </button>
              </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#a9b897]" size={48} /></div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white border border-stone-100 p-10 md:p-14 rounded-[4rem] flex flex-col xl:flex-row justify-between items-center gap-12 group hover:border-[#a9b897] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-10 w-full xl:w-[35%]">
                      <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner">
                        <Briefcase size={32} />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897]">{t.client}</p>
                          <span className="px-3 py-1 bg-stone-50 rounded-full text-[7px] font-black uppercase tracking-widest text-stone-400 border border-stone-100">Draft</span>
                        </div>
                        <h4 className="text-4xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                        <div className="flex items-center gap-3">
                          <Fingerprint size={12} className="text-stone-300" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{t.member_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-12 w-full xl:w-auto justify-between border-t xl:border-none pt-12 xl:pt-0">
                      <div className="grid grid-cols-7 gap-4">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-3">
                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-tighter">
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                            </span>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-mono font-bold border transition-all ${Number(h) > 0 ? 'bg-stone-900 text-white border-stone-900 shadow-lg scale-110' : 'bg-stone-50 border-stone-100 text-stone-200'}`}>
                              {h}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-12 xl:border-l xl:border-stone-50 xl:pl-16">
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.2em] mb-2">Logged</p>
                          <span className="text-5xl md:text-6xl font-serif italic text-stone-900 leading-none">
                            {calculateTotal(t)}<span className="text-[11px] font-sans not-italic text-[#a9b897] ml-2 tracking-widest font-black uppercase">hrs</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                           <button 
                            onClick={() => deleteEntry(t.id)}
                            className="p-6 rounded-2xl bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 active:scale-90"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-48 bg-white border border-dashed border-stone-200 rounded-[5rem] flex flex-col items-center gap-8">
                    <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-100">
                      <Clock size={48} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-serif italic text-stone-400">Node contains no temporal data.</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Select another period or initiate a new log entry.</p>
                    </div>
                </motion.div>
              )}
            </div>
          )}
        </section>

        {/* --- ACTIONS --- */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-12">
            <button className="flex items-center gap-4 px-14 py-7 bg-white border border-stone-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:border-stone-900 transition-all shadow-sm group">
                <Download size={16} className="text-[#a9b897]" /> Export Period XLS <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center gap-4 px-14 py-7 bg-stone-900 text-white border border-stone-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#a9b897] transition-all shadow-2xl group">
                <Lock size={16} className="text-[#a9b897]" /> Lock Week for Billing
            </button>
        </div>
      </div>
    </div>
  );
}