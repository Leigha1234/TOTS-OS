"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Send, Trash2, Database,
  Filter, Cpu, AlertCircle, CheckCircle2, 
  Download, PieChart, History, Zap, ShieldCheck
} from "lucide-react";

/**
 * TOTS OS v7.0.0 - FISCAL PULSE NODE (Sage & Stone)
 * ARCHITECTURE: DUAL-MODAL LOGIC | REAL-TIME ESCROW SYNC
 */

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div className={`${isDark ? 'bg-stone-900 shadow-2xl' : 'bg-white border border-stone-100 shadow-sm'} p-10 rounded-[3rem] flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:shadow-xl transition-all duration-700`}>
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[9px] font-black uppercase tracking-[0.5em] ${isDark ? 'text-stone-500' : 'text-stone-300'}`}>{label}</p>
      <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-[#faf9f6] text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {icon}
      </div>
    </div>
    
    <div className="z-10 mt-8 text-left">
      <h2 className={`font-mono tracking-tighter leading-tight transition-all ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} 
        ${value.toString().length > 10 ? 'text-3xl' : 'text-5xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-8 border-t border-stone-100/10 flex items-center justify-between">
      <span className="text-[9px] font-serif italic text-[#a9b897]">{sub}</span>
      {isDark && <Activity size={12} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={180} className="absolute -right-16 -top-16 opacity-[0.03] text-white" />}
  </div>
);

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"dispatch" | "reserves" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  const router = useRouter();

  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    reference: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "Neural Architecture Node", qty: 1, price: 12500 }
  ]);

  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18450, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
  ]);

  useEffect(() => {
    setIsMounted(true);
    const syncData = async () => {
        const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
        const hours = data?.reduce((a, r) => a + (Number(r.mon) + Number(r.tue) + Number(r.wed) + Number(r.thu) + Number(r.fri)), 0) || 450;
        const rev = hours * 125;
        setMetrics({ 
          revYtd: rev, 
          operatingCosts: 18450, 
          vatPool: rev * 0.2, 
          taxDue: (rev - 12570) * 0.19 
        });
    };
    syncData();
  }, []);

  const grandTotal = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * 1.2), 0), [lineItems]);

  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 3000);
  };

  const handleDispatch = () => {
    if (!formData.client) { triggerNotify("Entity Node Missing", "error"); return; }
    const doc = {
      id: `INV-${Math.floor(Math.random() * 900) + 100}`,
      client: formData.client, amount: grandTotal, status: "pending", type: "Invoice", date: new Date().toISOString().split('T')[0]
    };
    setLedger([doc, ...ledger]);
    triggerNotify("Directive Dispatched");
    setActiveModal(null);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-24">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            {notification.type === 'success' ? <CheckCircle2 size={14} className="text-[#a9b897]" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto px-10 py-16 space-y-16">
        
        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-stone-100 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 text-[#a9b897] rounded-2xl shadow-xl"><Fingerprint size={24} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-300">FISCAL_PULSE_7.0</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[8px] font-mono tracking-widest text-[#a9b897] uppercase">Node Status: Optimized</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl lg:text-9xl font-serif italic tracking-tighter leading-[0.8]">Payments</h1>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center bg-white p-1.5 rounded-full shadow-sm border border-stone-100">
              {['Payments', 'Finance', 'Ledger'].map((tab) => (
                <button key={tab} className={`px-10 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-full transition-all ${tab === 'Payments' ? 'bg-stone-900 text-white' : 'text-stone-300 hover:text-stone-900'}`}>
                  {tab}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('dispatch')} className="bg-[#a9b897] text-stone-900 px-10 py-4.5 rounded-full flex items-center gap-4 hover:bg-stone-900 hover:text-white transition-all shadow-xl shadow-[#a9b897]/10 active:scale-95">
              <Plus size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">New Directive</span>
            </button>
          </div>
        </header>

        {/* METRIC GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard label="Gross Intake YTD" value={metrics.revYtd} sub="Target Engagement: 114%" icon={<TrendingUp size={18}/>} isDark />
          <MetricCard label="Operational Margin" value={metrics.revYtd - metrics.operatingCosts} sub="Capital Flow: Clear" icon={<Database size={18}/>} />
          <MetricCard label="VAT Escrow Pool" value={metrics.vatPool} sub="Statutory Lock Active" icon={<Landmark size={18}/>} />
          <MetricCard label="Fiscal Provision" value={metrics.taxDue} sub="FY26 Est. Tax" icon={<Receipt size={18}/>} />
        </section>

        {/* DUAL INTERACTIVE NODES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={() => setActiveModal('reserves')} className="p-16 bg-white border border-stone-100 rounded-[4rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group min-h-[480px] relative overflow-hidden text-left">
              <div className="flex justify-between w-full">
                <div className="p-8 bg-[#faf9f6] rounded-3xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-700"><Wallet size={48} /></div>
                <div className="p-6 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 transition-all"><ArrowUpRight size={24}/></div>
              </div>
              <div className="mt-12">
                <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.5em] italic mb-3">Audit Stream</p>
                <h5 className="text-7xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
              <Landmark size={240} className="absolute -left-12 -bottom-12 opacity-[0.02] text-stone-900" />
            </button>

            <button onClick={() => setActiveModal('dispatch')} className="p-16 bg-stone-900 text-white rounded-[4rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-2xl group min-h-[480px] relative overflow-hidden text-left">
                <div className="p-8 bg-white/10 rounded-3xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-700"><Send size={48} /></div>
                <div className="mt-12 relative z-10">
                    <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em] mb-3">Outbound Signal</p>
                    <h5 className="text-7xl font-serif italic tracking-tighter">Dispatch Node</h5>
                </div>
                <Zap size={240} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700" />
            </button>
        </div>

        {/* LEDGER ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-sm">
          <div className="p-14 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-10">
            <div className="text-left w-full xl:w-auto">
                <h3 className="text-6xl font-serif italic tracking-tighter leading-tight">Ledger Archive</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Network Operational Stream</p>
            </div>
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#a9b897]" size={16} />
                  <input placeholder="Query References..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-[#faf9f6] border border-stone-50 rounded-full text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white focus:border-stone-900 transition-all" />
              </div>
              <button className="p-5 bg-stone-900 text-[#a9b897] rounded-full"><Filter size={20}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-[#faf9f6]">
                  {['Ref', 'Target Entity', 'Protocol', 'Status', 'Aggregate'].map((h) => (
                    <th key={h} className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ledger.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#faf9f6]/50 transition-all cursor-pointer group">
                    <td className="px-12 py-12 font-mono text-[11px] text-[#a9b897] font-black">{inv.id}</td>
                    <td className="px-12 py-12">
                      <p className="font-bold text-2xl tracking-tighter text-stone-900">{inv.client}</p>
                      <p className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-12 py-12"><span className="text-[11px] font-black uppercase text-stone-300 tracking-widest">{inv.type}</span></td>
                    <td className="px-12 py-12">
                      <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-12 py-12 text-right pr-24 font-mono font-bold text-3xl tracking-tighter text-stone-900">£{inv.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL SYSTEMS */}
      <AnimatePresence>
        {activeModal === 'dispatch' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/90 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-5xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-16 border-b border-stone-50 pb-12">
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-2">Protocol_V7.0</p>
                  <h3 className="text-6xl font-serif italic tracking-tighter">Deploy Directive</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-6 bg-[#faf9f6] rounded-full hover:bg-stone-900 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-12 pr-4 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 tracking-[0.5em] ml-6">Target Entity</label>
                    <input placeholder="Client Identity..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full p-8 bg-[#faf9f6] rounded-3xl outline-none font-bold text-2xl focus:ring-2 ring-[#a9b897]/30" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 tracking-[0.5em] ml-6">Directive Route</label>
                    <input placeholder="Email Node..." value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-8 bg-[#faf9f6] rounded-3xl outline-none font-bold text-2xl" />
                  </div>
                </div>

                <div className="space-y-4">
                    {lineItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-[#faf9f6] p-10 rounded-[2.5rem] border border-stone-50">
                            <div className="space-y-2">
                                <p className="font-bold text-2xl text-stone-900">{item.desc}</p>
                                <p className="text-[10px] font-mono text-stone-300 uppercase tracking-widest">Unit ID: {item.id}</p>
                            </div>
                            <div className="flex items-center gap-10">
                                <input type="number" value={item.price} onChange={e => setLineItems([{...item, price: Number(e.target.value)}])} className="bg-white px-8 py-5 rounded-2xl outline-none font-mono font-black text-2xl text-right w-52 shadow-sm" />
                                <button className="p-4 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-12 border-2 border-dashed border-stone-100 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] text-stone-300 hover:border-[#a9b897] hover:text-[#a9b897] transition-all flex items-center justify-center gap-4">
                        <Plus size={20}/> Append Logic Block
                    </button>
                </div>
              </div>

              <div className="mt-16 pt-12 border-t border-stone-100 flex flex-col lg:flex-row justify-between items-center gap-12">
                <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-2">Aggregate Total (Gross)</p>
                    <h4 className="font-mono font-bold tracking-tighter text-7xl text-stone-900">£{grandTotal.toLocaleString()}</h4>
                </div>
                <button onClick={handleDispatch} className="w-full lg:w-auto px-20 py-8 bg-stone-900 text-white rounded-full text-[12px] font-black uppercase tracking-[0.5em] hover:bg-[#a9b897] hover:text-stone-900 transition-all shadow-2xl flex items-center justify-center gap-6">
                    Dispatch Protocol <Send size={22} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'reserves' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/90 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#faf9f6] w-full max-w-4xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden text-left" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-16">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Audit_Stream_v7.0</p>
                        <h3 className="text-6xl font-serif italic tracking-tighter">Liquid Reserves</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-6 bg-white rounded-full border border-stone-100 shadow-sm"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white p-10 rounded-[3rem] border border-stone-100">
                        <PieChart size={24} className="text-[#a9b897] mb-8" />
                        <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.5em] mb-2">Escrowed</p>
                        <p className="text-4xl font-mono font-black tracking-tighter text-stone-900">£14,200</p>
                    </div>
                    <div className="bg-stone-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
                        <Zap size={100} className="absolute -right-8 -bottom-8 opacity-5" />
                        <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase text-stone-500 tracking-[0.5em] mb-2">Fluid Assets</p>
                          <p className="text-4xl font-mono font-black tracking-tighter text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-[3rem] border border-stone-100">
                        <ShieldCheck size={24} className="text-stone-200 mb-8" />
                        <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.5em] mb-2">Growth Delta</p>
                        <p className="text-4xl font-mono font-black tracking-tighter text-green-500">+14.2%</p>
                    </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[3.5rem] p-12 space-y-12">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-900">Reserve Velocity</h4>
                        <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#a9b897]">
                            <Download size={16} /> Export Audit
                        </button>
                    </div>
                    <div className="h-48 flex items-end gap-3 px-6">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 1 }} className="flex-1 bg-[#faf9f6] rounded-2xl group relative overflow-hidden">
                                <div className="absolute inset-0 bg-stone-900 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}