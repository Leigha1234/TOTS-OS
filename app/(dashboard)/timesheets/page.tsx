"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Clock, Trash2, Plus, Timer, Briefcase, Loader2,
  Lock, Zap, Send, FileSpreadsheet, Activity, Cpu, Globe, BarChart3, Users
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * TOTS OS v7.1.0 - TIMESHEET GOVERNANCE MODULE
 * SCOPE: WEEKLY LABOR TRACKING & FISCAL AUDIT
 */

// --- UTILITY FUNCTIONS ---
const getISOWeek = (date: Date) => {
  const tempDate = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNum + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  const weekNumber = 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

const getWeekLabel = (weekString: string) => {
  const [year, week] = weekString.split('-W');
  return `${year} • Fiscal Week ${week}`;
};

const generateWeekOptions = () => {
  const weeks: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = -4; i <= 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i * 7);
    const weekValue = getISOWeek(d);
    if (!weeks.find((w) => w.value === weekValue)) {
      weeks.push({ value: weekValue, label: getWeekLabel(weekValue) });
    }
  }
  return weeks;
};

export default function TimesheetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timesheetList, setTimesheetList] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState({ visible: false, msg: "" });
  const [activeTab, setActiveTab] = useState<string>("timesheets");
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(new Date()));
  const [formData, setFormData] = useState({ client: "", task: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" });

  const router = useRouter();

  useEffect(() => {
    fetchTimesheets();
  }, [selectedWeek]);

  const fetchTimesheets = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('timesheets').select('*').eq('week_identifier', selectedWeek).order('created_at', { ascending: false });
    setTimesheetList(data || []);
    setIsLoading(false);
  };

  const notify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  const commitLaborLog = async () => {
    if (!formData.client || !formData.task) return notify("Incomplete Fields");
    const entry = {
      ...formData,
      mon: parseFloat(formData.mon) || 0, tue: parseFloat(formData.tue) || 0,
      wed: parseFloat(formData.wed) || 0, thu: parseFloat(formData.thu) || 0,
      fri: parseFloat(formData.fri) || 0, sat: parseFloat(formData.sat) || 0,
      sun: parseFloat(formData.sun) || 0,
      week_identifier: selectedWeek,
      status: 'draft'
    };

    const { data, error } = await supabase.from('timesheets').insert([entry]).select();
    if (!error) {
      setTimesheetList([data[0], ...timesheetList]);
      setFormData({ client: "", task: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" });
      notify("Labor Logged");
    }
  };

  const purgeRecord = async (id: string) => {
    await supabase.from('timesheets').delete().eq('id', id);
    setTimesheetList(timesheetList.filter(t => t.id !== id));
    notify("Record Purged");
  };

  const dispatchLedgerData = () => {
    setIsExporting(true);
    const headers = ["Client", "Task", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total"];
    const rows = timesheetList.map(t => [t.client, t.task, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun, (t.mon + t.tue + t.wed + t.thu + t.fri + t.sat + t.sun)]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${selectedWeek}.csv`;
    a.click();
    setIsExporting(false);
    notify("Ledger Dispatched");
  };

  const calculateTotal = (t: any) => Number(t.mon) + Number(t.tue) + Number(t.wed) + Number(t.thu) + Number(t.fri) + Number(t.sat) + Number(t.sun);

  // === CLARITY TIMESHEET INTELLIGENCE ENGINE ===
  const clarityTimesheets = React.useMemo(() => {
    const entries = timesheetList || [];

    const totalHours = entries.reduce((acc, t: any) => acc + calculateTotal(t), 0);
    const avgHours = entries.length ? totalHours / entries.length : 0;
    const activeEntries = entries.filter((t: any) => calculateTotal(t) > 0).length;

    const productivityIndex = avgHours * 12;

    const riskFlags: string[] = [];

    if (avgHours < 10) riskFlags.push("Low labour utilisation");
    if (activeEntries < entries.length * 0.6) riskFlags.push("High inactive logging");
    if (totalHours === 0) riskFlags.push("No labour input detected");

    const status =
      productivityIndex > 120 ? "strong" :
      productivityIndex > 60 ? "stable" : "critical";

    return {
      totalHours,
      avgHours,
      activeEntries,
      productivityIndex,
      riskFlags,
      status
    };
  }, [timesheetList]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans pb-12">
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

        {/* CLARITY TIMESHEET INTELLIGENCE */}
        <div className="bg-stone-900 text-white rounded-[2.5rem] p-6 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
              Clarity Labour Intelligence
            </h3>
            <Cpu size={14} className="text-[#a9b897]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono">
            <div>Total Hours: {clarityTimesheets.totalHours}</div>
            <div>Avg Hours: {clarityTimesheets.avgHours.toFixed(2)}</div>
            <div>Active Entries: {clarityTimesheets.activeEntries}</div>
            <div>Status: {clarityTimesheets.status}</div>
          </div>

          {clarityTimesheets.riskFlags.length > 0 && (
            <div className="mt-3 text-[9px] uppercase tracking-widest text-red-300">
              {clarityTimesheets.riskFlags.join(" • ")}
            </div>
          )}
        </div>

        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Timer size={18} /></div>
              <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">Fiscal Governance Active</p>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Timesheets</h1>
          </div>
        </header>

        {/* TIMESHEET INTERNAL TABS */}
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-full p-1 w-fit shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("timesheets")}
            className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "timesheets" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
          >
            Timesheets
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "insights" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
          >
            Insights
          </button>
        </div>

        {activeTab === "timesheets" && (
          <>
          <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm space-y-8 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-serif italic tracking-tighter">Labor Entry</h3>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-900 text-white px-6 py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest cursor-pointer">
                {generateWeekOptions().map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-end">
              <div className="xl:col-span-3 space-y-2">
                <label className="text-[8px] font-black uppercase text-stone-300">Client Reference</label>
                <input placeholder="Entity Name..." value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3.5 text-sm font-bold outline-none" />
              </div>
              <div className="xl:col-span-3 space-y-2">
                <label className="text-[8px] font-black uppercase text-stone-300">Operational Scope</label>
                <input placeholder="Task Details..." value={formData.task} onChange={(e) => setFormData({...formData, task: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3.5 text-sm font-bold outline-none" />
              </div>
              <div className="xl:col-span-5 grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-[7px] text-center font-black text-stone-300">{day}</p>
                    <input value={(formData as any)[['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx]]} onChange={(e) => setFormData({...formData, [['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx]]: e.target.value})} className="w-full bg-stone-50 text-center font-bold text-xs p-3 rounded-lg border border-stone-100 outline-none" placeholder="0" />
                  </div>
                ))}
              </div>
              <button onClick={commitLaborLog} className="xl:col-span-1 h-[46px] bg-stone-900 text-[#a9b897] rounded-xl flex items-center justify-center hover:bg-stone-800 transition-all">
                <Plus size={20} />
              </button>
            </div>
          </section>

          <section className="space-y-4">
            {isLoading ? <div className="text-center py-20"><Loader2 className="animate-spin inline text-[#a9b897]" /></div> : (
              timesheetList.map((t) => (
                <div key={t.id} className="bg-white border border-stone-100 p-5 rounded-[2rem] flex items-center justify-between shadow-sm">
                  <div className="flex gap-6 items-center">
                    <div className="p-4 bg-stone-50 rounded-xl"><Briefcase size={20} className="text-stone-400" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#a9b897]">{t.client}</p>
                      <h4 className="text-xl font-serif italic tracking-tighter">{t.task}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <span className="text-3xl font-serif italic">{calculateTotal(t)}</span>
                    <button onClick={() => purgeRecord(t.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </section>

          <div className="flex justify-center gap-4">
            <button onClick={dispatchLedgerData} className="flex items-center gap-3 px-8 py-3 bg-white border border-stone-200 rounded-full text-[8px] font-black uppercase tracking-widest hover:border-stone-900">
              {isExporting ? <Loader2 className="animate-spin" size={12} /> : <FileSpreadsheet size={12} />}
              <span>Export Ledger Data</span>
            </button>
          </div>
          </>
        )}

        {activeTab === "insights" && (
          <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-3xl font-serif italic mb-6">Labour Insights</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 border rounded-xl">
                <p className="text-xs uppercase text-stone-400">Total Hours</p>
                <p className="text-2xl font-serif italic">{clarityTimesheets.totalHours}</p>
              </div>

              <div className="p-4 border rounded-xl">
                <p className="text-xs uppercase text-stone-400">Productivity Index</p>
                <p className="text-2xl font-serif italic">{clarityTimesheets.productivityIndex.toFixed(0)}</p>
              </div>

              <div className="p-4 border rounded-xl">
                <p className="text-xs uppercase text-stone-400">Status</p>
                <p className="text-2xl font-serif italic capitalize">{clarityTimesheets.status}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}