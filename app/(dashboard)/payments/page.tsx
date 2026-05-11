"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  FileText, X, Landmark, Wallet, ArrowRight, 
  AlertCircle, Loader2, TrendingUp, Search, 
  ArrowUpRight, Receipt, Download, Plus, Activity, 
  Fingerprint, Mail, Send, FileCheck, ShieldCheck, 
  ChevronRight, ExternalLink
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
  const [formData, setFormData] = useState({ client: "", email: "", amount: "", description: "" });

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

  async function fetchFinancials() {
    try {
      setIsLoading(true);
      const { data, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = data?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      const revenue = totalHours * 85; 
      setMetrics({
        revYtd: revenue,
        operatingCosts: 12400,
        vatPool: revenue * 0.20,
        taxDue: (revenue - 12570) > 0 ? (revenue - 12570) * 0.19 : 0
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const handleDocumentDispatch = (isDraft: boolean) => {
    if (!formData.client || !formData.amount) {
      notify("Missing Critical Data");
      return;
    }
    const newDoc = {
      id: docType === "Invoice" ? `INV-${Math.floor(Math.random() * 900) + 100}` : `QT-${Math.floor(Math.random() * 900) + 400}`,
      client: formData.client,
      amount: parseFloat(formData.amount),
      status: isDraft ? "draft" : "pending",
      type: docType,
      date: new Date().toISOString().split('T')[0]
    };
    setInvoices([newDoc, ...invoices]);
    notify(isDraft ? `${docType} Saved as Draft` : `${docType} Dispatched to ${formData.client}`);
    setActiveModal(null);
    setFormData({ client: "", email: "", amount: "", description: "" });
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  // --- MODAL WRAPPER ---
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
            className="bg-white w-full max-w-4xl rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-y-auto max-h-[92vh] border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-12 right-12 p-3 hover:bg-stone-50 rounded-full transition-all text-stone-400">
              <X size={24}/>
            </button>
            <div className="mb-12">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3 italic">Finance Module // TOTS-OS</p>
              <h3 className="text-5xl md:text-6xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- NOTIFICATION --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10"
          >
            <Send size={16} className="text-[#a9b897] animate-pulse" />
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
            <button 
              onClick={() => setActiveModal('invoice')}
              className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] flex items-center gap-4 hover:bg-[#a9b897] transition-all shadow-2xl group active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">New Document</span>
            </button>
            <nav className="flex items-center bg-[#c8d3b9] p-2 rounded-full shadow-inner">
              {['Dashboard', 'Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Payments' && router.push(path === 'Dashboard' ? '/' : `/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                  className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-full ${
                    path === 'Payments' ? "bg-white text-stone-900 shadow-xl scale-105" : "text-white hover:text-stone-800"
                  }`}
                >
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
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Live Stream Established</span>
              <div className="w-3 h-3 rounded-full bg-[#a9b897] animate-pulse shadow-[0_0_15px_rgba(169,184,151,1)]" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-[#a9b897]/5 rounded-full blur-[100px]" />
          </div>

          {[
            { label: 'Net Op Profit', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Stable Margins • 2026', icon: <TrendingUp size={20}/> },
            { label: 'VAT Escrow', value: metrics.vatPool, sub: 'VAT Accumulator Pool', icon: <Landmark size={20}/> },
            { label: 'Corp Tax Due', value: metrics.taxDue, sub: '19% Est. Liability', icon: <Receipt size={20}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-[4rem] p-12 flex flex-col justify-between min-h-[340px] shadow-sm hover:border-stone-900 transition-all group cursor-default">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-3 rounded-2xl">{item.icon}</div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter leading-none py-6 text-stone-900 truncate">
                {item.value < 0 ? `-£${Math.abs(item.value).toLocaleString()}` : `£${item.value.toLocaleString()}`}
              </h2>
              <div className="pt-8 border-t border-stone-50">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* --- TRANSACTION LEDGER --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] overflow-hidden shadow-sm hover:border-stone-200 transition-all duration-700">
          <div className="p-12 md:p-16 flex flex-col md:flex-row justify-between items-center gap-10 border-b border-stone-50">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-5xl font-serif italic tracking-tighter leading-none">Transaction Ledger</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Audited Fiscal History Stream</p>
            </div>
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Client or Reference ID..." 
                className="w-full pl-16 pr-10 py-7 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-bold outline-none focus:border-stone-900 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/50">
                  {['Reference', 'Entity / Client', 'Doc Type', 'System Status', 'Net Sum'].map((h) => (
                    <th key={h} className="px-16 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin inline text-[#a9b897]" size={50} /></td></tr>
                ) : filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-stone-50/30 transition-all cursor-pointer">
                    <td className="px-16 py-12 text-[11px] font-black uppercase text-[#a9b897] font-mono tracking-widest">{inv.id}</td>
                    <td className="px-16 py-12">
                      <div className="space-y-1">
                        <p className="font-bold text-lg text-stone-800 tracking-tight">{inv.client}</p>
                        <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest italic">Issued: {inv.date}</p>
                      </div>
                    </td>
                    <td className="px-16 py-12 text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] font-mono">{inv.type}</td>
                    <td className="px-16 py-12">
                      <div className={`inline-flex items-center gap-4 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                        inv.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-stone-50 text-stone-400 border-stone-100'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : inv.status === 'overdue' ? 'bg-red-600' : 'bg-stone-300'}`} />
                        {inv.status}
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
           <button onClick={() => setActiveModal('accounts')} className="p-12 md:p-16 bg-white border border-stone-100 rounded-[5rem] flex items-center justify-between group hover:border-[#a9b897] transition-all shadow-sm">
              <div className="space-y-3 text-left">
                <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Asset Management</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
              <div className="p-10 bg-stone-50 rounded-[2.5rem] text-stone-200 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all shadow-inner scale-110 group-hover:rotate-12 duration-500">
                <Wallet size={36} />
              </div>
           </button>

           <button onClick={() => setActiveModal('invoice')} className="p-12 md:p-16 bg-stone-900 text-white rounded-[5rem] flex items-center justify-between group hover:bg-[#a9b897] transition-all shadow-2xl active:scale-95">
              <div className="space-y-3 text-left">
                <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em]">Client Distribution</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Dispatch Document</h5>
              </div>
              <div className="p-10 bg-white/10 rounded-[2.5rem] group-hover:bg-white group-hover:text-stone-900 transition-all scale-110">
                <Mail size={36} />
              </div>
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
                  <div className="flex items-center gap-3 text-[#a9b897]">
                    {acc.icon}
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">{acc.type}</p>
                  </div>
                  <h6 className="text-[12px] font-black uppercase tracking-[0.2em] text-stone-400 italic">{acc.name}</h6>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-mono font-bold tracking-tighter text-stone-900">£{acc.balance.toLocaleString()}</p>
                  <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Verified 2mins ago</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
             <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] bg-stone-900 text-white px-12 py-5 rounded-2xl hover:bg-[#a9b897] transition-all">
               Deep Audit Dashboard <ExternalLink size={14}/>
             </button>
          </div>
        </Modal>

        {/* --- MODAL: NEW INVOICE/QUOTE --- */}
        <Modal id="invoice" title="Sales Directive">
          <div className="space-y-12 py-8">
            <div className="flex bg-stone-50 p-2 rounded-[1.5rem] border border-stone-100 max-w-fit shadow-inner">
              {["Invoice", "Quote"].map((t) => (
                <button 
                  key={t}
                  onClick={() => setDocType(t as any)}
                  className={`px-12 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${docType === t ? 'bg-stone-900 text-white shadow-xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Debtor Entity</label>
                <input 
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  placeholder="Client / Company Name" 
                  className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-bold shadow-inner" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Dispatch Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="finance@entity.com" 
                  className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-bold shadow-inner" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Net Sum (£)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00" 
                  className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-mono font-bold text-3xl shadow-inner text-[#a9b897]" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Reference ID</label>
                <input placeholder="AUTO-GENERATE" disabled className="w-full p-8 bg-stone-100 border border-stone-200 rounded-[2rem] text-stone-400 font-mono font-bold shadow-inner cursor-not-allowed italic" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Service Directive Breakdown</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Include project scope, specific line items, or settlement terms..." 
                className="w-full p-10 bg-stone-50 border border-stone-100 rounded-[3rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-medium text-base shadow-inner leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <button 
                onClick={() => handleDocumentDispatch(true)} 
                className="w-full bg-white border border-stone-200 text-stone-900 py-8 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-stone-50 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                <FileCheck size={20} className="text-[#a9b897]" /> Save Draft
              </button>
              <button 
                onClick={() => handleDocumentDispatch(false)} 
                className="w-full bg-stone-900 text-white py-8 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#a9b897] transition-all flex items-center justify-center gap-4 active:scale-95 group"
              >
                Execute & Dispatch <Send size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}