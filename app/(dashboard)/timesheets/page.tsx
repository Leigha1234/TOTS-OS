"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  Zap, Clock, ChevronLeft, ChevronRight, 
  Save, Plus, Info, CheckCircle2, Loader2,
  Calendar as CalendarIcon, Globe, Sparkles, X, Activity, FolderPlus, ShieldCheck, Briefcase, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklyTimesheetPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Intelligence States
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  // Row Matrix State
  const [rows, setRows] = useState<any[]>([
    { project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }
  ]);

  // --- Date Logic ---
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(new Date(start).setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  useEffect(() => { init(); }, [currentDate]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Set fallback state for visual rendering
      setTeamId("team-123");
      setUserId("user-123");
      setProjects([
        { id: "p1", name: "Project Zero", team_id: "team-123" }
      ]);
      setLoading(false);
      return;
    }
    
    setUserId(user.id);

    const { data: mem } = await supabase.from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (mem?.team_id) {
      setTeamId(mem.team_id);
      const { data: p } = await supabase.from("projects")
        .select("*")
        .eq("team_id", mem.team_id);
      setProjects(p || []);
    }
    setLoading(false);
  }

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    if (field.startsWith("day-")) {
      const day = field.split("-")[1];
      newRows[index].days[day] = value;
    } else {
      newRows[index][field] = value;
    }
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, { 
    project_id: "", 
    days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, 
    description: "" 
  }]);

  const totalHours = useMemo(() => {
    return rows.reduce((acc, row) => {
      return acc + Object.values(row.days).reduce((dayAcc: number, val: any) => 
        dayAcc + (parseFloat(val) || 0), 0);
    }, 0);
  }, [rows]);

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      setInsight(
        totalHours > 40 
          ? `Load Analysis: High-velocity output detected (${totalHours} hours). Optimization recommended to maintain node stability.` 
          : `Load Analysis: Efficiency stabilized. Current load aligns with project velocity at ${totalHours} units.`
      );
      setIsScanActive(false);
    }, 2200);
  };

  const saveWeeklyBatch = async () => {
    if (totalHours === 0 || !userId) return;
    setIsSaving(true);
    
    const entries = rows.flatMap(row => {
      if (!row.project_id) return [];
      
      return Object.keys(row.days).map((dayKey, i) => {
        const hours = parseFloat(row.days[dayKey]);
        if (isNaN(hours) || hours <= 0) return null;
        
        return {
          project_id: row.project_id,
          user_id: userId,
          team_id: teamId,
          hours: hours,
          date: weekDays[i].toISOString().split('T')[0],
          description: row.description,
          metadata: { week_commencing: weekDays[0].toISOString().split('T')[0] }
        };
      }).filter(Boolean);
    });

    const { error } = await supabase.from("timesheets").insert(entries);
    
    if (!error) {
      setRows([{ project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }]);
    }
    setIsSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Chronos Engine...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER: TITLE & INTELLIGENCE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Globe size={14} className="animate-pulse" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Chronos System v.3</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Weekly Pulse</h1>

          {/* DATE SELECTOR */}
          <div className="flex items-center gap-4 mt-6">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
              className="p-3 hover:bg-stone-200/50 rounded-full transition-all text-stone-600"
            >
              <ChevronLeft size={18}/>
            </button>
            <div className="flex items-center gap-4 bg-white px-8 py-3 rounded-full border border-stone-200 shadow-sm">
              <CalendarIcon size={14} className="text-stone-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">
                {weekDays[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} — {weekDays[6].toLocaleDateString(undefined, { day: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
              className="p-3 hover:bg-stone-200/50 rounded-full transition-all text-stone-600"
            >
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {isScanActive ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="animate-spin text-[#a9b897]" size={20} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Sparkles className="text-[#a9b897] group-hover:rotate-12 transition-transform" size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Analysis..." : "Load Analysis Scan"}
          </span>
        </motion.button>
      </header>

      {/* CLARITY INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#1c1c1c] text-stone-100 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#a9b897]/30"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-[#a9b897]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#a9b897]/20">
                <Zap className="text-[#a9b897]" size={32} />
              </div>
              <div>
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em] mb-2">Synthetic Insight</p>
                <p className="font-serif italic text-2xl text-stone-200 leading-snug max-w-3xl">{insight}</p>
              </div>
            </div>
            <button 
              onClick={() => setInsight(null)} 
              className="p-3 hover:bg-stone-800 rounded-full text-stone-500 transition-colors cursor-pointer"
            >
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATRIX TABLE MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-4">
        <aside className="lg:col-span-3">
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-8 sticky top-32">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">Time Unit Hub</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Output Units</p>
            </div>

            <div className="border-t border-stone-50 pt-6">
              <p className={`text-6xl font-serif italic ${totalHours > 40 ? "text-orange-500" : "text-[#a9b897]"}`}>
                {totalHours.toFixed(1)}
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mt-2">Billable Time Units</p>
            </div>
            
            <p className="text-[10px] text-stone-400 leading-relaxed italic border-t border-stone-50 pt-6">
              {totalHours > 40 
                ? "Threshold alert: High-velocity output detected. Optimization recommended." 
                : "Efficiency stabilized. Current load aligns with project velocity."}
            </p>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-100">
                    <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 w-80">Project Stream</th>
                    {weekDays.map((date, i) => (
                      <th key={i} className={`p-8 text-center border-l border-stone-100/50 ${i > 4 ? 'bg-stone-100/30' : ''}`}>
                        <p className="text-[9px] font-black uppercase tracking-tighter text-stone-400">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                        <p className="text-2xl font-serif italic text-stone-800 mt-1">{date.getDate()}</p>
                      </th>
                    ))}
                    <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  <AnimatePresence>
                    {rows.map((row, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="p-8">
                          <select 
                            className="w-full bg-stone-50 border border-stone-100 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 ring-[#a9b897]/5 appearance-none cursor-pointer"
                            value={row.project_id}
                            onChange={(e) => updateRow(index, 'project_id', e.target.value)}
                          >
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, i) => (
                          <td key={day} className={`p-4 border-l border-stone-50 ${i > 4 ? 'bg-stone-50/20' : ''}`}>
                            <input 
                              type="number"
                              placeholder="0"
                              className="w-full bg-transparent text-center text-3xl font-serif italic outline-none placeholder:text-stone-300 focus:text-[#a9b897] transition-colors"
                              value={row.days[day]}
                              onChange={(e) => updateRow(index, `day-${day}`, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="p-8 border-l border-stone-50">
                          <input 
                            type="text"
                            placeholder="Project notes..."
                            className="w-full bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none placeholder:text-stone-300 focus:text-stone-900"
                            value={row.description}
                            onChange={(e) => updateRow(index, 'description', e.target.value)}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* TABLE ACTIONS */}
            <div className="p-10 bg-stone-50/30 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <button 
                onClick={addRow}
                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#a9b897] hover:text-stone-900 transition-all group cursor-pointer"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
                Add New Stream
              </button>
              
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="flex items-center gap-3 text-stone-400 italic text-[10px]">
                  <Info size={16} className="text-[#a9b897]" />
                  <span>Verified commits are finalized every Sunday at 23:59.</span>
                </div>
                
                <button 
                  onClick={saveWeeklyBatch} 
                  disabled={isSaving || totalHours === 0}
                  className="bg-stone-900 text-white px-12 py-5 rounded-[2rem] flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 cursor-pointer border-0"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />}
                  <span className="text-[9px] font-black tracking-[0.3em] uppercase">Commit Sequence</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}