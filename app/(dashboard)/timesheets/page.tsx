"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  Clock, Trash2, Plus, Database, 
  Calendar, Timer, Check, 
  Download, Briefcase, AlertCircle, Loader2,
  ChevronRight, Fingerprint, Lock, Unlock, Zap, Send, FileSpreadsheet
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
  const [isExporting, setIsExporting] = useState(false);

  // --- DATA STATE ---
  const [timesheetList, setTimesheetList] = useState<TimesheetEntry[]>([]);
  const [formData, setFormData] = useState({
    client: "", task: "", member: "",
    mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: ""
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
      setFormData({ client: "", task: "", member: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" });
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

  const totalPeriodHours = timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- NOTIFICATION --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <Zap size={14} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* --- HEADER BLOCK --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Operations Node v6.1.5</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter">Timesheets</h1>
          </div>

          <nav className="flex items-center bg-[#c8d3b9] p-2 rounded-full shadow-inner">
            {['Dashboard', 'Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Timesheets' && router.push(path === 'Dashboard' ? '/' : `/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-10 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'Timesheets' ? "bg-white text-stone-900 shadow-xl scale-105" : "text-white hover:text-stone-800"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </div>

        {/* --- INPUT DIRECTIVE --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] p-12 md:p-16 shadow-sm space-y-14 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Entry Directive</p>
                <h3 className="text-5xl font-serif italic tracking-tighter">Log Operational Hours</h3>
            </div>
            <div className="flex items-center gap-5 bg-stone-50 p-2.5 pl-8 rounded-[2rem] border border-stone-100 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Temporal Period:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:bg-[#a9b897] transition-all"
              >
                <option value="2026-W19">Week 19 (May 11-17)</option>
                <option value="2026-W18">Week 18 (May 04-10)</option>
                <option value="2026-W17">Week 17 (Apr 27-03)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-end border-t border-stone-50 pt-12 relative z-10">
            <div className="xl:col-span-3 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-6 flex items-center gap-2">
                <Briefcase size={12}/> Client Entity
              </label>
              <input 
                placeholder="Enterprise name..." 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] p-8 text-base font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-3 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-6 flex items-center gap-2">
                <Database size={12}/> Task Definition
              </label>
              <input 
                placeholder="Project task description..." 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] p-8 text-base font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="xl:col-span-5 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 text-center block">Temporal Allocation (Hours)</label>
              <div className="grid grid-cols-7 gap-4">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <div key={day} className="space-y-3">
                    <input 
                      value={(formData as any)[day]} 
                      onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-100 p-6 rounded-2xl text-center font-mono font-bold text-sm outline-none focus:border-[#a9b897] focus:bg-white transition-all shadow-sm" 
                      placeholder="0" 
                    />
                    <p className="text-[9px] font-black uppercase text-stone-300 text-center tracking-tighter">{day}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button 
                onClick={addEntry}
                className="w-full h-[88px] bg-stone-900 text-white rounded-[2rem] flex items-center justify-center hover:bg-[#a9b897] transition-all shadow-2xl active:scale-95 group"
              >
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
            <Timer size={350} />
          </div>
        </section>

        {/* --- AGGREGATE LEDGER --- */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-center px-16 gap-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-stone-900 rounded-3xl flex items-center justify-center text-[#a9b897] shadow-xl">
                  <Database size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-900">Aggregate Capacity</h4>
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] italic">Live Stream • {timesheetList.length} Entries</p>
                </div>
              </div>
              <div className="flex items-center gap-12 bg-white border border-stone-100 px-12 py-8 rounded-[3rem] shadow-sm">
                 <div className="text-center px-4">
                   <p className="text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Total Period Volume</p>
                   <span className="text-5xl font-mono font-bold tracking-tighter text-stone-900">
                     {totalPeriodHours}.00<span className="text-xs text-[#a9b897] ml-2">HRS</span>
                   </span>
                 </div>
                 <div className="w-[1px] h-14 bg-stone-100" />
                 <button 
                    onClick={() => notify("Approval Workflow Dispatched")} 
                    className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] bg-stone-900 text-white hover:bg-[#a9b897] px-10 py-5 rounded-2xl transition-all shadow-lg active:scale-95 group/submit"
                  >
                   <Send size={14} className="text-[#a9b897] group-hover/submit:-translate-y-1 group-hover/submit:translate-x-1 transition-transform" /> Submit Week
                 </button>
              </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-40"><Loader2 className="animate-spin text-[#a9b897]" size={60} /></div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white border border-stone-100 p-12 md:p-16 rounded-[5rem] flex flex-col xl:flex-row justify-between items-center gap-16 group hover:border-[#a9b897] transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-12 w-full xl:w-[35%]">
                      <div className="w-28 h-28 bg-stone-50 rounded-[2.5rem] flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all shadow-inner">
                        <Briefcase size={40} />
                      </div>
                      <div className="min-w-0 space-y-4">
                        <div className="flex items-center gap-4">
                          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-[#a9b897]">{t.client}</p>
                          <span className="px-4 py-1.5 bg-stone-50 rounded-full text-[8px] font-black uppercase tracking-[0.3em] text-stone-400 border border-stone-100">Draft Status</span>
                        </div>
                        <h4 className="text-5xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                        <div className="flex items-center gap-4">
                          <Fingerprint size={14} className="text-stone-300" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 italic">Logged by: {t.member_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-16 w-full xl:w-auto justify-between border-t xl:border-none pt-12 xl:pt-0">
                      <div className="grid grid-cols-7 gap-5">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-4">
                            <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest font-mono">
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                            </span>
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-sm font-mono font-bold border transition-all duration-500 ${Number(h) > 0 ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-110' : 'bg-stone-50 border-stone-100 text-stone-200 group-hover:border-stone-200'}`}>
                              {h || '0'}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-16 xl:border-l xl:border-stone-50 xl:pl-20">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] mb-3">Logged</p>
                          <span className="text-6xl md:text-7xl font-serif italic text-stone-900 leading-none flex items-baseline">
                            {calculateTotal(t)}<span className="text-[13px] font-sans not-italic text-[#a9b897] ml-3 tracking-[0.3em] font-black uppercase">hrs</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-3">
                           <button 
                            onClick={() => deleteEntry(t.id)}
                            className="p-8 rounded-[1.5rem] bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 active:scale-90"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-60 bg-white border border-dashed border-stone-200 rounded-[6rem] flex flex-col items-center gap-10">
                    <div className="w-32 h-32 bg-stone-50 rounded-full flex items-center justify-center text-stone-100">
                      <Clock size={64} />
                    </div>
                    <div className="space-y-4">
                      <p className="text-4xl font-serif italic text-stone-400">Node contains no temporal data.</p>
                      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Initiate a new log directive above.</p>
                    </div>
                </motion.div>
              )}
            </div>
          )}
        </section>

        {/* --- MASTER ACTIONS --- */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-16">
            <button 
              disabled={isExporting}
              onClick={() => {
                setIsExporting(true);
                setTimeout(() => { setIsExporting(false); notify("Spreadsheet Compiled & Downloaded"); }, 1500);
              }}
              className="flex items-center gap-5 px-16 py-9 bg-white border border-stone-200 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] hover:border-stone-900 hover:shadow-lg transition-all shadow-sm group relative overflow-hidden"
            >
                {isExporting ? <Loader2 className="animate-spin text-[#a9b897]" size={18}/> : <FileSpreadsheet size={18} className="text-[#a9b897]" />}
                <span>{isExporting ? "Compiling..." : "Export Period XLS"}</span> 
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="flex items-center gap-5 px-16 py-9 bg-stone-900 text-white border border-stone-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#a9b897] transition-all shadow-2xl group active:scale-95">
                <Lock size={18} className="text-[#a9b897] group-hover:rotate-12 transition-transform" /> 
                <span>Lock Week for Billing</span>
            </button>
        </div>
      </div>
    </div>
  );
}