"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import {
  Landmark,
  TrendingUp,
  Search,
  Plus,
  Activity,
  Fingerprint,
  Trash2,
  Database,
  Filter,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Loader2,
  X,
  UserPlus,
  Send,
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * TOTS OS v8.0 - FINANCE (LIVE)
 * Wired to: quotes, invoices, customers, expenses, timesheets,
 *           payroll_employees, payslips, profiles, team_members
 */

// ---------- Types ----------

type DocType = "Invoice" | "Quote";

type LineItem = { id: number; desc: string; qty: number; price: number };

type Customer = { id: string; name: string; email: string | null };

type LedgerEntry = {
  id: string;
  type: DocType;
  client: string;
  amount: number;
  status: string;
  date: string;
};

type PayrollEmployee = {
  id: string;
  name: string;
  role: string | null;
  salary_gross: number | null;
};

type Payslip = {
  id: string;
  employee_id: string;
  gross: number | null;
  net: number | null;
  tax: number | null;
  ni: number | null;
  period_start: string | null;
  period_end: string | null;
};

// ---------- Small UI helpers ----------

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div
    className={`${
      isDark ? "bg-stone-900 shadow-xl" : "bg-white border border-stone-100 shadow-sm"
    } p-4 sm:p-6 rounded-[2rem] flex flex-col justify-between min-h-[180px] sm:min-h-[220px] relative overflow-hidden group hover:shadow-lg transition-all duration-500`}
  >
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? "text-stone-500" : "text-stone-300"}`}>
        {label}
      </p>
      <div
        className={`p-3 rounded-xl ${
          isDark ? "bg-white/5 text-[#a9b897]" : "bg-[#faf9f6] text-stone-200 group-hover:text-stone-900"
        } transition-all`}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
    </div>

    <div className="z-10 mt-4 text-left">
      <h2
        className={`font-mono tracking-tighter leading-tight ${isDark ? "text-[#a9b897]" : "text-stone-900"} ${
          value.toString().length > 10 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
        }`}
      >
        £{Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-4 border-t border-stone-100/10 flex items-center justify-between">
      <span className="text-[8px] font-serif italic text-[#a9b897]">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={120} className="absolute -right-10 -top-10 opacity-[0.03] text-white" />}
  </div>
);

const statusStyle = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "accepted") return "bg-green-50 text-green-600 border-green-100";
  if (s === "overdue") return "bg-red-50 text-red-500 border-red-100";
  return "bg-stone-50 text-stone-400 border-stone-100";
};

// ---------- Main component ----------

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("payments");
  const [activeModal, setActiveModal] = useState<"dispatch" | "employee" | null>(null);
  const [docType, setDocType] = useState<DocType>("Invoice");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ visible: boolean; msg: string; type: "success" | "error" }>({
    visible: false,
    msg: "",
    type: "success",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [vatCollected, setVatCollected] = useState(0);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const [formData, setFormData] = useState({ customerId: "", newClientName: "", dueDate: "" });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: Date.now(), desc: "", qty: 1, price: 0 }]);

  const [newEmployee, setNewEmployee] = useState({ name: "", role: "", salary_gross: "" });

  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 3000);
  };

  // ---------- Resolve organisation / team for the logged-in user ----------

  const resolveContext = useCallback(async () => {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      setContextError("Not signed in.");
      return null;
    }
    const uid = authData.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", uid)
      .maybeSingle();

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, organisation_id")
      .eq("user_id", uid)
      .maybeSingle();

    const org = profile?.organisation_id ?? membership?.organisation_id ?? null;
    const team = membership?.team_id ?? null;

    if (!org) {
      setContextError("This account isn't linked to an organisation yet (no row in profiles/team_members).");
      return null;
    }

    setOrgId(org);
    setTeamId(team);
    return { org, team };
  }, []);

  // ---------- Fetch everything for the resolved org ----------

  const fetchAll = useCallback(async (org: string, team: string | null) => {
    setLoading(true);
    const [quotesRes, invoicesRes, customersRes, expensesRes, timesheetsRes, employeesRes, payslipsRes] =
      await Promise.all([
        supabase.from("quotes").select("*").eq("organisation_id", org).order("date", { ascending: false }),
        supabase.from("invoices").select("*").eq("organisation_id", org).order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name, email").eq("organisation_id", org).order("name"),
        supabase.from("expenses").select("amount").eq("organisation_id", org),
        supabase.from("timesheets").select("*").eq("organisation_id", org),
        supabase.from("payroll_employees").select("*").eq("organisation_id", org),
        supabase
          .from("payslips")
          .select("*")
          .eq("organisation_id", org)
          .order("period_end", { ascending: false })
          .limit(20),
      ]);

    const customerList: Customer[] = customersRes.data ?? [];
    setCustomers(customerList);
    const customerMap = new Map(customerList.map((c) => [c.id, c.name]));

    const quoteEntries: LedgerEntry[] = (quotesRes.data ?? []).map((q: any) => ({
      id: q.id,
      type: "Quote",
      client: q.client_name || "Unnamed",
      amount: Number(q.amount) || 0,
      status: q.status || "draft",
      date: q.date || (q.created_at ? q.created_at.slice(0, 10) : ""),
    }));

    const invoiceEntries: LedgerEntry[] = (invoicesRes.data ?? []).map((inv: any) => ({
      id: inv.id,
      type: "Invoice",
      client: customerMap.get(inv.customer_id) || "Unknown Client",
      amount: Number(inv.amount) || 0,
      status: inv.status || "pending",
      date: inv.due_date || (inv.created_at ? inv.created_at.slice(0, 10) : ""),
    }));

    setLedger([...invoiceEntries, ...quoteEntries].sort((a, b) => (a.date < b.date ? 1 : -1)));

    setExpensesTotal((expensesRes.data ?? []).reduce((a: number, e: any) => a + (Number(e.amount) || 0), 0));

    setVatCollected(
      (invoicesRes.data ?? [])
        .filter((i: any) => i.status === "paid")
        .reduce((a: number, i: any) => a + (Number(i.tax) || 0), 0)
    );

    setTimesheets(timesheetsRes.data ?? []);
    setPayrollEmployees(employeesRes.data ?? []);
    setPayslips(payslipsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    (async () => {
      const ctx = await resolveContext();
      if (ctx) await fetchAll(ctx.org, ctx.team);
      else setLoading(false);
    })();
  }, [resolveContext, fetchAll]);

  const refresh = () => {
    if (orgId) fetchAll(orgId, teamId);
  };

  // ---------- Derived metrics (real data) ----------

  const paidInvoiceRevenue = useMemo(
    () => ledger.filter((l) => l.type === "Invoice" && l.status === "paid").reduce((a, l) => a + l.amount, 0),
    [ledger]
  );

  const metrics = useMemo(() => {
    const rev = paidInvoiceRevenue;
    const costs = expensesTotal;
    const vatPool = vatCollected || rev * 0.2;
    const taxDue = Math.max(0, (rev - 12570) * 0.19);
    return { revYtd: rev, operatingCosts: costs, vatPool, taxDue };
  }, [paidInvoiceRevenue, expensesTotal, vatCollected]);

  const enrichedLedger = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return ledger
      .filter((item) => !q || item.client.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
      .map((item) => ({
        ...item,
        clarityRisk: item.status === "overdue" ? "high" : item.status === "pending" || item.status === "draft" ? "medium" : "low",
      }));
  }, [ledger, searchQuery]);

  const netTotal = useMemo(() => lineItems.reduce((a, i) => a + i.qty * i.price, 0), [lineItems]);
  const grandTotal = useMemo(() => netTotal * 1.2, [netTotal]);
  const vatTotal = grandTotal - netTotal;

  const clarityCFO = useMemo(() => {
    const revenue = metrics.revYtd;
    const costs = metrics.operatingCosts;
    const projectedRevenue = revenue * 1.15;
    const projectedCosts = costs * 1.08;
    const projectedProfit = projectedRevenue - projectedCosts;
    return {
      projectedRevenue,
      projectedCosts,
      projectedProfit,
      riskLevel: projectedProfit > 20000 ? "low" : projectedProfit > 0 ? "medium" : "high",
    };
  }, [metrics]);

  const crossTabMemory = useMemo(() => {
    const totalHours = timesheets.reduce(
      (a: number, r: any) =>
        a +
        (Number(r.mon || 0) +
          Number(r.tue || 0) +
          Number(r.wed || 0) +
          Number(r.thu || 0) +
          Number(r.fri || 0) +
          Number(r.sat || 0) +
          Number(r.sun || 0)),
      0
    );
    const labourCost = timesheets.reduce((a: number, r: any) => {
      const hrs =
        Number(r.mon || 0) +
        Number(r.tue || 0) +
        Number(r.wed || 0) +
        Number(r.thu || 0) +
        Number(r.fri || 0) +
        Number(r.sat || 0) +
        Number(r.sun || 0);
      return a + hrs * (Number(r.hourly_rate) || 25);
    }, 0);
    const revenue = metrics.revYtd;
    const efficiency = revenue / (totalHours || 1);
    const burnVsOutput = labourCost / (revenue || 1);
    return { totalHours, labourCost, efficiency, burnVsOutput };
  }, [timesheets, metrics]);

  const clarityBrain = useMemo(() => {
    const riskSignals: string[] = [];
    if (crossTabMemory.burnVsOutput > 0.6) riskSignals.push("High labour cost vs revenue");
    if (crossTabMemory.efficiency < 50 && crossTabMemory.totalHours > 0) riskSignals.push("Low revenue per hour output");
    if (metrics.vatPool > metrics.revYtd * 0.3) riskSignals.push("VAT exposure elevated");
    if (metrics.revYtd < metrics.operatingCosts) riskSignals.push("Negative operating margin");
    if (timesheets.length === 0) riskSignals.push("No workforce data available");

    const healthScore = Math.max(
      0,
      Math.min(100, 100 - riskSignals.length * 18 + (crossTabMemory.efficiency > 100 ? 15 : 0))
    );
    return {
      riskSignals,
      healthScore,
      status: healthScore > 70 ? "strong" : healthScore > 40 ? "stable" : "critical",
    };
  }, [crossTabMemory, metrics, timesheets]);

  const totalPayrollMonthly = useMemo(
    () => payrollEmployees.reduce((a, e) => a + (Number(e.salary_gross) || 0) / 12, 0),
    [payrollEmployees]
  );

  // ---------- Line item handlers ----------

  const updateLineItem = (id: number, field: keyof LineItem, value: any) => {
    setLineItems((items) => items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const addLineItem = () => setLineItems((items) => [...items, { id: Date.now(), desc: "", qty: 1, price: 0 }]);
  const removeLineItem = (id: number) =>
    setLineItems((items) => (items.length > 1 ? items.filter((it) => it.id !== id) : items));

  const resetForm = () => {
    setFormData({ customerId: "", newClientName: "", dueDate: "" });
    setLineItems([{ id: Date.now(), desc: "", qty: 1, price: 0 }]);
  };

  // ---------- Dispatch (create invoice / quote) ----------

  const handleDispatch = async () => {
    if (!orgId) {
      triggerNotify("No organisation context", "error");
      return;
    }
    if (docType === "Invoice" && !formData.customerId) {
      triggerNotify("Select a customer", "error");
      return;
    }
    if (docType === "Quote" && !formData.customerId && !formData.newClientName.trim()) {
      triggerNotify("Client name required", "error");
      return;
    }
    if (lineItems.some((li) => !li.desc.trim() || li.price <= 0)) {
      triggerNotify("Complete all line items", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (docType === "Invoice") {
        const { error } = await supabase.from("invoices").insert({
          customer_id: formData.customerId,
          amount: grandTotal,
          tax: vatTotal,
          items: lineItems.map(({ desc, qty, price }) => ({ description: desc, quantity: qty, unit_price: price })),
          status: "pending",
          type: "invoice",
          doc_type: "invoice",
          due_date: formData.dueDate || null,
          organisation_id: orgId,
          team_id: teamId,
        });
        if (error) throw error;
      } else {
        const clientName = formData.customerId
          ? customers.find((c) => c.id === formData.customerId)?.name || formData.newClientName
          : formData.newClientName;
        const { error } = await supabase.from("quotes").insert({
          client_name: clientName,
          description: lineItems.map((li) => li.desc).join(", "),
          amount: grandTotal,
          status: "draft",
          organisation_id: orgId,
          team_id: teamId,
        });
        if (error) throw error;
      }
      triggerNotify(`${docType} Dispatched`);
      setActiveModal(null);
      resetForm();
      refresh();
    } catch (e: any) {
      triggerNotify(e.message || "Dispatch failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (entry: LedgerEntry) => {
    const table = entry.type === "Invoice" ? "invoices" : "quotes";
    const nextStatus = entry.type === "Invoice" ? "paid" : "accepted";
    const { error } = await supabase.from(table).update({ status: nextStatus }).eq("id", entry.id);
    if (error) {
      triggerNotify(error.message, "error");
      return;
    }
    triggerNotify("Status updated");
    refresh();
  };

  const deleteEntry = async (entry: LedgerEntry) => {
    const table = entry.type === "Invoice" ? "invoices" : "quotes";
    const { error } = await supabase.from(table).delete().eq("id", entry.id);
    if (error) {
      triggerNotify(error.message, "error");
      return;
    }
    triggerNotify("Removed");
    refresh();
  };

  // ---------- Payroll ----------

  const addEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.salary_gross) {
      triggerNotify("Name and salary required", "error");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("payroll_employees").insert({
      name: newEmployee.name,
      role: newEmployee.role || null,
      salary_gross: Number(newEmployee.salary_gross),
      organisation_id: orgId,
      team_id: teamId,
    });
    setSubmitting(false);
    if (error) {
      triggerNotify(error.message, "error");
      return;
    }
    triggerNotify("Employee added");
    setActiveModal(null);
    setNewEmployee({ name: "", role: "", salary_gross: "" });
    refresh();
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      {/* NOTIFICATIONS */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={12} className="text-[#a9b897]" />
            ) : (
              <AlertCircle size={12} className="text-red-500" />
            )}
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-10 space-y-8">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg">
                <Fingerprint size={18} />
              </div>
              <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif italic tracking-tighter leading-none">Finance</h1>
            <p className="text-stone-500 text-sm max-w-xl mt-3">
              Centralised financial operations, invoices, payroll visibility, timesheet intelligence and business
              performance reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <nav className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-stone-100">
              {[
                { key: "payments", label: "Payments" },
                { key: "reports", label: "Financial Reports" },
                { key: "hr", label: "HR & Payroll" },
                { key: "timesheets", label: "Timesheets" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all ${
                    activeTab === t.key ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => {
                setDocType("Invoice");
                resetForm();
                setActiveModal("dispatch");
              }}
              disabled={!orgId}
              className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Plus size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Directive</span>
            </button>
          </div>
        </header>

        {/* CONTEXT / LOADING STATES */}
        {contextError && (
          <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <p className="text-sm text-red-600">{contextError}</p>
          </div>
        )}

        {loading && !contextError && (
          <div className="flex items-center justify-center py-24 gap-3 text-stone-400">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Syncing Ledger</span>
          </div>
        )}

        {!loading && !contextError && (
          <>
            {/* FINANCIAL CONTROL CENTRE */}
            <section className="bg-stone-900 text-white rounded-[2.5rem] p-8 shadow-xl mb-6">
              <h2 className="text-2xl font-serif italic mb-6">Financial Control Centre</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400">Net Position</p>
                  <p className="text-2xl font-mono mt-2">
                    £{(metrics.revYtd - metrics.operatingCosts).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400">Monthly Burn</p>
                  <p className="text-2xl font-mono mt-2">£{(metrics.operatingCosts / 12).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400">Tax Exposure</p>
                  <p className="text-2xl font-mono mt-2">£{metrics.taxDue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400">Cash Health</p>
                  <p className="text-2xl font-mono mt-2">{metrics.revYtd > metrics.operatingCosts ? "STABLE" : "RISK"}</p>
                </div>
              </div>
            </section>

            {activeTab === "payments" && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <MetricCard label="Gross Intake (Paid)" value={metrics.revYtd} sub="Invoices settled" icon={<TrendingUp />} isDark />
                  <MetricCard
                    label="Operational"
                    value={metrics.revYtd - metrics.operatingCosts}
                    sub="Flow: Clear"
                    icon={<Database />}
                  />
                  <MetricCard label="VAT Escrow" value={metrics.vatPool} sub="Lock Active" icon={<Landmark />} />
                  <MetricCard label="Fiscal Prov" value={metrics.taxDue} sub="FY Est." icon={<Receipt />} />
                </section>

                <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm mt-6">
                  <h3 className="text-3xl font-serif italic mb-6">Action Required</h3>
                  <div className="space-y-3">
                    {[
                      metrics.taxDue > 0 && "Prepare tax provision",
                      metrics.vatPool > metrics.revYtd * 0.2 && "VAT exposure high",
                      metrics.revYtd < metrics.operatingCosts && "Operating loss detected",
                      timesheets.length === 0 && "No workforce data available",
                      clarityBrain.riskSignals?.length > 0 && "Risk signals detected",
                    ]
                      .filter(Boolean)
                      .map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                          <span className="text-sm font-bold text-red-600">{item}</span>
                          <span className="text-[8px] uppercase tracking-widest text-red-400">Priority</span>
                        </div>
                      ))}
                    {[
                      metrics.taxDue > 0,
                      metrics.vatPool > metrics.revYtd * 0.2,
                      metrics.revYtd < metrics.operatingCosts,
                      timesheets.length === 0,
                      clarityBrain.riskSignals?.length > 0,
                    ].every((v) => !v) && <p className="text-sm text-stone-400">No action items — everything's clear.</p>}
                  </div>
                </section>

                <section className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-lg">
                  <div className="p-8 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-6">
                    <div className="text-left w-full xl:w-auto">
                      <h3 className="text-4xl font-serif italic tracking-tighter">Transaction Logs</h3>
                      <p className="text-sm text-stone-500 mt-2">
                        Monitor invoices, quotes, payments and outstanding revenue across the business.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                      <div className="relative flex-1 xl:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9b897]" size={14} />
                        <input
                          placeholder="References..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-6 py-3 bg-[#faf9f6] border border-stone-50 rounded-full text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:bg-white focus:border-stone-900 transition-all"
                        />
                      </div>
                      <button className="p-3 bg-stone-900 text-[#a9b897] rounded-full">
                        <Filter size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#faf9f6]">
                          {["Ref", "Target Entity", "Status", "Aggregate", "Actions"].map((h) => (
                            <th key={h} className="px-4 sm:px-8 py-3 sm:py-5 text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 text-left">
                        {enrichedLedger.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-10 text-center text-sm text-stone-400">
                              No transactions yet — dispatch an invoice or quote to get started.
                            </td>
                          </tr>
                        )}
                        {enrichedLedger.map((inv) => (
                          <tr key={`${inv.type}-${inv.id}`} className="hover:bg-[#faf9f6]/50 transition-all group">
                            <td className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-[9px] text-[#a9b897] font-black">
                              {inv.type === "Invoice" ? "INV" : "QT"}-{inv.id.slice(0, 6).toUpperCase()}
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                              <p className="font-bold text-lg tracking-tighter text-stone-900">{inv.client}</p>
                              <p className="text-[8px] font-mono text-stone-300 uppercase tracking-widest">
                                {inv.type} · {inv.date}
                              </p>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusStyle(
                                  inv.status
                                )}`}
                              >
                                <div className={`w-1 h-1 rounded-full ${inv.status === "paid" || inv.status === "accepted" ? "bg-green-600" : "bg-stone-300"}`} />
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right font-mono font-bold text-xl tracking-tighter text-stone-900">
                              £{inv.amount.toLocaleString()}
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {inv.status !== "paid" && inv.status !== "accepted" && (
                                  <button
                                    onClick={() => markPaid(inv)}
                                    title={inv.type === "Invoice" ? "Mark paid" : "Mark accepted"}
                                    className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteEntry(inv)}
                                  title="Delete"
                                  className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {activeTab === "reports" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Projected Revenue (+15%)</p>
                    <p className="text-2xl font-mono mt-3">£{clarityCFO.projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Projected Costs (+8%)</p>
                    <p className="text-2xl font-mono mt-3">£{clarityCFO.projectedCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-stone-900 text-white rounded-[2rem] p-6 shadow-xl">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">Projected Profit</p>
                    <p className="text-2xl font-mono mt-3 text-[#a9b897]">
                      £{clarityCFO.projectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[8px] uppercase tracking-widest mt-2 text-stone-400">Risk: {clarityCFO.riskLevel}</p>
                  </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-2xl font-serif italic mb-6">Clarity Health Signal</h3>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                        <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke="#f1f0ed" strokeWidth="3" />
                        <path
                          d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                          fill="none"
                          stroke="#a9b897"
                          strokeWidth="3"
                          strokeDasharray={`${clarityBrain.healthScore}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg">
                        {clarityBrain.healthScore}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">Status</p>
                      <p className="text-2xl font-serif italic capitalize">{clarityBrain.status}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {clarityBrain.riskSignals.length === 0 && <p className="text-sm text-stone-400">No risk signals detected.</p>}
                    {clarityBrain.riskSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#faf9f6] rounded-xl">
                        <AlertCircle size={14} className="text-red-400" />
                        <span className="text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-2xl font-serif italic mb-6">Revenue vs Costs</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        <span>Revenue</span>
                        <span>£{metrics.revYtd.toLocaleString()}</span>
                      </div>
                      <div className="h-3 bg-stone-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#a9b897]"
                          style={{ width: `${Math.min(100, (metrics.revYtd / Math.max(metrics.revYtd, metrics.operatingCosts, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        <span>Operating Costs</span>
                        <span>£{metrics.operatingCosts.toLocaleString()}</span>
                      </div>
                      <div className="h-3 bg-stone-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-900"
                          style={{ width: `${Math.min(100, (metrics.operatingCosts / Math.max(metrics.revYtd, metrics.operatingCosts, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "hr" && (
              <section className="space-y-6">
                <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-serif italic">HR & Payroll</h3>
                      <p className="text-sm text-stone-500 mt-2">
                        Monthly payroll commitment: <span className="font-mono font-bold">£{totalPayrollMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModal("employee")}
                      className="bg-stone-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all"
                    >
                      <UserPlus size={14} /> Add Employee
                    </button>
                  </div>

                  <div className="space-y-2">
                    {payrollEmployees.length === 0 && <p className="text-sm text-stone-400">No employees on file yet.</p>}
                    {payrollEmployees.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-4 bg-[#faf9f6] rounded-xl">
                        <div>
                          <p className="font-bold text-stone-900">{e.name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-stone-400">{e.role || "No role set"}</p>
                        </div>
                        <p className="font-mono font-bold">£{Number(e.salary_gross || 0).toLocaleString()} / yr</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-2xl font-serif italic mb-6">Recent Payslips</h3>
                  <div className="space-y-2">
                    {payslips.length === 0 && <p className="text-sm text-stone-400">No payslips issued yet.</p>}
                    {payslips.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 border border-stone-50 rounded-xl">
                        <span className="text-[9px] font-mono text-stone-400">
                          {p.period_start} → {p.period_end}
                        </span>
                        <span className="font-mono font-bold">£{Number(p.net || 0).toLocaleString()} net</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "timesheets" && (
              <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-3xl font-serif italic">Timesheets</h3>
                  <p className="text-sm text-stone-500 mt-2">Track workforce utilisation, submitted hours and payroll activity.</p>
                </div>
                <div className="space-y-3">
                  {timesheets.length === 0 && <p className="text-sm text-stone-400">No timesheet entries yet.</p>}
                  {timesheets.map((t: any) => {
                    const hrs =
                      Number(t.mon || 0) + Number(t.tue || 0) + Number(t.wed || 0) + Number(t.thu || 0) + Number(t.fri || 0) + Number(t.sat || 0) + Number(t.sun || 0);
                    return (
                      <div key={t.id} className="flex justify-between p-4 border rounded-xl">
                        <span className="text-xs font-mono text-stone-700">{t.user_id || "unknown"}</span>
                        <span className="text-xs text-stone-500">
                          {hrs} hrs {t.hourly_rate ? `· £${(hrs * Number(t.hourly_rate)).toLocaleString()}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* DISPATCH MODAL */}
      <AnimatePresence>
        {activeModal === "dispatch" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-serif italic">New Directive</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-stone-50 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 bg-[#faf9f6] p-1 rounded-full w-fit">
                {(["Invoice", "Quote"] as DocType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                      docType === t ? "bg-stone-900 text-white" : "text-stone-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">Client</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData((f) => ({ ...f, customerId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
                >
                  <option value="">Select existing customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {docType === "Quote" && !formData.customerId && (
                  <input
                    placeholder="Or type a new client name"
                    value={formData.newClientName}
                    onChange={(e) => setFormData((f) => ({ ...f, newClientName: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
                  />
                )}
                {docType === "Invoice" && (
                  <p className="text-[10px] text-stone-400">
                    Invoices require an existing customer record (they're linked by ID). Add the customer first if they're not listed.
                  </p>
                )}

                {docType === "Invoice" && (
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">Line Items</label>
                  <button onClick={addLineItem} className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
                {lineItems.map((li) => (
                  <div key={li.id} className="flex gap-2 items-center">
                    <input
                      placeholder="Description"
                      value={li.desc}
                      onChange={(e) => updateLineItem(li.id, "desc", e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#faf9f6] border border-stone-100 rounded-lg text-xs outline-none focus:border-stone-900"
                    />
                    <input
                      type="number"
                      min={1}
                      value={li.qty}
                      onChange={(e) => updateLineItem(li.id, "qty", Number(e.target.value))}
                      className="w-16 px-2 py-2 bg-[#faf9f6] border border-stone-100 rounded-lg text-xs outline-none focus:border-stone-900"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Price"
                      value={li.price}
                      onChange={(e) => updateLineItem(li.id, "price", Number(e.target.value))}
                      className="w-24 px-2 py-2 bg-[#faf9f6] border border-stone-100 rounded-lg text-xs outline-none focus:border-stone-900"
                    />
                    <button onClick={() => removeLineItem(li.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-1 text-right">
                <p className="text-[9px] uppercase tracking-widest text-stone-400">
                  Net: £{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-stone-400">
                  VAT (20%): £{vatTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xl font-mono font-bold">£{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>

              <button
                onClick={handleDispatch}
                disabled={submitting}
                className="w-full bg-stone-900 text-white py-4 rounded-full flex items-center justify-center gap-3 hover:bg-[#a9b897] hover:text-stone-900 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest">Dispatch {docType}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {activeModal === "employee" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-md p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-serif italic">Add Employee</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-stone-50 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <input
                placeholder="Full name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
              />
              <input
                placeholder="Role"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
              />
              <input
                type="number"
                placeholder="Gross annual salary"
                value={newEmployee.salary_gross}
                onChange={(e) => setNewEmployee((f) => ({ ...f, salary_gross: e.target.value }))}
                className="w-full px-4 py-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-900"
              />
              <button
                onClick={addEmployee}
                disabled={submitting}
                className="w-full bg-stone-900 text-white py-4 rounded-full flex items-center justify-center gap-3 hover:bg-[#a9b897] hover:text-stone-900 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest">Add Employee</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}