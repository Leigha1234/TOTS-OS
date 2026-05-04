"use client";

import React, { useReducer, useState, useRef, useMemo } from "react";
import { 
  Plus, Trash2, Landmark, ImageIcon, FileText, UserPlus, 
  Briefcase, Percent, Receipt, Users, Calculator, BarChart3, 
  Upload, X, Check, Save, Download, ChevronRight, Search
} from "lucide-react";

/* ======================================================
   1. CORE ENGINE (LEDGER & CRM)
====================================================== */

const initialState = {
  ledger: [],
  contacts: [
    { id: "c1", name: "Anthropic Research", email: "billing@anthropic.com" },
    { id: "c2", name: "Design Systems Ltd", email: "finance@ds.io" }
  ],
  projects: [
    { id: "p1", name: "AI Integration Phase 1", clientId: "c1" },
    { id: "p2", name: "Brand Guidelines", clientId: "c2" }
  ]
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case "POST":
      return { ...state, ledger: [...state.ledger, action.payload] };
    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, action.payload] };
    default:
      return state;
  }
}

/* ======================================================
   2. MAIN APPLICATION COMPONENT
====================================================== */

export default function ApexFinancePro() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-[#1A1D21] font-sans">
      
      {/* SIDE NAVIGATION */}
      <aside className="w-64 bg-white border-r border-[#E2E4E9] flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center text-white font-black italic">A</div>
            <span className="font-bold tracking-tight text-xl">Apex OS</span>
          </div>
          
          <nav className="space-y-1">
            {[
              { id: "dashboard", icon: <BarChart3 size={18}/>, label: "Overview" },
              { id: "invoices", icon: <Receipt size={18}/>, label: "Invoicing" },
              { id: "payroll", icon: <Users size={18}/>, label: "Team & Payroll" },
              { id: "reports", icon: <Calculator size={18}/>, label: "Tax & Reports" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === item.id 
                  ? "bg-[#F0F5FF] text-[#0052FF]" 
                  : "text-[#69707D] hover:bg-[#F8F9FB] hover:text-[#1A1D21]"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-[#E2E4E9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400" />
            <div className="text-xs">
              <p className="font-bold">Admin User</p>
              <p className="text-[#69707D]">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-[#E2E4E9] flex items-center justify-between px-10 sticky top-0 z-10">
          <h1 className="text-xl font-bold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#69707D]" size={16} />
              <input placeholder="Search records..." className="pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#E2E4E9] rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20" />
            </div>
            <button className="p-2 bg-[#F8F9FB] border border-[#E2E4E9] rounded-lg text-[#69707D]"><X size={20}/></button>
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          {activeTab === "invoices" ? (
            <InvoiceBuilder state={state} dispatch={dispatch} />
          ) : (
            <div className="h-96 border-2 border-dashed border-[#E2E4E9] rounded-3xl flex items-center justify-center text-[#69707D] italic">
              The {activeTab} module is active in the background.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ======================================================
   3. THE INVOICE BUILDER COMPONENT
====================================================== */

function InvoiceBuilder({ state, dispatch }: any) {
  // FORM STATE
  const [invData, setInvData] = useState({
    number: "INV-2024-001",
    logo: null as string | null,
    isLogoDefault: false,
    selectedClientId: "",
    selectedProjectId: "",
    vatEnabled: true,
    discount: 0,
    bank: { name: "", account: "", sort: "", isDefault: false },
    attachments: [] as File[],
    lineItems: [{ id: 1, desc: "Technical Strategy Consulting", qty: 1, rate: 2500 }]
  });

  const logoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // CALCULATIONS
  const totals = useMemo(() => {
    const subtotal = invData.lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
    const discVal = subtotal * (invData.discount / 100);
    const net = subtotal - discVal;
    const vat = invData.vatEnabled ? net * 0.20 : 0;
    return { subtotal, discVal, net, vat, total: net + vat };
  }, [invData]);

  const addLine = () => setInvData({
    ...invData, 
    lineItems: [...invData.lineItems, { id: Date.now(), desc: "", qty: 1, rate: 0 }]
  });

  const updateLine = (id: number, key: string, val: any) => {
    setInvData({
      ...invData,
      lineItems: invData.lineItems.map(item => item.id === id ? { ...item, [key]: val } : item)
    });
  };

  return (
    <div className="grid grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* INVOICE CANVAS */}
      <div className="col-span-8 space-y-6">
        <div className="bg-white border border-[#E2E4E9] rounded-3xl shadow-xl shadow-slate-200/50 p-12">
          
          {/* TOP SECTION: LOGO & IDENTITY */}
          <div className="flex justify-between items-start mb-16">
            <div className="space-y-4">
              <div 
                onClick={() => logoInput.current?.click()}
                className="group relative w-32 h-32 bg-[#F8F9FB] border-2 border-dashed border-[#E2E4E9] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0052FF] transition-all overflow-hidden"
              >
                {invData.logo ? (
                  <img src={invData.logo} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-[#69707D] group-hover:text-[#0052FF] transition-colors" />
                    <span className="text-[10px] font-bold text-[#69707D] mt-2 group-hover:text-[#0052FF]">ADD LOGO</span>
                  </>
                )}
                <input type="file" ref={logoInput} hidden accept="image/*" onChange={(e) => {
                  if (e.target.files?.[0]) setInvData({...invData, logo: URL.createObjectURL(e.target.files[0])})
                }}/>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={invData.isLogoDefault}
                  onChange={(e) => setInvData({...invData, isLogoDefault: e.target.checked})}
                  className="rounded border-[#E2E4E9] text-[#0052FF] focus:ring-[#0052FF]" 
                />
                <span className="text-[10px] font-black uppercase text-[#69707D] group-hover:text-[#1A1D21]">Use as Default</span>
              </label>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-black text-[#69707D] uppercase tracking-widest mb-1">Invoice Number</p>
              <input 
                className="text-4xl font-serif italic text-right bg-transparent focus:outline-none focus:border-b-2 border-[#0052FF] w-64 transition-all"
                value={invData.number}
                onChange={(e) => setInvData({...invData, number: e.target.value})}
              />
            </div>
          </div>

          {/* CLIENT & PROJECT SELECTION */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#69707D] tracking-tighter">Bill To</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 h-12 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                  value={invData.selectedClientId}
                  onChange={(e) => setInvData({...invData, selectedClientId: e.target.value, selectedProjectId: ""})}
                >
                  <option value="">Select a client...</option>
                  {state.contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="w-12 h-12 bg-white border border-[#E2E4E9] rounded-xl flex items-center justify-center text-[#69707D] hover:bg-[#F8F9FB] hover:text-[#0052FF] transition-all">
                  <UserPlus size={20}/>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#69707D] tracking-tighter">Project Reference</label>
              <select 
                className="w-full h-12 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10 disabled:opacity-50"
                value={invData.selectedProjectId}
                disabled={!invData.selectedClientId}
                onChange={(e) => setInvData({...invData, selectedProjectId: e.target.value})}
              >
                <option value="">Select project (optional)...</option>
                {state.projects
                  .filter((p: any) => p.clientId === invData.selectedClientId)
                  .map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div className="space-y-4 mb-12">
            <div className="grid grid-cols-12 px-4 text-[10px] font-black text-[#69707D] uppercase tracking-wider">
              <div className="col-span-6">Service Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3 text-right">Rate</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-2">
              {invData.lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center group">
                  <input 
                    placeholder="E.g. Consultation Fee" 
                    className="col-span-6 h-12 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#0052FF]/10"
                    value={item.desc}
                    onChange={(e) => updateLine(item.id, "desc", e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="col-span-2 h-12 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl px-4 text-sm text-center focus:ring-2 focus:ring-[#0052FF]/10"
                    value={item.qty}
                    onChange={(e) => updateLine(item.id, "qty", parseInt(e.target.value))}
                  />
                  <div className="col-span-3 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#69707D] text-sm">£</span>
                    <input 
                      type="number" 
                      className="w-full h-12 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl pl-8 pr-4 text-sm text-right font-mono focus:ring-2 focus:ring-[#0052FF]/10"
                      value={item.rate}
                      onChange={(e) => updateLine(item.id, "rate", parseFloat(e.target.value))}
                    />
                  </div>
                  <button 
                    onClick={() => setInvData({...invData, lineItems: invData.lineItems.filter(l => l.id !== item.id)})}
                    className="col-span-1 h-12 flex items-center justify-center text-[#E2E4E9] hover:text-[#FF4D4D] transition-colors"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={addLine}
              className="flex items-center gap-2 text-xs font-bold text-[#0052FF] px-4 py-2 hover:bg-[#F0F5FF] rounded-lg transition-all"
            >
              <Plus size={16}/> Add Service Line
            </button>
          </div>

          {/* BANK DETAILS SECTION */}
          <div className="bg-[#F8F9FB] border border-[#E2E4E9] rounded-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Landmark size={16} className="text-[#0052FF]"/> Payment Instructions
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={invData.bank.isDefault}
                  onChange={(e) => setInvData({...invData, bank: {...invData.bank, isDefault: e.target.checked}})}
                  className="rounded border-[#E2E4E9] text-[#0052FF]"
                />
                <span className="text-[10px] font-black uppercase text-[#69707D]">Set as Default Bank</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#69707D] uppercase ml-1">Bank Name</p>
                <input 
                  className="w-full h-10 bg-white border border-[#E2E4E9] rounded-lg px-3 text-xs focus:ring-2 focus:ring-[#0052FF]/10" 
                  value={invData.bank.name}
                  onChange={(e) => setInvData({...invData, bank: {...invData.bank, name: e.target.value}})}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#69707D] uppercase ml-1">Account Number</p>
                <input 
                  className="w-full h-10 bg-white border border-[#E2E4E9] rounded-lg px-3 text-xs focus:ring-2 focus:ring-[#0052FF]/10" 
                  value={invData.bank.account}
                  onChange={(e) => setInvData({...invData, bank: {...invData.bank, account: e.target.value}})}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#69707D] uppercase ml-1">Sort Code</p>
                <input 
                  className="w-full h-10 bg-white border border-[#E2E4E9] rounded-lg px-3 text-xs focus:ring-2 focus:ring-[#0052FF]/10" 
                  value={invData.bank.sort}
                  onChange={(e) => setInvData({...invData, bank: {...invData.bank, sort: e.target.value}})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT CONTROLS: SUMMARY & ATTACHMENTS */}
      <div className="col-span-4 space-y-6 sticky top-28">
        
        {/* TOTALS CARD */}
        <div className="bg-[#1A1D21] text-white rounded-3xl p-8 shadow-2xl shadow-[#1A1D21]/20">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#69707D] mb-8">Summary</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
              <span className="text-xs text-[#69707D] flex items-center gap-2"><Percent size={14}/> Discount (%)</span>
              <input 
                type="number" 
                className="w-12 bg-transparent border-none text-right focus:outline-none focus:ring-0 p-0 font-bold"
                value={invData.discount}
                onChange={(e) => setInvData({...invData, discount: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
              <span className="text-xs text-[#69707D]">Apply VAT (20%)</span>
              <button 
                onClick={() => setInvData({...invData, vatEnabled: !invData.vatEnabled})}
                className={`w-10 h-6 rounded-full relative transition-all ${invData.vatEnabled ? "bg-[#0052FF]" : "bg-white/10"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${invData.vatEnabled ? "right-1" : "left-1"}`} />
              </button>
            </div>

            <div className="space-y-2 pt-6 border-t border-white/10">
              <div className="flex justify-between text-xs opacity-60">
                <span>Subtotal</span>
                <span>£{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs opacity-60">
                <span>VAT</span>
                <span>£{totals.vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                <span className="text-[10px] font-black uppercase text-[#69707D]">Amount Due</span>
                <span className="text-3xl font-serif italic text-[#00E599]">£{totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-8 py-4 bg-[#0052FF] text-white rounded-2xl font-bold tracking-tight hover:bg-[#0041CC] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Save size={18}/> Finalize & Post
          </button>
        </div>

        {/* ATTACHMENTS CARD */}
        <div className="bg-white border border-[#E2E4E9] rounded-3xl p-8 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#69707D]">Supporting Files</h4>
          
          <div className="space-y-2">
            {invData.attachments.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-[#F8F9FB] rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#0052FF]"/>
                  <span className="truncate w-32">{file.name}</span>
                </div>
                <button onClick={() => setInvData({...invData, attachments: invData.attachments.filter((_, i) => i !== idx)})}>
                  <X size={14} className="text-rose-500"/>
                </button>
              </div>
            ))}

            <button 
              onClick={() => fileInput.current?.click()}
              className="w-full h-14 border-2 border-dashed border-[#E2E4E9] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#69707D] hover:border-[#0052FF] hover:text-[#0052FF] transition-all"
            >
              <Upload size={18}/> Attach Documents
            </button>
            <input 
              type="file" 
              multiple 
              ref={fileInput} 
              hidden 
              onChange={(e) => {
                if (e.target.files) setInvData({...invData, attachments: [...invData.attachments, ...Array.from(e.target.files)]})
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl text-xs font-bold text-[#69707D] hover:bg-white transition-all">
              <Download size={14}/> PDF
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-[#F8F9FB] border border-[#E2E4E9] rounded-xl text-xs font-bold text-[#69707D] hover:bg-white transition-all">
              <Check size={14}/> Share
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}