"use client";

import React, { useReducer, useState, useRef, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, Landmark, ImageIcon, FileText, UserPlus, 
  Percent, Receipt, Users, Calculator, BarChart3, 
  Upload, X, Check, Save, Download, Search, Camera, Zap,
  ChevronRight, ArrowUpRight, ShieldCheck, Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase-client"; 

/* ======================================================
   1. CORE ENGINE & STATE TYPES
====================================================== */

const initialState = {
  contacts: [
    { id: "c1", name: "Anthropic Research", email: "billing@anthropic.com" },
    { id: "c2", name: "Design Systems Ltd", email: "finance@ds.io" }
  ],
  projects: [
    { id: "p1", name: "AI Integration Phase 1", clientId: "c1" },
    { id: "p2", name: "Brand Guidelines", clientId: "c2" },
    { id: "p3", name: "Claude API Deployment", clientId: "c1" }
  ]
};

/* ======================================================
   2. MAIN APPLICATION COMPONENT
====================================================== */

export default function ApexFinancePro() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-stone-900 font-sans selection:bg-[#a9b897]/30">
      
      {/* SIDE NAVIGATION */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl shadow-xl">A</div>
            <div className="flex flex-col leading-none">
                <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Financial Node</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: "dashboard", icon: <BarChart3 size={18}/>, label: "Intelligence" },
              { id: "invoices", icon: <Receipt size={18}/>, label: "Invoice Manager" },
              { id: "payroll", icon: <Users size={18}/>, label: "Human Resources" },
              { id: "reports", icon: <Calculator size={18}/>, label: "Tax Ledger" },
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
        
        <div className="mt-auto p-10 border-t border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-serif italic">JD</div>
            <div className="text-[10px]">
              <p className="font-black uppercase tracking-wider">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[#a9b897] font-bold">ELITE ACCESS</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-24">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-12 sticky top-0 z-20">
          <div className="flex items-center gap-4 text-stone-300">
             <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 capitalize">{activeTab}</h1>
             <ChevronRight size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Active Session</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input placeholder="Search Ledger..." className="pl-12 pr-6 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs w-72 focus:outline-none focus:ring-4 focus:ring-[#a9b897]/10 transition-all" />
            </div>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto">
          {activeTab === "invoices" ? (
            <InvoiceCanvas dataEngine={initialState} />
          ) : (
            <div className="h-[60vh] border-2 border-dashed border-stone-200 rounded-[3rem] flex flex-col items-center justify-center text-stone-300 gap-4">
              <Zap size={48} strokeWidth={1} className="opacity-20 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node Under Maintenance</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ======================================================
   3. THE INVOICE CANVAS COMPONENT
====================================================== */

function InvoiceCanvas({ dataEngine }: { dataEngine: any }) {
  const [saving, setSaving] = useState(false);
  const [invData, setInvData] = useState({
    number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    logo: null as string | null,
    selectedClientId: "",
    selectedProjectId: "",
    vatEnabled: true,
    discount: 0,
    bank: { name: "", account: "", sort: "" },
    attachments: [] as File[],
    lineItems: [{ id: 1, desc: "Technical Strategy Consulting", qty: 1, rate: 2500 }]
  });

  const logoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // REACTIVE CALCULATION ENGINE
  const totals = useMemo(() => {
    const subtotal = invData.lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
    const discVal = subtotal * (invData.discount / 100);
    const net = subtotal - discVal;
    const vat = invData.vatEnabled ? net * 0.20 : 0;
    return { subtotal, discVal, net, vat, total: net + vat };
  }, [invData]);

  const handlePostToLedger = async () => {
    setSaving(true);
    // Logic for Supabase post would go here
    setTimeout(() => {
      setSaving(false);
      alert("Ledger Entry Synchronized Successfully.");
    }, 1500);
  };

  const updateLine = (id: number, key: string, val: any) => {
    setInvData({
      ...invData,
      lineItems: invData.lineItems.map(item => item.id === id ? { ...item, [key]: val } : item)
    });
  };

  return (
    <div className="grid grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* PRIMARY WORKSPACE */}
      <div className="col-span-12 xl:col-span-8 space-y-8">
        <div className="bg-white border border-stone-100 rounded-[4rem] shadow-2xl shadow-stone-200/40 p-16 relative">
          
          {/* HEADER / IDENTITY */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div 
              onClick={() => logoInput.current?.click()}
              className="group relative w-44 h-44 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-[#a9b897] transition-all overflow-hidden"
            >
              {invData.logo ? (
                <img src={invData.logo} className="w-full h-full object-contain" alt="Identity" />
              ) : (
                <>
                  <Camera size={32} className="text-stone-300 group-hover:text-[#a9b897] transition-colors" />
                  <span className="text-[9px] font-black text-stone-300 mt-4 tracking-widest uppercase">Brand Identity</span>
                </>
              )}
              <input type="file" ref={logoInput} hidden accept="image/*" onChange={(e) => {
                if (e.target.files?.[0]) setInvData({...invData, logo: URL.createObjectURL(e.target.files[0])})
              }}/>
            </div>

            <div className="text-right flex flex-col items-end">
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] mb-4">Document Hash</p>
              <input 
                className="text-5xl font-serif italic text-right bg-transparent focus:outline-none border-b border-stone-50 focus:border-stone-200 transition-all w-72"
                value={invData.number}
                onChange={(e) => setInvData({...invData, number: e.target.value})}
              />
            </div>
          </div>

          {/* CRM DATA BRIDGE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-4">Client Entity</label>
              <div className="flex gap-3">
                <select 
                  className="flex-1 h-16 bg-stone-50 border border-stone-100 rounded-3xl px-6 text-xs font-bold focus:bg-white transition-all appearance-none outline-none"
                  value={invData.selectedClientId}
                  onChange={(e) => setInvData({...invData, selectedClientId: e.target.value, selectedProjectId: ""})}
                >
                  <option value="">Select Client...</option>
                  {dataEngine.contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="w-16 h-16 bg-white border border-stone-100 rounded-3xl flex items-center justify-center text-stone-400 hover:text-[#a9b897] shadow-sm"><UserPlus size={20}/></button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-4">Linked Project Workspace</label>
              <select 
                className="w-full h-16 bg-stone-50 border border-stone-100 rounded-3xl px-6 text-xs font-bold disabled:opacity-20 appearance-none outline-none"
                value={invData.selectedProjectId}
                disabled={!invData.selectedClientId}
                onChange={(e) => setInvData({...invData, selectedProjectId: e.target.value})}
              >
                <option value="">Filter Projects...</option>
                {dataEngine.projects
                  .filter((p: any) => p.clientId === invData.selectedClientId)
                  .map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* LEDGER ENTRIES */}
          <div className="space-y-6 mb-16">
            <div className="grid grid-cols-12 px-8 text-[9px] font-black text-stone-300 uppercase tracking-[0.3em]">
              <div className="col-span-6">Scope of Services</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3 text-right">Rate (£)</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {invData.lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center group">
                  <input 
                    placeholder="E.g. Technical Architecture Review" 
                    className="col-span-6 h-16 bg-stone-50 border border-stone-100 rounded-[1.5rem] px-6 text-sm font-serif italic focus:bg-white focus:ring-4 focus:ring-[#a9b897]/10 transition-all outline-none"
                    value={item.desc}
                    onChange={(e) => updateLine(item.id, "desc", e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="col-span-2 h-16 bg-stone-50 border border-stone-100 rounded-[1.5rem] px-4 text-xs font-bold text-center outline-none"
                    value={item.qty}
                    onChange={(e) => updateLine(item.id, "qty", parseInt(e.target.value))}
                  />
                  <input 
                    type="number" 
                    className="col-span-3 h-16 bg-stone-50 border border-stone-100 rounded-[1.5rem] px-6 text-xs font-bold text-right outline-none"
                    value={item.rate}
                    onChange={(e) => updateLine(item.id, "rate", parseFloat(e.target.value))}
                  />
                  <button onClick={() => setInvData({...invData, lineItems: invData.lineItems.filter(l => l.id !== item.id)})} className="col-span-1 flex justify-center text-stone-200 hover:text-red-400 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setInvData({...invData, lineItems: [...invData.lineItems, { id: Date.now(), desc: "", qty: 1, rate: 0 }]})} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#a9b897] px-8 py-4 hover:bg-stone-50 rounded-2xl transition-all">
              <Plus size={16}/> Append Service Row
            </button>
          </div>

          {/* BANKING FOOTER */}
          <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
             <Globe className="absolute -right-10 -bottom-10 opacity-5 text-white" size={240} />
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] flex items-center gap-3 mb-8">
                <Landmark size={16}/> Banking Infrastructure
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {['name', 'account', 'sort'].map((field) => (
                  <div key={field} className="space-y-3">
                    <p className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-1">{field}</p>
                    <input 
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-xs focus:bg-white/10 outline-none transition-all" 
                      placeholder={`Entity ${field}`}
                      value={(invData.bank as any)[field]}
                      onChange={(e) => setInvData({...invData, bank: {...invData.bank, [field]: e.target.value}})}
                    />
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* CONTROL TOWER */}
      <div className="col-span-12 xl:col-span-4 space-y-8 sticky top-32">
        
        <div className="bg-white border border-stone-100 rounded-[3rem] p-10 shadow-xl space-y-10">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Financial Terminal</h4>
            <ShieldCheck size={18} className="text-[#a9b897]" />
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-stone-50 p-6 rounded-[2rem]">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Adjustment (%)</span>
              </div>
              <input 
                type="number" 
                className="w-16 bg-transparent border-none text-right font-bold text-base outline-none"
                value={invData.discount}
                onChange={(e) => setInvData({...invData, discount: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="flex justify-between items-center bg-stone-50 p-6 rounded-[2rem]">
              <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">VAT Provision (20%)</span>
              <button 
                onClick={() => setInvData({...invData, vatEnabled: !invData.vatEnabled})}
                className={`w-14 h-8 rounded-full relative transition-all duration-500 ${invData.vatEnabled ? "bg-stone-900" : "bg-stone-200"}`}
              >
                <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-[#a9b897] shadow-lg transition-all duration-500 ${invData.vatEnabled ? "right-1.5" : "left-1.5"}`} />
              </button>
            </div>

            <div className="pt-10 border-t border-stone-50 space-y-4">
              <div className="flex justify-between text-xs font-bold text-stone-300 uppercase tracking-widest">
                <span>Gross Subtotal</span>
                <span>£{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-stone-300 uppercase tracking-widest">
                <span>Tax Allocation</span>
                <span>£{totals.vat.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-end pt-8 gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Final Settlement</span>
                <span className="text-6xl font-serif italic text-stone-900 tracking-tighter">£{totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handlePostToLedger}
            className="w-full py-7 bg-stone-900 text-[#a9b897] rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-4"
          >
            {saving ? <Zap className="animate-spin" size={20}/> : <Save size={20}/>} Commit To Ledger
          </button>
        </div>

        {/* UTILITIES */}
        <div className="bg-white border border-stone-100 rounded-[3rem] p-10 space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-300">File Infrastructure</h4>
          <div className="space-y-4">
            {invData.attachments.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center p-5 bg-stone-50 rounded-2xl text-[10px] font-bold border border-stone-100">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#a9b897]"/>
                  <span className="truncate w-32">{file.name}</span>
                </div>
                <button onClick={() => setInvData({...invData, attachments: invData.attachments.filter((_, i) => i !== idx)})}><X size={16} className="text-red-400"/></button>
              </div>
            ))}
            <button 
              onClick={() => fileInput.current?.click()}
              className="w-full h-16 border-2 border-dashed border-stone-100 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-300 hover:border-[#a9b897] transition-all"
            >
              <Upload size={18}/> Push Document
            </button>
            <input type="file" multiple ref={fileInput} hidden onChange={(e) => {
              if (e.target.files) setInvData({...invData, attachments: [...invData.attachments, ...Array.from(e.target.files)]})
            }}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-3 py-6 bg-stone-50 rounded-[2rem] text-[9px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-900 hover:text-[#a9b897] transition-all border border-stone-100">
              <Download size={20}/> Generate PDF
            </button>
            <button className="flex flex-col items-center justify-center gap-3 py-6 bg-stone-50 rounded-[2rem] text-[9px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-900 hover:text-[#a9b897] transition-all border border-stone-100">
              <ArrowUpRight size={20}/> Secure Share
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}