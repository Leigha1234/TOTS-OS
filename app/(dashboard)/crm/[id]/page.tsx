"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Building2, Mail, ArrowLeft, ShieldCheck, 
  AlertCircle, Edit3, Trash2, X, Check, Folder, 
  FileText, DollarSign, ListTodo, Clipboard, Receipt, 
  Plus, Send, Inbox, Upload, Bookmark, Loader2, Phone, MapPin
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'tasks' | 'notes' | 'expenses' | 'email'>('info');
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", company: "", stage: "", phone: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  const [noteContent, setNoteContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAllSubcollections();
  }, [resolvedParams.id]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("customers").select("*").eq("id", resolvedParams.id).single();
      if (error) setDebugError(error.message);
      else {
        setCustomer(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
          company: data.company || "",
          stage: data.stage || "Lead",
          phone: data.phone || "",
          address: data.address || ""
        });
      }
    } catch (err: any) { setDebugError(err.message); }
    finally { setLoading(false); }
  }

  async function fetchAllSubcollections() {
    try {
      const { data: invData } = await supabase.from("invoices").select("*").limit(5);
      const { data: quoteData } = await supabase.from("quotes").select("*").limit(5);
      const { data: taskData } = await supabase.from("tasks").select("*").limit(5);
      const { data: noteData } = await supabase.from("notes").select("*").limit(5);
      setInvoices(invData || []);
      setQuotes(quoteData || []);
      setTasks(taskData || []);
      setNotes(noteData || []);
    } catch (err) { console.error(err); }
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("customers").update(editForm).eq("id", customer.id);
    if (!error) {
      setCustomer({ ...customer, ...editForm });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (confirm("Decommission this node permanently?")) {
      const { error } = await supabase.from("customers").delete().eq("id", customer.id);
      if (!error) router.push("/crm");
    }
  };

  const handleAddTask = () => {
    if (!taskTitle) return;
    setTasks(prev => [{ id: Date.now(), title: taskTitle, status: 'todo' }, ...prev]);
    setTaskTitle("");
  };

  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-16 pb-32">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Link href="/crm" className="flex items-center gap-2 text-stone-400 hover:text-[var(--brand-primary)] group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Directory</span>
          </Link>

          <div className="flex w-full md:w-auto gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-white border border-stone-200 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={handleDelete} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                  <Trash2 size={14} /> Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-white border border-stone-200 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleUpdate} disabled={isSaving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 bg-[var(--brand-primary)] text-white rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-95">
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* CUSTOMER PROFILE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 border-b border-stone-200 pb-8 md:pb-12">
          <div className="space-y-6 flex-1">
            <div className="p-4 bg-white w-fit rounded-2xl md:rounded-3xl text-[var(--brand-primary)] shadow-sm border border-stone-100">
              <User size={32} />
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="text-4xl md:text-6xl font-serif italic tracking-tighter bg-transparent border-b border-[var(--brand-primary)] outline-none w-full"
                />
              ) : (
                <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter uppercase break-words">{customer.name}</h1>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-4 md:gap-8 text-stone-500 italic font-serif text-lg md:text-xl">
                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                  <Building2 size={18} className="text-[var(--brand-primary)] shrink-0" />
                  {isEditing ? (
                    <input value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="bg-transparent border-b border-stone-200 outline-none w-full text-base" />
                  ) : (
                    <span className="truncate">{customer.company || "Independent"}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                  <Mail size={18} className="text-[var(--brand-primary)] shrink-0" />
                  {isEditing ? (
                    <input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="bg-transparent border-b border-stone-200 outline-none w-full text-base" />
                  ) : (
                    <span className="truncate">{customer.email}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                  <Phone size={18} className="text-[var(--brand-primary)] shrink-0" />
                  {isEditing ? (
                    <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="bg-transparent border-b border-stone-200 outline-none w-full text-base" />
                  ) : (
                    <span>{customer.phone || "No Phone"}</span>
                  )}
                </div>
            </div>

            {isEditing ? (
              <textarea 
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                className="bg-white border border-stone-200 rounded-xl p-4 w-full text-sm font-sans min-h-[100px] outline-none focus:border-[var(--brand-primary)]"
                placeholder="Update Address"
              />
            ) : (
              customer.address && (
                <div className="flex gap-2 text-stone-500 bg-white/80 border p-4 rounded-xl border-stone-100 max-w-md">
                   <MapPin size={16} className="text-[var(--brand-primary)] shrink-0" />
                   <p className="text-xs leading-relaxed">{customer.address}</p>
                </div>
              )
            )}
          </div>

          {/* NEURAL STATUS BOX */}
          <div className="p-6 md:p-8 px-10 flex flex-col justify-center gap-2 shadow-sm border-l-4 border-l-[var(--brand-primary)] bg-white rounded-r-2xl lg:min-w-[240px]">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Neural Status</p>
              {isEditing ? (
                <select 
                  value={editForm.stage}
                  onChange={(e) => setEditForm({...editForm, stage: e.target.value})}
                  className="bg-transparent font-serif italic text-2xl text-[var(--brand-primary)] outline-none cursor-pointer w-full"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Elite">Elite</option>
                </select>
              ) : (
                <p className="font-serif italic text-3xl text-[var(--brand-primary)]">{customer.stage || "Active Node"}</p>
              )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
          {[
            { id: 'info', label: 'Info' },
            { id: 'invoices', label: 'Finance' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'expenses', label: 'Projects' },
            { id: 'email', label: 'Mail' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-[var(--brand-primary)] text-white' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 md:p-10 space-y-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm lg:col-span-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4">Profile Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-black">Record ID</label>
                    <p className="font-mono text-[10px] break-all opacity-40">{customer.id}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-black">Activation Date</label>
                    <p className="font-serif italic text-2xl">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="md:col-span-2 pt-6 border-t border-stone-50">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-black mb-3 block">Segments</label>
                    <div className="flex flex-wrap gap-2">
                      {customer.mailing_list_category?.split(',').map((cat: string) => (
                        <span key={cat} className="text-[9px] font-black bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-4 py-2 rounded-full border border-[var(--brand-primary)]/20 uppercase">
                          {cat.trim()}
                        </span>
                      )) || <span className="text-xs italic text-stone-400">Default Segment</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 rounded-[2rem] md:rounded-[3rem] p-8 text-white flex flex-col justify-between">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 border-b border-stone-800 pb-4 mb-6">Vault</h3>
                   <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-700 rounded-2xl p-8 hover:border-[var(--brand-primary)] cursor-pointer transition-all bg-stone-800/30">
                      <Upload size={20} className="text-[var(--brand-primary)] mb-2"/>
                      <span className="text-[10px] font-black uppercase text-stone-400">Secure Upload</span>
                      <input type="file" className="hidden" />
                   </label>
                </div>
                <div className="mt-8 flex items-center gap-4 text-[var(--brand-primary)] opacity-60">
                   <ShieldCheck size={20}/>
                   <p className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Active Tasks</h3>
                   <ListTodo size={14} className="text-[var(--brand-primary)]"/>
                </div>
                <div className="flex gap-2 mb-6">
                  <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Assign task..." className="flex-1 text-xs p-3 border rounded-xl bg-stone-50 outline-none focus:ring-1 focus:ring-[var(--brand-primary)]" />
                  <button onClick={handleAddTask} className="bg-[var(--brand-primary)] text-white p-3 rounded-xl active:scale-90 transition-all hover:brightness-95"><Plus size={16}/></button>
                </div>
                <div className="space-y-2">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs">
                      <span className="font-serif italic">{t.title}</span>
                      <span className="text-[8px] bg-white px-2 py-1 rounded border uppercase">Todo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <div className="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6">Dispatch Correspondence</h3>
                  <div className="space-y-4">
                    <input placeholder="Subject" className="w-full text-xs p-4 border border-stone-100 rounded-xl bg-stone-50 outline-none focus:border-[var(--brand-primary)]" />
                    <textarea rows={5} placeholder="Body" className="w-full text-xs p-4 border border-stone-100 rounded-xl bg-stone-50 outline-none resize-none focus:border-[var(--brand-primary)]" />
                    <button className="w-full bg-[var(--brand-primary)] text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex justify-center items-center gap-2 hover:brightness-95">
                      <Send size={14}/> Transmit
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-10 bg-[#1c1917] rounded-[2rem] md:rounded-[3rem] text-stone-400 overflow-y-auto max-h-[500px]">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600 mb-6">Archive</h3>
                   <p className="text-xs italic font-serif text-center py-20">No archived correspondence for this node.</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}