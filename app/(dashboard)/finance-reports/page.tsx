"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BarChart3, Download, FileSpreadsheet, Share2,
  Calculator, TrendingDown,
  PieChart, ShieldCheck, Zap, 
  Printer, Users, Clock, Cpu, Activity
} from "lucide-react";

/**
 * TOTS OS v7.1.0 - FINANCIAL REPORTING SUITE
 * MODULE: FISCAL GOVERNANCE & ASSET AUDITING
 */

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    burnRate: 12400, 
    receivables: 0,
    taxReserve: 0,
    netMargin: 0
  });

  const [notification, setNotification] = useState({ visible: false, msg: "" });
  const [activeTab, setActiveTab] = useState<string>("reports");

  useEffect(() => {
    setIsMounted(true);
    fetchFinancialData();
  }, []);

  async function fetchFinancialData() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      const totalHours = timesheets?.reduce((acc: number, row: any) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) ?? 480;

      const billable = totalHours * 125; 
      const tax = billable * 0.19; 
      const burn = 12400; 

      setMetrics({
        totalRevenue: billable,
        receivables: billable * 0.15, 
        burnRate: burn,
        taxReserve: tax,
        netMargin: billable - tax - burn
      });
    } catch (err) {
      console.error("Data ingestion error.");
    }
  }

  const triggerNotify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  const exportFiscalData = (filename: string) => {
    triggerNotify(`Synthesizing ${filename}...`);
    const csvContent = [
      ["Metric", "Value"],
      ["Total Revenue", metrics.totalRevenue],
      ["Burn Rate", metrics.burnRate],
      ["Receivables", metrics.receivables],
      ["Tax Reserve", metrics.taxReserve],
      ["Net Margin", metrics.netMargin]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    triggerNotify("Document Dispatched Successfully.");
  };

  const triggerAudit = () => {
    triggerNotify("Generating Certified Audit Report...");
    setTimeout(() => window.print(), 1000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans pb-12">
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            <Zap size={12} className="text-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4 text-left">
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">
              Financial Intelligence
            </h1>

            <nav className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-2xl border border-stone-100 shadow-sm">
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "reports" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Reports
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "audit" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Audit
              </button>

              <button
                onClick={() => setActiveTab("exports")}
                className={`px-4 sm:px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "exports" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
              >
                Exports
              </button>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={triggerAudit} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95">
              <Printer size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Audit Archive</span>
            </button>
          </div>
        </header>

        {activeTab === "reports" && (
          <>
            {/* CLARITY FINANCIAL INTELLIGENCE BRIEF */}
            <div className="bg-stone-900 text-white rounded-[2.5rem] p-6 mb-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                  Clarity Financial Intelligence
                </h3>
                <Cpu size={14} className="text-[#a9b897]" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono">
                <div>Revenue: £{metrics.totalRevenue.toFixed(0)}</div>
                <div>Tax: £{metrics.taxReserve.toFixed(0)}</div>
                <div>Burn: £{metrics.burnRate.toFixed(0)}</div>
                <div>Margin: £{metrics.netMargin.toFixed(0)}</div>
              </div>

              <div className="mt-3 text-[9px] uppercase tracking-widest text-stone-400">
                AI-generated financial interpretation layer (Clarity)
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                <div className="z-10 space-y-4 text-left">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-500">Net Surplus</p>
                  <h2 className="text-3xl font-mono tracking-tighter text-[#a9b897]">£{(metrics.netMargin / 1000).toFixed(1)}k</h2>
                </div>
                <Activity size={10} className="text-[#a9b897] absolute bottom-6 right-6" />
              </div>

              {[
                { label: 'Burn Rate', val: `£${metrics.burnRate.toLocaleString()}`, icon: <TrendingDown size={16}/> },
                { label: 'Tax Liability', val: `£${metrics.taxReserve.toLocaleString()}`, icon: <Calculator size={16}/> },
                { label: 'Escrow Receivables', val: `£${metrics.receivables.toLocaleString()}`, icon: <PieChart size={16}/> },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-stone-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between min-h-[220px] text-left">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">{item.label}</p>
                  <h2 className="text-2xl font-mono tracking-tighter text-stone-900">{item.val}</h2>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[2.5rem] p-10 shadow-sm text-left">
                 <h4 className="text-3xl font-serif italic tracking-tighter">Fiscal Performance Data</h4>
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 italic pt-2">Annual Revenue Attribution</p>
              </div>

              <div className="lg:col-span-4 bg-stone-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-xl">
                <div className="space-y-8">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-500">Document Exports</p>
                  {[
                    { label: 'P&L Statement', name: 'PL_Statement', icon: FileSpreadsheet },
                    { label: 'Tax Directive', name: 'Tax_Directive', icon: Calculator },
                    { label: 'Access Ledger', name: 'Access_Ledger', icon: Share2 },
                  ].map((btn, i) => (
                    <button key={i} onClick={() => exportFiscalData(btn.name)} 
                      className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left">
                      <div className="flex items-center gap-4">
                        <btn.icon size={16} />
                        <p className="text-[9px] font-black uppercase tracking-widest">{btn.label}</p>
                      </div>
                      <Download size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}