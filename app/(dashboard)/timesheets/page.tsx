"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Clock, Trash2, Plus, Database, 
  Timer, Briefcase, AlertCircle, Loader2,
  ChevronRight, Fingerprint, Lock, Zap, Send, FileSpreadsheet,
  Activity, Cpu, Globe
} from "lucide-react";

/**
 * TOTS OS v6.2.1 - COMPACT TEMPORAL LEDGER
 * UPDATED: REDUCED SCALE CALIBRATION
 */

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

  const [notification, setNotification] = useState({ visible: false, msg: "" });
  const [selectedWeek, setSelectedWeek] = useState("2026-W19");
  const [isExporting, setIsExporting] = useState(false);
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
      setError("Temporal Sync Failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  const addEntry = async () => {
    if (!formData.client || !formData.task) { notify("Field Missing"); return; }
    const newEntry = {
      client: formData.client, task: formData.task,
      member_name: formData.member || "Director Node",
      mon: parseFloat(formData.mon) || 0, tue: parseFloat(formData.tue) || 0,
      wed: parseFloat(formData.wed) || 0, thu: parseFloat(formData.thu) || 0,
      fri: parseFloat(formData.fri) || 0, sat: parseFloat(formData.sat) || 0,
      sun: parseFloat(formData.sun) || 0, week_identifier: selectedWeek,
      status: 'draft'
    };
    try {
      const { data, error } = await supabase.from('timesheets').insert([newEntry]).select();
      if (error) throw error;
      setTimesheetList([data[0], ...timesheetList]);
      setFormData({ client: "", task: "", member: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" });
      notify("Node Established");
    } catch (err: any) { setError("Write Denied."); }
  };

  const deleteEntry = async (id: string) => {
    try {
      await supabase.from('timesheets').delete().eq('id', id);
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Node Purged");
    } catch (err: any) { setError("Purge Failure."); }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  const totalPeriodHours = timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-white/5">
            <Zap size={12} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">
        
        {/* --- HEADER (COMPACT) --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Timer size={18} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-400">Temporal Sync</p>
                <p className="text-[7px] font-mono text-stone-400 tracking-[0.2em] uppercase">v6.2.1 • Online</p>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tighter leading-none">Temporal Ledger</h1>
          </div>

          <nav className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200/50">
            {['Dashboard', 'Payments', 'Reports', 'Timesheets'].map((path) => (
              <button key={path} onClick={() => path !== 'Timesheets' && router.push(`/${path === 'Dashboard' ? '' : path.toLowerCase()}`)}
                className={`px-6 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${path === 'Timesheets' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>
                {path}
              </button>
            ))}
          </nav>
        </header>

        {/* --- INPUT AREA (REDUCED) --- */}
        <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm space-y-10 relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-3xl font-serif italic tracking-tighter">Log Allocation</h3>
            <div className="flex items-center gap-3 bg-stone-50 p-1.5 pl-4 rounded-full border border-stone-100">
              <span className="text-[7px] font-black uppercase tracking-widest text-stone-400">Period:</span>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest outline-none shadow-md cursor-pointer">
                <option value="2026-W19">W19 (May 11-17)</option>
                <option value="2026-W18">W18 (May 04-10)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end relative z-10">
            <div className="xl:col-span-3 space-y-3 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-4 flex items-center gap-2">
                <Briefcase size={10} className="text-[#a9b897]" /> Client
              </label>
              <input placeholder="Entity ID..." value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-stone-900 transition-all shadow-inner" />
            </div>
            <div className="xl:col-span-3 space-y-3 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-4 flex items-center gap-2">
                <Cpu size={10} className="text-[#a9b897]" /> Scope
              </label>
              <input placeholder="Operational task..." value={formData.task} onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-stone-900 transition-all shadow-inner" />
            </div>
            <div className="xl:col-span-5 space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 text-center block">Chronos Allocation (HR)</label>
              <div className="grid grid-cols-7 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <input key={day} value={(formData as any)[day]} onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 p-3 rounded-xl text-center font-mono font-bold text-xs outline-none focus:border-[#a9b897]" placeholder="0" />
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button onClick={addEntry} className="w-full h-[52px] bg-stone-900 text-[#a9b897] rounded-2xl flex items-center justify-center hover:bg-stone-800 transition-all shadow-lg active:scale-95 group">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </section>

        {/* --- STATS BAR --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg"><Database size={18} /></div>
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-900 leading-tight">Operational Stream</h4>
                <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest italic">{timesheetList.length} Active Nodes</p>
              </div>
            </div>
            <div className="flex items-center gap-10 bg-white border border-stone-100 px-8 py-4 rounded-full shadow-sm">
                 <div className="text-center flex flex-col items-center">
                   <p className="text-[7px] font-black uppercase text-stone-400 tracking-widest mb-1">Total Throughput</p>
                   <span className="text-4xl font-mono font-bold tracking-tighter text-stone-900">{totalPeriodHours.toFixed(2)}<span className="text-xs text-[#a9b897] ml-2 italic">HRS</span></span>
                 </div>
                 <div className="w-[1px] h-10 bg-stone-100" />
                 <button onClick={() => notify("Ledger Dispatched")} 
                    className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] bg-stone-900 text-white hover:bg-stone-800 px-6 py-3 rounded-full transition-all shadow-xl group">
                   <Send size={12} className="text-[#a9b897]" /> Dispatch
                 </button>
            </div>
        </div>

        {/* --- LIST (COMPACT) --- */}
        <section className="space-y-4">
          {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#a9b897]" size={30} /></div> : (
            <AnimatePresence mode="popLayout">
              {timesheetList.map((t) => (
                <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-white border border-stone-100 p-6 rounded-[2rem] flex flex-col xl:flex-row justify-between items-center gap-8 group hover:border-stone-900 transition-all shadow-sm">
                  <div className="flex items-center gap-8 w-full xl:w-[40%] text-left">
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all shadow-inner shrink-0">
                      <Briefcase size={24} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] italic">{t.client}</p>
                      <h4 className="text-2xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row items-center gap-8 w-full xl:w-auto">
                    <div className="grid grid-cols-7 gap-3">
                      {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <span className="text-[7px] font-black uppercase text-stone-300 font-mono tracking-tighter">{['M','T','W','T','F','S','S'][i]}</span>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border ${Number(h) > 0 ? 'bg-stone-900 text-[#a9b897] border-stone-900' : 'bg-stone-50 border-stone-100 text-stone-200'}`}>
                            {h || '0'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-10 xl:border-l xl:border-stone-50 xl:pl-8">
                      <div className="text-right min-w-[70px]">
                        <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Hours</p>
                        <span className="text-4xl font-serif italic text-stone-900 leading-none tracking-tighter">{calculateTotal(t)}</span>
                      </div>
                      <button onClick={() => deleteEntry(t.id)} className="p-2.5 rounded-full bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* --- ACTIONS --- */}
        <div className="flex justify-center gap-6 pt-10">
            <button onClick={() => { setIsExporting(true); setTimeout(() => { setIsExporting(false); notify("Manifest Downloaded"); }, 1500); }}
              className="flex items-center gap-4 px-8 py-3 bg-white border border-stone-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:border-stone-900 transition-all shadow-sm group">
                {isExporting ? <Loader2 className="animate-spin text-[#a9b897]" size={14}/> : <FileSpreadsheet size={14} className="text-[#a9b897]" />}
                <span>Manifest</span> 
            </button>
            <button className="flex items-center gap-4 px-8 py-3 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                <Lock size={14} className="text-[#a9b897]" /> 
                <span>Finalize Ledger</span>
            </button>
        </div>

        <footer className="pt-12 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-widest">
          <p>TOTS OS v6.2.1 • Temporal Module</p>
          <div className="flex gap-8">
            <button className="hover:text-stone-900">Protocols</button>
            <button className="hover:text-stone-900">Encrypted Ledger</button>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}