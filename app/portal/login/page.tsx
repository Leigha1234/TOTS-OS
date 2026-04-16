"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../components/AuthGuard";
import Card from "../components/Card";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  Zap, 
  ArrowRight,
  Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [todoList, setTodoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Fetch Data in parallel for performance
    const [hrsRes, tksCountRes, listRes] = await Promise.all([
      supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today),
      supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("status", "active"),
      supabase.from("tasks").select("*, projects(name)").eq("user_id", user.id).eq("status", "active").order('created_at', { ascending: false })
    ]);

    setTodayHours(hrsRes.data?.reduce((s, h) => s + h.hours, 0) || 0);
    setActiveTasks(tksCountRes.count || 0);
    setTodoList(listRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function toggleTask(id: string) {
    // Optimistic Update
    setTodoList(prev => prev.filter(t => t.id !== id));
    setActiveTasks(prev => prev - 1);

    // Database Update
    await supabase.from("tasks").update({ status: "completed" }).eq("id", id);
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 lg:p-16 space-y-12">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#a9b897]">
              <Target size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Performance Overview</span>
            </div>
            <h1 className="text-6xl font-serif italic text-stone-900 tracking-tighter leading-none">
              Dashboard
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Operational Date</p>
            <p className="text-sm font-mono font-bold text-stone-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </header>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white border-stone-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time Allocation</span>
              <Clock className="text-stone-300" size={18} />
            </div>
            <div>
              <p className="text-4xl font-mono font-bold tracking-tighter text-stone-900">{todayHours} <span className="text-lg text-stone-400">HRS</span></p>
              <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-widest font-bold">Logged Today</p>
            </div>
          </Card>

          <Card className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between min-h-[160px] text-white">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Active Backlog</span>
              <Zap className="text-[#a9b897]" size={18} />
            </div>
            <div>
              <p className="text-4xl font-mono font-bold tracking-tighter text-[#a9b897]">{activeTasks}</p>
              <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest font-bold">Open Initiatives</p>
            </div>
          </Card>

          <Card className="bg-white border-stone-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Efficiency Index</span>
              <Target className="text-stone-300" size={18} />
            </div>
            <div>
              <p className={`text-2xl font-serif italic ${todayHours >= 7 ? "text-[#a9b897]" : "text-stone-900"}`}>
                {todayHours >= 7 ? "Optimal Flow" : "System Warming"}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-widest font-bold">Daily Threshold</p>
            </div>
          </Card>
        </div>

        {/* FOCUS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-900">Today's Strategic Focus</h2>
              <span className="text-[9px] font-black uppercase bg-stone-900 text-white px-3 py-1 rounded-full tracking-widest">
                {todoList.length} Pending
              </span>
            </div>
            
            <div className="divide-y divide-stone-100">
              <AnimatePresence initial={false}>
                {todoList.length > 0 ? (
                  todoList.map((task) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center justify-between p-6 hover:bg-stone-50 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative flex items-center justify-center">
                          <Circle className="text-stone-200 group-hover:text-[#a9b897] transition-colors" size={24} strokeWidth={1.5} />
                          <CheckCircle2 className="absolute scale-0 group-hover:scale-100 text-[#a9b897] transition-transform duration-200" size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-serif italic text-stone-900 leading-tight">{task.title}</span>
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">{task.projects?.name || 'Unassigned Project'}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-stone-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <CheckCircle2 className="mx-auto text-[#a9b897] opacity-20" size={48} />
                    <p className="font-serif italic text-stone-400 text-lg">Daily objectives neutralized.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* QUOTE / PHILOSOPHY CARD */}
          <div className="bg-[#a9b897] p-12 rounded-[3rem] text-white flex flex-col justify-between h-full min-h-[300px] shadow-lg relative overflow-hidden group">
            <Quote size={80} className="absolute -top-4 -left-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-70">Philosophy</p>
              <p className="text-3xl font-serif italic leading-snug tracking-tighter">
                "Focus on being productive instead of busy."
              </p>
            </div>
            <div className="relative z-10 pt-8 border-t border-white/20">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">— TOTs OS Sentinel</p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}