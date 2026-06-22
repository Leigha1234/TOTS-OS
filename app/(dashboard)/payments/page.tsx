"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Send, Trash2, Database,
  Filter, Cpu, AlertCircle, CheckCircle2, 
  Download, PieChart, History, Zap, ShieldCheck,
  BarChart3, Users, Clock
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * TOTS OS v7.0.1 - COMPACT FISCAL NODE
 * REVISION: ADDED NAV NODES | TIGHTER PADDING
 */

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div className={`${isDark ? 'bg-stone-900 shadow-xl' : 'bg-white border border-stone-100 shadow-sm'} p-4 sm:p-6 rounded-[2rem] flex flex-col justify-between min-h-[180px] sm:min-h-[220px] relative overflow-hidden group hover:shadow-lg transition-all duration-500`}>
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-stone-500' : 'text-stone-300'}`}>{label}</p>
      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-[#faf9f6] text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
    </div>
    
    <div className="z-10 mt-4 text-left">
      <h2 className={`font-mono tracking-tighter leading-tight ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} ${value.toString().length > 10 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-4 border-t border-stone-100/10 flex items-center justify-between">
      <span className="text-[8px] font-serif italic text-[#a9b897]">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={120} className="absolute -right-10 -top-10 opacity-[0.03] text-white" />}
  </div>
);

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"dispatch" | "reserves" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  const router = useRouter();

  const [formData, setFormData] = useState({ client: "", email: "", reference: `TX-${Math.floor(1000 + Math.random() * 9000)}` });
  const [lineItems, setLineItems] = useState([{ id: Date.now(), desc: "Neural Architecture Node", qty: 1, price: 12500 }]);
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18450, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
  ]);
  const enrichedLedger = useMemo(() => {
    return ledger.map((item) => {
      const risk =
        item.status === "overdue"
          ? "high"
          : item.status === "pending"
          ? "medium"
          : "low";

      return {
        ...item,
        clarityRisk: risk
      };
    });
  }, [ledger]);

  const [activeTab, setActiveTab] = useState<string>("payments");
  const [timesheets, setTimesheets] = useState<any[]>([]);

  const syncData = async () => {
    const { data: timesheetData } = await supabase
      .from("timesheets")
      .select("*");

    const hours =
      timesheetData?.reduce(
        (a: number, r: any) =>
          a +
          (Number(r.mon) +
            Number(r.tue) +
            Number(r.wed) +
            Number(r.thu) +
            Number(r.fri)),
        0
      ) ?? 0;

    const rev = hours * 125;

    setMetrics({
      revYtd: rev,
      operatingCosts: 18450,
      vatPool: rev * 0.2,
      taxDue: (rev - 12570) * 0.19
    });

    setTimesheets(timesheetData || []);
  };

  useEffect(() => {
    setIsMounted(true);
    syncData();
  }, []);

  const grandTotal = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * 1.2), 0), [lineItems]);

  // === CLARITY CFO PREDICTIVE ENGINE ===
  const clarityCFO = useMemo(() => {
    const revenue = metrics.revYtd;
    const costs = metrics.operatingCosts;

    // Run-rate assumptions based on current system snapshot
    const projectedRevenue = revenue * 1.15;
    const projectedCosts = costs * 1.08;

    const projectedProfit = projectedRevenue - projectedCosts;

    const cashRunwayScore = projectedProfit > 0 ? 80 : 40;

    const riskLevel =
      projectedProfit > 20000
        ? "low"
        : projectedProfit > 0
        ? "medium"
        : "high";

    return {
      projectedRevenue,
      projectedCosts,
      projectedProfit,
      cashRunwayScore,
      riskLevel,
    };
  }, [metrics]);

  // === CLARITY CROSS-TAB MEMORY LAYER ===
  const crossTabMemory = useMemo(() => {
    const totalHours =
      timesheets?.reduce(
        (a: number, r: any) =>
          a +
          (Number(r.mon || 0) +
            Number(r.tue || 0) +
            Number(r.wed || 0) +
            Number(r.thu || 0) +
            Number(r.fri || 0)),
        0
      ) || 0;

    const labourCost = totalHours * 25;
    const revenue = metrics.revYtd;
    const profit = revenue - metrics.operatingCosts;

    const efficiency = revenue / (totalHours || 1);
    const burnVsOutput = labourCost / (revenue || 1);

    return {
      totalHours,
      labourCost,
      revenue,
      profit,
      efficiency,
      burnVsOutput,
    };
  }, [timesheets, metrics]);

  // === END MEMORY LAYER ===

  const clarityInsights = useMemo(() => {
    const revenue = metrics.revYtd;
    const costs = metrics.operatingCosts;
    const profit = revenue - costs;

    const vatRisk = metrics.vatPool > revenue * 0.25 ? "high" : "normal";
    const cashHealth = profit > 20000 ? "strong" : profit > 0 ? "stable" : "weak";

    return {
      profit,
      vatRisk,
      cashHealth,
      burnRate: costs / 12,
      trend: revenue > costs ? "positive" : "negative"
    };
  }, [metrics]);

  // === CLARITY BRAIN ENGINE ===
  const clarityBrain = useMemo(() => {
    const riskSignals: string[] = [];

    if (crossTabMemory.burnVsOutput > 0.6)
      riskSignals.push("High labour cost vs revenue");

    if (crossTabMemory.efficiency < 50)
      riskSignals.push("Low revenue per hour output");

    if (metrics.vatPool > metrics.revYtd * 0.3)
      riskSignals.push("VAT exposure elevated");

    if (metrics.revYtd < metrics.operatingCosts)
      riskSignals.push("Negative operating margin");

    const healthScore =
      100 -
      riskSignals.length * 18 +
      (crossTabMemory.efficiency > 100 ? 15 : 0);

    return {
      riskSignals,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      status:
        healthScore > 70
          ? "strong"
          : healthScore > 40
          ? "stable"
          : "critical",
    };
  }, [crossTabMemory, metrics]);

  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 3000);
  };

  const handleDispatch = () => {
    if (!formData.client) { triggerNotify("Entity Node Missing", "error"); return; }
    const doc = { id: `INV-${Math.floor(Math.random() * 900) + 100}`, client: formData.client, amount: grandTotal, status: "pending", type: "Invoice", date: new Date().toISOString().split('T')[0] };
    setLedger([doc, ...ledger]);
    triggerNotify("Directive Dispatched");
    setActiveModal(null);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 size={12} className="text-[#a9b897]" /> : <AlertCircle size={12} className="text-red-500" />}
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Fingerprint size={18} /></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif italic tracking-tighter leading-none">
              Finance
            </h1>
            <p className="text-stone-500 text-sm max-w-xl mt-3">
              Centralised financial operations, invoices, payroll visibility, timesheet intelligence and business performance reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <nav className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-stone-100">
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === "payments" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Payments
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === "reports" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Financial Reports
              </button>

              <button
                onClick={() => setActiveTab("hr")}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === "hr" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                HR & Payroll
              </button>

              <button
                onClick={() => setActiveTab("timesheets")}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === "timesheets" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Timesheets
              </button>
            </nav>
            <button onClick={() => setActiveModal('dispatch')} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95">
              <Plus size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Directive</span>
            </button>
          </div>
        </header>
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
              <p className="text-2xl font-mono mt-2">
                £{(metrics.operatingCosts / 12).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-widest text-stone-400">Tax Exposure</p>
              <p className="text-2xl font-mono mt-2">
                £{metrics.taxDue.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-widest text-stone-400">Cash Health</p>
              <p className="text-2xl font-mono mt-2">
                {metrics.revYtd > metrics.operatingCosts ? "STABLE" : "RISK"}
              </p>
            </div>
          </div>
        </section>

        {activeTab === "payments" && (
          <>
            {/* METRIC GRID */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <MetricCard label="Gross Intake" value={metrics.revYtd} sub="Engagement: 114%" icon={<TrendingUp />} isDark />
              <MetricCard label="Operational" value={metrics.revYtd - metrics.operatingCosts} sub="Flow: Clear" icon={<Database />} />
              <MetricCard label="VAT Escrow" value={metrics.vatPool} sub="Lock Active" icon={<Landmark />} />
              <MetricCard label="Fiscal Prov" value={metrics.taxDue} sub="FY26 Est." icon={<Receipt />} />
            </section>

            {/* ACTION REQUIRED ENGINE */}
            <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm mt-6">
              <h3 className="text-3xl font-serif italic mb-6">Action Required</h3>

              <div className="space-y-3">
                {[
                  metrics.taxDue > 0 && "Prepare tax provision",
                  metrics.vatPool > metrics.revYtd * 0.2 && "VAT exposure high",
                  metrics.revYtd < metrics.operatingCosts && "Operating loss detected",
                  timesheets.length === 0 && "No workforce data available",
                  clarityBrain.riskSignals?.length > 0 && "Risk signals detected"
                ]
                  .filter(Boolean)
                  .map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl"
                    >
                      <span className="text-sm font-bold text-red-600">{item}</span>
                      <span className="text-[8px] uppercase tracking-widest text-red-400">Priority</span>
                    </div>
                  ))}
              </div>
            </section>

            {/* LEDGER ARCHIVE */}
            <section className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-lg">
              <div className="p-8 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-6">
                <div className="text-left w-full xl:w-auto">
                    <h3 className="text-4xl font-serif italic tracking-tighter">Transaction Logs</h3>
                    <p className="text-sm text-stone-500 mt-2">Monitor invoices, quotes, payments and outstanding revenue across the business.</p>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 xl:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9b897]" size={14} />
                      <input placeholder="References..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-6 py-3 bg-[#faf9f6] border border-stone-50 rounded-full text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:bg-white focus:border-stone-900 transition-all" />
                  </div>
                  <button className="p-3 bg-stone-900 text-[#a9b897] rounded-full"><Filter size={16}/></button>
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#faf9f6]">
                      {['Ref', 'Target Entity', 'Status', 'Aggregate'].map((h) => (
                        <th key={h} className="px-4 sm:px-8 py-3 sm:py-5 text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 text-left">
                    {enrichedLedger.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#faf9f6]/50 transition-all cursor-pointer group">
                        <td className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-[9px] text-[#a9b897] font-black">{inv.id}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                          <p className="font-bold text-lg tracking-tighter text-stone-900">{inv.client}</p>
                          <p className="text-[8px] font-mono text-stone-300 uppercase tracking-widest">{inv.date}</p>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            inv.status === 'paid'
                              ? 'bg-green-50 text-green-600 border-green-100'
                              : inv.status === 'overdue'
                              ? 'bg-red-50 text-red-500 border-red-100'
                              : 'bg-stone-50 text-stone-400 border-stone-100'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-right pr-6 sm:pr-12 font-mono font-bold text-xl tracking-tighter text-stone-900">£{inv.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "timesheets" && (
          <section className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-3xl font-serif italic">Timesheets</h3>
              <p className="text-sm text-stone-500 mt-2">Track workforce utilisation, submitted hours and payroll activity.</p>
            </div>

            <div className="space-y-3">
              {timesheets.map((t: any) => (
                <div key={t.id} className="flex justify-between p-4 border rounded-xl">
                  <span className="text-xs font-mono text-stone-700">{t.user_id || "unknown"}</span>
                  <span className="text-xs text-stone-500">
                    {Number(t.mon || 0) + Number(t.tue || 0) + Number(t.wed || 0) + Number(t.thu || 0) + Number(t.fri || 0)} hrs
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}