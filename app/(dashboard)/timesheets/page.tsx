"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  Clock, Trash2, Users, Plus, Database, 
  Calendar, Timer, Check, Activity, 
  Download, Briefcase, AlertCircle, Loader2
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-4 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* Notifications */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-12 md:space-y-16">
        
        {/* --- RESTORED HEADER & NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Operations Node v5.2</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-tight">Timesheets</h1>
          </div>

          <nav className="flex flex-wrap bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Timesheets' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'Timesheets' ? "bg-stone-900 text-white shadow-lg" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[9px] font-black uppercase">
            <AlertCircle size={14} /> Database Sync Error: {error}
          </div>
        )}

        {/* --- ENTRY INTERFACE --- */}
        <section className="bg-white border border-stone-200 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 space-y-10 shadow-sm">
          <div className="flex items-center gap-4 border-b border-stone-50 pb-8">
            <Database size={20} className="text-[#a9b897]" />
            <h3 className="text-2xl md:text-3xl font-serif italic">Operational Log Entry</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Client Entity</label>
              <input 
                placeholder="Entity name" 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 md:p-5 text-sm font-bold outline-none focus:border-[#a9b897]" 
              />
            </div>
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Objective</label>
              <input 
                placeholder="Task description" 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 md:p-5 text-sm font-bold outline-none focus:border-[#a9b897]" 
              />
            </div>
            <div className="xl:col-span-5 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2 text-center block">Hours (M-S)</label>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <input 
                    key={day}
                    value={(formData as any)[day]} 
                    onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 p-3 md:p-4 rounded-xl text-center font-black text-[10px] outline-none focus:border-[#a9b897]" 
                    placeholder={day[0].toUpperCase()} 
                  />
                ))}
              </div>
            </div>
            <div className="xl:col-span-1">
              <button 
                onClick={addEntry}
                className="w-full aspect-square bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#a9b897] transition-all shadow-xl active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* --- ENTRIES LIST --- */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Database Ledger</h4>
            <div className="text-[10px] font-black uppercase text-stone-400">
              Session Total: <span className="text-stone-900 ml-2">{timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0)} Hrs</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-300" /></div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-stone-200 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col lg:flex-row justify-between items-center gap-6 group hover:border-[#a9b897] transition-all"
                  >
                    <div className="flex items-center gap-6 md:gap-8 w-full lg:w-1/3">
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-[#a9b897] transition-colors">
                        <Briefcase size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a9b897] mb-1 truncate">{t.client}</p>
                        <h4 className="text-xl md:text-2xl font-serif italic text-stone-800 truncate">{t.task}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1 truncate">{t.member_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full lg:w-auto justify-between border-t lg:border-none pt-6 lg:pt-0 border-stone-50">
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[10px] font-black border ${Number(h) > 0 ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-100 text-stone-300'}`}>
                            {h}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-8 border-l border-stone-100 pl-8">
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest mb-1">Weekly</p>
                          <span className="text-2xl md:text-3xl font-serif italic text-stone-900">
                            {calculateTotal(t)}<span className="text-[10px] font-sans not-italic text-stone-300 ml-1">HRS</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(t.id)}
                          className="p-3 md:p-4 rounded-2xl text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && (
                <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border border-dashed border-stone-200">
                  <p className="text-sm font-serif italic text-stone-400">Database ledger currently empty.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}