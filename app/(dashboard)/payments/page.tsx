"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Plus, X, Check, Upload, Link, Download, 
  Trash2, UserPlus, Briefcase, Landmark, 
  Image as ImageIcon, FileText, Percent, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApexInvoiceEngine() {
  // --- PERSISTENT USER SETTINGS (Defaults) ---
  const [settings, setSettings] = useState({
    logoUrl: "",
    bankName: "Commercial Bank",
    accountNo: "12345678",
    sortCode: "00-11-22",
    isBankDefault: true,
    isLogoDefault: true,
  });

  // --- DATA LISTS ---
  const [contacts, setContacts] = useState([
    { id: "c1", name: "Acme Corp", email: "billing@acme.com" },
    { id: "c2", name: "Global Industries", email: "finance@global.io" }
  ]);
  const [projects, setProjects] = useState([
    { id: "p1", name: "Q3 Branding Phase", clientId: "c1" },
    { id: "p2", name: "Website Overhaul", clientId: "c2" }
  ]);

  // --- INVOICE STATE ---
  const [invoice, setInvoice] = useState({
    invNumber: `INV-${Date.now().toString().slice(-5)}`,
    clientId: "",
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    useVat: true,
    discount: 0,
    lines: [{ id: 1, desc: "Professional Services", qty: 1, price: 0 }],
    attachments: [] as File[],
    tempLogo: null as string | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- CALCULATIONS ---
  const totals = useMemo(() => {
    const subtotal = invoice.lines.reduce((acc, line) => acc + (line.qty * line.price), 0);
    const discountAmount = subtotal * (invoice.discount / 100);
    const net = subtotal - discountAmount;
    const vat = invoice.useVat ? net * 0.20 : 0;
    const gross = net + vat;
    return { subtotal, discountAmount, net, vat, gross };
  }, [invoice]);

  // --- ACTIONS ---
  const addLine = () => {
    setInvoice({ ...invoice, lines: [...invoice.lines, { id: Date.now(), desc: "", qty: 1, price: 0 }] });
  };

  const removeLine = (id: number) => {
    setInvoice({ ...invoice, lines: invoice.lines.filter(l => l.id !== id) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setInvoice({ ...invoice, attachments: [...invoice.attachments, ...Array.from(e.target.files)] });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setInvoice({ ...invoice, tempLogo: url });
      if (settings.isLogoDefault) setSettings({ ...settings, logoUrl: url });
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-8 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: BUILDER */}
        <div className="col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-10 space-y-8">
            
            {/* Header & Logo Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all overflow-hidden relative group"
                >
                  {invoice.tempLogo || settings.logoUrl ? (
                    <img src={invoice.tempLogo || settings.logoUrl} className="object-contain w-full h-full" alt="Logo" />
                  ) : (
                    <>
                      <ImageIcon className="text-stone-300 mb-2" />
                      <span className="text-[9px] font-black uppercase text-stone-400">Add Logo</span>
                    </>
                  )}
                  <input type="file" ref={logoInputRef} hidden onChange={handleLogoUpload} accept="image/*" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.isLogoDefault} 
                    onChange={(e) => setSettings({...settings, isLogoDefault: e.target.checked})}
                    className="rounded text-stone-900 focus:ring-0" 
                  />
                  <span className="text-[10px] font-bold text-stone-500 uppercase">Set as default logo</span>
                </label>
              </div>

              <div className="text-right space-y-2">
                <input 
                  className="text-4xl font-serif italic text-right bg-transparent border-none focus:ring-0 w-full"
                  value={invoice.invNumber}
                  onChange={(e) => setInvoice({...invoice, invNumber: e.target.value})}
                />
                <p className="text-[10px] font-black uppercase text-stone-300">Invoice Number</p>
              </div>
            </div>

            <hr className="border-stone-50" />

            {/* Client & Project Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Client</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-stone-50 border-none rounded-2xl p-4 text-sm"
                    value={invoice.clientId}
                    onChange={(e) => setInvoice({...invoice, clientId: e.target.value})}
                  >
                    <option value="">Select a Contact...</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="p-4 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-all">
                    <UserPlus size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Related Project</label>
                <select 
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 text-sm"
                  value={invoice.projectId}
                  onChange={(e) => setInvoice({...invoice, projectId: e.target.value})}
                >
                  <option value="">No Project Assigned</option>
                  {projects.filter(p => p.clientId === invoice.clientId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4">
                <div className="col-span-6 text-[9px] font-black uppercase text-stone-400">Description</div>
                <div className="col-span-2 text-right text-[9px] font-black uppercase text-stone-400">Qty</div>
                <div className="col-span-3 text-right text-[9px] font-black uppercase text-stone-400">Unit Price</div>
                <div className="col-span-1"></div>
              </div>
              
              {invoice.lines.map((line, idx) => (
                <div key={line.id} className="grid grid-cols-12 gap-4 items-center">
                  <input 
                    className="col-span-6 bg-stone-50 border-none rounded-xl p-3 text-sm"
                    placeholder="Service description..."
                    value={line.desc}
                    onChange={(e) => {
                      const newLines = [...invoice.lines];
                      newLines[idx].desc = e.target.value;
                      setInvoice({...invoice, lines: newLines});
                    }}
                  />
                  <input 
                    type="number"
                    className="col-span-2 bg-stone-50 border-none rounded-xl p-3 text-sm text-right"
                    value={line.qty}
                    onChange={(e) => {
                      const newLines = [...invoice.lines];
                      newLines[idx].qty = Number(e.target.value);
                      setInvoice({...invoice, lines: newLines});
                    }}
                  />
                  <input 
                    type="number"
                    className="col-span-3 bg-stone-50 border-none rounded-xl p-3 text-sm text-right font-mono"
                    value={line.price}
                    onChange={(e) => {
                      const newLines = [...invoice.lines];
                      newLines[idx].price = Number(e.target.value);
                      setInvoice({...invoice, lines: newLines});
                    }}
                  />
                  <button onClick={() => removeLine(line.id)} className="col-span-1 text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <button onClick={addLine} className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-all ml-4">
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {/* Bank Details Editor */}
            <div className="p-8 bg-stone-50 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} /> Payment Bank Details
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.isBankDefault} 
                    onChange={(e) => setSettings({...settings, isBankDefault: e.target.checked})}
                    className="rounded text-stone-900 focus:ring-0" 
                  />
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Save as default</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input 
                  className="bg-white border border-stone-200 rounded-xl p-3 text-xs" 
                  placeholder="Bank Name" 
                  value={settings.bankName}
                  onChange={(e) => setSettings({...settings, bankName: e.target.value})}
                />
                <input 
                  className="bg-white border border-stone-200 rounded-xl p-3 text-xs" 
                  placeholder="Account Number" 
                  value={settings.accountNo}
                  onChange={(e) => setSettings({...settings, accountNo: e.target.value})}
                />
                <input 
                  className="bg-white border border-stone-200 rounded-xl p-3 text-xs" 
                  placeholder="Sort Code" 
                  value={settings.sortCode}
                  onChange={(e) => setSettings({...settings, sortCode: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & TOTALS */}
        <div className="col-span-4 space-y-6">
          
          {/* Summary Panel */}
          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-xl space-y-8 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase opacity-40 mb-6 tracking-widest">Financial Summary</p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Subtotal</span>
                  <span className="font-mono">£{totals.subtotal.toLocaleString()}</span>
                </div>

                {/* Discount Control */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs opacity-50 flex items-center gap-2">
                    <Percent size={12} /> Discount
                  </span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      className="w-12 bg-transparent border-none text-right text-sm focus:ring-0 p-0"
                      value={invoice.discount}
                      onChange={(e) => setInvoice({...invoice, discount: Number(e.target.value)})}
                    />
                    <span className="text-xs opacity-50">%</span>
                  </div>
                </div>

                {/* VAT Toggle */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs opacity-50 flex items-center gap-2">
                    VAT (20%)
                  </span>
                  <input 
                    type="checkbox" 
                    checked={invoice.useVat}
                    onChange={(e) => setInvoice({...invoice, useVat: e.target.checked})}
                    className="rounded bg-white/10 border-none text-[#a9b897] focus:ring-0"
                  />
                </div>

                <div className="pt-6 border-t border-white/10 space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40">Amount Due</p>
                  <h2 className="text-5xl font-serif italic text-[#a9b897]">£{totals.gross.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments & Actions */}
          <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 space-y-6">
            <div>
              <h4 className="text-[11px] font-black uppercase mb-4">Supporting Documents</h4>
              <div className="space-y-2">
                {invoice.attachments.map((file, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl text-[10px] font-bold">
                    <span className="truncate w-40">{file.name}</span>
                    <button onClick={() => setInvoice({...invoice, attachments: invoice.attachments.filter((_, idx) => idx !== i)})}>
                      <X size={14} className="text-stone-400" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[10px] font-black uppercase text-stone-400 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Attach Files
                </button>
                <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileUpload} />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">
                Finalise & Send
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 bg-stone-100 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                  <Download size={14} /> Save PDF
                </button>
                <button className="py-3 bg-stone-100 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                  <Link size={14} /> Copy Link
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}