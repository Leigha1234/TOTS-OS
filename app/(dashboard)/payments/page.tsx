"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Mail, Send, 
  Trash2, Database,
  Filter, Cpu, AlertCircle,
  CheckCircle2, ChevronDown, Download,
  FileSpreadsheet, PieChart, History, Zap
} from "lucide-react";

/**
 * TOTS OS v6.7.0 - FISCAL PULSE NODE
 * REVISION: DUAL MODAL SYSTEM | TERMINAL REMOVED | FULL LOGIC INTEGRATION
 */

// --- SHARED UI COMPONENTS ---

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div className={`${isDark ? 'bg-stone-900 shadow-2xl' : 'bg-white border border-stone-100 shadow-sm'} p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:border-stone-900 transition-all duration-500`}>
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{label}</p>
      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-stone-50 text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {icon}
      </div>
    </div>
    
    <div className="z-10 mt-6 text-left">
      <h2 className={`font-mono tracking-tighter leading-none transition-all ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} 
        ${value.toString().length > 10 ? 'text-2xl' : value.toString().length > 7 ? 'text-3xl' : 'text-5xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-6 border-t border-stone-50/10 flex items-center justify-between">
      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={160} className="absolute -right-12 -top-12 opacity-[0.03] text-white" />}
  </div>
);

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const router = useRouter();

  // --- CORE STATE ---
  const [activeModal, setActiveModal] = useState<"dispatch" | "reserves" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  
  // --- FORM ENGINE STATE ---
  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    reference: `TX-${Math.floor(Math.random() * 10000)}`,
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "Enterprise Architecture Node", qty: 1, price: 12500 }
  ]);

  // --- DATA SETS ---
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18450, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
    { id: "INV-922", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10" },
  ]);

  // --- LOGIC: INITIALIZATION & METRICS ---
  useEffect(() => {
    setIsMounted(true);
    const syncData = async () => {
        const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
        const hours = data?.reduce((a, r) => a + (Number(r.mon) + Number(r.tue) + Number(r.wed) + Number(r.thu) + Number(r.fri)), 0) || 520;
        const rev = hours * 125;
        setMetrics({ 
          revYtd: rev, 
          operatingCosts: 18450, 
          vatPool: rev * 0.2, 
          taxDue: (rev - 12570) * 0.19 
        });
    };
    syncData();
    const t = setInterval(() => setSystemUptime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const grandTotal = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * 1.2), 0), [lineItems]);

  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 4000);
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
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-16 overflow-x-hidden">
      
      {/* HUD NOTIFICATION */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10">
            {notification.type === 'success' ? <CheckCircle2 size={14} className="text-[#a9b897]" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-8 py-12 space-y-16">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-14">
          <div className="space-y-5 text-left">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 text-[#a9b897] rounded-3xl shadow-xl hover:rotate-12 transition-transform"><Fingerprint size={24} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[9px] tracking-[0.5em] text-stone-300">CORE NODE: FISCAL_PULSE_6.7</p>
                <div className="flex items-center gap-2 text-green-500/50">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest uppercase">ENCRYPTED [{systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl xl:text-9xl font-serif italic tracking-tighter leading-[0.8]">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <nav className="flex items-center bg-stone-100 p-2 rounded-full shadow-inner">
              {['Payments', 'HR', 'Finance-Reports'].map((path) => (
                <button 
                  key={path} 
                  onClick={() => path !== 'Payments' && router.push(`/${path.toLowerCase()}`)} 
                  className={`px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-full ${path === 'Payments' ? "bg-white text-stone-900 shadow-md scale-105" : "text-stone-400 hover:text-stone-900"}`}
                >
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('dispatch')} className="bg-stone-900 text-white px-10 py-5 rounded-full flex items-center gap-5 hover:bg-stone-800 transition-all shadow-2xl group active:scale-95">
              <Plus size={18} className="text-[#a9b897] group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Deploy Directive</span>
            </button>
          </div>
        </header>

        {/* METRIC GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard label="Gross Intake YTD" value={metrics.revYtd} sub="Operational Target: 112%" icon={<TrendingUp size={18}/>} isDark />
          <MetricCard label="Operational Margin" value={metrics.revYtd - metrics.operatingCosts} sub="Flow: Unrestricted" icon={<Database size={18}/>} />
          <MetricCard label="VAT Escrow Pool" value={metrics.vatPool} sub="Statutory Lock" icon={<Landmark size={18}/>} />
          <MetricCard label="Fiscal Tax Due" value={metrics.taxDue} sub="FY26 Provision" icon={<Receipt size={18}/>} />
        </section>

        {/* DUAL INTERACTIVE NODES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={() => setActiveModal('reserves')} className="p-16 bg-white border border-stone-100 rounded-[3.5rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group min-h-[450px] relative overflow-hidden text-left">
              <div className="flex justify-between w-full z-10">
                <div className="p-8 bg-stone-50 rounded-3xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500"><Wallet size={48} /></div>
                <div className="p-5 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all"><ArrowUpRight size={24}/></div>
              </div>
              <div className="mt-12 z-10">
                <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.5em] italic mb-3">Audit Stream</p>
                <h5 className="text-6xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
              <Landmark size={220} className="absolute -left-12 -bottom-12 opacity-[0.02] text-stone-900 pointer-events-none" />
            </button>

            <button onClick={() => setActiveModal('dispatch')} className="p-16 bg-stone-900 text-white rounded-[3.5rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-2xl group relative overflow-hidden text-left active:scale-[0.98] min-h-[450px]">
                <div className="p-8 bg-white/10 rounded-3xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-500"><Send size={48} /></div>
                <div className="mt-12 relative z-10">
                    <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em] mb-3">Outbound Logic</p>
                    <h5 className="text-6xl font-serif italic tracking-tighter">Dispatch Node</h5>
                </div>
                <Mail size={220} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />
            </button>
        </div>

        {/* LEDGER ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[3.5rem] overflow-hidden shadow-sm">
          <div className="p-12 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-10">
            <div className="text-left w-full xl:w-auto">
                <h3 className="text-5xl font-serif italic tracking-tighter">Network Ledger</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mt-2">Historical Operational Stream</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-96 min-w-[300px]">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#a9b897]" size={16} />
                  <input placeholder="Search References..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-stone-50 border border-stone-100 rounded-full text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-300" />
              </div>
              <button className="p-5 bg-stone-900 text-[#a9b897] rounded-full shadow-lg"><Filter size={20}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-stone-50/50">
                <tr>
                  {['Reference', 'Target Entity', 'Directive', 'Status', 'Aggregate Total'].map((h) => (
                    <th key={h} className="px-12 py-8 text-[9px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ledger.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 transition-all cursor-pointer group active:bg-stone-100">
                    <td className="px-12 py-10 font-mono text-[11px] text-[#a9b897] font-black">{inv.id}</td>
                    <td className="px-12 py-10">
                      <p className="font-bold text-xl tracking-tighter text-stone-900">{inv.client}</p>
                      <p className="text-[8px] font-mono text-stone-300 uppercase mt-1 tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-12 py-10"><span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{inv.type}</span></td>
                    <td className="px-12 py-10">
                      <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-300 border-stone-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-12 py-10 text-right pr-24 font-mono font-bold text-2xl tracking-tighter text-stone-900">£{inv.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL ENGINE SYSTEM */}
      <AnimatePresence>
        {/* MODAL 1: DISPATCH NODE */}
        {activeModal === 'dispatch' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/80 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ y: 100, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="bg-white w-full max-w-6xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-14 border-b border-stone-50 pb-10">
                <div className="text-left space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Directive_V6.7</p>
                  <h3 className="text-6xl font-serif italic tracking-tighter">Deploy Directive</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-6 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-12 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4">Target Entity</label>
                    <input placeholder="Entity Name..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full p-8 bg-stone-50 rounded-[2rem] border-none outline-none font-bold text-2xl focus:ring-4 ring-[#a9b897]/10 transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4">Signal Route</label>
                    <input placeholder="entity@node.pulse" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-8 bg-stone-50 rounded-[2rem] border-none outline-none font-bold text-2xl" />
                  </div>
                </div>

                <div className="space-y-4">
                    {lineItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-stone-50/50 p-10 rounded-[2.5rem]">
                            <div className="space-y-1">
                                <p className="font-bold text-2xl">{item.desc}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Unit ID: {item.id}</p>
                            </div>
                            <div className="flex items-center gap-10">
                                <input type="number" value={item.price} onChange={e => setLineItems([{...item, price: Number(e.target.value)}])} className="bg-white px-6 py-4 rounded-2xl outline-none font-mono font-black text-2xl text-right w-48 shadow-sm" />
                                <button className="p-4 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={22}/></button>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-10 border-2 border-dashed border-stone-100 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-4">
                        <Plus size={18}/> Append Unit Directive
                    </button>
                </div>
              </div>

              <div className="p-12 pt-10 border-t border-stone-100 flex flex-col lg:flex-row justify-between items-center gap-12 mt-10">
                <div className="text-center lg:text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-2">Aggregate Total (Inc. Tax)</p>
                    <h4 className="font-mono font-bold tracking-tighter text-7xl">£{grandTotal.toLocaleString()}</h4>
                </div>
                <button onClick={handleDispatch} className="w-full lg:w-auto px-16 py-8 bg-stone-900 text-white rounded-full text-[12px] font-black uppercase tracking-[0.5em] hover:bg-stone-800 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                    Dispatch <Send size={20} className="text-[#a9b897]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 2: LIQUID RESERVES AUDIT */}
        {activeModal === 'reserves' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/85 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, rotate: -1 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} className="bg-stone-50 w-full max-w-5xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden text-left" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-12">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Audit_Stream_v6.7</p>
                        <h3 className="text-5xl font-serif italic tracking-tighter">Liquid Reserves</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-5 bg-white rounded-full hover:bg-stone-900 hover:text-white transition-all shadow-sm active:rotate-90 duration-500"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100">
                        <PieChart size={24} className="text-[#a9b897] mb-6" />
                        <p className="text-[8px] font-black uppercase text-stone-300 tracking-[0.4em] mb-1">Escrowed</p>
                        <p className="text-3xl font-mono font-black tracking-tighter text-stone-900">£12,450.00</p>
                    </div>
                    <div className="bg-stone-900 p-10 rounded-[2.5rem] text-white">
                        <Zap size={24} className="text-[#a9b897] mb-6 animate-pulse" />
                        <p className="text-[8px] font-black uppercase text-stone-500 tracking-[0.4em] mb-1">Fluid Asset</p>
                        <p className="text-3xl font-mono font-black tracking-tighter text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100">
                        <History size={24} className="text-stone-200 mb-6" />
                        <p className="text-[8px] font-black uppercase text-stone-300 tracking-[0.4em] mb-1">Growth Delta</p>
                        <p className="text-3xl font-mono font-black tracking-tighter text-green-500">+12.4%</p>
                    </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[3rem] p-12 space-y-10">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-900">Reserve Snapshot (7D)</h4>
                        <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#a9b897] transition-colors">
                            <Download size={14} /> Full Audit Log
                        </button>
                    </div>
                    <div className="h-48 flex items-end gap-3 px-4">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }} className="flex-1 bg-stone-50 group relative rounded-t-xl overflow-hidden">
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: #a9b897; color: white; }
      `}</style>
    </div>
  );
}