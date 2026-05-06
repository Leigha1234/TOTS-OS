"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2, Users } from "lucide-react";

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

  const [timesheetClient, setTimesheetClient] = useState("");
  const [timesheetTask, setTimesheetTask] = useState("");
  const [timesheetTeamMember, setTimesheetTeamMember] = useState("");
  const [timesheetMon, setTimesheetMon] = useState("0");
  const [timesheetTue, setTimesheetTue] = useState("0");
  const [timesheetWed, setTimesheetWed] = useState("0");
  const [timesheetThu, setTimesheetThu] = useState("0");
  const [timesheetFri, setTimesheetFri] = useState("0");
  const [timesheetSat, setTimesheetSat] = useState("0");
  const [timesheetSun, setTimesheetSun] = useState("0");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addTimesheetEntry = () => {
    if (!timesheetClient || !timesheetTask) return;
    
    const newEntry: TimesheetEntry = {
      id: Date.now().toString(),
      client: timesheetClient,
      task: timesheetTask,
      teamMember: timesheetTeamMember || "Unassigned",
      mon: parseFloat(timesheetMon) || 0,
      tue: parseFloat(timesheetTue) || 0,
      wed: parseFloat(timesheetWed) || 0,
      thu: parseFloat(timesheetThu) || 0,
      fri: parseFloat(timesheetFri) || 0,
      sat: parseFloat(timesheetSat) || 0,
      sun: parseFloat(timesheetSun) || 0,
    };

    setTimesheetList([...timesheetList, newEntry]);
    
    // Reset inputs
    setTimesheetClient("");
    setTimesheetTask("");
    setTimesheetTeamMember("");
    setTimesheetMon("0");
    setTimesheetTue("0");
    setTimesheetWed("0");
    setTimesheetThu("0");
    setTimesheetFri("0");
    setTimesheetSat("0");
    setTimesheetSun("0");
  };

  const deleteTimesheetEntry = (id: string) => {
    setTimesheetList(timesheetList.filter((item) => item.id !== id));
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1400px] mx-auto space-y-12">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Clock size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Operations Management</p>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter">Operational Timesheets</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Time Recording</p>
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => router.push("/payments")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          Financials
        </button>
        <button 
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-stone-900 text-white shadow-xl cursor-pointer"
        >
          Timesheets
        </button>
        <button 
          onClick={() => router.push("/hr")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          HR & Payroll
        </button>
      </div>

      <div className="bg-white border border-stone-200/60 p-10 rounded-[3rem] shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-100 pb-6">
          <div className="flex items-center gap-4">
            <Clock size={20} className="text-[#a9b897]" />
            <h3 className="text-2xl font-serif italic text-stone-800">Timesheets Summary</h3>
          </div>
          <input 
            type="week" 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold px-4 py-3 rounded-2xl outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Client</label>
            <input 
              placeholder="Client Reference" 
              value={timesheetClient} 
              onChange={(e) => setTimesheetClient(e.target.value)}
              className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Task Description</label>
            <input 
              placeholder="Task Name" 
              value={timesheetTask} 
              onChange={(e) => setTimesheetTask(e.target.value)}
              className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Team Member</label>
            <input 
              placeholder="Assignee Name" 
              value={timesheetTeamMember} 
              onChange={(e) => setTimesheetTeamMember(e.target.value)}
              className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Hours (Mon to Sun)</label>
            <div className="grid grid-cols-7 gap-1 mt-3">
              <input value={timesheetMon} onChange={(e) => setTimesheetMon(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="M" />
              <input value={timesheetTue} onChange={(e) => setTimesheetTue(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="T" />
              <input value={timesheetWed} onChange={(e) => setTimesheetWed(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="W" />
              <input value={timesheetThu} onChange={(e) => setTimesheetThu(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="T" />
              <input value={timesheetFri} onChange={(e) => setTimesheetFri(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="F" />
              <input value={timesheetSat} onChange={(e) => setTimesheetSat(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="S" />
              <input value={timesheetSun} onChange={(e) => setTimesheetSun(e.target.value)} className="w-full bg-stone-50 border border-stone-100 p-3 rounded-lg text-center font-bold text-xs outline-none" placeholder="S" />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={addTimesheetEntry} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs hover:bg-stone-800 transition-all cursor-pointer">
              + Log Entry
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-stone-100">
          {timesheetList.map((t) => (
            <div key={t.id} className="flex justify-between items-center bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <div>
                <span className="text-xs font-black uppercase">{t.client}</span>
                <p className="text-[10px] text-stone-500 mt-1">{t.task}</p>
                <p className="text-[9px] text-[#a9b897] font-bold mt-0.5 tracking-wide">Worker: {t.teamMember}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                  {t.mon + t.tue + t.wed + t.thu + t.fri + t.sat + t.sun} Hrs
                </span>
                <button onClick={() => deleteTimesheetEntry(t.id)} className="text-stone-300 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {timesheetList.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-stone-400 font-serif italic">No timesheet entries logged.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}