"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Search, Upload, Trash2, Receipt, FileText, History, TrendingUp, Mail, 
  CreditCard, RefreshCcw, Calendar, ClipboardCheck, Percent, Briefcase, User, 
  FileCheck, Wallet, PieChart, Users, ShieldCheck, ArrowUpRight, Calculator, Scale,
  BarChart3, Landmark, BookOpen, Layers, Fingerprint, Globe, Building2, HardDrive
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

// --- ERP Data Types ---
type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "vat_return" | "p_and_l" | "balance_sheet" | "hr_roster" | "audit_log" | "fixed_assets";

export default function TreasuryTitanPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- The Complete ERP State (No Abstractions) ---
  const [form, setForm] = useState({ 
    contact_id: "",
    project_id: "",
    nominal_code: "4000", // Sales
    cost_centre: "GENERAL",
    currency: "GBP",
    exchange_rate: 1.0,
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reference_no: `TXN-${Date.now()}`,
    status: "draft",
    payment_terms: "NET30",
    lines: [{ description: "", quantity: 1, unit_price: 0, discount_pc: 0, vat_rate: 20, nominal: "4000" }],
    payroll: {
      employee_id: "",
      annual_gross: 0,
      ni_category: "A",
      tax_code: "1257L",
      is_pension_enrolled: true,
      pension_contribution_pc: 5,
      employer_pension_pc: 3,
      student_loan_plan: "none",
      postgrad_loan: false,
      ssp_days: 0,
      smp_weeks: 0,
      holiday_allowance: 28,
      holiday_taken: 0,
      bank_sort: "",
      bank_acc: "",
      next_of_kin_name: "",
      next_of_kin_phone: ""
    },
    reporting: {
      is_capital_expenditure: false,
      depreciation_method: "straight_line",
      useful_life_years: 3
    }
  });

  // --- Pure Accountant Calculation Engines ---
  const calculations = useMemo(() => {
    // 1. Invoice/Expense Math
    const subtotal = form.lines.reduce((a, b) => a + (b.quantity * b.unit_price * (1 - b.discount_pc/100)), 0);
    const totalVat = form.lines.reduce((a, b) => a + (b.quantity * b.unit_price * (1 - b.discount_pc/100) * (b.vat_rate/100)), 0);
    const totalGross = subtotal + totalVat;

    // 2. Sage-Grade Payroll Engine (Monthly)
    const monthlyGross = form.payroll.annual_gross / 12;
    // Primary NI Threshold 2026 Est: £1,048/mo
    const employeeNI = monthlyGross > 1048 ? (monthlyGross - 1048) * 0.08 : 0;
    const employerNI = monthlyGross > 758 ? (monthlyGross - 758) * 0.138 : 0;
    
    // Pension
    const pensionBase = monthlyGross > 520 ? monthlyGross - 520 : 0;
    const eePension = form.payroll.is_pension_enrolled ? pensionBase * (form.payroll.pension_contribution_pc / 100) : 0;
    const erPension = form.payroll.is_pension_enrolled ? pensionBase * (form.payroll.employer_pension_pc / 100) : 0;

    // PAYE (Simplified Banding)
    const taxableIncome = monthlyGross - (12570 / 12); // Standard Personal Allowance
    const estPaye = taxableIncome > 0 ? taxableIncome * 0.20 : 0;

    const netTakeHome = monthlyGross - employeeNI - eePension - estPaye;

    return { subtotal, totalVat, totalGross, monthlyGross, employeeNI, employerNI, eePension, erPension, estPaye, netTakeHome };
  }, [form]);

  // --- Real-time Global Ledger Aggregation ---
  const ledgerStats = useMemo(() => {
    const revenue = docs.filter(d => d.type === 'invoices' && d.status === 'paid').reduce((a, b) => a + (b.amount || 0), 0);
    const expenses = docs.filter(d => d.type === 'expenses').reduce((a, b) => a + (b.amount || 0), 0);
    const agedDebtors = docs.filter(d => d.type === 'invoices' && d.status !== 'paid').reduce((a, b) => a + (b.amount || 0), 0);
    const vatOutput = docs.filter(d => d.type === 'invoices').reduce((a, b) => a + (b.amount * 0.166), 0); // Approx 20% of gross
    const vatInput = docs.filter(d => d.type === 'expenses').reduce((a, b) => a + (b.amount * 0.166), 0);

    return { 
      ebitda: revenue - expenses, 
      agedDebtors, 
      vatProvision: vatOutput - vatInput,
      cashOnHand: revenue - expenses - (docs.filter(d => d.type === 'payroll').reduce((a,b) => a + b.amount, 0) / 12)
    };
  }, [docs]);

  // --- Persistence & Audit Logic ---
  const loadData = useCallback(async (tId: string) => {
    setIsProcessing(true);
    const [dRes, cRes, pRes] = await Promise.all([
      supabase.from("finance_ledger").select("*, contacts(*), projects(*)").eq("team_id", tId).order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").eq("team_id", tId),
      supabase.from("projects").select("*").eq("team_id", tId)
    ]);
    setDocs(dRes.data || []);
    setContacts(cRes.data || []);
    setProjects(pRes.data || []);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
        if (mem?.team_id) { setTeamId(mem.team_id); loadData(mem.team_id); }
      }
    };
    init();
  }, [loadData]);

  const handleCommitToLedger = async () => {
    if (!teamId) return;
    setIsProcessing(true);
    const finalAmount = type === 'payroll' ? form.payroll.annual_gross : calculations.totalGross;
    
    // Create Audit Log Entry
    const auditEntry = {
      action: `CREATE_${type.toUpperCase()}`,
      user: "SYSTEM_ADMIN",
      timestamp: new Date().toISOString(),
      delta: form
    };

    const { error } = await supabase.from("finance_ledger").insert([{ 
      ...form, 
      team_id: teamId, 
      type, 
      amount: finalAmount,
      audit_trail: [auditEntry]
    }]);

    if (!error) { 
      setShowModal(false); 
      loadData(teamId); 
    }
    setIsProcessing(false);
  };

  return (
    <Page title="Treasury Titan ERP">
      <div className="min-h-screen bg-[#f3f3ef] p-6 lg:p-12">
        
        {/* Section 1: Executive KPI Command Center */}
        <div className="max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Net EBITDA</p>
              <TrendingUp className="text-[#a9b897]" size={18} />
            </div>
            <h3 className="text-4xl font-serif italic mt-4">£{ledgerStats.ebitda.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-stone-400 mt-2">REAL-TIME P&L POSITION</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-between">
             <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">VAT Liability</p>
              <ShieldCheck className="text-orange-400" size={18} />
            </div>
            <h3 className="text-4xl font-serif italic mt-4">£{ledgerStats.vatProvision.toLocaleString()}</h3>
            <div className="w-full bg-stone-100 h-1 rounded-full mt-4"><div className="bg-orange-400 h-full w-[45%]" /></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-between">
             <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Aged Debtors</p>
              <Layers className="text-blue-400" size={18} />
            </div>
            <h3 className="text-4xl font-serif italic mt-4">£{ledgerStats.agedDebtors.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-blue-500 mt-2">DUE WITHIN 30 DAYS</p>
          </div>

          <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <Building2 className="absolute -right-6 -bottom-6 text-white/5" size={150} />
            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Projected Cash</p>
            <h3 className="text-4xl font-serif italic mt-4 text-[#a9b897]">£{ledgerStats.cashOnHand.toLocaleString()}</h3>
            <button className="bg-white/10 w-full py-3 rounded-xl text-[9px] font-black uppercase mt-4 hover:bg-white/20 transition-all">Liquidity Report</button>
          </div>
        </div>

        {/* Section 2: Enterprise Navigation */}
        <div className="max-w-[1700px] mx-auto mb-10 flex flex-col lg:flex-row justify-between items-end gap-6">
          <div className="flex flex-wrap gap-2">
            <div className="bg-white p-2 rounded-2xl shadow-sm flex gap-1 mr-4">
               {["invoices", "expenses", "vat_return", "p_and_l", "balance_sheet", "fixed_assets"].map((t) => (
                 <button key={t} onClick={() => setType(t as DocType)} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}>
                   {t.replace('_', ' ')}
                 </button>
               ))}
            </div>
            <div className="bg-white p-2 rounded-2xl shadow-sm flex gap-1">
               {["payroll", "hr_roster", "audit_log"].map((t) => (
                 <button key={t} onClick={() => setType(t as DocType)} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-[#a9b897] text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}>
                   {t.replace('_', ' ')}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:flex-none">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
               <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Ledger Reference..." className="bg-white pl-16 pr-8 py-5 rounded-2xl border-none shadow-sm w-full lg:w-[400px] text-xs outline-none focus:ring-2 ring-stone-200" />
             </div>
             <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#a9b897] transition-all flex items-center gap-3 active:scale-95">
               <Plus size={18} /> Record Entry
             </button>
          </div>
        </div>

        {/* Section 3: The Active Workspace */}
        <div className="max-w-[1700px] mx-auto">
          {/* Detailed Ledger List View */}
          <div className="space-y-4">
            {docs.filter(d => d.type === type).map((doc) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={doc.id} className="bg-white p-8 rounded-[2.5rem] flex items-center justify-between group hover:shadow-2xl transition-all border border-stone-100">
                <div className="flex items-center gap-10">
                   <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all">
                      {type === 'payroll' ? <Users size={24}/> : type === 'expenses' ? <Receipt size={24}/> : <FileText size={24}/>}
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">{doc.reference_no || `REF-${doc.id.slice(0,6)}`}</span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${doc.status === 'paid' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>
                          {doc.status || 'Draft'}
                        </span>
                      </div>
                      <h4 className="text-2xl font-serif italic text-stone-900">
                        {doc.contacts?.name || doc.payroll?.fullName || "Journal Adjustment"}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                         <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1"><Calendar size={12}/> {new Date(doc.created_at).toLocaleDateString()}</span>
                         <span className="text-[9px] font-bold text-[#a9b897] flex items-center gap-1 uppercase tracking-widest"><Briefcase size={12}/> {doc.projects?.name || "Unallocated"}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="hidden lg:block text-right">
                      <p className="text-[9px] font-black text-stone-300 uppercase mb-1">Nominal Code</p>
                      <p className="text-sm font-mono text-stone-500">{doc.nominal_code || '4000'}</p>
                   </div>
                   <div className="text-right min-w-[150px]">
                      <p className="text-[9px] font-black text-stone-300 uppercase mb-1">Total Impact</p>
                      <p className="text-3xl font-serif italic">£{(doc.amount || 0).toLocaleString()}</p>
                   </div>
                   <button className="p-4 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all">
                     <ChevronRight size={20} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 4: The Titan Modal (Deep Form Logic) */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-50 flex justify-center items-center p-4">
              <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-[#fcfbf8] w-full max-w-[90vw] max-h-[92vh] overflow-y-auto rounded-[4rem] p-16 shadow-2xl relative border border-white/20">
                
                <div className="flex justify-between items-start mb-16">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#a9b897]">
                      <Fingerprint size={24} />
                      <span className="text-[11px] font-black uppercase tracking-[0.6em]">Authorized Financial Instrument</span>
                    </div>
                    <h2 className="text-8xl font-serif italic capitalize">Record {type.replace('_', ' ')}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-6 bg-stone-100 rounded-full hover:bg-stone-900 hover:text-white transition-all"><X size={32}/></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                   {/* Left Column: Deep Inputs */}
                   <div className="lg:col-span-8 space-y-12">
                      
                      {/* Sub-Form: Standard Ledger (Invoices/Expenses) */}
                      {(type === 'invoices' || type === 'expenses' || type === 'quotes') && (
                        <div className="space-y-12">
                          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Counterparty Account</label>
                               <select className="w-full bg-white p-6 rounded-3xl border-none shadow-sm text-sm" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                                 <option>Select Customer/Supplier...</option>
                                 {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Allocation Project</label>
                               <select className="w-full bg-white p-6 rounded-3xl border-none shadow-sm text-sm" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                                 <option>General Fund...</option>
                                 {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                               </select>
                            </div>
                          </section>

                          <section className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
                             <div className="p-6 bg-stone-50 border-b border-stone-100 grid grid-cols-12 gap-6">
                               <div className="col-span-5 text-[9px] font-black uppercase text-stone-400">Description</div>
                               <div className="col-span-2 text-[9px] font-black uppercase text-stone-400">Qty</div>
                               <div className="col-span-2 text-[9px] font-black uppercase text-stone-400">Unit Price</div>
                               <div className="col-span-2 text-[9px] font-black uppercase text-stone-400">VAT %</div>
                               <div className="col-span-1"></div>
                             </div>
                             <div className="p-8 space-y-4">
                               {form.lines.map((line, idx) => (
                                 <div key={idx} className="grid grid-cols-12 gap-6 items-center border-b border-stone-50 pb-4">
                                   <input className="col-span-5 bg-stone-50/50 p-4 rounded-xl text-sm outline-none" value={line.description} placeholder="Service description..." onChange={e => {
                                      const nl = [...form.lines]; nl[idx].description = e.target.value; setForm({...form, lines: nl});
                                   }} />
                                   <input type="number" className="col-span-2 bg-stone-50/50 p-4 rounded-xl text-sm" value={line.quantity} onChange={e => {
                                      const nl = [...form.lines]; nl[idx].quantity = Number(e.target.value); setForm({...form, lines: nl});
                                   }} />
                                   <input type="number" className="col-span-2 bg-stone-50/50 p-4 rounded-xl text-sm" value={line.unit_price} onChange={e => {
                                      const nl = [...form.lines]; nl[idx].unit_price = Number(e.target.value); setForm({...form, lines: nl});
                                   }} />
                                   <select className="col-span-2 bg-stone-50/50 p-4 rounded-xl text-xs font-bold" value={line.vat_rate} onChange={e => {
                                      const nl = [...form.lines]; nl[idx].vat_rate = Number(e.target.value); setForm({...form, lines: nl});
                                   }}>
                                      <option value={20}>20% (STD)</option>
                                      <option value={5}>5% (RED)</option>
                                      <option value={0}>0% (ZRO)</option>
                                   </select>
                                   <button className="col-span-1 text-stone-200 hover:text-red-400" onClick={() => setForm({...form, lines: form.lines.filter((_, i) => i !== idx)})}><Trash2 size={18}/></button>
                                 </div>
                               ))}
                               <button onClick={() => setForm({...form, lines: [...form.lines, { description: "", quantity: 1, unit_price: 0, discount_pc: 0, vat_rate: 20, nominal: "4000" }]})} className="text-[10px] font-black uppercase text-[#a9b897] mt-4">+ Add Itemized Line</button>
                             </div>
                          </section>

                          <div className="grid grid-cols-3 gap-8">
                             <div className="bg-white p-6 rounded-3xl shadow-sm">
                               <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Currency</p>
                               <select className="w-full text-lg font-serif border-none p-0 outline-none"><option>GBP (£)</option><option>USD ($)</option><option>EUR (€)</option></select>
                             </div>
                             <div className="bg-white p-6 rounded-3xl shadow-sm">
                               <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Nominal Account</p>
                               <select className="w-full text-xs font-bold border-none p-0 outline-none"><option>4000 - General Sales</option><option>2000 - Rent/Rates</option><option>7100 - Prof Fees</option></select>
                             </div>
                             <div className="bg-white p-6 rounded-3xl shadow-sm">
                               <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Cost Centre</p>
                               <select className="w-full text-xs font-bold border-none p-0 outline-none"><option>GENERAL</option><option>MARKETING</option><option>OPS</option></select>
                             </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-Form: Full Payroll & HR (Deep Logic) */}
                      {type === 'payroll' && (
                        <div className="space-y-12">
                           <section className="grid grid-cols-2 gap-10">
                              <div className="space-y-6">
                                <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest ml-6">Personal & Identification</h4>
                                <input className="w-full bg-white p-6 rounded-3xl shadow-sm text-sm border-none" placeholder="Legal Full Name" onChange={e => setForm({...form, payroll: {...form.payroll, fullName: e.target.value}})} />
                                <div className="grid grid-cols-2 gap-4">
                                  <input className="w-full bg-white p-6 rounded-3xl shadow-sm text-sm border-none" placeholder="NI Number" />
                                  <input className="w-full bg-white p-6 rounded-3xl shadow-sm text-sm border-none" placeholder="Tax Code" value={form.payroll.tax_code} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white p-6 rounded-3xl shadow-sm"><p className="text-[9px] font-black uppercase text-stone-300 mb-1">Sort Code</p><input className="w-full text-sm border-none p-0 font-mono" placeholder="00-00-00" /></div>
                                   <div className="bg-white p-6 rounded-3xl shadow-sm"><p className="text-[9px] font-black uppercase text-stone-300 mb-1">Account No</p><input className="w-full text-sm border-none p-0 font-mono" placeholder="00000000" /></div>
                                </div>
                              </div>
                              <div className="space-y-6">
                                <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest ml-6">Remuneration & Pension</h4>
                                <div className="bg-white p-6 rounded-3xl shadow-sm">
                                   <p className="text-[9px] font-black uppercase text-stone-300 mb-2">Annual Gross Salary</p>
                                   <div className="flex items-center gap-2">
                                     <span className="text-3xl font-serif italic text-stone-300">£</span>
                                     <input type="number" className="w-full text-4xl font-serif italic border-none p-0 outline-none" value={form.payroll.annual_gross} onChange={e => setForm({...form, payroll: {...form.payroll, annual_gross: Number(e.target.value)}})} />
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white p-6 rounded-3xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-stone-300 mb-2">Pension EE (%)</p>
                                      <input type="number" className="w-full text-lg font-bold border-none p-0" value={form.payroll.pension_contribution_pc} onChange={e => setForm({...form, payroll: {...form.payroll, pension_contribution_pc: Number(e.target.value)}})} />
                                   </div>
                                   <div className="bg-white p-6 rounded-3xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-stone-300 mb-2">Pension ER (%)</p>
                                      <input type="number" className="w-full text-lg font-bold border-none p-0" value={form.payroll.employer_pension_pc} onChange={e => setForm({...form, payroll: {...form.payroll, employer_pension_pc: Number(e.target.value)}})} />
                                   </div>
                                </div>
                                <select className="w-full bg-white p-6 rounded-3xl shadow-sm border-none text-[10px] font-black uppercase">
                                  <option>Student Loan: None</option>
                                  <option>Student Loan: Plan 1</option>
                                  <option>Student Loan: Plan 2</option>
                                </select>
                              </div>
                           </section>

                           <section className="bg-stone-900 text-white p-10 rounded-[3rem] grid grid-cols-4 gap-8">
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-2">Monthly Net Take-home</p>
                                <p className="text-2xl font-serif italic text-[#a9b897]">£{calculations.netTakeHome.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-2">Employer NI Cost</p>
                                <p className="text-2xl font-serif italic">£{calculations.employerNI.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-2">Employee NI</p>
                                <p className="text-2xl font-serif italic">£{calculations.employeeNI.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-2">Income Tax (PAYE)</p>
                                <p className="text-2xl font-serif italic text-red-400">£{calculations.estPaye.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                              </div>
                           </section>
                        </div>
                      )}
                   </div>

                   {/* Right Column: Summaries & Commit */}
                   <div className="lg:col-span-4 space-y-8">
                      <div className="bg-stone-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                         <Layers className="absolute -right-4 -top-4 text-white/5" size={150} />
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-10">Financial Commit Summary</p>
                         
                         <div className="space-y-6 mb-12">
                           <div className="flex justify-between items-center text-sm">
                             <span className="opacity-50">Base Subtotal</span>
                             <span className="font-mono">£{calculations.subtotal.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                             <span className="opacity-50">Tax Aggregation (VAT/NI)</span>
                             <span className="font-mono">£{(type === 'payroll' ? (calculations.employerNI + calculations.estPaye) : calculations.totalVat).toLocaleString()}</span>
                           </div>
                           <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                             <span className="text-[11px] font-black uppercase">Gross Fiscal Impact</span>
                             <h4 className="text-6xl font-serif italic text-[#a9b897]">£{type === 'payroll' ? (form.payroll.annual_gross / 12).toLocaleString() : calculations.totalGross.toLocaleString()}</h4>
                           </div>
                         </div>

                         <div className="space-y-3">
                           <button className="w-full py-6 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                             <Mail size={18}/> Send Ledger Confirmation
                           </button>
                           <button onClick={handleCommitToLedger} disabled={isProcessing} className="w-full py-8 bg-[#a9b897] text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-4">
                             {isProcessing ? <RefreshCcw className="animate-spin" /> : <HardDrive size={20} />}
                             Post to General Ledger
                           </button>
                         </div>
                      </div>

                      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
                         <h5 className="text-[11px] font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><History size={16}/> Accounting Audit Trail</h5>
                         <div className="space-y-4">
                            <div className="flex gap-4">
                               <div className="w-1 bg-[#a9b897] rounded-full" />
                               <div>
                                 <p className="text-[10px] font-black uppercase">Transaction Initialized</p>
                                 <p className="text-[10px] text-stone-400 italic">User: SYSTEM_ADMIN • {new Date().toLocaleTimeString()}</p>
                               </div>
                            </div>
                            <div className="flex gap-4">
                               <div className="w-1 bg-stone-200 rounded-full" />
                               <div>
                                 <p className="text-[10px] font-black uppercase text-stone-300">Pending Ledger Posting</p>
                                 <p className="text-[10px] text-stone-300 italic">Awaiting database commit...</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Page>
  );
}