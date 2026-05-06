"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Building2, Mail, ArrowLeft, ShieldCheck, 
  AlertCircle, Edit3, Trash2, X, Check, Folder, 
  FileText, DollarSign, ListTodo, Clipboard, Receipt, 
  Plus, Send, Inbox, Upload, Bookmark, Loader2 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'tasks' | 'notes' | 'expenses' | 'email'>('info');
  
  // Data lists for the sub-items
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  
  // Sub forms
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", company: "", stage: "", phone: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Form extensions
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
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        setDebugError(error.message);
      } else {
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
    } catch (err: any) {
      setDebugError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllSubcollections() {
    try {
      const { data: invData } = await supabase.from("invoices").select("*").limit(5);
      const { data: quoteData } = await supabase.from("quotes").select("*").limit(5);
      const { data: taskData } = await supabase.from("tasks").select("*").limit(5);
      const { data: noteData } = await supabase.from("notes").select("*").limit(5);
      const { data: expData } = await supabase.from("expenses").select("*").limit(5);
      const { data: projData } = await supabase.from("projects").select("*").limit(5);

      setInvoices(invData || []);
      setQuotes(quoteData || []);
      setTasks(taskData || []);
      setNotes(noteData || []);
      setExpenses(expData || []);
      setProjects(projData || []);
    } catch (err) {
      console.error("Error loading sub-collections", err);
    }
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("customers")
      .update(editForm)
      .eq("id", customer.id);

    if (error) {
      alert(error.message);
    } else {
      setCustomer({ ...customer, ...editForm });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to decommission this node? This action is permanent.")) {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      if (error) alert(error.message);
      else router.push("/crm");
    }
  };

  const handleAddNote = () => {
    if (!noteContent) return;
    setNotes(prev => [{ id: Date.now(), content: noteContent, created_at: new Date().toISOString() }, ...prev]);
    setNoteContent("");
  };

  const handleAddTask = () => {
    if (!taskTitle) return;
    setTasks(prev => [{ id: Date.now(), title: taskTitle, status: 'todo' }, ...prev]);
    setTaskTitle("");
  };

  const handleSendEmail = () => {
    if (!emailSubject || !emailBody) return;
    setIsSendingEmail(true);
    setTimeout(() => {
      setEmails(prev => [{
        id: Date.now(),
        subject: emailSubject,
        body: emailBody,
        sent_at: new Date().toISOString(),
        direction: "outbound"
      }, ...prev]);
      setEmailSubject("");
      setEmailBody("");
      setIsSendingEmail(false);
    }, 1200);
  };

  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (debugError || !customer) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <p className="font-serif italic text-stone-500 text-xl">Record Access Denied</p>
      <Link href="/crm" className="mt-6 text-[#a9b897] uppercase text-[10px] tracking-widest font-black hover:opacity-70 transition-opacity">
        ← Back to Directory
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-16">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* TOP HEADER */}
        <div className="flex justify-between items-center">
          <Link href="/crm" className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] group w-fit transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Directory Access</span>
          </Link>

          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-[#a9b897] transition-all">
                  <Edit3 size={14} /> Edit Node
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={14} /> Decommission
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleUpdate} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-[#a9b897] text-stone-900 rounded-2xl text-[9px] font-black uppercase tracking-widest">
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* CUSTOMER PROFILE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-white w-fit rounded-3xl text-[#a9b897] shadow-sm border border-stone-100">
              <User size={32} />
            </div>
            
            {isEditing ? (
              <input 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="text-6xl font-serif italic tracking-tighter bg-transparent border-b border-[#a9b897] outline-none w-full"
              />
            ) : (
              <h1 className="text-6xl font-serif italic tracking-tighter uppercase">{customer.name}</h1>
            )}

            <div className="flex flex-wrap items-center gap-8 text-stone-400 italic font-serif text-xl">
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-[#a9b897]" />
                  {isEditing ? (
                    <input 
                      value={editForm.company} 
                      onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                      className="bg-transparent border-b border-stone-200 outline-none text-lg"
                    />
                  ) : (
                    <span>{customer.company || "Independent Record"}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-[#a9b897]" />
                  {isEditing ? (
                    <input 
                      value={editForm.email} 
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="bg-transparent border-b border-stone-200 outline-none text-lg"
                    />
                  ) : (
                    <span>{customer.email}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <User size={18} className="text-[#a9b897]" />
                  {isEditing ? (
                    <input 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="bg-transparent border-b border-stone-200 outline-none text-lg"
                      placeholder="Add Phone Number"
                    />
                  ) : (
                    <span>{customer.phone || "No Phone"}</span>
                  )}
                </div>
            </div>
            
            {/* Address Field */}
            {isEditing ? (
              <textarea 
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                className="bg-transparent border border-stone-200 rounded-xl p-4 w-full text-sm font-sans"
                placeholder="Update Address Information"
              />
            ) : (
              customer.address && (
                <p className="text-xs text-stone-500 mt-2 max-w-md bg-white border p-3 rounded-xl border-stone-100">
                  {customer.address}
                </p>
              )
            )}
          </div>

          <div className="p-8 px-10 flex items-center gap-6 shadow-sm border-l-4 border-l-[#a9b897] bg-white">
            <div>
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Neural Status</p>
              {isEditing ? (
                <select 
                  value={editForm.stage}
                  onChange={(e) => setEditForm({...editForm, stage: e.target.value})}
                  className="bg-transparent font-serif italic text-2xl text-[#a9b897] outline-none cursor-pointer"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Elite">Elite</option>
                  <option value="Dormant">Dormant</option>
                </select>
              ) : (
                <p className="font-serif italic text-3xl text-[#a9b897]">{customer.stage || "Active Node"}</p>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-2 text-[10px] uppercase tracking-widest font-black">
          <button 
            onClick={() => setActiveTab('info')} 
            className={`px-6 py-4 rounded-2xl transition-all ${activeTab === 'info' ? 'bg-[#a9b897] text-[#1c1917]' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
          >
            Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('invoices')} 
            className={`px-6 py-4 rounded-2xl transition-all ${activeTab === 'invoices' ? 'bg-[#a9b897] text-[#1c1917]' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
          >
            Invoices & Quotes
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`px-6 py-4 rounded-2xl transition-all ${activeTab === 'tasks' ? 'bg-[#a9b897] text-[#1c1917]' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
          >
            Tasks & Notes
          </button>
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`px-6 py-4 rounded-2xl transition-all ${activeTab === 'expenses' ? 'bg-[#a9b897] text-[#1c1917]' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
          >
            Expenses / Projects
          </button>
          <button 
            onClick={() => setActiveTab('email')} 
            className={`px-6 py-4 rounded-2xl transition-all ${activeTab === 'email' ? 'bg-[#a9b897] text-[#1c1917]' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
          >
            Correspondence
          </button>
        </div>

        {/* TAB CONTENTS */}
        
        {/* 1. INFO TAB */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-10 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-sm md:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4">
                Intelligence Profile
              </h3>
              <div className="space-y-8">
                <div className="group">
                  <label className="text-[9px] text-stone-400 uppercase block mb-1 tracking-[0.2em] font-black">Record Hash</label>
                  <p className="font-mono text-[10px] opacity-40 truncate">{customer.id}</p>
                </div>
                <div className="group">
                  <label className="text-[9px] text-stone-400 uppercase block mb-1 tracking-[0.2em] font-black">Creation Date</label>
                  <p className="font-serif italic text-2xl">
                    {new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
                <div className="group border-t border-stone-50 pt-6">
                  <label className="text-[9px] text-stone-400 uppercase block mb-3 tracking-[0.2em] font-black">Active Audience Lists</label>
                  <div className="flex flex-wrap gap-2">
                    {customer.mailing_list_category ? (
                      customer.mailing_list_category.split(',').map((cat: string) => (
                        <span key={cat} className="text-[10px] tracking-widest font-black bg-[#a9b897]/10 text-[#a9b897] px-4 py-2 rounded-full border border-[#a9b897]/20 uppercase">
                          {cat.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400 italic">No specific audience list attached.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-stone-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6">
                  Document Depot
                </h3>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-3xl p-12 hover:border-[#a9b897] cursor-pointer transition-all bg-stone-50">
                   <Upload size={24} className="text-[#a9b897] mb-2"/>
                   <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 text-center">Upload File / Briefing</span>
                   <input type="file" className="hidden" onChange={(e) => {
                     const fileList = e.target.files;
                     if (fileList && fileList[0]) {
                       setFiles([...files, { name: fileList[0].name, size: fileList[0].size }]);
                     }
                   }} />
                </label>
                
                {/* File List */}
                <div className="space-y-2 mt-6 max-h-48 overflow-y-auto">
                   {files.map((file, i) => (
                     <div key={i} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs text-stone-600 border border-stone-100">
                       <span className="truncate flex items-center gap-2"><Folder size={14} className="text-[#a9b897]" /> {file.name}</span>
                       <button onClick={() => setFiles(files.filter((_, index) => index !== i))} className="text-red-400"><X size={12}/></button>
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 opacity-60 mt-10">
                <ShieldCheck size={24} className="text-[#a9b897]" />
                <p className="font-serif italic text-stone-500 leading-relaxed text-[10px]">
                  Audited system activity. Changes to this profile are recorded.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Invoices</span> <DollarSign size={14} className="text-[#a9b897]"/>
              </h3>
              
              {invoices.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No invoice documents for this client.</p>
              ) : (
                invoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-stone-100 rounded-2xl bg-stone-50">
                    <div>
                      <span className="text-sm font-bold text-stone-800">{inv.title || "Standard Invoice"}</span>
                      <p className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">{inv.created_at}</p>
                    </div>
                    <span className="text-xs font-black text-[#a9b897]">{inv.amount || "$150.00"}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Quotes</span> <Receipt size={14} className="text-[#a9b897]"/>
              </h3>
              
              {quotes.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No quotes found for this client.</p>
              ) : (
                quotes.map((q, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-stone-100 rounded-2xl bg-stone-50">
                    <div>
                      <span className="text-sm font-bold text-stone-800">{q.title || "Contract Proposal"}</span>
                      <p className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">{q.created_at}</p>
                    </div>
                    <span className="text-xs font-black text-[#a9b897]">{q.amount || "$2,500"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. TASKS AND NOTES TAB */}
        {activeTab === 'tasks' && (
          <div className="grid md:grid-cols-2 gap-10">
            {/* TASKS */}
            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Tasks</span> <ListTodo size={14} className="text-[#a9b897]"/>
              </h3>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={taskTitle} 
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Create new task..." 
                  className="w-full text-xs font-sans p-3 border rounded-xl"
                />
                <button onClick={handleAddTask} className="bg-[#a9b897] p-3 rounded-xl text-stone-900"><Plus size={16}/></button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No current tasks.</p>
              ) : (
                tasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-stone-50 border rounded-2xl mb-2 text-xs text-stone-700">
                    <span className="flex items-center gap-3"><Clipboard size={14} className="text-[#a9b897]"/> {t.title || t.content || "Empty task"}</span>
                    <span className="text-[8px] uppercase tracking-widest px-2 py-1 bg-white border rounded">Todo</span>
                  </div>
                ))
              )}
            </div>

            {/* NOTES */}
            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Notes</span> <Bookmark size={14} className="text-[#a9b897]"/>
              </h3>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={noteContent} 
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record an observation/note..." 
                  className="w-full text-xs font-sans p-3 border rounded-xl"
                />
                <button onClick={handleAddNote} className="bg-[#a9b897] p-3 rounded-xl text-stone-900"><Plus size={16}/></button>
              </div>

              {notes.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No notes found.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-4 bg-stone-50 border border-stone-50 rounded-2xl mb-3 text-xs text-stone-600">
                    <p className="italic font-serif">{n.content || n.title}</p>
                    <span className="text-[9px] block text-stone-400 mt-2">{new Date(n.created_at || Date.now()).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. EXPENSES / PROJECTS TAB */}
        {activeTab === 'expenses' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Expense Audits</span> <DollarSign size={14} className="text-[#a9b897]"/>
              </h3>
              
              {expenses.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No records.</p>
              ) : (
                expenses.map((e, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border mb-2 flex justify-between items-center text-xs">
                     <span className="font-bold text-stone-800">{e.title || "External Expense"}</span>
                     <span className="text-[#a9b897] font-black">{e.amount || "$75.00"}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Linked Projects</span> <FileText size={14} className="text-[#a9b897]"/>
              </h3>
              
              {projects.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No active projects linked to this profile.</p>
              ) : (
                projects.map((p, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border mb-2 flex justify-between items-center text-xs">
                     <span className="font-bold text-stone-800">{p.name || "Default Project"}</span>
                     <span className="text-[#a9b897] font-black uppercase tracking-widest text-[9px]">{p.status || "Active"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                  <span>New Correspondence</span> <Send size={14} className="text-[#a9b897]"/>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Project briefing update"
                      className="w-full text-xs font-sans p-4 border border-stone-200 rounded-2xl focus:ring-1 focus:ring-[#a9b897] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-2">Body</label>
                    <textarea 
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write message..."
                      className="w-full text-xs font-sans p-4 border border-stone-200 rounded-2xl focus:ring-1 focus:ring-[#a9b897] outline-none resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleSendEmail} 
                    disabled={isSendingEmail}
                    className="w-full bg-[#a9b897] text-stone-900 py-4 rounded-2xl font-black text-[9px] tracking-[0.3em] uppercase flex justify-center items-center gap-2"
                  >
                    {isSendingEmail ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} Send E-mail
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm max-h-[550px] overflow-y-auto">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4 mb-6 flex justify-between">
                <span>Received/Sent Messages</span> <Inbox size={14} className="text-[#a9b897]"/>
              </h3>

              {emails.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No correspondence records.</p>
              ) : (
                emails.map((email) => (
                  <div key={email.id} className="p-5 bg-stone-50 border rounded-2xl mb-4 text-xs text-stone-700">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wide block mb-1">
                      {email.direction === 'outbound' ? "Sent" : "Received"} • {new Date(email.sent_at).toLocaleTimeString()}
                    </span>
                    <h5 className="font-bold text-stone-900 mb-1">{email.subject}</h5>
                    <p className="italic text-stone-500">{email.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}