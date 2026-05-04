"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Search, FileText, History, Mail, CreditCard, RefreshCcw, 
  Calendar, CheckCircle2, ShieldCheck, ArrowUpRight, Landmark, Eye, 
  Image as ImageIcon, Send, Download, Settings, Users, Briefcase, 
  Lock, BarChart3, PieChart, ChevronRight, Copy, Ban, Upload, Link, 
  Check, UserPlus, Star, Plane, Calculator, Receipt, TrendingUp
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type Module = "finance" | "hr" | "reports" | "tax";
type DocType = "invoice" | "quote" | "expense";
type DocStatus = "draft" | "sent" | "paid" | "void" | "approved";

export default function ApexUnifiedERP() {
  const [activeModule, setActiveModule] = useState<Module>("finance");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<DocType | "employee" | "payslip">("invoice");
  
  // --- CORE DATA STATE ---
  const [docs, setDocs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [org, setOrg] = useState({
    name: "Apex Enterprise",
    bank: { name: "Business Bank", acc: "12345678", sort: "00-00-00" },
    terms: "Payment due within 30 days.",
    vatRegistered: true
  });

  // --- FORM STATE ---
  const [form, setForm] = useState<any>({
    ref: "",
    contact: "",
    project: "",
    lines: [{ desc: "", qty: 1, price: 0, vat: 20 }],
    discount: 0,
    tax_rate: 0,
    frequency: "once",
    status: "draft",
    // HR Specific
    employeeName: "",
    role: "",
    salary: 0,
    holidayEntitlement: 25,
  });

  // --- CALCULATIONS (Xero-Style) ---
  const totals = useMemo(() => {
    const sub = form.lines?.reduce((a: number, b: any) => a + (b.qty * b.price), 0) || 0;
    const disc = sub * (form.discount / 100);
    const vat = (sub - disc) * 0.20;
    return { sub, disc, vat, gross: sub - disc + vat };
  }, [form]);

  // --- RENDER MODULES ---

  const renderFinance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-serif italic">Ledger & Billing</h2>
        <div className="flex gap-2">
          {["invoice", "quote", "expense"].map((t) => (
            <button key={t} onClick={() => { setModalType(t as any); setShowModal(true); }} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Plus size={14}/> New {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr className="text-[9px] font-black uppercase text-stone-400 p-6">
              <th className="p-6">Type</th>
              <th className="p-6">Reference</th>
              <th className="p-6">Contact</th>
              <th className="p-6 text-right">Amount</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {docs.map((d, i) => (
              <tr key={i} className="text-xs group hover:bg-stone-50/50">
                <td className="p-6 capitalize font-bold">{d.type}</td>
                <td className="p-6 font-mono">{d.ref}</td>
                <td className="p-6">{d.contact}</td>
                <td className="p-6 text-right font-bold">£{d.gross?.toLocaleString()}</td>
                <td className="p-6 text-center">
                  <span className="px-2 py-1 bg-stone-100 rounded-full text-[8px] uppercase font-black">{d.status}</span>
                </td>
                <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2 hover:bg-stone-100 rounded-lg"><Copy size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHR = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-serif italic">Human Resources</h2>
        <button onClick={() => { setModalType("employee"); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={14}/> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BrightHR Style Employee Cards */}
        {[1, 2].map((e) => (
          <div key={e} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-4">
            <div className="flex justify-between">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold">JD</div>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black">IN OFFICE</span>
            </div>
            <div>
              <h4 className="font-bold">John Doe</h4>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Senior Developer</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 bg-stone-50 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1"><Plane size={12}/> Holidays</button>
              <button className="py-2 bg-stone-50 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1"><Star size={12}/> Appraisal</button>
            </div>
            <button onClick={() => { setModalType("payslip"); setShowModal(true); }} className="w-full py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase">Generate Payslip</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif italic">Financial Intelligence</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
          <h4 className="text-[10px] font-black uppercase mb-6 flex items-center gap-2"><BarChart3 size={14}/> Profit & Loss (Draft)</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><span>Turnover</span><span className="font-bold">£45,000.00</span></div>
            <div className="flex justify-between text-sm text-red-500"><span>Cost of Sales</span><span>(£12,000.00)</span></div>
            <hr />
            <div className="flex justify-between text-lg font-serif italic"><span>Gross Profit</span><span>£33,000.00</span></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
          <h4 className="text-[10px] font-black uppercase mb-6 flex items-center gap-2"><PieChart size={14}/> Balance Sheet</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><span>Bank Accounts</span><span className="font-bold">£22,450.00</span></div>
            <div className="flex justify-between text-sm"><span>Accounts Receivable</span><span className="font-bold">£8,200.00</span></div>
            <hr />
            <div className="flex justify-between text-lg font-serif italic"><span>Total Assets</span><span>£30,650.00</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTax = () => (
    <div className="bg-stone-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
      <Calculator className="absolute -right-8 -bottom-8 opacity-5" size={300} />
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="text-4xl font-serif italic">HMRC Filing Bridge</h2>
          <p className="text-stone-400 text-sm mt-2">Self-Assessment & Year End (2025/26)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-black uppercase opacity-50 mb-2">Total Taxable Profit</p>
            <p className="text-3xl font-serif">£32,140.00</p>
            <p className="text-[9px] text-green-400 mt-2 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> READY FOR FORM SA100</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-black uppercase opacity-50 mb-2">VAT Liability (MTD)</p>
            <p className="text-3xl font-serif">£4,210.00</p>
            <p className="text-[9px] text-orange-400 mt-2 font-bold flex items-center gap-1"><RefreshCcw size={10}/> SUBMIT TO HMRC</p>
          </div>
          <div className="p-6 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-[10px] font-black uppercase opacity-50 mb-2">Estimated Corporation Tax</p>
            <p className="text-3xl font-serif text-[#a9b897]">£6,106.60</p>
          </div>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
          <h4 className="text-xs font-black uppercase mb-4">Field Mapping Guide</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            To file your return: Copy <strong>£32,140.00</strong> into Box 21 of the SA103F form. 
            Copy <strong>£4,210.00</strong> into your MTD gateway for the current quarter. 
            Your balance sheet is 100% reconciled as of today.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Page title="Apex Unified ERP">
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col text-stone-900 font-sans">
        
        {/* NAV BAR */}
        <nav className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-12">
            <div className="bg-stone-900 text-white p-2 rounded-lg font-black text-xl italic tracking-tighter shadow-lg">A</div>
            <div className="flex gap-2">
              {(["finance", "hr", "reports", "tax"] as Module[]).map((m) => (
                <button 
                  key={m} 
                  onClick={() => setActiveModule(m)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === m ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {m === 'finance' && <Receipt size={14} className="inline mr-2"/>}
                  {m === 'hr' && <Users size={14} className="inline mr-2"/>}
                  {m === 'reports' && <BarChart3 size={14} className="inline mr-2"/>}
                  {m === 'tax' && <Calculator size={14} className="inline mr-2"/>}
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase">{org.name}</p>
              <p className="text-[9px] text-green-500 font-bold flex items-center justify-end gap-1"><ShieldCheck size={10}/> COMPLIANT</p>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-12 max-w-[1400px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === "finance" && renderFinance()}
              {activeModule === "hr" && renderHR()}
              {activeModule === "reports" && renderReports()}
              {activeModule === "tax" && renderTax()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* UNIFIED CREATION MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="text-2xl font-serif italic capitalize">New {modalType}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-50 rounded-full"><X/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 space-y-8">
                  {/* DYNAMIC FORM RENDERING BASED ON modalType */}
                  {["invoice", "quote", "expense"].includes(modalType) && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                         <input className="p-4 bg-stone-50 rounded-2xl text-sm" placeholder="Contact Name" onChange={e => setForm({...form, contact: e.target.value})} />
                         <input className="p-4 bg-stone-50 rounded-2xl text-sm" placeholder="Reference No." value={`INV-${Date.now().toString().slice(-4)}`} />
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase text-stone-400">Line Items</p>
                         {form.lines.map((l: any, i: number) => (
                           <div key={i} className="flex gap-2">
                             <input className="flex-1 p-4 bg-stone-50 rounded-xl text-sm" placeholder="Description" />
                             <input className="w-20 p-4 bg-stone-50 rounded-xl text-sm text-right" placeholder="Qty" type="number" />
                             <input className="w-32 p-4 bg-stone-50 rounded-xl text-sm text-right" placeholder="Price" type="number" />
                           </div>
                         ))}
                       </div>
                       <div className="p-8 bg-stone-900 text-white rounded-3xl flex justify-between items-center">
                         <span className="text-xs font-black uppercase opacity-50">Estimated Total (Inc. VAT)</span>
                         <span className="text-4xl font-serif italic text-[#a9b897]">£{totals.gross.toLocaleString()}</span>
                       </div>
                    </div>
                  )}

                  {modalType === "employee" && (
                    <div className="grid grid-cols-2 gap-6">
                      <input className="p-4 bg-stone-50 rounded-xl text-sm" placeholder="Full Name" />
                      <input className="p-4 bg-stone-50 rounded-xl text-sm" placeholder="Job Title" />
                      <input className="p-4 bg-stone-50 rounded-xl text-sm" placeholder="Annual Salary (£)" type="number" />
                      <input className="p-4 bg-stone-50 rounded-xl text-sm" placeholder="Tax Code (e.g. 1257L)" />
                    </div>
                  )}
                </div>

                <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                  <button className="px-8 py-3 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Draft</button>
                  <button className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Commit & Sync</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Page>
  );
}