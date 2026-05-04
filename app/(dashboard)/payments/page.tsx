"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
  Plus, Trash2, Landmark, FileText, UserPlus, 
  Percent, Receipt, Users, Calculator, BarChart3, 
  Upload, X, Check, Save, Download, Search, Camera, Zap,
  ChevronRight, ArrowUpRight, ShieldCheck, Globe, Mail, 
  Calendar, Briefcase, TrendingUp, PiggyBank, FileStack
} from "lucide-react";

/* ======================================================
   1. TYPES & MOCK DATA ENGINE
====================================================== */

const INITIAL_DATA = {
  clients: [
    { id: "c1", name: "Anthropic Research", email: "billing@anthropic.com" },
    { id: "c2", name: "Design Systems Ltd", email: "finance@ds.io" }
  ],
  employees: [
    { id: "e1", name: "Sarah Chen", role: "Lead Engineer", salary: 85000, holidayLeft: 12, lastAppraisal: "2025-11-10" },
    { id: "e2", name: "Marcus Vane", role: "UX Designer", salary: 52000, holidayLeft: 18, lastAppraisal: "2026-01-15" }
  ],
  expenses: [
    { id: 1, category: "Software", amount: 120, date: "2026-04-12", status: "Reconciled" },
    { id: 2, category: "Hardware", amount: 1500, date: "2026-04-15", status: "Pending" }
  ]
};

/* ======================================================
   2. MAIN APPLICATION (THE COMMAND CENTER)
====================================================== */

