"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Landmark, ChevronRight, Search, Upload, 
  Download, FileSpreadsheet, Trash2, Receipt, FileText,
  Calculator, History, TrendingUp, ArrowUpRight, Mail,
  CreditCard, RefreshCcw, Calendar, UserPlus, ClipboardCheck
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ 
    contact_id: "",
    project_id: "",
    entity_name: "",
    date: new Date().toISOString().split("T")[0],
    currency: "GBP",
    lines: [{ description: "", amount: 0, discount: 0 }],
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    quote_number: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
    include_vat: true,
    vat_rate: 20,
    payment_method: "stripe",
    proposal_url: "",
    payroll: {
      fullName: "",
      email: "",
      bankDetails: "",
      nextOfKin: "",
      taxCode: "1257L",
      hoursPerWeek: 40,
      daysPerWeek: 5,
      holidayAllowance: 28,
      holidaysTaken: 0,
      contractUrl: "",
      payslipUrls: [] as string[],
      p45Url: "",
      appraisals: [{ date: "", score: "", notes: "", customFields: {} }]
    }
  });

  // --- Calculations ---
  const totals = useMemo(() => {
    const net = form.lines.reduce((acc, curr) => {
      const lineTotal = (Number(curr.amount) || 0) - (Number(curr.discount) || 0);
      return acc + lineTotal;
    }, 0);
    const tax = form.include_vat ? net * (form.vat_rate / 100) : 0;
    return { net, tax, gross: net + tax };
  }, [form.lines, form.include_vat, form.vat_rate]);

  const hrmcRealtime = useMemo(() => {
    const income = docs.filter(d => d.type === 'invoices').reduce((a, b) => a + (b.amount || 0), 0);
    const costs = docs.filter(d => d.type === 'expenses').reduce((a, b) => a + (b.amount || 0), 0);
    const profit = income - costs;
    return { income, costs, profit, estTax: profit > 12570 ? (profit - 12570) * 0.2 : 0 };
  }, [docs]);

  // --- Data Loading ---
  const loadData = useCallback(async (tId: string) => {
    setLoading(true);
    const [dRes, cRes, pRes] = await Promise.all([
      supabase.from(type).select("*, contacts(name, email), projects(name)").eq("team_id", tId).order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").eq("team_id", tId),
      supabase.from("projects").select("*").eq("team_id", tId)
    ]);
    setDocs(dRes.data || []);
    setContacts(cRes.data || []);
    setProjects(pRes.data || []);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (mem?.team_id) {
        setTeamId(mem.team_id);
        loadData(mem.team_id);
      }
    };
    init();
  }, [loadData]);

  // --- Actions ---
  const handleConvertToInvoice = async (quote: any) => {
    const { error } = await supabase.from("invoices").insert([{
      ...quote,
      id: undefined,
      invoice_number: `INV-${quote.quote_number.split('-')[1]}`,
      created_at: new Date()
    }]);
    if (!error) setType("invoices");
  };

  const handleSave = async () => {
    if (!teamId) return;
    const payload = {
      ...form,
      team_id: teamId,
      amount: totals.gross,
      type: type // identifier for cross-tab logic
    };
    const { error } = await supabase.from(type).insert([payload]);
    if (!error) { setShowModal(false); loadData(teamId); }
  };

  const filteredDocs = docs.filter(d => 
    (d.invoice_number || d.quote_number || d.payroll?.fullName || "")
      .toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        
        {/* Header & Search */}
        <div className="max-w-[1400px] mx-auto mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-6">
            <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter capitalize leading-none">
              {type.replace('_', ' ')}
            </h1>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                <Plus size={16} /> New Record
              </button>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${type}...`} 
                  className="bg-white border-none rounded-[2rem] pl-14 pr-8 py-5 text-[10px] uppercase font-black tracking-widest w-[300px] outline-none shadow-sm"
                />
              </div>
            </div>
          </div>
          
          {/* HRMC Real-time Widget (Only for SA/EOY) */}
          {(type === 'self_assessment' || type === 'end_of_year') && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex gap-12">
               <div>
                 <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Live Profit</p>
                 <p className="text-3xl font-serif italic">£{hrmcRealtime.profit.toLocaleString()}</p>
               </div>
               <div className="text-[#a9b897]">
                 <p className="text-[10px] font-black uppercase opacity-70 mb-1">Est. Liability</p>
                 <p className="text-3xl font-serif italic">£{hrmcRealtime.estTax.toLocaleString()}</p>
               </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1400px] mx-auto mb-10 flex gap-2 overflow-x-auto no-scrollbar">
          {["invoices", "quotes", "expenses", "payroll", "self_assessment", "end_of_year"].map((t) => (
            <button key={t} onClick={() => setType(t as DocType)} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 shadow-sm'}`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* List View */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          {type === 'end_of_year' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-12 rounded-[3rem] shadow-sm">
                <h3 className="text-2xl font-serif italic mb-8 border-b pb-4">Profit & Loss</h3>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between text-stone-500"><span>Gross Turnover</span><span>£{hrmcRealtime.income}</span></div>
                  <div className="flex justify-between text-red-400"><span>Operating Expenses</span><span>-£{hrmcRealtime.costs}</span></div>
                  <div className="flex justify-between text-xl font-serif pt-4 border-t"><span>Net Profit</span><span>£{hrmcRealtime.profit}</span></div>
                </div>
              </div>
              <div className="bg-stone-900 text-white p-12 rounded-[3rem] shadow-sm">
                <h3 className="text-2xl font-serif italic mb-8 border-b border-white/10 pb-4">Balance Sheet</h3>
                <div className="space-y-4 text-sm opacity-80">
                  <div className="flex justify-between"><span>Current Assets (Cash)</span><span>£{hrmcRealtime.income}</span></div>
                  <div className="flex justify-between"><span>Liabilities (Tax Owed)</span><span>£{hrmcRealtime.estTax}</span></div>
                </div>
              </div>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[#a9b897] group-hover:text-white transition-all">
                    {type === 'quotes' ? <FileSpreadsheet size={20}/> : <FileText size={20}/>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase">{doc.invoice_number || doc.quote_number || doc.payroll?.fullName}</p>
                    <h4 className="text-xl font-serif italic">{doc.contacts?.name || doc.projects?.name || "Unassigned"}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {type === 'quotes' && (
                    <button onClick={() => handleConvertToInvoice(doc)} className="p-3 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900" title="Convert to Invoice">
                      <RefreshCcw size={18} />
                    </button>
                  )}
                  <button className="p-3 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900">
                    <Mail size={18} />
                  </button>
                  <div className="text-right min-w-[100px]">
                    <p className="text-xl font-serif">£{doc.amount?.toLocaleString()}</p>
                  </div>
                  <ChevronRight className="text-stone-200" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Heavy Modal for Complex Forms */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#fcfbf8] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-12 relative shadow-2xl">
                <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-stone-300 hover:text-stone-900 transition-colors"><X size={32}/></button>
                
                <header className="mb-12">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">Internal Ledger v2.1</p>
                  <h2 className="text-6xl font-serif italic capitalize">Record {type.replace('_', ' ')}</h2>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-10">
                    
                    {/* Common Fields: Project & Contact */}
                    {(type === 'invoices' || type === 'quotes' || type === 'expenses') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase ml-4 text-stone-400">Client/Contact</label>
                          <select className="w-full bg-white p-5 rounded-3xl border-none shadow-sm" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                            <option value="">Select Contact</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase ml-4 text-stone-400">Project Mapping</label>
                          <select className="w-full bg-white p-5 rounded-3xl border-none shadow-sm" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                            <option value="">Internal / No Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Line Items for Invoices/Quotes */}
                    {(type === 'invoices' || type === 'quotes') && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Line Items & Discounts</h4>
                           <button onClick={() => setForm({...form, lines: [...form.lines, { description: "", amount: 0, discount: 0 }]})} className="text-[#a9b897] flex items-center gap-2 text-[10px] font-black uppercase"><Plus size={14}/> Add Line</button>
                        </div>
                        {form.lines.map((line, idx) => (
                          <div key={idx} className="flex gap-3 bg-white p-2 rounded-[2rem] shadow-sm">
                            <input className="flex-1 bg-transparent px-6 py-3 text-sm outline-none" placeholder="Service description..." value={line.description} onChange={e => {
                                const l = [...form.lines]; l[idx].description = e.target.value; setForm({...form, lines: l});
                            }} />
                            <input className="w-24 bg-stone-50 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="Rate" type="number" onChange={e => {
                                const l = [...form.lines]; l[idx].amount = Number(e.target.value); setForm({...form, lines: l});
                            }} />
                            <input className="w-24 bg-red-50 rounded-2xl px-4 py-3 text-sm outline-none text-red-600" placeholder="Disc" type="number" onChange={e => {
                                const l = [...form.lines]; l[idx].discount = Number(e.target.value); setForm({...form, lines: l});
                            }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payroll Specific Extensions */}
                    {type === 'payroll' && (
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <input className="w-full bg-white p-5 rounded-3xl shadow-sm border-none" placeholder="Employee Full Name" onChange={e => setForm({...form, payroll: {...form.payroll, fullName: e.target.value}})} />
                          <div className="flex gap-4">
                            <input className="flex-1 bg-white p-5 rounded-3xl shadow-sm border-none text-sm" placeholder="Hours/Week" type="number" />
                            <input className="flex-1 bg-white p-5 rounded-3xl shadow-sm border-none text-sm" placeholder="Days/Week" type="number" />
                          </div>
                          <div className="flex gap-4">
                            <input className="flex-1 bg-white p-5 rounded-3xl shadow-sm border-none text-sm" placeholder="Holiday Entitlement" type="number" />
                            <button className="flex-1 bg-[#a9b897] text-white p-5 rounded-3xl text-[10px] font-black uppercase tracking-tighter">Holiday Request</button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-stone-200 rounded-[2.5rem] p-8 text-center bg-white cursor-pointer relative">
                             <Upload size={24} className="mx-auto text-stone-300 mb-2" />
                             <p className="text-[10px] font-black uppercase text-stone-400">Upload Contract / P45</p>
                             <input type="file" className="absolute inset-0 opacity-0" />
                          </div>
                          <button className="w-full bg-stone-900 text-white p-5 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase">
                            <ClipboardCheck size={16}/> Start Appraisal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Sidebar */}
                  <div className="bg-stone-100 p-10 rounded-[3rem] h-fit sticky top-0 space-y-8">
                    <section>
                      <p className="text-[10px] font-black uppercase text-stone-400 mb-6">Financial Overview</p>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-serif">£{totals.net}</span></div>
                        <div className="flex justify-between text-sm text-stone-400"><span>Tax ({form.vat_rate}%)</span><span>£{totals.tax}</span></div>
                        <div className="pt-4 border-t flex justify-between items-end">
                           <span className="text-[10px] font-black uppercase">Total Due</span>
                           <span className="text-4xl font-serif italic text-stone-900">£{totals.gross}</span>
                        </div>
                      </div>
                    </section>

                    {type === 'invoices' && (
                      <div className="pt-6 space-y-4">
                        <button className="w-full py-5 rounded-2xl bg-stone-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                          <CreditCard size={16} /> Enable Stripe Payment
                        </button>
                      </div>
                    )}

                    <button onClick={handleSave} className="w-full py-6 rounded-2xl bg-[#a9b897] text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:shadow-[#a9b897]/30 transition-all">
                      Confirm & File Record
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}