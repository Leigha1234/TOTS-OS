"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import Card from "@/app/components/Card";
import { CheckCircle2, Circle } from "lucide-react";

export default function Dashboard() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [todoList, setTodoList] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch Hours
      const { data: hrs } = await supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today);
      
      // Fetch Active Tasks Count
      const { count: tks } = await supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("status", "active");

      // Fetch Task List for the Tick-list
      const { data: list } = await supabase.from("tasks")
        .select("*, projects(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order('created_at', { ascending: false });

      setTodayHours(hrs?.reduce((s, h) => s + h.hours, 0) || 0);
      setActiveTasks(tks || 0);
      setTodoList(list || []);
    }
    loadStats();
  }, []);

  async function toggleTask(id: string) {
    // Optimistic Update
    setTodoList(prev => prev.filter(t => t.id !== id));
    setActiveTasks(prev => prev - 1);

    // Database Update
    await supabase.from("tasks").update({ status: "completed" }).eq("id", id);
  }

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Logged Today</p>
            <p className="text-3xl font-bold text-blue-400 font-mono">{todayHours} hrs</p>
          </Card>

          <Card>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Active Tasks</p>
            <p className="text-3xl font-bold text-white font-mono">{activeTasks}</p>
          </Card>

          <Card>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Productivity</p>
            <p className="text-3xl font-bold text-green-400 font-mono">
              {todayHours >= 7 ? "Optimal" : "Building..."}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TODAY'S TICK LIST */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-tighter">Today's Focus</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{todoList.length} Remaining</span>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
              {todoList.length > 0 ? (
                todoList.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer group transition-all"
                  >
                    <Circle className="text-gray-600 group-hover:text-green-500 transition-colors" size={18} />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-200 group-hover:text-white transition-colors">{task.title}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{task.projects?.name || 'General'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 italic text-sm">
                  All caught up! Time to relax or add more tasks.
                </div>
              )}
            </div>
          </div>

          {/* QUOTE CARD */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center justify-center">
            <p className="text-lg text-gray-400 italic text-center">"Focus on being productive instead of busy."</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}