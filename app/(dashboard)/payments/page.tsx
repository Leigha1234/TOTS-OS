"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, Landmark, FileText, UserPlus, 
  Receipt, Users, BarChart3, Download, Search, Camera, Zap,
  ChevronRight, Mail, Calendar, Eye, EyeOff, Printer, Send
} from "lucide-react";

/* ======================================================
   1. MOCK SETTINGS SYNC (Bridge to your Settings Page)
====================================================== */
const GLOBAL_SETTINGS = {
  brand: {
    name: "Apex Strategy",
    logo: null, // This would be the URL from your Supabase bucket
    color: "#a9b897"
  },
  banking: {
    name: "APEX STRATEGY LTD",
    account: "88224411",
    sort: "00-11-22",
    bankName: "Mercury Digital"
  }
};

/* ======================================================
   2. MAIN COMMAND CENTER
====================================================== */

export default function ApexOS() {
  const [activeNode, setActiveNode] = useState("finance"); // finance | hr | intelligence
  const [docType, setDocType] = useState("invoice"); // invoice | quote | expense | payslip
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // State for the Finance Engine
  const [items, setItems] = useState([{ id: 1, desc: "Technical Architecture Review", qty: 1, rate: 2500 }]);
  
  // State for HR Engine
  const [selectedEmployee, setSelectedEmployee] = useState({
    name: "Sarah Chen",
    role: "Lead Engineer",
    salary: 85000,
    month: "April 2026"
  });

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-stone-900 font-sans">
      
      {/* LEFT NAVIGATION */}
      <aside className="w-20 lg:w-72 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl shadow-xl">A</div>
            <div className="hidden lg:flex flex-col leading-none">
                <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Command Center</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: "finance", icon: <Receipt size={18}/>, label: "Finance" },
              { id: "hr", icon: <Users size={18}/>, label: "Human Resources" },
              { id: "intelligence", icon: <BarChart3 size={18}/>, label: "Intelligence" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNode(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                  activeNode === item.id 
                  ? "bg-stone-900 text-[#a9b897] shadow-lg" 
                  : "text-stone-400 hover:bg-stone-50"
                }`}
              >
                {item.icon} <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* INPUT COLUMN (Left Half) */}
        <section className={`flex-1 overflow-y-auto p-12 transition-all duration-500 ${isPreviewOpen ? 'max-w-[50%]' : 'max-w-full'}`}>
          <header className="mb-12 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-serif italic text-stone-900 capitalize">{activeNode}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Active Working Session</p>
            </div>
            <button 
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className="flex items-center gap-3 px-6 py-3 bg-stone-100 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
                {isPreviewOpen ? <EyeOff size={14}/> : <Eye size={14}/>} {isPreviewOpen ? "Hide Preview" : "Show Preview"}
            </button>
          </header>

          {activeNode === "finance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
              <div className="flex gap-3 bg-stone-100 p-2 rounded-2xl w-fit">
                {["invoice", "quote", "expense"].map(t => (
                  <button 
                    key={t} onClick={() => setDocType(t)}
                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${docType === t ? "bg-white shadow-sm" : "text-stone-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-stone-100 rounded-[3rem] p-10 shadow-sm space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Ledger Entry</h3>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4">
                    <input 
                      className="col-span-8 h-14 bg-stone-50 rounded-2xl px-6 text-sm italic font-serif outline-none border border-transparent focus:border-[#a9b897]" 
                      value={item.desc}
                      onChange={(e) => {
                        const n = [...items]; n[idx].desc = e.target.value; setItems(n);
                      }}
                    />
                    <input 
                      type="number" className="col-span-4 h-14 bg-stone-50 rounded-2xl text-center font-bold text-xs outline-none" 
                      value={item.rate}
                      onChange={(e) => {
                        const n = [...items]; n[idx].rate = parseFloat(e.target.value); setItems(n);
                      }}
                    />
                  </div>
                ))}
                <button onClick={() => setItems([...items, {id:Date.now(), desc:"", qty:1, rate:0}])} className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">+ Add Row</button>
              </div>
            </div>
          )}

          {activeNode === "hr" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
               <button onClick={() => setDocType("payslip")} className="px-6 py-2 bg-stone-900 text-[#a9b897] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Generate Payslip</button>
               <div className="bg-white border border-stone-100 rounded-[3rem] p-10 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Employee Data</h3>
                  <input className="w-full h-14 bg-stone-50 rounded-2xl px-6" value={selectedEmployee.name} onChange={e => setSelectedEmployee({...selectedEmployee, name: e.target.value})} />
                  <input className="w-full h-14 bg-stone-50 rounded-2xl px-6" value={selectedEmployee.salary} type="number" onChange={e => setSelectedEmployee({...selectedEmployee, salary: parseInt(e.target.value)})} />
               </div>
            </div>
          )}
        </section>

        {/* PREVIEW COLUMN (Right Half) */}
        {isPreviewOpen && (
          <section className="flex-1 bg-stone-200/30 p-12 overflow-y-auto border-l border-stone-100 flex justify-center items-start animate-in fade-in slide-in-from-right-8 duration-700">
            
            {/* THE "SHEET" */}
            <div id="capture-area" className="w-full max-w-[595px] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm min-h-[842px] p-16 flex flex-col relative overflow-hidden">
                
                {/* SETTINGS DATA: LOGO */}
                <div className="flex justify-between items-start mb-20">
                    <div className="w-24 h-24 bg-stone-900 rounded-3xl flex items-center justify-center text-[#a9b897] font-serif italic text-3xl">
                        {GLOBAL_SETTINGS.brand.name[0]}
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-serif italic text-stone-900 capitalize">{docType}</h2>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">No. APX-00{docType === 'payslip' ? '88' : '41'}</p>
                    </div>
                </div>

                {docType !== "payslip" ? (
                   <>
                    <div className="grid grid-cols-2 gap-10 mb-16">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-2">Issued From</p>
                            <p className="text-[10px] font-bold uppercase">{GLOBAL_SETTINGS.brand.name}</p>
                            <p className="text-[10px] text-stone-400">London HQ / United Kingdom</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-2">Attention To</p>
                            <p className="text-[10px] font-bold uppercase">Client Entity</p>
                            <p className="text-[10px] text-stone-400">Project Workspace Delta</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <table className="w-full mb-10">
                            <thead className="border-b border-stone-100">
                                <tr className="text-left text-[8px] font-black uppercase tracking-widest text-stone-300">
                                    <th className="pb-4">Description</th>
                                    <th className="pb-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-6 text-sm font-serif italic">{item.desc}</td>
                                        <td className="py-6 text-sm font-bold text-right">£{item.rate.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-10 border-t-2 border-stone-900 flex justify-between items-end">
                        <div className="space-y-4">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">Settlement Logic</p>
                            {/* SETTINGS DATA: BANKING */}
                            <div className="text-[9px] font-bold uppercase space-y-1">
                                <p>{GLOBAL_SETTINGS.banking.name}</p>
                                <p>{GLOBAL_SETTINGS.banking.bankName}</p>
                                <p>ACC: {GLOBAL_SETTINGS.banking.account} / SORT: {GLOBAL_SETTINGS.banking.sort}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-1">Total Balance</p>
                            <p className="text-4xl font-serif italic">£{items.reduce((a,b)=>a+b.rate,0).toLocaleString()}</p>
                        </div>
                    </div>
                   </>
                ) : (
                    <div className="space-y-12">
                        <div className="bg-stone-50 p-8 rounded-3xl flex justify-between items-center">
                            <div>
                                <p className="text-[8px] font-black uppercase text-stone-300 tracking-widest mb-1">Employee</p>
                                <p className="text-lg font-serif italic">{selectedEmployee.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-stone-300 tracking-widest mb-1">Period</p>
                                <p className="text-sm font-bold">{selectedEmployee.month}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs py-2 border-b border-stone-100">
                                <span>Basic Salary</span>
                                <span className="font-bold">£{(selectedEmployee.salary / 12).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs py-2 border-b border-stone-100 text-red-400">
                                <span>PAYE Income Tax (Est)</span>
                                <span className="font-bold">-£{(selectedEmployee.salary / 12 * 0.2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-serif italic pt-8">
                                <span>Net Pay</span>
                                <span className="text-stone-900">£{(selectedEmployee.salary / 12 * 0.75).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* WATERMARK */}
                <div className="absolute -bottom-10 -right-10 opacity-5 rotate-12">
                    <Zap size={300} />
                </div>
            </div>

            {/* PREVIEW ACTIONS */}
            <div className="fixed bottom-12 flex gap-4">
                <button className="bg-stone-900 text-[#a9b897] p-5 rounded-full shadow-2xl hover:scale-110 transition-all"><Printer size={20}/></button>
                <button className="bg-[#a9b897] text-stone-900 p-5 rounded-full shadow-2xl hover:scale-110 transition-all"><Send size={20}/></button>
                <button className="bg-white text-stone-900 p-5 rounded-full shadow-2xl hover:scale-110 transition-all border border-stone-200"><Download size={20}/></button>
            </div>

          </section>
        )}
      </main>
    </div>
  );
}