"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Landmark, ChevronRight, Search, Upload, 
  Download, FileSpreadsheet, Trash2, Receipt, FileText,
  Calculator, History
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ 
    contact_id: "",
    entity_name: "",
    date: new Date().toISOString().split("T")[0],
    currency: "GBP",
    lines: [{ description: "", amount: "" }],
    invoice_number: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    include_vat: false,
    vat_rate: 20,
    recurring: "none",
    bank_details: "",
    thank_you_message: "Thank you for your business!",
    receipt_url: "",
    payroll: {
      fullName: "",
      taxCode: "1257L",
      rateType: "annual", 
      rateValue: "",
      hours: "",
      holiday: "28",
      pension: true,
      studentLoan: false,
      contractUrl: ""
    }
  });

  const loadDocs = async (tId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from(type)
      .select("*, contacts(name, email)")
      .eq("team_id", tId)
      .order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const loadContacts = async (tId: string) => {
    const { data } = await supabase.from("contacts").select("*").eq("team_id", tId);
    setContacts(data || []);
  };

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      loadDocs(mem.team_id);
      loadContacts(mem.team_id);
    }
  }, [type]);

  useEffect(() => { init(); }, [init]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'receipt' | 'contract') => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;
    setUploading(true);
    const path = `${teamId}/${field}s/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('finance').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('finance').getPublicUrl(path);
      if (field === 'receipt') setForm(f => ({ ...f, receipt_url: data.publicUrl }));
      else setForm(f => ({ ...f, payroll: { ...f.payroll, contractUrl: data.publicUrl }}));
    }
    setUploading(false);
  };

  const netTotal = form.lines.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const grossTotal = form.include_vat ? netTotal * (1 + (form.vat_rate / 100)) : netTotal;

  const handleSave = async () => {
    if (!teamId) return;
    const payload = {
      ...form,
      team_id: teamId,
      amount: type === 'payroll' ? (parseFloat(form.payroll.rateValue) || 0) : grossTotal,
      metadata: { ...form }
    };
    const { error } = await supabase.from(type).insert([payload]);
    if (!error) { 
      setShowModal(false); 
      loadDocs(teamId); 
    } else {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from(type).delete().eq("id", id);
    if (!error && teamId) loadDocs(teamId);
  };

  const filteredDocs = docs.filter(d => 
    d.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        {/* Header Section */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-end gap-12 mb-16">
          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
              <Landmark size={14} strokeWidth={3} /> Institutional Treasury
            </p>
            <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">
              Capital <br /> Ledger
            </h1>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-stone-700 transition-all flex items-center gap-3">
                <Plus size={16} /> New {type.replace('_', ' ')}
              </button>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search ledger..." 
                  className="bg-white border-none rounded-[2rem] pl-14 pr-8 py-5 text-[10px] uppercase font-black tracking-widest w-[300px] focus:ring-2 ring-stone-200 transition-all outline-none shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-[1400px] mx-auto mb-10">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
            {["invoices", "quotes", "expenses", "payroll", "self_assessment", "end_of_year"].map((t) => (
              <button 
                key={t} 
                onClick={() => setType(t as DocType)} 
                className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${type === t ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900 shadow-sm'}`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger List View */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-stone-400 font-serif italic">Accessing Archives...</div>
          ) : filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={doc.id} 
                className="bg-white p-6 rounded-[2rem] flex items-center justify-between hover:shadow-md transition-all group border border-stone-100"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[#a9b897] group-hover:text-white transition-colors">
                    {type === 'expenses' ? <Receipt size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-tighter">
                      {doc.invoice_number || doc.created_at.split('T')[0]}
                    </p>
                    <h4 className="text-xl font-serif italic text-stone-900">{doc.contacts?.name || doc.payroll?.fullName || "Internal Record"}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-stone-400">Amount</p>
                    <p className="text-xl font-serif">£{(doc.amount || 0).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-stone-300" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-stone-200/50 rounded-[3rem] border-2 border-dashed border-stone-300 p-20 text-center">
               <History className="mx-auto text-stone-400 mb-4" size={48} />
               <p className="font-serif italic text-stone-500">No records found in this ledger category.</p>
            </div>
          )}
        </div>

        {/* Modal Logic */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#fcfbf8] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 shadow-2xl relative">
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"><X size={28}/></button>
                
                <h2 className="text-5xl font-serif italic mb-10">New {type.replace('_', ' ')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* INVOICES & QUOTES */}
                    {(type === "invoices" || type === "quotes") && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <select className="w-full bg-white p-4 rounded-2xl border border-stone-200 outline-none" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                            <option value="">Select Contact</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input className="w-full bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Reference Number" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} />
                        </div>
                        
                        <div className="space-y-3">
                          {form.lines.map((line, idx) => (
                            <div key={idx} className="flex gap-3">
                              <input className="flex-1 bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Description" value={line.description} onChange={e => {
                                const l = [...form.lines]; l[idx].description = e.target.value; setForm({...form, lines: l});
                              }} />
                              <input className="w-32 bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="0.00" value={line.amount} onChange={e => {
                                const l = [...form.lines]; l[idx].amount = e.target.value; setForm({...form, lines: l});
                              }} />
                              {idx === form.lines.length - 1 && (
                                <button onClick={() => setForm({...form, lines: [...form.lines, {description: "", amount: ""}]})} className="p-4 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-colors"><Plus size={16}/></button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <textarea className="w-full bg-white p-4 rounded-2xl border border-stone-200 text-sm outline-none h-24" placeholder="Bank Details" value={form.bank_details} onChange={e => setForm({...form, bank_details: e.target.value})} />
                          <input className="w-full bg-white p-4 rounded-2xl border border-stone-200 text-sm outline-none" placeholder="Thank You Message" value={form.thank_you_message} onChange={e => setForm({...form, thank_you_message: e.target.value})} />
                        </div>
                      </div>
                    )}

                    {/* EXPENSES */}
                    {type === "expenses" && (
                      <div className="space-y-6">
                        <div className="border-2 border-dashed border-stone-200 rounded-3xl p-10 text-center relative hover:border-stone-400 transition-all bg-white">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'receipt')} />
                          <Upload className="mx-auto text-stone-300 mb-2" size={40} />
                          <p className="text-[10px] font-black uppercase text-stone-400">{uploading ? "Uploading..." : form.receipt_url ? "File Attached" : "Upload Receipt"}</p>
                        </div>
                        <input className="w-full bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Expense Description" onChange={e => {
                           const l = [...form.lines]; l[0].description = e.target.value; setForm({...form, lines: l});
                        }} />
                        <input className="w-full bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Amount" onChange={e => {
                           const l = [...form.lines]; l[0].amount = e.target.value; setForm({...form, lines: l});
                        }} />
                      </div>
                    )}

                    {/* PAYROLL */}
                    {type === "payroll" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input className="bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Employee Name" onChange={e => setForm({...form, payroll: {...form.payroll, fullName: e.target.value}})} />
                          <input className="bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Tax Code" value={form.payroll.taxCode} onChange={e => setForm({...form, payroll: {...form.payroll, taxCode: e.target.value}})} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <input className="bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Annual Rate" onChange={e => setForm({...form, payroll: {...form.payroll, rateValue: e.target.value}})} />
                          <input className="bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Hours Worked" />
                          <input className="bg-white p-4 rounded-2xl border border-stone-200 outline-none" placeholder="Holiday (Days)" value={form.payroll.holiday} />
                        </div>
                        <div className="flex gap-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                          <label className="text-[10px] font-black uppercase flex items-center gap-2"><input type="checkbox" checked={form.payroll.pension} onChange={e => setForm({...form, payroll: {...form.payroll, pension: e.target.checked}})} /> Pension</label>
                          <label className="text-[10px] font-black uppercase flex items-center gap-2"><input type="checkbox" checked={form.payroll.studentLoan} onChange={e => setForm({...form, payroll: {...form.payroll, studentLoan: e.target.checked}})} /> Student Loan</label>
                        </div>
                      </div>
                    )}

                    {/* TAX ESTIMATES */}
                    {(type === "self_assessment" || type === "end_of_year") && (
                      <div className="space-y-6">
                        <div className="bg-stone-900 text-white p-8 rounded-[2rem] flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Projected Liability</p>
                            <h3 className="text-5xl font-serif italic">£4,231.00</h3>
                          </div>
                          <div className="flex gap-2">
                             <button className="p-3 bg-white/10 rounded-full hover:bg-white/20"><Download size={18}/></button>
                             <button className="p-3 bg-white/10 rounded-full hover:bg-white/20"><FileSpreadsheet size={18}/></button>
                          </div>
                        </div>
                        <p className="text-sm text-stone-500 italic">This calculation is based on current ledger turnover and allowable expenses recorded in this team.</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar / Totals */}
                  <div className="bg-stone-100 p-8 rounded-[2.5rem] space-y-8 h-fit border border-stone-200/50">
                    <div className="space-y-4">
                      {type === "invoices" && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-stone-400">Repeat</span>
                            <select className="text-xs bg-transparent font-bold outline-none" value={form.recurring} onChange={e => setForm({...form, recurring: e.target.value})}>
                              <option value="none">One-off</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-stone-400">VAT (20%)</span>
                            <input type="checkbox" checked={form.include_vat} onChange={e => setForm({...form, include_vat: e.target.checked})} className="accent-stone-900" />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-6 border-t border-stone-200">
                      <p className="text-[10px] font-black uppercase text-stone-400">Total Calculation</p>
                      <h4 className="text-4xl font-serif italic text-stone-900">£{type === 'payroll' ? (parseFloat(form.payroll.rateValue) || 0).toLocaleString() : grossTotal.toLocaleString()}</h4>
                    </div>

                    <button 
                      onClick={handleSave} 
                      disabled={uploading}
                      className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all shadow-lg disabled:opacity-50"
                    >
                      {uploading ? "Processing..." : "Confirm Allocation"}
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