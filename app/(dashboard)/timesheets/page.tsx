"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Trash2, Users, ArrowLeft, 
  Plus, Database, Calendar as CalendarIcon,
  ChevronRight, Timer
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
  teamMember?: string;
}

export default function TimesheetsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [selectedWeek, setSelectedWeek] = useState("2026-W18");
  const [timesheetList, setTimesheetList] = useState<TimesheetEntry[]>([
    { id: "1", client: "Cyberdyne Systems", task: "Platform Integration", mon: 4, tue: 8, wed: 6, thu: 8, fri: 4, sat: 0, sun: 0, teamMember: "Sarah Chen" },
    { id: "2", client: "Aperture Labs", task: "Bug Fixing", mon: 2, tue: 2, wed: 4, thu: 2, fri: 2, sat: 0, sun: 0, teamMember: "Jane Doe" }
  ]);

  // Form State
  const [formData, setFormData] = useState({
    client: "",
    task: "",
    member: "",
    mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0"
  });

  useEffect(() => { setIsMounted(true); }, []);

  const addTimesheetEntry = () => {
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

    setTimesheetList([...timesheetList, newEntry]);
    setFormData({ client: "", task: "", member: "", mon: "0", tue: "0", wed: "0", thu: "0", fri: "0", sat: "0", sun: "0" });
  };

  const deleteEntry = (id: string) => setTimesheetList(prev => prev.filter(t => t.id !== id));

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] selection:bg-[var(--brand-primary)] selection:text-white transition-colors duration-500">
      
      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-16 lg:p-20 space-y-12 pb-32">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-[var(--border)] pb-12">
          <div className="space-y-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
            </button>
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">
              Timesheets
            </h1>
            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
               <span className="flex items-center gap-2"><Timer size={12}/> Live Recording</span>
               <span className="flex items-center gap-2"><Database size={12}/> Operations Node</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            {["Financials", "Timesheets", "HR & Payroll"].map((label) => (
              <button 
                key={label}
                onClick={() => label !== "Timesheets" && router.push(`/${label.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`)}
                className={`flex-1 md:flex-none px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  label === "Timesheets" 
                  ? "bg-[var(--brand-primary)] text-white shadow-xl" 
                  : "bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LOGGING INTERFACE */}
          <section className="lg:col-span-12 bg-[var(--card-bg)] border border-[var(--border)] p-8 md:p-12 rounded-[4rem] shadow-sm space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border)] pb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[var(--bg-soft)] rounded-2xl">
                  <Clock size={24} className="text-[var(--brand-primary)]" />
                </div>
                <div>
                  <h3 className="text-3xl font-serif italic">Operational Log</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Neural Time Entry</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[var(--bg-soft)] p-2 rounded-2xl border border-[var(--border)]">
                <CalendarIcon size={14} className="ml-3 text-[var(--text-muted)]" />
                <input 
                  type="week" 
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none"
                />
              </div>
            </div>

            {/* INPUT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-3 space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Client Node</label>
                <input 
                  placeholder="Entity Name" 
                  value={formData.client} 
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-5 text-xs font-bold outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              <div className="md:col-span-3 space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Objective</label>
                <input 
                  placeholder="Task Description" 
                  value={formData.task} 
                  onChange={(e) => setFormData({...formData, task: e.target.value})}
                  className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-5 text-xs font-bold outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Assignee</label>
                <div className="flex items-center bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl px-4">
                  <Users size={14} className="text-[var(--text-muted)]" />
                  <input 
                    placeholder="Name" 
                    value={formData.member} 
                    onChange={(e) => setFormData({...formData, member: e.target.value})}
                    className="w-full bg-transparent p-5 text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-3 space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2 text-center block">Hours (M-S)</label>
                <div className="grid grid-cols-7 gap-1">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                    <input 
                      key={day}
                      value={(formData as any)[day]} 
                      onChange={(e) => setFormData({...formData, [day]: e.target.value})} 
                      className="w-full bg-[var(--bg-soft)] border border-[var(--border)] p-3 rounded-xl text-center font-black text-[10px] outline-none focus:border-[var(--brand-primary)]" 
                      placeholder={day[0].toUpperCase()} 
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-1">
                <button 
                  onClick={addTimesheetEntry} 
                  className="w-full aspect-square md:aspect-auto md:py-5 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl flex items-center justify-center hover:bg-[var(--brand-primary)] hover:text-white transition-all shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* LIST ENTRIES */}
            <div className="space-y-4 pt-12 border-t border-[var(--border)]">
              <AnimatePresence mode="popLayout">
                {timesheetList.map((t) => (
                  <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col md:flex-row justify-between items-center bg-[var(--bg-soft)] p-8 rounded-[2.5rem] border border-[var(--border)] group hover:border-[var(--brand-primary)] transition-all"
                  >
                    <div className="flex items-center gap-8 w-full md:w-auto">
                      <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--brand-primary)]">
                        <Timer size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">{t.client}</span>
                        <h4 className="text-xl font-serif italic text-[var(--text-main)]">{t.task}</h4>
                        <p className="text-[9px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                          <Users size={10} /> {t.teamMember}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12 mt-6 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-6 md:pt-0 border-[var(--border)]">
                      <div className="flex gap-2">
                        {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((h, i) => (
                          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black border ${h > 0 ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 text-[var(--brand-primary)]' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)]/30'}`}>
                            {h}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest">Total</p>
                          <span className="text-2xl font-serif italic text-[var(--text-main)]">
                            {t.mon + t.tue + t.wed + t.thu + t.fri + t.sat + t.sun} <span className="text-[10px] font-sans not-italic uppercase opacity-30">Hrs</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(t.id)} 
                          className="p-4 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {timesheetList.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-[3rem]">
                  <p className="text-sm text-[var(--text-muted)] font-serif italic">Operational logs empty. Pending synchronization.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}