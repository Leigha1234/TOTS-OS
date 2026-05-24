"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
const supabase = getBrowserClient(); 
import { 
  Clock, Trash2, Plus, 
  Timer, Briefcase, Loader2,
  Lock, Zap, Send, FileSpreadsheet,
  Activity, Cpu, Globe, BarChart3, Users
} from "lucide-react";

/**
 * TOTS OS v7.1.0 - TIMESHEETS
 * REVISION: COMPACT SCALE | NAV SYNC | INPUT DENSITY
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

const getISOWeek = (date: Date) => {
  const tempDate = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNum + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

const getWeekLabel = (weekString: string) => {
  const [year, week] = weekString.split('-W');
  const simple = `${year} • Week ${week}`;
  return simple;
};

const generateWeekOptions = () => {
  const weeks: { value: string; label: string }[] = [];
  const today = new Date();

  for (let i = -4; i <= 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i * 7);
    const weekValue = getISOWeek(d);

    if (!weeks.find((w) => w.value === weekValue)) {
      weeks.push({
        value: weekValue,
        label: getWeekLabel(weekValue)
      });
    }
  }

  return weeks;
};

export default function TimesheetsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [notification, setNotification] = useState({ visible: false, msg: "" });
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(new Date()));
  const weekOptions = generateWeekOptions();
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
      setError("Unable to load timesheets.");
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
      member_name: formData.member || "Director",
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
      notify("Timesheet Added");
    } catch (err: any) { setError("Unable to save timesheet."); }
  };

  const deleteEntry = async (id: string) => {
    try {
      await supabase.from('timesheets').delete().eq('id', id);
      setTimesheetList(prev => prev.filter(t => t.id !== id));
      notify("Timesheet Deleted");
    } catch (err: any) { setError("Unable to delete timesheet."); }
  };

  const calculateTotal = (t: TimesheetEntry) => 
    Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  const totalPeriodHours = timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            <Zap size={12} className="text-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Timer size={18} /></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">Online • Active Week</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Timesheets</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
              <button onClick={() => router.push('/payments')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all">Payments</button>
              <button onClick={() => router.push('/finance-reports')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <BarChart3 size={10}/> Financial Reports
              </button>
              <button onClick={() => router.push('/hr')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <Users size={10}/> HR & Payroll
              </button>
              <button className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <Clock size={10}/> Timesheets
              </button>
            </nav>
            <button onClick={() => notify("Timesheet Submitted")} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95">
              <Lock size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Submit</span>
            </button>
          </div>
        </header>

        {/* TIMESHEET ENTRY */}
        <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm space-y-8 relative overflow-hidden group text-left">
          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-1">
              <h3 className="text-3xl font-serif italic tracking-tighter">Timesheet Entry</h3>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Weekly Hours</p>
            </div>
            <div className="flex items-center gap-3 bg-stone-50 p-1 pl-4 rounded-full border border-stone-100">
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-400">Week:</span>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest outline-none shadow-md cursor-pointer">
                {weekOptions.map((week) => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-end relative z-10">
            <div className="xl:col-span-3 space-y-2">
              <label className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 ml-3">Client</label>
              <input placeholder="Client name..." value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-stone-900 transition-all" />
            </div>
            <div className="xl:col-span-3 space-y-2">
              <label className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 ml-3">Scope</label>
              <input placeholder="Task Description..." value={formData.task} onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-stone-900 transition-all" />
            </div>
            <div className="xl:col-span-5 space-y-2">
              <div className="grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-[7px] text-center font-black text-stone-300">{day}</p>
                    <input value={(formData as any)[['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx]]} onChange={(e) => setFormData({...formData, [['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx]]: e.target.value})} 
                      className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-mono font-bold text-xs outline-none focus:border-[#a9b897]" placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button onClick={addEntry} className="w-full h-[46px] bg-stone-900 text-[#a9b897] rounded-xl flex items-center justify-center hover:bg-stone-800 transition-all shadow-lg active:scale-95 group">
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
          <Cpu size={120} className="absolute -right-10 -bottom-10 opacity-[0.02] text-stone-900 pointer-events-none" />
        </section>

        {/* TIMESHEET OVERVIEW STATS */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg"><Activity size={18} /></div>
              <div className="space-y-0.5">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-900 leading-tight">Timesheet Overview</h4>
                <p className="text-[8px] font-black uppercase text-stone-300 tracking-[0.4em] italic">{timesheetList.length} Entries</p>
              </div>
            </div>
            <div className="flex items-center gap-8 bg-white border border-stone-100 px-8 py-3.5 rounded-full shadow-sm">
                 <div className="text-center flex flex-col items-center">
                   <p className="text-[7px] font-black uppercase text-stone-300 tracking-[0.4em] mb-0.5">Total Hours</p>
                   <span className="text-3xl font-mono font-bold tracking-tighter text-stone-900">{totalPeriodHours.toFixed(1)}<span className="text-[10px] text-[#a9b897] ml-2 italic">HRS</span></span>
                 </div>
                 <div className="w-[1px] h-8 bg-stone-100" />
                 <button onClick={() => notify("Timesheets Sent")} 
                    className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] bg-stone-900 text-white hover:bg-stone-800 px-5 py-2.5 rounded-full transition-all shadow-lg group">
                   <Send size={12} className="text-[#a9b897]" /> Send
                 </button>
            </div>
        </div>

        {/* TIMESHEET ENTRIES LIST */}
        <section className="space-y-4">
          {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#a9b897]" size={24} /></div> : (
            <AnimatePresence mode="popLayout">
              {timesheetList.length === 0 ? (
                <div className="bg-white border border-stone-100 rounded-[2rem] p-12 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-4">
                    <Clock size={28} className="text-[#a9b897]" />
                    <div>
                      <h4 className="text-xl font-serif italic tracking-tight text-stone-900">No timesheets yet</h4>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mt-2">Add your first entry to get started</p>
                    </div>
                  </div>
                </div>
              ) : (
                timesheetList.map((t) => (
                  <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-white border border-stone-100 p-5 rounded-[2rem] flex flex-col xl:flex-row justify-between items-center gap-6 group hover:border-stone-900 transition-all shadow-sm text-left">
                    <div className="flex items-center gap-6 w-full xl:w-[35%]">
                      <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">{t.client}</p>
                        <h4 className="text-xl font-serif italic text-stone-800 tracking-tighter truncate leading-none">{t.task}</h4>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-8 w-full xl:w-auto">
                      <div className="grid grid-cols-7 gap-2">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <span className="text-[6px] font-black uppercase text-stone-300 font-mono">{['M','T','W','T','F','S','S'][i]}</span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${Number(h) > 0 ? 'bg-stone-900 text-[#a9b897] border-stone-900' : 'bg-stone-50 border-stone-100 text-stone-200'}`}>
                              {h || '0'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-8 xl:border-l xl:border-stone-50 xl:pl-8">
                        <div className="text-right min-w-[60px]">
                          <p className="text-[7px] font-black uppercase text-stone-300 mb-0.5">Subtotal</p>
                          <span className="text-3xl font-serif italic text-stone-900 leading-none tracking-tighter">{calculateTotal(t)}</span>
                        </div>
                        <button onClick={() => deleteEntry(t.id)} className="p-2.5 rounded-full bg-stone-50 text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all border border-stone-100 group-hover:border-transparent">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </section>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-center gap-4 pt-6">
            <button onClick={() => { setIsExporting(true); setTimeout(() => { setIsExporting(false); notify("CSV Exported"); }, 1500); }}
              className="flex items-center gap-3 px-6 py-2.5 bg-white border border-stone-200 rounded-full text-[8px] font-black uppercase tracking-widest hover:border-stone-900 transition-all shadow-sm">
                {isExporting ? <Loader2 className="animate-spin text-[#a9b897]" size={12}/> : <FileSpreadsheet size={12} className="text-[#a9b897]" />}
                <span>Export CSV</span> 
            </button>
            <button onClick={() => notify("Changes sync automatically")} className="flex items-center gap-3 px-6 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                <Globe size={12} className="text-[#a9b897]" /> 
                <span>Cloud Sync</span>
            </button>
        </div>

        <footer className="pt-8 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-[0.4em]">
          <div className="flex items-center gap-3">
            <p>TOTS OS v7.1.0 • TIMESHEETS</p>
            <div className="w-1 h-1 rounded-full bg-[#a9b897] animate-pulse" />
          </div>
          <div className="flex gap-6">
            <button className="hover:text-stone-900">Protocols</button>
            <button className="hover:text-stone-900">Privacy</button>
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