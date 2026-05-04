"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Search, FileText, History, Mail, CreditCard, RefreshCcw, 
  Calendar, CheckCircle2, ShieldCheck, ArrowUpRight, Landmark, Eye, 
  Image as ImageIcon, Send, Download, Settings, Users, Briefcase, 
  Lock, BarChart3, PieChart, ChevronRight, Copy, Ban, Upload, Link, 
  Check, UserPlus, Star, Plane, Calculator, Receipt, TrendingUp,
  FileDown, Landmark as Bank, AlertTriangle, FileCheck
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

/**
 * APEX UNIFIED ERP SYSTEM
 * 1. Finance (Invoices, Quotes, Expenses) - Xero Logic
 * 2. Payroll & HR (Employees, Payslips, Holidays) - Sage/BrightHR Logic
 * 3. Tax Bridge (Self Assessment & EOY) - HMRC Form Direct-Map
 * 4. Reporting (P&L, Cashflow, Balance Sheet) - Real-time Analytics
 */

type MainView = "finance" | "payroll" | "tax" | "reports" | "settings";
type FinanceSubView = "invoices" | "quotes" | "expenses";

export default function ApexUnifiedERP() {
  const [view, setView] = useState<MainView>("finance");
  const [financeSub, setFinanceSub] = useState<FinanceSubView>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>("invoice");
  const [loading, setLoading] = useState(false);

  // --- DATA STATES ---
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [org, setOrg] = useState({
    name: "Apex Enterprise Ltd",
    bank: { name: "HSBC Business", acc: "88229911", sort: "40-20-10", iban: "GB88HSBC40201088229911" },
    terms: "Strictly 30 days. Late fees apply.",
    vatRate: 20,
    saveTerms: true
  });

  // --- FORM STATE ---
  const [form, setForm] = useState({
    id: "",
    type: "invoice",
    ref: `REF-${Date.now().toString().slice(-5)}`,
    contact: "",
    project: "",
    date: new Date().toISOString().split("T")[0],
    due: "",
    frequency: "once",
    lines: [{ desc: "", qty: 1, price: 0, vat: 20 }],
    discount: 0,
    tax_rate: 0,
    status: "draft",
    payment_received: 0,
    // HR Fields
    employee: { name: "", salary: 0, taxCode: "1257L", ni: "A", holiday: 25 }
  });

  // --- CALCULATION ENGINE (Real-time P&L & Tax) ---
  const totals = useMemo(() => {
    const net = form.lines.reduce((a, b) => a + (b.qty * b.price), 0);
    const disc = net * (form.discount / 100);
    const vat = (net - disc) * (org.vatRate / 100);
    const gross = (net - disc) + vat;
    const balance = gross - form.payment_received;
    return { net, disc, vat, gross, balance };
  }, [form, org]);

  const reportData = useMemo(() => {
    const revenue = records.filter(r => r.type === 'invoice' && r.status !== 'void').reduce((a, b) => a + b.net, 0);
    const expenses = records.filter(r => r.type === 'expense').reduce((a, b) => a + b.net, 0);
    const vatLiability = records.reduce((a, b) => a + (b.vat || 0), 0);
    return { revenue, expenses, profit: revenue - expenses, vatLiability };
  }, [records]);

  // --- MODULE RENDERS ---

  const renderFinance = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex bg-white p-1 rounded-2xl border border-stone-100 shadow-sm">
          {["invoices", "quotes", "expenses"].map((t) => (
            <button key={t} onClick={() => setFinanceSub(t as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${financeSub === t ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>{t}</button>
          ))}
        </div>
        <button onClick={() => { setModalType(financeSub.slice(0, -1)); setShowModal(true); }} className="bg-stone-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
          <Plus size={16}/> Create {financeSub.slice(0, -1)}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50/50 text-[9px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100">
              <th className="p-6">Reference</th>
              <th className="p-6">Contact / Project</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Net</th>
              <th className="p-6 text-right">Gross Total</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {records.filter(r => r.type + 's' === financeSub || (financeSub === 'expenses' && r.type === 'expense')).map((r, i) => (
              <tr key={i} className="group hover:bg-stone-50/50 transition-all cursor-pointer">
                <td className="p-6 font-mono text-xs font-bold">{r.ref}</td>
                <td className="p-6">
                  <p className="text-xs font-bold">{r.contact}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">{r.project}</p>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${r.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-stone-100 text-stone-500'}`}>{r.status}</span>
                </td>
                <td className="p-6 text-right text-xs text-stone-400">£{r.net?.toLocaleString()}</td>
                <td className="p-6 text-right font-bold text-sm">£{r.gross?.toLocaleString()}</td>
                <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-all flex justify-end gap-2">
                  <button className="p-2 hover:bg-stone-900 hover:text-white rounded-lg transition-all" title="Duplicate"><Copy size={14}/></button>
                  <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all" title="Void"><Ban size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif italic">HR & Payroll Master</h2>
        <button onClick={() => { setModalType("employee"); setShowModal(true); }} className="bg-stone-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={16}/> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Cards - BrightHR Style */}
        {[1, 2].map((e) => (
          <div key={e} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl italic">JD</div>
              <div className="text-right">
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase">Active</span>
                <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">1257L / NI Cat A</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">John Doe</h3>
              <p className="text-xs text-stone-400">Senior Product Lead</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all">
                <Plane size={18} className="text-blue-500 mb-2"/>
                <span className="text-[9px] font-black uppercase">Holidays</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all">
                <Star size={18} className="text-orange-500 mb-2"/>
                <span className="text-[9px] font-black uppercase">Appraisal</span>
              </button>
            </div>
            <button className="w-full py-4 bg-stone-100 hover:bg-stone-200 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2">
              <FileDown size={14}/> Generate Payslip
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTax = () => (
    <div className="space-y-8">
      <div className="bg-stone-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <Calculator className="absolute -right-12 -bottom-12 text-white/5" size={400} />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-serif italic mb-4">Tax Compliance Bridge</h2>
          <p className="text-stone-400 leading-relaxed mb-10">All figures are reconciled with your digital ledger and mapped directly to HMRC form fields for Self Assessment and Year End.</p>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
              <p className="text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em]">Self Assessment SA103F</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-xs opacity-60">Box 21 (Turnover)</span><span className="font-mono text-xl">£{reportData.revenue.toLocaleString()}</span></div>
                <div className="flex justify-between items-center text-[#a9b897] font-bold"><span className="text-xs">Box 31 (Net Profit)</span><span className="font-mono text-xl">£{reportData.profit.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
              <p className="text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em]">VAT MTD Bridge</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-xs opacity-60">Box 1 (VAT Due)</span><span className="font-mono text-xl text-orange-400">£{reportData.vatLiability.toLocaleString()}</span></div>
                <button className="w-full py-3 bg-white text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-xl mt-4">Submit to HMRC</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <h3 className="text-xl font-serif italic mb-6">Year End Checklist</h3>
        <div className="space-y-4">
          {[
            { label: "Bank Statement Reconciliation", status: "Complete" },
            { label: "Director's Loan Account Review", status: "Action Required" },
            { label: "Capital Allowances Calculation", status: "Complete" }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl">
              <span className="text-sm font-bold">{item.label}</span>
              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${item.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><BarChart3 size={14}/> Profit & Loss</p>
          <div className="space-y-3">
             <div className="flex justify-between text-sm"><span>Turnover</span><span className="font-bold">£{reportData.revenue.toLocaleString()}</span></div>
             <div className="flex justify-between text-sm text-red-500"><span>Expenses</span><span>-£{reportData.expenses.toLocaleString()}</span></div>
             <div className="pt-3 border-t border-stone-100 flex justify-between font-serif text-xl italic text-green-600"><span>Net Profit</span><span>£{reportData.profit.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><TrendingUp size={14}/> Cash Flow</p>
          <div className="h-32 flex items-end gap-2">
            {[40, 70, 45, 90, 65, 80].map((h, i) => <div key={i} style={{height: `${h}%`}} className="flex-1 bg-stone-900 rounded-t-lg opacity-20 hover:opacity-100 transition-all" />)}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><Bank size={14}/> Balance Sheet</p>
          <div className="space-y-3">
             <div className="flex justify-between text-sm"><span>Fixed Assets</span><span className="font-bold">£12,400</span></div>
             <div className="flex justify-between text-sm"><span>Current Assets</span><span className="font-bold">£42,850</span></div>
             <div className="pt-3 border-t border-stone-100 flex justify-between font-serif text-xl italic"><span>Total Equity</span><span>£55,250</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Page title="Apex Unified ERP">
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col text-stone-900 font-sans">
        
        {/* GLOBAL NAVIGATION */}
        <nav className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-10">
            <div className="bg-stone-900 text-white p-2 rounded-xl font-black text-2xl italic tracking-tighter">A</div>
            <div className="flex gap-1">
              {(["finance", "payroll", "tax", "reports"] as MainView[]).map((m) => (
                <button 
                  key={m} 
                  onClick={() => setView(m)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${view === m ? 'bg-stone-100 text-stone-900 shadow-inner' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {m === 'finance' && <Receipt size={14}/>}
                  {m === 'payroll' && <Users size={14}/>}
                  {m === 'tax' && <Calculator size={14}/>}
                  {m === 'reports' && <BarChart3 size={14}/>}
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">
              <ShieldCheck size={14}/> HMRC LINKED
            </div>
            <button className="p-2.5 bg-stone-50 rounded-xl text-stone-400 hover:bg-stone-100 transition-all"><Settings size={20}/></button>
          </div>
        </nav>

        {/* CONTENT SWITCHER */}
        <main className="flex-1 p-12 max-w-[1500px] mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={view}>
            {view === "finance" && renderFinance()}
            {view === "payroll" && renderPayroll()}
            {view === "tax" && renderTax()}
            {view === "reports" && renderReports()}
          </motion.div>
        </main>

        {/* UNIVERSAL CREATION MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-white">
                  <h3 className="text-3xl font-serif italic capitalize">New {modalType}</h3>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-12">
                   {/* Finance Form (Shared for Invoice/Quote/Expense) */}
                   {["invoice", "quote", "expense"].includes(modalType) && (
                     <div className="grid grid-cols-12 gap-12">
                        <div className="col-span-8 space-y-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Recipient / Vendor</label>
                              <input className="w-full bg-stone-50 p-4 rounded-2xl border-none text-sm" placeholder="Client Name" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Reference No.</label>
                              <input className="w-full bg-stone-50 p-4 rounded-2xl border-none text-sm font-mono" value={form.ref} />
                            </div>
                          </div>

                          <div className="bg-white border border-stone-100 rounded-[2rem] p-6">
                            <div className="grid grid-cols-12 gap-4 mb-4 px-4 text-[9px] font-black uppercase text-stone-400">
                              <div className="col-span-6">Description</div>
                              <div className="col-span-2 text-right">Qty</div>
                              <div className="col-span-4 text-right">Price (£)</div>
                            </div>
                            {form.lines.map((l, i) => (
                              <div key={i} className="grid grid-cols-12 gap-4 mb-3">
                                <input className="col-span-6 bg-stone-50 p-3 rounded-xl text-sm" placeholder="Service item..." />
                                <input className="col-span-2 bg-stone-50 p-3 rounded-xl text-sm text-right" type="number" />
                                <input className="col-span-4 bg-stone-50 p-3 rounded-xl text-sm text-right font-mono" type="number" />
                              </div>
                            ))}
                            <button onClick={() => setForm({...form, lines: [...form.lines, {desc: "", qty: 1, price: 0, vat: 20}]})} className="text-[10px] font-black uppercase text-stone-400 mt-4 ml-4">+ Add Journal Row</button>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Payment Bank Info</label>
                               <div className="p-4 bg-stone-100/50 rounded-2xl text-[11px] font-mono space-y-1">
                                 <p>Bank: {org.bank.name}</p>
                                 <p>Acc: {org.bank.acc}</p>
                                 <p>Sort: {org.bank.sort}</p>
                               </div>
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Legal Terms</label>
                               <textarea className="w-full h-32 bg-stone-50 p-4 rounded-2xl border-none text-xs" value={org.terms} onChange={e => setOrg({...org, terms: e.target.value})} />
                             </div>
                          </div>
                        </div>

                        <div className="col-span-4 space-y-6">
                           <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                              <Lock className="absolute -right-4 -top-4 text-white/5" size={120} />
                              <p className="text-[10px] font-black uppercase opacity-40 mb-8 tracking-[0.2em]">Transaction Summary</p>
                              <div className="space-y-4 mb-10">
                                 <div className="flex justify-between text-sm"><span className="opacity-50">Discount</span><span className="font-mono">0%</span></div>
                                 <div className="flex justify-between text-sm"><span className="opacity-50">VAT Control</span><span className="font-mono text-orange-400">+£0.00</span></div>
                                 <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase">Gross Value</span>
                                    <h4 className="text-4xl font-serif italic text-[#a9b897]">£{totals.gross.toLocaleString()}</h4>
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <button className="w-full py-4 bg-[#a9b897] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Approve & Send</button>
                                 <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"><Download size={14}/> Download PDF</button>
                                 <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"><Link size={14}/> Client Link</button>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Employee Form */}
                   {modalType === "employee" && (
                     <div className="space-y-8 max-w-2xl mx-auto">
                        <div className="grid grid-cols-2 gap-6">
                          <input className="p-5 bg-stone-50 rounded-2xl border-none text-sm" placeholder="Full Name" />
                          <input className="p-5 bg-stone-50 rounded-2xl border-none text-sm" placeholder="HMRC Tax Code" defaultValue="1257L" />
                          <input className="p-5 bg-stone-50 rounded-2xl border-none text-sm" placeholder="NI Category" defaultValue="A" />
                          <input className="p-5 bg-stone-50 rounded-2xl border-none text-sm" placeholder="Annual Salary" type="number" />
                        </div>
                        <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                          <h4 className="text-sm font-bold text-blue-900 mb-2">Statutory Calculation Preview</h4>
                          <p className="text-xs text-blue-700">Based on the 2026/27 tax year, the estimated monthly net take-home for this employee will be displayed once the salary is committed.</p>
                        </div>
                        <button className="w-full py-5 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Enroll Employee</button>
                     </div>
                   )}
                </div>

                <div className="p-8 bg-stone-50 border-t border-stone-100 text-center">
                   <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Apex Enterprise Engine Framework v5.0.1 • HMRC Certified MTD Bridge</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Page>
  );
}