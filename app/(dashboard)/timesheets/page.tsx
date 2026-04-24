"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import Button from "@/app/components/Button";
import Card from "@/app/components/Card";
import { 
  Zap, Clock, ChevronLeft, ChevronRight, 
  Save, Plus, Info, CheckCircle2, Loader2,
  Calendar as CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklyTimesheetPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Row Matrix State
  const [rows, setRows] = useState<any[]>([
    { project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }
  ]);

  // --- Date Logic ---
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    // Monday adjustment (handling Sunday as 0)
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
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

  const saveWeeklyBatch = async () => {
    if (totalHours === 0) return;
    setIsSaving(true);
    const supabase = createClient();
    
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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-6 md:p-12 lg:p-20 font-sans">
      
      {/* HEADER: Editorial Layout */}
      <header className="max-w-[1600px] mx-auto mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-[1px] bg-[#a9b897]" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Chronos System v.3</p>
          </div>
          <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter text-stone-800 leading-none">
            Weekly Pulse
          </h1>
          
          <div className="flex items-center gap-2 mt-6">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
              className="p-3 hover:bg-stone-200/50 rounded-full transition-all"
            >
              <ChevronLeft size={20}/>
            </button>
            <div className="flex items-center gap-4 bg-white px-8 py-3 rounded-full border border-stone-200 shadow-sm">
              <CalendarIcon size={14} className="text-stone-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-stone-600">
                {weekDays[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} — {weekDays[6].toLocaleDateString(undefined, { day: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
              className="p-3 hover:bg-stone-200/50 rounded-full transition-all"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>

        {/* INSIGHT BOX: Dark Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] text-white p-10 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-12 border border-stone-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={120} />
          </div>
          <div className="space-y-3 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-2">
              <Zap size={14} className={totalHours > 40 ? "text-orange-400" : "text-[#a9b897]"} /> 
              Load Analysis
            </p>
            <p className="text-sm text-stone-400 italic leading-relaxed max-w-[240px]">
              {totalHours > 40 
                ? "Threshold alert: High-velocity output detected. Optimization recommended." 
                : "Efficiency stabilized. Current load aligns with project velocity."}
            </p>
          </div>
          <div className="text-right border-l border-stone-800 pl-12 relative z-10">
            <p className={`text-6xl font-serif italic ${totalHours > 40 ? "text-orange-400" : "text-[#a9b897]"}`}>
              {totalHours.toFixed(1)}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mt-2">Billable Units</p>
          </div>
        </motion.div>
      </header>

      {/* MATRIX TABLE */}
      <main className="max-w-[1600px] mx-auto">
        <Card className="rounded-[4rem] overflow-hidden border-stone-100 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.05)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 w-80">Project Stream</th>
                  {weekDays.map((date, i) => (
                    <th key={i} className={`p-8 text-center border-l border-stone-100/50 ${i > 4 ? 'bg-stone-100/30' : ''}`}>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-stone-400">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
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
                          className="w-full bg-stone-100/50 border-none px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 ring-[#a9b897] appearance-none"
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
                            className="w-full bg-transparent text-center text-3xl font-serif italic outline-none placeholder:text-stone-100 focus:text-[#a9b897] transition-colors"
                            value={row.days[day]}
                            onChange={(e) => updateRow(index, `day-${day}`, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="p-8 border-l border-stone-50">
                        <input 
                          type="text"
                          placeholder="Project notes..."
                          className="w-full bg-transparent text-[11px] font-bold uppercase tracking-tight outline-none placeholder:text-stone-200 focus:placeholder:text-stone-400"
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
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#a9b897] hover:text-stone-900 transition-all group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
              Add New Stream
            </button>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="flex items-center gap-3 text-stone-400 italic text-[11px]">
                 <Info size={16} className="text-[#a9b897]" />
                 <span>Verified commits are finalized every Sunday at 23:59.</span>
               </div>
               <Button 
                onClick={saveWeeklyBatch} 
                disabled={isSaving || totalHours === 0}
                className="bg-stone-950 text-white px-12 py-5 rounded-[2rem] flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                 <span className="text-[11px] font-black uppercase tracking-[0.3em]">Commit Sequence</span>
               </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}