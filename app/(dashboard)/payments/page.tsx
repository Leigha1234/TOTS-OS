"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Landmark, ChevronRight, Search, Upload, 
  Download, FileSpreadsheet, Trash2, Receipt, FileText,
  Calculator, History, TrendingUp, ArrowUpRight
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

  // --- Logic: Dynamic Metrics for Tabs ---
  const getHeaderMetrics = () => {
    const total = docs.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    const count = docs.length;

    switch (type) {
      case "invoices":
        return { label: "Total Receivables", value: `£${total.toLocaleString()}`, sub: `${count} Active Invoices`, trend: "+12%" };
      case "expenses":
        return { label: "Total Outflow", value: `£${total.toLocaleString()}`, sub: `${count} Logged Receipts`, trend: "-5%" };
      case "payroll":
        return { label: "Monthly Liability", value: `£${total.toLocaleString()}`, sub: "Including NI & Pension", trend: "Stable" };
      case "self_assessment":
        return { label: "Estimated Tax", value: `£${(total * 0.2).toLocaleString()}`, sub: "Projected at 20%", trend: "Next: Jan 31" };
      default:
        return { label: "Ledger Volume", value: `£${total.toLocaleString()}`, sub: "Active Records", trend: "Real-time" };
    }
  };

  const metrics = getHeaderMetrics();

  // --- Data Loading ---
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

  // --- Actions ---
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
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry from the ledger?")) return;
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
        
        {/* Adaptive Header Section */}
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
              <Landmark size={14} strokeWidth={3} /> Institutional Treasury
            </p>
            <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">
              {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#a9b897] transition-all flex items-center gap-3"
              >
                <Plus size={16} /> New Entry
              </button>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..." 
                  className="bg-white border-none rounded-[2rem] pl-14 pr-8 py-5 text-[10px] uppercase font-black tracking-widest w-[250px] focus:ring-2 ring-stone-200 transition-all outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* High-Level Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              key={`metric-1-${type}`}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100"
            >
              <p className="text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">{metrics.label}</p>
              <h3 className="text-4xl font-serif italic text-stone-900">{metrics.value}</h3>
              <p className="text-[9px] font-bold text-[#a9b897] mt-4 uppercase tracking-tighter flex items-center gap-2">
                <TrendingUp size={12} /> {metrics.sub}
              </p>
            </motion.div>

            <motion.div 
              key={`metric-2-${type}`}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#a9b897] p-8 rounded-[2.5rem] shadow-sm text-white"
            >
              <div className="flex justify-between items-start mb-4">
                <Calculator size={20} />
                <ArrowUpRight size={20} className="opacity-50" />
              </div>
              <p className="text-[10px] font-black uppercase opacity-70 mb-1 tracking-widest">Growth Factor</p>
              <h3 className="text-2xl font-serif italic">{metrics.trend}</h3>
              <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3" />
              </div>
            </motion.div>
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

        {/* Ledger List */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-stone-400 font-serif italic">Syncing Ledger...</div>
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
                      {doc.invoice_number || `REF-${doc.id.slice(0,4)}`}
                    </p>
                    <h4 className="text-xl font-serif italic text-stone-900">{doc.contacts?.name || doc.payroll?.fullName || "Treasury Record"}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-stone-400">Total</p>
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
               <p className="font-serif italic text-stone-500">No records found for this category.</p>
            </div>
          )}
        </div>

        {/* Modal Entry Form */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#fcfbf8] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 shadow-2xl relative">
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"><X size={28}/></button>
                <h2 className="text-5xl font-serif italic mb-10 capitalize">New {type.replace('_', ' ')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Simplified Switch for forms */}
                    {(type === "invoices" || type === "quotes") && (
                      <div className="space-y-6">
                        <select className="w-full bg-white p-4 rounded-2xl border border-stone-200" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                          <option value="">Select Contact</option>
                          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {form.lines.map((line, idx) => (
                          <div key={idx} className="flex gap-3">
                            <input className="flex-1 bg-white p-4 rounded-2xl border" placeholder="Description" value={line.description} onChange={e => {
                                const l = [...form.lines]; l[idx].description = e.target.value; setForm({...form, lines: l});
                            }} />
                            <input className="w-32 bg-white p-4 rounded-2xl border" placeholder="0.00" value={line.amount} onChange={e => {
                                const l = [...form.lines]; l[idx].amount = e.target.value; setForm({...form, lines: l});
                            }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {type === "expenses" && (
                       <div className="space-y-6">
                         <div className="border-2 border-dashed border-stone-200 rounded-3xl p-10 text-center relative bg-white">
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'receipt')} />
                           <Upload className="mx-auto text-stone-300 mb-2" size={40} />
                           <p className="text-[10px] font-black uppercase text-stone-400">{uploading ? "Uploading..." : "Click to Upload Receipt"}</p>
                         </div>
                         <input className="w-full bg-white p-4 rounded-2xl border" placeholder="Amount" onChange={e => {
                            const l = [...form.lines]; l[0].amount = e.target.value; setForm({...form, lines: l});
                         }} />
                       </div>
                    )}
                  </div>

                  <div className="bg-stone-100 p-8 rounded-[2.5rem] space-y-8 h-fit border border-stone-200/50">
                    <div>
                      <p className="text-[10px] font-black uppercase text-stone-400">Grand Total</p>
                      <h4 className="text-4xl font-serif italic text-stone-900">£{grossTotal.toLocaleString()}</h4>
                    </div>
                    <button 
                      onClick={handleSave} 
                      className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all"
                    >
                      Process Record
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