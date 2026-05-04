"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole, canCreate } from "@/lib/permissions";
import { 
  Sparkles, FolderPlus, ArrowRight, 
  Briefcase, ShieldCheck, Activity,
  Plus, X, Loader2, Zap, Globe,
  TrendingUp, ShieldAlert, ShieldCheck as CheckIcon, FileDigit,
  UserPlus, Clock, BarChart3, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("architecture"); // 'architecture', 'financials', 'hr', 'timesheets', 'appraisals'

  // Standard Projects / Customers states
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Intelligence States
  const [isScanActive, setIsScanActive] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    customer_id: "",
  });

  // Financial Dashboard Metrics 
  const [metrics] = useState({
    revYtd: 142500,
    liabilities: 28500,
    vatPool: 4210,
    calculatedTaxDue: 21660,
  });

  // Financial Independent Documents
  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "approved", date: "2026-05-01" }
  ]);
  const [quotes, setQuotes] = useState<any[]>([
    { id: "QT-004", client: "Black Mesa Corp", amount: 4500, status: "pending", date: "2026-05-15" }
  ]);
  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "pending", date: "2026-05-02" }
  ]);

  // Financial Document Entry Fields
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  // Accounting Ledger States
  const [items] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState("");
  const [vatRate, setVatRate] = useState("20");
  
  const [balanceSheet] = useState({ assets: 156000, liabilities: 28500, equity: 127500 });
  const [cashFlow] = useState({ inflows: 35000, outflows: 18000, net: 17000 });
  const [accountsReceivable] = useState([{ id: "AR-1", customer: "Cyberdyne Systems", balance: 5400 }]);
  const [incomeStatement] = useState({ grossRevenue: 142500, cogs: 24000, netIncome: 73500 });

  // Payroll / HR states
  const [empName, setEmpName] = useState("Jane Doe");
  const [empNumber, setEmpNumber] = useState("EMP-0401");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [contractType, setContractType] = useState("Full-Time");
  const [workingHours, setWorkingHours] = useState("40");
  const [holidayEntitlement, setHolidayEntitlement] = useState("28");
  const [dateOfPayDue, setDateOfPayDue] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinNumber, setNextOfKinNumber] = useState("");
  
  // Appraisal and Time states
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const [timesheetList, setTimesheetList] = useState<any[]>([
    { id: "1", task: "Client Review", duration: "2.5 hrs", date: "2026-05-04" }
  ]);
  const [taskName, setTaskName] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  
  const [appraisalAnswers, setAppraisalAnswers] = useState({
    q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", 
    q10: "", q11: "", q12: "", q13: "", q14: "", q15: ""
  });

  const loadData = useCallback(async (team: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(name)")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    }
    setProjects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      const r = await getUserRole();

      if (!team) {
        const mockTeam = "team-123";
        setTeamId(mockTeam);
        setRole(r || "admin");
        setCustomers([
          { id: "c1", name: "Apex Solutions", team_id: mockTeam }
        ]);
        setProjects([
          { id: "p1", name: "Project Zero", team_id: mockTeam, customers: { name: "Apex Solutions" } }
        ]);
        setLoading(false);
        return;
      }

      setTeamId(team);
      setRole(r);

      const { data: c } = await supabase
        .from("customers")
        .select("*")
        .eq("team_id", team);

      setCustomers(c || []);
      loadData(team);
    }
    init();
  }, [loadData]);

  const runClarityScan = () => {
    setIsScanActive(true);
    setTimeout(() => {
      const clientCount = customers.length;
      const projectCount = projects.length;
      setInsight(
        `Architectural Analysis: ${projectCount} active nodes identified across ${clientCount} entities. System detects a high concentration in your newest sector. Consider re-allocating assets to stabilize the pipeline.`
      );
      setIsScanActive(false);
    }, 2200);
  };

  async function createProject() {
    if (!canCreate(role)) {
      alert("Permission Denied: Administrative clearance required.");
      return;
    }
    if (!form.name || !form.customer_id || !teamId) return;

    const { error } = await supabase.from("projects").insert({
      name: form.name,
      customer_id: form.customer_id,
      team_id: teamId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("activity").insert({
      team_id: teamId,
      action: `Architecture Deployed: ${form.name}`,
      entity: "project",
    });

    setForm({ name: "", customer_id: "" });
    if (teamId) {
      loadData(teamId);
    }
  }

  const addInvoice = () => {
    if (!invoiceClient || !invoiceAmount) return;
    setInvoices([
      ...invoices,
      { id: `INV-${Math.floor(Math.random() * 900) + 100}`, client: invoiceClient, amount: parseFloat(invoiceAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setInvoiceClient("");
    setInvoiceAmount("");
  };

  const addQuote = () => {
    if (!quoteClient || !quoteAmount) return;
    setQuotes([
      ...quotes,
      { id: `QT-${Math.floor(Math.random() * 900) + 100}`, client: quoteClient, amount: parseFloat(quoteAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setQuoteClient("");
    setQuoteAmount("");
  };

  const addExpense = () => {
    if (!expenseVendor || !expenseAmount) return;
    setExpenses([
      ...expenses,
      { id: `EXP-${Math.floor(Math.random() * 90) + 10}`, vendor: expenseVendor, amount: parseFloat(expenseAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setExpenseVendor("");
    setExpenseAmount("");
  };

  const addTimesheet = () => {
    if (!taskName || !taskDuration) return;
    setTimesheetList([
      ...timesheetList,
      { id: Date.now().toString(), task: taskName, duration: taskDuration, date: new Date().toISOString().split('T')[0] }
    ]);
    setTaskName("");
    setTaskDuration("");
  };

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Architecture...</p>
    </div>
  );

  const calculatedTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const discount = discountAmount === "" ? 0 : parseFloat(discountAmount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const vat = taxableAmount * (parseFloat(vatRate) / 100);
    return taxableAmount + vat;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
      
      {/* HEADER: TITLE & INTELLIGENCE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <Globe size={14} className="animate-pulse" />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node Ecosystem</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Management & Operations</h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runClarityScan}
          disabled={isScanActive}
          className="flex items-center gap-4 bg-white border border-stone-200 px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {isScanActive ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="animate-spin text-[#a9b897]" size={20} />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Sparkles className="text-[#a9b897] group-hover:rotate-12 transition-transform" size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
            {isScanActive ? "Running Heuristics..." : "Request Intelligence Scan"}
          </span>
        </motion.button>
      </header>

      {/* CLARITY INSIGHT PANEL */}
      <AnimatePresence>
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#1c1c1c] text-stone-100 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#a9b897]/30"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-[#a9b897]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#a9b897]/20">
                <Zap className="text-[#a9b897]" size={32} />
              </div>
              <div>
                <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.3em] mb-2">Synthetic Insight</p>
                <p className="font-serif italic text-2xl text-stone-200 leading-snug max-w-3xl">{insight}</p>
              </div>
            </div>
            <button 
              onClick={() => setInsight(null)} 
              className="p-3 hover:bg-stone-800 rounded-full text-stone-500 transition-colors cursor-pointer"
            >
              <X size={24}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-4">
        <button 
          onClick={() => setActiveTab("architecture")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "architecture" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Project Nodes
        </button>
        <button 
          onClick={() => setActiveTab("financials")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "financials" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Financials
        </button>
        <button 
          onClick={() => setActiveTab("hr")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "hr" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          HR & Payroll
        </button>
        <button 
          onClick={() => setActiveTab("timesheets")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "timesheets" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Timesheets
        </button>
        <button 
          onClick={() => setActiveTab("appraisals")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "appraisals" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Appraisals
        </button>
      </div>

      {/* TAB CONTENT MODULES */}

      {/* 1. PROJECT ARCHITECTURE TAB */}
      {activeTab === "architecture" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-4">
          <aside className="lg:col-span-4">
            <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10 sticky top-32">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">Deployment Hub</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initialize New Project Node</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Objective Designation</label>
                  <input
                    placeholder="e.g. Project Overclock"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Associated Entity</label>
                  <div className="relative">
                    <select
                      value={form.customer_id}
                      onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-6 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none appearance-none transition-all cursor-pointer font-medium"
                    >
                      <option value="">Select Entity Node...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Plus size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300" />
                  </div>
                </div>

                <button
                  onClick={createProject}
                  disabled={!canCreate(role) || !form.name || !form.customer_id}
                  className="w-full py-6 rounded-[2rem] flex justify-center items-center gap-4 group shadow-xl bg-stone-900 text-white disabled:opacity-50 cursor-pointer border-0 font-bold tracking-[0.3em]"
                >
                  {canCreate(role) ? (
                    <>
                      <FolderPlus size={20} className="group-hover:scale-110 transition-transform text-[#a9b897]" />
                      <span className="text-[10px] font-black tracking-[0.2em]">Commit Deployment</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} className="text-red-400" />
                      <span className="text-[10px] font-black tracking-[0.2em]">Clearance Inhibited</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8">
            {projects.length === 0 ? (
              <div className="h-[600px] border-2 border-dashed border-stone-200 rounded-[4rem] flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                  <Briefcase size={32} className="text-stone-300" />
                </div>
                <p className="text-stone-400 font-serif italic text-2xl">No architecture nodes detected in current ecosystem.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {projects.map((p) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                    key={p.id} 
                    className="bg-white border border-stone-100 p-12 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:border-[#a9b897]/20 transition-all group flex flex-col justify-between h-[360px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-10">
                        <div className="bg-[#faf9f9f6] p-5 rounded-[1.5rem] text-stone-300 group-hover:text-[#a9b897] group-hover:bg-[#a9b897]/5 transition-all">
                          <Activity size={28} />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Operational</span>
                        </div>
                      </div>
                      <h3 className="text-4xl font-serif italic text-stone-800 leading-tight group-hover:text-black transition-colors">{p.name}</h3>
                      <p className="text-[11px] text-[#a9b897] uppercase font-black mt-4 tracking-[0.3em]">
                        {p.customers?.name || "Independent Node"}
                      </p>
                    </div>

                    <div className="flex justify-end pt-10 border-t border-stone-50">
                      <a 
                        href={`/projects/${p.id}`} 
                        className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 group-hover:text-stone-900 transition-all no-underline"
                      >
                        Connect to Node <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* 2. FINANCIALS TAB */}
      {activeTab === "financials" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          <div className="lg:col-span-1 space-y-8 h-fit">
            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
              <h3 className="text-xl font-serif italic text-stone-800">New Invoice</h3>
              <div className="space-y-4">
                <input
                  placeholder="Client Name"
                  value={invoiceClient}
                  onChange={(e) => setInvoiceClient(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <input
                  type="number"
                  placeholder="Amount (£)"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <button
                  onClick={addInvoice}
                  className="w-full py-3 bg-[#a9b897] text-stone-900 rounded-2xl text-xs uppercase font-black hover:bg-[#99a888]"
                >
                  Create Invoice
                </button>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
              <h3 className="text-xl font-serif italic text-stone-800">Create Quote</h3>
              <div className="space-y-4">
                <input
                  placeholder="Client Name"
                  value={quoteClient}
                  onChange={(e) => setQuoteClient(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <input
                  type="number"
                  placeholder="Amount (£)"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <button
                  onClick={addQuote}
                  className="w-full py-3 border border-stone-200 text-stone-700 rounded-2xl text-xs uppercase font-bold hover:bg-stone-50"
                >
                  Save Quote
                </button>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
              <h3 className="text-xl font-serif italic text-stone-800">Log Expense Item</h3>
              <div className="space-y-4">
                <input
                  placeholder="Vendor Name"
                  value={expenseVendor}
                  onChange={(e) => setExpenseVendor(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <input
                  type="number"
                  placeholder="Amount (£)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-11 px-4 text-xs font-bold outline-none text-stone-800"
                />
                <button
                  onClick={addExpense}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs uppercase font-bold hover:bg-red-100/40"
                >
                  Log Expense
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                <h4 className="text-lg font-serif italic text-stone-800">Balance Sheet</h4>
                <div className="space-y-3 pt-4 text-xs font-medium">
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-400">Total Assets</span>
                    <span className="font-mono text-stone-800 font-bold">£{balanceSheet.assets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-400">Total Liabilities</span>
                    <span className="font-mono text-stone-800 font-bold">£{balanceSheet.liabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm">
                    <span className="text-stone-800 font-bold">Equity</span>
                    <span className="font-mono text-stone-900 font-bold">£{balanceSheet.equity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                <h4 className="text-lg font-serif italic text-stone-800">Cash Flow Statement</h4>
                <div className="space-y-3 pt-4 text-xs font-medium">
                  <div className="flex justify-between border-b border-stone-100 pb-2 text-green-600">
                    <span className="flex items-center gap-2">Inflows</span>
                    <span className="font-mono font-bold">£{cashFlow.inflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2 text-red-500">
                    <span className="flex items-center gap-2">Outflows</span>
                    <span className="font-mono font-bold">-£{cashFlow.outflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm">
                    <span className="text-stone-800 font-bold">Net Change</span>
                    <span className="font-mono text-stone-900 font-bold">£{cashFlow.net.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                <h4 className="text-lg font-serif italic text-stone-800">Accounts Receivable</h4>
                <div className="space-y-2 pt-2">
                  {accountsReceivable.map((ar) => (
                    <div key={ar.id} className="flex justify-between text-xs py-2 border-b border-stone-50">
                      <span className="font-medium text-stone-800">{ar.customer}</span>
                      <span className="font-mono font-bold">£{ar.balance}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                <h4 className="text-lg font-serif italic text-stone-800">Income Statement</h4>
                <div className="space-y-3 text-xs font-medium pt-2">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gross Rev</span>
                    <span className="font-mono">£{incomeStatement.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">COGS</span>
                    <span className="font-mono text-red-500">-£{incomeStatement.cogs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-2 font-bold">
                    <span className="text-stone-800">Net Income</span>
                    <span className="font-mono text-green-600">£{incomeStatement.netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Invoices</h5>
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex justify-between text-xs">
                      <span className="font-bold">{inv.client}</span>
                      <span className="font-mono">£{inv.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Quotes</h5>
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div key={q.id} className="flex justify-between text-xs">
                      <span className="font-bold">{q.client}</span>
                      <span className="font-mono">£{q.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Expenses</h5>
                <div className="space-y-3">
                  {expenses.map((e) => (
                    <div key={e.id} className="flex justify-between text-xs">
                      <span className="font-bold">{e.vendor}</span>
                      <span className="font-mono">£{e.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">VAT Rate (%)</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none appearance-none cursor-pointer font-bold"
                  >
                    <option value="0">0% (Zero Rated)</option>
                    <option value="5">5% (Reduced Rate)</option>
                    <option value="20">20% (Standard Rate)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Discount Amount (£)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none placeholder:text-stone-700 font-bold"
                  />
                </div>
              </div>

              <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-left">
                  <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Grand Total</p>
                  <p className="text-5xl font-mono tracking-tighter">£{calculatedTotal().toFixed(2)}</p>
                </div>
                <button
                  onClick={() => alert(`Invoice dispatched, total: ${calculatedTotal()}`)}
                  className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-[#a9b897] text-stone-900 font-bold tracking-[0.3em] uppercase text-xs flex justify-center items-center gap-4 hover:bg-[#99a888] transition-all"
                >
                  <Send size={16} /> Dispatch Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HR & PAYROLL TAB */}
      {activeTab === "hr" && (
        <div className="max-w-4xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
          <div className="flex items-center gap-3 text-stone-800">
            <UserPlus size={18} className="text-[#a9b897]" />
            <h4 className="text-xl font-serif italic">Onboard New Team Member</h4>
          </div>
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Payroll Data Interface</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Name</label>
              <input value={empName} onChange={(e) => setEmpName(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Number</label>
              <input value={empNumber} onChange={(e) => setEmpNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role/Title</label>
              <input value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Contract Type</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800">
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Working Hours & Days</label>
              <input placeholder="e.g. 40 hrs / Mon-Fri" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Holiday Entitlement (Days)</label>
              <input value={holidayEntitlement} onChange={(e) => setHolidayEntitlement(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Date of Pay Due</label>
              <input type="date" value={dateOfPayDue} onChange={(e) => setDateOfPayDue(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-6 space-y-6">
            <h5 className="text-xs font-bold text-stone-700">Banking & Emergency Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Bank Name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Account Number</label>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Sort Code</label>
                <input value={sortCode} onChange={(e) => setSortCode(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Next of Kin Name</label>
                <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Next of Kin Number</label>
                <input value={nextOfKinNumber} onChange={(e) => setNextOfKinNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert(`Team Member ${empName} updated on payroll ledger`)}
            className="w-full py-4 bg-[#a9b897]/20 border border-[#a9b897]/30 text-stone-900 rounded-2xl text-xs uppercase font-bold hover:bg-[#a9b897]/30 flex items-center justify-center gap-2"
          >
            <Briefcase size={14} /> Submit Employee Record
          </button>
        </div>
      )}

      {/* 4. TIMESHEETS TAB */}
      {activeTab === "timesheets" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-[#a9b897]" />
            <h3 className="text-xl font-serif italic text-stone-800">Timesheets</h3>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-12 px-4 text-xs font-bold outline-none text-stone-800"
            />
            <input
              placeholder="Duration (e.g. 3.5 hrs)"
              value={taskDuration}
              onChange={(e) => setTaskDuration(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-12 px-4 text-xs font-bold outline-none text-stone-800"
            />
            <button
              onClick={addTimesheet}
              className="w-full py-3 bg-stone-900 text-white rounded-2xl text-xs uppercase font-bold hover:bg-stone-800"
            >
              Log Time Entry
            </button>
          </div>
          <div className="divide-y divide-stone-100 mt-4 text-xs">
            {timesheetList.map((t) => (
              <div key={t.id} className="flex justify-between py-3">
                <span className="font-semibold">{t.task}</span>
                <span className="text-stone-400 font-mono">{t.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. APPRAISALS TAB */}
      {activeTab === "appraisals" && (
        <div className="max-w-4xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xl font-serif font-bold text-stone-800">Employee Appraisal</h4>
              <p className="text-[9px] text-stone-400 tracking-wider font-black uppercase mt-1">Submit appraisal logs for employees</p>
            </div>
            <button 
              onClick={() => setAppraisalOpen(true)}
              className="px-6 py-3 bg-stone-900 text-white text-[10px] uppercase font-bold rounded-2xl hover:bg-stone-800"
            >
              Open Form
            </button>
          </div>

          {appraisalOpen && (
            <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[3.5rem] p-12 overflow-y-auto shadow-2xl relative flex flex-col gap-8">
                <button 
                  onClick={() => setAppraisalOpen(false)}
                  className="absolute right-10 top-10 p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
                >
                  <X size={16} />
                </button>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic tracking-tighter text-stone-900">Employee Appraisal Subsystem</h2>
                  <p className="text-[10px] font-black text-stone-400 tracking-widest uppercase">Self-Reflection, Growth and Development Records</p>
                </div>

                <div className="space-y-6 text-xs text-stone-800">
                  <h3 className="font-bold border-b border-stone-100 pb-2">1. Self-Reflection & Achievements</h3>
                  <div>
                    <label className="font-black text-stone-500">What accomplishment from this review period are you most proud of?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q1} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q1: e.target.value})} />
                  </div>
                  <div>
                    <label className="font-black text-stone-500">Which of your strengths have you used most effectively in your role?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q2} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q2: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">2. Challenges & Improvements</h3>
                  <div>
                    <label className="font-black text-stone-500">What has been your biggest challenge recently, and how did you address it?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q3} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q3: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">3. Goals & Development</h3>
                  <div>
                    <label className="font-black text-stone-500">What professional skills would you like to develop in the next 6–12 months?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q4} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q4: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">4. Teamwork & Collaboration</h3>
                  <div>
                    <label className="font-black text-stone-500">How do you feel about communication and collaboration within the team?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q5} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q5: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">5. Future Outlook</h3>
                  <div>
                    <label className="font-black text-stone-500">Where do you see yourself in the company in the next 1–3 years?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q6} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q6: e.target.value})} />
                  </div>
                </div>

                <button 
                  onClick={() => { setAppraisalOpen(false); alert("Appraisal data successfully recorded in the main system."); }}
                  className="w-full py-5 bg-stone-900 text-white font-bold tracking-widest text-xs uppercase rounded-2xl"
                >
                  Submit Appraisal Records
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}