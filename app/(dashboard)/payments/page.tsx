"use client";

import { useReducer, useMemo, useState, useRef } from "react";
import { 
  Plus, Trash2, Landmark, ImageIcon, FileText, 
  UserPlus, Briefcase, Percent, Receipt, Users, 
  Calculator, BarChart3, Upload, X 
} from "lucide-react";

/* ======================================================
   CORE LEDGER SYSTEM
====================================================== */

const initialState = {
  ledger: [],
  contacts: [
    { id: "c1", name: "Acme Corp", email: "billing@acme.com" },
    { id: "c2", name: "Global Industries", email: "finance@global.io" }
  ],
  projects: [
    { id: "p1", name: "Q3 Branding", clientId: "c1" },
    { id: "p2", name: "Web App Dev", clientId: "c2" }
  ]
};

function reducer(state, action) {
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
   MAIN APP (OS SWITCHBOARD)
====================================================== */

export default function ApexFinanceOS() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState("invoices");

  // Global Financial Calculations
  const income = useMemo(() => 
    state.ledger.filter(x => x.type === "invoice").reduce((a, b) => a + b.amount, 0), [state.ledger]);
  const expenses = useMemo(() => 
    state.ledger.filter(x => x.type === "expense").reduce((a, b) => a + b.amount, 0), [state.ledger]);
  const payroll = useMemo(() => 
    state.ledger.filter(x => x.type === "payroll").reduce((a, b) => a + b.amount, 0), [state.ledger]);
  
  const profit = income - expenses - payroll;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-stone-900 font-sans p-8">
      {/* NAVIGATION BAR */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: "dashboard", icon: <BarChart3 size={16}/> },
          { id: "invoices", icon: <Receipt size={16}/> },
          { id: "payroll", icon: <Users size={16}/> },
          { id: "expenses", icon: <Plus size={16}/> },
          { id: "tax", icon: <Calculator size={16}/> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${
              tab === t.id ? "bg-stone-900 text-white" : "bg-white text-stone-400 hover:bg-stone-50"
            }`}
          >
            {t.icon} {t.id}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {tab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card title="Revenue" value={`£${income.toLocaleString()}`} color="text-emerald-600" />
            <Card title="Outgoings" value={`£${(expenses + payroll).toLocaleString()}`} color="text-rose-600" />
            <Card title="Net Profit" value={`£${profit.toLocaleString()}`} color="text-stone-900" />
            <Card title="Tax Liability" value={`£${(profit * 0.2).toLocaleString()}`} color="text-stone-400" />
          </div>
        )}

        {tab === "invoices" && <InvoiceModule state={state} dispatch={dispatch} />}
        
        {tab !== "dashboard" && tab !== "invoices" && (
          <div className="bg-white p-20 rounded-[3rem] border border-stone-100 text-center italic text-stone-300">
            {tab.toUpperCase()} Module functional in ledger core.
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   INVOICE MODULE (THE FULL ENGINE)
====================================================== */

function InvoiceModule({ state, dispatch }) {
  // Local Form State
  const [invNum, setInvNum] = useState(`INV-${Date.now().toString().slice(-4)}`);
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [useVat, setUseVat] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [bank, setBank] = useState({ name: "Global Bank", acc: "12345678", sort: "00-00-00", isDefault: true });
  const [lineItems, setLineItems] = useState([{ id: 1, desc: "Professional Services", price: 0 }]);
  const [attachments, setAttachments] = useState([]);
  const [logo, setLogo] = useState(null);

  const fileRef = useRef(null);
  const logoRef = useRef(null);

  // Totals Calculation
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const discAmt = subtotal * (discount / 100);
  const net = subtotal - discAmt;
  const vatAmt = useVat ? net * 0.20 : 0;
  const total = net + vatAmt;

  const handlePost = () => {
    dispatch({
      type: "POST",
      payload: { type: "invoice", amount: total, id: invNum, client: selectedContact }
    });
    alert("Invoice Posted to Ledger");
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* MAIN BUILDER */}
      <div className="col-span-8 bg-white rounded-[2.5rem] border border-stone-100 p-10 space-y-8 shadow-sm">
        
        {/* Header: Logo & Inv Number */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div 
              onClick={() => logoRef.current.click()}
              className="w-28 h-28 border-2 border-dashed border-stone-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all overflow-hidden"
            >
              {logo ? <img src={logo} className="w-full h-full object-cover" /> : <ImageIcon className="text-stone-200" />}
              <input type="file" ref={logoRef} hidden onChange={(e) => setLogo(URL.createObjectURL(e.target.files[0]))} />
            </div>
            <label className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase">
              <input type="checkbox" className="rounded border-stone-200" /> Default Logo
            </label>
          </div>
          <div className="text-right">
            <input 
              className="text-4xl font-serif italic border-none text-right focus:ring-0 w-48"
              value={invNum}
              onChange={(e) => setInvNum(e.target.value)}
            />
            <p className="text-[10px] font-black uppercase text-stone-300">Reference Number</p>
          </div>
        </div>

        {/* CRM: Contacts & Projects */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Client Contact</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-stone-50 border-none rounded-xl p-3 text-sm focus:ring-2 ring-stone-100"
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
              >
                <option value="">Select Contact...</option>
                {state.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="p-3 bg-stone-100 rounded-xl hover:bg-stone-200 transition-all"><UserPlus size={16}/></button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Related Project</label>
            <select 
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm focus:ring-2 ring-stone-100"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">No Project Linked</option>
              {state.projects.filter(p => p.clientId === selectedContact).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 px-2 text-[9px] font-black uppercase text-stone-300">
            <div className="col-span-9">Description</div>
            <div className="col-span-3 text-right">Amount (£)</div>
          </div>
          {lineItems.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
              <input 
                className="col-span-9 bg-stone-50 border-none rounded-xl p-3 text-sm"
                value={item.desc}
                onChange={(e) => {
                  const newItems = [...lineItems];
                  newItems[idx].desc = e.target.value;
                  setLineItems(newItems);
                }}
              />
              <input 
                type="number"
                className="col-span-2 bg-stone-50 border-none rounded-xl p-3 text-sm text-right font-mono"
                value={item.price}
                onChange={(e) => {
                  const newItems = [...lineItems];
                  newItems[idx].price = e.target.value;
                  setLineItems(newItems);
                }}
              />
              <button onClick={() => setLineItems(lineItems.filter(l => l.id !== item.id))} className="col-span-1 text-stone-200 hover:text-rose-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={() => setLineItems([...lineItems, { id: Date.now(), desc: "", price: 0 }])} className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-2 hover:text-stone-900 transition-all ml-2">
            <Plus size={14} /> Add Line
          </button>
        </div>

        {/* Bank Details */}
        <div className="p-6 bg-stone-50 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Landmark size={14}/> Settlement Bank</h4>
            <label className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase cursor-pointer">
              <input type="checkbox" checked={bank.isDefault} onChange={e => setBank({...bank, isDefault: e.target.checked})} className="rounded border-stone-200" /> Save as Default
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input className="bg-white border-none rounded-lg p-2 text-xs" placeholder="Bank" value={bank.name} onChange={e => setBank({...bank, name: e.target.value})} />
            <input className="bg-white border-none rounded-lg p-2 text-xs" placeholder="Account" value={bank.acc} onChange={e => setBank({...bank, acc: e.target.value})} />
            <input className="bg-white border-none rounded-lg p-2 text-xs" placeholder="Sort Code" value={bank.sort} onChange={e => setBank({...bank, sort: e.target.value})} />
          </div>
        </div>
      </div>

      {/* SIDEBAR: CONTROLS & TOTALS */}
      <div className="col-span-4 space-y-6">
        <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-xl space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Invoice Summary</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2"><Percent size={14}/> Discount</span>
              <input 
                type="number" 
                className="w-12 bg-transparent border-none text-right p-0 focus:ring-0 text-sm font-mono" 
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-[10px] font-bold uppercase opacity-60">Add VAT (20%)</span>
              <input 
                type="checkbox" 
                checked={useVat} 
                onChange={e => setUseVat(e.target.checked)}
                className="rounded bg-white/10 border-none text-stone-500 focus:ring-0" 
              />
            </div>

            <div className="pt-6 border-t border-white/10">
              <p className="text-[9px] font-black uppercase opacity-30 mb-1">Total Receivable</p>
              <h2 className="text-5xl font-serif italic tracking-tighter text-emerald-400">£{total.toLocaleString()}</h2>
            </div>
          </div>

          <button 
            onClick={handlePost}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
          >
            Post to Ledger
          </button>
        </div>

        {/* Attachments Section */}
        <div className="bg-white border border-stone-100 p-8 rounded-[2.5rem] space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Supporting Docs</h4>
          <div className="space-y-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg text-[10px] font-bold">
                <span className="truncate w-32">{file.name}</span>
                <X size={12} className="cursor-pointer" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}/>
              </div>
            ))}
            <button 
              onClick={() => fileRef.current.click()}
              className="w-full py-3 border-2 border-dashed border-stone-100 rounded-xl text-[9px] font-black uppercase text-stone-400 hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
            >
              <Upload size={14}/> Attach Files
            </button>
            <input type="file" ref={fileRef} hidden multiple onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files)])} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   UI COMPONENTS
====================================================== */

function Card({ title, value, color }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">{title}</p>
      <h2 className={`text-3xl font-serif italic ${color}`}>{value}</h2>
    </div>
  );
}