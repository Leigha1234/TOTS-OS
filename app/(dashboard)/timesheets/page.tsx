"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Clock, Trash2, Plus, Database, 
  Timer, Download, Briefcase, AlertCircle, Loader2,
  ChevronRight, Fingerprint, Lock, Zap, Send, FileSpreadsheet,
  Activity, Cpu, Globe
} from "lucide-react";

/**
 * TOTS OS v6.2 - TEMPORAL LEDGER NODE
 * OPERATIONAL THROUGHPUT & RESOURCE ALLOCATION
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

  // --- UI STATE ---
  const [notification, setNotification] = useState({ visible: false, msg: "" });
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
      setError("Temporal Sync Failure: Unable to reach the database pulse.");
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  const addEntry = async () => {
    if (!formData.client || !formData.task) {
      notify("Incomplete Allocation Fields");
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
      notify("Temporal Node Established");
    } catch (err: any) {
      setError("Write Access Denied: Database lock detected.");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('timesheets').delete().eq('id', id);
      if (error) throw error;
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Data Node Purged");
    } catch (err: any) {
      setError("Purge Failure: Operational constraints active.");
    }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  const totalPeriodHours = timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white overflow-x-hidden">
      
      {/* --- NOTIFICATION HUD --- */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[600] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10"
          >
            <Zap size={16} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto px-6 py-12 md:p-20 space-y-24">
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-stone-900 text-[#a9b897] rounded-[1.5rem] shadow-2xl"><Timer size={28} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-400">Temporal Synchronization</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-400 tracking-widest uppercase">System v6.2.0 • Online</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl md:text-[10rem] font-serif italic tracking-tighter leading-[0.85]">Temporal Ledger</h1>
          </div>

          <nav className="flex items-center bg-stone-100 p-2 rounded-[2.5rem]">
            {['Dashboard', 'Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Timesheets' && router.push(`/${path === 'Dashboard' ? '' : (path === 'Reports' ? 'finance-reports' : path.toLowerCase())}`)}
                className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all rounded-[2rem] ${
                  path === 'Timesheets' ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-100 p-10 rounded-[3rem] flex items-center gap-6 text-red-600">
            <AlertCircle size={24} />
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">{error}</p>
          </motion.div>
        )}

        {/* --- INPUT DIRECTIVE --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] p-12 md:p-20 shadow-sm space-y-16 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] italic">New Allocation Node</p>
                <h3 className="text-6xl md:text-7xl font-serif italic tracking-tighter">Log Operational Hours</h3>
            </div>
            <div className="flex items-center gap-6 bg-stone-50 p-3 pl-10 rounded-[3rem] border border-stone-100 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Target Period:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] outline-none cursor-pointer hover:bg-stone-800 transition-all shadow-xl"
              >
                <option value="2026-W19">Week 19 (May 11-17)</option>
                <option value="2026-W18">Week 18 (May 04-10)</option>
                <option value="2026-W17">Week 17 (Apr 27-03)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-end border-t border-stone-50 pt-16 relative z-10">
            <div className="xl:col-span-3 space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-10 flex items-center gap-3 italic">
                <Briefcase size={14} className="text-[#a9b897]" /> Client Node
              </label>
              <input 
                placeholder="Enterprise ID..." 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-[3rem] p-10 text-xl font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner text-stone-800 placeholder:text-stone-200" 
              />
            </div>
            <div className="xl:col-span-3 space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-10 flex items-center gap-3 italic">
                <Cpu size={14} className="text-[#a9b897]" /> Operation Scope
              </label>
              <input 
                placeholder="Describe throughput..." 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-[3rem] p-10 text-xl font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner text-stone-800 placeholder:text-stone-200" 
              />
            </div>
            <div className="xl:col-span-5 space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 text-center block italic">Chronos Allocation (Hours)</label>
              <div className="grid grid-cols-7 gap-5">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <div key={day} className="space-y-4">
                    <input 
                      value={(formData as any)[day]} 
                      onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-100 p-8 rounded-[1.5rem] text-center font-mono font-bold text-lg outline-none focus:border-[#a9b897] focus:bg-white transition-all shadow-sm" 
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
                className="w-full h-[104px] bg-stone-900 text-[#a9b897] rounded-[3rem] flex items-center justify-center hover:bg-stone-800 transition-all shadow-2xl active:scale-95 group"
              >
                <Plus size={40} className="group-hover:rotate-90 transition-transform duration-700" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-24 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
            <Activity size={400} />
          </div>
        </section>

        {/* --- OPERATIONAL VOLUME --- */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center px-10 gap-10">
              <div className="flex items-center gap-10 text-left">
                <div className="w-20 h-20 bg-stone-900 rounded-[2.5rem] flex items-center justify-center text-[#a9b897] shadow-2xl">
                  <Database size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-stone-900">Operational Volume</h4>
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] italic">Live Allocation Stream • {timesheetList.length} Active Nodes</p>
                </div>
              </div>
              <div className="flex items-center gap-16 bg-white border border-stone-100 px-16 py-10 rounded-[4rem] shadow-sm">
                 <div className="text-center">
                   <p className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-[0.5em] italic">Cumulative Throughput</p>
                   <span className="text-7xl font-mono font-bold tracking-tighter text-stone-900">
                     {totalPeriodHours.toFixed(2)}<span className="text-xl text-[#a9b897] ml-4 italic">HRS</span>
                   </span>
                 </div>
                 <div className="w-[1px] h-20 bg-stone-100" />
                 <button 
                    onClick={() => notify("Ledger Dispatched for Verification")} 
                    className="flex items-center gap-5 text-[11px] font-black uppercase tracking-[0.5em] bg-stone-900 text-white hover:bg-stone-800 px-12 py-7 rounded-[2.5rem] transition-all shadow-2xl active:scale-95 group/submit"
                  >
                   <Send size={18} className="text-[#a9b897] group-hover/submit:-translate-y-1 group-hover/submit:translate-x-1 transition-transform" /> Dispatch Ledger
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white border border-stone-100 p-12 md:p-16 rounded-[5rem] flex flex-col xl:flex-row justify-between items-center gap-20 group hover:border-stone-900 transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-center gap-16 w-full xl:w-[40%]">
                      <div className="w-32 h-32 bg-stone-50 rounded-[3.5rem] flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all shadow-inner shrink-0">
                        <Briefcase size={48} />
                      </div>
                      <div className="min-w-0 space-y-6 text-left">
                        <div className="flex items-center gap-5">
                          <p className="text-[13px] font-black uppercase tracking-[0.5em] text-[#a9b897] italic">{t.client}</p>
                          <span className="px-5 py-2 bg-stone-50 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 border border-stone-100">Verified Node</span>
                        </div>
                        <h4 className="text-6xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                        <div className="flex items-center gap-4">
                          <Fingerprint size={16} className="text-[#a9b897]" />
                          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 italic uppercase">Operator: {t.member_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-20 w-full xl:w-auto justify-between border-t xl:border-none pt-16 xl:pt-0">
                      <div className="grid grid-cols-7 gap-6">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-5">
                            <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em] font-mono">
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                            </span>
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-lg font-mono font-bold border transition-all duration-700 ${Number(h) > 0 ? 'bg-stone-900 text-[#a9b897] border-stone-900 shadow-2xl scale-110' : 'bg-stone-50 border-stone-100 text-stone-200 group-hover:border-stone-200'}`}>
                              {h || '0'}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-20 xl:border-l xl:border-stone-50 xl:pl-20">
                        <div className="text-right min-w-[120px]">
                          <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em] mb-4 italic">Allocated</p>
                          <span className="text-7xl md:text-8xl font-serif italic text-stone-900 leading-none flex items-baseline tracking-tighter">
                            {calculateTotal(t)}<span className="text-[16px] font-sans not-italic text-[#a9b897] ml-4 tracking-[0.4em] font-black uppercase">hrs</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(t.id)}
                          className="p-10 rounded-[2rem] bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 active:scale-90"
                        >
                          <Trash2 size={28} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-64 bg-white border border-dashed border-stone-200 rounded-[7rem] flex flex-col items-center gap-12">
                    <div className="w-40 h-40 bg-stone-50 rounded-full flex items-center justify-center text-stone-100">
                      <Clock size={80} />
                    </div>
                    <div className="space-y-6 text-center">
                      <p className="text-5xl font-serif italic text-stone-300 tracking-tighter">Node contains no temporal data.</p>
                      <p className="text-[12px] font-black uppercase tracking-[0.6em] text-stone-400">Initiate a new log directive above.</p>
                    </div>
                </motion.div>
              )}
            </div>
          )}
        </section>

        {/* --- MASTER ACTIONS --- */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-10 pt-20">
            <button 
              disabled={isExporting}
              onClick={() => {
                setIsExporting(true);
                setTimeout(() => { setIsExporting(false); notify("Manifest Compiled & Downloaded"); }, 1500);
              }}
              className="flex items-center gap-6 px-20 py-10 bg-white border border-stone-200 rounded-[3rem] text-[12px] font-black uppercase tracking-[0.5em] hover:border-stone-900 hover:shadow-2xl transition-all shadow-sm group relative overflow-hidden"
            >
                {isExporting ? <Loader2 className="animate-spin text-[#a9b897]" size={20}/> : <FileSpreadsheet size={20} className="text-[#a9b897]" />}
                <span>{isExporting ? "Compiling..." : "Compile Manifest"}</span> 
                <ChevronRight size={18} className="group-hover:translate-x-3 transition-transform" />
            </button>
            <button className="flex items-center gap-6 px-20 py-10 bg-stone-900 text-white border border-stone-900 rounded-[3rem] text-[12px] font-black uppercase tracking-[0.5em] hover:bg-stone-800 transition-all shadow-2xl group active:scale-95">
                <Lock size={20} className="text-[#a9b897] group-hover:rotate-12 transition-transform" /> 
                <span>Finalize Node for Billing</span>
            </button>
        </div>

        {/* --- GLOBAL FOOTER --- */}
        <footer className="pt-24 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-12 text-stone-300 pb-12">
          <div className="flex items-center gap-8">
            <p className="text-[11px] font-black uppercase tracking-[0.5em]">TOTS OS v6.2.0 • Temporal Module</p>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <Globe size={14} className="text-stone-200" />
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <button className="hover:text-stone-900 transition-all">Audit Protocols</button>
            <button className="hover:text-stone-900 transition-all">Resource Policy</button>
            <button className="hover:text-stone-900 transition-all">Encrypted Ledger</button>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}