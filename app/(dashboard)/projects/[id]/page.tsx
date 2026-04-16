"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserPlan } from "@/lib/getUserPlan";
import { getUserRole, canCreate } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  GripVertical, 
  Calendar, 
  User as UserIcon, 
  AlertCircle, 
  Lock,
  ArrowRight,
  Filter
} from "lucide-react";

const COLUMNS = [
  { id: "todo", label: "Backlog" },
  { id: "in_progress", label: "Active Ops" },
  { id: "done", label: "Completed" }
];

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [role, setRole] = useState<string | null>(null);

  const [newTask, setNewTask] = useState("");
  const [dragged, setDragged] = useState<any>(null);

  const loadTasks = useCallback(async (team: string) => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .eq("team_id", team);
    setTasks(data || []);
  }, [id]);

  useEffect(() => {
    async function init() {
      const [team, p, r] = await Promise.all([
        getUserTeam(),
        getUserPlan(),
        getUserRole()
      ]);

      if (!team) return;

      setTeamId(team);
      setPlan(p);
      setRole(r);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("team_id", team);

      setUsers(profiles || []);
      loadTasks(team);

      const channel = supabase
        .channel(`project-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${id}` }, 
        () => loadTasks(team))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, [id, loadTasks]);

  async function addTask() {
    if (plan === "free") return router.push("/billing");
    if (!canCreate(role)) return alert("Access Denied: Insufficient Permissions");
    if (!newTask || !teamId) return;

    await supabase.from("tasks").insert({
      title: newTask,
      project_id: id,
      team_id: teamId,
      status: "todo",
      priority: "medium",
    });

    setNewTask("");
    loadTasks(teamId);
  }

  async function updateTask(taskId: string, updates: any) {
    await supabase.from("tasks").update(updates).eq("id", taskId);
    // Realtime will handle the UI update
  }

  const priorityMeta = (p: string) => {
    switch(p) {
      case 'high': return { color: 'text-red-500', bg: 'bg-red-500/5' };
      case 'medium': return { color: 'text-amber-500', bg: 'bg-amber-500/5' };
      default: return { color: 'text-[#a9b897]', bg: 'bg-[#a9b897]/5' };
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 space-y-12">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Filter size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Task Orchestration</span>
          </div>
          <h1 className="text-5xl font-serif italic text-stone-900 tracking-tighter leading-none">
            Project Board
          </h1>
        </div>

        {plan === "free" && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push("/billing")}
            className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            <Lock size={14} className="text-[#a9b897]" />
            Upgrade to Unlock
          </motion.button>
        )}
      </header>

      {/* INPUT AREA */}
      <div className="max-w-2xl relative group">
        <input
          placeholder={plan === "free" ? "Tasks locked on Free Plan..." : "Enter new objective..."}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          disabled={plan === "free"}
          className="w-full bg-white border border-stone-200 rounded-2xl p-6 pl-14 shadow-sm focus:ring-2 ring-[#a9b897]/20 outline-none transition-all font-serif italic text-lg"
        />
        <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" size={20} />
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragged && updateTask(dragged.id, { status: col.id })}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">{col.label}</h2>
              <span className="text-[9px] font-mono text-stone-300 bg-stone-100 px-2 py-0.5 rounded italic">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div className="space-y-4 min-h-[500px] pb-20">
              <AnimatePresence mode="popLayout">
                {tasks
                  .filter((t) => t.status === col.id)
                  .map((t) => (
                    <motion.div
                      layout
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={() => setDragged(t)}
                      className="group bg-white border border-stone-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-[#a9b897] transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex gap-4">
                        <GripVertical className="text-stone-200 group-hover:text-stone-400 transition-colors shrink-0 mt-1" size={18} />
                        <div className="flex-1 space-y-4">
                          <input
                            value={t.title}
                            onChange={(e) => updateTask(t.id, { title: e.target.value })}
                            className="bg-transparent w-full outline-none font-serif italic text-stone-900 text-lg leading-tight"
                          />
                          
                          <div className="flex flex-wrap items-center gap-3">
                            {/* PRIORITY SELECT */}
                            <select
                              value={t.priority || "medium"}
                              onChange={(e) => updateTask(t.id, { priority: e.target.value })}
                              className={`text-[9px] font-black uppercase tracking-widest p-1 px-2 rounded-lg border-none outline-none ${priorityMeta(t.priority).bg} ${priorityMeta(t.priority).color}`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>

                            {/* DATE PICKER */}
                            <div className="relative flex items-center text-stone-400">
                              <Calendar size={12} className="absolute left-2 pointer-events-none" />
                              <input
                                type="date"
                                value={t.due_date || ""}
                                onChange={(e) => updateTask(t.id, { due_date: e.target.value })}
                                className="bg-stone-50 text-[9px] font-black uppercase tracking-widest pl-7 pr-2 py-1.5 rounded-lg outline-none"
                              />
                            </div>

                            {/* ASSIGNEE */}
                            <div className="relative flex items-center text-stone-400">
                              <UserIcon size={12} className="absolute left-2 pointer-events-none" />
                              <select
                                value={t.assignee || ""}
                                onChange={(e) => updateTask(t.id, { assignee: e.target.value })}
                                className="bg-stone-50 text-[9px] font-black uppercase tracking-widest pl-7 pr-2 py-1.5 rounded-lg outline-none appearance-none"
                              >
                                <option value="">Unassigned</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}