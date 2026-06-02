"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import { Circle, Zap, Activity, Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// ✅ single client instance (prevents re-init bugs)

export default function OperationalPulse() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [todoList, setTodoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [hrs, tasks, list] = await Promise.all([
      supabase
        .from("timesheets")
        .select("hours")
        .eq("user_id", user.id)
        .eq("date", today),

      supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active"),

      supabase
        .from("tasks")
        .select("*, projects(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
    ]);

    if (hrs.error || tasks.error || list.error) {
      console.error(hrs.error, tasks.error, list.error);
      setLoading(false);
      return;
    }

    // ✅ safe hours sum
    const totalHours =
      hrs.data?.reduce((sum: any, h: { hours: any; }) => sum + (h.hours ?? 0), 0) ?? 0;

    setTodayHours(totalHours);
    setActiveTasks(tasks.data?.length ?? 0);
    setTodoList(list.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function toggleTask(id: string) {
    // ✅ optimistic update (instant UI feel)
    setTodoList((prev) => prev.filter((t) => t.id !== id));
    setActiveTasks((prev) => Math.max(0, prev - 1));

    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      console.error(error);
      loadStats(); // rollback sync if failed
    }
  }

  return (
    <AuthGuard>
      <div className="p-8 lg:p-16 max-w-[1600px] mx-auto min-h-screen bg-[#faf9f6] text-stone-900 space-y-12">

        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-[#a9b897]">
            <Zap size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">
              System Node Active
            </span>
          </div>
          <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-none">
            Operational Pulse
          </h1>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: "LOGGED TODAY",
              val: `${todayHours} HRS`,
              sub: "TIME ALLOCATION",
              color: "text-[#a9b897]",
            },
            {
              label: "ACTIVE DEPLOYMENTS",
              val: activeTasks,
              sub: "RESOURCE LOAD",
              color: "text-stone-900",
            },
            {
              label: "EFFICIENCY INDEX",
              val: todayHours >= 7 ? "OPTIMAL" : "BUILDING",
              sub: "CAPACITY MONITOR",
              color: "text-[#a9b897]",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-stone-100 p-12 rounded-[4rem] shadow-sm flex flex-col justify-between h-[320px] transition-all hover:shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
                  {stat.label}
                </p>
                <Activity
                  size={20}
                  className="text-stone-200 group-hover:text-[#a9b897] transition-colors"
                />
              </div>

              <h2 className={`text-6xl font-serif italic tracking-tighter ${stat.color}`}>
                {stat.val}
              </h2>

              <div className="inline-flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-full w-fit border border-stone-100">
                <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  {stat.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* FOCUS ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* TASK LIST */}
          <div className="lg:col-span-3 bg-white border border-stone-100 rounded-[4rem] overflow-hidden flex flex-col shadow-sm">
            <div className="p-10 border-b border-stone-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Target size={20} className="text-[#a9b897]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-900">
                  Mission Priorities
                </h2>
              </div>

              <span className="text-[9px] font-black uppercase bg-[#a9b897]/10 text-[#a9b897] px-4 py-2 rounded-full tracking-widest">
                {todoList.length} QUEUED
              </span>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {todoList.length > 0 ? (
                todoList.map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ x: 10 }}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-6 p-8 bg-stone-50/50 hover:bg-white hover:shadow-lg rounded-3xl cursor-pointer border border-transparent hover:border-stone-100 transition-all group"
                  >
                    <Circle
                      className="text-stone-300 group-hover:text-[#a9b897] transition-colors"
                      size={24}
                    />

                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold uppercase tracking-tight text-stone-800 group-hover:text-stone-900">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-[#a9b897] font-black uppercase tracking-widest">
                        {task.projects?.name || "TACTICAL ASSET"}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <CheckCircle2
                    size={48}
                    className="mx-auto text-[#a9b897] opacity-20"
                  />
                  <p className="font-serif italic text-stone-400 text-xl text-center">
                    All operational tasks finalized.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MOTIVATION PANEL */}
          <div className="lg:col-span-2 bg-stone-900 p-12 rounded-[4rem] flex flex-col justify-center items-center text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.5em] mb-6">
                Strategic Directive
              </p>
              <p className="text-3xl md:text-4xl font-serif italic text-stone-200 leading-tight tracking-tight">
                "Focus on being productive instead of busy."
              </p>
            </div>

            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#a9b897] blur-[120px] opacity-20" />
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}