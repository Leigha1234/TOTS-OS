"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Mail, Send, FileCheck, ShieldCheck, 
  ExternalLink, Trash2, Calculator, Info,
  Package, CreditCard,
  Loader2
} from "lucide-react";

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  
  // --- FORM STATE ---
  const [docType, setDocType] = useState<"Invoice" | "Quote">("Invoice");
  const [activeTab, setActiveTab] = useState<"items" | "expenses">("items");
  const [formData, setFormData] = useState({ client: "", email: "" });
  
  const [lineItems, setLineItems] = useState([{ id: 1, desc: "", qty: 1, price: 0, vat: 20 }]);
  const [expenses, setExpenses] = useState([{ id: 1, desc: "", amount: 0 }]);

  // --- DATABASE STATE ---
  const [metrics, setMetrics] = useState({
    revYtd: 0,
    operatingCosts: 12400,
    vatPool: 0,
    taxDue: 0
  });

  const [invoices, setInvoices] = useState([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-103", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
  ]);

  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
  }, []);

  // --- CALCULATIONS ---
  const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const totalVat = lineItems.reduce((acc, item) => acc + (item.qty * item.price * (item.vat / 100)), 0);
  const expenseTotal = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const grandTotal = subtotal + totalVat + expenseTotal;

  async function fetchFinancials() {
    try {
      setIsLoading(true);
      const { data, error: tsError } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri, sat, sun');
      if (tsError) throw tsError;
      const totalHours = data?.reduce((acc, row) => acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun)), 0) || 0;
      const revenue = totalHours * 85; 
      setMetrics({
        revYtd: revenue,
        operatingCosts: 12400,
        vatPool: revenue * 0.20,
        taxDue: (revenue - 12570) > 0 ? (revenue - 12570) * 0.19 : 0
      });
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const handleDocumentDispatch = (isDraft: boolean) => {
    if (!formData.client || grandTotal === 0) { notify("Missing Critical Data"); return; }
    const newDoc = {
      id: docType === "Invoice" ? `INV-${Math.floor(Math.random() * 900) + 100}` : `QT-${Math.floor(Math.random() * 900) + 400}`,
      client: formData.client,
      amount: grandTotal,
      status: isDraft ? "draft" : "pending",
      type: docType,
      date: new Date().toISOString().split('T')[0]
    };
    setInvoices([newDoc, ...invoices]);
    notify(isDraft ? `${docType} Drafted` : `${docType} Sent to ${formData.client}`);
    setActiveModal(null);
    setLineItems([{ id: 1, desc: "", qty: 1, price: 0, vat: 20 }]);
    setExpenses([{ id: 1, desc: "", amount: 0 }]);
  };

  const filteredInvoices = invoices.filter(inv => inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isMounted) return null;

  const Modal = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }}
            className="bg-white w-full max-w-6xl rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-y-auto max-h-[92vh] border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-12 right-12 p-3 hover:bg-stone-50 rounded-full transition-all text-stone-400"><X size={24}/></button>
            <div className="mb-10">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3 italic">Finance Module // TOTS-OS</p>
              <h3 className="text-5xl md:text-6xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10">
            <Send size={16} className="text-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-16">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-stone-400">
              <Fingerprint size={16} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[11px] tracking-[0.5em]">Ledger Node v6.1.0</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => setActiveModal('invoice')} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] flex items-center gap-4 hover:bg-[#a9b897] transition-all shadow-2xl group active:scale-95">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">New Document</span>
            </button>
            <nav className="flex items-center bg-[#c8d3b9] p-2 rounded-full shadow-inner">
              {['Dashboard', 'Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button key={path} onClick={() => path !== 'Payments' && router.push(path === 'Dashboard' ? '/' : `/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)} className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-full ${path === 'Payments' ? "bg-white text-stone-900 shadow-xl scale-105" : "text-white hover:text-stone-800"}`}>
                  {path}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* --- METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="bg-stone-900 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[340px] relative overflow-hidden group">
            <div className="z-10 space-y-6">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Gross Revenue YTD</p>
                <div className="bg-[#a9b897]/20 p-3 rounded-2xl"><ArrowUpRight size={20} className="text-[#a9b897]" /></div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter pt-4 leading-none truncate text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Live Ledger Stream</span>
              <div className="w-3 h-3 rounded-full bg-[#a9b897] animate-pulse shadow-[0_0_15px_rgba(169,184,151,1)]" />
            </div>
          </div>
          {[
            { label: 'Net Op Profit', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Stable Margins • 2026', icon: <TrendingUp size={20}/> },
            { label: 'VAT Escrow', value: metrics.vatPool, sub: 'VAT Accumulator Pool', icon: <Landmark size={20}/> },
            { label: 'Corp Tax Due', value: metrics.taxDue, sub: '19% Est. Liability', icon: <Receipt size={20}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-[4rem] p-12 flex flex-col justify-between min-h-[340px] shadow-sm hover:border-stone-900 transition-all group">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-3 rounded-2xl">{item.icon}</div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter leading-none py-6 text-stone-900 truncate">£{item.value.toLocaleString()}</h2>
              <div className="pt-8 border-t border-stone-50"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{item.sub}</p></div>
            </div>
          ))}
        </section>

        {/* --- TRANSACTION LEDGER --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] overflow-hidden shadow-sm">
          <div className="p-12 md:p-16 flex flex-col md:flex-row justify-between items-center gap-10 border-b border-stone-50">
            <div className="space-y-2">
              <h3 className="text-5xl font-serif italic tracking-tighter">Transaction Ledger</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Audited Fiscal History Stream</p>
            </div>
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Client or ID..." className="w-full pl-16 pr-10 py-7 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-bold outline-none shadow-inner" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/50">
                  {['Reference', 'Entity / Client', 'Type', 'Status', 'Net Sum'].map((h) => (
                    <th key={h} className="px-16 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin inline text-[#a9b897]" size={50} /></td></tr>
                ) : filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-stone-50/30 transition-all cursor-pointer">
                    <td className="px-16 py-12 text-[11px] font-black uppercase text-[#a9b897] font-mono">{inv.id}</td>
                    <td className="px-16 py-12 font-bold text-lg text-stone-800">{inv.client}</td>
                    <td className="px-16 py-12 text-[10px] font-black uppercase text-stone-400">{inv.type}</td>
                    <td className="px-16 py-12">
                      <div className={`inline-flex items-center gap-4 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />{inv.status}
                      </div>
                    </td>
                    <td className="px-16 py-12 text-right font-mono font-bold text-stone-900 pr-24 text-xl">£{inv.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- DUAL ACTION PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <button onClick={() => setActiveModal('accounts')} className="p-12 md:p-16 bg-white border border-stone-100 rounded-[5rem] flex items-center justify-between group hover:border-[#a9b897] shadow-sm transition-all">
              <div className="space-y-3 text-left">
                <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Asset Management</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
              <div className="p-10 bg-stone-50 rounded-[2.5rem] group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500"><Wallet size={36} /></div>
           </button>
           <button onClick={() => setActiveModal('invoice')} className="p-12 md:p-16 bg-stone-900 text-white rounded-[5rem] flex items-center justify-between group hover:bg-[#a9b897] shadow-2xl transition-all">
              <div className="space-y-3 text-left">
                <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em]">Client Distribution</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Dispatch Document</h5>
              </div>
              <div className="p-10 bg-white/10 rounded-[2.5rem] group-hover:bg-white group-hover:text-stone-900 transition-all"><Mail size={36} /></div>
           </button>
        </div>

        {/* --- MODAL: ACCOUNTS --- */}
        <Modal id="accounts" title="Liquidity Report">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-8">
            {[
              { name: "Current Account", balance: 84200.50, type: "Liquid Assets", icon: <Activity size={14}/> },
              { name: "VAT Escrow", balance: metrics.vatPool, type: "Protected Pool", icon: <ShieldCheck size={14}/> },
              { name: "Tax Reserve", balance: metrics.taxDue, type: "Legal Provision", icon: <Landmark size={14}/> },
            ].map(acc => (
              <div key={acc.name} className="p-12 bg-stone-50 rounded-[3.5rem] border border-stone-100 flex flex-col justify-between min-h-[250px] shadow-inner group">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#a9b897]">{acc.icon}<p className="text-[10px] font-black uppercase tracking-[0.3em]">{acc.type}</p></div>
                  <h6 className="text-[12px] font-black uppercase tracking-[0.2em] text-stone-400 italic">{acc.name}</h6>
                </div>
                <p className="text-4xl font-mono font-bold tracking-tighter text-stone-900">£{acc.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Modal>

        {/* --- MODAL: NEW INVOICE/QUOTE (UPDATED) --- */}
        <Modal id="invoice" title="Sales Directive">
          <div className="space-y-12 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex bg-stone-50 p-2 rounded-[1.5rem] border border-stone-100 shadow-inner">
                {["Invoice", "Quote"].map((t) => (
                  <button key={t} onClick={() => setDocType(t as any)} className={`px-12 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${docType === t ? 'bg-stone-900 text-white shadow-xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
              <div className="flex bg-[#f1f4ec] p-2 rounded-[1.5rem] border border-[#dce4d3] shadow-inner">
                {[
                  { id: 'items', label: 'Line Items', icon: <Package size={14}/> },
                  { id: 'expenses', label: 'Expenses', icon: <CreditCard size={14}/> }
                ].map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-[#a9b897] text-white shadow-md' : 'text-stone-500 hover:text-stone-900'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Debtor Entity</label>
                <input value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} placeholder="Client Name" className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 transition-all font-bold shadow-inner" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Email</label>
                <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="finance@client.com" className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 transition-all font-bold shadow-inner" />
              </div>
            </div>

            {/* TAB CONTENT: LINE ITEMS */}
            {activeTab === 'items' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-6">
                  <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Service Breakdown</p>
                  <button onClick={() => setLineItems([...lineItems, { id: Date.now(), desc: "", qty: 1, price: 0, vat: 20 }])} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a9b897] hover:text-stone-900 transition-colors"><Plus size={14}/> Add Row</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {lineItems.map((item, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={item.id} className="grid grid-cols-12 gap-4 items-center bg-stone-50 p-6 rounded-[2rem] border border-stone-100 shadow-inner group">
                      <div className="col-span-5"><input placeholder="Description..." value={item.desc} onChange={(e) => { const n = [...lineItems]; n[idx].desc = e.target.value; setLineItems(n); }} className="w-full bg-transparent outline-none font-bold text-sm" /></div>
                      <div className="col-span-2"><input type="number" placeholder="Qty" value={item.qty} onChange={(e) => { const n = [...lineItems]; n[idx].qty = Number(e.target.value); setLineItems(n); }} className="w-full bg-transparent outline-none font-mono text-center border-x border-stone-200" /></div>
                      <div className="col-span-2"><input type="number" placeholder="Price" value={item.price} onChange={(e) => { const n = [...lineItems]; n[idx].price = Number(e.target.value); setLineItems(n); }} className="w-full bg-transparent outline-none font-mono text-center" /></div>
                      <div className="col-span-2 flex items-center gap-2">
                        <select value={item.vat} onChange={(e) => { const n = [...lineItems]; n[idx].vat = Number(e.target.value); setLineItems(n); }} className="bg-transparent outline-none font-mono text-xs font-bold text-[#a9b897]">
                          <option value={20}>20%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-right"><button onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: EXPENSES */}
            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-6">
                  <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Operating Disbursements</p>
                  <button onClick={() => setExpenses([...expenses, { id: Date.now(), desc: "", amount: 0 }])} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a9b897] hover:text-stone-900 transition-colors"><Plus size={14}/> Add Expense</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {expenses.map((exp, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={exp.id} className="grid grid-cols-12 gap-4 items-center bg-stone-50 p-6 rounded-[2rem] border border-stone-100 shadow-inner">
                      <div className="col-span-8"><input placeholder="Expense Description (e.g. Travel, Licensing)..." value={exp.desc} onChange={(e) => { const n = [...expenses]; n[idx].desc = e.target.value; setExpenses(n); }} className="w-full bg-transparent outline-none font-bold text-sm" /></div>
                      <div className="col-span-3"><input type="number" placeholder="Amount" value={exp.amount} onChange={(e) => { const n = [...expenses]; n[idx].amount = Number(e.target.value); setExpenses(n); }} className="w-full bg-transparent outline-none font-mono text-right text-[#a9b897] font-bold" /></div>
                      <div className="col-span-1 text-right"><button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* DIRECTIVE FOOTER & TOTALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end pt-12 border-t border-stone-100">
              <div className="bg-stone-50 p-10 rounded-[3rem] space-y-4 border border-stone-100">
                <div className="flex items-center gap-3 text-stone-400 mb-2"><Info size={14}/><p className="text-[9px] font-black uppercase tracking-widest">Financial Summary</p></div>
                <div className="flex justify-between text-xs font-bold text-stone-500"><span>Subtotal</span><span className="font-mono">£{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs font-bold text-stone-400"><span>Net VAT Pool</span><span className="font-mono">£{totalVat.toLocaleString()}</span></div>
                {expenseTotal > 0 && <div className="flex justify-between text-xs font-bold text-[#a9b897]"><span>Direct Expenses</span><span className="font-mono">£{expenseTotal.toLocaleString()}</span></div>}
                <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-900">Total Due</p>
                   <p className="text-4xl font-mono font-bold tracking-tighter text-stone-900">£{grandTotal.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => handleDocumentDispatch(true)} className="w-full bg-white border border-stone-200 py-8 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-stone-50 transition-all flex items-center justify-center gap-4 active:scale-95"><FileCheck size={20} className="text-[#a9b897]" /> Save Draft</button>
                <button onClick={() => handleDocumentDispatch(false)} className="w-full bg-stone-900 text-white py-8 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#a9b897] transition-all flex items-center justify-center gap-4 active:scale-95 group">Execute Directive <Send size={18} className="group-hover:translate-x-2 transition-transform" /></button>
              </div>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}