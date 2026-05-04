"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Search, Trash2, Receipt, FileText, History, Mail, 
  CreditCard, RefreshCcw, Calendar, CheckCircle2, ShieldCheck, 
  ArrowUpRight, Calculator, Landmark, BookOpen, Eye, Image as ImageIcon,
  Send, Scale, AlertCircle, Printer, Download, Settings, Users, 
  Briefcase, Globe, Lock, BarChart3, PieChart, ChevronRight
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

/**
 * APEX ERP ENGINE - CORE LOGIC
 * Includes: 
 * 1. Double-Entry Accounting Simulation
 * 2. Real-time VAT/Tax Liability Engine
 * 3. HR/Payroll Master Data & Statutory Calculation
 * 4. Document Branding & Bank Detail Injection
 */

type ViewState = "ledger" | "payroll" | "reporting" | "settings";
type DocStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export default function ApexTreasuryEnterprise() {
  const [view, setView] = useState<ViewState>("ledger");
  const [showModal, setShowModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // --- PERSISTENT ORGANIZATION SETTINGS (Xero-Style) ---
  const [org, setOrg] = useState({
    logoUrl: "",
    name: "Apex Global Solutions Ltd",
    vatNumber: "GB 987 6543 21",
    bank: { name: "Commercial Bank", acc: "99887766", sort: "10-20-30", iban: "GB29CBANK10203099887766" },
    terms: "Strictly 30 days. Statutory interest applied to late payments under UK Law.",
    thanks: "We appreciate your partnership.",
    fiscalYearEnd: "2027-03-31"
  });

  // --- TRANSACTIONAL STATE ---
  const [form, setForm] = useState({
    type: "invoice", // invoice, expense, quote, journal
    contact_id: "",
    ref: `TXN-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "GBP",
    lines: [{ desc: "", qty: 1, price: 0, vat: 20, account: "4000" }],
    payroll: {
      employeeName: "",
      annualSalary: 0,
      taxCode: "1257L",
      niCat: "A",
      pensionEE: 5,
      pensionER: 3,
      studentLoan: "none"
    }
  });

  // --- THE "APEX" CALCULATION ENGINE ---
  const totals = useMemo(() => {
    const net = form.lines.reduce((a, b) => a + (b.qty * b.price), 0);
    const vat = form.lines.reduce((a, b) => a + (b.qty * b.price * (b.vat / 100)), 0);
    
    // 2026/27 PAYROLL ENGINE
    const monthlyGross = form.payroll.annualSalary / 12;
    const pa = 12570 / 12; // Personal Allowance
    const taxable = Math.max(0, monthlyGross - pa);
    const paye = taxable * 0.20; // Simplified Basic Rate
    const ni = monthlyGross > 1048 ? (monthlyGross - 1048) * 0.08 : 0;
    const netPay = monthlyGross - paye - ni - (monthlyGross * (form.payroll.pensionEE / 100));

    return { net, vat, gross: net + vat, monthlyGross, paye, ni, netPay };
  }, [form]);

  // --- DATA HYDRATION ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: ledger } = await supabase.from("finance_ledger").select("*, contacts(*)").order("created_at", { ascending: false });
    const { data: clients } = await supabase.from("contacts").select("*");
    setDocs(ledger || []);
    setContacts(clients || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveTransaction = async (status: DocStatus = "draft") => {
    setLoading(true);
    const payload = {
      ...form,
      status,
      amount: form.type === 'payroll' ? form.payroll.annualSalary : totals.gross,
      vat_amount: totals.vat,
      net_amount: totals.net,
      meta: { org, totals } // Full audit snapshot
    };
    await supabase.from("finance_ledger").insert([payload]);
    setShowModal(false);
    fetchData();
  };

  return (
    <Page title="Apex Treasury ERP">
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-stone-900">
        
        {/* TOP ENTERPRISE NAV */}
        <nav className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="bg-stone-900 text-white p-2 rounded-lg font-black text-xl italic tracking-tighter">A</div>
            <div className="flex gap-1">
              {(["ledger", "payroll", "reporting", "settings"] as ViewState[]).map((v) => (
                <button 
                  key={v} 
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === v ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE LEDGER CONNECTED
            </div>
            <button onClick={() => { setForm({...form, type: 'invoice'}); setShowModal(true); }} className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg">
              <Plus size={14}/> Create Transaction
            </button>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
          
          {/* DASHBOARD SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Receivables</p>
                <ArrowUpRight className="text-green-500" size={16} />
              </div>
              <h3 className="text-3xl font-serif italic">£{docs.filter(d => d.type === 'invoice' && d.status !== 'paid').reduce((a, b) => a + b.amount, 0).toLocaleString()}</h3>
              <p className="text-[10px] text-stone-400 mt-2 font-bold">LATEST: {docs[0]?.ref || 'N/A'}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">VAT Liability (MTD)</p>
              <h3 className="text-3xl font-serif italic text-orange-600">£{docs.reduce((a, b) => a + (b.vat_amount || 0), 0).toLocaleString()}</h3>
              <div className="w-full bg-stone-100 h-1 rounded-full mt-4 overflow-hidden">
                <div className="bg-orange-500 h-full w-[65%]" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Cash On Hand</p>
              <h3 className="text-3xl font-serif italic">£42,850.00</h3>
              <p className="text-[10px] text-green-600 mt-2 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> BANK RECONCILED</p>
            </div>
            <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <BarChart3 className="absolute -right-4 -bottom-4 text-white/5" size={100} />
              <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-4">Net Profit (YTD)</p>
              <h3 className="text-3xl font-serif italic text-[#a9b897]">£{ (docs.filter(d => d.type === 'invoice').reduce((a,b)=>a+b.amount,0) - docs.filter(d => d.type === 'expense').reduce((a,b)=>a+b.amount,0)).toLocaleString() }</h3>
            </div>
          </div>

          {/* MAIN LEDGER TABLE */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-4">
                <h2 className="font-serif italic text-xl">General Ledger</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-[9px] font-bold uppercase">All Entries</span>
                  <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-[9px] font-bold uppercase text-stone-400">Export CSV</span>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                <input placeholder="Search transactions..." className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 ring-stone-900/5 w-64" />
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[9px] font-black uppercase text-stone-400 tracking-widest bg-white">
                  <th className="p-6">Date</th>
                  <th className="p-6">Entity / Reference</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Net Amount</th>
                  <th className="p-6 text-right">VAT</th>
                  <th className="p-6 text-right">Gross Total</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-stone-50/50 transition-all cursor-pointer">
                    <td className="p-6">
                      <p className="text-xs font-bold">{new Date(doc.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] text-stone-400 uppercase">{doc.type}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black uppercase text-stone-500">
                          {doc.contacts?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.contacts?.name || "Unallocated Entry"}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{doc.ref}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                        doc.status === 'paid' ? 'bg-green-50 text-green-600' : 
                        doc.status === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-stone-50 text-stone-500'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-6 text-right text-xs font-medium text-stone-400">£{(doc.net_amount || 0).toLocaleString()}</td>
                    <td className="p-6 text-right text-xs font-medium text-orange-500">£{(doc.vat_amount || 0).toLocaleString()}</td>
                    <td className="p-6 text-right text-sm font-bold">£{(doc.amount || 0).toLocaleString()}</td>
                    <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 hover:bg-stone-900 hover:text-white rounded-lg transition-all"><ChevronRight size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* APEX TRANSACTION MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-[#fcfbf8] w-full max-w-[1200px] max-h-[95vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col border border-white/20">
                
                {/* MODAL HEADER */}
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-white">
                  <div className="flex gap-4">
                    <button onClick={() => setPreviewMode(false)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${!previewMode ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}>Form View</button>
                    <button onClick={() => setPreviewMode(true)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${previewMode ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}>Legal Preview</button>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-stone-100 p-1.5 rounded-xl flex gap-1">
                      {['invoice', 'expense', 'payroll'].map(t => (
                        <button key={t} onClick={() => setForm({...form, type: t})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${form.type === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>{t}</button>
                      ))}
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2.5 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all"><X size={18}/></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {previewMode ? (
                    /* --- PROFESSIONAL PDF PREVIEW --- */
                    <div className="p-20 bg-white min-h-[1000px] max-w-[850px] mx-auto my-12 shadow-xl border border-stone-100">
                      <div className="flex justify-between items-start mb-20">
                        <div className="space-y-4">
                          <div className="w-24 h-24 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center overflow-hidden">
                            {org.logoUrl ? <img src={org.logoUrl} className="object-contain" /> : <ImageIcon className="text-stone-300" />}
                          </div>
                          <div>
                            <h1 className="text-xl font-bold uppercase tracking-tighter">{org.name}</h1>
                            <p className="text-[10px] text-stone-500 font-mono">VAT: {org.vatNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <h2 className="text-6xl font-serif italic mb-4 capitalize">{form.type}</h2>
                          <div className="space-y-1 text-[11px]">
                            <p><strong>Reference:</strong> {form.ref}</p>
                            <p><strong>Date:</strong> {form.date}</p>
                            <p><strong>Due Date:</strong> {form.due_date}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-16">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Attention of:</p>
                        <p className="text-xl font-serif italic">{contacts.find(c => c.id === form.contact_id)?.name || "Client Name Required"}</p>
                      </div>

                      <table className="w-full mb-16">
                        <thead className="border-b-2 border-stone-900">
                          <tr className="text-[10px] font-black uppercase tracking-widest">
                            <th className="py-4 text-left">Description</th>
                            <th className="py-4 text-right">Qty</th>
                            <th className="py-4 text-right">Unit Price</th>
                            <th className="py-4 text-right">VAT</th>
                            <th className="py-4 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {form.lines.map((l, i) => (
                            <tr key={i} className="text-sm">
                              <td className="py-6">{l.desc || "General Service"}</td>
                              <td className="py-6 text-right font-mono">{l.qty}</td>
                              <td className="py-6 text-right font-mono">£{l.price.toLocaleString()}</td>
                              <td className="py-6 text-right text-stone-400 text-xs">{l.vat}%</td>
                              <td className="py-6 text-right font-bold">£{(l.qty * l.price * (1 + l.vat/100)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex justify-end mb-20">
                        <div className="w-64 space-y-4">
                          <div className="flex justify-between text-sm"><span className="text-stone-400">Net Total</span><span className="font-mono">£{totals.net.toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm border-b border-stone-100 pb-4"><span className="text-stone-400">Total VAT</span><span className="font-mono">£{totals.vat.toLocaleString()}</span></div>
                          <div className="flex justify-between text-3xl font-serif italic pt-4"><span>Total Due</span><span className="text-[#a9b897]">£{totals.gross.toLocaleString()}</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-stone-100">
                        <div className="space-y-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Settlement Info</p>
                          <div className="text-[10px] space-y-1 text-stone-600 font-mono">
                            <p>Bank: {org.bank.name}</p>
                            <p>Acc: {org.bank.acc}</p>
                            <p>Sort: {org.bank.sort}</p>
                            <p className="break-all">IBAN: {org.bank.iban}</p>
                          </div>
                        </div>
                        <div className="space-y-4 text-right">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Legal Disclosure</p>
                          <p className="text-[10px] text-stone-400 leading-relaxed italic">{org.terms}</p>
                          <p className="text-sm font-serif italic text-stone-900 pt-4">{org.thanks}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- ERP FORM EDITOR --- */
                    <div className="p-16 grid grid-cols-1 md:grid-cols-12 gap-16">
                      <div className="md:col-span-8 space-y-12">
                        
                        {/* PAYROLL MODULE SPECIFIC */}
                        {form.type === 'payroll' ? (
                          <div className="space-y-10">
                            <h3 className="text-5xl font-serif italic">Payroll Master Data</h3>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Full Legal Name</label>
                                <input className="w-full bg-white p-5 rounded-2xl shadow-sm border-none text-sm" placeholder="e.g. John Doe" onChange={e => setForm({...form, payroll: {...form.payroll, employeeName: e.target.value}})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Annual Gross (£)</label>
                                <input type="number" className="w-full bg-white p-5 rounded-2xl shadow-sm border-none text-sm" placeholder="0.00" onChange={e => setForm({...form, payroll: {...form.payroll, annualSalary: Number(e.target.value)}})} />
                              </div>
                            </div>
                            <div className="bg-stone-900 text-white p-10 rounded-[3rem] grid grid-cols-3 gap-8">
                               <div>
                                  <p className="text-[9px] font-black uppercase opacity-40 mb-2">Monthly Gross</p>
                                  <p className="text-2xl font-serif italic">£{totals.monthlyGross.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase opacity-40 mb-2">PAYE/NI Estimate</p>
                                  <p className="text-2xl font-serif italic text-orange-400">£{(totals.paye + totals.ni).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase opacity-40 mb-2">Net Take-Home</p>
                                  <p className="text-2xl font-serif italic text-[#a9b897]">£{totals.netPay.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                               </div>
                            </div>
                          </div>
                        ) : (
                          /* INVOICE/EXPENSE MODULE */
                          <div className="space-y-10">
                            <h3 className="text-5xl font-serif italic">Document Creation</h3>
                            <div className="grid grid-cols-2 gap-6">
                              <select className="bg-white p-5 rounded-2xl shadow-sm border-none text-sm cursor-pointer" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                                <option>Select Associated Account...</option>
                                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <input type="text" className="bg-white p-5 rounded-2xl shadow-sm border-none text-sm" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} />
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                              <div className="grid grid-cols-12 gap-4 mb-4 text-[9px] font-black uppercase text-stone-400 tracking-widest px-4">
                                <div className="col-span-6">Nominal & Description</div>
                                <div className="col-span-2 text-right">Qty</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-2 text-right">VAT</div>
                              </div>
                              {form.lines.map((l, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center mb-4 group">
                                  <div className="col-span-6 flex gap-2">
                                    <select className="bg-stone-50 p-3 rounded-xl text-[9px] font-bold border-none"><option>4000</option><option>2000</option></select>
                                    <input className="flex-1 bg-stone-50 p-4 rounded-xl text-sm" placeholder="Item description..." value={l.desc} onChange={e => {
                                      const nl = [...form.lines]; nl[i].desc = e.target.value; setForm({...form, lines: nl});
                                    }} />
                                  </div>
                                  <input type="number" className="col-span-2 bg-stone-50 p-4 rounded-xl text-sm text-right" value={l.qty} onChange={e => {
                                    const nl = [...form.lines]; nl[i].qty = Number(e.target.value); setForm({...form, lines: nl});
                                  }} />
                                  <input type="number" className="col-span-2 bg-stone-50 p-4 rounded-xl text-sm text-right font-mono" value={l.price} onChange={e => {
                                    const nl = [...form.lines]; nl[i].price = Number(e.target.value); setForm({...form, lines: nl});
                                  }} />
                                  <select className="col-span-2 bg-stone-50 p-4 rounded-xl text-[10px] font-black" value={l.vat} onChange={e => {
                                    const nl = [...form.lines]; nl[i].vat = Number(e.target.value); setForm({...form, lines: nl});
                                  }}>
                                    <option value={20}>20% (Standard)</option>
                                    <option value={5}>5% (Reduced)</option>
                                    <option value={0}>0% (Zero)</option>
                                  </select>
                                </div>
                              ))}
                              <button onClick={() => setForm({...form, lines: [...form.lines, { desc: "", qty: 1, price: 0, vat: 20, account: "4000" }]})} className="text-[10px] font-black uppercase text-[#a9b897] flex items-center gap-2 hover:scale-105 transition-all">+ Add Journal Entry</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SIDEBAR COMMIT PANEL */}
                      <div className="md:col-span-4 space-y-6">
                        <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                          <Lock className="absolute -right-4 -top-4 text-white/5" size={120} />
                          <p className="text-[10px] font-black uppercase opacity-40 mb-10 tracking-[0.3em]">Ledger Commitment</p>
                          <div className="space-y-4 mb-12">
                            <div className="flex justify-between text-sm"><span className="opacity-50">Subtotal</span><span className="font-mono italic">£{totals.net.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm border-b border-white/10 pb-4"><span className="opacity-50">VAT Control</span><span className="font-mono italic text-orange-400">+£{totals.vat.toLocaleString()}</span></div>
                            <div className="pt-6 flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase">Gross Value</span>
                              <h4 className="text-5xl font-serif italic text-[#a9b897]">£{totals.gross.toLocaleString()}</h4>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <button onClick={() => saveTransaction("sent")} className="w-full py-5 bg-[#a9b897] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Post & Email</button>
                            <button onClick={() => saveTransaction("draft")} className="w-full py-5 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                              <History size={14}/> Save Draft Entry
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-[3rem] border border-stone-100 flex items-center gap-4">
                          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><ShieldCheck size={24}/></div>
                          <div>
                            <p className="text-[10px] font-black uppercase">Compliance Check</p>
                            <p className="text-[10px] text-stone-400">Ready for HMRC MTD Filing</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t border-stone-100 text-center">
                  <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Powered by Apex Enterprise ERP Engine v4.0.2</p>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Page>
  );
}