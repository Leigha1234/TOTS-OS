"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Clock, Trash2, Users, Plus, Database, 
  Calendar, Timer, Check, Activity, 
  ChevronRight, Filter, Download, Briefcase
} from "lucide-react";

/**
 * TIMESHEETS CORE - v5.0.0
 * Analytical specialized view with grid-entry system
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
  teamMember: string;
}

export default function TimesheetsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI STATE ---
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("2026-W19");

  // --- DATA STATE ---
  const [timesheetList, setTimesheetList] = useState<TimesheetEntry[]>([
    { id: "1", client: "Cyberdyne Systems", task: "Platform Integration", mon: 4, tue: 8, wed: 6, thu: 8, fri: 4, sat: 0, sun: 0, teamMember: "Sarah Chen" },
    { id: "2", client: "Aperture Labs", task: "Bug Fixing", mon: 2, tue: 2, wed: 4, thu: 2, fri: 2, sat: 0, sun: 0, teamMember: "Jane Doe" }
  ]);

  const [formData, setFormData] = useState({
    client: "", task: "", member: "",
    mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0"
  });

  useEffect(() => { setIsMounted(true); }, []);

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const addEntry = () => {
    if (!formData.client || !formData.task) return;
    const newEntry: TimesheetEntry = {
      id: Date.now().toString(),
      client: formData.client,
      task: formData.task,
      teamMember: formData.member || "Unassigned",
      mon: parseFloat(formData.mon) || 0,
      tue: parseFloat(formData.tue) || 0,
      wed: parseFloat(formData.wed) || 0,
      thu: parseFloat(formData.thu) || 0,
      fri: parseFloat(formData.fri) || 0,
      sat: parseFloat(formData.sat) || 0,
      sun: parseFloat(formData.sun) || 0,
    };
    setTimesheetList([newEntry, ...timesheetList]);
    setFormData({ client: "", task: "", member: "", mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0" });
    notify("Time entry synchronized");
  };

  const calculateTotal = (t: TimesheetEntry) => t.mon + t.tue + t.wed + t.thu + t.fri + t.sat + t.sun;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* Notifications */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- HEADER & NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Operations Node v5.0</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Timesheets</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button onClick={() => router.push('/payments')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Payments</button>
            <button onClick={() => router.push('/finance-reports')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Reports</button>
            <button onClick={() => router.push('/hr')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">HR</button>
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">Timesheets</button>
          </nav>
        </header>

        {/* --- METRICS & CONTROLS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-stone-900 text-white p-10 rounded-[3.5rem] flex flex-col justify-between h-64">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Billable Capacity</p>
            <h2 className="text-6xl font-mono tracking-tighter text-[#a9b897]">84%</h2>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-400">
              <Timer size={12} /> +4% vs target
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-stone-200 p-10 rounded-[3.5rem] flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Week Configuration</p>
              <div className="flex items-center gap-4">
                 <input 
                  type="week" 
                  value={selectedWeek} 
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="text-4xl font-serif italic bg-transparent border-none outline-none cursor-pointer"
                />
                <Calendar size={20} className="text-[#a9b897]" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => notify("Exporting CSV...")} className="p-6 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
                <Download size={20} className="text-stone-400" />
              </button>
              <button onClick={() => notify("Approving Week...")} className="px-10 py-6 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                Submit For Review
              </button>
            </div>
          </div>
        </section>

        {/* --- ENTRY INTERFACE --- */}
        <section className="bg-white border border-stone-200 rounded-[3.5rem] p-12 space-y-12 shadow-sm">
          <div className="flex items-center gap-4 border-b border-stone-50 pb-8">
            <Database size={20} className="text-[#a9b897]" />
            <h3 className="text-3xl font-serif italic">Operational Log Entry</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-end">
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Client Entity</label>
              <input 
                placeholder="Entity name" 
                value={formData.client} 
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-[#a9b897]" 
              />
            </div>
            <div className="xl:col-span-3 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Objective</label>
              <input 
                placeholder="Task description" 
                value={formData.task} 
                onChange={(e) => setFormData({...formData, task: e.target.value})}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-[#a9b897]" 
              />
            </div>
            <div className="xl:col-span-5 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2 text-center block">Daily Hours allocation (M-S)</label>
              <div className="grid grid-cols-7 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <input 
                    key={day}
                    value={(formData as any)[day]} 
                    onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-xl text-center font-black text-[10px] outline-none focus:border-[#a9b897]" 
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
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Current Assignments</h4>
            <div className="text-[10px] font-black uppercase text-stone-400">
              Total Recorded: <span className="text-stone-900 ml-2">{timesheetList.reduce((acc, curr) => acc + calculateTotal(curr), 0)} Hrs</span>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {timesheetList.map((t) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-stone-200 p-8 rounded-[3rem] flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-[#a9b897] transition-all"
                >
                  <div className="flex items-center gap-8 w-full lg:w-auto">
                    <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-[#a9b897] transition-colors">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a9b897] mb-1">{t.client}</p>
                      <h4 className="text-2xl font-serif italic text-stone-800">{t.task}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <Users size={12} className="text-stone-300" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{t.teamMember}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 w-full lg:w-auto justify-between border-t lg:border-none pt-6 lg:pt-0 border-stone-50">
                    <div className="flex gap-2">
                      {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                        <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border ${h > 0 ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-100 text-stone-300'}`}>
                          {h}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-8 border-l border-stone-100 pl-8">
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest mb-1">Accumulated</p>
                        <span className="text-3xl font-serif italic text-stone-900">
                          {calculateTotal(t)}<span className="text-[10px] font-sans not-italic text-stone-300 ml-1">HRS</span>
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setTimesheetList(prev => prev.filter(item => item.id !== t.id));
                          notify("Entry removed from log");
                        }}
                        className="p-4 rounded-2xl text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}