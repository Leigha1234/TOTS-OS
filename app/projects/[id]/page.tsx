"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserPlan } from "@/lib/getUserPlan";
import { getUserRole, canCreate } from "@/lib/permissions";

const columns = ["todo", "in_progress", "done"];

export default function ProjectPage() {
  const { id } = useParams();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [role, setRole] = useState<string | null>(null);

  const [newTask, setNewTask] = useState("");
  const [dragged, setDragged] = useState<any>(null);

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const team = await getUserTeam();
    const p = await getUserPlan();
    const r = await getUserRole();

    if (!team) return;

    setTeamId(team);
    setPlan(p);
    setRole(r);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("team_id", team);

    setUsers(profiles || []);

    load(team);

    // 🔥 REALTIME
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `team_id=eq.${team}`,
        },
        () => load(team)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function load(team: string) {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .eq("team_id", team);

    setTasks(data || []);
  }

  // ➕ CREATE TASK
  async function addTask() {
    if (plan === "free") {
      alert("Upgrade required 🚀");
      return (window.location.href = "/billing");
    }

    if (!canCreate(role)) {
      return alert("No permission");
    }

    if (!newTask || !teamId) return;

    await supabase.from("tasks").insert({
      title: newTask,
      project_id: id,
      team_id: teamId,
      status: "todo",
      priority: "medium",
    });

    // 🔔 notification
    await supabase.from("notifications").insert({
      team_id: teamId,
      message: `Task created in project`,
    });

    setNewTask("");
    load(teamId);
  }

  // ✏️ UPDATE
  async function updateTask(task: any) {
    await supabase.from("tasks").update(task).eq("id", task.id);
  }

  // 🔄 MOVE
  async function moveTask(id: string, status: string) {
    await supabase.from("tasks").update({ status }).eq("id", id);
  }

  function getUser(id: string) {
    return users.find((u) => u.id === id);
  }

  function priorityColor(p: string) {
    if (p === "high") return "text-red-400";
    if (p === "medium") return "text-yellow-400";
    return "text-green-400";
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Tasks</h1>

      {/* PLAN LOCK */}
      {plan === "free" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded text-sm">
          Free plan — upgrade to unlock tasks 🚀
        </div>
      )}

      {/* ADD */}
      <input
        placeholder="Add task..."
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addTask()}
        disabled={plan === "free"}
        className="w-full bg-gray-900 border border-gray-800 p-2 rounded"
      />

      {/* BOARD */}
      <div className="grid md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragged && moveTask(dragged.id, col)}
          >
            <h2 className="mb-2 capitalize">{col}</h2>

            <div className="space-y-2 min-h-[200px]">
              {tasks
                .filter((t) => t.status === col)
                .map((t) => {
                  const assignee = getUser(t.assignee);

                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragged(t)}
                      className="p-3 border border-gray-800 rounded bg-gray-900"
                    >
                      {/* TITLE */}
                      <input
                        value={t.title}
                        onChange={(e) =>
                          updateTask({ ...t, title: e.target.value })
                        }
                        className="bg-transparent w-full outline-none"
                      />

                      {/* PRIORITY */}
                      <select
                        value={t.priority || "medium"}
                        onChange={(e) =>
                          updateTask({
                            ...t,
                            priority: e.target.value,
                          })
                        }
                        className={`text-xs mt-2 ${priorityColor(
                          t.priority
                        )}`}
                      >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>

                      {/* DUE DATE */}
                      <input
                        type="date"
                        value={t.due_date || ""}
                        onChange={(e) =>
                          updateTask({
                            ...t,
                            due_date: e.target.value,
                          })
                        }
                        className="text-xs mt-2 block"
                      />

                      {/* ASSIGNEE */}
                      <select
                        value={t.assignee || ""}
                        onChange={(e) =>
                          updateTask({
                            ...t,
                            assignee: e.target.value,
                          })
                        }
                        className="text-xs mt-2"
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email}
                          </option>
                        ))}
                      </select>

                      {/* DISPLAY */}
                      {assignee && (
                        <p className="text-xs text-gray-400 mt-1">
                          👤 {assignee.name || assignee.email}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}