"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, FileText, X, Landmark, ShieldAlert, ChevronRight, 
  Search, Mail, Calendar, Receipt, Calculator, Globe, 
  Upload, UserPlus, Clock, Download, FileSpreadsheet
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

const CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" }
];

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  // Expanded Form State
  const [form, setForm] = useState({ 
    // Common
    contact_id: "",
    entity_name: "",
    date: new Date().toISOString().split("T")[0],
    currency: "GBP",
    lines: [{ description: "", amount: "" }],
    
    // Invoice/Quote Specific
    invoice_number: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    include_vat: false,
    vat_rate: 20,
    recurring: "none",
    bank_details: "",
    thank_you_message: "Thank you for your business!",
    
    // Expense Specific
    receipt_url: "",
    project_id: "",
    
    // Payroll Specific
    employee: {
      full_name: "",
      tax_code: "1257L",
      rate_type: "annual", // hourly or annual
      rate_value: 0,
      hours_worked: 0,
      holiday_entitlement: 28,
      pension_opt_in: true,
      student_loan: false,
      contract_url: ""
    }
  });

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

  const loadDocs = async (tId: string) => {
    setLoading(true);
    const { data } = await supabase.from(type).select("*, contacts(name, email)").eq("team_id", tId).order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const loadContacts = async (tId: string) => {
    const { data } = await supabase.from("contacts").select("*").eq("team_id", tId);
    setContacts(data || []);
  };

  useEffect(() => { init(); }, [init]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: string) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${teamId}/${folder}/${fileName}`;

    const { error } = await supabase.storage.from('finance_assets').upload(filePath, file);
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('finance_assets').getPublicUrl(filePath);
      if (folder === 'receipts') setForm({...form, receipt_url: publicUrl});
      if (folder === 'contracts') setForm({...form, employee: {...form.employee, contract_url: publicUrl}});
    }
    setUploading(false);
  };

  const netTotal = form.lines.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const grossTotal = form.include_vat ? netTotal * (1 + (form.vat_rate / 100)) : netTotal;

  const handleCreate = async () => {
    if (!teamId) return;
    
    // Auto-calculating fields for Self Assessment/End of Year
    const payload = {
      ...form,
      team_id: teamId,
      amount: grossTotal,
      status: type === 'quotes' ? 'draft' : 'committed',
      tax_year: "2025/26", // Mocking current tax year
    };

    const { error } = await supabase.from(type).insert([payload]);
    if (!error) {
        setShowModal(false);
        loadDocs(teamId);
    }
  };

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        
        {/* Header and Search remain consistent with your premium design */}
        <div className="max-w-[1400px] mx-auto flex justify-between items-start mb-16">
          <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">Capital <br /> Ledger</h1>
          <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
            <Plus size={16} /> New {type.replace('_', ' ')}
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto mb-10">
          <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8">
            {["invoices", "quotes", "expenses", "payroll", "self_assessment", "end_of_year"].map((t) => (
              <button key={t} onClick={() => setType(t as DocType)} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-stone-900 text-white' : 'bg-white text-stone-400'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL SYSTEM */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#fcfbf8] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[4rem] p-12 relative shadow-2xl">
                <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-stone-400 hover:text-black"><X size={32}/></button>
                
                <h2 className="text-6xl font-serif italic uppercase mb-12">New {type.replace('_', ' ')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* TYPE: QUOTES & INVOICES */}
                    {(type === "quotes" || type === "invoices") && (
                      <div className="space-y-6">
                        <select className="w-full bg-white p-5 rounded-3xl border border-stone-200" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                          <option value="">Link to Contact</option>
                          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        <div className="space-y-4">
                          {form.lines.map((line, idx) => (
                            <div key={idx} className="flex gap-4">
                              <input className="flex-1 bg-white p-5 rounded-3xl border border-stone-200" placeholder="Item description" value={line.description} onChange={e => {
                                const l = [...form.lines]; l[idx].description = e.target.value; setForm({...form, lines: l});
                              }} />
                              <input className="w-32 bg-white p-5 rounded-3xl border border-stone-200" placeholder="0.00" value={line.amount} onChange={e => {
                                const l = [...form.lines]; l[idx].amount = e.target.value; setForm({...form, lines: l});
                              }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TYPE: EXPENSES */}
                    {type === "expenses" && (
                      <div className="space-y-6">
                        <div className="bg-stone-100 border-2 border-dashed border-stone-300 rounded-[2rem] p-12 text-center relative">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'receipts')} accept=".jpg,.png,.pdf,.xlsx" />
                          <Upload className="mx-auto text-stone-400 mb-4" size={48} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                            {uploading ? "Uploading..." : form.receipt_url ? "Receipt Uploaded ✓" : "Upload Receipt (Image, PDF, Excel)"}
                          </p>
                        </div>
                        <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" placeholder="Expense Category (e.g. Travel, Subsistence)" />
                        <select className="w-full bg-white p-5 rounded-3xl border border-stone-200">
                           <option value="">Assign to Project (Optional)</option>
                        </select>
                      </div>
                    )}

                    {/* TYPE: PAYROLL */}
                    {type === "payroll" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" placeholder="Employee Full Name" />
                          <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" placeholder="Tax Code (e.g. 1257L)" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <select className="bg-white p-5 rounded-3xl border border-stone-200">
                            <option>Annual Salary</option>
                            <option>Hourly Rate</option>
                          </select>
                          <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" placeholder="Rate (£)" />
                        </div>
                        <div className="flex items-center gap-8 p-6 bg-stone-100 rounded-3xl">
                           <label className="text-[9px] font-black uppercase flex items-center gap-2"><Clock size={12}/> Student Loan</label>
                           <input type="checkbox" className="accent-stone-900" />
                           <label className="text-[9px] font-black uppercase flex items-center gap-2">Pension Auto-enroll</label>
                           <input type="checkbox" defaultChecked className="accent-stone-900" />
                        </div>
                        <button className="w-full bg-stone-200 text-stone-600 p-5 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest">
                          <UserPlus size={16}/> Upload Employment Contract
                        </button>
                      </div>
                    )}

                    {/* TYPE: SELF ASSESSMENT & END OF YEAR (Real-time Dash) */}
                    {(type === "self_assessment" || type === "end_of_year") && (
                      <div className="space-y-8">
                        <div className="bg-stone-900 text-white p-10 rounded-[3rem]">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Estimated Tax Liability</p>
                           <h3 className="text-6xl font-serif">£14,230.40</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-8 bg-white border border-stone-200 rounded-[2rem]">
                              <p className="text-[10px] font-black uppercase text-stone-400">Total Turnover</p>
                              <p className="text-2xl font-serif">£84,000.00</p>
                           </div>
                           <div className="p-8 bg-white border border-stone-200 rounded-[2rem]">
                              <p className="text-[10px] font-black uppercase text-stone-400">Allowable Expenses</p>
                              <p className="text-2xl font-serif text-red-500">£12,400.00</p>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <button className="flex-1 bg-stone-200 p-5 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase"><Download size={16}/> PDF Export</button>
                           <button className="flex-1 bg-stone-200 p-5 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase"><FileSpreadsheet size={16}/> Excel Export</button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* SIDEBAR: Totals & Summary */}
                  <div className="bg-stone-100 p-10 rounded-[3rem] space-y-8 h-fit">
                    {type === "invoices" && (
                      <div className="space-y-4 pb-8 border-b border-stone-200">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500">
                          <span>Recurring</span>
                          <select className="bg-transparent border-none text-right outline-none cursor-pointer">
                            <option>None</option>
                            <option>Monthly</option>
                            <option>Weekly</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500">
                          <span>Auto-Reminders</span>
                          <input type="checkbox" className="accent-stone-900" />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Grand Total</p>
                      <p className="text-5xl font-serif italic text-stone-900">£{grossTotal.toLocaleString()}</p>
                    </div>

                    <button onClick={handleCreate} className="w-full bg-stone-900 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all shadow-xl">
                      Authorize Entry
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