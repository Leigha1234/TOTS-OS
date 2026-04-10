"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  AlertCircle 
} from "lucide-react";

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

  if (loading) return <p className="p-6 text-gray-400">Analysing data...</p>;
  if (!data) return <p className="p-6 text-gray-400">No data found for this team.</p>;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports & Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time performance metrics for your team.</p>
      </div>

      {/* STABLE CSS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CARD */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="text-green-500" size={20} /></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white font-mono">£{data.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total paid invoices</p>
          </div>
        </div>

        {/* TASKS CARD */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-blue-500/10 rounded-lg"><CheckCircle2 className="text-blue-500" size={20} /></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tasks</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white font-mono">{data.tasksDone}</p>
            <p className="text-xs text-gray-500 mt-1">Completed items</p>
          </div>
        </div>

        {/* STAFFING CARD */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-purple-500/10 rounded-lg"><Clock className="text-purple-500" size={20} /></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Labor</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white font-mono">{data.totalHours}h</p>
            <p className="text-xs text-gray-500 mt-1">Total hours logged</p>
          </div>
        </div>

        {/* PAYROLL CARD */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between min-h-[160px] lg:col-span-2">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-yellow-500/10 rounded-lg"><Banknote className="text-yellow-500" size={20} /></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payroll Est.</span>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-4xl font-bold text-white font-mono">£{data.payrollEst.toLocaleString()}</p>
            <p className="text-sm text-yellow-500/70 italic">Pending payout based on £25/hr</p>
          </div>
        </div>

        {/* OVERDUE CARD */}
        <div className="bg-gray-900 border border-red-900/30 p-6 rounded-2xl flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-gray-900 to-red-950/10">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="text-red-500" size={20} /></span>
            <span className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest">Critical</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white font-mono">{data.overdueCount}</p>
            <p className="text-xs text-gray-500 mt-1">Overdue invoices</p>
          </div>
        </div>

      </div>
    </div>
  );
}