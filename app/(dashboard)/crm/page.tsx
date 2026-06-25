"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Plus, Search, User, X, ChevronRight, Loader2, 
  Building2, Mail, Phone, MapPin, Hash, AlertCircle, Radio, Database, Paperclip
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/app/context/SettingsContext"; // 1. Access global state

export default function CRMDirectory() {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);
  const { organisationId } = useSettings(); // 2. Pull the active Org UUID
  const [contacts, setContacts] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedOrganisationId, setResolvedOrganisationId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    company_name: "",
    company_details: "",
    role: "client",
    list_id: "" 
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // 3. Instantly resolve organisation from SettingsContext
  useEffect(() => {
    if (!organisationId) return;
    setResolvedOrganisationId(organisationId);
  }, [organisationId]);
useEffect(() => {
  if (!resolvedOrganisationId) return;
  loadData();
}, [resolvedOrganisationId]);

async function loadData() {
  if (!resolvedOrganisationId) {
    console.warn("loadData blocked: missing organisationId");
    setError("Organisation not loaded. Please refresh or re-login.");
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select()
      .eq("organisation_id", resolvedOrganisationId)
      .order("created_at", { ascending: false });

    if (contactsError) {
      console.error("loadData contactsError:", contactsError);
      throw contactsError;
    }

    setContacts(contacts || []);
  } catch (err: any) {
    console.error("loadData error:", err);
    setError(err.message || "Failed to load contacts.");
  } finally {
    setLoading(false);
  }
}

  async function addcontact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!resolvedOrganisationId) {
      setError("Organisation not ready. Please refresh the page.");
      setSaving(false);
      return;
    }

    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile && resolvedOrganisationId) {
        const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${resolvedOrganisationId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("crm-attachments")
          .upload(path, attachmentFile, { upsert: false });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("crm-attachments")
            .getPublicUrl(path);
          attachmentUrl = publicData?.publicUrl || null;
        } else {
          console.warn("Attachment upload failed:", uploadError.message);
        }
      }

      // 4. Inject organisation_id into the insertion
      const { data: newcontact, error: contactError } = await supabase
        .from("contacts")
        .insert([{
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          website: form.website || null,
          company_name: form.company_name,
          company_details: [
            form.company_details,
            attachmentUrl ? `Attachment: ${attachmentUrl}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
          role: form.role,
          organisation_id: resolvedOrganisationId // Ties the node to TOTS-OS
        }])
        .select()
        .single();

      if (contactError) throw contactError;

      // Handle Campaign Synchronisation
      if (form.list_id && newcontact) {
        const { error: listError } = await supabase
          .from("list_subscribers")
          .insert([{
            list_id: form.list_id,
            contact_id: newcontact.id
          }]);
        
        if (listError) {
          console.warn("Page established, but campaign synchronisation failed:", listError.message);
        }
      }

      setContacts((prev) => [newcontact, ...prev]);
      setForm({ 
        name: "", email: "", phone: "", address: "", 
        website: "", company_name: "", company_details: "", role: "client", list_id: "" 
      });
      setAttachmentFile(null);
      setShowModal(false);
    } catch (err: any) {
      console.error("addcontact error:", err);
      setError(err.message || "An unexpected error occurred during contact creation.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = contacts.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* GLOBAL ERROR TOAST */}
        {error && !showModal && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-black uppercase tracking-widest">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
          <div className="space-y-2">
            
            <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Contacts</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Search ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-xs w-full md:w-64"
              />
            </div>
            <button onClick={() => { setError(null); setShowModal(true); }} className="bg-stone-900 hover:bg-[#a9b897] p-5 rounded-2xl text-white transition-all shadow-xl active:scale-95 flex items-center gap-2">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-stone-100 gap-4">
              <Loader2 className="animate-spin text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Loading Database...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((contact) => (
              <Link 
                href={`/crm/${contact.id}`} 
                key={contact.id}
                className="group relative bg-white border border-stone-100 rounded-[2rem] p-6 flex items-center justify-between hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/10 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 text-stone-400 group-hover:bg-[#a9b897] group-hover:text-white transition-all duration-500 flex items-center justify-center shrink-0 border border-stone-100">
                    <Radio size={24} className={contact.role === 'lead' ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-800 group-hover:text-[#a9b897] transition-colors">{contact.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{contact.company_name }</span>
                      <div className="w-1 h-1 rounded-full bg-stone-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-2 py-0.5 rounded italic">
                        {contact.role === 'client' ? 'Client' : contact.role === 'lead' ? 'Active Lead' : 'Strategic Partner'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-[3rem]">
              <Database size={32} className="mx-auto text-stone-100 mb-4" />
              <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">No Contacts Found</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SECTION */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative z-10 bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-2xl shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif italic text-stone-800">New Contact</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-stone-50 rounded-full transition-colors"><X size={20} /></button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={addcontact} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Full Name</label>
                        <div className="relative"><User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="John Doe" /></div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Email Address</label>
                        <div className="relative"><Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="johndoe@email.com" /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Phone Number</label>
                        <div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="+00..." /></div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Website</label>
                      <div className="relative"><Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="https://example.com" /></div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Type of Contact</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs outline-none appearance-none cursor-pointer">
                            <option value="client">Client</option>
                            <option value="lead">Lead</option>
                            <option value="partner">Partner</option>
                            <option value="member">Team Member</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-stone-100 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Company Details</p>
                    <div className="relative"><Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="Company Name" /></div>
                    <div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none focus:border-[#a9b897]" placeholder="Company Address" /></div>
                    <textarea value={form.company_details} onChange={(e) => setForm({ ...form, company_details: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs outline-none focus:border-[#a9b897] h-20 resize-none" placeholder="Company Overview" />
                    <div className="w-full">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Attachment</label>
                      <label className="mt-1 w-full bg-stone-50 hover:bg-stone-100 text-stone-500 rounded-xl p-4 text-xs font-bold transition-all border border-dashed border-stone-200 flex items-center justify-center gap-2 cursor-pointer">
                        <Paperclip size={14} />
                        {attachmentFile ? attachmentFile.name : "Add Attachment"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Campaign List</label>
                    <div className="relative mt-1"><Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" /><select value={form.list_id} onChange={(e) => setForm({ ...form, list_id: e.target.value })} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 pl-11 text-xs outline-none appearance-none cursor-pointer">
                        <option value="">No Active Campaigns</option>
                        {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select></div>
                </div>

                <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#a9b897] disabled:opacity-40 transition-all mt-6 shadow-xl flex items-center justify-center gap-3">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : "Add Contact"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}