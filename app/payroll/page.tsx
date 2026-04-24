"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, CheckCircle2, 
  CreditCard, Calendar, TrendingUp,
  ArrowUpRight, DollarSign
} from "lucide-react";

export default function PayrollPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    employee: "",
    salary: "",
    bonus: "",
    pay_date: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async (team: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("payroll")
      .select("*")
      .eq("team_id", team)
      .order("pay_date", { ascending: false });

    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      if (!team) return;
      setTeamId(team);
      load(team);
    }
    init();
  }, [load]);

  async function add() {
    if (!teamId || !form.employee) return;

    const { error } = await supabase.from("payroll").insert({
      employee: form.employee,
      salary: Number(form.salary),
      bonus: Number(form.bonus),
      pay_date: form.pay_date,
      team_id: teamId,
      status: "pending"
    });

    if (!error) {
      setForm({ employee: "", salary: "", bonus: "", pay_date: new Date().toISOString().split("T")[0] });
      load(teamId);
    }
  }

  async function markPaid(id: string) {
    await supabase.from("payroll").update({ status: "paid" }).eq("id", id);
    load(teamId!);
  }

  const totalPayroll = rows.reduce((acc, r) => acc + (r.salary + r.bonus), 0);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* HEADER & ANALYTICS */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#a9b897]">
              <Users size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Personnel Liquidity</span>
            </div>
            <h1 className="text-7xl font-serif italic text-stone-900 tracking-tighter leading-none">
              Payroll
            </h1>
          </div>
          
          <div className="bg-white border border-stone-200 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-8 min-w-[280px]">
            <div>
              <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Cycle Volume</p>
              <p className="text-3xl font-mono font-bold tracking-tighter text-stone-900">
                £{totalPayroll.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-[1px] bg-stone-100" />
            <TrendingUp className="text-[#a9b897]" size={24} />
          </div>
        </header>

        {/* INPUT LEDGER */}
        <section className="bg-white border border-stone-200 rounded-[3rem] p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6 ml-2">New Entry</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                placeholder="Employee Name"
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                className="w-full bg-stone-50 p-5 rounded-2xl border-none outline-none focus:ring-2 ring-[#a9b897]/30 transition-all font-serif italic"
              />
            </div>
            <div className="relative group">
              <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                type="number"
                placeholder="Salary"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full bg-stone-50 p-5 pl-10 rounded-2xl border-none outline-none focus:ring-2 ring-[#a9b897]/30 transition-all font-mono"
              />
            </div>
            <div className="relative">
              <TrendingUp size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                type="number"
                placeholder="Bonus"
                value={form.bonus}
                onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                className="w-full bg-stone-50 p-5 pl-10 rounded-2xl border-none outline-none focus:ring-2 ring-[#a9b897]/30 transition-all font-mono"
              />
            </div>
            <button
              onClick={add}
              className="bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all flex items-center justify-center gap-2 group"
            >
              Commit <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* LISTING */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {rows.map((r) => (
              <motion.div
                layout
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${
                  r.status === 'paid' ? 'bg-stone-50/50 border-stone-100 opacity-60' : 'bg-white border-stone-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${r.status === 'paid' ? 'bg-stone-100 text-stone-400' : 'bg-[#a9b897]/10 text-[#a9b897]'}`}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className={`text-xl font-serif italic ${r.status === 'paid' ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
                      {r.employee}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[10px] font-mono font-bold text-stone-400 tracking-tighter">
                        £{(r.salary + r.bonus).toLocaleString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-stone-200" />
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-stone-400 tracking-widest">
                        <Calendar size={10} /> {r.pay_date}
                      </span>
                    </div>
                  </div>
                </div>

                {r.status !== "paid" ? (
                  <button
                    onClick={() => markPaid(r.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-200 text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-[#a9b897] px-6">
                    <CheckCircle2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && rows.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
              <p className="font-serif italic text-stone-300">No payroll entries recorded in this cycle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}