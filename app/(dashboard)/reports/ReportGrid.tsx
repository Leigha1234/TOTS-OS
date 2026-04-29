"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; // Use sync client
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  AlertCircle,
  Activity,
  BarChart3,
  Search
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mem } = await supabase.from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mem?.team_id) return setLoading(false);

      const [inv, tks, ts] = await Promise.all([
        supabase.from("invoices").select("*").eq("team_id", mem.team_id),
        supabase.from("tasks").select("*").eq("team_id", mem.team_id),
        supabase.from("timesheets").select("*").eq("team_id", mem.team_id)
      ]);

      const rev = inv.data?.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0) || 0;
      const hrs = ts.data?.reduce((s, t) => s + (t.hours || 0), 0) || 0;

      setData({
        revenue: rev,
        totalHours: hrs,
        payrollEst: hrs * 25,
        overdueCount: inv.data?.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== "paid").length || 0,
        tasksDone: tks.data?.filter(t => t.status === "done").length || 0,
      });
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-20">
      <div className="flex items-center gap-3 text-stone-400 font-serif italic text-xl animate-pulse">
        <Activity size={24} className="animate-spin" />
        Synthesizing Metrics...
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-20 text-stone-400 italic">
      No operational data found for this entity.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <BarChart3 size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Intelligence Suite</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter">Performance</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Telemetry Active</p>
        </div>
      </header>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* REVENUE: DARK THEME CONTRAST */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group"
        >
          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-stone-800 rounded-2xl text-[#a9b897]">
              <TrendingUp size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Capital Flow</span>
          </div>
          <div className="z-10 mt-8">
            <p className="text-4xl font-mono tracking-tighter">£{data.revenue.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Aggregate Revenue</p>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
            <Banknote size={160} />
          </div>
        </motion.div>

        {/* TASKS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Execution</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{data.tasksDone}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Completed Nodes</p>
          </div>
        </motion.div>

        {/* LABOR CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
              <Clock size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Efficiency</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{data.totalHours}<span className="text-xl ml-1 text-stone-400 font-serif italic">hrs</span></p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Labor Deployment</p>
          </div>
        </motion.div>

        {/* PAYROLL: WIDE SPAN */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px] lg:col-span-2 group"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
              <Search size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Estimated Liability</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-8">
            <div>
              <p className="text-5xl font-mono tracking-tighter text-stone-900">£{data.payrollEst.toLocaleString()}</p>
              <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Projected Payroll Node</p>
            </div>
            <div className="bg-stone-50 border border-stone-100 px-6 py-3 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-yellow-600/70 tracking-widest leading-relaxed">
                Calculated at £25.00 / hour <br/> based on active logging
              </p>
            </div>
          </div>
        </motion.div>

        {/* CRITICAL STATE: RED ACCENT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#fff1f1] border border-red-100 p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200">
              <AlertCircle size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-red-400 tracking-[0.3em]">Risk Assessment</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-red-600">{data.overdueCount}</p>
            <p className="text-[10px] text-red-400 uppercase font-black mt-2 tracking-widest italic">Overdue Invoices</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}