export default function ApexOS() {
  const [activeTab, setActiveTab] = useState("finance");
  const [docType, setDocType] = useState("invoice"); // invoice | quote | expense

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-stone-900 font-sans selection:bg-[#a9b897]/30">
      
      {/* GLOBAL SIDEBAR */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl shadow-xl">A</div>
            <div className="flex flex-col leading-none">
                <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Command Center</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: "finance", icon: <Receipt size={18}/>, label: "Finance & Sales" },
              { id: "hr", icon: <Users size={18}/>, label: "Human Resources" },
              { id: "intelligence", icon: <BarChart3 size={18}/>, label: "Intelligence" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === item.id 
                  ? "bg-stone-900 text-[#a9b897] shadow-lg shadow-stone-200" 
                  : "text-stone-400 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-10 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-stone-900 text-[#a9b897] flex items-center justify-center font-serif italic text-xs">JD</div>
            <div className="text-[10px]">
              <p className="font-black uppercase tracking-wider text-stone-900">John Doe</p>
              <p className="text-[#a9b897] font-bold uppercase tracking-tighter">System Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-12 sticky top-0 z-50">
          <div className="flex items-center gap-4 text-stone-300">
             <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 capitalize">{activeTab}</h1>
             <ChevronRight size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Node Sync Active</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-[#a9b897] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Live Server</span>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto space-y-12">
          {activeTab === "finance" && (
            <FinanceNode docType={docType} setDocType={setDocType} />
          )}
          {activeTab === "hr" && (
            <HRNode />
          )}
          {activeTab === "intelligence" && (
            <IntelligenceNode />
          )}
        </div>
      </main>
    </div>
  );
}

/* ======================================================
   3. THE FINANCE NODE (INVOICES, QUOTES, EXPENSES)
====================================================== */

function FinanceNode({ docType, setDocType }: any) {
  const [items, setItems] = useState([{ id: 1, desc: "Professional Services", qty: 1, rate: 1200 }]);
  const [discount, setDiscount] = useState(0);

  const totals = useMemo(() => {
    const sub = items.reduce((acc, i) => acc + (i.qty * i.rate), 0);
    const tax = sub * 0.20;
    return { sub, tax, total: sub + tax - (sub * (discount/100)) };
  }, [items, discount]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Switcher Bar */}
      <div className="flex gap-4 mb-12 bg-stone-100 p-2 rounded-[2rem] w-fit">
        {["invoice", "quote", "expense"].map((t) => (
          <button 
            key={t}
            onClick={() => setDocType(t)}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              docType === t ? "bg-white shadow-sm text-stone-900" : "text-stone-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Document Canvas */}
        <div className="col-span-12 xl:col-span-8 bg-white border border-stone-100 rounded-[4rem] p-16 shadow-2xl">
          <div className="flex justify-between mb-20">
            <div className="w-32 h-32 bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300">
              <Camera size={24}/>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-serif italic mb-2 capitalize">{docType}</h2>
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">#{docType.slice(0,1).toUpperCase()}-2026-0041</p>
            </div>
          </div>

          <div className="space-y-4 mb-12">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                <input 
                  className="col-span-7 h-14 bg-stone-50 rounded-2xl px-6 text-sm italic font-serif outline-none border border-transparent focus:border-[#a9b897]/30" 
                  value={item.desc}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].desc = e.target.value;
                    setItems(newItems);
                  }}
                />
                <input 
                  type="number" 
                  className="col-span-2 h-14 bg-stone-50 rounded-2xl text-center text-xs font-bold outline-none" 
                  value={item.qty}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].qty = parseInt(e.target.value);
                    setItems(newItems);
                  }}
                />
                <input 
                  type="number" 
                  className="col-span-3 h-14 bg-stone-50 rounded-2xl text-right px-6 text-xs font-bold outline-none" 
                  value={item.rate}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].rate = parseFloat(e.target.value);
                    setItems(newItems);
                  }}
                />
              </div>
            ))}
            <button 
              onClick={() => setItems([...items, { id: Date.now(), desc: "", qty: 1, rate: 0 }])}
              className="flex items-center gap-2 text-[9px] font-black uppercase text-[#a9b897] tracking-widest pt-4"
            >
              <Plus size={14}/> Add Line Item
            </button>
          </div>

          <div className="bg-stone-900 rounded-[3rem] p-10 text-white flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Payment Terms</p>
              <p className="text-xs font-serif italic text-[#a9b897]">Net 30 Days - Bank Transfer Only</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Total Settlement</p>
              <p className="text-4xl font-serif italic text-white">£{totals.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-white border border-stone-100 rounded-[3rem] p-8 space-y-6 shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Global Actions</h4>
            <div className="space-y-3">
              <button className="w-full h-16 bg-stone-900 text-[#a9b897] rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                <Mail size={16}/> Email to Client
              </button>
              <button className="w-full h-16 bg-stone-50 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-100 transition-all">
                <Download size={16}/> Export PDF
              </button>
              <button className="w-full h-16 bg-stone-50 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-100 transition-all">
                <Save size={16}/> Save as Draft
              </button>
            </div>
          </div>

          <div className="bg-[#a9b897] rounded-[3rem] p-8 text-stone-900">
             <div className="flex items-center gap-3 mb-4">
                <Zap size={20} fill="currentColor"/>
                <span className="text-[10px] font-black uppercase tracking-widest">Automation</span>
             </div>
             <p className="text-sm font-serif italic leading-tight">This {docType} will be automatically reconciled against your tax year once posted.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   4. THE HR NODE (PAYROLL, EMPLOYEES, HOLIDAYS)
===================================================== */

function HRNode() {
  const [employees] = useState(INITIAL_DATA.employees);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payroll Card */}
        <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden">
          <Briefcase className="absolute -right-6 -bottom-6 text-stone-50" size={120} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <PiggyBank size={14}/> Monthly Payroll
          </h3>
          <p className="text-4xl font-serif italic mb-2">£14,250</p>
          <p className="text-[9px] font-black uppercase text-[#a9b897] tracking-widest mb-10">Next Run: May 28, 2026</p>
          <button className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">Execute Payroll Run</button>
        </div>

        {/* Holiday Card */}
        <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <Calendar size={14}/> Attendance Node
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif italic">Sarah Chen</span>
              <span className="text-[10px] font-bold bg-stone-50 px-3 py-1 rounded-full text-stone-400">12 Days Left</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif italic">Marcus Vane</span>
              <span className="text-[10px] font-bold bg-stone-50 px-3 py-1 rounded-full text-[#a9b897]">18 Days Left</span>
            </div>
          </div>
          <button className="w-full mt-10 py-4 border border-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-all">Book Holiday</button>
        </div>

        {/* Appraisal Card */}
        <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
            <TrendingUp size={14}/> Performance
          </h3>
          <div className="p-5 bg-[#fcfaf7] rounded-[2rem] border border-stone-100 mb-6">
            <p className="text-[9px] font-black uppercase text-stone-300 mb-2">Next Appraisal</p>
            <p className="text-sm font-serif italic">Marcus Vane — Jun 12</p>
          </div>
          <button className="w-full py-4 bg-stone-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-600">Open Appraisals</button>
        </div>
      </div>

      {/* Employee Ledger */}
      <div className="bg-white border border-stone-100 rounded-[4rem] p-16 shadow-2xl">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-serif italic">Employee Ledger</h2>
          <button className="flex items-center gap-2 px-8 py-4 bg-stone-900 text-[#a9b897] rounded-full text-[10px] font-black uppercase tracking-widest">
            <UserPlus size={16}/> New Employee
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9px] font-black uppercase text-stone-300 tracking-[0.3em]">
              <th className="pb-8">Identity</th>
              <th className="pb-8">Role</th>
              <th className="pb-8">Annual Salary</th>
              <th className="pb-8">Status</th>
              <th className="pb-8 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {employees.map((emp) => (
              <tr key={emp.id} className="group">
                <td className="py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center font-serif italic text-xs border border-stone-100">{emp.name[0]}</div>
                    <span className="text-sm font-serif italic">{emp.name}</span>
                  </div>
                </td>
                <td className="py-8 text-xs font-bold text-stone-400 uppercase tracking-tighter">{emp.role}</td>
                <td className="py-8 text-xs font-bold">£{emp.salary.toLocaleString()}</td>
                <td className="py-8">
                   <span className="px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] text-[8px] font-black uppercase rounded-full">Active</span>
                </td>
                <td className="py-8 text-right">
                  <button className="text-stone-300 hover:text-stone-900 transition-colors">View Payslips</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================================================
   5. THE INTELLIGENCE NODE (REPORTS & TAX)
