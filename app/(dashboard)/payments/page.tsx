"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Search, Trash2, Receipt, FileText, History, Mail, 
  CreditCard, RefreshCcw, Calendar, CheckCircle2, ShieldCheck, 
  ArrowUpRight, Calculator, Landmark, BookOpen, Eye, Image as ImageIcon,
  Send, Scale, AlertCircle, Printer, Download, Settings, Users, 
  Briefcase, Globe, Lock, BarChart3, PieChart, ChevronRight, Copy, Ban, Upload, Link, Check
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "ledger" | "payroll" | "reporting" | "settings";
type DocStatus = "draft" | "sent" | "paid" | "overdue" | "void";
type Frequency = "once" | "weekly" | "monthly" | "annually";

export default function ApexTreasuryEnterprise() {
  const [view, setView] = useState<ViewState>("ledger");
  const [showModal, setShowModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // Mock projects
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENT SETTINGS ---
  const [org, setOrg] = useState({
    logoUrl: "",
    name: "Apex Global Solutions Ltd",
    vatNumber: "GB 987 6543 21",
    bank: { name: "Commercial Bank", acc: "99887766", sort: "10-20-30", iban: "GB29CBANK10203099887766" },
    terms: "Strictly 30 days. Statutory interest applied to late payments under UK Law.",
    saveTermsGlobally: true
  });

  // --- TRANSACTIONAL STATE ---
  const initialForm = {
    type: "invoice",
    contact_id: "",
    project_id: "",
    ref: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    frequency: "once" as Frequency,
    discount: 0,
    tax_rate: 0,
    lines: [{ desc: "", qty: 1, price: 0, vat: 20 }],
    attachments: [] as string[],
    payment_received: 0,
  };

  const [form, setForm] = useState(initialForm);

  // --- CALCULATION ENGINE ---
  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((a, b) => a + (b.qty * b.price), 0);
    const discountVal = subtotal * (form.discount / 100);
    const afterDiscount = subtotal - discountVal;
    
    const vatTotal = form.lines.reduce((a, b) => a + (b.qty * b.price * (b.vat / 100)), 0);
    const extraTax = afterDiscount * (form.tax_rate / 100);
    
    const gross = afterDiscount + vatTotal + extraTax;
    const balanceDue = gross - form.payment_received;

    return { subtotal, discountVal, vatTotal, extraTax, gross, balanceDue };
  }, [form]);

  // --- ACTIONS ---
  const handleCopyLink = () => {
    const link = `https://apex-erp.io/pay/${form.ref}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const duplicateInvoice = (doc: any) => {
    setForm({
      ...doc,
      ref: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      status: "draft"
    });
    setShowModal(true);
  };

  const saveTransaction = async (status: DocStatus = "draft") => {
    setLoading(true);
    const payload = { ...form, status, totals, org_snapshot: org };
    await supabase.from("finance_ledger").insert([payload]);
    setShowModal(false);
    fetchData();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: ledger } = await supabase.from("finance_ledger").select("*, contacts(*)").order("created_at", { ascending: false });
    const { data: clients } = await supabase.from("contacts").select("*");
    setDocs(ledger || []);
    setContacts(clients || []);
    setProjects([{ id: "p1", name: "Alpha Branding" }, { id: "p2", name: "Web App Dev" }]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Page title="Apex Treasury ERP">
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-stone-900">
        
        <nav className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="bg-stone-900 text-white p-2 rounded-lg font-black text-xl italic">A</div>
            <h1 className="font-serif italic text-lg">Treasury Engine</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setForm(initialForm); setShowModal(true); }} className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Plus size={14}/> New Invoice
            </button>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
          {/* LEDGER TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 text-[9px] font-black uppercase text-stone-400 tracking-widest bg-stone-50/50">
                  <th className="p-6">Invoice & Contact</th>
                  <th className="p-6">Project</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Frequency</th>
                  <th className="p-6 text-right">Total</th>
                  <th className="p-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-stone-50 transition-all">
                    <td className="p-6">
                      <p className="text-xs font-bold">{doc.ref}</p>
                      <p className="text-[10px] text-stone-400">{doc.contacts?.name}</p>
                    </td>
                    <td className="p-6 text-[10px] font-bold text-stone-500 uppercase">
                      {projects.find(p => p.id === doc.project_id)?.name || "—"}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                        doc.status === 'paid' ? 'bg-green-50 text-green-600' : 
                        doc.status === 'void' ? 'bg-red-50 text-red-600' : 'bg-stone-100'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-6 text-[10px] text-stone-400 uppercase font-bold">{doc.frequency}</td>
                    <td className="p-6 text-right text-sm font-bold">£{doc.totals?.gross?.toLocaleString()}</td>
                    <td className="p-6">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button title="Duplicate" onClick={() => duplicateInvoice(doc)} className="p-2 hover:bg-stone-100 rounded-lg"><Copy size={14}/></button>
                        <button title="Void" className="p-2 hover:bg-red-50 text-red-400 rounded-lg"><Ban size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* INVOICE MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#fcfbf8] w-full max-w-[1200px] max-h-[95vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col">
                
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif italic text-xl">Draft {form.type}</h2>
                    <div className="flex bg-stone-100 p-1 rounded-lg">
                      <button onClick={() => setPreviewMode(false)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${!previewMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Edit</button>
                      <button onClick={() => setPreviewMode(true)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${previewMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Preview</button>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-100 rounded-full"><X/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-12">
                  {!previewMode ? (
                    <div className="grid grid-cols-12 gap-12">
                      <div className="col-span-8 space-y-8">
                        {/* Core Meta */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-stone-400">Invoice No.</label>
                            <input className="w-full bg-white border border-stone-200 p-3 rounded-xl text-sm" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-stone-400">Contact</label>
                            <select className="w-full bg-white border border-stone-200 p-3 rounded-xl text-sm" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                              <option value="">Select Contact...</option>
                              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-stone-400">Project</label>
                            <select className="w-full bg-white border border-stone-200 p-3 rounded-xl text-sm" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                              <option value="">Select Project...</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white p-6 rounded-2xl border border-stone-100">
                          <div className="grid grid-cols-12 gap-4 mb-2 text-[9px] font-black uppercase text-stone-300">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">VAT %</div>
                          </div>
                          {form.lines.map((l, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 mb-3">
                              <input className="col-span-6 bg-stone-50 p-3 rounded-lg text-sm" placeholder="Service..." value={l.desc} onChange={e => {
                                const nl = [...form.lines]; nl[i].desc = e.target.value; setForm({...form, lines: nl});
                              }} />
                              <input type="number" className="col-span-2 bg-stone-50 p-3 rounded-lg text-sm text-right" value={l.qty} onChange={e => {
                                const nl = [...form.lines]; nl[i].qty = Number(e.target.value); setForm({...form, lines: nl});
                              }} />
                              <input type="number" className="col-span-2 bg-stone-50 p-3 rounded-lg text-sm text-right" value={l.price} onChange={e => {
                                const nl = [...form.lines]; nl[i].price = Number(e.target.value); setForm({...form, lines: nl});
                              }} />
                              <input type="number" className="col-span-2 bg-stone-50 p-3 rounded-lg text-sm text-right" value={l.vat} onChange={e => {
                                const nl = [...form.lines]; nl[i].vat = Number(e.target.value); setForm({...form, lines: nl});
                              }} />
                            </div>
                          ))}
                          <button onClick={() => setForm({...form, lines: [...form.lines, { desc: "", qty: 1, price: 0, vat: 20 }]})} className="text-[10px] font-bold text-stone-400 mt-2">+ Add Line</button>
                        </div>

                        {/* Bank Details & Terms */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="p-5 bg-stone-100/50 rounded-2xl space-y-3">
                              <h4 className="text-[10px] font-black uppercase">Bank Details (Inject into Invoice)</h4>
                              <input className="w-full bg-white border-none p-2 rounded text-xs" placeholder="Bank Name" value={org.bank.name} onChange={e => setOrg({...org, bank: {...org.bank, name: e.target.value}})} />
                              <div className="grid grid-cols-2 gap-2">
                                <input className="bg-white border-none p-2 rounded text-xs" placeholder="Acc No" value={org.bank.acc} onChange={e => setOrg({...org, bank: {...org.bank, acc: e.target.value}})} />
                                <input className="bg-white border-none p-2 rounded text-xs" placeholder="Sort Code" value={org.bank.sort} onChange={e => setOrg({...org, bank: {...org.bank, sort: e.target.value}})} />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-stone-400">Terms & Conditions</label>
                             <textarea className="w-full h-32 bg-white border border-stone-200 p-4 rounded-2xl text-xs" value={org.terms} onChange={e => setOrg({...org, terms: e.target.value})} />
                             <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer">
                               <input type="checkbox" checked={org.saveTermsGlobally} onChange={e => setOrg({...org, saveTermsGlobally: e.target.checked})} className="rounded text-stone-900" />
                               Keep these terms for all future invoices
                             </label>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 space-y-6">
                        {/* Adjustments */}
                        <div className="bg-stone-900 text-white p-8 rounded-[2rem] shadow-xl">
                          <p className="text-[9px] font-black uppercase opacity-50 mb-6 tracking-widest">Financial Controls</p>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">Discount %</span>
                              <input type="number" className="w-16 bg-white/10 border-none rounded p-1 text-right text-xs" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">Additional Tax %</span>
                              <input type="number" className="w-16 bg-white/10 border-none rounded p-1 text-right text-xs" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: Number(e.target.value)})} />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">Payment Received (£)</span>
                              <input type="number" className="w-24 bg-white/10 border-none rounded p-1 text-right text-xs" value={form.payment_received} onChange={e => setForm({...form, payment_received: Number(e.target.value)})} />
                            </div>
                            <div className="flex justify-between items-center border-t border-white/10 pt-4">
                              <span className="text-xs opacity-60">Frequency</span>
                              <select className="bg-white/10 border-none rounded p-1 text-xs" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value as Frequency})}>
                                <option value="once">One-off</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="annually">Annually</option>
                              </select>
                            </div>
                            <hr className="border-white/10" />
                            <div className="pt-2">
                              <p className="text-[9px] font-black opacity-40 uppercase">Total Due</p>
                              <h3 className="text-4xl font-serif italic text-[#a9b897]">£{totals.balanceDue.toLocaleString()}</h3>
                            </div>
                          </div>
                        </div>

                        {/* File Upload & Sharing */}
                        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 space-y-4">
                          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-[10px] font-black uppercase text-stone-400 flex items-center justify-center gap-2 hover:bg-stone-50 transition-all">
                            <Upload size={14}/> Upload Contract/Proposal
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" />
                          
                          <div className="flex gap-2">
                            <button onClick={handleCopyLink} className="flex-1 py-3 bg-stone-100 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                              {copied ? <Check size={14}/> : <Link size={14}/>} {copied ? "Copied" : "Copy Link"}
                            </button>
                            <button className="flex-1 py-3 bg-stone-100 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                              <Download size={14}/> PDF
                            </button>
                          </div>
                          
                          <button onClick={() => saveTransaction("sent")} className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <Mail size={14}/> Post & Email Client
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PREVIEW MODE */
                    <div className="max-w-[800px] mx-auto bg-white p-16 shadow-2xl border border-stone-100">
                       <div className="flex justify-between items-start mb-16">
                          <div>
                            <h2 className="text-2xl font-bold">{org.name}</h2>
                            <p className="text-xs text-stone-400">VAT: {org.vatNumber}</p>
                          </div>
                          <h1 className="text-5xl font-serif italic opacity-20 uppercase">{form.type}</h1>
                       </div>
                       <div className="mb-12">
                         <p className="text-[10px] font-black uppercase text-stone-400">Bill To:</p>
                         <p className="text-lg font-serif">{contacts.find(c => c.id === form.contact_id)?.name || "—"}</p>
                         <p className="text-xs text-stone-500">Project: {projects.find(p => p.id === form.project_id)?.name || "General"}</p>
                       </div>
                       <table className="w-full mb-12">
                         <tr className="border-b-2 border-stone-900 text-[10px] font-black uppercase">
                           <th className="py-2 text-left">Description</th>
                           <th className="py-2 text-right">Total</th>
                         </tr>
                         {form.lines.map((l, i) => (
                           <tr key={i} className="border-b border-stone-100 text-sm">
                             <td className="py-4">{l.desc || "Service Entry"}</td>
                             <td className="py-4 text-right">£{(l.qty * l.price).toLocaleString()}</td>
                           </tr>
                         ))}
                       </table>
                       <div className="flex justify-end mb-16">
                         <div className="w-48 text-right space-y-2">
                           <p className="text-xs">VAT: £{totals.vatTotal.toLocaleString()}</p>
                           <p className="text-xl font-bold">Total: £{totals.gross.toLocaleString()}</p>
                           {form.payment_received > 0 && <p className="text-xs text-green-600">Paid: -£{form.payment_received.toLocaleString()}</p>}
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-100">
                          <div className="text-[10px] font-mono text-stone-500">
                            <p className="font-bold uppercase mb-1">Payment Details</p>
                            <p>{org.bank.name} / {org.bank.acc} / {org.bank.sort}</p>
                          </div>
                          <div className="text-[10px] text-stone-400 italic text-right">
                            {org.terms}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}