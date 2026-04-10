"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";

export default function PayrollPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  const [form, setForm] = useState({
    employee: "",
    salary: 0,
    bonus: 0,
    pay_date: "",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const team = await getUserTeam();
    if (!team) return;

    setTeamId(team);
    load(team);
  }

  async function load(team: string) {
    const { data } = await supabase
      .from("payroll")
      .select("*")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    setRows(data || []);
  }

  async function add() {
    if (!teamId) return;

    await supabase.from("payroll").insert({
      ...form,
      team_id: teamId,
    });

    setForm({
      employee: "",
      salary: 0,
      bonus: 0,
      pay_date: "",
    });

    load(teamId);
  }

  async function markPaid(id: string) {
    await supabase
      .from("payroll")
      .update({ status: "paid" })
      .eq("id", id);

    load(teamId!);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payroll</h1>

      {/* FORM */}
      <div className="grid grid-cols-4 gap-2">
        <input
          placeholder="Employee"
          value={form.employee}
          onChange={(e) =>
            setForm({ ...form, employee: e.target.value })
          }
          className="bg-gray-900 p-2 rounded"
        />
        <input
          type="number"
          placeholder="Salary"
          value={form.salary}
          onChange={(e) =>
            setForm({ ...form, salary: Number(e.target.value) })
          }
          className="bg-gray-900 p-2 rounded"
        />
        <input
          type="number"
          placeholder="Bonus"
          value={form.bonus}
          onChange={(e) =>
            setForm({ ...form, bonus: Number(e.target.value) })
          }
          className="bg-gray-900 p-2 rounded"
        />
        <input
          type="date"
          value={form.pay_date}
          onChange={(e) =>
            setForm({ ...form, pay_date: e.target.value })
          }
          className="bg-gray-900 p-2 rounded"
        />
      </div>

      <button
        onClick={add}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Add Payroll
      </button>

      {/* LIST */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="border border-gray-800 p-3 rounded flex justify-between"
          >
            <div>
              <p>{r.employee}</p>
              <p className="text-xs text-gray-400">
                £{r.salary + r.bonus}
              </p>
            </div>

            <button
              onClick={() => markPaid(r.id)}
              className="text-green-400 text-sm"
            >
              Mark Paid
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}