===================================================== */

function IntelligenceNode() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Annual Revenue", val: "£142,500", trend: "+12%" },
          { label: "Tax Liability", val: "£28,500", trend: "Estimated" },
          { label: "Expenses YTD", val: "£4,210", trend: "-5%" },
          { label: "Net Profit", val: "£109,790", trend: "Optimal" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm">
            <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest mb-4">{stat.label}</p>
            <p className="text-3xl font-serif italic text-stone-900 mb-2">{stat.val}</p>
            <p className="text-[8px] font-black uppercase text-[#a9b897] tracking-widest">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-stone-900 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Calculator size={120} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-12">Tax Readiness Node</h3>
          <div className="space-y-12 relative z-10">
            <div className="flex justify-between items-end border-b border-white/10 pb-8">
              <div>
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2">Self Assessment 2026</p>
                <p className="text-5xl font-serif italic">Pending Submission</p>
              </div>
              <button className="px-10 py-5 bg-[#a9b897] text-stone-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Generate Tax Pack</button>
            </div>
            <div className="grid grid-cols-3 gap-10">
              <div>
                <p className="text-[8px] font-black uppercase text-white/40 mb-2 tracking-widest">Dividend Pool</p>
                <p className="text-xl font-serif italic text-[#a9b897]">£42,000</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-white/40 mb-2 tracking-widest">Corp Tax (Est)</p>
                <p className="text-xl font-serif italic text-[#a9b897]">£12,400</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-white/40 mb-2 tracking-widest">VAT Returns</p>
                <p className="text-xl font-serif italic text-[#a9b897]">Quarterly Clean</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-stone-100 rounded-[4rem] p-12 shadow-xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-8">System Reports</h3>
          <div className="space-y-4">
            {[
              { label: "P&L Statement", date: "Apr 2026", icon: <FileStack size={16}/> },
              { label: "Balance Sheet", date: "Mar 2026", icon: <Receipt size={16}/> },
              { label: "Payroll History", date: "Q1 2026", icon: <Users size={16}/> },
              { label: "Expense Audit", date: "Full Year", icon: <ShieldCheck size={16}/> },
            ].map((rep, i) => (
              <button key={i} className="w-full flex items-center justify-between p-6 bg-stone-50 rounded-[2rem] hover:bg-stone-900 hover:text-[#a9b897] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="text-stone-300 group-hover:text-[#a9b897]">{rep.icon}</div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider">{rep.label}</p>
                    <p className="text-[8px] font-bold text-stone-400">{rep.date}</p>
                  </div>
                </div>
                <Download size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}