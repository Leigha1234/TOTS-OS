"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/app/components/Button";
import Card from "@/app/components/Card";
import { 
  Zap, Clock, ChevronLeft, ChevronRight, 
  Save, Plus, Info, CheckCircle2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklyTimesheetPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Week Management ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // States for the UI Matrix
  const [rows, setRows] = useState<any[]>([
    { project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }
  ]);

  useEffect(() => { init(); }, [currentDate]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      const { data: p } = await supabase.from("projects").select("*").eq("team_id", mem.team_id);
      setProjects(p || []);
      loadWeeklyLogs(mem.team_id, user.id);
    }
  }

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(start.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  async function loadWeeklyLogs(tId: string, uId: string) {
    setLoading(true);
    const startStr = weekDays[0].toISOString().split('T')[0];
    const endStr = weekDays[6].toISOString().split('T')[0];

    const { data: logs } = await supabase.from("timesheets")
      .select(`*, projects(name)`)
      .eq("user_id", uId)
      .gte("date", startStr)
      .lte("date", endStr);

    if (logs && logs.length > 0) {
      // Logic to transform flat logs back into the row/day matrix if needed
      // For now, we start with a fresh row for ease of entry
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

  const addRow = () => setRows([...rows, { project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }]);

  const saveWeeklyBatch = async () => {
    setIsSaving(true);
    const entries: any[] = [];

    rows.forEach(row => {
      if (!row.project_id) return;
      
      Object.keys(row.days).forEach((dayKey, i) => {
        const hours = parseFloat(row.days[dayKey]);
        if (hours > 0) {
          entries.push({
            project_id: row.project_id,
            user_id: userId,
            team_id: teamId,
            hours: hours,
            date: weekDays[i].toISOString().split('T')[0],
            description: row.description,
            metadata: { week_commencing: weekDays[0].toISOString().split('T')[0] }
          });
        }
      });
    });

    const { error } = await supabase.from("timesheets").insert(entries);
    if (!error) {
      alert("Weekly batch committed to payroll.");
      setRows([{ project_id: "", days: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" }, description: "" }]);
    }
    setIsSaving(false);
  };

  const totalHours = rows.reduce((acc, row) => {
    return acc + Object.values(row.days).reduce((dayAcc: number, val: any) => dayAcc + (parseFloat(val) || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12">
      
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Chronos Intelligence</p>
          <h1 className="text-6xl font-serif italic tracking-tighter text-stone-800">Weekly Pulse</h1>
          <div className="flex items-center gap-4 mt-4">
            <button onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 7);
              setCurrentDate(d);
            }} className="p-2 hover:bg-stone-100 rounded-full transition-all"><ChevronLeft size={18}/></button>
            <span className="text-xs font-bold uppercase tracking-widest bg-white px-6 py-2 rounded-full border border-stone-200 shadow-sm">
              Week of {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 7);
              setCurrentDate(d);
            }} className="p-2 hover:bg-stone-100 rounded-full transition-all"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* CLARITY INSIGHT BOX */}
        <div className="bg-[#1c1c1c] text-white p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-stone-800 min-w-[400px]">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <Zap size={12} className="text-[#a9b897]" /> Clarity Synthesis
            </p>
            <p className="text-xs text-stone-400 italic leading-relaxed">
              {totalHours > 40 ? "Capacity threshold exceeded. Reviewing high-tier delegation." : "Optimal load detected for the current week."}
            </p>
          </div>
          <div className="text-right border-l border-stone-800 pl-10">
            <p className="text-5xl font-serif italic text-[#a9b897]">{totalHours}</p>
            <p className="text-[9px] font-black uppercase tracking-tighter text-stone-500">Billable Hours</p>
          </div>
        </div>
      </header>

      {/* THE MATRIX */}
      <main className="max-w-[1600px] mx-auto">
        <Card className="rounded-[3rem] overflow-hidden border-stone-200 shadow-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-stone-400 w-64">Project Selection</th>
                  {weekDays.map((date, i) => (
                    <th key={i} className="p-8 text-center border-l border-stone-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                      <p className="text-lg font-serif italic text-stone-800 mt-1">{date.getDate()}</p>
                    </th>
                  ))}
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row, index) => (
                  <tr key={index} className="group hover:bg-stone-50/30 transition-colors">
                    <td className="p-6">
                      <select 
                        className="w-full bg-stone-100/50 border-none p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 ring-[#a9b897]"
                        value={row.project_id}
                        onChange={(e) => updateRow(index, 'project_id', e.target.value)}
                      >
                        <option value="">Choose Node</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                      <td key={day} className="p-4 border-l border-stone-50">
                        <input 
                          type="number"
                          placeholder="0"
                          className="w-full bg-transparent text-center text-xl font-serif italic outline-none placeholder:text-stone-200"
                          value={row.days[day]}
                          onChange={(e) => updateRow(index, `day-${day}`, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="p-6 border-l border-stone-50">
                      <input 
                        type="text"
                        placeholder="Context..."
                        className="w-full bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none placeholder:text-stone-200"
                        value={row.description}
                        onChange={(e) => updateRow(index, 'description', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center">
            <button 
              onClick={addRow}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a9b897] hover:text-stone-900 transition-all"
            >
              <Plus size={14} /> Add Project Line
            </button>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 text-stone-400 italic text-[10px]">
                 <Info size={14} />
                 <span>Entries are automatically timestamped for payroll.</span>
               </div>
               <Button 
                onClick={saveWeeklyBatch} 
                disabled={isSaving || totalHours === 0}
                className="bg-stone-950 text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">Commit Week</span>
               </Button>
            </div>
          </div>
        </Card>

        {/* RECENT ACTIVITY / PAYSLIP PREVIEW */}
        <section className="mt-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Recent Commits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 size={18}/></div>
                  <span className="text-[9px] font-black uppercase text-stone-300">April Cycle</span>
                </div>
                <div>
                  <p className="text-2xl font-serif italic text-stone-800">38.5h</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Billable Week 14</p>
                </div>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}